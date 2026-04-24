export function policyDeclarationHTML(policy: any): string {
  const clientName = policy.client?.businessName || `${policy.client?.firstName} ${policy.client?.lastName}`;
  const premium = Number(policy.premium || 0);
  const formatDate = (d: any) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A';
  const lob = (policy.lineOfBusiness || '').replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Policy Declaration - ${policy.policyNumber}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', sans-serif; color: #333; }
  .header { background: linear-gradient(135deg, #1565c0, #42a5f5); color: white; padding: 40px; text-align: center; }
  .header h1 { font-size: 24px; margin-bottom: 8px; }
  .header .sub { font-size: 12px; text-transform: uppercase; letter-spacing: 2px; opacity: 0.9; }
  .badge { display: inline-block; background: rgba(255,255,255,0.2); padding: 6px 16px; border-radius: 20px; margin-top: 10px; font-size: 13px; }
  .section { padding: 20px 40px; border-bottom: 1px solid #e0e0e0; }
  .section-title { font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #1976d2; font-weight: 700; margin-bottom: 12px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .field-label { font-size: 10px; text-transform: uppercase; color: #888; }
  .field-value { font-size: 14px; font-weight: 600; }
  .premium-box { background: #e8f5e9; border-radius: 12px; padding: 20px; text-align: center; margin: 12px 0; }
  .premium-amount { font-size: 32px; font-weight: 800; color: #2e7d32; }
  .footer { padding: 20px 40px; text-align: center; font-size: 11px; color: #999; }
</style></head><body>
<div class="header"><div class="sub">Insurance Policy Declaration</div><h1>${policy.policyNumber}</h1><div class="badge">${lob}</div></div>
<div class="section"><div class="section-title">Policy Information</div><div class="grid">
  <div><div class="field-label">Policy Number</div><div class="field-value">${policy.policyNumber}</div></div>
  <div><div class="field-label">Status</div><div class="field-value">${policy.status}</div></div>
  <div><div class="field-label">Effective Date</div><div class="field-value">${formatDate(policy.effectiveDate)}</div></div>
  <div><div class="field-label">Expiration Date</div><div class="field-value">${formatDate(policy.expirationDate)}</div></div>
</div></div>
<div class="section"><div class="section-title">Named Insured</div><div class="grid">
  <div><div class="field-label">Name</div><div class="field-value">${clientName}</div></div>
  <div><div class="field-label">Email</div><div class="field-value">${policy.client?.email || 'N/A'}</div></div>
</div></div>
<div class="section"><div class="section-title">Carrier</div><div class="field-value">${policy.carrier?.name || 'N/A'}</div></div>
<div class="section"><div class="section-title">Premium</div><div class="premium-box">
  <div style="font-size:11px;color:#666;text-transform:uppercase;">Total Annual Premium</div>
  <div class="premium-amount">$${premium.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
</div></div>
<div class="section"><div class="section-title">Agent</div><div class="field-value">${policy.agent?.name || 'N/A'}</div></div>
<div class="footer"><p>This is a summary declaration. Refer to your full policy for complete terms and conditions.</p>
<p>Generated ${formatDate(new Date())} | InsureFlow Platform</p></div>
</body></html>`;
}
