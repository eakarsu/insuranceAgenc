'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import {
  Box, Card, CardContent, Typography, Grid, TextField, Button, FormControl, InputLabel, Select, MenuItem,
  CircularProgress, Alert, Paper, Chip, List, ListItem, ListItemIcon, ListItemText, Avatar, LinearProgress,
} from '@mui/material';
import {
  GavelRounded, Send, Error, Warning, CheckCircle, Info, VerifiedUser, Shield, AutoFixHigh,
} from '@mui/icons-material';
import AIResponseFormatter from '@/components/ai/AIResponseFormatter';
import { safeText } from '@/lib/ai-render-utils';

const usStates = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware',
  'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky',
  'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
  'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico',
  'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania',
  'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont',
  'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming',
];

const policyTypes = [
  'Auto', 'Homeowners', 'Commercial General Liability', 'Workers Compensation',
  'Professional Liability', 'Commercial Property', 'Umbrella', 'Life', 'Health', 'Cyber Liability',
];

export default function ComplianceCheckerPage() {
  const [state, setState] = useState('');
  const [policyType, setPolicyType] = useState('');
  const [policyDetails, setPolicyDetails] = useState('');
  const [result, setResult] = useState<any>(null);

  const checkMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.post('/api/ai', {
        type: 'compliance_checker',
        prompt: `Check this ${policyType} insurance policy for compliance with ${state} state regulations. Identify violations, warnings, and required disclosures.`,
        context: { state, policyType, policyDetails },
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

  return (
    <Box className="animate-fade-in">
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <GavelRounded sx={{ fontSize: 32, color: 'warning.main' }} />
        <Box>
          <Typography variant="h4" fontWeight={700}>Compliance Checker</Typography>
          <Typography color="text.secondary">Check policy compliance against state regulations</Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>Compliance Check</Typography>

              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>State</InputLabel>
                <Select value={state} label="State" onChange={(e) => setState(e.target.value)}>
                  {usStates.map((s) => (
                    <MenuItem key={s} value={s}>{s}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Policy Type</InputLabel>
                <Select value={policyType} label="Policy Type" onChange={(e) => setPolicyType(e.target.value)}>
                  {policyTypes.map((pt) => (
                    <MenuItem key={pt} value={pt}>{pt}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                multiline
                rows={6}
                label="Policy Details"
                placeholder="Enter policy details, coverage limits, endorsements, or paste policy document text..."
                value={policyDetails}
                onChange={(e) => setPolicyDetails(e.target.value)}
                sx={{ mb: 3 }}
              />

              {/* Sample Test Data */}
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 3, bgcolor: 'grey.50', border: '1px dashed', borderColor: 'grey.300' }}>
                <Typography variant="caption" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary', mb: 1 }}>
                  <AutoFixHigh fontSize="small" /> SAMPLE TEST DATA
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  <Chip label="CA Auto Policy" size="small" variant="outlined" color="primary" sx={{ cursor: 'pointer' }}
                    onClick={() => {
                      setState('California');
                      setPolicyType('Auto');
                      setPolicyDetails('Personal auto policy for 2023 Honda Civic. Bodily Injury Liability: $50,000/$100,000. Property Damage Liability: $25,000. Uninsured Motorist: $30,000/$60,000. Medical Payments: $5,000. Comprehensive: $500 deductible. Collision: $1,000 deductible. Rental Reimbursement: $30/day, 30 days max. No gap coverage. Driver is 22 years old with clean record.');
                    }} />
                  <Chip label="TX Workers Comp" size="small" variant="outlined" color="primary" sx={{ cursor: 'pointer' }}
                    onClick={() => {
                      setState('Texas');
                      setPolicyType('Workers Compensation');
                      setPolicyDetails('Workers compensation policy for construction company with 45 employees. Classification codes: 5403 (Carpentry), 5022 (Masonry). Experience modification rate: 0.95. Coverage Part One: Statutory limits. Coverage Part Two: $500,000/$500,000/$500,000. Voluntary compensation endorsement included. USL&H coverage not included. No alternate employer endorsement.');
                    }} />
                  <Chip label="NY Homeowners" size="small" variant="outlined" color="primary" sx={{ cursor: 'pointer' }}
                    onClick={() => {
                      setState('New York');
                      setPolicyType('Homeowners');
                      setPolicyDetails('HO-3 Special Form homeowners policy. Dwelling coverage: $450,000. Other structures: $45,000. Personal property: $225,000. Loss of use: $90,000. Personal liability: $300,000. Medical payments: $5,000. Deductible: $2,500. No flood endorsement. No earthquake coverage. Replacement cost on dwelling and contents. Home built in 1985, last updated roof 2019.');
                    }} />
                </Box>
              </Paper>

              <Button
                fullWidth
                variant="contained"
                size="large"
                color="warning"
                startIcon={checkMutation.isPending ? <CircularProgress size={20} color="inherit" /> : <Send />}
                onClick={() => checkMutation.mutate()}
                disabled={!state || !policyType || checkMutation.isPending}
              >
                {checkMutation.isPending ? 'Checking...' : 'Check Compliance'}
              </Button>

              {checkMutation.isError && (
                <Alert severity="error" sx={{ mt: 2 }}>Failed to check compliance.</Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>Compliance Results</Typography>

              {!result && !checkMutation.isPending && (
                <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
                  <GavelRounded sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                  <Typography>Select state and policy type to check compliance</Typography>
                </Box>
              )}

              {checkMutation.isPending && (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <CircularProgress size={48} />
                  <Typography sx={{ mt: 2 }}>AI is checking compliance against state regulations...</Typography>
                </Box>
              )}

              {result && (
                <Box>
                  {/* Compliance Score */}
                  {result.complianceScore !== undefined && (
                    <Paper
                      elevation={0}
                      sx={{
                        p: 3, mb: 3, borderRadius: 2,
                        background: result.complianceScore >= 80
                          ? 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)'
                          : result.complianceScore >= 60
                          ? 'linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%)'
                          : 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)',
                        border: '1px solid',
                        borderColor: `${getScoreColor(result.complianceScore)}.light`,
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Avatar
                          sx={{
                            width: 80, height: 80,
                            bgcolor: `${getScoreColor(result.complianceScore)}.main`,
                            fontSize: '1.5rem', fontWeight: 700,
                          }}
                        >
                          {result.complianceScore}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" fontWeight={600} gutterBottom>Compliance Score</Typography>
                          <LinearProgress
                            variant="determinate"
                            value={result.complianceScore}
                            color={getScoreColor(result.complianceScore) as any}
                            sx={{ height: 12, borderRadius: 6, mb: 1 }}
                          />
                          <Typography variant="body2" color="text.secondary">
                            {result.complianceScore >= 80 ? 'Good compliance - minor improvements possible' :
                             result.complianceScore >= 60 ? 'Fair compliance - some issues need attention' :
                             'Poor compliance - immediate action required'}
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  )}

                  {/* Violations */}
                  {result.violations && result.violations.length > 0 && (
                    <Box sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Error color="error" />
                        <Typography variant="subtitle1" fontWeight={600}>Violations</Typography>
                        <Chip label={result.violations.length} size="small" color="error" />
                      </Box>
                      <Paper variant="outlined" sx={{ borderRadius: 2, bgcolor: 'error.50', borderColor: 'error.light' }}>
                        <List dense disablePadding>
                          {result.violations.map((v: any, i: number) => (
                            <ListItem key={i} sx={{ borderBottom: i < result.violations.length - 1 ? '1px solid' : 'none', borderColor: 'error.light' }}>
                              <ListItemIcon sx={{ minWidth: 40 }}>
                                <Error color="error" fontSize="small" />
                              </ListItemIcon>
                              <ListItemText
                                primary={safeText(v, 'violation')}
                                secondary={safeText(v.regulation)}
                                primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                              />
                              <Chip label={safeText(v.severity)} size="small" color={safeText(v.severity) === 'high' ? 'error' : 'warning'} />
                            </ListItem>
                          ))}
                        </List>
                      </Paper>
                    </Box>
                  )}

                  {/* Warnings */}
                  {result.warnings && result.warnings.length > 0 && (
                    <Box sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Warning color="warning" />
                        <Typography variant="subtitle1" fontWeight={600}>Warnings</Typography>
                        <Chip label={result.warnings.length} size="small" color="warning" />
                      </Box>
                      <Paper variant="outlined" sx={{ borderRadius: 2, bgcolor: 'warning.50', borderColor: 'warning.light' }}>
                        <List dense disablePadding>
                          {result.warnings.map((w: any, i: number) => (
                            <ListItem key={i} sx={{ borderBottom: i < result.warnings.length - 1 ? '1px solid' : 'none', borderColor: 'warning.light' }}>
                              <ListItemIcon sx={{ minWidth: 40 }}>
                                <Warning color="warning" fontSize="small" />
                              </ListItemIcon>
                              <ListItemText
                                primary={safeText(w, 'warning')}
                                secondary={safeText(w.recommendation)}
                                primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </Paper>
                    </Box>
                  )}

                  {/* Required Disclosures */}
                  {result.requiredDisclosures && result.requiredDisclosures.length > 0 && (
                    <Box sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <VerifiedUser color="info" />
                        <Typography variant="subtitle1" fontWeight={600}>Required Disclosures</Typography>
                      </Box>
                      <Paper variant="outlined" sx={{ borderRadius: 2 }}>
                        <List dense disablePadding>
                          {result.requiredDisclosures.map((d: any, i: number) => (
                            <ListItem key={i} sx={{ borderBottom: i < result.requiredDisclosures.length - 1 ? '1px solid' : 'none', borderColor: 'divider' }}>
                              <ListItemIcon sx={{ minWidth: 40 }}>
                                {d.status === 'required' ? <Error color="error" fontSize="small" /> : <Info color="info" fontSize="small" />}
                              </ListItemIcon>
                              <ListItemText primary={safeText(d, 'disclosure')} primaryTypographyProps={{ variant: 'body2' }} />
                              <Chip label={safeText(d.status)} size="small" color={safeText(d.status) === 'required' ? 'error' : 'info'} variant="outlined" />
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
                        <CheckCircle color="success" />
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

                  {/* Regulatory References */}
                  {result.regulatoryReferences && result.regulatoryReferences.length > 0 && (
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Shield color="primary" />
                        <Typography variant="subtitle1" fontWeight={600}>Regulatory References</Typography>
                      </Box>
                      <Paper variant="outlined" sx={{ borderRadius: 2, bgcolor: 'grey.50' }}>
                        <List dense disablePadding>
                          {result.regulatoryReferences.map((ref: any, i: number) => (
                            <ListItem key={i} sx={{ borderBottom: i < result.regulatoryReferences.length - 1 ? '1px solid' : 'none', borderColor: 'divider' }}>
                              <ListItemText
                                primary={safeText(ref, 'reference')}
                                secondary={safeText(ref.description)}
                                primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                                secondaryTypographyProps={{ variant: 'caption' }}
                              />
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
