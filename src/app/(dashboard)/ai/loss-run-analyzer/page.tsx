'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import {
  Box, Card, CardContent, Typography, Grid, TextField, Button, FormControl, Autocomplete,
  CircularProgress, Alert, Paper, Chip, List, ListItem, ListItemIcon, ListItemText, Avatar,
} from '@mui/material';
import { Assessment, Send, TrendingUp, TrendingDown, Warning, TipsAndUpdates, Info, CheckCircle, Remove, AutoFixHigh } from '@mui/icons-material';
import AIResponseFormatter from '@/components/ai/AIResponseFormatter';
import { safeText } from '@/lib/ai-render-utils';

export default function LossRunAnalyzerPage() {
  const [clientId, setClientId] = useState('');
  const [lossRunData, setLossRunData] = useState('');
  const [dateRange, setDateRange] = useState('');
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

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.post('/api/ai', {
        type: 'loss_run_analyzer',
        prompt: `Analyze the following loss run data for underwriting insights and premium recommendations.${dateRange ? ` Date range: ${dateRange}.` : ''}${lossRunData ? ` Loss run data: ${lossRunData}` : ''}`,
        context: { client: clientDetails, claims: clientDetails?.claims, lossRunData, dateRange },
      });
      return response.data.result;
    },
    onSuccess: (data) => setResult(data),
  });

  const getTrendIcon = (direction: string) => {
    if (direction === 'up') return <TrendingUp color="error" />;
    if (direction === 'down') return <TrendingDown color="success" />;
    return <Remove color="action" />;
  };

  const getImpactColor = (impact: string) => {
    if (impact === 'high') return 'error';
    if (impact === 'medium') return 'warning';
    return 'success';
  };

  return (
    <Box className="animate-fade-in">
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Assessment sx={{ fontSize: 32, color: 'error.main' }} />
        <Box>
          <Typography variant="h4" fontWeight={700}>Loss Run Analyzer</Typography>
          <Typography color="text.secondary">AI-powered loss run analysis for underwriting insights</Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>Input Data</Typography>

              <FormControl fullWidth sx={{ mb: 3 }}>
                <Autocomplete
                  options={clients}
                  getOptionLabel={(option: any) =>
                    option.type === 'COMMERCIAL' && option.businessName
                      ? option.businessName
                      : `${option.firstName} ${option.lastName}`
                  }
                  value={clients.find((c: any) => c.id === clientId) || null}
                  onChange={(_, value) => setClientId(value?.id || '')}
                  renderInput={(params) => <TextField {...params} label="Client (optional)" />}
                />
              </FormControl>

              <TextField
                fullWidth
                label="Date Range"
                placeholder="e.g., 2023-2025 or Last 5 years"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                sx={{ mb: 3 }}
              />

              <TextField
                fullWidth
                multiline
                rows={8}
                label="Loss Run Data"
                placeholder="Paste loss run data here, or leave blank to analyze client's claim history..."
                value={lossRunData}
                onChange={(e) => setLossRunData(e.target.value)}
                sx={{ mb: 3 }}
              />

              {/* Sample Test Data */}
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 3, bgcolor: 'grey.50', border: '1px dashed', borderColor: 'grey.300' }}>
                <Typography variant="caption" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary', mb: 1 }}>
                  <AutoFixHigh fontSize="small" /> SAMPLE TEST DATA
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  <Chip label="Restaurant Claims" size="small" variant="outlined" color="primary" sx={{ cursor: 'pointer' }}
                    onClick={() => {
                      setClientId(clients?.[0]?.id || '');
                      setDateRange('01/01/2020 - 12/31/2024');
                      setLossRunData('LOSS RUN REPORT - Bella Italia Restaurant\nPolicy Period: 01/01/2020 - 12/31/2024\nCarrier: Hartford Insurance\n\nClaim 1: 03/15/2020 - Slip and Fall - Customer slipped on wet floor near restroom\n  Status: Closed | Paid: $18,500 | Reserved: $0\nClaim 2: 08/22/2021 - Food Contamination - Patron reported food poisoning\n  Status: Closed | Paid: $4,200 | Reserved: $0\nClaim 3: 11/30/2021 - Employee Burn - Kitchen worker burned by hot oil\n  Status: Closed (WC) | Paid: $12,800 | Reserved: $0\nClaim 4: 06/14/2023 - Slip and Fall - Delivery driver fell on loading dock\n  Status: Closed | Paid: $22,000 | Reserved: $0\nClaim 5: 09/03/2024 - Property Damage - Grease fire in kitchen\n  Status: Open | Paid: $45,000 | Reserved: $15,000\n\nTotal Incurred: $117,500 | Total Paid: $102,500 | Total Reserved: $15,000');
                    }} />
                  <Chip label="Trucking Fleet" size="small" variant="outlined" color="primary" sx={{ cursor: 'pointer' }}
                    onClick={() => {
                      setClientId(clients?.[1]?.id || clients?.[0]?.id || '');
                      setDateRange('01/01/2022 - 12/31/2024');
                      setLossRunData('LOSS RUN REPORT - Express Logistics LLC\nPolicy Period: 01/01/2022 - 12/31/2024\nCarrier: Progressive Commercial\n\nClaim 1: 02/10/2022 - Auto Liability - Rear-end collision on I-95\n  Status: Closed | Paid: $35,000 | Reserved: $0\nClaim 2: 05/18/2022 - Cargo Damage - Refrigerated trailer malfunction\n  Status: Closed | Paid: $28,500 | Reserved: $0\nClaim 3: 09/02/2022 - Auto Physical Damage - Deer strike\n  Status: Closed | Paid: $8,200 | Reserved: $0\nClaim 4: 03/15/2023 - Auto Liability - T-bone accident at intersection\n  Status: Closed | Paid: $125,000 | Reserved: $0\nClaim 5: 07/22/2023 - Workers Comp - Driver back injury loading\n  Status: Closed | Paid: $42,000 | Reserved: $0\nClaim 6: 01/05/2024 - Auto Liability - Multi-vehicle highway accident\n  Status: Open | Paid: $75,000 | Reserved: $200,000\nClaim 7: 08/14/2024 - Cargo Damage - Shifting load damage\n  Status: Open | Paid: $15,000 | Reserved: $10,000\n\nTotal Incurred: $538,700 | Total Paid: $328,700 | Total Reserved: $210,000');
                    }} />
                  <Chip label="Retail Store" size="small" variant="outlined" color="primary" sx={{ cursor: 'pointer' }}
                    onClick={() => {
                      setClientId(clients?.[2]?.id || clients?.[0]?.id || '');
                      setDateRange('01/01/2021 - 12/31/2024');
                      setLossRunData('LOSS RUN REPORT - Downtown Fashion Boutique\nPolicy Period: 01/01/2021 - 12/31/2024\nCarrier: Travelers Insurance\n\nClaim 1: 04/12/2021 - Theft - Shoplifting incident, merchandise stolen\n  Status: Closed | Paid: $3,200 | Reserved: $0\nClaim 2: 12/01/2022 - Slip and Fall - Customer fell on icy sidewalk\n  Status: Closed | Paid: $15,000 | Reserved: $0\nClaim 3: 06/30/2024 - Water Damage - Roof leak damaged inventory\n  Status: Open | Paid: $22,000 | Reserved: $8,000\n\nTotal Incurred: $48,200 | Total Paid: $40,200 | Total Reserved: $8,000');
                    }} />
                </Box>
              </Paper>

              <Button
                fullWidth
                variant="contained"
                size="large"
                color="error"
                startIcon={analyzeMutation.isPending ? <CircularProgress size={20} color="inherit" /> : <Send />}
                onClick={() => analyzeMutation.mutate()}
                disabled={(!clientId && !lossRunData.trim()) || analyzeMutation.isPending}
              >
                {analyzeMutation.isPending ? 'Analyzing...' : 'Analyze Loss Runs'}
              </Button>

              {analyzeMutation.isError && (
                <Alert severity="error" sx={{ mt: 2 }}>Failed to analyze loss runs.</Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>Analysis Results</Typography>

              {!result && !analyzeMutation.isPending && (
                <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
                  <Assessment sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                  <Typography>Select a client or paste loss run data to analyze</Typography>
                </Box>
              )}

              {analyzeMutation.isPending && (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <CircularProgress size={48} />
                  <Typography sx={{ mt: 2 }}>AI is analyzing loss run data...</Typography>
                </Box>
              )}

              {result && (
                <Box>
                  {/* Summary Statistics */}
                  {result.summary && (
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2, mb: 3, borderRadius: 2,
                        background: 'linear-gradient(135deg, #fce4ec 0%, #f8bbd0 100%)',
                        border: '1px solid', borderColor: 'error.light',
                      }}
                    >
                      <Typography variant="subtitle2" fontWeight={600} gutterBottom>Summary Statistics</Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={4}>
                          <Typography variant="caption" color="text.secondary">Total Losses</Typography>
                          <Typography variant="h6" fontWeight={700}>{safeText(result.summary.totalLosses || result.summary.totalIncurred)}</Typography>
                        </Grid>
                        <Grid item xs={4}>
                          <Typography variant="caption" color="text.secondary">Frequency</Typography>
                          <Typography variant="h6" fontWeight={700}>{safeText(result.summary.frequency)}</Typography>
                        </Grid>
                        <Grid item xs={4}>
                          <Typography variant="caption" color="text.secondary">Severity</Typography>
                          <Typography variant="h6" fontWeight={700}>{safeText(result.summary.severity || result.summary.averageSeverity)}</Typography>
                        </Grid>
                      </Grid>
                    </Paper>
                  )}

                  {/* Patterns */}
                  {result.patterns && result.patterns.length > 0 && (
                    <Box sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Info color="primary" />
                        <Typography variant="subtitle1" fontWeight={600}>Identified Patterns</Typography>
                      </Box>
                      <Paper variant="outlined" sx={{ borderRadius: 2 }}>
                        <List dense disablePadding>
                          {result.patterns.map((p: any, i: number) => (
                            <ListItem key={i} sx={{ borderBottom: i < result.patterns.length - 1 ? '1px solid' : 'none', borderColor: 'divider' }}>
                              <ListItemText
                                primary={safeText(p, 'pattern')}
                                secondary={`Significance: ${safeText(p.significance)}`}
                                primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </Paper>
                    </Box>
                  )}

                  {/* Trends */}
                  {result.trends && result.trends.length > 0 && (
                    <Box sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <TrendingUp color="info" />
                        <Typography variant="subtitle1" fontWeight={600}>Trends</Typography>
                      </Box>
                      <Paper variant="outlined" sx={{ borderRadius: 2 }}>
                        <List dense disablePadding>
                          {result.trends.map((t: any, i: number) => (
                            <ListItem key={i} sx={{ borderBottom: i < result.trends.length - 1 ? '1px solid' : 'none', borderColor: 'divider' }}>
                              <ListItemIcon sx={{ minWidth: 40 }}>
                                {getTrendIcon(t.direction)}
                              </ListItemIcon>
                              <ListItemText
                                primary={safeText(t, 'detail', 'metric', 'description')}
                                secondary={safeText(t.period)}
                                primaryTypographyProps={{ variant: 'body2' }}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </Paper>
                    </Box>
                  )}

                  {/* Risk Factors */}
                  {result.riskFactors && result.riskFactors.length > 0 && (
                    <Box sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Warning color="warning" />
                        <Typography variant="subtitle1" fontWeight={600}>Risk Factors</Typography>
                      </Box>
                      <Paper variant="outlined" sx={{ borderRadius: 2, bgcolor: 'warning.50', borderColor: 'warning.light' }}>
                        <List dense disablePadding>
                          {result.riskFactors.map((rf: any, i: number) => (
                            <ListItem key={i} sx={{ borderBottom: i < result.riskFactors.length - 1 ? '1px solid' : 'none', borderColor: 'warning.light' }}>
                              <ListItemText
                                primary={safeText(rf, 'factor')}
                                secondary={safeText(rf, 'lossCorrelation', 'mitigation', 'description')}
                                primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                              />
                              <Chip label={safeText(rf.impact)} size="small" color={getImpactColor(safeText(rf.impact)) as any} />
                            </ListItem>
                          ))}
                        </List>
                      </Paper>
                    </Box>
                  )}

                  {/* Premium Impact */}
                  {result.premiumImpact && (
                    <Paper
                      elevation={0}
                      sx={{ p: 2, mb: 3, borderRadius: 2, bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.light' }}
                    >
                      <Typography variant="subtitle2" fontWeight={600} gutterBottom>Premium Impact</Typography>
                      <Typography variant="body2">{safeText(result.premiumImpact.recommendation || result.premiumImpact, 'recommendation')}</Typography>
                      {result.premiumImpact.percentageChange !== undefined && (
                        <Chip
                          label={`${result.premiumImpact.percentageChange > 0 ? '+' : ''}${result.premiumImpact.percentageChange}%`}
                          size="small"
                          color={result.premiumImpact.percentageChange > 0 ? 'error' : 'success'}
                          sx={{ mt: 1 }}
                        />
                      )}
                    </Paper>
                  )}

                  {/* Recommendations */}
                  {result.recommendations && result.recommendations.length > 0 && (
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <TipsAndUpdates color="success" />
                        <Typography variant="subtitle1" fontWeight={600}>Recommendations</Typography>
                      </Box>
                      <Paper variant="outlined" sx={{ borderRadius: 2, bgcolor: 'success.50', borderColor: 'success.light' }}>
                        <List dense disablePadding>
                          {result.recommendations.map((rec: any, i: number) => (
                            <ListItem key={i} sx={{ borderBottom: i < result.recommendations.length - 1 ? '1px solid' : 'none', borderColor: 'success.light' }}>
                              <ListItemIcon sx={{ minWidth: 40 }}>
                                <CheckCircle color="success" />
                              </ListItemIcon>
                              <ListItemText primary={safeText(rec, 'recommendation', 'action')} primaryTypographyProps={{ variant: 'body2' }} />
                            </ListItem>
                          ))}
                        </List>
                      </Paper>
                    </Box>
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
