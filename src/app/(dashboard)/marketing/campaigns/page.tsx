'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  Box, Button, Card, CardContent, Typography, Grid, Chip, IconButton, Menu, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel, Select,
  LinearProgress, Avatar, Paper, Tooltip, InputAdornment, Divider, ListItemIcon, ListItemText,
} from '@mui/material';
import {
  Add, MoreVert, Edit, Delete, Send, Visibility, Campaign, Email, Sms, Mail,
  Close, Search, FilterList, PictureAsPdf, TrendingUp, People, Drafts, Download,
} from '@mui/icons-material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { format } from 'date-fns';

export default function CampaignsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', type: 'EMAIL', subject: '', content: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['campaigns', page, pageSize, search, statusFilter, typeFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page + 1), limit: String(pageSize),
        ...(search && { search }), ...(statusFilter && { status: statusFilter }),
        ...(typeFilter && { type: typeFilter }),
      });
      const response = await axios.get(`/api/marketing/campaigns?${params}`);
      return response.data;
    },
  });

  const campaigns = data?.campaigns || [];
  const totalCount = data?.pagination?.total || 0;

  const stats = useMemo(() => {
    const sent = campaigns.filter((c: any) => c.status === 'SENT').length;
    const totalRecipients = campaigns.reduce((acc: number, c: any) => acc + (c.recipientCount || 0), 0);
    const totalOpens = campaigns.reduce((acc: number, c: any) => acc + (c.openCount || 0), 0);
    return { sent, totalRecipients, totalOpens };
  }, [campaigns]);

  const createMutation = useMutation({
    mutationFn: async (data: any) => { await axios.post('/api/marketing/campaigns', data); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      setDialogOpen(false);
      setFormData({ name: '', type: 'EMAIL', subject: '', content: '' });
    },
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'EMAIL': return <Email sx={{ fontSize: '15px !important' }} />;
      case 'SMS': return <Sms sx={{ fontSize: '15px !important' }} />;
      case 'MAIL': return <Mail sx={{ fontSize: '15px !important' }} />;
      default: return <Campaign sx={{ fontSize: '15px !important' }} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'default';
      case 'SCHEDULED': return 'info';
      case 'SENDING': return 'warning';
      case 'SENT': return 'success';
      case 'CANCELLED': return 'error';
      default: return 'default';
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'name', headerName: 'Campaign', flex: 1.5, minWidth: 280,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ overflow: 'hidden' }}>
          <Typography variant="body1" fontWeight={600} sx={{ fontSize: '0.95rem', lineHeight: 1.4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {params.value}
          </Typography>
          {params.row.subject && (
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {params.row.subject}
            </Typography>
          )}
        </Box>
      ),
    },
    {
      field: 'type', headerName: 'Type', width: 150,
      renderCell: (params) => (
        <Chip icon={getTypeIcon(params.value)} label={params.value}
          size="small" variant="outlined" sx={{ fontWeight: 500, borderRadius: '6px' }} />
      ),
    },
    {
      field: 'recipientCount', headerName: 'Recipients', width: 120, align: 'center', headerAlign: 'center',
      renderCell: (params) => (
        <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.9rem' }}>
          {params.value || 0}
        </Typography>
      ),
    },
    {
      field: 'performance', headerName: 'Performance', width: 200,
      renderCell: (params: GridRenderCellParams) => {
        if (params.row.status !== 'SENT') return <Typography variant="body2" color="text.secondary">-</Typography>;
        const openRate = params.row.recipientCount ? Math.round((params.row.openCount / params.row.recipientCount) * 100) : 0;
        return (
          <Box sx={{ width: '100%', pr: 1 }}>
            <Typography variant="caption" color="text.secondary">
              {params.row.openCount || 0} opens ({openRate}%)
            </Typography>
            <LinearProgress variant="determinate" value={openRate}
              sx={{ height: 6, borderRadius: 3, bgcolor: 'grey.200', '& .MuiLinearProgress-bar': { borderRadius: 3 } }} />
          </Box>
        );
      },
    },
    {
      field: 'status', headerName: 'Status', width: 130,
      renderCell: (params) => (
        <Chip label={params.value?.toString().charAt(0) + params.value?.toString().slice(1).toLowerCase()}
          size="small" color={getStatusColor(params.value as string) as any}
          sx={{ fontWeight: 600, borderRadius: '6px', minWidth: 72 }} />
      ),
    },
    {
      field: 'date', headerName: 'Date', width: 125,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.84rem' }}>
          {params.row.sentAt ? format(new Date(params.row.sentAt), 'MMM d, yyyy')
            : params.row.scheduledAt ? format(new Date(params.row.scheduledAt), 'MMM d, yyyy') : '-'}
        </Typography>
      ),
    },
    {
      field: 'actions', headerName: '', width: 50, sortable: false,
      renderCell: (params) => (
        <IconButton size="small" onClick={(e) => { e.stopPropagation(); setAnchorEl(e.currentTarget); setSelectedCampaign(params.row); }}
          sx={{ opacity: 0.6, '&:hover': { opacity: 1 } }}>
          <MoreVert fontSize="small" />
        </IconButton>
      ),
    },
  ];

  const hasActiveFilters = search || statusFilter || typeFilter;

  return (
    <Box className="animate-fade-in">
      {/* Header */}
      <Paper elevation={0} sx={{
        p: 3, mb: 3, borderRadius: 3,
        background: 'linear-gradient(135deg, #4a148c 0%, #6a1b9a 50%, #9c27b0 100%)',
        color: 'white',
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.15)', width: 52, height: 52 }}>
              <Campaign sx={{ fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight={700}>Marketing Campaigns</Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>Create, manage, and track marketing campaigns</Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Export as PDF">
              <Button variant="outlined" size="small" startIcon={<PictureAsPdf />}
                onClick={() => window.open('/api/export/pdf?type=campaigns', '_blank')}
                sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}>
                PDF
              </Button>
            </Tooltip>
            <Tooltip title="Export as CSV">
              <Button variant="outlined" size="small" startIcon={<Download />}
                onClick={() => {
                  const csv = [
                    ['Name', 'Type', 'Subject', 'Recipients', 'Opens', 'Clicks', 'Status', 'Date'].join(','),
                    ...campaigns.map((c: any) => [
                      `"${c.name}"`, c.type, `"${c.subject || ''}"`, c.recipientCount || 0,
                      c.openCount || 0, c.clickCount || 0, c.status,
                      c.sentAt ? new Date(c.sentAt).toLocaleDateString() : c.scheduledAt ? new Date(c.scheduledAt).toLocaleDateString() : '',
                    ].join(','))
                  ].join('\n');
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a'); a.href = url;
                  a.download = `campaigns-${new Date().toISOString().split('T')[0]}.csv`;
                  a.click(); URL.revokeObjectURL(url);
                }}
                sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}>
                CSV
              </Button>
            </Tooltip>
            <Button variant="contained" startIcon={<Add />} onClick={() => setDialogOpen(true)}
              sx={{ bgcolor: 'white', color: '#6a1b9a', fontWeight: 600, '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' } }}>
              New Campaign
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Stats Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Total Campaigns', value: totalCount, icon: <Campaign />, color: '#6a1b9a', bg: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)' },
          { label: 'Sent', value: stats.sent, icon: <Send />, color: '#2e7d32', bg: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)' },
          { label: 'Recipients', value: stats.totalRecipients, icon: <People />, color: '#1976d2', bg: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)' },
          { label: 'Total Opens', value: stats.totalOpens, icon: <TrendingUp />, color: '#e65100', bg: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)' },
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

      {/* Filters */}
      <Card sx={{ mb: 2, borderRadius: 2.5, overflow: 'visible' }}>
        <CardContent sx={{ py: 2, px: 2.5, '&:last-child': { pb: 2 } }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField fullWidth size="small" placeholder="Search by campaign name, subject..."
                value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ color: 'text.secondary' }} /></InputAdornment> }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'grey.50' } }} />
            </Grid>
            <Grid item xs={6} sm={3} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select value={statusFilter} label="Status" onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }} sx={{ borderRadius: 2 }}>
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="DRAFT">Draft</MenuItem>
                  <MenuItem value="SCHEDULED">Scheduled</MenuItem>
                  <MenuItem value="SENDING">Sending</MenuItem>
                  <MenuItem value="SENT">Sent</MenuItem>
                  <MenuItem value="CANCELLED">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={3} md={2.5}>
              <FormControl fullWidth size="small">
                <InputLabel>Type</InputLabel>
                <Select value={typeFilter} label="Type" onChange={(e) => { setTypeFilter(e.target.value); setPage(0); }} sx={{ borderRadius: 2 }}>
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="EMAIL">Email</MenuItem>
                  <MenuItem value="SMS">SMS</MenuItem>
                  <MenuItem value="MAIL">Direct Mail</MenuItem>
                  <MenuItem value="RENEWAL_REMINDER">Renewal Reminder</MenuItem>
                  <MenuItem value="CROSS_SELL">Cross-Sell</MenuItem>
                  <MenuItem value="NEWSLETTER">Newsletter</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3.5}>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                {hasActiveFilters && (
                  <Button variant="text" size="small" startIcon={<FilterList />}
                    onClick={() => { setSearch(''); setStatusFilter(''); setTypeFilter(''); setPage(0); }}
                    sx={{ textTransform: 'none' }}>
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
          rows={campaigns} columns={columns} rowCount={totalCount}
          loading={isLoading} pageSizeOptions={[10, 25, 50]} paginationMode="server"
          paginationModel={{ page, pageSize }}
          onPaginationModelChange={(model) => { setPage(model.page); setPageSize(model.pageSize); }}
          disableRowSelectionOnClick
          onRowClick={(params) => { setSelectedCampaign(params.row); setDetailDialogOpen(true); }}
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

      {/* Actions Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}
        PaperProps={{ sx: { borderRadius: 2, minWidth: 160, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' } }}>
        <MenuItem onClick={() => { setDetailDialogOpen(true); setAnchorEl(null); }}>
          <ListItemIcon><Visibility fontSize="small" /></ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { router.push(`/marketing/campaigns/${selectedCampaign?.id}/edit`); setAnchorEl(null); }}>
          <ListItemIcon><Edit fontSize="small" /></ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        {selectedCampaign?.status === 'DRAFT' && (
          <MenuItem onClick={async () => {
            try {
              await axios.patch(`/api/marketing/campaigns/${selectedCampaign?.id}`, { status: 'SENDING' });
              queryClient.invalidateQueries({ queryKey: ['campaigns'] });
            } catch (e) { console.error('Failed to send'); }
            setAnchorEl(null);
          }}>
            <ListItemIcon><Send fontSize="small" /></ListItemIcon>
            <ListItemText>Send</ListItemText>
          </MenuItem>
        )}
        <Divider />
        <MenuItem onClick={async () => {
          if (confirm('Delete this campaign?')) {
            try {
              await axios.delete(`/api/marketing/campaigns/${selectedCampaign?.id}`);
              queryClient.invalidateQueries({ queryKey: ['campaigns'] });
            } catch (e) { console.error('Failed to delete'); }
          }
          setAnchorEl(null);
        }} sx={{ color: 'error.main' }}>
          <ListItemIcon><Delete fontSize="small" color="error" /></ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      {/* Row Detail Dialog */}
      <Dialog open={detailDialogOpen} onClose={() => setDetailDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}>
        <Box sx={{ background: 'linear-gradient(135deg, #4a148c 0%, #6a1b9a 50%, #9c27b0 100%)', color: 'white', px: 3, py: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.15)', width: 52, height: 52 }}>
              <Campaign sx={{ fontSize: 28 }} />
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" fontWeight={700}>{selectedCampaign?.name}</Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                <Chip icon={getTypeIcon(selectedCampaign?.type)} label={selectedCampaign?.type}
                  size="small" sx={{ fontWeight: 700, bgcolor: 'rgba(255,255,255,0.2)', color: 'white', borderRadius: '6px', '& .MuiChip-icon': { color: 'white' } }} />
                <Chip label={selectedCampaign?.status?.charAt(0) + (selectedCampaign?.status?.slice(1).toLowerCase() || '')}
                  size="small" sx={{ fontWeight: 700, bgcolor: 'rgba(255,255,255,0.2)', color: 'white', borderRadius: '6px' }} />
              </Box>
            </Box>
            <IconButton onClick={() => setDetailDialogOpen(false)} size="small" sx={{ color: 'white' }}><Close /></IconButton>
          </Box>
        </Box>
        <DialogContent dividers>
          <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 1 }}>Content</Typography>
          <Paper variant="outlined" sx={{ p: 2, mb: 2.5, mt: 1, borderRadius: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">Subject</Typography>
                <Typography variant="body2">{selectedCampaign?.subject || '-'}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">Content</Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{selectedCampaign?.content || '-'}</Typography>
              </Grid>
            </Grid>
          </Paper>

          <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 1 }}>Performance</Typography>
          <Paper variant="outlined" sx={{ p: 2, mb: 2.5, mt: 1, borderRadius: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={3}>
                <Box sx={{ textAlign: 'center', p: 1 }}>
                  <Typography variant="h5" fontWeight={700} color="primary.main">{selectedCampaign?.recipientCount || 0}</Typography>
                  <Typography variant="caption" color="text.secondary">Recipients</Typography>
                </Box>
              </Grid>
              <Grid item xs={3}>
                <Box sx={{ textAlign: 'center', p: 1 }}>
                  <Typography variant="h5" fontWeight={700} color="success.main">{selectedCampaign?.openCount || 0}</Typography>
                  <Typography variant="caption" color="text.secondary">Opens</Typography>
                </Box>
              </Grid>
              <Grid item xs={3}>
                <Box sx={{ textAlign: 'center', p: 1 }}>
                  <Typography variant="h5" fontWeight={700} color="info.main">{selectedCampaign?.clickCount || 0}</Typography>
                  <Typography variant="caption" color="text.secondary">Clicks</Typography>
                </Box>
              </Grid>
              <Grid item xs={3}>
                <Box sx={{ textAlign: 'center', p: 1 }}>
                  <Typography variant="h5" fontWeight={700} color="warning.main">{selectedCampaign?.responseCount || 0}</Typography>
                  <Typography variant="caption" color="text.secondary">Responses</Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>

          <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 1 }}>Schedule</Typography>
          <Paper variant="outlined" sx={{ p: 2, mt: 1, borderRadius: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Scheduled</Typography>
                <Typography variant="body2">{selectedCampaign?.scheduledAt ? format(new Date(selectedCampaign.scheduledAt), 'MMM d, yyyy h:mm a') : '-'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Sent</Typography>
                <Typography variant="body2">{selectedCampaign?.sentAt ? format(new Date(selectedCampaign.sentAt), 'MMM d, yyyy h:mm a') : '-'}</Typography>
              </Grid>
            </Grid>
          </Paper>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider', justifyContent: 'space-between' }}>
          <Button color="error" variant="outlined" startIcon={<Delete />} onClick={async () => {
            if (confirm('Delete this campaign?')) {
              try {
                await axios.delete(`/api/marketing/campaigns/${selectedCampaign?.id}`);
                queryClient.invalidateQueries({ queryKey: ['campaigns'] });
                setDetailDialogOpen(false);
              } catch (e) { console.error('Failed to delete'); }
            }
          }} sx={{ borderRadius: 2 }}>Delete</Button>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button onClick={() => setDetailDialogOpen(false)} sx={{ borderRadius: 2 }}>Close</Button>
            <Button variant="contained" startIcon={<Edit />} onClick={() => { setDetailDialogOpen(false); router.push(`/marketing/campaigns/${selectedCampaign?.id}/edit`); }}
              sx={{ borderRadius: 2, bgcolor: '#6a1b9a', '&:hover': { bgcolor: '#4a148c' } }}>
              Edit Campaign
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* Create Campaign Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle>Create Campaign</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={8}>
              <TextField fullWidth label="Campaign Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select value={formData.type} label="Type" onChange={(e) => setFormData({ ...formData, type: e.target.value })}>
                  <MenuItem value="EMAIL">Email</MenuItem>
                  <MenuItem value="SMS">SMS</MenuItem>
                  <MenuItem value="MAIL">Direct Mail</MenuItem>
                  <MenuItem value="RENEWAL_REMINDER">Renewal Reminder</MenuItem>
                  <MenuItem value="CROSS_SELL">Cross-Sell</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Subject" value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline rows={6} label="Content" value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button variant="contained" onClick={() => createMutation.mutate(formData)} disabled={!formData.name || createMutation.isPending} sx={{ borderRadius: 2 }}>Create</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
