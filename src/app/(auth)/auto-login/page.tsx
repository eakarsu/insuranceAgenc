'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn, signOut, useSession } from 'next-auth/react';
import { Box, CircularProgress, Typography } from '@mui/material';

export default function AutoLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const [error, setError] = useState('');
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    const forceRefresh = searchParams.get('refresh') === '1';

    // If already authenticated and no force-refresh, go to dashboard
    if (status === 'authenticated' && !forceRefresh) {
      router.push('/dashboard');
      return;
    }

    // If force-refresh, sign out first then re-sign in
    if (status === 'authenticated' && forceRefresh) {
      signOut({ redirect: false }).then(() => {
        doSignIn();
      });
      return;
    }

    if (status === 'loading') return;
    if (signingIn) return;

    doSignIn();
  }, [status, router, searchParams, signingIn]);

  function doSignIn() {
    setSigningIn(true);
    signIn('credentials', { email: 'auto', password: 'auto', redirect: false })
      .then((result) => {
        if (result?.error) {
          setError('Auto-login failed. Please check your database.');
          setSigningIn(false);
        } else {
          router.push('/dashboard');
          router.refresh();
        }
      })
      .catch(() => {
        setError('An error occurred during auto-login.');
        setSigningIn(false);
      });
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      }}
    >
      <CircularProgress sx={{ color: '#42a5f5', mb: 3 }} size={48} />
      <Typography
        variant="h5"
        sx={{
          fontWeight: 700,
          background: 'linear-gradient(45deg, #42a5f5, #7e57c2)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          mb: 1,
        }}
      >
        InsureFlow
      </Typography>
      <Typography sx={{ color: 'rgba(255,255,255,0.7)' }}>
        {error || 'Starting InsureFlow...'}
      </Typography>
    </Box>
  );
}
