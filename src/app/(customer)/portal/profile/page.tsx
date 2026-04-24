'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  Box, AppBar, Toolbar, Typography, Button, Card, CardContent, Grid,
  TextField, Snackbar, Alert, Skeleton, Divider, Avatar,
} from '@mui/material';
import { Person, Edit, Save, Cancel } from '@mui/icons-material';

interface CustomerProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  mobile: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  businessName?: string;
  type?: string;
}

export default function CustomerProfilePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<CustomerProfile>>({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const { data: profile, isLoading } = useQuery<CustomerProfile>({
    queryKey: ['customerProfile'],
    queryFn: async () => {
      const response = await axios.get('/api/customer/profile');
      return response.data;
    },
  });

  useEffect(() => {
    if (profile) {
      setForm({
        email: profile.email || '',
        phone: profile.phone || '',
        mobile: profile.mobile || '',
        address: profile.address || '',
        city: profile.city || '',
        state: profile.state || '',
        zipCode: profile.zipCode || '',
      });
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<CustomerProfile>) => {
      const response = await axios.patch('/api/customer/profile', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerProfile'] });
      setSnackbar({ open: true, message: 'Profile updated successfully', severity: 'success' });
      setEditing(false);
    },
    onError: (err: any) => {
      const message = err.response?.data?.error || 'Failed to update profile. Please try again.';
      setSnackbar({ open: true, message, severity: 'error' });
    },
  });

  const handleSave = () => {
    updateMutation.mutate(form);
  };

  const handleCancel = () => {
    if (profile) {
      setForm({
        email: profile.email || '',
        phone: profile.phone || '',
        mobile: profile.mobile || '',
        address: profile.address || '',
        city: profile.city || '',
        state: profile.state || '',
        zipCode: profile.zipCode || '',
      });
    }
    setEditing(false);
  };

  const handleFieldChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Box>
      {/* AppBar */}
      <AppBar position="static" sx={{ mb: 3 }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>InsureFlow Customer Portal</Typography>
          <Button color="inherit" onClick={() => router.push('/portal')}>Dashboard</Button>
          <Button color="inherit" onClick={async () => { await axios.post('/api/customer/auth/logout'); router.push('/portal/login'); }}>Logout</Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
        {/* Page Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Person sx={{ fontSize: 32, color: 'primary.main' }} />
            <Box>
              <Typography variant="h5" fontWeight={700}>My Profile</Typography>
              <Typography variant="body2" color="text.secondary">
                View and manage your personal information
              </Typography>
            </Box>
          </Box>
          {!editing ? (
            <Button
              variant="outlined"
              startIcon={<Edit />}
              onClick={() => setEditing(true)}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
            >
              Edit Profile
            </Button>
          ) : (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<Cancel />}
                onClick={handleCancel}
                sx={{ borderRadius: 2, textTransform: 'none' }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                startIcon={<Save />}
                onClick={handleSave}
                disabled={updateMutation.isPending}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
              >
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </Box>
          )}
        </Box>

        {isLoading ? (
          <Skeleton variant="rectangular" height={500} sx={{ borderRadius: 2.5 }} />
        ) : (
          <Card sx={{ borderRadius: 2.5, overflow: 'hidden' }}>
            {/* Profile Header */}
            <Box
              sx={{
                background: 'linear-gradient(135deg, #0d47a1 0%, #1565c0 50%, #1e88e5 100%)',
                color: 'white',
                p: 3,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <Avatar
                sx={{
                  width: 64, height: 64,
                  bgcolor: 'rgba(255,255,255,0.2)',
                  fontSize: '1.5rem',
                  fontWeight: 700,
                }}
              >
                {profile?.firstName?.[0]}{profile?.lastName?.[0]}
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight={700}>
                  {profile?.firstName} {profile?.lastName}
                </Typography>
                {profile?.businessName && (
                  <Typography variant="body2" sx={{ opacity: 0.85 }}>
                    {profile.businessName}
                  </Typography>
                )}
                <Typography variant="body2" sx={{ opacity: 0.7 }}>
                  {profile?.type === 'COMMERCIAL' ? 'Commercial Account' : 'Personal Account'}
                </Typography>
              </Box>
            </Box>

            <CardContent sx={{ p: 3 }}>
              {/* Contact Information */}
              <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 1 }}>
                Contact Information
              </Typography>
              <Divider sx={{ mb: 2.5, mt: 0.5 }} />

              <Grid container spacing={2.5}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    value={form.email || ''}
                    onChange={(e) => handleFieldChange('email', e.target.value)}
                    disabled={!editing}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone"
                    value={form.phone || ''}
                    onChange={(e) => handleFieldChange('phone', e.target.value)}
                    disabled={!editing}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Mobile"
                    value={form.mobile || ''}
                    onChange={(e) => handleFieldChange('mobile', e.target.value)}
                    disabled={!editing}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Grid>
              </Grid>

              {/* Address Information */}
              <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 1, mt: 3, display: 'block' }}>
                Address
              </Typography>
              <Divider sx={{ mb: 2.5, mt: 0.5 }} />

              <Grid container spacing={2.5}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Address"
                    value={form.address || ''}
                    onChange={(e) => handleFieldChange('address', e.target.value)}
                    disabled={!editing}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="City"
                    value={form.city || ''}
                    onChange={(e) => handleFieldChange('city', e.target.value)}
                    disabled={!editing}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="State"
                    value={form.state || ''}
                    onChange={(e) => handleFieldChange('state', e.target.value)}
                    disabled={!editing}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Zip Code"
                    value={form.zipCode || ''}
                    onChange={(e) => handleFieldChange('zipCode', e.target.value)}
                    disabled={!editing}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}
      </Box>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          sx={{ borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
