'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  Box, Card, CardContent, Typography, Button, Grid, Avatar, Chip, TextField, InputAdornment,
  Dialog, DialogTitle, DialogContent, DialogActions, Autocomplete, Snackbar, Alert,
  Paper, Tooltip, IconButton,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import {
  Add, Search, PersonAdd, EmojiEvents, TrendingUp, Share, PictureAsPdf, Download,
  People, Close, Edit, Delete,
} from '@mui/icons-material';
import { format } from 'date-fns';

export default function ReferralsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [referringClient, setReferringClient] = useState<any>(null);
  const [referredForm, setReferredForm] = useState({ firstName: '', lastName: '', email: '', phone: '' });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [detailReferral, setDetailReferral] = useState<any>(null);

  const { data: clientsData } = useQuery({
    queryKey: ['clients-list'],
    queryFn: async () => {
      const response = await axios.get('/api/clients?limit=100');
      return response.data;
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ['referrals', search],
    queryFn: async () => {
      const response = await axios.get(`/api/referrals?search=${search}`);
      return response.data;
    },
  });

  const columns: GridColDef[] = [
    {
      field: 'referringClient',
      headerName: 'Referred By',
      flex: 1,
      minWidth: 200,
      renderCell: (params) => {
        const client = params.value;
        const name = client ? `${client.firstName} ${client.lastName}` : '-';
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ bgcolor: 'rgba(106,27,154,0.1)', color: '#6a1b9a', width: 36, height: 36, fontSize: '0.85rem', fontWeight: 600 }}>
              {client ? `${client.firstName?.[0] || ''}${client.lastName?.[0] || ''}` : '?'}
            </Avatar>
            <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.9rem' }}>{name}</Typography>
          </Box>
        );
      },
    },
    {
      field: 'referredClient',
      headerName: 'New Client',
      flex: 1,
      minWidth: 200,
      renderCell: (params) => {
        const client = params.value;
        const name = client ? `${client.firstName} ${client.lastName}` : '-';
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ bgcolor: 'rgba(46,125,50,0.1)', color: '#2e7d32', width: 36, height: 36, fontSize: '0.85rem', fontWeight: 600 }}>
              {client ? `${client.firstName?.[0] || ''}${client.lastName?.[0] || ''}` : '?'}
            </Avatar>
            <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.9rem' }}>{name}</Typography>
          </Box>
        );
      },
    },
    {
      field: 'createdAt',
      headerName: 'Date',
      width: 140,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.84rem' }}>
          {params.value ? format(new Date(params.value), 'MMM d, yyyy') : '-'}
        </Typography>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 140,
      renderCell: (params) => (
        <Chip
          label={params.value?.toString().charAt(0) + (params.value?.toString().slice(1).toLowerCase() || '')}
          size="small"
          color={params.value === 'CONVERTED' ? 'success' : params.value === 'PENDING' ? 'warning' : 'default'}
          sx={{ fontWeight: 600, borderRadius: '6px', minWidth: 80 }}
        />
      ),
    },
    {
      field: 'rewardStatus',
      headerName: 'Reward',
      width: 140,
      renderCell: (params) => (
        <Chip
          label={(params.value || 'PENDING')?.toString().charAt(0) + ((params.value || 'PENDING')?.toString().slice(1).toLowerCase() || '')}
          size="small"
          color={params.value === 'PAID' ? 'success' : 'warning'}
          sx={{ fontWeight: 600, borderRadius: '6px', minWidth: 72 }}
        />
      ),
    },
  ];

  const stats = data?.stats || { total: 0, converted: 0, pending: 0 };
  const allReferrals = data?.referrals || [];

  const referrals = allReferrals.filter((r: any) => {
    if (!search) return true;
    const s = search.toLowerCase();
    const referringName = r.referringClient ? `${r.referringClient.firstName} ${r.referringClient.lastName}`.toLowerCase() : '';
    const referredName = r.referredClient ? `${r.referredClient.firstName} ${r.referredClient.lastName}`.toLowerCase() : '';
    const status = (r.status || '').toLowerCase();
    const rewardStatus = (r.rewardStatus || 'pending').toLowerCase();
    const date = r.createdAt ? format(new Date(r.createdAt), 'MMM d, yyyy').toLowerCase() : '';
    return referringName.includes(s) || referredName.includes(s) || status.includes(s) || rewardStatus.includes(s) || date.includes(s);
  });

  const handleExportCSV = () => {
    const csv = [
      ['Referred By', 'New Client', 'Date', 'Status', 'Reward Status'].join(','),
      ...referrals.map((r: any) => [
        `"${r.referringClient ? `${r.referringClient.firstName} ${r.referringClient.lastName}` : '-'}"`,
        `"${r.referredClient ? `${r.referredClient.firstName} ${r.referredClient.lastName}` : '-'}"`,
        r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '',
        r.status || '',
        r.rewardStatus || 'PENDING',
      ].join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `referrals-${new Date().toISOString().split('T')[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <Box className="animate-fade-in">
      {/* Gradient Header */}
      <Paper elevation={0} sx={{
        p: 3, mb: 3, borderRadius: 3,
        background: 'linear-gradient(135deg, #4a148c 0%, #6a1b9a 50%, #9c27b0 100%)',
        color: 'white',
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.15)', width: 52, height: 52 }}>
              <Share sx={{ fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight={700}>Referral Program</Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>Track client referrals and rewards</Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Export as PDF">
              <Button variant="outlined" size="small" startIcon={<PictureAsPdf />}
                onClick={() => window.open('/api/export/pdf?type=referrals', '_blank')}
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
            <Button variant="contained" startIcon={<Add />} onClick={() => setDialogOpen(true)}
              sx={{ bgcolor: 'white', color: '#6a1b9a', fontWeight: 600, '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' } }}>
              Add Referral
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Stats Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Total Referrals', value: stats.total, icon: <PersonAdd />, color: '#6a1b9a', bg: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)' },
          { label: 'Converted', value: stats.converted, icon: <EmojiEvents />, color: '#2e7d32', bg: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)' },
          { label: 'Pending', value: stats.pending, icon: <People />, color: '#1976d2', bg: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)' },
          {
            label: 'Conversion Rate',
            value: `${stats.total > 0 ? Math.round((stats.converted / stats.total) * 100) : 0}%`,
            icon: <TrendingUp />,
            color: '#e65100',
            bg: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)',
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

      {/* Search Bar */}
      <Card sx={{ mb: 2, borderRadius: 2.5, overflow: 'visible' }}>
        <CardContent sx={{ py: 2, px: 2.5, '&:last-child': { pb: 2 } }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search by client name, status, reward status..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ color: 'text.secondary' }} /></InputAdornment> }}
            sx={{ maxWidth: 400, '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'grey.50' } }}
          />
        </CardContent>
      </Card>

      {/* Data Grid */}
      <Card sx={{ borderRadius: 2.5, overflow: 'hidden' }}>
        <DataGrid
          rows={referrals}
          columns={columns}
          loading={isLoading}
          pageSizeOptions={[10, 25, 50]}
          disableRowSelectionOnClick
          onRowClick={(params) => setDetailReferral(params.row)}
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

      {/* Referral Detail Dialog */}
      <Dialog open={!!detailReferral} onClose={() => setDetailReferral(null)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}>
        <Box sx={{
          p: 3,
          background: 'linear-gradient(135deg, #4a148c 0%, #6a1b9a 50%, #9c27b0 100%)',
          color: 'white',
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.15)', width: 52, height: 52 }}>
                <Share sx={{ fontSize: 28 }} />
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight={700}>Referral Details</Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                  <Chip
                    label={detailReferral?.status?.charAt(0) + (detailReferral?.status?.slice(1).toLowerCase() || '')}
                    size="small"
                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600, borderRadius: '6px', fontSize: '0.72rem' }}
                  />
                  <Chip
                    label={`Reward: ${(detailReferral?.rewardStatus || 'PENDING')?.charAt(0) + ((detailReferral?.rewardStatus || 'PENDING')?.slice(1).toLowerCase() || '')}`}
                    size="small"
                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600, borderRadius: '6px', fontSize: '0.72rem' }}
                  />
                </Box>
              </Box>
            </Box>
            <IconButton onClick={() => setDetailReferral(null)} sx={{ color: 'white' }}>
              <Close />
            </IconButton>
          </Box>
        </Box>
        <DialogContent dividers>
          <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 1 }}>Referring Client</Typography>
          <Paper variant="outlined" sx={{ p: 2.5, mb: 2.5, mt: 1, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar sx={{ bgcolor: 'rgba(106,27,154,0.1)', color: '#6a1b9a', width: 40, height: 40, fontSize: '0.85rem', fontWeight: 600 }}>
                {detailReferral?.referringClient ? `${detailReferral.referringClient.firstName?.[0] || ''}${detailReferral.referringClient.lastName?.[0] || ''}` : '?'}
              </Avatar>
              <Box>
                <Typography variant="subtitle2" fontWeight={600}>
                  {detailReferral?.referringClient ? `${detailReferral.referringClient.firstName} ${detailReferral.referringClient.lastName}` : '-'}
                </Typography>
                <Typography variant="caption" color="text.secondary">Referring Client</Typography>
              </Box>
            </Box>
          </Paper>

          <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 1 }}>Referred Client</Typography>
          <Paper variant="outlined" sx={{ p: 2.5, mb: 2.5, mt: 1, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar sx={{ bgcolor: 'rgba(46,125,50,0.1)', color: '#2e7d32', width: 40, height: 40, fontSize: '0.85rem', fontWeight: 600 }}>
                {detailReferral?.referredClient ? `${detailReferral.referredClient.firstName?.[0] || ''}${detailReferral.referredClient.lastName?.[0] || ''}` : '?'}
              </Avatar>
              <Box>
                <Typography variant="subtitle2" fontWeight={600}>
                  {detailReferral?.referredClient ? `${detailReferral.referredClient.firstName} ${detailReferral.referredClient.lastName}` : '-'}
                </Typography>
                <Typography variant="caption" color="text.secondary">Referred Client</Typography>
              </Box>
            </Box>
          </Paper>

          <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 1 }}>Details</Typography>
          <Paper variant="outlined" sx={{ p: 2.5, mt: 1, borderRadius: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>Date</Typography>
                <Typography variant="body2" fontWeight={600}>
                  {detailReferral?.createdAt ? format(new Date(detailReferral.createdAt), 'MMM d, yyyy') : '-'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>Status</Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip
                    label={detailReferral?.status?.charAt(0) + (detailReferral?.status?.slice(1).toLowerCase() || '')}
                    size="small"
                    color={detailReferral?.status === 'CONVERTED' ? 'success' : detailReferral?.status === 'PENDING' ? 'warning' : 'default'}
                    sx={{ fontWeight: 600, borderRadius: '6px' }}
                  />
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>Reward Status</Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip
                    label={(detailReferral?.rewardStatus || 'PENDING')?.charAt(0) + ((detailReferral?.rewardStatus || 'PENDING')?.slice(1).toLowerCase() || '')}
                    size="small"
                    color={detailReferral?.rewardStatus === 'PAID' ? 'success' : 'warning'}
                    sx={{ fontWeight: 600, borderRadius: '6px' }}
                  />
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
          <Button
            color="error"
            startIcon={<Delete />}
            onClick={async () => {
              if (confirm('Are you sure you want to delete this referral?')) {
                try {
                  await axios.delete(`/api/referrals/${detailReferral?.id}`);
                  queryClient.invalidateQueries({ queryKey: ['referrals'] });
                  setDetailReferral(null);
                  setSnackbar({ open: true, message: 'Referral deleted successfully', severity: 'success' });
                } catch {
                  setSnackbar({ open: true, message: 'Failed to delete referral', severity: 'error' });
                }
              }
            }}
            sx={{ borderRadius: 2 }}
          >
            Delete
          </Button>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button onClick={() => setDetailReferral(null)} sx={{ borderRadius: 2 }}>Close</Button>
            <Button
              variant="contained"
              startIcon={<Edit />}
              onClick={() => setDetailReferral(null)}
              sx={{ borderRadius: 2, bgcolor: '#6a1b9a', '&:hover': { bgcolor: '#4a148c' } }}
            >
              Edit
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* Add Referral Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ width: 48, height: 48, bgcolor: '#6a1b9a' }}>
                <PersonAdd />
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight={600}>Add Referral</Typography>
                <Typography variant="body2" color="text.secondary">Record a new client referral</Typography>
              </Box>
            </Box>
            <IconButton onClick={() => { setDialogOpen(false); setReferringClient(null); setReferredForm({ firstName: '', lastName: '', email: '', phone: '' }); }} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 1 }}>Referring Client (Existing)</Typography>
          <Paper variant="outlined" sx={{ p: 2.5, mb: 2.5, mt: 1, borderRadius: 2 }}>
            <Autocomplete
              options={clientsData?.clients || []}
              getOptionLabel={(option: any) => `${option.firstName} ${option.lastName}`}
              value={referringClient}
              onChange={(_, value) => setReferringClient(value)}
              renderInput={(params) => <TextField {...params} label="Select Existing Client" required sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />}
            />
          </Paper>

          <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 1 }}>New Referred Client</Typography>
          <Paper variant="outlined" sx={{ p: 2.5, mt: 1, borderRadius: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  value={referredForm.firstName}
                  onChange={(e) => setReferredForm({ ...referredForm, firstName: e.target.value })}
                  required
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  value={referredForm.lastName}
                  onChange={(e) => setReferredForm({ ...referredForm, lastName: e.target.value })}
                  required
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={referredForm.email}
                  onChange={(e) => setReferredForm({ ...referredForm, email: e.target.value })}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={referredForm.phone}
                  onChange={(e) => setReferredForm({ ...referredForm, phone: e.target.value })}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>
            </Grid>
          </Paper>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => { setDialogOpen(false); setReferringClient(null); setReferredForm({ firstName: '', lastName: '', email: '', phone: '' }); }} sx={{ borderRadius: 2 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={!referringClient || !referredForm.firstName || !referredForm.lastName}
            onClick={async () => {
              try {
                await axios.post('/api/referrals', {
                  referringClientId: referringClient?.id,
                  referredFirstName: referredForm.firstName,
                  referredLastName: referredForm.lastName,
                  referredEmail: referredForm.email,
                  referredPhone: referredForm.phone,
                  status: 'PENDING',
                });
                queryClient.invalidateQueries({ queryKey: ['referrals'] });
                setSnackbar({ open: true, message: 'Referral added successfully', severity: 'success' });
                setDialogOpen(false);
                setReferringClient(null);
                setReferredForm({ firstName: '', lastName: '', email: '', phone: '' });
              } catch {
                setSnackbar({ open: true, message: 'Failed to add referral', severity: 'error' });
              }
            }}
            sx={{ borderRadius: 2, bgcolor: '#6a1b9a', '&:hover': { bgcolor: '#4a148c' } }}
          >
            Add Referral
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
