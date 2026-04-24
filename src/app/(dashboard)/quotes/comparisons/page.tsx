'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  Box, Card, CardContent, Typography, Grid, Button, Paper, Avatar, Chip,
  Checkbox, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  FormControl, InputLabel, Select, MenuItem, Alert, IconButton, Tooltip, Divider,
} from '@mui/material';
import {
  CompareArrows, CheckCircle, Cancel, Remove, Star, StarBorder,
  ArrowBack, PictureAsPdf, Person, Business,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

interface Quote {
  id: string;
  quoteNumber: string;
  lineOfBusiness: string;
  status: string;
  premium: number;
  totalPremium: number;
  deductible: number;
  coverageLimit: number;
  bodilyInjuryLimit: number;
  propertyDamageLimit: number;
  effectiveDate: string;
  createdAt: string;
  notes: string;
  client: { id: string; firstName: string; lastName: string; businessName?: string; type: string };
  carrier: { id: string; name: string };
}

export default function QuoteComparisonsPage() {
  const router = useRouter();
  const [selectedQuotes, setSelectedQuotes] = useState<string[]>([]);
  const [clientFilter, setClientFilter] = useState('');
  const [lobFilter, setLobFilter] = useState('');
  const [bestQuoteId, setBestQuoteId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['all-quotes'],
    queryFn: async () => {
      const response = await axios.get('/api/quotes?limit=200');
      return response.data;
    },
  });

  const quotes: Quote[] = data?.quotes || [];

  // Get the client ID of the first selected quote (to lock selections to same client)
  const selectedClientId = useMemo(() => {
    if (selectedQuotes.length === 0) return null;
    const firstQuote = quotes.find((q) => q.id === selectedQuotes[0]);
    return firstQuote?.client?.id || null;
  }, [selectedQuotes, quotes]);

  // Get unique clients and LOBs for filters
  const clients = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    quotes.forEach((q) => {
      const name = q.client.type === 'COMMERCIAL' && q.client.businessName
        ? q.client.businessName
        : `${q.client.firstName} ${q.client.lastName}`;
      map.set(q.client.id, { id: q.client.id, name });
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [quotes]);

  const lobs = useMemo(() => {
    return Array.from(new Set(quotes.map((q) => q.lineOfBusiness))).sort();
  }, [quotes]);

  // Filter quotes
  const filteredQuotes = useMemo(() => {
    return quotes.filter((q) => {
      if (clientFilter && q.client.id !== clientFilter) return false;
      if (lobFilter && q.lineOfBusiness !== lobFilter) return false;
      return true;
    });
  }, [quotes, clientFilter, lobFilter]);

  const toggleQuote = (id: string) => {
    setSelectedQuotes((prev) =>
      prev.includes(id) ? prev.filter((qid) => qid !== id) : prev.length < 5 ? [...prev, id] : prev
    );
  };

  const comparedQuotes = useMemo(() => {
    return selectedQuotes.map((id) => quotes.find((q) => q.id === id)).filter(Boolean) as Quote[];
  }, [selectedQuotes, quotes]);

  // Check if comparing across different clients or LOBs
  const hasMixedClients = useMemo(() => {
    if (comparedQuotes.length < 2) return false;
    const clientIds = new Set(comparedQuotes.map((q) => q.client.id));
    return clientIds.size > 1;
  }, [comparedQuotes]);

  const hasMixedLobs = useMemo(() => {
    if (comparedQuotes.length < 2) return false;
    const lobSet = new Set(comparedQuotes.map((q) => q.lineOfBusiness));
    return lobSet.size > 1;
  }, [comparedQuotes]);

  // Find lowest premium
  const lowestPremium = useMemo(() => {
    if (comparedQuotes.length === 0) return 0;
    return Math.min(...comparedQuotes.map((q) => Number(q.totalPremium || q.premium || 0)));
  }, [comparedQuotes]);

  const highestPremium = useMemo(() => {
    if (comparedQuotes.length === 0) return 0;
    return Math.max(...comparedQuotes.map((q) => Number(q.totalPremium || q.premium || 0)));
  }, [comparedQuotes]);

  const getClientName = (q: Quote) =>
    q.client.type === 'COMMERCIAL' && q.client.businessName
      ? q.client.businessName
      : `${q.client.firstName} ${q.client.lastName}`;

  const formatCurrency = (val: any) => {
    const num = Number(val || 0);
    return num > 0 ? `$${num.toLocaleString()}` : '-';
  };

  return (
    <Box className="animate-fade-in">
      {/* Header */}
      <Paper elevation={0} sx={{
        p: 3, mb: 3, borderRadius: 3,
        background: 'linear-gradient(135deg, #2e7d32 0%, #388e3c 50%, #66bb6a 100%)',
        color: 'white',
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.15)', width: 52, height: 52 }}>
              <CompareArrows sx={{ fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight={700}>Quote Comparisons</Typography>
              <Typography variant="body2" sx={{ opacity: 0.85 }}>Select quotes to compare side-by-side</Typography>
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Total Quotes', value: quotes.length, color: '#2e7d32', bg: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)' },
          { label: 'Selected to Compare', value: selectedQuotes.length, color: '#1565c0', bg: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)' },
          { label: 'Lowest Premium', value: comparedQuotes.length > 0 ? `$${lowestPremium.toLocaleString()}` : '-', color: '#e65100', bg: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)' },
          { label: 'Potential Savings', value: comparedQuotes.length > 1 ? `$${(highestPremium - lowestPremium).toLocaleString()}` : '-', color: '#7b1fa2', bg: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)' },
        ].map((stat) => (
          <Grid item xs={6} sm={3} key={stat.label}>
            <Paper elevation={0} sx={{
              p: 2.5, borderRadius: 2.5, background: stat.bg, border: '1px solid', borderColor: 'divider',
            }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.68rem' }}>
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
        {/* Left: Quote Selector */}
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 2.5, position: 'sticky', top: 80 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="h6" fontWeight={700} gutterBottom>Select Quotes (max 5)</Typography>

              {/* Filters */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Filter by Client</InputLabel>
                  <Select value={clientFilter} label="Filter by Client" onChange={(e) => setClientFilter(e.target.value)}>
                    <MenuItem value="">All Clients</MenuItem>
                    {clients.map((c) => (
                      <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth size="small">
                  <InputLabel>Filter by Line</InputLabel>
                  <Select value={lobFilter} label="Filter by Line" onChange={(e) => setLobFilter(e.target.value)}>
                    <MenuItem value="">All Lines</MenuItem>
                    {lobs.map((l) => (
                      <MenuItem key={l} value={l}>{l.replace(/_/g, ' ')}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              <Divider sx={{ mb: 1.5 }} />

              {/* Quote List */}
              <Box sx={{ maxHeight: 500, overflow: 'auto' }}>
                {isLoading ? (
                  <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>Loading quotes...</Typography>
                ) : filteredQuotes.length === 0 ? (
                  <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>No quotes found</Typography>
                ) : (
                  filteredQuotes.map((q) => {
                    const isSelected = selectedQuotes.includes(q.id);
                    const premium = Number(q.totalPremium || q.premium || 0);
                    const isDisabled = !isSelected && selectedQuotes.length >= 5;
                    return (
                      <Paper
                        key={q.id}
                        variant="outlined"
                        onClick={() => toggleQuote(q.id)}
                        sx={{
                          p: 1.5, mb: 1, borderRadius: 2, cursor: 'pointer',
                          border: isSelected ? '2px solid #2e7d32' : '1px solid',
                          borderColor: isSelected ? '#2e7d32' : 'divider',
                          bgcolor: isSelected ? '#f1f8e9' : 'transparent',
                          transition: 'all 0.15s',
                          '&:hover': { bgcolor: isSelected ? '#f1f8e9' : 'grey.50' },
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Checkbox
                            checked={isSelected}
                            size="small"
                            sx={{ p: 0, color: '#2e7d32', '&.Mui-checked': { color: '#2e7d32' } }}
                            disabled={isDisabled}
                          />
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="body2" fontWeight={700} sx={{ fontSize: '0.88rem', color: isSelected ? '#2e7d32' : 'text.primary' }}>
                              {q.carrier?.name || 'Unknown Carrier'}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Typography variant="caption" color="text.secondary">
                                {q.quoteNumber}
                              </Typography>
                              <Chip label={q.status} size="small"
                                color={q.status === 'QUOTED' ? 'success' : q.status === 'BOUND' ? 'primary' : 'default'}
                                sx={{ height: 18, fontSize: '0.65rem' }} />
                            </Box>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                              {getClientName(q)} &middot; {q.lineOfBusiness.replace(/_/g, ' ')}
                            </Typography>
                          </Box>
                          <Typography variant="body2" fontWeight={700} color="primary.main">
                            {premium > 0 ? `$${premium.toLocaleString()}` : '-'}
                          </Typography>
                        </Box>
                      </Paper>
                    );
                  })
                )}
              </Box>

              {selectedQuotes.length > 0 && (
                <Button
                  fullWidth
                  variant="text"
                  size="small"
                  onClick={() => { setSelectedQuotes([]); setBestQuoteId(null); }}
                  sx={{ mt: 1, textTransform: 'none', color: 'text.secondary' }}
                >
                  Clear Selection
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Selected Carrier Cards - on left side */}
          {comparedQuotes.length >= 2 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: 0.5 }}>
                Selected for Comparison
              </Typography>
              {comparedQuotes.map((q) => {
                const premium = Number(q.totalPremium || q.premium || 0);
                const isLowest = premium === lowestPremium && premium > 0;
                const isBest = q.id === bestQuoteId;
                return (
                  <Paper
                    key={q.id}
                    elevation={0}
                    sx={{
                      p: 2, mb: 1, borderRadius: 2,
                      border: isBest ? '2px solid #2e7d32' : '1px solid',
                      borderColor: isBest ? '#2e7d32' : isLowest ? '#e65100' : 'divider',
                      bgcolor: isBest ? '#f1f8e9' : 'white',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Tooltip title={isBest ? 'Remove best pick' : 'Mark as best pick'}>
                        <IconButton size="small" onClick={() => setBestQuoteId(isBest ? null : q.id)} sx={{ p: 0.5 }}>
                          {isBest ? <Star sx={{ color: '#2e7d32', fontSize: 20 }} /> : <StarBorder sx={{ fontSize: 20, color: 'text.disabled' }} />}
                        </IconButton>
                      </Tooltip>
                      <Box>
                        <Typography variant="body2" fontWeight={700}>
                          {q.carrier?.name || 'Unknown'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {q.quoteNumber}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="body1" fontWeight={800} color={isLowest ? 'warning.dark' : 'primary.main'}>
                        {premium > 0 ? `$${premium.toLocaleString()}` : '-'}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                        {isLowest && <Chip label="Lowest" size="small" color="warning" sx={{ height: 18, fontSize: '0.6rem' }} />}
                        {isBest && <Chip label="Best" size="small" color="success" sx={{ height: 18, fontSize: '0.6rem' }} />}
                      </Box>
                    </Box>
                  </Paper>
                );
              })}
            </Box>
          )}
        </Grid>

        {/* Right: Comparison Table */}
        <Grid item xs={12} md={8}>
          {comparedQuotes.length < 2 ? (
            <Card sx={{ borderRadius: 2.5 }}>
              <CardContent sx={{ textAlign: 'center', py: 10 }}>
                <Avatar sx={{ bgcolor: '#e8f5e9', color: '#66bb6a', width: 80, height: 80, mx: 'auto', mb: 3 }}>
                  <CompareArrows sx={{ fontSize: 42 }} />
                </Avatar>
                <Typography variant="h5" fontWeight={700} gutterBottom sx={{ color: '#2e7d32' }}>
                  {comparedQuotes.length === 0 ? 'Select Quotes to Compare' : 'Select at Least 2 Quotes'}
                </Typography>
                <Typography color="text.secondary" sx={{ maxWidth: 400, mx: 'auto' }}>
                  {!clientFilter
                    ? 'First, filter by a client on the left, then check at least 2 quotes to compare carriers, premiums, and coverage details side-by-side.'
                    : 'Check at least 2 quotes from the list on the left to see a side-by-side comparison of carriers, premiums, and coverage details.'}
                </Typography>
              </CardContent>
            </Card>
          ) : (
            <Box>
              {/* Warnings for mixed comparisons */}
              {hasMixedClients && (
                <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
                  You are comparing quotes from different clients. Filter by a specific client for a more meaningful comparison.
                </Alert>
              )}
              {hasMixedLobs && (
                <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
                  You are comparing quotes across different lines of business.
                </Alert>
              )}

              {/* Comparison Header */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" fontWeight={700}>
                  Comparing {comparedQuotes.length} Quotes
                </Typography>
                {bestQuoteId && (
                  <Chip icon={<Star sx={{ fontSize: 16 }} />} label="Best pick selected" color="success" size="small" />
                )}
              </Box>

              {/* Detail Comparison Table */}
              <Card sx={{ borderRadius: 2.5, overflow: 'hidden' }}>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'grey.50' }}>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', width: 180 }}>Detail</TableCell>
                        {comparedQuotes.map((q) => (
                          <TableCell key={q.id} align="center" sx={{ fontWeight: 700, fontSize: '0.8rem' }}>
                            {q.carrier?.name}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {[
                        { label: 'Quote Number', getValue: (q: Quote) => q.quoteNumber },
                        { label: 'Client', getValue: (q: Quote) => getClientName(q) },
                        { label: 'Line of Business', getValue: (q: Quote) => q.lineOfBusiness.replace(/_/g, ' ') },
                        { label: 'Status', getValue: (q: Quote) => q.status, isChip: true },
                        { label: 'Annual Premium', getValue: (q: Quote) => formatCurrency(q.totalPremium || q.premium), highlight: true },
                        { label: 'Deductible', getValue: (q: Quote) => formatCurrency(q.deductible) },
                        { label: 'Coverage Limit', getValue: (q: Quote) => formatCurrency(q.coverageLimit) },
                        { label: 'Bodily Injury Limit', getValue: (q: Quote) => formatCurrency(q.bodilyInjuryLimit) },
                        { label: 'Property Damage Limit', getValue: (q: Quote) => formatCurrency(q.propertyDamageLimit) },
                        { label: 'Effective Date', getValue: (q: Quote) => q.effectiveDate ? format(new Date(q.effectiveDate), 'MMM d, yyyy') : '-' },
                        { label: 'Created', getValue: (q: Quote) => format(new Date(q.createdAt), 'MMM d, yyyy') },
                        { label: 'Notes', getValue: (q: Quote) => q.notes || '-' },
                      ].map((row) => (
                        <TableRow key={row.label} sx={row.highlight ? { bgcolor: '#f9fbe7' } : undefined}>
                          <TableCell sx={{ fontWeight: 600, fontSize: '0.82rem', color: 'text.secondary' }}>
                            {row.label}
                          </TableCell>
                          {comparedQuotes.map((q) => {
                            const val = row.getValue(q);
                            const premium = Number(q.totalPremium || q.premium || 0);
                            const isLowestForRow = row.highlight && premium === lowestPremium && premium > 0;
                            return (
                              <TableCell key={q.id} align="center"
                                sx={{
                                  fontSize: '0.82rem',
                                  fontWeight: (row.highlight || isLowestForRow) ? 700 : 400,
                                  color: isLowestForRow ? '#e65100' : 'text.primary',
                                }}>
                                {row.isChip ? (
                                  <Chip label={val} size="small"
                                    color={val === 'QUOTED' ? 'success' : val === 'BOUND' ? 'primary' : 'default'}
                                    sx={{ fontSize: '0.72rem' }} />
                                ) : (
                                  val
                                )}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Card>

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', gap: 2, mt: 3, justifyContent: 'flex-end' }}>
                {bestQuoteId && (
                  <Button
                    variant="contained"
                    onClick={() => router.push(`/quotes/${bestQuoteId}`)}
                    sx={{ bgcolor: '#2e7d32', '&:hover': { bgcolor: '#1b5e20' }, borderRadius: 2, fontWeight: 600 }}
                  >
                    View Best Quote Details
                  </Button>
                )}
              </Box>
            </Box>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}
