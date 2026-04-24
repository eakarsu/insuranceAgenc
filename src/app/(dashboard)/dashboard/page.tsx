'use client';

import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  Box, Grid, Card, CardContent, Typography, Chip, Avatar, Paper, Tooltip, Divider,
  List, ListItem, ListItemAvatar, ListItemText, Button, Skeleton,
} from '@mui/material';
import {
  People, Policy, RequestQuote, ReportProblem, AttachMoney,
  TrendingUp, TrendingDown, ArrowForward, CheckCircle, Schedule, Person,
  Dashboard, Speed, PictureAsPdf, Download,
} from '@mui/icons-material';
import {
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';

interface DashboardStats {
  clients: { total: number; change: number };
  policies: { total: number; active: number; change: number };
  quotes: { total: number; pending: number; change: number };
  claims: { total: number; open: number; change: number };
  commissions: { total: number; pending: number; change: number };
  premium: { total: number; change: number };
}

interface Activity {
  id: string;
  type: string;
  title: string;
  description: string;
  createdAt: string;
  client?: { firstName: string; lastName: string };
}

interface UpcomingRenewal {
  id: string;
  policyNumber: string;
  client: { firstName: string; lastName: string };
  expirationDate: string;
  premium: number;
  lineOfBusiness: string;
}

const COLORS = ['#1976d2', '#2e7d32', '#ed6c02', '#9c27b0', '#d32f2f'];

export default function DashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      const response = await axios.get('/api/dashboard/stats');
      return response.data;
    },
  });

  const { data: activities = [], isLoading: activitiesLoading } = useQuery<Activity[]>({
    queryKey: ['recentActivities'],
    queryFn: async () => {
      const response = await axios.get('/api/dashboard/activities');
      return response.data;
    },
  });

  const { data: renewals = [], isLoading: renewalsLoading } = useQuery<UpcomingRenewal[]>({
    queryKey: ['upcomingRenewals'],
    queryFn: async () => {
      const response = await axios.get('/api/dashboard/renewals');
      return response.data;
    },
  });

  const { data: chartData } = useQuery({
    queryKey: ['dashboardCharts'],
    queryFn: async () => {
      const response = await axios.get('/api/dashboard/charts');
      return response.data;
    },
  });

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'CLIENT_CREATED': return <Person sx={{ color: '#1976d2' }} />;
      case 'POLICY_CREATED': return <Policy sx={{ color: '#2e7d32' }} />;
      case 'QUOTE_CREATED': return <RequestQuote sx={{ color: '#0288d1' }} />;
      case 'CLAIM_REPORTED': return <ReportProblem sx={{ color: '#d32f2f' }} />;
      default: return <CheckCircle sx={{ color: '#757575' }} />;
    }
  };

  const statCards = [
    { title: 'Total Clients', value: stats?.clients.total || 0, change: stats?.clients.change, icon: <People />, color: '#1565c0', bg: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)', path: '/clients' },
    { title: 'Active Policies', value: stats?.policies.active || 0, subtitle: `${stats?.policies.total || 0} total`, change: stats?.policies.change, icon: <Policy />, color: '#2e7d32', bg: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)', path: '/policies' },
    { title: 'Open Quotes', value: stats?.quotes.pending || 0, subtitle: `${stats?.quotes.total || 0} total`, change: stats?.quotes.change, icon: <RequestQuote />, color: '#0288d1', bg: 'linear-gradient(135deg, #e1f5fe 0%, #b3e5fc 100%)', path: '/quotes' },
    { title: 'Open Claims', value: stats?.claims.open || 0, subtitle: `${stats?.claims.total || 0} total`, change: stats?.claims.change, icon: <ReportProblem />, color: '#c62828', bg: 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)', path: '/claims' },
    { title: 'Total Premium', value: `$${(stats?.premium.total || 0).toLocaleString()}`, change: stats?.premium.change, icon: <AttachMoney />, color: '#e65100', bg: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)', path: '/policies' },
    { title: 'Commissions', value: `$${(stats?.commissions.total || 0).toLocaleString()}`, subtitle: `$${(stats?.commissions.pending || 0).toLocaleString()} pending`, change: stats?.commissions.change, icon: <AttachMoney />, color: '#7b1fa2', bg: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)', path: '/commissions' },
  ];

  if (statsLoading) {
    return (
      <Box>
        <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 3, mb: 3 }} />
        <Grid container spacing={2}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Grid item xs={12} sm={6} md={4} lg={2} key={i}>
              <Skeleton variant="rectangular" height={130} sx={{ borderRadius: 2.5 }} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box className="animate-fade-in">
      {/* Gradient Header */}
      <Paper elevation={0} sx={{
        p: 3, mb: 3, borderRadius: 3,
        background: 'linear-gradient(135deg, #0d47a1 0%, #1565c0 50%, #1e88e5 100%)',
        color: 'white',
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.15)', width: 52, height: 52 }}>
              <Dashboard sx={{ fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight={700}>
                Welcome back, {session?.user?.name?.split(' ')[0] || 'Agent'}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.85 }}>
                Here&apos;s what&apos;s happening with your agency today
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="View Reports">
              <Button variant="outlined" size="small" startIcon={<Speed />}
                onClick={() => router.push('/reports')}
                sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}>
                Reports
              </Button>
            </Tooltip>
          </Box>
        </Box>
      </Paper>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {statCards.map((stat) => (
          <Grid item xs={12} sm={6} md={4} lg={2} key={stat.title}>
            <Paper elevation={0} sx={{
              p: 2, borderRadius: 2.5, background: stat.bg, border: '1px solid', borderColor: 'divider',
              cursor: 'pointer', transition: 'all 0.2s',
              '&:hover': { transform: 'translateY(-3px)', boxShadow: 3 },
            }} onClick={() => router.push(stat.path)}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.65rem' }}>
                    {stat.title}
                  </Typography>
                  <Typography variant="h4" fontWeight={700} sx={{ color: stat.color, mt: 0.5 }}>
                    {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                  </Typography>
                  {stat.subtitle && <Typography variant="caption" color="text.secondary">{stat.subtitle}</Typography>}
                </Box>
                <Avatar sx={{ bgcolor: `${stat.color}20`, color: stat.color, width: 42, height: 42 }}>
                  {stat.icon}
                </Avatar>
              </Box>
              {stat.change !== undefined && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                  {stat.change >= 0 ? <TrendingUp sx={{ color: '#2e7d32', fontSize: 16 }} /> : <TrendingDown sx={{ color: '#c62828', fontSize: 16 }} />}
                  <Typography variant="caption" sx={{ color: stat.change >= 0 ? '#2e7d32' : '#c62828', fontWeight: 600 }}>
                    {Math.abs(stat.change)}% from last month
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 2.5, overflow: 'hidden' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                  <Typography variant="h6" fontWeight={600}>Premium Trend</Typography>
                  <Typography variant="caption" color="text.secondary">Monthly premium and new business tracking</Typography>
                </Box>
                <Button size="small" endIcon={<ArrowForward />} onClick={() => router.push('/commissions')}
                  sx={{ textTransform: 'none', fontWeight: 600 }}>
                  View Details
                </Button>
              </Box>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData?.premiumTrend || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" stroke="#888" fontSize={12} />
                  <YAxis stroke="#888" fontSize={12} />
                  <RechartsTooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }} />
                  <Legend />
                  <Line type="monotone" dataKey="premium" stroke="#1976d2" strokeWidth={3} dot={{ fill: '#1976d2', r: 4 }} name="Premium" />
                  <Line type="monotone" dataKey="newBusiness" stroke="#2e7d32" strokeWidth={2} dot={{ fill: '#2e7d32', r: 3 }} name="New Business" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 2.5, overflow: 'hidden' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>Policy Distribution</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>By line of business</Typography>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={chartData?.policyDistribution || []} cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={5} dataKey="value">
                    {(chartData?.policyDistribution || []).map((_: unknown, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }} />
                </PieChart>
              </ResponsiveContainer>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                {(chartData?.policyDistribution || []).map((entry: { name: string }, index: number) => (
                  <Chip key={entry.name} label={entry.name} size="small"
                    sx={{ backgroundColor: COLORS[index % COLORS.length], color: '#fff', fontWeight: 500, fontSize: '0.7rem', borderRadius: '6px' }} />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Bottom Row */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 2.5, overflow: 'hidden' }}>
            <Box sx={{ px: 3, pt: 2.5, pb: 1.5, bgcolor: 'grey.50', borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" fontWeight={600}>Recent Activity</Typography>
              <Button size="small" endIcon={<ArrowForward />} onClick={() => router.push('/clients')} sx={{ textTransform: 'none', fontWeight: 600 }}>
                View All
              </Button>
            </Box>
            <CardContent sx={{ px: 3 }}>
              {activitiesLoading ? (
                <Box>{[1, 2, 3].map((i) => <Skeleton key={i} height={60} sx={{ mb: 1 }} />)}</Box>
              ) : activities.length === 0 ? (
                <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>No recent activity</Typography>
              ) : (
                <List sx={{ py: 0 }}>
                  {activities.slice(0, 5).map((activity, idx) => (
                    <Box key={activity.id}>
                      <ListItem sx={{ px: 0, py: 1.5 }}>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'grey.100', width: 40, height: 40 }}>{getActivityIcon(activity.type)}</Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={<Typography variant="body2" fontWeight={600}>{activity.title}</Typography>}
                          secondaryTypographyProps={{ component: 'div' }}
                          secondary={
                            <>
                              <Typography variant="caption" color="text.secondary">{activity.description}</Typography>
                              <Typography variant="caption" sx={{ display: 'block', color: 'text.disabled', mt: 0.25 }}>
                                {format(new Date(activity.createdAt), 'MMM d, h:mm a')}
                              </Typography>
                            </>
                          }
                        />
                      </ListItem>
                      {idx < Math.min(activities.length, 5) - 1 && <Divider />}
                    </Box>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 2.5, overflow: 'hidden' }}>
            <Box sx={{ px: 3, pt: 2.5, pb: 1.5, bgcolor: 'grey.50', borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" fontWeight={600}>Upcoming Renewals</Typography>
              <Button size="small" endIcon={<ArrowForward />} onClick={() => router.push('/policies/renewals')} sx={{ textTransform: 'none', fontWeight: 600 }}>
                View All
              </Button>
            </Box>
            <CardContent sx={{ px: 3 }}>
              {renewalsLoading ? (
                <Box>{[1, 2, 3].map((i) => <Skeleton key={i} height={60} sx={{ mb: 1 }} />)}</Box>
              ) : renewals.length === 0 ? (
                <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>No upcoming renewals</Typography>
              ) : (
                <List sx={{ py: 0 }}>
                  {renewals.slice(0, 5).map((renewal, idx) => (
                    <Box key={renewal.id}>
                      <ListItem sx={{ px: 0, py: 1.5, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' }, borderRadius: 1 }}
                        onClick={() => router.push(`/policies/${renewal.id}`)}>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: '#fff3e0', width: 40, height: 40 }}>
                            <Schedule sx={{ color: '#e65100' }} />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={<Typography variant="body2" fontWeight={600}>{renewal.client?.firstName} {renewal.client?.lastName}</Typography>}
                          secondaryTypographyProps={{ component: 'div' }}
                          secondary={
                            <>
                              <Typography variant="caption" color="text.secondary">
                                {renewal.policyNumber} - {renewal.lineOfBusiness?.replace(/_/g, ' ')}
                              </Typography>
                              <Typography variant="caption" sx={{ display: 'block', color: 'text.disabled', mt: 0.25 }}>
                                Expires: {format(new Date(renewal.expirationDate), 'MMM d, yyyy')}
                              </Typography>
                            </>
                          }
                        />
                        <Typography variant="body2" fontWeight={700} sx={{ color: '#2e7d32' }}>
                          ${(renewal.premium || 0).toLocaleString()}
                        </Typography>
                      </ListItem>
                      {idx < Math.min(renewals.length, 5) - 1 && <Divider />}
                    </Box>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
