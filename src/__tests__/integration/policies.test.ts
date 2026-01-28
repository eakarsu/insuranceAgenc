import {
  prisma,
  clearTestData,
  createTestUser,
  createTestClient,
  createTestCarrier,
  createTestPolicy,
} from '../helpers/db';

describe('Policies Integration Tests', () => {
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

  describe('Policy CRUD Operations', () => {
    it('should create a new policy', async () => {
      const policy = await prisma.policy.create({
        data: {
          clientId: testClient.id,
          carrierId: testCarrier.id,
          agentId: testUser.id,
          policyNumber: `POL-001-${Date.now()}`,
          lineOfBusiness: 'PERSONAL_AUTO',
          type: 'Personal Auto',
          status: 'ACTIVE',
          premium: 1200,
          effectiveDate: new Date(),
          expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
      });

      expect(policy).toBeDefined();
      expect(policy.policyNumber).toContain('POL-001');
      expect(policy.status).toBe('ACTIVE');
    });

    it('should read a policy with relations', async () => {
      const created = await createTestPolicy(testClient.id, testCarrier.id, testUser.id);

      const policy = await prisma.policy.findUnique({
        where: { id: created.id },
        include: {
          client: true,
          carrier: true,
        },
      });

      expect(policy).toBeDefined();
      expect(policy?.client.firstName).toBe('John');
      expect(policy?.carrier.name).toBe('Test Insurance Co');
    });

    it('should update policy status', async () => {
      const policy = await createTestPolicy(testClient.id, testCarrier.id, testUser.id);

      const updated = await prisma.policy.update({
        where: { id: policy.id },
        data: { status: 'CANCELLED' },
      });

      expect(updated.status).toBe('CANCELLED');
    });

    it('should renew a policy', async () => {
      const policy = await createTestPolicy(testClient.id, testCarrier.id, testUser.id);

      const renewed = await prisma.policy.update({
        where: { id: policy.id },
        data: {
          status: 'ACTIVE',
          effectiveDate: new Date(),
          expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          premium: 1300,
        },
      });

      expect(renewed.status).toBe('ACTIVE');
      expect(Number(renewed.premium)).toBe(1300);
    });

    it('should find policies expiring soon', async () => {
      // Create a policy expiring in 30 days
      const expiringDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      await prisma.policy.create({
        data: {
          clientId: testClient.id,
          carrierId: testCarrier.id,
          agentId: testUser.id,
          policyNumber: `POL-EXPIRING-${Date.now()}`,
          lineOfBusiness: 'HOMEOWNERS',
          type: 'Homeowners',
          status: 'ACTIVE',
          premium: 1000,
          effectiveDate: new Date(Date.now() - 335 * 24 * 60 * 60 * 1000),
          expirationDate: expiringDate,
        },
      });

      const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      const expiringPolicies = await prisma.policy.findMany({
        where: {
          status: 'ACTIVE',
          expirationDate: { lte: thirtyDaysFromNow },
        },
      });

      expect(expiringPolicies.length).toBeGreaterThan(0);
    });

    it('should list active policies', async () => {
      await createTestPolicy(testClient.id, testCarrier.id, testUser.id);

      const activePolicies = await prisma.policy.findMany({
        where: { status: 'ACTIVE' },
      });

      expect(activePolicies.length).toBeGreaterThan(0);
      expect(activePolicies.every(p => p.status === 'ACTIVE')).toBe(true);
    });

    it('should delete a policy', async () => {
      const policy = await prisma.policy.create({
        data: {
          clientId: testClient.id,
          carrierId: testCarrier.id,
          agentId: testUser.id,
          policyNumber: `POL-DELETE-${Date.now()}`,
          lineOfBusiness: 'UMBRELLA',
          type: 'Umbrella',
          status: 'CANCELLED',
          premium: 500,
          effectiveDate: new Date(),
          expirationDate: new Date(),
        },
      });

      await prisma.policy.delete({ where: { id: policy.id } });

      const deleted = await prisma.policy.findUnique({
        where: { id: policy.id },
      });

      expect(deleted).toBeNull();
    });
  });
});
