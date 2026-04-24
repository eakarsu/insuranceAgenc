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
  Gavel, Add, Close, Edit, Delete, Search,
} from '@mui/icons-material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';

const LINE_OF_BUSINESS_OPTIONS = [
  'PERSONAL_AUTO', 'HOMEOWNERS', 'RENTERS', 'UMBRELLA', 'LIFE', 'HEALTH',
  'COMMERCIAL_AUTO', 'COMMERCIAL_PROPERTY', 'GENERAL_LIABILITY', 'WORKERS_COMP', 'PROFESSIONAL_LIABILITY', 'CYBER', 'OTHER',
];

const OPERATOR_OPTIONS = ['GT', 'LT', 'GTE', 'LTE', 'EQ', 'NEQ', 'BETWEEN', 'IN'];

const CATEGORY_OPTIONS = ['age', 'claims_history', 'credit_score', 'property_age', 'driving_record', 'revenue', 'employees', 'years_in_business', 'coverage_amount', 'other'];

const emptyForm = {
  name: '', description: '', lineOfBusiness: '', category: '', field: '', operator: '', value: '', riskPoints: 0, priority: 0, isActive: true,
};

export default function UnderwritingRulesPage() {
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
    queryKey: ['underwritingRules'],
    queryFn: async () => {
      const response = await axios.get('/api/underwriting/rules');
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await axios.post('/api/underwriting/rules', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['underwritingRules'] });
      setSnackbar({ open: true, message: 'Rule created successfully', severity: 'success' });
      handleCloseDialog();
    },
    onError: (error: any) => {
      setSnackbar({ open: true, message: error.response?.data?.error || 'Failed to create rule', severity: 'error' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await axios.put(`/api/underwriting/rules/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['underwritingRules'] });
      setSnackbar({ open: true, message: 'Rule updated successfully', severity: 'success' });
      handleCloseDialog();
    },
    onError: (error: any) => {
      setSnackbar({ open: true, message: error.response?.data?.error || 'Failed to update rule', severity: 'error' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await axios.delete(`/api/underwriting/rules/${id}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['underwritingRules'] });
      setSnackbar({ open: true, message: 'Rule deleted', severity: 'success' });
      setDeleteDialogOpen(false);
      setSelectedRule(null);
    },
    onError: () => { setSnackbar({ open: true, message: 'Delete failed', severity: 'error' }); },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const response = await axios.put(`/api/underwriting/rules/${id}`, { isActive });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['underwritingRules'] });
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
      lineOfBusiness: rule.lineOfBusiness || '',
      category: rule.category || '',
      field: rule.field || '',
      operator: rule.operator || '',
      value: rule.value || '',
      riskPoints: rule.riskPoints || 0,
      priority: rule.priority || 0,
      isActive: rule.isActive !== undefined ? rule.isActive : true,
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (editingRule) {
      updateMutation.mutate({ id: editingRule.id, data: form });
    } else {
      createMutation.mutate(form);
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
      formatLOB(r.lineOfBusiness || '').toLowerCase().includes(q) ||
      (r.category || '').replace(/_/g, ' ').toLowerCase().includes(q) ||
      (r.field || '').toLowerCase().includes(q) ||
      (r.operator || '').toLowerCase().includes(q) ||
      String(r.value || '').toLowerCase().includes(q) ||
      String(r.riskPoints || '').includes(q) ||
      String(r.priority || '').includes(q)
    );
  }, [rules, search]);

  const columns: GridColDef[] = [
    {
      field: 'name', headerName: 'Name', flex: 1, minWidth: 200,
      renderCell: (params: GridRenderCellParams) => (
        <Box>
          <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.875rem' }}>{params.value}</Typography>
          {params.row.description && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.3 }}>
              {params.row.description.length > 50 ? `${params.row.description.substring(0, 50)}...` : params.row.description}
            </Typography>
          )}
        </Box>
      ),
    },
    {
      field: 'lineOfBusiness', headerName: 'Line of Business', width: 175,
      renderCell: (params: GridRenderCellParams) => (
        <Chip label={formatLOB(params.value)} size="small" variant="outlined" sx={{ borderRadius: '6px' }} />
      ),
    },
    {
      field: 'category', headerName: 'Category', width: 140,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" sx={{ fontSize: '0.875rem', textTransform: 'capitalize' }}>
          {(params.value || '').replace(/_/g, ' ')}
        </Typography>
      ),
    },
    {
      field: 'field', headerName: 'Field', width: 160,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" sx={{ fontSize: '0.84rem', fontFamily: 'monospace', color: 'text.secondary' }}>{params.value}</Typography>
      ),
    },
    {
      field: 'operator', headerName: 'Operator', width: 100,
      renderCell: (params: GridRenderCellParams) => (
        <Chip label={params.value} size="small" sx={{ borderRadius: '6px', fontWeight: 600, bgcolor: '#e3f2fd', color: '#1565c0' }} />
      ),
    },
    {
      field: 'value', headerName: 'Value', width: 100,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>{params.value}</Typography>
      ),
    },
    {
      field: 'riskPoints', headerName: 'Risk Points', width: 110,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" fontWeight={700} sx={{ fontSize: '0.9rem', color: params.value > 20 ? '#d32f2f' : params.value > 10 ? '#ed6c02' : '#2e7d32' }}>
          {params.value}
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
      field: 'priority', headerName: 'Priority', width: 80,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>{params.value}</Typography>
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
        background: 'linear-gradient(135deg, #e65100 0%, #f57c00 50%, #ff9800 100%)',
        color: 'white',
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.15)', width: 52, height: 52 }}>
              <Gavel sx={{ fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight={700}>Underwriting Rules</Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>Manage risk assessment rules and thresholds</Typography>
            </Box>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => { setForm(emptyForm); setEditingRule(null); setDialogOpen(true); }}
            sx={{ bgcolor: 'white', color: '#e65100', fontWeight: 600, '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' } }}
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
            placeholder="Search rules by name, line of business, category, field, operator..."
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
          onRowClick={(params) => setDetailRule(params.row)}
          disableRowSelectionOnClick
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

      {/* Detail Dialog */}
      <Dialog open={!!detailRule && !dialogOpen} onClose={() => setDetailRule(null)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}>
        {detailRule && (
          <>
            <Box sx={{ background: 'linear-gradient(135deg, #e65100 0%, #f57c00 50%, #ff9800 100%)', color: 'white', px: 3, py: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.15)', width: 52, height: 52 }}><Gavel sx={{ fontSize: 28 }} /></Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" fontWeight={700}>{detailRule.name}</Typography>
                  <Typography variant="body2" sx={{ opacity: 0.85 }}>{formatLOB(detailRule.lineOfBusiness || '')}</Typography>
                </Box>
                <Chip label={detailRule.isActive ? 'Active' : 'Inactive'} size="small" sx={{ fontWeight: 700, bgcolor: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }} />
              </Box>
            </Box>
            <DialogContent sx={{ px: 3, py: 3 }}>
              <Grid container spacing={2.5}>
                {detailRule.description && (
                  <Grid item xs={12}>
                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.68rem' }}>Description</Typography>
                      <Typography variant="body2" sx={{ mt: 1 }}>{detailRule.description}</Typography>
                    </Paper>
                  </Grid>
                )}
                <Grid item xs={6} sm={4}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.68rem' }}>Category</Typography>
                    <Typography variant="body1" fontWeight={600} sx={{ mt: 1, textTransform: 'capitalize' }}>{(detailRule.category || '').replace(/_/g, ' ')}</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} sm={4}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.68rem' }}>Risk Points</Typography>
                    <Typography variant="h5" fontWeight={700} sx={{ mt: 1, color: detailRule.riskPoints > 20 ? '#d32f2f' : detailRule.riskPoints > 10 ? '#ed6c02' : '#2e7d32' }}>{detailRule.riskPoints}</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.68rem' }}>Priority</Typography>
                    <Typography variant="h5" fontWeight={700} sx={{ mt: 1 }}>{detailRule.priority}</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.68rem' }}>Field</Typography>
                    <Typography variant="body2" fontWeight={600} sx={{ mt: 1, fontFamily: 'monospace', color: '#1565c0' }}>{detailRule.field}</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.68rem' }}>Operator</Typography>
                    <Box sx={{ mt: 1 }}><Chip label={detailRule.operator} size="small" sx={{ fontWeight: 600, borderRadius: '6px', bgcolor: '#e3f2fd', color: '#1565c0' }} /></Box>
                  </Paper>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.68rem' }}>Value</Typography>
                    <Typography variant="body1" fontWeight={600} sx={{ mt: 1 }}>{detailRule.value}</Typography>
                  </Paper>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider', justifyContent: 'space-between' }}>
              <Button color="error" variant="outlined" startIcon={<Delete />} onClick={() => { setSelectedRule(detailRule); setDeleteDialogOpen(true); setDetailRule(null); }} sx={{ borderRadius: 2 }}>Delete</Button>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button onClick={() => setDetailRule(null)} sx={{ borderRadius: 2 }}>Close</Button>
                <Button variant="contained" startIcon={<Edit />} onClick={() => { handleEdit(detailRule); setDetailRule(null); }} sx={{ borderRadius: 2, bgcolor: '#e65100', '&:hover': { bgcolor: '#bf360c' } }}>Edit Rule</Button>
              </Box>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Add/Edit Rule Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: '#e65100', width: 48, height: 48 }}>
                <Gavel />
              </Avatar>
              <Typography variant="h6" fontWeight={600}>{editingRule ? 'Edit Rule' : 'Add New Rule'}</Typography>
            </Box>
            <IconButton onClick={handleCloseDialog} size="small"><Close /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Rule Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Line of Business</InputLabel>
                <Select value={form.lineOfBusiness} label="Line of Business" onChange={(e) => setForm({ ...form, lineOfBusiness: e.target.value })}>
                  {LINE_OF_BUSINESS_OPTIONS.map((lob) => (
                    <MenuItem key={lob} value={lob}>{formatLOB(lob)}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} multiline rows={2} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select value={form.category} label="Category" onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {CATEGORY_OPTIONS.map((cat) => (
                    <MenuItem key={cat} value={cat}>{cat.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Field" value={form.field} onChange={(e) => setForm({ ...form, field: e.target.value })} placeholder="e.g., client.dateOfBirth" helperText="Dot notation path to evaluate" />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Operator</InputLabel>
                <Select value={form.operator} label="Operator" onChange={(e) => setForm({ ...form, operator: e.target.value })}>
                  {OPERATOR_OPTIONS.map((op) => (
                    <MenuItem key={op} value={op}>{op}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Value" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} placeholder="Comparison value" />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Risk Points" type="number" value={form.riskPoints} onChange={(e) => setForm({ ...form, riskPoints: parseInt(e.target.value) || 0 })} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Priority" type="number" value={form.priority} onChange={(e) => setForm({ ...form, priority: parseInt(e.target.value) || 0 })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleCloseDialog} sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button
            variant="contained"
            disabled={!form.name || !form.lineOfBusiness || !form.field || !form.operator || !form.value || createMutation.isPending || updateMutation.isPending}
            onClick={handleSubmit}
            sx={{ borderRadius: 2, bgcolor: '#e65100', '&:hover': { bgcolor: '#bf360c' } }}
          >
            {(createMutation.isPending || updateMutation.isPending) ? 'Saving...' : editingRule ? 'Update Rule' : 'Create Rule'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle>Delete Underwriting Rule</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete <strong>{selectedRule?.name}</strong>? This action cannot be undone.</Typography>
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
