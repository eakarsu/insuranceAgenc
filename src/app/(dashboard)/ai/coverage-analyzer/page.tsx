'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import {
  Box, Card, CardContent, Typography, Grid, Button, FormControl, Autocomplete, TextField,
  CircularProgress, Alert, Chip, LinearProgress, List, ListItem, ListItemIcon, ListItemText, Paper, Avatar,
} from '@mui/material';
import { Security, Warning, CheckCircle, Info, Send, Refresh, Shield, TipsAndUpdates, GppBad, AutoFixHigh } from '@mui/icons-material';
import AIResponseFormatter from '@/components/ai/AIResponseFormatter';
import { safeText } from '@/lib/ai-render-utils';

export default function CoverageAnalyzerPage() {
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

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.post('/api/ai', {
        type: 'coverage_analyzer',
        prompt: 'Analyze the current policies for this client and identify any coverage gaps or underinsured areas.',
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

  return (
    <Box className="animate-fade-in">
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Security sx={{ fontSize: 32, color: 'success.main' }} />
        <Box>
          <Typography variant="h4" fontWeight={700}>AI Coverage Analyzer</Typography>
          <Typography color="text.secondary">Identify coverage gaps and get recommendations</Typography>
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
                      if (id) alert('Selected the first client from the list. Click "Analyze Coverage" to run AI coverage gap analysis for this client.');
                    }} />
                  <Chip label="Second Client" size="small" variant="outlined" color="primary" sx={{ cursor: 'pointer' }}
                    onClick={() => {
                      const id = clients?.[1]?.id || clients?.[0]?.id || '';
                      setClientId(id);
                      if (id) alert('Selected the second client from the list. Click "Analyze Coverage" to run AI coverage gap analysis for this client.');
                    }} />
                  <Chip label="Third Client" size="small" variant="outlined" color="primary" sx={{ cursor: 'pointer' }}
                    onClick={() => {
                      const id = clients?.[2]?.id || clients?.[0]?.id || '';
                      setClientId(id);
                      if (id) alert('Selected the third client from the list. Click "Analyze Coverage" to run AI coverage gap analysis for this client.');
                    }} />
                </Box>
              </Paper>

              <Button
                fullWidth
                variant="contained"
                size="large"
                color="success"
                startIcon={analyzeMutation.isPending ? <CircularProgress size={20} color="inherit" /> : <Send />}
                onClick={() => analyzeMutation.mutate()}
                disabled={!clientId || analyzeMutation.isPending}
              >
                {analyzeMutation.isPending ? 'Analyzing...' : 'Analyze Coverage'}
              </Button>

              {analyzeMutation.isError && (
                <Alert severity="error" sx={{ mt: 2 }}>Failed to analyze coverage.</Alert>
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
                  <Security sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                  <Typography>Select a client to analyze their coverage</Typography>
                </Box>
              )}

              {analyzeMutation.isPending && (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <CircularProgress size={48} />
                  <Typography sx={{ mt: 2 }}>AI is analyzing policies and identifying gaps...</Typography>
                </Box>
              )}

              {result && (
                <Box>
                  {/* Coverage Score Card */}
                  {result.riskScore !== undefined && (
                    <Paper
                      elevation={0}
                      sx={{
                        p: 3,
                        mb: 3,
                        borderRadius: 3,
                        background: result.riskScore >= 80
                          ? 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)'
                          : result.riskScore >= 60
                          ? 'linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%)'
                          : 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)',
                        border: '1px solid',
                        borderColor: `${getRiskColor(result.riskScore)}.light`,
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Avatar
                          sx={{
                            width: 80,
                            height: 80,
                            bgcolor: `${getRiskColor(result.riskScore)}.main`,
                            fontSize: '1.5rem',
                            fontWeight: 700,
                          }}
                        >
                          {safeText(result.riskScore)}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" fontWeight={600} gutterBottom>Coverage Score</Typography>
                          <LinearProgress
                            variant="determinate"
                            value={result.riskScore}
                            color={getRiskColor(result.riskScore) as any}
                            sx={{ height: 12, borderRadius: 6, mb: 1 }}
                          />
                          <Typography variant="body2" color="text.secondary">
                            {result.riskScore >= 80 ? 'Excellent coverage - well protected' :
                             result.riskScore >= 60 ? 'Good coverage - some improvements recommended' :
                             'Needs attention - significant gaps identified'}
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  )}

                  {/* Coverage Gaps */}
                  {result.gaps && result.gaps.length > 0 && (
                    <Box sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <GppBad color="error" />
                        <Typography variant="subtitle1" fontWeight={600}>Coverage Gaps Identified</Typography>
                        <Chip label={result.gaps.length} size="small" color="error" />
                      </Box>
                      <Paper variant="outlined" sx={{ borderRadius: 2, bgcolor: 'error.50', borderColor: 'error.light' }}>
                        <List dense disablePadding>
                          {result.gaps.map((gap: any, i: number) => {
                            const gapText = safeText(gap, 'gap', 'description');
                            const gapSeverity = safeText(typeof gap === 'object' ? gap.severity : '');
                            const gapRecommendation = safeText(typeof gap === 'object' ? gap.recommendation : '');
                            const severityColor = ['high', 'critical'].includes(gapSeverity.toLowerCase()) ? 'error'
                              : ['medium', 'moderate'].includes(gapSeverity.toLowerCase()) ? 'warning' : 'info';

                            return (
                              <ListItem key={i} sx={{ borderBottom: i < result.gaps.length - 1 ? '1px solid' : 'none', borderColor: 'error.light' }}>
                                <ListItemIcon sx={{ minWidth: 40 }}>
                                  <Warning color="error" />
                                </ListItemIcon>
                                <ListItemText
                                  primary={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                      <Typography variant="body2" fontWeight={500} component="span">{gapText}</Typography>
                                      {gapSeverity && <Chip label={gapSeverity} size="small" color={severityColor as any} sx={{ height: 20, fontSize: '0.7rem' }} />}
                                    </Box>
                                  }
                                  secondary={gapRecommendation || undefined}
                                  secondaryTypographyProps={{ variant: 'caption' }}
                                />
                              </ListItem>
                            );
                          })}
                        </List>
                      </Paper>
                    </Box>
                  )}

                  {/* Recommendations */}
                  {result.recommendations && result.recommendations.length > 0 && (
                    <Box sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <TipsAndUpdates color="success" />
                        <Typography variant="subtitle1" fontWeight={600}>Recommendations</Typography>
                      </Box>
                      <Paper variant="outlined" sx={{ borderRadius: 2, bgcolor: 'success.50', borderColor: 'success.light' }}>
                        <List dense disablePadding>
                          {result.recommendations.map((rec: any, i: number) => {
                            const recText = safeText(rec, 'action', 'recommendation', 'description');
                            const recPriority = safeText(typeof rec === 'object' ? rec.priority : '');
                            const priorityColor = ['high', 'critical', 'urgent'].includes(recPriority.toLowerCase()) ? 'error'
                              : ['medium', 'moderate'].includes(recPriority.toLowerCase()) ? 'warning' : 'success';

                            return (
                              <ListItem key={i} sx={{ borderBottom: i < result.recommendations.length - 1 ? '1px solid' : 'none', borderColor: 'success.light' }}>
                                <ListItemIcon sx={{ minWidth: 40 }}>
                                  <CheckCircle color="success" />
                                </ListItemIcon>
                                <ListItemText
                                  primary={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                      <Typography variant="body2" component="span">{recText}</Typography>
                                      {recPriority && <Chip label={recPriority} size="small" color={priorityColor as any} sx={{ height: 20, fontSize: '0.7rem' }} />}
                                    </Box>
                                  }
                                />
                              </ListItem>
                            );
                          })}
                        </List>
                      </Paper>
                    </Box>
                  )}

                  {/* Detailed Analysis */}
                  {result.explanation && (
                    <Box sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <Info color="info" />
                        <Typography variant="subtitle1" fontWeight={600}>Detailed Analysis</Typography>
                      </Box>
                      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                        <Typography variant="body2" sx={{ lineHeight: 1.7 }}>{safeText(result.explanation)}</Typography>
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
