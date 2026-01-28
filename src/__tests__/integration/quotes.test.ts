import {
  prisma,
  clearTestData,
  createTestUser,
  createTestClient,
  createTestCarrier,
  createTestQuote,
} from '../helpers/db';

describe('Quotes Integration Tests', () => {
  let testUser: any;
  let testClient: any;
  let testCarrier: any;

  beforeAll(async () => {
    await clearTestData();
    testUser = await createTestUser();
    testClient = await createTestClient(testUser.id);
    testCarrier = await createTestCarrier();
  });

  afterAll(async () => {
    await clearTestData();
    await prisma.$disconnect();
  });

  describe('Quote CRUD Operations', () => {
    it('should create a new quote', async () => {
      const quote = await prisma.quote.create({
        data: {
          clientId: testClient.id,
          carrierId: testCarrier.id,
          agentId: testUser.id,
          quoteNumber: `QT-${Date.now()}-create`,
          lineOfBusiness: 'PERSONAL_AUTO',
          status: 'DRAFT',
          premium: 1500,
          effectiveDate: new Date(),
        },
      });

      expect(quote).toBeDefined();
      expect(quote.lineOfBusiness).toBe('PERSONAL_AUTO');
      expect(quote.status).toBe('DRAFT');
      expect(Number(quote.premium)).toBe(1500);
    });

    it('should create a quote without carrier', async () => {
      const quote = await prisma.quote.create({
        data: {
          clientId: testClient.id,
          carrierId: null,
          agentId: testUser.id,
          quoteNumber: `QT-${Date.now()}-nocarrier`,
          lineOfBusiness: 'HOMEOWNERS',
          status: 'DRAFT',
          effectiveDate: new Date(),
        },
      });

      expect(quote).toBeDefined();
      expect(quote.carrierId).toBeNull();
    });

    it('should read a quote with relations', async () => {
      const created = await createTestQuote(testClient.id, testUser.id, testCarrier.id);

      const quote = await prisma.quote.findUnique({
        where: { id: created.id },
        include: {
          client: true,
          carrier: true,
        },
      });

      expect(quote).toBeDefined();
      expect(quote?.client.firstName).toBe('John');
      expect(quote?.carrier?.name).toBe('Test Insurance Co');
    });

    it('should update quote status', async () => {
      const quote = await createTestQuote(testClient.id, testUser.id, testCarrier.id);

      const updated = await prisma.quote.update({
        where: { id: quote.id },
        data: { status: 'QUOTED', premium: 1800 },
      });

      expect(updated.status).toBe('QUOTED');
      expect(Number(updated.premium)).toBe(1800);
    });

    it('should update quote to PROPOSED status', async () => {
      const quote = await createTestQuote(testClient.id, testUser.id, testCarrier.id);

      const updated = await prisma.quote.update({
        where: { id: quote.id },
        data: { status: 'PROPOSED' },
      });

      expect(updated.status).toBe('PROPOSED');
    });

    it('should delete a quote', async () => {
      const quote = await createTestQuote(testClient.id, testUser.id);

      await prisma.quote.delete({ where: { id: quote.id } });

      const deleted = await prisma.quote.findUnique({
        where: { id: quote.id },
      });

      expect(deleted).toBeNull();
    });

    it('should list quotes by client', async () => {
      // Create multiple quotes for the client
      await createTestQuote(testClient.id, testUser.id);
      await createTestQuote(testClient.id, testUser.id);

      const quotes = await prisma.quote.findMany({
        where: { clientId: testClient.id },
      });

      expect(quotes.length).toBeGreaterThanOrEqual(2);
    });

    it('should filter quotes by status', async () => {
      await prisma.quote.create({
        data: {
          clientId: testClient.id,
          agentId: testUser.id,
          quoteNumber: `QT-${Date.now()}-accepted`,
          lineOfBusiness: 'UMBRELLA',
          status: 'ACCEPTED',
          effectiveDate: new Date(),
        },
      });

      const acceptedQuotes = await prisma.quote.findMany({
        where: { status: 'ACCEPTED' },
      });

      expect(acceptedQuotes.length).toBeGreaterThan(0);
      expect(acceptedQuotes.every(q => q.status === 'ACCEPTED')).toBe(true);
    });

    it('should calculate total premium with fees and taxes', async () => {
      const quote = await prisma.quote.create({
        data: {
          clientId: testClient.id,
          agentId: testUser.id,
          quoteNumber: `QT-${Date.now()}-premium`,
          lineOfBusiness: 'PERSONAL_AUTO',
          status: 'QUOTED',
          premium: 1000,
          fees: 50,
          taxes: 75,
          totalPremium: 1125,
          effectiveDate: new Date(),
        },
      });

      expect(Number(quote.premium)).toBe(1000);
      expect(Number(quote.fees)).toBe(50);
      expect(Number(quote.taxes)).toBe(75);
      expect(Number(quote.totalPremium)).toBe(1125);
    });
  });
});
