'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  Box, Card, CardContent, Typography, Button, Grid, Avatar, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Snackbar, Alert,
} from '@mui/material';
import { Add, FamilyRestroom, People } from '@mui/icons-material';

export default function HouseholdsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', address: '', city: '', state: '', zipCode: '', notes: '' });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const { data: households = [], isLoading } = useQuery({
    queryKey: ['households'],
    queryFn: async () => {
      const response = await axios.get('/api/households');
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await axios.post('/api/households', data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['households'] });
      setDialogOpen(false);
      setFormData({ name: '', email: '', phone: '', address: '', city: '', state: '', zipCode: '', notes: '' });
      setSnackbar({ open: true, message: 'Household created successfully', severity: 'success' });
      router.push(`/clients/households/${data.id}`);
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to create household', severity: 'error' });
    },
  });

  return (
    <Box className="animate-fade-in">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>Households</Typography>
          <Typography color="text.secondary">Manage family households and multi-policy groups</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => {
          setFormData({ name: '', email: '', phone: '', address: '', city: '', state: '', zipCode: '', notes: '' });
          setDialogOpen(true);
        }}>Add Household</Button>
      </Box>

      <Grid container spacing={3}>
        {households.map((household: any) => (
          <Grid item xs={12} md={6} lg={4} key={household.id}>
            <Card
              sx={{ cursor: 'pointer', '&:hover': { boxShadow: 4 } }}
              onClick={() => router.push(`/clients/households/${household.id}`)}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main' }}><FamilyRestroom /></Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight={600}>{household.name}</Typography>
                    {household.address && (
                      <Typography variant="body2" color="text.secondary">
                        {household.city}, {household.state}
                      </Typography>
                    )}
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <People fontSize="small" color="action" />
                  <Typography variant="body2">{household._count?.members || 0} Members</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
        {households.length === 0 && !isLoading && (
          <Grid item xs={12}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 6 }}>
                <FamilyRestroom sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">No households found</Typography>
                <Typography variant="body2" color="text.secondary">Create a household to group related clients</Typography>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Add Household Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Household</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Household Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
              placeholder="e.g., Smith Family"
              autoComplete="off"
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                fullWidth
                placeholder="family@email.com"
                autoComplete="off"
              />
              <TextField
                label="Phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                fullWidth
                placeholder="(555) 123-4567"
                autoComplete="off"
              />
            </Box>
            <TextField
              label="Address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              fullWidth
              autoComplete="off"
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="City"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                fullWidth
                autoComplete="off"
              />
              <TextField
                label="State"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                sx={{ width: 100 }}
                autoComplete="off"
              />
              <TextField
                label="ZIP Code"
                value={formData.zipCode}
                onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                sx={{ width: 120 }}
                autoComplete="off"
              />
            </Box>
            <TextField
              label="Notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              fullWidth
              multiline
              rows={2}
              autoComplete="off"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => createMutation.mutate(formData)}
            disabled={!formData.name || createMutation.isPending}
          >
            {createMutation.isPending ? 'Creating...' : 'Create Household'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
