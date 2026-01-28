'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  Box, Card, Typography, Button, TextField, InputAdornment, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem, Autocomplete, Snackbar, Alert,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Add, Search, Description, CloudUpload } from '@mui/icons-material';
import { format } from 'date-fns';

export default function DocumentsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', type: 'OTHER', description: '' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'warning' });

  const { data: clientsData } = useQuery({
    queryKey: ['clients-list'],
    queryFn: async () => {
      const response = await axios.get('/api/clients?limit=100');
      return response.data;
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ['documents', search],
    queryFn: async () => {
      const response = await axios.get(`/api/documents?search=${search}`);
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const formDataToSend = new FormData();
      formDataToSend.append('name', data.name);
      formDataToSend.append('type', data.type);
      formDataToSend.append('description', data.description || '');
      if (selectedClient?.id) {
        formDataToSend.append('clientId', selectedClient.id);
      }
      if (selectedFile) {
        formDataToSend.append('file', selectedFile);
      }
      const response = await axios.post('/api/documents', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setDialogOpen(false);
      setFormData({ name: '', type: 'OTHER', description: '' });
      setSelectedClient(null);
      setSelectedFile(null);
      setSnackbar({ open: true, message: 'Document uploaded successfully', severity: 'success' });
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to upload document', severity: 'error' });
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!formData.name) {
        setFormData({ ...formData, name: file.name.split('.')[0] });
      }
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Document Name', flex: 1.5 },
    { field: 'type', headerName: 'Type', width: 150 },
    {
      field: 'client',
      headerName: 'Client',
      flex: 1,
      valueGetter: (value: any) => value ? `${value.firstName} ${value.lastName}` : '-',
    },
    {
      field: 'uploadedAt',
      headerName: 'Uploaded',
      width: 150,
      valueFormatter: (value: string) => value ? format(new Date(value), 'MM/dd/yyyy') : '-',
    },
    { field: 'fileSize', headerName: 'Size', width: 100 },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => {
        const hasFile = params.row.fileUrl?.startsWith('/uploads/');
        return hasFile ? (
          <Chip label="Available" size="small" color="success" variant="outlined" />
        ) : (
          <Chip label="No file" size="small" color="warning" variant="outlined" />
        );
      },
    },
  ];

  return (
    <Box className="animate-fade-in">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>Documents</Typography>
          <Typography color="text.secondary">Manage client documents and files</Typography>
        </Box>
        <Button variant="contained" startIcon={<CloudUpload />} onClick={() => setDialogOpen(true)}>Upload Document</Button>
      </Box>

      <Card sx={{ mb: 3, p: 2 }}>
        <TextField
          placeholder="Search documents..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
          sx={{ width: 300 }}
        />
      </Card>

      <Card>
        <DataGrid
          rows={data?.documents || []}
          columns={columns}
          loading={isLoading}
          pageSizeOptions={[10, 25, 50]}
          disableRowSelectionOnClick
          onRowClick={(params) => {
            const hasFile = params.row.fileUrl?.startsWith('/uploads/');
            if (hasFile) {
              window.open(params.row.fileUrl, '_blank');
            } else {
              setSnackbar({ open: true, message: 'No file available for this document', severity: 'warning' });
            }
          }}
          sx={{ border: 'none', '& .MuiDataGrid-row:hover': { cursor: 'pointer' } }}
          autoHeight
        />
      </Card>

      {/* Upload Document Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Upload Document</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            {/* File Upload Area */}
            <Box
              sx={{
                border: '2px dashed',
                borderColor: selectedFile ? 'primary.main' : 'grey.300',
                borderRadius: 2,
                p: 3,
                textAlign: 'center',
                bgcolor: selectedFile ? 'primary.50' : 'grey.50',
                cursor: 'pointer',
                '&:hover': { borderColor: 'primary.main', bgcolor: 'primary.50' },
              }}
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <input
                id="file-input"
                type="file"
                hidden
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
              />
              <CloudUpload sx={{ fontSize: 48, color: selectedFile ? 'primary.main' : 'grey.400', mb: 1 }} />
              {selectedFile ? (
                <Box>
                  <Typography fontWeight={600} color="primary.main">{selectedFile.name}</Typography>
                  <Typography variant="body2" color="text.secondary">{formatFileSize(selectedFile.size)}</Typography>
                  <Button size="small" sx={{ mt: 1 }} onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}>
                    Remove
                  </Button>
                </Box>
              ) : (
                <Box>
                  <Typography fontWeight={600}>Click to select a file</Typography>
                  <Typography variant="body2" color="text.secondary">
                    PDF, DOC, XLS, JPG, PNG (max 10MB)
                  </Typography>
                </Box>
              )}
            </Box>

            <Autocomplete
              options={clientsData?.clients || []}
              getOptionLabel={(option: any) => `${option.firstName} ${option.lastName}`}
              value={selectedClient}
              onChange={(_, value) => setSelectedClient(value)}
              renderInput={(params) => <TextField {...params} label="Select Client (Optional)" />}
            />
            <TextField
              label="Document Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
            />
            <FormControl fullWidth>
              <InputLabel>Document Type</InputLabel>
              <Select
                value={formData.type}
                label="Document Type"
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <MenuItem value="ID">ID</MenuItem>
                <MenuItem value="PROOF_OF_ADDRESS">Proof of Address</MenuItem>
                <MenuItem value="POLICY_DOCUMENT">Policy Document</MenuItem>
                <MenuItem value="CLAIM_DOCUMENT">Claim Document</MenuItem>
                <MenuItem value="APPLICATION">Application</MenuItem>
                <MenuItem value="ENDORSEMENT">Endorsement</MenuItem>
                <MenuItem value="INVOICE">Invoice</MenuItem>
                <MenuItem value="RECEIPT">Receipt</MenuItem>
                <MenuItem value="OTHER">Other</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
              multiline
              rows={2}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setDialogOpen(false); setSelectedFile(null); }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => createMutation.mutate(formData)}
            disabled={!formData.name || !selectedFile || createMutation.isPending}
          >
            {createMutation.isPending ? 'Uploading...' : 'Upload Document'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={5000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
