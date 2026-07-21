'use client';

import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import ErrorBoundary from '@/components/ErrorBoundary';
import NotificationProvider from '@/components/NotificationProvider';
import axios from 'axios';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const sessionChecked = useRef(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Verify session user exists in DB — auto-refresh if stale (e.g. after DB reset)
  useEffect(() => {
    if (status !== 'authenticated' || sessionChecked.current || refreshing) return;
    sessionChecked.current = true;

    axios.get('/api/health').then(async (res) => {
      // If health check works but session user ID is stale, the next API call would fail.
      // Do a quick check by fetching dashboard stats (which requires a valid user).
      try {
        await axios.get('/api/dashboard/stats');
      } catch (err: any) {
        if (err?.response?.status === 401 || err?.response?.status === 500) {
          // Session is stale — require a fresh interactive login.
          setRefreshing(true);
          await signOut({ redirect: false });
          router.push('/login');
        }
      }
    }).catch(() => {});
  }, [status, router, refreshing]);

  if (status === 'loading') {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <NotificationProvider>
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar />
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Header />
          <Box
            component="main"
            sx={{
              flex: 1,
              p: 3,
              backgroundColor: '#f5f7fa',
              overflow: 'auto',
            }}
          >
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </Box>
        </Box>
      </Box>
    </NotificationProvider>
  );
}
