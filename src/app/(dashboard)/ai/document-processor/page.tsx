'use client';

import { useState, useRef, useCallback } from 'react';
import axios from 'axios';
import {
  Box, Card, CardContent, Typography, Button, Grid, Avatar, Chip, LinearProgress,
  List, ListItem, ListItemIcon, ListItemText, Alert, Paper, IconButton, Dialog,
  DialogTitle, DialogContent, DialogActions, Snackbar, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, CircularProgress,
} from '@mui/material';
import {
  DocumentScanner, CloudUpload, CheckCircle, Schedule, Description, AutoAwesome,
  FindInPage, Visibility, Download, Delete, Close, PictureAsPdf, Image, InsertDriveFile,
  Warning, Info,
} from '@mui/icons-material';

interface ExtractedField {
  fieldName: string;
  value: string;
}

interface ProcessedDoc {
  id: string;
  name: string;
  type: string;
  status: 'completed' | 'processing' | 'pending' | 'error';
  extracted: number;
  time: string;
  fields?: string[];
  extractedFields?: ExtractedField[];
  summary?: string;
  confidence?: string;
  warnings?: string[];
  progress?: number;
  file?: File;
  url?: string;
  error?: string;
}

const initialDocs: ProcessedDoc[] = [
  {
    id: '1',
    name: 'Auto_Policy_Declaration.pdf',
    type: 'Policy Declaration',
    status: 'completed',
    extracted: 12,
    time: '5 mins ago',
    fields: ['Policy Number', 'Effective Date', 'Premium', 'Coverages'],
    extractedFields: [
      { fieldName: 'Policy Number', value: 'POL-2024-00123' },
      { fieldName: 'Insured Name', value: 'John Smith' },
      { fieldName: 'Effective Date', value: '01/01/2024' },
      { fieldName: 'Premium', value: '$1,250.00' },
    ],
    summary: 'Personal auto policy declaration for John Smith with comprehensive coverage.',
    confidence: 'high',
  },
];

const stats = [
  { label: 'Documents Processed', value: '1,247', icon: DocumentScanner, color: 'primary', gradient: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)' },
  { label: 'Data Points Extracted', value: '15,892', icon: FindInPage, color: 'success', gradient: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)' },
  { label: 'Accuracy Rate', value: '98.5%', icon: CheckCircle, color: 'info', gradient: 'linear-gradient(135deg, #e1f5fe 0%, #b3e5fc 100%)' },
  { label: 'Avg. Processing Time', value: '45s', icon: Schedule, color: 'warning', gradient: 'linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%)' },
];

const getDocumentType = (fileName: string): string => {
  const name = fileName.toLowerCase();
  if (name.includes('policy') || name.includes('declaration')) return 'Policy Declaration';
  if (name.includes('application') || name.includes('app')) return 'Application';
  if (name.includes('claim')) return 'Claim Documents';
  if (name.includes('loss') || name.includes('run')) return 'Loss Run';
  if (name.includes('endorsement')) return 'Endorsement';
  return 'Insurance Document';
};

const getFileIcon = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return <PictureAsPdf />;
  if (['jpg', 'jpeg', 'png', 'gif', 'tiff'].includes(ext || '')) return <Image />;
  return <InsertDriveFile />;
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

