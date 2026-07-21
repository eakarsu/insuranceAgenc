'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  Box, Card, CardContent, Typography, Button, Grid, Avatar, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Autocomplete,
  Snackbar, Alert, Slider, Paper, Tooltip, IconButton, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, InputAdornment,
} from '@mui/material';
import {
  CallSplit, Add, Person, PictureAsPdf, Download, Close, AttachMoney,
  Groups, AccountTree, TrendingUp, Search, Edit, Delete,
} from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';

const COLORS = ['#e65100', '#f57c00', '#ff9800', '#ffb74d', '#ffe0b2'];

export default function ProducerSplitsPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProducer, setSelectedProducer] = useState<any>(null);
  const [selectedCommission, setSelectedCommission] = useState<any>(null);
  const [splitPercentage, setSplitPercentage] = useState(50);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [search, setSearch] = useState('');
  const [detailProducer, setDetailProducer] = useState<any>(null);

  const { data: agents } = useQuery({
    queryKey: ['agents-commissions'],
    queryFn: async () => {
      const response = await axios.get('/api/users?agentsOnly=true');
      return response.data;
    },
  });

  const { data: commissionsData } = useQuery({
    queryKey: ['commissions-for-split'],
    queryFn: async () => {
      const response = await axios.get('/api/commissions?limit=1000');
      return response.data;
    },
  });

  const createSplitMutation = useMutation({
    mutationFn: async () => {
      if (!selectedProducer || !selectedCommission) return;
      const response = await axios.post('/api/commission-splits', {
        commissionId: selectedCommission.id,
        producerId: selectedProducer.id,
        percentage: splitPercentage,
        amount: Number(selectedCommission.amount) * (splitPercentage / 100),
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents-commissions'] });
      queryClient.invalidateQueries({ queryKey: ['commissions-for-split'] });
      setDialogOpen(false);
      setSelectedProducer(null);
      setSelectedCommission(null);
      setSplitPercentage(50);
      setSnackbar({ open: true, message: 'Commission split configured successfully', severity: 'success' });
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to configure split', severity: 'error' });
    },
  });

  const commissions = commissionsData?.commissions || [];
  const agentData = agents?.map((agent: any) => {
    const owned = commissions.filter((commission: any) => commission.agent?.id === agent.id);
    return {
      ...agent,
      totalCommission: owned.reduce((sum: number, commission: any) => sum + Number(commission.amount), 0),
      policies: new Set(owned.map((commission: any) => commission.policy?.id).filter(Boolean)).size,
      splitPercentage: 100,
    };
  }) || [];

  const filteredAgentData = agentData.filter((agent: any) => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (
      (agent.name || '').toLowerCase().includes(s) ||
      (agent.role || '').toLowerCase().includes(s) ||
      String(agent.policies).includes(s) ||
      String(agent.totalCommission).includes(s) ||
      `$${agent.totalCommission.toLocaleString()}`.toLowerCase().includes(s) ||
      `${agent.splitPercentage}%`.includes(s)
    );
  });

  const pieData = agentData.map((agent: any) => ({
    name: agent.name,
    value: agent.totalCommission,
  }));

  const totalCommissions = agentData.reduce((sum: number, a: any) => sum + a.totalCommission, 0);
  const totalPolicies = agentData.reduce((sum: number, a: any) => sum + a.policies, 0);
  const avgSplit = agentData.length > 0 ? Math.round(totalCommissions / agentData.length) : 0;

  return (
    <Box className="animate-fade-in">
      {/* Gradient Header */}
      <Paper elevation={0} sx={{
        p: 3, mb: 3, borderRadius: 3,
        background: 'linear-gradient(135deg, #e65100 0%, #f57c00 50%, #ff9800 100%)',
        color: 'white',
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.15)', width: 52, height: 52 }}>
              <CallSplit sx={{ fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight={700}>Commission Splits</Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>Manage commission splits between producers</Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Export as PDF">
              <Button variant="outlined" size="small" startIcon={<PictureAsPdf />}
                onClick={() => window.open('/api/export/pdf?type=commission-splits', '_blank')}
                sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}>
                PDF
              </Button>
            </Tooltip>
            <Tooltip title="Export as CSV">
              <Button variant="outlined" size="small" startIcon={<Download />}
                onClick={() => {
                  const csv = [
                    ['Producer', 'Role', 'Policies', 'Total Commission', 'Split %'].join(','),
                    ...agentData.map((a: any) => [
                      `"${a.name || ''}"`,
                      a.role || '',
                      a.policies,
                      a.totalCommission,
                      `${a.splitPercentage}%`,
                    ].join(','))
                  ].join('\n');
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a2 = document.createElement('a'); a2.href = url;
                  a2.download = `commission-splits-${new Date().toISOString().split('T')[0]}.csv`;
                  a2.click(); URL.revokeObjectURL(url);
                }}
                sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}>
                CSV
              </Button>
            </Tooltip>
            <Button variant="contained" startIcon={<Add />} onClick={() => setDialogOpen(true)}
              sx={{ bgcolor: 'white', color: '#e65100', fontWeight: 600, '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' } }}>
              Configure Split
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Stats Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Total Commissions', value: `$${totalCommissions.toLocaleString()}`, icon: <AttachMoney />, color: '#2e7d32', bg: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)' },
          { label: 'Producers', value: agentData.length, icon: <Groups />, color: '#e65100', bg: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)' },
          { label: 'Total Policies', value: totalPolicies, icon: <AccountTree />, color: '#1976d2', bg: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)' },
          { label: 'Avg per Producer', value: `$${avgSplit.toLocaleString()}`, icon: <TrendingUp />, color: '#7b1fa2', bg: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)' },
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

      {/* Charts and Table */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={5}>
          <Card sx={{ borderRadius: 2.5 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>Commission Distribution</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={7}>
          <Card sx={{ borderRadius: 2.5, overflow: 'hidden' }}>
            <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
              <Box sx={{ px: 2.5, pt: 2.5, pb: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="h6" fontWeight={600}>Producer Summary</Typography>
                <TextField
                  size="small"
                  placeholder="Search producers..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search sx={{ color: 'text.secondary', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ minWidth: 220, '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'grey.50' } }}
                />
              </Box>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: 0.5, color: 'text.secondary', borderBottom: '2px solid', borderColor: 'divider' }}>
                        Producer
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: 0.5, color: 'text.secondary', borderBottom: '2px solid', borderColor: 'divider' }}>
                        Role
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: 0.5, color: 'text.secondary', borderBottom: '2px solid', borderColor: 'divider' }}>
                        Policies
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: 0.5, color: 'text.secondary', borderBottom: '2px solid', borderColor: 'divider' }}>
                        Total Commission
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: 0.5, color: 'text.secondary', borderBottom: '2px solid', borderColor: 'divider' }}>
                        Split %
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredAgentData.map((agent: any, index: number) => (
                      <TableRow key={agent.id} onClick={() => setDetailProducer(agent)} sx={{
                        height: 72,
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' },
                        '& td': { borderColor: 'grey.100' },
                      }}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar sx={{ width: 36, height: 36, bgcolor: COLORS[index % COLORS.length], fontSize: '0.8rem', fontWeight: 600 }}>
                              {agent.name?.charAt(0)}
                            </Avatar>
                            <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.9rem' }}>
                              {agent.name}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip label={agent.role} size="small" variant="outlined" sx={{ borderRadius: '6px', fontWeight: 500 }} />
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>{agent.policies}</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight={700} sx={{ fontSize: '0.95rem', color: '#2e7d32' }}>
                            ${agent.totalCommission.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Chip label={`${agent.splitPercentage}%`} size="small"
                            sx={{ bgcolor: '#fff3e0', color: '#e65100', fontWeight: 600, borderRadius: '6px' }} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Producer Detail Dialog */}
      <Dialog open={!!detailProducer} onClose={() => setDetailProducer(null)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}>
        {detailProducer && (
          <>
            <Box sx={{
              p: 3,
              background: 'linear-gradient(135deg, #e65100 0%, #f57c00 50%, #ff9800 100%)',
              color: 'white',
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 52, height: 52, fontSize: '1.2rem', fontWeight: 700 }}>
                    {detailProducer.name?.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight={700}>{detailProducer.name}</Typography>
                    <Chip label={detailProducer.role} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600, fontSize: '0.7rem', mt: 0.5 }} />
                  </Box>
                </Box>
                <IconButton onClick={() => setDetailProducer(null)} sx={{ color: 'white' }}><Close /></IconButton>
              </Box>
            </Box>
            <DialogContent sx={{ p: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, background: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)', borderColor: '#ffcc80' }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>Total Commission</Typography>
                    <Typography variant="h4" fontWeight={700} sx={{ color: '#e65100', mt: 0.5 }}>
                      ${detailProducer.totalCommission?.toLocaleString()}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>Policies</Typography>
                    <Typography variant="h5" fontWeight={700} sx={{ color: '#1976d2', mt: 0.5 }}>
                      {detailProducer.policies}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>Split %</Typography>
                    <Typography variant="h5" fontWeight={700} sx={{ color: '#e65100', mt: 0.5 }}>
                      {detailProducer.splitPercentage}%
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>Avg per Policy</Typography>
                  <Typography variant="body1" fontWeight={700} sx={{ mt: 0.5, color: '#2e7d32' }}>
                    ${detailProducer.policies > 0 ? Math.round(detailProducer.totalCommission / detailProducer.policies).toLocaleString() : '0'}
                  </Typography>
                </Grid>
                {detailProducer.email && (
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>Email</Typography>
                    <Typography variant="body2" fontWeight={600} sx={{ mt: 0.5 }}>{detailProducer.email}</Typography>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider', justifyContent: 'space-between' }}>
              <Button color="error" variant="outlined" startIcon={<Delete />} onClick={async () => { if (confirm('Remove this producer?')) { try { await axios.delete(`/api/users/${detailProducer.id}`); queryClient.invalidateQueries({ queryKey: ['agents-commissions'] }); setDetailProducer(null); } catch {} } }} sx={{ borderRadius: 2 }}>Delete</Button>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button onClick={() => setDetailProducer(null)} sx={{ borderRadius: 2 }}>Close</Button>
                <Button variant="outlined" startIcon={<Edit />} onClick={() => { setDetailProducer(null); }} sx={{ borderRadius: 2 }}>Edit</Button>
                <Button variant="contained" startIcon={<Add />} onClick={() => { setDialogOpen(true); setDetailProducer(null); }}
                  sx={{ borderRadius: 2, bgcolor: '#e65100', '&:hover': { bgcolor: '#bf360c' } }}>
                  Configure Split
                </Button>
              </Box>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Configure Split Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ width: 48, height: 48, bgcolor: '#e65100' }}>
                <CallSplit />
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight={600}>Configure Commission Split</Typography>
                <Typography variant="body2" color="text.secondary">Assign commission split to a producer</Typography>
              </Box>
            </Box>
            <IconButton onClick={() => setDialogOpen(false)} size="small"><Close /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
            <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 1 }}>Select Commission</Typography>
            <Autocomplete
              options={commissionsData?.commissions || []}
              getOptionLabel={(option: any) => `${option.policy?.policyNumber || 'N/A'} - $${Number(option.amount || 0).toLocaleString()}`}
              value={selectedCommission}
              onChange={(_, value) => setSelectedCommission(value)}
              renderInput={(params) => <TextField {...params} label="Select Commission" required
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />}
              renderOption={(props, option: any) => (
                <li {...props} key={option.id}>
                  <Box>
                    <Typography fontWeight={600}>{option.policy?.policyNumber || 'N/A'}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {option.type?.replace(/_/g, ' ')} - ${Number(option.amount || 0).toLocaleString()}
                    </Typography>
                  </Box>
                </li>
              )}
            />

            <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 1 }}>Select Producer</Typography>
            <Autocomplete
              options={agents || []}
              getOptionLabel={(option: any) => option.name || ''}
              value={selectedProducer}
              onChange={(_, value) => setSelectedProducer(value)}
              renderInput={(params) => <TextField {...params} label="Select Producer" required
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />}
              renderOption={(props, option: any) => (
                <li {...props} key={option.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar sx={{ width: 28, height: 28, bgcolor: '#f57c00', fontSize: '0.7rem' }}>{option.name?.charAt(0)}</Avatar>
                    <Box>
                      <Typography fontWeight={600}>{option.name}</Typography>
                      <Typography variant="body2" color="text.secondary">{option.role}</Typography>
                    </Box>
                  </Box>
                </li>
              )}
            />

            <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 1 }}>Split Percentage</Typography>
            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
              <Typography gutterBottom fontWeight={600} sx={{ color: '#e65100' }}>
                Split: {splitPercentage}%
              </Typography>
              <Slider
                value={splitPercentage}
                onChange={(_, value) => setSplitPercentage(value as number)}
                min={0}
                max={100}
                step={5}
                marks={[
                  { value: 0, label: '0%' },
                  { value: 25, label: '25%' },
                  { value: 50, label: '50%' },
                  { value: 75, label: '75%' },
                  { value: 100, label: '100%' },
                ]}
                sx={{
                  color: '#f57c00',
                  '& .MuiSlider-markLabel': { fontSize: '0.75rem' },
                }}
              />
            </Paper>

            {selectedCommission && (
              <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
                <Box sx={{ p: 2, background: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)' }}>
                  <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 1 }}>Split Summary</Typography>
                  <Grid container spacing={2} sx={{ mt: 0.5 }}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Split Amount</Typography>
                      <Typography variant="h5" fontWeight={700} sx={{ color: '#e65100' }}>
                        ${(Number(selectedCommission.amount) * (splitPercentage / 100)).toLocaleString()}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Total Commission</Typography>
                      <Typography variant="h5" fontWeight={700} color="text.secondary">
                        ${Number(selectedCommission.amount).toLocaleString()}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              </Paper>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => createSplitMutation.mutate()}
            disabled={!selectedProducer || !selectedCommission || createSplitMutation.isPending}
            sx={{ borderRadius: 2, bgcolor: '#e65100', '&:hover': { bgcolor: '#bf360c' } }}
          >
            {createSplitMutation.isPending ? 'Configuring...' : 'Configure Split'}
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
