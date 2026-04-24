import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCustomerFromCookie } from '@/lib/customer-auth';

export async function GET(request: NextRequest) {
  try {
    const customer = await getCustomerFromCookie();
    if (!customer) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const documents = await prisma.document.findMany({
      where: { clientId: customer.clientId },
      orderBy: { uploadedAt: 'desc' },
      select: {
        id: true,
        type: true,
        name: true,
        fileName: true,
        fileUrl: true,
        fileSize: true,
        mimeType: true,
        description: true,
        uploadedAt: true,
        policy: {
          select: {
            id: true,
            policyNumber: true,
          },
        },
        claim: {
          select: {
            id: true,
            claimNumber: true,
          },
        },
      },
    });

    return NextResponse.json({ documents });
  } catch (error) {
    console.error('Customer documents GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
  }
}
