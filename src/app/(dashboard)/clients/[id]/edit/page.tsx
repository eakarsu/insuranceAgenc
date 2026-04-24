'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useForm, Controller } from 'react-hook-form';
import {
  Box, Card, CardContent, Typography, Grid, TextField, Button, FormControl, InputLabel,
  Select, MenuItem, Alert, Snackbar, Skeleton, Chip, Avatar, Divider,
} from '@mui/material';
import { ArrowBack, Save, Person, Business } from '@mui/icons-material';

interface ClientForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  mobile: string;
  dateOfBirth: string;
  type: string;
  status: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  source: string;
  notes: string;
  businessName: string;
  businessType: string;
  yearsInBusiness: string;
  numberOfEmployees: string;
  annualRevenue: string;
}

export default function EditClientPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const queryClient = useQueryClient();
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const { data: client, isLoading } = useQuery({
    queryKey: ['client', id],
    queryFn: async () => {
      const response = await axios.get(`/api/clients/${id}`);
      return response.data;
    },
  });

  const { control, handleSubmit, watch, reset } = useForm<ClientForm>({
    values: client ? {
      firstName: client.firstName || '',
      lastName: client.lastName || '',
      email: client.email || '',
      phone: client.phone || '',
      mobile: client.mobile || '',
      dateOfBirth: client.dateOfBirth ? client.dateOfBirth.split('T')[0] : '',
      type: client.type || 'PERSONAL',
      status: client.status || 'ACTIVE',
      address: client.address || '',
      city: client.city || '',
      state: client.state || '',
      zipCode: client.zipCode || '',
      source: client.source || '',
      notes: client.notes || '',
      businessName: client.businessName || '',
      businessType: client.businessType || '',
      yearsInBusiness: client.yearsInBusiness?.toString() || '',
      numberOfEmployees: client.numberOfEmployees?.toString() || '',
      annualRevenue: client.annualRevenue?.toString() || '',
    } : undefined,
  });

  const clientType = watch('type');

  const updateMutation = useMutation({
    mutationFn: async (data: ClientForm) => {
      const payload: any = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email || null,
        phone: data.phone || null,
        mobile: data.mobile || null,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth).toISOString() : null,
        type: data.type,
        status: data.status,
        address: data.address || null,
        city: data.city || null,
        state: data.state || null,
        zipCode: data.zipCode || null,
        source: data.source || null,
        notes: data.notes || null,
      };

      if (data.type === 'COMMERCIAL') {
        payload.businessName = data.businessName || null;
        payload.businessType = data.businessType || null;
        payload.yearsInBusiness = data.yearsInBusiness ? parseInt(data.yearsInBusiness) : null;
        payload.numberOfEmployees = data.numberOfEmployees ? parseInt(data.numberOfEmployees) : null;
        payload.annualRevenue = data.annualRevenue ? parseFloat(data.annualRevenue) : null;
      }

      const response = await axios.put(`/api/clients/${id}`, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client', id] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setSnackbar({ open: true, message: 'Client updated successfully', severity: 'success' });
      setTimeout(() => router.push(`/clients/${id}`), 1000);
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.error || 'Failed to update client';
      setSnackbar({ open: true, message: msg, severity: 'error' });
    },
  });

  const onSubmit = (data: ClientForm) => {
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <Box>
        <Skeleton variant="rectangular" height={60} sx={{ mb: 3, borderRadius: 2 }} />
        <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
      </Box>
    );
  }

  if (!client) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h5" color="text.secondary">Client not found</Typography>
        <Button sx={{ mt: 2 }} onClick={() => router.push('/clients')}>Back to Clients</Button>
      </Box>
    );
  }

  return (
    <Box className="animate-fade-in">
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={() => router.back()}>Back</Button>
        <Avatar sx={{ bgcolor: client.type === 'PERSONAL' ? 'primary.main' : 'secondary.main', width: 40, height: 40 }}>
          {client.type === 'PERSONAL' ? <Person /> : <Business />}
        </Avatar>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Edit: {client.type === 'COMMERCIAL' && client.businessName ? client.businessName : `${client.firstName} ${client.lastName}`}
          </Typography>
        </Box>
        <Box sx={{ flex: 1 }} />
        <Button variant="contained" startIcon={<Save />} onClick={handleSubmit(onSubmit)} disabled={updateMutation.isPending}>
          {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </Box>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Personal Information */}
        <Card sx={{ mb: 2 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>Personal Information</Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Controller name="firstName" control={control} rules={{ required: 'First name is required' }}
                  render={({ field, fieldState }) => (
                    <TextField {...field} fullWidth label="First Name" required error={!!fieldState.error} helperText={fieldState.error?.message} />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller name="lastName" control={control} rules={{ required: 'Last name is required' }}
                  render={({ field, fieldState }) => (
                    <TextField {...field} fullWidth label="Last Name" required error={!!fieldState.error} helperText={fieldState.error?.message} />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller name="email" control={control}
                  render={({ field }) => <TextField {...field} fullWidth label="Email" type="email" />}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller name="phone" control={control}
                  render={({ field }) => <TextField {...field} fullWidth label="Phone" />}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller name="mobile" control={control}
                  render={({ field }) => <TextField {...field} fullWidth label="Mobile" />}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller name="dateOfBirth" control={control}
                  render={({ field }) => <TextField {...field} fullWidth label="Date of Birth" type="date" InputLabelProps={{ shrink: true }} />}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Type & Status */}
        <Card sx={{ mb: 2 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>Classification</Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Controller name="type" control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Client Type</InputLabel>
                      <Select {...field} label="Client Type">
                        <MenuItem value="PERSONAL">Personal</MenuItem>
                        <MenuItem value="COMMERCIAL">Commercial</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller name="status" control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Status</InputLabel>
                      <Select {...field} label="Status">
                        <MenuItem value="PROSPECT">Prospect</MenuItem>
                        <MenuItem value="ACTIVE">Active</MenuItem>
                        <MenuItem value="INACTIVE">Inactive</MenuItem>
                        <MenuItem value="FORMER">Former</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller name="source" control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Source</InputLabel>
                      <Select {...field} label="Source">
                        <MenuItem value="">None</MenuItem>
                        <MenuItem value="REFERRAL">Referral</MenuItem>
                        <MenuItem value="WEBSITE">Website</MenuItem>
                        <MenuItem value="WALK_IN">Walk-in</MenuItem>
                        <MenuItem value="PHONE">Phone</MenuItem>
                        <MenuItem value="SOCIAL_MEDIA">Social Media</MenuItem>
                        <MenuItem value="ADVERTISING">Advertising</MenuItem>
                        <MenuItem value="OTHER">Other</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Business Information (only for Commercial) */}
        {clientType === 'COMMERCIAL' && (
          <Card sx={{ mb: 2 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>Business Information</Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Controller name="businessName" control={control}
                    render={({ field }) => <TextField {...field} fullWidth label="Business Name" />}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Controller name="businessType" control={control}
                    render={({ field }) => <TextField {...field} fullWidth label="Business Type" placeholder="e.g. Restaurant, Retail, Tech" />}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <Controller name="yearsInBusiness" control={control}
                    render={({ field }) => <TextField {...field} fullWidth label="Years in Business" type="number" />}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <Controller name="numberOfEmployees" control={control}
                    render={({ field }) => <TextField {...field} fullWidth label="Number of Employees" type="number" />}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <Controller name="annualRevenue" control={control}
                    render={({ field }) => <TextField {...field} fullWidth label="Annual Revenue" type="number" InputProps={{ startAdornment: '$' }} />}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* Address */}
        <Card sx={{ mb: 2 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>Address</Typography>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Controller name="address" control={control}
                  render={({ field }) => <TextField {...field} fullWidth label="Street Address" />}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Controller name="city" control={control}
                  render={({ field }) => <TextField {...field} fullWidth label="City" />}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Controller name="state" control={control}
                  render={({ field }) => <TextField {...field} fullWidth label="State" />}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Controller name="zipCode" control={control}
                  render={({ field }) => <TextField {...field} fullWidth label="ZIP Code" />}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>Notes</Typography>
            <Controller name="notes" control={control}
              render={({ field }) => <TextField {...field} fullWidth multiline rows={4} placeholder="Add notes about this client..." />}
            />
          </CardContent>
        </Card>
      </form>

      <Snackbar open={snackbar.open} autoHideDuration={5000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}
