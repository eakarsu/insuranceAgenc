'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  Box, Button, Card, CardContent, Typography, Grid, Chip, Avatar,
  Tabs, Tab, List, ListItem, ListItemText, ListItemIcon, Divider,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Skeleton, Paper,
} from '@mui/material';
import {
  ArrowBack, Edit, Policy, Person, Business, Email, Phone, LocationOn,
  CalendarToday, AttachMoney, Description, Gavel, ReportProblem,
} from '@mui/icons-material';
import { format } from 'date-fns';

export default function PolicyDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(0);

  const { data: policy, isLoading } = useQuery({
    queryKey: ['policy', id],
    queryFn: async () => {
      const response = await axios.get(`/api/policies/${id}`);
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

  if (!policy) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h5" color="text.secondary">Policy not found</Typography>
        <Button sx={{ mt: 2 }} onClick={() => router.push('/policies')}>Back to Policies</Button>
      </Box>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'PENDING': return 'warning';
      case 'CANCELLED': case 'EXPIRED': case 'NON_RENEWED': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box className="animate-fade-in">
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={() => router.push('/policies')}>Back</Button>
        <Box sx={{ flex: 1 }} />
        <Button variant="outlined" startIcon={<Edit />} onClick={() => router.push(`/policies/${id}/edit`)}>Edit</Button>
      </Box>

      {/* Policy Header Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>
            <Avatar sx={{ width: 80, height: 80, bgcolor: 'primary.main', fontSize: '2rem' }}>
              <Policy />
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <Typography variant="h4" fontWeight={700}>{policy.policyNumber}</Typography>
                <Chip label={policy.status} color={getStatusColor(policy.status) as any} size="small" />
              </Box>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {policy.lineOfBusiness?.replace(/_/g, ' ')}
              </Typography>
              <Box sx={{ display: 'flex', gap: 3, mt: 2, flexWrap: 'wrap' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <CalendarToday fontSize="small" color="action" />
                  <Typography variant="body2">
                    {format(new Date(policy.effectiveDate), 'MMM d, yyyy')} - {format(new Date(policy.expirationDate), 'MMM d, yyyy')}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <AttachMoney fontSize="small" color="action" />
                  <Typography variant="body2">${Number(policy.premium).toLocaleString()} Premium</Typography>
                </Box>
              </Box>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="body2" color="text.secondary">Carrier</Typography>
              <Typography variant="body1" fontWeight={600}>{policy.carrier?.name}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Agent</Typography>
              <Typography variant="body1">{policy.agent?.name}</Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Stats Row */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <AttachMoney sx={{ fontSize: 32, color: 'success.main', mb: 1 }} />
              <Typography variant="h4" fontWeight={700}>${Number(policy.premium).toLocaleString()}</Typography>
              <Typography variant="body2" color="text.secondary">Premium</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Gavel sx={{ fontSize: 32, color: 'info.main', mb: 1 }} />
              <Typography variant="h4" fontWeight={700}>{policy.endorsements?.length || 0}</Typography>
              <Typography variant="body2" color="text.secondary">Endorsements</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <ReportProblem sx={{ fontSize: 32, color: 'warning.main', mb: 1 }} />
              <Typography variant="h4" fontWeight={700}>{policy.claims?.length || 0}</Typography>
              <Typography variant="body2" color="text.secondary">Claims</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <AttachMoney sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4" fontWeight={700}>
                ${policy.commissions?.reduce((sum: number, c: any) => sum + Number(c.amount || 0), 0).toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">Commission</Typography>
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
            <Tab label={`Endorsements (${policy.endorsements?.length || 0})`} />
            <Tab label={`Claims (${policy.claims?.length || 0})`} />
            <Tab label="Documents" />
          </Tabs>
        </Box>

        <CardContent>
          {/* Overview Tab */}
          {activeTab === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" fontWeight={600} gutterBottom>Policy Details</Typography>
                <List dense>
                  <ListItem><ListItemText primary="Policy Number" secondary={policy.policyNumber} /></ListItem>
                  <ListItem><ListItemText primary="Type" secondary={policy.type} /></ListItem>
                  <ListItem><ListItemText primary="Line of Business" secondary={policy.lineOfBusiness?.replace(/_/g, ' ')} /></ListItem>
                  <ListItem><ListItemText primary="Effective Date" secondary={format(new Date(policy.effectiveDate), 'MMMM d, yyyy')} /></ListItem>
                  <ListItem><ListItemText primary="Expiration Date" secondary={format(new Date(policy.expirationDate), 'MMMM d, yyyy')} /></ListItem>
                  <ListItem><ListItemText primary="Billing Method" secondary={policy.billingMethod} /></ListItem>
                </List>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" fontWeight={600} gutterBottom>Financial</Typography>
                <List dense>
                  <ListItem><ListItemText primary="Premium" secondary={`$${Number(policy.premium).toLocaleString()}`} /></ListItem>
                  <ListItem><ListItemText primary="Down Payment" secondary={policy.downPayment ? `$${Number(policy.downPayment).toLocaleString()}` : '-'} /></ListItem>
                  <ListItem><ListItemText primary="Installments" secondary={policy.installments || '-'} /></ListItem>
                </List>
                {policy.coverageSummary && (
                  <>
                    <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mt: 2 }}>Coverage</Typography>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <pre style={{ margin: 0, fontSize: '0.875rem' }}>
                        {JSON.stringify(policy.coverageSummary, null, 2)}
                      </pre>
                    </Paper>
                  </>
                )}
              </Grid>
            </Grid>
          )}

          {/* Client Tab */}
          {activeTab === 1 && policy.client && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Avatar sx={{ bgcolor: policy.client.type === 'PERSONAL' ? 'primary.main' : 'secondary.main' }}>
                  {policy.client.type === 'PERSONAL' ? <Person /> : <Business />}
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight={600}>
                    {policy.client.type === 'COMMERCIAL' && policy.client.businessName
                      ? policy.client.businessName
                      : `${policy.client.firstName} ${policy.client.lastName}`}
                  </Typography>
                  <Chip label={policy.client.type} size="small" variant="outlined" />
                </Box>
                <Box sx={{ flex: 1 }} />
                <Button variant="outlined" onClick={() => router.push(`/clients/${policy.client.id}`)}>
                  View Client
                </Button>
              </Box>
              <Grid container spacing={2}>
                {policy.client.email && (
                  <Grid item xs={12} md={4}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Email color="action" />
                      <Typography>{policy.client.email}</Typography>
                    </Box>
                  </Grid>
                )}
                {policy.client.phone && (
                  <Grid item xs={12} md={4}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Phone color="action" />
                      <Typography>{policy.client.phone}</Typography>
                    </Box>
                  </Grid>
                )}
                {policy.client.city && (
                  <Grid item xs={12} md={4}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocationOn color="action" />
                      <Typography>{policy.client.city}, {policy.client.state}</Typography>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}

          {/* Endorsements Tab */}
          {activeTab === 2 && (
            <Box>
              {policy.endorsements?.length > 0 ? (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Number</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell>Effective Date</TableCell>
                        <TableCell>Premium Change</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {policy.endorsements.map((end: any) => (
                        <TableRow key={end.id} hover>
                          <TableCell>{end.endorsementNumber}</TableCell>
                          <TableCell>{end.type}</TableCell>
                          <TableCell>{end.description}</TableCell>
                          <TableCell>{format(new Date(end.effectiveDate), 'MM/dd/yyyy')}</TableCell>
                          <TableCell sx={{ color: end.premiumChange >= 0 ? 'success.main' : 'error.main' }}>
                            {end.premiumChange >= 0 ? '+' : ''}${end.premiumChange}
                          </TableCell>
                          <TableCell><Chip label={end.status} size="small" /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>No endorsements</Typography>
              )}
            </Box>
          )}

          {/* Claims Tab */}
          {activeTab === 3 && (
            <Box>
              {policy.claims?.length > 0 ? (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Claim #</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Date of Loss</TableCell>
                        <TableCell>Estimated Loss</TableCell>
                        <TableCell>Paid</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {policy.claims.map((claim: any) => (
                        <TableRow key={claim.id} hover sx={{ cursor: 'pointer' }} onClick={() => router.push(`/claims/${claim.id}`)}>
                          <TableCell>{claim.claimNumber}</TableCell>
                          <TableCell>{claim.type}</TableCell>
                          <TableCell>{format(new Date(claim.dateOfLoss), 'MM/dd/yyyy')}</TableCell>
                          <TableCell>${Number(claim.estimatedLoss || 0).toLocaleString()}</TableCell>
                          <TableCell>{claim.paidAmount ? `$${Number(claim.paidAmount).toLocaleString()}` : '-'}</TableCell>
                          <TableCell><Chip label={claim.status?.replace(/_/g, ' ')} size="small" color="warning" /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>No claims</Typography>
              )}
            </Box>
          )}

          {/* Documents Tab */}
          {activeTab === 4 && (
            <Box>
              {policy.documents?.length > 0 ? (
                <List>
                  {policy.documents.map((doc: any) => (
                    <ListItem key={doc.id}>
                      <ListItemIcon><Description /></ListItemIcon>
                      <ListItemText primary={doc.name} secondary={`${doc.type} - ${format(new Date(doc.uploadedAt), 'MMM d, yyyy')}`} />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>No documents</Typography>
              )}
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
