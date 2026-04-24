'use client';

import { useState } from 'react';
import { Box, Typography, Card, CardContent, Chip, Button, Select, MenuItem, FormControl, InputLabel, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TextField, InputAdornment, Dialog, DialogContent, DialogActions, IconButton, Avatar, Grid, Divider } from '@mui/material';
import { Search, Close, Warning, AccessTime, Person, Description, Edit, Delete } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const priorityColors: Record<string, 'error' | 'warning' | 'info' | 'default'> = {
  CRITICAL: 'error',
  HIGH: 'warning',
  MEDIUM: 'info',
  LOW: 'default',
};

export default function EscalationsPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [detailEscalation, setDetailEscalation] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: escalations = [], isLoading } = useQuery({
    queryKey: ['escalations', statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      const res = await axios.get(`/api/escalations?${params}`);
      return res.data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      await axios.patch(`/api/escalations/${id}`, data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['escalations'] }),
  });

  const getSLAStatus = (deadline: string) => {
    const now = new Date();
    const sla = new Date(deadline);
    const hoursLeft = (sla.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (hoursLeft < 0) return { label: 'BREACHED', color: 'error' as const };
    if (hoursLeft < 2) return { label: `${Math.round(hoursLeft * 60)}m left`, color: 'warning' as const };
    return { label: `${Math.round(hoursLeft)}h left`, color: 'success' as const };
  };

  const filteredEscalations = escalations.filter((esc: any) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      esc.title?.toString().toLowerCase().includes(s) ||
      esc.description?.toString().toLowerCase().includes(s) ||
      esc.type?.toString().toLowerCase().includes(s) ||
      esc.priority?.toString().toLowerCase().includes(s) ||
      esc.status?.toString().toLowerCase().includes(s) ||
      esc.assignee?.name?.toString().toLowerCase().includes(s)
    );
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>Escalation Queue</Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Search escalations..."
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
              <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
              <MenuItem value="RESOLVED">Resolved</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Priority</TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>SLA</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredEscalations.map((esc: any) => {
              const sla = getSLAStatus(esc.slaDeadline);
              return (
                <TableRow key={esc.id} onClick={() => setDetailEscalation(esc)} sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}>
                  <TableCell><Chip label={esc.priority} color={priorityColors[esc.priority]} size="small" /></TableCell>
                  <TableCell>
                    <Typography fontWeight={600} fontSize="0.875rem">{esc.title}</Typography>
                    <Typography fontSize="0.75rem" color="text.secondary">{esc.description.substring(0, 100)}</Typography>
                  </TableCell>
                  <TableCell>{esc.type}</TableCell>
                  <TableCell><Chip label={esc.status} size="small" variant="outlined" /></TableCell>
                  <TableCell><Chip label={sla.label} color={sla.color} size="small" /></TableCell>
                  <TableCell>
                    {esc.status === 'OPEN' && (
                      <Button size="small" onClick={(e) => { e.stopPropagation(); updateMutation.mutate({ id: esc.id, data: { status: 'IN_PROGRESS' } }); }}>
                        Take
                      </Button>
                    )}
                    {esc.status === 'IN_PROGRESS' && (
                      <Button size="small" color="success" onClick={(e) => { e.stopPropagation(); updateMutation.mutate({ id: esc.id, data: { status: 'RESOLVED', resolution: 'Resolved' } }); }}>
                        Resolve
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
            {filteredEscalations.length === 0 && !isLoading && (
              <TableRow><TableCell colSpan={6} align="center"><Typography color="text.secondary" py={3}>No escalations found</Typography></TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Detail Dialog */}
      <Dialog open={!!detailEscalation} onClose={() => setDetailEscalation(null)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}>
        {detailEscalation && (() => {
          const sla = getSLAStatus(detailEscalation.slaDeadline);
          return (
            <>
              <Box sx={{
                p: 3,
                background: detailEscalation.priority === 'CRITICAL' ? 'linear-gradient(135deg, #b71c1c 0%, #d32f2f 50%, #e53935 100%)'
                  : detailEscalation.priority === 'HIGH' ? 'linear-gradient(135deg, #e65100 0%, #f57c00 50%, #ff9800 100%)'
                  : detailEscalation.priority === 'MEDIUM' ? 'linear-gradient(135deg, #1565c0 0%, #1976d2 50%, #42a5f5 100%)'
                  : 'linear-gradient(135deg, #558b2f 0%, #689f38 50%, #8bc34a 100%)',
                color: 'white',
              }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.15)', width: 52, height: 52 }}>
                      <Warning sx={{ fontSize: 28 }} />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" fontWeight={700}>{detailEscalation.title}</Typography>
                      <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                        <Chip label={detailEscalation.priority} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600, fontSize: '0.7rem' }} />
                        <Chip label={detailEscalation.status} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600, fontSize: '0.7rem' }} />
                      </Box>
                    </Box>
                  </Box>
                  <IconButton onClick={() => setDetailEscalation(null)} sx={{ color: 'white' }}><Close /></IconButton>
                </Box>
              </Box>
              <DialogContent sx={{ p: 3 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#f5f5f5' }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>Description</Typography>
                      <Typography variant="body2" sx={{ mt: 0.5 }}>{detailEscalation.description}</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>Type</Typography>
                    <Typography variant="body2" fontWeight={600} sx={{ mt: 0.5 }}>{detailEscalation.type?.replace(/_/g, ' ')}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>SLA Status</Typography>
                    <Box sx={{ mt: 0.5 }}>
                      <Chip label={sla.label} color={sla.color} size="small" sx={{ fontWeight: 600 }} />
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>SLA Deadline</Typography>
                    <Typography variant="body2" fontWeight={600} sx={{ mt: 0.5 }}>
                      {new Date(detailEscalation.slaDeadline).toLocaleString()}
                    </Typography>
                  </Grid>
                  {detailEscalation.assignee && (
                    <Grid item xs={6} sm={4}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>Assigned To</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                        <Avatar sx={{ width: 24, height: 24, fontSize: '0.7rem', bgcolor: '#1976d2' }}>{detailEscalation.assignee.name?.charAt(0)}</Avatar>
                        <Typography variant="body2" fontWeight={600}>{detailEscalation.assignee.name}</Typography>
                      </Box>
                    </Grid>
                  )}
                  {detailEscalation.resolution && (
                    <Grid item xs={12}>
                      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#e8f5e9', borderColor: '#c8e6c9' }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>Resolution</Typography>
                        <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 500 }}>{detailEscalation.resolution}</Typography>
                      </Paper>
                    </Grid>
                  )}
                  {detailEscalation.createdAt && (
                    <Grid item xs={6} sm={4}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>Created</Typography>
                      <Typography variant="body2" fontWeight={600} sx={{ mt: 0.5 }}>
                        {new Date(detailEscalation.createdAt).toLocaleString()}
                      </Typography>
                    </Grid>
                  )}
                  {detailEscalation.resolvedAt && (
                    <Grid item xs={6} sm={4}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>Resolved At</Typography>
                      <Typography variant="body2" fontWeight={600} sx={{ mt: 0.5 }}>
                        {new Date(detailEscalation.resolvedAt).toLocaleString()}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </DialogContent>
              <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider', justifyContent: 'space-between' }}>
                <Button color="error" variant="outlined" startIcon={<Delete />} onClick={async () => { if (confirm('Delete this escalation?')) { try { await axios.delete(`/api/escalations/${detailEscalation.id}`); queryClient.invalidateQueries({ queryKey: ['escalations'] }); setDetailEscalation(null); } catch {} } }} sx={{ borderRadius: 2 }}>Delete</Button>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button onClick={() => setDetailEscalation(null)} sx={{ borderRadius: 2 }}>Close</Button>
                  {detailEscalation.status === 'OPEN' && (
                    <Button variant="contained" onClick={() => { updateMutation.mutate({ id: detailEscalation.id, data: { status: 'IN_PROGRESS' } }); setDetailEscalation(null); }}
                      sx={{ borderRadius: 2 }}>
                      Take Escalation
                    </Button>
                  )}
                  {detailEscalation.status === 'IN_PROGRESS' && (
                    <Button variant="contained" color="success" onClick={() => { updateMutation.mutate({ id: detailEscalation.id, data: { status: 'RESOLVED', resolution: 'Resolved' } }); setDetailEscalation(null); }}
                      sx={{ borderRadius: 2 }}>
                      Mark Resolved
                    </Button>
                  )}
                  <Button variant="outlined" startIcon={<Edit />} onClick={() => { updateMutation.mutate({ id: detailEscalation.id, data: {} }); setDetailEscalation(null); }}
                    sx={{ borderRadius: 2 }}>Edit</Button>
                </Box>
              </DialogActions>
            </>
          );
        })()}
      </Dialog>
    </Box>
  );
}
