'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  Box, AppBar, Toolbar, Typography, Button, Card, CardContent, Chip, Skeleton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Grid, Avatar, TextField, InputAdornment,
} from '@mui/material';
import { AttachMoney, Payment, CheckCircle, Schedule, ErrorOutline, Search } from '@mui/icons-material';
import { format } from 'date-fns';

interface PaymentRecord {
  id: string;
  amount: number;
  status: string;
  date: string;
  description: string;
  method?: string;
  referenceNumber?: string;
}

export default function CustomerPaymentsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');

  const { data: payments = [], isLoading } = useQuery<PaymentRecord[]>({
    queryKey: ['customerPayments'],
    queryFn: async () => {
      const response = await axios.get('/api/customer/payments');
      return response.data;
    },
  });

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'COMPLETED': case 'PAID': return 'success';
      case 'PENDING': return 'warning';
      case 'FAILED': case 'OVERDUE': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'COMPLETED': case 'PAID': return <CheckCircle sx={{ fontSize: 18 }} />;
      case 'PENDING': return <Schedule sx={{ fontSize: 18 }} />;
      case 'FAILED': case 'OVERDUE': return <ErrorOutline sx={{ fontSize: 18 }} />;
      default: return <Payment sx={{ fontSize: 18 }} />;
    }
  };

  const filteredPayments = useMemo(() => {
    if (!search.trim()) return payments;
    const q = search.toLowerCase();
    return payments.filter((payment) =>
      [
        payment.description,
        payment.date ? format(new Date(payment.date), 'MMM d, yyyy') : '',
        payment.amount ? `$${Number(payment.amount).toLocaleString()}` : '',
        payment.status?.replace(/_/g, ' '),
        payment.referenceNumber,
        payment.method,
      ].some((field) => field?.toLowerCase().includes(q))
    );
  }, [payments, search]);

  const completedPayments = filteredPayments.filter(
    (p) => p.status?.toUpperCase() === 'COMPLETED' || p.status?.toUpperCase() === 'PAID'
  );
  const pendingPayments = filteredPayments.filter(
    (p) => p.status?.toUpperCase() === 'PENDING'
  );
  const outstandingPayments = filteredPayments.filter(
    (p) => p.status?.toUpperCase() === 'PENDING' || p.status?.toUpperCase() === 'OVERDUE'
  );
  const totalPaid = completedPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const totalOutstanding = outstandingPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

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
        {/* Page Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <AttachMoney sx={{ fontSize: 32, color: 'primary.main' }} />
          <Box>
            <Typography variant="h5" fontWeight={700}>Payments</Typography>
            <Typography variant="body2" color="text.secondary">
              View payment history and outstanding balances
            </Typography>
          </Box>
        </Box>

        {/* Search Bar */}
        <TextField
          fullWidth
          placeholder="Search payments..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          sx={{
            mb: 2,
            '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'white' },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            ),
          }}
        />

        {isLoading ? (
          <Box>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {[1, 2, 3].map((i) => (
                <Grid item xs={12} sm={4} key={i}>
                  <Skeleton variant="rectangular" height={110} sx={{ borderRadius: 2.5 }} />
                </Grid>
              ))}
            </Grid>
            <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2.5 }} />
          </Box>
        ) : (
          <>
            {/* Summary Cards */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={4}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5, borderRadius: 2.5,
                    background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
                    border: '1px solid', borderColor: 'divider',
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.68rem' }}>
                        Total Paid
                      </Typography>
                      <Typography variant="h4" fontWeight={700} sx={{ color: '#2e7d32', mt: 0.5 }}>
                        ${totalPaid.toLocaleString()}
                      </Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: '#2e7d3220', color: '#2e7d32', width: 42, height: 42 }}>
                      <CheckCircle />
                    </Avatar>
                  </Box>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5, borderRadius: 2.5,
                    background: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)',
                    border: '1px solid', borderColor: 'divider',
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.68rem' }}>
                        Outstanding
                      </Typography>
                      <Typography variant="h4" fontWeight={700} sx={{ color: '#e65100', mt: 0.5 }}>
                        ${totalOutstanding.toLocaleString()}
                      </Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: '#e6510020', color: '#e65100', width: 42, height: 42 }}>
                      <Schedule />
                    </Avatar>
                  </Box>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5, borderRadius: 2.5,
                    background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
                    border: '1px solid', borderColor: 'divider',
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.68rem' }}>
                        Total Payments
                      </Typography>
                      <Typography variant="h4" fontWeight={700} sx={{ color: '#1565c0', mt: 0.5 }}>
                        {payments.length}
                      </Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: '#1565c020', color: '#1565c0', width: 42, height: 42 }}>
                      <Payment />
                    </Avatar>
                  </Box>
                </Paper>
              </Grid>
            </Grid>

            {/* Outstanding Items */}
            {outstandingPayments.length > 0 && (
              <Card sx={{ borderRadius: 2.5, mb: 3, border: '2px solid', borderColor: 'warning.light' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 2, color: 'warning.dark' }}>
                    Outstanding Payments
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', color: 'text.secondary' }}>Description</TableCell>
                          <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', color: 'text.secondary' }}>Due Date</TableCell>
                          <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', color: 'text.secondary' }}>Amount</TableCell>
                          <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', color: 'text.secondary' }}>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {outstandingPayments.map((payment) => (
                          <TableRow key={payment.id} sx={{ '& td': { borderColor: 'grey.100' } }}>
                            <TableCell>
                              <Typography variant="body2" fontWeight={500}>
                                {payment.description || 'Payment'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="text.secondary">
                                {payment.date ? format(new Date(payment.date), 'MMM d, yyyy') : '-'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" fontWeight={700} color="warning.dark">
                                ${Number(payment.amount || 0).toLocaleString()}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                icon={getStatusIcon(payment.status)}
                                label={payment.status?.replace(/_/g, ' ')}
                                size="small"
                                color={getStatusColor(payment.status) as any}
                                sx={{ fontWeight: 600, borderRadius: '6px' }}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            )}

            {/* Payment History */}
            <Card sx={{ borderRadius: 2.5, overflow: 'hidden' }}>
              <Box sx={{ px: 3, pt: 2.5, pb: 1.5, bgcolor: 'grey.50', borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant="h6" fontWeight={600}>Payment History</Typography>
              </Box>
              {filteredPayments.length === 0 ? (
                <CardContent sx={{ p: 6, textAlign: 'center' }}>
                  <Payment sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    No payment history
                  </Typography>
                  <Typography variant="body2" color="text.disabled">
                    Your payment records will appear here
                  </Typography>
                </CardContent>
              ) : (
                <TableContainer component={Paper} elevation={0}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: 0.5, color: 'text.secondary' }}>
                          Date
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: 0.5, color: 'text.secondary' }}>
                          Description
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: 0.5, color: 'text.secondary' }}>
                          Amount
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: 0.5, color: 'text.secondary' }}>
                          Status
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredPayments.map((payment) => (
                        <TableRow
                          key={payment.id}
                          sx={{
                            '&:hover': { bgcolor: 'action.hover' },
                            '& td': { borderColor: 'grey.100' },
                          }}
                        >
                          <TableCell>
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.84rem' }}>
                              {payment.date ? format(new Date(payment.date), 'MMM d, yyyy') : '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={500}>
                              {payment.description || 'Payment'}
                            </Typography>
                            {payment.referenceNumber && (
                              <Typography variant="caption" color="text.disabled">
                                Ref: {payment.referenceNumber}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.9rem' }}>
                              ${Number(payment.amount || 0).toLocaleString()}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              icon={getStatusIcon(payment.status)}
                              label={payment.status?.replace(/_/g, ' ')}
                              size="small"
                              color={getStatusColor(payment.status) as any}
                              sx={{ fontWeight: 600, borderRadius: '6px' }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Card>
          </>
        )}
      </Box>
    </Box>
  );
}
