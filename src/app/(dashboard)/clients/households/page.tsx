'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  Box, Card, CardContent, Typography, Button, Grid, Avatar, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Snackbar, Alert,
  Paper, Tooltip, InputAdornment, IconButton,
} from '@mui/material';
import {
  Add, FamilyRestroom, People, PictureAsPdf, Download, Home, LocationOn,
  Phone, Email, Search, Close, Edit, Delete,
} from '@mui/icons-material';

export default function HouseholdsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', address: '', city: '', state: '', zipCode: '', notes: '' });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [search, setSearch] = useState('');
  const [detailHousehold, setDetailHousehold] = useState<any>(null);

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

  const stats = useMemo(() => {
    const total = households.length;
    const totalMembers = households.reduce((sum: number, h: any) => sum + (h._count?.members || 0), 0);
    const withAddress = households.filter((h: any) => h.address).length;
    const avgMembers = total > 0 ? (totalMembers / total).toFixed(1) : '0';
    return { total, totalMembers, withAddress, avgMembers };
  }, [households]);

  const filteredHouseholds = useMemo(() => {
    if (!search.trim()) return households;
    const term = search.toLowerCase();
    return households.filter((h: any) => {
      const memberNames = (h.members || []).map((m: any) => `${m.firstName || ''} ${m.lastName || ''}`).join(' ');
      const fields = [
        h.name || '',
        h.address || '',
        h.city || '',
        h.state || '',
        h.zipCode || '',
        memberNames,
      ];
      return fields.some(field => field.toLowerCase().includes(term));
    });
  }, [households, search]);

  const handleExportCSV = () => {
    const csv = [
      ['Household Name', 'Email', 'Phone', 'Address', 'City', 'State', 'ZIP', 'Members'].join(','),
      ...households.map((h: any) => [
        `"${h.name || ''}"`, h.email || '', h.phone || '',
        `"${h.address || ''}"`, `"${h.city || ''}"`, h.state || '', h.zipCode || '',
        h._count?.members || 0,
      ].join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `households-${new Date().toISOString().split('T')[0]}.csv`;
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
              <Home sx={{ fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight={700}>Households</Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>Manage family households and multi-policy groups</Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Export as PDF">
              <Button variant="outlined" size="small" startIcon={<PictureAsPdf />}
                onClick={() => window.open('/api/export/pdf?type=households', '_blank')}
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
            <Button variant="contained" startIcon={<Add />} onClick={() => {
              setFormData({ name: '', email: '', phone: '', address: '', city: '', state: '', zipCode: '', notes: '' });
              setDialogOpen(true);
            }}
              sx={{ bgcolor: 'white', color: '#1a237e', fontWeight: 600, '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' } }}>
              Add Household
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Stats Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Total Households', value: stats.total, icon: <Home />, color: '#1a237e', bg: 'linear-gradient(135deg, #e8eaf6 0%, #c5cae9 100%)' },
          { label: 'Total Members', value: stats.totalMembers, icon: <People />, color: '#283593', bg: 'linear-gradient(135deg, #e8eaf6 0%, #c5cae9 100%)' },
          { label: 'With Address', value: stats.withAddress, icon: <LocationOn />, color: '#2e7d32', bg: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)' },
          { label: 'Avg. Members', value: stats.avgMembers, icon: <FamilyRestroom />, color: '#e65100', bg: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)' },
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
          placeholder="Search households by name, address, city, state, zip code, or member names..."
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

      {/* Household Cards Grid */}
      <Grid container spacing={3}>
        {filteredHouseholds.map((household: any) => (
          <Grid item xs={12} md={6} lg={4} key={household.id}>
            <Card
              sx={{
                cursor: 'pointer',
                borderRadius: 2.5,
                border: '1px solid',
                borderColor: 'divider',
                transition: 'all 0.2s',
                '&:hover': {
                  boxShadow: '0 8px 24px rgba(26, 35, 126, 0.12)',
                  transform: 'translateY(-2px)',
                  borderColor: '#3949ab',
                },
              }}
              onClick={() => setDetailHousehold(household)}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2.5 }}>
                  <Avatar sx={{
                    bgcolor: '#1a237e', width: 48, height: 48,
                    boxShadow: '0 4px 12px rgba(26, 35, 126, 0.3)',
                  }}>
                    <FamilyRestroom />
                  </Avatar>
                  <Box sx={{ flex: 1, overflow: 'hidden' }}>
                    <Typography variant="h6" fontWeight={700} sx={{ fontSize: '1.05rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {household.name}
                    </Typography>
                    {household.address && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.3 }}>
                        <LocationOn sx={{ fontSize: 14, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                          {household.city}{household.city && household.state ? ', ' : ''}{household.state}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>

                <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, bgcolor: 'grey.50', mb: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <People sx={{ fontSize: 18, color: '#1a237e' }} />
                      <Typography variant="body2" fontWeight={600} sx={{ color: '#1a237e' }}>
                        {household._count?.members || 0} Members
                      </Typography>
                    </Box>
                    <Chip
                      label={household._count?.members > 0 ? 'Active' : 'Empty'}
                      size="small"
                      color={household._count?.members > 0 ? 'success' : 'default'}
                      sx={{ fontWeight: 600, borderRadius: '6px', fontSize: '0.7rem' }}
                    />
                  </Box>
                </Paper>

                {(household.email || household.phone) && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    {household.email && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Email sx={{ fontSize: 14, color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary">{household.email}</Typography>
                      </Box>
                    )}
                    {household.phone && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Phone sx={{ fontSize: 14, color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary">{household.phone}</Typography>
                      </Box>
                    )}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
        {filteredHouseholds.length === 0 && households.length > 0 && !isLoading && (
          <Grid item xs={12}>
            <Card sx={{ borderRadius: 2.5 }}>
              <CardContent sx={{ textAlign: 'center', py: 8 }}>
                <Avatar sx={{ width: 72, height: 72, bgcolor: '#e8eaf6', color: '#1a237e', mx: 'auto', mb: 2 }}>
                  <Search sx={{ fontSize: 40 }} />
                </Avatar>
                <Typography variant="h6" color="text.secondary" fontWeight={500}>No matching households</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Try adjusting your search terms</Typography>
              </CardContent>
            </Card>
          </Grid>
        )}
        {households.length === 0 && !isLoading && (
          <Grid item xs={12}>
            <Card sx={{ borderRadius: 2.5 }}>
              <CardContent sx={{ textAlign: 'center', py: 8 }}>
                <Avatar sx={{ width: 72, height: 72, bgcolor: '#e8eaf6', color: '#1a237e', mx: 'auto', mb: 2 }}>
                  <FamilyRestroom sx={{ fontSize: 40 }} />
                </Avatar>
                <Typography variant="h6" color="text.secondary" fontWeight={500}>No households found</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Create a household to group related clients</Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setDialogOpen(true)}
                  sx={{ mt: 3, borderRadius: 2, bgcolor: '#1a237e', '&:hover': { bgcolor: '#283593' } }}
                >
                  Create First Household
                </Button>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Household Detail Dialog */}
      <Dialog
        open={!!detailHousehold}
        onClose={() => setDetailHousehold(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
      >
        <Box sx={{
          background: 'linear-gradient(135deg, #1a237e 0%, #283593 50%, #3949ab 100%)',
          color: 'white', px: 3, py: 2.5,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.15)', width: 52, height: 52 }}>
              <Home sx={{ fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={700}>{detailHousehold?.name}</Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                <Chip
                  label={`${detailHousehold?._count?.members || 0} Members`}
                  size="small"
                  sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600, fontSize: '0.7rem' }}
                />
              </Box>
            </Box>
          </Box>
          <IconButton onClick={() => setDetailHousehold(null)} sx={{ color: 'white' }}>
            <Close />
          </IconButton>
        </Box>
        <DialogContent dividers sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 1 }}>Household Information</Typography>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">Household Name</Typography>
                  <Typography variant="body2" fontWeight={600}>{detailHousehold?.name || '-'}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocationOn sx={{ fontSize: 18, color: 'text.secondary' }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary">Address</Typography>
                      <Typography variant="body2" fontWeight={600}>{detailHousehold?.address || '-'}</Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">City / State / ZIP</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {[detailHousehold?.city, detailHousehold?.state, detailHousehold?.zipCode].filter(Boolean).join(', ') || '-'}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>

            <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 1 }}>Contact Details</Typography>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Email sx={{ fontSize: 18, color: 'text.secondary' }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary">Email</Typography>
                      <Typography variant="body2" fontWeight={600}>{detailHousehold?.email || '-'}</Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Phone sx={{ fontSize: 18, color: 'text.secondary' }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary">Phone</Typography>
                      <Typography variant="body2" fontWeight={600}>{detailHousehold?.phone || '-'}</Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <People sx={{ fontSize: 18, color: 'text.secondary' }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary">Member Count</Typography>
                      <Typography variant="body2" fontWeight={600}>{detailHousehold?._count?.members || 0}</Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Paper>

            {detailHousehold?.notes && (
              <>
                <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 1 }}>Notes</Typography>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                  <Typography variant="body2">{detailHousehold.notes}</Typography>
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
                await axios.delete(`/api/households/${detailHousehold?.id}`);
                queryClient.invalidateQueries({ queryKey: ['households'] });
                setDetailHousehold(null);
                setSnackbar({ open: true, message: 'Household deleted successfully', severity: 'success' });
              } catch {
                setSnackbar({ open: true, message: 'Failed to delete household', severity: 'error' });
              }
            }}
            sx={{ borderRadius: 2 }}
          >
            Delete
          </Button>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button onClick={() => setDetailHousehold(null)} sx={{ borderRadius: 2 }}>Close</Button>
            <Button
              variant="contained"
              startIcon={<Edit />}
              onClick={() => {
                router.push(`/clients/households/${detailHousehold?.id}`);
                setDetailHousehold(null);
              }}
              sx={{ borderRadius: 2, bgcolor: '#1a237e', '&:hover': { bgcolor: '#283593' } }}
            >
              Edit
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* Add Household Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ width: 48, height: 48, bgcolor: '#1a237e' }}>
              <Home />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={600}>Create New Household</Typography>
              <Typography variant="body2" color="text.secondary">Group related clients into a household</Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 1 }}>Household Information</Typography>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <TextField
                label="Household Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                fullWidth
                required
                placeholder="e.g., Smith Family"
                autoComplete="off"
              />
            </Paper>

            <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 1 }}>Contact Information</Typography>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
              </Box>
            </Paper>

            <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 1 }}>Address</Typography>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
              </Box>
            </Paper>

            <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 1 }}>Notes</Typography>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <TextField
                label="Notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                fullWidth
                multiline
                rows={2}
                autoComplete="off"
              />
            </Paper>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => createMutation.mutate(formData)}
            disabled={!formData.name || createMutation.isPending}
            sx={{ borderRadius: 2, bgcolor: '#1a237e', '&:hover': { bgcolor: '#283593' } }}
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
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })} sx={{ borderRadius: 2 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
