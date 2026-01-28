'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Box, Card, CardContent, Typography, Button, Grid, Chip, TextField, InputAdornment } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Search, AttachMoney, CheckCircle, Schedule } from '@mui/icons-material';
import { format } from 'date-fns';

export default function SettlementsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['settlements', search],
    queryFn: async () => {
      const response = await axios.get(`/api/settlements?search=${search}`);
      return response.data;
    },
  });

  const columns: GridColDef[] = [
    {
      field: 'claim',
      headerName: 'Claim #',
      flex: 1,
      valueGetter: (value: any) => value?.claimNumber || '-',
    },
    {
      field: 'client',
      headerName: 'Client',
      flex: 1.5,
      valueGetter: (value: any, row: any) => row.claim?.client ? `${row.claim.client.firstName} ${row.claim.client.lastName}` : '-',
    },
    { field: 'type', headerName: 'Type', flex: 1 },
    {
      field: 'amount',
      headerName: 'Amount',
      width: 130,
      valueFormatter: (value: number) => `$${(value || 0).toLocaleString()}`,
    },
    {
      field: 'createdAt',
      headerName: 'Date',
      width: 120,
      valueFormatter: (value: string) => value ? format(new Date(value), 'MM/dd/yyyy') : '-',
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          color={params.value === 'PAID' ? 'success' : params.value === 'PENDING' ? 'warning' : 'default'}
        />
      ),
    },
  ];

  const stats = data?.stats || { total: 0, paid: 0, pending: 0 };

  return (
    <Box className="animate-fade-in">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>Claim Settlements</Typography>
          <Typography color="text.secondary">Track claim settlement payments and status</Typography>
        </Box>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <AttachMoney sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4" fontWeight={700}>${stats.total.toLocaleString()}</Typography>
              <Typography color="text.secondary">Total Settlements</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <CheckCircle sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h4" fontWeight={700}>${stats.paid.toLocaleString()}</Typography>
              <Typography color="text.secondary">Paid</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Schedule sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
              <Typography variant="h4" fontWeight={700}>${stats.pending.toLocaleString()}</Typography>
              <Typography color="text.secondary">Pending</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ mb: 3, p: 2 }}>
        <TextField
          placeholder="Search settlements..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
          sx={{ width: 300 }}
        />
      </Card>

      <Card>
        <DataGrid
          rows={data?.settlements || []}
          columns={columns}
          loading={isLoading}
          pageSizeOptions={[10, 25, 50]}
          disableRowSelectionOnClick
          onRowClick={(params) => router.push(`/claims/${params.row.claimId}`)}
          sx={{ border: 'none', '& .MuiDataGrid-row:hover': { cursor: 'pointer' } }}
          autoHeight
        />
      </Card>
    </Box>
  );
}
