'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  Box, Typography, Card, CardContent, Grid, Tabs, Tab, Button, Avatar,
  Table, TableBody, TableCell, TableHead, TableRow, CircularProgress,
  LinearProgress, FormControl, InputLabel, Select, MenuItem, Paper, Tooltip,
} from '@mui/material';
import { Download, Assessment, TrendingUp, PictureAsPdf } from '@mui/icons-material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

const COLORS = ['#42a5f5', '#66bb6a', '#ffa726', '#ef5350', '#ab47bc', '#26c6da', '#8d6e63', '#78909c'];

function TabPanel({ children, value, index }: { children: React.ReactNode; value: number; index: number }) {
  return value === index ? <Box sx={{ pt: 3 }}>{children}</Box> : null;
}

export default function ReportsPage() {
  const [tab, setTab] = useState(0);
  const [exportFormat, setExportFormat] = useState('csv');

  const { data: dashboard, isLoading: dashLoading } = useQuery({
    queryKey: ['reports-dashboard'],
    queryFn: () => axios.get('/api/reports/dashboard').then(r => r.data),
  });

  const { data: perfData, isLoading: perfLoading } = useQuery({
    queryKey: ['reports-performance'],
    queryFn: () => axios.get('/api/reports/performance').then(r => r.data),
    enabled: tab === 1,
  });

  const handleExport = () => {
    window.open(`/api/reports/export?format=${exportFormat}&type=claims`, '_blank');
  };

  return (
    <Box className="animate-fade-in">
      {/* Gradient Header */}
      <Paper
        elevation={0}
        sx={{
          p: 3, mb: 3, borderRadius: 3,
          background: 'linear-gradient(135deg, #0d47a1 0%, #1565c0 50%, #1e88e5 100%)',
          color: 'white',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.15)', width: 52, height: 52 }}>
              <Assessment sx={{ fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight={700}>Reports & Analytics</Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>Analytics and insights across your agency</Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Export as PDF">
              <Button variant="outlined" size="small" startIcon={<PictureAsPdf />}
                onClick={() => window.open('/api/export/pdf?type=reports', '_blank')}
                sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}>
                PDF
              </Button>
            </Tooltip>
            <Tooltip title="Export as CSV">
              <Button variant="outlined" size="small" startIcon={<Download />}
                onClick={handleExport}
                sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}>
                CSV
              </Button>
            </Tooltip>
          </Box>
        </Box>
      </Paper>

      <Card sx={{ borderRadius: 2.5, overflow: 'hidden' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto"
          sx={{ borderBottom: '2px solid', borderColor: 'divider', '& .MuiTab-root': { fontWeight: 600, textTransform: 'none' } }}>
          <Tab icon={<Assessment />} iconPosition="start" label="Overview" />
          <Tab icon={<TrendingUp />} iconPosition="start" label="Performance" />
          <Tab icon={<Download />} iconPosition="start" label="Export" />
        </Tabs>

        {/* Overview Tab */}
        <TabPanel value={tab} index={0}>
          <CardContent>
            {dashLoading ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box> : dashboard && (
              <>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  {[
                    { label: 'Total Claims', value: dashboard.totalClaims, color: '#1976d2', bg: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)' },
                    { label: 'Open Claims', value: dashboard.openClaims, color: '#e65100', bg: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)' },
                    { label: 'Closed Claims', value: dashboard.closedClaims, color: '#2e7d32', bg: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)' },
                    { label: 'High Risk', value: dashboard.highRiskClaims, color: '#c62828', bg: 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)' },
                    { label: 'Total Est. Loss', value: `$${Number(dashboard.totalEstimatedLoss || 0).toLocaleString()}`, color: '#0d47a1', bg: 'linear-gradient(135deg, #e3f2fd 0%, #90caf9 100%)' },
                  ].map((stat) => (
                    <Grid item xs={6} md={2.4} key={stat.label}>
                      <Paper elevation={0} sx={{
                        p: 2, borderRadius: 2.5, background: stat.bg, border: '1px solid', borderColor: 'divider',
                        transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-2px)' }, textAlign: 'center',
                      }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.65rem' }}>
                          {stat.label}
                        </Typography>
                        <Typography variant="h4" fontWeight={700} sx={{ color: stat.color, mt: 0.5 }}>
                          {stat.value}
                        </Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>

                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5 }}>
                      <Typography variant="h6" fontWeight={600} gutterBottom>Claims by Status</Typography>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={dashboard.claimsByStatus?.map((s: any) => ({ name: s.status?.replace(/_/g, ' '), count: s.count })) || []}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" fontSize={11} angle={-30} textAnchor="end" height={60} />
                          <YAxis /><RechartsTooltip />
                          <Bar dataKey="count" fill="#42a5f5" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5 }}>
                      <Typography variant="h6" fontWeight={600} gutterBottom>Claims by Type</Typography>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={dashboard.claimsByType?.map((t: any) => ({ name: t.type, value: t.count })) || []}
                            dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100}
                            label={({ name, value }) => `${name}: ${value}`}
                          >
                            {(dashboard.claimsByType || []).map((_: any, i: number) => (
                              <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                          </Pie>
                          <RechartsTooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </Paper>
                  </Grid>
                </Grid>
              </>
            )}
          </CardContent>
        </TabPanel>

        {/* Performance Tab */}
        <TabPanel value={tab} index={1}>
          <CardContent>
            {perfLoading ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box> : perfData && (
              <>
                <Typography variant="h6" fontWeight={600} gutterBottom>Agent Performance</Typography>
                {perfData.agentPerformance?.length > 0 ? (
                  <>
                    <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2.5 }}>
                      <Table size="small" sx={{
                        '& .MuiTableHead-root': { bgcolor: 'grey.50' },
                        '& .MuiTableCell-head': { fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: 0.5, color: 'text.secondary' },
                        '& .MuiTableRow-root:hover': { bgcolor: 'action.hover' },
                      }}>
                        <TableHead>
                          <TableRow>
                            <TableCell>Agent</TableCell>
                            <TableCell>Total Claims</TableCell>
                            <TableCell>Closed</TableCell>
                            <TableCell>Completion Rate</TableCell>
                            <TableCell>This Month</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {perfData.agentPerformance.map((agent: any) => (
                            <TableRow key={agent.agentId}>
                              <TableCell><Typography fontWeight={600}>{agent.agentName}</Typography></TableCell>
                              <TableCell>{agent.totalClaims}</TableCell>
                              <TableCell>{agent.closedClaims}</TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <LinearProgress variant="determinate" value={agent.completionRate}
                                    sx={{ flex: 1, height: 8, borderRadius: 4, bgcolor: 'grey.200', '& .MuiLinearProgress-bar': { borderRadius: 4 } }} />
                                  <Typography variant="body2" fontWeight={600}>{agent.completionRate}%</Typography>
                                </Box>
                              </TableCell>
                              <TableCell>{agent.claimsThisMonth}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </Paper>

                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5 }}>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={perfData.agentPerformance}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="agentName" /><YAxis /><RechartsTooltip /><Legend />
                          <Bar dataKey="totalClaims" fill="#42a5f5" name="Total Claims" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="closedClaims" fill="#66bb6a" name="Closed" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="claimsThisMonth" fill="#ffa726" name="This Month" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </Paper>
                  </>
                ) : (
                  <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>No agent performance data available.</Typography>
                )}
              </>
            )}
          </CardContent>
        </TabPanel>

        {/* Export Tab */}
        <TabPanel value={tab} index={2}>
          <CardContent>
            <Paper variant="outlined" sx={{ p: 3, borderRadius: 2.5 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>Export Data</Typography>
              <Typography color="text.secondary" sx={{ mb: 3 }}>Download claims data in your preferred format.</Typography>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Format</InputLabel>
                    <Select value={exportFormat} label="Format" onChange={(e) => setExportFormat(e.target.value)} sx={{ borderRadius: 2 }}>
                      <MenuItem value="csv">CSV</MenuItem>
                      <MenuItem value="json">JSON</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Button variant="contained" startIcon={<Download />} onClick={handleExport} fullWidth sx={{ borderRadius: 2 }}>
                    Export Claims
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          </CardContent>
        </TabPanel>
      </Card>
    </Box>
  );
}
