'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  Box, Typography, Button, Card, CardContent, AppBar, Toolbar, Avatar,
  TextField, Checkbox, FormControlLabel, Snackbar, Alert, CircularProgress,
  Paper, Grid, Divider, Chip,
} from '@mui/material';
import {
  Shield, Dashboard, Logout, CheckCircle, Description,
  AttachMoney, CalendarMonth, Send,
} from '@mui/icons-material';
import { format } from 'date-fns';
import SignatureCanvas from '@/components/SignatureCanvas';

export default function ProposalSignPage() {
  const params = useParams();
  const router = useRouter();
  const proposalId = params.id as string;

  const [signerName, setSignerName] = useState('');
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [signed, setSigned] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  // Fetch all customer quotes and find the one with matching proposal id
  const { data, isLoading } = useQuery({
    queryKey: ['customer-proposal', proposalId],
    queryFn: async () => {
      const response = await axios.get('/api/customer/quotes');
      const quotes = response.data.quotes || [];
      const quote = quotes.find((q: any) => q.proposal?.id === proposalId);
      return quote || null;
    },
  });

  const handleLogout = async () => {
    try {
      await axios.post('/api/customer/auth/logout');
      router.push('/portal/login');
    } catch {
      router.push('/portal/login');
    }
  };

  const handleSignatureSave = (dataUrl: string) => {
    setSignatureData(dataUrl);
  };

  const handleSubmit = async () => {
    if (!signatureData || !signerName || !agreed) return;

    setSubmitting(true);
    try {
      await axios.post(`/api/customer/proposals/${proposalId}/sign`, {
        signatureData,
        signerName,
      });
      setSigned(true);
      setSnackbar({ open: true, message: 'Proposal signed successfully!', severity: 'success' });
    } catch (err: any) {
      const message = err.response?.data?.error || 'Failed to sign proposal. Please try again.';
      setSnackbar({ open: true, message, severity: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const proposal = data?.proposal;
  const content = proposal?.content as any;

  if (isLoading) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#f5f7fa' }}>
        <AppBar position="static" elevation={0} sx={{ bgcolor: '#0d47a1' }}>
          <Toolbar>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexGrow: 1 }}>
              <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.15)', width: 40, height: 40 }}>
                <Shield />
              </Avatar>
              <Typography variant="h6" fontWeight={700}>InsureFlow Customer Portal</Typography>
            </Box>
          </Toolbar>
        </AppBar>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  if (!data || !proposal) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#f5f7fa' }}>
        <AppBar position="static" elevation={0} sx={{ bgcolor: '#0d47a1' }}>
          <Toolbar>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexGrow: 1 }}>
              <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.15)', width: 40, height: 40 }}>
                <Shield />
              </Avatar>
              <Typography variant="h6" fontWeight={700}>InsureFlow Customer Portal</Typography>
            </Box>
          </Toolbar>
        </AppBar>
        <Box sx={{ maxWidth: 600, mx: 'auto', p: 3, textAlign: 'center', mt: 6 }}>
          <Description sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
          <Typography variant="h5" fontWeight={600} gutterBottom>
            Proposal Not Found
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            This proposal may have been removed or is no longer available.
          </Typography>
          <Button variant="contained" onClick={() => router.push('/portal/proposals')} sx={{ borderRadius: 2 }}>
            Back to Proposals
          </Button>
        </Box>
      </Box>
    );
  }

  if (signed || proposal.signedAt) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#f5f7fa' }}>
        <AppBar position="static" elevation={0} sx={{ bgcolor: '#0d47a1' }}>
          <Toolbar>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexGrow: 1 }}>
              <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.15)', width: 40, height: 40 }}>
                <Shield />
              </Avatar>
              <Typography variant="h6" fontWeight={700}>InsureFlow Customer Portal</Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button color="inherit" startIcon={<Dashboard />} onClick={() => router.push('/portal')} sx={{ textTransform: 'none' }}>
                Dashboard
              </Button>
            </Box>
          </Toolbar>
        </AppBar>
        <Box sx={{ maxWidth: 600, mx: 'auto', p: 3, textAlign: 'center', mt: 6 }}>
          <Paper elevation={0} sx={{ p: 6, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
            <CheckCircle sx={{ fontSize: 72, color: '#2e7d32', mb: 2 }} />
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Proposal Signed
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Your proposal has been successfully signed. Your agent will process your policy shortly.
            </Typography>
            <Button
              variant="contained"
              onClick={() => router.push('/portal/proposals')}
              sx={{ borderRadius: 2, px: 4, py: 1.5, fontWeight: 600, textTransform: 'none', bgcolor: '#2e7d32', '&:hover': { bgcolor: '#1b5e20' } }}
            >
              Back to Proposals
            </Button>
          </Paper>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f7fa' }}>
      {/* AppBar */}
      <AppBar position="static" elevation={0} sx={{ bgcolor: '#0d47a1' }}>
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexGrow: 1 }}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.15)', width: 40, height: 40 }}>
              <Shield />
            </Avatar>
            <Typography variant="h6" fontWeight={700}>InsureFlow Customer Portal</Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button color="inherit" startIcon={<Dashboard />} onClick={() => router.push('/portal')} sx={{ textTransform: 'none' }}>
              Dashboard
            </Button>
            <Button color="inherit" startIcon={<Logout />} onClick={handleLogout} sx={{ textTransform: 'none' }}>
              Logout
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Content */}
      <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Sign Proposal
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Review the proposal details below, then sign to accept.
        </Typography>

        {/* Proposal Details Card */}
        <Card sx={{ mb: 3, borderRadius: 2.5, border: '1px solid', borderColor: 'divider' }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Avatar sx={{ bgcolor: '#1565c0', width: 48, height: 48 }}>
                <Description />
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight={600}>
                  {data.quoteNumber}
                </Typography>
                <Chip
                  label={data.lineOfBusiness?.replace(/_/g, ' ') || 'Insurance'}
                  size="small"
                  variant="outlined"
                  sx={{ borderRadius: '6px', mt: 0.5 }}
                />
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Coverage Options from proposal content */}
            {content && (
              <>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.7rem', fontWeight: 600 }}>
                  Coverage Details
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 2 }}>
                  {content.coverageOptions && Array.isArray(content.coverageOptions) ? (
                    <Grid container spacing={1.5}>
                      {content.coverageOptions.map((option: any, index: number) => (
                        <Grid item xs={6} key={index}>
                          <Typography variant="caption" color="text.secondary">{option.label || option.name || `Coverage ${index + 1}`}</Typography>
                          <Typography variant="body2" fontWeight={600}>{option.value || option.amount || '-'}</Typography>
                        </Grid>
                      ))}
                    </Grid>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      {typeof content === 'string' ? content : JSON.stringify(content, null, 2)}
                    </Typography>
                  )}
                </Paper>
              </>
            )}

            {/* Premium */}
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AttachMoney sx={{ fontSize: 20, color: '#2e7d32' }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary">Premium</Typography>
                    <Typography variant="h6" fontWeight={700} color="#2e7d32">
                      ${Number(data.totalPremium || data.premium || 0).toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CalendarMonth sx={{ fontSize: 20, color: 'text.secondary' }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary">Effective Date</Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {data.effectiveDate ? format(new Date(data.effectiveDate), 'MMM d, yyyy') : '-'}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>

            {/* Agent Notes */}
            {data.notes && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.7rem', fontWeight: 600 }}>
                  Agent Notes
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {data.notes}
                </Typography>
              </>
            )}
          </CardContent>
        </Card>

        {/* Signature Section */}
        <Card sx={{ mb: 3, borderRadius: 2.5, border: '1px solid', borderColor: 'divider' }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Your Signature
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Please draw your signature below to accept this proposal.
            </Typography>

            <TextField
              fullWidth
              label="Full Name"
              value={signerName}
              onChange={(e) => setSignerName(e.target.value)}
              required
              sx={{ mb: 3, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              placeholder="Enter your full legal name"
            />

            <SignatureCanvas onSave={handleSignatureSave} />

            {signatureData && (
              <Alert severity="success" sx={{ mt: 2, borderRadius: 2 }}>
                Signature captured successfully.
              </Alert>
            )}

            <FormControlLabel
              control={
                <Checkbox
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  color="primary"
                />
              }
              label={
                <Typography variant="body2">
                  I agree to the terms and conditions of this insurance proposal and authorize the binding of coverage as described above.
                </Typography>
              }
              sx={{ mt: 2 }}
            />

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Button
                variant="outlined"
                onClick={() => router.push('/portal/proposals')}
                sx={{ borderRadius: 2, textTransform: 'none' }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={!signatureData || !signerName || !agreed || submitting}
                startIcon={submitting ? <CircularProgress size={18} /> : <Send />}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  bgcolor: '#2e7d32',
                  '&:hover': { bgcolor: '#1b5e20' },
                  px: 4,
                }}
              >
                {submitting ? 'Signing...' : 'Sign & Accept Proposal'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          sx={{ borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
