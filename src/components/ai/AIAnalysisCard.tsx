'use client';

import { useState } from 'react';
import {
  Card, CardContent, CardHeader, Typography, Chip, LinearProgress, Box, Button,
  Collapse, List, ListItem, ListItemIcon, ListItemText, IconButton, CircularProgress,
} from '@mui/material';
import {
  Psychology, ExpandMore, ExpandLess, Warning, Error as ErrorIcon, Info, Refresh,
} from '@mui/icons-material';
import axios from 'axios';

interface AIAnalysisCardProps {
  claimId: string;
  classification: string | null;
  riskScore: number | null;
  aiFlags: any;
  onUpdate?: () => void;
}

const getRiskColor = (score: number) => {
  if (score <= 0.3) return '#4caf50';
  if (score <= 0.7) return '#ff9800';
  return '#f44336';
};

const getRiskLabel = (score: number) => {
  if (score <= 0.3) return 'Low Risk';
  if (score <= 0.7) return 'Medium Risk';
  return 'High Risk';
};

const getClassificationColor = (classification: string) => {
  switch (classification) {
    case 'LOW_RISK':
    case 'LEGITIMATE': return 'success';
    case 'MEDIUM_RISK':
    case 'PENDING_REVIEW': return 'warning';
    case 'HIGH_RISK':
    case 'SUSPICIOUS': return 'error';
    default: return 'default';
  }
};

const getSeverityIcon = (severity: string) => {
  switch (severity) {
    case 'HIGH': return <ErrorIcon color="error" fontSize="small" />;
    case 'MEDIUM': return <Warning color="warning" fontSize="small" />;
    default: return <Info color="info" fontSize="small" />;
  }
};

export default function AIAnalysisCard({ claimId, classification, riskScore, aiFlags, onUpdate }: AIAnalysisCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleReanalyze = async () => {
    setLoading(true);
    try {
      await axios.post(`/api/claims/${claimId}/ai-analysis`);
      onUpdate?.();
    } catch (error) {
      console.error('Re-analysis failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const flags = aiFlags?.claimAnalysis?.flags || aiFlags?.flags || [];
  const recommendations = aiFlags?.claimAnalysis?.recommendations || aiFlags?.recommendations || [];
  const summary = aiFlags?.claimAnalysis?.summary || aiFlags?.summary || '';

  return (
    <Card sx={{ mb: 2 }}>
      <CardHeader
        avatar={<Psychology color="primary" />}
        title="AI Claim Analysis"
        subheader={aiFlags?.analyzedAt ? `Analyzed: ${new Date(aiFlags.analyzedAt).toLocaleString()}` : 'Not yet analyzed'}
        action={
          <Button
            size="small"
            startIcon={loading ? <CircularProgress size={16} /> : <Refresh />}
            onClick={handleReanalyze}
            disabled={loading}
          >
            {loading ? 'Analyzing...' : riskScore !== null ? 'Re-analyze' : 'Run Analysis'}
          </Button>
        }
      />
      <CardContent>
        {riskScore === null ? (
          <Typography color="text.secondary">No AI analysis data available. Click "Run Analysis" to start.</Typography>
        ) : (
          <>
            <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
              {classification && (
                <Chip
                  label={classification.replace(/_/g, ' ')}
                  color={getClassificationColor(classification) as any}
                  size="small"
                />
              )}
              <Chip label={getRiskLabel(riskScore)} size="small" sx={{ bgcolor: getRiskColor(riskScore), color: '#fff' }} />
            </Box>

            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" fontWeight={600}>Risk Score</Typography>
                <Typography variant="body2" fontWeight={600}>{(riskScore * 100).toFixed(0)}%</Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={riskScore * 100}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  bgcolor: 'grey.200',
                  '& .MuiLinearProgress-bar': { bgcolor: getRiskColor(riskScore), borderRadius: 4 },
                }}
              />
            </Box>

            {summary && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{summary}</Typography>
            )}

            {(flags.length > 0 || recommendations.length > 0) && (
              <>
                <Button
                  size="small"
                  onClick={() => setExpanded(!expanded)}
                  endIcon={expanded ? <ExpandLess /> : <ExpandMore />}
                >
                  {expanded ? 'Hide Details' : `View Details (${flags.length} flags, ${recommendations.length} recommendations)`}
                </Button>
                <Collapse in={expanded}>
                  {flags.length > 0 && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="subtitle2" gutterBottom>Flags</Typography>
                      <List dense disablePadding>
                        {flags.map((flag: any, i: number) => (
                          <ListItem key={i} disablePadding sx={{ pl: 1 }}>
                            <ListItemIcon sx={{ minWidth: 32 }}>{getSeverityIcon(flag.severity)}</ListItemIcon>
                            <ListItemText
                              primary={flag.type?.replace(/_/g, ' ')}
                              secondary={flag.description}
                              primaryTypographyProps={{ fontSize: '0.8125rem', fontWeight: 500 }}
                              secondaryTypographyProps={{ fontSize: '0.75rem' }}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}
                  {recommendations.length > 0 && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="subtitle2" gutterBottom>Recommendations</Typography>
                      <List dense disablePadding>
                        {recommendations.map((rec: string, i: number) => (
                          <ListItem key={i} disablePadding sx={{ pl: 1 }}>
                            <ListItemIcon sx={{ minWidth: 32 }}><Info color="primary" fontSize="small" /></ListItemIcon>
                            <ListItemText primary={rec} primaryTypographyProps={{ fontSize: '0.8125rem' }} />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}
                </Collapse>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
