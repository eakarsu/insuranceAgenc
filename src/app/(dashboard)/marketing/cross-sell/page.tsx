'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  Box, Card, CardContent, Typography, Button, Grid, Avatar, Chip, List, ListItem, ListItemIcon, ListItemText, ListItemSecondaryAction,
  Snackbar, Alert, CircularProgress, Skeleton, Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import { Recommend, Person, Home, DirectionsCar, Umbrella, HealthAndSafety, AutoAwesome, Business, Security, Close } from '@mui/icons-material';

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
      // Refetch recommendations to show new data
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
  const potentialPremium = recommendations.length * 1500; // Estimated average

  return (
    <Box className="animate-fade-in">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>Cross-Sell Opportunities</Typography>
          <Typography color="text.secondary">AI-powered recommendations for additional coverage</Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={generateMutation.isPending ? <CircularProgress size={20} color="inherit" /> : <AutoAwesome />}
          onClick={handleGenerateRecommendations}
          disabled={generateMutation.isPending}
        >
          {generateMutation.isPending ? 'Generating...' : 'Generate Recommendations'}
        </Button>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Recommend sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4" fontWeight={700}>{totalOpportunities}</Typography>
              <Typography color="text.secondary">Opportunities</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" fontWeight={700} color="success.main">
                ${potentialPremium.toLocaleString()}
              </Typography>
              <Typography color="text.secondary">Potential Premium</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" fontWeight={700}>{avgScore}%</Typography>
              <Typography color="text.secondary">Avg. Match Score</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight={600} gutterBottom>Top Recommendations</Typography>
          {isLoading ? (
            <Box>
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} variant="rectangular" height={80} sx={{ mb: 1, borderRadius: 1 }} />
              ))}
            </Box>
          ) : recommendations.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="text.secondary" gutterBottom>
                No recommendations yet. Click "Generate Recommendations" to analyze your clients.
              </Typography>
              <Button
                variant="outlined"
                startIcon={<AutoAwesome />}
                onClick={handleGenerateRecommendations}
                sx={{ mt: 2 }}
              >
                Generate Now
              </Button>
            </Box>
          ) : (
            <List>
              {recommendations.map((rec: any) => (
                <ListItem
                  key={rec.id}
                  onClick={() => handleRowClick(rec)}
                  sx={{
                    cursor: 'pointer',
                    borderRadius: 1,
                    mb: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                    '&:hover': { bgcolor: 'action.hover', borderColor: 'primary.main' },
                  }}
                >
                  <ListItemIcon>
                    <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main' }}>
                      {getProductIcon(rec.recommendedProduct)}
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography fontWeight={600}>
                          {rec.client?.firstName} {rec.client?.lastName}
                        </Typography>
                        <Chip
                          label={`${Math.round(Number(rec.score))}% match`}
                          size="small"
                          color={Number(rec.score) >= 90 ? 'success' : Number(rec.score) >= 70 ? 'warning' : 'default'}
                        />
                        <Chip
                          label={rec.status}
                          size="small"
                          variant="outlined"
                          color={rec.status === 'CONVERTED' ? 'success' : rec.status === 'CONTACTED' ? 'info' : 'default'}
                        />
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography variant="body2">
                          Recommend: <strong>{rec.recommendedProduct}</strong>
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {rec.reasoning}
                        </Typography>
                        {rec.currentPolicies?.length > 0 && (
                          <Box sx={{ mt: 0.5 }}>
                            <Typography variant="caption" color="text.secondary">
                              Current: {rec.currentPolicies.join(', ')}
                            </Typography>
                          </Box>
                        )}
                      </>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={(e) => handleCreateQuote(e, rec)}
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
      <Dialog open={aiDialogOpen} onClose={() => setAiDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'primary.main', color: 'white' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AutoAwesome />
            AI Analysis Complete
          </Box>
          <Button onClick={() => setAiDialogOpen(false)} size="small" sx={{ color: 'white' }}>
            <Close />
          </Button>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {aiResponse && (
            <Box>
              {/* Summary Stats */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={4}>
                  <Card sx={{ textAlign: 'center', bgcolor: 'success.light', color: 'success.dark' }}>
                    <CardContent sx={{ py: 2 }}>
                      <Typography variant="h4" fontWeight={700}>{aiResponse.count}</Typography>
                      <Typography variant="body2">Opportunities Found</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={4}>
                  <Card sx={{ textAlign: 'center', bgcolor: 'info.light', color: 'info.dark' }}>
                    <CardContent sx={{ py: 2 }}>
                      <Typography variant="h4" fontWeight={700}>
                        {aiResponse.recommendations?.length > 0
                          ? Math.round(aiResponse.recommendations.reduce((sum: number, r: any) => sum + Number(r.score), 0) / aiResponse.recommendations.length)
                          : 0}%
                      </Typography>
                      <Typography variant="body2">Avg Match Score</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={4}>
                  <Card sx={{ textAlign: 'center', bgcolor: 'warning.light', color: 'warning.dark' }}>
                    <CardContent sx={{ py: 2 }}>
                      <Typography variant="h4" fontWeight={700}>
                        ${((aiResponse.recommendations?.length || 0) * 1500).toLocaleString()}
                      </Typography>
                      <Typography variant="body2">Est. Premium</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Recommendations List */}
              <Typography variant="h6" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Recommend color="primary" />
                Generated Recommendations
              </Typography>

              {aiResponse.recommendations?.length === 0 ? (
                <Alert severity="warning">No recommendations could be generated. Please ensure you have active clients.</Alert>
              ) : (
                <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                  {aiResponse.recommendations?.map((rec: any, idx: number) => (
                    <Card
                      key={idx}
                      variant="outlined"
                      sx={{
                        mb: 2,
                        transition: 'all 0.2s',
                        '&:hover': { boxShadow: 2, borderColor: 'primary.main' }
                      }}
                    >
                      <CardContent sx={{ pb: '12px !important' }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                          <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
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
                              />
                            </Box>
                            <Chip
                              label={rec.recommendedProduct}
                              size="small"
                              color="primary"
                              sx={{ mb: 1 }}
                            />
                            <Typography variant="body2" color="text.secondary">
                              {rec.reasoning}
                            </Typography>
                            {rec.currentPolicies?.length > 0 && (
                              <Box sx={{ mt: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                <Typography variant="caption" color="text.secondary">Current:</Typography>
                                {rec.currentPolicies.map((policy: string, pIdx: number) => (
                                  <Chip key={pIdx} label={policy} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} />
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
        <DialogActions sx={{ p: 2, bgcolor: 'grey.50' }}>
          <Button onClick={() => setAiDialogOpen(false)} variant="outlined">Close</Button>
          <Button
            variant="contained"
            onClick={() => { setAiDialogOpen(false); }}
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
