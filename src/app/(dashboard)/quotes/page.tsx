'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  Box, Button, Card, CardContent, Typography, TextField, InputAdornment,
  IconButton, Menu, MenuItem, Chip, Grid, FormControl, InputLabel, Select, Snackbar, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import { Add, Search, MoreVert, Edit, Visibility, Send, FileCopy, Delete } from '@mui/icons-material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { format } from 'date-fns';

export default function QuotesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedQuote, setSelectedQuote] = useState<any>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`/api/quotes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      setSnackbar({ open: true, message: 'Quote deleted successfully', severity: 'success' });
      setDeleteDialogOpen(false);
      setSelectedQuote(null);
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to delete quote', severity: 'error' });
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ['quotes', page, pageSize, search, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page + 1), limit: String(pageSize),
        ...(search && { search }), ...(statusFilter && { status: statusFilter }),
      });
      const response = await axios.get(`/api/quotes?${params}`);
      return response.data;
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'default';
      case 'QUOTED': return 'info';
      case 'PROPOSED': return 'primary';
      case 'ACCEPTED': case 'BOUND': return 'success';
      case 'DECLINED': case 'EXPIRED': return 'error';
      default: return 'default';
    }
  };

  const columns: GridColDef[] = [
    { field: 'quoteNumber', headerName: 'Quote #', width: 140,
      renderCell: (params) => <Typography variant="body2" fontWeight={600} color="primary">{params.value}</Typography> },
    { field: 'client', headerName: 'Client', flex: 1, minWidth: 180,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2">
          {params.row.client?.type === 'COMMERCIAL' && params.row.client?.businessName
            ? params.row.client.businessName
            : `${params.row.client?.firstName} ${params.row.client?.lastName}`}
        </Typography>
      ) },
    { field: 'lineOfBusiness', headerName: 'Type', width: 150,
      renderCell: (params) => <Typography variant="body2">{params.value?.replace(/_/g, ' ')}</Typography> },
    { field: 'carrier', headerName: 'Carrier', width: 130,
      renderCell: (params: GridRenderCellParams) => params.row.carrier?.name || '-' },
    { field: 'totalPremium', headerName: 'Premium', width: 120,
      renderCell: (params) => params.value ? `$${Number(params.value).toLocaleString()}` : '-' },
    { field: 'effectiveDate', headerName: 'Eff. Date', width: 110,
      renderCell: (params) => format(new Date(params.value), 'MM/dd/yyyy') },
    { field: 'status', headerName: 'Status', width: 120,
      renderCell: (params) => <Chip label={params.value} size="small" color={getStatusColor(params.value) as any} /> },
    { field: 'createdAt', headerName: 'Created', width: 110,
      renderCell: (params) => format(new Date(params.value), 'MM/dd/yyyy') },
    { field: 'actions', headerName: '', width: 60, sortable: false,
      renderCell: (params) => (
        <IconButton size="small" onClick={(e) => { e.stopPropagation(); setAnchorEl(e.currentTarget); setSelectedQuote(params.row); }}>
          <MoreVert />
        </IconButton>
      ) },
  ];

  return (
    <Box className="animate-fade-in">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>Quotes</Typography>
          <Typography color="text.secondary">Manage quotes and proposals</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => router.push('/quotes/new')}>
          New Quote
        </Button>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ pb: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={5}>
              <TextField fullWidth size="small" placeholder="Search quotes..." value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }} />
            </Grid>
            <Grid item xs={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value)}>
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="DRAFT">Draft</MenuItem>
                  <MenuItem value="QUOTED">Quoted</MenuItem>
                  <MenuItem value="PROPOSED">Proposed</MenuItem>
                  <MenuItem value="ACCEPTED">Accepted</MenuItem>
                  <MenuItem value="DECLINED">Declined</MenuItem>
                  <MenuItem value="BOUND">Bound</MenuItem>
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
          rows={data?.quotes || []} columns={columns} rowCount={data?.pagination?.total || 0}
          loading={isLoading} pageSizeOptions={[10, 25, 50]} paginationMode="server"
          paginationModel={{ page, pageSize }}
          onPaginationModelChange={(model) => { setPage(model.page); setPageSize(model.pageSize); }}
          disableRowSelectionOnClick onRowClick={(params) => router.push(`/quotes/${params.id}`)}
          sx={{ border: 'none', '& .MuiDataGrid-row:hover': { cursor: 'pointer' } }} autoHeight
        />
      </Card>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
        <MenuItem onClick={() => { router.push(`/quotes/${selectedQuote?.id}`); setAnchorEl(null); }}>
          <Visibility sx={{ mr: 1 }} fontSize="small" /> View
        </MenuItem>
        <MenuItem onClick={() => { router.push(`/quotes/${selectedQuote?.id}/edit`); setAnchorEl(null); }}>
          <Edit sx={{ mr: 1 }} fontSize="small" /> Edit
        </MenuItem>
        <MenuItem onClick={async () => {
          try {
            await axios.patch(`/api/quotes/${selectedQuote?.id}`, { status: 'PROPOSED' });
            queryClient.invalidateQueries({ queryKey: ['quotes'] });
            setSnackbar({ open: true, message: 'Proposal sent successfully', severity: 'success' });
          } catch {
            setSnackbar({ open: true, message: 'Failed to send proposal', severity: 'error' });
          }
          setAnchorEl(null);
        }}>
          <Send sx={{ mr: 1 }} fontSize="small" /> Send Proposal
        </MenuItem>
        <MenuItem onClick={async () => {
          try {
            const response = await axios.post('/api/quotes', {
              ...selectedQuote,
              id: undefined,
              quoteNumber: undefined,
              status: 'DRAFT',
              clientId: selectedQuote?.client?.id,
              carrierId: selectedQuote?.carrier?.id,
            });
            queryClient.invalidateQueries({ queryKey: ['quotes'] });
            setSnackbar({ open: true, message: 'Quote duplicated successfully', severity: 'success' });
            router.push(`/quotes/${response.data.id}`);
          } catch {
            setSnackbar({ open: true, message: 'Failed to duplicate quote', severity: 'error' });
          }
          setAnchorEl(null);
        }}>
          <FileCopy sx={{ mr: 1 }} fontSize="small" /> Duplicate
        </MenuItem>
        <MenuItem onClick={() => { setAnchorEl(null); setDeleteDialogOpen(true); }} sx={{ color: 'error.main' }}>
          <Delete sx={{ mr: 1 }} fontSize="small" /> Delete
        </MenuItem>
      </Menu>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Quote</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete quote <strong>{selectedQuote?.quoteNumber}</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => deleteMutation.mutate(selectedQuote?.id)}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
