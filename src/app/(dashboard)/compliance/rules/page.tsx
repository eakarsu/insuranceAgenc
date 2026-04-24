'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  Box, Card, CardContent, Typography, Grid, Chip, Avatar, Paper, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton, TextField,
  Snackbar, Alert, Switch, FormControl, InputLabel, Select, MenuItem, InputAdornment,
} from '@mui/material';
import {
  GavelRounded, Add, Close, Edit, Delete, Search,
} from '@mui/icons-material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { format } from 'date-fns';

const CATEGORY_OPTIONS = ['LICENSING', 'DISCLOSURE', 'DOCUMENTATION', 'REPORTING', 'PRIVACY'];
const SEVERITY_OPTIONS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const FREQUENCY_OPTIONS = ['ONCE', 'MONTHLY', 'QUARTERLY', 'ANNUAL', 'ON_EVENT'];
const LINE_OF_BUSINESS_OPTIONS = [
  '', 'PERSONAL_AUTO', 'HOMEOWNERS', 'RENTERS', 'UMBRELLA', 'LIFE', 'HEALTH',
  'COMMERCIAL_AUTO', 'COMMERCIAL_PROPERTY', 'GENERAL_LIABILITY', 'WORKERS_COMP', 'PROFESSIONAL_LIABILITY', 'CYBER', 'OTHER',
];

const emptyForm = {
  name: '', description: '', category: '', state: '', lineOfBusiness: '', requirement: '', frequency: '', dueDate: '', severity: 'MEDIUM', isActive: true,
};

