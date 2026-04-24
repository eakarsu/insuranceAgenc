'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  Box, Typography, Button, Card, CardContent, Chip, Avatar, AppBar, Toolbar,
  CircularProgress, Paper, Grid, TextField, InputAdornment,
} from '@mui/material';
import {
  Shield, Dashboard, Logout, Description, CalendarMonth,
  CheckCircle, Draw, AttachMoney, Search,
} from '@mui/icons-material';
import { format } from 'date-fns';

export default function CustomerProposalsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['customer-proposals'],
    queryFn: async () => {
      const response = await axios.get('/api/customer/quotes');
      return response.data;
    },
  });

  const handleLogout = async () => {
    try {
      await axios.post('/api/customer/auth/logout');
      router.push('/portal/login');
    } catch {
      router.push('/portal/login');
    }
  };

  // Filter to only PROPOSED status quotes that have proposals
  const allQuotes = data?.quotes || [];
  const proposals = allQuotes.filter((q: any) => q.status === 'PROPOSED' || (q.proposal && q.proposal.signedAt));

  const filteredProposals = useMemo(() => {
    if (!search.trim()) return proposals;
    const q = search.toLowerCase();
    return proposals.filter((quote: any) => {
      const dateStr = quote.proposal?.sentAt
        ? format(new Date(quote.proposal.sentAt), 'MMM d, yyyy')
        : quote.createdAt
        ? format(new Date(quote.createdAt), 'MMM d, yyyy')
        : '';
      return [
        quote.quoteNumber,
        quote.lineOfBusiness?.replace(/_/g, ' '),
        `$${Number(quote.totalPremium || quote.premium || 0).toLocaleString()}`,
        dateStr,
        quote.proposal?.signedAt ? 'signed' : 'sign',
      ].some((field) => field?.toLowerCase().includes(q));
    });
  }, [proposals, search]);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f7fa' }}>
      {/* AppBar */}
      <AppBar position="static" elevation={0} sx={{ bgcolor: '#0d47a1' }}>
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexGrow: 1 }}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.15)', width: 40, height: 40 }}>
              <Shield />
            </Avatar>
            <Typography variant="h6" fontWeight={700}>
              InsureFlow Customer Portal
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              color="inherit"
              startIcon={<Dashboard />}
              onClick={() => router.push('/portal')}
              sx={{ textTransform: 'none' }}
            >
              Dashboard
            </Button>
            <Button
              color="inherit"
              startIcon={<Logout />}
              onClick={handleLogout}
              sx={{ textTransform: 'none' }}
            >
              Logout
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Content */}
      <Box sx={{ maxWidth: 900, mx: 'auto', p: 3 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Proposals
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Review and sign your insurance proposals below.
        </Typography>

        {/* Search Bar */}
        <TextField
          fullWidth
          placeholder="Search proposals..."
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
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : filteredProposals.length === 0 ? (
          <Paper elevation={0} sx={{ p: 6, textAlign: 'center', borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
            <Description sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No proposals at this time
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              When your agent sends you a proposal, it will appear here for your review and signature.
            </Typography>
          </Paper>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {filteredProposals.map((quote: any) => {
              const isSigned = !!quote.proposal?.signedAt;
              return (
                <Card key={quote.id} sx={{ borderRadius: 2.5, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={7}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ bgcolor: isSigned ? '#2e7d32' : '#1565c0', width: 48, height: 48 }}>
                            {isSigned ? <CheckCircle /> : <Description />}
                          </Avatar>
                          <Box>
                            <Typography variant="h6" fontWeight={600}>
                              {quote.quoteNumber}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {quote.lineOfBusiness?.replace(/_/g, ' ') || 'Insurance Proposal'}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                      <Grid item xs={6} sm={2}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <AttachMoney sx={{ fontSize: 18, color: 'text.secondary' }} />
                          <Typography variant="body1" fontWeight={600}>
                            ${Number(quote.totalPremium || quote.premium || 0).toLocaleString()}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                          <CalendarMonth sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {quote.proposal?.sentAt
                              ? format(new Date(quote.proposal.sentAt), 'MMM d, yyyy')
                              : format(new Date(quote.createdAt), 'MMM d, yyyy')}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6} sm={3} sx={{ textAlign: 'right' }}>
                        {isSigned ? (
                          <Chip
                            icon={<CheckCircle />}
                            label={`Signed ${format(new Date(quote.proposal.signedAt), 'MMM d')}`}
                            color="success"
                            sx={{ fontWeight: 600, borderRadius: '8px' }}
                          />
                        ) : (
                          <Button
                            variant="contained"
                            startIcon={<Draw />}
                            onClick={() => router.push(`/portal/proposals/${quote.proposal?.id}/sign`)}
                            disabled={!quote.proposal?.id}
                            sx={{
                              borderRadius: 2,
                              fontWeight: 600,
                              textTransform: 'none',
                              bgcolor: '#1565c0',
                              '&:hover': { bgcolor: '#0d47a1' },
                            }}
                          >
                            Sign
                          </Button>
                        )}
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        )}
      </Box>
    </Box>
  );
}
