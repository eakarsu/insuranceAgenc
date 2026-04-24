'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  Box, Card, CardContent, Typography, Button, Chip, TextField, InputAdornment,
  Grid, Paper, Avatar, Tooltip, FormControl, InputLabel, Select, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton,
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import {
  Search, Cancel, PictureAsPdf, Download, FilterList, Close, Edit, Delete,
  DoNotDisturb, TrendingDown, AttachMoney, Business,
} from '@mui/icons-material';
import { format } from 'date-fns';

export default function CancellationsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [lobFilter, setLobFilter] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [selectedPolicy, setSelectedPolicy] = useState<any>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['cancelled-policies', search, lobFilter, page, pageSize],
    queryFn: async () => {
      const params = new URLSearchParams({
        status: 'CANCELLED,NON_RENEWED',
        page: String(page + 1),
        limit: String(pageSize),
        ...(search && { search }),
        ...(lobFilter && { lineOfBusiness: lobFilter }),
      });
      const response = await axios.get(`/api/policies?${params}`);
      return response.data;
    },
  });

  const policies = data?.policies || [];
  const totalCount = data?.pagination?.total || policies.length;

  const stats = useMemo(() => {
    const totalLostPremium = policies.reduce((sum: number, p: any) => sum + Number(p.premium || 0), 0);
    const lobBreakdown: Record<string, number> = {};
    policies.forEach((p: any) => {
      const lob = p.lineOfBusiness?.replace(/_/g, ' ') || 'Unknown';
      lobBreakdown[lob] = (lobBreakdown[lob] || 0) + 1;
    });
    const topLob = Object.entries(lobBreakdown).sort(([, a], [, b]) => (b as number) - (a as number))[0];
    return { total: totalCount, totalLostPremium, topLob: topLob ? `${topLob[0]} (${topLob[1]})` : '-' };
  }, [policies, totalCount]);

  const linesOfBusiness = ['AUTO', 'HOME', 'COMMERCIAL_AUTO', 'GENERAL_LIABILITY', 'WORKERS_COMP', 'PROPERTY', 'UMBRELLA', 'LIFE', 'HEALTH'];

  const formatLob = (value: string) => {
    if (!value) return '-';
    return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const handleExportCsv = () => {
    const csv = [
      ['Policy #', 'Client', 'Line of Business', 'Carrier', 'Effective Date', 'Cancelled Date', 'Premium'].join(','),
      ...policies.map((p: any) => [
        p.policyNumber || '',
        `"${p.client?.businessName || `${p.client?.firstName || ''} ${p.client?.lastName || ''}`}"`,
        p.lineOfBusiness?.replace(/_/g, ' ') || '',
        `"${p.carrier?.name || ''}"`,
        p.effectiveDate ? format(new Date(p.effectiveDate), 'MM/dd/yyyy') : '',
        p.expirationDate ? format(new Date(p.expirationDate), 'MM/dd/yyyy') : '',
        Number(p.premium || 0),
      ].join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cancellations-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const hasActiveFilters = search || lobFilter;

  const columns: GridColDef[] = [
    {
      field: 'policyNumber', headerName: 'Policy #', width: 160,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight={700} sx={{ color: '#1565c0', fontSize: '0.9rem' }}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'client', headerName: 'Client', flex: 1.5, minWidth: 250,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, overflow: 'hidden' }}>
          <Avatar sx={{
            bgcolor: '#1976d2', width: 40, height: 40, fontSize: '0.9rem', fontWeight: 700, flexShrink: 0,
          }}>
            {params.row.client?.businessName
              ? <Business sx={{ fontSize: 20 }} />
              : `${params.row.client?.firstName?.[0] || ''}${params.row.client?.lastName?.[0] || ''}`}
          </Avatar>
          <Box sx={{ overflow: 'hidden' }}>
            <Typography variant="body1" fontWeight={600} sx={{ fontSize: '0.95rem', lineHeight: 1.4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {params.row.client?.businessName || `${params.row.client?.firstName} ${params.row.client?.lastName}`}
            </Typography>
            {params.row.client?.businessName && (
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', lineHeight: 1.3 }}>
                {params.row.client?.firstName} {params.row.client?.lastName}
              </Typography>
            )}
          </Box>
        </Box>
      ),
    },
    {
      field: 'lineOfBusiness', headerName: 'Line of Business', width: 160,
      renderCell: (params) => (
        <Chip label={formatLob(params.value)} size="small" variant="outlined"
          sx={{ fontWeight: 500, borderRadius: '6px', fontSize: '0.78rem' }} />
      ),
    },
    {
      field: 'carrier', headerName: 'Carrier', flex: 1, minWidth: 140,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>{params.row.carrier?.name || '-'}</Typography>
      ),
    },
    {
      field: 'effectiveDate', headerName: 'Effective', width: 130,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.84rem' }}>
          {params.value ? format(new Date(params.value), 'MMM d, yyyy') : '-'}
        </Typography>
      ),
    },
    {
      field: 'expirationDate', headerName: 'Cancelled', width: 130,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontSize: '0.84rem', color: '#c62828', fontWeight: 600 }}>
          {params.value ? format(new Date(params.value), 'MMM d, yyyy') : '-'}
        </Typography>
      ),
    },
    {
      field: 'premium', headerName: 'Premium', width: 130,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.9rem' }}>
          ${(Number(params.value) || 0).toLocaleString()}
        </Typography>
      ),
    },
    {
      field: 'status', headerName: 'Status', width: 140,
      renderCell: (params) => (
        <Chip
          label={params.value === 'NON_RENEWED' ? 'Non-Renewed' : 'Cancelled'}
          size="small"
          color={params.value === 'NON_RENEWED' ? 'warning' : 'error'}
          sx={{ fontWeight: 600, borderRadius: '6px', fontSize: '0.78rem' }}
        />
      ),
    },
  ];

  return (
    <Box className="animate-fade-in">
      {/* Gradient Header */}
      <Paper elevation={0} sx={{
        p: 3, mb: 3, borderRadius: 3,
        background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 50%, #42a5f5 100%)',
        color: 'white',
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.15)', width: 52, height: 52 }}>
              <Cancel sx={{ fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight={700}>Cancellations</Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>View cancelled and non-renewed policies</Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Export as PDF">
              <Button variant="outlined" size="small" startIcon={<PictureAsPdf />}
                onClick={() => window.open('/api/export/pdf?type=cancellations', '_blank')}
                sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}>
                PDF
              </Button>
            </Tooltip>
            <Tooltip title="Export as CSV">
              <Button variant="outlined" size="small" startIcon={<Download />}
                onClick={handleExportCsv}
                sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}>
                CSV
              </Button>
            </Tooltip>
          </Box>
        </Box>
      </Paper>

      {/* Summary Stat Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Total Cancelled', value: stats.total, icon: <DoNotDisturb />, color: '#c62828', bg: 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)' },
          { label: 'Lost Premium', value: `$${stats.totalLostPremium.toLocaleString()}`, icon: <TrendingDown />, color: '#e65100', bg: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)' },
          { label: 'Top Cancelled LOB', value: stats.topLob, icon: <AttachMoney />, color: '#1565c0', bg: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)' },
        ].map((stat) => (
          <Grid item xs={12} sm={4} key={stat.label}>
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
                </Box>
                <Avatar sx={{ bgcolor: `${stat.color}20`, color: stat.color, width: 42, height: 42 }}>
                  {stat.icon}
                </Avatar>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 2, borderRadius: 2.5, overflow: 'visible' }}>
        <CardContent sx={{ py: 2, px: 2.5, '&:last-child': { pb: 2 } }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={5}>
              <TextField fullWidth size="small" placeholder="Search by policy #, client name, carrier..."
                value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ color: 'text.secondary' }} /></InputAdornment> }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'grey.50' } }} />
            </Grid>
            <Grid item xs={6} sm={3} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Line of Business</InputLabel>
                <Select value={lobFilter} label="Line of Business" onChange={(e) => { setLobFilter(e.target.value); setPage(0); }} sx={{ borderRadius: 2 }}>
                  <MenuItem value="">All</MenuItem>
                  {linesOfBusiness.map(l => <MenuItem key={l} value={l}>{formatLob(l)}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={3} md={4}>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                {hasActiveFilters && (
                  <Button variant="text" size="small" startIcon={<FilterList />}
                    onClick={() => { setSearch(''); setLobFilter(''); setPage(0); }}
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
          rows={policies}
          columns={columns}
          rowCount={totalCount}
          loading={isLoading}
          pageSizeOptions={[10, 25, 50]}
          paginationMode="server"
          paginationModel={{ page, pageSize }}
          onPaginationModelChange={(model) => { setPage(model.page); setPageSize(model.pageSize); }}
          disableRowSelectionOnClick
          onRowClick={(params) => { setSelectedPolicy(params.row); setDetailDialogOpen(true); }}
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

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onClose={() => setDetailDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}>
        <Box sx={{ background: 'linear-gradient(135deg, #b71c1c 0%, #c62828 50%, #ef5350 100%)', color: 'white', px: 3, py: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.15)', width: 52, height: 52 }}>
              <Cancel sx={{ fontSize: 28 }} />
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" fontWeight={700}>{selectedPolicy?.policyNumber || 'Policy Details'}</Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                <Chip label="Cancelled" size="small" sx={{ fontWeight: 700, bgcolor: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }} />
                {selectedPolicy?.lineOfBusiness && (
                  <Chip label={formatLob(selectedPolicy.lineOfBusiness)} size="small" sx={{ fontWeight: 600, bgcolor: 'rgba(255,255,255,0.15)', color: 'white' }} />
                )}
              </Box>
            </Box>
          </Box>
        </Box>
        <DialogContent sx={{ px: 3, py: 3 }}>
          <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 1 }}>Client Information</Typography>
          <Paper variant="outlined" sx={{ p: 2, mb: 2.5, mt: 1, borderRadius: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Client Name</Typography>
                <Typography variant="body2" fontWeight={600}>
                  {selectedPolicy?.client?.businessName || `${selectedPolicy?.client?.firstName || ''} ${selectedPolicy?.client?.lastName || ''}`}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Carrier</Typography>
                <Typography variant="body2">{selectedPolicy?.carrier?.name || '-'}</Typography>
              </Grid>
            </Grid>
          </Paper>

          <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 1 }}>Policy Details</Typography>
          <Paper variant="outlined" sx={{ p: 2, mb: 2.5, mt: 1, borderRadius: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Policy Number</Typography>
                <Typography variant="body2" fontWeight={600}>{selectedPolicy?.policyNumber || '-'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Line of Business</Typography>
                <Typography variant="body2">{formatLob(selectedPolicy?.lineOfBusiness || '')}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Effective Date</Typography>
                <Typography variant="body2">
                  {selectedPolicy?.effectiveDate ? format(new Date(selectedPolicy.effectiveDate), 'MMM d, yyyy') : '-'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Cancellation Date</Typography>
                <Typography variant="body2" fontWeight={600} color="error.main">
                  {selectedPolicy?.expirationDate ? format(new Date(selectedPolicy.expirationDate), 'MMM d, yyyy') : '-'}
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 1 }}>Financial</Typography>
          <Paper variant="outlined" sx={{ p: 2, mt: 1, borderRadius: 2 }}>
            <Box sx={{ textAlign: 'center', p: 1 }}>
              <Typography variant="caption" color="text.secondary">Lost Premium</Typography>
              <Typography variant="h5" fontWeight={700} color="error.main">
                ${Number(selectedPolicy?.premium || 0).toLocaleString()}
              </Typography>
            </Box>
          </Paper>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider', justifyContent: 'space-between' }}>
          <Button color="error" variant="outlined" startIcon={<Delete />} onClick={async () => { if (confirm('Delete this cancelled policy?')) { try { await axios.delete(`/api/policies/${selectedPolicy?.id}`); queryClient.invalidateQueries({ queryKey: ['cancelled-policies'] }); setDetailDialogOpen(false); } catch {} } }} sx={{ borderRadius: 2 }}>Delete</Button>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button onClick={() => setDetailDialogOpen(false)} sx={{ borderRadius: 2 }}>Close</Button>
            <Button variant="contained" startIcon={<Edit />}
              onClick={() => { setDetailDialogOpen(false); router.push(`/policies/${selectedPolicy?.id}/edit`); }}
              sx={{ borderRadius: 2, bgcolor: '#1565c0', '&:hover': { bgcolor: '#0d47a1' } }}>
              Edit Policy
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
