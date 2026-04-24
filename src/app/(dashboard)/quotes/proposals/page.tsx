'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  Box, Card, CardContent, Typography, Button, Chip, TextField, InputAdornment,
  Dialog, DialogTitle, DialogContent, DialogActions, Autocomplete, Snackbar, Alert,
  Paper, Avatar, Grid, Tooltip, IconButton,
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import {
  Search, Description, Send, PictureAsPdf, Download, AttachMoney,
  Schedule, CheckCircle, HourglassEmpty, Person, Close, Edit, Delete,
} from '@mui/icons-material';
import { format } from 'date-fns';

export default function ProposalsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<any>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [detailProposal, setDetailProposal] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['proposals', search],
    queryFn: async () => {
      const response = await axios.get(`/api/quotes?status=PROPOSED&search=${search}`);
      return response.data;
    },
  });

  // Fetch quotes that can be converted to proposals (QUOTED status)
  const { data: quotesData } = useQuery({
    queryKey: ['quotes-for-proposal'],
    queryFn: async () => {
      const response = await axios.get('/api/quotes?status=QUOTED');
      return response.data;
    },
  });

  const sendProposalMutation = useMutation({
    mutationFn: async () => {
      if (!selectedQuote) return;
      // Update quote status to PROPOSED
      const response = await axios.patch(`/api/quotes/${selectedQuote.id}`, {
        status: 'PROPOSED',
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      queryClient.invalidateQueries({ queryKey: ['quotes-for-proposal'] });
      setDialogOpen(false);
      setSelectedQuote(null);
      setSnackbar({ open: true, message: 'Proposal sent successfully', severity: 'success' });
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to send proposal', severity: 'error' });
    },
  });

  const proposals = data?.quotes || [];

  const stats = useMemo(() => {
    const totalProposals = proposals.length;
    const totalPremium = proposals.reduce((sum: number, p: any) => sum + Number(p.totalPremium || 0), 0);
    const pendingCount = proposals.filter((p: any) => p.status === 'PROPOSED').length;
    const avgPremium = totalProposals > 0 ? totalPremium / totalProposals : 0;
    return { totalProposals, totalPremium, pendingCount, avgPremium };
  }, [proposals]);

  const columns: GridColDef[] = [
    {
      field: 'quoteNumber', headerName: 'Quote #', width: 155,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" fontWeight={700} sx={{ color: '#2e7d32', fontSize: '0.9rem' }}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'client',
      headerName: 'Client',
      flex: 1.5,
      minWidth: 240,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, overflow: 'hidden' }}>
          <Avatar sx={{
            bgcolor: '#2e7d32', width: 40, height: 40, fontSize: '0.9rem', fontWeight: 700, flexShrink: 0,
          }}>
            {params.row.client?.firstName?.[0] || ''}{params.row.client?.lastName?.[0] || ''}
          </Avatar>
          <Box sx={{ overflow: 'hidden' }}>
            <Typography variant="body1" fontWeight={600} sx={{ fontSize: '0.95rem', lineHeight: 1.4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {params.row.client ? `${params.row.client.firstName} ${params.row.client.lastName}` : '-'}
            </Typography>
            {params.row.client?.email && (
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', lineHeight: 1.3 }}>
                {params.row.client.email}
              </Typography>
            )}
          </Box>
        </Box>
      ),
    },
    {
      field: 'lineOfBusiness', headerName: 'Line of Business', flex: 1, minWidth: 140,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.value?.replace(/_/g, ' ') || '-'}
          size="small"
          variant="outlined"
          sx={{ borderRadius: '6px', fontWeight: 500, fontSize: '0.8rem' }}
        />
      ),
    },
    {
      field: 'totalPremium',
      headerName: 'Premium',
      width: 130,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.9rem' }}>
          ${(Number(params.value) || 0).toLocaleString()}
        </Typography>
      ),
    },
    {
      field: 'createdAt',
      headerName: 'Sent Date',
      width: 130,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.84rem' }}>
          {params.value ? format(new Date(params.value), 'MMM d, yyyy') : '-'}
        </Typography>
      ),
    },
    {
      field: 'expiresAt',
      headerName: 'Expires',
      width: 130,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.84rem' }}>
          {params.value ? format(new Date(params.value), 'MMM d, yyyy') : '-'}
        </Typography>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 140,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.value?.replace(/_/g, ' ') || '-'}
          size="small"
          color="success"
          sx={{ fontWeight: 600, borderRadius: '6px', minWidth: 72 }}
        />
      ),
    },
    {
      field: 'proposal',
      headerName: 'Signature',
      width: 130,
      renderCell: (params: GridRenderCellParams) => {
        const proposal = params.row.proposal;
        if (!proposal) return <Typography variant="body2" color="text.secondary">-</Typography>;
        if (proposal.signedAt) {
          return <Chip label="Signed" size="small" color="success" variant="outlined" sx={{ fontWeight: 600, borderRadius: '6px' }} />;
        }
        if (proposal.sentAt) {
          return <Chip label="Pending" size="small" color="warning" variant="outlined" sx={{ fontWeight: 600, borderRadius: '6px' }} />;
        }
        return <Chip label="Not Sent" size="small" variant="outlined" sx={{ fontWeight: 600, borderRadius: '6px' }} />;
      },
    },
  ];

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
              <Description sx={{ fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight={700}>Proposals</Typography>
              <Typography variant="body2" sx={{ opacity: 0.85 }}>Track sent proposals and their status</Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Export as PDF">
              <Button variant="outlined" size="small" startIcon={<PictureAsPdf />}
                onClick={() => window.open('/api/export/pdf?type=proposals', '_blank')}
                sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}>
                PDF
              </Button>
            </Tooltip>
            <Tooltip title="Export as CSV">
              <Button variant="outlined" size="small" startIcon={<Download />}
                onClick={() => {
                  const csv = [
                    ['Quote #', 'Client', 'Line of Business', 'Premium', 'Sent Date', 'Expires', 'Status'].join(','),
                    ...proposals.map((p: any) => [
                      p.quoteNumber,
                      `"${p.client ? `${p.client.firstName} ${p.client.lastName}` : '-'}"`,
                      p.lineOfBusiness?.replace(/_/g, ' ') || '',
                      Number(p.totalPremium || 0),
                      p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '',
                      p.expiresAt ? new Date(p.expiresAt).toLocaleDateString() : '',
                      p.status || '',
                    ].join(','))
                  ].join('\n');
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a'); a.href = url;
                  a.download = `proposals-${new Date().toISOString().split('T')[0]}.csv`;
                  a.click(); URL.revokeObjectURL(url);
                }}
                sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}>
                CSV
              </Button>
            </Tooltip>
            <Button variant="contained" startIcon={<Send />} onClick={() => setDialogOpen(true)}
              sx={{ bgcolor: 'white', color: '#2e7d32', fontWeight: 600, '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' } }}>
              Send New Proposal
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Stats Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Total Proposals', value: stats.totalProposals, icon: <Description />, color: '#2e7d32', bg: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)' },
          { label: 'Total Premium', value: `$${stats.totalPremium.toLocaleString()}`, icon: <AttachMoney />, color: '#1b5e20', bg: 'linear-gradient(135deg, #e8f5e9 0%, #a5d6a7 100%)' },
          { label: 'Pending', value: stats.pendingCount, icon: <HourglassEmpty />, color: '#e65100', bg: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)' },
          { label: 'Avg Premium', value: `$${Math.round(stats.avgPremium).toLocaleString()}`, icon: <CheckCircle />, color: '#1976d2', bg: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)' },
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

      {/* Search / Filter Bar */}
      <Card sx={{ mb: 2, borderRadius: 2.5, overflow: 'visible' }}>
        <CardContent sx={{ py: 2, px: 2.5, '&:last-child': { pb: 2 } }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search proposals by quote #, client name..."
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
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Data Grid */}
      <Card sx={{ borderRadius: 2.5, overflow: 'hidden' }}>
        <DataGrid
          rows={proposals}
          columns={columns}
          loading={isLoading}
          pageSizeOptions={[10, 25, 50]}
          disableRowSelectionOnClick
          onRowClick={(params) => setDetailProposal(params.row)}
          rowHeight={72}
          sx={{
            border: 'none',
            '& .MuiDataGrid-columnHeaders': { bgcolor: 'grey.50', borderBottom: '2px solid', borderColor: 'divider' },
            '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: 0.5, color: 'text.secondary' },
            '& .MuiDataGrid-row': { cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } },
            '& .MuiDataGrid-cell': { borderColor: 'grey.100', },
            '& .MuiDataGrid-footerContainer': { borderTop: '2px solid', borderColor: 'divider' },
          }}
          autoHeight
        />
      </Card>

      {/* Proposal Detail Dialog */}
      <Dialog open={!!detailProposal} onClose={() => setDetailProposal(null)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}>
        <Box sx={{
          p: 3,
          background: 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 50%, #43a047 100%)',
          color: 'white',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 52, height: 52 }}>
              <Description sx={{ fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={700} sx={{ color: 'white' }}>
                {detailProposal?.quoteNumber || 'Proposal Details'}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                <Chip label={detailProposal?.lineOfBusiness?.replace(/_/g, ' ') || '-'} size="small"
                  sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600, fontSize: '0.75rem' }} />
                <Chip label={detailProposal?.status?.replace(/_/g, ' ') || '-'} size="small"
                  sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600, fontSize: '0.75rem' }} />
              </Box>
            </Box>
          </Box>
          <IconButton onClick={() => setDetailProposal(null)} sx={{ color: 'white' }}>
            <Close />
          </IconButton>
        </Box>
        <DialogContent dividers>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, mb: 2 }}>
            <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 1 }}>Proposal Information</Typography>
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Quote Number</Typography>
                <Typography variant="body2" fontWeight={700} sx={{ color: '#2e7d32' }}>{detailProposal?.quoteNumber || '-'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Client Name</Typography>
                <Typography variant="body2" fontWeight={600}>
                  {detailProposal?.client ? `${detailProposal.client.firstName} ${detailProposal.client.lastName}` : '-'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Line of Business</Typography>
                <Typography variant="body2" fontWeight={600}>{detailProposal?.lineOfBusiness?.replace(/_/g, ' ') || '-'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Premium</Typography>
                <Typography variant="body2" fontWeight={700} sx={{ color: '#2e7d32' }}>${Number(detailProposal?.premium || 0).toLocaleString()}</Typography>
              </Grid>
            </Grid>
          </Paper>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, mb: 2 }}>
            <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 1 }}>Financial Details</Typography>
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Total Premium</Typography>
                <Typography variant="body2" fontWeight={700} sx={{ color: '#1b5e20' }}>${Number(detailProposal?.totalPremium || 0).toLocaleString()}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Fees</Typography>
                <Typography variant="body2">${Number(detailProposal?.fees || 0).toLocaleString()}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Taxes</Typography>
                <Typography variant="body2">${Number(detailProposal?.taxes || 0).toLocaleString()}</Typography>
              </Grid>
            </Grid>
          </Paper>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
            <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 1 }}>Status & Dates</Typography>
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Sent Date</Typography>
                <Typography variant="body2">{detailProposal?.createdAt ? format(new Date(detailProposal.createdAt), 'MMM d, yyyy') : '-'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Expires Date</Typography>
                <Typography variant="body2">{detailProposal?.expiresAt ? format(new Date(detailProposal.expiresAt), 'MMM d, yyyy') : '-'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Status</Typography>
                <Chip
                  label={detailProposal?.status?.replace(/_/g, ' ') || '-'}
                  size="small"
                  color="success"
                  sx={{ fontWeight: 600, borderRadius: '6px', mt: 0.3 }}
                />
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Signature Status</Typography>
                {detailProposal?.proposal?.signedAt ? (
                  <Chip label="Signed" size="small" color="success" variant="outlined" sx={{ fontWeight: 600, borderRadius: '6px', mt: 0.3 }} />
                ) : detailProposal?.proposal?.sentAt ? (
                  <Chip label="Pending" size="small" color="warning" variant="outlined" sx={{ fontWeight: 600, borderRadius: '6px', mt: 0.3 }} />
                ) : (
                  <Chip label="Not Sent" size="small" variant="outlined" sx={{ fontWeight: 600, borderRadius: '6px', mt: 0.3 }} />
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
              if (confirm('Delete this proposal?')) {
                await axios.delete(`/api/quotes/${detailProposal?.id}`);
                queryClient.invalidateQueries({ queryKey: ['proposals'] });
                setDetailProposal(null);
              }
            }}
            sx={{ borderRadius: 2 }}
          >
            Delete
          </Button>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button onClick={() => setDetailProposal(null)} sx={{ borderRadius: 2 }}>Close</Button>
            <Button
              variant="contained"
              startIcon={<Edit />}
              onClick={() => router.push(`/quotes/${detailProposal?.id}`)}
              sx={{ borderRadius: 2, bgcolor: '#2e7d32', '&:hover': { bgcolor: '#1b5e20' } }}
            >
              Edit Quote
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* Send Proposal Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: '#2e7d32', width: 44, height: 44 }}>
              <Send />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={600}>Send New Proposal</Typography>
              <Typography variant="body2" color="text.secondary">Select a quote to send as a proposal</Typography>
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
              renderInput={(params) => <TextField {...params} label="Select Quote to Send as Proposal" required sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />}
              renderOption={(props, option: any) => (
                <li {...props} key={option.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ bgcolor: '#2e7d32', width: 32, height: 32, fontSize: '0.75rem' }}>
                      {option.client?.firstName?.[0]}{option.client?.lastName?.[0]}
                    </Avatar>
                    <Box>
                      <Typography fontWeight={600}>{option.quoteNumber}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {option.client?.firstName} {option.client?.lastName} - ${Number(option.totalPremium || 0).toLocaleString()}
                      </Typography>
                    </Box>
                  </Box>
                </li>
              )}
            />
            {selectedQuote && (
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#f1f8e9' }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.7rem' }}>Quote Details</Typography>
                <Grid container spacing={1.5}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Client</Typography>
                    <Typography variant="body2" fontWeight={600}>{selectedQuote.client?.firstName} {selectedQuote.client?.lastName}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Line of Business</Typography>
                    <Typography variant="body2">{selectedQuote.lineOfBusiness?.replace(/_/g, ' ')}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Premium</Typography>
                    <Typography variant="body2" fontWeight={700} color="#2e7d32">${Number(selectedQuote.totalPremium || 0).toLocaleString()}</Typography>
                  </Grid>
                </Grid>
              </Paper>
            )}
            <Typography variant="body2" color="text.secondary">
              Sending this proposal will update the quote status to &quot;PROPOSED&quot; and notify the client.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => sendProposalMutation.mutate()}
            disabled={!selectedQuote || sendProposalMutation.isPending}
            startIcon={<Send />}
            sx={{ borderRadius: 2, bgcolor: '#2e7d32', '&:hover': { bgcolor: '#1b5e20' } }}
          >
            {sendProposalMutation.isPending ? 'Sending...' : 'Send Proposal'}
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
