'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  Box, Card, CardContent, Typography, Grid, Chip, Avatar, Paper, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Autocomplete, TextField,
  Snackbar, Alert, LinearProgress, InputAdornment,
} from '@mui/material';
import {
  Assessment, CheckCircle, Warning, Cancel, Close, PlayArrow, Search, Edit, Delete,
} from '@mui/icons-material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { format } from 'date-fns';

export default function UnderwritingPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [runDialogOpen, setRunDialogOpen] = useState(false);
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [search, setSearch] = useState('');
  const [detailResult, setDetailResult] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['underwritingResults', page, pageSize],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page + 1), limit: String(pageSize) });
      const response = await axios.get(`/api/underwriting/evaluate?${params}`);
      return response.data;
    },
  });

  const { data: quotesData } = useQuery({
    queryKey: ['quotesForUnderwriting'],
    queryFn: async () => {
      const response = await axios.get('/api/quotes?limit=100');
      return response.data;
    },
  });

  const evaluateMutation = useMutation({
    mutationFn: async (quoteId: string) => {
      const response = await axios.post('/api/underwriting/evaluate', { quoteId });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['underwritingResults'] });
      setSnackbar({ open: true, message: `Underwriting complete: ${data.decision} (Score: ${data.riskScore}/${data.maxScore})`, severity: 'success' });
      setRunDialogOpen(false);
      setSelectedQuoteId(null);
    },
    onError: (error: any) => {
      setSnackbar({ open: true, message: error.response?.data?.error || 'Evaluation failed', severity: 'error' });
    },
  });

  const results = data?.results || [];
  const totalCount = data?.pagination?.total || 0;

  const filteredResults = useMemo(() => {
    if (!search.trim()) return results;
    const q = search.toLowerCase();
    return results.filter((r: any) => {
      const client = r.quote?.client;
      const clientName = client ? (client.businessName || `${client.firstName} ${client.lastName}`) : '';
      return (
        (r.quote?.quoteNumber || '').toLowerCase().includes(q) ||
        clientName.toLowerCase().includes(q) ||
        formatLOB(r.quote?.lineOfBusiness || '').toLowerCase().includes(q) ||
        (r.decision || '').toLowerCase().includes(q) ||
        String(r.riskScore || '').includes(q) ||
        (r.createdAt ? format(new Date(r.createdAt), 'MMM d, yyyy').toLowerCase().includes(q) : false)
      );
    });
  }, [results, search]);

  const approvedCount = results.filter((r: any) => r.decision === 'APPROVED').length;
  const referredCount = results.filter((r: any) => r.decision === 'REFERRED').length;
  const declinedCount = results.filter((r: any) => r.decision === 'DECLINED').length;

  const getDecisionColor = (decision: string) => {
    switch (decision) {
      case 'APPROVED': return 'success';
      case 'REFERRED': return 'warning';
      case 'DECLINED': return 'error';
      default: return 'default';
    }
  };

  const getRiskBarColor = (score: number) => {
    if (score <= 30) return '#4caf50';
    if (score <= 60) return '#ff9800';
    return '#f44336';
  };

  const formatLOB = (lob: string) => {
    if (!lob) return '-';
    return lob.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const columns: GridColDef[] = [
    {
      field: 'quoteNumber', headerName: 'Quote #', width: 155,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" fontWeight={600} sx={{ color: '#e65100', fontSize: '0.9rem' }}>
          {params.row.quote?.quoteNumber || '-'}
        </Typography>
      ),
    },
    {
      field: 'client', headerName: 'Client', flex: 1, minWidth: 200,
      renderCell: (params: GridRenderCellParams) => {
        const client = params.row.quote?.client;
        const name = client ? (client.businessName || `${client.firstName} ${client.lastName}`) : '-';
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {client && (
              <Avatar sx={{ width: 32, height: 32, fontSize: '0.75rem', bgcolor: '#1565c0', flexShrink: 0 }}>
                {client.businessName ? client.businessName[0] : `${client.firstName?.[0] || ''}${client.lastName?.[0] || ''}`}
              </Avatar>
            )}
            <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.875rem' }}>{name}</Typography>
          </Box>
        );
      },
    },
    {
      field: 'lineOfBusiness', headerName: 'Line of Business', width: 180,
      renderCell: (params: GridRenderCellParams) => (
        <Chip label={formatLOB(params.row.quote?.lineOfBusiness || '')} size="small" variant="outlined" sx={{ borderRadius: '6px' }} />
      ),
    },
    {
      field: 'riskScore', headerName: 'Risk Score', width: 200,
      renderCell: (params: GridRenderCellParams) => {
        const score = params.row.riskScore || 0;
        const max = params.row.maxScore || 100;
        const pct = (score / max) * 100;
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
            <Box sx={{ flex: 1 }}>
              <LinearProgress
                variant="determinate"
                value={pct}
                sx={{
                  height: 8, borderRadius: 4,
                  bgcolor: 'grey.200',
                  '& .MuiLinearProgress-bar': { bgcolor: getRiskBarColor(score), borderRadius: 4 },
                }}
              />
            </Box>
            <Typography variant="body2" fontWeight={700} sx={{ fontSize: '0.85rem', minWidth: 45 }}>
              {score}/{max}
            </Typography>
          </Box>
        );
      },
    },
    {
      field: 'decision', headerName: 'Decision', width: 130,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.row.decision}
          size="small"
          color={getDecisionColor(params.row.decision) as any}
          sx={{ fontWeight: 600, borderRadius: '6px', minWidth: 90 }}
        />
      ),
    },
    {
      field: 'createdAt', headerName: 'Date', width: 130,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.84rem' }}>
          {params.row.createdAt ? format(new Date(params.row.createdAt), 'MMM d, yyyy') : '-'}
        </Typography>
      ),
    },
  ];

  const quotes = quotesData?.quotes || [];

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
              <Assessment sx={{ fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight={700}>Underwriting</Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>Risk assessment and underwriting decisions</Typography>
            </Box>
          </Box>
          <Button
            variant="contained"
            startIcon={<PlayArrow />}
            onClick={() => setRunDialogOpen(true)}
            sx={{ bgcolor: 'white', color: '#e65100', fontWeight: 600, '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' } }}
          >
            Run Underwriting
          </Button>
        </Box>
      </Paper>

      {/* Stats Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Total Evaluated', value: totalCount, icon: <Assessment />, color: '#e65100', bg: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)' },
          { label: 'Approved', value: approvedCount, icon: <CheckCircle />, color: '#2e7d32', bg: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)' },
          { label: 'Referred', value: referredCount, icon: <Warning />, color: '#ed6c02', bg: 'linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%)' },
          { label: 'Declined', value: declinedCount, icon: <Cancel />, color: '#d32f2f', bg: 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)' },
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
            placeholder="Search by quote #, client, line of business, decision..."
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
          rows={filteredResults}
          columns={columns}
          rowCount={search.trim() ? filteredResults.length : totalCount}
          loading={isLoading}
          pageSizeOptions={[10, 25, 50]}
          paginationMode="server"
          paginationModel={{ page, pageSize }}
          onPaginationModelChange={(model) => { setPage(model.page); setPageSize(model.pageSize); }}
          onRowClick={(params) => setDetailResult(params.row)}
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
      <Dialog open={!!detailResult} onClose={() => setDetailResult(null)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}>
        {detailResult && (() => {
          const client = detailResult.quote?.client;
          const clientName = client ? (client.businessName || `${client.firstName} ${client.lastName}`) : '-';
          const score = detailResult.riskScore || 0;
          const max = detailResult.maxScore || 100;
          const pct = (score / max) * 100;
          const factors = Array.isArray(detailResult.factors) ? detailResult.factors : [];
          return (
            <>
              <Box sx={{ background: 'linear-gradient(135deg, #e65100 0%, #f57c00 50%, #ff9800 100%)', color: 'white', px: 3, py: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.15)', width: 52, height: 52 }}><Assessment sx={{ fontSize: 28 }} /></Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" fontWeight={700}>Underwriting Result</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.85 }}>{detailResult.quote?.quoteNumber || '-'}</Typography>
                  </Box>
                  <Chip label={detailResult.decision} size="small" sx={{ fontWeight: 700, fontSize: '0.8rem', bgcolor: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }} />
                </Box>
              </Box>
              <DialogContent sx={{ px: 3, py: 3 }}>
                <Grid container spacing={2.5}>
                  <Grid item xs={12}>
                    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, textAlign: 'center', background: `linear-gradient(135deg, ${score <= 30 ? '#e8f5e9, #c8e6c9' : score <= 60 ? '#fff3e0, #ffe0b2' : '#ffebee, #ffcdd2'})`, border: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5 }}>Risk Score</Typography>
                      <Typography variant="h3" fontWeight={700} sx={{ color: getRiskBarColor(score), mt: 0.5 }}>{score} / {max}</Typography>
                      <LinearProgress variant="determinate" value={pct} sx={{ mt: 1.5, height: 10, borderRadius: 5, bgcolor: 'grey.200', '& .MuiLinearProgress-bar': { bgcolor: getRiskBarColor(score), borderRadius: 5 } }} />
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.68rem' }}>Client</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 1 }}>
                        {client && <Avatar sx={{ bgcolor: '#1565c0', width: 36, height: 36, fontSize: '0.8rem', fontWeight: 700 }}>{client.businessName ? client.businessName[0] : `${client.firstName?.[0] || ''}${client.lastName?.[0] || ''}`}</Avatar>}
                        <Typography variant="body2" fontWeight={600}>{clientName}</Typography>
                      </Box>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.68rem' }}>Line of Business</Typography>
                      <Typography variant="body1" fontWeight={600} sx={{ mt: 1 }}>{formatLOB(detailResult.quote?.lineOfBusiness || '')}</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.68rem' }}>Decision</Typography>
                      <Box sx={{ mt: 1 }}><Chip label={detailResult.decision} size="small" color={getDecisionColor(detailResult.decision) as any} sx={{ fontWeight: 600, borderRadius: '6px' }} /></Box>
                    </Paper>
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.68rem' }}>Date</Typography>
                      <Typography variant="body1" fontWeight={600} sx={{ mt: 1 }}>{detailResult.createdAt ? format(new Date(detailResult.createdAt), 'MMM d, yyyy') : '-'}</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.68rem' }}>Reviewed By</Typography>
                      <Typography variant="body1" fontWeight={600} sx={{ mt: 1 }}>{detailResult.reviewedBy || 'Pending Review'}</Typography>
                    </Paper>
                  </Grid>
                  {detailResult.notes && (
                    <Grid item xs={12}>
                      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.68rem' }}>Notes</Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}>{detailResult.notes}</Typography>
                      </Paper>
                    </Grid>
                  )}
                  {factors.length > 0 && (
                    <Grid item xs={12}>
                      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.68rem', mb: 1.5, display: 'block' }}>Risk Factors ({factors.length})</Typography>
                        {factors.map((f: any, i: number) => (
                          <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1, borderBottom: i < factors.length - 1 ? '1px solid' : 'none', borderColor: 'grey.100' }}>
                            <Box>
                              <Typography variant="body2" fontWeight={600}>{f.ruleName}</Typography>
                              {f.detail && <Typography variant="caption" color="text.secondary">{f.detail}</Typography>}
                            </Box>
                            <Chip label={`${f.riskPoints > 0 ? '+' : ''}${f.riskPoints} pts`} size="small" sx={{ fontWeight: 600, borderRadius: '6px', bgcolor: f.riskPoints > 10 ? '#ffebee' : f.riskPoints > 0 ? '#fff3e0' : '#e8f5e9', color: f.riskPoints > 10 ? '#d32f2f' : f.riskPoints > 0 ? '#e65100' : '#2e7d32' }} />
                          </Box>
                        ))}
                      </Paper>
                    </Grid>
                  )}
                </Grid>
              </DialogContent>
              <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider', justifyContent: 'space-between' }}>
                <Button color="error" variant="outlined" startIcon={<Delete />} onClick={async () => { if (confirm('Delete this underwriting result?')) { try { await axios.delete(`/api/underwriting/${detailResult.id}`); queryClient.invalidateQueries({ queryKey: ['underwriting-results'] }); setDetailResult(null); } catch {} } }} sx={{ borderRadius: 2 }}>Delete</Button>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button onClick={() => setDetailResult(null)} sx={{ borderRadius: 2 }}>Close</Button>
                  <Button variant="contained" startIcon={<Edit />} onClick={() => { setDetailResult(null); router.push(`/quotes/${detailResult.quoteId}`); }} sx={{ borderRadius: 2, bgcolor: '#e65100', '&:hover': { bgcolor: '#bf360c' } }}>Edit Quote</Button>
                </Box>
              </DialogActions>
            </>
          );
        })()}
      </Dialog>

      {/* Run Underwriting Dialog */}
      <Dialog open={runDialogOpen} onClose={() => setRunDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: '#e65100', width: 48, height: 48 }}>
                <Assessment />
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight={600}>Run Underwriting</Typography>
                <Typography variant="body2" color="text.secondary">Select a quote to evaluate</Typography>
              </Box>
            </Box>
            <IconButton onClick={() => setRunDialogOpen(false)} size="small"><Close /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Autocomplete
            sx={{ mt: 2 }}
            options={quotes}
            getOptionLabel={(option: any) => {
              const client = option.client;
              const clientName = client ? (client.businessName || `${client.firstName} ${client.lastName}`) : '';
              return `${option.quoteNumber} - ${clientName}`;
            }}
            onChange={(_, value: any) => setSelectedQuoteId(value?.id || null)}
            renderInput={(params) => (
              <TextField {...params} label="Select Quote" placeholder="Search by quote number or client..." />
            )}
            renderOption={(props, option: any) => {
              const client = option.client;
              const clientName = client ? (client.businessName || `${client.firstName} ${client.lastName}`) : '';
              return (
                <li {...props} key={option.id}>
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="body2" fontWeight={600}>{option.quoteNumber}</Typography>
                    <Typography variant="caption" color="text.secondary">{clientName} - {formatLOB(option.lineOfBusiness)}</Typography>
                  </Box>
                </li>
              );
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setRunDialogOpen(false)} sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button
            variant="contained"
            startIcon={<PlayArrow />}
            disabled={!selectedQuoteId || evaluateMutation.isPending}
            onClick={() => selectedQuoteId && evaluateMutation.mutate(selectedQuoteId)}
            sx={{ borderRadius: 2, bgcolor: '#e65100', '&:hover': { bgcolor: '#bf360c' } }}
          >
            {evaluateMutation.isPending ? 'Evaluating...' : 'Evaluate'}
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
