'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Typography, Card, Chip, Button, Select, MenuItem, FormControl, InputLabel, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Dialog, DialogTitle, DialogContent, DialogActions, TextField, InputAdornment, Avatar, Grid, IconButton } from '@mui/material';
import { Search, ReportProblem, Close, Edit, Delete } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const statusColors: Record<string, 'default' | 'info' | 'warning' | 'success'> = {
  OPEN: 'warning',
  INVESTIGATING: 'info',
  RESOLVED: 'success',
  CLOSED: 'default',
};

const sentimentColors: Record<string, string> = {
  VERY_NEGATIVE: '#d32f2f',
  NEGATIVE: '#f57c00',
  NEUTRAL: '#757575',
  POSITIVE: '#388e3c',
};

export default function ComplaintsPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [detailComplaint, setDetailComplaint] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [form, setForm] = useState({ source: 'PHONE', category: 'SERVICE', summary: '', description: '' });
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: complaints = [] } = useQuery({
    queryKey: ['complaints', statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      const res = await axios.get(`/api/complaints?${params}`);
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => axios.post('/api/complaints', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complaints'] });
      setCreateOpen(false);
      setForm({ source: 'PHONE', category: 'SERVICE', summary: '', description: '' });
    },
  });

  const filteredComplaints = complaints.filter((c: any) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      c.complaintNumber?.toString().toLowerCase().includes(s) ||
      c.summary?.toString().toLowerCase().includes(s) ||
      c.description?.toString().toLowerCase().includes(s) ||
      c.category?.toString().toLowerCase().includes(s) ||
      c.source?.toString().toLowerCase().includes(s) ||
      c.status?.toString().toLowerCase().includes(s) ||
      c.aiSentiment?.toString().toLowerCase().includes(s) ||
      c.client?.name?.toString().toLowerCase().includes(s)
    );
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>Complaints</Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Search complaints..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ minWidth: 250 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} label="Status">
              <MenuItem value="">All</MenuItem>
              <MenuItem value="OPEN">Open</MenuItem>
              <MenuItem value="INVESTIGATING">Investigating</MenuItem>
              <MenuItem value="RESOLVED">Resolved</MenuItem>
            </Select>
          </FormControl>
          <Button variant="contained" onClick={() => setCreateOpen(true)}>New Complaint</Button>
        </Box>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Number</TableCell>
              <TableCell>Summary</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Source</TableCell>
              <TableCell>Sentiment</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>SLA</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredComplaints.map((c: any) => {
              const slaDate = new Date(c.slaDeadline);
              const isBreached = slaDate < new Date() && c.status !== 'RESOLVED' && c.status !== 'CLOSED';
              return (
                <TableRow key={c.id} hover sx={{ cursor: 'pointer' }} onClick={() => { setDetailComplaint(c); setDetailOpen(true); }}>
                  <TableCell><Typography fontWeight={600} fontSize="0.875rem">{c.complaintNumber}</Typography></TableCell>
                  <TableCell>{c.summary}</TableCell>
                  <TableCell>{c.category}</TableCell>
                  <TableCell>{c.source}</TableCell>
                  <TableCell>
                    {c.aiSentiment && <Chip label={c.aiSentiment} size="small" sx={{ bgcolor: sentimentColors[c.aiSentiment], color: '#fff' }} />}
                  </TableCell>
                  <TableCell><Chip label={c.status} color={statusColors[c.status]} size="small" /></TableCell>
                  <TableCell><Chip label={isBreached ? 'BREACHED' : slaDate.toLocaleDateString()} color={isBreached ? 'error' : 'default'} size="small" /></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}>
        <Box sx={{ background: 'linear-gradient(135deg, #b71c1c 0%, #c62828 50%, #ef5350 100%)', color: 'white', px: 3, py: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.15)', width: 52, height: 52 }}>
              <ReportProblem sx={{ fontSize: 28 }} />
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" fontWeight={700}>Complaint Detail</Typography>
              <Typography variant="body2" sx={{ opacity: 0.85 }}>
                {detailComplaint?.complaintNumber || '-'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {detailComplaint?.status && (
                <Chip label={detailComplaint.status} size="small" sx={{ fontWeight: 700, fontSize: '0.8rem', bgcolor: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }} />
              )}
              {detailComplaint?.aiSentiment && (
                <Chip label={detailComplaint.aiSentiment} size="small" sx={{ fontWeight: 600, fontSize: '0.75rem', bgcolor: 'rgba(255,255,255,0.15)', color: 'white' }} />
              )}
            </Box>
          </Box>
        </Box>
        <DialogContent sx={{ px: 3, py: 3 }}>
          <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 1 }}>Summary</Typography>
          <Paper variant="outlined" sx={{ p: 2, mb: 2.5, mt: 1, borderRadius: 2 }}>
            <Typography variant="body1" fontWeight={600}>{detailComplaint?.summary || '-'}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{detailComplaint?.description || '-'}</Typography>
          </Paper>
          <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 1 }}>Details</Typography>
          <Paper variant="outlined" sx={{ p: 2, mb: 2.5, mt: 1, borderRadius: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Category</Typography>
                <Typography variant="body2" fontWeight={600}>{detailComplaint?.category || '-'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Source</Typography>
                <Typography variant="body2" fontWeight={600}>{detailComplaint?.source || '-'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">AI Classification</Typography>
                <Typography variant="body2">{detailComplaint?.aiClassification || '-'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">SLA Deadline</Typography>
                <Typography variant="body2" sx={{ color: detailComplaint?.slaDeadline && new Date(detailComplaint.slaDeadline) < new Date() && detailComplaint.status !== 'RESOLVED' && detailComplaint.status !== 'CLOSED' ? '#d32f2f' : 'text.primary', fontWeight: 600 }}>
                  {detailComplaint?.slaDeadline ? new Date(detailComplaint.slaDeadline).toLocaleString() : '-'}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
          {detailComplaint?.resolution && (
            <>
              <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 1 }}>Resolution</Typography>
              <Paper variant="outlined" sx={{ p: 2, mt: 1, borderRadius: 2, bgcolor: '#e8f5e9' }}>
                <Typography variant="body2">{detailComplaint.resolution}</Typography>
              </Paper>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider', justifyContent: 'space-between' }}>
          <Button color="error" variant="outlined" startIcon={<Delete />} onClick={async () => { if (confirm('Delete this complaint?')) { try { await axios.delete(`/api/complaints/${detailComplaint?.id}`); queryClient.invalidateQueries({ queryKey: ['complaints'] }); setDetailOpen(false); } catch {} } }} sx={{ borderRadius: 2 }}>Delete</Button>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button onClick={() => setDetailOpen(false)} sx={{ borderRadius: 2 }}>Close</Button>
            <Button variant="contained" startIcon={<Edit />} onClick={() => { setDetailOpen(false); router.push(`/complaints/${detailComplaint?.id}`); }} sx={{ borderRadius: 2, bgcolor: '#c62828', '&:hover': { bgcolor: '#b71c1c' } }}>View Full Detail</Button>
          </Box>
        </DialogActions>
      </Dialog>

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>File Complaint</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <FormControl fullWidth><InputLabel>Source</InputLabel>
            <Select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} label="Source">
              <MenuItem value="PHONE">Phone</MenuItem><MenuItem value="EMAIL">Email</MenuItem>
              <MenuItem value="PORTAL">Portal</MenuItem><MenuItem value="MAIL">Mail</MenuItem>
              <MenuItem value="REGULATORY">Regulatory</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth><InputLabel>Category</InputLabel>
            <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} label="Category">
              <MenuItem value="SERVICE">Service</MenuItem><MenuItem value="BILLING">Billing</MenuItem>
              <MenuItem value="CLAIMS">Claims</MenuItem><MenuItem value="COVERAGE">Coverage</MenuItem>
              <MenuItem value="AGENT_CONDUCT">Agent Conduct</MenuItem><MenuItem value="OTHER">Other</MenuItem>
            </Select>
          </FormControl>
          <TextField label="Summary" value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} fullWidth />
          <TextField label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} fullWidth multiline rows={4} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => createMutation.mutate(form)} disabled={!form.summary || !form.description}>Submit</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
