'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import {
  Box, Card, CardContent, Typography, Grid, TextField, Button,
  CircularProgress, Alert, Paper, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from '@mui/material';
import { Search, Send, Info, People, Policy, ReportProblem, RequestQuote, AutoFixHigh } from '@mui/icons-material';

const exampleQueries = [
  'Find all clients in California',
  'Show policies expiring next month',
  'Claims with status open',
  'Commercial clients with auto policies',
];

const entityIcons: Record<string, React.ReactNode> = {
  client: <People />,
  policy: <Policy />,
  claim: <ReportProblem />,
  quote: <RequestQuote />,
};

export default function SmartSearchPage() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<any>(null);

  const searchMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.post('/api/ai/smart-search', { query });
      return response.data;
    },
    onSuccess: (data) => setResult(data),
  });

  const renderClientResults = (results: any[]) => (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>State</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Policies</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {results.map((r: any) => (
            <TableRow key={r.id} hover>
              <TableCell>{r.businessName || `${r.firstName} ${r.lastName}`}</TableCell>
              <TableCell>{r.email}</TableCell>
              <TableCell>{r.state}</TableCell>
              <TableCell><Chip label={r.type} size="small" /></TableCell>
              <TableCell>{r.policies?.length || 0}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderPolicyResults = (results: any[]) => (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Policy #</TableCell>
            <TableCell>Client</TableCell>
            <TableCell>Line of Business</TableCell>
            <TableCell>Carrier</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Premium</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {results.map((r: any) => (
            <TableRow key={r.id} hover>
              <TableCell>{r.policyNumber}</TableCell>
              <TableCell>{r.client?.businessName || `${r.client?.firstName} ${r.client?.lastName}`}</TableCell>
              <TableCell>{r.lineOfBusiness?.replace(/_/g, ' ')}</TableCell>
              <TableCell>{r.carrier}</TableCell>
              <TableCell><Chip label={r.status} size="small" color={r.status === 'ACTIVE' ? 'success' : 'default'} /></TableCell>
              <TableCell>${Number(r.premium || 0).toLocaleString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderClaimResults = (results: any[]) => (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Claim #</TableCell>
            <TableCell>Client</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Amount</TableCell>
            <TableCell>Date of Loss</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {results.map((r: any) => (
            <TableRow key={r.id} hover>
              <TableCell>{r.claimNumber}</TableCell>
              <TableCell>{r.policy?.client?.businessName || `${r.policy?.client?.firstName} ${r.policy?.client?.lastName}`}</TableCell>
              <TableCell><Chip label={r.status} size="small" color={r.status === 'OPEN' ? 'warning' : 'default'} /></TableCell>
              <TableCell>${Number(r.amount || 0).toLocaleString()}</TableCell>
              <TableCell>{r.dateOfLoss ? new Date(r.dateOfLoss).toLocaleDateString() : '-'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderQuoteResults = (results: any[]) => (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Client</TableCell>
            <TableCell>Line of Business</TableCell>
            <TableCell>Carrier</TableCell>
            <TableCell>Premium</TableCell>
            <TableCell>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {results.map((r: any) => (
            <TableRow key={r.id} hover>
              <TableCell>{r.client?.businessName || `${r.client?.firstName} ${r.client?.lastName}`}</TableCell>
              <TableCell>{r.lineOfBusiness?.replace(/_/g, ' ')}</TableCell>
              <TableCell>{r.carrier}</TableCell>
              <TableCell>${Number(r.premium || 0).toLocaleString()}</TableCell>
              <TableCell><Chip label={r.status} size="small" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderResults = () => {
    if (!result?.results?.length) {
      return <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>No results found</Typography>;
    }
    switch (result.entityType) {
      case 'client': return renderClientResults(result.results);
      case 'policy': return renderPolicyResults(result.results);
      case 'claim': return renderClaimResults(result.results);
      case 'quote': return renderQuoteResults(result.results);
      default: return renderClientResults(result.results);
    }
  };

  return (
    <Box className="animate-fade-in">
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Search sx={{ fontSize: 32, color: 'info.main' }} />
        <Box>
          <Typography variant="h4" fontWeight={700}>AI Smart Search</Typography>
          <Typography color="text.secondary">Search your data using natural language</Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>Search Query</Typography>

              <TextField
                fullWidth
                multiline
                rows={4}
                label="What are you looking for?"
                placeholder="e.g., Find all clients in Texas with auto policies..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                sx={{ mb: 2 }}
              />

              <Box sx={{ mb: 3 }}>
                <Typography variant="caption" color="text.secondary" gutterBottom>Try these examples:</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                  {exampleQueries.map((eq) => (
                    <Chip key={eq} label={eq} size="small" variant="outlined" onClick={() => setQuery(eq)} sx={{ cursor: 'pointer' }} />
                  ))}
                </Box>
              </Box>

              {/* Sample Test Queries */}
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 3, bgcolor: 'grey.50', border: '1px dashed', borderColor: 'grey.300' }}>
                <Typography variant="caption" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary', mb: 1 }}>
                  <AutoFixHigh fontSize="small" /> SAMPLE TEST QUERIES
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  <Chip label="Find Expiring Policies" size="small" variant="outlined" color="primary" sx={{ cursor: 'pointer' }}
                    onClick={() => setQuery('Show me all commercial auto policies expiring in the next 30 days that have premium over $5,000 and have had at least one claim in the past year')} />
                  <Chip label="High Risk Clients" size="small" variant="outlined" color="primary" sx={{ cursor: 'pointer' }}
                    onClick={() => setQuery('Find all clients who have filed more than 2 claims in the past 12 months and currently have active policies with us, sorted by total claim amount')} />
                  <Chip label="Revenue Analysis" size="small" variant="outlined" color="primary" sx={{ cursor: 'pointer' }}
                    onClick={() => setQuery('What is the total premium revenue broken down by line of business for active policies, and which carriers have the highest commission rates?')} />
                </Box>
              </Paper>

              <Button
                fullWidth
                variant="contained"
                size="large"
                color="info"
                startIcon={searchMutation.isPending ? <CircularProgress size={20} color="inherit" /> : <Search />}
                onClick={() => searchMutation.mutate()}
                disabled={!query.trim() || searchMutation.isPending}
              >
                {searchMutation.isPending ? 'Searching...' : 'Search'}
              </Button>

              {searchMutation.isError && (
                <Alert severity="error" sx={{ mt: 2 }}>Search failed. Try rephrasing your query.</Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>Search Results</Typography>

              {!result && !searchMutation.isPending && (
                <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
                  <Search sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                  <Typography>Type a natural language query to search your data</Typography>
                </Box>
              )}

              {searchMutation.isPending && (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <CircularProgress size={48} />
                  <Typography sx={{ mt: 2 }}>AI is interpreting your query and searching...</Typography>
                </Box>
              )}

              {result && (
                <Box>
                  {/* AI Interpretation */}
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2, mb: 3, borderRadius: 2,
                      background: 'linear-gradient(135deg, #e8eaf6 0%, #c5cae9 100%)',
                      border: '1px solid', borderColor: 'info.light',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Info color="info" fontSize="small" />
                      <Typography variant="subtitle2" fontWeight={600}>AI Interpretation</Typography>
                      {result.entityType && (
                        <Chip icon={entityIcons[result.entityType] as any} label={result.entityType} size="small" color="info" />
                      )}
                    </Box>
                    <Typography variant="body2">{result.interpretation}</Typography>
                  </Paper>

                  {/* Results Count */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Found {result.totalResults} result{result.totalResults !== 1 ? 's' : ''}
                    </Typography>
                  </Box>

                  {/* Results Table */}
                  <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
                    {renderResults()}
                  </Paper>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
