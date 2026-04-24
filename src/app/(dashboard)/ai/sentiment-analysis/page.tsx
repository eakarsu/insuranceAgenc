'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import {
  Box, Card, CardContent, Typography, Grid, TextField, Button, FormControl, InputLabel, Select, MenuItem,
  CircularProgress, Alert, Paper, Chip, LinearProgress, Avatar,
} from '@mui/material';
import { SentimentSatisfied, Send, Warning, TipsAndUpdates, SentimentVeryDissatisfied, SentimentNeutral, AutoFixHigh } from '@mui/icons-material';
import AIResponseFormatter from '@/components/ai/AIResponseFormatter';
import { safeText } from '@/lib/ai-render-utils';

const communicationTypes = ['Email', 'Phone Note', 'Chat', 'Complaint'];

export default function SentimentAnalysisPage() {
  const [text, setText] = useState('');
  const [commType, setCommType] = useState('Email');
  const [result, setResult] = useState<any>(null);

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.post('/api/ai', {
        type: 'sentiment_analysis',
        prompt: `Analyze the sentiment and emotional tone of this ${commType.toLowerCase()} from an insurance client.`,
        context: { text, communicationType: commType },
      });
      return response.data.result;
    },
    onSuccess: (data) => setResult(data),
  });

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return <SentimentSatisfied sx={{ fontSize: 48 }} />;
      case 'negative': return <SentimentVeryDissatisfied sx={{ fontSize: 48 }} />;
      default: return <SentimentNeutral sx={{ fontSize: 48 }} />;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'success';
      case 'negative': return 'error';
      default: return 'warning';
    }
  };

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case 'critical': return 'error';
      case 'high': return 'error';
      case 'medium': return 'warning';
      default: return 'success';
    }
  };

  return (
    <Box className="animate-fade-in">
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <SentimentSatisfied sx={{ fontSize: 32, color: 'info.main' }} />
        <Box>
          <Typography variant="h4" fontWeight={700}>Sentiment Analysis</Typography>
          <Typography color="text.secondary">Analyze the emotional tone of client communications</Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>Input Text</Typography>

              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Communication Type</InputLabel>
                <Select value={commType} label="Communication Type" onChange={(e) => setCommType(e.target.value)}>
                  {communicationTypes.map((type) => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                multiline
                rows={10}
                label="Paste communication text"
                placeholder="Paste the email, chat message, phone note, or complaint text here..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                sx={{ mb: 3 }}
              />

              {/* Sample Test Data */}
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 3, bgcolor: 'grey.50', border: '1px dashed', borderColor: 'grey.300' }}>
                <Typography variant="caption" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary', mb: 1 }}>
                  <AutoFixHigh fontSize="small" /> SAMPLE TEST DATA
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  <Chip label="Angry Complaint" size="small" variant="outlined" color="primary" sx={{ cursor: 'pointer' }}
                    onClick={() => {
                      setCommType('Complaint');
                      setText('I am extremely frustrated with the handling of my claim #CLM-2024-0089. It has been over 3 weeks since I filed and I have not received ANY updates. Every time I call, I get transferred to a different person who has no idea about my case. This is completely unacceptable. I have been a loyal customer for 15 years paying my premiums on time and this is how I am treated? If this is not resolved by Friday, I will be taking my business elsewhere and filing a complaint with the state insurance commissioner.');
                    }} />
                  <Chip label="Happy Renewal" size="small" variant="outlined" color="primary" sx={{ cursor: 'pointer' }}
                    onClick={() => {
                      setCommType('Email');
                      setText('Dear Sarah, I just wanted to take a moment to thank you for your help with my policy renewal. The new rate is very competitive and I appreciate you finding those additional discounts. The whole process was smooth and easy. I have already recommended your agency to my neighbor who is looking for homeowners insurance. Thank you for always taking great care of us! Best regards, Patricia Williams');
                    }} />
                  <Chip label="Confused Client" size="small" variant="outlined" color="primary" sx={{ cursor: 'pointer' }}
                    onClick={() => {
                      setCommType('Phone Note');
                      setText('Client called asking about her auto policy coverage. She was confused about whether her policy covers rental car while her vehicle is being repaired after an accident. She also asked about her deductible amount and whether it applies to windshield replacement. Client seemed anxious about the costs. I explained the rental coverage and glass coverage details. She calmed down after understanding her benefits. Follow-up needed to send policy summary via email.');
                    }} />
                </Box>
              </Paper>

              <Button
                fullWidth
                variant="contained"
                size="large"
                color="info"
                startIcon={analyzeMutation.isPending ? <CircularProgress size={20} color="inherit" /> : <Send />}
                onClick={() => analyzeMutation.mutate()}
                disabled={!text.trim() || analyzeMutation.isPending}
              >
                {analyzeMutation.isPending ? 'Analyzing...' : 'Analyze Sentiment'}
              </Button>

              {analyzeMutation.isError && (
                <Alert severity="error" sx={{ mt: 2 }}>Failed to analyze sentiment.</Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>Analysis Results</Typography>

              {!result && !analyzeMutation.isPending && (
                <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
                  <SentimentNeutral sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                  <Typography>Paste client communication text to analyze sentiment</Typography>
                </Box>
              )}

              {analyzeMutation.isPending && (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <CircularProgress size={48} />
                  <Typography sx={{ mt: 2 }}>AI is analyzing sentiment and emotional tone...</Typography>
                </Box>
              )}

              {result && (
                <Box>
                  {/* Sentiment Gauge */}
                  {result.overallSentiment && (
                    <Paper
                      elevation={0}
                      sx={{
                        p: 3, mb: 3, borderRadius: 2,
                        background: result.overallSentiment === 'positive'
                          ? 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)'
                          : result.overallSentiment === 'negative'
                          ? 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)'
                          : 'linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%)',
                        border: '1px solid',
                        borderColor: `${getSentimentColor(result.overallSentiment)}.light`,
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Avatar
                          sx={{
                            width: 80, height: 80,
                            bgcolor: `${getSentimentColor(result.overallSentiment)}.main`,
                            color: 'white',
                          }}
                        >
                          {getSentimentIcon(result.overallSentiment)}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" fontWeight={600} sx={{ textTransform: 'capitalize' }}>
                            {result.overallSentiment} Sentiment
                          </Typography>
                          {result.score !== undefined && (
                            <>
                              <LinearProgress
                                variant="determinate"
                                value={((result.score + 1) / 2) * 100}
                                color={getSentimentColor(result.overallSentiment) as any}
                                sx={{ height: 12, borderRadius: 6, mb: 1, mt: 1 }}
                              />
                              <Typography variant="body2" color="text.secondary">
                                Score: {result.score.toFixed(2)} (range: -1 to 1)
                              </Typography>
                            </>
                          )}
                        </Box>
                      </Box>
                    </Paper>
                  )}

                  {/* Urgency Level */}
                  {result.urgencyLevel && (
                    <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Warning color={getUrgencyColor(result.urgencyLevel) as any} />
                      <Typography variant="subtitle2">Urgency:</Typography>
                      <Chip label={safeText(result.urgencyLevel).toUpperCase()} size="small" color={getUrgencyColor(safeText(result.urgencyLevel)) as any} />
                    </Box>
                  )}

                  {/* Emotions */}
                  {result.emotions && result.emotions.length > 0 && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle1" fontWeight={600} gutterBottom>Detected Emotions</Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {result.emotions.map((em: any, i: number) => (
                          <Chip
                            key={i}
                            label={`${safeText(em.emotion)} (${safeText(em.intensity)})`}
                            color={safeText(em.intensity) === 'high' ? 'error' : safeText(em.intensity) === 'medium' ? 'warning' : 'default'}
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    </Box>
                  )}

                  {/* Key Phrases */}
                  {result.keyPhrases && result.keyPhrases.length > 0 && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle1" fontWeight={600} gutterBottom>Key Phrases</Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {result.keyPhrases.map((phrase: any, i: number) => (
                          <Chip key={i} label={safeText(phrase, 'phrase', 'text')} size="small" variant="outlined" color="info" />
                        ))}
                      </Box>
                    </Box>
                  )}

                  {/* Suggested Response */}
                  {result.suggestedResponse && (
                    <Paper
                      elevation={0}
                      sx={{ p: 2, borderRadius: 2, bgcolor: 'success.50', border: '1px solid', borderColor: 'success.light' }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <TipsAndUpdates color="success" fontSize="small" />
                        <Typography variant="subtitle2" fontWeight={600}>Suggested Response Strategy</Typography>
                      </Box>
                      {typeof result.suggestedResponse === 'string' ? (
                        <Typography variant="body2">{result.suggestedResponse}</Typography>
                      ) : (
                        <Box>
                          {result.suggestedResponse.strategy && (
                            <Typography variant="body2" sx={{ mb: 0.5 }}><strong>Strategy:</strong> {safeText(result.suggestedResponse.strategy)}</Typography>
                          )}
                          {result.suggestedResponse.tone && (
                            <Typography variant="body2" sx={{ mb: 0.5 }}><strong>Tone:</strong> {safeText(result.suggestedResponse.tone)}</Typography>
                          )}
                          {result.suggestedResponse.keyPoints && Array.isArray(result.suggestedResponse.keyPoints) && (
                            <Box sx={{ mb: 0.5 }}>
                              <Typography variant="body2" fontWeight={600}>Key Points:</Typography>
                              <ul style={{ margin: '4px 0', paddingLeft: 20 }}>
                                {result.suggestedResponse.keyPoints.map((point: any, idx: number) => (
                                  <li key={idx}><Typography variant="body2">{safeText(point)}</Typography></li>
                                ))}
                              </ul>
                            </Box>
                          )}
                          {result.suggestedResponse.timeline && (
                            <Typography variant="body2"><strong>Timeline:</strong> {safeText(result.suggestedResponse.timeline)}</Typography>
                          )}
                        </Box>
                      )}
                    </Paper>
                  )}

                  {result.text && (
                    <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, mt: 2 }}>
                      <AIResponseFormatter text={result.text} />
                    </Paper>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
