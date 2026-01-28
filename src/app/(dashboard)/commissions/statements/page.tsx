'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Box, Card, CardContent, Typography, Button, Grid, Chip, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Receipt, Download, Print } from '@mui/icons-material';
import { format } from 'date-fns';

export default function StatementsPage() {
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [month, setMonth] = useState((new Date().getMonth() + 1).toString());

  const { data, isLoading } = useQuery({
    queryKey: ['commission-statements', year, month],
    queryFn: async () => {
      const response = await axios.get(`/api/commissions?year=${year}&month=${month}`);
      return response.data;
    },
  });

  const columns: GridColDef[] = [
    {
      field: 'policy',
      headerName: 'Policy #',
      flex: 1,
      valueGetter: (value: any) => value?.policyNumber || '-',
    },
    {
      field: 'client',
      headerName: 'Client',
      flex: 1.5,
      valueGetter: (value: any, row: any) => {
        const client = row.policy?.client;
        return client ? `${client.firstName} ${client.lastName}` : '-';
      },
    },
    { field: 'type', headerName: 'Type', width: 150, valueFormatter: (value: string) => value?.replace(/_/g, ' ') },
    {
      field: 'basePremium',
      headerName: 'Premium',
      width: 120,
      valueFormatter: (value: number) => `$${(value || 0).toLocaleString()}`,
    },
    { field: 'rate', headerName: 'Rate', width: 80, valueFormatter: (value: number) => `${value}%` },
    {
      field: 'amount',
      headerName: 'Commission',
      width: 120,
      valueFormatter: (value: number) => `$${(value || 0).toLocaleString()}`,
    },
    {
      field: 'earnedDate',
      headerName: 'Earned Date',
      width: 120,
      valueFormatter: (value: string) => value ? format(new Date(value), 'MM/dd/yyyy') : '-',
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 100,
      renderCell: (params) => (
        <Chip label={params.value} size="small" color={params.value === 'PAID' ? 'success' : 'warning'} />
      ),
    },
  ];

  const totalEarned = data?.commissions?.reduce((sum: number, c: any) => sum + Number(c.amount || 0), 0) || 0;

  return (
    <Box className="animate-fade-in">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>Commission Statements</Typography>
          <Typography color="text.secondary">Monthly commission statements and reports</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Print />}
            onClick={() => window.print()}
          >
            Print
          </Button>
          <Button
            variant="contained"
            startIcon={<Download />}
            onClick={() => {
              const commissions = data?.commissions || [];
              const statementDate = format(new Date(parseInt(year), parseInt(month) - 1, 1), 'MMMM yyyy');

              // Create a printable HTML document for PDF export
              const printWindow = window.open('', '_blank');
              if (!printWindow) return;

              const totalAmount = commissions.reduce((sum: number, c: any) => sum + Number(c.amount || 0), 0);

              printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                  <title>Commission Statement - ${statementDate}</title>
                  <style>
                    body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
                    h1 { color: #1976d2; margin-bottom: 5px; }
                    .subtitle { color: #666; margin-bottom: 30px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th { background: #1976d2; color: white; padding: 12px; text-align: left; }
                    td { padding: 10px; border-bottom: 1px solid #eee; }
                    tr:hover { background: #f5f5f5; }
                    .total-row { background: #e3f2fd; font-weight: bold; }
                    .amount { text-align: right; }
                    .status-paid { color: #2e7d32; }
                    .status-pending { color: #ed6c02; }
                    .footer { margin-top: 30px; text-align: center; color: #666; font-size: 12px; }
                    @media print { body { padding: 20px; } }
                  </style>
                </head>
                <body>
                  <h1>Commission Statement</h1>
                  <p class="subtitle">${statementDate} | Generated on ${new Date().toLocaleDateString()}</p>

                  <table>
                    <thead>
                      <tr>
                        <th>Policy #</th>
                        <th>Client</th>
                        <th>Type</th>
                        <th class="amount">Premium</th>
                        <th class="amount">Rate</th>
                        <th class="amount">Commission</th>
                        <th>Earned Date</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${commissions.map((c: any) => `
                        <tr>
                          <td>${c.policy?.policyNumber || '-'}</td>
                          <td>${c.policy?.client ? `${c.policy.client.firstName} ${c.policy.client.lastName}` : '-'}</td>
                          <td>${c.type?.replace(/_/g, ' ') || '-'}</td>
                          <td class="amount">$${Number(c.basePremium || 0).toLocaleString()}</td>
                          <td class="amount">${c.rate}%</td>
                          <td class="amount">$${Number(c.amount || 0).toLocaleString()}</td>
                          <td>${c.earnedDate ? new Date(c.earnedDate).toLocaleDateString() : '-'}</td>
                          <td class="${c.status === 'PAID' ? 'status-paid' : 'status-pending'}">${c.status || '-'}</td>
                        </tr>
                      `).join('')}
                      <tr class="total-row">
                        <td colspan="5"><strong>Total</strong></td>
                        <td class="amount"><strong>$${totalAmount.toLocaleString()}</strong></td>
                        <td colspan="2"></td>
                      </tr>
                    </tbody>
                  </table>

                  <p class="footer">InsureFlow Agency Management System</p>

                  <script>
                    window.onload = function() {
                      window.print();
                    }
                  </script>
                </body>
                </html>
              `);
              printWindow.document.close();
            }}
          >
            Export PDF
          </Button>
        </Box>
      </Box>

      <Card sx={{ mb: 3, p: 2 }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Year</InputLabel>
            <Select value={year} label="Year" onChange={(e) => setYear(e.target.value)}>
              <MenuItem value="2025">2025</MenuItem>
              <MenuItem value="2024">2024</MenuItem>
              <MenuItem value="2023">2023</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Month</InputLabel>
            <Select value={month} label="Month" onChange={(e) => setMonth(e.target.value)}>
              {Array.from({ length: 12 }, (_, i) => (
                <MenuItem key={i + 1} value={(i + 1).toString()}>
                  {format(new Date(2024, i, 1), 'MMMM')}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Card>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12}>
          <Card>
            <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h6" fontWeight={600}>
                  Statement for {format(new Date(parseInt(year), parseInt(month) - 1, 1), 'MMMM yyyy')}
                </Typography>
                <Typography color="text.secondary">
                  {data?.commissions?.length || 0} commission entries
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="body2" color="text.secondary">Total Earnings</Typography>
                <Typography variant="h4" fontWeight={700} color="success.main">
                  ${totalEarned.toLocaleString()}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <DataGrid
          rows={data?.commissions || []}
          columns={columns}
          loading={isLoading}
          pageSizeOptions={[10, 25, 50]}
          disableRowSelectionOnClick
          sx={{ border: 'none' }}
          autoHeight
        />
      </Card>
    </Box>
  );
}
