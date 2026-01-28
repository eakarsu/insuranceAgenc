'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  Box, Card, CardContent, Typography, Button, Grid, Avatar, Chip, TextField, InputAdornment,
  Dialog, DialogTitle, DialogContent, DialogActions, Autocomplete, Snackbar, Alert,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Add, Search, PersonAdd, EmojiEvents, TrendingUp } from '@mui/icons-material';
import { format } from 'date-fns';

export default function ReferralsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [referringClient, setReferringClient] = useState<any>(null);
  const [referredForm, setReferredForm] = useState({ firstName: '', lastName: '', email: '', phone: '' });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

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
      valueGetter: (value: any) => value ? `${value.firstName} ${value.lastName}` : '-',
    },
    {
      field: 'referredClient',
      headerName: 'New Client',
      flex: 1,
      valueGetter: (value: any) => value ? `${value.firstName} ${value.lastName}` : '-',
    },
    {
      field: 'createdAt',
      headerName: 'Date',
      width: 120,
      valueFormatter: (value: string) => value ? format(new Date(value), 'MM/dd/yyyy') : '-',
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          color={params.value === 'CONVERTED' ? 'success' : params.value === 'PENDING' ? 'warning' : 'default'}
        />
      ),
    },
    {
      field: 'rewardStatus',
      headerName: 'Reward',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value || 'PENDING'}
          size="small"
          color={params.value === 'PAID' ? 'success' : 'warning'}
        />
      ),
    },
  ];

  const stats = data?.stats || { total: 0, converted: 0, pending: 0 };

  return (
    <Box className="animate-fade-in">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>Referral Program</Typography>
          <Typography color="text.secondary">Track client referrals and rewards</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => setDialogOpen(true)}>Add Referral</Button>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <PersonAdd sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4" fontWeight={700}>{stats.total}</Typography>
              <Typography color="text.secondary">Total Referrals</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <EmojiEvents sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h4" fontWeight={700}>{stats.converted}</Typography>
              <Typography color="text.secondary">Converted</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <TrendingUp sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
              <Typography variant="h4" fontWeight={700}>
                {stats.total > 0 ? Math.round((stats.converted / stats.total) * 100) : 0}%
              </Typography>
              <Typography color="text.secondary">Conversion Rate</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ mb: 3, p: 2 }}>
        <TextField
          placeholder="Search referrals..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
          sx={{ width: 300 }}
        />
      </Card>

      <Card>
        <DataGrid
          rows={data?.referrals || []}
          columns={columns}
          loading={isLoading}
          pageSizeOptions={[10, 25, 50]}
          disableRowSelectionOnClick
          onRowClick={(params) => router.push(`/marketing/referrals/${params.row.id}`)}
          sx={{ border: 'none', '& .MuiDataGrid-row': { cursor: 'pointer' } }}
          autoHeight
        />
      </Card>

      {/* Add Referral Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Referral</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">Referring Client (Existing)</Typography>
            <Autocomplete
              options={clientsData?.clients || []}
              getOptionLabel={(option: any) => `${option.firstName} ${option.lastName}`}
              value={referringClient}
              onChange={(_, value) => setReferringClient(value)}
              renderInput={(params) => <TextField {...params} label="Select Existing Client" required />}
            />

            <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>New Referred Client</Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  value={referredForm.firstName}
                  onChange={(e) => setReferredForm({ ...referredForm, firstName: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  value={referredForm.lastName}
                  onChange={(e) => setReferredForm({ ...referredForm, lastName: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={referredForm.email}
                  onChange={(e) => setReferredForm({ ...referredForm, email: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={referredForm.phone}
                  onChange={(e) => setReferredForm({ ...referredForm, phone: e.target.value })}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setDialogOpen(false); setReferringClient(null); setReferredForm({ firstName: '', lastName: '', email: '', phone: '' }); }}>Cancel</Button>
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
