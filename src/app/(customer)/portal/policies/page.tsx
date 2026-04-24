'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  Box, AppBar, Toolbar, Typography, Button, Card, Chip, Skeleton,
  TextField, InputAdornment,
} from '@mui/material';
import { Shield, Search } from '@mui/icons-material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { format } from 'date-fns';

interface Policy {
  id: string;
  policyNumber: string;
  lineOfBusiness: string;
  carrier: { name: string };
  premium: number;
  effectiveDate: string;
  expirationDate: string;
  status: string;
}

export default function CustomerPoliciesPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');

  const { data: policies = [], isLoading } = useQuery<Policy[]>({
    queryKey: ['customerPolicies'],
    queryFn: async () => {
      const response = await axios.get('/api/customer/policies');
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

  const formatLOB = (lob: string) => {
    if (!lob) return '-';
    return lob.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const filteredPolicies = useMemo(() => {
    if (!search.trim()) return policies;
    const q = search.toLowerCase();
    return policies.filter((policy) =>
      [
        policy.policyNumber,
        formatLOB(policy.lineOfBusiness),
        policy.carrier?.name,
        policy.premium ? `$${Number(policy.premium).toLocaleString()}` : '',
        policy.effectiveDate ? format(new Date(policy.effectiveDate), 'MMM d, yyyy') : '',
        policy.expirationDate ? format(new Date(policy.expirationDate), 'MMM d, yyyy') : '',
        policy.status?.charAt(0) + policy.status?.slice(1).toLowerCase().replace(/_/g, ' '),
      ].some((field) => field?.toLowerCase().includes(q))
    );
  }, [policies, search]);

  const columns: GridColDef[] = [
    {
      field: 'policyNumber',
      headerName: 'Policy #',
      width: 160,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight={700} sx={{ color: '#1565c0', fontSize: '0.9rem' }}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'lineOfBusiness',
      headerName: 'Line of Business',
      width: 180,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
          {formatLOB(params.value)}
        </Typography>
      ),
    },
    {
      field: 'carrier',
      headerName: 'Carrier',
      width: 160,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
          {params.row.carrier?.name || '-'}
        </Typography>
      ),
    },
    {
      field: 'premium',
      headerName: 'Premium',
      width: 130,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.9rem' }}>
          ${Number(params.value || 0).toLocaleString()}
        </Typography>
      ),
    },
    {
      field: 'effectiveDate',
      headerName: 'Effective Date',
      width: 130,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.84rem' }}>
          {params.value ? format(new Date(params.value), 'MMM d, yyyy') : '-'}
        </Typography>
      ),
    },
    {
      field: 'expirationDate',
      headerName: 'Expiration Date',
      width: 140,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.84rem' }}>
          {params.value ? format(new Date(params.value), 'MMM d, yyyy') : '-'}
        </Typography>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 130,
      renderCell: (params) => (
        <Chip
          label={params.value?.toString().charAt(0) + params.value?.toString().slice(1).toLowerCase().replace(/_/g, ' ')}
          size="small"
          color={getStatusColor(params.value as string) as any}
          sx={{ fontWeight: 600, borderRadius: '6px', minWidth: 72 }}
        />
      ),
    },
  ];

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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Shield sx={{ fontSize: 32, color: 'primary.main' }} />
          <Box>
            <Typography variant="h5" fontWeight={700}>My Policies</Typography>
            <Typography variant="body2" color="text.secondary">
              View all your insurance policies
            </Typography>
          </Box>
        </Box>

        {/* Search Bar */}
        <TextField
          fullWidth
          placeholder="Search policies..."
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

        {/* Loading State */}
        {isLoading ? (
          <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2.5 }} />
        ) : (
          <Card sx={{ borderRadius: 2.5, overflow: 'hidden' }}>
            <DataGrid
              rows={filteredPolicies}
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
    </Box>
  );
}
