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
  AttachMoney, Refresh, AutoFixHigh,
} from '@mui/icons-material';
import AIResponseFormatter from '@/components/ai/AIResponseFormatter';
import { safeText } from '@/lib/ai-render-utils';

export default function RiskAssessorPage() {
  const [clientId, setClientId] = useState('');
  const [lineOfBusiness, setLineOfBusiness] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
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

              {/* Sample Test Data */}
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 3, bgcolor: 'grey.50', border: '1px dashed', borderColor: 'grey.300' }}>
                <Typography variant="caption" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary', mb: 1 }}>
                  <AutoFixHigh fontSize="small" /> SAMPLE TEST DATA
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  <Chip label="Restaurant Risk" size="small" variant="outlined" color="primary" sx={{ cursor: 'pointer' }}
                    onClick={() => {
                      setClientId(clients?.[0]?.id || '');
                      setLineOfBusiness('GENERAL_LIABILITY');
                      setAdditionalInfo('Fine dining restaurant with full bar. 5,000 sq ft space, seating for 120. Open 6 days/week. Annual revenue $1.8M. Commercial kitchen with fryers and gas grills. Live entertainment on weekends. Valet parking service. Wine cellar valued at $50,000. 3-year claims history: 1 slip-and-fall ($12,000 settled), 1 food illness complaint (dismissed).');
                    }} />
                  <Chip label="Construction Site" size="small" variant="outlined" color="primary" sx={{ cursor: 'pointer' }}
                    onClick={() => {
                      setClientId(clients?.[1]?.id || clients?.[0]?.id || '');
                      setLineOfBusiness('WORKERS_COMP');
                      setAdditionalInfo('General contractor specializing in commercial build-outs. 35 field employees, 10 office staff. Work at heights up to 30 feet. Use heavy machinery including cranes and forklifts. Subcontractors used for electrical and plumbing. OSHA citations: none in past 5 years. EMR: 0.92. Annual payroll $2.1M. Drug testing program in place.');
                    }} />
                  <Chip label="Cyber Risk" size="small" variant="outlined" color="primary" sx={{ cursor: 'pointer' }}
                    onClick={() => {
                      setClientId(clients?.[2]?.id || clients?.[0]?.id || '');
                      setLineOfBusiness('COMMERCIAL_PROPERTY');
                      setAdditionalInfo('Healthcare technology company handling PHI for 50+ medical practices. 200 employees, 80% remote workers. Cloud-based SaaS platform processing 10,000 patient records daily. SOC 2 Type II certified. Previous data breach in 2022 (contained, 500 records). Annual revenue $15M. Using AWS infrastructure with encryption at rest and in transit.');
                    }} />
                </Box>
              </Paper>

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
                          {safeText(result.riskScore)}
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
                        {result.factors.map((factor: any, idx: number) => {
                          const factorName = safeText(factor, 'factor', 'name');
                          const factorDetail = safeText(typeof factor === 'object' ? (factor.detail || factor.description) : '', 'detail');
                          const factorCategory = safeText(typeof factor === 'object' ? factor.category : '');
                          const impactLabel = safeText(typeof factor === 'object' ? factor.impact : '');
                          const impactColor = ['high', 'negative', 'severe'].includes(impactLabel.toLowerCase()) ? 'error'
                            : ['low', 'positive', 'minimal'].includes(impactLabel.toLowerCase()) ? 'success' : 'warning';

                          return (
                            <Box
                              key={idx}
                              sx={{
                                p: 2,
                                borderBottom: idx < result.factors.length - 1 ? '1px solid' : 'none',
                                borderColor: 'divider',
                              }}
                            >
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="body2" fontWeight={600}>{factorName}</Typography>
                                  {factorCategory && (
                                    <Chip label={factorCategory} size="small" variant="outlined" sx={{ fontSize: '0.7rem', height: 22 }} />
                                  )}
                                </Box>
                                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                  {factor.weight !== undefined && (
                                    <Chip label={`Weight: ${safeText(factor.weight)}`} size="small" variant="outlined" />
                                  )}
                                  {impactLabel && (
                                    <Chip label={impactLabel} size="small" color={impactColor as any} />
                                  )}
                                  {factor.score !== undefined && (
                                    <Typography variant="body2" fontWeight={700}>{safeText(factor.score)}</Typography>
                                  )}
                                </Box>
                              </Box>
                              {factorDetail && (
                                <Typography variant="caption" color="text.secondary">{factorDetail}</Typography>
                              )}
                              {factor.score !== undefined && typeof factor.score === 'number' && factor.score <= 100 && (
                                <LinearProgress
                                  variant="determinate"
                                  value={Math.min(factor.score, 100)}
                                  color={getScoreColor(factor.score) as any}
                                  sx={{ height: 6, borderRadius: 1, mt: 1 }}
                                />
                              )}
                            </Box>
                          );
                        })}
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
                      <Paper variant="outlined" sx={{ borderRadius: 2, bgcolor: '#e8f5e9' }}>
                        <List dense disablePadding>
                          {result.recommendations.map((rec: any, i: number) => {
                            const recText = safeText(rec, 'recommendation', 'text', 'action');
                            const recImpact = safeText(typeof rec === 'object' ? (rec.impact || rec.priority) : '');
                            const recType = safeText(typeof rec === 'object' ? rec.type : '');
                            const impactColor = ['high', 'critical', 'immediate'].includes(recImpact.toLowerCase?.() || '') ? 'error'
                              : ['medium', 'moderate'].includes(recImpact.toLowerCase?.() || '') ? 'warning' : 'success';

                            return (
                              <ListItem key={i} sx={{ borderBottom: i < result.recommendations.length - 1 ? '1px solid' : 'none', borderColor: '#c8e6c9' }}>
                                <ListItemIcon sx={{ minWidth: 40 }}>
                                  <CheckCircle color="success" />
                                </ListItemIcon>
                                <ListItemText
                                  primary={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                      <Typography variant="body2" component="span">{recText}</Typography>
                                      {recImpact && <Chip label={recImpact} size="small" color={impactColor as any} sx={{ height: 20, fontSize: '0.7rem' }} />}
                                      {recType && <Chip label={recType.replace(/_/g, ' ')} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} />}
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

                  {/* Suggested Pricing */}
                  {result.pricing && (
                    <Box sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <AttachMoney color="info" />
                        <Typography variant="subtitle1" fontWeight={600}>Pricing Analysis</Typography>
                      </Box>
                      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                        {typeof result.pricing === 'object' ? (
                          <Box>
                            {(result.pricing.suggestedModifier !== undefined || result.pricing.premium || result.pricing.suggested) && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                                <Avatar sx={{ bgcolor: 'info.main' }}>$</Avatar>
                                <Typography variant="h5" fontWeight={700}>
                                  {result.pricing.suggestedModifier !== undefined
                                    ? `${safeText(result.pricing.suggestedModifier > 0 ? '+' : '')}${safeText(result.pricing.suggestedModifier)}% modifier`
                                    : `$${Number(safeText(result.pricing.premium || result.pricing.suggested || 0)).toLocaleString()}`}
                                </Typography>
                              </Box>
                            )}
                            {result.pricing.basis && (
                              <Typography variant="body2" color="text.secondary" sx={{ ml: 7 }}>{safeText(result.pricing.basis)}</Typography>
                            )}
                            {result.pricing.credibility !== undefined && (
                              <Typography variant="body2" color="text.secondary" sx={{ ml: 7 }}>Credibility: {safeText(result.pricing.credibility)}</Typography>
                            )}
                            {result.pricing.range && (
                              <Typography variant="body2" color="text.secondary" sx={{ ml: 7 }}>Range: {safeText(result.pricing.range)}</Typography>
                            )}
                          </Box>
                        ) : (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ bgcolor: 'info.main' }}>$</Avatar>
                            <Typography variant="h5" fontWeight={700}>
                              ${Number(safeText(result.pricing)).toLocaleString()}
                            </Typography>
                          </Box>
                        )}
                      </Paper>
                    </Box>
                  )}

                  {/* Benchmark Comparison */}
                  {result.benchmarkComparison && (
                    <Box sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <TrendingUp color="primary" />
                        <Typography variant="subtitle1" fontWeight={600}>Industry Benchmark</Typography>
                      </Box>
                      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#e3f2fd' }}>
                        {result.benchmarkComparison.industryAverage && (
                          <Typography variant="body2" sx={{ mb: 0.5 }}><strong>Industry Average:</strong> {safeText(result.benchmarkComparison.industryAverage)}</Typography>
                        )}
                        {result.benchmarkComparison.clientPosition && (
                          <Typography variant="body2" sx={{ mb: 0.5 }}><strong>Client Position:</strong> {safeText(result.benchmarkComparison.clientPosition)}</Typography>
                        )}
                        {result.benchmarkComparison.trend && (
                          <Typography variant="body2"><strong>Trend:</strong> {safeText(result.benchmarkComparison.trend)}</Typography>
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

      <Alert severity="info" icon={<Assessment />} sx={{ mt: 3 }}>
        This AI assessment considers multiple data sources including credit reports, claims history, property data, and market conditions to provide a comprehensive risk score.
      </Alert>
    </Box>
  );
}
