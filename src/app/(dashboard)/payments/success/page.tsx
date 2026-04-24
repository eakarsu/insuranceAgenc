'use client';

import { Box, Typography, Button, Paper } from '@mui/material';
import { CheckCircle } from '@mui/icons-material';
import { useRouter } from 'next/navigation';

export default function PaymentSuccessPage() {
  const router = useRouter();

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 6,
          borderRadius: 3,
          textAlign: 'center',
          maxWidth: 480,
          width: '100%',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <CheckCircle sx={{ fontSize: 72, color: '#2e7d32', mb: 2 }} />
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Payment Successful
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Your payment has been processed successfully. A confirmation receipt has been sent.
        </Typography>
        <Button
          variant="contained"
          size="large"
          onClick={() => router.push('/dashboard')}
          sx={{
            borderRadius: 2,
            px: 4,
            py: 1.5,
            fontWeight: 600,
            textTransform: 'none',
            bgcolor: '#2e7d32',
            '&:hover': { bgcolor: '#1b5e20' },
          }}
        >
          Return to Dashboard
        </Button>
      </Paper>
    </Box>
  );
}
