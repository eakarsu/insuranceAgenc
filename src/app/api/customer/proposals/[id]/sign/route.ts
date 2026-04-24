import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCustomerFromCookie } from '@/lib/customer-auth';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const customer = await getCustomerFromCookie();
    if (!customer) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { signatureData, signerName } = body;

    if (!signatureData || !signerName) {
      return NextResponse.json({ error: 'signatureData and signerName are required' }, { status: 400 });
    }

    // Find the proposal and verify it belongs to this customer
    const proposal = await prisma.proposal.findUnique({
      where: { id },
      include: {
        quote: {
          select: { id: true, clientId: true, status: true },
        },
      },
    });

    if (!proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
    }

    if (proposal.quote.clientId !== customer.clientId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (proposal.signedAt) {
      return NextResponse.json({ error: 'Proposal has already been signed' }, { status: 400 });
    }

    // Get IP address and user agent from headers
    const forwarded = request.headers.get('x-forwarded-for');
    const ipAddress = forwarded ? forwarded.split(',')[0].trim() : request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Update proposal with signature
    const updatedProposal = await prisma.proposal.update({
      where: { id },
      data: {
        signedAt: new Date(),
        signatureUrl: signatureData,
      },
    });

    // Create signature audit record
    await prisma.signatureAudit.create({
      data: {
        proposalId: id,
        action: 'SIGNED',
        signerName,
        signerEmail: customer.email,
        ipAddress,
        userAgent,
        signatureData,
      },
    });

    // Update quote status to ACCEPTED
    await prisma.quote.update({
      where: { id: proposal.quote.id },
      data: { status: 'ACCEPTED' },
    });

    return NextResponse.json({
      success: true,
      proposal: updatedProposal,
    });
  } catch (error) {
    console.error('Proposal sign POST error:', error);
    return NextResponse.json({ error: 'Failed to sign proposal' }, { status: 500 });
  }
}
