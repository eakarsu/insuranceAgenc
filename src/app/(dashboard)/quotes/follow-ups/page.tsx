'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  Box, Card, CardContent, Typography, Button, Grid, Avatar, Chip, List, ListItem, ListItemIcon, ListItemText, Checkbox,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel, Select, MenuItem, Autocomplete,
  Snackbar, Alert,
} from '@mui/material';
import { Add, FollowTheSigns, Phone, Email, Schedule, CheckCircle } from '@mui/icons-material';
import { format, isPast, isToday } from 'date-fns';

export default function FollowUpsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<any>(null);
  const [formData, setFormData] = useState({ type: 'PHONE', scheduledAt: '', notes: '' });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const { data, isLoading } = useQuery({
    queryKey: ['follow-ups'],
    queryFn: async () => {
      const response = await axios.get('/api/follow-ups');
      return response.data;
    },
  });

  // Fetch all quotes for the dropdown
  const { data: quotesData } = useQuery({
    queryKey: ['quotes-for-followup'],
    queryFn: async () => {
      const response = await axios.get('/api/quotes');
      return response.data;
    },
  });

  const createFollowUpMutation = useMutation({
    mutationFn: async () => {
      if (!selectedQuote) return;
      const response = await axios.post('/api/follow-ups', {
        quoteId: selectedQuote.id,
        type: formData.type,
        scheduledAt: new Date(formData.scheduledAt).toISOString(),
        notes: formData.notes,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follow-ups'] });
      setDialogOpen(false);
      setSelectedQuote(null);
      setFormData({ type: 'PHONE', scheduledAt: '', notes: '' });
      setSnackbar({ open: true, message: 'Follow-up scheduled successfully', severity: 'success' });
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to schedule follow-up', severity: 'error' });
    },
  });

  const followUps = data?.followUps || [];
  const overdue = followUps.filter((f: any) => !f.completedAt && isPast(new Date(f.scheduledAt)) && !isToday(new Date(f.scheduledAt)));
  const today = followUps.filter((f: any) => !f.completedAt && isToday(new Date(f.scheduledAt)));
  const upcoming = followUps.filter((f: any) => !f.completedAt && !isPast(new Date(f.scheduledAt)));

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'CALL': return <Phone />;
      case 'EMAIL': return <Email />;
      default: return <Schedule />;
    }
  };

  const FollowUpCard = ({ title, items, color }: { title: string; items: any[]; color: string }) => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Chip label={items.length} size="small" color={color as any} />
          <Typography variant="h6" fontWeight={600}>{title}</Typography>
        </Box>
        {items.length > 0 ? (
          <List dense>
            {items.map((followUp: any) => (
              <ListItem key={followUp.id} sx={{ cursor: 'pointer' }} onClick={() => router.push(`/quotes/${followUp.quoteId}`)}>
                <ListItemIcon>
                  <Avatar sx={{ width: 32, height: 32, bgcolor: `${color}.light` }}>
                    {getTypeIcon(followUp.type)}
                  </Avatar>
                </ListItemIcon>
                <ListItemText
                  primary={followUp.quote?.client ? `${followUp.quote.client.firstName} ${followUp.quote.client.lastName}` : 'Unknown'}
                  secondary={`${followUp.type} - ${format(new Date(followUp.scheduledAt), 'MMM d, h:mm a')}`}
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography color="text.secondary" variant="body2">No {title.toLowerCase()}</Typography>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Box className="animate-fade-in">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>Follow-ups</Typography>
          <Typography color="text.secondary">Track quote follow-up tasks and reminders</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => setDialogOpen(true)}>Schedule Follow-up</Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <FollowUpCard title="Overdue" items={overdue} color="error" />
        </Grid>
        <Grid item xs={12} md={4}>
          <FollowUpCard title="Today" items={today} color="warning" />
        </Grid>
        <Grid item xs={12} md={4}>
          <FollowUpCard title="Upcoming" items={upcoming} color="info" />
        </Grid>
      </Grid>

      {/* Schedule Follow-up Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Schedule Follow-up</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <Autocomplete
              options={quotesData?.quotes || []}
              getOptionLabel={(option: any) => `${option.quoteNumber} - ${option.client?.firstName} ${option.client?.lastName}`}
              value={selectedQuote}
              onChange={(_, value) => setSelectedQuote(value)}
              renderInput={(params) => <TextField {...params} label="Select Quote" required />}
              renderOption={(props, option: any) => (
                <li {...props} key={option.id}>
                  <Box>
                    <Typography fontWeight={600}>{option.quoteNumber}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {option.client?.firstName} {option.client?.lastName}
                    </Typography>
                  </Box>
                </li>
              )}
            />
            <FormControl fullWidth>
              <InputLabel>Follow-up Type</InputLabel>
              <Select
                value={formData.type}
                label="Follow-up Type"
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <MenuItem value="PHONE">Phone Call</MenuItem>
                <MenuItem value="EMAIL">Email</MenuItem>
                <MenuItem value="TEXT">Text Message</MenuItem>
                <MenuItem value="MEETING">Meeting</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Scheduled Date & Time"
              type="datetime-local"
              value={formData.scheduledAt}
              onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
              fullWidth
              InputLabelProps={{ shrink: true }}
              required
            />
            <TextField
              label="Notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              fullWidth
              multiline
              rows={2}
              placeholder="Add any notes for this follow-up..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => createFollowUpMutation.mutate()}
            disabled={!selectedQuote || !formData.scheduledAt || createFollowUpMutation.isPending}
          >
            {createFollowUpMutation.isPending ? 'Scheduling...' : 'Schedule Follow-up'}
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
