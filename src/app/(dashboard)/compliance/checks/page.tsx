'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  Box, Card, CardContent, Typography, Grid, Chip, Avatar, Paper, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton, TextField,
  Snackbar, Alert, Autocomplete, InputAdornment,
} from '@mui/material';
import {
  GavelRounded, CheckCircle, Warning, Error as ErrorIcon, Schedule, Close,
  PlayArrow, PauseCircle, Search, Edit, Delete,
} from '@mui/icons-material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { format } from 'date-fns';

export default function ComplianceChecksPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [runDialogOpen, setRunDialogOpen] = useState(false);
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);
  const [checkNotes, setCheckNotes] = useState('');
  const [checkEvidence, setCheckEvidence] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [search, setSearch] = useState('');
  const [detailCheck, setDetailCheck] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['complianceChecks', page, pageSize],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page + 1), limit: String(pageSize) });
      const response = await axios.get(`/api/compliance/checks?${params}`);
      return response.data;
    },
  });

  const { data: rulesData } = useQuery({
    queryKey: ['complianceRulesForChecks'],
    queryFn: async () => {
      const response = await axios.get('/api/compliance/rules?isActive=true');
      return response.data;
    },
  });

  const runCheckMutation = useMutation({
    mutationFn: async (payload: { ruleId: string; notes?: string; evidence?: string }) => {
      const response = await axios.post('/api/compliance/checks', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complianceChecks'] });
      setSnackbar({ open: true, message: 'Compliance check completed', severity: 'success' });
      setRunDialogOpen(false);
      setSelectedRuleId(null);
      setCheckNotes('');
      setCheckEvidence('');
    },
    onError: (error: any) => {
      setSnackbar({ open: true, message: error.response?.data?.error || 'Check failed', severity: 'error' });
    },
  });

  const checks = data?.checks || [];
  const totalCount = data?.pagination?.total || 0;
  const rules = rulesData?.rules || [];

  const filteredChecks = useMemo(() => {
    if (!search.trim()) return checks;
    const q = search.toLowerCase();
    return checks.filter((c: any) =>
      (c.rule?.name || '').toLowerCase().includes(q) ||
      (c.rule?.requirement || '').toLowerCase().includes(q) ||
      (c.rule?.category || '').toLowerCase().includes(q) ||
      (c.status || '').toLowerCase().includes(q) ||
      (c.checkedBy || '').toLowerCase().includes(q) ||
      (c.checkedAt ? format(new Date(c.checkedAt), 'MMM d, yyyy').toLowerCase().includes(q) : false) ||
      (c.nextDueDate ? format(new Date(c.nextDueDate), 'MMM d, yyyy').toLowerCase().includes(q) : false)
    );
  }, [checks, search]);

  const stats = useMemo(() => {
    const compliant = checks.filter((c: any) => c.status === 'COMPLIANT').length;
    const nonCompliant = checks.filter((c: any) => c.status === 'NON_COMPLIANT').length;
    const pending = checks.filter((c: any) => c.status === 'PENDING').length;
    const waived = checks.filter((c: any) => c.status === 'WAIVED').length;
    return { compliant, nonCompliant, pending, waived };
  }, [checks]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLIANT': return 'success';
      case 'NON_COMPLIANT': return 'error';
      case 'PENDING': return 'warning';
      case 'WAIVED': return 'info';
      case 'EXPIRED': return 'default';
      default: return 'default';
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'ruleName', headerName: 'Rule Name', flex: 1, minWidth: 220,
      renderCell: (params: GridRenderCellParams) => (
        <Box>
          <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.875rem' }}>
            {params.row.rule?.name || '-'}
          </Typography>
          {params.row.rule?.requirement && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.3 }}>
              {params.row.rule.requirement.length > 60 ? `${params.row.rule.requirement.substring(0, 60)}...` : params.row.rule.requirement}
            </Typography>
          )}
        </Box>
      ),
    },
    {
      field: 'category', headerName: 'Category', width: 140,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.row.rule?.category || '-'}
          size="small"
          variant="outlined"
          sx={{ borderRadius: '6px', fontWeight: 600, fontSize: '0.75rem' }}
        />
      ),
    },
    {
      field: 'status', headerName: 'Status', width: 140,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.value?.replace(/_/g, ' ')}
          size="small"
          color={getStatusColor(params.value) as any}
          sx={{ fontWeight: 600, borderRadius: '6px', minWidth: 100 }}
        />
      ),
    },
    {
      field: 'checkedAt', headerName: 'Checked Date', width: 140,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.84rem' }}>
          {params.value ? format(new Date(params.value), 'MMM d, yyyy') : '-'}
        </Typography>
      ),
    },
    {
      field: 'checkedBy', headerName: 'Checked By', width: 150,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {params.value && (
            <Avatar sx={{ width: 28, height: 28, fontSize: '0.7rem', bgcolor: '#6a1b9a', flexShrink: 0 }}>
              {params.value.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
            </Avatar>
          )}
          <Typography variant="body2" sx={{ fontSize: '0.84rem' }}>{params.value || '-'}</Typography>
        </Box>
      ),
    },
    {
      field: 'nextDueDate', headerName: 'Next Due', width: 130,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.84rem' }}>
          {params.value ? format(new Date(params.value), 'MMM d, yyyy') : '-'}
        </Typography>
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
              <Typography variant="h4" fontWeight={700}>Compliance Checks</Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>Track and run compliance verification checks</Typography>
            </Box>
          </Box>
          <Button
            variant="contained"
            startIcon={<PlayArrow />}
            onClick={() => setRunDialogOpen(true)}
            sx={{ bgcolor: 'white', color: '#6a1b9a', fontWeight: 600, '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' } }}
          >
            Run Check
          </Button>
        </Box>
      </Paper>

      {/* Stats Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Compliant', value: stats.compliant, icon: <CheckCircle />, color: '#2e7d32', bg: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)' },
          { label: 'Non-Compliant', value: stats.nonCompliant, icon: <ErrorIcon />, color: '#d32f2f', bg: 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)' },
          { label: 'Pending', value: stats.pending, icon: <Schedule />, color: '#ed6c02', bg: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)' },
          { label: 'Waived', value: stats.waived, icon: <PauseCircle />, color: '#1976d2', bg: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)' },
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
      <Card sx={{ mb: 2, borderRadius: 2.5, overflow: 'visible' }}>
        <CardContent sx={{ py: 2, px: 2.5, '&:last-child': { pb: 2 } }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search checks by rule name, category, status, checked by..."
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
          rows={filteredChecks}
          columns={columns}
          rowCount={search.trim() ? filteredChecks.length : totalCount}
          loading={isLoading}
          pageSizeOptions={[10, 25, 50]}
          paginationMode="server"
          paginationModel={{ page, pageSize }}
          onPaginationModelChange={(model) => { setPage(model.page); setPageSize(model.pageSize); }}
          onRowClick={(params) => setDetailCheck(params.row)}
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
      <Dialog open={!!detailCheck} onClose={() => setDetailCheck(null)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}>
        {detailCheck && (
          <>
            <Box sx={{ background: 'linear-gradient(135deg, #6a1b9a 0%, #8e24aa 50%, #ab47bc 100%)', color: 'white', px: 3, py: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.15)', width: 52, height: 52 }}><GavelRounded sx={{ fontSize: 28 }} /></Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" fontWeight={700}>Compliance Check</Typography>
                  <Typography variant="body2" sx={{ opacity: 0.85 }}>{detailCheck.rule?.name || '-'}</Typography>
                </Box>
                <Chip label={detailCheck.status?.replace(/_/g, ' ')} size="small" sx={{ fontWeight: 700, bgcolor: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }} />
              </Box>
            </Box>
            <DialogContent sx={{ px: 3, py: 3 }}>
              <Grid container spacing={2.5}>
                {detailCheck.rule?.requirement && (
                  <Grid item xs={12}>
                    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, background: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)', border: '1px solid #ce93d8' }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5 }}>Requirement</Typography>
                      <Typography variant="body2" fontWeight={600} sx={{ mt: 0.5 }}>{detailCheck.rule.requirement}</Typography>
                    </Paper>
                  </Grid>
                )}
                <Grid item xs={6} sm={4}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.68rem' }}>Status</Typography>
                    <Box sx={{ mt: 1 }}><Chip label={detailCheck.status?.replace(/_/g, ' ')} size="small" color={getStatusColor(detailCheck.status) as any} sx={{ fontWeight: 600, borderRadius: '6px' }} /></Box>
                  </Paper>
                </Grid>
                <Grid item xs={6} sm={4}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.68rem' }}>Category</Typography>
                    <Typography variant="body1" fontWeight={600} sx={{ mt: 1 }}>{detailCheck.rule?.category || '-'}</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.68rem' }}>Severity</Typography>
                    <Typography variant="body1" fontWeight={600} sx={{ mt: 1 }}>{detailCheck.rule?.severity || '-'}</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.68rem' }}>Checked Date</Typography>
                    <Typography variant="body1" fontWeight={600} sx={{ mt: 1 }}>{detailCheck.checkedAt ? format(new Date(detailCheck.checkedAt), 'MMM d, yyyy h:mm a') : '-'}</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.68rem' }}>Checked By</Typography>
                    <Typography variant="body1" fontWeight={600} sx={{ mt: 1 }}>{detailCheck.checkedBy || '-'}</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.68rem' }}>Next Due Date</Typography>
                    <Typography variant="body1" fontWeight={600} sx={{ mt: 1 }}>{detailCheck.nextDueDate ? format(new Date(detailCheck.nextDueDate), 'MMM d, yyyy') : '-'}</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.68rem' }}>State</Typography>
                    <Typography variant="body1" fontWeight={600} sx={{ mt: 1 }}>{detailCheck.rule?.state || 'All States'}</Typography>
                  </Paper>
                </Grid>
                {detailCheck.notes && (
                  <Grid item xs={12}>
                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.68rem' }}>Notes</Typography>
                      <Typography variant="body2" sx={{ mt: 1 }}>{detailCheck.notes}</Typography>
                    </Paper>
                  </Grid>
                )}
                {detailCheck.evidence && (
                  <Grid item xs={12}>
                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.68rem' }}>Evidence</Typography>
                      <Typography variant="body2" sx={{ mt: 1 }}>{detailCheck.evidence}</Typography>
                    </Paper>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider', justifyContent: 'space-between' }}>
              <Button color="error" variant="outlined" startIcon={<Delete />} onClick={async () => { if (confirm('Delete this compliance check?')) { try { await axios.delete(`/api/compliance/checks/${detailCheck.id}`); queryClient.invalidateQueries({ queryKey: ['complianceChecks'] }); setDetailCheck(null); } catch {} } }} sx={{ borderRadius: 2 }}>Delete</Button>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button onClick={() => setDetailCheck(null)} sx={{ borderRadius: 2 }}>Close</Button>
                <Button variant="contained" startIcon={<Edit />} onClick={() => { setDetailCheck(null); }} sx={{ borderRadius: 2, bgcolor: '#6a1b9a', '&:hover': { bgcolor: '#4a148c' } }}>Edit Check</Button>
              </Box>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Run Check Dialog */}
      <Dialog open={runDialogOpen} onClose={() => setRunDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: '#6a1b9a', width: 48, height: 48 }}>
                <GavelRounded />
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight={600}>Run Compliance Check</Typography>
                <Typography variant="body2" color="text.secondary">Select a rule to verify compliance</Typography>
              </Box>
            </Box>
            <IconButton onClick={() => setRunDialogOpen(false)} size="small"><Close /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Autocomplete
            sx={{ mt: 2 }}
            options={rules}
            getOptionLabel={(option: any) => `${option.name} (${option.category})`}
            onChange={(_, value: any) => setSelectedRuleId(value?.id || null)}
            renderInput={(params) => (
              <TextField {...params} label="Select Compliance Rule" placeholder="Search rules..." />
            )}
            renderOption={(props, option: any) => (
              <li {...props} key={option.id}>
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="body2" fontWeight={600}>{option.name}</Typography>
                  <Typography variant="caption" color="text.secondary">{option.category} - {option.severity}</Typography>
                </Box>
              </li>
            )}
          />
          <TextField
            fullWidth label="Notes" multiline rows={2} sx={{ mt: 2 }}
            value={checkNotes} onChange={(e) => setCheckNotes(e.target.value)}
            placeholder="Optional notes about this check"
          />
          <TextField
            fullWidth label="Evidence" sx={{ mt: 2 }}
            value={checkEvidence} onChange={(e) => setCheckEvidence(e.target.value)}
            placeholder="URL or description of compliance evidence"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setRunDialogOpen(false)} sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button
            variant="contained"
            startIcon={<PlayArrow />}
            disabled={!selectedRuleId || runCheckMutation.isPending}
            onClick={() => selectedRuleId && runCheckMutation.mutate({
              ruleId: selectedRuleId,
              ...(checkNotes && { notes: checkNotes }),
              ...(checkEvidence && { evidence: checkEvidence }),
            })}
            sx={{ borderRadius: 2, bgcolor: '#6a1b9a', '&:hover': { bgcolor: '#4a148c' } }}
          >
            {runCheckMutation.isPending ? 'Running...' : 'Run Check'}
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
