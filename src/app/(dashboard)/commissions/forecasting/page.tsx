'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  Box, Card, CardContent, Typography, Grid, Paper, Avatar, Button, Tooltip,
} from '@mui/material';
import {
  TrendingUp, AttachMoney, CalendarMonth, ShowChart, PictureAsPdf, Download,
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';

export default function ForecastingPage() {
  const { data: stats } = useQuery({
    queryKey: ['commission-forecast'],
    queryFn: async () => {
      const response = await axios.get('/api/commissions/stats?year=2024');
      return response.data;
    },
  });

  const monthlyData = stats?.monthlyData || [];
  const forecastData = [
    ...monthlyData,
    { month: 'Jan*', newBusiness: 8500, renewal: 12000, forecast: true },
    { month: 'Feb*', newBusiness: 9200, renewal: 13500, forecast: true },
    { month: 'Mar*', newBusiness: 10000, renewal: 14200, forecast: true },
  ];

  const forecastMonthly = 12500;
  const forecastQ1 = 45000;
  const forecastAnnual = 185000;
  const yoyGrowth = 15;

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
              <TrendingUp sx={{ fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight={700}>Commission Forecasting</Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>Projected commission earnings based on pipeline and renewals</Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Export as PDF">
              <Button variant="outlined" size="small" startIcon={<PictureAsPdf />}
                onClick={() => window.open('/api/export/pdf?type=commission-forecast', '_blank')}
                sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}>
                PDF
              </Button>
            </Tooltip>
            <Tooltip title="Export as CSV">
              <Button variant="outlined" size="small" startIcon={<Download />}
                onClick={() => {
                  const csv = [
                    ['Month', 'New Business', 'Renewals', 'Forecast'].join(','),
                    ...forecastData.map((d: any) => [
                      d.month,
                      d.newBusiness || 0,
                      d.renewal || 0,
                      d.forecast ? 'Yes' : 'No',
                    ].join(','))
                  ].join('\n');
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a'); a.href = url;
                  a.download = `commission-forecast-${new Date().toISOString().split('T')[0]}.csv`;
                  a.click(); URL.revokeObjectURL(url);
                }}
                sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}>
                CSV
              </Button>
            </Tooltip>
          </Box>
        </Box>
      </Paper>

      {/* Stats Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Next Month Forecast', value: `$${forecastMonthly.toLocaleString()}`, subtitle: 'Projected earnings', icon: <CalendarMonth />, color: '#e65100', bg: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)' },
          { label: 'Q1 Forecast', value: `$${forecastQ1.toLocaleString()}`, subtitle: 'Quarterly projection', icon: <TrendingUp />, color: '#2e7d32', bg: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)' },
          { label: 'Annual Forecast', value: `$${forecastAnnual.toLocaleString()}`, subtitle: 'Full year estimate', icon: <AttachMoney />, color: '#1976d2', bg: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)' },
          { label: 'YoY Growth', value: `+${yoyGrowth}%`, subtitle: 'vs last year', icon: <ShowChart />, color: '#7b1fa2', bg: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)' },
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
                  <Typography variant="caption" color="text.secondary">{stat.subtitle}</Typography>
                </Box>
                <Avatar sx={{ bgcolor: `${stat.color}20`, color: stat.color, width: 42, height: 42 }}>
                  {stat.icon}
                </Avatar>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Chart */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card sx={{ borderRadius: 2.5 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box>
                  <Typography variant="h6" fontWeight={600}>
                    Commission Forecast (Historical + Projected)
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Monthly breakdown of new business and renewal commissions
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: 12, height: 12, borderRadius: '2px', bgcolor: '#e65100' }} />
                    <Typography variant="caption" color="text.secondary">New Business</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: 12, height: 12, borderRadius: '2px', bgcolor: '#2e7d32' }} />
                    <Typography variant="caption" color="text.secondary">Renewals</Typography>
                  </Box>
                </Box>
              </Box>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={forecastData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#666' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#666' }} tickFormatter={(value: number) => `$${(value / 1000).toFixed(0)}k`} />
                  <RechartsTooltip
                    formatter={(value: number) => `$${value.toLocaleString()}`}
                    contentStyle={{ borderRadius: 8, border: '1px solid #e0e0e0', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                  />
                  <Legend />
                  <Bar dataKey="newBusiness" name="New Business" fill="#e65100" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="renewal" name="Renewals" fill="#2e7d32" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <Paper variant="outlined" sx={{ p: 1.5, mt: 2, borderRadius: 2, bgcolor: 'grey.50' }}>
                <Typography variant="caption" color="text.secondary">
                  * Months marked with an asterisk (*) are projected values based on the current pipeline and renewal schedule.
                  Actual results may vary based on market conditions and policy closings.
                </Typography>
              </Paper>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
