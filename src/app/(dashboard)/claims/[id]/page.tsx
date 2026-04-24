'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  Box, Button, Card, CardContent, Typography, Grid, Chip, Avatar,
  Tabs, Tab, List, ListItem, ListItemText, ListItemIcon,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Skeleton, Paper,
} from '@mui/material';
import {
  ArrowBack, Edit, ReportProblem, Person, Business, Email, Phone, LocationOn,
  CalendarToday, AttachMoney, Description, Policy, CheckCircle, AccessTime,
} from '@mui/icons-material';
import { format } from 'date-fns';
import AIAnalysisCard from '@/components/ai/AIAnalysisCard';
import DocumentAnalysisCard from '@/components/ai/DocumentAnalysisCard';

export default function ClaimDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(0);

  const { data: claim, isLoading } = useQuery({
    queryKey: ['claim', id],
    queryFn: async () => {
      const response = await axios.get(`/api/claims/${id}`);
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

  if (!claim) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h5" color="text.secondary">Claim not found</Typography>
        <Button sx={{ mt: 2 }} onClick={() => router.push('/claims')}>Back to Claims</Button>
      </Box>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'REPORTED': return 'info';
      case 'UNDER_REVIEW': return 'warning';
      case 'APPROVED': return 'success';
      case 'DENIED': return 'error';
      case 'SETTLED': case 'CLOSED': return 'default';
      default: return 'default';
    }
  };

  return (
    <Box className="animate-fade-in">
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={() => router.push('/claims')}>Back</Button>
        <Box sx={{ flex: 1 }} />
        <Button variant="outlined" startIcon={<Edit />} onClick={() => router.push(`/claims/${id}/edit`)}>Edit</Button>
      </Box>

      {/* Claim Header Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>
            <Avatar sx={{ width: 80, height: 80, bgcolor: 'warning.main', fontSize: '2rem' }}>
              <ReportProblem />
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <Typography variant="h4" fontWeight={700}>{claim.claimNumber}</Typography>
                <Chip label={claim.status?.replace(/_/g, ' ')} color={getStatusColor(claim.status) as any} size="small" />
                {claim.aiRiskScore != null && (
                  <Chip
                    label={`AI Risk: ${(claim.aiRiskScore * 100).toFixed(0)}%`}
                    size="small"
                    color={claim.aiRiskScore <= 0.3 ? 'success' : claim.aiRiskScore <= 0.7 ? 'warning' : 'error'}
                  />
                )}
              </Box>
              <Typography variant="h6" color="text.secondary" gutterBottom>{claim.type}</Typography>
              <Box sx={{ display: 'flex', gap: 3, mt: 2, flexWrap: 'wrap' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <CalendarToday fontSize="small" color="action" />
                  <Typography variant="body2">Date of Loss: {format(new Date(claim.dateOfLoss), 'MMM d, yyyy')}</Typography>
                </Box>
                {claim.lossLocation && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <LocationOn fontSize="small" color="action" />
                    <Typography variant="body2">{claim.lossLocation}</Typography>
                  </Box>
                )}
              </Box>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="body2" color="text.secondary">Estimated Loss</Typography>
              <Typography variant="h4" fontWeight={700} color="error">
                ${Number(claim.estimatedLoss || 0).toLocaleString()}
              </Typography>
              {claim.paidAmount && (
                <>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Amount Paid</Typography>
                  <Typography variant="h6" color="success.main">${Number(claim.paidAmount).toLocaleString()}</Typography>
                </>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Stats Row */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <AttachMoney sx={{ fontSize: 32, color: 'error.main', mb: 1 }} />
              <Typography variant="h4" fontWeight={700}>${Number(claim.estimatedLoss || 0).toLocaleString()}</Typography>
              <Typography variant="body2" color="text.secondary">Estimated Loss</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <AttachMoney sx={{ fontSize: 32, color: 'warning.main', mb: 1 }} />
              <Typography variant="h4" fontWeight={700}>${Number(claim.deductible || 0).toLocaleString()}</Typography>
              <Typography variant="body2" color="text.secondary">Deductible</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <AttachMoney sx={{ fontSize: 32, color: 'success.main', mb: 1 }} />
              <Typography variant="h4" fontWeight={700}>${Number(claim.paidAmount || 0).toLocaleString()}</Typography>
              <Typography variant="body2" color="text.secondary">Amount Paid</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Description sx={{ fontSize: 32, color: 'info.main', mb: 1 }} />
              <Typography variant="h4" fontWeight={700}>{claim.documents?.length || 0}</Typography>
              <Typography variant="body2" color="text.secondary">Documents</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs Section */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
            <Tab label="Overview" />
            <Tab label="Client & Policy" />
            <Tab label="Documents" />
            <Tab label="Settlements" />
            <Tab label="AI Analysis" />
            <Tab label="Fraud Detection" />
          </Tabs>
        </Box>

        <CardContent>
          {/* Overview Tab */}
          {activeTab === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" fontWeight={600} gutterBottom>Claim Details</Typography>
                <List dense>
                  <ListItem><ListItemText primary="Claim Number" secondary={claim.claimNumber} /></ListItem>
                  <ListItem><ListItemText primary="Type" secondary={claim.type} /></ListItem>
                  <ListItem><ListItemText primary="Status" secondary={claim.status?.replace(/_/g, ' ')} /></ListItem>
                  <ListItem><ListItemText primary="Date of Loss" secondary={format(new Date(claim.dateOfLoss), 'MMMM d, yyyy')} /></ListItem>
                  <ListItem><ListItemText primary="Date Reported" secondary={format(new Date(claim.createdAt), 'MMMM d, yyyy')} /></ListItem>
                  {claim.lossLocation && <ListItem><ListItemText primary="Loss Location" secondary={claim.lossLocation} /></ListItem>}
                </List>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" fontWeight={600} gutterBottom>Description</Typography>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="body2">{claim.description || 'No description provided'}</Typography>
                </Paper>
                {claim.agent && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="h6" fontWeight={600} gutterBottom>Assigned Agent</Typography>
                    <Typography>{claim.agent.name}</Typography>
                    <Typography variant="body2" color="text.secondary">{claim.agent.email}</Typography>
                  </Box>
                )}
              </Grid>
            </Grid>
          )}

          {/* Client & Policy Tab */}
          {activeTab === 1 && (
            <Grid container spacing={3}>
              {claim.client && (
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" fontWeight={600} gutterBottom>Client</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar sx={{ bgcolor: claim.client.type === 'PERSONAL' ? 'primary.main' : 'secondary.main' }}>
                      {claim.client.type === 'PERSONAL' ? <Person /> : <Business />}
                    </Avatar>
                    <Box>
                      <Typography fontWeight={600}>
                        {claim.client.type === 'COMMERCIAL' && claim.client.businessName
                          ? claim.client.businessName
                          : `${claim.client.firstName} ${claim.client.lastName}`}
                      </Typography>
                      <Chip label={claim.client.type} size="small" variant="outlined" />
                    </Box>
                  </Box>
                  <List dense>
                    {claim.client.email && (
                      <ListItem>
                        <ListItemIcon><Email /></ListItemIcon>
                        <ListItemText primary={claim.client.email} />
                      </ListItem>
                    )}
                    {claim.client.phone && (
                      <ListItem>
                        <ListItemIcon><Phone /></ListItemIcon>
                        <ListItemText primary={claim.client.phone} />
                      </ListItem>
                    )}
                  </List>
                  <Button variant="outlined" onClick={() => router.push(`/clients/${claim.client.id}`)} sx={{ mt: 1 }}>
                    View Client
                  </Button>
                </Grid>
              )}
              {claim.policy && (
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" fontWeight={600} gutterBottom>Policy</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      <Policy />
                    </Avatar>
                    <Box>
                      <Typography fontWeight={600}>{claim.policy.policyNumber}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {claim.policy.lineOfBusiness?.replace(/_/g, ' ')}
                      </Typography>
                    </Box>
                  </Box>
                  {claim.policy.carrier && (
                    <Typography variant="body2">Carrier: {claim.policy.carrier.name}</Typography>
                  )}
                  <Button variant="outlined" onClick={() => router.push(`/policies/${claim.policy.id}`)} sx={{ mt: 1 }}>
                    View Policy
                  </Button>
                </Grid>
              )}
            </Grid>
          )}

          {/* Documents Tab */}
          {activeTab === 2 && (
            <Box>
              {claim.documents?.length > 0 ? (
                <List>
                  {claim.documents.map((doc: any) => (
                    <ListItem key={doc.id}>
                      <ListItemIcon><Description /></ListItemIcon>
                      <ListItemText primary={doc.name} secondary={`${doc.type} - ${format(new Date(doc.uploadedAt), 'MMM d, yyyy')}`} />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>No documents uploaded</Typography>
              )}
            </Box>
          )}

          {/* Settlements Tab */}
          {activeTab === 3 && (
            <Box>
              {claim.settlements?.length > 0 ? (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Amount</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Notes</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {claim.settlements.map((settlement: any) => (
                        <TableRow key={settlement.id}>
                          <TableCell>{format(new Date(settlement.createdAt), 'MM/dd/yyyy')}</TableCell>
                          <TableCell>{settlement.type}</TableCell>
                          <TableCell>${Number(settlement.amount).toLocaleString()}</TableCell>
                          <TableCell><Chip label={settlement.status} size="small" /></TableCell>
                          <TableCell>{settlement.notes}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>No settlements recorded</Typography>
              )}
            </Box>
          )}

          {/* AI Analysis Tab */}
          {activeTab === 4 && (
            <Box>
              <AIAnalysisCard
                claimId={claim.id}
                classification={claim.aiClassification}
                riskScore={claim.aiRiskScore}
                aiFlags={claim.aiFlags}
                onUpdate={() => queryClient.invalidateQueries({ queryKey: ['claim', id] })}
              />
              {claim.documents?.some((d: any) => d.aiAnalysis) && (
                <>
                  <Typography variant="h6" fontWeight={600} sx={{ mt: 3, mb: 1 }}>Document Analyses</Typography>
                  {claim.documents.filter((d: any) => d.aiAnalysis).map((doc: any) => (
                    <Box key={doc.id} sx={{ mb: 1 }}>
                      <Typography variant="body2" fontWeight={500} gutterBottom>{doc.name}</Typography>
                      <DocumentAnalysisCard analysis={doc.aiAnalysis} />
                    </Box>
                  ))}
                </>
              )}
            </Box>
          )}

          {/* Fraud Detection Tab */}
          {activeTab === 5 && (
            <Box>
              {claim.aiFlags?.fraudDetection ? (
                <>
                  <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
                    <Typography variant="h6" fontWeight={600}>Fraud Risk Score</Typography>
                    <Chip
                      label={`${((claim.aiFlags.fraudDetection.fraudRiskScore || claim.aiRiskScore || 0) * 100).toFixed(0)}%`}
                      color={
                        (claim.aiFlags.fraudDetection.fraudRiskScore || claim.aiRiskScore || 0) <= 0.3 ? 'success' :
                        (claim.aiFlags.fraudDetection.fraudRiskScore || claim.aiRiskScore || 0) <= 0.7 ? 'warning' : 'error'
                      }
                    />
                  </Box>
                  {claim.aiFlags.fraudDetection.explanation && (
                    <Typography variant="body2" sx={{ mb: 2 }}>{claim.aiFlags.fraudDetection.explanation}</Typography>
                  )}
                  {claim.aiFlags.fraudDetection.indicators?.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle1" fontWeight={600} gutterBottom>Fraud Indicators</Typography>
                      <List dense>
                        {claim.aiFlags.fraudDetection.indicators.map((ind: any, i: number) => (
                          <ListItem key={i}>
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                  <Chip label={ind.severity} size="small" color={ind.severity === 'HIGH' ? 'error' : ind.severity === 'MEDIUM' ? 'warning' : 'info'} />
                                  <span>{ind.type?.replace(/_/g, ' ')}</span>
                                </Box>
                              }
                              secondary={ind.description}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}
                  {claim.aiFlags.fraudDetection.recommendation && (
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>Recommendation</Typography>
                      <Typography variant="body2">{claim.aiFlags.fraudDetection.recommendation}</Typography>
                    </Paper>
                  )}
                </>
              ) : (
                <Box>
                  <Typography color="text.secondary" sx={{ mb: 2 }}>No fraud detection data available. Run AI analysis to generate fraud detection results.</Typography>
                  <AIAnalysisCard
                    claimId={claim.id}
                    classification={claim.aiClassification}
                    riskScore={claim.aiRiskScore}
                    aiFlags={claim.aiFlags}
                    onUpdate={() => queryClient.invalidateQueries({ queryKey: ['claim', id] })}
                  />
                </Box>
              )}
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
