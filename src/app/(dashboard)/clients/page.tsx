'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Menu,
  MenuItem,
  Chip,
  Avatar,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  Grid,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Add,
  Search,
  FilterList,
  MoreVert,
  Edit,
  Delete,
  Visibility,
  Person,
  Business,
  Email,
  Phone,
  Policy,
  Download,
  Upload,
} from '@mui/icons-material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { format } from 'date-fns';

interface Client {
  id: string;
  type: string;
  status: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  businessName?: string;
  city: string;
  state: string;
  agent: { id: string; name: string };
  createdAt: string;
  _count: { policies: number; quotes: number; claims: number };
}

export default function ClientsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['clients', page, pageSize, search, typeFilter, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page + 1),
        limit: String(pageSize),
        ...(search && { search }),
        ...(typeFilter && { type: typeFilter }),
        ...(statusFilter && { status: statusFilter }),
      });
      const response = await axios.get(`/api/clients?${params}`);
      return response.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`/api/clients/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setSnackbar({ open: true, message: 'Client deleted successfully', severity: 'success' });
      setDeleteDialogOpen(false);
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to delete client', severity: 'error' });
    },
  });

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, client: Client) => {
    setAnchorEl(event.currentTarget);
    setSelectedClient(client);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDelete = () => {
    if (selectedClient) {
      deleteMutation.mutate(selectedClient.id);
    }
    handleMenuClose();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'PROSPECT':
        return 'info';
      case 'INACTIVE':
        return 'warning';
      case 'FORMER':
        return 'error';
      default:
        return 'default';
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: 'Name',
      flex: 1,
      minWidth: 200,
      renderCell: (params: GridRenderCellParams<Client>) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ bgcolor: params.row.type === 'PERSONAL' ? 'primary.main' : 'secondary.main', width: 36, height: 36 }}>
            {params.row.type === 'PERSONAL' ? <Person fontSize="small" /> : <Business fontSize="small" />}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight={600}>
              {params.row.type === 'COMMERCIAL' && params.row.businessName
                ? params.row.businessName
                : `${params.row.firstName} ${params.row.lastName}`}
            </Typography>
            {params.row.type === 'COMMERCIAL' && (
              <Typography variant="caption" color="text.secondary">
                {params.row.firstName} {params.row.lastName}
              </Typography>
            )}
          </Box>
        </Box>
      ),
    },
    {
      field: 'type',
      headerName: 'Type',
      width: 120,
      renderCell: (params: GridRenderCellParams<Client>) => (
        <Chip
          label={params.value}
          size="small"
          color={params.value === 'PERSONAL' ? 'primary' : 'secondary'}
          variant="outlined"
        />
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params: GridRenderCellParams<Client>) => (
        <Chip
          label={params.value}
          size="small"
          color={getStatusColor(params.value as string)}
        />
      ),
    },
    {
      field: 'contact',
      headerName: 'Contact',
      flex: 1,
      minWidth: 200,
      renderCell: (params: GridRenderCellParams<Client>) => (
        <Box>
          {params.row.email && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Email sx={{ fontSize: 14, color: 'text.secondary' }} />
              <Typography variant="caption">{params.row.email}</Typography>
            </Box>
          )}
          {params.row.phone && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Phone sx={{ fontSize: 14, color: 'text.secondary' }} />
              <Typography variant="caption">{params.row.phone}</Typography>
            </Box>
          )}
        </Box>
      ),
    },
    {
      field: 'location',
      headerName: 'Location',
      width: 150,
      renderCell: (params: GridRenderCellParams<Client>) => (
        <Typography variant="body2">
          {params.row.city && params.row.state ? `${params.row.city}, ${params.row.state}` : '-'}
        </Typography>
      ),
    },
    {
      field: 'policies',
      headerName: 'Policies',
      width: 100,
      align: 'center',
      renderCell: (params: GridRenderCellParams<Client>) => (
        <Chip
          icon={<Policy sx={{ fontSize: 16 }} />}
          label={params.row._count.policies}
          size="small"
          variant="outlined"
        />
      ),
    },
    {
      field: 'agent',
      headerName: 'Agent',
      width: 150,
      renderCell: (params: GridRenderCellParams<Client>) => (
        <Typography variant="body2">{params.row.agent?.name || '-'}</Typography>
      ),
    },
    {
      field: 'createdAt',
      headerName: 'Created',
      width: 120,
      renderCell: (params: GridRenderCellParams<Client>) => (
        <Typography variant="body2">
          {format(new Date(params.value as string), 'MMM d, yyyy')}
        </Typography>
      ),
    },
    {
      field: 'actions',
      headerName: '',
      width: 60,
      sortable: false,
      renderCell: (params: GridRenderCellParams<Client>) => (
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            handleMenuOpen(e, params.row);
          }}
        >
          <MoreVert />
        </IconButton>
      ),
    },
  ];

  return (
    <Box className="animate-fade-in">
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Clients
          </Typography>
          <Typography color="text.secondary">
            Manage your personal and commercial clients
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={() => {
              const clients = data?.clients || [];
              const csv = [
                ['Name', 'Type', 'Status', 'Email', 'Phone', 'City', 'State', 'Agent', 'Created'].join(','),
                ...clients.map((c: Client) => [
                  `"${c.firstName} ${c.lastName}"`,
                  c.type,
                  c.status,
                  c.email || '',
                  c.phone || '',
                  c.city || '',
                  c.state || '',
                  c.agent?.name || '',
                  new Date(c.createdAt).toLocaleDateString()
                ].join(','))
              ].join('\n');
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `clients-${new Date().toISOString().split('T')[0]}.csv`;
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            Export
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => router.push('/clients/new')}
          >
            Add Client
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ pb: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search clients..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Type</InputLabel>
                <Select
                  value={typeFilter}
                  label="Type"
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <MenuItem value="">All Types</MenuItem>
                  <MenuItem value="PERSONAL">Personal</MenuItem>
                  <MenuItem value="COMMERCIAL">Commercial</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  <MenuItem value="ACTIVE">Active</MenuItem>
                  <MenuItem value="PROSPECT">Prospect</MenuItem>
                  <MenuItem value="INACTIVE">Inactive</MenuItem>
                  <MenuItem value="FORMER">Former</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                <Button
                  variant="text"
                  onClick={() => {
                    setSearch('');
                    setTypeFilter('');
                    setStatusFilter('');
                  }}
                >
                  Clear Filters
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Data Grid */}
      <Card>
        <DataGrid
          rows={data?.clients || []}
          columns={columns}
          rowCount={data?.pagination?.total || 0}
          loading={isLoading}
          pageSizeOptions={[10, 25, 50]}
          paginationMode="server"
          paginationModel={{ page, pageSize }}
          onPaginationModelChange={(model) => {
            setPage(model.page);
            setPageSize(model.pageSize);
          }}
          disableRowSelectionOnClick
          onRowClick={(params) => router.push(`/clients/${params.id}`)}
          sx={{
            border: 'none',
            '& .MuiDataGrid-row:hover': {
              cursor: 'pointer',
            },
          }}
          autoHeight
        />
      </Card>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          if (selectedClient) router.push(`/clients/${selectedClient.id}`);
          handleMenuClose();
        }}>
          <Visibility sx={{ mr: 1 }} fontSize="small" />
          View Details
        </MenuItem>
        <MenuItem onClick={() => {
          if (selectedClient) router.push(`/clients/${selectedClient.id}/edit`);
          handleMenuClose();
        }}>
          <Edit sx={{ mr: 1 }} fontSize="small" />
          Edit
        </MenuItem>
        <MenuItem
          onClick={() => {
            setDeleteDialogOpen(true);
            handleMenuClose();
          }}
          sx={{ color: 'error.main' }}
        >
          <Delete sx={{ mr: 1 }} fontSize="small" />
          Delete
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Client</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete{' '}
            <strong>
              {selectedClient?.firstName} {selectedClient?.lastName}
            </strong>
            ? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
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
