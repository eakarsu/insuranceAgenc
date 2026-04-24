'use client';

import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  Box, AppBar, Toolbar, Typography, Button, Grid, Card, CardContent, Avatar,
  Paper, Skeleton, Chip,
} from '@mui/material';
import {
  Shield, ReportProblem, Description, AttachMoney, ArrowForward,
  Person, RequestQuote,
} from '@mui/icons-material';

interface CustomerProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  businessName?: string;
}

interface Policy {
  id: string;
  policyNumber: string;
  status: string;
  premium: number;
  lineOfBusiness: string;
}

export default function CustomerDashboardPage() {
  const router = useRouter();

  const { data: profile, isLoading: profileLoading } = useQuery<CustomerProfile>({
    queryKey: ['customerProfile'],
    queryFn: async () => {
      const response = await axios.get('/api/customer/profile');
      return response.data;
    },
  });

  const { data: policies = [], isLoading: policiesLoading } = useQuery<Policy[]>({
    queryKey: ['customerPolicies'],
    queryFn: async () => {
      const response = await axios.get('/api/customer/policies');
      return response.data;
    },
  });

  const activePolicies = policies.filter((p) => p.status === 'ACTIVE').length;
  const totalPremium = policies.reduce((sum, p) => sum + Number(p.premium || 0), 0);
  const pendingQuotes = policies.filter((p) => p.status === 'PENDING').length;

  const isLoading = profileLoading || policiesLoading;

  const statCards = [
    {
      title: 'Active Policies',
      value: activePolicies,
      icon: <Shield />,
      color: '#2e7d32',
      bg: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
    },
    {
      title: 'Open Claims',
      value: 0,
      icon: <ReportProblem />,
      color: '#c62828',
      bg: 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)',
    },
    {
      title: 'Pending Quotes',
      value: pendingQuotes,
      icon: <RequestQuote />,
      color: '#e65100',
      bg: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)',
    },
    {
      title: 'Total Premium',
      value: `$${totalPremium.toLocaleString()}`,
      icon: <AttachMoney />,
      color: '#1565c0',
      bg: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
    },
  ];

  const quickActions = [
    {
      title: 'View Policies',
      description: 'Review your active insurance policies',
      icon: <Shield sx={{ fontSize: 28 }} />,
      color: '#1976d2',
      path: '/portal/policies',
    },
    {
      title: 'File a Claim',
      description: 'Submit a new insurance claim',
      icon: <ReportProblem sx={{ fontSize: 28 }} />,
      color: '#c62828',
      path: '/portal/claims',
    },
    {
      title: 'View Documents',
      description: 'Access your policy documents',
      icon: <Description sx={{ fontSize: 28 }} />,
      color: '#7b1fa2',
      path: '/portal/documents',
    },
  ];

  if (isLoading) {
    return (
      <Box>
        <AppBar position="static" sx={{ mb: 3 }}>
          <Toolbar>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>InsureFlow Customer Portal</Typography>
          </Toolbar>
        </AppBar>
        <Box sx={{ p: 3 }}>
          <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 3, mb: 3 }} />
          <Grid container spacing={2}>
            {[1, 2, 3, 4].map((i) => (
              <Grid item xs={12} sm={6} md={3} key={i}>
                <Skeleton variant="rectangular" height={130} sx={{ borderRadius: 2.5 }} />
              </Grid>
            ))}
          </Grid>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      {/* AppBar */}
      <AppBar position="static" sx={{ mb: 3 }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>InsureFlow Customer Portal</Typography>
          <Button color="inherit" onClick={() => router.push('/portal')}>Dashboard</Button>
          <Button color="inherit" onClick={async () => { await axios.post('/api/customer/auth/logout'); router.push('/portal/login'); }}>Logout</Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 3 }}>
        {/* Welcome Header */}
        <Paper
          elevation={0}
          sx={{
            p: 3, mb: 3, borderRadius: 3,
            background: 'linear-gradient(135deg, #0d47a1 0%, #1565c0 50%, #1e88e5 100%)',
            color: 'white',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.15)', width: 52, height: 52 }}>
              <Person sx={{ fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight={700}>
                Welcome back, {profile?.firstName || 'Customer'}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.85 }}>
                Manage your insurance policies, claims, and documents all in one place
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* Stats Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {statCards.map((stat) => (
            <Grid item xs={12} sm={6} md={3} key={stat.title}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5, borderRadius: 2.5, background: stat.bg,
                  border: '1px solid', borderColor: 'divider',
                  transition: 'all 0.2s',
                  '&:hover': { transform: 'translateY(-3px)', boxShadow: 3 },
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{
                        color: 'text.secondary', fontWeight: 500,
                        textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.68rem',
                      }}
                    >
                      {stat.title}
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

        {/* Quick Actions */}
        <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
          Quick Actions
        </Typography>
        <Grid container spacing={3}>
          {quickActions.map((action) => (
            <Grid item xs={12} sm={6} md={4} key={action.title}>
              <Card
                sx={{
                  borderRadius: 2.5, cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': { transform: 'translateY(-3px)', boxShadow: 4 },
                  border: '1px solid', borderColor: 'divider',
                }}
                onClick={() => router.push(action.path)}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Avatar sx={{ bgcolor: `${action.color}15`, color: action.color, width: 48, height: 48 }}>
                      {action.icon}
                    </Avatar>
                    <ArrowForward sx={{ color: 'text.secondary' }} />
                  </Box>
                  <Typography variant="h6" fontWeight={600}>
                    {action.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {action.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Recent Policies Preview */}
        {policies.length > 0 && (
          <Box sx={{ mt: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight={600}>Recent Policies</Typography>
              <Button
                size="small"
                endIcon={<ArrowForward />}
                onClick={() => router.push('/portal/policies')}
                sx={{ textTransform: 'none', fontWeight: 600 }}
              >
                View All
              </Button>
            </Box>
            <Grid container spacing={2}>
              {policies.slice(0, 3).map((policy) => (
                <Grid item xs={12} sm={6} md={4} key={policy.id}>
                  <Card sx={{ borderRadius: 2.5, border: '1px solid', borderColor: 'divider' }}>
                    <CardContent sx={{ p: 2.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="body2" fontWeight={700} sx={{ color: '#1565c0' }}>
                          {policy.policyNumber}
                        </Typography>
                        <Chip
                          label={policy.status}
                          size="small"
                          color={policy.status === 'ACTIVE' ? 'success' : policy.status === 'PENDING' ? 'warning' : 'default'}
                          sx={{ fontWeight: 600, borderRadius: '6px' }}
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        {policy.lineOfBusiness?.replace(/_/g, ' ')}
                      </Typography>
                      <Typography variant="body1" fontWeight={600}>
                        ${Number(policy.premium || 0).toLocaleString()}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Box>
    </Box>
  );
}
