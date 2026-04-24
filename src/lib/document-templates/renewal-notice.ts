export function renewalNoticeHTML(policy: any): string {
  const clientName = policy.client?.businessName || `${policy.client?.firstName} ${policy.client?.lastName}`;
  const premium = Number(policy.premium || 0);
  const formatDate = (d: any) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A';

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Renewal Notice</title>
<style>
  body { font-family: 'Segoe UI', sans-serif; margin: 40px; color: #333; }
  .header { background: #ff9800; color: white; padding: 24px; border-radius: 8px; text-align: center; margin-bottom: 24px; }
  .details { background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 16px 0; }
  .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e0e0e0; }
  .label { color: #666; font-size: 13px; } .value { font-weight: 600; }
</style></head><body>
<div class="header"><h2>RENEWAL NOTICE</h2><p>Your policy is expiring soon</p></div>
<p>Dear ${clientName},</p>
<p>Your insurance policy is scheduled for renewal. Please review the details below:</p>
<div class="details">
  <div class="row"><span class="label">Policy Number</span><span class="value">${policy.policyNumber}</span></div>
  <div class="row"><span class="label">Current Expiration</span><span class="value">${formatDate(policy.expirationDate)}</span></div>
  <div class="row"><span class="label">Current Premium</span><span class="value">$${premium.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></div>
  <div class="row"><span class="label">Carrier</span><span class="value">${policy.carrier?.name || 'N/A'}</span></div>
</div>
<p>To ensure uninterrupted coverage, please contact your agent ${policy.agent?.name || ''} to discuss renewal options.</p>
<p>Best regards,<br><strong>InsureFlow Insurance</strong></p>
</body></html>`;
}
