import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { generatePDF } from '@/lib/pdf-generator';
import { policyDeclarationHTML } from '@/lib/document-templates/policy-declaration';
import { proofOfInsuranceHTML } from '@/lib/document-templates/proof-of-insurance';
import { claimAcknowledgmentHTML, claimSettlementHTML } from '@/lib/document-templates/claim-letter';
import { renewalNoticeHTML } from '@/lib/document-templates/renewal-notice';
import { invoiceHTML } from '@/lib/document-templates/invoice';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { type, entityId } = body;

    let html = '';
    let filename = '';

    switch (type) {
      case 'policy-declaration': {
        const policy = await prisma.policy.findUnique({
          where: { id: entityId },
          include: { client: true, carrier: true, agent: { select: { name: true, email: true } } },
        });
        if (!policy) return NextResponse.json({ error: 'Policy not found' }, { status: 404 });
        html = policyDeclarationHTML(policy);
        filename = `declaration-${policy.policyNumber}.pdf`;
        break;
      }
      case 'proof-of-insurance': {
        const policy = await prisma.policy.findUnique({
          where: { id: entityId },
          include: { client: true, carrier: true },
        });
        if (!policy) return NextResponse.json({ error: 'Policy not found' }, { status: 404 });
        html = proofOfInsuranceHTML(policy);
        filename = `proof-${policy.policyNumber}.pdf`;
        break;
      }
      case 'claim-acknowledgment': {
        const claim = await prisma.claim.findUnique({
          where: { id: entityId },
          include: { client: true, policy: true },
        });
        if (!claim) return NextResponse.json({ error: 'Claim not found' }, { status: 404 });
        html = claimAcknowledgmentHTML(claim);
        filename = `ack-${claim.claimNumber}.pdf`;
        break;
      }
      case 'claim-settlement': {
        const claim = await prisma.claim.findUnique({
          where: { id: entityId },
          include: { client: true, settlements: true },
        });
        if (!claim) return NextResponse.json({ error: 'Claim not found' }, { status: 404 });
        const totalSettlement = claim.settlements.reduce((sum, s) => sum + Number(s.amount), 0);
        html = claimSettlementHTML(claim, totalSettlement);
        filename = `settlement-${claim.claimNumber}.pdf`;
        break;
      }
      case 'renewal-notice': {
        const policy = await prisma.policy.findUnique({
          where: { id: entityId },
          include: { client: true, carrier: true, agent: { select: { name: true } } },
        });
        if (!policy) return NextResponse.json({ error: 'Policy not found' }, { status: 404 });
        html = renewalNoticeHTML(policy);
        filename = `renewal-${policy.policyNumber}.pdf`;
        break;
      }
      case 'invoice': {
        const schedule = await prisma.paymentSchedule.findUnique({
          where: { id: entityId },
          include: { policy: { include: { client: true } } },
        });
        if (!schedule) return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
        const clientName = schedule.policy.client?.businessName || `${schedule.policy.client?.firstName} ${schedule.policy.client?.lastName}`;
        html = invoiceHTML({
          invoiceNumber: `INV-${Date.now()}`,
          clientName,
          policyNumber: schedule.policy.policyNumber,
          amount: Number(schedule.amount),
          dueDate: schedule.dueDate.toLocaleDateString(),
        });
        filename = `invoice-${schedule.policy.policyNumber}.pdf`;
        break;
      }
      default:
        return NextResponse.json({ error: 'Invalid document type' }, { status: 400 });
    }

    const { buffer, format } = await generatePDF(html);
    const contentType = format === 'pdf' ? 'application/pdf' : 'text/html';
    const ext = format === 'pdf' ? '.pdf' : '.html';

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename.replace('.pdf', ext)}"`,
      },
    });
  } catch (error: any) {
    console.error('Document generation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
