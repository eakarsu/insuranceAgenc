'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  Box, Button, Card, CardContent, Typography, Grid, Chip, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel, Select, MenuItem,
  Snackbar, Alert, Skeleton, Switch, FormControlLabel,
} from '@mui/material';
import { ArrowBack, Edit, Delete, Person, PersonAdd, EmojiEvents } from '@mui/icons-material';
import { format } from 'date-fns';

export default function ReferralDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const queryClient = useQueryClient();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({ status: '', rewardGiven: false, rewardAmount: 0, notes: '' });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const { data: referral, isLoading } = useQuery({
    queryKey: ['referral', id],
    queryFn: async () => {
      const response = await axios.get(`/api/referrals/${id}`);
      return response.data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await axios.put(`/api/referrals/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referral', id] });
      queryClient.invalidateQueries({ queryKey: ['referrals'] });
      setEditDialogOpen(false);
      setSnackbar({ open: true, message: 'Referral updated successfully', severity: 'success' });
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to update referral', severity: 'error' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await axios.delete(`/api/referrals/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referrals'] });
      setSnackbar({ open: true, message: 'Referral deleted successfully', severity: 'success' });
      router.push('/marketing/referrals');
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to delete referral', severity: 'error' });
    },
  });

  const handleEdit = () => {
    setEditForm({
      status: referral.status,
      rewardGiven: referral.rewardGiven || false,
      rewardAmount: referral.rewardAmount || 0,
      notes: referral.notes || '',
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    updateMutation.mutate(editForm);
  };

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  if (isLoading) {
    return (
      <Box>
        <Skeleton variant="rectangular" height={60} sx={{ mb: 3 }} />
        <Skeleton variant="rectangular" height={400} />
      </Box>
    );
  }

  if (!referral) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h5" color="text.secondary">Referral not found</Typography>
        <Button sx={{ mt: 2 }} onClick={() => router.push('/marketing/referrals')}>
          Back to Referrals
        </Button>
      </Box>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONVERTED': return 'success';
      case 'PENDING': return 'warning';
      case 'CONTACTED': return 'info';
      case 'LOST': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box className="animate-fade-in">
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={() => router.push('/marketing/referrals')}>
          Back
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button variant="outlined" startIcon={<Edit />} onClick={handleEdit}>
          Edit
        </Button>
        <Button variant="outlined" color="error" startIcon={<Delete />} onClick={() => setDeleteDialogOpen(true)}>
          Delete
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <PersonAdd sx={{ fontSize: 40, color: 'primary.main' }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h5" fontWeight={700}>Referral Details</Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Chip label={referral.status} size="small" color={getStatusColor(referral.status) as any} />
                    <Chip
                      label={referral.rewardGiven ? 'Reward Paid' : 'Reward Pending'}
                      size="small"
                      color={referral.rewardGiven ? 'success' : 'warning'}
                      icon={<EmojiEvents />}
                    />
                  </Box>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Person color="primary" />
                      <Typography variant="subtitle1" fontWeight={600}>Referring Client</Typography>
                    </Box>
                    <Typography variant="body1" fontWeight={500}>
                      {referral.referringClient?.firstName} {referral.referringClient?.lastName}
                    </Typography>
                    {referral.referringClient?.email && (
                      <Typography variant="body2" color="text.secondary">{referral.referringClient.email}</Typography>
                    )}
                    {referral.referringClient?.phone && (
                      <Typography variant="body2" color="text.secondary">{referral.referringClient.phone}</Typography>
                    )}
                    <Button
                      size="small"
                      sx={{ mt: 1 }}
                      onClick={() => router.push(`/clients/${referral.referringClient?.id}`)}
                    >
                      View Client
                    </Button>
                  </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <PersonAdd color="success" />
                      <Typography variant="subtitle1" fontWeight={600}>Referred Client</Typography>
                    </Box>
                    <Typography variant="body1" fontWeight={500}>
                      {referral.referredClient?.firstName} {referral.referredClient?.lastName}
                    </Typography>
                    {referral.referredClient?.email && (
                      <Typography variant="body2" color="text.secondary">{referral.referredClient.email}</Typography>
                    )}
                    {referral.referredClient?.phone && (
                      <Typography variant="body2" color="text.secondary">{referral.referredClient.phone}</Typography>
                    )}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                      <Chip
                        label={referral.referredClient?.status}
                        size="small"
                        color={referral.referredClient?.status === 'ACTIVE' ? 'success' : 'default'}
                      />
                      {referral.referredClient?.policies?.length > 0 && (
                        <Chip label={`${referral.referredClient.policies.length} Policies`} size="small" color="info" />
                      )}
                    </Box>
                    <Button
                      size="small"
                      sx={{ mt: 1 }}
                      onClick={() => router.push(`/clients/${referral.referredClient?.id}`)}
                    >
                      View Client
                    </Button>
                  </Card>
                </Grid>
              </Grid>

              {referral.notes && (
                <>
                  <Divider sx={{ my: 3 }} />
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>Notes</Typography>
                  <Typography variant="body2">{referral.notes}</Typography>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>Referral Info</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Date Created</Typography>
                  <Typography variant="body2">{format(new Date(referral.createdAt), 'MMM d, yyyy')}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Last Updated</Typography>
                  <Typography variant="body2">{format(new Date(referral.updatedAt), 'MMM d, yyyy')}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>Reward Details</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Reward Status</Typography>
                  <Typography variant="body2">{referral.rewardGiven ? 'Paid' : 'Pending'}</Typography>
                </Box>
                {referral.rewardAmount > 0 && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">Reward Amount</Typography>
                    <Typography variant="body2">${referral.rewardAmount}</Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Referral</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={editForm.status}
                label="Status"
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
              >
                <MenuItem value="PENDING">Pending</MenuItem>
                <MenuItem value="CONTACTED">Contacted</MenuItem>
                <MenuItem value="CONVERTED">Converted</MenuItem>
                <MenuItem value="LOST">Lost</MenuItem>
              </Select>
            </FormControl>
            <FormControlLabel
              control={
                <Switch
                  checked={editForm.rewardGiven}
                  onChange={(e) => setEditForm({ ...editForm, rewardGiven: e.target.checked })}
                />
              }
              label="Reward Paid"
            />
            <TextField
              fullWidth
              label="Reward Amount"
              type="number"
              value={editForm.rewardAmount}
              onChange={(e) => setEditForm({ ...editForm, rewardAmount: parseFloat(e.target.value) || 0 })}
              InputProps={{ startAdornment: <Typography sx={{ mr: 1 }}>$</Typography> }}
            />
            <TextField
              fullWidth
              label="Notes"
              multiline
              rows={3}
              value={editForm.notes}
              onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveEdit} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Referral</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this referral? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={deleteMutation.isPending}>
            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar open={snackbar.open} autoHideDuration={5000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}
