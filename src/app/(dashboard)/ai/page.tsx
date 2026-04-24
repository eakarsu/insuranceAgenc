'use client';

import { useRouter } from 'next/navigation';
import { Box, Card, CardContent, Typography, Grid, Avatar, Button, Paper, Chip, Tooltip } from '@mui/material';
import {
  AutoAwesome, Security, SupportAgent, Analytics, Mic, DocumentScanner,
  Recommend, Assessment, ArrowForward, Psychology, Email, Search,
  PersonSearch, Summarize, CompareArrows, SmartToy, SentimentSatisfied,
  TrendingUp, Extension, GavelRounded,
} from '@mui/icons-material';

const aiFeatures = [
  { title: 'AI Quote Generator', description: 'Generate instant multi-carrier quotes using AI to analyze risk factors and match with best carriers.', icon: <AutoAwesome />, color: '#1565c0', bg: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)', path: '/ai/quote-generator' },
  { title: 'Coverage Analyzer', description: 'Identify coverage gaps and recommend additional protection based on client profiles.', icon: <Security />, color: '#2e7d32', bg: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)', path: '/ai/coverage-analyzer' },
  { title: 'Claims Assistant', description: 'AI-powered first notice of loss processing with automated claim categorization.', icon: <SupportAgent />, color: '#e65100', bg: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)', path: '/ai/claims-assistant' },
  { title: 'Renewal Predictor', description: 'Predict retention risk and get personalized strategies to improve renewal rates.', icon: <Analytics />, color: '#0288d1', bg: 'linear-gradient(135deg, #e1f5fe 0%, #b3e5fc 100%)', path: '/ai/renewal-predictor' },
  { title: 'Cross-Sell Recommender', description: 'AI recommendations for additional policies based on client life events and needs.', icon: <Recommend />, color: '#7b1fa2', bg: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)', path: '/ai/cross-sell' },
  { title: 'Voice Receptionist', description: 'AI-powered phone handling for after-hours calls and basic inquiries.', icon: <Mic />, color: '#c62828', bg: 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)', path: '/ai/voice-receptionist' },
  { title: 'Document Processor', description: 'Extract policy data from documents using OCR and AI analysis.', icon: <DocumentScanner />, color: '#1565c0', bg: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)', path: '/ai/document-processor' },
  { title: 'Risk Assessor', description: 'Evaluate risk factors for underwriting decisions with AI-powered analysis.', icon: <Assessment />, color: '#e65100', bg: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)', path: '/ai/risk-assessor' },
  { title: 'Email Composer', description: 'Draft professional insurance emails for renewals, welcome letters, claim updates, and more.', icon: <Email />, color: '#1565c0', bg: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)', path: '/ai/email-composer' },
  { title: 'Smart Search', description: 'Search your data using natural language queries powered by AI interpretation.', icon: <Search />, color: '#0288d1', bg: 'linear-gradient(135deg, #e1f5fe 0%, #b3e5fc 100%)', path: '/ai/smart-search' },
  { title: 'Client Summary', description: 'Generate comprehensive AI-powered client profiles with risk analysis and recommendations.', icon: <PersonSearch />, color: '#7b1fa2', bg: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)', path: '/ai/client-summary' },
  { title: 'Claim Summarizer', description: 'Get executive summaries of claims with timeline, key facts, and outstanding actions.', icon: <Summarize />, color: '#e65100', bg: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)', path: '/ai/claim-summarizer' },
  { title: 'Policy Comparison', description: 'Compare policies side-by-side with AI-highlighted differences and recommendations.', icon: <CompareArrows />, color: '#0288d1', bg: 'linear-gradient(135deg, #e1f5fe 0%, #b3e5fc 100%)', path: '/ai/policy-comparison' },
  { title: 'AI Chatbot', description: 'Chat with an AI insurance expert for instant answers and assistance.', icon: <SmartToy />, color: '#1565c0', bg: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)', path: '/ai/chatbot' },
  { title: 'Sentiment Analysis', description: 'Analyze the emotional tone of client communications to improve response strategies.', icon: <SentimentSatisfied />, color: '#0288d1', bg: 'linear-gradient(135deg, #e1f5fe 0%, #b3e5fc 100%)', path: '/ai/sentiment-analysis' },
  { title: 'Loss Run Analyzer', description: 'Analyze loss run data for patterns, trends, and underwriting insights.', icon: <TrendingUp />, color: '#c62828', bg: 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)', path: '/ai/loss-run-analyzer' },
  { title: 'Endorsement Recommender', description: 'Get AI-powered endorsement and rider recommendations based on client needs.', icon: <Extension />, color: '#7b1fa2', bg: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)', path: '/ai/endorsement-recommender' },
  { title: 'Compliance Checker', description: 'Check policy compliance against state regulations and identify required disclosures.', icon: <GavelRounded />, color: '#e65100', bg: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)', path: '/ai/compliance-checker' },
];

export default function AIFeaturesPage() {
  const router = useRouter();

  return (
    <Box className="animate-fade-in">
      {/* Gradient Header */}
      <Paper elevation={0} sx={{
        p: 3, mb: 3, borderRadius: 3,
        background: 'linear-gradient(135deg, #1a237e 0%, #283593 50%, #3949ab 100%)',
        color: 'white',
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.15)', width: 52, height: 52 }}>
              <Psychology sx={{ fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight={700}>AI Features</Typography>
              <Typography variant="body2" sx={{ opacity: 0.85 }}>
                Leverage artificial intelligence to streamline operations and enhance client service
              </Typography>
            </Box>
          </Box>
          <Chip label={`${aiFeatures.length} Tools`} size="small"
            sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white', fontWeight: 600, fontSize: '0.8rem' }} />
        </Box>
      </Paper>

      {/* Summary Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Total AI Tools', value: aiFeatures.length, color: '#1565c0', bg: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)', icon: <Psychology /> },
          { label: 'Underwriting', value: '5', color: '#2e7d32', bg: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)', icon: <Assessment /> },
          { label: 'Client Tools', value: '6', color: '#7b1fa2', bg: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)', icon: <PersonSearch /> },
          { label: 'Automation', value: '7', color: '#e65100', bg: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)', icon: <AutoAwesome /> },
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

      {/* Feature Cards */}
      <Grid container spacing={2.5}>
        {aiFeatures.map((feature) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={feature.title}>
            <Paper elevation={0} sx={{
              height: '100%', cursor: 'pointer', borderRadius: 2.5,
              border: '1px solid', borderColor: 'divider', overflow: 'hidden',
              transition: 'all 0.25s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: `0 8px 24px ${feature.color}20`,
                borderColor: feature.color,
              },
            }} onClick={() => router.push(feature.path)}>
              <Box sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                  <Avatar sx={{ bgcolor: feature.bg, color: feature.color, width: 48, height: 48 }}>
                    {feature.icon}
                  </Avatar>
                  <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.3 }}>
                    {feature.title}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.6, minHeight: 48 }}>
                  {feature.description}
                </Typography>
                <Button size="small" endIcon={<ArrowForward sx={{ fontSize: 16 }} />}
                  sx={{ textTransform: 'none', fontWeight: 600, color: feature.color, px: 0,
                    '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' } }}>
                  Open Tool
                </Button>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
