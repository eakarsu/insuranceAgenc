import {
  prisma,
  clearTestData,
  createTestUser,
  createTestClient,
  createTestCarrier,
  createTestPolicy,
  createTestClaim,
} from '../helpers/db';

describe('Claims Integration Tests', () => {
  let testUser: any;
  let testClient: any;
  let testCarrier: any;
  let testPolicy: any;

  beforeAll(async () => {
    await clearTestData();
    testUser = await createTestUser();
    testClient = await createTestClient(testUser.id);
    testCarrier = await createTestCarrier();
    testPolicy = await createTestPolicy(testClient.id, testCarrier.id, testUser.id);
  });

  afterAll(async () => {
    await clearTestData();
    await prisma.$disconnect();
  });

  describe('Claim CRUD Operations', () => {
    it('should create a new claim', async () => {
      const claim = await prisma.claim.create({
        data: {
          clientId: testClient.id,
          policyId: testPolicy.id,
          agentId: testUser.id,
          claimNumber: `CLM-001-${Date.now()}`,
          type: 'AUTO',
          status: 'REPORTED',
          dateOfLoss: new Date(),
          description: 'Vehicle collision',
        },
      });

      expect(claim).toBeDefined();
      expect(claim.claimNumber).toContain('CLM-001');
      expect(claim.type).toBe('AUTO');
      expect(claim.status).toBe('REPORTED');
    });

    it('should read a claim with relations', async () => {
      const created = await createTestClaim(testClient.id, testPolicy.id, testUser.id);

      const claim = await prisma.claim.findUnique({
        where: { id: created.id },
        include: {
          client: true,
          policy: true,
        },
      });

      expect(claim).toBeDefined();
      expect(claim?.client.firstName).toBe('John');
      expect(claim?.policy.policyNumber).toContain('POL-TEST');
    });

    it('should update claim status', async () => {
      const claim = await createTestClaim(testClient.id, testPolicy.id, testUser.id);

      const updated = await prisma.claim.update({
        where: { id: claim.id },
        data: { status: 'UNDER_INVESTIGATION' },
      });

      expect(updated.status).toBe('UNDER_INVESTIGATION');
    });

    it('should update claim with financial details', async () => {
      const claim = await createTestClaim(testClient.id, testPolicy.id, testUser.id);

      const updated = await prisma.claim.update({
        where: { id: claim.id },
        data: {
          reserveAmount: 5000,
          paidAmount: 2500,
          status: 'IN_REVIEW',
        },
      });

      expect(Number(updated.reserveAmount)).toBe(5000);
      expect(Number(updated.paidAmount)).toBe(2500);
    });

    it('should close a claim', async () => {
      const claim = await createTestClaim(testClient.id, testPolicy.id, testUser.id);

      const closed = await prisma.claim.update({
        where: { id: claim.id },
        data: {
          status: 'CLOSED',
          closedAt: new Date(),
        },
      });

      expect(closed.status).toBe('CLOSED');
      expect(closed.closedAt).toBeDefined();
    });

    it('should list reported claims', async () => {
      await createTestClaim(testClient.id, testPolicy.id, testUser.id);

      const reportedClaims = await prisma.claim.findMany({
        where: { status: 'REPORTED' },
      });

      expect(reportedClaims.length).toBeGreaterThan(0);
      expect(reportedClaims.every(c => c.status === 'REPORTED')).toBe(true);
    });

    it('should filter claims by type', async () => {
      await prisma.claim.create({
        data: {
          clientId: testClient.id,
          policyId: testPolicy.id,
          agentId: testUser.id,
          claimNumber: `CLM-PROPERTY-${Date.now()}`,
          type: 'PROPERTY',
          status: 'REPORTED',
          dateOfLoss: new Date(),
          description: 'Water damage',
        },
      });

      const propertyClaims = await prisma.claim.findMany({
        where: { type: 'PROPERTY' },
      });

      expect(propertyClaims.length).toBeGreaterThan(0);
      expect(propertyClaims.every(c => c.type === 'PROPERTY')).toBe(true);
    });

    it('should delete a claim', async () => {
      const claim = await prisma.claim.create({
        data: {
          clientId: testClient.id,
          policyId: testPolicy.id,
          agentId: testUser.id,
          claimNumber: `CLM-DELETE-${Date.now()}`,
          type: 'AUTO',
          status: 'CLOSED',
          dateOfLoss: new Date(),
          description: 'To be deleted',
        },
      });

      await prisma.claim.delete({ where: { id: claim.id } });

      const deleted = await prisma.claim.findUnique({
        where: { id: claim.id },
      });

      expect(deleted).toBeNull();
    });

    it('should count claims by status', async () => {
      const counts = await prisma.claim.groupBy({
        by: ['status'],
        _count: { status: true },
      });

      expect(counts).toBeDefined();
      expect(Array.isArray(counts)).toBe(true);
    });
  });
});
