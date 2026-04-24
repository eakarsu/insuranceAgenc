'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  Box, Card, CardContent, Typography, Button, TextField, InputAdornment,
  Paper, Avatar, Grid, Tooltip, Chip,
  Dialog, DialogContent, DialogActions, IconButton,
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import {
  Add, Search, Business, PictureAsPdf, Download, People, Email, Phone,
  CheckCircle, Cancel, Domain, Category, Close, Edit, Delete,
} from '@mui/icons-material';
import { useQueryClient } from '@tanstack/react-query';

export default function CommercialClientsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [detailClient, setDetailClient] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['commercial-clients', page, pageSize, search],
    queryFn: async () => {
      const response = await axios.get(`/api/clients?type=COMMERCIAL&page=${page + 1}&limit=${pageSize}&search=${search}`);
      return response.data;
    },
  });

  const clients = data?.clients || [];
  const totalCount = data?.pagination?.total || 0;

  const stats = useMemo(() => {
    const total = totalCount;
    const active = clients.filter((c: any) => c.status === 'ACTIVE').length;
    const inactive = clients.filter((c: any) => c.status === 'INACTIVE').length;
    const withBusinessType = clients.filter((c: any) => c.businessType).length;
    return { total, active, inactive, withBusinessType };
  }, [clients, totalCount]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'INACTIVE': return 'default';
      case 'PROSPECT': return 'info';
      case 'SUSPENDED': return 'error';
      default: return 'default';
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'businessName', headerName: 'Business', flex: 1.5, minWidth: 260,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: '#1a237e', width: 40, height: 40, fontSize: '0.9rem', fontWeight: 700 }}>
            <Business sx={{ fontSize: 20 }} />
          </Avatar>
          <Box sx={{ overflow: 'hidden' }}>
            <Typography variant="body1" fontWeight={600} sx={{ fontSize: '0.95rem', lineHeight: 1.4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {params.value || `${params.row.firstName} ${params.row.lastName}`}
            </Typography>
            {params.value && (
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                {params.row.firstName} {params.row.lastName}
              </Typography>
            )}
          </Box>
        </Box>
      ),
    },
    {
      field: 'email', headerName: 'Email', flex: 1.5, minWidth: 200,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Email sx={{ fontSize: 16, color: 'text.secondary' }} />
          <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>{params.value || '-'}</Typography>
        </Box>
      ),
    },
    {
      field: 'phone', headerName: 'Phone', flex: 1, minWidth: 140,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Phone sx={{ fontSize: 16, color: 'text.secondary' }} />
          <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>{params.value || '-'}</Typography>
        </Box>
      ),
    },
    {
      field: 'businessType', headerName: 'Industry', flex: 1, minWidth: 140,
      renderCell: (params) => params.value ? (
        <Chip
          icon={<Category sx={{ fontSize: 14 }} />}
          label={params.value}
          size="small"
          variant="outlined"
          sx={{
            fontWeight: 500, borderRadius: '6px',
            borderColor: '#3949ab40', color: '#3949ab',
            bgcolor: '#e8eaf610',
          }}
        />
      ) : (
        <Typography variant="body2" color="text.secondary">-</Typography>
      ),
    },
    {
      field: 'status', headerName: 'Status', width: 120,
      renderCell: (params) => (
        <Chip
          icon={params.value === 'ACTIVE' ? <CheckCircle sx={{ fontSize: 16 }} /> : <Cancel sx={{ fontSize: 16 }} />}
          label={params.value || '-'}
          size="small"
          color={getStatusColor(params.value) as any}
          sx={{ fontWeight: 600, borderRadius: '6px', minWidth: 80 }}
        />
      ),
    },
  ];

  const handleExportCSV = () => {
    const csv = [
      ['Business Name', 'Contact First', 'Contact Last', 'Email', 'Phone', 'Industry', 'Status'].join(','),
      ...clients.map((c: any) => [
        `"${c.businessName || ''}"`, `"${c.firstName || ''}"`, `"${c.lastName || ''}"`,
        c.email || '', c.phone || '', `"${c.businessType || ''}"`, c.status || '',
      ].join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `commercial-clients-${new Date().toISOString().split('T')[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <Box className="animate-fade-in">
      {/* Gradient Header */}
      <Paper elevation={0} sx={{
        p: 3, mb: 3, borderRadius: 3,
        background: 'linear-gradient(135deg, #1a237e 0%, #283593 50%, #3949ab 100%)',
        color: 'white',
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.15)', width: 52, height: 52 }}>
              <Business sx={{ fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight={700}>Commercial Clients</Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>Manage business insurance clients</Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Export as PDF">
              <Button variant="outlined" size="small" startIcon={<PictureAsPdf />}
                onClick={() => window.open('/api/export/pdf?type=commercial-clients', '_blank')}
                sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}>
                PDF
              </Button>
            </Tooltip>
            <Tooltip title="Export as CSV">
              <Button variant="outlined" size="small" startIcon={<Download />}
                onClick={handleExportCSV}
                sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}>
                CSV
              </Button>
            </Tooltip>
            <Button variant="contained" startIcon={<Add />} onClick={() => router.push('/clients/new')}
              sx={{ bgcolor: 'white', color: '#1a237e', fontWeight: 600, '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' } }}>
              Add Client
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Stats Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Total Commercial', value: stats.total, icon: <Domain />, color: '#1a237e', bg: 'linear-gradient(135deg, #e8eaf6 0%, #c5cae9 100%)' },
          { label: 'Active Clients', value: stats.active, icon: <CheckCircle />, color: '#2e7d32', bg: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)' },
          { label: 'Inactive Clients', value: stats.inactive, icon: <Cancel />, color: '#e65100', bg: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)' },
          { label: 'With Industry', value: stats.withBusinessType, icon: <Category />, color: '#283593', bg: 'linear-gradient(135deg, #e8eaf6 0%, #c5cae9 100%)' },
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

      {/* Search/Filter Bar */}
      <Card sx={{ mb: 2, borderRadius: 2.5, overflow: 'visible' }}>
        <CardContent sx={{ py: 2, px: 2.5, '&:last-child': { pb: 2 } }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField fullWidth size="small" placeholder="Search commercial clients by business name, contact, email..."
                value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ color: 'text.secondary' }} /></InputAdornment> }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'grey.50' } }} />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Data Grid */}
      <Card sx={{ borderRadius: 2.5, overflow: 'hidden' }}>
        <DataGrid
          rows={clients}
          columns={columns}
          rowCount={totalCount}
          loading={isLoading}
          pageSizeOptions={[10, 25, 50]}
          paginationMode="server"
          paginationModel={{ page, pageSize }}
          onPaginationModelChange={(model) => { setPage(model.page); setPageSize(model.pageSize); }}
          disableRowSelectionOnClick
          onRowClick={(params) => setDetailClient(params.row)}
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
      <Dialog open={!!detailClient} onClose={() => setDetailClient(null)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}>
        <Box sx={{ background: 'linear-gradient(135deg, #1a237e 0%, #283593 50%, #3949ab 100%)', color: 'white', px: 3, py: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.15)', width: 52, height: 52 }}>
              <Business sx={{ fontSize: 24 }} />
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" fontWeight={700}>{detailClient?.businessName || `${detailClient?.firstName} ${detailClient?.lastName}`}</Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                <Chip label="Commercial" size="small" sx={{ fontWeight: 700, bgcolor: 'rgba(255,255,255,0.2)', color: 'white', borderRadius: '6px' }} />
                {detailClient?.businessType && (
                  <Chip label={detailClient.businessType} size="small" sx={{ fontWeight: 700, bgcolor: 'rgba(255,255,255,0.2)', color: 'white', borderRadius: '6px' }} />
                )}
              </Box>
            </Box>
            <IconButton onClick={() => setDetailClient(null)} size="small" sx={{ color: 'white' }}><Close /></IconButton>
          </Box>
        </Box>
        <DialogContent dividers>
          <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 1 }}>Contact Information</Typography>
          <Paper variant="outlined" sx={{ p: 2, mb: 2.5, mt: 1, borderRadius: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Contact Name</Typography>
                <Typography variant="body2">{detailClient?.firstName} {detailClient?.lastName}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Email</Typography>
                <Typography variant="body2">{detailClient?.email || '-'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Phone</Typography>
                <Typography variant="body2">{detailClient?.phone || '-'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Industry</Typography>
                <Typography variant="body2">{detailClient?.businessType || '-'}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">Address</Typography>
                <Typography variant="body2">
                  {detailClient?.address ? `${detailClient.address}, ${detailClient.city}, ${detailClient.state} ${detailClient.zipCode}` : detailClient?.city ? `${detailClient.city}, ${detailClient.state}` : '-'}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
          <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 1 }}>Account Details</Typography>
          <Paper variant="outlined" sx={{ p: 2, mt: 1, borderRadius: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Status</Typography>
                <Typography variant="body2">{detailClient?.status || '-'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Source</Typography>
                <Typography variant="body2">{detailClient?.source || '-'}</Typography>
              </Grid>
            </Grid>
          </Paper>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider', justifyContent: 'space-between' }}>
          <Button color="error" variant="outlined" startIcon={<Delete />} onClick={async () => {
            if (confirm('Delete this client?')) {
              try { await axios.delete(`/api/clients/${detailClient?.id}`); queryClient.invalidateQueries({ queryKey: ['commercial-clients'] }); setDetailClient(null); } catch (e) { console.error('Failed to delete'); }
            }
          }} sx={{ borderRadius: 2 }}>Delete</Button>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button onClick={() => setDetailClient(null)} sx={{ borderRadius: 2 }}>Close</Button>
            <Button variant="contained" startIcon={<Edit />} onClick={() => { router.push(`/clients/${detailClient?.id}`); setDetailClient(null); }}
              sx={{ borderRadius: 2, bgcolor: '#1a237e', '&:hover': { bgcolor: '#283593' } }}>Edit Client</Button>
          </Box>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
