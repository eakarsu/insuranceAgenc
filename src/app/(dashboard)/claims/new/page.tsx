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
import { ArrowBack, Save, SupportAgent } from '@mui/icons-material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

const claimTypes = [
  'Auto Collision', 'Auto Comprehensive', 'Auto Liability', 'Property Fire', 'Property Water Damage',
  'Property Wind/Hail', 'Property Theft', 'Property Vandalism', 'Liability Injury', 'Liability Property Damage',
  'Workers Compensation', 'Professional Liability', 'Cyber Incident', 'Other',
];

export default function NewClaimPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const { control, handleSubmit, watch, setValue } = useForm({
    defaultValues: {
      clientId: searchParams.get('clientId') || '',
      policyId: '',
      type: '',
      dateOfLoss: new Date(),
      description: '',
      lossLocation: '',
      estimatedLoss: '',
    },
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients-list'],
    queryFn: async () => {
      const response = await axios.get('/api/clients?limit=100');
      return response.data.clients || [];
    },
  });

  const clientId = watch('clientId');

  const { data: clientPolicies = [] } = useQuery({
    queryKey: ['client-policies', clientId],
    queryFn: async () => {
      if (!clientId) return [];
      const response = await axios.get(`/api/clients/${clientId}`);
      return response.data.policies || [];
    },
    enabled: !!clientId,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await axios.post('/api/claims', {
        ...data,
        estimatedLoss: data.estimatedLoss ? parseFloat(data.estimatedLoss) : null,
      });
      return response.data;
    },
    onSuccess: (data) => {
      setSnackbar({ open: true, message: 'Claim reported successfully', severity: 'success' });
      router.push(`/claims/${data.id}`);
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to report claim', severity: 'error' });
    },
  });

  const onSubmit = (data: any) => {
    createMutation.mutate(data);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box className="animate-fade-in">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Button startIcon={<ArrowBack />} onClick={() => router.back()}>Back</Button>
          <Typography variant="h4" fontWeight={700}>Report New Claim</Typography>
          <Box sx={{ flex: 1 }} />
          <Button variant="outlined" startIcon={<SupportAgent />} onClick={() => router.push('/ai/claims-assistant')}>
            AI Claims Assistant
          </Button>
        </Box>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Card>
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
                        onChange={(_, value) => {
                          field.onChange(value?.id || '');
                          setValue('policyId', '');
                        }}
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
                      <FormControl fullWidth required>
                        <InputLabel>Policy</InputLabel>
                        <Select {...field} label="Policy" disabled={!clientId}>
                          {clientPolicies.map((policy: any) => (
                            <MenuItem key={policy.id} value={policy.id}>
                              {policy.policyNumber} - {policy.lineOfBusiness.replace(/_/g, ' ')}
                            </MenuItem>
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
                      <FormControl fullWidth required>
                        <InputLabel>Claim Type</InputLabel>
                        <Select {...field} label="Claim Type">
                          {claimTypes.map((type) => (
                            <MenuItem key={type} value={type}>{type}</MenuItem>
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

                <Grid item xs={12}>
                  <Controller
                    name="lossLocation"
                    control={control}
                    render={({ field }) => (
                      <TextField {...field} fullWidth label="Loss Location" placeholder="Address where the loss occurred" />
                    )}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Controller
                    name="estimatedLoss"
                    control={control}
                    render={({ field }) => (
                      <TextField {...field} fullWidth label="Estimated Loss Amount" type="number" placeholder="0.00" />
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
                        multiline
                        rows={6}
                        label="Description of Loss"
                        placeholder="Describe what happened, when, where, and any injuries or damages..."
                        required
                      />
                    )}
                  />
                </Grid>
              </Grid>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
                <Button variant="contained" type="submit" startIcon={<Save />}
                  disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Submitting...' : 'Submit Claim'}
                </Button>
              </Box>
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
