'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  Box, Card, CardContent, Typography, Button, Grid, Chip, TextField, InputAdornment,
  Paper, Avatar, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, IconButton,
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import {
  Search, AttachMoney, CheckCircle, Schedule, Gavel, PictureAsPdf, Download,
  Close, FilterList, HourglassEmpty, Edit, Delete,
} from '@mui/icons-material';
import { format } from 'date-fns';

export default function SettlementsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedSettlement, setSelectedSettlement] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['settlements', search],
    queryFn: async () => {
      const response = await axios.get(`/api/settlements?search=${search}`);
      return response.data;
    },
  });

  const settlements = data?.settlements || [];
  const stats = data?.stats || { total: 0, paid: 0, pending: 0 };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'success';
      case 'PENDING': return 'warning';
      case 'DENIED': return 'error';
      default: return 'default';
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'claim', headerName: 'Claim #', width: 155,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" fontWeight={700} sx={{ color: '#c62828', fontSize: '0.9rem' }}>
          {params.value?.claimNumber || '-'}
        </Typography>
      ),
    },
    {
      field: 'client', headerName: 'Client', flex: 1.5, minWidth: 220,
      renderCell: (params: GridRenderCellParams) => {
        const client = params.row.claim?.client;
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {client && (
              <Avatar sx={{ width: 36, height: 36, fontSize: '0.75rem', bgcolor: '#c62828', flexShrink: 0 }}>
                {`${client.firstName?.[0] || ''}${client.lastName?.[0] || ''}`}
              </Avatar>
            )}
            <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.9rem' }}>
              {client ? `${client.firstName} ${client.lastName}` : '-'}
            </Typography>
          </Box>
        );
      },
    },
    {
      field: 'type', headerName: 'Type', width: 140,
      renderCell: (params) => (
        <Chip label={params.value || '-'} size="small" variant="outlined" sx={{ borderRadius: '6px', fontWeight: 500 }} />
      ),
    },
    {
      field: 'amount', headerName: 'Amount', width: 140,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight={700} sx={{ fontSize: '0.95rem', color: '#2e7d32' }}>
          ${(Number(params.value) || 0).toLocaleString()}
        </Typography>
      ),
    },
    {
      field: 'createdAt', headerName: 'Date', width: 130,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.84rem' }}>
          {params.value ? format(new Date(params.value), 'MMM d, yyyy') : '-'}
        </Typography>
      ),
    },
    {
      field: 'status', headerName: 'Status', width: 130,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          color={getStatusColor(params.value) as any}
          sx={{ fontWeight: 600, borderRadius: '6px', minWidth: 72 }}
        />
      ),
    },
  ];

  return (
    <Box className="animate-fade-in">
      {/* Gradient Header */}
      <Paper elevation={0} sx={{
        p: 3, mb: 3, borderRadius: 3,
        background: 'linear-gradient(135deg, #c62828 0%, #d32f2f 50%, #ef5350 100%)',
        color: 'white',
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.15)', width: 52, height: 52 }}>
              <Gavel sx={{ fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight={700}>Settlements</Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>Track claim settlement payments and status</Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Export as PDF">
              <Button variant="outlined" size="small" startIcon={<PictureAsPdf />}
                onClick={() => window.open('/api/export/pdf?type=settlements', '_blank')}
                sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}>
                PDF
              </Button>
            </Tooltip>
            <Tooltip title="Export as CSV">
              <Button variant="outlined" size="small" startIcon={<Download />}
                onClick={() => {
                  const csv = [
                    ['Claim #', 'Client', 'Type', 'Amount', 'Date', 'Status'].join(','),
                    ...settlements.map((s: any) => [
                      s.claim?.claimNumber || '',
                      `"${s.claim?.client ? `${s.claim.client.firstName} ${s.claim.client.lastName}` : '-'}"`,
                      s.type || '',
                      Number(s.amount || 0),
                      s.createdAt ? new Date(s.createdAt).toLocaleDateString() : '',
                      s.status || '',
                    ].join(','))
                  ].join('\n');
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a'); a.href = url;
                  a.download = `settlements-${new Date().toISOString().split('T')[0]}.csv`;
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
          { label: 'Total Settlements', value: `$${stats.total.toLocaleString()}`, icon: <AttachMoney />, color: '#c62828', bg: 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)' },
          { label: 'Paid', value: `$${stats.paid.toLocaleString()}`, icon: <CheckCircle />, color: '#2e7d32', bg: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)' },
          { label: 'Pending', value: `$${stats.pending.toLocaleString()}`, icon: <HourglassEmpty />, color: '#e65100', bg: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)' },
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

      {/* Search/Filter Bar */}
      <Card sx={{ mb: 2, borderRadius: 2.5, overflow: 'visible' }}>
        <CardContent sx={{ py: 2, px: 2.5, '&:last-child': { pb: 2 } }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search by claim #, client name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ color: 'text.secondary' }} /></InputAdornment> }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'grey.50' } }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                {search && (
                  <Button variant="text" size="small" startIcon={<FilterList />}
                    onClick={() => setSearch('')}
                    sx={{ textTransform: 'none' }}>
                    Clear
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
          rows={settlements}
          columns={columns}
          loading={isLoading}
          pageSizeOptions={[10, 25, 50]}
          disableRowSelectionOnClick
          onRowClick={(params) => { setSelectedSettlement(params.row); setDetailDialogOpen(true); }}
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
              <Gavel sx={{ fontSize: 28 }} />
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" fontWeight={700}>Settlement Details</Typography>
              <Typography variant="body2" sx={{ opacity: 0.85 }}>{selectedSettlement?.claim?.claimNumber || '-'}</Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Chip label={selectedSettlement?.status || '-'} size="small" sx={{ fontWeight: 700, bgcolor: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }} />
              {selectedSettlement?.type && (
                <Chip label={selectedSettlement.type} size="small" sx={{ fontWeight: 600, bgcolor: 'rgba(255,255,255,0.15)', color: 'white' }} />
              )}
            </Box>
          </Box>
        </Box>
        <DialogContent sx={{ px: 3, py: 3 }}>
          <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 1 }}>Claim Information</Typography>
          <Paper variant="outlined" sx={{ p: 2, mb: 2.5, mt: 1, borderRadius: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Claim Number</Typography>
                <Typography variant="body2" fontWeight={600}>{selectedSettlement?.claim?.claimNumber || '-'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Client</Typography>
                <Typography variant="body2">
                  {selectedSettlement?.claim?.client
                    ? `${selectedSettlement.claim.client.firstName} ${selectedSettlement.claim.client.lastName}`
                    : '-'}
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 1 }}>Settlement Details</Typography>
          <Paper variant="outlined" sx={{ p: 2, mb: 2.5, mt: 1, borderRadius: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <Box sx={{ textAlign: 'center', p: 1 }}>
                  <Typography variant="caption" color="text.secondary">Type</Typography>
                  <Typography variant="body2" fontWeight={600}>{selectedSettlement?.type || '-'}</Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box sx={{ textAlign: 'center', p: 1 }}>
                  <Typography variant="caption" color="text.secondary">Amount</Typography>
                  <Typography variant="h6" fontWeight={700} color="success.main">
                    ${(Number(selectedSettlement?.amount) || 0).toLocaleString()}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box sx={{ textAlign: 'center', p: 1 }}>
                  <Typography variant="caption" color="text.secondary">Status</Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Chip label={selectedSettlement?.status || '-'} size="small"
                      color={getStatusColor(selectedSettlement?.status || '') as any} sx={{ borderRadius: '6px' }} />
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Paper>

          <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 1 }}>Dates</Typography>
          <Paper variant="outlined" sx={{ p: 2, mt: 1, borderRadius: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Created</Typography>
                <Typography variant="body2">
                  {selectedSettlement?.createdAt ? format(new Date(selectedSettlement.createdAt), 'MMM d, yyyy') : '-'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Updated</Typography>
                <Typography variant="body2">
                  {selectedSettlement?.updatedAt ? format(new Date(selectedSettlement.updatedAt), 'MMM d, yyyy') : '-'}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider', justifyContent: 'space-between' }}>
          <Button color="error" variant="outlined" startIcon={<Delete />} onClick={async () => { if (confirm('Delete this settlement?')) { try { await axios.delete(`/api/settlements/${selectedSettlement?.id}`); queryClient.invalidateQueries({ queryKey: ['settlements'] }); setDetailDialogOpen(false); } catch {} } }} sx={{ borderRadius: 2 }}>Delete</Button>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button onClick={() => setDetailDialogOpen(false)} sx={{ borderRadius: 2 }}>Close</Button>
            <Button variant="outlined" startIcon={<Edit />} onClick={() => { setDetailDialogOpen(false); router.push(`/claims/${selectedSettlement?.claimId}`); }}
              sx={{ borderRadius: 2 }}>
              Edit
            </Button>
            <Button variant="contained" onClick={() => { setDetailDialogOpen(false); router.push(`/claims/${selectedSettlement?.claimId}`); }}
              sx={{ borderRadius: 2, bgcolor: '#c62828', '&:hover': { bgcolor: '#b71c1c' } }}>
              View Claim
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
