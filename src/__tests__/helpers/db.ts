import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function clearTestData() {
  // Clear in correct order due to foreign key constraints
  // Use raw SQL to handle complex relations
  try {
    await prisma.$executeRaw`DELETE FROM "Commission"`;
  } catch (e) {}
  try {
    await prisma.$executeRaw`DELETE FROM "Activity"`;
  } catch (e) {}
  try {
    await prisma.$executeRaw`DELETE FROM "CrossSellRecommendation"`;
  } catch (e) {}
  try {
    await prisma.$executeRaw`DELETE FROM "CampaignRecipient"`;
  } catch (e) {}
  try {
    await prisma.$executeRaw`DELETE FROM "Campaign"`;
  } catch (e) {}
  try {
    await prisma.$executeRaw`DELETE FROM "EmailTemplate"`;
  } catch (e) {}
  try {
    await prisma.$executeRaw`DELETE FROM "Referral"`;
  } catch (e) {}
  try {
    await prisma.$executeRaw`DELETE FROM "Claim"`;
  } catch (e) {}
  try {
    await prisma.$executeRaw`DELETE FROM "Quote"`;
  } catch (e) {}
  try {
    await prisma.$executeRaw`DELETE FROM "Policy"`;
  } catch (e) {}
  try {
    await prisma.$executeRaw`DELETE FROM "Document"`;
  } catch (e) {}
  try {
    await prisma.$executeRaw`DELETE FROM "LifeEvent"`;
  } catch (e) {}
  try {
    await prisma.$executeRaw`DELETE FROM "Contact"`;
  } catch (e) {}
  try {
    await prisma.$executeRaw`DELETE FROM "Client"`;
  } catch (e) {}
  try {
    await prisma.$executeRaw`DELETE FROM "Carrier"`;
  } catch (e) {}
  try {
    await prisma.$executeRaw`DELETE FROM "Notification"`;
  } catch (e) {}
  try {
    await prisma.$executeRaw`DELETE FROM "User"`;
  } catch (e) {}
  try {
    await prisma.$executeRaw`DELETE FROM "Household"`;
  } catch (e) {}
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
