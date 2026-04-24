'use client';

import { useState, useMemo } from 'react';
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
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  Tooltip,
  Badge,
} from '@mui/material';
import {
  Add,
  Search,
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
  PictureAsPdf,
  Close,
  DeleteSweep,
  Update,
  People,
  TrendingUp,
  LocationOn,
  CalendarMonth,
  Shield,
  FilterList,
} from '@mui/icons-material';
import { DataGrid, GridColDef, GridRenderCellParams, GridRowSelectionModel } from '@mui/x-data-grid';
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
  businessType?: string;
  city: string;
  state: string;
  zipCode: string;
  address: string;
  source: string;
  dateOfBirth?: string;
  tags: string[];
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
  const [stateFilter, setStateFilter] = useState('');
  const [agentFilter, setAgentFilter] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [bulkUpdateDialogOpen, setBulkUpdateDialogOpen] = useState(false);
  const [bulkStatus, setBulkStatus] = useState('');
  const [selectedRows, setSelectedRows] = useState<GridRowSelectionModel>([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  // Fetch agents list for the agent filter dropdown (lightweight endpoint)
  const { data: agentsList = [] } = useQuery({
    queryKey: ['agents-list'],
    queryFn: async () => {
      const response = await axios.get('/api/users?agentsOnly=true');
      return response.data || [];
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ['clients', page, pageSize, search, typeFilter, statusFilter, stateFilter, agentFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page + 1),
        limit: String(pageSize),
        ...(search && { search }),
        ...(typeFilter && { type: typeFilter }),
        ...(statusFilter && { status: statusFilter }),
        ...(stateFilter && { state: stateFilter }),
        ...(agentFilter && { agentId: agentFilter }),
      });
      const response = await axios.get(`/api/clients?${params}`);
      return response.data;
    },
  });

  const clients: Client[] = data?.clients || [];
  const totalCount = data?.pagination?.total || 0;

  // Compute summary stats from current data
  const stats = useMemo(() => {
    const active = clients.filter((c) => c.status === 'ACTIVE').length;
    const prospects = clients.filter((c) => c.status === 'PROSPECT').length;
    const commercial = clients.filter((c) => c.type === 'COMMERCIAL').length;
    const personal = clients.filter((c) => c.type === 'PERSONAL').length;
    return { active, prospects, commercial, personal };
  }, [clients]);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`/api/clients/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setSnackbar({ open: true, message: 'Client deleted successfully', severity: 'success' });
      setDeleteDialogOpen(false);
      setDetailDialogOpen(false);
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to delete client', severity: 'error' });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await axios.delete('/api/clients/bulk', { data: { ids } });
    },
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setSnackbar({ open: true, message: `${ids.length} client(s) deleted`, severity: 'success' });
      setBulkDeleteDialogOpen(false);
      setSelectedRows([]);
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Bulk delete failed', severity: 'error' });
    },
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ ids, data }: { ids: string[]; data: Record<string, unknown> }) => {
      await axios.patch('/api/clients/bulk', { ids, data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setSnackbar({ open: true, message: 'Clients updated successfully', severity: 'success' });
      setBulkUpdateDialogOpen(false);
      setSelectedRows([]);
      setBulkStatus('');
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Bulk update failed', severity: 'error' });
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

  const handleRowClick = (params: { row: Client }) => {
    setSelectedClient(params.row);
    setDetailDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'PROSPECT': return 'info';
      case 'INACTIVE': return 'warning';
      case 'FORMER': return 'error';
      default: return 'default';
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: 'Client',
      flex: 1.5,
      minWidth: 280,
      renderCell: (params: GridRenderCellParams<Client>) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, overflow: 'hidden' }}>
          <Avatar
            sx={{
              bgcolor: params.row.type === 'PERSONAL' ? 'primary.main' : 'secondary.main',
              width: 40,
              height: 40,
              fontSize: '0.9rem',
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {params.row.type === 'PERSONAL'
              ? `${params.row.firstName?.[0] || ''}${params.row.lastName?.[0] || ''}`
              : <Business sx={{ fontSize: 20 }} />
            }
          </Avatar>
          <Box sx={{ overflow: 'hidden' }}>
            <Typography
              variant="body1"
              fontWeight={600}
              sx={{ fontSize: '0.95rem', lineHeight: 1.4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
            >
              {params.row.type === 'COMMERCIAL' && params.row.businessName
                ? params.row.businessName
                : `${params.row.firstName} ${params.row.lastName}`}
            </Typography>
            {params.row.type === 'COMMERCIAL' && (
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', lineHeight: 1.3 }}>
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
      width: 130,
      renderCell: (params: GridRenderCellParams<Client>) => (
        <Chip
          icon={params.value === 'PERSONAL' ? <Person sx={{ fontSize: '15px !important' }} /> : <Business sx={{ fontSize: '15px !important' }} />}
          label={params.value === 'PERSONAL' ? 'Personal' : 'Commercial'}
          size="small"
          color={params.value === 'PERSONAL' ? 'primary' : 'secondary'}
          variant="outlined"
          sx={{ fontWeight: 500, borderRadius: '6px' }}
        />
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params: GridRenderCellParams<Client>) => (
        <Chip
          label={params.value?.toString().charAt(0) + params.value?.toString().slice(1).toLowerCase()}
          size="small"
          color={getStatusColor(params.value as string) as any}
          sx={{ fontWeight: 600, borderRadius: '6px', minWidth: 72 }}
        />
      ),
    },
    {
      field: 'contact',
      headerName: 'Contact',
      flex: 1.2,
      minWidth: 240,
      renderCell: (params: GridRenderCellParams<Client>) => (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {params.row.email && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Email sx={{ fontSize: 16, color: 'primary.main', opacity: 0.7, flexShrink: 0 }} />
              <Typography variant="body2" sx={{ fontSize: '0.84rem', color: 'text.primary', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{params.row.email}</Typography>
            </Box>
          )}
          {params.row.phone && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Phone sx={{ fontSize: 16, color: 'success.main', opacity: 0.7, flexShrink: 0 }} />
              <Typography variant="body2" sx={{ fontSize: '0.84rem', color: 'text.primary' }}>{params.row.phone}</Typography>
            </Box>
          )}
        </Box>
      ),
    },
    {
      field: 'location',
      headerName: 'Location',
      width: 170,
      renderCell: (params: GridRenderCellParams<Client>) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          {(params.row.city || params.row.state) && <LocationOn sx={{ fontSize: 17, color: 'text.secondary', opacity: 0.6, flexShrink: 0 }} />}
          <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
            {params.row.city && params.row.state ? `${params.row.city}, ${params.row.state}` : params.row.state || '-'}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'policies',
      headerName: 'Policies',
      width: 90,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams<Client>) => {
        const count = params.row._count?.policies || 0;
        return (
          <Badge badgeContent={count} color={count > 0 ? 'primary' : 'default'} showZero>
            <Shield sx={{ fontSize: 20, color: count > 0 ? 'primary.main' : 'text.disabled' }} />
          </Badge>
        );
      },
    },
    {
      field: 'agent',
      headerName: 'Agent',
      width: 160,
      renderCell: (params: GridRenderCellParams<Client>) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {params.row.agent?.name && (
            <Avatar sx={{ width: 26, height: 26, fontSize: '0.7rem', bgcolor: 'grey.400', flexShrink: 0 }}>
              {params.row.agent.name.split(' ').map((n: string) => n[0]).join('')}
            </Avatar>
          )}
          <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>{params.row.agent?.name || '-'}</Typography>
        </Box>
      ),
    },
    {
      field: 'createdAt',
      headerName: 'Created',
      width: 120,
      renderCell: (params: GridRenderCellParams<Client>) => (
        <Typography variant="caption" color="text.secondary">
          {format(new Date(params.value as string), 'MMM d, yyyy')}
        </Typography>
      ),
    },
    {
      field: 'actions',
      headerName: '',
      width: 50,
      sortable: false,
      renderCell: (params: GridRenderCellParams<Client>) => (
        <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleMenuOpen(e, params.row); }} sx={{ opacity: 0.6, '&:hover': { opacity: 1 } }}>
          <MoreVert fontSize="small" />
        </IconButton>
      ),
    },
  ];

  // Get unique states from loaded clients for state dropdown
  const uniqueStates = useMemo(() => {
    const states = clients
      .map((c) => c.state)
      .filter((s) => s)
      .filter((s, i, arr) => arr.indexOf(s) === i)
      .sort();
    return states;
  }, [clients]);

  const hasActiveFilters = search || typeFilter || statusFilter || stateFilter || agentFilter;

  return (
    <Box className="animate-fade-in">
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 3,
          background: 'linear-gradient(135deg, #1a237e 0%, #283593 50%, #3949ab 100%)',
          color: 'white',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.15)', width: 52, height: 52 }}>
              <People sx={{ fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight={700}>Clients</Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                Manage your personal and commercial clients
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Export as PDF">
              <Button
                variant="outlined"
                size="small"
                startIcon={<PictureAsPdf />}
                onClick={() => window.open('/api/export/pdf?type=clients', '_blank')}
                sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}
              >
                PDF
              </Button>
            </Tooltip>
            <Tooltip title="Export as CSV">
              <Button
                variant="outlined"
                size="small"
                startIcon={<Download />}
                onClick={() => {
                  const allClients = data?.clients || [];
                  const csv = [
                    ['Name', 'Type', 'Status', 'Email', 'Phone', 'City', 'State', 'Agent', 'Created'].join(','),
                    ...allClients.map((c: Client) => [
                      `"${c.firstName} ${c.lastName}"`, c.type, c.status, c.email || '', c.phone || '',
                      c.city || '', c.state || '', c.agent?.name || '', new Date(c.createdAt).toLocaleDateString()
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
                sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}
              >
                CSV
              </Button>
            </Tooltip>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => router.push('/clients/new')}
              sx={{
                bgcolor: 'white',
                color: 'primary.dark',
                fontWeight: 600,
                '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' },
              }}
            >
              Add Client
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Stats Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Total Clients', value: totalCount, icon: <People />, color: '#1976d2', bg: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)' },
          { label: 'Active', value: stats.active, icon: <TrendingUp />, color: '#2e7d32', bg: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)' },
          { label: 'Prospects', value: stats.prospects, icon: <Person />, color: '#0288d1', bg: 'linear-gradient(135deg, #e1f5fe 0%, #b3e5fc 100%)' },
          { label: 'Commercial', value: stats.commercial, icon: <Business />, color: '#7b1fa2', bg: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)' },
        ].map((stat) => (
          <Grid item xs={6} sm={3} key={stat.label}>
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: 2.5,
                background: stat.bg,
                border: '1px solid',
                borderColor: 'divider',
                transition: 'transform 0.2s',
                '&:hover': { transform: 'translateY(-2px)' },
              }}
            >
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

      {/* Bulk Actions Bar */}
      {selectedRows.length > 0 && (
        <Alert
          severity="info"
          sx={{ mb: 2, borderRadius: 2 }}
          action={
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button size="small" variant="outlined" startIcon={<Update />} onClick={() => setBulkUpdateDialogOpen(true)}>
                Update Status
              </Button>
              <Button size="small" color="error" variant="outlined" startIcon={<DeleteSweep />} onClick={() => setBulkDeleteDialogOpen(true)}>
                Delete Selected
              </Button>
            </Box>
          }
        >
          <strong>{selectedRows.length}</strong> client(s) selected
        </Alert>
      )}

      {/* Filters */}
      <Card sx={{ mb: 2, borderRadius: 2.5, overflow: 'visible' }}>
        <CardContent sx={{ py: 2, px: 2.5, '&:last-child': { pb: 2 } }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search by name, email, phone, location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'grey.50' },
                }}
              />
            </Grid>
            <Grid item xs={6} sm={3} md={1.5}>
              <FormControl fullWidth size="small">
                <InputLabel>Type</InputLabel>
                <Select value={typeFilter} label="Type" onChange={(e) => { setTypeFilter(e.target.value); setPage(0); }} sx={{ borderRadius: 2 }}>
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="PERSONAL">Personal</MenuItem>
                  <MenuItem value="COMMERCIAL">Commercial</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={3} md={1.5}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select value={statusFilter} label="Status" onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }} sx={{ borderRadius: 2 }}>
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="ACTIVE">Active</MenuItem>
                  <MenuItem value="PROSPECT">Prospect</MenuItem>
                  <MenuItem value="INACTIVE">Inactive</MenuItem>
                  <MenuItem value="FORMER">Former</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={3} md={1.5}>
              <FormControl fullWidth size="small">
                <InputLabel>State</InputLabel>
                <Select value={stateFilter} label="State" onChange={(e) => { setStateFilter(e.target.value); setPage(0); }} sx={{ borderRadius: 2 }}>
                  <MenuItem value="">All</MenuItem>
                  {uniqueStates.map((s) => (
                    <MenuItem key={s} value={s}>{s}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={3} md={1.5}>
              <FormControl fullWidth size="small">
                <InputLabel>Agent</InputLabel>
                <Select value={agentFilter} label="Agent" onChange={(e) => { setAgentFilter(e.target.value); setPage(0); }} sx={{ borderRadius: 2 }}>
                  <MenuItem value="">All</MenuItem>
                  {agentsList.map((a: any) => (
                    <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                {hasActiveFilters && (
                  <Button
                    variant="text"
                    size="small"
                    startIcon={<FilterList />}
                    onClick={() => { setSearch(''); setTypeFilter(''); setStatusFilter(''); setStateFilter(''); setAgentFilter(''); setPage(0); }}
                    sx={{ textTransform: 'none' }}
                  >
                    Clear All
                  </Button>
                )}
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Data Grid */}
      <Card sx={{ borderRadius: 2.5, overflow: 'hidden' }}>
        <DataGrid
          rows={clients}
          columns={columns}
          rowCount={totalCount}
          loading={isLoading}
          pageSizeOptions={[10, 25, 50]}
          paginationMode="server"
          paginationModel={{ page, pageSize }}
          onPaginationModelChange={(model) => { setPage(model.page); setPageSize(model.pageSize); }}
          checkboxSelection
          disableRowSelectionOnClick
          onRowSelectionModelChange={(newSelection) => setSelectedRows(newSelection)}
          rowSelectionModel={selectedRows}
          onRowClick={(params) => handleRowClick(params as { row: Client })}
          rowHeight={72}
          sx={{
            border: 'none',
            '& .MuiDataGrid-columnHeaders': {
              bgcolor: 'grey.50',
              borderBottom: '2px solid',
              borderColor: 'divider',
            },
            '& .MuiDataGrid-columnHeaderTitle': {
              fontWeight: 600,
              fontSize: '0.8rem',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              color: 'text.secondary',
            },
            '& .MuiDataGrid-row': {
              cursor: 'pointer',
              '&:hover': {
                bgcolor: 'action.hover',
              },
            },
            '& .MuiDataGrid-cell': {
              borderColor: 'grey.100',
              display: 'flex',
              alignItems: 'center',
            },
            '& .MuiDataGrid-footerContainer': {
              borderTop: '2px solid',
              borderColor: 'divider',
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
        PaperProps={{
          sx: { borderRadius: 2, minWidth: 160, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' },
        }}
      >
        <MenuItem onClick={() => { if (selectedClient) { setDetailDialogOpen(true); } handleMenuClose(); }}>
          <ListItemIcon><Visibility fontSize="small" /></ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { if (selectedClient) router.push(`/clients/${selectedClient.id}`); handleMenuClose(); }}>
          <ListItemIcon><Edit fontSize="small" /></ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { setDeleteDialogOpen(true); handleMenuClose(); }} sx={{ color: 'error.main' }}>
          <ListItemIcon><Delete fontSize="small" color="error" /></ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      {/* Row Detail Dialog */}
      <Dialog open={detailDialogOpen} onClose={() => setDetailDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}>
        <Box sx={{ background: selectedClient?.type === 'COMMERCIAL'
          ? 'linear-gradient(135deg, #4a148c 0%, #6a1b9a 50%, #9c27b0 100%)'
          : 'linear-gradient(135deg, #1565c0 0%, #1976d2 50%, #42a5f5 100%)', color: 'white', px: 3, py: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.15)', width: 52, height: 52, fontSize: '1.1rem', fontWeight: 700 }}>
              {selectedClient?.type === 'PERSONAL'
                ? `${selectedClient?.firstName?.[0] || ''}${selectedClient?.lastName?.[0] || ''}`
                : <Business sx={{ fontSize: 28 }} />
              }
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" fontWeight={700}>
                {selectedClient?.type === 'COMMERCIAL' && selectedClient.businessName
                  ? selectedClient.businessName
                  : `${selectedClient?.firstName} ${selectedClient?.lastName}`}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                <Chip
                  label={selectedClient?.type === 'PERSONAL' ? 'Personal' : 'Commercial'}
                  size="small"
                  sx={{ fontWeight: 700, bgcolor: 'rgba(255,255,255,0.2)', color: 'white', borderRadius: '6px' }}
                />
                <Chip
                  label={selectedClient?.status?.charAt(0) + (selectedClient?.status?.slice(1).toLowerCase() || '')}
                  size="small"
                  sx={{ fontWeight: 700, bgcolor: 'rgba(255,255,255,0.2)', color: 'white', borderRadius: '6px' }}
                />
              </Box>
            </Box>
            <IconButton onClick={() => setDetailDialogOpen(false)} size="small" sx={{ color: 'white' }}>
              <Close />
            </IconButton>
          </Box>
        </Box>
        <DialogContent dividers>
          {/* Contact Info */}
          <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 1 }}>Contact Information</Typography>
          <Paper variant="outlined" sx={{ p: 2, mb: 2.5, mt: 1, borderRadius: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Email sx={{ fontSize: 18, color: 'primary.main' }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary">Email</Typography>
                    <Typography variant="body2">{selectedClient?.email || '-'}</Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Phone sx={{ fontSize: 18, color: 'success.main' }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary">Phone</Typography>
                    <Typography variant="body2">{selectedClient?.phone || '-'}</Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocationOn sx={{ fontSize: 18, color: 'warning.main' }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary">Address</Typography>
                    <Typography variant="body2">
                      {selectedClient?.address
                        ? `${selectedClient.address}, ${selectedClient.city}, ${selectedClient.state} ${selectedClient.zipCode}`
                        : '-'}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Paper>

          {/* Account Details */}
          <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 1 }}>Account Details</Typography>
          <Paper variant="outlined" sx={{ p: 2, mb: 2.5, mt: 1, borderRadius: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <Box sx={{ textAlign: 'center', p: 1 }}>
                  <Typography variant="h5" fontWeight={700} color="primary.main">{selectedClient?._count?.policies || 0}</Typography>
                  <Typography variant="caption" color="text.secondary">Policies</Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box sx={{ textAlign: 'center', p: 1 }}>
                  <Typography variant="h5" fontWeight={700} color="info.main">{selectedClient?._count?.quotes || 0}</Typography>
                  <Typography variant="caption" color="text.secondary">Quotes</Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box sx={{ textAlign: 'center', p: 1 }}>
                  <Typography variant="h5" fontWeight={700} color="warning.main">{selectedClient?._count?.claims || 0}</Typography>
                  <Typography variant="caption" color="text.secondary">Claims</Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>

          {/* Additional Info */}
          <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 1 }}>Additional Info</Typography>
          <Paper variant="outlined" sx={{ p: 2, mt: 1, borderRadius: 2 }}>
            <Grid container spacing={1.5}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Agent</Typography>
                <Typography variant="body2">{selectedClient?.agent?.name || '-'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Source</Typography>
                <Typography variant="body2">{selectedClient?.source || '-'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Created</Typography>
                <Typography variant="body2">{selectedClient?.createdAt ? format(new Date(selectedClient.createdAt), 'MMM d, yyyy') : '-'}</Typography>
              </Grid>
              {selectedClient?.tags && selectedClient.tags.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary" gutterBottom>Tags</Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                    {selectedClient.tags.map((t) => <Chip key={t} label={t} size="small" sx={{ borderRadius: '6px' }} />)}
                  </Box>
                </Grid>
              )}
            </Grid>
          </Paper>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider', justifyContent: 'space-between' }}>
          <Button color="error" variant="outlined" startIcon={<Delete />} onClick={() => { setDetailDialogOpen(false); setDeleteDialogOpen(true); }} sx={{ borderRadius: 2 }}>
            Delete
          </Button>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button onClick={() => setDetailDialogOpen(false)} sx={{ borderRadius: 2 }}>Close</Button>
            <Button variant="contained" startIcon={<Edit />} onClick={() => { setDetailDialogOpen(false); router.push(`/clients/${selectedClient?.id}`); }}
              sx={{ borderRadius: 2, bgcolor: selectedClient?.type === 'COMMERCIAL' ? '#6a1b9a' : '#1565c0', '&:hover': { bgcolor: selectedClient?.type === 'COMMERCIAL' ? '#4a148c' : '#0d47a1' } }}>
              Edit Client
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle>Delete Client</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{selectedClient?.type === 'COMMERCIAL' && selectedClient?.businessName ? selectedClient.businessName : `${selectedClient?.firstName} ${selectedClient?.lastName}`}</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained" sx={{ borderRadius: 2 }}>Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Delete Dialog */}
      <Dialog open={bulkDeleteDialogOpen} onClose={() => setBulkDeleteDialogOpen(false)} PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle>Delete Selected Clients</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete <strong>{selectedRows.length}</strong> selected client(s)? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setBulkDeleteDialogOpen(false)} sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button onClick={() => bulkDeleteMutation.mutate(selectedRows as string[])} color="error" variant="contained" disabled={bulkDeleteMutation.isPending} sx={{ borderRadius: 2 }}>
            {bulkDeleteMutation.isPending ? 'Deleting...' : 'Delete All'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Update Dialog */}
      <Dialog open={bulkUpdateDialogOpen} onClose={() => setBulkUpdateDialogOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle>Update Selected Clients</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>Update status for <strong>{selectedRows.length}</strong> selected client(s).</Typography>
          <FormControl fullWidth>
            <InputLabel>New Status</InputLabel>
            <Select value={bulkStatus} label="New Status" onChange={(e) => setBulkStatus(e.target.value)} sx={{ borderRadius: 2 }}>
              <MenuItem value="ACTIVE">Active</MenuItem>
              <MenuItem value="PROSPECT">Prospect</MenuItem>
              <MenuItem value="INACTIVE">Inactive</MenuItem>
              <MenuItem value="FORMER">Former</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setBulkUpdateDialogOpen(false)} sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button
            variant="contained"
            disabled={!bulkStatus || bulkUpdateMutation.isPending}
            onClick={() => bulkUpdateMutation.mutate({ ids: selectedRows as string[], data: { status: bulkStatus } })}
            sx={{ borderRadius: 2 }}
          >
            {bulkUpdateMutation.isPending ? 'Updating...' : 'Update All'}
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
