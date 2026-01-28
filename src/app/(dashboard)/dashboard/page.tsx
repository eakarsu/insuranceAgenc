'use client';

import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  IconButton,
  Button,
  LinearProgress,
  Skeleton,
} from '@mui/material';
import {
  People,
  Policy,
  RequestQuote,
  ReportProblem,
  AttachMoney,
  TrendingUp,
  TrendingDown,
  ArrowForward,
  Warning,
  CheckCircle,
  Schedule,
  Person,
  Business,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
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

  const StatCard = ({
    title,
    value,
    change,
    icon,
    color,
    subtitle,
    onClick,
  }: {
    title: string;
    value: number | string;
    change?: number;
    icon: React.ReactNode;
    color: string;
    subtitle?: string;
    onClick?: () => void;
  }) => (
    <Card
      className="hover-card"
      sx={{ cursor: onClick ? 'pointer' : 'default' }}
      onClick={onClick}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Box>
            <Typography color="text.secondary" variant="body2" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" fontWeight={700}>
              {typeof value === 'number' && title.includes('$')
                ? `$${value.toLocaleString()}`
                : value.toLocaleString()}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Avatar sx={{ bgcolor: `${color}.light`, color: `${color}.main`, width: 56, height: 56 }}>
            {icon}
          </Avatar>
        </Box>
        {change !== undefined && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {change >= 0 ? (
              <TrendingUp sx={{ color: 'success.main', fontSize: 20 }} />
            ) : (
              <TrendingDown sx={{ color: 'error.main', fontSize: 20 }} />
            )}
            <Typography
              variant="body2"
              sx={{ color: change >= 0 ? 'success.main' : 'error.main' }}
            >
              {Math.abs(change)}% from last month
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'CLIENT_CREATED':
        return <Person sx={{ color: 'primary.main' }} />;
      case 'POLICY_CREATED':
        return <Policy sx={{ color: 'success.main' }} />;
      case 'QUOTE_CREATED':
        return <RequestQuote sx={{ color: 'info.main' }} />;
      case 'CLAIM_REPORTED':
        return <ReportProblem sx={{ color: 'error.main' }} />;
      default:
        return <CheckCircle sx={{ color: 'text.secondary' }} />;
    }
  };

  if (statsLoading) {
    return (
      <Box>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Dashboard
        </Typography>
        <Grid container spacing={3}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Grid item xs={12} sm={6} md={4} lg={2} key={i}>
              <Skeleton variant="rectangular" height={160} sx={{ borderRadius: 3 }} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box className="animate-fade-in">
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Welcome back, {session?.user?.name?.split(' ')[0]}
        </Typography>
        <Typography color="text.secondary">
          Here's what's happening with your agency today.
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard
            title="Total Clients"
            value={stats?.clients.total || 0}
            change={stats?.clients.change}
            icon={<People />}
            color="primary"
            onClick={() => router.push('/clients')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard
            title="Active Policies"
            value={stats?.policies.active || 0}
            subtitle={`${stats?.policies.total || 0} total`}
            change={stats?.policies.change}
            icon={<Policy />}
            color="success"
            onClick={() => router.push('/policies')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard
            title="Open Quotes"
            value={stats?.quotes.pending || 0}
            subtitle={`${stats?.quotes.total || 0} total`}
            change={stats?.quotes.change}
            icon={<RequestQuote />}
            color="info"
            onClick={() => router.push('/quotes')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard
            title="Open Claims"
            value={stats?.claims.open || 0}
            subtitle={`${stats?.claims.total || 0} total`}
            change={stats?.claims.change}
            icon={<ReportProblem />}
            color="error"
            onClick={() => router.push('/claims')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard
            title="Total Premium"
            value={`$${(stats?.premium.total || 0).toLocaleString()}`}
            change={stats?.premium.change}
            icon={<AttachMoney />}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard
            title="Commissions"
            value={`$${(stats?.commissions.total || 0).toLocaleString()}`}
            subtitle={`$${(stats?.commissions.pending || 0).toLocaleString()} pending`}
            change={stats?.commissions.change}
            icon={<AttachMoney />}
            color="secondary"
            onClick={() => router.push('/commissions')}
          />
        </Grid>
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Premium by Month */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" fontWeight={600}>
                  Premium Trend
                </Typography>
                <Button size="small" endIcon={<ArrowForward />}>
                  View Details
                </Button>
              </Box>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData?.premiumTrend || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" stroke="#888" />
                  <YAxis stroke="#888" />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="premium"
                    stroke="#1976d2"
                    strokeWidth={3}
                    dot={{ fill: '#1976d2' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="newBusiness"
                    stroke="#2e7d32"
                    strokeWidth={2}
                    dot={{ fill: '#2e7d32' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Policy Distribution */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Policy Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartData?.policyDistribution || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {(chartData?.policyDistribution || []).map((_: unknown, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                {(chartData?.policyDistribution || []).map((entry: { name: string }, index: number) => (
                  <Chip
                    key={entry.name}
                    label={entry.name}
                    size="small"
                    sx={{
                      backgroundColor: COLORS[index % COLORS.length],
                      color: '#fff',
                    }}
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Bottom Row */}
      <Grid container spacing={3}>
        {/* Recent Activity */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={600}>
                  Recent Activity
                </Typography>
                <Button size="small" endIcon={<ArrowForward />}>
                  View All
                </Button>
              </Box>
              {activitiesLoading ? (
                <Box>
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} height={60} sx={{ mb: 1 }} />
                  ))}
                </Box>
              ) : (
                <List sx={{ py: 0 }}>
                  {activities.slice(0, 5).map((activity) => (
                    <ListItem key={activity.id} sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'grey.100' }}>
                          {getActivityIcon(activity.type)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={activity.title}
                        secondary={
                          <>
                            {activity.description}
                            <Typography
                              component="span"
                              variant="caption"
                              sx={{ display: 'block', color: 'text.secondary' }}
                            >
                              {format(new Date(activity.createdAt), 'MMM d, h:mm a')}
                            </Typography>
                          </>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Upcoming Renewals */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={600}>
                  Upcoming Renewals
                </Typography>
                <Button size="small" endIcon={<ArrowForward />} onClick={() => router.push('/policies/renewals')}>
                  View All
                </Button>
              </Box>
              {renewalsLoading ? (
                <Box>
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} height={60} sx={{ mb: 1 }} />
                  ))}
                </Box>
              ) : (
                <List sx={{ py: 0 }}>
                  {renewals.slice(0, 5).map((renewal) => (
                    <ListItem
                      key={renewal.id}
                      sx={{ px: 0, cursor: 'pointer' }}
                      onClick={() => router.push(`/policies/${renewal.id}`)}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'warning.light' }}>
                          <Schedule sx={{ color: 'warning.main' }} />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={`${renewal.client.firstName} ${renewal.client.lastName}`}
                        secondary={
                          <>
                            {renewal.policyNumber} - {renewal.lineOfBusiness.replace(/_/g, ' ')}
                            <Typography
                              component="span"
                              variant="caption"
                              sx={{ display: 'block', color: 'text.secondary' }}
                            >
                              Expires: {format(new Date(renewal.expirationDate), 'MMM d, yyyy')}
                            </Typography>
                          </>
                        }
                      />
                      <Typography variant="body2" fontWeight={600}>
                        ${renewal.premium.toLocaleString()}
                      </Typography>
                    </ListItem>
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
