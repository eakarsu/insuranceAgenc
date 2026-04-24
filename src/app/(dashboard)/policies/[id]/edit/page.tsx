'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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

const lobOptions = [
  { value: 'PERSONAL_AUTO', label: 'Personal Auto' },
  { value: 'HOMEOWNERS', label: 'Homeowners' },
  { value: 'RENTERS', label: 'Renters' },
  { value: 'UMBRELLA', label: 'Umbrella' },
  { value: 'LIFE', label: 'Life' },
  { value: 'COMMERCIAL_AUTO', label: 'Commercial Auto' },
  { value: 'COMMERCIAL_PROPERTY', label: 'Commercial Property' },
  { value: 'GENERAL_LIABILITY', label: 'General Liability' },
  { value: 'WORKERS_COMP', label: 'Workers Compensation' },
  { value: 'PROFESSIONAL_LIABILITY', label: 'Professional Liability' },
];

export default function EditPolicyPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const queryClient = useQueryClient();
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const { control, handleSubmit, reset, setValue } = useForm({
    defaultValues: {
      clientId: '',
      carrierId: '',
      lineOfBusiness: '',
      type: '',
      effectiveDate: new Date(),
      expirationDate: new Date(),
      premium: '',
      status: 'ACTIVE',
      billingMethod: 'AGENCY',
      downPayment: '',
      installments: '',
      notes: '',
    },
  });

  const { data: policy, isLoading: policyLoading } = useQuery({
    queryKey: ['policy', id],
    queryFn: async () => {
      const response = await axios.get(`/api/policies/${id}`);
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

  const { data: carriers = [] } = useQuery({
    queryKey: ['carriers'],
    queryFn: async () => {
      const response = await axios.get('/api/carriers');
      return response.data;
    },
  });

  // Populate form when policy data loads
  useEffect(() => {
    if (policy) {
      reset({
        clientId: policy.clientId || '',
        carrierId: policy.carrierId || '',
        lineOfBusiness: policy.lineOfBusiness || '',
        type: policy.type || '',
        effectiveDate: policy.effectiveDate ? new Date(policy.effectiveDate) : new Date(),
        expirationDate: policy.expirationDate ? new Date(policy.expirationDate) : new Date(),
        premium: policy.premium?.toString() || '',
        status: policy.status || 'ACTIVE',
        billingMethod: policy.billingMethod || 'AGENCY',
        downPayment: policy.downPayment?.toString() || '',
        installments: policy.installments?.toString() || '',
        notes: policy.notes || '',
      });
    }
  }, [policy, reset]);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await axios.put(`/api/policies/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policy', id] });
      queryClient.invalidateQueries({ queryKey: ['policies'] });
      setSnackbar({ open: true, message: 'Policy updated successfully', severity: 'success' });
      setTimeout(() => router.push(`/policies/${id}`), 1000);
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to update policy', severity: 'error' });
    },
  });

  const onSubmit = (data: any) => {
    updateMutation.mutate({
      ...data,
      premium: data.premium ? parseFloat(data.premium) : 0,
      downPayment: data.downPayment ? parseFloat(data.downPayment) : null,
      installments: data.installments ? parseInt(data.installments) : null,
    });
  };

  if (policyLoading) {
    return (
      <Box>
        <Skeleton variant="rectangular" height={60} sx={{ mb: 3 }} />
        <Skeleton variant="rectangular" height={400} />
      </Box>
    );
  }

  if (!policy) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h5" color="text.secondary">Policy not found</Typography>
        <Button sx={{ mt: 2 }} onClick={() => router.push('/policies')}>Back to Policies</Button>
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box className="animate-fade-in">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Button startIcon={<ArrowBack />} onClick={() => router.back()}>Back</Button>
          <Typography variant="h4" fontWeight={700}>Edit Policy</Typography>
          <Typography variant="h6" color="text.secondary">{policy.policyNumber}</Typography>
          <Box sx={{ flex: 1 }} />
          <Button variant="contained" startIcon={<Save />} onClick={handleSubmit(onSubmit)}
            disabled={updateMutation.isPending}>
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </Box>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>Policy Information</Typography>

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
                    name="carrierId"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth required>
                        <InputLabel>Carrier</InputLabel>
                        <Select {...field} label="Carrier">
                          {carriers.map((carrier: any) => (
                            <MenuItem key={carrier.id} value={carrier.id}>{carrier.name}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Controller
                    name="lineOfBusiness"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth required>
                        <InputLabel>Line of Business</InputLabel>
                        <Select {...field} label="Line of Business">
                          {lobOptions.map((lob) => (
                            <MenuItem key={lob.value} value={lob.value}>{lob.label}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Controller
                    name="type"
                    control={control}
                    render={({ field }) => (
                      <TextField {...field} fullWidth label="Policy Type" />
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
                          <MenuItem value="ACTIVE">Active</MenuItem>
                          <MenuItem value="PENDING">Pending</MenuItem>
                          <MenuItem value="CANCELLED">Cancelled</MenuItem>
                          <MenuItem value="EXPIRED">Expired</MenuItem>
                          <MenuItem value="NON_RENEWED">Non-Renewed</MenuItem>
                        </Select>
                      </FormControl>
                    )}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Controller
                    name="billingMethod"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth>
                        <InputLabel>Billing Method</InputLabel>
                        <Select {...field} label="Billing Method">
                          <MenuItem value="AGENCY">Agency Bill</MenuItem>
                          <MenuItem value="DIRECT">Direct Bill</MenuItem>
                          <MenuItem value="PREMIUM_FINANCE">Premium Finance</MenuItem>
                        </Select>
                      </FormControl>
                    )}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Controller
                    name="effectiveDate"
                    control={control}
                    render={({ field }) => (
                      <DatePicker
                        label="Effective Date"
                        value={field.value}
                        onChange={field.onChange}
                        slotProps={{ textField: { fullWidth: true, required: true } }}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Controller
                    name="expirationDate"
                    control={control}
                    render={({ field }) => (
                      <DatePicker
                        label="Expiration Date"
                        value={field.value}
                        onChange={field.onChange}
                        slotProps={{ textField: { fullWidth: true, required: true } }}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <Controller
                    name="premium"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Premium"
                        type="number"
                        required
                        InputProps={{ startAdornment: '$' }}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <Controller
                    name="downPayment"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Down Payment"
                        type="number"
                        InputProps={{ startAdornment: '$' }}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <Controller
                    name="installments"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Installments"
                        type="number"
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Controller
                    name="notes"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Notes"
                        multiline
                        rows={3}
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
