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
import { AutoAwesome, Send, Refresh, AttachMoney, Shield, Warning, TipsAndUpdates, Business } from '@mui/icons-material';
import AIResponseFormatter from '@/components/ai/AIResponseFormatter';

export default function AIQuoteGeneratorPage() {
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
                        ${Number(result.premium).toLocaleString()}
                      </Typography>
                      <Typography color="text.secondary" fontWeight={500}>Estimated Annual Premium</Typography>
                      {result.monthlyPremium && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          ~${(Number(result.premium) / 12).toFixed(2)}/month
                        </Typography>
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
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {Object.entries(result.coverages).map(([key, value]) => (
                              <TableRow key={key} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                                <TableCell>
                                  <Typography variant="body2" fontWeight={500}>
                                    {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    label={String(value)}
                                    size="small"
                                    color="primary"
                                    variant="outlined"
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
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
                          {(Array.isArray(result.riskFactors) ? result.riskFactors : [result.riskFactors]).map((factor: string, i: number) => (
                            <Chip
                              key={i}
                              icon={<Warning fontSize="small" />}
                              label={factor}
                              size="small"
                              color="warning"
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
                          {(Array.isArray(result.recommendations) ? result.recommendations : [result.recommendations]).map((rec: string, i: number) => (
                            <ListItem key={i} sx={{ py: 0.5, px: 0 }}>
                              <ListItemIcon sx={{ minWidth: 32 }}>
                                <TipsAndUpdates fontSize="small" color="success" />
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
