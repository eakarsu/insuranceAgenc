'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import {
  Box, Card, CardContent, Typography, Button, Grid, Avatar, Chip, LinearProgress,
  List, ListItem, ListItemIcon, ListItemText, Paper, CircularProgress, Alert,
  FormControl, Autocomplete, TextField,
} from '@mui/material';
import {
  Analytics, TrendingUp, Warning, CheckCircle, Person, AutoAwesome, Send,
  TipsAndUpdates, Speed, Refresh, AutoFixHigh,
} from '@mui/icons-material';
import AIResponseFormatter from '@/components/ai/AIResponseFormatter';
import { safeText } from '@/lib/ai-render-utils';

export default function RenewalPredictorPage() {
  const [clientId, setClientId] = useState('');
  const [result, setResult] = useState<any>(null);

  const { data: clients = [] } = useQuery({
    queryKey: ['clients-list'],
    queryFn: async () => {
      const response = await axios.get('/api/clients?limit=100');
      return response.data.clients || [];
    },
  });

  const { data: clientDetails } = useQuery({
    queryKey: ['client', clientId],
    queryFn: async () => {
      const response = await axios.get(`/api/clients/${clientId}`);
      return response.data;
    },
    enabled: !!clientId,
  });

  const predictMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.post('/api/ai', {
        type: 'renewal_predictor',
        prompt: 'Analyze this client and their policies to predict renewal probability and suggest retention strategies.',
        context: { client: clientDetails, policies: clientDetails?.policies },
      });
      return response.data.result;
    },
    onSuccess: (data) => setResult(data),
  });

  const getRiskColor = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const getRiskLabel = (score: number) => {
    if (score >= 80) return 'High Retention';
    if (score >= 60) return 'Medium Risk';
    return 'At Risk';
  };

  return (
    <Box className="animate-fade-in">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Analytics sx={{ fontSize: 32, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4" fontWeight={700}>AI Renewal Predictor</Typography>
            <Typography color="text.secondary">Machine learning predictions for policy renewal likelihood</Typography>
          </Box>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>Select Client</Typography>

              <FormControl fullWidth sx={{ mb: 3 }}>
                <Autocomplete
                  options={clients}
                  getOptionLabel={(option: any) =>
                    option.type === 'COMMERCIAL' && option.businessName
                      ? option.businessName
                      : `${option.firstName} ${option.lastName}`
                  }
                  value={clients.find((c: any) => c.id === clientId) || null}
                  onChange={(_, value) => {
                    setClientId(value?.id || '');
                    setResult(null);
                  }}
                  renderInput={(params) => <TextField {...params} label="Client" />}
                />
              </FormControl>

              {clientDetails && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>Active Policies</Typography>
                  {clientDetails.policies?.length > 0 ? (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {clientDetails.policies.map((p: any) => (
                        <Chip
                          key={p.id}
                          label={p.lineOfBusiness.replace(/_/g, ' ')}
                          size="small"
                          color={p.status === 'ACTIVE' ? 'success' : 'default'}
                        />
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">No active policies</Typography>
                  )}
                </Box>
              )}

              {/* Sample Test Data */}
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 3, bgcolor: 'grey.50', border: '1px dashed', borderColor: 'grey.300' }}>
                <Typography variant="caption" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary', mb: 1 }}>
                  <AutoFixHigh fontSize="small" /> SAMPLE TEST DATA
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  <Chip label="First Client" size="small" variant="outlined" color="primary" sx={{ cursor: 'pointer' }}
                    onClick={() => {
                      const id = clients?.[0]?.id || '';
                      setClientId(id);
                      setResult(null);
                    }} />
                  <Chip label="Second Client" size="small" variant="outlined" color="primary" sx={{ cursor: 'pointer' }}
                    onClick={() => {
                      const id = clients?.[1]?.id || clients?.[0]?.id || '';
                      setClientId(id);
                      setResult(null);
                    }} />
                  <Chip label="Third Client" size="small" variant="outlined" color="primary" sx={{ cursor: 'pointer' }}
                    onClick={() => {
                      const id = clients?.[2]?.id || clients?.[0]?.id || '';
                      setClientId(id);
                      setResult(null);
                    }} />
                </Box>
              </Paper>

              <Button
                fullWidth
                variant="contained"
                size="large"
                startIcon={predictMutation.isPending ? <CircularProgress size={20} color="inherit" /> : <AutoAwesome />}
                onClick={() => predictMutation.mutate()}
                disabled={!clientId || predictMutation.isPending}
              >
                {predictMutation.isPending ? 'Analyzing...' : 'Run Prediction'}
              </Button>

              {predictMutation.isError && (
                <Alert severity="error" sx={{ mt: 2 }}>Failed to run prediction.</Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={600}>Prediction Results</Typography>
                {result && (
                  <Button size="small" startIcon={<Refresh />} onClick={() => predictMutation.mutate()}>
                    Re-analyze
                  </Button>
                )}
              </Box>

              {!result && !predictMutation.isPending && (
                <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
                  <Analytics sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                  <Typography>Select a client to predict renewal probability</Typography>
                </Box>
              )}

              {predictMutation.isPending && (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <CircularProgress size={48} />
                  <Typography sx={{ mt: 2 }}>AI is analyzing client history and predicting renewal...</Typography>
                </Box>
              )}

              {result && (
                <Box>
                  {/* Retention Score Card */}
                  {(result.retentionScore !== undefined || result.renewalProbability !== undefined) && (
                    <Paper
                      elevation={0}
                      sx={{
                        p: 3,
                        mb: 3,
                        borderRadius: 3,
                        background: (result.retentionScore || result.renewalProbability) >= 80
                          ? 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)'
                          : (result.retentionScore || result.renewalProbability) >= 60
                          ? 'linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%)'
                          : 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)',
                        border: '1px solid',
                        borderColor: `${getRiskColor(result.retentionScore || result.renewalProbability)}.light`,
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Avatar
                          sx={{
                            width: 80,
                            height: 80,
                            bgcolor: `${getRiskColor(result.retentionScore || result.renewalProbability)}.main`,
                            fontSize: '1.5rem',
                            fontWeight: 700,
                          }}
                        >
                          {result.retentionScore || result.renewalProbability}%
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" fontWeight={600} gutterBottom>Renewal Probability</Typography>
                          <LinearProgress
                            variant="determinate"
                            value={result.retentionScore || result.renewalProbability}
                            color={getRiskColor(result.retentionScore || result.renewalProbability) as any}
                            sx={{ height: 12, borderRadius: 6, mb: 1 }}
                          />
                          <Chip
                            label={getRiskLabel(result.retentionScore || result.renewalProbability)}
                            color={getRiskColor(result.retentionScore || result.renewalProbability) as any}
                            size="small"
                          />
                        </Box>
                      </Box>
                    </Paper>
                  )}

                  {/* Confidence Level */}
                  {result.confidenceLevel && (
                    <Box sx={{ mb: 2 }}>
                      <Chip
                        label={`Confidence: ${safeText(result.confidenceLevel)}`}
                        size="small"
                        color={safeText(result.confidenceLevel).toLowerCase().includes('high') ? 'success' : 'warning'}
                        variant="outlined"
                      />
                    </Box>
                  )}

                  {/* Risk Factors */}
                  {result.riskFactors && result.riskFactors.length > 0 && (
                    <Box sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <Warning color="warning" />
                        <Typography variant="subtitle1" fontWeight={600}>Risk Factors</Typography>
                      </Box>
                      <Paper variant="outlined" sx={{ borderRadius: 2, bgcolor: 'warning.50' }}>
                        <List dense disablePadding>
                          {result.riskFactors.map((factor: any, i: number) => {
                            const factorText = safeText(factor, 'factor', 'name', 'description');
                            const factorDetail = typeof factor === 'object' ? safeText(factor.detail, 'detail') : '';
                            const factorCategory = typeof factor === 'object' ? safeText(factor.category) : '';
                            const impactVal = typeof factor === 'object' ? factor.impact : undefined;
                            const impactStr = impactVal !== undefined && impactVal !== null ? String(impactVal) : '';

                            return (
                              <ListItem key={i} sx={{ borderBottom: i < result.riskFactors.length - 1 ? '1px solid' : 'none', borderColor: 'warning.light' }}>
                                <ListItemIcon sx={{ minWidth: 40 }}>
                                  <Warning color="warning" />
                                </ListItemIcon>
                                <ListItemText
                                  primary={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                      <Typography variant="body2" component="span">{factorText}</Typography>
                                      {factorCategory && <Chip label={factorCategory} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} />}
                                      {impactStr && <Chip label={impactStr} size="small" color="warning" sx={{ height: 20, fontSize: '0.7rem' }} />}
                                    </Box>
                                  }
                                  secondary={factorDetail || undefined}
                                  secondaryTypographyProps={{ variant: 'caption' }}
                                />
                              </ListItem>
                            );
                          })}
                        </List>
                      </Paper>
                    </Box>
                  )}

                  {/* Retention Strategies */}
                  {result.strategies && result.strategies.length > 0 && (
                    <Box sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <TipsAndUpdates color="success" />
                        <Typography variant="subtitle1" fontWeight={600}>Retention Strategies</Typography>
                      </Box>
                      <Paper variant="outlined" sx={{ borderRadius: 2, bgcolor: 'success.50' }}>
                        <List dense disablePadding>
                          {result.strategies.map((strategy: any, i: number) => {
                            const strategyText = safeText(strategy, 'strategy', 'action', 'recommendation');
                            const effort = typeof strategy === 'object' ? safeText(strategy.effort) : '';
                            const timing = typeof strategy === 'object' ? safeText(strategy.timing) : '';
                            const owner = typeof strategy === 'object' ? safeText(strategy.owner) : '';

                            return (
                              <ListItem key={i} sx={{ borderBottom: i < result.strategies.length - 1 ? '1px solid' : 'none', borderColor: 'success.light' }}>
                                <ListItemIcon sx={{ minWidth: 40 }}>
                                  <CheckCircle color="success" />
                                </ListItemIcon>
                                <ListItemText
                                  primary={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                      <Typography variant="body2" component="span">{strategyText}</Typography>
                                      {effort && <Chip label={effort} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} />}
                                      {owner && <Chip label={owner} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} />}
                                    </Box>
                                  }
                                  secondary={timing || undefined}
                                  secondaryTypographyProps={{ variant: 'caption' }}
                                />
                              </ListItem>
                            );
                          })}
                        </List>
                      </Paper>
                    </Box>
                  )}

                  {/* Projected Premium */}
                  {result.projectedPremium && (
                    <Box sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <Speed color="info" />
                        <Typography variant="subtitle1" fontWeight={600}>Projected Renewal Premium</Typography>
                      </Box>
                      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                        {typeof result.projectedPremium === 'object' ? (
                          <Box>
                            {result.projectedPremium.projected && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                                <Avatar sx={{ bgcolor: 'info.main' }}>$</Avatar>
                                <Typography variant="h5" fontWeight={700}>{safeText(result.projectedPremium.projected)}</Typography>
                              </Box>
                            )}
                            {result.projectedPremium.current && (
                              <Typography variant="body2" color="text.secondary" sx={{ ml: 7 }}>Current: {safeText(result.projectedPremium.current)}</Typography>
                            )}
                            {result.projectedPremium.change && (
                              <Typography variant="body2" color="text.secondary" sx={{ ml: 7 }}>Change: {safeText(result.projectedPremium.change)}</Typography>
                            )}
                            {result.projectedPremium.marketComparison && (
                              <Typography variant="body2" color="text.secondary" sx={{ ml: 7 }}>Market: {safeText(result.projectedPremium.marketComparison)}</Typography>
                            )}
                          </Box>
                        ) : (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ bgcolor: 'info.main' }}>$</Avatar>
                            <Typography variant="h5" fontWeight={700}>
                              ${Number(result.projectedPremium).toLocaleString()}
                            </Typography>
                          </Box>
                        )}
                      </Paper>
                    </Box>
                  )}

                  {/* Timeline */}
                  {result.timeline && typeof result.timeline === 'object' && !Array.isArray(result.timeline) && (
                    <Box sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <TrendingUp color="primary" />
                        <Typography variant="subtitle1" fontWeight={600}>Timeline</Typography>
                      </Box>
                      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: 'primary.50' }}>
                        {result.timeline.daysToRenewal !== undefined && (
                          <Typography variant="body2" sx={{ mb: 0.5 }}><strong>Days to Renewal:</strong> {result.timeline.daysToRenewal}</Typography>
                        )}
                        {result.timeline.criticalDate && (
                          <Typography variant="body2" sx={{ mb: 0.5 }}><strong>Critical Date:</strong> {safeText(result.timeline.criticalDate)}</Typography>
                        )}
                        {result.timeline.actionDeadline && (
                          <Typography variant="body2"><strong>Action Deadline:</strong> {safeText(result.timeline.actionDeadline)}</Typography>
                        )}
                      </Paper>
                    </Box>
                  )}

                  {/* Fallback for text responses */}
                  {result.text && (
                    <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
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
