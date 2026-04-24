'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  Box, Card, CardContent, Typography, Button, TextField, InputAdornment, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem, Autocomplete, Snackbar, Alert,
  Paper, Avatar, Grid, Tooltip, Divider, IconButton, List, ListItem, ListItemIcon, ListItemText,
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import {
  Add, Search, Description, CloudUpload, PictureAsPdf, Download, FolderOpen, InsertDriveFile,
  CheckCircle, Warning, Close, Person, CalendarToday, Storage, OpenInNew,
} from '@mui/icons-material';
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
  const [viewDoc, setViewDoc] = useState<any>(null);

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

  const documents = data?.documents || [];

  const stats = useMemo(() => {
    const total = documents.length;
    const available = documents.filter((d: any) => d.fileUrl).length;
    const noFile = total - available;
    const policyDocs = documents.filter((d: any) => ['POLICY_DOCUMENT', 'POLICY'].includes(d.type)).length;
    return { total, available, noFile, policyDocs };
  }, [documents]);

  const getDocTypeColor = (type: string) => {
    switch (type) {
      case 'POLICY_DOCUMENT': return '#1a237e';
      case 'CLAIM_DOCUMENT': return '#c62828';
      case 'ID': return '#2e7d32';
      case 'INVOICE': case 'RECEIPT': return '#e65100';
      default: return '#546e7a';
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'name', headerName: 'Document Name', flex: 1.5, minWidth: 250,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: '#e8eaf6', color: '#1a237e', width: 38, height: 38 }}>
            <InsertDriveFile sx={{ fontSize: 20 }} />
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.95rem', lineHeight: 1.4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {params.value}
            </Typography>
            {params.row.description && (
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                {params.row.description.substring(0, 40)}{params.row.description.length > 40 ? '...' : ''}
              </Typography>
            )}
          </Box>
        </Box>
      ),
    },
    {
      field: 'type', headerName: 'Type', width: 170,
      renderCell: (params) => (
        <Chip
          label={params.value?.replace(/_/g, ' ') || '-'}
          size="small"
          sx={{
            fontWeight: 600, borderRadius: '6px', minWidth: 72,
            bgcolor: `${getDocTypeColor(params.value)}15`,
            color: getDocTypeColor(params.value),
            border: `1px solid ${getDocTypeColor(params.value)}30`,
          }}
        />
      ),
    },
    {
      field: 'client', headerName: 'Client', flex: 1, minWidth: 160,
      valueGetter: (value: any) => value ? `${value.firstName} ${value.lastName}` : '-',
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontSize: '0.875rem', color: '#1a237e', fontWeight: 500 }}>
          {params.value || '-'}
        </Typography>
      ),
    },
    {
      field: 'uploadedAt', headerName: 'Uploaded', width: 150,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.84rem' }}>
          {params.value ? format(new Date(params.value), 'MMM d, yyyy') : '-'}
        </Typography>
      ),
    },
    {
      field: 'fileSize', headerName: 'Size', width: 100,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.84rem' }}>{params.value || '-'}</Typography>
      ),
    },
    {
      field: 'status', headerName: 'Status', width: 130,
      renderCell: (params) => {
        const hasFile = !!params.row.fileUrl;
        return hasFile ? (
          <Chip icon={<CheckCircle sx={{ fontSize: 16 }} />} label="Available" size="small" color="success" variant="outlined" sx={{ fontWeight: 600, borderRadius: '6px' }} />
        ) : (
          <Chip icon={<Warning sx={{ fontSize: 16 }} />} label="No file" size="small" color="warning" variant="outlined" sx={{ fontWeight: 600, borderRadius: '6px' }} />
        );
      },
    },
  ];

  const handleExportCSV = () => {
    const csv = [
      ['Document Name', 'Type', 'Client', 'Uploaded', 'Size', 'Status'].join(','),
      ...documents.map((d: any) => [
        `"${d.name || ''}"`, d.type || '',
        `"${d.client ? `${d.client.firstName} ${d.client.lastName}` : '-'}"`,
        d.uploadedAt ? format(new Date(d.uploadedAt), 'MM/dd/yyyy') : '-',
        d.fileSize || '-',
        d.fileUrl ? 'Available' : 'No file',
      ].join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `documents-${new Date().toISOString().split('T')[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <Box className="animate-fade-in">
      {/* Gradient Header */}
      <Paper elevation={0} sx={{
        p: 3, mb: 3, borderRadius: 3,
        background: 'linear-gradient(135deg, #1a237e 0%, #283593 50%, #3949ab 100%)',
        color: 'white',
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.15)', width: 52, height: 52 }}>
              <FolderOpen sx={{ fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight={700}>Documents</Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>Manage client documents and files</Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Export as PDF">
              <Button variant="outlined" size="small" startIcon={<PictureAsPdf />}
                onClick={() => window.open('/api/export/pdf?type=documents', '_blank')}
                sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}>
                PDF
              </Button>
            </Tooltip>
            <Tooltip title="Export as CSV">
              <Button variant="outlined" size="small" startIcon={<Download />}
                onClick={handleExportCSV}
                sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}>
                CSV
              </Button>
            </Tooltip>
            <Button variant="contained" startIcon={<CloudUpload />} onClick={() => setDialogOpen(true)}
              sx={{ bgcolor: 'white', color: '#1a237e', fontWeight: 600, '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' } }}>
              Upload Document
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Stats Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Total Documents', value: stats.total, icon: <Description />, color: '#1a237e', bg: 'linear-gradient(135deg, #e8eaf6 0%, #c5cae9 100%)' },
          { label: 'Available Files', value: stats.available, icon: <CheckCircle />, color: '#2e7d32', bg: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)' },
          { label: 'Missing Files', value: stats.noFile, icon: <Warning />, color: '#e65100', bg: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)' },
          { label: 'Policy Documents', value: stats.policyDocs, icon: <InsertDriveFile />, color: '#283593', bg: 'linear-gradient(135deg, #e8eaf6 0%, #c5cae9 100%)' },
        ].map((stat) => (
          <Grid item xs={6} sm={3} key={stat.label}>
            <Paper elevation={0} sx={{
              p: 2.5, borderRadius: 2.5, background: stat.bg, border: '1px solid', borderColor: 'divider',
              transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-2px)' },
            }}>
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

      {/* Search/Filter Bar */}
      <Card sx={{ mb: 2, borderRadius: 2.5, overflow: 'visible' }}>
        <CardContent sx={{ py: 2, px: 2.5, '&:last-child': { pb: 2 } }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField fullWidth size="small" placeholder="Search documents by name, type, client..."
                value={search} onChange={(e) => setSearch(e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ color: 'text.secondary' }} /></InputAdornment> }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'grey.50' } }} />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Data Grid */}
      <Card sx={{ borderRadius: 2.5, overflow: 'hidden' }}>
        <DataGrid
          rows={documents}
          columns={columns}
          loading={isLoading}
          pageSizeOptions={[10, 25, 50]}
          disableRowSelectionOnClick
          onRowClick={(params) => setViewDoc(params.row)}
          rowHeight={72}
          sx={{
            border: 'none',
            '& .MuiDataGrid-columnHeaders': { bgcolor: 'grey.50', borderBottom: '2px solid', borderColor: 'divider' },
            '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: 0.5, color: 'text.secondary' },
            '& .MuiDataGrid-row': { cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } },
            '& .MuiDataGrid-cell': { borderColor: 'grey.100', },
            '& .MuiDataGrid-footerContainer': { borderTop: '2px solid', borderColor: 'divider' },
          }}
          autoHeight
        />
      </Card>

      {/* View Document Detail Dialog */}
      <Dialog open={!!viewDoc} onClose={() => setViewDoc(null)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ width: 48, height: 48, bgcolor: viewDoc ? `${getDocTypeColor(viewDoc.type)}15` : '#e8eaf6', color: viewDoc ? getDocTypeColor(viewDoc.type) : '#1a237e' }}>
              <InsertDriveFile />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={600}>{viewDoc?.name}</Typography>
              <Chip
                label={viewDoc?.type?.replace(/_/g, ' ') || '-'}
                size="small"
                sx={{
                  mt: 0.5, fontWeight: 600, borderRadius: '6px',
                  bgcolor: viewDoc ? `${getDocTypeColor(viewDoc.type)}15` : undefined,
                  color: viewDoc ? getDocTypeColor(viewDoc.type) : undefined,
                  border: viewDoc ? `1px solid ${getDocTypeColor(viewDoc.type)}30` : undefined,
                }}
              />
            </Box>
          </Box>
          <IconButton onClick={() => setViewDoc(null)} size="small"><Close /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {viewDoc && (
            <Box>
              {/* Document Info */}
              <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 1 }}>Document Information</Typography>
              <List dense disablePadding>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 40 }}><InsertDriveFile fontSize="small" color="action" /></ListItemIcon>
                  <ListItemText primary="File Name" secondary={viewDoc.fileName || '-'} primaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }} secondaryTypographyProps={{ variant: 'body2', fontWeight: 500, color: 'text.primary' }} />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 40 }}><Storage fontSize="small" color="action" /></ListItemIcon>
                  <ListItemText primary="File Size" secondary={viewDoc.fileSize || '-'} primaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }} secondaryTypographyProps={{ variant: 'body2', fontWeight: 500, color: 'text.primary' }} />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 40 }}><CalendarToday fontSize="small" color="action" /></ListItemIcon>
                  <ListItemText primary="Uploaded" secondary={viewDoc.uploadedAt ? format(new Date(viewDoc.uploadedAt), 'MMMM d, yyyy h:mm a') : '-'} primaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }} secondaryTypographyProps={{ variant: 'body2', fontWeight: 500, color: 'text.primary' }} />
                </ListItem>
              </List>

              {viewDoc.description && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 1 }}>Description</Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>{viewDoc.description}</Typography>
                </>
              )}

              <Divider sx={{ my: 2 }} />
              <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 1 }}>Associations</Typography>
              <List dense disablePadding>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 40 }}><Person fontSize="small" color="action" /></ListItemIcon>
                  <ListItemText primary="Client" secondary={viewDoc.client ? `${viewDoc.client.firstName} ${viewDoc.client.lastName}` : 'Not assigned'} primaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }} secondaryTypographyProps={{ variant: 'body2', fontWeight: 500, color: 'text.primary' }} />
                </ListItem>
                {viewDoc.policy && (
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 40 }}><Description fontSize="small" color="action" /></ListItemIcon>
                    <ListItemText primary="Policy" secondary={viewDoc.policy.policyNumber} primaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }} secondaryTypographyProps={{ variant: 'body2', fontWeight: 500, color: 'text.primary' }} />
                  </ListItem>
                )}
                {viewDoc.claim && (
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 40 }}><Warning fontSize="small" color="action" /></ListItemIcon>
                    <ListItemText primary="Claim" secondary={viewDoc.claim.claimNumber} primaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }} secondaryTypographyProps={{ variant: 'body2', fontWeight: 500, color: 'text.primary' }} />
                  </ListItem>
                )}
              </List>

              {viewDoc.fileUrl?.startsWith('/uploads/') && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Alert severity="success" icon={<CheckCircle />} sx={{ borderRadius: 2 }}>
                    File is available for download.
                  </Alert>
                </>
              )}
              {viewDoc.fileUrl && !viewDoc.fileUrl.startsWith('/uploads/') && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Alert severity="info" sx={{ borderRadius: 2 }}>
                    This is a system-generated document record. The physical file is not stored in the uploads directory.
                  </Alert>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setViewDoc(null)} sx={{ borderRadius: 2 }}>Close</Button>
          {viewDoc?.fileUrl?.startsWith('/uploads/') && (
            <Button
              variant="contained"
              startIcon={<OpenInNew />}
              onClick={() => window.open(viewDoc.fileUrl, '_blank')}
              sx={{ borderRadius: 2, bgcolor: '#1a237e', '&:hover': { bgcolor: '#283593' } }}
            >
              Open File
            </Button>
          )}
          {viewDoc?.client && (
            <Button
              variant="outlined"
              startIcon={<Person />}
              onClick={() => { setViewDoc(null); router.push(`/clients/${viewDoc.client.id}`); }}
              sx={{ borderRadius: 2 }}
            >
              View Client
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Upload Document Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ width: 48, height: 48, bgcolor: '#1a237e' }}>
              <CloudUpload />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={600}>Upload Document</Typography>
              <Typography variant="body2" color="text.secondary">Upload a new document to the system</Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            {/* File Upload Area */}
            <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 1 }}>File Upload</Typography>
            <Box
              sx={{
                border: '2px dashed',
                borderColor: selectedFile ? '#1a237e' : 'grey.300',
                borderRadius: 2.5,
                p: 3,
                textAlign: 'center',
                bgcolor: selectedFile ? '#e8eaf6' : 'grey.50',
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': { borderColor: '#1a237e', bgcolor: '#e8eaf6' },
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
              <CloudUpload sx={{ fontSize: 48, color: selectedFile ? '#1a237e' : 'grey.400', mb: 1 }} />
              {selectedFile ? (
                <Box>
                  <Typography fontWeight={600} color="#1a237e">{selectedFile.name}</Typography>
                  <Typography variant="body2" color="text.secondary">{formatFileSize(selectedFile.size)}</Typography>
                  <Button size="small" sx={{ mt: 1, color: '#1a237e' }} onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}>
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

            <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 1, mt: 1 }}>Document Details</Typography>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
            </Paper>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => { setDialogOpen(false); setSelectedFile(null); }} sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => createMutation.mutate(formData)}
            disabled={!formData.name || !selectedFile || createMutation.isPending}
            sx={{ borderRadius: 2, bgcolor: '#1a237e', '&:hover': { bgcolor: '#283593' } }}
          >
            {createMutation.isPending ? 'Uploading...' : 'Upload Document'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={5000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })} sx={{ borderRadius: 2 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
