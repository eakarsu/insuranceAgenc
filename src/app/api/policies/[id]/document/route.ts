import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const policy = await prisma.policy.findUnique({
      where: { id },
      include: {
        client: true,
        carrier: true,
        agent: { select: { id: true, name: true, email: true, phone: true } },
      },
    });

    if (!policy) {
      return NextResponse.json({ error: 'Policy not found' }, { status: 404 });
    }

    const clientName = policy.client.businessName
      || `${policy.client.firstName} ${policy.client.lastName}`;

    const clientAddress = [
      policy.client.address,
      policy.client.city,
      policy.client.state,
      policy.client.zipCode,
    ].filter(Boolean).join(', ');

    const formatDate = (date: Date) => new Date(date).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });

    const formatLOB = (lob: string) => lob.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

    const premium = Number(policy.premium || 0);

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Policy Declaration - ${policy.policyNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; background: #f5f5f5; }
    .container { max-width: 800px; margin: 0 auto; background: #fff; }
    .header { background: linear-gradient(135deg, #1565c0, #1976d2, #42a5f5); color: white; padding: 40px; text-align: center; }
    .header h1 { font-size: 28px; margin-bottom: 8px; letter-spacing: 1px; }
    .header .subtitle { font-size: 14px; opacity: 0.9; text-transform: uppercase; letter-spacing: 2px; }
    .badge { display: inline-block; background: rgba(255,255,255,0.2); padding: 6px 16px; border-radius: 20px; margin-top: 12px; font-size: 13px; font-weight: 600; }
    .section { padding: 24px 40px; border-bottom: 1px solid #e0e0e0; }
    .section:last-child { border-bottom: none; }
    .section-title { font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; color: #1976d2; font-weight: 700; margin-bottom: 16px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .field { margin-bottom: 8px; }
    .field-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #888; margin-bottom: 2px; }
    .field-value { font-size: 15px; font-weight: 600; color: #333; }
    .premium-box { background: linear-gradient(135deg, #e8f5e9, #c8e6c9); border-radius: 12px; padding: 24px; text-align: center; margin: 16px 0; }
    .premium-amount { font-size: 36px; font-weight: 800; color: #2e7d32; }
    .premium-label { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #666; margin-bottom: 4px; }
    .status-badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 700; text-transform: uppercase; }
    .status-active { background: #e8f5e9; color: #2e7d32; }
    .status-pending { background: #fff3e0; color: #e65100; }
    .status-cancelled { background: #ffebee; color: #c62828; }
    .footer { background: #fafafa; padding: 24px 40px; text-align: center; font-size: 12px; color: #999; }
    .divider { border: none; border-top: 2px dashed #e0e0e0; margin: 16px 0; }
    @media print { body { background: white; } .container { box-shadow: none; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="subtitle">Insurance Policy Declaration</div>
      <h1>${policy.policyNumber}</h1>
      <div class="badge">${formatLOB(policy.lineOfBusiness)}</div>
    </div>

    <div class="section">
      <div class="section-title">Policy Information</div>
      <div class="grid">
        <div class="field">
          <div class="field-label">Policy Number</div>
          <div class="field-value">${policy.policyNumber}</div>
        </div>
        <div class="field">
          <div class="field-label">Status</div>
          <div class="field-value">
            <span class="status-badge status-${policy.status.toLowerCase()}">${policy.status}</span>
          </div>
        </div>
        <div class="field">
          <div class="field-label">Line of Business</div>
          <div class="field-value">${formatLOB(policy.lineOfBusiness)}</div>
        </div>
        <div class="field">
          <div class="field-label">Policy Type</div>
          <div class="field-value">${policy.type}</div>
        </div>
        <div class="field">
          <div class="field-label">Effective Date</div>
          <div class="field-value">${formatDate(policy.effectiveDate)}</div>
        </div>
        <div class="field">
          <div class="field-label">Expiration Date</div>
          <div class="field-value">${formatDate(policy.expirationDate)}</div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Named Insured</div>
      <div class="grid">
        <div class="field">
          <div class="field-label">Name</div>
          <div class="field-value">${clientName}</div>
        </div>
        <div class="field">
          <div class="field-label">Client Type</div>
          <div class="field-value">${policy.client.type}</div>
        </div>
        <div class="field">
          <div class="field-label">Email</div>
          <div class="field-value">${policy.client.email || 'N/A'}</div>
        </div>
        <div class="field">
          <div class="field-label">Phone</div>
          <div class="field-value">${policy.client.phone || 'N/A'}</div>
        </div>
        ${clientAddress ? `
        <div class="field" style="grid-column: span 2;">
          <div class="field-label">Address</div>
          <div class="field-value">${clientAddress}</div>
        </div>` : ''}
      </div>
    </div>

    <div class="section">
      <div class="section-title">Carrier Information</div>
      <div class="grid">
        <div class="field">
          <div class="field-label">Carrier</div>
          <div class="field-value">${policy.carrier?.name || 'N/A'}</div>
        </div>
        <div class="field">
          <div class="field-label">Carrier Contact</div>
          <div class="field-value">${policy.carrier?.phone || policy.carrier?.email || 'N/A'}</div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Premium Summary</div>
      <div class="premium-box">
        <div class="premium-label">Total Annual Premium</div>
        <div class="premium-amount">$${premium.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
      </div>
      <div class="grid">
        <div class="field">
          <div class="field-label">Billing Method</div>
          <div class="field-value">${policy.billingMethod ? policy.billingMethod.replace(/_/g, ' ') : 'N/A'}</div>
        </div>
        <div class="field">
          <div class="field-label">Installments</div>
          <div class="field-value">${policy.installments || 'N/A'}</div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Servicing Agent</div>
      <div class="grid">
        <div class="field">
          <div class="field-label">Agent Name</div>
          <div class="field-value">${policy.agent?.name || 'N/A'}</div>
        </div>
        <div class="field">
          <div class="field-label">Agent Email</div>
          <div class="field-value">${policy.agent?.email || 'N/A'}</div>
        </div>
      </div>
    </div>

    <div class="footer">
      <hr class="divider" />
      <p>This is a summary declaration page. Please refer to your full policy documents for complete terms, conditions, and exclusions.</p>
      <p style="margin-top: 8px;">Generated on ${formatDate(new Date())} | InsureFlow Platform</p>
    </div>
  </div>
</body>
</html>`;

    // Check if PDF format requested
    const format = request.nextUrl.searchParams.get('format');
    if (format === 'pdf') {
      const { generatePDF } = await import('@/lib/pdf-generator');
      const { buffer, format: outputFormat } = await generatePDF(html);
      const contentType = outputFormat === 'pdf' ? 'application/pdf' : 'text/html';
      const ext = outputFormat === 'pdf' ? 'pdf' : 'html';
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="policy-${policy.policyNumber}.${ext}"`,
        },
      });
    }

    return new NextResponse(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  } catch (error) {
    console.error('Policy document GET error:', error);
    return NextResponse.json({ error: 'Failed to generate policy document' }, { status: 500 });
  }
}
