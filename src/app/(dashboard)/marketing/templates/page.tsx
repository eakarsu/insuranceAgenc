'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  Box, Card, CardContent, Typography, Button, Grid, Chip, IconButton, TextField, InputAdornment,
  Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem, Snackbar, Alert,
  Skeleton,
} from '@mui/material';
import { Add, Search, Email, Edit, Delete, ContentCopy } from '@mui/icons-material';

export default function EmailTemplatesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [templateForm, setTemplateForm] = useState({ name: '', type: 'WELCOME', subject: '', content: '' });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      const response = await axios.get('/api/marketing/templates');
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await axios.post('/api/marketing/templates', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      setSnackbar({ open: true, message: 'Template created successfully', severity: 'success' });
      setDialogOpen(false);
      setTemplateForm({ name: '', type: 'WELCOME', subject: '', content: '' });
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to create template', severity: 'error' });
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async (template: any) => {
      const response = await axios.post('/api/marketing/templates', {
        name: `${template.name} (Copy)`,
        type: template.type,
        subject: template.subject,
        content: template.content,
        status: 'DRAFT',
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      setSnackbar({ open: true, message: 'Template duplicated', severity: 'success' });
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to duplicate template', severity: 'error' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`/api/marketing/templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      setSnackbar({ open: true, message: 'Template deleted', severity: 'success' });
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to delete template', severity: 'error' });
    },
  });

  const filteredTemplates = templates.filter((t: any) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>Email Templates</Typography>
          <Typography color="text.secondary">Create and manage email templates for campaigns</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => setDialogOpen(true)}>Create Template</Button>
      </Box>

      <Card sx={{ mb: 3, p: 2 }}>
        <TextField
          placeholder="Search templates..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
          sx={{ width: 300 }}
        />
      </Card>

      {isLoading ? (
        <Grid container spacing={3}>
          {[1, 2, 3].map((i) => (
            <Grid item xs={12} md={6} lg={4} key={i}>
              <Skeleton variant="rectangular" height={150} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
        </Grid>
      ) : filteredTemplates.length === 0 ? (
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">No templates found. Create your first template!</Typography>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {filteredTemplates.map((template: any) => (
            <Grid item xs={12} md={6} lg={4} key={template.id}>
              <Card
                sx={{ height: '100%', cursor: 'pointer', '&:hover': { boxShadow: 4 } }}
                onClick={() => router.push(`/marketing/templates/${template.id}`)}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Email color="action" />
                      <Typography variant="h6" fontWeight={600}>{template.name}</Typography>
                    </Box>
                    <Chip
                      label={template.status}
                      size="small"
                      color={template.status === 'ACTIVE' ? 'success' : 'default'}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Subject: {template.subject}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                    <Chip label={template.type?.replace(/_/g, ' ')} size="small" color={getTypeColor(template.type) as any} />
                    <Box onClick={(e) => e.stopPropagation()}>
                      <IconButton
                        size="small"
                        onClick={() => duplicateMutation.mutate(template)}
                        disabled={duplicateMutation.isPending}
                      >
                        <ContentCopy fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => router.push(`/marketing/templates/${template.id}`)}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this template?')) {
                            deleteMutation.mutate(template.id);
                          }
                        }}
                        disabled={deleteMutation.isPending}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create Template Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create Email Template</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Template Name"
              value={templateForm.name}
              onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
              fullWidth
              required
            />
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={templateForm.type}
                label="Type"
                onChange={(e) => setTemplateForm({ ...templateForm, type: e.target.value })}
              >
                <MenuItem value="WELCOME">Welcome</MenuItem>
                <MenuItem value="RENEWAL">Renewal</MenuItem>
                <MenuItem value="FOLLOW_UP">Follow Up</MenuItem>
                <MenuItem value="BIRTHDAY">Birthday</MenuItem>
                <MenuItem value="CLAIM">Claim</MenuItem>
                <MenuItem value="CROSS_SELL">Cross-Sell</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Subject"
              value={templateForm.subject}
              onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Content"
              value={templateForm.content}
              onChange={(e) => setTemplateForm({ ...templateForm, content: e.target.value })}
              fullWidth
              multiline
              rows={6}
              placeholder="Use {{variable_name}} for dynamic content..."
              helperText="Variables like {{client_name}}, {{agent_name}} will be automatically detected"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={!templateForm.name || !templateForm.subject || createMutation.isPending}
            onClick={() => createMutation.mutate(templateForm)}
          >
            {createMutation.isPending ? 'Creating...' : 'Create Template'}
          </Button>
        </DialogActions>
      </Dialog>

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
