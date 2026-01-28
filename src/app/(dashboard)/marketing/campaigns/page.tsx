'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  Box, Button, Card, CardContent, Typography, Grid, Chip, IconButton, Menu, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel, Select,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, LinearProgress,
} from '@mui/material';
import { Add, MoreVert, Edit, Delete, Send, Visibility, Campaign, Email, Sms, Mail } from '@mui/icons-material';
import { format } from 'date-fns';

export default function CampaignsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', type: 'EMAIL', subject: '', content: '' });

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const response = await axios.get('/api/marketing/campaigns');
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      await axios.post('/api/marketing/campaigns', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      setDialogOpen(false);
      setFormData({ name: '', type: 'EMAIL', subject: '', content: '' });
    },
  });

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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>Marketing Campaigns</Typography>
          <Typography color="text.secondary">Create and manage marketing campaigns</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => setDialogOpen(true)}>
          New Campaign
        </Button>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h3" fontWeight={700} color="primary.main">{campaigns.length}</Typography>
              <Typography color="text.secondary">Total Campaigns</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h3" fontWeight={700} color="success.main">
                {campaigns.filter((c: any) => c.status === 'SENT').length}
              </Typography>
              <Typography color="text.secondary">Sent</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h3" fontWeight={700} color="info.main">
                {campaigns.reduce((acc: number, c: any) => acc + (c.recipientCount || 0), 0)}
              </Typography>
              <Typography color="text.secondary">Recipients</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h3" fontWeight={700} color="warning.main">
                {campaigns.reduce((acc: number, c: any) => acc + (c.openCount || 0), 0)}
              </Typography>
              <Typography color="text.secondary">Opens</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Campaign</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Recipients</TableCell>
                <TableCell>Performance</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Date</TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {campaigns.map((campaign: any) => (
                <TableRow key={campaign.id} hover>
                  <TableCell>
                    <Typography fontWeight={600}>{campaign.name}</Typography>
                    {campaign.subject && (
                      <Typography variant="caption" color="text.secondary">{campaign.subject}</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip icon={getTypeIcon(campaign.type)} label={campaign.type} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>{campaign.recipientCount || 0}</TableCell>
                  <TableCell>
                    {campaign.status === 'SENT' ? (
                      <Box sx={{ minWidth: 120 }}>
                        <Typography variant="caption" color="text.secondary">
                          {campaign.openCount || 0} opens ({campaign.recipientCount ? Math.round((campaign.openCount / campaign.recipientCount) * 100) : 0}%)
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={campaign.recipientCount ? (campaign.openCount / campaign.recipientCount) * 100 : 0}
                          sx={{ height: 6, borderRadius: 3 }}
                        />
                      </Box>
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    <Chip label={campaign.status} size="small" color={getStatusColor(campaign.status) as any} />
                  </TableCell>
                  <TableCell>
                    {campaign.sentAt
                      ? format(new Date(campaign.sentAt), 'MMM d, yyyy')
                      : campaign.scheduledAt
                        ? format(new Date(campaign.scheduledAt), 'MMM d, yyyy')
                        : '-'}
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={(e) => { setAnchorEl(e.currentTarget); setSelectedCampaign(campaign); }}>
                      <MoreVert />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {campaigns.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography color="text.secondary">No campaigns yet</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
        <MenuItem onClick={() => {
          router.push(`/marketing/campaigns/${selectedCampaign?.id}`);
          setAnchorEl(null);
        }}>
          <Visibility sx={{ mr: 1 }} fontSize="small" /> View
        </MenuItem>
        <MenuItem onClick={() => {
          router.push(`/marketing/campaigns/${selectedCampaign?.id}/edit`);
          setAnchorEl(null);
        }}>
          <Edit sx={{ mr: 1 }} fontSize="small" /> Edit
        </MenuItem>
        {selectedCampaign?.status === 'DRAFT' && (
          <MenuItem onClick={async () => {
            try {
              await axios.patch(`/api/marketing/campaigns/${selectedCampaign?.id}`, { status: 'SENDING' });
              queryClient.invalidateQueries({ queryKey: ['campaigns'] });
            } catch (e) {
              console.error('Failed to send campaign');
            }
            setAnchorEl(null);
          }}>
            <Send sx={{ mr: 1 }} fontSize="small" /> Send
          </MenuItem>
        )}
        <MenuItem onClick={async () => {
          if (confirm('Are you sure you want to delete this campaign?')) {
            try {
              await axios.delete(`/api/marketing/campaigns/${selectedCampaign?.id}`);
              queryClient.invalidateQueries({ queryKey: ['campaigns'] });
            } catch (e) {
              console.error('Failed to delete campaign');
            }
          }
          setAnchorEl(null);
        }} sx={{ color: 'error.main' }}>
          <Delete sx={{ mr: 1 }} fontSize="small" /> Delete
        </MenuItem>
      </Menu>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create Campaign</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                label="Campaign Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select value={formData.type} label="Type" onChange={(e) => setFormData({ ...formData, type: e.target.value })}>
                  <MenuItem value="EMAIL">Email</MenuItem>
                  <MenuItem value="SMS">SMS</MenuItem>
                  <MenuItem value="MAIL">Direct Mail</MenuItem>
                  <MenuItem value="RENEWAL_REMINDER">Renewal Reminder</MenuItem>
                  <MenuItem value="CROSS_SELL">Cross-Sell</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={6}
                label="Content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => createMutation.mutate(formData)}
            disabled={!formData.name || createMutation.isPending}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
