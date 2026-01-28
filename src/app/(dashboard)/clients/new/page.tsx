'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Divider,
  Alert,
  Snackbar,
  Tabs,
  Tab,
  Autocomplete,
  Chip,
} from '@mui/material';
import { ArrowBack, Save } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

const clientSchema = z.object({
  type: z.enum(['PERSONAL', 'COMMERCIAL']),
  status: z.enum(['PROSPECT', 'ACTIVE', 'INACTIVE', 'FORMER']),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  dateOfBirth: z.date().optional().nullable(),
  ssn: z.string().optional(),
  businessName: z.string().optional(),
  businessType: z.string().optional(),
  ein: z.string().optional(),
  yearsInBusiness: z.number().optional().nullable(),
  numberOfEmployees: z.number().optional().nullable(),
  annualRevenue: z.number().optional().nullable(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  source: z.string().optional(),
  referredBy: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  householdId: z.string().optional().nullable(),
  agentId: z.string().optional().nullable(),
});

type ClientFormData = z.infer<typeof clientSchema>;

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

const CLIENT_SOURCES = [
  'Referral',
  'Website',
  'Social Media',
  'Cold Call',
  'Walk-in',
  'Advertisement',
  'Partner',
  'Other',
];

const SUGGESTED_TAGS = [
  'VIP', 'homeowner', 'renter', 'multi-policy', 'high-value',
  'tech', 'restaurant', 'retail', 'professional-liability', 'workers-comp'
];

export default function NewClientPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const { data: households = [] } = useQuery({
    queryKey: ['households'],
    queryFn: async () => {
      const response = await axios.get('/api/households');
      return response.data;
    },
  });

  const { data: agents = [] } = useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      const response = await axios.get('/api/users?agentsOnly=true');
      return response.data;
    },
  });

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      type: 'PERSONAL',
      status: 'PROSPECT',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      mobile: '',
      dateOfBirth: null,
      ssn: '',
      businessName: '',
      businessType: '',
      ein: '',
      yearsInBusiness: null,
      numberOfEmployees: null,
      annualRevenue: null,
      address: '',
      city: '',
      state: '',
      zipCode: '',
      source: '',
      referredBy: '',
      notes: '',
      tags: [],
      householdId: null,
      agentId: null,
    },
  });

  const clientType = watch('type');

  const createMutation = useMutation({
    mutationFn: async (data: ClientFormData) => {
      const response = await axios.post('/api/clients', data);
      return response.data;
    },
    onSuccess: (data) => {
      setSnackbar({ open: true, message: 'Client created successfully', severity: 'success' });
      router.push(`/clients/${data.id}`);
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to create client', severity: 'error' });
    },
  });

  const onSubmit = (data: ClientFormData) => {
    createMutation.mutate(data);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box className="animate-fade-in">
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => router.back()}
          >
            Back
          </Button>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" fontWeight={700}>
              New Client
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save Client'}
          </Button>
        </Box>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Card>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs
                value={activeTab}
                onChange={(_, v) => setActiveTab(v)}
                sx={{ px: 2 }}
              >
                <Tab label="Basic Information" />
                <Tab label="Address" />
                {clientType === 'COMMERCIAL' && <Tab label="Business Details" />}
                <Tab label="Additional Info" />
              </Tabs>
            </Box>

            <CardContent sx={{ p: 3 }}>
              {/* Basic Information Tab */}
              {activeTab === 0 && (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Controller
                      name="type"
                      control={control}
                      render={({ field }) => (
                        <FormControl fullWidth error={!!errors.type}>
                          <InputLabel>Client Type</InputLabel>
                          <Select {...field} label="Client Type">
                            <MenuItem value="PERSONAL">Personal</MenuItem>
                            <MenuItem value="COMMERCIAL">Commercial</MenuItem>
                          </Select>
                          {errors.type && <FormHelperText>{errors.type.message}</FormHelperText>}
                        </FormControl>
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Controller
                      name="status"
                      control={control}
                      render={({ field }) => (
                        <FormControl fullWidth error={!!errors.status}>
                          <InputLabel>Status</InputLabel>
                          <Select {...field} label="Status">
                            <MenuItem value="PROSPECT">Prospect</MenuItem>
                            <MenuItem value="ACTIVE">Active</MenuItem>
                            <MenuItem value="INACTIVE">Inactive</MenuItem>
                            <MenuItem value="FORMER">Former</MenuItem>
                          </Select>
                          {errors.status && <FormHelperText>{errors.status.message}</FormHelperText>}
                        </FormControl>
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Controller
                      name="agentId"
                      control={control}
                      render={({ field }) => (
                        <FormControl fullWidth>
                          <InputLabel>Assigned Agent</InputLabel>
                          <Select {...field} label="Assigned Agent" value={field.value || ''}>
                            <MenuItem value="">Auto-assign to me</MenuItem>
                            {agents.map((agent: { id: string; name: string; role: string }) => (
                              <MenuItem key={agent.id} value={agent.id}>
                                {agent.name} ({agent.role})
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      )}
                    />
                  </Grid>

                  {clientType === 'COMMERCIAL' && (
                    <Grid item xs={12}>
                      <Controller
                        name="businessName"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="Business Name"
                            error={!!errors.businessName}
                            helperText={errors.businessName?.message}
                          />
                        )}
                      />
                    </Grid>
                  )}

                  <Grid item xs={12} md={6}>
                    <Controller
                      name="firstName"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="First Name"
                          required
                          error={!!errors.firstName}
                          helperText={errors.firstName?.message}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Controller
                      name="lastName"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Last Name"
                          required
                          error={!!errors.lastName}
                          helperText={errors.lastName?.message}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Controller
                      name="email"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Email"
                          type="email"
                          error={!!errors.email}
                          helperText={errors.email?.message}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Controller
                      name="phone"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Phone"
                          error={!!errors.phone}
                          helperText={errors.phone?.message}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Controller
                      name="mobile"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Mobile"
                          error={!!errors.mobile}
                          helperText={errors.mobile?.message}
                        />
                      )}
                    />
                  </Grid>

                  {clientType === 'PERSONAL' && (
                    <Grid item xs={12} md={6}>
                      <Controller
                        name="dateOfBirth"
                        control={control}
                        render={({ field }) => (
                          <DatePicker
                            label="Date of Birth"
                            value={field.value}
                            onChange={field.onChange}
                            slotProps={{
                              textField: {
                                fullWidth: true,
                                error: !!errors.dateOfBirth,
                                helperText: errors.dateOfBirth?.message,
                              },
                            }}
                          />
                        )}
                      />
                    </Grid>
                  )}

                  {clientType === 'PERSONAL' && (
                    <Grid item xs={12} md={6}>
                      <Controller
                        name="householdId"
                        control={control}
                        render={({ field }) => (
                          <FormControl fullWidth>
                            <InputLabel>Household</InputLabel>
                            <Select {...field} label="Household" value={field.value || ''}>
                              <MenuItem value="">None</MenuItem>
                              {households.map((h: { id: string; name: string }) => (
                                <MenuItem key={h.id} value={h.id}>{h.name}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        )}
                      />
                    </Grid>
                  )}
                </Grid>
              )}

              {/* Address Tab */}
              {activeTab === 1 && (
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Controller
                      name="address"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Street Address"
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Controller
                      name="city"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="City"
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Controller
                      name="state"
                      control={control}
                      render={({ field }) => (
                        <FormControl fullWidth>
                          <InputLabel>State</InputLabel>
                          <Select {...field} label="State">
                            {US_STATES.map((state) => (
                              <MenuItem key={state} value={state}>{state}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Controller
                      name="zipCode"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="ZIP Code"
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              )}

              {/* Business Details Tab */}
              {activeTab === 2 && clientType === 'COMMERCIAL' && (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Controller
                      name="businessType"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Business Type"
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Controller
                      name="ein"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="EIN"
                          placeholder="XX-XXXXXXX"
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Controller
                      name="yearsInBusiness"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Years in Business"
                          type="number"
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                          value={field.value || ''}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Controller
                      name="numberOfEmployees"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Number of Employees"
                          type="number"
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                          value={field.value || ''}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Controller
                      name="annualRevenue"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Annual Revenue"
                          type="number"
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                          value={field.value || ''}
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              )}

              {/* Additional Info Tab */}
              {((clientType === 'COMMERCIAL' && activeTab === 3) || (clientType === 'PERSONAL' && activeTab === 2)) && (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Controller
                      name="source"
                      control={control}
                      render={({ field }) => (
                        <FormControl fullWidth>
                          <InputLabel>Source</InputLabel>
                          <Select {...field} label="Source">
                            {CLIENT_SOURCES.map((source) => (
                              <MenuItem key={source} value={source}>{source}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Controller
                      name="referredBy"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Referred By"
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Controller
                      name="tags"
                      control={control}
                      render={({ field }) => (
                        <Autocomplete
                          multiple
                          freeSolo
                          options={SUGGESTED_TAGS}
                          value={field.value || []}
                          onChange={(_, newValue) => field.onChange(newValue)}
                          renderTags={(value, getTagProps) =>
                            value.map((option, index) => (
                              <Chip
                                {...getTagProps({ index })}
                                key={option}
                                label={option}
                                size="small"
                              />
                            ))
                          }
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Tags"
                              placeholder="Add tags"
                            />
                          )}
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
                          rows={4}
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              )}
            </CardContent>
          </Card>
        </form>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={5000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert severity={snackbar.severity}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </LocalizationProvider>
  );
}
