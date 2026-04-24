export function claimAcknowledgmentHTML(claim: any): string {
  const clientName = claim.client?.businessName || `${claim.client?.firstName} ${claim.client?.lastName}`;
  const formatDate = (d: any) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A';

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Claim Acknowledgment</title>
<style>body { font-family: Georgia, serif; margin: 40px; color: #333; line-height: 1.6; } .letterhead { border-bottom: 2px solid #1976d2; padding-bottom: 16px; margin-bottom: 30px; } .letterhead h1 { color: #1976d2; font-size: 20px; margin: 0; } .date { text-align: right; margin-bottom: 20px; } .signature { margin-top: 40px; }</style>
</head><body>
<div class="letterhead"><h1>InsureFlow Insurance</h1><div style="font-size:12px;color:#666;">Claims Department</div></div>
<div class="date">${formatDate(new Date())}</div>
<p>Dear ${clientName},</p>
<p>We acknowledge receipt of your claim <strong>${claim.claimNumber}</strong> filed on ${formatDate(claim.dateReported || claim.createdAt)}.</p>
<p><strong>Claim Details:</strong></p>
<ul>
  <li>Claim Number: ${claim.claimNumber}</li>
  <li>Type: ${claim.type}</li>
  <li>Date of Loss: ${formatDate(claim.dateOfLoss)}</li>
  <li>Policy: ${claim.policy?.policyNumber || 'N/A'}</li>
</ul>
<p>Your claim has been assigned to ${claim.adjusterName || 'our claims team'} who will contact you within 2 business days. In the meantime, please gather any supporting documentation.</p>
<div class="signature"><p>Sincerely,</p><p><strong>InsureFlow Claims Department</strong></p></div>
</body></html>`;
}

export function claimDenialHTML(claim: any, reason: string): string {
  const clientName = claim.client?.businessName || `${claim.client?.firstName} ${claim.client?.lastName}`;
  const formatDate = (d: any) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A';

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Claim Decision</title>
<style>body { font-family: Georgia, serif; margin: 40px; color: #333; line-height: 1.6; } .letterhead { border-bottom: 2px solid #1976d2; padding-bottom: 16px; margin-bottom: 30px; } .letterhead h1 { color: #1976d2; font-size: 20px; margin: 0; }</style>
</head><body>
<div class="letterhead"><h1>InsureFlow Insurance</h1></div>
<p>${formatDate(new Date())}</p>
<p>Dear ${clientName},</p>
<p>After careful review of your claim <strong>${claim.claimNumber}</strong>, we regret to inform you that your claim has been denied.</p>
<p><strong>Reason:</strong> ${reason}</p>
<p>You have the right to appeal this decision within 60 days. Please contact us if you have questions or additional documentation to support your claim.</p>
<p>Sincerely,<br><strong>InsureFlow Claims Department</strong></p>
</body></html>`;
}

export function claimSettlementHTML(claim: any, amount: number): string {
  const clientName = claim.client?.businessName || `${claim.client?.firstName} ${claim.client?.lastName}`;

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Settlement Offer</title>
<style>body { font-family: Georgia, serif; margin: 40px; color: #333; line-height: 1.6; } .letterhead { border-bottom: 2px solid #1976d2; padding-bottom: 16px; margin-bottom: 30px; } .letterhead h1 { color: #1976d2; font-size: 20px; margin: 0; } .amount { font-size: 24px; font-weight: bold; color: #2e7d32; margin: 16px 0; }</style>
</head><body>
<div class="letterhead"><h1>InsureFlow Insurance</h1></div>
<p>Dear ${clientName},</p>
<p>We have completed our review of claim <strong>${claim.claimNumber}</strong> and are pleased to offer the following settlement:</p>
<p class="amount">$${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
<p>This amount reflects the covered losses minus your applicable deductible of $${Number(claim.deductible || 0).toLocaleString()}.</p>
<p>Sincerely,<br><strong>InsureFlow Claims Department</strong></p>
</body></html>`;
}
