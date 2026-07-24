'use client';

import { FormEvent, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Alert, Box, Button, Card, CardContent, TextField, Typography } from '@mui/material';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true); setError('');
    const result = await signIn('credentials', { email, password, redirect: false });
    if (result?.error) {
      setError('Invalid email or password.');
      setSubmitting(false);
      return;
    }
    router.replace('/dashboard');
    router.refresh();
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', bgcolor: '#f5f7fa', p: 2 }}>
      <Card sx={{ width: '100%', maxWidth: 440 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" fontWeight={700} gutterBottom>InsureFlow</Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>Sign in with your provisioned agency account.</Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box component="form" onSubmit={submit} sx={{ display: 'grid', gap: 2 }}>
            <TextField label="Email" type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} />
            <TextField label="Password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} />
            <button
              type="button"
              onClick={() => { setEmail(process.env.NEXT_PUBLIC_DEMO_EMAIL || ''); setPassword(process.env.NEXT_PUBLIC_DEMO_PASSWORD || ''); }}
              disabled={!process.env.NEXT_PUBLIC_DEMO_EMAIL || !process.env.NEXT_PUBLIC_DEMO_PASSWORD}
              aria-label="Auto Fill Demo Credentials"
              style={{ width: '100%', marginBottom: '12px', padding: '10px 14px', borderRadius: '8px', border: '1px solid currentColor', background: 'transparent', cursor: 'pointer' }}
            >
              Auto Fill Demo Credentials
            </button>
            <Button type="submit" variant="contained" size="large" disabled={submitting}>{submitting ? 'Signing in…' : 'Sign in'}</Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
