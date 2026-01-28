'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { useForm, Controller } from 'react-hook-form';
import {
  Box, Card, CardContent, Typography, Grid, TextField, Button, FormControl, InputLabel,
  Select, MenuItem, Autocomplete, Stepper, Step, StepLabel, Alert, Snackbar,
} from '@mui/material';
import { ArrowBack, ArrowForward, Save, AutoAwesome } from '@mui/icons-material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

const steps = ['Client Selection', 'Coverage Details', 'Risk Information', 'Review & Generate'];

export default function NewQuotePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeStep, setActiveStep] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const { control, handleSubmit, watch, setValue } = useForm({
    defaultValues: {
      clientId: searchParams.get('clientId') || '',
      lineOfBusiness: '',
      effectiveDate: new Date(),
      coverages: {},
      riskInfo: '',
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

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await axios.post('/api/quotes', data);
      return response.data;
    },
    onSuccess: (data) => {
      setSnackbar({ open: true, message: 'Quote created successfully', severity: 'success' });
      router.push(`/quotes/${data.id}`);
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to create quote', severity: 'error' });
    },
  });

  const clientId = watch('clientId');
  const lineOfBusiness = watch('lineOfBusiness');

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

  const onSubmit = (data: any) => {
    createMutation.mutate(data);
  };

  const handleNext = () => setActiveStep((prev) => Math.min(prev + 1, steps.length - 1));
  const handleBack = () => setActiveStep((prev) => Math.max(prev - 1, 0));

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box className="animate-fade-in">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Button startIcon={<ArrowBack />} onClick={() => router.back()}>Back</Button>
          <Typography variant="h4" fontWeight={700}>New Quote</Typography>
        </Box>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Stepper activeStep={activeStep} alternativeLabel>
              {steps.map((label) => (
                <Step key={label}><StepLabel>{label}</StepLabel></Step>
              ))}
            </Stepper>
          </CardContent>
        </Card>

        <Card>
          <CardContent sx={{ p: 3 }}>
            {activeStep === 0 && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="h6" fontWeight={600} gutterBottom>Select Client</Typography>
                </Grid>
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
              </Grid>
            )}

            {activeStep === 1 && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="h6" fontWeight={600} gutterBottom>Coverage Details</Typography>
                </Grid>
                {lineOfBusiness === 'PERSONAL_AUTO' && (
                  <>
                    <Grid item xs={12} md={4}>
                      <TextField fullWidth label="Bodily Injury Limit" placeholder="100/300" />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField fullWidth label="Property Damage" placeholder="100000" />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField fullWidth label="Comprehensive Deductible" placeholder="500" />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField fullWidth label="Collision Deductible" placeholder="500" />
                    </Grid>
                  </>
                )}
                {lineOfBusiness === 'HOMEOWNERS' && (
                  <>
                    <Grid item xs={12} md={4}>
                      <TextField fullWidth label="Dwelling Coverage" placeholder="350000" />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField fullWidth label="Personal Property" placeholder="175000" />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField fullWidth label="Liability" placeholder="300000" />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField fullWidth label="Deductible" placeholder="1000" />
                    </Grid>
                  </>
                )}
                {!['PERSONAL_AUTO', 'HOMEOWNERS'].includes(lineOfBusiness) && (
                  <Grid item xs={12}>
                    <TextField fullWidth multiline rows={4} label="Coverage Requirements"
                      placeholder="Describe the coverage requirements..." />
                  </Grid>
                )}
              </Grid>
            )}

            {activeStep === 2 && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="h6" fontWeight={600} gutterBottom>Risk Information</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Controller
                    name="riskInfo"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        multiline
                        rows={6}
                        label="Risk Details"
                        placeholder="Enter details about vehicles, property, drivers, loss history, etc."
                      />
                    )}
                  />
                </Grid>
              </Grid>
            )}

            {activeStep === 3 && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="h6" fontWeight={600} gutterBottom>Review & Generate Quote</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Alert severity="info" icon={<AutoAwesome />}>
                    Click "Generate Quote" to create a quote. You can also use AI Quote Generator for multi-carrier comparison.
                  </Alert>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">Client</Typography>
                  <Typography>{clients.find((c: any) => c.id === clientId)?.firstName} {clients.find((c: any) => c.id === clientId)?.lastName}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">Line of Business</Typography>
                  <Typography>{lobOptions.find((l) => l.value === lineOfBusiness)?.label || lineOfBusiness}</Typography>
                </Grid>
              </Grid>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
              <Button onClick={handleBack} disabled={activeStep === 0}>Back</Button>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {activeStep === steps.length - 1 ? (
                  <>
                    <Button variant="outlined" startIcon={<AutoAwesome />} onClick={() => router.push('/ai/quote-generator')}>
                      AI Multi-Carrier Quote
                    </Button>
                    <Button variant="contained" startIcon={<Save />} onClick={handleSubmit(onSubmit)}
                      disabled={!clientId || !lineOfBusiness || createMutation.isPending}>
                      {createMutation.isPending ? 'Creating...' : 'Generate Quote'}
                    </Button>
                  </>
                ) : (
                  <Button variant="contained" endIcon={<ArrowForward />} onClick={handleNext}
                    disabled={activeStep === 0 && (!clientId || !lineOfBusiness)}>
                    Next
                  </Button>
                )}
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Snackbar open={snackbar.open} autoHideDuration={5000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
        </Snackbar>
      </Box>
    </LocalizationProvider>
  );
}
