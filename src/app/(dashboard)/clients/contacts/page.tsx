'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  Box, Card, Typography, Button, TextField, InputAdornment, Dialog, DialogTitle,
  DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem, Autocomplete, Snackbar, Alert,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Add, Search, ContactPhone } from '@mui/icons-material';

export default function ContactsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', type: 'FAMILY', relationship: '', email: '', phone: '', isPrimary: false });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const { data: clientsData } = useQuery({
    queryKey: ['clients-list'],
    queryFn: async () => {
      const response = await axios.get('/api/clients?limit=100');
      return response.data;
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ['contacts', search],
    queryFn: async () => {
      const response = await axios.get(`/api/contacts?search=${search}`);
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await axios.post('/api/contacts', { ...data, clientId: selectedClient?.id });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      setDialogOpen(false);
      setFormData({ name: '', type: 'FAMILY', relationship: '', email: '', phone: '', isPrimary: false });
      setSelectedClient(null);
      setSnackbar({ open: true, message: 'Contact added successfully', severity: 'success' });
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to add contact', severity: 'error' });
    },
  });

  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Name', flex: 1 },
    { field: 'type', headerName: 'Type', width: 120 },
    { field: 'relationship', headerName: 'Relationship', flex: 1 },
    { field: 'clientName', headerName: 'Client', flex: 1 },
    { field: 'email', headerName: 'Email', flex: 1.5 },
    { field: 'phone', headerName: 'Phone', flex: 1 },
    { field: 'isPrimary', headerName: 'Primary', width: 100, type: 'boolean' },
  ];

  return (
    <Box className="animate-fade-in">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>Contacts</Typography>
          <Typography color="text.secondary">Manage additional contacts for clients</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => setDialogOpen(true)}>Add Contact</Button>
      </Box>

      <Card sx={{ mb: 3, p: 2 }}>
        <TextField
          placeholder="Search contacts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
          sx={{ width: 300 }}
        />
      </Card>

      <Card>
        <DataGrid
          rows={data?.contacts || []}
          columns={columns}
          loading={isLoading}
          pageSizeOptions={[10, 25, 50]}
          disableRowSelectionOnClick
          onRowClick={(params) => router.push(`/clients/${params.row.clientId}`)}
          sx={{ border: 'none', '& .MuiDataGrid-row:hover': { cursor: 'pointer' } }}
          autoHeight
        />
      </Card>

      {/* Add Contact Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Contact</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <Autocomplete
              options={clientsData?.clients || []}
              getOptionLabel={(option: any) => `${option.firstName} ${option.lastName}`}
              value={selectedClient}
              onChange={(_, value) => setSelectedClient(value)}
              renderInput={(params) => <TextField {...params} label="Select Client" required />}
            />
            <TextField
              label="Contact Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
            />
            <FormControl fullWidth>
              <InputLabel>Contact Type</InputLabel>
              <Select
                value={formData.type}
                label="Contact Type"
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <MenuItem value="FAMILY">Family</MenuItem>
                <MenuItem value="BUSINESS">Business</MenuItem>
                <MenuItem value="EMERGENCY">Emergency</MenuItem>
                <MenuItem value="OTHER">Other</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Relationship"
              value={formData.relationship}
              onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
              fullWidth
              placeholder="e.g., Spouse, Parent, Partner"
            />
            <TextField
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              fullWidth
            />
            <TextField
              label="Phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => createMutation.mutate(formData)}
            disabled={!selectedClient || !formData.name || createMutation.isPending}
          >
            {createMutation.isPending ? 'Adding...' : 'Add Contact'}
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
