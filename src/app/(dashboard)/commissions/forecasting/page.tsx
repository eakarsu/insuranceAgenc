'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Box, Card, CardContent, Typography, Grid } from '@mui/material';
import { TrendingUp, AttachMoney, CalendarMonth, ShowChart } from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';

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

  return (
    <Box className="animate-fade-in">
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>Commission Forecasting</Typography>
        <Typography color="text.secondary">Projected commission earnings based on pipeline and renewals</Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <CalendarMonth sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4" fontWeight={700}>$12,500</Typography>
              <Typography color="text.secondary">Next Month Forecast</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <TrendingUp sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h4" fontWeight={700}>$45,000</Typography>
              <Typography color="text.secondary">Q1 Forecast</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <AttachMoney sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
              <Typography variant="h4" fontWeight={700}>$185,000</Typography>
              <Typography color="text.secondary">Annual Forecast</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <ShowChart sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
              <Typography variant="h4" fontWeight={700}>+15%</Typography>
              <Typography color="text.secondary">YoY Growth</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Commission Forecast (Historical + Projected)
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={forecastData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                  <Legend />
                  <Bar dataKey="newBusiness" name="New Business" fill="#1976d2" />
                  <Bar dataKey="renewal" name="Renewals" fill="#2e7d32" />
                </BarChart>
              </ResponsiveContainer>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                * Projected values based on pipeline and renewal schedule
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
