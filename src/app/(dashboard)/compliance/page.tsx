'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  Box, Card, CardContent, Typography, Grid, Chip, Avatar, Paper, List, ListItem,
  ListItemText, ListItemAvatar, ListItemSecondaryAction, CircularProgress,
} from '@mui/material';
import {
  GavelRounded, CheckCircle, Warning, Error as ErrorIcon, Schedule,
  TrendingUp,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: '#d32f2f',
  HIGH: '#f44336',
  MEDIUM: '#ff9800',
  LOW: '#4caf50',
};

const CATEGORY_COLORS: Record<string, string> = {
  LICENSING: '#1976d2',
  DISCLOSURE: '#7b1fa2',
  DOCUMENTATION: '#e65100',
  REPORTING: '#2e7d32',
  PRIVACY: '#c62828',
};

export default function CompliancePage() {
  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['complianceDashboard'],
    queryFn: async () => {
      const response = await axios.get('/api/compliance/dashboard');
      return response.data;
    },
  });

  const complianceScore = dashboard?.complianceScore ?? 0;

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#2e7d32';
    if (score >= 60) return '#ff9800';
    return '#d32f2f';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'error';
      case 'HIGH': return 'error';
      case 'MEDIUM': return 'warning';
      case 'LOW': return 'success';
      default: return 'default';
    }
  };

  const categoryChartData = dashboard?.byCategory
    ? Object.entries(dashboard.byCategory).map(([key, val]: [string, any]) => ({
      name: key.charAt(0) + key.slice(1).toLowerCase(),
      compliant: val.compliant,
      nonCompliant: val.nonCompliant,
      total: val.total,
    }))
    : [];

  return (
    <Box className="animate-fade-in">
      {/* Header */}
      <Paper elevation={0} sx={{
        p: 3, mb: 3, borderRadius: 3,
        background: 'linear-gradient(135deg, #6a1b9a 0%, #8e24aa 50%, #ab47bc 100%)',
        color: 'white',
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.15)', width: 52, height: 52 }}>
              <GavelRounded sx={{ fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight={700}>Compliance</Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>Regulatory compliance tracking and monitoring</Typography>
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Compliance Score + Stats Row */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Large Compliance Score */}
        <Grid item xs={12} sm={4} md={3}>
          <Paper elevation={0} sx={{
            p: 3, borderRadius: 2.5, border: '1px solid', borderColor: 'divider',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)',
            height: '100%',
          }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.68rem', mb: 1 }}>
              Compliance Score
            </Typography>
            <Box sx={{ position: 'relative', display: 'inline-flex', mb: 1 }}>
              <CircularProgress
                variant="determinate"
                value={complianceScore}
                size={120}
                thickness={6}
                sx={{ color: getScoreColor(complianceScore), '& .MuiCircularProgress-circle': { strokeLinecap: 'round' } }}
              />
              <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="h3" fontWeight={800} sx={{ color: getScoreColor(complianceScore) }}>
                  {complianceScore}%
                </Typography>
              </Box>
            </Box>
            <Typography variant="caption" color="text.secondary">
              {complianceScore >= 80 ? 'Good standing' : complianceScore >= 60 ? 'Needs attention' : 'Critical'}
            </Typography>
          </Paper>
        </Grid>

        {/* Stats Cards */}
        <Grid item xs={12} sm={8} md={9}>
          <Grid container spacing={2}>
            {[
              { label: 'Total Rules', value: dashboard?.totalRules || 0, icon: <GavelRounded />, color: '#6a1b9a', bg: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)' },
              { label: 'Compliant', value: dashboard?.compliantCount || 0, icon: <CheckCircle />, color: '#2e7d32', bg: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)' },
              { label: 'Non-Compliant', value: dashboard?.nonCompliantCount || 0, icon: <ErrorIcon />, color: '#d32f2f', bg: 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)' },
              { label: 'Pending', value: dashboard?.pendingCount || 0, icon: <Schedule />, color: '#ed6c02', bg: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)' },
            ].map((stat) => (
              <Grid item xs={6} sm={6} md={3} key={stat.label}>
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
        </Grid>
      </Grid>

      {/* Charts + Lists Row */}
      <Grid container spacing={3}>
        {/* Category Breakdown Chart */}
        <Grid item xs={12} md={7}>
          <Card sx={{ borderRadius: 2.5, height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>Compliance by Category</Typography>
              {categoryChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={categoryChartData} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                    <RechartsTooltip />
                    <Bar dataKey="compliant" name="Compliant" fill="#4caf50" radius={[0, 4, 4, 0]} stackId="a" />
                    <Bar dataKey="nonCompliant" name="Non-Compliant" fill="#f44336" radius={[0, 4, 4, 0]} stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 320 }}>
                  <Typography color="text.secondary">No compliance data available</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Upcoming Due Dates + Non-Compliant Items */}
        <Grid item xs={12} md={5}>
          <Grid container spacing={3}>
            {/* Upcoming Due Dates */}
            <Grid item xs={12}>
              <Card sx={{ borderRadius: 2.5 }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Upcoming Due Dates (30 days)
                  </Typography>
                  {(dashboard?.upcomingDueDates || []).length > 0 ? (
                    <List dense disablePadding>
                      {(dashboard?.upcomingDueDates || []).slice(0, 6).map((item: any) => (
                        <ListItem key={item.id} sx={{ px: 0, py: 1, borderBottom: '1px solid', borderColor: 'grey.100' }}>
                          <ListItemAvatar sx={{ minWidth: 40 }}>
                            <Avatar sx={{ width: 32, height: 32, bgcolor: '#6a1b9a20', color: '#6a1b9a' }}>
                              <Schedule sx={{ fontSize: 18 }} />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.85rem' }}>
                                {item.rule?.name || 'Compliance Check'}
                              </Typography>
                            }
                            secondary={
                              <Typography variant="caption" color="text.secondary">
                                {item.rule?.category} - Due {item.nextDueDate ? format(new Date(item.nextDueDate), 'MMM d, yyyy') : '-'}
                              </Typography>
                            }
                          />
                          <ListItemSecondaryAction>
                            <Chip
                              label={item.rule?.severity || 'MEDIUM'}
                              size="small"
                              color={getSeverityColor(item.rule?.severity || 'MEDIUM') as any}
                              sx={{ fontWeight: 600, borderRadius: '6px', fontSize: '0.7rem' }}
                            />
                          </ListItemSecondaryAction>
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Box sx={{ py: 3, textAlign: 'center' }}>
                      <CheckCircle sx={{ fontSize: 40, color: 'success.light', mb: 1 }} />
                      <Typography variant="body2" color="text.secondary">No upcoming due dates</Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Non-Compliant Items */}
            <Grid item xs={12}>
              <Card sx={{ borderRadius: 2.5 }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={600} gutterBottom sx={{ color: '#d32f2f' }}>
                    Non-Compliant Items
                  </Typography>
                  {(dashboard?.nonCompliantItems || []).length > 0 ? (
                    <List dense disablePadding>
                      {(dashboard?.nonCompliantItems || []).slice(0, 5).map((item: any) => (
                        <ListItem key={item.id} sx={{ px: 0, py: 1, borderBottom: '1px solid', borderColor: 'grey.100' }}>
                          <ListItemAvatar sx={{ minWidth: 40 }}>
                            <Avatar sx={{ width: 32, height: 32, bgcolor: '#d32f2f20', color: '#d32f2f' }}>
                              <ErrorIcon sx={{ fontSize: 18 }} />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.85rem' }}>
                                {item.ruleName}
                              </Typography>
                            }
                            secondary={
                              <Typography variant="caption" color="text.secondary">
                                Checked {item.checkedAt ? format(new Date(item.checkedAt), 'MMM d, yyyy') : '-'}
                              </Typography>
                            }
                          />
                          <ListItemSecondaryAction>
                            <Chip
                              label={item.severity}
                              size="small"
                              color={getSeverityColor(item.severity) as any}
                              sx={{ fontWeight: 600, borderRadius: '6px', fontSize: '0.7rem' }}
                            />
                          </ListItemSecondaryAction>
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Box sx={{ py: 3, textAlign: 'center' }}>
                      <CheckCircle sx={{ fontSize: 40, color: 'success.light', mb: 1 }} />
                      <Typography variant="body2" color="text.secondary">All items are compliant</Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        {/* Severity Breakdown */}
        <Grid item xs={12}>
          <Card sx={{ borderRadius: 2.5 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>Breakdown by Severity</Typography>
              <Grid container spacing={2}>
                {Object.entries(dashboard?.bySeverity || {}).map(([severity, data]: [string, any]) => (
                  <Grid item xs={6} sm={3} key={severity}>
                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, textAlign: 'center', borderColor: SEVERITY_COLORS[severity] || '#ccc', borderWidth: 2 }}>
                      <Chip
                        label={severity}
                        size="small"
                        sx={{ mb: 1, bgcolor: SEVERITY_COLORS[severity] || '#ccc', color: 'white', fontWeight: 700 }}
                      />
                      <Typography variant="h5" fontWeight={700}>{data.total}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {data.compliant} compliant / {data.nonCompliant} non-compliant
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
                {Object.keys(dashboard?.bySeverity || {}).length === 0 && (
                  <Grid item xs={12}>
                    <Box sx={{ py: 3, textAlign: 'center' }}>
                      <Typography color="text.secondary">No severity data available</Typography>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
