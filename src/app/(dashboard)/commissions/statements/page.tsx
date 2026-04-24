'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  Box, Card, CardContent, Typography, Button, Grid, Chip, FormControl, InputLabel, Select, MenuItem,
  Paper, Avatar, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Divider,
  TextField, InputAdornment,
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import {
  Receipt, Download, PictureAsPdf, AttachMoney, Schedule, CheckCircle, TrendingUp, Close, Policy, Person, Search, Edit, Delete,
} from '@mui/icons-material';
import { format } from 'date-fns';

export default function StatementsPage() {
  const queryClient = useQueryClient();
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [month, setMonth] = useState((new Date().getMonth() + 1).toString());
  const [search, setSearch] = useState('');
  const [selectedCommission, setSelectedCommission] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['commission-statements', year, month],
    queryFn: async () => {
      const response = await axios.get(`/api/commissions?year=${year}&month=${month}&limit=500`);
      return response.data;
    },
  });

  const commissions = data?.commissions || [];
  const totalEarned = commissions.reduce((sum: number, c: any) => sum + Number(c.amount || 0), 0);
  const totalPaid = commissions.filter((c: any) => c.status === 'PAID').reduce((sum: number, c: any) => sum + Number(c.amount || 0), 0);
  const totalPending = commissions.filter((c: any) => c.status !== 'PAID').reduce((sum: number, c: any) => sum + Number(c.amount || 0), 0);
  const statementDate = format(new Date(parseInt(year), parseInt(month) - 1, 1), 'MMMM yyyy');

  const filteredCommissions = commissions.filter((c: any) => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    const policyNumber = (c.policy?.policyNumber || '').toLowerCase();
    const client = c.policy?.client;
    const clientName = client
      ? (client.businessName || `${client.firstName || ''} ${client.lastName || ''}`).toLowerCase()
      : '';
    const agentName = (c.agent?.name || '').toLowerCase();
    const amount = `$${(Number(c.amount) || 0).toLocaleString()}`.toLowerCase();
    const status = (c.status || '').toLowerCase();
    return (
      policyNumber.includes(s) ||
      clientName.includes(s) ||
      agentName.includes(s) ||
      amount.includes(s) ||
      String(c.amount || '').includes(s) ||
      status.includes(s)
    );
  });

  const columns: GridColDef[] = [
    {
      field: 'policy', headerName: 'Policy #', width: 155,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" fontWeight={700} sx={{ color: '#e65100', fontSize: '0.9rem' }}>
          {params.value?.policyNumber || '-'}
        </Typography>
      ),
    },
    {
      field: 'client', headerName: 'Client', flex: 1.5, minWidth: 200,
      renderCell: (params: GridRenderCellParams) => {
        const client = params.row.policy?.client;
        const name = client ? (client.businessName || `${client.firstName} ${client.lastName}`) : '-';
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {client && (
              <Avatar sx={{ width: 36, height: 36, fontSize: '0.75rem', bgcolor: '#f57c00', flexShrink: 0 }}>
                {client.businessName ? client.businessName[0] : `${client.firstName?.[0] || ''}${client.lastName?.[0] || ''}`}
              </Avatar>
            )}
            <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.9rem' }}>
              {name}
            </Typography>
          </Box>
        );
      },
    },
    {
      field: 'type', headerName: 'Type', width: 150,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
          {params.value?.replace(/_/g, ' ') || '-'}
        </Typography>
      ),
    },
    {
      field: 'basePremium', headerName: 'Premium', width: 130,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
          ${(Number(params.value) || 0).toLocaleString()}
        </Typography>
      ),
    },
    {
      field: 'rate', headerName: 'Rate', width: 90,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
          {params.value ? `${params.value}%` : '-'}
        </Typography>
      ),
    },
    {
      field: 'amount', headerName: 'Commission', width: 130,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight={700} sx={{ fontSize: '0.95rem', color: '#2e7d32' }}>
          ${(Number(params.value) || 0).toLocaleString()}
        </Typography>
      ),
    },
    {
      field: 'earnedDate', headerName: 'Earned Date', width: 130,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.84rem' }}>
          {params.value ? format(new Date(params.value), 'MMM d, yyyy') : '-'}
        </Typography>
      ),
    },
    {
      field: 'status', headerName: 'Status', width: 110,
      renderCell: (params) => (
        <Chip label={params.value} size="small" color={params.value === 'PAID' ? 'success' : 'warning'}
          sx={{ fontWeight: 600, borderRadius: '6px', minWidth: 72 }} />
      ),
    },
  ];

  return (
    <Box className="animate-fade-in">
      {/* Gradient Header */}
      <Paper elevation={0} sx={{
        p: 3, mb: 3, borderRadius: 3,
        background: 'linear-gradient(135deg, #e65100 0%, #f57c00 50%, #ff9800 100%)',
        color: 'white',
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.15)', width: 52, height: 52 }}>
              <Receipt sx={{ fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight={700}>Commission Statements</Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>Monthly commission statements and reports</Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Export as PDF">
              <Button variant="outlined" size="small" startIcon={<PictureAsPdf />}
                onClick={() => {
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
                        h1 { color: #e65100; margin-bottom: 5px; }
                        .subtitle { color: #666; margin-bottom: 30px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th { background: #e65100; color: white; padding: 12px; text-align: left; }
                        td { padding: 10px; border-bottom: 1px solid #eee; }
                        tr:hover { background: #f5f5f5; }
                        .total-row { background: #fff3e0; font-weight: bold; }
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
                      <script>window.onload = function() { window.print(); }</script>
                    </body>
                    </html>
                  `);
                  printWindow.document.close();
                }}
                sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}>
                PDF
              </Button>
            </Tooltip>
            <Tooltip title="Export as CSV">
              <Button variant="outlined" size="small" startIcon={<Download />}
                onClick={() => {
                  const csv = [
                    ['Policy #', 'Client', 'Type', 'Premium', 'Rate', 'Commission', 'Earned Date', 'Status'].join(','),
                    ...commissions.map((c: any) => [
                      c.policy?.policyNumber || '',
                      `"${c.policy?.client ? `${c.policy.client.firstName} ${c.policy.client.lastName}` : '-'}"`,
                      c.type?.replace(/_/g, ' ') || '',
                      Number(c.basePremium || 0),
                      `${c.rate || 0}%`,
                      Number(c.amount || 0),
                      c.earnedDate ? new Date(c.earnedDate).toLocaleDateString() : '',
                      c.status || '',
                    ].join(','))
                  ].join('\n');
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a'); a.href = url;
                  a.download = `commission-statement-${year}-${month}.csv`;
                  a.click(); URL.revokeObjectURL(url);
                }}
                sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}>
                CSV
              </Button>
            </Tooltip>
          </Box>
        </Box>
      </Paper>

      {/* Stats Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Total Earnings', value: `$${totalEarned.toLocaleString()}`, subtitle: statementDate, icon: <AttachMoney />, color: '#2e7d32', bg: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)' },
          { label: 'Paid', value: `$${totalPaid.toLocaleString()}`, subtitle: 'Completed payments', icon: <CheckCircle />, color: '#1976d2', bg: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)' },
          { label: 'Pending', value: `$${totalPending.toLocaleString()}`, subtitle: 'Awaiting payment', icon: <Schedule />, color: '#e65100', bg: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)' },
          { label: 'Entries', value: commissions.length, subtitle: 'Commission records', icon: <TrendingUp />, color: '#7b1fa2', bg: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)' },
        ].map((stat) => (
          <Grid item xs={6} sm={3} key={stat.label}>
            <Paper elevation={0} sx={{
              p: 2.5, borderRadius: 2.5, background: stat.bg, border: '1px solid', borderColor: 'divider',
              transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-2px)' },
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.68rem' }}>
                    {stat.label}
                  </Typography>
                  <Typography variant="h4" fontWeight={700} sx={{ color: stat.color, mt: 0.5 }}>
                    {stat.value}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">{stat.subtitle}</Typography>
                </Box>
                <Avatar sx={{ bgcolor: `${stat.color}20`, color: stat.color, width: 42, height: 42 }}>
                  {stat.icon}
                </Avatar>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Year/Month Filter Bar */}
      <Card sx={{ mb: 2, borderRadius: 2.5, overflow: 'visible' }}>
        <CardContent sx={{ py: 2, px: 2.5, '&:last-child': { pb: 2 } }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={6} sm={3} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Year</InputLabel>
                <Select value={year} label="Year" onChange={(e) => setYear(e.target.value)} sx={{ borderRadius: 2, bgcolor: 'grey.50' }}>
                  <MenuItem value="2026">2026</MenuItem>
                  <MenuItem value="2025">2025</MenuItem>
                  <MenuItem value="2024">2024</MenuItem>
                  <MenuItem value="2023">2023</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={3} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Month</InputLabel>
                <Select value={month} label="Month" onChange={(e) => setMonth(e.target.value)} sx={{ borderRadius: 2, bgcolor: 'grey.50' }}>
                  {Array.from({ length: 12 }, (_, i) => (
                    <MenuItem key={i + 1} value={(i + 1).toString()}>
                      {format(new Date(2024, i, 1), 'MMMM')}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                size="small"
                fullWidth
                placeholder="Search by policy, client, agent, amount, status..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: 'text.secondary', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'grey.50' } }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Showing statement for <strong>{statementDate}</strong>
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Data Grid */}
      <Card sx={{ borderRadius: 2.5, overflow: 'hidden' }}>
        <DataGrid
          rows={filteredCommissions}
          columns={columns}
          loading={isLoading}
          pageSizeOptions={[10, 25, 50]}
          disableRowSelectionOnClick
          onRowClick={(params) => { setSelectedCommission(params.row); setDetailOpen(true); }}
          rowHeight={72}
          sx={{
            border: 'none',
            '& .MuiDataGrid-columnHeaders': { bgcolor: 'grey.50', borderBottom: '2px solid', borderColor: 'divider' },
            '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: 0.5, color: 'text.secondary' },
            '& .MuiDataGrid-row': { cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } },
            '& .MuiDataGrid-cell': { borderColor: 'grey.100' },
            '& .MuiDataGrid-footerContainer': { borderTop: '2px solid', borderColor: 'divider' },
          }}
          autoHeight
        />
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}>
        <Box sx={{ background: 'linear-gradient(135deg, #e65100 0%, #f57c00 50%, #ff9800 100%)', color: 'white', px: 3, py: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.15)', width: 52, height: 52 }}>
              <Receipt sx={{ fontSize: 28 }} />
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" fontWeight={700}>Commission Detail</Typography>
              <Typography variant="body2" sx={{ opacity: 0.85 }}>
                {selectedCommission?.policy?.policyNumber || '-'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Chip label={selectedCommission?.status} size="small" sx={{ fontWeight: 700, fontSize: '0.8rem', bgcolor: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }} />
              <Chip label={selectedCommission?.type?.replace(/_/g, ' ')} size="small" sx={{ fontWeight: 600, fontSize: '0.75rem', bgcolor: 'rgba(255,255,255,0.15)', color: 'white' }} />
            </Box>
          </Box>
        </Box>
        <DialogContent sx={{ px: 3, py: 3 }}>
          {/* Policy & Client */}
          <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 1 }}>Policy & Client</Typography>
          <Paper variant="outlined" sx={{ p: 2, mb: 2.5, mt: 1, borderRadius: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Policy Number</Typography>
                <Typography variant="body2" fontWeight={600} sx={{ color: '#e65100' }}>
                  {selectedCommission?.policy?.policyNumber || '-'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Line of Business</Typography>
                <Typography variant="body2">
                  {selectedCommission?.policy?.lineOfBusiness?.replace(/_/g, ' ') || '-'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Client</Typography>
                <Typography variant="body2" fontWeight={600}>
                  {selectedCommission?.policy?.client?.businessName || `${selectedCommission?.policy?.client?.firstName || ''} ${selectedCommission?.policy?.client?.lastName || ''}`.trim() || '-'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Agent</Typography>
                <Typography variant="body2">{selectedCommission?.agent?.name || '-'}</Typography>
              </Grid>
            </Grid>
          </Paper>

          {/* Financial Details */}
          <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 1 }}>Financial Details</Typography>
          <Paper variant="outlined" sx={{ p: 2, mb: 2.5, mt: 1, borderRadius: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <Typography variant="caption" color="text.secondary">Base Premium</Typography>
                <Typography variant="body2" fontWeight={600}>
                  ${Number(selectedCommission?.basePremium || 0).toLocaleString()}
                </Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="caption" color="text.secondary">Commission Rate</Typography>
                <Typography variant="body2" fontWeight={600}>
                  {selectedCommission?.rate ? `${selectedCommission.rate}%` : '-'}
                </Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="caption" color="text.secondary">Commission Amount</Typography>
                <Typography variant="h6" fontWeight={700} sx={{ color: '#2e7d32' }}>
                  ${Number(selectedCommission?.amount || 0).toLocaleString()}
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          {/* Dates */}
          <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 1 }}>Dates</Typography>
          <Paper variant="outlined" sx={{ p: 2, mt: 1, borderRadius: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <Typography variant="caption" color="text.secondary">Earned Date</Typography>
                <Typography variant="body2">
                  {selectedCommission?.earnedDate ? format(new Date(selectedCommission.earnedDate), 'MMM d, yyyy') : '-'}
                </Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="caption" color="text.secondary">Paid Date</Typography>
                <Typography variant="body2" sx={{ color: selectedCommission?.paidDate ? '#2e7d32' : 'text.secondary' }}>
                  {selectedCommission?.paidDate ? format(new Date(selectedCommission.paidDate), 'MMM d, yyyy') : 'Not yet paid'}
                </Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="caption" color="text.secondary">Statement Date</Typography>
                <Typography variant="body2">
                  {selectedCommission?.statementDate ? format(new Date(selectedCommission.statementDate), 'MMM yyyy') : '-'}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider', justifyContent: 'space-between' }}>
          <Button color="error" variant="outlined" startIcon={<Delete />} onClick={async () => { if (confirm('Delete this commission record?')) { try { await axios.delete(`/api/commissions/${selectedCommission?.id}`); queryClient.invalidateQueries({ queryKey: ['commission-statements'] }); setDetailOpen(false); } catch {} } }} sx={{ borderRadius: 2 }}>Delete</Button>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button onClick={() => setDetailOpen(false)} sx={{ borderRadius: 2 }}>Close</Button>
            <Button variant="contained" startIcon={<Edit />} onClick={() => setDetailOpen(false)} sx={{ borderRadius: 2, bgcolor: '#e65100', '&:hover': { bgcolor: '#bf360c' } }}>Edit</Button>
          </Box>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
