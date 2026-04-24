'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  Box, Card, CardContent, Typography, Button, Grid, Chip, Avatar, Paper, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, InputAdornment, FormControl, InputLabel,
  Select, MenuItem, Autocomplete, Snackbar, Alert, IconButton,
} from '@mui/material';
import {
  Sync, Warning, CheckCircle, Schedule, Add, PictureAsPdf, Download, Close,
  Search as SearchIcon, FilterList, Edit, Delete,
} from '@mui/icons-material';
import { format, differenceInDays } from 'date-fns';

export default function RenewalsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<any>(null);
  const [notes, setNotes] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [detailPolicy, setDetailPolicy] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['renewals'],
    queryFn: async () => {
      const response = await axios.get('/api/policies?status=ACTIVE&sortBy=expirationDate&sortOrder=asc&limit=200');
      return response.data;
    },
  });

  const createRenewalQuote = useMutation({
    mutationFn: async () => {
      if (!selectedPolicy) return;
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
  const upcomingRenewalsAll = policies.filter((p: any) => {
    const daysUntilExpiration = differenceInDays(new Date(p.expirationDate), new Date());
    return daysUntilExpiration <= 90 && daysUntilExpiration > 0;
  });

  const upcomingRenewals = useMemo(() => {
    if (!search.trim()) return upcomingRenewalsAll;
    const term = search.toLowerCase();
    return upcomingRenewalsAll.filter((p: any) => {
      const policyNumber = (p.policyNumber || '').toLowerCase();
      const firstName = (p.client?.firstName || '').toLowerCase();
      const lastName = (p.client?.lastName || '').toLowerCase();
      const clientName = `${firstName} ${lastName}`;
      const lob = (p.lineOfBusiness || '').replace(/_/g, ' ').toLowerCase();
      const premium = `$${Number(p.premium || 0).toLocaleString()}`.toLowerCase();
      const expDate = p.expirationDate ? format(new Date(p.expirationDate), 'MMM d, yyyy').toLowerCase() : '';
      const daysLeft = String(differenceInDays(new Date(p.expirationDate), new Date()));
      return (
        policyNumber.includes(term) ||
        firstName.includes(term) ||
        lastName.includes(term) ||
        clientName.includes(term) ||
        lob.includes(term) ||
        premium.includes(term) ||
        expDate.includes(term) ||
        daysLeft.includes(term)
      );
    });
  }, [upcomingRenewalsAll, search]);

  const stats = useMemo(() => {
    const due30 = policies.filter((p: any) => {
      const days = differenceInDays(new Date(p.expirationDate), new Date());
      return days <= 30 && days > 0;
    }).length;
    const due60 = policies.filter((p: any) => {
      const days = differenceInDays(new Date(p.expirationDate), new Date());
      return days > 30 && days <= 60;
    }).length;
    const due90 = policies.filter((p: any) => {
      const days = differenceInDays(new Date(p.expirationDate), new Date());
      return days > 60 && days <= 90;
    }).length;
    return { due30, due60, due90 };
  }, [policies]);

  const getRenewalStatus = (expirationDate: string) => {
    const days = differenceInDays(new Date(expirationDate), new Date());
    if (days <= 30) return { color: 'error', label: 'Urgent', icon: <Warning /> };
    if (days <= 60) return { color: 'warning', label: 'Soon', icon: <Schedule /> };
    return { color: 'info', label: 'Upcoming', icon: <Sync /> };
  };

  const handleExportPdf = () => {
    window.open('/api/export/pdf?type=renewals', '_blank');
  };

  const handleExportCsv = () => {
    const csv = [
      ['Policy #', 'Client', 'Line of Business', 'Premium', 'Expiration Date', 'Days Left', 'Status'].join(','),
      ...upcomingRenewals.map((p: any) => {
        const daysLeft = differenceInDays(new Date(p.expirationDate), new Date());
        const status = getRenewalStatus(p.expirationDate);
        return [
          p.policyNumber,
          `"${p.client?.firstName || ''} ${p.client?.lastName || ''}"`,
          p.lineOfBusiness?.replace(/_/g, ' ') || '',
          Number(p.premium || 0),
          format(new Date(p.expirationDate), 'MM/dd/yyyy'),
          daysLeft,
          status.label,
        ].join(',');
      })
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `renewals-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Box className="animate-fade-in">
      {/* Gradient Header */}
      <Paper elevation={0} sx={{
        p: 3, mb: 3, borderRadius: 3,
        background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 50%, #42a5f5 100%)',
        color: 'white',
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.15)', width: 52, height: 52 }}>
              <Sync sx={{ fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight={700}>Policy Renewals</Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>Track and manage upcoming policy renewals</Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Export as PDF">
              <Button variant="outlined" size="small" startIcon={<PictureAsPdf />}
                onClick={handleExportPdf}
                sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}>
                PDF
              </Button>
            </Tooltip>
            <Tooltip title="Export as CSV">
              <Button variant="outlined" size="small" startIcon={<Download />}
                onClick={handleExportCsv}
                sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}>
                CSV
              </Button>
            </Tooltip>
            <Button variant="contained" startIcon={<Add />} onClick={() => setDialogOpen(true)}
              sx={{ bgcolor: 'white', color: '#1565c0', fontWeight: 600, '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' } }}>
              Start Renewal
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Summary Stat Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Due in 30 Days', value: stats.due30, icon: <Warning />, color: '#c62828', bg: 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)' },
          { label: 'Due 31-60 Days', value: stats.due60, icon: <Schedule />, color: '#e65100', bg: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)' },
          { label: 'Due 61-90 Days', value: stats.due90, icon: <Sync />, color: '#1565c0', bg: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)' },
        ].map((stat) => (
          <Grid item xs={12} md={4} key={stat.label}>
            <Paper elevation={0} sx={{
              p: 2.5, borderRadius: 2.5, background: stat.bg, border: '1px solid', borderColor: 'divider',
              transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-2px)' },
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.68rem' }}>
                    {stat.label}
                  </Typography>
                  <Typography variant="h3" fontWeight={700} sx={{ color: stat.color, mt: 0.5 }}>
                    {stat.value}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: `${stat.color}20`, color: stat.color, width: 42, height: 42 }}>
                  {stat.icon}
                </Avatar>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Search/Filter Bar */}
      <Card sx={{ mb: 2, borderRadius: 2.5, overflow: 'visible' }}>
        <CardContent sx={{ py: 2, px: 2.5, '&:last-child': { pb: 2 } }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search by policy #, client name, line of business..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: 'text.secondary' }} /></InputAdornment> }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'grey.50' } }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                {search && (
                  <Button variant="text" size="small" startIcon={<FilterList />}
                    onClick={() => setSearch('')}
                    sx={{ textTransform: 'none' }}>
                    Clear
                  </Button>
                )}
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Upcoming Renewals List */}
      <Card sx={{ borderRadius: 2.5, overflow: 'hidden' }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
            <Typography variant="h6" fontWeight={600}>
              Upcoming Renewals (Next 90 Days)
            </Typography>
            <Chip
              label={`${upcomingRenewals.length} policies`}
              size="small"
              sx={{ bgcolor: '#e3f2fd', color: '#1565c0', fontWeight: 600, borderRadius: '6px' }}
            />
          </Box>
          {upcomingRenewals.length > 0 ? (
            <Grid container spacing={2}>
              {upcomingRenewals.map((policy: any) => {
                const status = getRenewalStatus(policy.expirationDate);
                const daysLeft = differenceInDays(new Date(policy.expirationDate), new Date());
                return (
                  <Grid item xs={12} key={policy.id}>
                    <Card variant="outlined" sx={{
                      cursor: 'pointer',
                      borderRadius: 2.5,
                      border: '1px solid',
                      borderColor: 'divider',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-1px)',
                        boxShadow: '0 4px 12px rgba(21, 101, 192, 0.12)',
                        borderColor: '#42a5f5',
                      },
                    }} onClick={() => setDetailPolicy(policy)}>
                      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2, '&:last-child': { pb: 2 } }}>
                        <Avatar sx={{
                          bgcolor: status.color === 'error' ? '#ffebee' : status.color === 'warning' ? '#fff3e0' : '#e3f2fd',
                          color: status.color === 'error' ? '#c62828' : status.color === 'warning' ? '#e65100' : '#1565c0',
                          width: 48,
                          height: 48,
                        }}>
                          {status.icon}
                        </Avatar>
                        <Box sx={{ flex: 1, overflow: 'hidden' }}>
                          <Typography fontWeight={700} sx={{ fontSize: '0.95rem', color: '#1565c0' }}>
                            {policy.policyNumber}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.84rem' }}>
                            {policy.client?.firstName} {policy.client?.lastName} — {policy.lineOfBusiness?.replace(/_/g, ' ')}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0 }}>
                          <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.9rem', mb: 0.3 }}>
                            ${Number(policy.premium || 0).toLocaleString()}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.78rem' }}>
                            Expires: {format(new Date(policy.expirationDate), 'MMM d, yyyy')}
                          </Typography>
                        </Box>
                        <Chip
                          label={`${daysLeft} days`}
                          size="small"
                          color={status.color as any}
                          sx={{ fontWeight: 600, borderRadius: '6px', minWidth: 72 }}
                        />
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          ) : (
            <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', borderRadius: 2.5, bgcolor: 'grey.50' }}>
              <Sync sx={{ fontSize: 48, color: 'grey.400', mb: 1 }} />
              <Typography color="text.secondary" fontWeight={500}>
                {search ? 'No renewals match your search' : 'No renewals due in the next 90 days'}
              </Typography>
            </Paper>
          )}
        </CardContent>
      </Card>

      {/* Policy Detail Dialog */}
      <Dialog open={!!detailPolicy} onClose={() => setDetailPolicy(null)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}>
        <Box sx={{
          p: 3,
          background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 50%, #42a5f5 100%)',
          color: 'white',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 52, height: 52 }}>
              <Sync sx={{ fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={700} sx={{ color: 'white' }}>
                {detailPolicy?.policyNumber || 'Policy Details'}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                <Chip label={detailPolicy?.lineOfBusiness?.replace(/_/g, ' ') || '-'} size="small"
                  sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600, fontSize: '0.75rem' }} />
                {detailPolicy && (
                  <Chip
                    label={getRenewalStatus(detailPolicy.expirationDate).label}
                    size="small"
                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600, fontSize: '0.75rem' }}
                  />
                )}
              </Box>
            </Box>
          </Box>
          <IconButton onClick={() => setDetailPolicy(null)} sx={{ color: 'white' }}>
            <Close />
          </IconButton>
        </Box>
        <DialogContent dividers>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, mb: 2 }}>
            <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 1 }}>Policy Information</Typography>
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Policy Number</Typography>
                <Typography variant="body2" fontWeight={700} sx={{ color: '#1565c0' }}>{detailPolicy?.policyNumber || '-'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Client Name</Typography>
                <Typography variant="body2" fontWeight={600}>{detailPolicy?.client?.firstName} {detailPolicy?.client?.lastName}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Line of Business</Typography>
                <Typography variant="body2" fontWeight={600}>{detailPolicy?.lineOfBusiness?.replace(/_/g, ' ') || '-'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Premium</Typography>
                <Typography variant="body2" fontWeight={700} sx={{ color: '#1565c0' }}>${Number(detailPolicy?.premium || 0).toLocaleString()}</Typography>
              </Grid>
            </Grid>
          </Paper>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
            <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 1 }}>Renewal Details</Typography>
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Effective Date</Typography>
                <Typography variant="body2">{detailPolicy?.effectiveDate ? format(new Date(detailPolicy.effectiveDate), 'MMM d, yyyy') : '-'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Expiration Date</Typography>
                <Typography variant="body2">{detailPolicy?.expirationDate ? format(new Date(detailPolicy.expirationDate), 'MMM d, yyyy') : '-'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Days Remaining</Typography>
                <Typography variant="body2" fontWeight={600} color="error.main">
                  {detailPolicy?.expirationDate ? `${differenceInDays(new Date(detailPolicy.expirationDate), new Date())} days` : '-'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <Typography variant="caption" color="text.secondary">Renewal Status</Typography>
                  {detailPolicy && (
                    <Chip
                      label={getRenewalStatus(detailPolicy.expirationDate).label}
                      size="small"
                      color={getRenewalStatus(detailPolicy.expirationDate).color as any}
                      sx={{ fontWeight: 600, borderRadius: '6px', mt: 0.5 }}
                    />
                  )}
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
          <Button
            color="error"
            startIcon={<Delete />}
            onClick={async () => {
              if (confirm('Delete this policy?')) {
                await axios.delete(`/api/policies/${detailPolicy?.id}`);
                queryClient.invalidateQueries({ queryKey: ['renewals'] });
                setDetailPolicy(null);
              }
            }}
            sx={{ borderRadius: 2 }}
          >
            Delete
          </Button>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button onClick={() => setDetailPolicy(null)} sx={{ borderRadius: 2 }}>Close</Button>
            <Button
              variant="contained"
              startIcon={<Edit />}
              onClick={() => router.push(`/policies/${detailPolicy?.id}/edit`)}
              sx={{ borderRadius: 2, bgcolor: '#1565c0', '&:hover': { bgcolor: '#0d47a1' } }}
            >
              Edit Policy
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* Start Renewal Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ width: 48, height: 48, bgcolor: '#1565c0' }}>
                <Sync />
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight={600}>Start Policy Renewal</Typography>
                <Typography variant="body2" color="text.secondary">Create a renewal quote for an expiring policy</Typography>
              </Box>
            </Box>
            <IconButton onClick={() => setDialogOpen(false)} size="small"><Close /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Autocomplete
              options={upcomingRenewalsAll}
              getOptionLabel={(option: any) => `${option.policyNumber} - ${option.client?.firstName} ${option.client?.lastName}`}
              value={selectedPolicy}
              onChange={(_, value) => setSelectedPolicy(value)}
              renderInput={(params) => <TextField {...params} label="Select Policy to Renew" required
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />}
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
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#f5f9ff' }}>
                <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 1 }}>Policy Details</Typography>
                <Grid container spacing={1.5} sx={{ mt: 0.5 }}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Line of Business</Typography>
                    <Typography variant="body2" fontWeight={600}>{selectedPolicy.lineOfBusiness?.replace(/_/g, ' ')}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Premium</Typography>
                    <Typography variant="body2" fontWeight={700} color="#1565c0">${Number(selectedPolicy.premium).toLocaleString()}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Expiration</Typography>
                    <Typography variant="body2">{format(new Date(selectedPolicy.expirationDate), 'MMMM d, yyyy')}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Days Remaining</Typography>
                    <Typography variant="body2" fontWeight={600} color="error.main">
                      {differenceInDays(new Date(selectedPolicy.expirationDate), new Date())} days
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            )}
            <TextField
              label="Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              fullWidth
              multiline
              rows={2}
              placeholder="Add any notes for the renewal quote..."
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => createRenewalQuote.mutate()}
            disabled={!selectedPolicy || createRenewalQuote.isPending}
            sx={{ borderRadius: 2, bgcolor: '#1565c0', '&:hover': { bgcolor: '#0d47a1' } }}
          >
            {createRenewalQuote.isPending ? 'Creating...' : 'Create Renewal Quote'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={5000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })} sx={{ borderRadius: 2 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
