'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import {
  Box, Card, CardContent, Typography, Grid, TextField, Button, FormControl, InputLabel, Select, MenuItem, Autocomplete,
  CircularProgress, Alert, Paper, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Avatar,
} from '@mui/material';
import { CompareArrows, Send, CheckCircle, TipsAndUpdates, Info, Warning, AutoFixHigh } from '@mui/icons-material';
import AIResponseFormatter from '@/components/ai/AIResponseFormatter';
import { safeText } from '@/lib/ai-render-utils';

const comparisonFocusOptions = ['Coverage', 'Price', 'Overall'];

export default function PolicyComparisonPage() {
  const [selectedPolicies, setSelectedPolicies] = useState<any[]>([]);
  const [focus, setFocus] = useState('Overall');
  const [result, setResult] = useState<any>(null);

  const { data: policies = [] } = useQuery({
    queryKey: ['policies-list'],
    queryFn: async () => {
      const response = await axios.get('/api/policies?limit=100');
      return response.data.policies || [];
    },
  });

  const compareMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.post('/api/ai', {
        type: 'policy_comparison',
        prompt: `Compare these ${selectedPolicies.length} insurance policies side-by-side with a focus on ${focus}. Highlight key differences and recommend the best option.`,
        context: { policies: selectedPolicies, focus },
      });
      return response.data.result;
    },
    onSuccess: (data) => setResult(data),
  });

  return (
    <Box className="animate-fade-in">
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <CompareArrows sx={{ fontSize: 32, color: 'info.main' }} />
        <Box>
          <Typography variant="h4" fontWeight={700}>Policy Comparison</Typography>
          <Typography color="text.secondary">Compare policies side-by-side with AI analysis</Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>Select Policies</Typography>

              <FormControl fullWidth sx={{ mb: 3 }}>
                <Autocomplete
                  multiple
                  options={policies}
                  getOptionLabel={(option: any) => `${option.policyNumber} - ${option.lineOfBusiness?.replace(/_/g, ' ')} (${option.carrier || 'Unknown'})`}
                  value={selectedPolicies}
                  onChange={(_, value) => setSelectedPolicies(value)}
                  renderInput={(params) => <TextField {...params} label="Policies (select 2+)" />}
                  renderTags={(value, getTagProps) =>
                    value.map((option: any, index: number) => (
                      <Chip {...getTagProps({ index })} key={option.id} label={option.policyNumber} size="small" />
                    ))
                  }
                />
              </FormControl>

              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Comparison Focus</InputLabel>
                <Select value={focus} label="Comparison Focus" onChange={(e) => setFocus(e.target.value)}>
                  {comparisonFocusOptions.map((f) => (
                    <MenuItem key={f} value={f}>{f}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Sample Test Data */}
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 3, bgcolor: 'grey.50', border: '1px dashed', borderColor: 'grey.300' }}>
                <Typography variant="caption" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary', mb: 1 }}>
                  <AutoFixHigh fontSize="small" /> SAMPLE TEST DATA
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  <Chip label="Compare First 2" size="small" variant="outlined" color="primary" sx={{ cursor: 'pointer' }}
                    onClick={() => { setSelectedPolicies(policies.slice(0, 2)); setFocus('Overall'); }} />
                  <Chip label="Compare First 3" size="small" variant="outlined" color="primary" sx={{ cursor: 'pointer' }}
                    onClick={() => { setSelectedPolicies(policies.slice(0, 3)); setFocus('Coverage'); }} />
                  <Chip label="Price Focus (2)" size="small" variant="outlined" color="primary" sx={{ cursor: 'pointer' }}
                    onClick={() => { setSelectedPolicies(policies.slice(0, 2)); setFocus('Price'); }} />
                </Box>
              </Paper>

              <Button
                fullWidth
                variant="contained"
                size="large"
                color="info"
                startIcon={compareMutation.isPending ? <CircularProgress size={20} color="inherit" /> : <Send />}
                onClick={() => compareMutation.mutate()}
                disabled={selectedPolicies.length < 2 || compareMutation.isPending}
              >
                {compareMutation.isPending ? 'Comparing...' : 'Compare Policies'}
              </Button>

              {selectedPolicies.length > 0 && selectedPolicies.length < 2 && (
                <Alert severity="info" sx={{ mt: 2 }}>Select at least 2 policies to compare.</Alert>
              )}

              {compareMutation.isError && (
                <Alert severity="error" sx={{ mt: 2 }}>Failed to compare policies.</Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>Comparison Results</Typography>

              {!result && !compareMutation.isPending && (
                <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
                  <CompareArrows sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                  <Typography>Select 2 or more policies to compare</Typography>
                </Box>
              )}

              {compareMutation.isPending && (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <CircularProgress size={48} />
                  <Typography sx={{ mt: 2 }}>AI is comparing policies and analyzing differences...</Typography>
                </Box>
              )}

              {result && (
                <Box>
                  {/* Comparison Table */}
                  {result.comparison && result.comparison.length > 0 && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle1" fontWeight={600} gutterBottom>Side-by-Side Comparison</Typography>
                      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                        <Table size="small">
                          <TableHead>
                            <TableRow sx={{ bgcolor: 'grey.50' }}>
                              <TableCell sx={{ fontWeight: 600 }}>Feature</TableCell>
                              {selectedPolicies.map((p: any) => (
                                <TableCell key={p.id} sx={{ fontWeight: 600 }}>{p.policyNumber}</TableCell>
                              ))}
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {result.comparison.map((row: any, i: number) => (
                              <TableRow key={i} hover>
                                <TableCell sx={{ fontWeight: 500 }}>{safeText(row.field)}</TableCell>
                                {selectedPolicies.map((p: any, j: number) => (
                                  <TableCell key={p.id}>{safeText(row[`policy${j + 1}`] || row[p.policyNumber]) || '-'}</TableCell>
                                ))}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                  )}

                  {/* Key Differences */}
                  {result.differences && result.differences.length > 0 && (
                    <Box sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Warning color="warning" />
                        <Typography variant="subtitle1" fontWeight={600}>Key Differences</Typography>
                      </Box>
                      <Paper variant="outlined" sx={{ borderRadius: 2, bgcolor: 'warning.50', borderColor: 'warning.light' }}>
                        {result.differences.map((diff: any, i: number) => (
                          <Box key={i} sx={{ p: 2, borderBottom: i < result.differences.length - 1 ? '1px solid' : 'none', borderColor: 'warning.light' }}>
                            <Typography variant="body2" fontWeight={600}>{safeText(diff.field)}</Typography>
                            <Typography variant="body2" color="text.secondary">{safeText(diff.description)}</Typography>
                            {diff.advantage && <Chip label={`Advantage: ${safeText(diff.advantage)}`} size="small" color="success" sx={{ mt: 0.5 }} />}
                          </Box>
                        ))}
                      </Paper>
                    </Box>
                  )}

                  {/* Recommendation */}
                  {result.recommendation && (
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2, mb: 3, borderRadius: 2,
                        background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
                        border: '1px solid', borderColor: 'success.light',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <TipsAndUpdates color="success" />
                        <Typography variant="subtitle2" fontWeight={600}>AI Recommendation</Typography>
                      </Box>
                      {result.recommendation.choice && (
                        <Typography variant="h6" fontWeight={600} color="success.main" gutterBottom>{safeText(result.recommendation.choice)}</Typography>
                      )}
                      <Typography variant="body2">{safeText(result.recommendation.reasoning)}</Typography>
                    </Paper>
                  )}

                  {/* Cost Analysis */}
                  {result.costAnalysis && (
                    <Paper elevation={0} sx={{ p: 2, borderRadius: 2, bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.light' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Info color="primary" />
                        <Typography variant="subtitle2" fontWeight={600}>Cost Analysis</Typography>
                      </Box>
                      <Typography variant="body2">{safeText(result.costAnalysis.summary)}</Typography>
                      {result.costAnalysis.savings && (
                        <Typography variant="body2" fontWeight={600} color="success.main" sx={{ mt: 1 }}>
                          Potential Savings: {safeText(result.costAnalysis.savings)}
                        </Typography>
                      )}
                    </Paper>
                  )}

                  {result.text && (
                    <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, mt: 2 }}>
                      <AIResponseFormatter text={result.text} />
                    </Paper>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
