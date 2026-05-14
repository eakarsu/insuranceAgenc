/**
 * POST /api/quotes/:id/pdf
 *
 * Renders an insurance quote proposal as a professional PDF using Puppeteer.
 * Falls back to returning HTML if Chrome is not available.
 *
 * Response:
 *   application/pdf  — PDF binary
 *   text/html        — HTML fallback (when Chrome not found)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { generatePDF } from '@/lib/pdf-generator';

function formatDate(d: Date | string | null | undefined): string {
  if (!d) return 'N/A';
  return new Date(d).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatCurrency(n: number | string | null | undefined): string {
  const num = Number(n ?? 0);
  return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function buildQuoteHTML(quote: any): string {
  const client = quote.client;
  const carrier = quote.carrier;
  const agent = quote.agent;
  const riskInfo = quote.riskInfo as Record<string, any> | null;
  const carrierQuotes = quote.carrierQuotes as any[] | null;

  const fullName =
    client?.type === 'COMMERCIAL'
      ? client?.businessName || `${client?.firstName} ${client?.lastName}`
      : `${client?.firstName} ${client?.lastName}`;

  const address = [client?.address, client?.city, client?.state, client?.zipCode]
    .filter(Boolean)
    .join(', ');

  const lob = quote.lineOfBusiness?.replace(/_/g, ' ') ?? 'N/A';

  const statusColor: Record<string, string> = {
    DRAFT: '#94a3b8',
    QUOTED: '#3b82f6',
    PROPOSED: '#8b5cf6',
    ACCEPTED: '#16a34a',
    DECLINED: '#dc2626',
    EXPIRED: '#f97316',
    BOUND: '#1a1a7e',
  };

  const statusStyle = `background:${statusColor[quote.status] ?? '#94a3b8'};color:white;padding:3px 10px;border-radius:12px;font-size:10px;font-weight:600;text-transform:uppercase;`;

  const riskRows = riskInfo
    ? Object.entries(riskInfo)
        .map(
          ([k, v]) =>
            `<tr><td>${k.replace(/_/g, ' ')}</td><td>${
              typeof v === 'object' ? JSON.stringify(v) : String(v ?? 'N/A')
            }</td></tr>`
        )
        .join('')
    : '<tr><td colspan="2">No risk information available</td></tr>';

  // Multi-carrier comparison table
  const carrierRows = Array.isArray(carrierQuotes) && carrierQuotes.length > 0
    ? carrierQuotes
        .map(
          (cq: any) =>
            `<tr>
              <td>${cq.carrier ?? cq.carrierName ?? 'Unknown'}</td>
              <td>${formatCurrency(cq.premium ?? cq.annualPremium)}</td>
              <td>${cq.coverageScore ?? '—'}</td>
              <td>${cq.rating ?? cq.amBestRating ?? '—'}</td>
              <td>${cq.recommended ? '✓ Recommended' : ''}</td>
            </tr>`
        )
        .join('')
    : '<tr><td colspan="5">Single carrier quote — no comparison data</td></tr>';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Insurance Quote — ${quote.quoteNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #1a1a2e; background: white; }
    .page { padding: 40px; max-width: 900px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #1a1a7e; padding-bottom: 20px; margin-bottom: 24px; }
    .brand { font-size: 28px; font-weight: 700; color: #1a1a7e; letter-spacing: -0.5px; }
    .brand span { color: #4f8ef7; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
    .section { margin-bottom: 24px; }
    .section-title { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #1a1a7e; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 12px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 20px; }
    .info-row { display: flex; flex-direction: column; }
    .info-label { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 1px; }
    .info-value { font-size: 12px; font-weight: 500; color: #1a1a2e; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th { background: #f1f5f9; text-align: left; padding: 8px 10px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.4px; color: #475569; border-bottom: 2px solid #e2e8f0; }
    td { padding: 7px 10px; border-bottom: 1px solid #f1f5f9; color: #334155; }
    tr:last-child td { border-bottom: none; }
    .premium-box { background: linear-gradient(135deg, #1a1a7e 0%, #3b5bdb 100%); color: white; border-radius: 8px; padding: 20px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .premium-amount { font-size: 28px; font-weight: 700; }
    .premium-label { font-size: 12px; opacity: 0.8; margin-bottom: 4px; }
    .breakdown { display: flex; gap: 24px; }
    .breakdown-item { text-align: center; }
    .breakdown-value { font-size: 16px; font-weight: 600; }
    .breakdown-label { font-size: 10px; opacity: 0.7; }
    .footer { border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 24px; font-size: 10px; color: #94a3b8; display: flex; justify-content: space-between; }
    .validity-box { background: #fefce8; border: 1px solid #fde047; border-radius: 6px; padding: 12px 16px; margin-bottom: 24px; }
    .validity-title { font-size: 11px; font-weight: 600; color: #a16207; }
    .validity-text { font-size: 11px; color: #854d0e; margin-top: 4px; }
  </style>
</head>
<body>
<div class="page">
  <!-- Header -->
  <div class="header">
    <div>
      <div class="brand">Insure<span>Flow</span></div>
      <div style="font-size:10px;color:#94a3b8;margin-top:4px;">Insurance Agency Platform</div>
    </div>
    <div style="text-align:right">
      <div style="font-size:18px;font-weight:600;color:#1a1a7e">Insurance Quote</div>
      <div style="font-size:11px;color:#666;margin-top:4px">Generated ${formatDate(new Date())}</div>
      <div style="font-size:14px;font-weight:700;color:#1a1a7e;margin-top:6px">${quote.quoteNumber}</div>
      <span style="${statusStyle}">${quote.status}</span>
    </div>
  </div>

  <!-- Premium summary bar -->
  <div class="premium-box">
    <div>
      <div class="premium-label">Total Annual Premium</div>
      <div class="premium-amount">${formatCurrency(quote.totalPremium ?? quote.premium)}</div>
      <div class="premium-label" style="margin-top:6px">${lob}</div>
    </div>
    <div class="breakdown">
      <div class="breakdown-item">
        <div class="breakdown-value">${formatCurrency(quote.premium)}</div>
        <div class="breakdown-label">Base Premium</div>
      </div>
      <div class="breakdown-item">
        <div class="breakdown-value">${formatCurrency(quote.fees)}</div>
        <div class="breakdown-label">Fees</div>
      </div>
      <div class="breakdown-item">
        <div class="breakdown-value">${formatCurrency(quote.taxes)}</div>
        <div class="breakdown-label">Taxes</div>
      </div>
    </div>
  </div>

  ${
    quote.expiresAt
      ? `<div class="validity-box">
    <div class="validity-title">⚠ Quote Validity</div>
    <div class="validity-text">This quote is valid until ${formatDate(quote.expiresAt)}. After this date, premiums and coverage terms may change. Contact your agent to bind coverage before the expiration date.</div>
  </div>`
      : ''
  }

  <div class="grid-2">
    <!-- Applicant -->
    <div class="section">
      <div class="section-title">Applicant Information</div>
      <div class="info-grid">
        <div class="info-row">
          <span class="info-label">Full Name</span>
          <span class="info-value">${fullName}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Client Type</span>
          <span class="info-value">${client?.type ?? 'N/A'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Address</span>
          <span class="info-value">${address || 'N/A'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Email</span>
          <span class="info-value">${client?.email ?? 'N/A'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Phone</span>
          <span class="info-value">${client?.phone ?? 'N/A'}</span>
        </div>
      </div>
    </div>

    <!-- Quote Details -->
    <div class="section">
      <div class="section-title">Quote Details</div>
      <div class="info-grid">
        <div class="info-row">
          <span class="info-label">Carrier</span>
          <span class="info-value">${carrier?.name ?? 'Multi-Carrier'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Effective Date</span>
          <span class="info-value">${formatDate(quote.effectiveDate)}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Policy Type</span>
          <span class="info-value">${quote.type ?? 'N/A'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Is Renewal</span>
          <span class="info-value">${quote.isRenewal ? 'Yes' : 'No'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Servicing Agent</span>
          <span class="info-value">${agent?.name ?? 'N/A'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Agent Email</span>
          <span class="info-value">${agent?.email ?? 'N/A'}</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Risk Information -->
  <div class="section">
    <div class="section-title">Risk Information</div>
    <table>
      <thead><tr><th>Factor</th><th>Value</th></tr></thead>
      <tbody>${riskRows}</tbody>
    </table>
  </div>

  <!-- Carrier Comparison (if multi-carrier) -->
  ${
    Array.isArray(carrierQuotes) && carrierQuotes.length > 0
      ? `<div class="section">
    <div class="section-title">Carrier Comparison</div>
    <table>
      <thead><tr><th>Carrier</th><th>Annual Premium</th><th>Coverage Score</th><th>Rating</th><th>Recommendation</th></tr></thead>
      <tbody>${carrierRows}</tbody>
    </table>
  </div>`
      : ''
  }

  <!-- Notes -->
  ${
    quote.notes
      ? `<div class="section">
    <div class="section-title">Notes</div>
    <p style="color:#475569;line-height:1.5">${quote.notes}</p>
  </div>`
      : ''
  }

  <div class="footer">
    <span>InsureFlow Insurance Agency Platform • Quote #${quote.quoteNumber}</span>
    <span>Generated on ${formatDate(new Date())}</span>
  </div>
  <p style="font-size:9px;color:#cbd5e1;margin-top:16px;text-align:center">
    This quote is for informational purposes only and does not constitute a binding agreement.
    Coverage is subject to underwriting approval and final policy terms.
    Contact your agent to bind coverage before the expiration date.
  </p>
</div>
</body>
</html>`;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const quote = await prisma.quote.findUnique({
      where: { id },
      include: {
        client: true,
        carrier: true,
        agent: { select: { id: true, name: true, email: true } },
      },
    });

    if (!quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }

    const html = buildQuoteHTML(quote);
    const { buffer, format } = await generatePDF(html);

    const contentType = format === 'pdf' ? 'application/pdf' : 'text/html';
    const filename =
      format === 'pdf'
        ? `quote-${quote.quoteNumber}.pdf`
        : `quote-${quote.quoteNumber}.html`;

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error('[quotes/pdf] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
