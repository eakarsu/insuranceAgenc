'use client';
import { Box } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useState } from 'react';
import ChatWidget from '@/components/ChatWidget';

const theme = createTheme({
  palette: { primary: { main: '#1976d2' }, secondary: { main: '#9c27b0' } },
});

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <QueryClientProvider client={queryClient}>
        {children}
        <ChatWidget />
      </QueryClientProvider>
      {/* SSE notifications handled via ChatWidget context */}
    </ThemeProvider>
  );
}
