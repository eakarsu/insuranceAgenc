'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import {
  Box, Card, CardContent, Typography, Grid, TextField, Button, FormControl, Autocomplete,
  CircularProgress, Alert, Paper, Chip, List, ListItem, ListItemIcon, ListItemText, Avatar,
} from '@mui/material';
import { Extension, Send, CheckCircle, AttachMoney, Info, Star, StarHalf, StarOutline, AutoFixHigh } from '@mui/icons-material';
import AIResponseFormatter from '@/components/ai/AIResponseFormatter';
import { safeText } from '@/lib/ai-render-utils';

export default function EndorsementRecommenderPage() {
  const [clientId, setClientId] = useState('');
  const [policyId, setPolicyId] = useState('');
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

  const clientPolicies = clientDetails?.policies || [];
  const selectedPolicy = clientPolicies.find((p: any) => p.id === policyId);

  const recommendMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.post('/api/ai', {
        type: 'endorsement_recommender',
        prompt: 'Recommend policy endorsements and riders based on the client profile and current policy. Consider life events and coverage needs.',
        context: { client: clientDetails, policy: selectedPolicy, allPolicies: clientPolicies },
      });
      return response.data.result;
    },
    onSuccess: (data) => setResult(data),
  });

  const getPriorityColor = (priority: string) => {
    const p = safeText(priority).toLowerCase();
    if (p === 'high' || p === 'essential') return 'error';
    if (p === 'medium' || p === 'highly_recommended') return 'warning';
    return 'success';
  };

  const getPriorityIcon = (priority: string) => {
    const p = safeText(priority).toLowerCase();
    if (p === 'high' || p === 'essential') return <Star color="error" />;
    if (p === 'medium' || p === 'highly_recommended') return <StarHalf color="warning" />;
    return <StarOutline color="success" />;
  };

  return (
    <Box className="animate-fade-in">
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Extension sx={{ fontSize: 32, color: 'secondary.main' }} />
        <Box>
          <Typography variant="h4" fontWeight={700}>Endorsement Recommender</Typography>
          <Typography color="text.secondary">AI-powered endorsement and rider recommendations</Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>Select Client & Policy</Typography>

              <FormControl fullWidth sx={{ mb: 3 }}>
                <Autocomplete
                  options={clients}
                  getOptionLabel={(option: any) =>
                    option.type === 'COMMERCIAL' && option.businessName
                      ? option.businessName
                      : `${option.firstName} ${option.lastName}`
                  }
                  value={clients.find((c: any) => c.id === clientId) || null}
                  onChange={(_, value) => { setClientId(value?.id || ''); setPolicyId(''); }}
                  renderInput={(params) => <TextField {...params} label="Client" />}
                />
              </FormControl>

              {clientPolicies.length > 0 && (
                <FormControl fullWidth sx={{ mb: 3 }}>
                  <Autocomplete
                    options={clientPolicies}
                    getOptionLabel={(option: any) => `${option.policyNumber} - ${option.lineOfBusiness?.replace(/_/g, ' ')}`}
                    value={selectedPolicy || null}
                    onChange={(_, value) => setPolicyId(value?.id || '')}
                    renderInput={(params) => <TextField {...params} label="Policy" />}
                  />
                </FormControl>
              )}

              {selectedPolicy && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>Policy Details</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    <Chip label={selectedPolicy.lineOfBusiness?.replace(/_/g, ' ')} size="small" />
                    <Chip label={selectedPolicy.carrier || 'Unknown carrier'} size="small" variant="outlined" />
                    {selectedPolicy.premium && <Chip label={`$${Number(selectedPolicy.premium).toLocaleString()}`} size="small" variant="outlined" />}
                  </Box>
                </Box>
              )}

              {/* Sample Test Data */}
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 3, bgcolor: 'grey.50', border: '1px dashed', borderColor: 'grey.300' }}>
                <Typography variant="caption" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary', mb: 1 }}>
                  <AutoFixHigh fontSize="small" /> SAMPLE TEST DATA
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  <Chip label="First Client" size="small" variant="outlined" color="primary" sx={{ cursor: 'pointer' }}
                    onClick={() => { setClientId(clients?.[0]?.id || ''); setPolicyId(''); }} />
                  <Chip label="Second Client" size="small" variant="outlined" color="primary" sx={{ cursor: 'pointer' }}
                    onClick={() => { setClientId(clients?.[1]?.id || clients?.[0]?.id || ''); setPolicyId(''); }} />
                  <Chip label="Third Client" size="small" variant="outlined" color="primary" sx={{ cursor: 'pointer' }}
                    onClick={() => { setClientId(clients?.[2]?.id || clients?.[0]?.id || ''); setPolicyId(''); }} />
                </Box>
              </Paper>

              <Button
                fullWidth
                variant="contained"
                size="large"
                color="secondary"
                startIcon={recommendMutation.isPending ? <CircularProgress size={20} color="inherit" /> : <Send />}
                onClick={() => recommendMutation.mutate()}
                disabled={!clientId || recommendMutation.isPending}
              >
                {recommendMutation.isPending ? 'Analyzing...' : 'Get Recommendations'}
              </Button>

              {recommendMutation.isError && (
                <Alert severity="error" sx={{ mt: 2 }}>Failed to get recommendations.</Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>Recommended Endorsements</Typography>

              {!result && !recommendMutation.isPending && (
                <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
                  <Extension sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                  <Typography>Select a client to get endorsement recommendations</Typography>
                </Box>
              )}

              {recommendMutation.isPending && (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <CircularProgress size={48} />
                  <Typography sx={{ mt: 2 }}>AI is analyzing coverage needs and recommending endorsements...</Typography>
                </Box>
              )}

              {result && (
                <Box>
                  {/* Endorsements List */}
                  {result.endorsements && result.endorsements.length > 0 && (
                    <Box sx={{ mb: 3 }}>
                      {result.endorsements.map((end: any, i: number) => (
                        <Paper
                          key={i}
                          variant="outlined"
                          sx={{
                            p: 2, mb: 2, borderRadius: 2,
                            borderLeft: 4,
                            borderLeftColor: `${getPriorityColor(end.priority)}.main`,
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {getPriorityIcon(safeText(end.priority))}
                              <Typography variant="subtitle1" fontWeight={600}>{safeText(end, 'name')}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Chip label={safeText(end.priority)} size="small" color={getPriorityColor(safeText(end.priority)) as any} />
                              {(end.estimatedCost || end.estimatedAnnualCost) && (
                                <Chip icon={<AttachMoney />} label={safeText(end.estimatedCost || end.estimatedAnnualCost)} size="small" variant="outlined" />
                              )}
                            </Box>
                          </Box>
                          <Typography variant="body2" color="text.secondary">{safeText(end, 'description', 'coverageGap')}</Typography>
                          {end.formNumber && (
                            <Chip label={safeText(end.formNumber)} size="small" variant="outlined" sx={{ mt: 0.5, fontSize: '0.7rem' }} />
                          )}
                        </Paper>
                      ))}
                    </Box>
                  )}

                  {/* Total Estimated Cost */}
                  {result.totalEstimatedCost && (
                    <Paper
                      elevation={0}
                      sx={{ p: 2, mb: 3, borderRadius: 2, bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.light' }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AttachMoney color="primary" />
                        <Typography variant="subtitle2" fontWeight={600}>Total Estimated Additional Premium</Typography>
                      </Box>
                      <Typography variant="h5" fontWeight={700} color="primary.main">{safeText(result.totalEstimatedCost)}</Typography>
                    </Paper>
                  )}

                  {/* Reasoning */}
                  {result.reasoning && (
                    <Paper elevation={0} sx={{ p: 2, borderRadius: 2, bgcolor: 'grey.50', border: '1px solid', borderColor: 'divider' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Info color="info" fontSize="small" />
                        <Typography variant="subtitle2" fontWeight={600}>Reasoning</Typography>
                      </Box>
                      <Typography variant="body2" sx={{ lineHeight: 1.7 }}>{safeText(result.reasoning)}</Typography>
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
