'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  Box, Card, CardContent, Typography, Button, Grid, Avatar, Chip, List, ListItem, ListItemIcon, ListItemText, ListItemSecondaryAction,
  Snackbar, Alert, CircularProgress, Skeleton, Dialog, DialogTitle, DialogContent, DialogActions,
  Paper, Tooltip, IconButton, TextField, InputAdornment,
} from '@mui/material';
import {
  Recommend, Person, Home, DirectionsCar, Umbrella, HealthAndSafety, AutoAwesome, Business, Security, Close,
  TrendingUp, PictureAsPdf, Download, MonetizationOn, Speed, Search,
} from '@mui/icons-material';

const getProductIcon = (product: string) => {
  const lower = product.toLowerCase();
  if (lower.includes('auto')) return <DirectionsCar />;
  if (lower.includes('home') || lower.includes('renters')) return <Home />;
  if (lower.includes('umbrella')) return <Umbrella />;
  if (lower.includes('life') || lower.includes('health') || lower.includes('disability')) return <HealthAndSafety />;
  if (lower.includes('commercial') || lower.includes('business') || lower.includes('liability')) return <Business />;
  return <Security />;
};

export default function CrossSellPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiResponse, setAiResponse] = useState<any>(null);

  const { data: recommendations = [], isLoading, refetch } = useQuery({
    queryKey: ['cross-sell-recommendations'],
    queryFn: async () => {
      const response = await axios.get('/api/marketing/cross-sell');
      return response.data;
    },
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.post('/api/marketing/cross-sell');
      return response.data;
    },
    onSuccess: (data) => {
      setAiResponse(data);
      setAiDialogOpen(true);
      refetch();
      setSnackbar({
        open: true,
        message: `Generated ${data.count} recommendations successfully!`,
        severity: 'success',
      });
    },
    onError: (error: any) => {
      setSnackbar({
        open: true,
        message: error.response?.data?.error || 'Failed to generate recommendations',
        severity: 'error',
      });
    },
  });

  const handleGenerateRecommendations = () => {
    generateMutation.mutate();
  };

  const handleRowClick = (recommendation: any) => {
    router.push(`/marketing/cross-sell/${recommendation.id}`);
  };

  const handleCreateQuote = (e: React.MouseEvent, recommendation: any) => {
    e.stopPropagation();
    router.push(`/quotes/new?clientId=${recommendation.clientId}&lob=${encodeURIComponent(recommendation.recommendedProduct)}`);
  };

  // Calculate stats
  const totalOpportunities = recommendations.length;
  const avgScore = recommendations.length > 0
    ? Math.round(recommendations.reduce((sum: number, r: any) => sum + Number(r.score), 0) / recommendations.length)
    : 0;
  const potentialPremium = recommendations.length * 1500;
  const highScoreCount = recommendations.filter((r: any) => Number(r.score) >= 80).length;

  const filteredRecommendations = recommendations.filter((rec: any) => {
    if (!search) return true;
    const s = search.toLowerCase();
    const clientName = rec.client ? `${rec.client.firstName} ${rec.client.lastName}`.toLowerCase() : '';
    const product = (rec.recommendedProduct || '').toLowerCase();
    const reasoning = (rec.reasoning || '').toLowerCase();
    const status = (rec.status || '').toLowerCase();
    const score = String(Math.round(Number(rec.score)));
    const currentPolicies = (rec.currentPolicies || []).join(' ').toLowerCase();
    return clientName.includes(s) || product.includes(s) || reasoning.includes(s) || status.includes(s) || score.includes(s) || currentPolicies.includes(s);
  });

  const handleExportCSV = () => {
    const csv = [
      ['Client', 'Recommended Product', 'Score', 'Status', 'Reasoning', 'Current Policies'].join(','),
      ...recommendations.map((r: any) => [
        `"${r.client ? `${r.client.firstName} ${r.client.lastName}` : '-'}"`,
        `"${r.recommendedProduct}"`,
        Math.round(Number(r.score)),
        r.status || '',
        `"${(r.reasoning || '').replace(/"/g, '""')}"`,
        `"${(r.currentPolicies || []).join(', ')}"`,
      ].join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `cross-sell-${new Date().toISOString().split('T')[0]}.csv`;
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
              <TrendingUp sx={{ fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight={700}>Cross-Sell Opportunities</Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>AI-powered recommendations for additional coverage</Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Export as PDF">
              <Button variant="outlined" size="small" startIcon={<PictureAsPdf />}
                onClick={() => window.open('/api/export/pdf?type=cross-sell', '_blank')}
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
            <Button
              variant="contained"
              startIcon={generateMutation.isPending ? <CircularProgress size={20} color="inherit" /> : <AutoAwesome />}
              onClick={handleGenerateRecommendations}
              disabled={generateMutation.isPending}
              sx={{ bgcolor: 'white', color: '#6a1b9a', fontWeight: 600, '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' } }}
            >
              {generateMutation.isPending ? 'Generating...' : 'Generate Recommendations'}
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Stats Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Opportunities', value: totalOpportunities, icon: <Recommend />, color: '#6a1b9a', bg: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)' },
          { label: 'Potential Premium', value: `$${potentialPremium.toLocaleString()}`, icon: <MonetizationOn />, color: '#2e7d32', bg: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)' },
          { label: 'Avg. Match Score', value: `${avgScore}%`, icon: <Speed />, color: '#1976d2', bg: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)' },
          { label: 'High Score (80%+)', value: highScoreCount, icon: <TrendingUp />, color: '#e65100', bg: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)' },
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
      <Card sx={{ mb: 2, borderRadius: 2.5, overflow: 'visible' }}>
        <CardContent sx={{ py: 2, px: 2.5, '&:last-child': { pb: 2 } }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search by client name, product, reasoning, status..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ color: 'text.secondary' }} /></InputAdornment> }}
            sx={{ maxWidth: 500, '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'grey.50' } }}
          />
        </CardContent>
      </Card>

      {/* Recommendations List */}
      <Card sx={{ borderRadius: 2.5, overflow: 'hidden' }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Recommend sx={{ color: '#6a1b9a' }} />
            Top Recommendations
          </Typography>
          {isLoading ? (
            <Box>
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} variant="rectangular" height={90} sx={{ mb: 1.5, borderRadius: 2 }} />
              ))}
            </Box>
          ) : filteredRecommendations.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Avatar sx={{ bgcolor: 'rgba(106,27,154,0.1)', color: '#6a1b9a', width: 64, height: 64, mx: 'auto', mb: 2 }}>
                <AutoAwesome sx={{ fontSize: 32 }} />
              </Avatar>
              <Typography variant="h6" fontWeight={600} gutterBottom>No recommendations yet</Typography>
              <Typography color="text.secondary" gutterBottom>
                Click &ldquo;Generate Recommendations&rdquo; to analyze your clients.
              </Typography>
              <Button
                variant="contained"
                startIcon={<AutoAwesome />}
                onClick={handleGenerateRecommendations}
                sx={{ mt: 2, bgcolor: '#6a1b9a', '&:hover': { bgcolor: '#4a148c' }, borderRadius: 2 }}
              >
                Generate Now
              </Button>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {filteredRecommendations.map((rec: any) => (
                <ListItem
                  key={rec.id}
                  onClick={() => handleRowClick(rec)}
                  sx={{
                    cursor: 'pointer',
                    borderRadius: 2.5,
                    mb: 1.5,
                    border: '1px solid',
                    borderColor: 'divider',
                    p: 2,
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      bgcolor: 'rgba(106,27,154,0.03)',
                      borderColor: '#9c27b0',
                      boxShadow: '0 4px 15px rgba(106,27,154,0.1)',
                      transform: 'translateY(-1px)',
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 56 }}>
                    <Avatar sx={{ bgcolor: 'rgba(106,27,154,0.1)', color: '#6a1b9a', width: 44, height: 44 }}>
                      {getProductIcon(rec.recommendedProduct)}
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography fontWeight={600} sx={{ fontSize: '0.95rem' }}>
                          {rec.client?.firstName} {rec.client?.lastName}
                        </Typography>
                        <Chip
                          label={`${Math.round(Number(rec.score))}% match`}
                          size="small"
                          color={Number(rec.score) >= 90 ? 'success' : Number(rec.score) >= 70 ? 'warning' : 'default'}
                          sx={{ fontWeight: 600, borderRadius: '6px', fontSize: '0.72rem' }}
                        />
                        <Chip
                          label={rec.status?.charAt(0) + (rec.status?.slice(1).toLowerCase() || '')}
                          size="small"
                          variant="outlined"
                          color={rec.status === 'CONVERTED' ? 'success' : rec.status === 'CONTACTED' ? 'info' : 'default'}
                          sx={{ borderRadius: '6px', fontSize: '0.72rem' }}
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                          <Typography variant="body2" component="span">
                            Recommend:
                          </Typography>
                          <Chip label={rec.recommendedProduct} size="small" color="primary"
                            sx={{ height: 22, fontSize: '0.72rem', fontWeight: 500, bgcolor: 'rgba(106,27,154,0.1)', color: '#6a1b9a', borderRadius: '6px' }} />
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.4 }}>
                          {rec.reasoning}
                        </Typography>
                        {rec.currentPolicies?.length > 0 && (
                          <Box sx={{ mt: 0.5, display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center' }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                              Current:
                            </Typography>
                            {rec.currentPolicies.map((policy: string, pIdx: number) => (
                              <Chip key={pIdx} label={policy} size="small" variant="outlined"
                                sx={{ height: 20, fontSize: '0.65rem', borderRadius: '4px' }} />
                            ))}
                          </Box>
                        )}
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={(e) => handleCreateQuote(e, rec)}
                      sx={{ borderRadius: 2, borderColor: '#6a1b9a', color: '#6a1b9a', fontWeight: 500, '&:hover': { bgcolor: 'rgba(106,27,154,0.05)', borderColor: '#4a148c' } }}
                    >
                      Create Quote
                    </Button>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* AI Response Dialog */}
      <Dialog open={aiDialogOpen} onClose={() => setAiDialogOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ pb: 1, background: 'linear-gradient(135deg, #4a148c 0%, #6a1b9a 50%, #9c27b0 100%)', color: 'white' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.15)', width: 48, height: 48 }}>
                <AutoAwesome />
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight={600}>AI Analysis Complete</Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>Cross-sell opportunities identified</Typography>
              </Box>
            </Box>
            <IconButton onClick={() => setAiDialogOpen(false)} size="small" sx={{ color: 'white' }}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {aiResponse && (
            <Box>
              {/* Summary Stats */}
              <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 1 }}>Summary</Typography>
              <Grid container spacing={2} sx={{ mb: 3, mt: 0.5 }}>
                <Grid item xs={4}>
                  <Paper elevation={0} sx={{ textAlign: 'center', p: 2, borderRadius: 2, background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)', border: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="h4" fontWeight={700} color="#2e7d32">{aiResponse.count}</Typography>
                    <Typography variant="body2" color="text.secondary">Opportunities Found</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={4}>
                  <Paper elevation={0} sx={{ textAlign: 'center', p: 2, borderRadius: 2, background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)', border: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="h4" fontWeight={700} color="#1976d2">
                      {aiResponse.recommendations?.length > 0
                        ? Math.round(aiResponse.recommendations.reduce((sum: number, r: any) => sum + Number(r.score), 0) / aiResponse.recommendations.length)
                        : 0}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">Avg Match Score</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={4}>
                  <Paper elevation={0} sx={{ textAlign: 'center', p: 2, borderRadius: 2, background: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)', border: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="h4" fontWeight={700} color="#e65100">
                      ${((aiResponse.recommendations?.length || 0) * 1500).toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">Est. Premium</Typography>
                  </Paper>
                </Grid>
              </Grid>

              {/* Recommendations List */}
              <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Recommend sx={{ fontSize: 16, color: '#6a1b9a' }} />
                Generated Recommendations
              </Typography>

              {aiResponse.recommendations?.length === 0 ? (
                <Alert severity="warning" sx={{ mt: 1, borderRadius: 2 }}>No recommendations could be generated. Please ensure you have active clients.</Alert>
              ) : (
                <Box sx={{ maxHeight: 400, overflow: 'auto', mt: 1 }}>
                  {aiResponse.recommendations?.map((rec: any, idx: number) => (
                    <Card
                      key={idx}
                      variant="outlined"
                      sx={{
                        mb: 2,
                        borderRadius: 2,
                        transition: 'all 0.2s',
                        '&:hover': { boxShadow: '0 4px 15px rgba(106,27,154,0.1)', borderColor: '#9c27b0' }
                      }}
                    >
                      <CardContent sx={{ pb: '12px !important' }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                          <Avatar sx={{ bgcolor: 'rgba(106,27,154,0.1)', color: '#6a1b9a', width: 48, height: 48 }}>
                            {getProductIcon(rec.recommendedProduct)}
                          </Avatar>
                          <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                              <Typography variant="subtitle1" fontWeight={600}>
                                {rec.client?.firstName} {rec.client?.lastName}
                              </Typography>
                              <Chip
                                label={`${Math.round(Number(rec.score))}% Match`}
                                size="small"
                                color={Number(rec.score) >= 90 ? 'success' : Number(rec.score) >= 70 ? 'warning' : 'default'}
                                sx={{ fontWeight: 600, borderRadius: '6px' }}
                              />
                            </Box>
                            <Chip
                              label={rec.recommendedProduct}
                              size="small"
                              sx={{ mb: 1, bgcolor: 'rgba(106,27,154,0.1)', color: '#6a1b9a', fontWeight: 500, borderRadius: '6px' }}
                            />
                            <Typography variant="body2" color="text.secondary">
                              {rec.reasoning}
                            </Typography>
                            {rec.currentPolicies?.length > 0 && (
                              <Box sx={{ mt: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>Current:</Typography>
                                {rec.currentPolicies.map((policy: string, pIdx: number) => (
                                  <Chip key={pIdx} label={policy} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem', borderRadius: '4px' }} />
                                ))}
                              </Box>
                            )}
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, bgcolor: 'grey.50', borderTop: '1px solid', borderColor: 'divider' }}>
          <Button onClick={() => setAiDialogOpen(false)} variant="outlined" sx={{ borderRadius: 2 }}>Close</Button>
          <Button
            variant="contained"
            onClick={() => { setAiDialogOpen(false); }}
            sx={{ borderRadius: 2, bgcolor: '#6a1b9a', '&:hover': { bgcolor: '#4a148c' } }}
          >
            View All Opportunities
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
