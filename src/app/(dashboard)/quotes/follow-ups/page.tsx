'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  Box, Card, CardContent, Typography, Button, Grid, Avatar, Chip, List, ListItem, ListItemIcon, ListItemText,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel, Select, MenuItem, Autocomplete,
  Snackbar, Alert, Paper, Tooltip, Divider, InputAdornment, IconButton,
} from '@mui/material';
import {
  Add, FollowTheSigns, Phone, Email, Schedule, CheckCircle,
  PictureAsPdf, Download, Warning, AccessTime, CalendarToday, Notifications, Search, Close, Edit, Delete,
} from '@mui/icons-material';
import { format, isPast, isToday } from 'date-fns';

export default function FollowUpsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<any>(null);
  const [formData, setFormData] = useState({ type: 'PHONE', scheduledAt: '', notes: '' });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [search, setSearch] = useState('');
  const [detailFollowUp, setDetailFollowUp] = useState<any>(null);

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

  const filteredFollowUps = useMemo(() => {
    if (!search.trim()) return followUps;
    const q = search.toLowerCase();
    return followUps.filter((f: any) => {
      const clientName = f.quote?.client ? `${f.quote.client.firstName} ${f.quote.client.lastName}` : '';
      return (
        clientName.toLowerCase().includes(q) ||
        (f.type || '').toLowerCase().includes(q) ||
        (f.notes || '').toLowerCase().includes(q) ||
        (f.scheduledAt ? format(new Date(f.scheduledAt), 'MMM d, h:mm a').toLowerCase().includes(q) : false) ||
        (f.quote?.quoteNumber || '').toLowerCase().includes(q)
      );
    });
  }, [followUps, search]);

  const overdue = filteredFollowUps.filter((f: any) => !f.completedAt && isPast(new Date(f.scheduledAt)) && !isToday(new Date(f.scheduledAt)));
  const today = filteredFollowUps.filter((f: any) => !f.completedAt && isToday(new Date(f.scheduledAt)));
  const upcoming = filteredFollowUps.filter((f: any) => !f.completedAt && !isPast(new Date(f.scheduledAt)));
  const completed = filteredFollowUps.filter((f: any) => f.completedAt);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'CALL': case 'PHONE': return <Phone sx={{ fontSize: 18 }} />;
      case 'EMAIL': return <Email sx={{ fontSize: 18 }} />;
      default: return <Schedule sx={{ fontSize: 18 }} />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'CALL': case 'PHONE': return '#2e7d32';
      case 'EMAIL': return '#1976d2';
      case 'TEXT': return '#7b1fa2';
      case 'MEETING': return '#e65100';
      default: return '#616161';
    }
  };

  const FollowUpCard = ({ title, items, color, icon, gradient }: { title: string; items: any[]; color: string; icon: React.ReactNode; gradient: string }) => (
    <Card sx={{ borderRadius: 2.5, overflow: 'hidden', height: '100%', border: '1px solid', borderColor: 'divider' }}>
      {/* Card Header with gradient accent */}
      <Box sx={{
        px: 2.5, py: 1.5,
        background: gradient,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 34, height: 34, color: 'white' }}>
            {icon}
          </Avatar>
          <Typography variant="subtitle1" fontWeight={700} sx={{ color: 'white' }}>
            {title}
          </Typography>
        </Box>
        <Chip
          label={items.length}
          size="small"
          sx={{
            bgcolor: 'rgba(255,255,255,0.25)',
            color: 'white',
            fontWeight: 700,
            fontSize: '0.8rem',
            minWidth: 32,
          }}
        />
      </Box>
      <CardContent sx={{ px: 2, py: 1.5 }}>
        {items.length > 0 ? (
          <List dense disablePadding>
            {items.map((followUp: any, index: number) => (
              <Box key={followUp.id}>
                <ListItem
                  sx={{
                    cursor: 'pointer',
                    borderRadius: 2,
                    py: 1.5,
                    px: 1.5,
                    transition: 'all 0.2s',
                    '&:hover': { bgcolor: 'grey.50', transform: 'translateX(4px)' },
                  }}
                  onClick={() => setDetailFollowUp(followUp)}
                >
                  <ListItemIcon sx={{ minWidth: 42 }}>
                    <Avatar sx={{
                      width: 34, height: 34,
                      bgcolor: `${getTypeColor(followUp.type)}15`,
                      color: getTypeColor(followUp.type),
                    }}>
                      {getTypeIcon(followUp.type)}
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.9rem' }}>
                        {followUp.quote?.client ? `${followUp.quote.client.firstName} ${followUp.quote.client.lastName}` : 'Unknown'}
                      </Typography>
                    }
                    secondary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.3 }}>
                        <Chip
                          label={followUp.type}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: '0.65rem',
                            fontWeight: 600,
                            bgcolor: `${getTypeColor(followUp.type)}15`,
                            color: getTypeColor(followUp.type),
                            borderRadius: '4px',
                          }}
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                          {format(new Date(followUp.scheduledAt), 'MMM d, h:mm a')}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
                {index < items.length - 1 && <Divider sx={{ mx: 1 }} />}
              </Box>
            ))}
          </List>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="text.secondary" variant="body2">No {title.toLowerCase()} follow-ups</Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Box className="animate-fade-in">
      {/* Gradient Header */}
      <Paper elevation={0} sx={{
        p: 3, mb: 3, borderRadius: 3,
        background: 'linear-gradient(135deg, #2e7d32 0%, #388e3c 50%, #66bb6a 100%)',
        color: 'white',
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.15)', width: 52, height: 52 }}>
              <Notifications sx={{ fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight={700}>Follow-Ups</Typography>
              <Typography variant="body2" sx={{ opacity: 0.85 }}>Track quote follow-up tasks and reminders</Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Export as PDF">
              <Button variant="outlined" size="small" startIcon={<PictureAsPdf />}
                onClick={() => window.open('/api/export/pdf?type=follow-ups', '_blank')}
                sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}>
                PDF
              </Button>
            </Tooltip>
            <Tooltip title="Export as CSV">
              <Button variant="outlined" size="small" startIcon={<Download />}
                onClick={() => {
                  const csv = [
                    ['Client', 'Type', 'Scheduled At', 'Status', 'Notes'].join(','),
                    ...followUps.map((f: any) => [
                      `"${f.quote?.client ? `${f.quote.client.firstName} ${f.quote.client.lastName}` : 'Unknown'}"`,
                      f.type || '',
                      f.scheduledAt ? new Date(f.scheduledAt).toLocaleString() : '',
                      f.completedAt ? 'Completed' : isPast(new Date(f.scheduledAt)) ? 'Overdue' : 'Pending',
                      `"${f.notes || ''}"`,
                    ].join(','))
                  ].join('\n');
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a'); a.href = url;
                  a.download = `follow-ups-${new Date().toISOString().split('T')[0]}.csv`;
                  a.click(); URL.revokeObjectURL(url);
                }}
                sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}>
                CSV
              </Button>
            </Tooltip>
            <Button variant="contained" startIcon={<Add />} onClick={() => setDialogOpen(true)}
              sx={{ bgcolor: 'white', color: '#2e7d32', fontWeight: 600, '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' } }}>
              Schedule Follow-up
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Stats Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Total Follow-Ups', value: followUps.length, icon: <Notifications />, color: '#2e7d32', bg: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)' },
          { label: 'Overdue', value: overdue.length, icon: <Warning />, color: '#c62828', bg: 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)' },
          { label: 'Due Today', value: today.length, icon: <AccessTime />, color: '#e65100', bg: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)' },
          { label: 'Upcoming', value: upcoming.length, icon: <CalendarToday />, color: '#1976d2', bg: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)' },
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
      <Card sx={{ mb: 3, borderRadius: 2.5, overflow: 'visible' }}>
        <CardContent sx={{ py: 2, px: 2.5, '&:last-child': { pb: 2 } }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search follow-ups by client name, type, notes, quote #..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'grey.50' } }}
          />
        </CardContent>
      </Card>

      {/* Follow-Up Category Cards */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <FollowUpCard
            title="Overdue"
            items={overdue}
            color="#c62828"
            icon={<Warning sx={{ fontSize: 18 }} />}
            gradient="linear-gradient(135deg, #c62828 0%, #ef5350 100%)"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <FollowUpCard
            title="Today"
            items={today}
            color="#e65100"
            icon={<AccessTime sx={{ fontSize: 18 }} />}
            gradient="linear-gradient(135deg, #e65100 0%, #ff9800 100%)"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <FollowUpCard
            title="Upcoming"
            items={upcoming}
            color="#1976d2"
            icon={<CalendarToday sx={{ fontSize: 18 }} />}
            gradient="linear-gradient(135deg, #1565c0 0%, #42a5f5 100%)"
          />
        </Grid>
      </Grid>

      {/* Follow-Up Detail Dialog */}
      <Dialog open={!!detailFollowUp} onClose={() => setDetailFollowUp(null)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}>
        <Box sx={{
          p: 3,
          background: 'linear-gradient(135deg, #2e7d32 0%, #388e3c 50%, #66bb6a 100%)',
          color: 'white',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 52, height: 52 }}>
              <Notifications sx={{ fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={700} sx={{ color: 'white' }}>
                {detailFollowUp?.quote?.client ? `${detailFollowUp.quote.client.firstName} ${detailFollowUp.quote.client.lastName}` : 'Follow-Up Details'}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                <Chip label={detailFollowUp?.type || '-'} size="small"
                  sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600, fontSize: '0.75rem' }} />
                <Chip
                  label={detailFollowUp?.completedAt ? 'Completed' : (detailFollowUp?.scheduledAt && isPast(new Date(detailFollowUp.scheduledAt)) && !isToday(new Date(detailFollowUp.scheduledAt))) ? 'Overdue' : 'Pending'}
                  size="small"
                  sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600, fontSize: '0.75rem' }}
                />
              </Box>
            </Box>
          </Box>
          <IconButton onClick={() => setDetailFollowUp(null)} sx={{ color: 'white' }}>
            <Close />
          </IconButton>
        </Box>
        <DialogContent dividers>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, mb: 2 }}>
            <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 1 }}>Follow-Up Information</Typography>
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Client Name</Typography>
                <Typography variant="body2" fontWeight={600}>
                  {detailFollowUp?.quote?.client ? `${detailFollowUp.quote.client.firstName} ${detailFollowUp.quote.client.lastName}` : '-'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Quote Number</Typography>
                <Typography variant="body2" fontWeight={700} sx={{ color: '#2e7d32' }}>{detailFollowUp?.quote?.quoteNumber || '-'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Type</Typography>
                <Chip label={detailFollowUp?.type || '-'} size="small"
                  sx={{ mt: 0.3, height: 22, fontSize: '0.7rem', fontWeight: 600, bgcolor: `${getTypeColor(detailFollowUp?.type || '')}15`, color: getTypeColor(detailFollowUp?.type || ''), borderRadius: '4px' }} />
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Scheduled Date</Typography>
                <Typography variant="body2">{detailFollowUp?.scheduledAt ? format(new Date(detailFollowUp.scheduledAt), 'MMM d, yyyy h:mm a') : '-'}</Typography>
              </Grid>
            </Grid>
          </Paper>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
            <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 1 }}>Additional Details</Typography>
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">Notes</Typography>
                <Typography variant="body2">{detailFollowUp?.notes || 'No notes'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Status</Typography>
                {detailFollowUp && (
                  <Chip
                    label={detailFollowUp.completedAt ? 'Completed' : (isPast(new Date(detailFollowUp.scheduledAt)) && !isToday(new Date(detailFollowUp.scheduledAt))) ? 'Overdue' : 'Pending'}
                    size="small"
                    color={detailFollowUp.completedAt ? 'success' : (isPast(new Date(detailFollowUp.scheduledAt)) && !isToday(new Date(detailFollowUp.scheduledAt))) ? 'error' : 'warning'}
                    sx={{ fontWeight: 600, borderRadius: '6px', mt: 0.3 }}
                  />
                )}
              </Grid>
            </Grid>
          </Paper>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
          <Button
            color="error"
            startIcon={<Delete />}
            onClick={async () => {
              if (confirm('Delete this follow-up?')) {
                await axios.delete(`/api/follow-ups/${detailFollowUp?.id}`);
                queryClient.invalidateQueries({ queryKey: ['follow-ups'] });
                setDetailFollowUp(null);
              }
            }}
            sx={{ borderRadius: 2 }}
          >
            Delete
          </Button>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button onClick={() => setDetailFollowUp(null)} sx={{ borderRadius: 2 }}>Close</Button>
            <Button
              variant="contained"
              startIcon={<Edit />}
              onClick={() => router.push(`/quotes/${detailFollowUp?.quoteId}`)}
              sx={{ borderRadius: 2, bgcolor: '#2e7d32', '&:hover': { bgcolor: '#1b5e20' } }}
            >
              View Quote
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* Schedule Follow-up Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: '#2e7d32', width: 44, height: 44 }}>
              <Add />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={600}>Schedule Follow-up</Typography>
              <Typography variant="body2" color="text.secondary">Set a reminder to follow up on a quote</Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Autocomplete
              options={quotesData?.quotes || []}
              getOptionLabel={(option: any) => `${option.quoteNumber} - ${option.client?.firstName} ${option.client?.lastName}`}
              value={selectedQuote}
              onChange={(_, value) => setSelectedQuote(value)}
              renderInput={(params) => <TextField {...params} label="Select Quote" required sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />}
              renderOption={(props, option: any) => (
                <li {...props} key={option.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ bgcolor: '#2e7d32', width: 32, height: 32, fontSize: '0.75rem' }}>
                      {option.client?.firstName?.[0]}{option.client?.lastName?.[0]}
                    </Avatar>
                    <Box>
                      <Typography fontWeight={600}>{option.quoteNumber}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {option.client?.firstName} {option.client?.lastName}
                      </Typography>
                    </Box>
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
                sx={{ borderRadius: 2 }}
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
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <TextField
              label="Notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              fullWidth
              multiline
              rows={2}
              placeholder="Add any notes for this follow-up..."
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => createFollowUpMutation.mutate()}
            disabled={!selectedQuote || !formData.scheduledAt || createFollowUpMutation.isPending}
            sx={{ borderRadius: 2, bgcolor: '#2e7d32', '&:hover': { bgcolor: '#1b5e20' } }}
          >
            {createFollowUpMutation.isPending ? 'Scheduling...' : 'Schedule Follow-up'}
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
