'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import {
  Box, Card, CardContent, Typography, Grid, TextField, Button, FormControl, InputLabel, Select, MenuItem,
  CircularProgress, Alert, Paper, Chip, Autocomplete, IconButton, Snackbar,
} from '@mui/material';
import { Email, Send, ContentCopy, CheckCircle, TipsAndUpdates, AutoFixHigh } from '@mui/icons-material';

const emailTypes = [
  'Renewal Reminder', 'Welcome Letter', 'Claim Update', 'Policy Change Confirmation',
  'Payment Reminder', 'General Inquiry',
];

const toneOptions = ['Professional', 'Friendly', 'Urgent'];

export default function EmailComposerPage() {
  const [emailType, setEmailType] = useState('');
  const [clientId, setClientId] = useState('');
  const [additionalContext, setAdditionalContext] = useState('');
  const [tone, setTone] = useState('Professional');
  const [result, setResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);

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

  const composeMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.post('/api/ai', {
        type: 'email_composer',
        prompt: `Draft a ${tone.toLowerCase()} ${emailType} email for this insurance client. ${additionalContext ? `Additional context: ${additionalContext}` : ''}`,
        context: { emailType, tone, client: clientDetails, policies: clientDetails?.policies },
      });
      let data = response.data.result;
      // If the API returned raw text that's actually JSON, parse it
      if (data?.text && !data?.body) {
        try {
          const jsonMatch = data.text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (parsed.body || parsed.subject) data = parsed;
          }
        } catch {
          // Keep original data
        }
      }
      return data;
    },
    onSuccess: (data) => setResult(data),
  });

  // Extract email field from result, handling nested structures
  const getEmailField = (field: string): string => {
    if (!result) return '';
    // Direct field
    if (typeof result[field] === 'string') return result[field];
    // Nested under "email" key
    if (result.email && typeof result.email[field] === 'string') return result.email[field];
    // Nested under "result" key
    if (result.result && typeof result.result[field] === 'string') return result.result[field];
    return '';
  };

  const getEmailArray = (field: string): string[] => {
    if (!result) return [];
    const val = result[field] || result?.email?.[field] || result?.result?.[field];
    if (Array.isArray(val)) return val.map((v: any) => typeof v === 'string' ? v : JSON.stringify(v));
    return [];
  };

  const handleCopy = () => {
    const subject = getEmailField('subject');
    const body = getEmailField('body');
    const text = subject ? `Subject: ${subject}\n\n${body}` : body || result?.text || '';
    navigator.clipboard.writeText(text);
    setCopied(true);
  };

  return (
    <Box className="animate-fade-in">
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Email sx={{ fontSize: 32, color: 'primary.main' }} />
        <Box>
          <Typography variant="h4" fontWeight={700}>AI Email Composer</Typography>
          <Typography color="text.secondary">Draft professional insurance emails with AI assistance</Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>Compose Email</Typography>

              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Email Type</InputLabel>
                <Select value={emailType} label="Email Type" onChange={(e) => setEmailType(e.target.value)}>
                  {emailTypes.map((type) => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
                  ))}
                </Select>
              </FormControl>

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

              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Tone</InputLabel>
                <Select value={tone} label="Tone" onChange={(e) => setTone(e.target.value)}>
                  {toneOptions.map((t) => (
                    <MenuItem key={t} value={t}>{t}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Additional Context"
                placeholder="Any specific details to include in the email..."
                value={additionalContext}
                onChange={(e) => setAdditionalContext(e.target.value)}
                sx={{ mb: 3 }}
              />

              {/* Sample Test Data */}
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 3, bgcolor: 'grey.50', border: '1px dashed', borderColor: 'grey.300' }}>
                <Typography variant="caption" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary', mb: 1 }}>
                  <AutoFixHigh fontSize="small" /> SAMPLE TEST DATA
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  <Chip label="Renewal Notice" size="small" variant="outlined" color="primary" sx={{ cursor: 'pointer' }}
                    onClick={() => {
                      setClientId(clients?.[0]?.id || '');
                      setEmailType('Renewal Reminder');
                      setTone('Professional');
                      setAdditionalContext('Policy renewing with 8% premium increase due to market conditions and 2 claims in past year. Offer multi-policy discount of 5% if client bundles auto with homeowners. Renewal date is March 15, 2025. Current premium $3,200, new premium $3,456. Emphasize continued excellent coverage and claims-free discount eligibility next year.');
                    }} />
                  <Chip label="Welcome Letter" size="small" variant="outlined" color="primary" sx={{ cursor: 'pointer' }}
                    onClick={() => {
                      setClientId(clients?.[1]?.id || clients?.[0]?.id || '');
                      setEmailType('Welcome Letter');
                      setTone('Friendly');
                      setAdditionalContext('New commercial client onboarded with BOP policy. Coverage effective February 1, 2025. Premium $4,500/year. Include next steps: schedule property inspection, set up online portal access, review certificate holder requirements. Assign dedicated account manager Sarah Johnson. Mention 24/7 claims reporting line.');
                    }} />
                  <Chip label="Claim Update" size="small" variant="outlined" color="primary" sx={{ cursor: 'pointer' }}
                    onClick={() => {
                      setClientId(clients?.[2]?.id || clients?.[0]?.id || '');
                      setEmailType('Claim Update');
                      setTone('Urgent');
                      setAdditionalContext('Auto claim #CLM-2025-0234. Vehicle was totaled in accident on January 10. Adjuster has completed evaluation. Settlement offer of $18,500 based on fair market value. Client\'s rental car coverage ends in 5 days. Need to schedule call to discuss settlement options and next steps for replacing vehicle. Gap insurance may apply.');
                    }} />
                </Box>
              </Paper>

              <Button
                fullWidth
                variant="contained"
                size="large"
                startIcon={composeMutation.isPending ? <CircularProgress size={20} color="inherit" /> : <Send />}
                onClick={() => composeMutation.mutate()}
                disabled={!emailType || !clientId || composeMutation.isPending}
              >
                {composeMutation.isPending ? 'Composing...' : 'Compose Email'}
              </Button>

              {composeMutation.isError && (
                <Alert severity="error" sx={{ mt: 2 }}>Failed to compose email.</Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>Generated Email</Typography>

              {!result && !composeMutation.isPending && (
                <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
                  <Email sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                  <Typography>Select email type and client to compose an email</Typography>
                </Box>
              )}

              {composeMutation.isPending && (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <CircularProgress size={48} />
                  <Typography sx={{ mt: 2 }}>AI is composing your email...</Typography>
                </Box>
              )}

              {result && (
                <Box>
                  {/* Subject Line */}
                  {getEmailField('subject') && (
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2, mb: 3, borderRadius: 2,
                        background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
                        border: '1px solid', borderColor: 'primary.light',
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">Subject</Typography>
                      <Typography variant="h6" fontWeight={600}>{getEmailField('subject')}</Typography>
                    </Paper>
                  )}

                  {/* Tone Badge */}
                  {getEmailField('tone') && (
                    <Box sx={{ mb: 2 }}>
                      <Chip label={`Tone: ${getEmailField('tone')}`} size="small" color="primary" variant="outlined" />
                    </Box>
                  )}

                  {/* Email Body */}
                  {getEmailField('body') && (
                    <Paper variant="outlined" sx={{ p: 3, mb: 3, borderRadius: 2, position: 'relative' }}>
                      <IconButton
                        size="small"
                        onClick={handleCopy}
                        sx={{ position: 'absolute', top: 8, right: 8 }}
                      >
                        <ContentCopy fontSize="small" />
                      </IconButton>
                      <Typography variant="body1" sx={{ lineHeight: 1.8, whiteSpace: 'pre-line' }}>
                        {getEmailField('body')}
                      </Typography>
                    </Paper>
                  )}

                  {/* Suggested Follow-up */}
                  {getEmailField('suggestedFollowUp') && (
                    <Paper
                      elevation={0}
                      sx={{ p: 2, mb: 2, borderRadius: 2, bgcolor: '#e8f5e9', border: '1px solid', borderColor: '#c8e6c9' }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <TipsAndUpdates color="success" fontSize="small" />
                        <Typography variant="subtitle2" fontWeight={600}>Suggested Follow-up</Typography>
                      </Box>
                      <Typography variant="body2">{getEmailField('suggestedFollowUp')}</Typography>
                    </Paper>
                  )}

                  {/* Compliance Notes */}
                  {getEmailArray('complianceNotes').length > 0 && (
                    <Paper
                      elevation={0}
                      sx={{ p: 2, borderRadius: 2, bgcolor: '#fff3e0', border: '1px solid', borderColor: '#ffe0b2' }}
                    >
                      <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Compliance Notes</Typography>
                      {getEmailArray('complianceNotes').map((note: string, i: number) => (
                        <Typography key={i} variant="body2" sx={{ mb: 0.5 }}>• {note}</Typography>
                      ))}
                    </Paper>
                  )}

                  {/* Fallback for unstructured text */}
                  {!getEmailField('body') && result.text && (
                    <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
                      <Typography variant="body1" sx={{ lineHeight: 1.8, whiteSpace: 'pre-line' }}>
                        {result.text}
                      </Typography>
                    </Paper>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Snackbar open={copied} autoHideDuration={2000} onClose={() => setCopied(false)} message="Email copied to clipboard" />
    </Box>
  );
}
