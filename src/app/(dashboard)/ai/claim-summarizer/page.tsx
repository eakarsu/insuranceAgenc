'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import {
  Box, Card, CardContent, Typography, Grid, TextField, Button, FormControl, Autocomplete,
  CircularProgress, Alert, Paper, Chip, List, ListItem, ListItemIcon, ListItemText, Avatar, Switch, FormControlLabel,
} from '@mui/material';
import {
  Summarize, Send, CheckCircle, Warning, Timeline, FactCheck, Assignment, Info, AutoFixHigh,
} from '@mui/icons-material';
import AIResponseFormatter from '@/components/ai/AIResponseFormatter';
import { safeText } from '@/lib/ai-render-utils';

export default function ClaimSummarizerPage() {
  const [claimId, setClaimId] = useState('');
  const [includeDocuments, setIncludeDocuments] = useState(true);
  const [result, setResult] = useState<any>(null);

  const { data: claims = [] } = useQuery({
    queryKey: ['claims-list'],
    queryFn: async () => {
      const response = await axios.get('/api/claims?limit=100');
      return response.data.claims || [];
    },
  });

  const selectedClaim = claims.find((c: any) => c.id === claimId);

  const summarizeMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.post('/api/ai', {
        type: 'claim_summarizer',
        prompt: `Summarize this insurance claim into a concise executive summary. Include timeline, key facts, and outstanding actions.${includeDocuments ? ' Include document analysis.' : ''}`,
        context: { claim: selectedClaim },
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
        <Summarize sx={{ fontSize: 32, color: 'warning.main' }} />
        <Box>
          <Typography variant="h4" fontWeight={700}>Claim Notes Summarizer</Typography>
          <Typography color="text.secondary">Get AI-powered executive summaries of claims</Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>Select Claim</Typography>

              <FormControl fullWidth sx={{ mb: 3 }}>
                <Autocomplete
                  options={claims}
                  getOptionLabel={(option: any) => `${option.claimNumber || 'Claim'} - ${option.status}`}
                  value={selectedClaim || null}
                  onChange={(_, value) => setClaimId(value?.id || '')}
                  renderInput={(params) => <TextField {...params} label="Claim" />}
                />
              </FormControl>

              {selectedClaim && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>Claim Details</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    <Chip label={selectedClaim.status} size="small" color={selectedClaim.status === 'OPEN' ? 'warning' : 'default'} />
                    {selectedClaim.amount && <Chip label={`$${Number(selectedClaim.amount).toLocaleString()}`} size="small" variant="outlined" />}
                  </Box>
                </Box>
              )}

              <FormControlLabel
                control={<Switch checked={includeDocuments} onChange={(e) => setIncludeDocuments(e.target.checked)} />}
                label="Include document analysis"
                sx={{ mb: 3, display: 'block' }}
              />

              {/* Sample Test Data */}
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 3, bgcolor: 'grey.50', border: '1px dashed', borderColor: 'grey.300' }}>
                <Typography variant="caption" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary', mb: 1 }}>
                  <AutoFixHigh fontSize="small" /> SAMPLE TEST DATA
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  <Chip label="First Claim" size="small" variant="outlined" color="primary" sx={{ cursor: 'pointer' }}
                    onClick={() => {
                      const id = claims?.[0]?.id || '';
                      setClaimId(id);
                      setIncludeDocuments(true);
                      if (id) alert('Selected the first claim with document analysis enabled. Click "Summarize Claim" to generate an AI executive summary.');
                    }} />
                  <Chip label="Second Claim" size="small" variant="outlined" color="primary" sx={{ cursor: 'pointer' }}
                    onClick={() => {
                      const id = claims?.[1]?.id || claims?.[0]?.id || '';
                      setClaimId(id);
                      setIncludeDocuments(true);
                      if (id) alert('Selected the second claim with document analysis enabled. Click "Summarize Claim" to generate an AI executive summary.');
                    }} />
                  <Chip label="Third Claim (No Docs)" size="small" variant="outlined" color="primary" sx={{ cursor: 'pointer' }}
                    onClick={() => {
                      const id = claims?.[2]?.id || claims?.[0]?.id || '';
                      setClaimId(id);
                      setIncludeDocuments(false);
                      if (id) alert('Selected the third claim with document analysis disabled. Click "Summarize Claim" to generate an AI executive summary without document analysis.');
                    }} />
                </Box>
              </Paper>

              <Button
                fullWidth
                variant="contained"
                size="large"
                color="warning"
                startIcon={summarizeMutation.isPending ? <CircularProgress size={20} color="inherit" /> : <Send />}
                onClick={() => summarizeMutation.mutate()}
                disabled={!claimId || summarizeMutation.isPending}
              >
                {summarizeMutation.isPending ? 'Summarizing...' : 'Summarize Claim'}
              </Button>

              {summarizeMutation.isError && (
                <Alert severity="error" sx={{ mt: 2 }}>Failed to summarize claim.</Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>Claim Summary</Typography>

              {!result && !summarizeMutation.isPending && (
                <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
                  <Summarize sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                  <Typography>Select a claim to generate its executive summary</Typography>
                </Box>
              )}

              {summarizeMutation.isPending && (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <CircularProgress size={48} />
                  <Typography sx={{ mt: 2 }}>AI is analyzing claim data and generating summary...</Typography>
                </Box>
              )}

              {result && (
                <Box>
                  {/* Executive Summary */}
                  {result.executiveSummary && (
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2, mb: 3, borderRadius: 2,
                        background: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)',
                        border: '1px solid', borderColor: 'warning.light',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Info color="warning" fontSize="small" />
                        <Typography variant="subtitle2" fontWeight={600}>Executive Summary</Typography>
                      </Box>
                      <Typography variant="body2" sx={{ lineHeight: 1.7 }}>{safeText(result.executiveSummary)}</Typography>
                    </Paper>
                  )}

                  {/* Timeline */}
                  {result.timeline && result.timeline.length > 0 && (
                    <Box sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Timeline color="info" />
                        <Typography variant="subtitle1" fontWeight={600}>Timeline</Typography>
                      </Box>
                      <Paper variant="outlined" sx={{ borderRadius: 2 }}>
                        <List dense disablePadding>
                          {result.timeline.map((item: any, i: number) => (
                            <ListItem key={i} sx={{ borderBottom: i < result.timeline.length - 1 ? '1px solid' : 'none', borderColor: 'divider' }}>
                              <ListItemIcon sx={{ minWidth: 40 }}>
                                <Avatar sx={{ width: 28, height: 28, fontSize: '0.75rem', bgcolor: 'info.main' }}>{i + 1}</Avatar>
                              </ListItemIcon>
                              <ListItemText
                                primary={safeText(item, 'event', 'description')}
                                secondary={safeText(item.date)}
                                primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </Paper>
                    </Box>
                  )}

                  {/* Key Facts */}
                  {result.keyFacts && result.keyFacts.length > 0 && (
                    <Box sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Assignment color="primary" />
                        <Typography variant="subtitle1" fontWeight={600}>Key Facts</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {result.keyFacts.map((fact: any, i: number) => (
                          <Chip key={i} label={safeText(fact, 'fact', 'description')} variant="outlined" />
                        ))}
                      </Box>
                    </Box>
                  )}

                  {/* Outstanding Actions */}
                  {result.outstandingActions && result.outstandingActions.length > 0 && (
                    <Box sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <CheckCircle color="success" />
                        <Typography variant="subtitle1" fontWeight={600}>Outstanding Actions</Typography>
                        <Chip label={result.outstandingActions.length} size="small" color="warning" />
                      </Box>
                      <Paper variant="outlined" sx={{ borderRadius: 2 }}>
                        <List dense disablePadding>
                          {result.outstandingActions.map((item: any, i: number) => (
                            <ListItem key={i} sx={{ borderBottom: i < result.outstandingActions.length - 1 ? '1px solid' : 'none', borderColor: 'divider' }}>
                              <ListItemIcon sx={{ minWidth: 40 }}>
                                <CheckCircle color="action" />
                              </ListItemIcon>
                              <ListItemText primary={safeText(item, 'action', 'description')} primaryTypographyProps={{ variant: 'body2' }} />
                              <Chip label={safeText(item.priority)} size="small" color={safeText(item.priority) === 'high' ? 'error' : safeText(item.priority) === 'medium' ? 'warning' : 'default'} />
                            </ListItem>
                          ))}
                        </List>
                      </Paper>
                    </Box>
                  )}

                  {/* Risk Assessment */}
                  {result.riskAssessment && (
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2, borderRadius: 2,
                        bgcolor: `${getRiskColor(result.riskAssessment.level)}.50`,
                        border: '1px solid',
                        borderColor: `${getRiskColor(result.riskAssessment.level)}.light`,
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Warning color={getRiskColor(result.riskAssessment.level) as any} />
                        <Typography variant="subtitle2" fontWeight={600}>Risk Assessment</Typography>
                        <Chip label={result.riskAssessment.level?.toUpperCase()} size="small" color={getRiskColor(result.riskAssessment.level) as any} />
                      </Box>
                      <Typography variant="body2">{safeText(result.riskAssessment.explanation)}</Typography>
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
