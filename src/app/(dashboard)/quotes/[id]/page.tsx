'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  Box, Button, Card, CardContent, Typography, Grid, Chip, Avatar,
  Tabs, Tab, List, ListItem, ListItemText, ListItemIcon,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Skeleton, Paper, Snackbar, Alert,
} from '@mui/material';
import {
  ArrowBack, Edit, RequestQuote, Person, Business, Email, Phone, LocationOn,
  CalendarToday, AttachMoney, Send, CheckCircle, Schedule, VerifiedUser, Gavel,
} from '@mui/icons-material';
import { format } from 'date-fns';

export default function QuoteDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [underwritingResult, setUnderwritingResult] = useState<any>(null);
  const [isRunningUW, setIsRunningUW] = useState(false);
  const [isIssuing, setIsIssuing] = useState(false);

  const { data: quote, isLoading } = useQuery({
    queryKey: ['quote', id],
    queryFn: async () => {
      const response = await axios.get(`/api/quotes/${id}`);
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <Box>
        <Skeleton variant="rectangular" height={200} sx={{ mb: 3, borderRadius: 2 }} />
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}><Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} /></Grid>
          <Grid item xs={12} md={8}><Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} /></Grid>
        </Grid>
      </Box>
    );
  }

  if (!quote) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h5" color="text.secondary">Quote not found</Typography>
        <Button sx={{ mt: 2 }} onClick={() => router.push('/quotes')}>Back to Quotes</Button>
      </Box>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'default';
      case 'QUOTED': return 'info';
      case 'PROPOSED': return 'primary';
      case 'ACCEPTED': case 'BOUND': return 'success';
      case 'DECLINED': case 'EXPIRED': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box className="animate-fade-in">
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={() => router.push('/quotes')}>Back</Button>
        <Box sx={{ flex: 1 }} />
        <Button
          variant="outlined"
          startIcon={<Send />}
          onClick={async () => {
            try {
              await axios.patch(`/api/quotes/${id}`, { status: 'PROPOSED' });
              queryClient.invalidateQueries({ queryKey: ['quote', id] });
              setSnackbar({ open: true, message: 'Proposal sent successfully', severity: 'success' });
            } catch {
              setSnackbar({ open: true, message: 'Failed to send proposal', severity: 'error' });
            }
          }}
        >
          Send Proposal
        </Button>
        <Button variant="outlined" startIcon={<Edit />} onClick={() => router.push(`/quotes/${id}/edit`)}>Edit</Button>
        <Button
          variant="outlined"
          startIcon={<VerifiedUser />}
          disabled={isRunningUW}
          onClick={async () => {
            setIsRunningUW(true);
            try {
              const response = await axios.post('/api/underwriting/evaluate', { quoteId: id });
              setUnderwritingResult(response.data);
              queryClient.invalidateQueries({ queryKey: ['quote', id] });
              setSnackbar({ open: true, message: `Underwriting: ${response.data.decision} (Score: ${response.data.riskScore}/${response.data.maxScore})`, severity: response.data.decision === 'APPROVED' ? 'success' : 'error' });
            } catch {
              setSnackbar({ open: true, message: 'Failed to run underwriting', severity: 'error' });
            } finally {
              setIsRunningUW(false);
            }
          }}
        >
          {isRunningUW ? 'Evaluating...' : 'Run Underwriting'}
        </Button>
        {quote.status === 'ACCEPTED' && (
          <Button
            variant="contained"
            startIcon={<Gavel />}
            disabled={isIssuing}
            onClick={async () => {
              setIsIssuing(true);
              try {
                const response = await axios.post('/api/policies/issue', { quoteId: id });
                setSnackbar({ open: true, message: `Policy ${response.data.policy.policyNumber} issued successfully!`, severity: 'success' });
                router.push(`/policies/${response.data.policy.id}`);
              } catch (err: any) {
                setSnackbar({ open: true, message: err.response?.data?.error || 'Failed to issue policy', severity: 'error' });
              } finally {
                setIsIssuing(false);
              }
            }}
          >
            {isIssuing ? 'Issuing...' : 'Bind & Issue Policy'}
          </Button>
        )}
      </Box>

      {/* Quote Header Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>
            <Avatar sx={{ width: 80, height: 80, bgcolor: 'info.main', fontSize: '2rem' }}>
              <RequestQuote />
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <Typography variant="h4" fontWeight={700}>{quote.quoteNumber}</Typography>
                <Chip label={quote.status} color={getStatusColor(quote.status) as any} size="small" />
              </Box>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {quote.lineOfBusiness?.replace(/_/g, ' ')}
              </Typography>
              <Box sx={{ display: 'flex', gap: 3, mt: 2, flexWrap: 'wrap' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <CalendarToday fontSize="small" color="action" />
                  <Typography variant="body2">Effective: {format(new Date(quote.effectiveDate), 'MMM d, yyyy')}</Typography>
                </Box>
                {quote.expiresAt && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Schedule fontSize="small" color="action" />
                    <Typography variant="body2">Expires: {format(new Date(quote.expiresAt), 'MMM d, yyyy')}</Typography>
                  </Box>
                )}
              </Box>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="body2" color="text.secondary">Total Premium</Typography>
              <Typography variant="h4" fontWeight={700} color="primary">
                ${Number(quote.totalPremium || 0).toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Agent</Typography>
              <Typography variant="body1">{quote.agent?.name}</Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Stats Row */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <AttachMoney sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4" fontWeight={700}>${Number(quote.premium || 0).toLocaleString()}</Typography>
              <Typography variant="body2" color="text.secondary">Base Premium</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <AttachMoney sx={{ fontSize: 32, color: 'info.main', mb: 1 }} />
              <Typography variant="h4" fontWeight={700}>${Number(quote.fees || 0).toLocaleString()}</Typography>
              <Typography variant="body2" color="text.secondary">Fees</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <AttachMoney sx={{ fontSize: 32, color: 'warning.main', mb: 1 }} />
              <Typography variant="h4" fontWeight={700}>${Number(quote.taxes || 0).toLocaleString()}</Typography>
              <Typography variant="body2" color="text.secondary">Taxes</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <AttachMoney sx={{ fontSize: 32, color: 'success.main', mb: 1 }} />
              <Typography variant="h4" fontWeight={700}>${Number(quote.totalPremium || 0).toLocaleString()}</Typography>
              <Typography variant="body2" color="text.secondary">Total Premium</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs Section */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
            <Tab label="Overview" />
            <Tab label="Client" />
            <Tab label="Carrier Quotes" />
            <Tab label={`Follow-ups (${quote.followUps?.length || 0})`} />
          </Tabs>
        </Box>

        <CardContent>
          {/* Overview Tab */}
          {activeTab === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" fontWeight={600} gutterBottom>Quote Details</Typography>
                <List dense>
                  <ListItem><ListItemText primary="Quote Number" secondary={quote.quoteNumber} /></ListItem>
                  <ListItem><ListItemText primary="Type" secondary={quote.type} /></ListItem>
                  <ListItem><ListItemText primary="Line of Business" secondary={quote.lineOfBusiness?.replace(/_/g, ' ')} /></ListItem>
                  <ListItem><ListItemText primary="Effective Date" secondary={format(new Date(quote.effectiveDate), 'MMMM d, yyyy')} /></ListItem>
                  <ListItem><ListItemText primary="Created" secondary={format(new Date(quote.createdAt), 'MMMM d, yyyy')} /></ListItem>
                  {quote.carrier && <ListItem><ListItemText primary="Selected Carrier" secondary={quote.carrier.name} /></ListItem>}
                </List>
              </Grid>
              <Grid item xs={12} md={6}>
                {quote.riskInfo && (
                  <>
                    <Typography variant="h6" fontWeight={600} gutterBottom>Risk Information</Typography>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <pre style={{ margin: 0, fontSize: '0.875rem' }}>
                        {JSON.stringify(quote.riskInfo, null, 2)}
                      </pre>
                    </Paper>
                  </>
                )}
                {(underwritingResult || quote.underwritingResult) && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="h6" fontWeight={600} gutterBottom>Underwriting Result</Typography>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      {(() => {
                        const uw = underwritingResult || quote.underwritingResult;
                        const decColor = uw.decision === 'APPROVED' ? 'success.main' : uw.decision === 'REFERRED' ? 'warning.main' : 'error.main';
                        return (
                          <>
                            <Box sx={{ display: 'flex', gap: 2, mb: 1, alignItems: 'center' }}>
                              <Chip label={uw.decision} color={uw.decision === 'APPROVED' ? 'success' : uw.decision === 'REFERRED' ? 'warning' : 'error'} />
                              <Typography variant="body2">Score: <strong>{uw.riskScore}</strong> / {uw.maxScore}</Typography>
                            </Box>
                            {uw.factors && uw.factors.length > 0 && (
                              <Box sx={{ mt: 1 }}>
                                <Typography variant="caption" color="text.secondary">Risk Factors:</Typography>
                                {uw.factors.map((f: any, i: number) => (
                                  <Typography key={i} variant="body2" sx={{ ml: 1 }}>
                                    - {f.ruleName}: +{f.riskPoints} pts
                                  </Typography>
                                ))}
                              </Box>
                            )}
                          </>
                        );
                      })()}
                    </Paper>
                  </Box>
                )}
              </Grid>
            </Grid>
          )}

          {/* Client Tab */}
          {activeTab === 1 && quote.client && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Avatar sx={{ bgcolor: quote.client.type === 'PERSONAL' ? 'primary.main' : 'secondary.main' }}>
                  {quote.client.type === 'PERSONAL' ? <Person /> : <Business />}
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight={600}>
                    {quote.client.type === 'COMMERCIAL' && quote.client.businessName
                      ? quote.client.businessName
                      : `${quote.client.firstName} ${quote.client.lastName}`}
                  </Typography>
                  <Chip label={quote.client.type} size="small" variant="outlined" />
                </Box>
                <Box sx={{ flex: 1 }} />
                <Button variant="outlined" onClick={() => router.push(`/clients/${quote.client.id}`)}>View Client</Button>
              </Box>
              <Grid container spacing={2}>
                {quote.client.email && (
                  <Grid item xs={12} md={4}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Email color="action" />
                      <Typography>{quote.client.email}</Typography>
                    </Box>
                  </Grid>
                )}
                {quote.client.phone && (
                  <Grid item xs={12} md={4}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Phone color="action" />
                      <Typography>{quote.client.phone}</Typography>
                    </Box>
                  </Grid>
                )}
                {quote.client.city && (
                  <Grid item xs={12} md={4}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocationOn color="action" />
                      <Typography>{quote.client.city}, {quote.client.state}</Typography>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}

          {/* Carrier Quotes Tab */}
          {activeTab === 2 && (
            <Box>
              {quote.carrierQuotes && quote.carrierQuotes.length > 0 ? (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Carrier</TableCell>
                        <TableCell>Premium</TableCell>
                        <TableCell>Score</TableCell>
                        <TableCell>Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {quote.carrierQuotes.map((cq: any, idx: number) => (
                        <TableRow key={idx} hover>
                          <TableCell>{cq.carrier}</TableCell>
                          <TableCell>${Number(cq.premium).toLocaleString()}</TableCell>
                          <TableCell><Chip label={cq.score} size="small" color="info" /></TableCell>
                          <TableCell>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={async () => {
                                try {
                                  await axios.patch(`/api/quotes/${id}`, {
                                    carrierId: cq.carrierId,
                                    totalPremium: cq.premium,
                                  });
                                  queryClient.invalidateQueries({ queryKey: ['quote', id] });
                                  setSnackbar({ open: true, message: 'Carrier selected successfully', severity: 'success' });
                                } catch {
                                  setSnackbar({ open: true, message: 'Failed to select carrier', severity: 'error' });
                                }
                              }}
                            >
                              Select
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>No carrier quotes available</Typography>
              )}
            </Box>
          )}

          {/* Follow-ups Tab */}
          {activeTab === 3 && (
            <Box>
              {quote.followUps?.length > 0 ? (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Type</TableCell>
                        <TableCell>Scheduled</TableCell>
                        <TableCell>Completed</TableCell>
                        <TableCell>Notes</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {quote.followUps.map((fu: any) => (
                        <TableRow key={fu.id} hover>
                          <TableCell>{fu.type}</TableCell>
                          <TableCell>{format(new Date(fu.scheduledAt), 'MM/dd/yyyy')}</TableCell>
                          <TableCell>
                            {fu.completedAt ? (
                              <Chip label={format(new Date(fu.completedAt), 'MM/dd/yyyy')} size="small" color="success" />
                            ) : (
                              <Chip label="Pending" size="small" color="warning" />
                            )}
                          </TableCell>
                          <TableCell>{fu.notes}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>No follow-ups scheduled</Typography>
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
