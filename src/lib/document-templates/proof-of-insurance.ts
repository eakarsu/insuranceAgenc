export function proofOfInsuranceHTML(policy: any): string {
  const clientName = policy.client?.businessName || `${policy.client?.firstName} ${policy.client?.lastName}`;
  const lob = (policy.lineOfBusiness || '').replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
  const formatDate = (d: any) => d ? new Date(d).toLocaleDateString('en-US') : 'N/A';

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Proof of Insurance</title>
<style>
  body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
  .card { border: 2px solid #1976d2; border-radius: 12px; max-width: 400px; margin: 0 auto; overflow: hidden; }
  .card-header { background: #1976d2; color: white; padding: 16px; text-align: center; }
  .card-header h2 { margin: 0; font-size: 16px; }
  .card-body { padding: 16px; }
  .row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #eee; }
  .label { font-size: 10px; text-transform: uppercase; color: #666; }
  .value { font-size: 13px; font-weight: 600; }
  .card-footer { background: #f5f5f5; padding: 10px; text-align: center; font-size: 10px; color: #666; }
</style></head><body>
<div class="card">
  <div class="card-header"><h2>PROOF OF INSURANCE</h2><div style="font-size:11px;opacity:0.8">InsureFlow Insurance</div></div>
  <div class="card-body">
    <div class="row"><div><div class="label">Insured</div><div class="value">${clientName}</div></div></div>
    <div class="row"><div><div class="label">Policy Number</div><div class="value">${policy.policyNumber}</div></div></div>
    <div class="row"><div><div class="label">Type</div><div class="value">${lob}</div></div></div>
    <div class="row"><div><div class="label">Carrier</div><div class="value">${policy.carrier?.name || 'N/A'}</div></div></div>
    <div class="row">
      <div><div class="label">Effective</div><div class="value">${formatDate(policy.effectiveDate)}</div></div>
      <div><div class="label">Expires</div><div class="value">${formatDate(policy.expirationDate)}</div></div>
    </div>
  </div>
  <div class="card-footer">This card certifies active insurance coverage as of ${formatDate(new Date())}</div>
</div></body></html>`;
}
