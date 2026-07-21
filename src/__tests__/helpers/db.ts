import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function clearTestData() {
  const databaseUrl = process.env.DATABASE_URL || '';
  if (process.env.NODE_ENV !== 'test' || !/(?:_test|_validation)/.test(databaseUrl)) {
    throw new Error('Refusing to clear data outside an explicitly named test/validation database');
  }
  const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename <> '_prisma_migrations'
  `;
  if (tables.length) {
    const names = tables.map(({ tablename }) => `"${tablename.replace(/"/g, '""')}"`).join(',');
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${names} RESTART IDENTITY CASCADE`);
  }
}

export async function createTestUser() {
  return prisma.user.create({
    data: {
      email: 'test@example.com',
      password: '$2a$10$test', // hashed password
      name: 'Test User',
      role: 'AGENT',
    },
  });
}

export async function createTestClient(agentId: string) {
  return prisma.client.create({
    data: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '555-1234',
      type: 'PERSONAL',
      status: 'ACTIVE',
      agentId,
    },
  });
}

export async function createTestCarrier() {
  return prisma.carrier.create({
    data: {
      name: 'Test Insurance Co',
      code: 'TIC',
      isActive: true,
    },
  });
}

export async function createTestQuote(clientId: string, agentId: string, carrierId: string | null = null) {
  return prisma.quote.create({
    data: {
      clientId,
      carrierId,
      agentId,
      quoteNumber: `QT-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      lineOfBusiness: 'PERSONAL_AUTO',
      status: 'DRAFT',
      premium: 1200,
      effectiveDate: new Date(),
    },
  });
}

export async function createTestPolicy(clientId: string, carrierId: string, agentId: string) {
  return prisma.policy.create({
    data: {
      clientId,
      carrierId,
      agentId,
      policyNumber: `POL-TEST-${Date.now()}`,
      lineOfBusiness: 'PERSONAL_AUTO',
      type: 'Personal Auto',
      status: 'ACTIVE',
      premium: 1200,
      effectiveDate: new Date(),
      expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  });
}

export async function createTestClaim(clientId: string, policyId: string, agentId: string) {
  return prisma.claim.create({
    data: {
      clientId,
      policyId,
      agentId,
      claimNumber: `CLM-TEST-${Date.now()}`,
      type: 'AUTO',
      status: 'REPORTED',
      dateOfLoss: new Date(),
      description: 'Test claim description',
    },
  });
}

export async function createTestEmailTemplate() {
  return prisma.emailTemplate.create({
    data: {
      name: 'Test Template',
      type: 'WELCOME',
      subject: 'Welcome {{client_name}}',
      content: 'Hello {{client_name}}, welcome to our agency!',
      variables: ['client_name'],
      status: 'ACTIVE',
    },
  });
}

export { prisma };
