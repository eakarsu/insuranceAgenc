export function invoiceHTML(data: {
  invoiceNumber: string;
  clientName: string;
  policyNumber: string;
  amount: number;
  dueDate: string;
  items?: { description: string; amount: number }[];
}): string {
  const items = data.items || [{ description: `Premium payment - ${data.policyNumber}`, amount: data.amount }];

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Invoice ${data.invoiceNumber}</title>
<style>
  body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
  .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
  .logo h1 { color: #1976d2; margin: 0; } .invoice-info { text-align: right; }
  .invoice-number { font-size: 24px; font-weight: bold; color: #1976d2; }
  table { width: 100%; border-collapse: collapse; margin: 20px 0; }
  th { background: #1976d2; color: white; padding: 10px; text-align: left; }
  td { padding: 10px; border-bottom: 1px solid #ddd; }
  .total-row td { font-weight: bold; font-size: 18px; border-top: 2px solid #333; }
  .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }
</style></head><body>
<div class="header">
  <div class="logo"><h1>InsureFlow</h1><p>Insurance Services</p></div>
  <div class="invoice-info"><div class="invoice-number">INVOICE</div><p>#${data.invoiceNumber}</p><p>Due: ${data.dueDate}</p></div>
</div>
<p><strong>Bill To:</strong> ${data.clientName}</p>
<p><strong>Policy:</strong> ${data.policyNumber}</p>
<table>
  <thead><tr><th>Description</th><th style="text-align:right">Amount</th></tr></thead>
  <tbody>
    ${items.map(item => `<tr><td>${item.description}</td><td style="text-align:right">$${item.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td></tr>`).join('')}
    <tr class="total-row"><td>Total Due</td><td style="text-align:right">$${data.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td></tr>
  </tbody>
</table>
<div class="footer"><p>Payment is due by ${data.dueDate}. Please contact us if you have questions.</p></div>
</body></html>`;
}
