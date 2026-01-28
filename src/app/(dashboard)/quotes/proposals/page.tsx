'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  Box, Card, Typography, Button, Chip, TextField, InputAdornment,
  Dialog, DialogTitle, DialogContent, DialogActions, Autocomplete, Snackbar, Alert,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Search, Summarize, Send } from '@mui/icons-material';
import { format } from 'date-fns';

export default function ProposalsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<any>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const { data, isLoading } = useQuery({
    queryKey: ['proposals', search],
    queryFn: async () => {
      const response = await axios.get(`/api/quotes?status=PROPOSED&search=${search}`);
      return response.data;
    },
  });

  // Fetch quotes that can be converted to proposals (QUOTED status)
  const { data: quotesData } = useQuery({
    queryKey: ['quotes-for-proposal'],
    queryFn: async () => {
      const response = await axios.get('/api/quotes?status=QUOTED');
      return response.data;
    },
  });

  const sendProposalMutation = useMutation({
    mutationFn: async () => {
      if (!selectedQuote) return;
      // Update quote status to PROPOSED
      const response = await axios.patch(`/api/quotes/${selectedQuote.id}`, {
        status: 'PROPOSED',
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      queryClient.invalidateQueries({ queryKey: ['quotes-for-proposal'] });
      setDialogOpen(false);
      setSelectedQuote(null);
      setSnackbar({ open: true, message: 'Proposal sent successfully', severity: 'success' });
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to send proposal', severity: 'error' });
    },
  });

  const columns: GridColDef[] = [
    { field: 'quoteNumber', headerName: 'Quote #', flex: 1 },
    {
      field: 'client',
      headerName: 'Client',
      flex: 1.5,
      valueGetter: (value: any) => value ? `${value.firstName} ${value.lastName}` : '-',
    },
    { field: 'lineOfBusiness', headerName: 'Line of Business', flex: 1, valueFormatter: (value: string) => value?.replace(/_/g, ' ') },
    {
      field: 'totalPremium',
      headerName: 'Premium',
      width: 120,
      valueFormatter: (value: number) => `$${(value || 0).toLocaleString()}`,
    },
    {
      field: 'createdAt',
      headerName: 'Sent Date',
      width: 120,
      valueFormatter: (value: string) => value ? format(new Date(value), 'MM/dd/yyyy') : '-',
    },
    {
      field: 'expiresAt',
      headerName: 'Expires',
      width: 120,
      valueFormatter: (value: string) => value ? format(new Date(value), 'MM/dd/yyyy') : '-',
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => <Chip label={params.value} size="small" color="primary" />,
    },
  ];

  return (
    <Box className="animate-fade-in">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>Proposals</Typography>
          <Typography color="text.secondary">Track sent proposals and their status</Typography>
        </Box>
        <Button variant="contained" startIcon={<Send />} onClick={() => setDialogOpen(true)}>Send New Proposal</Button>
      </Box>

      <Card sx={{ mb: 3, p: 2 }}>
        <TextField
          placeholder="Search proposals..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
          sx={{ width: 300 }}
        />
      </Card>

      <Card>
        <DataGrid
          rows={data?.quotes || []}
          columns={columns}
          loading={isLoading}
          pageSizeOptions={[10, 25, 50]}
          disableRowSelectionOnClick
          onRowClick={(params) => router.push(`/quotes/${params.id}`)}
          sx={{ border: 'none', '& .MuiDataGrid-row:hover': { cursor: 'pointer' } }}
          autoHeight
        />
      </Card>

      {/* Send Proposal Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Send New Proposal</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <Autocomplete
              options={quotesData?.quotes || []}
              getOptionLabel={(option: any) => `${option.quoteNumber} - ${option.client?.firstName} ${option.client?.lastName}`}
              value={selectedQuote}
              onChange={(_, value) => setSelectedQuote(value)}
              renderInput={(params) => <TextField {...params} label="Select Quote to Send as Proposal" required />}
              renderOption={(props, option: any) => (
                <li {...props} key={option.id}>
                  <Box>
                    <Typography fontWeight={600}>{option.quoteNumber}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {option.client?.firstName} {option.client?.lastName} - ${Number(option.totalPremium || 0).toLocaleString()}
                    </Typography>
                  </Box>
                </li>
              )}
            />
            {selectedQuote && (
              <Card variant="outlined">
                <Box sx={{ p: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">Quote Details</Typography>
                  <Typography>Client: {selectedQuote.client?.firstName} {selectedQuote.client?.lastName}</Typography>
                  <Typography>Line: {selectedQuote.lineOfBusiness?.replace(/_/g, ' ')}</Typography>
                  <Typography>Premium: ${Number(selectedQuote.totalPremium || 0).toLocaleString()}</Typography>
                </Box>
              </Card>
            )}
            <Typography variant="body2" color="text.secondary">
              Sending this proposal will update the quote status to &quot;PROPOSED&quot; and notify the client.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => sendProposalMutation.mutate()}
            disabled={!selectedQuote || sendProposalMutation.isPending}
            startIcon={<Send />}
          >
            {sendProposalMutation.isPending ? 'Sending...' : 'Send Proposal'}
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
