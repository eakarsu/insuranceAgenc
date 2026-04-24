import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function generateHtmlTable(title: string, headers: string[], rows: string[][]): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
    h1 { color: #1976d2; border-bottom: 2px solid #1976d2; padding-bottom: 10px; }
    .meta { color: #666; font-size: 12px; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 11px; }
    th { background-color: #1976d2; color: white; padding: 10px 8px; text-align: left; }
    td { padding: 8px; border-bottom: 1px solid #ddd; }
    tr:nth-child(even) { background-color: #f8f9fa; }
    tr:hover { background-color: #e3f2fd; }
    .footer { margin-top: 30px; text-align: center; color: #999; font-size: 10px; }
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <div class="meta">Generated on ${new Date().toLocaleString()} | InsureFlow Agency Platform</div>
  <table>
    <thead>
      <tr>${headers.map(h => `<th>${escapeHtml(h)}</th>`).join('')}</tr>
    </thead>
    <tbody>
      ${rows.map(row => `<tr>${row.map(cell => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`).join('\n      ')}
    </tbody>
  </table>
  <div class="footer">
    <p>InsureFlow &copy; ${new Date().getFullYear()} | Total Records: ${rows.length}</p>
  </div>
</body>
</html>`;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    let html = '';

    switch (type) {
      case 'clients': {
        const clients = await prisma.client.findMany({
          include: { agent: { select: { name: true } } },
          orderBy: { createdAt: 'desc' },
        });
        const headers = ['Name', 'Type', 'Status', 'Email', 'Phone', 'City', 'State', 'Agent'];
        const rows = clients.map(c => [
          c.type === 'COMMERCIAL' && c.businessName ? c.businessName : `${c.firstName} ${c.lastName}`,
          c.type, c.status, c.email || '-', c.phone || '-', c.city || '-', c.state || '-', c.agent?.name || '-',
        ]);
        html = generateHtmlTable('Clients Report', headers, rows);
        break;
      }

      case 'policies': {
        const policies = await prisma.policy.findMany({
          include: { client: true, carrier: true, agent: { select: { name: true } } },
          orderBy: { createdAt: 'desc' },
        });
        const headers = ['Policy #', 'Client', 'LOB', 'Carrier', 'Premium', 'Effective', 'Expires', 'Status'];
        const rows = policies.map(p => [
          p.policyNumber,
          p.client.type === 'COMMERCIAL' && p.client.businessName ? p.client.businessName : `${p.client.firstName} ${p.client.lastName}`,
          p.lineOfBusiness.replace(/_/g, ' '), p.carrier?.name || '-',
          `$${Number(p.premium).toLocaleString()}`,
          new Date(p.effectiveDate).toLocaleDateString(), new Date(p.expirationDate).toLocaleDateString(),
          p.status,
        ]);
        html = generateHtmlTable('Policies Report', headers, rows);
        break;
      }

      case 'quotes': {
        const quotes = await prisma.quote.findMany({
          include: { client: true, carrier: true },
          orderBy: { createdAt: 'desc' },
        });
        const headers = ['Quote #', 'Client', 'LOB', 'Carrier', 'Premium', 'Eff. Date', 'Status'];
        const rows = quotes.map(q => [
          q.quoteNumber,
          q.client.type === 'COMMERCIAL' && q.client.businessName ? q.client.businessName : `${q.client.firstName} ${q.client.lastName}`,
          q.lineOfBusiness.replace(/_/g, ' '), q.carrier?.name || '-',
          q.totalPremium ? `$${Number(q.totalPremium).toLocaleString()}` : '-',
          new Date(q.effectiveDate).toLocaleDateString(), q.status,
        ]);
        html = generateHtmlTable('Quotes Report', headers, rows);
        break;
      }

      case 'claims': {
        const claims = await prisma.claim.findMany({
          include: { client: true, policy: true },
          orderBy: { createdAt: 'desc' },
        });
        const headers = ['Claim #', 'Client', 'Policy', 'Type', 'Date of Loss', 'Est. Loss', 'Paid', 'Status'];
        const rows = claims.map(c => [
          c.claimNumber, `${c.client.firstName} ${c.client.lastName}`,
          c.policy?.policyNumber || '-', c.type,
          new Date(c.dateOfLoss).toLocaleDateString(),
          c.estimatedLoss ? `$${Number(c.estimatedLoss).toLocaleString()}` : '-',
          c.paidAmount ? `$${Number(c.paidAmount).toLocaleString()}` : '-',
          c.status.replace(/_/g, ' '),
        ]);
        html = generateHtmlTable('Claims Report', headers, rows);
        break;
      }

      case 'commissions': {
        const commissions = await prisma.commission.findMany({
          include: { policy: true, agent: { select: { name: true } } },
          orderBy: { createdAt: 'desc' },
        });
        const headers = ['Policy', 'Agent', 'Type', 'Base Premium', 'Rate', 'Amount', 'Status'];
        const rows = commissions.map(c => [
          c.policy?.policyNumber || '-', c.agent?.name || '-',
          c.type.replace(/_/g, ' '),
          `$${Number(c.basePremium || 0).toLocaleString()}`,
          `${c.rate || 0}%`, `$${Number(c.amount).toLocaleString()}`, c.status,
        ]);
        html = generateHtmlTable('Commissions Report', headers, rows);
        break;
      }

      default:
        return NextResponse.json({ error: 'Invalid export type. Use: clients, policies, quotes, claims, commissions' }, { status: 400 });
    }

    // Generate real PDF if possible
    const { generatePDF } = await import('@/lib/pdf-generator');
    const { buffer, format } = await generatePDF(html);
    const contentType = format === 'pdf' ? 'application/pdf' : 'text/html';
    const ext = format === 'pdf' ? 'pdf' : 'html';

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${type}-report-${new Date().toISOString().split('T')[0]}.${ext}"`,
      },
    });
  } catch (error) {
    console.error('PDF export error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
