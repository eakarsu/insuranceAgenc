'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  Box, Button, Card, CardContent, Typography, Grid, Chip, TextField, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, Alert, Skeleton,
} from '@mui/material';
import { ArrowBack, Edit, Send, ContentCopy, Email } from '@mui/icons-material';
import { format } from 'date-fns';

export default function TemplateDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const queryClient = useQueryClient();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [useTemplateDialogOpen, setUseTemplateDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', subject: '', content: '', type: '', status: '' });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const { data: template, isLoading } = useQuery({
    queryKey: ['template', id],
    queryFn: async () => {
      const response = await axios.get(`/api/marketing/templates/${id}`);
      return response.data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await axios.put(`/api/marketing/templates/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['template', id] });
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      setEditDialogOpen(false);
      setSnackbar({ open: true, message: 'Template updated successfully', severity: 'success' });
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to update template', severity: 'error' });
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.post('/api/marketing/templates', {
        name: `${template.name} (Copy)`,
        type: template.type,
        subject: template.subject,
        content: template.content,
        status: 'DRAFT',
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      setSnackbar({ open: true, message: 'Template duplicated successfully', severity: 'success' });
      router.push(`/marketing/templates/${data.id}`);
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to duplicate template', severity: 'error' });
    },
  });

  const handleEdit = () => {
    setEditForm({
      name: template.name,
      subject: template.subject,
      content: template.content,
      type: template.type,
      status: template.status,
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    updateMutation.mutate(editForm);
  };

  const handleDuplicate = () => {
    duplicateMutation.mutate();
  };

  const handleUseTemplate = () => {
    setUseTemplateDialogOpen(true);
  };

  const handleCreateCampaign = () => {
    setUseTemplateDialogOpen(false);
    router.push(`/marketing/campaigns?templateId=${id}&name=${encodeURIComponent(template.name)}&subject=${encodeURIComponent(template.subject)}`);
  };

  if (isLoading) {
    return (
      <Box>
        <Skeleton variant="rectangular" height={60} sx={{ mb: 3 }} />
        <Skeleton variant="rectangular" height={400} />
      </Box>
    );
  }

  if (!template) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h5" color="text.secondary">Template not found</Typography>
        <Button sx={{ mt: 2 }} onClick={() => router.push('/marketing/templates')}>
          Back to Templates
        </Button>
      </Box>
    );
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'WELCOME': return 'primary';
      case 'RENEWAL': return 'warning';
      case 'FOLLOW_UP': return 'info';
      case 'BIRTHDAY': return 'secondary';
      case 'CLAIM': return 'error';
      case 'CROSS_SELL': return 'success';
      default: return 'default';
    }
  };

  return (
    <Box className="animate-fade-in">
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={() => router.push('/marketing/templates')}>
          Back
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button variant="outlined" startIcon={<ContentCopy />} onClick={handleDuplicate} disabled={duplicateMutation.isPending}>
          {duplicateMutation.isPending ? 'Duplicating...' : 'Duplicate'}
        </Button>
        <Button variant="outlined" startIcon={<Edit />} onClick={handleEdit}>
          Edit
        </Button>
        <Button variant="contained" startIcon={<Send />} onClick={handleUseTemplate}>
          Use Template
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Email sx={{ fontSize: 40, color: 'primary.main' }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h5" fontWeight={700}>{template.name}</Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Chip label={template.type?.replace(/_/g, ' ')} size="small" color={getTypeColor(template.type) as any} />
                    <Chip
                      label={template.status}
                      size="small"
                      color={template.status === 'ACTIVE' ? 'success' : 'default'}
                    />
                  </Box>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Subject Line
              </Typography>
              <Typography variant="body1" sx={{ mb: 3, fontWeight: 500 }}>
                {template.subject}
              </Typography>

              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Email Content
              </Typography>
              <Card variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Typography
                  variant="body2"
                  sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}
                >
                  {template.content}
                </Typography>
              </Card>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Template Info
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Last Modified</Typography>
                  <Typography variant="body2">{format(new Date(template.updatedAt), 'MMM d, yyyy')}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Times Used</Typography>
                  <Typography variant="body2">{template.usageCount} times</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Variables
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                These placeholders will be replaced with actual data when sending.
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {template.variables?.map((variable: string) => (
                  <Chip
                    key={variable}
                    label={`{{${variable}}}`}
                    size="small"
                    variant="outlined"
                    sx={{ fontFamily: 'monospace' }}
                  />
                ))}
                {(!template.variables || template.variables.length === 0) && (
                  <Typography variant="body2" color="text.secondary">No variables</Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Template</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              fullWidth
              label="Template Name"
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            />
            <TextField
              fullWidth
              label="Subject Line"
              value={editForm.subject}
              onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
            />
            <TextField
              fullWidth
              label="Content"
              multiline
              rows={10}
              value={editForm.content}
              onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
              helperText="Use {{variable_name}} for dynamic content"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveEdit} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Use Template Dialog */}
      <Dialog open={useTemplateDialogOpen} onClose={() => setUseTemplateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Use Template</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            Create a new campaign using the <strong>{template.name}</strong> template?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This will create a new campaign with the template content pre-filled. You can then customize it and select recipients before sending.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUseTemplateDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateCampaign}>Create Campaign</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar open={snackbar.open} autoHideDuration={5000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}
