import {
  prisma,
  clearTestData,
  createTestUser,
  createTestClient,
} from '../helpers/db';

describe('Clients Integration Tests', () => {
  let testUser: any;

  beforeAll(async () => {
    await clearTestData();
    testUser = await createTestUser();
  });

  afterAll(async () => {
    await clearTestData();
    await prisma.$disconnect();
  });

  describe('Client CRUD Operations', () => {
    it('should create a new client', async () => {
      const client = await prisma.client.create({
        data: {
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane.smith@example.com',
          phone: '555-5678',
          type: 'PERSONAL',
          status: 'PROSPECT',
          agentId: testUser.id,
        },
      });

      expect(client).toBeDefined();
      expect(client.firstName).toBe('Jane');
      expect(client.lastName).toBe('Smith');
      expect(client.email).toBe('jane.smith@example.com');
      expect(client.status).toBe('PROSPECT');
    });

    it('should read a client by ID', async () => {
      const created = await createTestClient(testUser.id);

      const client = await prisma.client.findUnique({
        where: { id: created.id },
      });

      expect(client).toBeDefined();
      expect(client?.id).toBe(created.id);
    });

    it('should update a client', async () => {
      const created = await createTestClient(testUser.id);

      const updated = await prisma.client.update({
        where: { id: created.id },
        data: { status: 'ACTIVE', phone: '555-9999' },
      });

      expect(updated.status).toBe('ACTIVE');
      expect(updated.phone).toBe('555-9999');
    });

    it('should delete a client', async () => {
      const created = await prisma.client.create({
        data: {
          firstName: 'ToDelete',
          lastName: 'Client',
          type: 'PERSONAL',
          status: 'PROSPECT',
          agentId: testUser.id,
        },
      });

      await prisma.client.delete({ where: { id: created.id } });

      const deleted = await prisma.client.findUnique({
        where: { id: created.id },
      });

      expect(deleted).toBeNull();
    });

    it('should list clients with pagination', async () => {
      // Create multiple clients
      for (let i = 0; i < 5; i++) {
        await prisma.client.create({
          data: {
            firstName: `Client${i}`,
            lastName: 'Test',
            type: 'PERSONAL',
            status: 'ACTIVE',
            agentId: testUser.id,
          },
        });
      }

      const clients = await prisma.client.findMany({
        take: 3,
        orderBy: { createdAt: 'desc' },
      });

      expect(clients.length).toBe(3);
    });

    it('should search clients by name', async () => {
      await prisma.client.create({
        data: {
          firstName: 'SearchMe',
          lastName: 'FindThis',
          type: 'PERSONAL',
          status: 'ACTIVE',
          agentId: testUser.id,
        },
      });

      const results = await prisma.client.findMany({
        where: {
          OR: [
            { firstName: { contains: 'SearchMe', mode: 'insensitive' } },
            { lastName: { contains: 'FindThis', mode: 'insensitive' } },
          ],
        },
      });

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].firstName).toBe('SearchMe');
    });

    it('should create a commercial client', async () => {
      const client = await prisma.client.create({
        data: {
          firstName: 'Business',
          lastName: 'Owner',
          businessName: 'Test Corp',
          businessType: 'LLC',
          type: 'COMMERCIAL',
          status: 'ACTIVE',
          agentId: testUser.id,
        },
      });

      expect(client.type).toBe('COMMERCIAL');
      expect(client.businessName).toBe('Test Corp');
    });
  });
});
