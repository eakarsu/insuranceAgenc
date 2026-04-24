'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import {
  Box, Card, CardContent, Typography, Grid, TextField, Button, FormControl, InputLabel, Select, MenuItem,
  CircularProgress, Alert, Stepper, Step, StepLabel, Paper, List, ListItem, ListItemIcon, ListItemText, Chip, Avatar,
} from '@mui/material';
import { SupportAgent, Send, Assignment, CheckCircle, Description, Phone, Shield, ArrowForward, Folder, Gavel, AutoFixHigh, Flag, AccountBalance, SwapHoriz } from '@mui/icons-material';
import AIResponseFormatter from '@/components/ai/AIResponseFormatter';
import { safeText } from '@/lib/ai-render-utils';

export default function ClaimsAssistantPage() {
  const [claimType, setClaimType] = useState('');
  const [description, setDescription] = useState('');
  const [dateOfLoss, setDateOfLoss] = useState('');
  const [result, setResult] = useState<any>(null);

  const claimTypes = [
    'Auto Collision', 'Auto Comprehensive', 'Property Fire', 'Property Water Damage',
    'Property Theft', 'Liability Injury', 'Workers Compensation', 'Professional Liability',
  ];

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.post('/api/ai', {
        type: 'claims_assistant',
        prompt: `Help process a first notice of loss for a ${claimType} claim. Description: ${description}. Date of Loss: ${dateOfLoss}`,
        context: { claimType, description, dateOfLoss },
      });
      return response.data.result;
    },
    onSuccess: (data) => setResult(data),
  });

  return (
    <Box className="animate-fade-in">
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <SupportAgent sx={{ fontSize: 32, color: 'warning.main' }} />
        <Box>
          <Typography variant="h4" fontWeight={700}>AI Claims Assistant</Typography>
          <Typography color="text.secondary">Process first notice of loss with AI assistance</Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={5}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>Claim Information</Typography>

              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Claim Type</InputLabel>
                <Select value={claimType} label="Claim Type" onChange={(e) => setClaimType(e.target.value)}>
                  {claimTypes.map((type) => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                type="date"
                label="Date of Loss"
                value={dateOfLoss}
                onChange={(e) => setDateOfLoss(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ mb: 3 }}
              />

              <TextField
                fullWidth
                multiline
                rows={6}
                label="Description of Loss"
                placeholder="Describe what happened, where, when, and any injuries or damages..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                sx={{ mb: 3 }}
              />

              {/* Sample Test Data */}
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 3, bgcolor: 'grey.50', border: '1px dashed', borderColor: 'grey.300' }}>
                <Typography variant="caption" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary', mb: 1 }}>
                  <AutoFixHigh fontSize="small" /> SAMPLE TEST DATA
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  <Chip label="Auto Collision" size="small" variant="outlined" color="primary" sx={{ cursor: 'pointer' }}
                    onClick={() => {
                      setClaimType('Auto Collision');
                      setDateOfLoss('2024-12-15');
                      setDescription('Client was rear-ended at a red light on Main Street. The other driver ran a red light and hit the client\'s 2022 Toyota Camry. Police report #2024-45678 was filed. Client reports neck pain and vehicle has significant rear bumper and trunk damage. Estimated repair cost $8,500. Other driver\'s insurance: State Farm policy #SF-9876543.');
                    }} />
                  <Chip label="Water Damage" size="small" variant="outlined" color="primary" sx={{ cursor: 'pointer' }}
                    onClick={() => {
                      setClaimType('Property Water Damage');
                      setDateOfLoss('2025-01-03');
                      setDescription('Burst pipe in upstairs bathroom caused extensive water damage to first floor ceiling, walls, and hardwood floors. Client discovered damage upon returning from vacation. Emergency plumber was called. Water mitigation company ServPro is on site. Affected areas: living room, dining room, and kitchen. Estimated damage $25,000-35,000.');
                    }} />
                  <Chip label="Workers Comp" size="small" variant="outlined" color="primary" sx={{ cursor: 'pointer' }}
                    onClick={() => {
                      setClaimType('Workers Compensation');
                      setDateOfLoss('2025-01-20');
                      setDescription('Employee John Martinez slipped on wet floor in warehouse at 123 Industrial Blvd. Injury to lower back and right knee. Transported to Memorial Hospital ER. Doctor prescribed 2 weeks off work and physical therapy. Incident report filed with HR. Witnesses: Maria Lopez, Tom Chen. Safety camera footage available.');
                    }} />
                </Box>
              </Paper>

              <Button
                fullWidth
                variant="contained"
                size="large"
                color="warning"
                startIcon={analyzeMutation.isPending ? <CircularProgress size={20} color="inherit" /> : <Send />}
                onClick={() => analyzeMutation.mutate()}
                disabled={!claimType || !description || analyzeMutation.isPending}
              >
                {analyzeMutation.isPending ? 'Analyzing...' : 'Process Claim'}
              </Button>

              {analyzeMutation.isError && (
                <Alert severity="error" sx={{ mt: 2 }}>Failed to process claim.</Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={7}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>AI Analysis & Next Steps</Typography>

              {!result && !analyzeMutation.isPending && (
                <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
                  <SupportAgent sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                  <Typography>Enter claim details to get AI-powered assistance</Typography>
                </Box>
              )}

              {analyzeMutation.isPending && (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <CircularProgress size={48} />
                  <Typography sx={{ mt: 2 }}>AI is analyzing the claim and preparing next steps...</Typography>
                </Box>
              )}

              {result && (
                <Box>
                  {/* Claim Classification */}
                  {result.claimType && (
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        mb: 3,
                        borderRadius: 2,
                        background: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)',
                        border: '1px solid',
                        borderColor: 'warning.light',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                      }}
                    >
                      <Avatar sx={{ bgcolor: 'warning.main' }}>
                        <Gavel />
                      </Avatar>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Claim Classification</Typography>
                        <Typography variant="h6" fontWeight={600}>{result.claimType}</Typography>
                      </Box>
                    </Paper>
                  )}

                  {/* Coverage Analysis */}
                  {result.coverage && (
                    <Box sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <Shield color="primary" />
                        <Typography variant="subtitle1" fontWeight={600}>Coverage Analysis</Typography>
                      </Box>
                      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: 'primary.50' }}>
                        {typeof result.coverage === 'string' ? (
                          <Typography variant="body2" sx={{ lineHeight: 1.7 }}>{result.coverage}</Typography>
                        ) : (
                          <Box>
                            {result.coverage.primaryCoverage && (
                              <Box sx={{ mb: 1.5 }}>
                                <Typography variant="caption" color="text.secondary" fontWeight={600}>Primary Coverage</Typography>
                                <Typography variant="body2">{safeText(result.coverage.primaryCoverage)}</Typography>
                              </Box>
                            )}
                            {result.coverage.deductible && (
                              <Box sx={{ mb: 1.5 }}>
                                <Typography variant="caption" color="text.secondary" fontWeight={600}>Deductible</Typography>
                                <Typography variant="body2">{safeText(result.coverage.deductible)}</Typography>
                              </Box>
                            )}
                            {result.coverage.applicableForms && Array.isArray(result.coverage.applicableForms) && result.coverage.applicableForms.length > 0 && (
                              <Box sx={{ mb: 1.5 }}>
                                <Typography variant="caption" color="text.secondary" fontWeight={600}>Applicable Forms</Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                                  {result.coverage.applicableForms.map((form: any, i: number) => (
                                    <Chip key={i} label={safeText(form)} size="small" variant="outlined" color="primary" />
                                  ))}
                                </Box>
                              </Box>
                            )}
                            {result.coverage.additionalCoverages && Array.isArray(result.coverage.additionalCoverages) && result.coverage.additionalCoverages.length > 0 && (
                              <Box sx={{ mb: 1.5 }}>
                                <Typography variant="caption" color="text.secondary" fontWeight={600}>Additional Coverages</Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                                  {result.coverage.additionalCoverages.map((cov: any, i: number) => (
                                    <Chip key={i} label={safeText(cov)} size="small" color="primary" />
                                  ))}
                                </Box>
                              </Box>
                            )}
                            {result.coverage.exclusionsToReview && Array.isArray(result.coverage.exclusionsToReview) && result.coverage.exclusionsToReview.length > 0 && (
                              <Box>
                                <Typography variant="caption" color="text.secondary" fontWeight={600}>Exclusions to Review</Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                                  {result.coverage.exclusionsToReview.map((exc: any, i: number) => (
                                    <Chip key={i} label={safeText(exc)} size="small" variant="outlined" color="error" />
                                  ))}
                                </Box>
                              </Box>
                            )}
                          </Box>
                        )}
                      </Paper>
                    </Box>
                  )}

                  {/* Next Steps with enhanced Stepper */}
                  {result.nextSteps && result.nextSteps.length > 0 && (
                    <Box sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <ArrowForward color="info" />
                        <Typography variant="subtitle1" fontWeight={600}>Next Steps</Typography>
                        <Chip label={`${result.nextSteps.length} steps`} size="small" color="info" />
                      </Box>
                      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                        <Stepper orientation="vertical" activeStep={-1}>
                          {result.nextSteps.map((step: any, index: number) => (
                            <Step key={index} completed={false}>
                              <StepLabel
                                StepIconProps={{
                                  sx: { color: 'info.main' }
                                }}
                              >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                  <Typography variant="body2">{safeText(step, 'step', 'action')}</Typography>
                                  {typeof step === 'object' && step !== null && step.priority && (
                                    <Chip
                                      label={step.priority}
                                      size="small"
                                      color={step.priority.toLowerCase() === 'high' ? 'error' : step.priority.toLowerCase() === 'medium' ? 'warning' : 'default'}
                                      variant="outlined"
                                    />
                                  )}
                                  {typeof step === 'object' && step !== null && step.assignee && (
                                    <Chip label={step.assignee} size="small" variant="outlined" color="info" />
                                  )}
                                </Box>
                              </StepLabel>
                            </Step>
                          ))}
                        </Stepper>
                      </Paper>
                    </Box>
                  )}

                  {/* Required Documentation */}
                  {result.documentation && (
                    <Box sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <Folder color="secondary" />
                        <Typography variant="subtitle1" fontWeight={600}>Required Documentation</Typography>
                      </Box>
                      <Paper variant="outlined" sx={{ borderRadius: 2, bgcolor: 'grey.50' }}>
                        <List dense disablePadding>
                          {(Array.isArray(result.documentation) ? result.documentation : [result.documentation]).map((doc: any, i: number) => (
                            <ListItem
                              key={i}
                              sx={{
                                borderBottom: i < (Array.isArray(result.documentation) ? result.documentation.length - 1 : 0) ? '1px solid' : 'none',
                                borderColor: 'divider',
                              }}
                            >
                              <ListItemIcon sx={{ minWidth: 40 }}>
                                <Description color="action" />
                              </ListItemIcon>
                              <ListItemText
                                primary={safeText(doc, 'document', 'name')}
                                secondary={typeof doc === 'object' && doc !== null && doc.purpose ? doc.purpose : undefined}
                                primaryTypographyProps={{ variant: 'body2' }}
                              />
                              {(typeof doc === 'string' || (typeof doc === 'object' && doc !== null && doc.required !== false)) && (
                                <Chip label="Required" size="small" variant="outlined" />
                              )}
                              {typeof doc === 'object' && doc !== null && doc.required === false && (
                                <Chip label="Optional" size="small" variant="outlined" color="default" />
                              )}
                            </ListItem>
                          ))}
                        </List>
                      </Paper>
                    </Box>
                  )}

                  {/* Red Flags */}
                  {result.redFlags && Array.isArray(result.redFlags) && result.redFlags.length > 0 && (
                    <Box sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <Flag color="error" />
                        <Typography variant="subtitle1" fontWeight={600}>Red Flags</Typography>
                      </Box>
                      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: 'error.50' }}>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {result.redFlags.map((flag: any, i: number) => (
                            <Chip
                              key={i}
                              icon={<Flag fontSize="small" />}
                              label={safeText(flag)}
                              size="small"
                              color="error"
                              variant="outlined"
                              sx={{ fontWeight: 500 }}
                            />
                          ))}
                        </Box>
                      </Paper>
                    </Box>
                  )}

                  {/* Reserve Recommendation */}
                  {result.reserveRecommendation && (
                    <Box sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <AccountBalance color="info" />
                        <Typography variant="subtitle1" fontWeight={600}>Reserve Recommendation</Typography>
                      </Box>
                      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: 'info.50' }}>
                        {typeof result.reserveRecommendation === 'string' ? (
                          <Typography variant="body2">{result.reserveRecommendation}</Typography>
                        ) : (
                          <Box>
                            {result.reserveRecommendation.amount && (
                              <Typography variant="h6" fontWeight={600} color="info.dark">
                                {safeText(result.reserveRecommendation.amount)}
                              </Typography>
                            )}
                            {result.reserveRecommendation.basis && (
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                Basis: {safeText(result.reserveRecommendation.basis)}
                              </Typography>
                            )}
                          </Box>
                        )}
                      </Paper>
                    </Box>
                  )}

                  {/* Subrogation Potential */}
                  {result.subrogationPotential && (
                    <Box sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <SwapHoriz color="secondary" />
                        <Typography variant="subtitle1" fontWeight={600}>Subrogation Potential</Typography>
                      </Box>
                      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: 'secondary.50' }}>
                        {typeof result.subrogationPotential === 'string' ? (
                          <Typography variant="body2">{result.subrogationPotential}</Typography>
                        ) : (
                          <Box>
                            {result.subrogationPotential.likelihood && (
                              <Chip
                                label={`Likelihood: ${safeText(result.subrogationPotential.likelihood)}`}
                                size="small"
                                color={
                                  result.subrogationPotential.likelihood.toLowerCase?.() === 'high' ? 'success'
                                    : result.subrogationPotential.likelihood.toLowerCase?.() === 'medium' ? 'warning'
                                    : 'default'
                                }
                                sx={{ mb: 1 }}
                              />
                            )}
                            {result.subrogationPotential.details && (
                              <Typography variant="body2" sx={{ mt: 0.5 }}>
                                {safeText(result.subrogationPotential.details)}
                              </Typography>
                            )}
                          </Box>
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
