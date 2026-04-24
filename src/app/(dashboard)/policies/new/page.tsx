'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { useForm, Controller } from 'react-hook-form';
import {
  Box, Card, CardContent, Typography, Grid, TextField, Button, FormControl, InputLabel,
  Select, MenuItem, Autocomplete, Alert, Snackbar, Collapse, Chip,
} from '@mui/material';
import { ArrowBack, Save, ExpandMore, ExpandLess } from '@mui/icons-material';
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
  const [showAdvanced, setShowAdvanced] = useState(false);

  const { control, handleSubmit, setValue } = useForm({
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

  const { data: clientsData } = useQuery({
    queryKey: ['clients-list'],
    queryFn: async () => {
      const response = await axios.get('/api/clients?limit=100');
      return response.data;
    },
  });
  const clients = Array.isArray(clientsData?.clients) ? clientsData.clients : Array.isArray(clientsData) ? clientsData : [];

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
    onError: (error: any) => {
      const msg = error?.response?.data?.error || 'Failed to create policy';
      setSnackbar({ open: true, message: msg, severity: 'error' });
    },
  });

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
          {/* Essential Fields */}
          <Card sx={{ mb: 2 }}>
            <CardContent sx={{ p: 3 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="clientId"
                    control={control}
                    rules={{ required: 'Client is required' }}
                    render={({ field, fieldState }) => (
                      <Autocomplete
                        options={clients}
                        getOptionLabel={(option: any) =>
                          option.type === 'COMMERCIAL' && option.businessName
                            ? option.businessName
                            : `${option.firstName} ${option.lastName}`
                        }
                        value={clients.find((c: any) => c.id === field.value) || null}
                        onChange={(_, value) => field.onChange(value?.id || '')}
                        renderInput={(params) => <TextField {...params} label="Client" required error={!!fieldState.error} helperText={fieldState.error?.message} />}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Controller
                    name="carrierId"
                    control={control}
                    rules={{ required: 'Carrier is required' }}
                    render={({ field, fieldState }) => (
                      <FormControl fullWidth required error={!!fieldState.error}>
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
                    rules={{ required: 'Line of Business is required' }}
                    render={({ field, fieldState }) => (
                      <FormControl fullWidth required error={!!fieldState.error}>
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
                    name="premium"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Annual Premium"
                        type="number"
                        required
                        placeholder="0.00"
                        InputProps={{ startAdornment: '$' }}
                      />
                    )}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Advanced Options (collapsed by default) */}
          <Card>
            <CardContent sx={{ p: 0 }}>
              <Button
                fullWidth
                onClick={() => setShowAdvanced(!showAdvanced)}
                endIcon={showAdvanced ? <ExpandLess /> : <ExpandMore />}
                sx={{ py: 1.5, px: 3, justifyContent: 'space-between', textTransform: 'none', color: 'text.secondary' }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  Advanced Options
                  <Chip label="Defaults applied" size="small" color="success" variant="outlined" sx={{ fontSize: '0.7rem', height: 22 }} />
                </Box>
              </Button>
              <Collapse in={showAdvanced}>
                <Box sx={{ px: 3, pb: 3 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                    Defaults: Active status, today&apos;s effective date, 1-year term, Agency billing
                  </Typography>
                  <Grid container spacing={3}>
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
                            slotProps={{ textField: { fullWidth: true, size: 'small' } }}
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
                            slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                          />
                        )}
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Controller
                        name="status"
                        control={control}
                        render={({ field }) => (
                          <FormControl fullWidth size="small">
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
                        name="billingMethod"
                        control={control}
                        render={({ field }) => (
                          <FormControl fullWidth size="small">
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
                </Box>
              </Collapse>
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
