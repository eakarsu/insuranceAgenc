'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Box, Card, Typography, Button, Chip, TextField, InputAdornment } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Search, Cancel } from '@mui/icons-material';
import { format } from 'date-fns';

export default function CancellationsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['cancelled-policies', search],
    queryFn: async () => {
      const response = await axios.get(`/api/policies?status=CANCELLED&search=${search}`);
      return response.data;
    },
  });

  const columns: GridColDef[] = [
    { field: 'policyNumber', headerName: 'Policy #', flex: 1 },
    {
      field: 'client',
      headerName: 'Client',
      flex: 1.5,
      valueGetter: (value: any) => value ? `${value.firstName} ${value.lastName}` : '-',
    },
    { field: 'lineOfBusiness', headerName: 'Line of Business', flex: 1, valueFormatter: (value: string) => value?.replace(/_/g, ' ') },
    {
      field: 'carrier',
      headerName: 'Carrier',
      flex: 1,
      valueGetter: (value: any) => value?.name || '-',
    },
    {
      field: 'effectiveDate',
      headerName: 'Effective',
      width: 120,
      valueFormatter: (value: string) => value ? format(new Date(value), 'MM/dd/yyyy') : '-',
    },
    {
      field: 'expirationDate',
      headerName: 'Cancelled',
      width: 120,
      valueFormatter: (value: string) => value ? format(new Date(value), 'MM/dd/yyyy') : '-',
    },
    {
      field: 'premium',
      headerName: 'Premium',
      width: 120,
      valueFormatter: (value: number) => `$${(value || 0).toLocaleString()}`,
    },
  ];

  return (
    <Box className="animate-fade-in">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>Cancelled Policies</Typography>
          <Typography color="text.secondary">View cancelled and non-renewed policies</Typography>
        </Box>
      </Box>

      <Card sx={{ mb: 3, p: 2 }}>
        <TextField
          placeholder="Search cancelled policies..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
          sx={{ width: 300 }}
        />
      </Card>

      <Card>
        <DataGrid
          rows={data?.policies || []}
          columns={columns}
          loading={isLoading}
          pageSizeOptions={[10, 25, 50]}
          disableRowSelectionOnClick
          onRowClick={(params) => router.push(`/policies/${params.id}`)}
          sx={{ border: 'none', '& .MuiDataGrid-row:hover': { cursor: 'pointer' } }}
          autoHeight
        />
      </Card>
    </Box>
  );
}
