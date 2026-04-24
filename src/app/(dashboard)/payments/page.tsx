'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  Box, Card, CardContent, Typography, Button, Chip, TextField, InputAdornment,
  Dialog, DialogTitle, DialogContent, DialogActions, Autocomplete, Snackbar, Alert,
  Paper, Avatar, Grid, FormControl, InputLabel, Select, MenuItem, IconButton,
  Tooltip, CircularProgress,
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import {
  Search, Payment, AttachMoney, Link as LinkIcon,
  CheckCircle, HourglassEmpty, ErrorOutline, Undo,
  ContentCopy, Visibility, Edit, Delete,
} from '@mui/icons-material';
import { format } from 'date-fns';

export default function PaymentsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailPayment, setDetailPayment] = useState<any>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  // Dialog form state
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [selectedPolicy, setSelectedPolicy] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['payments', page, pageSize, search, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page + 1), limit: String(pageSize),
        ...(search && { search }), ...(statusFilter && { status: statusFilter }),
      });
      const response = await axios.get(`/api/payments?${params}`);
      return response.data;
    },
  });

  // Fetch clients for autocomplete
  const { data: clientsData } = useQuery({
    queryKey: ['clients-for-payment'],
    queryFn: async () => {
      const response = await axios.get('/api/clients?limit=100');
      return response.data;
    },
  });

  // Fetch policies for selected client
  const { data: policiesData } = useQuery({
    queryKey: ['policies-for-payment', selectedClient?.id],
    queryFn: async () => {
      if (!selectedClient?.id) return { policies: [] };
      const response = await axios.get(`/api/policies?clientId=${selectedClient.id}&limit=50`);
      return response.data;
    },
    enabled: !!selectedClient?.id,
  });

  const createPaymentLinkMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.post('/api/payments/link', {
        clientId: selectedClient?.id,
        policyId: selectedPolicy?.id || null,
        amount: Number(amount),
        description,
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      setDialogOpen(false);
      resetForm();

      if (data.paymentLinkUrl) {
        navigator.clipboard.writeText(data.paymentLinkUrl).then(() => {
          setSnackbar({ open: true, message: 'Payment link created and copied to clipboard', severity: 'success' });
        }).catch(() => {
          setSnackbar({ open: true, message: 'Payment link created successfully', severity: 'success' });
        });
      } else {
        setSnackbar({ open: true, message: 'Payment link created successfully', severity: 'success' });
      }
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to create payment link', severity: 'error' });
    },
  });

  const resetForm = () => {
    setSelectedClient(null);
    setSelectedPolicy(null);
    setAmount('');
    setDescription('');
  };

  const payments = data?.payments || [];
  const totalCount = data?.pagination?.total || 0;

  const stats = useMemo(() => {
    const totalCollected = payments
      .filter((p: any) => p.status === 'COMPLETED')
      .reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
    const pendingAmount = payments
      .filter((p: any) => p.status === 'PENDING' || p.status === 'PROCESSING')
      .reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
    const failedAmount = payments
      .filter((p: any) => p.status === 'FAILED')
      .reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
    const refundedAmount = payments
      .filter((p: any) => p.status === 'REFUNDED')
      .reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
    return { totalCollected, pendingAmount, failedAmount, refundedAmount };
  }, [payments]);

  const getStatusColor = (status: string): 'success' | 'warning' | 'error' | 'default' | 'info' => {
    switch (status) {
      case 'COMPLETED': return 'success';
      case 'PENDING': case 'PROCESSING': return 'warning';
      case 'FAILED': return 'error';
      case 'REFUNDED': return 'info';
      case 'CANCELLED': return 'default';
      default: return 'default';
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'id', headerName: 'ID', width: 130,
      renderCell: (params: GridRenderCellParams) => (
        <Tooltip title={params.value}>
          <Typography variant="body2" fontWeight={700} sx={{ color: '#1565c0', fontSize: '0.9rem' }}>
            {params.value?.substring(0, 8)}...
          </Typography>
        </Tooltip>
      ),
    },
    {
      field: 'client', headerName: 'Client', flex: 1.2, minWidth: 200,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, overflow: 'hidden' }}>
          <Avatar sx={{
            bgcolor: '#1565c0', width: 40, height: 40, fontSize: '0.9rem', fontWeight: 700, flexShrink: 0,
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
      field: 'policy', headerName: 'Policy #', width: 150,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
          {params.row.policy?.policyNumber || '-'}
        </Typography>
      ),
    },
    {
      field: 'amount', headerName: 'Amount', width: 130,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.9rem' }}>
          ${Number(params.value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Typography>
      ),
    },
    {
      field: 'status', headerName: 'Status', width: 140,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.value?.replace(/_/g, ' ') || '-'}
          size="small"
          color={getStatusColor(params.value as string)}
          sx={{ fontWeight: 600, borderRadius: '6px', minWidth: 72 }}
        />
      ),
    },
    {
      field: 'createdAt', headerName: 'Date', width: 130,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.84rem' }}>
          {params.value ? format(new Date(params.value), 'MMM d, yyyy') : '-'}
        </Typography>
      ),
    },
    {
      field: 'actions', headerName: 'Actions', width: 100, sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {params.row.paymentLinkUrl && (
            <Tooltip title="Copy Payment Link">
              <IconButton size="small" onClick={(e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(params.row.paymentLinkUrl);
                setSnackbar({ open: true, message: 'Payment link copied to clipboard', severity: 'success' });
              }}>
                <ContentCopy fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="View Details">
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); setDetailPayment(params.row); }}>
              <Visibility fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box className="animate-fade-in">
      {/* Gradient Header */}
      <Paper elevation={0} sx={{
        p: 3, mb: 3, borderRadius: 3,
        background: 'linear-gradient(135deg, #0d47a1 0%, #1565c0 50%, #42a5f5 100%)',
        color: 'white',
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.15)', width: 52, height: 52 }}>
              <Payment sx={{ fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight={700}>Payments</Typography>
              <Typography variant="body2" sx={{ opacity: 0.85 }}>Manage payments, invoices, and payment links</Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="contained" startIcon={<LinkIcon />} onClick={() => setDialogOpen(true)}
              sx={{ bgcolor: 'white', color: '#0d47a1', fontWeight: 600, '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' } }}>
              Create Payment Link
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Stats Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Total Collected', value: `$${stats.totalCollected.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, icon: <CheckCircle />, color: '#2e7d32', bg: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)' },
          { label: 'Pending', value: `$${stats.pendingAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, icon: <HourglassEmpty />, color: '#e65100', bg: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)' },
          { label: 'Failed', value: `$${stats.failedAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, icon: <ErrorOutline />, color: '#c62828', bg: 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)' },
          { label: 'Refunded', value: `$${stats.refundedAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, icon: <Undo />, color: '#1976d2', bg: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)' },
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
                  <Typography variant="h5" fontWeight={700} sx={{ color: stat.color, mt: 0.5 }}>
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
                placeholder="Search payments by ID, client name, policy #..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
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
            <Grid item xs={6} sm={3} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select value={statusFilter} label="Status" onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }} sx={{ borderRadius: 2 }}>
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="PENDING">Pending</MenuItem>
                  <MenuItem value="PROCESSING">Processing</MenuItem>
                  <MenuItem value="COMPLETED">Completed</MenuItem>
                  <MenuItem value="FAILED">Failed</MenuItem>
                  <MenuItem value="REFUNDED">Refunded</MenuItem>
                  <MenuItem value="CANCELLED">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Data Grid */}
      <Card sx={{ borderRadius: 2.5, overflow: 'hidden' }}>
        <DataGrid
          rows={payments}
          columns={columns}
          rowCount={totalCount}
          loading={isLoading}
          pageSizeOptions={[10, 25, 50]}
          paginationMode="server"
          paginationModel={{ page, pageSize }}
          onPaginationModelChange={(model) => { setPage(model.page); setPageSize(model.pageSize); }}
          onRowClick={(params) => setDetailPayment(params.row)}
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

      {/* Payment Detail Dialog */}
      <Dialog
        open={!!detailPayment}
        onClose={() => setDetailPayment(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
      >
        {detailPayment && (
          <>
            {/* Header with gradient */}
            <Box sx={{
              background: 'linear-gradient(135deg, #0d47a1 0%, #1565c0 50%, #42a5f5 100%)',
              color: 'white', px: 3, py: 2.5,
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.15)', width: 52, height: 52 }}>
                  <Payment sx={{ fontSize: 28 }} />
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" fontWeight={700}>Payment Details</Typography>
                  <Typography variant="body2" sx={{ opacity: 0.85 }}>
                    ID: {detailPayment.id?.substring(0, 12)}...
                  </Typography>
                </Box>
                <Chip
                  label={detailPayment.status?.replace(/_/g, ' ') || '-'}
                  size="small"
                  sx={{
                    fontWeight: 700, fontSize: '0.8rem',
                    bgcolor: 'rgba(255,255,255,0.2)', color: 'white',
                    border: '1px solid rgba(255,255,255,0.3)',
                  }}
                />
              </Box>
            </Box>

            <DialogContent sx={{ px: 3, py: 3 }}>
              <Grid container spacing={2.5}>
                {/* Amount */}
                <Grid item xs={12}>
                  <Paper elevation={0} sx={{
                    p: 2.5, borderRadius: 2.5, textAlign: 'center',
                    background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
                    border: '1px solid #90caf9',
                  }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Amount
                    </Typography>
                    <Typography variant="h3" fontWeight={700} sx={{ color: '#0d47a1', mt: 0.5 }}>
                      ${Number(detailPayment.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Typography>
                  </Paper>
                </Grid>

                {/* Client */}
                <Grid item xs={12} sm={6}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.68rem' }}>
                      Client
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 1 }}>
                      <Avatar sx={{ bgcolor: '#1565c0', width: 36, height: 36, fontSize: '0.8rem', fontWeight: 700 }}>
                        {detailPayment.client?.firstName?.[0]}{detailPayment.client?.lastName?.[0]}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {detailPayment.client ? `${detailPayment.client.firstName} ${detailPayment.client.lastName}` : '-'}
                        </Typography>
                        {detailPayment.client?.email && (
                          <Typography variant="caption" color="text.secondary">{detailPayment.client.email}</Typography>
                        )}
                      </Box>
                    </Box>
                  </Paper>
                </Grid>

                {/* Policy */}
                <Grid item xs={12} sm={6}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.68rem' }}>
                      Policy
                    </Typography>
                    <Typography variant="body1" fontWeight={600} sx={{ mt: 1 }}>
                      {detailPayment.policy?.policyNumber || 'N/A'}
                    </Typography>
                    {detailPayment.policy?.lineOfBusiness && (
                      <Typography variant="caption" color="text.secondary">
                        {detailPayment.policy.lineOfBusiness.replace(/_/g, ' ')}
                      </Typography>
                    )}
                  </Paper>
                </Grid>

                {/* Status */}
                <Grid item xs={6} sm={4}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.68rem' }}>
                      Status
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      <Chip
                        label={detailPayment.status?.replace(/_/g, ' ') || '-'}
                        size="small"
                        color={getStatusColor(detailPayment.status)}
                        sx={{ fontWeight: 600, borderRadius: '6px' }}
                      />
                    </Box>
                  </Paper>
                </Grid>

                {/* Date */}
                <Grid item xs={6} sm={4}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.68rem' }}>
                      Date
                    </Typography>
                    <Typography variant="body1" fontWeight={600} sx={{ mt: 1 }}>
                      {detailPayment.createdAt ? format(new Date(detailPayment.createdAt), 'MMM d, yyyy') : '-'}
                    </Typography>
                    {detailPayment.createdAt && (
                      <Typography variant="caption" color="text.secondary">
                        {format(new Date(detailPayment.createdAt), 'h:mm a')}
                      </Typography>
                    )}
                  </Paper>
                </Grid>

                {/* Method */}
                <Grid item xs={12} sm={4}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.68rem' }}>
                      Method
                    </Typography>
                    <Typography variant="body1" fontWeight={600} sx={{ mt: 1 }}>
                      {detailPayment.method?.replace(/_/g, ' ') || 'Payment Link'}
                    </Typography>
                  </Paper>
                </Grid>

                {/* Description */}
                {detailPayment.description && (
                  <Grid item xs={12}>
                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.68rem' }}>
                        Description
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        {detailPayment.description}
                      </Typography>
                    </Paper>
                  </Grid>
                )}

                {/* Payment Link */}
                {detailPayment.paymentLinkUrl && (
                  <Grid item xs={12}>
                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#f5f5f5' }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.68rem' }}>
                        Payment Link
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                        <Typography variant="body2" sx={{ flex: 1, wordBreak: 'break-all', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                          {detailPayment.paymentLinkUrl}
                        </Typography>
                        <Tooltip title="Copy Link">
                          <IconButton size="small" onClick={() => {
                            navigator.clipboard.writeText(detailPayment.paymentLinkUrl);
                            setSnackbar({ open: true, message: 'Link copied!', severity: 'success' });
                          }}>
                            <ContentCopy fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                      {detailPayment.paymentLinkExpiresAt && (
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                          Expires: {format(new Date(detailPayment.paymentLinkExpiresAt), 'MMM d, yyyy h:mm a')}
                        </Typography>
                      )}
                    </Paper>
                  </Grid>
                )}

                {/* Stripe ID */}
                {detailPayment.stripePaymentId && (
                  <Grid item xs={12}>
                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.68rem' }}>
                        Stripe Payment ID
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 1, fontFamily: 'monospace', fontSize: '0.8rem' }}>
                        {detailPayment.stripePaymentId}
                      </Typography>
                    </Paper>
                  </Grid>
                )}
              </Grid>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider', justifyContent: 'space-between' }}>
              <Button color="error" variant="outlined" startIcon={<Delete />} onClick={async () => { if (confirm('Delete this payment?')) { try { await axios.delete(`/api/payments/${detailPayment.id}`); queryClient.invalidateQueries({ queryKey: ['payments'] }); setDetailPayment(null); } catch {} } }} sx={{ borderRadius: 2 }}>Delete</Button>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {detailPayment.paymentLinkUrl && (
                  <Button
                    startIcon={<ContentCopy />}
                    onClick={() => {
                      navigator.clipboard.writeText(detailPayment.paymentLinkUrl);
                      setSnackbar({ open: true, message: 'Payment link copied!', severity: 'success' });
                    }}
                    sx={{ borderRadius: 2 }}
                  >
                    Copy Link
                  </Button>
                )}
                <Button onClick={() => setDetailPayment(null)} sx={{ borderRadius: 2 }}>Close</Button>
                <Button variant="contained" startIcon={<Edit />} onClick={() => setDetailPayment(null)} sx={{ borderRadius: 2, bgcolor: '#0d47a1', '&:hover': { bgcolor: '#0a3a8a' } }}>
                  Edit
                </Button>
              </Box>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Create Payment Link Dialog */}
      <Dialog open={dialogOpen} onClose={() => { setDialogOpen(false); resetForm(); }} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: '#0d47a1', width: 44, height: 44 }}>
              <LinkIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={600}>Create Payment Link</Typography>
              <Typography variant="body2" color="text.secondary">Generate a shareable payment link for a client</Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
            <Autocomplete
              options={clientsData?.clients || []}
              getOptionLabel={(option: any) => `${option.firstName} ${option.lastName}${option.email ? ` (${option.email})` : ''}`}
              value={selectedClient}
              onChange={(_, value) => { setSelectedClient(value); setSelectedPolicy(null); }}
              renderInput={(params) => <TextField {...params} label="Select Client" required sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />}
              renderOption={(props, option: any) => (
                <li {...props} key={option.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ bgcolor: '#1565c0', width: 32, height: 32, fontSize: '0.75rem' }}>
                      {option.firstName?.[0]}{option.lastName?.[0]}
                    </Avatar>
                    <Box>
                      <Typography fontWeight={600}>{option.firstName} {option.lastName}</Typography>
                      {option.email && (
                        <Typography variant="body2" color="text.secondary">{option.email}</Typography>
                      )}
                    </Box>
                  </Box>
                </li>
              )}
            />

            {selectedClient && (
              <Autocomplete
                options={policiesData?.policies || []}
                getOptionLabel={(option: any) => `${option.policyNumber} - ${option.lineOfBusiness?.replace(/_/g, ' ')}`}
                value={selectedPolicy}
                onChange={(_, value) => setSelectedPolicy(value)}
                renderInput={(params) => <TextField {...params} label="Select Policy (Optional)" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />}
              />
            )}

            <TextField
              label="Amount ($)"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              InputProps={{
                startAdornment: <InputAdornment position="start"><AttachMoney /></InputAdornment>,
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />

            <TextField
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              multiline
              rows={2}
              placeholder="e.g., Monthly premium payment for auto policy"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />

            <Typography variant="body2" color="text.secondary">
              This will generate a shareable payment link valid for 7 days.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => { setDialogOpen(false); resetForm(); }} sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => createPaymentLinkMutation.mutate()}
            disabled={!selectedClient || !amount || createPaymentLinkMutation.isPending}
            startIcon={createPaymentLinkMutation.isPending ? <CircularProgress size={18} /> : <LinkIcon />}
            sx={{ borderRadius: 2, bgcolor: '#0d47a1', '&:hover': { bgcolor: '#0a3a8a' } }}
          >
            {createPaymentLinkMutation.isPending ? 'Creating...' : 'Create Link'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar open={snackbar.open} autoHideDuration={5000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })} sx={{ borderRadius: 2 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
