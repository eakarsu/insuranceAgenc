'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  Box, Card, CardContent, Typography, Button, Grid, Chip, IconButton, TextField, InputAdornment,
  Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem,
  Snackbar, Alert, Skeleton, Paper, Avatar, Tooltip, Divider,
} from '@mui/material';
import {
  Add, Search, Email, Edit, Delete, ContentCopy, MailOutline, PictureAsPdf, Download,
  Drafts, CheckCircle, Category, Close,
} from '@mui/icons-material';

export default function EmailTemplatesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [templateForm, setTemplateForm] = useState({ name: '', type: 'WELCOME', subject: '', content: '' });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [detailTemplate, setDetailTemplate] = useState<any>(null);

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

  const filteredTemplates = templates.filter((t: any) => {
    if (!search) return true;
    const s = search.toLowerCase();
    const name = (t.name || '').toLowerCase();
    const type = (t.type || '').replace(/_/g, ' ').toLowerCase();
    const subject = (t.subject || '').toLowerCase();
    const status = (t.status || '').toLowerCase();
    const content = (t.content || '').toLowerCase();
    return name.includes(s) || type.includes(s) || subject.includes(s) || status.includes(s) || content.includes(s);
  });

  const stats = useMemo(() => {
    const total = templates.length;
    const active = templates.filter((t: any) => t.status === 'ACTIVE').length;
    const draft = templates.filter((t: any) => t.status === 'DRAFT').length;
    const types = new Set(templates.map((t: any) => t.type)).size;
    return { total, active, draft, types };
  }, [templates]);

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

  const handleExportCSV = () => {
    const csv = [
      ['Name', 'Type', 'Subject', 'Status', 'Created'].join(','),
      ...templates.map((t: any) => [
        `"${t.name}"`, t.type, `"${t.subject || ''}"`, t.status,
        t.createdAt ? new Date(t.createdAt).toLocaleDateString() : '',
      ].join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `email-templates-${new Date().toISOString().split('T')[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <Box className="animate-fade-in">
      {/* Gradient Header */}
      <Paper elevation={0} sx={{
        p: 3, mb: 3, borderRadius: 3,
        background: 'linear-gradient(135deg, #4a148c 0%, #6a1b9a 50%, #9c27b0 100%)',
        color: 'white',
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.15)', width: 52, height: 52 }}>
              <MailOutline sx={{ fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight={700}>Email Templates</Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>Create and manage email templates for campaigns</Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Export as PDF">
              <Button variant="outlined" size="small" startIcon={<PictureAsPdf />}
                onClick={() => window.open('/api/export/pdf?type=templates', '_blank')}
                sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}>
                PDF
              </Button>
            </Tooltip>
            <Tooltip title="Export as CSV">
              <Button variant="outlined" size="small" startIcon={<Download />}
                onClick={handleExportCSV}
                sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}>
                CSV
              </Button>
            </Tooltip>
            <Button variant="contained" startIcon={<Add />} onClick={() => setDialogOpen(true)}
              sx={{ bgcolor: 'white', color: '#6a1b9a', fontWeight: 600, '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' } }}>
              Create Template
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Stats Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Total Templates', value: stats.total, icon: <MailOutline />, color: '#6a1b9a', bg: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)' },
          { label: 'Active', value: stats.active, icon: <CheckCircle />, color: '#2e7d32', bg: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)' },
          { label: 'Drafts', value: stats.draft, icon: <Drafts />, color: '#1976d2', bg: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)' },
          { label: 'Template Types', value: stats.types, icon: <Category />, color: '#e65100', bg: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)' },
        ].map((stat) => (
          <Grid item xs={6} sm={3} key={stat.label}>
            <Paper elevation={0} sx={{
              p: 2.5, borderRadius: 2.5, background: stat.bg, border: '1px solid', borderColor: 'divider',
              transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-2px)' },
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.68rem' }}>
                    {stat.label}
                  </Typography>
                  <Typography variant="h4" fontWeight={700} sx={{ color: stat.color, mt: 0.5 }}>
                    {stat.value}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: `${stat.color}20`, color: stat.color, width: 42, height: 42 }}>
                  {stat.icon}
                </Avatar>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Search Bar */}
      <Card sx={{ mb: 3, borderRadius: 2.5, overflow: 'visible' }}>
        <CardContent sx={{ py: 2, px: 2.5, '&:last-child': { pb: 2 } }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search by name, type, subject, status, content..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ color: 'text.secondary' }} /></InputAdornment> }}
            sx={{ maxWidth: 400, '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'grey.50' } }}
          />
        </CardContent>
      </Card>

      {/* Template Cards Grid */}
      {isLoading ? (
        <Grid container spacing={3}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Grid item xs={12} md={6} lg={4} key={i}>
              <Skeleton variant="rectangular" height={180} sx={{ borderRadius: 2.5 }} />
            </Grid>
          ))}
        </Grid>
      ) : filteredTemplates.length === 0 ? (
        <Card sx={{ p: 6, textAlign: 'center', borderRadius: 2.5 }}>
          <Avatar sx={{ bgcolor: 'rgba(106,27,154,0.1)', color: '#6a1b9a', width: 64, height: 64, mx: 'auto', mb: 2 }}>
            <MailOutline sx={{ fontSize: 32 }} />
          </Avatar>
          <Typography variant="h6" fontWeight={600} gutterBottom>No templates found</Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>Create your first email template to get started!</Typography>
          <Button variant="contained" startIcon={<Add />} onClick={() => setDialogOpen(true)}
            sx={{ bgcolor: '#6a1b9a', '&:hover': { bgcolor: '#4a148c' }, borderRadius: 2 }}>
            Create Template
          </Button>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {filteredTemplates.map((template: any) => (
            <Grid item xs={12} md={6} lg={4} key={template.id}>
              <Card
                sx={{
                  height: '100%',
                  cursor: 'pointer',
                  borderRadius: 2.5,
                  border: '1px solid',
                  borderColor: 'divider',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    boxShadow: '0 8px 25px rgba(106,27,154,0.15)',
                    borderColor: '#9c27b0',
                    transform: 'translateY(-2px)',
                  },
                }}
                onClick={() => setDetailTemplate(template)}
              >
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ bgcolor: 'rgba(106,27,154,0.1)', color: '#6a1b9a', width: 40, height: 40 }}>
                        <Email sx={{ fontSize: 20 }} />
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={600} sx={{ lineHeight: 1.3 }}>{template.name}</Typography>
                      </Box>
                    </Box>
                    <Chip
                      label={template.status}
                      size="small"
                      color={template.status === 'ACTIVE' ? 'success' : 'default'}
                      sx={{ fontWeight: 600, borderRadius: '6px', fontSize: '0.7rem' }}
                    />
                  </Box>

                  <Paper variant="outlined" sx={{ p: 1.5, mb: 2, borderRadius: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.65rem' }}>
                      Subject
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {template.subject || '-'}
                    </Typography>
                  </Paper>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Chip
                      label={template.type?.replace(/_/g, ' ')}
                      size="small"
                      color={getTypeColor(template.type) as any}
                      sx={{ fontWeight: 500, borderRadius: '6px', fontSize: '0.72rem' }}
                    />
                    <Box onClick={(e) => e.stopPropagation()}>
                      <Tooltip title="Duplicate">
                        <IconButton
                          size="small"
                          onClick={() => duplicateMutation.mutate(template)}
                          disabled={duplicateMutation.isPending}
                          sx={{ opacity: 0.6, '&:hover': { opacity: 1, color: '#6a1b9a' } }}
                        >
                          <ContentCopy fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => router.push(`/marketing/templates/${template.id}`)}
                          sx={{ opacity: 0.6, '&:hover': { opacity: 1, color: '#6a1b9a' } }}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this template?')) {
                              deleteMutation.mutate(template.id);
                            }
                          }}
                          disabled={deleteMutation.isPending}
                          sx={{ opacity: 0.6, '&:hover': { opacity: 1, color: 'error.main' } }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Template Detail Dialog */}
      <Dialog open={!!detailTemplate} onClose={() => setDetailTemplate(null)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}>
        <Box sx={{
          p: 3,
          background: 'linear-gradient(135deg, #4a148c 0%, #6a1b9a 50%, #9c27b0 100%)',
          color: 'white',
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.15)', width: 52, height: 52 }}>
                <MailOutline sx={{ fontSize: 28 }} />
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight={700}>{detailTemplate?.name || 'Template Details'}</Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                  <Chip
                    label={detailTemplate?.type?.replace(/_/g, ' ')}
                    size="small"
                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600, borderRadius: '6px', fontSize: '0.72rem' }}
                  />
                  <Chip
                    label={detailTemplate?.status}
                    size="small"
                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600, borderRadius: '6px', fontSize: '0.72rem' }}
                  />
                </Box>
              </Box>
            </Box>
            <IconButton onClick={() => setDetailTemplate(null)} sx={{ color: 'white' }}>
              <Close />
            </IconButton>
          </Box>
        </Box>
        <DialogContent dividers>
          <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 1 }}>Template Information</Typography>
          <Paper variant="outlined" sx={{ p: 2.5, mb: 2.5, mt: 1, borderRadius: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>Name</Typography>
                <Typography variant="body2" fontWeight={600}>{detailTemplate?.name || '-'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>Type</Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip
                    label={detailTemplate?.type?.replace(/_/g, ' ')}
                    size="small"
                    color={getTypeColor(detailTemplate?.type) as any}
                    sx={{ fontWeight: 600, borderRadius: '6px' }}
                  />
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>Subject</Typography>
                <Typography variant="body2" fontWeight={600}>{detailTemplate?.subject || '-'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>Status</Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip
                    label={detailTemplate?.status}
                    size="small"
                    color={detailTemplate?.status === 'ACTIVE' ? 'success' : 'default'}
                    sx={{ fontWeight: 600, borderRadius: '6px' }}
                  />
                </Box>
              </Grid>
            </Grid>
          </Paper>

          <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 1 }}>Content Preview</Typography>
          <Paper variant="outlined" sx={{ p: 2.5, mt: 1, borderRadius: 2, bgcolor: 'grey.50' }}>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', color: 'text.secondary', maxHeight: 200, overflow: 'auto' }}>
              {detailTemplate?.content || 'No content available'}
            </Typography>
          </Paper>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
          <Button
            color="error"
            startIcon={<Delete />}
            onClick={() => {
              if (confirm('Are you sure you want to delete this template?')) {
                deleteMutation.mutate(detailTemplate?.id);
                setDetailTemplate(null);
              }
            }}
            sx={{ borderRadius: 2 }}
          >
            Delete
          </Button>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button onClick={() => setDetailTemplate(null)} sx={{ borderRadius: 2 }}>Close</Button>
            <Button
              variant="contained"
              startIcon={<Edit />}
              onClick={() => {
                router.push(`/marketing/templates/${detailTemplate?.id}`);
              }}
              sx={{ borderRadius: 2, bgcolor: '#6a1b9a', '&:hover': { bgcolor: '#4a148c' } }}
            >
              Edit Template
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* Create Template Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ width: 48, height: 48, bgcolor: '#6a1b9a' }}>
                <MailOutline />
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight={600}>Create Email Template</Typography>
                <Typography variant="body2" color="text.secondary">Design a new template for your campaigns</Typography>
              </Box>
            </Box>
            <IconButton onClick={() => setDialogOpen(false)} size="small"><Close /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 1 }}>Template Details</Typography>
          <Paper variant="outlined" sx={{ p: 2.5, mb: 2.5, mt: 1, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Template Name"
                value={templateForm.name}
                onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                fullWidth
                required
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={templateForm.type}
                  label="Type"
                  onChange={(e) => setTemplateForm({ ...templateForm, type: e.target.value })}
                  sx={{ borderRadius: 2 }}
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
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Box>
          </Paper>

          <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 1 }}>Content</Typography>
          <Paper variant="outlined" sx={{ p: 2.5, mt: 1, borderRadius: 2 }}>
            <TextField
              label="Content"
              value={templateForm.content}
              onChange={(e) => setTemplateForm({ ...templateForm, content: e.target.value })}
              fullWidth
              multiline
              rows={6}
              placeholder="Use {{variable_name}} for dynamic content..."
              helperText="Variables like {{client_name}}, {{agent_name}} will be automatically detected"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Paper>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button
            variant="contained"
            disabled={!templateForm.name || !templateForm.subject || createMutation.isPending}
            onClick={() => createMutation.mutate(templateForm)}
            sx={{ borderRadius: 2, bgcolor: '#6a1b9a', '&:hover': { bgcolor: '#4a148c' } }}
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
