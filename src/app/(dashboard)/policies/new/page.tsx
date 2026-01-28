'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { useForm, Controller } from 'react-hook-form';
import {
  Box, Card, CardContent, Typography, Grid, TextField, Button, FormControl, InputLabel,
  Select, MenuItem, Autocomplete, Alert, Snackbar,
} from '@mui/material';
import { ArrowBack, Save } from '@mui/icons-material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { addYears } from 'date-fns';

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

export default function NewPolicyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const { control, handleSubmit, watch, setValue } = useForm({
    defaultValues: {
      clientId: searchParams.get('clientId') || '',
      carrierId: '',
      lineOfBusiness: '',
      effectiveDate: new Date(),
      expirationDate: addYears(new Date(), 1),
      premium: '',
      status: 'ACTIVE',
      billingMethod: 'AGENCY',
    },
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients-list'],
    queryFn: async () => {
      const response = await axios.get('/api/clients?limit=100');
      return response.data.clients;
    },
  });

  const { data: carriers = [] } = useQuery({
    queryKey: ['carriers'],
    queryFn: async () => {
      const response = await axios.get('/api/carriers');
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await axios.post('/api/policies', data);
      return response.data;
    },
    onSuccess: (data) => {
      setSnackbar({ open: true, message: 'Policy created successfully', severity: 'success' });
      router.push(`/policies/${data.id}`);
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to create policy', severity: 'error' });
    },
  });

  const effectiveDate = watch('effectiveDate');

  const onSubmit = (data: any) => {
    createMutation.mutate({
      ...data,
      premium: data.premium ? parseFloat(data.premium) : 0,
    });
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box className="animate-fade-in">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Button startIcon={<ArrowBack />} onClick={() => router.back()}>Back</Button>
          <Typography variant="h4" fontWeight={700}>New Policy</Typography>
          <Box sx={{ flex: 1 }} />
          <Button variant="contained" startIcon={<Save />} onClick={handleSubmit(onSubmit)}
            disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Creating...' : 'Create Policy'}
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
                    name="status"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth>
                        <InputLabel>Status</InputLabel>
                        <Select {...field} label="Status">
                          <MenuItem value="ACTIVE">Active</MenuItem>
                          <MenuItem value="PENDING">Pending</MenuItem>
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
                        onChange={(date) => {
                          field.onChange(date);
                          if (date) setValue('expirationDate', addYears(date, 1));
                        }}
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

                <Grid item xs={12} md={6}>
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
                        placeholder="0.00"
                        InputProps={{ startAdornment: '$' }}
                      />
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
