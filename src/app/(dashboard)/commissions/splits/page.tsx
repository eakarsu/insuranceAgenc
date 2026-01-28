'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  Box, Card, CardContent, Typography, Button, Grid, Avatar, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel, Select, MenuItem, Autocomplete,
  Snackbar, Alert, Slider,
} from '@mui/material';
import { MonetizationOn, Add, Person } from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = ['#1976d2', '#2e7d32', '#ed6c02', '#9c27b0', '#f44336'];

export default function ProducerSplitsPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProducer, setSelectedProducer] = useState<any>(null);
  const [selectedCommission, setSelectedCommission] = useState<any>(null);
  const [splitPercentage, setSplitPercentage] = useState(50);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

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
      const response = await axios.get('/api/commissions');
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

  const agentData = agents?.map((agent: any, index: number) => ({
    ...agent,
    totalCommission: Math.floor(Math.random() * 50000) + 10000, // Mock data
    policies: Math.floor(Math.random() * 50) + 10,
    splitPercentage: 100,
  })) || [];

  const pieData = agentData.map((agent: any) => ({
    name: agent.name,
    value: agent.totalCommission,
  }));

  return (
    <Box className="animate-fade-in">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>Producer Splits</Typography>
          <Typography color="text.secondary">Manage commission splits between producers</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => setDialogOpen(true)}>Configure Split</Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={5}>
          <Card>
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
                  <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={7}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>Producer Summary</Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Producer</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell align="right">Policies</TableCell>
                      <TableCell align="right">Total Commission</TableCell>
                      <TableCell align="right">Split %</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {agentData.map((agent: any, index: number) => (
                      <TableRow key={agent.id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ width: 32, height: 32, bgcolor: COLORS[index % COLORS.length] }}>
                              {agent.name?.charAt(0)}
                            </Avatar>
                            {agent.name}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip label={agent.role} size="small" />
                        </TableCell>
                        <TableCell align="right">{agent.policies}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>
                          ${agent.totalCommission.toLocaleString()}
                        </TableCell>
                        <TableCell align="right">{agent.splitPercentage}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Configure Split Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Configure Commission Split</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <Autocomplete
              options={commissionsData?.commissions || []}
              getOptionLabel={(option: any) => `${option.policy?.policyNumber || 'N/A'} - $${Number(option.amount || 0).toLocaleString()}`}
              value={selectedCommission}
              onChange={(_, value) => setSelectedCommission(value)}
              renderInput={(params) => <TextField {...params} label="Select Commission" required />}
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
            <Autocomplete
              options={agents || []}
              getOptionLabel={(option: any) => option.name || ''}
              value={selectedProducer}
              onChange={(_, value) => setSelectedProducer(value)}
              renderInput={(params) => <TextField {...params} label="Select Producer" required />}
              renderOption={(props, option: any) => (
                <li {...props} key={option.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar sx={{ width: 24, height: 24 }}>{option.name?.charAt(0)}</Avatar>
                    <Box>
                      <Typography fontWeight={600}>{option.name}</Typography>
                      <Typography variant="body2" color="text.secondary">{option.role}</Typography>
                    </Box>
                  </Box>
                </li>
              )}
            />
            <Box>
              <Typography gutterBottom>Split Percentage: {splitPercentage}%</Typography>
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
              />
            </Box>
            {selectedCommission && (
              <Card variant="outlined">
                <Box sx={{ p: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">Split Amount</Typography>
                  <Typography variant="h5" fontWeight={700} color="primary.main">
                    ${(Number(selectedCommission.amount) * (splitPercentage / 100)).toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    of ${Number(selectedCommission.amount).toLocaleString()} total commission
                  </Typography>
                </Box>
              </Card>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => createSplitMutation.mutate()}
            disabled={!selectedProducer || !selectedCommission || createSplitMutation.isPending}
          >
            {createSplitMutation.isPending ? 'Configuring...' : 'Configure Split'}
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
