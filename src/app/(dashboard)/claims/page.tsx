'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  Box, Button, Card, CardContent, Typography, TextField, InputAdornment, IconButton,
  Menu, MenuItem, Chip, Avatar, Grid, FormControl, InputLabel, Select, Dialog, DialogTitle,
  DialogContent, DialogActions, Snackbar, Alert,
  Paper, Tooltip, Divider, ListItemIcon, ListItemText,
} from '@mui/material';
import {
  Add, Search, MoreVert, Edit, Visibility, Assignment, Delete, PictureAsPdf,
  Close, DeleteSweep, Update, ReportProblem, Business, TrendingUp,
  CalendarMonth, FilterList, Gavel, AttachMoney, Warning, Download,
} from '@mui/icons-material';
import { DataGrid, GridColDef, GridRenderCellParams, GridRowSelectionModel } from '@mui/x-data-grid';
import { format } from 'date-fns';

export default function ClaimsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedClaim, setSelectedClaim] = useState<any>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [bulkUpdateDialogOpen, setBulkUpdateDialogOpen] = useState(false);
  const [bulkStatus, setBulkStatus] = useState('');
  const [selectedRows, setSelectedRows] = useState<GridRowSelectionModel>([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const { data, isLoading } = useQuery({
    queryKey: ['claims', page, pageSize, search, statusFilter, typeFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page + 1), limit: String(pageSize),
        ...(search && { search }), ...(statusFilter && { status: statusFilter }),
        ...(typeFilter && { type: typeFilter }),
      });
      const response = await axios.get(`/api/claims?${params}`);
      return response.data;
    },
  });

  const claims = data?.claims || [];
  const totalCount = data?.pagination?.total || 0;

  const stats = useMemo(() => {
    const openReported = claims.filter((c: any) => c.status === 'REPORTED').length;
    const underInvestigation = claims.filter((c: any) => c.status === 'UNDER_INVESTIGATION' || c.status === 'IN_REVIEW').length;
    const settledAmount = claims
      .filter((c: any) => c.status === 'SETTLED')
      .reduce((sum: number, c: any) => sum + Number(c.paidAmount || 0), 0);
    return { openReported, underInvestigation, settledAmount };
  }, [claims]);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await axios.delete(`/api/claims/${id}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claims'] });
      setSnackbar({ open: true, message: 'Claim deleted', severity: 'success' });
      setDeleteDialogOpen(false); setDetailDialogOpen(false);
    },
    onError: () => { setSnackbar({ open: true, message: 'Delete failed', severity: 'error' }); },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => { await axios.delete('/api/claims/bulk', { data: { ids } }); },
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: ['claims'] });
      setSnackbar({ open: true, message: `${ids.length} claim(s) deleted`, severity: 'success' });
      setBulkDeleteDialogOpen(false); setSelectedRows([]);
    },
    onError: () => { setSnackbar({ open: true, message: 'Bulk delete failed', severity: 'error' }); },
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ ids, data }: { ids: string[]; data: Record<string, unknown> }) => {
      await axios.patch('/api/claims/bulk', { ids, data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claims'] });
      setSnackbar({ open: true, message: 'Claims updated', severity: 'success' });
      setBulkUpdateDialogOpen(false); setSelectedRows([]); setBulkStatus('');
    },
    onError: () => { setSnackbar({ open: true, message: 'Bulk update failed', severity: 'error' }); },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'REPORTED': return 'info';
      case 'UNDER_INVESTIGATION': case 'PENDING_DOCUMENTS': case 'IN_REVIEW': return 'warning';
      case 'APPROVED': case 'SETTLED': case 'CLOSED': return 'success';
      case 'DENIED': return 'error';
      default: return 'default';
    }
  };

  const formatStatus = (status: string) => {
    if (!status) return '-';
    return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const claimStatuses = ['REPORTED', 'UNDER_INVESTIGATION', 'PENDING_DOCUMENTS', 'IN_REVIEW', 'APPROVED', 'DENIED', 'SETTLED', 'CLOSED'];
  const claimTypes = ['AUTO', 'PROPERTY', 'LIABILITY', 'WORKERS_COMP', 'HEALTH', 'LIFE', 'OTHER'];

  const columns: GridColDef[] = [
    {
      field: 'claimNumber', headerName: 'Claim #', width: 155,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight={700} sx={{ color: '#c62828', fontSize: '0.9rem' }}>{params.value}</Typography>
      ),
    },
    {
      field: 'client', headerName: 'Client', flex: 1.5, minWidth: 280,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, overflow: 'hidden' }}>
          <Avatar sx={{
            bgcolor: 'error.main', width: 40, height: 40, fontSize: '0.9rem', fontWeight: 700, flexShrink: 0,
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
      field: 'policy', headerName: 'Policy #', width: 150,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" sx={{ fontSize: '0.875rem', color: '#1565c0' }}>{params.row.policy?.policyNumber || '-'}</Typography>
      ),
    },
    {
      field: 'type', headerName: 'Type', width: 120,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>{params.value || '-'}</Typography>
      ),
    },
    {
      field: 'dateOfLoss', headerName: 'Date of Loss', width: 120,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.84rem' }}>
          {format(new Date(params.value), 'MMM d, yyyy')}
        </Typography>
      ),
    },
    {
      field: 'estimatedLoss', headerName: 'Est. Loss', width: 120,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.9rem' }}>
          {params.value ? `$${Number(params.value).toLocaleString()}` : '-'}
        </Typography>
      ),
    },
    {
      field: 'paidAmount', headerName: 'Paid', width: 110,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontSize: '0.875rem', color: params.value ? 'success.main' : 'text.secondary' }}>
          {params.value ? `$${Number(params.value).toLocaleString()}` : '-'}
        </Typography>
      ),
    },
    {
      field: 'aiRiskScore', headerName: 'AI Risk', width: 100,
      renderCell: (params) => {
        if (params.value == null) return <Typography variant="caption" color="text.secondary">-</Typography>;
        const score = Number(params.value);
        const color = score <= 0.3 ? 'success' : score <= 0.7 ? 'warning' : 'error';
        return <Chip label={`${(score * 100).toFixed(0)}%`} size="small" color={color} variant="outlined" sx={{ fontWeight: 600, borderRadius: '6px' }} />;
      },
    },
    {
      field: 'status', headerName: 'Status', width: 165,
      renderCell: (params) => (
        <Chip label={formatStatus(params.value)} size="small" color={getStatusColor(params.value) as any}
          sx={{ fontWeight: 600, borderRadius: '6px', minWidth: 72 }} />
      ),
    },
    {
      field: 'actions', headerName: '', width: 50, sortable: false,
      renderCell: (params) => (
        <IconButton size="small" onClick={(e) => { e.stopPropagation(); setAnchorEl(e.currentTarget); setSelectedClaim(params.row); }}
          sx={{ opacity: 0.6, '&:hover': { opacity: 1 } }}>
          <MoreVert fontSize="small" />
        </IconButton>
      ),
    },
  ];

  const hasActiveFilters = search || statusFilter || typeFilter;

  return (
    <Box className="animate-fade-in">
      {/* Header */}
      <Paper elevation={0} sx={{
        p: 3, mb: 3, borderRadius: 3,
        background: 'linear-gradient(135deg, #c62828 0%, #d32f2f 50%, #ef5350 100%)',
        color: 'white',
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.15)', width: 52, height: 52 }}>
              <ReportProblem sx={{ fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight={700}>Claims Management</Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>Track, manage, and resolve insurance claims</Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Export as PDF">
              <Button variant="outlined" size="small" startIcon={<PictureAsPdf />}
                onClick={() => window.open('/api/export/pdf?type=claims', '_blank')}
                sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}>
                PDF
              </Button>
            </Tooltip>
            <Tooltip title="Export as CSV">
              <Button variant="outlined" size="small" startIcon={<Download />}
                onClick={() => {
                  const csv = [
                    ['Claim #', 'Client', 'Policy', 'Type', 'Date of Loss', 'Est. Loss', 'Paid', 'Status', 'AI Risk'].join(','),
                    ...claims.map((c: any) => [
                      c.claimNumber, `"${c.client?.businessName || `${c.client?.firstName} ${c.client?.lastName}`}"`,
                      c.policy?.policyNumber || '', c.type || '', new Date(c.dateOfLoss).toLocaleDateString(),
                      Number(c.estimatedLoss || 0), Number(c.paidAmount || 0), c.status,
                      c.aiRiskScore != null ? `${(Number(c.aiRiskScore) * 100).toFixed(0)}%` : '',
                    ].join(','))
                  ].join('\n');
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a'); a.href = url;
                  a.download = `claims-${new Date().toISOString().split('T')[0]}.csv`;
                  a.click(); URL.revokeObjectURL(url);
                }}
                sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}>
                CSV
              </Button>
            </Tooltip>
            <Button variant="contained" startIcon={<Add />} onClick={() => router.push('/claims/new')}
              sx={{ bgcolor: 'white', color: '#c62828', fontWeight: 600, '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' } }}>
              Report Claim
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Stats Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Total Claims', value: totalCount, icon: <ReportProblem />, color: '#c62828', bg: 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)' },
          { label: 'Open / Reported', value: stats.openReported, icon: <Warning />, color: '#e65100', bg: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)' },
          { label: 'Under Investigation', value: stats.underInvestigation, icon: <TrendingUp />, color: '#1976d2', bg: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)' },
          { label: 'Settled Amount', value: `$${stats.settledAmount.toLocaleString()}`, icon: <Gavel />, color: '#2e7d32', bg: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)' },
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
                </Box>
                <Avatar sx={{ bgcolor: `${stat.color}20`, color: stat.color, width: 42, height: 42 }}>
                  {stat.icon}
                </Avatar>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Bulk Actions Bar */}
      {selectedRows.length > 0 && (
        <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }} action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button size="small" variant="outlined" startIcon={<Update />} onClick={() => setBulkUpdateDialogOpen(true)}>Update Status</Button>
            <Button size="small" color="error" variant="outlined" startIcon={<DeleteSweep />} onClick={() => setBulkDeleteDialogOpen(true)}>Delete Selected</Button>
          </Box>
        }>
          <strong>{selectedRows.length}</strong> claim(s) selected
        </Alert>
      )}

      {/* Filters */}
      <Card sx={{ mb: 2, borderRadius: 2.5, overflow: 'visible' }}>
        <CardContent sx={{ py: 2, px: 2.5, '&:last-child': { pb: 2 } }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField fullWidth size="small" placeholder="Search by claim #, client, description, location..."
                value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ color: 'text.secondary' }} /></InputAdornment> }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'grey.50' } }} />
            </Grid>
            <Grid item xs={6} sm={3} md={2.5}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select value={statusFilter} label="Status" onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }} sx={{ borderRadius: 2 }}>
                  <MenuItem value="">All</MenuItem>
                  {claimStatuses.map(s => <MenuItem key={s} value={s}>{formatStatus(s)}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={3} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Type</InputLabel>
                <Select value={typeFilter} label="Type" onChange={(e) => { setTypeFilter(e.target.value); setPage(0); }} sx={{ borderRadius: 2 }}>
                  <MenuItem value="">All</MenuItem>
                  {claimTypes.map(t => <MenuItem key={t} value={t}>{t.replace(/_/g, ' ')}</MenuItem>)}
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
          rows={claims} columns={columns} rowCount={totalCount}
          loading={isLoading} pageSizeOptions={[10, 25, 50]} paginationMode="server"
          paginationModel={{ page, pageSize }}
          onPaginationModelChange={(model) => { setPage(model.page); setPageSize(model.pageSize); }}
          checkboxSelection disableRowSelectionOnClick
          onRowSelectionModelChange={(newSelection) => setSelectedRows(newSelection)}
          rowSelectionModel={selectedRows}
          onRowClick={(params) => { setSelectedClaim(params.row); setDetailDialogOpen(true); }}
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

      {/* Actions Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}
        PaperProps={{ sx: { borderRadius: 2, minWidth: 160, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' } }}>
        <MenuItem onClick={() => { setDetailDialogOpen(true); setAnchorEl(null); }}>
          <ListItemIcon><Visibility fontSize="small" /></ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { router.push(`/claims/${selectedClaim?.id}/edit`); setAnchorEl(null); }}>
          <ListItemIcon><Edit fontSize="small" /></ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { setNewStatus(selectedClaim?.status || ''); setStatusDialogOpen(true); setAnchorEl(null); }}>
          <ListItemIcon><Assignment fontSize="small" /></ListItemIcon>
          <ListItemText>Update Status</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { setDeleteDialogOpen(true); setAnchorEl(null); }} sx={{ color: 'error.main' }}>
          <ListItemIcon><Delete fontSize="small" color="error" /></ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      {/* Row Detail Dialog */}
      <Dialog open={detailDialogOpen} onClose={() => setDetailDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}>
        <Box sx={{ background: 'linear-gradient(135deg, #b71c1c 0%, #c62828 50%, #ef5350 100%)', color: 'white', px: 3, py: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.15)', width: 52, height: 52 }}>
              <ReportProblem sx={{ fontSize: 28 }} />
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" fontWeight={700}>{selectedClaim?.claimNumber}</Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                <Chip label={formatStatus(selectedClaim?.status || '')}
                  size="small" sx={{ fontWeight: 700, bgcolor: 'rgba(255,255,255,0.2)', color: 'white', borderRadius: '6px' }} />
                {selectedClaim?.type && (
                  <Chip label={selectedClaim.type}
                    size="small" sx={{ fontWeight: 700, bgcolor: 'rgba(255,255,255,0.2)', color: 'white', borderRadius: '6px' }} />
                )}
              </Box>
            </Box>
            <IconButton onClick={() => setDetailDialogOpen(false)} size="small" sx={{ color: 'white' }}><Close /></IconButton>
          </Box>
        </Box>
        <DialogContent dividers>
          <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 1 }}>Claim Information</Typography>
          <Paper variant="outlined" sx={{ p: 2, mb: 2.5, mt: 1, borderRadius: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Claim Number</Typography>
                <Typography variant="body2" fontWeight={600}>{selectedClaim?.claimNumber || '-'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Type</Typography>
                <Typography variant="body2">{selectedClaim?.type || '-'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Status</Typography>
                <Typography variant="body2">{formatStatus(selectedClaim?.status || '')}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CalendarMonth sx={{ fontSize: 18, color: 'error.main' }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary">Date of Loss</Typography>
                    <Typography variant="body2">{selectedClaim?.dateOfLoss ? format(new Date(selectedClaim.dateOfLoss), 'MMM d, yyyy') : '-'}</Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Paper>

          <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 1 }}>Loss Details</Typography>
          <Paper variant="outlined" sx={{ p: 2, mb: 2.5, mt: 1, borderRadius: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">Description</Typography>
                <Typography variant="body2">{selectedClaim?.description || '-'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Loss Location</Typography>
                <Typography variant="body2">{selectedClaim?.lossLocation || '-'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Estimated Loss</Typography>
                <Typography variant="body2" fontWeight={700} color="error.main">
                  {selectedClaim?.estimatedLoss ? `$${Number(selectedClaim.estimatedLoss).toLocaleString()}` : '-'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Deductible</Typography>
                <Typography variant="body2">{selectedClaim?.deductible ? `$${Number(selectedClaim.deductible).toLocaleString()}` : '-'}</Typography>
              </Grid>
            </Grid>
          </Paper>

          <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 1 }}>Financial</Typography>
          <Paper variant="outlined" sx={{ p: 2, mb: 2.5, mt: 1, borderRadius: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AttachMoney sx={{ fontSize: 18, color: 'warning.main' }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary">Reserve Amount</Typography>
                    <Typography variant="body2">{selectedClaim?.reserveAmount ? `$${Number(selectedClaim.reserveAmount).toLocaleString()}` : '-'}</Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AttachMoney sx={{ fontSize: 18, color: 'success.main' }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary">Paid Amount</Typography>
                    <Typography variant="body2" fontWeight={600} color="success.main">
                      {selectedClaim?.paidAmount ? `$${Number(selectedClaim.paidAmount).toLocaleString()}` : '-'}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Paper>

          <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 1 }}>Adjuster Info</Typography>
          <Paper variant="outlined" sx={{ p: 2, mb: 2.5, mt: 1, borderRadius: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Adjuster Name</Typography>
                <Typography variant="body2">{selectedClaim?.adjusterName || '-'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Adjuster Phone</Typography>
                <Typography variant="body2">{selectedClaim?.adjusterPhone || '-'}</Typography>
              </Grid>
            </Grid>
          </Paper>

          {selectedClaim?.aiRiskScore != null && (
            <>
              <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 1 }}>AI Analysis</Typography>
              <Paper variant="outlined" sx={{ p: 2, mt: 1, borderRadius: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">AI Classification</Typography>
                    <Typography variant="body2">{selectedClaim?.aiClassification?.replace(/_/g, ' ') || '-'}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">AI Risk Score</Typography>
                    <Box sx={{ mt: 0.5 }}>
                      <Chip
                        label={`${(Number(selectedClaim.aiRiskScore) * 100).toFixed(0)}%`}
                        size="small"
                        color={Number(selectedClaim.aiRiskScore) <= 0.3 ? 'success' : Number(selectedClaim.aiRiskScore) <= 0.7 ? 'warning' : 'error'}
                        sx={{ fontWeight: 600, borderRadius: '6px' }}
                      />
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider', justifyContent: 'space-between' }}>
          <Button color="error" variant="outlined" startIcon={<Delete />} onClick={() => { setDetailDialogOpen(false); setDeleteDialogOpen(true); }} sx={{ borderRadius: 2 }}>Delete</Button>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button onClick={() => setDetailDialogOpen(false)} sx={{ borderRadius: 2 }}>Close</Button>
            <Button variant="contained" startIcon={<Edit />} onClick={() => { setDetailDialogOpen(false); router.push(`/claims/${selectedClaim?.id}/edit`); }}
              sx={{ borderRadius: 2, bgcolor: '#c62828', '&:hover': { bgcolor: '#b71c1c' } }}>Edit Claim</Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle>Update Claim Status</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Status</InputLabel>
            <Select value={newStatus} label="Status" onChange={(e) => setNewStatus(e.target.value)} sx={{ borderRadius: 2 }}>
              {claimStatuses.map(s => <MenuItem key={s} value={s}>{formatStatus(s)}</MenuItem>)}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setStatusDialogOpen(false)} sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button variant="contained" sx={{ borderRadius: 2 }} onClick={async () => {
            try {
              await axios.patch(`/api/claims/${selectedClaim?.id}`, { status: newStatus });
              queryClient.invalidateQueries({ queryKey: ['claims'] });
              setSnackbar({ open: true, message: 'Status updated', severity: 'success' });
              setStatusDialogOpen(false);
            } catch { setSnackbar({ open: true, message: 'Update failed', severity: 'error' }); }
          }}>Update</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle>Delete Claim</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete <strong>{selectedClaim?.claimNumber}</strong>? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button onClick={() => deleteMutation.mutate(selectedClaim?.id)} color="error" variant="contained" disabled={deleteMutation.isPending} sx={{ borderRadius: 2 }}>
            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Delete Dialog */}
      <Dialog open={bulkDeleteDialogOpen} onClose={() => setBulkDeleteDialogOpen(false)} PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle>Delete Selected Claims</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete <strong>{selectedRows.length}</strong> selected claim(s)? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setBulkDeleteDialogOpen(false)} sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button onClick={() => bulkDeleteMutation.mutate(selectedRows as string[])} color="error" variant="contained" disabled={bulkDeleteMutation.isPending} sx={{ borderRadius: 2 }}>
            {bulkDeleteMutation.isPending ? 'Deleting...' : 'Delete All'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Update Dialog */}
      <Dialog open={bulkUpdateDialogOpen} onClose={() => setBulkUpdateDialogOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle>Update Selected Claims</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>Update status for <strong>{selectedRows.length}</strong> selected claim(s).</Typography>
          <FormControl fullWidth>
            <InputLabel>New Status</InputLabel>
            <Select value={bulkStatus} label="New Status" onChange={(e) => setBulkStatus(e.target.value)} sx={{ borderRadius: 2 }}>
              {claimStatuses.map(s => <MenuItem key={s} value={s}>{formatStatus(s)}</MenuItem>)}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setBulkUpdateDialogOpen(false)} sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button variant="contained" disabled={!bulkStatus || bulkUpdateMutation.isPending}
            onClick={() => bulkUpdateMutation.mutate({ ids: selectedRows as string[], data: { status: bulkStatus } })} sx={{ borderRadius: 2 }}>
            {bulkUpdateMutation.isPending ? 'Updating...' : 'Update All'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar open={snackbar.open} autoHideDuration={5000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })} sx={{ borderRadius: 2 }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}