export default function ComplianceRulesPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<any>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [search, setSearch] = useState('');
  const [detailRule, setDetailRule] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['complianceRules'],
    queryFn: async () => {
      const response = await axios.get('/api/compliance/rules');
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await axios.post('/api/compliance/rules', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complianceRules'] });
      setSnackbar({ open: true, message: 'Rule created successfully', severity: 'success' });
      handleCloseDialog();
    },
    onError: (error: any) => {
      setSnackbar({ open: true, message: error.response?.data?.error || 'Failed to create rule', severity: 'error' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await axios.put(`/api/compliance/rules/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complianceRules'] });
      setSnackbar({ open: true, message: 'Rule updated successfully', severity: 'success' });
      handleCloseDialog();
    },
    onError: (error: any) => {
      setSnackbar({ open: true, message: error.response?.data?.error || 'Failed to update rule', severity: 'error' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await axios.delete(`/api/compliance/rules/${id}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complianceRules'] });
      setSnackbar({ open: true, message: 'Rule deleted', severity: 'success' });
      setDeleteDialogOpen(false);
      setSelectedRule(null);
    },
    onError: () => { setSnackbar({ open: true, message: 'Delete failed', severity: 'error' }); },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const response = await axios.put(`/api/compliance/rules/${id}`, { isActive });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complianceRules'] });
    },
  });

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingRule(null);
    setForm(emptyForm);
  };

  const handleEdit = (rule: any) => {
    setEditingRule(rule);
    setForm({
      name: rule.name || '',
      description: rule.description || '',
      category: rule.category || '',
      state: rule.state || '',
      lineOfBusiness: rule.lineOfBusiness || '',
      requirement: rule.requirement || '',
      frequency: rule.frequency || '',
      dueDate: rule.dueDate ? new Date(rule.dueDate).toISOString().split('T')[0] : '',
      severity: rule.severity || 'MEDIUM',
      isActive: rule.isActive !== undefined ? rule.isActive : true,
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    const payload = {
      ...form,
      lineOfBusiness: form.lineOfBusiness || null,
      dueDate: form.dueDate || null,
    };
    if (editingRule) {
      updateMutation.mutate({ id: editingRule.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'error';
      case 'HIGH': return 'error';
      case 'MEDIUM': return 'warning';
      case 'LOW': return 'success';
      default: return 'default';
    }
  };

  const formatLOB = (lob: string) => {
    if (!lob) return '-';
    return lob.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const rules = data?.rules || [];

  const filteredRules = useMemo(() => {
    if (!search.trim()) return rules;
    const q = search.toLowerCase();
    return rules.filter((r: any) =>
      (r.name || '').toLowerCase().includes(q) ||
      (r.description || '').toLowerCase().includes(q) ||
      (r.category || '').toLowerCase().includes(q) ||
      (r.state || '').toLowerCase().includes(q) ||
      (r.severity || '').toLowerCase().includes(q) ||
      (r.frequency || '').replace(/_/g, ' ').toLowerCase().includes(q) ||
      (r.requirement || '').toLowerCase().includes(q) ||
      formatLOB(r.lineOfBusiness || '').toLowerCase().includes(q)
    );
  }, [rules, search]);

  const columns: GridColDef[] = [
    {
      field: 'name', headerName: 'Name', flex: 1, minWidth: 220,
      renderCell: (params: GridRenderCellParams) => (
        <Box>
          <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.875rem' }}>{params.value}</Typography>
          {params.row.description && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.3 }}>
              {params.row.description.length > 60 ? `${params.row.description.substring(0, 60)}...` : params.row.description}
            </Typography>
          )}
        </Box>
      ),
    },
    {
      field: 'category', headerName: 'Category', width: 140,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.value}
          size="small"
          sx={{
            borderRadius: '6px', fontWeight: 600, fontSize: '0.75rem',
            bgcolor: params.value === 'LICENSING' ? '#e3f2fd' : params.value === 'DISCLOSURE' ? '#f3e5f5' : params.value === 'DOCUMENTATION' ? '#fff3e0' : params.value === 'REPORTING' ? '#e8f5e9' : '#ffebee',
            color: params.value === 'LICENSING' ? '#1565c0' : params.value === 'DISCLOSURE' ? '#6a1b9a' : params.value === 'DOCUMENTATION' ? '#e65100' : params.value === 'REPORTING' ? '#2e7d32' : '#c62828',
          }}
        />
      ),
    },
    {
      field: 'state', headerName: 'State', width: 80,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>{params.value || 'All'}</Typography>
      ),
    },
    {
      field: 'severity', headerName: 'Severity', width: 110,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.value}
          size="small"
          color={getSeverityColor(params.value) as any}
          sx={{ fontWeight: 600, borderRadius: '6px', minWidth: 72 }}
        />
      ),
    },
    {
      field: 'frequency', headerName: 'Frequency', width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" sx={{ fontSize: '0.84rem', textTransform: 'capitalize' }}>
          {(params.value || '-').replace(/_/g, ' ').toLowerCase()}
        </Typography>
      ),
    },
    {
      field: 'isActive', headerName: 'Active', width: 80,
      renderCell: (params: GridRenderCellParams) => (
        <Switch
          size="small"
          checked={params.value}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => toggleActiveMutation.mutate({ id: params.row.id, isActive: e.target.checked })}
        />
      ),
    },
    {
      field: 'actions', headerName: '', width: 100, sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleEdit(params.row); }} sx={{ opacity: 0.6, '&:hover': { opacity: 1 } }}>
            <Edit fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={(e) => { e.stopPropagation(); setSelectedRule(params.row); setDeleteDialogOpen(true); }} sx={{ opacity: 0.6, '&:hover': { opacity: 1, color: 'error.main' } }}>
            <Delete fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];

  return (
    <Box className="animate-fade-in">
      {/* Header */}
      <Paper elevation={0} sx={{
        p: 3, mb: 3, borderRadius: 3,
        background: 'linear-gradient(135deg, #6a1b9a 0%, #8e24aa 50%, #ab47bc 100%)',
        color: 'white',
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.15)', width: 52, height: 52 }}>
              <GavelRounded sx={{ fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight={700}>Compliance Rules</Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>Manage regulatory compliance rules and requirements</Typography>
            </Box>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => { setForm(emptyForm); setEditingRule(null); setDialogOpen(true); }}
            sx={{ bgcolor: 'white', color: '#6a1b9a', fontWeight: 600, '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' } }}
          >
            Add Rule
          </Button>
        </Box>
      </Paper>

      {/* Search Bar */}
      <Card sx={{ mb: 2, borderRadius: 2.5, overflow: 'visible' }}>
        <CardContent sx={{ py: 2, px: 2.5, '&:last-child': { pb: 2 } }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search rules by name, category, state, severity, frequency..."
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

      {/* Data Grid */}
      <Card sx={{ borderRadius: 2.5, overflow: 'hidden' }}>
        <DataGrid
          rows={filteredRules}
          columns={columns}
          loading={isLoading}
          pageSizeOptions={[10, 25, 50]}
          disableRowSelectionOnClick
          onRowClick={(params) => setDetailRule(params.row)}
          rowHeight={72}
          sx={{
            border: 'none',
            '& .MuiDataGrid-columnHeaders': { bgcolor: 'grey.50', borderBottom: '2px solid', borderColor: 'divider' },
            '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: 0.5, color: 'text.secondary' },
            '& .MuiDataGrid-row': { cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } },
            '& .MuiDataGrid-cell': { borderColor: 'grey.100' },
            '& .MuiDataGrid-footerContainer': { borderTop: '2px solid', borderColor: 'divider' },
          }}
          autoHeight
        />
      </Card>

      {/* Add/Edit Rule Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: '#6a1b9a', width: 48, height: 48 }}>
                <GavelRounded />
              </Avatar>
              <Typography variant="h6" fontWeight={600}>{editingRule ? 'Edit Compliance Rule' : 'Add Compliance Rule'}</Typography>
            </Box>
            <IconButton onClick={handleCloseDialog} size="small"><Close /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Rule Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select value={form.category} label="Category" onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {CATEGORY_OPTIONS.map((cat) => (
                    <MenuItem key={cat} value={cat}>{cat.charAt(0) + cat.slice(1).toLowerCase()}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Severity</InputLabel>
                <Select value={form.severity} label="Severity" onChange={(e) => setForm({ ...form, severity: e.target.value })}>
                  {SEVERITY_OPTIONS.map((sev) => (
                    <MenuItem key={sev} value={sev}>{sev.charAt(0) + sev.slice(1).toLowerCase()}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} multiline rows={2} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Requirement" value={form.requirement} onChange={(e) => setForm({ ...form, requirement: e.target.value })} multiline rows={2} required placeholder="What must be done to comply" />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} placeholder="e.g., CA, NY (blank = all)" />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Line of Business</InputLabel>
                <Select value={form.lineOfBusiness} label="Line of Business" onChange={(e) => setForm({ ...form, lineOfBusiness: e.target.value })}>
                  <MenuItem value="">All</MenuItem>
                  {LINE_OF_BUSINESS_OPTIONS.filter(Boolean).map((lob) => (
                    <MenuItem key={lob} value={lob}>{formatLOB(lob)}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Frequency</InputLabel>
                <Select value={form.frequency} label="Frequency" onChange={(e) => setForm({ ...form, frequency: e.target.value })}>
                  <MenuItem value="">None</MenuItem>
                  {FREQUENCY_OPTIONS.map((freq) => (
                    <MenuItem key={freq} value={freq}>{freq.replace(/_/g, ' ').charAt(0) + freq.replace(/_/g, ' ').slice(1).toLowerCase()}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Due Date" type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} InputLabelProps={{ shrink: true }} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleCloseDialog} sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button
            variant="contained"
            disabled={!form.name || !form.category || !form.requirement || createMutation.isPending || updateMutation.isPending}
            onClick={handleSubmit}
            sx={{ borderRadius: 2, bgcolor: '#6a1b9a', '&:hover': { bgcolor: '#4a148c' } }}
          >
            {(createMutation.isPending || updateMutation.isPending) ? 'Saving...' : editingRule ? 'Update Rule' : 'Create Rule'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={!!detailRule} onClose={() => setDetailRule(null)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}>
        {detailRule && (
          <>
            <Box sx={{
              p: 3,
              background: 'linear-gradient(135deg, #6a1b9a 0%, #8e24aa 50%, #ab47bc 100%)',
              color: 'white',
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.15)', width: 52, height: 52 }}>
                    <GavelRounded sx={{ fontSize: 28 }} />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight={700}>{detailRule.name}</Typography>
                    <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                      <Chip label={detailRule.category} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600, fontSize: '0.7rem' }} />
                      <Chip label={detailRule.severity} size="small" sx={{ bgcolor: detailRule.severity === 'CRITICAL' ? '#d32f2f' : detailRule.severity === 'HIGH' ? '#f44336' : detailRule.severity === 'MEDIUM' ? '#ff9800' : '#4caf50', color: 'white', fontWeight: 600, fontSize: '0.7rem' }} />
                    </Box>
                  </Box>
                </Box>
                <IconButton onClick={() => setDetailRule(null)} sx={{ color: 'white' }}><Close /></IconButton>
              </Box>
            </Box>
            <DialogContent sx={{ p: 3 }}>
              <Grid container spacing={2}>
                {detailRule.description && (
                  <Grid item xs={12}>
                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#f5f5f5' }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>Description</Typography>
                      <Typography variant="body2" sx={{ mt: 0.5 }}>{detailRule.description}</Typography>
                    </Paper>
                  </Grid>
                )}
                {detailRule.requirement && (
                  <Grid item xs={12}>
                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#fff3e0', borderColor: '#ffe0b2' }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>Requirement</Typography>
                      <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 500 }}>{detailRule.requirement}</Typography>
                    </Paper>
                  </Grid>
                )}
                <Grid item xs={6} sm={4}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>State</Typography>
                  <Typography variant="body2" fontWeight={600} sx={{ mt: 0.5 }}>{detailRule.state || 'All States'}</Typography>
                </Grid>
                <Grid item xs={6} sm={4}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>Line of Business</Typography>
                  <Typography variant="body2" fontWeight={600} sx={{ mt: 0.5 }}>{formatLOB(detailRule.lineOfBusiness || '')}</Typography>
                </Grid>
                <Grid item xs={6} sm={4}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>Frequency</Typography>
                  <Typography variant="body2" fontWeight={600} sx={{ mt: 0.5, textTransform: 'capitalize' }}>
                    {(detailRule.frequency || 'N/A').replace(/_/g, ' ').toLowerCase()}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={4}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>Status</Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Chip label={detailRule.isActive ? 'Active' : 'Inactive'} size="small" color={detailRule.isActive ? 'success' : 'default'} sx={{ fontWeight: 600 }} />
                  </Box>
                </Grid>
                {detailRule.dueDate && (
                  <Grid item xs={6} sm={4}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>Due Date</Typography>
                    <Typography variant="body2" fontWeight={600} sx={{ mt: 0.5 }}>{format(new Date(detailRule.dueDate), 'MMM dd, yyyy')}</Typography>
                  </Grid>
                )}
                {detailRule.createdAt && (
                  <Grid item xs={6} sm={4}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>Created</Typography>
                    <Typography variant="body2" fontWeight={600} sx={{ mt: 0.5 }}>{format(new Date(detailRule.createdAt), 'MMM dd, yyyy')}</Typography>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider', justifyContent: 'space-between' }}>
              <Button color="error" variant="outlined" startIcon={<Delete />} onClick={() => { setSelectedRule(detailRule); setDeleteDialogOpen(true); setDetailRule(null); }} sx={{ borderRadius: 2 }}>Delete</Button>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button onClick={() => setDetailRule(null)} sx={{ borderRadius: 2 }}>Close</Button>
                <Button variant="contained" startIcon={<Edit />} onClick={() => { handleEdit(detailRule); setDetailRule(null); }}
                  sx={{ borderRadius: 2, bgcolor: '#6a1b9a', '&:hover': { bgcolor: '#4a148c' } }}>
                  Edit Rule
                </Button>
              </Box>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle>Delete Compliance Rule</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete <strong>{selectedRule?.name}</strong>? This will also remove all associated compliance checks. This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => deleteMutation.mutate(selectedRule?.id)}
            disabled={deleteMutation.isPending}
            sx={{ borderRadius: 2 }}
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar open={snackbar.open} autoHideDuration={5000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })} sx={{ borderRadius: 2 }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}
