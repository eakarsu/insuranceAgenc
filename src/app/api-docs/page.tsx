'use client';

import dynamic from 'next/dynamic';
import { Box, Typography } from '@mui/material';
import 'swagger-ui-react/swagger-ui.css';

const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false });

export default function ApiDocsPage() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#fff' }}>
      <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h4" fontWeight={700}>API Documentation</Typography>
        <Typography color="text.secondary">InsureFlow API Reference</Typography>
      </Box>
      <SwaggerUI url="/api/swagger" />
    </Box>
  );
}
