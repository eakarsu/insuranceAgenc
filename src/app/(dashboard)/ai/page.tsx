'use client';

import { useRouter } from 'next/navigation';
import { Box, Card, CardContent, Typography, Grid, Avatar, Button } from '@mui/material';
import {
  AutoAwesome, Security, SupportAgent, Analytics, Mic, DocumentScanner,
  Recommend, Assessment, ArrowForward, Psychology,
} from '@mui/icons-material';

const aiFeatures = [
  {
    title: 'AI Quote Generator',
    description: 'Generate instant multi-carrier quotes using AI to analyze risk factors and match with best carriers.',
    icon: <AutoAwesome />,
    color: 'primary',
    path: '/ai/quote-generator',
  },
  {
    title: 'Coverage Analyzer',
    description: 'Identify coverage gaps and recommend additional protection based on client profiles.',
    icon: <Security />,
    color: 'success',
    path: '/ai/coverage-analyzer',
  },
  {
    title: 'Claims Assistant',
    description: 'AI-powered first notice of loss processing with automated claim categorization.',
    icon: <SupportAgent />,
    color: 'warning',
    path: '/ai/claims-assistant',
  },
  {
    title: 'Renewal Predictor',
    description: 'Predict retention risk and get personalized strategies to improve renewal rates.',
    icon: <Analytics />,
    color: 'info',
    path: '/ai/renewal-predictor',
  },
  {
    title: 'Cross-Sell Recommender',
    description: 'AI recommendations for additional policies based on client life events and needs.',
    icon: <Recommend />,
    color: 'secondary',
    path: '/ai/cross-sell',
  },
  {
    title: 'Voice Receptionist',
    description: 'AI-powered phone handling for after-hours calls and basic inquiries.',
    icon: <Mic />,
    color: 'error',
    path: '/ai/voice-receptionist',
  },
  {
    title: 'Document Processor',
    description: 'Extract policy data from documents using OCR and AI analysis.',
    icon: <DocumentScanner />,
    color: 'primary',
    path: '/ai/document-processor',
  },
  {
    title: 'Risk Assessor',
    description: 'Evaluate risk factors for underwriting decisions with AI-powered analysis.',
    icon: <Assessment />,
    color: 'warning',
    path: '/ai/risk-assessor',
  },
];

export default function AIFeaturesPage() {
  const router = useRouter();

  return (
    <Box className="animate-fade-in">
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <Psychology sx={{ fontSize: 40, color: 'primary.main' }} />
          <Typography variant="h4" fontWeight={700}>AI Features</Typography>
        </Box>
        <Typography color="text.secondary">
          Leverage artificial intelligence to streamline operations and enhance client service
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {aiFeatures.map((feature) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={feature.title}>
            <Card
              className="hover-card"
              sx={{ height: '100%', cursor: 'pointer' }}
              onClick={() => router.push(feature.path)}
            >
              <CardContent sx={{ p: 3 }}>
                <Avatar sx={{ bgcolor: `${feature.color}.light`, color: `${feature.color}.main`, mb: 2, width: 56, height: 56 }}>
                  {feature.icon}
                </Avatar>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  {feature.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {feature.description}
                </Typography>
                <Button size="small" endIcon={<ArrowForward />} color={feature.color as any}>
                  Open
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
