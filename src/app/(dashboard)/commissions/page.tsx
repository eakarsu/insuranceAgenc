'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  Box, Card, CardContent, Typography, Grid, Chip, Avatar,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  FormControl, InputLabel, Select, MenuItem, Tabs, Tab,
} from '@mui/material';
import { AttachMoney, TrendingUp, Schedule, CheckCircle } from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format } from 'date-fns';

const COLORS = ['#1976d2', '#2e7d32', '#ed6c02', '#9c27b0'];

export default function CommissionsPage() {
  const router = useRouter();
  const [tab, setTab] = useState(0);
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString());

  const { data: stats } = useQuery({
    queryKey: ['commissionStats', yearFilter],
    queryFn: async () => {
      const response = await axios.get(`/api/commissions/stats?year=${yearFilter}`);
      return response.data;
    },
  });

  const { data: commissions } = useQuery({
    queryKey: ['commissions'],
    queryFn: async () => {
      const response = await axios.get('/api/commissions');
      return response.data;
    },
  });

  const StatCard = ({ title, value, icon, color, subtitle }: any) => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography color="text.secondary" variant="body2" gutterBottom>{title}</Typography>
            <Typography variant="h4" fontWeight={700}>{value}</Typography>
            {subtitle && <Typography variant="body2" color="text.secondary">{subtitle}</Typography>}
          </Box>
          <Avatar sx={{ bgcolor: `${color}.light`, color: `${color}.main` }}>{icon}</Avatar>
        </Box>
      </CardContent>
    </Card>
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'success';
      case 'EARNED': return 'info';
      case 'PENDING': return 'warning';
      case 'REVERSED': case 'CHARGEDBACK': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box className="animate-fade-in">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>Commissions</Typography>
          <Typography color="text.secondary">Track earnings and commission statements</Typography>
        </Box>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Year</InputLabel>
          <Select value={yearFilter} label="Year" onChange={(e) => setYearFilter(e.target.value)}>
            <MenuItem value="2024">2024</MenuItem>
            <MenuItem value="2023">2023</MenuItem>
            <MenuItem value="2022">2022</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Total Earned" value={`$${(stats?.totalEarned || 0).toLocaleString()}`}
            icon={<AttachMoney />} color="success" subtitle="This year" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Pending" value={`$${(stats?.pending || 0).toLocaleString()}`}
            icon={<Schedule />} color="warning" subtitle="Awaiting payment" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Paid" value={`$${(stats?.paid || 0).toLocaleString()}`}
            icon={<CheckCircle />} color="primary" subtitle="This year" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="YoY Growth" value={`${stats?.growth || 0}%`}
            icon={<TrendingUp />} color="info" subtitle="vs last year" />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>Monthly Commissions</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats?.monthlyData || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="newBusiness" name="New Business" fill="#1976d2" />
                  <Bar dataKey="renewal" name="Renewal" fill="#2e7d32" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>By Type</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={stats?.byType || []} cx="50%" cy="50%" innerRadius={60} outerRadius={100}
                    paddingAngle={5} dataKey="value">
                    {(stats?.byType || []).map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2, justifyContent: 'center' }}>
                {(stats?.byType || []).map((entry: any, index: number) => (
                  <Chip key={entry.name} label={entry.name} size="small"
                    sx={{ backgroundColor: COLORS[index % COLORS.length], color: '#fff' }} />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)}>
            <Tab label="All Commissions" />
            <Tab label="Pending" />
            <Tab label="Paid" />
          </Tabs>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Policy</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Base Premium</TableCell>
                <TableCell>Rate</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Earned Date</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(commissions?.commissions || [])
                .filter((c: any) => tab === 0 || (tab === 1 && c.status === 'PENDING') || (tab === 2 && c.status === 'PAID'))
                .map((commission: any) => (
                <TableRow key={commission.id} hover sx={{ cursor: 'pointer' }} onClick={() => router.push(`/policies/${commission.policy?.id}`)}>
                  <TableCell>{commission.policy?.policyNumber}</TableCell>
                  <TableCell>{commission.type.replace(/_/g, ' ')}</TableCell>
                  <TableCell>${Number(commission.basePremium || 0).toLocaleString()}</TableCell>
                  <TableCell>{commission.rate}%</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>${Number(commission.amount).toLocaleString()}</TableCell>
                  <TableCell>{commission.earnedDate ? format(new Date(commission.earnedDate), 'MM/dd/yyyy') : '-'}</TableCell>
                  <TableCell><Chip label={commission.status} size="small" color={getStatusColor(commission.status) as any} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
}
