'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  Box, Card, Typography, Button, TextField, InputAdornment, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem, Snackbar, Alert,
  Autocomplete,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Add, Search, Draw } from '@mui/icons-material';
import { format } from 'date-fns';

export default function EndorsementsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<any>(null);
  const [endorsementForm, setEndorsementForm] = useState({ type: 'COVERAGE_CHANGE', description: '', effectiveDate: '', premiumChange: 0 });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const { data: policiesData } = useQuery({
    queryKey: ['policies-list'],
    queryFn: async () => {
      const response = await axios.get('/api/policies?limit=100');
      return response.data;
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ['endorsements', search],
    queryFn: async () => {
      const response = await axios.get(`/api/endorsements?search=${search}`);
      return response.data;
    },
  });

  const columns: GridColDef[] = [
    { field: 'endorsementNumber', headerName: 'Endorsement #', flex: 1 },
    {
      field: 'policy',
      headerName: 'Policy',
      flex: 1,
      valueGetter: (value: any) => value?.policyNumber || '-',
    },
    { field: 'type', headerName: 'Type', flex: 1 },
    {
      field: 'effectiveDate',
      headerName: 'Effective Date',
      width: 130,
      valueFormatter: (value: string) => value ? format(new Date(value), 'MM/dd/yyyy') : '-',
    },
    {
      field: 'premiumChange',
      headerName: 'Premium Change',
      width: 130,
      renderCell: (params) => (
        <Typography color={params.value >= 0 ? 'success.main' : 'error.main'}>
          {params.value >= 0 ? '+' : ''}${params.value}
        </Typography>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => <Chip label={params.value} size="small" />,
    },
  ];

  return (
    <Box className="animate-fade-in">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>Endorsements</Typography>
          <Typography color="text.secondary">Manage policy endorsements and mid-term changes</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => setDialogOpen(true)}>Add Endorsement</Button>
      </Box>

      <Card sx={{ mb: 3, p: 2 }}>
        <TextField
          placeholder="Search endorsements..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
          sx={{ width: 300 }}
        />
      </Card>

      <Card>
        <DataGrid
          rows={data?.endorsements || []}
          columns={columns}
          loading={isLoading}
          pageSizeOptions={[10, 25, 50, 100]}
          disableRowSelectionOnClick
          onRowClick={(params) => router.push(`/policies/${params.row.policyId}`)}
          sx={{ border: 'none', '& .MuiDataGrid-row:hover': { cursor: 'pointer' } }}
          autoHeight
        />
      </Card>

      {/* Add Endorsement Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Endorsement</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <Autocomplete
              options={policiesData?.policies || []}
              getOptionLabel={(option: any) => `${option.policyNumber} - ${option.client?.firstName} ${option.client?.lastName}`}
              value={selectedPolicy}
              onChange={(_, value) => setSelectedPolicy(value)}
              renderInput={(params) => <TextField {...params} label="Select Policy" required />}
            />
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={endorsementForm.type}
                label="Type"
                onChange={(e) => setEndorsementForm({ ...endorsementForm, type: e.target.value })}
              >
                <MenuItem value="COVERAGE_CHANGE">Coverage Change</MenuItem>
                <MenuItem value="ADD_DRIVER">Add Driver</MenuItem>
                <MenuItem value="REMOVE_DRIVER">Remove Driver</MenuItem>
                <MenuItem value="ADD_VEHICLE">Add Vehicle</MenuItem>
                <MenuItem value="REMOVE_VEHICLE">Remove Vehicle</MenuItem>
                <MenuItem value="ADDRESS_CHANGE">Address Change</MenuItem>
                <MenuItem value="NAME_CHANGE">Name Change</MenuItem>
                <MenuItem value="OTHER">Other</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Description"
              value={endorsementForm.description}
              onChange={(e) => setEndorsementForm({ ...endorsementForm, description: e.target.value })}
              fullWidth
              multiline
              rows={2}
            />
            <TextField
              label="Effective Date"
              type="date"
              value={endorsementForm.effectiveDate}
              onChange={(e) => setEndorsementForm({ ...endorsementForm, effectiveDate: e.target.value })}
              fullWidth
              InputLabelProps={{ shrink: true }}
              required
            />
            <TextField
              label="Premium Change ($)"
              type="number"
              value={endorsementForm.premiumChange}
              onChange={(e) => setEndorsementForm({ ...endorsementForm, premiumChange: parseFloat(e.target.value) || 0 })}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={!selectedPolicy || !endorsementForm.effectiveDate}
            onClick={async () => {
              try {
                await axios.post('/api/endorsements', {
                  policyId: selectedPolicy?.id,
                  type: endorsementForm.type,
                  description: endorsementForm.description,
                  effectiveDate: endorsementForm.effectiveDate,
                  premiumChange: endorsementForm.premiumChange,
                  status: 'PENDING',
                });
                queryClient.invalidateQueries({ queryKey: ['endorsements'] });
                setSnackbar({ open: true, message: 'Endorsement added successfully', severity: 'success' });
                setDialogOpen(false);
                setSelectedPolicy(null);
                setEndorsementForm({ type: 'COVERAGE_CHANGE', description: '', effectiveDate: '', premiumChange: 0 });
              } catch {
                setSnackbar({ open: true, message: 'Failed to add endorsement', severity: 'error' });
              }
            }}
          >
            Add Endorsement
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
