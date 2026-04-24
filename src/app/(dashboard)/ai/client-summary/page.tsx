'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import {
  Box, Card, CardContent, Typography, Grid, TextField, Button, FormControl, Autocomplete,
  CircularProgress, Alert, Paper, Chip, LinearProgress, List, ListItem, ListItemIcon, ListItemText, Avatar,
} from '@mui/material';
import {
  PersonSearch, Send, CheckCircle, Warning, TrendingUp, CalendarMonth, TipsAndUpdates, Shield, Info, AutoFixHigh,
} from '@mui/icons-material';
import AIResponseFormatter from '@/components/ai/AIResponseFormatter';
import { safeText } from '@/lib/ai-render-utils';

export default function ClientSummaryPage() {
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

  const summaryMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.post('/api/ai', {
        type: 'client_summary',
        prompt: 'Generate a comprehensive summary for this insurance client including risk profile, portfolio analysis, lifetime value, and recommendations.',
        context: { client: clientDetails, policies: clientDetails?.policies, claims: clientDetails?.claims },
      });
      return response.data.result;
    },
    onSuccess: (data) => setResult(data),
  });

  const getRiskColor = (level: string) => {
    if (level === 'low') return 'success';
    if (level === 'medium') return 'warning';
    return 'error';
  };

  return (
    <Box className="animate-fade-in">
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <PersonSearch sx={{ fontSize: 32, color: 'secondary.main' }} />
        <Box>
          <Typography variant="h4" fontWeight={700}>AI Client Summary</Typography>
          <Typography color="text.secondary">Generate comprehensive client profiles with AI insights</Typography>
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
                  onChange={(_, value) => setClientId(value?.id || '')}
                  renderInput={(params) => <TextField {...params} label="Client" />}
                />
              </FormControl>

              {clientDetails && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>Current Policies</Typography>
                  {clientDetails.policies?.length > 0 ? (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {clientDetails.policies.map((p: any) => (
                        <Chip key={p.id} label={p.lineOfBusiness.replace(/_/g, ' ')} size="small" />
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
                      if (id) alert('Selected the first client from the list. Click "Generate Summary" to create an AI-powered client profile summary.');
                    }} />
                  <Chip label="Second Client" size="small" variant="outlined" color="primary" sx={{ cursor: 'pointer' }}
                    onClick={() => {
                      const id = clients?.[1]?.id || clients?.[0]?.id || '';
                      setClientId(id);
                      if (id) alert('Selected the second client from the list. Click "Generate Summary" to create an AI-powered client profile summary.');
                    }} />
                  <Chip label="Third Client" size="small" variant="outlined" color="primary" sx={{ cursor: 'pointer' }}
                    onClick={() => {
                      const id = clients?.[2]?.id || clients?.[0]?.id || '';
                      setClientId(id);
                      if (id) alert('Selected the third client from the list. Click "Generate Summary" to create an AI-powered client profile summary.');
                    }} />
                </Box>
              </Paper>

              <Button
                fullWidth
                variant="contained"
                size="large"
                color="secondary"
                startIcon={summaryMutation.isPending ? <CircularProgress size={20} color="inherit" /> : <Send />}
                onClick={() => summaryMutation.mutate()}
                disabled={!clientId || summaryMutation.isPending}
              >
                {summaryMutation.isPending ? 'Generating...' : 'Generate Summary'}
              </Button>

              {summaryMutation.isError && (
                <Alert severity="error" sx={{ mt: 2 }}>Failed to generate summary.</Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>Client Summary</Typography>

              {!result && !summaryMutation.isPending && (
                <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
                  <PersonSearch sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                  <Typography>Select a client to generate their AI summary</Typography>
                </Box>
              )}

              {summaryMutation.isPending && (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <CircularProgress size={48} />
                  <Typography sx={{ mt: 2 }}>AI is analyzing client data and generating summary...</Typography>
                </Box>
              )}

              {result && (
                <Box>
                  {/* Overview */}
                  {result.overview && (
                    <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 2, bgcolor: 'grey.50', border: '1px solid', borderColor: 'divider' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Info color="primary" fontSize="small" />
                        <Typography variant="subtitle2" fontWeight={600}>Overview</Typography>
                      </Box>
                      <Typography variant="body2" sx={{ lineHeight: 1.7 }}>{result.overview}</Typography>
                    </Paper>
                  )}

                  {/* Risk Profile */}
                  {result.riskProfile && (
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2, mb: 3, borderRadius: 2,
                        background: result.riskProfile.score >= 70
                          ? 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)'
                          : result.riskProfile.score >= 40
                          ? 'linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%)'
                          : 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ width: 64, height: 64, bgcolor: result.riskProfile.score >= 70 ? 'success.main' : result.riskProfile.score >= 40 ? 'warning.main' : 'error.main', fontWeight: 700 }}>
                          {result.riskProfile.score}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle1" fontWeight={600}>Risk Profile Score</Typography>
                          <LinearProgress
                            variant="determinate"
                            value={result.riskProfile.score}
                            color={result.riskProfile.score >= 70 ? 'success' : result.riskProfile.score >= 40 ? 'warning' : 'error'}
                            sx={{ height: 10, borderRadius: 5, mb: 1 }}
                          />
                          {result.riskProfile.factors && (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {result.riskProfile.factors.map((f: any, i: number) => (
                                <Chip key={i} label={safeText(f, 'factor', 'name')} size="small" variant="outlined" />
                              ))}
                            </Box>
                          )}
                        </Box>
                      </Box>
                    </Paper>
                  )}

                  {/* Portfolio Analysis */}
                  {result.portfolioAnalysis && (
                    <Box sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Shield color="primary" />
                        <Typography variant="subtitle1" fontWeight={600}>Portfolio Analysis</Typography>
                      </Box>
                      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                        <Typography variant="body2" sx={{ mb: 1 }}>{safeText(result.portfolioAnalysis.summary)}</Typography>
                        {result.portfolioAnalysis.gaps?.length > 0 && (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                            {result.portfolioAnalysis.gaps.map((g: any, i: number) => (
                              <Chip key={i} label={safeText(g, 'gap', 'description')} size="small" color="warning" icon={<Warning />} />
                            ))}
                          </Box>
                        )}
                      </Paper>
                    </Box>
                  )}

                  {/* Lifetime Value */}
                  {result.lifetimeValue && (
                    <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 2, bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.light' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <TrendingUp color="primary" />
                        <Typography variant="subtitle2" fontWeight={600}>Lifetime Value</Typography>
                      </Box>
                      <Typography variant="h5" fontWeight={700} color="primary.main">{safeText(result.lifetimeValue.estimated)}</Typography>
                      <Typography variant="body2" color="text.secondary">Trend: {safeText(result.lifetimeValue.trend)}</Typography>
                    </Paper>
                  )}

                  {/* Key Dates */}
                  {result.keyDates && result.keyDates.length > 0 && (
                    <Box sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <CalendarMonth color="info" />
                        <Typography variant="subtitle1" fontWeight={600}>Key Dates</Typography>
                      </Box>
                      <Paper variant="outlined" sx={{ borderRadius: 2 }}>
                        <List dense disablePadding>
                          {result.keyDates.map((kd: any, i: number) => (
                            <ListItem key={i} sx={{ borderBottom: i < result.keyDates.length - 1 ? '1px solid' : 'none', borderColor: 'divider' }}>
                              <ListItemIcon sx={{ minWidth: 40 }}>
                                <CalendarMonth color="action" fontSize="small" />
                              </ListItemIcon>
                              <ListItemText primary={safeText(kd, 'event', 'description', 'action')} secondary={safeText(kd.date)} />
                            </ListItem>
                          ))}
                        </List>
                      </Paper>
                    </Box>
                  )}

                  {/* Recommendations */}
                  {result.recommendations && result.recommendations.length > 0 && (
                    <Box sx={{ mb: 3 }}>
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
                              <ListItemText primary={safeText(rec, 'recommendation', 'action', 'description')} primaryTypographyProps={{ variant: 'body2' }} />
                              {typeof rec === 'object' && rec?.priority && (
                                <Chip label={rec.priority} size="small" color={rec.priority === 'high' ? 'error' : rec.priority === 'medium' ? 'warning' : 'default'} sx={{ ml: 1 }} />
                              )}
                            </ListItem>
                          ))}
                        </List>
                      </Paper>
                    </Box>
                  )}

                  {/* Retention Risk */}
                  {result.retentionRisk && (
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2, borderRadius: 2,
                        bgcolor: result.retentionRisk.level === 'low' ? 'success.50' : result.retentionRisk.level === 'medium' ? 'warning.50' : 'error.50',
                        border: '1px solid',
                        borderColor: `${getRiskColor(result.retentionRisk.level)}.light`,
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Warning color={getRiskColor(result.retentionRisk.level) as any} />
                        <Typography variant="subtitle2" fontWeight={600}>Retention Risk</Typography>
                        <Chip label={result.retentionRisk.level?.toUpperCase()} size="small" color={getRiskColor(result.retentionRisk.level) as any} />
                      </Box>
                      {result.retentionRisk.factors?.map((f: any, i: number) => (
                        <Typography key={i} variant="body2">- {safeText(f, 'factor', 'description')}{typeof f === 'object' && f?.mitigation ? ` (Mitigation: ${f.mitigation})` : ''}</Typography>
                      ))}
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
