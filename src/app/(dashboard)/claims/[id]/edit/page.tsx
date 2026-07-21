'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useForm, Controller } from 'react-hook-form';
import {
  Box, Card, CardContent, Typography, Grid, TextField, Button, FormControl, InputLabel,
  Select, MenuItem, Autocomplete, Alert, Snackbar, Skeleton,
} from '@mui/material';
import { ArrowBack, Save } from '@mui/icons-material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

const claimTypes = [
  'AUTO_COLLISION',
  'AUTO_COMPREHENSIVE',
  'PROPERTY_DAMAGE',
  'THEFT',
  'FIRE',
  'WATER_DAMAGE',
  'LIABILITY',
  'MEDICAL',
  'WORKERS_COMP',
  'OTHER',
];

const statusOptions = [
  { value: 'REPORTED', label: 'Reported' },
  { value: 'UNDER_REVIEW', label: 'Under Review' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'DENIED', label: 'Denied' },
  { value: 'SETTLED', label: 'Settled' },
  { value: 'CLOSED', label: 'Closed' },
];

export default function EditClaimPage() {
  const params = useParams<{ id: string }>();
  const { id } = params;
  const router = useRouter();
  const queryClient = useQueryClient();
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      clientId: '',
      policyId: '',
      type: '',
      status: 'REPORTED',
      dateOfLoss: new Date(),
      lossLocation: '',
      description: '',
      estimatedLoss: '',
      deductible: '',
      paidAmount: '',
    },
  });

  const { data: claim, isLoading: claimLoading } = useQuery({
    queryKey: ['claim', id],
    queryFn: async () => {
      const response = await axios.get(`/api/claims/${id}`);
      return response.data;
    },
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients-list'],
    queryFn: async () => {
      const response = await axios.get('/api/clients?limit=100');
      return response.data.clients || [];
    },
  });

  const { data: policiesData } = useQuery({
    queryKey: ['policies-list'],
    queryFn: async () => {
      const response = await axios.get('/api/policies?limit=100');
      return response.data;
    },
  });

  const policies = policiesData?.policies || [];

  // Populate form when claim data loads
  useEffect(() => {
    if (claim) {
      reset({
        clientId: claim.clientId || '',
        policyId: claim.policyId || '',
        type: claim.type || '',
        status: claim.status || 'REPORTED',
        dateOfLoss: claim.dateOfLoss ? new Date(claim.dateOfLoss) : new Date(),
        lossLocation: claim.lossLocation || '',
        description: claim.description || '',
        estimatedLoss: claim.estimatedLoss?.toString() || '',
        deductible: claim.deductible?.toString() || '',
        paidAmount: claim.paidAmount?.toString() || '',
      });
    }
  }, [claim, reset]);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await axios.put(`/api/claims/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claim', id] });
      queryClient.invalidateQueries({ queryKey: ['claims'] });
      setSnackbar({ open: true, message: 'Claim updated successfully', severity: 'success' });
      setTimeout(() => router.push(`/claims/${id}`), 1000);
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to update claim', severity: 'error' });
    },
  });

  const onSubmit = (data: any) => {
    updateMutation.mutate({
      ...data,
      policyId: data.policyId || null,
      estimatedLoss: data.estimatedLoss ? parseFloat(data.estimatedLoss) : null,
      deductible: data.deductible ? parseFloat(data.deductible) : null,
      paidAmount: data.paidAmount ? parseFloat(data.paidAmount) : null,
    });
  };

  if (claimLoading) {
    return (
      <Box>
        <Skeleton variant="rectangular" height={60} sx={{ mb: 3 }} />
        <Skeleton variant="rectangular" height={500} />
      </Box>
    );
  }

  if (!claim) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h5" color="text.secondary">Claim not found</Typography>
        <Button sx={{ mt: 2 }} onClick={() => router.push('/claims')}>Back to Claims</Button>
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box className="animate-fade-in">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Button startIcon={<ArrowBack />} onClick={() => router.back()}>Back</Button>
          <Typography variant="h4" fontWeight={700}>Edit Claim</Typography>
          <Typography variant="h6" color="text.secondary">{claim.claimNumber}</Typography>
          <Box sx={{ flex: 1 }} />
          <Button variant="contained" startIcon={<Save />} onClick={handleSubmit(onSubmit)}
            disabled={updateMutation.isPending}>
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </Box>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>Claim Information</Typography>

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="clientId"
                    control={control}
                    render={({ field }) => (
                      <Autocomplete
                        options={clients}
                        getOptionLabel={(option: any) =>
                          option.type === 'COMMERCIAL' && option.businessName
                            ? option.businessName
                            : `${option.firstName} ${option.lastName}`
                        }
                        value={clients.find((c: any) => c.id === field.value) || null}
                        onChange={(_, value) => field.onChange(value?.id || '')}
                        renderInput={(params) => <TextField {...params} label="Client" required />}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Controller
                    name="policyId"
                    control={control}
                    render={({ field }) => (
                      <Autocomplete
                        options={policies}
                        getOptionLabel={(option: any) => `${option.policyNumber} - ${option.lineOfBusiness?.replace(/_/g, ' ')}`}
                        value={policies.find((p: any) => p.id === field.value) || null}
                        onChange={(_, value) => field.onChange(value?.id || '')}
                        renderInput={(params) => <TextField {...params} label="Policy" />}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Controller
                    name="type"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth required>
                        <InputLabel>Claim Type</InputLabel>
                        <Select {...field} label="Claim Type">
                          {claimTypes.map((type) => (
                            <MenuItem key={type} value={type}>{type.replace(/_/g, ' ')}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Controller
                    name="status"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth>
                        <InputLabel>Status</InputLabel>
                        <Select {...field} label="Status">
                          {statusOptions.map((status) => (
                            <MenuItem key={status.value} value={status.value}>{status.label}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Controller
                    name="dateOfLoss"
                    control={control}
                    render={({ field }) => (
                      <DatePicker
                        label="Date of Loss"
                        value={field.value}
                        onChange={field.onChange}
                        slotProps={{ textField: { fullWidth: true, required: true } }}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Controller
                    name="lossLocation"
                    control={control}
                    render={({ field }) => (
                      <TextField {...field} fullWidth label="Loss Location" />
                    )}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Controller
                    name="description"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Description"
                        multiline
                        rows={4}
                        placeholder="Describe the incident..."
                      />
                    )}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>Financial Details</Typography>

              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Controller
                    name="estimatedLoss"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Estimated Loss"
                        type="number"
                        InputProps={{ startAdornment: '$' }}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <Controller
                    name="deductible"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Deductible"
                        type="number"
                        InputProps={{ startAdornment: '$' }}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <Controller
                    name="paidAmount"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Amount Paid"
                        type="number"
                        InputProps={{ startAdornment: '$' }}
                      />
                    )}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </form>

        <Snackbar open={snackbar.open} autoHideDuration={5000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
        </Snackbar>
      </Box>
    </LocalizationProvider>
  );
}
