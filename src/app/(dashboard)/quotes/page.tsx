'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  Box, Button, Card, CardContent, Typography, TextField, InputAdornment, IconButton,
  Menu, MenuItem, Chip, Avatar, Grid, FormControl, InputLabel, Select, Snackbar, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Paper, Tooltip, Divider, ListItemIcon, ListItemText,
} from '@mui/material';
import {
  Add, Search, MoreVert, Edit, Visibility, Send, Delete, PictureAsPdf,
  Close, DeleteSweep, Update, Description, Business, TrendingUp,
  CalendarMonth, FilterList, DraftsOutlined, CheckCircle, Download,
} from '@mui/icons-material';
import { DataGrid, GridColDef, GridRenderCellParams, GridRowSelectionModel } from '@mui/x-data-grid';
import { format } from 'date-fns';

export default function QuotesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [lobFilter, setLobFilter] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedQuote, setSelectedQuote] = useState<any>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [bulkUpdateDialogOpen, setBulkUpdateDialogOpen] = useState(false);
  const [bulkStatus, setBulkStatus] = useState('');
  const [selectedRows, setSelectedRows] = useState<GridRowSelectionModel>([]);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await axios.delete(`/api/quotes/${id}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      setSnackbar({ open: true, message: 'Quote deleted', severity: 'success' });
      setDeleteDialogOpen(false); setDetailDialogOpen(false); setSelectedQuote(null);
    },
    onError: () => { setSnackbar({ open: true, message: 'Delete failed', severity: 'error' }); },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => { await axios.delete('/api/quotes/bulk', { data: { ids } }); },
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      setSnackbar({ open: true, message: `${ids.length} quote(s) deleted`, severity: 'success' });
      setBulkDeleteDialogOpen(false); setSelectedRows([]);
    },
    onError: () => { setSnackbar({ open: true, message: 'Bulk delete failed', severity: 'error' }); },
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ ids, data }: { ids: string[]; data: Record<string, unknown> }) => {
      await axios.patch('/api/quotes/bulk', { ids, data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      setSnackbar({ open: true, message: 'Quotes updated', severity: 'success' });
      setBulkUpdateDialogOpen(false); setSelectedRows([]); setBulkStatus('');
    },
    onError: () => { setSnackbar({ open: true, message: 'Bulk update failed', severity: 'error' }); },
  });

  const { data, isLoading } = useQuery({
    queryKey: ['quotes', page, pageSize, search, statusFilter, lobFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page + 1), limit: String(pageSize),
        ...(search && { search }), ...(statusFilter && { status: statusFilter }),
        ...(lobFilter && { lineOfBusiness: lobFilter }),
      });
      const response = await axios.get(`/api/quotes?${params}`);
      return response.data;
    },
  });

  const quotes = data?.quotes || [];
  const totalCount = data?.pagination?.total || 0;

  const stats = useMemo(() => {
    const drafts = quotes.filter((q: any) => q.status === 'DRAFT').length;
    const quoted = quotes.filter((q: any) => q.status === 'QUOTED' || q.status === 'PROPOSED').length;
    const accepted = quotes.filter((q: any) => q.status === 'ACCEPTED' || q.status === 'BOUND').length;
    return { drafts, quoted, accepted };
  }, [quotes]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'default';
      case 'QUOTED': return 'info';
      case 'PROPOSED': return 'primary';
      case 'ACCEPTED': case 'BOUND': return 'success';
      case 'DECLINED': case 'EXPIRED': return 'error';
      default: return 'default';
    }
  };

  const formatLOB = (lob: string) => {
    if (!lob) return '-';
    return lob.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const lineOfBusinessOptions = [
    'PERSONAL_AUTO', 'HOMEOWNERS', 'RENTERS', 'UMBRELLA', 'LIFE', 'HEALTH',
    'COMMERCIAL_AUTO', 'COMMERCIAL_PROPERTY', 'GENERAL_LIABILITY', 'WORKERS_COMP', 'PROFESSIONAL_LIABILITY', 'CYBER',
  ];

  const columns: GridColDef[] = [
    {
      field: 'quoteNumber', headerName: 'Quote #', width: 150,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight={700} sx={{ color: '#2e7d32', fontSize: '0.9rem' }}>{params.value}</Typography>
      ),
    },
    {
      field: 'client', headerName: 'Client', flex: 1.5, minWidth: 280,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, overflow: 'hidden' }}>
          <Avatar sx={{
            bgcolor: params.row.client?.type === 'PERSONAL' ? 'primary.main' : 'secondary.main',
            width: 40, height: 40, fontSize: '0.9rem', fontWeight: 700, flexShrink: 0,
          }}>
            {params.row.client?.type === 'PERSONAL'
              ? `${params.row.client?.firstName?.[0] || ''}${params.row.client?.lastName?.[0] || ''}`
              : <Business sx={{ fontSize: 20 }} />}
          </Avatar>
          <Box sx={{ overflow: 'hidden' }}>
            <Typography variant="body1" fontWeight={600} sx={{ fontSize: '0.95rem', lineHeight: 1.4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {params.row.client?.type === 'COMMERCIAL' && params.row.client?.businessName
                ? params.row.client.businessName : `${params.row.client?.firstName} ${params.row.client?.lastName}`}
            </Typography>
            {params.row.client?.type === 'COMMERCIAL' && (
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', lineHeight: 1.3 }}>
                {params.row.client?.firstName} {params.row.client?.lastName}
              </Typography>
            )}
          </Box>
        </Box>
      ),
    },
    {
      field: 'lineOfBusiness', headerName: 'Type / LOB', width: 175,
      renderCell: (params) => <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>{formatLOB(params.value)}</Typography>,
    },
    {
      field: 'carrier', headerName: 'Carrier', width: 140,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>{params.row.carrier?.name || '-'}</Typography>
      ),
    },
    {
      field: 'totalPremium', headerName: 'Premium', width: 130,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.9rem' }}>
          {params.value ? `$${Number(params.value).toLocaleString()}` : '-'}
        </Typography>
      ),
    },
    {
      field: 'effectiveDate', headerName: 'Eff. Date', width: 115,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.84rem' }}>
          {format(new Date(params.value), 'MMM d, yyyy')}
        </Typography>
      ),
    },
    {
      field: 'createdAt', headerName: 'Created', width: 115,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.84rem' }}>
          {format(new Date(params.value), 'MMM d, yyyy')}
        </Typography>
      ),
    },
    {
      field: 'status', headerName: 'Status', width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value?.toString().charAt(0) + params.value?.toString().slice(1).toLowerCase()}
          size="small" color={getStatusColor(params.value as string) as any}
          sx={{ fontWeight: 600, borderRadius: '6px', minWidth: 72 }}
        />
      ),
    },
    {
      field: 'actions', headerName: '', width: 50, sortable: false,
      renderCell: (params) => (
        <IconButton size="small" onClick={(e) => { e.stopPropagation(); setAnchorEl(e.currentTarget); setSelectedQuote(params.row); }}
          sx={{ opacity: 0.6, '&:hover': { opacity: 1 } }}>
          <MoreVert fontSize="small" />
        </IconButton>
      ),
    },
  ];

  const hasActiveFilters = search || statusFilter || lobFilter;

  return (
    <Box className="animate-fade-in">
      {/* Header */}
      <Paper elevation={0} sx={{
        p: 3, mb: 3, borderRadius: 3,
        background: 'linear-gradient(135deg, #2e7d32 0%, #388e3c 50%, #66bb6a 100%)',
        color: 'white',
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.15)', width: 52, height: 52 }}>
              <Description sx={{ fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight={700}>Quotes & Proposals</Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>Manage quotes, proposals, and submissions</Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Export as PDF">
              <Button variant="outlined" size="small" startIcon={<PictureAsPdf />}
                onClick={() => window.open('/api/export/pdf?type=quotes', '_blank')}
                sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}>
                PDF
              </Button>
            </Tooltip>
            <Tooltip title="Export as CSV">
              <Button variant="outlined" size="small" startIcon={<Download />}
                onClick={() => {
                  const csv = [
                    ['Quote #', 'Client', 'LOB', 'Carrier', 'Premium', 'Eff. Date', 'Status', 'Created'].join(','),
                    ...quotes.map((q: any) => [
                      q.quoteNumber, `"${q.client?.businessName || `${q.client?.firstName} ${q.client?.lastName}`}"`,
                      q.lineOfBusiness?.replace(/_/g, ' '), q.carrier?.name || '', Number(q.totalPremium || 0),
                      new Date(q.effectiveDate).toLocaleDateString(), q.status, new Date(q.createdAt).toLocaleDateString(),
                    ].join(','))
                  ].join('\n');
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a'); a.href = url;
                  a.download = `quotes-${new Date().toISOString().split('T')[0]}.csv`;
                  a.click(); URL.revokeObjectURL(url);
                }}
                sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}>
                CSV
              </Button>
            </Tooltip>
            <Button variant="contained" startIcon={<Add />} onClick={() => router.push('/quotes/new')}
              sx={{ bgcolor: 'white', color: '#2e7d32', fontWeight: 600, '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' } }}>
              New Quote
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Stats Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Total Quotes', value: totalCount, icon: <Description />, color: '#2e7d32', bg: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)' },
          { label: 'Drafts', value: stats.drafts, icon: <DraftsOutlined />, color: '#757575', bg: 'linear-gradient(135deg, #fafafa 0%, #eeeeee 100%)' },
          { label: 'Quoted / Proposed', value: stats.quoted, icon: <TrendingUp />, color: '#1976d2', bg: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)' },
          { label: 'Accepted / Bound', value: stats.accepted, icon: <CheckCircle />, color: '#e65100', bg: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)' },
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
          <strong>{selectedRows.length}</strong> quote(s) selected
        </Alert>
      )}

      {/* Filters */}
      <Card sx={{ mb: 2, borderRadius: 2.5, overflow: 'visible' }}>
        <CardContent sx={{ py: 2, px: 2.5, '&:last-child': { pb: 2 } }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField fullWidth size="small" placeholder="Search by quote #, client, business name..."
                value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ color: 'text.secondary' }} /></InputAdornment> }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'grey.50' } }} />
            </Grid>
            <Grid item xs={6} sm={3} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select value={statusFilter} label="Status" onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }} sx={{ borderRadius: 2 }}>
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="DRAFT">Draft</MenuItem>
                  <MenuItem value="QUOTED">Quoted</MenuItem>
                  <MenuItem value="PROPOSED">Proposed</MenuItem>
                  <MenuItem value="ACCEPTED">Accepted</MenuItem>
                  <MenuItem value="DECLINED">Declined</MenuItem>
                  <MenuItem value="BOUND">Bound</MenuItem>
                  <MenuItem value="EXPIRED">Expired</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={3} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Line of Business</InputLabel>
                <Select value={lobFilter} label="Line of Business" onChange={(e) => { setLobFilter(e.target.value); setPage(0); }} sx={{ borderRadius: 2 }}>
                  <MenuItem value="">All</MenuItem>
                  {lineOfBusinessOptions.map((lob) => <MenuItem key={lob} value={lob}>{formatLOB(lob)}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                {hasActiveFilters && (
                  <Button variant="text" size="small" startIcon={<FilterList />}
                    onClick={() => { setSearch(''); setStatusFilter(''); setLobFilter(''); setPage(0); }}
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
          rows={quotes} columns={columns} rowCount={totalCount}
          loading={isLoading} pageSizeOptions={[10, 25, 50]} paginationMode="server"
          paginationModel={{ page, pageSize }}
          onPaginationModelChange={(model) => { setPage(model.page); setPageSize(model.pageSize); }}
          checkboxSelection disableRowSelectionOnClick
          onRowSelectionModelChange={(newSelection) => setSelectedRows(newSelection)}
          rowSelectionModel={selectedRows}
          onRowClick={(params) => { setSelectedQuote(params.row); setDetailDialogOpen(true); }}
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
        <MenuItem onClick={() => { router.push(`/quotes/${selectedQuote?.id}/edit`); setAnchorEl(null); }}>
          <ListItemIcon><Edit fontSize="small" /></ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem onClick={async () => {
          try {
            await axios.patch(`/api/quotes/${selectedQuote?.id}`, { status: 'PROPOSED' });
            queryClient.invalidateQueries({ queryKey: ['quotes'] });
            setSnackbar({ open: true, message: 'Proposal sent', severity: 'success' });
          } catch { setSnackbar({ open: true, message: 'Failed to send', severity: 'error' }); }
          setAnchorEl(null);
        }}>
          <ListItemIcon><Send fontSize="small" /></ListItemIcon>
          <ListItemText>Send Proposal</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { setDeleteDialogOpen(true); setAnchorEl(null); }} sx={{ color: 'error.main' }}>
          <ListItemIcon><Delete fontSize="small" color="error" /></ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      {/* Row Detail Dialog */}
      <Dialog open={detailDialogOpen} onClose={() => setDetailDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}>
        <Box sx={{ background: 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 50%, #43a047 100%)', color: 'white', px: 3, py: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.15)', width: 52, height: 52 }}>
              <Description sx={{ fontSize: 28 }} />
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" fontWeight={700}>{selectedQuote?.quoteNumber}</Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                <Chip label={selectedQuote?.status?.charAt(0) + (selectedQuote?.status?.slice(1).toLowerCase() || '')}
                  size="small" sx={{ fontWeight: 700, bgcolor: 'rgba(255,255,255,0.2)', color: 'white', borderRadius: '6px' }} />
                <Chip label={formatLOB(selectedQuote?.lineOfBusiness || '')}
                  size="small" sx={{ fontWeight: 700, bgcolor: 'rgba(255,255,255,0.2)', color: 'white', borderRadius: '6px' }} />
              </Box>
            </Box>
            <IconButton onClick={() => setDetailDialogOpen(false)} size="small" sx={{ color: 'white' }}><Close /></IconButton>
          </Box>
        </Box>
        <DialogContent dividers>
          <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 1 }}>Quote Information</Typography>
          <Paper variant="outlined" sx={{ p: 2, mb: 2.5, mt: 1, borderRadius: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Client</Typography>
                <Typography variant="body2" fontWeight={600}>
                  {selectedQuote?.client?.type === 'COMMERCIAL' && selectedQuote?.client?.businessName
                    ? selectedQuote.client.businessName
                    : `${selectedQuote?.client?.firstName || ''} ${selectedQuote?.client?.lastName || ''}`}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Line of Business</Typography>
                <Typography variant="body2">{formatLOB(selectedQuote?.lineOfBusiness || '')}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Carrier</Typography>
                <Typography variant="body2">{selectedQuote?.carrier?.name || '-'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Agent</Typography>
                <Typography variant="body2">{selectedQuote?.agent?.name || '-'}</Typography>
              </Grid>
            </Grid>
          </Paper>

          <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 1 }}>Financial</Typography>
          <Paper variant="outlined" sx={{ p: 2, mb: 2.5, mt: 1, borderRadius: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Premium</Typography>
                <Typography variant="body2" fontWeight={700} color="primary.main">
                  {selectedQuote?.premium ? `$${Number(selectedQuote.premium).toLocaleString()}` : '-'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Total Premium</Typography>
                <Typography variant="body2" fontWeight={700} color="success.main">
                  {selectedQuote?.totalPremium ? `$${Number(selectedQuote.totalPremium).toLocaleString()}` : '-'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Fees</Typography>
                <Typography variant="body2">{selectedQuote?.fees ? `$${Number(selectedQuote.fees).toLocaleString()}` : '-'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Taxes</Typography>
                <Typography variant="body2">{selectedQuote?.taxes ? `$${Number(selectedQuote.taxes).toLocaleString()}` : '-'}</Typography>
              </Grid>
            </Grid>
          </Paper>

          <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 1 }}>Dates</Typography>
          <Paper variant="outlined" sx={{ p: 2, mt: 1, borderRadius: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CalendarMonth sx={{ fontSize: 18, color: 'success.main' }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary">Effective Date</Typography>
                    <Typography variant="body2">{selectedQuote?.effectiveDate ? format(new Date(selectedQuote.effectiveDate), 'MMM d, yyyy') : '-'}</Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CalendarMonth sx={{ fontSize: 18, color: 'warning.main' }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary">Expires At</Typography>
                    <Typography variant="body2">{selectedQuote?.expiresAt ? format(new Date(selectedQuote.expiresAt), 'MMM d, yyyy') : '-'}</Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Created</Typography>
                <Typography variant="body2">{selectedQuote?.createdAt ? format(new Date(selectedQuote.createdAt), 'MMM d, yyyy h:mm a') : '-'}</Typography>
              </Grid>
            </Grid>
          </Paper>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider', justifyContent: 'space-between' }}>
          <Button color="error" variant="outlined" startIcon={<Delete />} onClick={() => { setDetailDialogOpen(false); setDeleteDialogOpen(true); }} sx={{ borderRadius: 2 }}>Delete</Button>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button onClick={() => setDetailDialogOpen(false)} sx={{ borderRadius: 2 }}>Close</Button>
            <Button variant="contained" startIcon={<Edit />} onClick={() => { setDetailDialogOpen(false); router.push(`/quotes/${selectedQuote?.id}/edit`); }}
              sx={{ borderRadius: 2, bgcolor: '#2e7d32', '&:hover': { bgcolor: '#1b5e20' } }}>Edit Quote</Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle>Delete Quote</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete <strong>{selectedQuote?.quoteNumber}</strong>? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button variant="contained" color="error" onClick={() => deleteMutation.mutate(selectedQuote?.id)} disabled={deleteMutation.isPending} sx={{ borderRadius: 2 }}>
            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Delete Dialog */}
      <Dialog open={bulkDeleteDialogOpen} onClose={() => setBulkDeleteDialogOpen(false)} PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle>Delete Selected Quotes</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete <strong>{selectedRows.length}</strong> selected quote(s)? This action cannot be undone.</Typography>
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
        <DialogTitle>Update Selected Quotes</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>Update status for <strong>{selectedRows.length}</strong> selected quote(s).</Typography>
          <FormControl fullWidth>
            <InputLabel>New Status</InputLabel>
            <Select value={bulkStatus} label="New Status" onChange={(e) => setBulkStatus(e.target.value)} sx={{ borderRadius: 2 }}>
              <MenuItem value="DRAFT">Draft</MenuItem>
              <MenuItem value="QUOTED">Quoted</MenuItem>
              <MenuItem value="PROPOSED">Proposed</MenuItem>
              <MenuItem value="ACCEPTED">Accepted</MenuItem>
              <MenuItem value="DECLINED">Declined</MenuItem>
              <MenuItem value="BOUND">Bound</MenuItem>
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
