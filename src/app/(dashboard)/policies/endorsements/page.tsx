'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  Box, Card, CardContent, Typography, Button, TextField, InputAdornment, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem, Snackbar, Alert,
  Autocomplete, Grid, Paper, Avatar, Tooltip, IconButton,
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import {
  Add, Search, Draw, PictureAsPdf, Download, Close, Edit, Delete, FilterList,
  CheckCircle, Schedule, TrendingUp,
} from '@mui/icons-material';
import { format } from 'date-fns';

export default function EndorsementsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<any>(null);
  const [selectedEndorsement, setSelectedEndorsement] = useState<any>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [endorsementForm, setEndorsementForm] = useState({ type: 'COVERAGE_CHANGE', description: '', effectiveDate: '', premiumChange: 0 });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const { data: policiesData } = useQuery({
    queryKey: ['policies-list'],
    queryFn: async () => {
      const response = await axios.get('/api/policies?limit=100');
      return response.data;
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ['endorsements', search, statusFilter, typeFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
        ...(typeFilter && { type: typeFilter }),
      });
      const response = await axios.get(`/api/endorsements?${params}`);
      return response.data;
    },
  });

  const endorsements = data?.endorsements || [];

  const stats = useMemo(() => {
    const pending = endorsements.filter((e: any) => e.status === 'PENDING').length;
    const approved = endorsements.filter((e: any) => e.status === 'APPROVED' || e.status === 'PROCESSED').length;
    const totalPremiumChange = endorsements.reduce((sum: number, e: any) => sum + Number(e.premiumChange || 0), 0);
    return { total: endorsements.length, pending, approved, totalPremiumChange };
  }, [endorsements]);

  const formatType = (type: string) => {
    if (!type) return '-';
    return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': case 'PROCESSED': return 'success';
      case 'PENDING': return 'warning';
      case 'REJECTED': case 'CANCELLED': return 'error';
      default: return 'default';
    }
  };

  const handleExportCsv = () => {
    const csv = [
      ['Endorsement #', 'Policy', 'Type', 'Effective Date', 'Premium Change', 'Status'].join(','),
      ...endorsements.map((e: any) => [
        e.endorsementNumber || '',
        e.policy?.policyNumber || '',
        formatType(e.type),
        e.effectiveDate ? format(new Date(e.effectiveDate), 'MM/dd/yyyy') : '',
        Number(e.premiumChange || 0),
        e.status || '',
      ].join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `endorsements-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const endorsementTypes = ['COVERAGE_CHANGE', 'ADD_DRIVER', 'REMOVE_DRIVER', 'ADD_VEHICLE', 'REMOVE_VEHICLE', 'ADDRESS_CHANGE', 'NAME_CHANGE', 'OTHER'];

  const columns: GridColDef[] = [
    {
      field: 'endorsementNumber', headerName: 'Endorsement #', width: 170,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight={700} sx={{ color: '#1565c0', fontSize: '0.9rem' }}>
          {params.value || '-'}
        </Typography>
      ),
    },
    {
      field: 'policy', headerName: 'Policy', flex: 1, minWidth: 150,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ width: 36, height: 36, fontSize: '0.75rem', bgcolor: '#1976d2', flexShrink: 0 }}>
            {params.row.policy?.policyNumber?.slice(-2) || 'P'}
          </Avatar>
          <Box sx={{ overflow: 'hidden' }}>
            <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {params.row.policy?.policyNumber || '-'}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      field: 'type', headerName: 'Type', width: 160,
      renderCell: (params) => (
        <Chip label={formatType(params.value)} size="small" variant="outlined"
          sx={{ fontWeight: 500, borderRadius: '6px', fontSize: '0.78rem' }} />
      ),
    },
    {
      field: 'effectiveDate', headerName: 'Effective Date', width: 140,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.84rem' }}>
          {params.value ? format(new Date(params.value), 'MMM d, yyyy') : '-'}
        </Typography>
      ),
    },
    {
      field: 'premiumChange', headerName: 'Premium Change', width: 150,
      renderCell: (params) => {
        const value = Number(params.value || 0);
        return (
          <Typography variant="body2" fontWeight={600} sx={{
            fontSize: '0.9rem',
            color: value > 0 ? '#2e7d32' : value < 0 ? '#c62828' : 'text.secondary',
          }}>
            {value >= 0 ? '+' : ''}${value.toLocaleString()}
          </Typography>
        );
      },
    },
    {
      field: 'status', headerName: 'Status', width: 140,
      renderCell: (params) => (
        <Chip label={formatType(params.value || '')} size="small"
          color={getStatusColor(params.value as string) as any}
          sx={{ fontWeight: 600, borderRadius: '6px', minWidth: 72 }} />
      ),
    },
  ];

  const hasActiveFilters = search || statusFilter || typeFilter;

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
              <Draw sx={{ fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight={700}>Endorsements</Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>Manage policy endorsements and mid-term changes</Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Export as PDF">
              <Button variant="outlined" size="small" startIcon={<PictureAsPdf />}
                onClick={() => window.open('/api/export/pdf?type=endorsements', '_blank')}
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
            <Button variant="contained" startIcon={<Add />} onClick={() => setDialogOpen(true)}
              sx={{ bgcolor: 'white', color: '#1565c0', fontWeight: 600, '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' } }}>
              Add Endorsement
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Summary Stat Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Total Endorsements', value: stats.total, icon: <Draw />, color: '#1565c0', bg: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)' },
          { label: 'Pending Review', value: stats.pending, icon: <Schedule />, color: '#e65100', bg: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)' },
          { label: 'Approved / Processed', value: stats.approved, icon: <CheckCircle />, color: '#2e7d32', bg: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)' },
          {
            label: 'Net Premium Impact',
            value: `${stats.totalPremiumChange >= 0 ? '+' : ''}$${stats.totalPremiumChange.toLocaleString()}`,
            icon: <TrendingUp />,
            color: stats.totalPremiumChange >= 0 ? '#2e7d32' : '#c62828',
            bg: stats.totalPremiumChange >= 0 ? 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)' : 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)',
          },
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

      {/* Filters */}
      <Card sx={{ mb: 2, borderRadius: 2.5, overflow: 'visible' }}>
        <CardContent sx={{ py: 2, px: 2.5, '&:last-child': { pb: 2 } }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField fullWidth size="small" placeholder="Search endorsements by number, policy..."
                value={search} onChange={(e) => setSearch(e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ color: 'text.secondary' }} /></InputAdornment> }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'grey.50' } }} />
            </Grid>
            <Grid item xs={6} sm={3} md={2.5}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value)} sx={{ borderRadius: 2 }}>
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="PENDING">Pending</MenuItem>
                  <MenuItem value="APPROVED">Approved</MenuItem>
                  <MenuItem value="PROCESSED">Processed</MenuItem>
                  <MenuItem value="REJECTED">Rejected</MenuItem>
                  <MenuItem value="CANCELLED">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={3} md={2.5}>
              <FormControl fullWidth size="small">
                <InputLabel>Type</InputLabel>
                <Select value={typeFilter} label="Type" onChange={(e) => setTypeFilter(e.target.value)} sx={{ borderRadius: 2 }}>
                  <MenuItem value="">All</MenuItem>
                  {endorsementTypes.map(t => <MenuItem key={t} value={t}>{formatType(t)}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                {hasActiveFilters && (
                  <Button variant="text" size="small" startIcon={<FilterList />}
                    onClick={() => { setSearch(''); setStatusFilter(''); setTypeFilter(''); }}
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
          rows={endorsements}
          columns={columns}
          loading={isLoading}
          pageSizeOptions={[10, 25, 50, 100]}
          disableRowSelectionOnClick
          onRowClick={(params) => { setSelectedEndorsement(params.row); setDetailDialogOpen(true); }}
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
        <Box sx={{ background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 50%, #42a5f5 100%)', color: 'white', px: 3, py: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.15)', width: 52, height: 52 }}>
              <Draw sx={{ fontSize: 28 }} />
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" fontWeight={700}>{selectedEndorsement?.endorsementNumber || 'Endorsement Details'}</Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                <Chip label={formatType(selectedEndorsement?.status || '')}
                  size="small" sx={{ fontWeight: 700, bgcolor: 'rgba(255,255,255,0.2)', color: 'white', borderRadius: '6px' }} />
                <Chip label={formatType(selectedEndorsement?.type || '')}
                  size="small" sx={{ fontWeight: 700, bgcolor: 'rgba(255,255,255,0.2)', color: 'white', borderRadius: '6px' }} />
              </Box>
            </Box>
            <IconButton onClick={() => setDetailDialogOpen(false)} size="small" sx={{ color: 'white' }}><Close /></IconButton>
          </Box>
        </Box>
        <DialogContent dividers>
          <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 1 }}>Policy Information</Typography>
          <Paper variant="outlined" sx={{ p: 2, mb: 2.5, mt: 1, borderRadius: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Policy Number</Typography>
                <Typography variant="body2" fontWeight={600}>{selectedEndorsement?.policy?.policyNumber || '-'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Type</Typography>
                <Typography variant="body2">{formatType(selectedEndorsement?.type || '')}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Effective Date</Typography>
                <Typography variant="body2">
                  {selectedEndorsement?.effectiveDate ? format(new Date(selectedEndorsement.effectiveDate), 'MMM d, yyyy') : '-'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Status</Typography>
                <Typography variant="body2">{formatType(selectedEndorsement?.status || '')}</Typography>
              </Grid>
            </Grid>
          </Paper>

          <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 1 }}>Financial Impact</Typography>
          <Paper variant="outlined" sx={{ p: 2, mb: 2.5, mt: 1, borderRadius: 2 }}>
            <Box sx={{ textAlign: 'center', p: 1 }}>
              <Typography variant="caption" color="text.secondary">Premium Change</Typography>
              <Typography variant="h5" fontWeight={700} sx={{
                color: Number(selectedEndorsement?.premiumChange || 0) >= 0 ? '#2e7d32' : '#c62828',
              }}>
                {Number(selectedEndorsement?.premiumChange || 0) >= 0 ? '+' : ''}${Number(selectedEndorsement?.premiumChange || 0).toLocaleString()}
              </Typography>
            </Box>
          </Paper>

          {selectedEndorsement?.description && (
            <>
              <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 1 }}>Description</Typography>
              <Paper variant="outlined" sx={{ p: 2, mt: 1, borderRadius: 2 }}>
                <Typography variant="body2">{selectedEndorsement.description}</Typography>
              </Paper>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider', justifyContent: 'space-between' }}>
          <Button color="error" variant="outlined" startIcon={<Delete />} onClick={async () => {
            if (confirm('Delete this endorsement?')) {
              try {
                await axios.delete(`/api/endorsements/${selectedEndorsement?.id}`);
                queryClient.invalidateQueries({ queryKey: ['endorsements'] });
                setDetailDialogOpen(false);
              } catch (e) { console.error('Failed to delete'); }
            }
          }} sx={{ borderRadius: 2 }}>Delete</Button>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button onClick={() => setDetailDialogOpen(false)} sx={{ borderRadius: 2 }}>Close</Button>
            <Button variant="contained" startIcon={<Edit />}
              onClick={() => { setDetailDialogOpen(false); router.push(`/policies/${selectedEndorsement?.policyId}/edit`); }}
              sx={{ borderRadius: 2, bgcolor: '#1565c0', '&:hover': { bgcolor: '#0d47a1' } }}>
              Edit Policy
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* Add Endorsement Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ width: 48, height: 48, bgcolor: '#1565c0' }}>
                <Add />
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight={600}>Add Endorsement</Typography>
                <Typography variant="body2" color="text.secondary">Create a new mid-term policy change</Typography>
              </Box>
            </Box>
            <IconButton onClick={() => setDialogOpen(false)} size="small"><Close /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Autocomplete
              options={policiesData?.policies || []}
              getOptionLabel={(option: any) => `${option.policyNumber} - ${option.client?.firstName} ${option.client?.lastName}`}
              value={selectedPolicy}
              onChange={(_, value) => setSelectedPolicy(value)}
              renderInput={(params) => <TextField {...params} label="Select Policy" required
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />}
            />
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={endorsementForm.type}
                label="Type"
                onChange={(e) => setEndorsementForm({ ...endorsementForm, type: e.target.value })}
                sx={{ borderRadius: 2 }}
              >
                {endorsementTypes.map(t => <MenuItem key={t} value={t}>{formatType(t)}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField
              label="Description"
              value={endorsementForm.description}
              onChange={(e) => setEndorsementForm({ ...endorsementForm, description: e.target.value })}
              fullWidth
              multiline
              rows={2}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <TextField
              label="Effective Date"
              type="date"
              value={endorsementForm.effectiveDate}
              onChange={(e) => setEndorsementForm({ ...endorsementForm, effectiveDate: e.target.value })}
              fullWidth
              InputLabelProps={{ shrink: true }}
              required
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <TextField
              label="Premium Change ($)"
              type="number"
              value={endorsementForm.premiumChange}
              onChange={(e) => setEndorsementForm({ ...endorsementForm, premiumChange: parseFloat(e.target.value) || 0 })}
              fullWidth
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button
            variant="contained"
            disabled={!selectedPolicy || !endorsementForm.effectiveDate}
            sx={{ borderRadius: 2, bgcolor: '#1565c0', '&:hover': { bgcolor: '#0d47a1' } }}
            onClick={async () => {
              try {
                await axios.post('/api/endorsements', {
                  policyId: selectedPolicy?.id,
                  type: endorsementForm.type,
                  description: endorsementForm.description,
                  effectiveDate: endorsementForm.effectiveDate,
                  premiumChange: endorsementForm.premiumChange,
                  status: 'PENDING',
                });
                queryClient.invalidateQueries({ queryKey: ['endorsements'] });
                setSnackbar({ open: true, message: 'Endorsement added successfully', severity: 'success' });
                setDialogOpen(false);
                setSelectedPolicy(null);
                setEndorsementForm({ type: 'COVERAGE_CHANGE', description: '', effectiveDate: '', premiumChange: 0 });
              } catch {
                setSnackbar({ open: true, message: 'Failed to add endorsement', severity: 'error' });
              }
            }}
          >
            Add Endorsement
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })} sx={{ borderRadius: 2 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
