'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useForm, Controller } from 'react-hook-form';
import {
  Box, Card, CardContent, Typography, Grid, TextField, Button, FormControl, InputLabel,
  Select, MenuItem, Snackbar, Alert, Skeleton,
} from '@mui/material';
import { ArrowBack, Save } from '@mui/icons-material';

const campaignTypes = [
  { value: 'EMAIL', label: 'Email' },
  { value: 'SMS', label: 'SMS' },
  { value: 'MAIL', label: 'Direct Mail' },
  { value: 'RENEWAL_REMINDER', label: 'Renewal Reminder' },
  { value: 'CROSS_SELL', label: 'Cross-Sell' },
];

const statusOptions = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'SCHEDULED', label: 'Scheduled' },
  { value: 'SENT', label: 'Sent' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export default function EditCampaignPage() {
  const params = useParams<{ id: string }>();
  const { id } = params;
  const router = useRouter();
  const queryClient = useQueryClient();
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      name: '',
      type: 'EMAIL',
      subject: '',
      content: '',
      status: 'DRAFT',
    },
  });

  const { data: campaign, isLoading } = useQuery({
    queryKey: ['campaign', id],
    queryFn: async () => {
      const response = await axios.get(`/api/marketing/campaigns/${id}`);
      return response.data;
    },
  });

  useEffect(() => {
    if (campaign) {
      reset({
        name: campaign.name || '',
        type: campaign.type || 'EMAIL',
        subject: campaign.subject || '',
        content: campaign.content || '',
        status: campaign.status || 'DRAFT',
      });
    }
  }, [campaign, reset]);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await axios.put(`/api/marketing/campaigns/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign', id] });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      setSnackbar({ open: true, message: 'Campaign updated successfully', severity: 'success' });
      setTimeout(() => router.push(`/marketing/campaigns/${id}`), 1000);
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to update campaign', severity: 'error' });
    },
  });

  const onSubmit = (data: any) => {
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <Box>
        <Skeleton variant="rectangular" height={60} sx={{ mb: 3 }} />
        <Skeleton variant="rectangular" height={400} />
      </Box>
    );
  }

  if (!campaign) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h5" color="text.secondary">Campaign not found</Typography>
        <Button sx={{ mt: 2 }} onClick={() => router.push('/marketing/campaigns')}>Back to Campaigns</Button>
      </Box>
    );
  }

  return (
    <Box className="animate-fade-in">
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={() => router.back()}>Back</Button>
        <Typography variant="h4" fontWeight={700}>Edit Campaign</Typography>
        <Box sx={{ flex: 1 }} />
        <Button
          variant="contained"
          startIcon={<Save />}
          onClick={handleSubmit(onSubmit)}
          disabled={updateMutation.isPending}
        >
          {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </Box>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>Campaign Details</Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} fullWidth label="Campaign Name" required />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Type</InputLabel>
                      <Select {...field} label="Type">
                        {campaignTypes.map((type) => (
                          <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid item xs={12} md={8}>
                <Controller
                  name="subject"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} fullWidth label="Subject Line" />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={4}>
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

              <Grid item xs={12}>
                <Controller
                  name="content"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Content"
                      multiline
                      rows={10}
                      placeholder="Enter campaign content..."
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
  );
}
