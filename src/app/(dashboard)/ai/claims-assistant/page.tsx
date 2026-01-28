'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import {
  Box, Card, CardContent, Typography, Grid, TextField, Button, FormControl, InputLabel, Select, MenuItem,
  CircularProgress, Alert, Stepper, Step, StepLabel, Paper, List, ListItem, ListItemIcon, ListItemText, Chip, Avatar,
} from '@mui/material';
import { SupportAgent, Send, Assignment, CheckCircle, Description, Phone, Shield, ArrowForward, Folder, Gavel } from '@mui/icons-material';
import AIResponseFormatter from '@/components/ai/AIResponseFormatter';

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
                        <Typography variant="body2" sx={{ lineHeight: 1.7 }}>{result.coverage}</Typography>
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
                          {result.nextSteps.map((step: string, index: number) => (
                            <Step key={index} completed={false}>
                              <StepLabel
                                StepIconProps={{
                                  sx: { color: 'info.main' }
                                }}
                              >
                                <Typography variant="body2">{step}</Typography>
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
                          {(Array.isArray(result.documentation) ? result.documentation : [result.documentation]).map((doc: string, i: number) => (
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
                                primary={doc}
                                primaryTypographyProps={{ variant: 'body2' }}
                              />
                              <Chip label="Required" size="small" variant="outlined" />
                            </ListItem>
                          ))}
                        </List>
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
