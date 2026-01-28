'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Box, Card, Typography, Button, TextField, InputAdornment } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Add, Search, Business } from '@mui/icons-material';

export default function CommercialClientsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const { data, isLoading } = useQuery({
    queryKey: ['commercial-clients', page, pageSize, search],
    queryFn: async () => {
      const response = await axios.get(`/api/clients?type=COMMERCIAL&page=${page + 1}&limit=${pageSize}&search=${search}`);
      return response.data;
    },
  });

  const columns: GridColDef[] = [
    { field: 'businessName', headerName: 'Business Name', flex: 1.5 },
    { field: 'firstName', headerName: 'Contact First', flex: 1 },
    { field: 'lastName', headerName: 'Contact Last', flex: 1 },
    { field: 'email', headerName: 'Email', flex: 1.5 },
    { field: 'phone', headerName: 'Phone', flex: 1 },
    { field: 'businessType', headerName: 'Industry', flex: 1 },
    { field: 'status', headerName: 'Status', width: 100 },
  ];

  return (
    <Box className="animate-fade-in">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>Commercial Lines Clients</Typography>
          <Typography color="text.secondary">Manage business insurance clients</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => router.push('/clients/new')}>
          Add Client
        </Button>
      </Box>

      <Card sx={{ mb: 3, p: 2 }}>
        <TextField
          placeholder="Search commercial clients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
          sx={{ width: 300 }}
        />
      </Card>

      <Card>
        <DataGrid
          rows={data?.clients || []}
          columns={columns}
          rowCount={data?.pagination?.total || 0}
          loading={isLoading}
          pageSizeOptions={[10, 25, 50]}
          paginationMode="server"
          paginationModel={{ page, pageSize }}
          onPaginationModelChange={(model) => { setPage(model.page); setPageSize(model.pageSize); }}
          disableRowSelectionOnClick
          onRowClick={(params) => router.push(`/clients/${params.id}`)}
          sx={{ border: 'none', '& .MuiDataGrid-row:hover': { cursor: 'pointer' } }}
          autoHeight
        />
      </Card>
    </Box>
  );
}