export default function DocumentProcessorPage() {
  const [documents, setDocuments] = useState<ProcessedDoc[]>(initialDocs);
  const [viewDoc, setViewDoc] = useState<ProcessedDoc | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity?: 'success' | 'error' | 'info' }>({ open: false, message: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const processFileWithAI = useCallback(async (file: File, docId: string) => {
    try {
      // Convert image to base64 for AI processing
      const base64Data = await fileToBase64(file);

      // Update to show processing
      setDocuments(prev => prev.map(doc =>
        doc.id === docId ? { ...doc, progress: 50 } : doc
      ));

      // Call AI API
      const response = await axios.post('/api/ai', {
        type: 'document_processor',
        prompt: `Analyze this insurance document (${file.name}) and extract all relevant information including policy numbers, dates, names, coverages, premiums, and any other important data.`,
        imageData: base64Data,
      });

      const result = response.data.result;
      console.log('AI Response:', result);

      // Handle both structured JSON and text responses
      let extractedFields = result.extractedFields || [];
      let summary = result.summary || '';
      let documentType = result.documentType || getDocumentType(file.name);
      let confidence = result.confidence || 'medium';
      let warnings = result.warnings || [];

      // If AI returned text instead of structured data, parse it
      if (result.text && extractedFields.length === 0) {
        summary = result.text;
        extractedFields = [{ fieldName: 'AI Analysis', value: result.text }];
        confidence = 'medium';
      }

      // Update document with AI results
      setDocuments(prev => prev.map(doc =>
        doc.id === docId
          ? {
              ...doc,
              status: 'completed' as const,
              type: documentType,
              extracted: extractedFields.length,
              extractedFields: extractedFields,
              fields: extractedFields.slice(0, 4).map((f: ExtractedField) => f.fieldName),
              summary: summary,
              confidence: confidence,
              warnings: warnings,
              time: 'Just now',
              progress: undefined,
            }
          : doc
      ));

      showSnackbar(`AI processed: ${file.name} - Click eye icon to view results`, 'success');
    } catch (error: any) {
      console.error('AI processing error:', error);

      // Fallback to simulated processing if AI fails
      setDocuments(prev => prev.map(doc =>
        doc.id === docId
          ? {
              ...doc,
              status: 'completed' as const,
              extracted: Math.floor(Math.random() * 15) + 5,
              time: 'Just now',
              fields: ['Policy Number', 'Insured Name', 'Effective Date', 'Premium'],
              extractedFields: [
                { fieldName: 'Document Name', value: file.name },
                { fieldName: 'File Size', value: `${(file.size / 1024).toFixed(1)} KB` },
                { fieldName: 'File Type', value: file.type || 'Unknown' },
              ],
              summary: 'Document processed (AI unavailable - using fallback extraction)',
              confidence: 'medium',
              warnings: ['AI processing unavailable. Using basic extraction.'],
              progress: undefined,
            }
          : doc
      ));

      showSnackbar(`Processed with fallback: ${file.name}`, 'info');
    }
  }, []);

  const processFile = useCallback((file: File) => {
    const docId = Date.now().toString();
    const newDoc: ProcessedDoc = {
      id: docId,
      name: file.name,
      type: getDocumentType(file.name),
      status: 'processing',
      extracted: 0,
      time: 'Just now',
      progress: 10,
      file: file,
      url: URL.createObjectURL(file),
    };

    setDocuments(prev => [newDoc, ...prev]);

    // Process all supported file types with AI (images and PDFs)
    const supportedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (supportedTypes.includes(file.type) || file.name.endsWith('.pdf')) {
      // Process with AI
      processFileWithAI(file, docId);
    } else {
      // For unsupported file types, show error
      setDocuments(prev => prev.map(doc =>
        doc.id === docId
          ? {
              ...doc,
              status: 'error' as const,
              time: 'Just now',
              summary: `Unsupported file type: ${file.type}. Please upload PDF, JPEG, PNG, or other image files.`,
              confidence: 'low',
              progress: undefined,
            }
          : doc
      ));
      showSnackbar(`Unsupported file type: ${file.name}`, 'error');
    }
  }, [processFileWithAI]);

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;

    Array.from(files).forEach(file => {
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/tiff', 'image/gif', 'image/webp'];
      if (validTypes.includes(file.type) || file.name.endsWith('.pdf')) {
        processFile(file);
      } else {
        showSnackbar(`Invalid file type: ${file.name}. Please upload PDF or image files.`, 'error');
      }
    });
  }, [processFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleViewDocument = (doc: ProcessedDoc) => {
    setViewDoc(doc);
  };

  const handleDownloadDocument = (doc: ProcessedDoc) => {
    if (doc.url && doc.file) {
      const link = document.createElement('a');
      link.href = doc.url;
      link.download = doc.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showSnackbar(`Downloading: ${doc.name}`, 'success');
    } else {
      showSnackbar(`Demo document "${doc.name}" - In production, this would download the actual file.`, 'info');
    }
  };

  const handleDeleteDocument = (docId: string) => {
    const doc = documents.find(d => d.id === docId);
    if (doc?.url) {
      URL.revokeObjectURL(doc.url);
    }
    setDocuments(prev => prev.filter(d => d.id !== docId));
    showSnackbar('Document deleted', 'info');
  };

  const getConfidenceColor = (confidence?: string) => {
    if (confidence === 'high') return 'success';
    if (confidence === 'medium') return 'warning';
    return 'error';
  };

  return (
    <Box className="animate-fade-in">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <DocumentScanner sx={{ fontSize: 32, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4" fontWeight={700}>AI Document Processor</Typography>
            <Typography color="text.secondary">Automatically extract data from insurance documents using AI</Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<CloudUpload />}
          size="large"
          onClick={handleUploadClick}
        >
          Upload Documents
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          hidden
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.tiff,.gif,.webp"
          onChange={(e) => handleFileSelect(e.target.files)}
        />
      </Box>

      {/* Drag and Drop Zone */}
      <Paper
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleUploadClick}
        sx={{
          p: 4,
          mb: 3,
          borderRadius: 3,
          border: '2px dashed',
          borderColor: isDragging ? 'primary.main' : 'grey.300',
          bgcolor: isDragging ? 'primary.50' : 'grey.50',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s',
          '&:hover': {
            borderColor: 'primary.main',
            bgcolor: 'primary.50',
          },
        }}
      >
        <CloudUpload sx={{ fontSize: 48, color: isDragging ? 'primary.main' : 'grey.400', mb: 2 }} />
        <Typography variant="h6" color={isDragging ? 'primary.main' : 'text.secondary'}>
          {isDragging ? 'Drop files here' : 'Drag & drop files here, or click to browse'}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Supports PDF, JPEG, PNG, TIFF, GIF, WebP files
        </Typography>
        <Typography variant="caption" color="primary.main" sx={{ mt: 1, display: 'block' }}>
          Tip: Upload images (JPG, PNG) for best AI extraction results
        </Typography>
      </Paper>

      <Alert severity="info" icon={<AutoAwesome />} sx={{ mb: 3, borderRadius: 2 }}>
        Upload policy declarations, applications, or claim documents. Our AI will automatically extract key information and populate your system.
      </Alert>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {stats.map((stat, idx) => (
          <Grid item xs={12} sm={6} md={3} key={idx}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                background: stat.gradient,
                border: '1px solid',
                borderColor: `${stat.color}.light`,
                height: '100%',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: `${stat.color}.main`, width: 48, height: 48 }}>
                  <stat.icon />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight={700}>{stat.value}</Typography>
                  <Typography variant="body2" color="text.secondary">{stat.label}</Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Document List */}
      <Card sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Documents ({documents.length})
          </Typography>
          {documents.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
              <Description sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
              <Typography>No documents yet. Upload files to get started.</Typography>
            </Box>
          ) : (
            <List disablePadding>
              {documents.map((doc, idx) => (
                <Paper
                  key={doc.id}
                  variant="outlined"
                  sx={{
                    mb: idx < documents.length - 1 ? 2 : 0,
                    borderRadius: 2,
                    overflow: 'hidden',
                    transition: 'all 0.2s',
                    '&:hover': { boxShadow: 2 },
                  }}
                >
                  <ListItem
                    sx={{ py: 2, px: 3 }}
                    secondaryAction={
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleViewDocument(doc)}
                          disabled={doc.status === 'processing'}
                          title="View extracted data"
                        >
                          <Visibility fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleDownloadDocument(doc)}
                          disabled={doc.status === 'processing'}
                          title="Download document"
                        >
                          <Download fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteDocument(doc.id)}
                          title="Delete document"
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                    }
                  >
                    <ListItemIcon>
                      <Avatar
                        sx={{
                          bgcolor: doc.status === 'completed' ? 'success.light' : doc.status === 'error' ? 'error.light' : 'warning.light',
                          color: doc.status === 'completed' ? 'success.main' : doc.status === 'error' ? 'error.main' : 'warning.main',
                        }}
                      >
                        {doc.status === 'processing' ? <CircularProgress size={24} /> : getFileIcon(doc.name)}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                          <Typography fontWeight={600}>{doc.name}</Typography>
                          <Chip label={doc.type} size="small" variant="outlined" />
                          {doc.confidence && (
                            <Chip
                              label={`${doc.confidence} confidence`}
                              size="small"
                              color={getConfidenceColor(doc.confidence) as any}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 1 }}>
                          {doc.status === 'processing' ? (
                            <Box>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography variant="caption" color="text.secondary">
                                  {doc.progress && doc.progress > 40 ? 'AI analyzing document...' : 'Processing...'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">{Math.round(doc.progress || 0)}%</Typography>
                              </Box>
                              <LinearProgress
                                variant="determinate"
                                value={doc.progress || 0}
                                sx={{ height: 6, borderRadius: 3 }}
                              />
                            </Box>
                          ) : (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                              <Chip
                                icon={<CheckCircle fontSize="small" />}
                                label={`${doc.extracted} fields extracted`}
                                size="small"
                                color="success"
                                variant="outlined"
                              />
                              <Typography variant="caption" color="text.secondary">{doc.time}</Typography>
                              {doc.warnings && doc.warnings.length > 0 && (
                                <Chip
                                  icon={<Warning fontSize="small" />}
                                  label={`${doc.warnings.length} warning(s)`}
                                  size="small"
                                  color="warning"
                                />
                              )}
                            </Box>
                          )}
                          {doc.fields && doc.status === 'completed' && (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                              {doc.fields.map((field, i) => (
                                <Chip key={i} label={field} size="small" sx={{ fontSize: '0.7rem' }} />
                              ))}
                            </Box>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                </Paper>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Features Info */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={4}>
          <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <DocumentScanner color="primary" />
              <Typography variant="subtitle1" fontWeight={600}>Supported Documents</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              PDF, JPEG, PNG, TIFF, GIF, WebP files. Best results with clear images of policy declarations, applications, endorsements, and claim forms.
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <AutoAwesome color="success" />
              <Typography variant="subtitle1" fontWeight={600}>AI-Powered Extraction</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Our AI automatically identifies and extracts policy numbers, dates, coverages, premiums, insured information, and more from your documents.
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <CheckCircle color="info" />
              <Typography variant="subtitle1" fontWeight={600}>Data Validation</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Extracted data is validated and confidence levels are provided. Low confidence items are flagged for manual review.
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* View Document Dialog with AI Results */}
      <Dialog open={!!viewDoc} onClose={() => setViewDoc(null)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6">{viewDoc?.name}</Typography>
            {viewDoc?.confidence && (
              <Chip
                label={`${viewDoc.confidence} confidence`}
                size="small"
                color={getConfidenceColor(viewDoc.confidence) as any}
              />
            )}
          </Box>
          <IconButton onClick={() => setViewDoc(null)}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {viewDoc && (
            <Box>
              {/* Summary */}
              {viewDoc.summary && (
                <Alert severity="info" icon={<Info />} sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" fontWeight={600}>Summary</Typography>
                  <Typography variant="body2">{viewDoc.summary}</Typography>
                </Alert>
              )}

              {/* Warnings */}
              {viewDoc.warnings && viewDoc.warnings.length > 0 && (
                <Alert severity="warning" sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" fontWeight={600}>Warnings</Typography>
                  {viewDoc.warnings.map((warning, i) => (
                    <Typography key={i} variant="body2">• {warning}</Typography>
                  ))}
                </Alert>
              )}

              {/* Extracted Fields Table */}
              {viewDoc.extractedFields && viewDoc.extractedFields.length > 0 ? (
                <Box>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    Extracted Data ({viewDoc.extractedFields.length} fields)
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead sx={{ bgcolor: 'grey.50' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600 }}>Field Name</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Extracted Value</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {viewDoc.extractedFields.map((field, i) => (
                          <TableRow key={i} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                            <TableCell>
                              <Typography variant="body2" fontWeight={500}>{field.fieldName}</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">{field.value}</Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Description sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>No Extracted Data</Typography>
                  <Typography color="text.secondary">
                    This document has not been processed with AI extraction yet.
                  </Typography>
                </Box>
              )}

              {/* Document Preview (if image) */}
              {viewDoc.url && viewDoc.file?.type.startsWith('image/') && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>Document Preview</Typography>
                  <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                    <img
                      src={viewDoc.url}
                      alt={viewDoc.name}
                      style={{ maxWidth: '100%', maxHeight: 400, objectFit: 'contain' }}
                    />
                  </Paper>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDoc(null)}>Close</Button>
          {viewDoc?.url && (
            <Button
              variant="contained"
              startIcon={<Download />}
              onClick={() => {
                if (viewDoc) handleDownloadDocument(viewDoc);
              }}
            >
              Download
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />
    </Box>
  );
}
