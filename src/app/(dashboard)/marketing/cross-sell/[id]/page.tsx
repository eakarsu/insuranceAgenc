'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  Box, Button, Card, CardContent, Typography, Grid, Chip, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem,
  Snackbar, Alert, Skeleton, Avatar, List, ListItem, ListItemText,
} from '@mui/material';
import { ArrowBack, Edit, Delete, Person, Recommend, RequestQuote, Email, Phone } from '@mui/icons-material';
import { format } from 'date-fns';

export default function CrossSellDetailPage() {
  const params = useParams<{ id: string }>();
  const { id } = params;
  const router = useRouter();
  const queryClient = useQueryClient();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [status, setStatus] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const { data: recommendation, isLoading } = useQuery({
    queryKey: ['cross-sell', id],
    queryFn: async () => {
      const response = await axios.get(`/api/marketing/cross-sell/${id}`);
      return response.data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await axios.patch(`/api/marketing/cross-sell/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cross-sell', id] });
      queryClient.invalidateQueries({ queryKey: ['cross-sell-recommendations'] });
      setEditDialogOpen(false);
      setSnackbar({ open: true, message: 'Status updated successfully', severity: 'success' });
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to update status', severity: 'error' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await axios.delete(`/api/marketing/cross-sell/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cross-sell-recommendations'] });
      setSnackbar({ open: true, message: 'Recommendation deleted', severity: 'success' });
      router.push('/marketing/cross-sell');
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to delete recommendation', severity: 'error' });
    },
  });

  const handleEdit = () => {
    setStatus(recommendation.status);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    updateMutation.mutate({ status });
  };

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  const handleCreateQuote = () => {
    router.push(`/quotes/new?clientId=${recommendation.clientId}&lob=${encodeURIComponent(recommendation.recommendedProduct)}`);
  };

  if (isLoading) {
    return (
      <Box>
        <Skeleton variant="rectangular" height={60} sx={{ mb: 3 }} />
        <Skeleton variant="rectangular" height={400} />
      </Box>
    );
  }

  if (!recommendation) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h5" color="text.secondary">Recommendation not found</Typography>
        <Button sx={{ mt: 2 }} onClick={() => router.push('/marketing/cross-sell')}>
          Back to Cross-Sell
        </Button>
      </Box>
    );
  }

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'CONVERTED': return 'success';
      case 'CONTACTED': return 'info';
      case 'DECLINED': return 'error';
      default: return 'warning';
    }
  };

  return (
    <Box className="animate-fade-in">
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={() => router.push('/marketing/cross-sell')}>
          Back
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button variant="outlined" startIcon={<Edit />} onClick={handleEdit}>
          Update Status
        </Button>
        <Button variant="contained" startIcon={<RequestQuote />} onClick={handleCreateQuote}>
          Create Quote
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
                <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
                  <Recommend sx={{ fontSize: 32 }} />
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h5" fontWeight={700}>
                    {recommendation.recommendedProduct}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Chip
                      label={`${Math.round(Number(recommendation.score))}% Match`}
                      size="small"
                      color={Number(recommendation.score) >= 90 ? 'success' : Number(recommendation.score) >= 70 ? 'warning' : 'default'}
                    />
                    <Chip
                      label={recommendation.status}
                      size="small"
                      color={getStatusColor(recommendation.status) as any}
                    />
                  </Box>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Why This Recommendation
              </Typography>
              <Typography variant="body1" sx={{ mb: 3 }}>
                {recommendation.reasoning}
              </Typography>

              {recommendation.currentPolicies?.length > 0 && (
                <>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Client's Current Policies
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                    {recommendation.currentPolicies.map((policy: string, idx: number) => (
                      <Chip key={idx} label={policy} variant="outlined" />
                    ))}
                  </Box>
                </>
              )}

              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Created
              </Typography>
              <Typography variant="body2">
                {format(new Date(recommendation.createdAt), 'MMM d, yyyy h:mm a')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Person color="primary" />
                <Typography variant="h6" fontWeight={600}>Client Information</Typography>
              </Box>
              <Typography variant="body1" fontWeight={500}>
                {recommendation.client?.firstName} {recommendation.client?.lastName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {recommendation.client?.type}
              </Typography>

              <Box sx={{ mt: 2 }}>
                {recommendation.client?.email && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Email fontSize="small" color="action" />
                    <Typography variant="body2">{recommendation.client.email}</Typography>
                  </Box>
                )}
                {recommendation.client?.phone && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Phone fontSize="small" color="action" />
                    <Typography variant="body2">{recommendation.client.phone}</Typography>
                  </Box>
                )}
              </Box>

              <Button
                fullWidth
                variant="outlined"
                sx={{ mt: 2 }}
                onClick={() => router.push(`/clients/${recommendation.clientId}`)}
              >
                View Client Profile
              </Button>
            </CardContent>
          </Card>

          {recommendation.client?.policies?.length > 0 && (
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>Active Policies</Typography>
                <List dense>
                  {recommendation.client.policies.map((policy: any) => (
                    <ListItem key={policy.id} disablePadding sx={{ mb: 1 }}>
                      <ListItemText
                        primary={policy.lineOfBusiness}
                        secondary={
                          <>
                            {policy.carrier?.name && <span>{policy.carrier.name} • </span>}
                            ${policy.premium?.toLocaleString() || 'N/A'}/year
                          </>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      {/* Update Status Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Update Recommendation Status</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={status}
              label="Status"
              onChange={(e) => setStatus(e.target.value)}
            >
              <MenuItem value="PENDING">Pending</MenuItem>
              <MenuItem value="CONTACTED">Contacted</MenuItem>
              <MenuItem value="CONVERTED">Converted</MenuItem>
              <MenuItem value="DECLINED">Declined</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveEdit} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Recommendation</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this recommendation?</Typography>
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
