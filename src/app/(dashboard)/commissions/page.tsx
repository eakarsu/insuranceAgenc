'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  Box, Card, CardContent, Typography, Grid, Chip, Avatar, TextField, InputAdornment,
  FormControl, InputLabel, Select, MenuItem, Button, Paper, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton,
} from '@mui/material';
import {
  AttachMoney, TrendingUp, Schedule, CheckCircle, PictureAsPdf, Close, Edit, Delete,
  Search, FilterList, AccountBalance, Download,
} from '@mui/icons-material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format } from 'date-fns';

const COLORS = ['#1976d2', '#2e7d32', '#ed6c02', '#9c27b0'];

export default function CommissionsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString());
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [selectedCommission, setSelectedCommission] = useState<any>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  const { data: stats } = useQuery({
    queryKey: ['commissionStats', yearFilter],
    queryFn: async () => {
      const response = await axios.get(`/api/commissions/stats?year=${yearFilter}`);
      return response.data;
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ['commissions', page, pageSize, search, statusFilter, typeFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page + 1), limit: String(pageSize),
        ...(search && { search }), ...(statusFilter && { status: statusFilter }),
        ...(typeFilter && { type: typeFilter }),
      });
      const response = await axios.get(`/api/commissions?${params}`);
      return response.data;
    },
  });

  const commissions = data?.commissions || [];
  const totalCount = data?.pagination?.total || 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'success';
      case 'EARNED': return 'info';
      case 'PENDING': return 'warning';
      case 'REVERSED': case 'CHARGEDBACK': return 'error';
      default: return 'default';
    }
  };

  const formatType = (type: string) => {
    if (!type) return '-';
    return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const columns: GridColDef[] = [
    {
      field: 'policy', headerName: 'Policy #', width: 155,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" fontWeight={600} sx={{ color: '#e65100', fontSize: '0.9rem' }}>
          {params.row.policy?.policyNumber || '-'}
        </Typography>
      ),
    },
    {
      field: 'client', headerName: 'Client', flex: 1, minWidth: 180,
      renderCell: (params: GridRenderCellParams) => {
        const client = params.row.policy?.client;
        const name = client ? (client.businessName || `${client.firstName} ${client.lastName}`) : '-';
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {client && (
              <Avatar sx={{ width: 32, height: 32, fontSize: '0.75rem', bgcolor: '#1565c0', flexShrink: 0 }}>
                {client.businessName ? client.businessName[0] : `${client.firstName?.[0] || ''}${client.lastName?.[0] || ''}`}
              </Avatar>
            )}
            <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.875rem' }}>{name}</Typography>
          </Box>
        );
      },
    },
    {
      field: 'agent', headerName: 'Agent', width: 180,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {params.row.agent?.name && (
            <Avatar sx={{ width: 32, height: 32, fontSize: '0.75rem', bgcolor: '#f57c00', flexShrink: 0 }}>
              {params.row.agent.name.split(' ').map((n: string) => n[0]).join('')}
            </Avatar>
          )}
          <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>{params.row.agent?.name || '-'}</Typography>
        </Box>
      ),
    },
    {
      field: 'type', headerName: 'Type', width: 150,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>{formatType(params.value)}</Typography>
      ),
    },
    {
      field: 'basePremium', headerName: 'Base Premium', width: 140,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
          ${Number(params.value || 0).toLocaleString()}
        </Typography>
      ),
    },
    {
      field: 'rate', headerName: 'Rate', width: 90,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
          {params.value ? `${Number(params.value)}%` : '-'}
        </Typography>
      ),
    },
    {
      field: 'amount', headerName: 'Amount', width: 130,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight={700} sx={{ fontSize: '0.95rem', color: '#2e7d32' }}>
          ${Number(params.value || 0).toLocaleString()}
        </Typography>
      ),
    },
    {
      field: 'earnedDate', headerName: 'Earned Date', width: 125,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.84rem' }}>
          {params.value ? format(new Date(params.value), 'MMM d, yyyy') : '-'}
        </Typography>
      ),
    },
    {
      field: 'paidDate', headerName: 'Paid Date', width: 125,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.84rem' }}>
          {params.value ? format(new Date(params.value), 'MMM d, yyyy') : '-'}
        </Typography>
      ),
    },
    {
      field: 'status', headerName: 'Status', width: 130,
      renderCell: (params) => (
        <Chip label={params.value?.toString().charAt(0) + params.value?.toString().slice(1).toLowerCase()}
          size="small" color={getStatusColor(params.value as string) as any}
          sx={{ fontWeight: 600, borderRadius: '6px', minWidth: 72 }} />
      ),
    },
  ];

  const hasActiveFilters = search || statusFilter || typeFilter;

  return (
    <Box className="animate-fade-in">
      {/* Header */}
      <Paper elevation={0} sx={{
        p: 3, mb: 3, borderRadius: 3,
        background: 'linear-gradient(135deg, #e65100 0%, #f57c00 50%, #ff9800 100%)',
        color: 'white',
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.15)', width: 52, height: 52 }}>
              <AccountBalance sx={{ fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight={700}>Commission Tracker</Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>Track earnings and commission statements</Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Tooltip title="Export as PDF">
              <Button variant="outlined" size="small" startIcon={<PictureAsPdf />}
                onClick={() => window.open('/api/export/pdf?type=commissions', '_blank')}
                sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}>
                PDF
              </Button>
            </Tooltip>
            <Tooltip title="Export as CSV">
              <Button variant="outlined" size="small" startIcon={<Download />}
                onClick={() => {
                  const csv = [
                    ['Policy #', 'Agent', 'Type', 'Base Premium', 'Rate', 'Amount', 'Earned Date', 'Paid Date', 'Status'].join(','),
                    ...commissions.map((c: any) => [
                      c.policy?.policyNumber || '', c.agent?.name || '', c.type?.replace(/_/g, ' '),
                      Number(c.basePremium || 0), `${c.rate || 0}%`, Number(c.amount || 0),
                      c.earnedDate ? new Date(c.earnedDate).toLocaleDateString() : '',
                      c.paidDate ? new Date(c.paidDate).toLocaleDateString() : '', c.status,
                    ].join(','))
                  ].join('\n');
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a'); a.href = url;
                  a.download = `commissions-${new Date().toISOString().split('T')[0]}.csv`;
                  a.click(); URL.revokeObjectURL(url);
                }}
                sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}>
                CSV
              </Button>
            </Tooltip>
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <Select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)}
                sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' },
                  '& .MuiSvgIcon-root': { color: 'white' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
                }}>
                <MenuItem value="2026">2026</MenuItem>
                <MenuItem value="2025">2025</MenuItem>
                <MenuItem value="2024">2024</MenuItem>
                <MenuItem value="2023">2023</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>
      </Paper>

      {/* Stats Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Total Earned', value: `$${(stats?.totalEarned || 0).toLocaleString()}`, subtitle: 'This year', icon: <AttachMoney />, color: '#2e7d32', bg: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)' },
          { label: 'Pending', value: `$${(stats?.pending || 0).toLocaleString()}`, subtitle: 'Awaiting payment', icon: <Schedule />, color: '#e65100', bg: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)' },
          { label: 'Paid', value: `$${(stats?.paid || 0).toLocaleString()}`, subtitle: 'This year', icon: <CheckCircle />, color: '#1976d2', bg: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)' },
          { label: 'YoY Growth', value: `${stats?.growth || 0}%`, subtitle: 'vs last year', icon: <TrendingUp />, color: '#7b1fa2', bg: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)' },
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

      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 2.5 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>Monthly Commissions</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats?.monthlyData || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" /><YAxis /><RechartsTooltip />
                  <Bar dataKey="newBusiness" name="New Business" fill="#1976d2" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="renewal" name="Renewal" fill="#2e7d32" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 2.5 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>By Type</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={stats?.byType || []} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                    {(stats?.byType || []).map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2, justifyContent: 'center' }}>
                {(stats?.byType || []).map((entry: any, index: number) => (
                  <Chip key={entry.name} label={entry.name} size="small"
                    sx={{ backgroundColor: COLORS[index % COLORS.length], color: '#fff' }} />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 2, borderRadius: 2.5, overflow: 'visible' }}>
        <CardContent sx={{ py: 2, px: 2.5, '&:last-child': { pb: 2 } }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField fullWidth size="small" placeholder="Search by policy #, agent name..."
                value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ color: 'text.secondary' }} /></InputAdornment> }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'grey.50' } }} />
            </Grid>
            <Grid item xs={6} sm={3} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select value={statusFilter} label="Status" onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }} sx={{ borderRadius: 2 }}>
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="PENDING">Pending</MenuItem>
                  <MenuItem value="EARNED">Earned</MenuItem>
                  <MenuItem value="PAID">Paid</MenuItem>
                  <MenuItem value="REVERSED">Reversed</MenuItem>
                  <MenuItem value="CHARGEDBACK">Chargedback</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={3} md={2.5}>
              <FormControl fullWidth size="small">
                <InputLabel>Type</InputLabel>
                <Select value={typeFilter} label="Type" onChange={(e) => { setTypeFilter(e.target.value); setPage(0); }} sx={{ borderRadius: 2 }}>
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="NEW_BUSINESS">New Business</MenuItem>
                  <MenuItem value="RENEWAL">Renewal</MenuItem>
                  <MenuItem value="ENDORSEMENT">Endorsement</MenuItem>
                  <MenuItem value="OVERRIDE">Override</MenuItem>
                  <MenuItem value="BONUS">Bonus</MenuItem>
                  <MenuItem value="CONTINGENCY">Contingency</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3.5}>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                {hasActiveFilters && (
                  <Button variant="text" size="small" startIcon={<FilterList />}
                    onClick={() => { setSearch(''); setStatusFilter(''); setTypeFilter(''); setPage(0); }}
                    sx={{ textTransform: 'none' }}>
                    Clear All
                  </Button>
                )}
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Data Grid */}
      <Card sx={{ borderRadius: 2.5, overflow: 'hidden' }}>
        <DataGrid
          rows={commissions} columns={columns} rowCount={totalCount}
          loading={isLoading} pageSizeOptions={[10, 25, 50]} paginationMode="server"
          paginationModel={{ page, pageSize }}
          onPaginationModelChange={(model) => { setPage(model.page); setPageSize(model.pageSize); }}
          disableRowSelectionOnClick
          onRowClick={(params) => { setSelectedCommission(params.row); setDetailDialogOpen(true); }}
          rowHeight={72}
          sx={{
            border: 'none',
            '& .MuiDataGrid-columnHeaders': { bgcolor: 'grey.50', borderBottom: '2px solid', borderColor: 'divider' },
            '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: 0.5, color: 'text.secondary' },
            '& .MuiDataGrid-row': { cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } },
            '& .MuiDataGrid-cell': { borderColor: 'grey.100', },
            '& .MuiDataGrid-footerContainer': { borderTop: '2px solid', borderColor: 'divider' },
          }}
          autoHeight
        />
      </Card>

      {/* Row Detail Dialog */}
      <Dialog open={detailDialogOpen} onClose={() => setDetailDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}>
        <Box sx={{ background: 'linear-gradient(135deg, #e65100 0%, #f57c00 50%, #ff9800 100%)', color: 'white', px: 3, py: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.15)', width: 52, height: 52 }}>
              <AttachMoney sx={{ fontSize: 28 }} />
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" fontWeight={700}>Commission Details</Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                <Chip label={selectedCommission?.status?.charAt(0) + (selectedCommission?.status?.slice(1).toLowerCase() || '')}
                  size="small" sx={{ fontWeight: 700, bgcolor: 'rgba(255,255,255,0.2)', color: 'white', borderRadius: '6px' }} />
                <Chip label={formatType(selectedCommission?.type || '')}
                  size="small" sx={{ fontWeight: 700, bgcolor: 'rgba(255,255,255,0.2)', color: 'white', borderRadius: '6px' }} />
              </Box>
            </Box>
            <IconButton onClick={() => setDetailDialogOpen(false)} size="small" sx={{ color: 'white' }}><Close /></IconButton>
          </Box>
        </Box>
        <DialogContent dividers>
          <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 1 }}>Policy & Agent</Typography>
          <Paper variant="outlined" sx={{ p: 2, mb: 2.5, mt: 1, borderRadius: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Policy</Typography>
                <Typography variant="body2" fontWeight={600}>{selectedCommission?.policy?.policyNumber || '-'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Agent</Typography>
                <Typography variant="body2">{selectedCommission?.agent?.name || '-'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Type</Typography>
                <Typography variant="body2">{formatType(selectedCommission?.type || '')}</Typography>
              </Grid>
            </Grid>
          </Paper>

          <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 1 }}>Financial</Typography>
          <Paper variant="outlined" sx={{ p: 2, mb: 2.5, mt: 1, borderRadius: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <Box sx={{ textAlign: 'center', p: 1 }}>
                  <Typography variant="caption" color="text.secondary">Base Premium</Typography>
                  <Typography variant="h6" fontWeight={700} color="text.primary">${Number(selectedCommission?.basePremium || 0).toLocaleString()}</Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box sx={{ textAlign: 'center', p: 1 }}>
                  <Typography variant="caption" color="text.secondary">Rate</Typography>
                  <Typography variant="h6" fontWeight={700} color="info.main">{selectedCommission?.rate || 0}%</Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box sx={{ textAlign: 'center', p: 1 }}>
                  <Typography variant="caption" color="text.secondary">Amount</Typography>
                  <Typography variant="h6" fontWeight={700} color="success.main">${Number(selectedCommission?.amount || 0).toLocaleString()}</Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>

          <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 1 }}>Dates</Typography>
          <Paper variant="outlined" sx={{ p: 2, mt: 1, borderRadius: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Earned Date</Typography>
                <Typography variant="body2">{selectedCommission?.earnedDate ? format(new Date(selectedCommission.earnedDate), 'MMM d, yyyy') : '-'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Paid Date</Typography>
                <Typography variant="body2">{selectedCommission?.paidDate ? format(new Date(selectedCommission.paidDate), 'MMM d, yyyy') : '-'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Statement ID</Typography>
                <Typography variant="body2">{selectedCommission?.statementId || '-'}</Typography>
              </Grid>
            </Grid>
          </Paper>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider', justifyContent: 'space-between' }}>
          <Button color="error" variant="outlined" startIcon={<Delete />} onClick={async () => {
            if (confirm('Delete this commission record?')) {
              try {
                await axios.delete(`/api/commissions/${selectedCommission?.id}`);
                queryClient.invalidateQueries({ queryKey: ['commissions'] });
                setDetailDialogOpen(false);
              } catch (e) { console.error('Failed to delete'); }
            }
          }} sx={{ borderRadius: 2 }}>Delete</Button>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button onClick={() => setDetailDialogOpen(false)} sx={{ borderRadius: 2 }}>Close</Button>
            <Button variant="contained" startIcon={<Edit />} onClick={() => { setDetailDialogOpen(false); router.push(`/policies/${selectedCommission?.policy?.id}`); }}
              sx={{ borderRadius: 2, bgcolor: '#e65100', '&:hover': { bgcolor: '#bf360c' } }}>
              Edit Commission
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
