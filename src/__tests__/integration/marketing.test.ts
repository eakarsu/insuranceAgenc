import {
  prisma,
  clearTestData,
  createTestUser,
  createTestClient,
  createTestEmailTemplate,
} from '../helpers/db';

describe('Marketing Integration Tests', () => {
  let testUser: any;
  let testClient: any;

  beforeAll(async () => {
    await clearTestData();
    testUser = await createTestUser();
    testClient = await createTestClient(testUser.id);
  });

  afterAll(async () => {
    await clearTestData();
    await prisma.$disconnect();
  });

  describe('Email Template Operations', () => {
    it('should create an email template', async () => {
      const template = await prisma.emailTemplate.create({
        data: {
          name: 'Welcome Email',
          type: 'WELCOME',
          subject: 'Welcome to Our Agency, {{client_name}}!',
          content: 'Dear {{client_name}}, thank you for choosing us.',
          variables: ['client_name'],
          status: 'ACTIVE',
        },
      });

      expect(template).toBeDefined();
      expect(template.name).toBe('Welcome Email');
      expect(template.type).toBe('WELCOME');
      expect(template.variables).toContain('client_name');
    });

    it('should read a template', async () => {
      const created = await createTestEmailTemplate();

      const template = await prisma.emailTemplate.findUnique({
        where: { id: created.id },
      });

      expect(template).toBeDefined();
      expect(template?.name).toBe('Test Template');
    });

    it('should update a template', async () => {
      const template = await createTestEmailTemplate();

      const updated = await prisma.emailTemplate.update({
        where: { id: template.id },
        data: {
          subject: 'Updated Subject',
          content: 'Updated content for {{client_name}}',
        },
      });

      expect(updated.subject).toBe('Updated Subject');
    });

    it('should delete a template', async () => {
      const template = await prisma.emailTemplate.create({
        data: {
          name: 'To Delete',
          type: 'FOLLOW_UP',
          subject: 'Delete me',
          content: 'Test',
          variables: [],
          status: 'DRAFT',
        },
      });

      await prisma.emailTemplate.delete({ where: { id: template.id } });

      const deleted = await prisma.emailTemplate.findUnique({
        where: { id: template.id },
      });

      expect(deleted).toBeNull();
    });

    it('should list templates by type', async () => {
      await prisma.emailTemplate.create({
        data: {
          name: 'Renewal Reminder',
          type: 'RENEWAL',
          subject: 'Policy Renewal',
          content: 'Your policy is up for renewal',
          variables: [],
          status: 'ACTIVE',
        },
      });

      const renewalTemplates = await prisma.emailTemplate.findMany({
        where: { type: 'RENEWAL' },
      });

      expect(renewalTemplates.length).toBeGreaterThan(0);
    });
  });

  describe('Campaign Operations', () => {
    it('should create a campaign', async () => {
      const campaign = await prisma.campaign.create({
        data: {
          name: 'Spring Newsletter',
          type: 'NEWSLETTER',
          status: 'DRAFT',
          subject: 'Special Offer for You',
          content: 'Check out our spring deals!',
          createdById: testUser.id,
        },
      });

      expect(campaign).toBeDefined();
      expect(campaign.name).toBe('Spring Newsletter');
      expect(campaign.status).toBe('DRAFT');
    });

    it('should add recipients to campaign', async () => {
      const campaign = await prisma.campaign.create({
        data: {
          name: 'Test Campaign',
          type: 'EMAIL',
          status: 'DRAFT',
          subject: 'Newsletter',
          content: 'Monthly update',
          createdById: testUser.id,
        },
      });

      const recipient = await prisma.campaignRecipient.create({
        data: {
          campaignId: campaign.id,
          clientId: testClient.id,
          status: 'PENDING',
        },
      });

      expect(recipient).toBeDefined();
      expect(recipient.campaignId).toBe(campaign.id);
      expect(recipient.status).toBe('PENDING');
    });

    it('should update campaign status', async () => {
      const campaign = await prisma.campaign.create({
        data: {
          name: 'Status Test',
          type: 'EMAIL',
          status: 'DRAFT',
          subject: 'Test',
          content: 'Test',
          createdById: testUser.id,
        },
      });

      const updated = await prisma.campaign.update({
        where: { id: campaign.id },
        data: { status: 'SENT', sentAt: new Date() },
      });

      expect(updated.status).toBe('SENT');
      expect(updated.sentAt).toBeDefined();
    });
  });

  describe('Referral Operations', () => {
    it('should create a referral', async () => {
      const referredClient = await prisma.client.create({
        data: {
          firstName: 'Referred',
          lastName: 'Person',
          type: 'PERSONAL',
          status: 'PROSPECT',
          source: 'REFERRAL',
          agentId: testUser.id,
        },
      });

      const referral = await prisma.referral.create({
        data: {
          referringClientId: testClient.id,
          referredClientId: referredClient.id,
          status: 'PENDING',
        },
      });

      expect(referral).toBeDefined();
      expect(referral.status).toBe('PENDING');
    });

    it('should update referral status', async () => {
      const referredClient = await prisma.client.create({
        data: {
          firstName: 'New',
          lastName: 'Client',
          type: 'PERSONAL',
          status: 'ACTIVE',
          agentId: testUser.id,
        },
      });

      const referral = await prisma.referral.create({
        data: {
          referringClientId: testClient.id,
          referredClientId: referredClient.id,
          status: 'PENDING',
        },
      });

      const updated = await prisma.referral.update({
        where: { id: referral.id },
        data: { status: 'CONVERTED', rewardGiven: true },
      });

      expect(updated.status).toBe('CONVERTED');
      expect(updated.rewardGiven).toBe(true);
    });

    it('should list referrals with client info', async () => {
      const referrals = await prisma.referral.findMany({
        include: {
          referringClient: true,
          referredClient: true,
        },
      });

      expect(referrals.length).toBeGreaterThan(0);
      expect(referrals[0].referringClient).toBeDefined();
    });
  });

  describe('Cross-Sell Recommendations', () => {
    it('should create a cross-sell recommendation', async () => {
      const recommendation = await prisma.crossSellRecommendation.create({
        data: {
          clientId: testClient.id,
          recommendedProduct: 'Umbrella Insurance',
          score: 95,
          reasoning: 'High asset value client',
          currentPolicies: ['Personal Auto'],
          status: 'PENDING',
        },
      });

      expect(recommendation).toBeDefined();
      expect(recommendation.recommendedProduct).toBe('Umbrella Insurance');
      expect(Number(recommendation.score)).toBe(95);
    });

    it('should update recommendation status', async () => {
      const recommendation = await prisma.crossSellRecommendation.create({
        data: {
          clientId: testClient.id,
          recommendedProduct: 'Life Insurance',
          score: 88,
          reasoning: 'Family coverage needed',
          currentPolicies: [],
          status: 'PENDING',
        },
      });

      const updated = await prisma.crossSellRecommendation.update({
        where: { id: recommendation.id },
        data: { status: 'CONVERTED' },
      });

      expect(updated.status).toBe('CONVERTED');
    });

    it('should list recommendations by score', async () => {
      const recommendations = await prisma.crossSellRecommendation.findMany({
        orderBy: { score: 'desc' },
        include: { client: true },
      });

      expect(recommendations.length).toBeGreaterThan(0);
      // Verify sorted by score descending
      for (let i = 1; i < recommendations.length; i++) {
        expect(Number(recommendations[i - 1].score)).toBeGreaterThanOrEqual(
          Number(recommendations[i].score)
        );
      }
    });
  });
});
