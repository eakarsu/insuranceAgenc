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
  const [demoLoading, setDemoLoading] = useState(false);

  async function fillDemoCredentials() {
    setError('');
    setDemoLoading(true);
    try {
      const response = await fetch('/api/auth/demo-credentials', { cache: 'no-store' });
      if (!response.ok) throw new Error('Demo credentials unavailable');
      const credentials = await response.json() as { email?: string; password?: string };
      if (!credentials.email || !credentials.password) throw new Error('Demo credentials unavailable');
      setEmail(credentials.email);
      setPassword(credentials.password);
      const __demo = await signIn('credentials', { email: credentials.email, password: credentials.password, redirect: false });
      if (__demo?.error) { setError('Invalid email or password'); return; }
      window.location.assign('/');
    } catch {
      setError('Demo credentials are unavailable.');
    } finally {
      setDemoLoading(false);
    }
  }

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
              onClick={fillDemoCredentials}
              disabled={demoLoading || submitting}
              aria-label="Auto Fill Demo Credentials"
              style={{ width: '100%', marginBottom: '12px', padding: '10px 14px', borderRadius: '8px', border: '1px solid currentColor', background: 'transparent', cursor: 'pointer' }}
            >
              {demoLoading ? 'Loading Demo Credentials…' : 'Auto Fill Demo Credentials'}
            </button>
            <Button type="submit" variant="contained" size="large" disabled={submitting}>{submitting ? 'Signing in…' : 'Sign In'}</Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
