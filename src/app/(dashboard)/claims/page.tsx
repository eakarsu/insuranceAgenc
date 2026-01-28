'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  Box, Button, Card, CardContent, Typography, TextField, InputAdornment,
  IconButton, Menu, MenuItem, Chip, Grid, FormControl, InputLabel, Select,
  Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, Alert,
} from '@mui/material';
import { Add, Search, MoreVert, Edit, Visibility, Assignment } from '@mui/icons-material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { format } from 'date-fns';

export default function ClaimsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedClaim, setSelectedClaim] = useState<any>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const { data, isLoading } = useQuery({
    queryKey: ['claims', page, pageSize, search, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page + 1), limit: String(pageSize),
        ...(search && { search }), ...(statusFilter && { status: statusFilter }),
      });
      const response = await axios.get(`/api/claims?${params}`);
      return response.data;
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

  const columns: GridColDef[] = [
    { field: 'claimNumber', headerName: 'Claim #', width: 140,
      renderCell: (params) => <Typography variant="body2" fontWeight={600} color="error">{params.value}</Typography> },
    { field: 'client', headerName: 'Client', flex: 1, minWidth: 180,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2">{`${params.row.client?.firstName} ${params.row.client?.lastName}`}</Typography>
      ) },
    { field: 'policy', headerName: 'Policy', width: 140,
      renderCell: (params: GridRenderCellParams) => params.row.policy?.policyNumber || '-' },
    { field: 'type', headerName: 'Type', width: 130 },
    { field: 'dateOfLoss', headerName: 'Date of Loss', width: 120,
      renderCell: (params) => format(new Date(params.value), 'MM/dd/yyyy') },
    { field: 'estimatedLoss', headerName: 'Est. Loss', width: 120,
      renderCell: (params) => params.value ? `$${Number(params.value).toLocaleString()}` : '-' },
    { field: 'paidAmount', headerName: 'Paid', width: 110,
      renderCell: (params) => params.value ? `$${Number(params.value).toLocaleString()}` : '-' },
    { field: 'status', headerName: 'Status', width: 150,
      renderCell: (params) => <Chip label={params.value?.replace(/_/g, ' ')} size="small" color={getStatusColor(params.value) as any} /> },
    { field: 'actions', headerName: '', width: 60, sortable: false,
      renderCell: (params) => (
        <IconButton size="small" onClick={(e) => { e.stopPropagation(); setAnchorEl(e.currentTarget); setSelectedClaim(params.row); }}>
          <MoreVert />
        </IconButton>
      ) },
  ];

  return (
    <Box className="animate-fade-in">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>Claims</Typography>
          <Typography color="text.secondary">Track and manage claims</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => router.push('/claims/new')}>
          Report Claim
        </Button>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ pb: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={5}>
              <TextField fullWidth size="small" placeholder="Search claims..." value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }} />
            </Grid>
            <Grid item xs={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value)}>
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="REPORTED">Reported</MenuItem>
                  <MenuItem value="UNDER_INVESTIGATION">Under Investigation</MenuItem>
                  <MenuItem value="PENDING_DOCUMENTS">Pending Documents</MenuItem>
                  <MenuItem value="IN_REVIEW">In Review</MenuItem>
                  <MenuItem value="APPROVED">Approved</MenuItem>
                  <MenuItem value="DENIED">Denied</MenuItem>
                  <MenuItem value="SETTLED">Settled</MenuItem>
                  <MenuItem value="CLOSED">Closed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} md={4}>
              <Button variant="text" onClick={() => { setSearch(''); setStatusFilter(''); }}>Clear Filters</Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <DataGrid
          rows={data?.claims || []} columns={columns} rowCount={data?.pagination?.total || 0}
          loading={isLoading} pageSizeOptions={[10, 25, 50]} paginationMode="server"
          paginationModel={{ page, pageSize }}
          onPaginationModelChange={(model) => { setPage(model.page); setPageSize(model.pageSize); }}
          disableRowSelectionOnClick onRowClick={(params) => router.push(`/claims/${params.id}`)}
          sx={{ border: 'none', '& .MuiDataGrid-row:hover': { cursor: 'pointer' } }} autoHeight
        />
      </Card>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
        <MenuItem onClick={() => { router.push(`/claims/${selectedClaim?.id}`); setAnchorEl(null); }}>
          <Visibility sx={{ mr: 1 }} fontSize="small" /> View
        </MenuItem>
        <MenuItem onClick={() => { router.push(`/claims/${selectedClaim?.id}/edit`); setAnchorEl(null); }}>
          <Edit sx={{ mr: 1 }} fontSize="small" /> Edit
        </MenuItem>
        <MenuItem onClick={() => {
          setNewStatus(selectedClaim?.status || '');
          setStatusDialogOpen(true);
          setAnchorEl(null);
        }}>
          <Assignment sx={{ mr: 1 }} fontSize="small" /> Update Status
        </MenuItem>
      </Menu>

      {/* Update Status Dialog */}
      <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Update Claim Status</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Status</InputLabel>
            <Select value={newStatus} label="Status" onChange={(e) => setNewStatus(e.target.value)}>
              <MenuItem value="REPORTED">Reported</MenuItem>
              <MenuItem value="UNDER_INVESTIGATION">Under Investigation</MenuItem>
              <MenuItem value="PENDING_DOCUMENTS">Pending Documents</MenuItem>
              <MenuItem value="IN_REVIEW">In Review</MenuItem>
              <MenuItem value="APPROVED">Approved</MenuItem>
              <MenuItem value="DENIED">Denied</MenuItem>
              <MenuItem value="SETTLED">Settled</MenuItem>
              <MenuItem value="CLOSED">Closed</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={async () => {
              try {
                await axios.patch(`/api/claims/${selectedClaim?.id}`, { status: newStatus });
                queryClient.invalidateQueries({ queryKey: ['claims'] });
                setSnackbar({ open: true, message: 'Claim status updated successfully', severity: 'success' });
                setStatusDialogOpen(false);
              } catch {
                setSnackbar({ open: true, message: 'Failed to update status', severity: 'error' });
              }
            }}
          >
            Update
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
