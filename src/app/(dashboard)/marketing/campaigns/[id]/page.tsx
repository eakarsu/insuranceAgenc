'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  Box, Button, Card, CardContent, Typography, Grid, Chip, Avatar,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Skeleton, Paper, Snackbar, Alert,
} from '@mui/material';
import { ArrowBack, Edit, Send, Campaign, Email, Sms, Mail, Person } from '@mui/icons-material';
import { format } from 'date-fns';

export default function CampaignDetailPage() {
  const params = useParams<{ id: string }>();
  const { id } = params;
  const router = useRouter();
  const queryClient = useQueryClient();
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const { data: campaign, isLoading } = useQuery({
    queryKey: ['campaign', id],
    queryFn: async () => {
      const response = await axios.get(`/api/marketing/campaigns/${id}`);
      return response.data;
    },
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      await axios.patch(`/api/marketing/campaigns/${id}`, { status: 'SENDING' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign', id] });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      setSnackbar({ open: true, message: 'Campaign sent successfully', severity: 'success' });
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to send campaign', severity: 'error' });
    },
  });

  if (isLoading) {
    return (
      <Box>
        <Skeleton variant="rectangular" height={200} sx={{ mb: 3, borderRadius: 2 }} />
        <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
      </Box>
    );
  }

  if (!campaign) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h5" color="text.secondary">Campaign not found</Typography>
        <Button sx={{ mt: 2 }} onClick={() => router.push('/marketing/campaigns')}>Back to Campaigns</Button>
      </Box>
    );
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'EMAIL': return <Email />;
      case 'SMS': return <Sms />;
      case 'MAIL': return <Mail />;
      default: return <Campaign />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'default';
      case 'SCHEDULED': return 'info';
      case 'SENDING': return 'warning';
      case 'SENT': return 'success';
      case 'CANCELLED': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box className="animate-fade-in">
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={() => router.push('/marketing/campaigns')}>Back</Button>
        <Box sx={{ flex: 1 }} />
        {campaign.status === 'DRAFT' && (
          <Button
            variant="contained"
            startIcon={<Send />}
            onClick={() => sendMutation.mutate()}
            disabled={sendMutation.isPending}
          >
            {sendMutation.isPending ? 'Sending...' : 'Send Campaign'}
          </Button>
        )}
        <Button variant="outlined" startIcon={<Edit />} onClick={() => router.push(`/marketing/campaigns/${id}/edit`)}>
          Edit
        </Button>
      </Box>

      {/* Campaign Header Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>
            <Avatar sx={{ width: 80, height: 80, bgcolor: 'primary.main', fontSize: '2rem' }}>
              {getTypeIcon(campaign.type)}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <Typography variant="h4" fontWeight={700}>{campaign.name}</Typography>
                <Chip label={campaign.status} color={getStatusColor(campaign.status) as any} size="small" />
                <Chip label={campaign.type} variant="outlined" size="small" />
              </Box>
              {campaign.subject && (
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Subject: {campaign.subject}
                </Typography>
              )}
              <Box sx={{ display: 'flex', gap: 3, mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Created: {format(new Date(campaign.createdAt), 'MMM d, yyyy')}
                </Typography>
                {campaign.sentAt && (
                  <Typography variant="body2" color="text.secondary">
                    Sent: {format(new Date(campaign.sentAt), 'MMM d, yyyy')}
                  </Typography>
                )}
                {campaign.createdBy && (
                  <Typography variant="body2" color="text.secondary">
                    By: {campaign.createdBy.name}
                  </Typography>
                )}
              </Box>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="body2" color="text.secondary">Recipients</Typography>
              <Typography variant="h4" fontWeight={700} color="primary">
                {campaign.recipientCount || campaign.recipients?.length || 0}
              </Typography>
              {campaign.status === 'SENT' && (
                <>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Open Rate</Typography>
                  <Typography variant="h6" color="success.main">
                    {campaign.recipientCount ? Math.round((campaign.openCount / campaign.recipientCount) * 100) : 0}%
                  </Typography>
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
              <Typography variant="h3" fontWeight={700} color="primary.main">
                {campaign.recipientCount || campaign.recipients?.length || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">Recipients</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h3" fontWeight={700} color="success.main">
                {campaign.openCount || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">Opens</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h3" fontWeight={700} color="info.main">
                {campaign.clickCount || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">Clicks</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h3" fontWeight={700} color="warning.main">
                {campaign.bounceCount || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">Bounces</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Content Section */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>Content</Typography>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {campaign.content || 'No content'}
                </Typography>
              </Paper>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Recipients ({campaign.recipients?.length || 0})
              </Typography>
              {campaign.recipients?.length > 0 ? (
                <TableContainer sx={{ maxHeight: 300 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Email</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {campaign.recipients.map((recipient: any) => (
                        <TableRow key={recipient.id} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Avatar sx={{ width: 24, height: 24 }}><Person sx={{ fontSize: 16 }} /></Avatar>
                              {recipient.client?.firstName} {recipient.client?.lastName}
                            </Box>
                          </TableCell>
                          <TableCell>{recipient.client?.email || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  No recipients added yet
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Snackbar open={snackbar.open} autoHideDuration={5000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}
