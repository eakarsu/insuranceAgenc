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

const statusOptions = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'QUOTED', label: 'Quoted' },
  { value: 'PROPOSED', label: 'Proposed' },
  { value: 'ACCEPTED', label: 'Accepted' },
  { value: 'DECLINED', label: 'Declined' },
  { value: 'BOUND', label: 'Bound' },
  { value: 'EXPIRED', label: 'Expired' },
];

export default function EditQuotePage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const queryClient = useQueryClient();
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      clientId: '',
      carrierId: '',
      lineOfBusiness: '',
      type: '',
      effectiveDate: new Date(),
      expiresAt: null as Date | null,
      premium: '',
      fees: '',
      taxes: '',
      totalPremium: '',
      status: 'DRAFT',
      notes: '',
    },
  });

  const { data: quote, isLoading: quoteLoading } = useQuery({
    queryKey: ['quote', id],
    queryFn: async () => {
      const response = await axios.get(`/api/quotes/${id}`);
      return response.data;
    },
  });

  const { data: clientsData } = useQuery({
    queryKey: ['clients-list'],
    queryFn: async () => {
      const response = await axios.get('/api/clients?limit=100');
      return response.data;
    },
  });

  const clients = Array.isArray(clientsData?.clients) ? clientsData.clients : [];

  const { data: carriers = [] } = useQuery({
    queryKey: ['carriers'],
    queryFn: async () => {
      const response = await axios.get('/api/carriers');
      return response.data;
    },
  });

  // Populate form when quote data loads
  useEffect(() => {
    if (quote) {
      reset({
        clientId: quote.clientId || '',
        carrierId: quote.carrierId || '',
        lineOfBusiness: quote.lineOfBusiness || '',
        type: quote.type || '',
        effectiveDate: quote.effectiveDate ? new Date(quote.effectiveDate) : new Date(),
        expiresAt: quote.expiresAt ? new Date(quote.expiresAt) : null,
        premium: quote.premium?.toString() || '',
        fees: quote.fees?.toString() || '',
        taxes: quote.taxes?.toString() || '',
        totalPremium: quote.totalPremium?.toString() || '',
        status: quote.status || 'DRAFT',
        notes: quote.notes || '',
      });
    }
  }, [quote, reset]);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await axios.put(`/api/quotes/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quote', id] });
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      setSnackbar({ open: true, message: 'Quote updated successfully', severity: 'success' });
      setTimeout(() => router.push(`/quotes/${id}`), 1000);
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to update quote', severity: 'error' });
    },
  });

  const onSubmit = (data: any) => {
    updateMutation.mutate({
      ...data,
      carrierId: data.carrierId || null,
      premium: data.premium ? parseFloat(data.premium) : null,
      fees: data.fees ? parseFloat(data.fees) : null,
      taxes: data.taxes ? parseFloat(data.taxes) : null,
      totalPremium: data.totalPremium ? parseFloat(data.totalPremium) : null,
    });
  };

  if (quoteLoading) {
    return (
      <Box>
        <Skeleton variant="rectangular" height={60} sx={{ mb: 3 }} />
        <Skeleton variant="rectangular" height={500} />
      </Box>
    );
  }

  if (!quote) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h5" color="text.secondary">Quote not found</Typography>
        <Button sx={{ mt: 2 }} onClick={() => router.push('/quotes')}>Back to Quotes</Button>
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box className="animate-fade-in">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Button startIcon={<ArrowBack />} onClick={() => router.back()}>Back</Button>
          <Typography variant="h4" fontWeight={700}>Edit Quote</Typography>
          <Typography variant="h6" color="text.secondary">{quote.quoteNumber}</Typography>
          <Box sx={{ flex: 1 }} />
          <Button variant="contained" startIcon={<Save />} onClick={handleSubmit(onSubmit)}
            disabled={updateMutation.isPending}>
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </Box>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>Quote Information</Typography>

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
                      <FormControl fullWidth>
                        <InputLabel>Carrier</InputLabel>
                        <Select {...field} label="Carrier">
                          <MenuItem value="">None</MenuItem>
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
                      <TextField {...field} fullWidth label="Quote Type" />
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
                    name="expiresAt"
                    control={control}
                    render={({ field }) => (
                      <DatePicker
                        label="Quote Expiration Date"
                        value={field.value}
                        onChange={field.onChange}
                        slotProps={{ textField: { fullWidth: true } }}
                      />
                    )}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>Premium Details</Typography>

              <Grid container spacing={3}>
                <Grid item xs={12} md={3}>
                  <Controller
                    name="premium"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Base Premium"
                        type="number"
                        InputProps={{ startAdornment: '$' }}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} md={3}>
                  <Controller
                    name="fees"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Fees"
                        type="number"
                        InputProps={{ startAdornment: '$' }}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} md={3}>
                  <Controller
                    name="taxes"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Taxes"
                        type="number"
                        InputProps={{ startAdornment: '$' }}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} md={3}>
                  <Controller
                    name="totalPremium"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Total Premium"
                        type="number"
                        InputProps={{ startAdornment: '$' }}
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
