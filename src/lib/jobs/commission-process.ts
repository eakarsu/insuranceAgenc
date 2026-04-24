import prisma from '../prisma';

/**
 * Job handler: Automated commission processing.
 * PENDING → EARNED when policy is active and effective date has passed.
 * Auto-CHARGEBACK for cancelled policies.
 */
export async function handleCommissionProcess(): Promise<any> {
  const now = new Date();
  let earned = 0;
  let chargedBack = 0;

  // 1. Move PENDING commissions to EARNED for active policies past effective date
  const pendingCommissions = await prisma.commission.findMany({
    where: {
      status: 'PENDING',
    },
    include: {
      policy: { select: { status: true, effectiveDate: true } },
    },
  });

  for (const commission of pendingCommissions) {
    if (
      commission.policy.status === 'ACTIVE' &&
      commission.policy.effectiveDate <= now
    ) {
      await prisma.commission.update({
        where: { id: commission.id },
        data: {
          status: 'EARNED',
          earnedDate: now,
        },
      });
      earned++;
    }
  }

  // 2. Auto-CHARGEBACK for cancelled policies
  const earnedCommissions = await prisma.commission.findMany({
    where: {
      status: 'EARNED',
    },
    include: {
      policy: { select: { status: true, cancelDate: true } },
    },
  });

  for (const commission of earnedCommissions) {
    if (commission.policy.status === 'CANCELLED') {
      await prisma.commission.update({
        where: { id: commission.id },
        data: {
          status: 'CHARGEDBACK',
          notes: `Auto chargeback: policy cancelled on ${commission.policy.cancelDate?.toLocaleDateString() || 'unknown date'}`,
        },
      });
      chargedBack++;
    }
  }

  // 3. Process commission splits for newly earned commissions
  const newlyEarned = await prisma.commission.findMany({
    where: {
      status: 'EARNED',
      earnedDate: {
        gte: new Date(now.getTime() - 24 * 60 * 60 * 1000), // last 24h
      },
    },
    include: {
      splits: true,
    },
  });

  for (const commission of newlyEarned) {
    if (commission.splits.length > 0) {
      // Update split amounts based on earned amount
      for (const split of commission.splits) {
        const splitAmount = Number(commission.amount) * Number(split.percentage) / 100;
        await prisma.commissionSplit.update({
          where: { id: split.id },
          data: { amount: splitAmount },
        });
      }
    }
  }

  return { earned, chargedBack };
}
