'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  Box, AppBar, Toolbar, Typography, Button, Card, Chip, Skeleton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  FormControl, InputLabel, Select, MenuItem, Snackbar, Alert, Grid,
  InputAdornment,
} from '@mui/material';
import { ReportProblem, Add, Search } from '@mui/icons-material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { format } from 'date-fns';

interface Claim {
  id: string;
  claimNumber: string;
  type: string;
  dateOfLoss: string;
  estimatedLoss: number;
  status: string;
  description: string;
  lossLocation: string;
  policyId: string;
}

interface Policy {
  id: string;
  policyNumber: string;
  lineOfBusiness: string;
  status: string;
}

export default function CustomerClaimsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [intakeEventId, setIntakeEventId] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  // New claim form state
  const [newClaim, setNewClaim] = useState({
    policyId: '',
    type: '',
    dateOfLoss: '',
    description: '',
    lossLocation: '',
    jurisdiction: '',
  });

  const { data: claims = [], isLoading } = useQuery<Claim[]>({
    queryKey: ['customerClaims'],
    queryFn: async () => {
      const response = await axios.get('/api/customer/claims');
      return response.data.claims;
    },
  });

  const { data: policies = [] } = useQuery<Policy[]>({
    queryKey: ['customerPolicies'],
    queryFn: async () => {
      const response = await axios.get('/api/customer/policies');
      return response.data.policies;
    },
  });

  const createClaimMutation = useMutation({
    mutationFn: async (data: typeof newClaim) => {
      const response = await axios.post('/api/customer/claims', data, { headers: { 'Idempotency-Key': intakeEventId } });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerClaims'] });
      setSnackbar({ open: true, message: 'Claim filed successfully', severity: 'success' });
      setDialogOpen(false);
      setNewClaim({ policyId: '', type: '', dateOfLoss: '', description: '', lossLocation: '', jurisdiction: '' });
      setIntakeEventId('');
    },
    onError: (err: any) => {
      const message = err.response?.data?.error || 'Failed to file claim. Please try again.';
      setSnackbar({ open: true, message, severity: 'error' });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'REPORTED': return 'info';
      case 'UNDER_INVESTIGATION': case 'PENDING_DOCUMENTS': case 'IN_REVIEW': return 'warning';
      case 'APPROVED': case 'SETTLED': case 'CLOSED': return 'success';
      case 'DENIED': return 'error';
      default: return 'default';
    }
  };

  const formatStatus = (status: string) => {
    if (!status) return '-';
    return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const claimTypes = ['AUTO', 'PROPERTY', 'LIABILITY', 'WORKERS_COMP', 'HEALTH', 'LIFE', 'OTHER'];

  const filteredClaims = useMemo(() => {
    if (!search.trim()) return claims;
    const q = search.toLowerCase();
    return claims.filter((claim) =>
      [
        claim.claimNumber,
        claim.type?.replace(/_/g, ' '),
        claim.dateOfLoss ? format(new Date(claim.dateOfLoss), 'MMM d, yyyy') : '',
        claim.estimatedLoss ? `$${Number(claim.estimatedLoss).toLocaleString()}` : '',
        formatStatus(claim.status),
      ].some((field) => field?.toLowerCase().includes(q))
    );
  }, [claims, search]);

  const columns: GridColDef[] = [
    {
      field: 'claimNumber',
      headerName: 'Claim #',
      width: 160,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight={700} sx={{ color: '#c62828', fontSize: '0.9rem' }}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'type',
      headerName: 'Type',
      width: 140,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
          {params.value?.replace(/_/g, ' ') || '-'}
        </Typography>
      ),
    },
    {
      field: 'dateOfLoss',
      headerName: 'Date of Loss',
      width: 140,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.84rem' }}>
          {params.value ? format(new Date(params.value), 'MMM d, yyyy') : '-'}
        </Typography>
      ),
    },
    {
      field: 'estimatedLoss',
      headerName: 'Estimated Loss',
      width: 140,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.9rem' }}>
          {params.value ? `$${Number(params.value).toLocaleString()}` : '-'}
        </Typography>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 170,
      renderCell: (params) => (
        <Chip
          label={formatStatus(params.value)}
          size="small"
          color={getStatusColor(params.value) as any}
          sx={{ fontWeight: 600, borderRadius: '6px', minWidth: 72 }}
        />
      ),
    },
  ];

  const handleSubmitClaim = () => {
    if (!intakeEventId || !newClaim.policyId || !newClaim.type || !newClaim.dateOfLoss || !newClaim.description || !newClaim.jurisdiction) {
      setSnackbar({ open: true, message: 'Please fill in all required fields', severity: 'error' });
      return;
    }
    createClaimMutation.mutate(newClaim);
  };

  return (
    <Box>
      {/* AppBar */}
      <AppBar position="static" sx={{ mb: 3 }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>InsureFlow Customer Portal</Typography>
          <Button color="inherit" onClick={() => router.push('/portal')}>Dashboard</Button>
          <Button color="inherit" onClick={async () => { await axios.post('/api/customer/auth/logout'); router.push('/portal/login'); }}>Logout</Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 3 }}>
        {/* Page Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <ReportProblem sx={{ fontSize: 32, color: 'error.main' }} />
            <Box>
              <Typography variant="h5" fontWeight={700}>My Claims</Typography>
              <Typography variant="body2" color="text.secondary">
                View your claims and file new ones
              </Typography>
            </Box>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => {
              setIntakeEventId(globalThis.crypto.randomUUID());
              setDialogOpen(true);
            }}
            sx={{
              borderRadius: 2,
              fontWeight: 600,
              textTransform: 'none',
            }}
          >
            File New Claim
          </Button>
        </Box>

        {/* Search Bar */}
        <TextField
          fullWidth
          placeholder="Search claims..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          sx={{
            mb: 2,
            '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'white' },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            ),
          }}
        />

        {/* Claims DataGrid */}
        {isLoading ? (
          <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2.5 }} />
        ) : (
          <Card sx={{ borderRadius: 2.5, overflow: 'hidden' }}>
            <DataGrid
              rows={filteredClaims}
              columns={columns}
              pageSizeOptions={[10, 25, 50]}
              initialState={{
                pagination: { paginationModel: { pageSize: 10 } },
              }}
              disableRowSelectionOnClick
              rowHeight={64}
              sx={{
                border: 'none',
                '& .MuiDataGrid-columnHeaders': {
                  bgcolor: 'grey.50',
                  borderBottom: '2px solid',
                  borderColor: 'divider',
                },
                '& .MuiDataGrid-columnHeaderTitle': {
                  fontWeight: 600, fontSize: '0.8rem',
                  textTransform: 'uppercase', letterSpacing: 0.5,
                  color: 'text.secondary',
                },
                '& .MuiDataGrid-row': {
                  '&:hover': { bgcolor: 'action.hover' },
                },
                '& .MuiDataGrid-cell': { borderColor: 'grey.100' },
                '& .MuiDataGrid-footerContainer': {
                  borderTop: '2px solid',
                  borderColor: 'divider',
                },
              }}
              autoHeight
            />
          </Card>
        )}
      </Box>

      {/* File New Claim Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 600 }}>File New Claim</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Policy</InputLabel>
                <Select
                  value={newClaim.policyId}
                  label="Policy"
                  onChange={(e) => setNewClaim({ ...newClaim, policyId: e.target.value })}
                  sx={{ borderRadius: 2 }}
                >
                  {policies.map((policy) => (
                    <MenuItem key={policy.id} value={policy.id}>
                      {policy.policyNumber} - {policy.lineOfBusiness?.replace(/_/g, ' ')}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Claim Type</InputLabel>
                <Select
                  value={newClaim.type}
                  label="Claim Type"
                  onChange={(e) => setNewClaim({ ...newClaim, type: e.target.value })}
                  sx={{ borderRadius: 2 }}
                >
                  {claimTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type.replace(/_/g, ' ')}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Date of Loss"
                type="date"
                value={newClaim.dateOfLoss}
                onChange={(e) => setNewClaim({ ...newClaim, dateOfLoss: e.target.value })}
                InputLabelProps={{ shrink: true }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Loss State / Jurisdiction"
                value={newClaim.jurisdiction}
                onChange={(e) => setNewClaim({ ...newClaim, jurisdiction: e.target.value.toUpperCase().slice(0, 2) })}
                inputProps={{ minLength: 2, maxLength: 2, pattern: '[A-Za-z]{2}' }}
                helperText="Two-letter state code"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Description"
                multiline
                rows={3}
                value={newClaim.description}
                onChange={(e) => setNewClaim({ ...newClaim, description: e.target.value })}
                placeholder="Describe what happened..."
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Loss Location"
                value={newClaim.lossLocation}
                onChange={(e) => setNewClaim({ ...newClaim, lossLocation: e.target.value })}
                placeholder="Where did the loss occur?"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={() => setDialogOpen(false)}
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmitClaim}
            disabled={createClaimMutation.isPending}
            sx={{ borderRadius: 2, fontWeight: 600 }}
          >
            {createClaimMutation.isPending ? 'Submitting...' : 'Submit Claim'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          sx={{ borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
