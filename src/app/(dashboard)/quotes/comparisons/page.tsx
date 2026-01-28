'use client';

import { Box, Card, CardContent, Typography, Grid, Button, Alert } from '@mui/material';
import { CompareArrows, AutoAwesome } from '@mui/icons-material';
import { useRouter } from 'next/navigation';

export default function QuoteComparisonsPage() {
  const router = useRouter();

  return (
    <Box className="animate-fade-in">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>Quote Comparisons</Typography>
          <Typography color="text.secondary">Compare quotes from multiple carriers side-by-side</Typography>
        </Box>
        <Button variant="contained" startIcon={<AutoAwesome />} onClick={() => router.push('/ai/quote-generator')}>
          AI Quote Generator
        </Button>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        Use the AI Quote Generator to get instant multi-carrier quotes and compare them here.
      </Alert>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 8 }}>
              <CompareArrows sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h5" gutterBottom>No Comparisons Yet</Typography>
              <Typography color="text.secondary" sx={{ mb: 3 }}>
                Generate multi-carrier quotes to see comparisons here
              </Typography>
              <Button variant="outlined" onClick={() => router.push('/quotes/new')}>Create New Quote</Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
