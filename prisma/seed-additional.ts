import { PrismaClient } from '@prisma/client';
import { addDays, subDays, addHours } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding additional data...');

  // Get existing policies, quotes, claims, and clients
  const policies = await prisma.policy.findMany({ take: 20 });
  const quotes = await prisma.quote.findMany({ take: 20 });
  const claims = await prisma.claim.findMany({ take: 15 });
  const clients = await prisma.client.findMany({ take: 30 });

  if (policies.length === 0) {
    console.log('No policies found. Run main seed first.');
    return;
  }

  // Seed Endorsements (15+ items)
  console.log('Seeding endorsements...');
  const endorsementTypes = [
    'Add Driver', 'Remove Driver', 'Add Vehicle', 'Remove Vehicle',
    'Coverage Change', 'Address Change', 'Name Change', 'Deductible Change',
    'Add Coverage', 'Limit Increase', 'Limit Decrease', 'Add Endorsement',
  ];

  for (let i = 0; i < 18; i++) {
    const policy = policies[i % policies.length];
    const premiumChange = Math.floor(Math.random() * 400) - 100; // -100 to +300
    await prisma.endorsement.create({
      data: {
        policyId: policy.id,
        endorsementNumber: `END-${String(i + 1).padStart(6, '0')}`,
        type: endorsementTypes[i % endorsementTypes.length],
        description: `${endorsementTypes[i % endorsementTypes.length]} for policy ${policy.policyNumber}`,
        effectiveDate: addDays(new Date(), Math.floor(Math.random() * 30) - 15),
        premiumChange,
        status: i < 5 ? 'PENDING' : i < 12 ? 'PROCESSED' : 'CANCELLED',
      },
    });
  }

  // Seed Quote Follow-ups (15+ items)
  console.log('Seeding follow-ups...');
  const followUpTypes = ['CALL', 'EMAIL', 'MEETING'];
  const now = new Date();

  for (let i = 0; i < 18; i++) {
    const quote = quotes[i % quotes.length];
    let scheduledAt: Date;

    if (i < 5) {
      // Overdue
      scheduledAt = subDays(now, Math.floor(Math.random() * 10) + 1);
    } else if (i < 10) {
      // Today
      scheduledAt = addHours(now, Math.floor(Math.random() * 8));
    } else {
      // Upcoming
      scheduledAt = addDays(now, Math.floor(Math.random() * 14) + 1);
    }

    await prisma.quoteFollowUp.create({
      data: {
        quoteId: quote.id,
        type: followUpTypes[i % followUpTypes.length],
        scheduledAt,
        completedAt: i >= 15 ? new Date() : null,
        notes: `Follow up with client regarding ${quote.quoteNumber}`,
      },
    });
  }

  // Seed Settlements (15+ items)
  console.log('Seeding settlements...');
  const settlementTypes = [
    'Property Damage', 'Bodily Injury', 'Medical Payments',
    'Collision', 'Comprehensive', 'Liability', 'Total Loss',
  ];

  for (let i = 0; i < 18; i++) {
    const claim = claims[i % claims.length];
    const amount = Math.floor(Math.random() * 45000) + 500;

    await prisma.settlement.create({
      data: {
        claimId: claim.id,
        amount,
        type: settlementTypes[i % settlementTypes.length],
        description: `Settlement for ${claim.claimNumber}`,
        paidDate: i < 12 ? subDays(new Date(), Math.floor(Math.random() * 60)) : null,
        checkNumber: i < 12 ? `CHK-${String(100000 + i).padStart(6, '0')}` : null,
      },
    });
  }

  // Seed Referrals (15+ items)
  console.log('Seeding referrals...');
  const referralStatuses = ['PENDING', 'CONTACTED', 'QUOTED', 'CONVERTED', 'DECLINED'];

  for (let i = 0; i < 18; i++) {
    const referringClient = clients[i % clients.length];
    const referredClient = i < 10 ? clients[(i + 10) % clients.length] : null;

    await prisma.referral.create({
      data: {
        referringClientId: referringClient.id,
        referredClientId: referredClient?.id || null,
        referredName: referredClient ? null : `Referred Person ${i + 1}`,
        referredEmail: referredClient ? null : `referred${i + 1}@example.com`,
        referredPhone: referredClient ? null : `555-${String(1000 + i).padStart(4, '0')}`,
        status: referralStatuses[i % referralStatuses.length],
        notes: `Referral from ${referringClient.firstName} ${referringClient.lastName}`,
        rewardGiven: i < 6,
        rewardAmount: i < 6 ? 50 : null,
      },
    });
  }

  // Update some policies to CANCELLED status for cancellations page
  console.log('Updating some policies to CANCELLED...');
  const policiesToCancel = await prisma.policy.findMany({
    where: { status: 'ACTIVE' },
    take: 15,
    skip: 10,
  });

  for (const policy of policiesToCancel) {
    await prisma.policy.update({
      where: { id: policy.id },
      data: {
        status: 'CANCELLED',
        cancelDate: subDays(new Date(), Math.floor(Math.random() * 90)),
      },
    });
  }

  // Update some quotes to PROPOSED status for proposals page
  console.log('Updating some quotes to PROPOSED...');
  const quotesToPropose = await prisma.quote.findMany({
    where: { status: 'QUOTED' },
    take: 15,
  });

  for (const quote of quotesToPropose) {
    await prisma.quote.update({
      where: { id: quote.id },
      data: {
        status: 'PROPOSED',
        expiresAt: addDays(new Date(), Math.floor(Math.random() * 30)),
      },
    });
  }

  console.log('Additional data seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
