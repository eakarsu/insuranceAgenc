'use client';

import {
  Card, CardContent, CardHeader, Typography, LinearProgress, Box, Chip, List,
  ListItem, ListItemText,
} from '@mui/material';
import { DocumentScanner } from '@mui/icons-material';

interface DocumentAnalysisCardProps {
  analysis: {
    authenticityScore: number;
    completenessScore: number;
    relevanceScore: number;
    keyDataPoints: Array<{ field: string; value: string }>;
    flags: string[];
    overallAssessment: string;
  } | null;
}

const getScoreColor = (score: number) => {
  if (score >= 0.7) return '#4caf50';
  if (score >= 0.4) return '#ff9800';
  return '#f44336';
};

function ScoreBar({ label, score }: { label: string; score: number }) {
  return (
    <Box sx={{ mb: 1.5 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="body2">{label}</Typography>
        <Typography variant="body2" fontWeight={600}>{(score * 100).toFixed(0)}%</Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={score * 100}
        sx={{
          height: 6,
          borderRadius: 3,
          bgcolor: 'grey.200',
          '& .MuiLinearProgress-bar': { bgcolor: getScoreColor(score), borderRadius: 3 },
        }}
      />
    </Box>
  );
}

export default function DocumentAnalysisCard({ analysis }: DocumentAnalysisCardProps) {
  if (!analysis) {
    return (
      <Card sx={{ mb: 2 }}>
        <CardHeader avatar={<DocumentScanner color="primary" />} title="Document Analysis" />
        <CardContent>
          <Typography color="text.secondary">No document analysis data available.</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ mb: 2 }}>
      <CardHeader avatar={<DocumentScanner color="primary" />} title="Document Analysis" />
      <CardContent>
        <ScoreBar label="Authenticity" score={analysis.authenticityScore} />
        <ScoreBar label="Completeness" score={analysis.completenessScore} />
        <ScoreBar label="Relevance" score={analysis.relevanceScore} />

        {analysis.keyDataPoints.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>Key Data Points</Typography>
            <List dense disablePadding>
              {analysis.keyDataPoints.map((dp, i) => (
                <ListItem key={i} disablePadding>
                  <ListItemText
                    primary={dp.field}
                    secondary={dp.value}
                    primaryTypographyProps={{ fontSize: '0.8125rem', fontWeight: 500 }}
                    secondaryTypographyProps={{ fontSize: '0.75rem' }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {analysis.flags.length > 0 && (
          <Box sx={{ mt: 2, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {analysis.flags.map((flag, i) => (
              <Chip key={i} label={flag} size="small" color="warning" variant="outlined" />
            ))}
          </Box>
        )}

        {analysis.overallAssessment && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>{analysis.overallAssessment}</Typography>
        )}
      </CardContent>
    </Card>
  );
}
