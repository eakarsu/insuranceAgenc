import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import prisma from './prisma';
import { ClaimGovernanceError } from './claims-governance-rules';

export async function getClaimActor() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) throw new ClaimGovernanceError(401, 'UNAUTHORIZED', 'Authentication is required');
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      isActive: true,
      adjusterLicenseNumber: true,
      adjusterLicenseStates: true,
      adjusterLicenseExpiresAt: true,
    },
  });
  if (!user?.isActive) throw new ClaimGovernanceError(401, 'SESSION_REVOKED', 'User is inactive or no longer exists');
  return user;
}
