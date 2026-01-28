'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  Box, Button, Card, CardContent, Typography, Grid, Avatar, Chip,
  List, ListItem, ListItemText, ListItemIcon, ListItemAvatar,
  Skeleton, Divider,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  FormControl, InputLabel, Select, MenuItem, Autocomplete, Alert, Snackbar,
} from '@mui/material';
import {
  ArrowBack, Edit, FamilyRestroom, Person, Business, Email, Phone,
  LocationOn, Policy, Add, Delete,
} from '@mui/icons-material';
import { format } from 'date-fns';

export default function HouseholdDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const queryClient = useQueryClient();

  // Dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  // Form states
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    notes: '',
  });
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [selectedHouseholdId, setSelectedHouseholdId] = useState<string>(id);

  const { data: household, isLoading } = useQuery({
    queryKey: ['household', id],
    queryFn: async () => {
      const response = await axios.get(`/api/households/${id}`);
      return response.data;
    },
  });

  // Fetch all households for the dropdown
  const { data: allHouseholds = [] } = useQuery({
    queryKey: ['households'],
    queryFn: async () => {
      const response = await axios.get('/api/households');
      return response.data;
    },
    enabled: addMemberDialogOpen,
  });

  // Fetch clients without a household for Add Member
  const { data: availableClients } = useQuery({
    queryKey: ['clients-no-household'],
    queryFn: async () => {
      const response = await axios.get('/api/clients?noHousehold=true');
      return response.data.clients || [];
    },
    enabled: addMemberDialogOpen,
  });

  // Update household mutation
  const updateHouseholdMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await axios.put(`/api/households/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['household', id] });
      setEditDialogOpen(false);
      setSnackbar({ open: true, message: 'Household updated successfully', severity: 'success' });
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to update household', severity: 'error' });
    },
  });

  // Add member mutation
  const addMemberMutation = useMutation({
    mutationFn: async (clientId: string) => {
      const response = await axios.patch(`/api/clients/${clientId}`, { householdId: selectedHouseholdId });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['household', id] });
      queryClient.invalidateQueries({ queryKey: ['household', selectedHouseholdId] });
      queryClient.invalidateQueries({ queryKey: ['households'] });
      queryClient.invalidateQueries({ queryKey: ['clients-no-household'] });
      setAddMemberDialogOpen(false);
      setSelectedClient(null);
      setSelectedHouseholdId(id);
      const selectedHousehold = allHouseholds.find((h: any) => h.id === selectedHouseholdId);
      setSnackbar({ open: true, message: `Member added to ${selectedHousehold?.name || 'household'} successfully`, severity: 'success' });
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to add member', severity: 'error' });
    },
  });

  // Delete household mutation
  const deleteHouseholdMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.delete(`/api/households/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['households'] });
      setSnackbar({ open: true, message: 'Household deleted successfully', severity: 'success' });
      router.push('/clients/households');
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to delete household', severity: 'error' });
    },
  });

  const handleOpenEditDialog = () => {
    setEditForm({
      name: household?.name || '',
      email: household?.email || '',
      phone: household?.phone || '',
      address: household?.address || '',
      city: household?.city || '',
      state: household?.state || '',
      zipCode: household?.zipCode || '',
      notes: household?.notes || '',
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    updateHouseholdMutation.mutate(editForm);
  };

  const handleAddMember = () => {
    if (selectedClient) {
      addMemberMutation.mutate(selectedClient.id);
    }
  };

  if (isLoading) {
    return (
      <Box>
        <Skeleton variant="rectangular" height={200} sx={{ mb: 3, borderRadius: 2 }} />
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
          </Grid>
          <Grid item xs={12} md={8}>
            <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
          </Grid>
        </Grid>
      </Box>
    );
  }

  if (!household) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h5" color="text.secondary">Household not found</Typography>
        <Button sx={{ mt: 2 }} onClick={() => router.push('/clients/households')}>
          Back to Households
        </Button>
      </Box>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'PROSPECT': return 'info';
      case 'INACTIVE': return 'warning';
      case 'FORMER': return 'error';
      default: return 'default';
    }
  };

  const totalPolicies = household.members?.reduce(
    (sum: number, member: any) => sum + (member._count?.policies || 0),
    0
  ) || 0;

  return (
    <Box className="animate-fade-in">
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={() => router.push('/clients/households')}>
          Back
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button variant="outlined" color="error" startIcon={<Delete />} onClick={() => setDeleteDialogOpen(true)}>
          Delete
        </Button>
        <Button variant="outlined" startIcon={<Edit />} onClick={handleOpenEditDialog}>
          Edit
        </Button>
        <Button variant="contained" startIcon={<Add />} onClick={() => setAddMemberDialogOpen(true)}>
          Add Member
        </Button>
      </Box>

      {/* Household Header Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>
            <Avatar
              sx={{
                width: 80,
                height: 80,
                bgcolor: 'primary.main',
                fontSize: '2rem',
              }}
            >
              <FamilyRestroom sx={{ fontSize: 40 }} />
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" fontWeight={700} gutterBottom>
                {household.name}
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 1 }}>
                {household.email && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Email fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">{household.email}</Typography>
                  </Box>
                )}
                {household.phone && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Phone fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">{household.phone}</Typography>
                  </Box>
                )}
                {household.address && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <LocationOn fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {household.address}, {household.city}, {household.state} {household.zipCode}
                    </Typography>
                  </Box>
                )}
              </Box>
              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <Chip
                  icon={<Person />}
                  label={`${household.members?.length || 0} Members`}
                  color="primary"
                  variant="outlined"
                />
                <Chip
                  icon={<Policy />}
                  label={`${totalPolicies} Policies`}
                  color="success"
                  variant="outlined"
                />
              </Box>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="body2" color="text.secondary">
                Created: {format(new Date(household.createdAt), 'MMM d, yyyy')}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Stats Row */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Person sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4" fontWeight={700}>
                {household.members?.length || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">Members</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Policy sx={{ fontSize: 32, color: 'success.main', mb: 1 }} />
              <Typography variant="h4" fontWeight={700}>{totalPolicies}</Typography>
              <Typography variant="body2" color="text.secondary">Total Policies</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" fontWeight={700}>
                {household.members?.filter((m: any) => m.status === 'ACTIVE').length || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">Active Members</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" fontWeight={700}>
                {household.members?.reduce(
                  (sum: number, m: any) => sum + (m._count?.claims || 0),
                  0
                ) || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">Total Claims</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Members Section */}
      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Household Members
          </Typography>
          {household.members?.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Contact</TableCell>
                    <TableCell>Policies</TableCell>
                    <TableCell>Agent</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {household.members.map((member: any) => (
                    <TableRow
                      key={member.id}
                      hover
                      sx={{ cursor: 'pointer' }}
                      onClick={() => router.push(`/clients/${member.id}`)}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: member.type === 'PERSONAL' ? 'primary.light' : 'secondary.light' }}>
                            {member.type === 'PERSONAL' ? <Person fontSize="small" /> : <Business fontSize="small" />}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={600}>
                              {member.firstName} {member.lastName}
                            </Typography>
                            {member.businessName && (
                              <Typography variant="caption" color="text.secondary">
                                {member.businessName}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={member.type}
                          size="small"
                          color={member.type === 'PERSONAL' ? 'primary' : 'secondary'}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={member.status}
                          size="small"
                          color={getStatusColor(member.status) as any}
                        />
                      </TableCell>
                      <TableCell>
                        <Box>
                          {member.email && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Email sx={{ fontSize: 14, color: 'text.secondary' }} />
                              <Typography variant="caption">{member.email}</Typography>
                            </Box>
                          )}
                          {member.phone && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Phone sx={{ fontSize: 14, color: 'text.secondary' }} />
                              <Typography variant="caption">{member.phone}</Typography>
                            </Box>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={member._count?.policies || 0}
                          size="small"
                          color="success"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{member.agent?.name || '-'}</Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              No members in this household
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Notes Section */}
      {household.notes && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Notes
            </Typography>
            <Typography variant="body2">{household.notes}</Typography>
          </CardContent>
        </Card>
      )}

      {/* Edit Household Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Household</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Household Name"
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              fullWidth
              required
            />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  fullWidth
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Phone"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  fullWidth
                />
              </Grid>
            </Grid>
            <TextField
              label="Address"
              value={editForm.address}
              onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
              fullWidth
            />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="City"
                  value={editForm.city}
                  onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                  fullWidth
                />
              </Grid>
              <Grid item xs={3}>
                <TextField
                  label="State"
                  value={editForm.state}
                  onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                  fullWidth
                />
              </Grid>
              <Grid item xs={3}>
                <TextField
                  label="Zip Code"
                  value={editForm.zipCode}
                  onChange={(e) => setEditForm({ ...editForm, zipCode: e.target.value })}
                  fullWidth
                />
              </Grid>
            </Grid>
            <TextField
              label="Notes"
              value={editForm.notes}
              onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
              fullWidth
              multiline
              rows={3}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveEdit}
            disabled={!editForm.name || updateHouseholdMutation.isPending}
          >
            {updateHouseholdMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Member Dialog */}
      <Dialog open={addMemberDialogOpen} onClose={() => setAddMemberDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Member to Household</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Select a household and create a new member.
            </Typography>

            {/* Household Dropdown */}
            <FormControl fullWidth>
              <InputLabel>Select Household</InputLabel>
              <Select
                value={selectedHouseholdId}
                onChange={(e) => setSelectedHouseholdId(e.target.value)}
                label="Select Household"
              >
                {allHouseholds.map((h: any) => (
                  <MenuItem key={h.id} value={h.id}>
                    {h.name} ({h._count?.members || 0} members)
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => {
                setAddMemberDialogOpen(false);
                router.push(`/clients/new?householdId=${selectedHouseholdId}`);
              }}
              disabled={!selectedHouseholdId}
              fullWidth
              size="large"
            >
              Create New Member
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setAddMemberDialogOpen(false); setSelectedHouseholdId(id); }}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Delete Household</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{household?.name}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            This action cannot be undone. Members will be removed from this household but not deleted.
          </Typography>
          {household?.members?.length > 0 && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              This household has {household.members.length} member(s). They will be unlinked from this household.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => deleteHouseholdMutation.mutate()}
            disabled={deleteHouseholdMutation.isPending}
          >
            {deleteHouseholdMutation.isPending ? 'Deleting...' : 'Delete Household'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
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
