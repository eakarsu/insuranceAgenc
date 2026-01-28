'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
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
  Grid,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import {
  Add,
  Search,
  MoreVert,
  Edit,
  Visibility,
  Policy,
} from '@mui/icons-material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { format } from 'date-fns';

export default function PoliciesPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [lobFilter, setLobFilter] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedPolicy, setSelectedPolicy] = useState<any>(null);

  const { data: carriers = [] } = useQuery({
    queryKey: ['carriers'],
    queryFn: async () => {
      const response = await axios.get('/api/carriers');
      return response.data;
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ['policies', page, pageSize, search, statusFilter, lobFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page + 1),
        limit: String(pageSize),
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
        ...(lobFilter && { lineOfBusiness: lobFilter }),
      });
      const response = await axios.get(`/api/policies?${params}`);
      return response.data;
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'PENDING': return 'warning';
      case 'CANCELLED': case 'EXPIRED': case 'NON_RENEWED': return 'error';
      default: return 'default';
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'policyNumber',
      headerName: 'Policy Number',
      width: 150,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight={600} color="primary">
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'client',
      headerName: 'Client',
      flex: 1,
      minWidth: 180,
      renderCell: (params) => (
        <Typography variant="body2">
          {params.row.client?.type === 'COMMERCIAL' && params.row.client?.businessName
            ? params.row.client.businessName
            : `${params.row.client?.firstName} ${params.row.client?.lastName}`}
        </Typography>
      ),
    },
    {
      field: 'lineOfBusiness',
      headerName: 'Line of Business',
      width: 160,
      renderCell: (params) => (
        <Typography variant="body2">{params.value?.replace(/_/g, ' ')}</Typography>
      ),
    },
    {
      field: 'carrier',
      headerName: 'Carrier',
      width: 140,
      renderCell: (params) => params.row.carrier?.name || '-',
    },
    {
      field: 'premium',
      headerName: 'Premium',
      width: 120,
      renderCell: (params) => `$${Number(params.value).toLocaleString()}`,
    },
    {
      field: 'effectiveDate',
      headerName: 'Effective',
      width: 110,
      renderCell: (params) => format(new Date(params.value), 'MM/dd/yyyy'),
    },
    {
      field: 'expirationDate',
      headerName: 'Expires',
      width: 110,
      renderCell: (params) => format(new Date(params.value), 'MM/dd/yyyy'),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip label={params.value} size="small" color={getStatusColor(params.value) as any} />
      ),
    },
    {
      field: 'actions',
      headerName: '',
      width: 60,
      sortable: false,
      renderCell: (params) => (
        <IconButton size="small" onClick={(e) => { e.stopPropagation(); setAnchorEl(e.currentTarget); setSelectedPolicy(params.row); }}>
          <MoreVert />
        </IconButton>
      ),
    },
  ];

  const lineOfBusinessOptions = [
    'PERSONAL_AUTO', 'HOMEOWNERS', 'RENTERS', 'UMBRELLA', 'LIFE', 'HEALTH',
    'COMMERCIAL_AUTO', 'COMMERCIAL_PROPERTY', 'GENERAL_LIABILITY', 'WORKERS_COMP',
    'PROFESSIONAL_LIABILITY', 'CYBER'
  ];

  return (
    <Box className="animate-fade-in">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>Policies</Typography>
          <Typography color="text.secondary">Manage your policy portfolio</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => router.push('/policies/new')}>
          New Policy
        </Button>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ pb: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search policies..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
              />
            </Grid>
            <Grid item xs={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value)}>
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="ACTIVE">Active</MenuItem>
                  <MenuItem value="PENDING">Pending</MenuItem>
                  <MenuItem value="CANCELLED">Cancelled</MenuItem>
                  <MenuItem value="EXPIRED">Expired</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Line of Business</InputLabel>
                <Select value={lobFilter} label="Line of Business" onChange={(e) => setLobFilter(e.target.value)}>
                  <MenuItem value="">All</MenuItem>
                  {lineOfBusinessOptions.map((lob) => (
                    <MenuItem key={lob} value={lob}>{lob.replace(/_/g, ' ')}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Button variant="text" onClick={() => { setSearch(''); setStatusFilter(''); setLobFilter(''); }}>
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <DataGrid
          rows={data?.policies || []}
          columns={columns}
          rowCount={data?.pagination?.total || 0}
          loading={isLoading}
          pageSizeOptions={[10, 25, 50]}
          paginationMode="server"
          paginationModel={{ page, pageSize }}
          onPaginationModelChange={(model) => { setPage(model.page); setPageSize(model.pageSize); }}
          disableRowSelectionOnClick
          onRowClick={(params) => router.push(`/policies/${params.id}`)}
          sx={{ border: 'none', '& .MuiDataGrid-row:hover': { cursor: 'pointer' } }}
          autoHeight
        />
      </Card>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
        <MenuItem onClick={() => { router.push(`/policies/${selectedPolicy?.id}`); setAnchorEl(null); }}>
          <Visibility sx={{ mr: 1 }} fontSize="small" /> View
        </MenuItem>
        <MenuItem onClick={() => { router.push(`/policies/${selectedPolicy?.id}/edit`); setAnchorEl(null); }}>
          <Edit sx={{ mr: 1 }} fontSize="small" /> Edit
        </MenuItem>
      </Menu>
    </Box>
  );
}
