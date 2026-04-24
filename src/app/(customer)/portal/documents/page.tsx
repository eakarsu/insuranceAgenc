'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  Box, AppBar, Toolbar, Typography, Button, Card, Skeleton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Chip, Paper, TextField, InputAdornment,
} from '@mui/material';
import { Description, Download, PictureAsPdf, Image, InsertDriveFile, Search } from '@mui/icons-material';
import { format } from 'date-fns';

interface Document {
  id: string;
  name: string;
  type: string;
  fileUrl: string;
  uploadedAt: string;
}

export default function CustomerDocumentsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');

  const { data: documents = [], isLoading } = useQuery<Document[]>({
    queryKey: ['customerDocuments'],
    queryFn: async () => {
      const response = await axios.get('/api/customer/documents');
      return response.data;
    },
  });

  const getDocTypeIcon = (type: string) => {
    const t = type?.toLowerCase() || '';
    if (t.includes('pdf')) return <PictureAsPdf sx={{ color: '#c62828' }} />;
    if (t.includes('image') || t.includes('jpg') || t.includes('png')) return <Image sx={{ color: '#1976d2' }} />;
    return <InsertDriveFile sx={{ color: '#757575' }} />;
  };

  const getDocTypeColor = (type: string) => {
    const t = type?.toLowerCase() || '';
    if (t.includes('policy')) return 'primary';
    if (t.includes('claim')) return 'error';
    if (t.includes('invoice') || t.includes('billing')) return 'warning';
    if (t.includes('certificate')) return 'success';
    return 'default';
  };

  const filteredDocuments = useMemo(() => {
    if (!search.trim()) return documents;
    const q = search.toLowerCase();
    return documents.filter((doc) =>
      [
        doc.name,
        doc.type?.replace(/_/g, ' '),
        doc.uploadedAt ? format(new Date(doc.uploadedAt), 'MMM d, yyyy') : '',
      ].some((field) => field?.toLowerCase().includes(q))
    );
  }, [documents, search]);

  return (
    <Box>
      {/* AppBar */}
      <AppBar position="static" sx={{ mb: 3 }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>InsureFlow Customer Portal</Typography>
          <Button color="inherit" onClick={() => router.push('/portal')}>Dashboard</Button>
          <Button color="inherit" onClick={async () => { await axios.post('/api/customer/auth/logout'); router.push('/portal/login'); }}>Logout</Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 3 }}>
        {/* Page Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Description sx={{ fontSize: 32, color: 'secondary.main' }} />
          <Box>
            <Typography variant="h5" fontWeight={700}>My Documents</Typography>
            <Typography variant="body2" color="text.secondary">
              Access and download your insurance documents
            </Typography>
          </Box>
        </Box>

        {/* Search Bar */}
        <TextField
          fullWidth
          placeholder="Search documents..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          sx={{
            mb: 2,
            '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'white' },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            ),
          }}
        />

        {/* Documents Table */}
        {isLoading ? (
          <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2.5 }} />
        ) : filteredDocuments.length === 0 ? (
          <Card sx={{ borderRadius: 2.5, p: 6, textAlign: 'center' }}>
            <Description sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No documents available
            </Typography>
            <Typography variant="body2" color="text.disabled">
              Your policy documents will appear here once they are uploaded
            </Typography>
          </Card>
        ) : (
          <Card sx={{ borderRadius: 2.5, overflow: 'hidden' }}>
            <TableContainer component={Paper} elevation={0}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: 0.5, color: 'text.secondary' }}>
                      Document
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: 0.5, color: 'text.secondary' }}>
                      Type
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: 0.5, color: 'text.secondary' }}>
                      Uploaded
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: 0.5, color: 'text.secondary' }}>
                      Action
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredDocuments.map((doc) => (
                    <TableRow
                      key={doc.id}
                      sx={{
                        '&:hover': { bgcolor: 'action.hover' },
                        '& td': { borderColor: 'grey.100' },
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          {getDocTypeIcon(doc.type)}
                          <Typography variant="body2" fontWeight={600}>
                            {doc.name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={doc.type?.replace(/_/g, ' ') || 'Document'}
                          size="small"
                          color={getDocTypeColor(doc.type) as any}
                          variant="outlined"
                          sx={{ borderRadius: '6px', fontWeight: 500 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.84rem' }}>
                          {doc.uploadedAt ? format(new Date(doc.uploadedAt), 'MMM d, yyyy') : '-'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => window.open(doc.fileUrl, '_blank')}
                          sx={{
                            bgcolor: 'primary.50',
                            '&:hover': { bgcolor: 'primary.100' },
                          }}
                        >
                          <Download fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        )}
      </Box>
    </Box>
  );
}
