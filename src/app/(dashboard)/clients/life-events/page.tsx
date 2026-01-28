'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  Box, Card, CardContent, Typography, Button, Grid, Avatar, Chip, List, ListItem, ListItemIcon, ListItemText,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel, Select, MenuItem,
  Autocomplete, Snackbar, Alert,
} from '@mui/material';
import { Add, Event, Cake, Home, DirectionsCar, Work, School, FamilyRestroom, Favorite } from '@mui/icons-material';
import { format } from 'date-fns';

const eventIcons: Record<string, React.ReactNode> = {
  BIRTHDAY: <Cake />,
  HOME_PURCHASE: <Home />,
  VEHICLE_PURCHASE: <DirectionsCar />,
  JOB_CHANGE: <Work />,
  GRADUATION: <School />,
  MARRIAGE: <Favorite />,
  NEW_BABY: <FamilyRestroom />,
  DEFAULT: <Event />,
};

export default function LifeEventsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [formData, setFormData] = useState({ title: '', type: 'BIRTHDAY', eventDate: '', description: '' });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const { data: clientsData } = useQuery({
    queryKey: ['clients-list'],
    queryFn: async () => {
      const response = await axios.get('/api/clients?limit=100');
      return response.data;
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ['life-events'],
    queryFn: async () => {
      const response = await axios.get('/api/life-events');
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await axios.post('/api/life-events', { ...data, clientId: selectedClient?.id });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['life-events'] });
      setDialogOpen(false);
      setFormData({ title: '', type: 'BIRTHDAY', eventDate: '', description: '' });
      setSelectedClient(null);
      setSnackbar({ open: true, message: 'Life event added successfully', severity: 'success' });
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to add life event', severity: 'error' });
    },
  });

  const events = data?.events || [];

  return (
    <Box className="animate-fade-in">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>Life Events</Typography>
          <Typography color="text.secondary">Track important client life events for cross-sell opportunities</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => setDialogOpen(true)}>Add Life Event</Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>Upcoming Events</Typography>
              {events.length > 0 ? (
                <List>
                  {events.map((event: any) => (
                    <ListItem key={event.id} sx={{ cursor: 'pointer' }} onClick={() => router.push(`/clients/${event.clientId}`)}>
                      <ListItemIcon>
                        <Avatar sx={{ bgcolor: event.isCompleted ? 'success.light' : 'warning.light' }}>
                          {eventIcons[event.type] || eventIcons.DEFAULT}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={event.title}
                        secondary={`${event.client?.firstName} ${event.client?.lastName} - ${format(new Date(event.eventDate), 'MMM d, yyyy')}`}
                      />
                      <Chip label={event.isCompleted ? 'Completed' : 'Pending'} size="small" color={event.isCompleted ? 'success' : 'warning'} />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>No life events found</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>Event Types</Typography>
              <List dense>
                {Object.entries(eventIcons).filter(([k]) => k !== 'DEFAULT').map(([type, icon]) => (
                  <ListItem key={type}>
                    <ListItemIcon>{icon}</ListItemIcon>
                    <ListItemText primary={type.replace(/_/g, ' ')} />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Add Life Event Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Life Event</DialogTitle>
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
              label="Event Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              fullWidth
              required
            />
            <FormControl fullWidth>
              <InputLabel>Event Type</InputLabel>
              <Select
                value={formData.type}
                label="Event Type"
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <MenuItem value="BIRTHDAY">Birthday</MenuItem>
                <MenuItem value="MARRIAGE">Marriage</MenuItem>
                <MenuItem value="NEW_BABY">New Baby</MenuItem>
                <MenuItem value="HOME_PURCHASE">Home Purchase</MenuItem>
                <MenuItem value="VEHICLE_PURCHASE">Vehicle Purchase</MenuItem>
                <MenuItem value="JOB_CHANGE">Job Change</MenuItem>
                <MenuItem value="GRADUATION">Graduation</MenuItem>
                <MenuItem value="RETIREMENT">Retirement</MenuItem>
                <MenuItem value="OTHER">Other</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Event Date"
              type="date"
              value={formData.eventDate}
              onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
              fullWidth
              InputLabelProps={{ shrink: true }}
              required
            />
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
              multiline
              rows={2}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => createMutation.mutate(formData)}
            disabled={!selectedClient || !formData.title || !formData.eventDate || createMutation.isPending}
          >
            {createMutation.isPending ? 'Adding...' : 'Add Life Event'}
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
