'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import {
  Box, Card, CardContent, Typography, Grid, TextField, Button, FormControl,
  InputLabel, Select, MenuItem, Autocomplete, CircularProgress, Alert, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Divider,
  List, ListItem, ListItemIcon, ListItemText, Avatar,
} from '@mui/material';
import { AutoAwesome, Send, Refresh, AttachMoney, Shield, Warning, TipsAndUpdates, Business, AutoFixHigh, LocalOffer } from '@mui/icons-material';
import AIResponseFormatter from '@/components/ai/AIResponseFormatter';
import { safeText } from '@/lib/ai-render-utils';

export default function AIQuoteGeneratorPage() {
  const [clientId, setClientId] = useState('');
  const [lineOfBusiness, setLineOfBusiness] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [result, setResult] = useState<any>(null);

  const { data: clientsRaw } = useQuery({
    queryKey: ['clients-list'],
    queryFn: async () => {
      const response = await axios.get('/api/clients?limit=100');
      return response.data.clients || [];
    },
  });
  const clients = Array.isArray(clientsRaw) ? clientsRaw : [];

  const generateMutation = useMutation({
    mutationFn: async () => {
      const client = clients.find((c: any) => c.id === clientId);
      const response = await axios.post('/api/ai', {
        type: 'quote_generator',
        prompt: `Generate insurance quote for a ${lineOfBusiness.replace(/_/g, ' ')} policy. Additional info: ${additionalInfo}`,
        context: { client, lineOfBusiness, additionalInfo },
      });
      return response.data.result;
    },
    onSuccess: (data) => setResult(data),
  });

  const lobOptions = [
    'PERSONAL_AUTO', 'HOMEOWNERS', 'RENTERS', 'UMBRELLA', 'LIFE',
    'COMMERCIAL_AUTO', 'COMMERCIAL_PROPERTY', 'GENERAL_LIABILITY', 'WORKERS_COMP',
  ];

  /** Safely extract the annual premium number from result.premium (string, number, or object). */
  const getAnnualPremium = (): number | null => {
    if (!result?.premium) return null;
    if (typeof result.premium === 'number') return result.premium;
    if (typeof result.premium === 'string') {
      const n = Number(result.premium.replace(/[^0-9.]/g, ''));
      return isNaN(n) ? null : n;
    }
    if (typeof result.premium === 'object') {
      if (result.premium.annual != null) return Number(result.premium.annual);
      if (result.premium.monthly != null) return Number(result.premium.monthly) * 12;
    }
    return null;
  };

  const getMonthlyPremium = (): number | null => {
    if (!result?.premium) return null;
    if (typeof result.premium === 'object' && result.premium.monthly != null) {
      return Number(result.premium.monthly);
    }
    const annual = getAnnualPremium();
    return annual != null ? annual / 12 : null;
  };

  return (
    <Box className="animate-fade-in">
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <AutoAwesome sx={{ fontSize: 32, color: 'primary.main' }} />
        <Box>
          <Typography variant="h4" fontWeight={700}>AI Quote Generator</Typography>
          <Typography color="text.secondary">Generate instant multi-carrier quotes using AI</Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={5}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>Quote Parameters</Typography>

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
                  renderInput={(params) => <TextField {...params} label="Select Client" />}
                />
              </FormControl>

              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Line of Business</InputLabel>
                <Select value={lineOfBusiness} label="Line of Business" onChange={(e) => setLineOfBusiness(e.target.value)}>
                  {lobOptions.map((lob) => (
                    <MenuItem key={lob} value={lob}>{lob.replace(/_/g, ' ')}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                multiline
                rows={4}
                label="Additional Information"
                placeholder="Enter details about vehicles, property, coverage needs..."
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
                  <Chip label="Commercial Auto" size="small" variant="outlined" color="primary" sx={{ cursor: 'pointer' }}
                    onClick={() => {
                      setClientId(clients?.[0]?.id || '');
                      setLineOfBusiness('COMMERCIAL_AUTO');
                      setAdditionalInfo('Fleet of 12 delivery vehicles, mix of vans and box trucks. Primary coverage needed for liability, collision, and comprehensive. Drivers ages 25-55, all clean driving records. Vehicles used for local deliveries within 50-mile radius. Annual mileage approximately 30,000 per vehicle. Need hired and non-owned auto coverage as well.');
                    }} />
                  <Chip label="Workers Comp" size="small" variant="outlined" color="primary" sx={{ cursor: 'pointer' }}
                    onClick={() => {
                      setClientId(clients?.[1]?.id || clients?.[0]?.id || '');
                      setLineOfBusiness('WORKERS_COMP');
                      setAdditionalInfo('Restaurant with 25 employees including kitchen staff, servers, and management. Classification code 9082. Current experience modification rate 1.05. Annual payroll approximately $750,000. Have had 2 minor claims in past 3 years. Looking for competitive pricing with loss control services.');
                    }} />
                  <Chip label="General Liability" size="small" variant="outlined" color="primary" sx={{ cursor: 'pointer' }}
                    onClick={() => {
                      setClientId(clients?.[2]?.id || clients?.[0]?.id || '');
                      setLineOfBusiness('GENERAL_LIABILITY');
                      setAdditionalInfo('Electrical contracting company. Annual revenue $2.5M. 15 employees. Work primarily on commercial buildings and residential renovations. Need $1M/$2M occurrence/aggregate limits. Certificate holder requirements for general contractors. Current policy expires in 45 days.');
                    }} />
                </Box>
              </Paper>

              <Button
                fullWidth
                variant="contained"
                size="large"
                startIcon={generateMutation.isPending ? <CircularProgress size={20} color="inherit" /> : <Send />}
                onClick={() => generateMutation.mutate()}
                disabled={!clientId || !lineOfBusiness || generateMutation.isPending}
              >
                {generateMutation.isPending ? 'Generating...' : 'Generate Quote'}
              </Button>

              {generateMutation.isError && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  Failed to generate quote. Please try again.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={7}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={600}>AI Generated Quote</Typography>
                {result && (
                  <Button size="small" startIcon={<Refresh />} onClick={() => generateMutation.mutate()}>
                    Regenerate
                  </Button>
                )}
              </Box>

              {!result && !generateMutation.isPending && (
                <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
                  <AutoAwesome sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                  <Typography>Select a client and line of business to generate a quote</Typography>
                </Box>
              )}

              {generateMutation.isPending && (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <CircularProgress size={48} />
                  <Typography sx={{ mt: 2 }}>AI is analyzing risk factors and generating quotes...</Typography>
                </Box>
              )}

              {result && (
                <Box>
                  {/* Premium Display Card */}
                  {result.premium && (
                    <Paper
                      elevation={0}
                      sx={{
                        textAlign: 'center',
                        py: 3,
                        px: 2,
                        background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
                        borderRadius: 3,
                        mb: 3,
                        border: '1px solid',
                        borderColor: 'primary.light',
                      }}
                    >
                      <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main', mx: 'auto', mb: 2 }}>
                        <AttachMoney sx={{ fontSize: 32 }} />
                      </Avatar>
                      <Typography variant="h3" fontWeight={700} color="primary.dark">
                        {getAnnualPremium() != null
                          ? `$${getAnnualPremium()!.toLocaleString()}`
                          : safeText(result.premium, 'annual', 'amount', 'total')}
                      </Typography>
                      <Typography color="text.secondary" fontWeight={500}>Estimated Annual Premium</Typography>
                      {(result.monthlyPremium || getMonthlyPremium() != null) && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          ~${getMonthlyPremium() != null ? getMonthlyPremium()!.toFixed(2) : Number(result.monthlyPremium).toFixed(2)}/month
                        </Typography>
                      )}
                      {/* Premium breakdown if available */}
                      {typeof result.premium === 'object' && result.premium.breakdown && Array.isArray(result.premium.breakdown) && (
                        <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 1 }}>
                          {result.premium.breakdown.map((item: any, i: number) => (
                            <Chip
                              key={i}
                              label={safeText(item, 'name', 'coverage', 'label')}
                              size="small"
                              variant="outlined"
                              color="primary"
                            />
                          ))}
                        </Box>
                      )}
                    </Paper>
                  )}

                  {/* Coverages Table */}
                  {result.coverages && (
                    <Box sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <Shield color="primary" />
                        <Typography variant="subtitle1" fontWeight={600}>Recommended Coverages</Typography>
                      </Box>
                      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                        <Table size="small">
                          <TableHead sx={{ bgcolor: 'grey.50' }}>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 600 }}>Coverage Type</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>Limit / Details</TableCell>
                              {Array.isArray(result.coverages) && result.coverages.some((c: any) => typeof c === 'object' && c?.deductible) && (
                                <TableCell sx={{ fontWeight: 600 }}>Deductible</TableCell>
                              )}
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {Array.isArray(result.coverages) ? (
                              result.coverages.map((cov: any, i: number) => (
                                <TableRow key={i} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                                  <TableCell>
                                    <Typography variant="body2" fontWeight={500}>
                                      {typeof cov === 'string' ? cov : safeText(cov, 'name', 'coverage', 'type')}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    {typeof cov === 'object' && cov !== null ? (
                                      <Chip
                                        label={cov.limit || cov.details || safeText(cov, 'limit', 'details', 'value')}
                                        size="small"
                                        color={cov.included === false ? 'default' : 'primary'}
                                        variant="outlined"
                                      />
                                    ) : (
                                      <Chip label="-" size="small" color="primary" variant="outlined" />
                                    )}
                                  </TableCell>
                                  {Array.isArray(result.coverages) && result.coverages.some((c: any) => typeof c === 'object' && c?.deductible) && (
                                    <TableCell>
                                      {typeof cov === 'object' && cov !== null && cov.deductible ? (
                                        <Chip label={safeText(cov.deductible)} size="small" variant="outlined" />
                                      ) : (
                                        <Typography variant="body2" color="text.secondary">-</Typography>
                                      )}
                                    </TableCell>
                                  )}
                                </TableRow>
                              ))
                            ) : (
                              Object.entries(result.coverages).map(([key, value]) => (
                                <TableRow key={key} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                                  <TableCell>
                                    <Typography variant="body2" fontWeight={500}>
                                      {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Chip
                                      label={safeText(value)}
                                      size="small"
                                      color="primary"
                                      variant="outlined"
                                    />
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                  )}

                  {/* Risk Factors */}
                  {result.riskFactors && (
                    <Box sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <Warning color="warning" />
                        <Typography variant="subtitle1" fontWeight={600}>Risk Factors</Typography>
                      </Box>
                      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: 'warning.50' }}>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {(Array.isArray(result.riskFactors) ? result.riskFactors : [result.riskFactors]).map((factor: any, i: number) => (
                            <Chip
                              key={i}
                              icon={<Warning fontSize="small" />}
                              label={safeText(factor, 'factor', 'name')}
                              size="small"
                              color={
                                typeof factor === 'object' && factor?.severity?.toLowerCase?.() === 'high'
                                  ? 'error'
                                  : typeof factor === 'object' && factor?.severity?.toLowerCase?.() === 'medium'
                                  ? 'warning'
                                  : 'warning'
                              }
                              sx={{ fontWeight: 500 }}
                            />
                          ))}
                        </Box>
                      </Paper>
                    </Box>
                  )}

                  {/* AI Recommendations */}
                  {result.recommendations && (
                    <Box sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <TipsAndUpdates color="success" />
                        <Typography variant="subtitle1" fontWeight={600}>AI Recommendations</Typography>
                      </Box>
                      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: 'success.50' }}>
                        <List dense disablePadding>
                          {(Array.isArray(result.recommendations) ? result.recommendations : [result.recommendations]).map((rec: any, i: number) => (
                            <ListItem key={i} sx={{ py: 0.5, px: 0 }}>
                              <ListItemIcon sx={{ minWidth: 32 }}>
                                <TipsAndUpdates fontSize="small" color="success" />
                              </ListItemIcon>
                              <ListItemText
                                primary={safeText(rec, 'recommendation', 'text', 'action')}
                                secondary={typeof rec === 'object' && rec !== null && rec.reason ? rec.reason : undefined}
                                primaryTypographyProps={{ variant: 'body2' }}
                              />
                              {typeof rec === 'object' && rec !== null && rec.priority && (
                                <Chip
                                  label={rec.priority}
                                  size="small"
                                  color={rec.priority.toLowerCase?.() === 'high' ? 'error' : rec.priority.toLowerCase?.() === 'medium' ? 'warning' : 'default'}
                                  variant="outlined"
                                />
                              )}
                            </ListItem>
                          ))}
                        </List>
                      </Paper>
                    </Box>
                  )}

                  {/* Discounts Applied */}
                  {result.discountsApplied && Array.isArray(result.discountsApplied) && result.discountsApplied.length > 0 && (
                    <Box sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <LocalOffer color="success" />
                        <Typography variant="subtitle1" fontWeight={600}>Discounts Applied</Typography>
                      </Box>
                      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: 'success.50' }}>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {result.discountsApplied.map((disc: any, i: number) => (
                            <Chip
                              key={i}
                              icon={<LocalOffer fontSize="small" />}
                              label={
                                typeof disc === 'string'
                                  ? disc
                                  : typeof disc === 'object' && disc !== null
                                  ? `${safeText(disc, 'discount', 'name')}${disc.percentage != null ? ` (${disc.percentage}%)` : ''}`
                                  : safeText(disc)
                              }
                              size="small"
                              color="success"
                              variant="outlined"
                              sx={{ fontWeight: 500 }}
                            />
                          ))}
                        </Box>
                      </Paper>
                    </Box>
                  )}

                  {/* Carrier Info */}
                  {result.carrier && (
                    <Box sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <Business color="info" />
                        <Typography variant="subtitle1" fontWeight={600}>Carrier Information</Typography>
                      </Box>
                      <Chip label={result.carrier} color="info" />
                    </Box>
                  )}

                  {/* Fallback for text responses - nicely formatted */}
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
