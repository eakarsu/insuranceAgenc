/**
 * POST /api/policies/:id/pdf
 *
 * Renders a policy declarations page as a professional PDF using Puppeteer.
 * Falls back to returning the HTML with Content-Type text/html if Chrome
 * is not available (e.g. in local dev without Chromium).
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

function buildPolicyHTML(policy: any): string {
  const client = policy.client;
  const carrier = policy.carrier;
  const agent = policy.agent;
  const coverageSummary = policy.coverageSummary as Record<string, any> | null;
  const deductibles = policy.deductibles as Record<string, any> | null;
  const limits = policy.limits as Record<string, any> | null;
  const endorsements: any[] = policy.endorsements ?? [];

  const coverageRows = coverageSummary
    ? Object.entries(coverageSummary)
        .map(
          ([key, val]) =>
            `<tr><td>${key.replace(/_/g, ' ')}</td><td>${val ?? 'N/A'}</td></tr>`
        )
        .join('')
    : '<tr><td colspan="2">No coverage details available</td></tr>';

  const limitRows = limits
    ? Object.entries(limits)
        .map(([k, v]) => `<tr><td>${k.replace(/_/g, ' ')}</td><td>${v ?? 'N/A'}</td></tr>`)
        .join('')
    : '';

  const deductibleRows = deductibles
    ? Object.entries(deductibles)
        .map(([k, v]) => `<tr><td>${k.replace(/_/g, ' ')}</td><td>${v ?? 'N/A'}</td></tr>`)
        .join('')
    : '';

  const endorsementRows =
    endorsements.length > 0
      ? endorsements
          .map(
            (e) =>
              `<tr><td>${e.endorsementNumber || '—'}</td><td>${e.type}</td><td>${e.description}</td><td>${formatDate(e.effectiveDate)}</td><td>${formatCurrency(e.premiumChange)}</td></tr>`
          )
          .join('')
      : '<tr><td colspan="5">No endorsements</td></tr>';

  const lob = policy.lineOfBusiness?.replace(/_/g, ' ') ?? 'N/A';
  const fullName =
    client?.type === 'COMMERCIAL'
      ? client?.businessName || `${client?.firstName} ${client?.lastName}`
      : `${client?.firstName} ${client?.lastName}`;
  const address = [client?.address, client?.city, client?.state, client?.zipCode]
    .filter(Boolean)
    .join(', ');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Policy Declarations — ${policy.policyNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #1a1a2e; background: white; }
    .page { padding: 40px; max-width: 900px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #1a1a7e; padding-bottom: 20px; margin-bottom: 24px; }
    .brand { font-size: 28px; font-weight: 700; color: #1a1a7e; letter-spacing: -0.5px; }
    .brand span { color: #4f8ef7; }
    .header-right { text-align: right; }
    .doc-title { font-size: 18px; font-weight: 600; color: #1a1a7e; }
    .doc-sub { font-size: 11px; color: #666; margin-top: 4px; }
    .policy-number { font-size: 14px; font-weight: 700; color: #1a1a7e; margin-top: 8px; }
    .badge { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
    .badge-active { background: #dcfce7; color: #16a34a; }
    .badge-expired { background: #fee2e2; color: #dc2626; }
    .badge-cancelled { background: #fef9c3; color: #ca8a04; }
    .badge-pending { background: #e0f2fe; color: #0284c7; }
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
    .premium-label { font-size: 12px; opacity: 0.8; margin-bottom: 4px; }
    .premium-amount { font-size: 28px; font-weight: 700; }
    .footer { border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 24px; font-size: 10px; color: #94a3b8; display: flex; justify-content: space-between; }
    .watermark { font-size: 9px; color: #cbd5e1; margin-top: 20px; text-align: center; }
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
    <div class="header-right">
      <div class="doc-title">Policy Declarations Page</div>
      <div class="doc-sub">Generated ${formatDate(new Date())}</div>
      <div class="policy-number">${policy.policyNumber}</div>
      <span class="badge badge-${(policy.status ?? 'active').toLowerCase()}">${policy.status ?? 'ACTIVE'}</span>
    </div>
  </div>

  <!-- Premium summary bar -->
  <div class="premium-box">
    <div>
      <div class="premium-label">Annual Premium</div>
      <div class="premium-amount">${formatCurrency(policy.premium)}</div>
    </div>
    <div style="text-align:right">
      <div class="premium-label">Line of Business</div>
      <div style="font-size:16px;font-weight:600">${lob}</div>
      <div class="premium-label" style="margin-top:8px">Policy Period</div>
      <div style="font-size:12px">${formatDate(policy.effectiveDate)} – ${formatDate(policy.expirationDate)}</div>
    </div>
  </div>

  <div class="grid-2">
    <!-- Named Insured -->
    <div class="section">
      <div class="section-title">Named Insured</div>
      <div class="info-grid">
        <div class="info-row">
          <span class="info-label">Full Name / Business</span>
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

    <!-- Policy Details -->
    <div class="section">
      <div class="section-title">Policy Details</div>
      <div class="info-grid">
        <div class="info-row">
          <span class="info-label">Carrier</span>
          <span class="info-value">${carrier?.name ?? 'N/A'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Policy Type</span>
          <span class="info-value">${policy.type ?? 'N/A'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Billing Method</span>
          <span class="info-value">${policy.billingMethod ?? 'N/A'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Auto Renew</span>
          <span class="info-value">${policy.autoRenew ? 'Yes' : 'No'}</span>
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

  <!-- Coverage Summary -->
  ${
    coverageSummary
      ? `<div class="section">
    <div class="section-title">Coverage Summary</div>
    <table><thead><tr><th>Coverage</th><th>Details</th></tr></thead><tbody>${coverageRows}</tbody></table>
  </div>`
      : ''
  }

  <div class="grid-2">
    <!-- Limits -->
    ${
      limits && Object.keys(limits).length > 0
        ? `<div class="section">
      <div class="section-title">Coverage Limits</div>
      <table><thead><tr><th>Limit Type</th><th>Amount</th></tr></thead><tbody>${limitRows}</tbody></table>
    </div>`
        : ''
    }

    <!-- Deductibles -->
    ${
      deductibles && Object.keys(deductibles).length > 0
        ? `<div class="section">
      <div class="section-title">Deductibles</div>
      <table><thead><tr><th>Type</th><th>Amount</th></tr></thead><tbody>${deductibleRows}</tbody></table>
    </div>`
        : ''
    }
  </div>

  <!-- Endorsements -->
  <div class="section">
    <div class="section-title">Endorsements</div>
    <table>
      <thead><tr><th>Number</th><th>Type</th><th>Description</th><th>Effective</th><th>Premium Change</th></tr></thead>
      <tbody>${endorsementRows}</tbody>
    </table>
  </div>

  <!-- Notes -->
  ${
    policy.notes
      ? `<div class="section">
    <div class="section-title">Notes</div>
    <p style="color:#475569;line-height:1.5">${policy.notes}</p>
  </div>`
      : ''
  }

  <div class="footer">
    <span>InsureFlow Insurance Agency Platform • Policy #${policy.policyNumber}</span>
    <span>Generated on ${formatDate(new Date())}</span>
  </div>
  <div class="watermark">This document is generated by InsureFlow and is for informational purposes only. It does not constitute a legal insurance contract.</div>
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

    const policy = await prisma.policy.findUnique({
      where: { id },
      include: {
        client: true,
        carrier: true,
        agent: { select: { id: true, name: true, email: true } },
        endorsements: { orderBy: { effectiveDate: 'desc' } },
      },
    });

    if (!policy) {
      return NextResponse.json({ error: 'Policy not found' }, { status: 404 });
    }

    const html = buildPolicyHTML(policy);
    const { buffer, format } = await generatePDF(html);

    const contentType = format === 'pdf' ? 'application/pdf' : 'text/html';
    const filename =
      format === 'pdf'
        ? `policy-${policy.policyNumber}.pdf`
        : `policy-${policy.policyNumber}.html`;

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error('[policies/pdf] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
