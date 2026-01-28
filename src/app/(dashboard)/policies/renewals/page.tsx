'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  Box, Card, CardContent, Typography, Button, Grid, Chip, Avatar, LinearProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel, Select, MenuItem,
  Autocomplete, Snackbar, Alert,
} from '@mui/material';
import { Sync, Warning, CheckCircle, Schedule, Add } from '@mui/icons-material';
import { format, differenceInDays } from 'date-fns';

export default function RenewalsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<any>(null);
  const [notes, setNotes] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const { data, isLoading } = useQuery({
    queryKey: ['renewals'],
    queryFn: async () => {
      const response = await axios.get('/api/policies?status=ACTIVE&sortBy=expirationDate&sortOrder=asc');
      return response.data;
    },
  });

  const createRenewalQuote = useMutation({
    mutationFn: async () => {
      if (!selectedPolicy) return;
      // Create a renewal quote based on the existing policy
      const response = await axios.post('/api/quotes', {
        clientId: selectedPolicy.clientId,
        carrierId: selectedPolicy.carrierId,
        lineOfBusiness: selectedPolicy.lineOfBusiness,
        type: `${selectedPolicy.lineOfBusiness?.replace(/_/g, ' ')} Renewal`,
        effectiveDate: selectedPolicy.expirationDate,
        premium: selectedPolicy.premium,
        totalPremium: selectedPolicy.premium,
        status: 'DRAFT',
        notes: notes || `Renewal quote for policy ${selectedPolicy.policyNumber}`,
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['renewals'] });
      setDialogOpen(false);
      setSelectedPolicy(null);
      setNotes('');
      setSnackbar({ open: true, message: 'Renewal quote created successfully', severity: 'success' });
      router.push(`/quotes/${data.id}`);
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to create renewal quote', severity: 'error' });
    },
  });

  const policies = data?.policies || [];
  const upcomingRenewals = policies.filter((p: any) => {
    const daysUntilExpiration = differenceInDays(new Date(p.expirationDate), new Date());
    return daysUntilExpiration <= 90 && daysUntilExpiration > 0;
  });

  const getRenewalStatus = (expirationDate: string) => {
    const days = differenceInDays(new Date(expirationDate), new Date());
    if (days <= 30) return { color: 'error', label: 'Urgent', icon: <Warning /> };
    if (days <= 60) return { color: 'warning', label: 'Soon', icon: <Schedule /> };
    return { color: 'info', label: 'Upcoming', icon: <Sync /> };
  };

  return (
    <Box className="animate-fade-in">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>Policy Renewals</Typography>
          <Typography color="text.secondary">Track and manage upcoming policy renewals</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => setDialogOpen(true)}>Start Renewal</Button>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Warning sx={{ fontSize: 40, color: 'error.main', mb: 1 }} />
              <Typography variant="h3" fontWeight={700}>
                {policies.filter((p: any) => differenceInDays(new Date(p.expirationDate), new Date()) <= 30).length}
              </Typography>
              <Typography color="text.secondary">Due in 30 days</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Schedule sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
              <Typography variant="h3" fontWeight={700}>
                {policies.filter((p: any) => {
                  const days = differenceInDays(new Date(p.expirationDate), new Date());
                  return days > 30 && days <= 60;
                }).length}
              </Typography>
              <Typography color="text.secondary">Due in 31-60 days</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Sync sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
              <Typography variant="h3" fontWeight={700}>
                {policies.filter((p: any) => {
                  const days = differenceInDays(new Date(p.expirationDate), new Date());
                  return days > 60 && days <= 90;
                }).length}
              </Typography>
              <Typography color="text.secondary">Due in 61-90 days</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight={600} gutterBottom>Upcoming Renewals (Next 90 Days)</Typography>
          {upcomingRenewals.length > 0 ? (
            <Grid container spacing={2}>
              {upcomingRenewals.map((policy: any) => {
                const status = getRenewalStatus(policy.expirationDate);
                const daysLeft = differenceInDays(new Date(policy.expirationDate), new Date());
                return (
                  <Grid item xs={12} key={policy.id}>
                    <Card variant="outlined" sx={{ cursor: 'pointer' }} onClick={() => router.push(`/policies/${policy.id}`)}>
                      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: `${status.color}.light`, color: `${status.color}.main` }}>
                          {status.icon}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography fontWeight={600}>{policy.policyNumber}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {policy.client?.firstName} {policy.client?.lastName} - {policy.lineOfBusiness?.replace(/_/g, ' ')}
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Chip label={`${daysLeft} days`} size="small" color={status.color as any} />
                          <Typography variant="body2" color="text.secondary">
                            Expires: {format(new Date(policy.expirationDate), 'MMM d, yyyy')}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          ) : (
            <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
              No renewals due in the next 90 days
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Start Renewal Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Start Policy Renewal</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <Autocomplete
              options={upcomingRenewals}
              getOptionLabel={(option: any) => `${option.policyNumber} - ${option.client?.firstName} ${option.client?.lastName}`}
              value={selectedPolicy}
              onChange={(_, value) => setSelectedPolicy(value)}
              renderInput={(params) => <TextField {...params} label="Select Policy to Renew" required />}
              renderOption={(props, option: any) => (
                <li {...props} key={option.id}>
                  <Box>
                    <Typography fontWeight={600}>{option.policyNumber}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {option.client?.firstName} {option.client?.lastName} - Expires: {format(new Date(option.expirationDate), 'MMM d, yyyy')}
                    </Typography>
                  </Box>
                </li>
              )}
            />
            {selectedPolicy && (
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary">Policy Details</Typography>
                  <Typography>Line: {selectedPolicy.lineOfBusiness?.replace(/_/g, ' ')}</Typography>
                  <Typography>Premium: ${Number(selectedPolicy.premium).toLocaleString()}</Typography>
                  <Typography>Expires: {format(new Date(selectedPolicy.expirationDate), 'MMMM d, yyyy')}</Typography>
                </CardContent>
              </Card>
            )}
            <TextField
              label="Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              fullWidth
              multiline
              rows={2}
              placeholder="Add any notes for the renewal quote..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => createRenewalQuote.mutate()}
            disabled={!selectedPolicy || createRenewalQuote.isPending}
          >
            {createRenewalQuote.isPending ? 'Creating...' : 'Create Renewal Quote'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={5000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
