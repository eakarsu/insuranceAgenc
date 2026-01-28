'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import {
  Box, Card, CardContent, Typography, Button, Grid, Avatar, Chip, LinearProgress,
  TextField, FormControl, InputLabel, Select, MenuItem, Alert, Paper, CircularProgress,
  Autocomplete, List, ListItem, ListItemIcon, ListItemText,
} from '@mui/material';
import {
  Assessment, Warning, CheckCircle, TrendingUp, AutoAwesome, Shield, TipsAndUpdates,
  AttachMoney, Refresh,
} from '@mui/icons-material';
import AIResponseFormatter from '@/components/ai/AIResponseFormatter';

export default function RiskAssessorPage() {
  const [clientId, setClientId] = useState('');
  const [lineOfBusiness, setLineOfBusiness] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [result, setResult] = useState<any>(null);

  const { data: clients = [] } = useQuery({
    queryKey: ['clients-list'],
    queryFn: async () => {
      const response = await axios.get('/api/clients?limit=100');
      return response.data.clients;
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

  const assessMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.post('/api/ai', {
        type: 'risk_assessor',
        prompt: `Perform a comprehensive risk assessment for ${lineOfBusiness.replace(/_/g, ' ')} insurance. ${additionalInfo}`,
        context: { client: clientDetails, lineOfBusiness, additionalInfo },
      });
      return response.data.result;
    },
    onSuccess: (data) => setResult(data),
  });

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Low Risk';
    if (score >= 60) return 'Medium Risk';
    return 'High Risk';
  };

  const lobOptions = [
    { value: 'PERSONAL_AUTO', label: 'Personal Auto' },
    { value: 'HOMEOWNERS', label: 'Homeowners' },
    { value: 'COMMERCIAL_PROPERTY', label: 'Commercial Property' },
    { value: 'GENERAL_LIABILITY', label: 'General Liability' },
    { value: 'WORKERS_COMP', label: 'Workers Compensation' },
    { value: 'COMMERCIAL_AUTO', label: 'Commercial Auto' },
  ];

  return (
    <Box className="animate-fade-in">
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Assessment sx={{ fontSize: 32, color: 'info.main' }} />
        <Box>
          <Typography variant="h4" fontWeight={700}>AI Risk Assessor</Typography>
          <Typography color="text.secondary">Comprehensive risk analysis for underwriting decisions</Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>Assessment Parameters</Typography>

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
                  renderInput={(params) => <TextField {...params} label="Select Client" />}
                />
              </FormControl>

              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Line of Business</InputLabel>
                <Select
                  value={lineOfBusiness}
                  label="Line of Business"
                  onChange={(e) => setLineOfBusiness(e.target.value)}
                >
                  {lobOptions.map((lob) => (
                    <MenuItem key={lob.value} value={lob.value}>{lob.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Additional Information"
                placeholder="Property details, vehicle info, claims history, etc..."
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                sx={{ mb: 3 }}
              />

              <Button
                fullWidth
                variant="contained"
                size="large"
                color="info"
                startIcon={assessMutation.isPending ? <CircularProgress size={20} color="inherit" /> : <AutoAwesome />}
                onClick={() => assessMutation.mutate()}
                disabled={!clientId || !lineOfBusiness || assessMutation.isPending}
              >
                {assessMutation.isPending ? 'Analyzing...' : 'Run Assessment'}
              </Button>

              {assessMutation.isError && (
                <Alert severity="error" sx={{ mt: 2 }}>Failed to run assessment.</Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={600}>Risk Assessment Results</Typography>
                {result && (
                  <Button size="small" startIcon={<Refresh />} onClick={() => assessMutation.mutate()}>
                    Re-assess
                  </Button>
                )}
              </Box>

              {!result && !assessMutation.isPending && (
                <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
                  <Assessment sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                  <Typography>Select a client and line of business to assess risk</Typography>
                </Box>
              )}

              {assessMutation.isPending && (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <CircularProgress size={48} />
                  <Typography sx={{ mt: 2 }}>AI is evaluating risk factors...</Typography>
                </Box>
              )}

              {result && (
                <Box>
                  {/* Overall Risk Score Card */}
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
                        borderColor: `${getScoreColor(result.riskScore)}.light`,
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Avatar
                          sx={{
                            width: 80,
                            height: 80,
                            bgcolor: `${getScoreColor(result.riskScore)}.main`,
                            fontSize: '1.5rem',
                            fontWeight: 700,
                          }}
                        >
                          {result.riskScore}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" fontWeight={600} gutterBottom>Overall Risk Score</Typography>
                          <LinearProgress
                            variant="determinate"
                            value={result.riskScore}
                            color={getScoreColor(result.riskScore) as any}
                            sx={{ height: 12, borderRadius: 6, mb: 1 }}
                          />
                          <Chip
                            label={getScoreLabel(result.riskScore)}
                            color={getScoreColor(result.riskScore) as any}
                            size="small"
                          />
                        </Box>
                      </Box>
                    </Paper>
                  )}

                  {/* Risk Factors */}
                  {result.factors && result.factors.length > 0 && (
                    <Box sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <Shield color="primary" />
                        <Typography variant="subtitle1" fontWeight={600}>Risk Factors Analyzed</Typography>
                      </Box>
                      <Paper variant="outlined" sx={{ borderRadius: 2 }}>
                        {result.factors.map((factor: any, idx: number) => (
                          <Box
                            key={idx}
                            sx={{
                              p: 2,
                              borderBottom: idx < result.factors.length - 1 ? '1px solid' : 'none',
                              borderColor: 'divider',
                            }}
                          >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="body2" fontWeight={500}>
                                {typeof factor === 'string' ? factor : factor.name || factor.factor}
                              </Typography>
                              {(factor.score !== undefined || factor.weight) && (
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                  {factor.weight && (
                                    <Chip label={factor.weight} size="small" variant="outlined" />
                                  )}
                                  {factor.impact && (
                                    <Chip
                                      label={factor.impact}
                                      size="small"
                                      color={factor.impact === 'Positive' ? 'success' : factor.impact === 'Negative' ? 'error' : 'default'}
                                    />
                                  )}
                                  {factor.score !== undefined && (
                                    <Typography variant="body2" fontWeight={600}>{factor.score}</Typography>
                                  )}
                                </Box>
                              )}
                            </Box>
                            {factor.score !== undefined && (
                              <LinearProgress
                                variant="determinate"
                                value={factor.score}
                                color={getScoreColor(factor.score) as any}
                                sx={{ height: 6, borderRadius: 1 }}
                              />
                            )}
                          </Box>
                        ))}
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
                      <Paper variant="outlined" sx={{ borderRadius: 2, bgcolor: 'success.50' }}>
                        <List dense disablePadding>
                          {result.recommendations.map((rec: string, i: number) => (
                            <ListItem key={i} sx={{ borderBottom: i < result.recommendations.length - 1 ? '1px solid' : 'none', borderColor: 'success.light' }}>
                              <ListItemIcon sx={{ minWidth: 40 }}>
                                <CheckCircle color="success" />
                              </ListItemIcon>
                              <ListItemText
                                primary={rec}
                                primaryTypographyProps={{ variant: 'body2' }}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </Paper>
                    </Box>
                  )}

                  {/* Suggested Pricing */}
                  {result.pricing && (
                    <Box sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <AttachMoney color="info" />
                        <Typography variant="subtitle1" fontWeight={600}>Suggested Pricing</Typography>
                      </Box>
                      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: 'info.main' }}>$</Avatar>
                        <Box>
                          <Typography variant="h5" fontWeight={700}>
                            ${typeof result.pricing === 'object' ? Number(result.pricing.premium || result.pricing.suggested).toLocaleString() : Number(result.pricing).toLocaleString()}
                          </Typography>
                          {result.pricing.range && (
                            <Typography variant="body2" color="text.secondary">
                              Range: {result.pricing.range}
                            </Typography>
                          )}
                        </Box>
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

      <Alert severity="info" icon={<Assessment />} sx={{ mt: 3 }}>
        This AI assessment considers multiple data sources including credit reports, claims history, property data, and market conditions to provide a comprehensive risk score.
      </Alert>
    </Box>
  );
}
