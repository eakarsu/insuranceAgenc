'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  Box, Card, CardContent, Typography, Button, Grid, Avatar, Chip, List, ListItem, ListItemIcon, ListItemText,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel, Select, MenuItem,
  Autocomplete, Snackbar, Alert, Paper, Tooltip, Divider, InputAdornment, IconButton,
} from '@mui/material';
import {
  Add, Event, Cake, Home, DirectionsCar, Work, School, FamilyRestroom, Favorite,
  PictureAsPdf, Download, CheckCircle, PendingActions, CalendarMonth, TrendingUp, Search, Close, Edit, Delete,
} from '@mui/icons-material';
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

const eventColors: Record<string, string> = {
  BIRTHDAY: '#e91e63',
  HOME_PURCHASE: '#1a237e',
  VEHICLE_PURCHASE: '#0277bd',
  JOB_CHANGE: '#e65100',
  GRADUATION: '#2e7d32',
  MARRIAGE: '#c62828',
  NEW_BABY: '#6a1b9a',
  DEFAULT: '#3949ab',
};

export default function LifeEventsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [formData, setFormData] = useState({ title: '', type: 'BIRTHDAY', eventDate: '', description: '' });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [search, setSearch] = useState('');
  const [detailEvent, setDetailEvent] = useState<any>(null);

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

  const stats = useMemo(() => {
    const total = events.length;
    const completed = events.filter((e: any) => e.isCompleted).length;
    const pending = total - completed;
    const upcoming = events.filter((e: any) => {
      const eventDate = new Date(e.eventDate);
      const now = new Date();
      const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      return eventDate >= now && eventDate <= thirtyDays;
    }).length;
    return { total, completed, pending, upcoming };
  }, [events]);

  const filteredEvents = useMemo(() => {
    if (!search.trim()) return events;
    const term = search.toLowerCase();
    return events.filter((e: any) => {
      const clientName = e.client ? `${e.client.firstName || ''} ${e.client.lastName || ''}` : '';
      const dateStr = e.eventDate ? format(new Date(e.eventDate), 'MMM d, yyyy') : '';
      const fields = [
        e.type || '',
        e.title || '',
        e.description || '',
        clientName,
        dateStr,
      ];
      return fields.some(field => field.toLowerCase().includes(term));
    });
  }, [events, search]);

  const handleExportCSV = () => {
    const csv = [
      ['Title', 'Type', 'Client', 'Event Date', 'Status', 'Description'].join(','),
      ...events.map((e: any) => [
        `"${e.title || ''}"`, e.type || '',
        `"${e.client ? `${e.client.firstName} ${e.client.lastName}` : '-'}"`,
        e.eventDate ? format(new Date(e.eventDate), 'MM/dd/yyyy') : '-',
        e.isCompleted ? 'Completed' : 'Pending',
        `"${e.description || ''}"`,
      ].join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `life-events-${new Date().toISOString().split('T')[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <Box className="animate-fade-in">
      {/* Gradient Header */}
      <Paper elevation={0} sx={{
        p: 3, mb: 3, borderRadius: 3,
        background: 'linear-gradient(135deg, #1a237e 0%, #283593 50%, #3949ab 100%)',
        color: 'white',
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.15)', width: 52, height: 52 }}>
              <Event sx={{ fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight={700}>Life Events</Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>Track important client life events for cross-sell opportunities</Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Export as PDF">
              <Button variant="outlined" size="small" startIcon={<PictureAsPdf />}
                onClick={() => window.open('/api/export/pdf?type=life-events', '_blank')}
                sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}>
                PDF
              </Button>
            </Tooltip>
            <Tooltip title="Export as CSV">
              <Button variant="outlined" size="small" startIcon={<Download />}
                onClick={handleExportCSV}
                sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}>
                CSV
              </Button>
            </Tooltip>
            <Button variant="contained" startIcon={<Add />} onClick={() => setDialogOpen(true)}
              sx={{ bgcolor: 'white', color: '#1a237e', fontWeight: 600, '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' } }}>
              Add Life Event
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Stats Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Total Events', value: stats.total, icon: <Event />, color: '#1a237e', bg: 'linear-gradient(135deg, #e8eaf6 0%, #c5cae9 100%)' },
          { label: 'Completed', value: stats.completed, icon: <CheckCircle />, color: '#2e7d32', bg: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)' },
          { label: 'Pending', value: stats.pending, icon: <PendingActions />, color: '#e65100', bg: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)' },
          { label: 'Upcoming (30d)', value: stats.upcoming, icon: <TrendingUp />, color: '#283593', bg: 'linear-gradient(135deg, #e8eaf6 0%, #c5cae9 100%)' },
        ].map((stat) => (
          <Grid item xs={6} sm={3} key={stat.label}>
            <Paper elevation={0} sx={{
              p: 2.5, borderRadius: 2.5, background: stat.bg, border: '1px solid', borderColor: 'divider',
              transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-2px)' },
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.68rem' }}>
                    {stat.label}
                  </Typography>
                  <Typography variant="h4" fontWeight={700} sx={{ color: stat.color, mt: 0.5 }}>
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

      {/* Search Bar */}
      <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 2.5, border: '1px solid', borderColor: 'divider' }}>
        <TextField
          fullWidth
          placeholder="Search events by type, title, description, client name, or date..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          variant="outlined"
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              bgcolor: 'grey.50',
            },
          }}
        />
      </Paper>

      {/* Main Content */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 2.5, overflow: 'hidden' }}>
            <Box sx={{ px: 3, pt: 2.5, pb: 1.5, bgcolor: 'grey.50', borderBottom: '2px solid', borderColor: 'divider' }}>
              <Typography variant="h6" fontWeight={600} sx={{ color: '#1a237e' }}>Upcoming Events</Typography>
              <Typography variant="body2" color="text.secondary">Click on an event to view the client profile</Typography>
            </Box>
            <CardContent sx={{ p: 0 }}>
              {filteredEvents.length > 0 ? (
                <List sx={{ p: 0 }}>
                  {filteredEvents.map((event: any, index: number) => (
                    <Box key={event.id}>
                      <ListItem
                        sx={{
                          cursor: 'pointer',
                          py: 2, px: 3,
                          transition: 'background 0.2s',
                          '&:hover': { bgcolor: '#f5f5f5' },
                        }}
                        onClick={() => setDetailEvent(event)}
                      >
                        <ListItemIcon>
                          <Avatar sx={{
                            bgcolor: event.isCompleted ? '#e8f5e9' : `${eventColors[event.type] || eventColors.DEFAULT}15`,
                            color: event.isCompleted ? '#2e7d32' : eventColors[event.type] || eventColors.DEFAULT,
                            width: 48, height: 48,
                          }}>
                            {eventIcons[event.type] || eventIcons.DEFAULT}
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText
                          primary={event.title}
                          primaryTypographyProps={{ fontWeight: 600, fontSize: '0.95rem' }}
                          secondary={
                            <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                              <CalendarMonth sx={{ fontSize: 14, color: 'text.secondary' }} />
                              <span style={{ fontSize: '0.84rem' }}>
                                {event.client?.firstName} {event.client?.lastName} &mdash; {format(new Date(event.eventDate), 'MMM d, yyyy')}
                              </span>
                            </Box>
                          }
                          secondaryTypographyProps={{ component: 'div' }}
                          sx={{ ml: 1 }}
                        />
                        <Chip
                          label={event.isCompleted ? 'Completed' : 'Pending'}
                          size="small"
                          color={event.isCompleted ? 'success' : 'warning'}
                          sx={{ fontWeight: 600, borderRadius: '6px' }}
                        />
                      </ListItem>
                      {index < filteredEvents.length - 1 && <Divider />}
                    </Box>
                  ))}
                </List>
              ) : events.length > 0 ? (
                <Box sx={{ py: 8, textAlign: 'center' }}>
                  <Search sx={{ fontSize: 56, color: '#c5cae9', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" fontWeight={500}>No matching events</Typography>
                  <Typography variant="body2" color="text.secondary">Try adjusting your search terms</Typography>
                </Box>
              ) : (
                <Box sx={{ py: 8, textAlign: 'center' }}>
                  <Event sx={{ fontSize: 56, color: '#c5cae9', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" fontWeight={500}>No life events found</Typography>
                  <Typography variant="body2" color="text.secondary">Add a life event to start tracking opportunities</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 2.5, overflow: 'hidden' }}>
            <Box sx={{ px: 3, pt: 2.5, pb: 1.5, bgcolor: 'grey.50', borderBottom: '2px solid', borderColor: 'divider' }}>
              <Typography variant="h6" fontWeight={600} sx={{ color: '#1a237e' }}>Event Types</Typography>
              <Typography variant="body2" color="text.secondary">Supported event categories</Typography>
            </Box>
            <CardContent sx={{ p: 0 }}>
              <List dense sx={{ p: 0 }}>
                {Object.entries(eventIcons).filter(([k]) => k !== 'DEFAULT').map(([type, icon], index) => (
                  <Box key={type}>
                    <ListItem sx={{ py: 1.5, px: 3 }}>
                      <ListItemIcon>
                        <Avatar sx={{
                          width: 36, height: 36,
                          bgcolor: `${eventColors[type] || eventColors.DEFAULT}15`,
                          color: eventColors[type] || eventColors.DEFAULT,
                        }}>
                          {icon}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography variant="body2" fontWeight={500} sx={{ fontSize: '0.875rem' }}>
                            {type.replace(/_/g, ' ')}
                          </Typography>
                        }
                      />
                      <Chip
                        label={events.filter((e: any) => e.type === type).length}
                        size="small"
                        sx={{
                          fontWeight: 600, borderRadius: '6px', minWidth: 28,
                          bgcolor: `${eventColors[type] || eventColors.DEFAULT}15`,
                          color: eventColors[type] || eventColors.DEFAULT,
                        }}
                      />
                    </ListItem>
                    {index < Object.entries(eventIcons).filter(([k]) => k !== 'DEFAULT').length - 1 && <Divider />}
                  </Box>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Life Event Detail Dialog */}
      <Dialog
        open={!!detailEvent}
        onClose={() => setDetailEvent(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
      >
        <Box sx={{
          background: `linear-gradient(135deg, ${eventColors[detailEvent?.type] || eventColors.DEFAULT} 0%, ${eventColors[detailEvent?.type] || eventColors.DEFAULT}dd 50%, ${eventColors[detailEvent?.type] || eventColors.DEFAULT}bb 100%)`,
          color: 'white', px: 3, py: 2.5,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.15)', width: 52, height: 52 }}>
              {eventIcons[detailEvent?.type] || eventIcons.DEFAULT}
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={700}>{detailEvent?.title}</Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                <Chip
                  label={detailEvent?.type?.replace(/_/g, ' ')}
                  size="small"
                  sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600, fontSize: '0.7rem' }}
                />
                <Chip
                  label={detailEvent?.isCompleted ? 'Completed' : 'Pending'}
                  size="small"
                  sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600, fontSize: '0.7rem' }}
                />
              </Box>
            </Box>
          </Box>
          <IconButton onClick={() => setDetailEvent(null)} sx={{ color: 'white' }}>
            <Close />
          </IconButton>
        </Box>
        <DialogContent dividers sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 1 }}>Event Information</Typography>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">Title</Typography>
                  <Typography variant="body2" fontWeight={600}>{detailEvent?.title || '-'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Type</Typography>
                  <Typography variant="body2" fontWeight={600}>{detailEvent?.type?.replace(/_/g, ' ') || '-'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Client</Typography>
                  <Typography variant="body2" fontWeight={600} sx={{ color: '#1a237e' }}>
                    {detailEvent?.client ? `${detailEvent.client.firstName} ${detailEvent.client.lastName}` : '-'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalendarMonth sx={{ fontSize: 18, color: 'text.secondary' }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary">Event Date</Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {detailEvent?.eventDate ? format(new Date(detailEvent.eventDate), 'MMM d, yyyy') : '-'}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Status</Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Chip
                      icon={detailEvent?.isCompleted ? <CheckCircle sx={{ fontSize: 16 }} /> : <PendingActions sx={{ fontSize: 16 }} />}
                      label={detailEvent?.isCompleted ? 'Completed' : 'Pending'}
                      size="small"
                      color={detailEvent?.isCompleted ? 'success' : 'warning'}
                      sx={{ fontWeight: 600, borderRadius: '6px' }}
                    />
                  </Box>
                </Grid>
              </Grid>
            </Paper>

            {detailEvent?.description && (
              <>
                <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 1 }}>Description</Typography>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                  <Typography variant="body2">{detailEvent.description}</Typography>
                </Paper>
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
          <Button
            color="error"
            startIcon={<Delete />}
            onClick={async () => {
              try {
                await axios.delete(`/api/life-events/${detailEvent?.id}`);
                queryClient.invalidateQueries({ queryKey: ['life-events'] });
                setDetailEvent(null);
                setSnackbar({ open: true, message: 'Life event deleted successfully', severity: 'success' });
              } catch {
                setSnackbar({ open: true, message: 'Failed to delete life event', severity: 'error' });
              }
            }}
            sx={{ borderRadius: 2 }}
          >
            Delete
          </Button>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button onClick={() => setDetailEvent(null)} sx={{ borderRadius: 2 }}>Close</Button>
            <Button
              variant="contained"
              startIcon={<Edit />}
              onClick={() => {
                router.push(`/clients/${detailEvent?.clientId}`);
                setDetailEvent(null);
              }}
              sx={{ borderRadius: 2, bgcolor: '#1a237e', '&:hover': { bgcolor: '#283593' } }}
            >
              View Client
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* Add Life Event Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ width: 48, height: 48, bgcolor: '#1a237e' }}>
              <Event />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={600}>Add Life Event</Typography>
              <Typography variant="body2" color="text.secondary">Track an important life event for a client</Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 1 }}>Client Selection</Typography>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Autocomplete
                options={clientsData?.clients || []}
                getOptionLabel={(option: any) => `${option.firstName} ${option.lastName}`}
                value={selectedClient}
                onChange={(_, value) => setSelectedClient(value)}
                renderInput={(params) => <TextField {...params} label="Select Client" required />}
              />
            </Paper>

            <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 1 }}>Event Details</Typography>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
            </Paper>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => createMutation.mutate(formData)}
            disabled={!selectedClient || !formData.title || !formData.eventDate || createMutation.isPending}
            sx={{ borderRadius: 2, bgcolor: '#1a237e', '&:hover': { bgcolor: '#283593' } }}
          >
            {createMutation.isPending ? 'Adding...' : 'Add Life Event'}
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
