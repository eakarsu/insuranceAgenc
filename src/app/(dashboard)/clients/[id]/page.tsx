'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Avatar,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Skeleton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  ArrowBack,
  Edit,
  Person,
  Business,
  Email,
  Phone,
  LocationOn,
  Policy,
  RequestQuote,
  ReportProblem,
  Event,
  Description,
  Add,
  Cake,
  Work,
  AttachMoney,
  People,
} from '@mui/icons-material';
import { format } from 'date-fns';

interface Client {
  id: string;
  type: string;
  status: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  mobile: string;
  dateOfBirth: string;
  businessName: string;
  businessType: string;
  yearsInBusiness: number;
  numberOfEmployees: number;
  annualRevenue: number;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  source: string;
  notes: string;
  tags: string[];
  createdAt: string;
  agent: { id: string; name: string; email: string };
  household: { id: string; name: string };
  contacts: any[];
  lifeEvents: any[];
  documents: any[];
  policies: any[];
  quotes: any[];
  claims: any[];
  activities: any[];
}

export default function ClientDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(0);

  // Dialog states
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false);
  const [lifeEventDialogOpen, setLifeEventDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  // Form states
  const [documentForm, setDocumentForm] = useState({ name: '', type: 'OTHER', file: null as File | null });
  const [lifeEventForm, setLifeEventForm] = useState({ title: '', type: 'MARRIAGE', eventDate: '', description: '' });

  const { data: client, isLoading } = useQuery<Client>({
    queryKey: ['client', id],
    queryFn: async () => {
      const response = await axios.get(`/api/clients/${id}`);
      return response.data;
    },
  });

  // Document upload mutation
  const documentMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await axios.post('/api/documents', { ...data, clientId: id });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client', id] });
      setDocumentDialogOpen(false);
      setDocumentForm({ name: '', type: 'OTHER', file: null });
      setSnackbar({ open: true, message: 'Document added successfully', severity: 'success' });
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to add document', severity: 'error' });
    },
  });

  // Life event mutation
  const lifeEventMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await axios.post('/api/life-events', { ...data, clientId: id });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client', id] });
      setLifeEventDialogOpen(false);
      setLifeEventForm({ title: '', type: 'MARRIAGE', eventDate: '', description: '' });
      setSnackbar({ open: true, message: 'Life event added successfully', severity: 'success' });
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to add life event', severity: 'error' });
    },
  });

  if (isLoading) {
    return (
      <Box>
        <Skeleton variant="rectangular" height={200} sx={{ mb: 3, borderRadius: 2 }} />
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
          </Grid>
          <Grid item xs={12} md={8}>
            <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
          </Grid>
        </Grid>
      </Box>
    );
  }

  if (!client) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h5" color="text.secondary">
          Client not found
        </Typography>
        <Button sx={{ mt: 2 }} onClick={() => router.push('/clients')}>
          Back to Clients
        </Button>
      </Box>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'PROSPECT': return 'info';
      case 'INACTIVE': return 'warning';
      case 'FORMER': return 'error';
      default: return 'default';
    }
  };

  const getPolicyStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'PENDING': return 'warning';
      case 'CANCELLED': case 'EXPIRED': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box className="animate-fade-in">
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={() => router.push('/clients')}>
          Back
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button
          variant="outlined"
          startIcon={<Edit />}
          onClick={() => router.push(`/clients/${id}/edit`)}
        >
          Edit
        </Button>
        <Button
          variant="contained"
          startIcon={<RequestQuote />}
          onClick={() => router.push(`/quotes/new?clientId=${id}`)}
        >
          New Quote
        </Button>
      </Box>

      {/* Client Header Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>
            <Avatar
              sx={{
                width: 80,
                height: 80,
                bgcolor: client.type === 'PERSONAL' ? 'primary.main' : 'secondary.main',
                fontSize: '2rem',
              }}
            >
              {client.type === 'PERSONAL' ? <Person /> : <Business />}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <Typography variant="h4" fontWeight={700}>
                  {client.type === 'COMMERCIAL' && client.businessName
                    ? client.businessName
                    : `${client.firstName} ${client.lastName}`}
                </Typography>
                <Chip
                  label={client.status}
                  color={getStatusColor(client.status) as any}
                  size="small"
                />
                <Chip
                  label={client.type}
                  variant="outlined"
                  color={client.type === 'PERSONAL' ? 'primary' : 'secondary'}
                  size="small"
                />
              </Box>
              {client.type === 'COMMERCIAL' && (
                <Typography color="text.secondary" gutterBottom>
                  {client.firstName} {client.lastName} - {client.businessType}
                </Typography>
              )}
              <Box sx={{ display: 'flex', gap: 3, mt: 2, flexWrap: 'wrap' }}>
                {client.email && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Email fontSize="small" color="action" />
                    <Typography variant="body2">{client.email}</Typography>
                  </Box>
                )}
                {client.phone && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Phone fontSize="small" color="action" />
                    <Typography variant="body2">{client.phone}</Typography>
                  </Box>
                )}
                {client.city && client.state && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <LocationOn fontSize="small" color="action" />
                    <Typography variant="body2">{client.city}, {client.state}</Typography>
                  </Box>
                )}
              </Box>
              {client.tags && client.tags.length > 0 && (
                <Box sx={{ display: 'flex', gap: 0.5, mt: 2 }}>
                  {client.tags.map((tag) => (
                    <Chip key={tag} label={tag} size="small" variant="outlined" />
                  ))}
                </Box>
              )}
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="body2" color="text.secondary">
                Agent: {client.agent?.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Since: {format(new Date(client.createdAt), 'MMM d, yyyy')}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Stats Row */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Policy sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4" fontWeight={700}>{client.policies?.length || 0}</Typography>
              <Typography variant="body2" color="text.secondary">Policies</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <RequestQuote sx={{ fontSize: 32, color: 'info.main', mb: 1 }} />
              <Typography variant="h4" fontWeight={700}>{client.quotes?.length || 0}</Typography>
              <Typography variant="body2" color="text.secondary">Quotes</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <ReportProblem sx={{ fontSize: 32, color: 'warning.main', mb: 1 }} />
              <Typography variant="h4" fontWeight={700}>{client.claims?.length || 0}</Typography>
              <Typography variant="body2" color="text.secondary">Claims</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <AttachMoney sx={{ fontSize: 32, color: 'success.main', mb: 1 }} />
              <Typography variant="h4" fontWeight={700}>
                ${client.policies?.reduce((sum: number, p: any) => sum + Number(p.premium || 0), 0).toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">Total Premium</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs Section */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
            <Tab label="Overview" />
            <Tab label={`Policies (${client.policies?.length || 0})`} />
            <Tab label={`Quotes (${client.quotes?.length || 0})`} />
            <Tab label={`Claims (${client.claims?.length || 0})`} />
            <Tab label="Documents" />
            <Tab label="Life Events" />
            <Tab label="Activity" />
          </Tabs>
        </Box>

        <CardContent>
          {/* Overview Tab */}
          {activeTab === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Contact Information
                </Typography>
                <List dense>
                  {client.email && (
                    <ListItem>
                      <ListItemIcon><Email /></ListItemIcon>
                      <ListItemText primary="Email" secondary={client.email} />
                    </ListItem>
                  )}
                  {client.phone && (
                    <ListItem>
                      <ListItemIcon><Phone /></ListItemIcon>
                      <ListItemText primary="Phone" secondary={client.phone} />
                    </ListItem>
                  )}
                  {client.mobile && (
                    <ListItem>
                      <ListItemIcon><Phone /></ListItemIcon>
                      <ListItemText primary="Mobile" secondary={client.mobile} />
                    </ListItem>
                  )}
                  {client.address && (
                    <ListItem>
                      <ListItemIcon><LocationOn /></ListItemIcon>
                      <ListItemText
                        primary="Address"
                        secondary={`${client.address}, ${client.city}, ${client.state} ${client.zipCode}`}
                      />
                    </ListItem>
                  )}
                  {client.dateOfBirth && (
                    <ListItem>
                      <ListItemIcon><Cake /></ListItemIcon>
                      <ListItemText
                        primary="Date of Birth"
                        secondary={format(new Date(client.dateOfBirth), 'MMMM d, yyyy')}
                      />
                    </ListItem>
                  )}
                </List>
              </Grid>

              {client.type === 'COMMERCIAL' && (
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Business Information
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemIcon><Work /></ListItemIcon>
                      <ListItemText primary="Business Type" secondary={client.businessType || '-'} />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><Event /></ListItemIcon>
                      <ListItemText primary="Years in Business" secondary={client.yearsInBusiness || '-'} />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><People /></ListItemIcon>
                      <ListItemText primary="Employees" secondary={client.numberOfEmployees || '-'} />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><AttachMoney /></ListItemIcon>
                      <ListItemText
                        primary="Annual Revenue"
                        secondary={client.annualRevenue ? `$${Number(client.annualRevenue).toLocaleString()}` : '-'}
                      />
                    </ListItem>
                  </List>
                </Grid>
              )}

              {client.notes && (
                <Grid item xs={12}>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Notes
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="body2">{client.notes}</Typography>
                  </Paper>
                </Grid>
              )}
            </Grid>
          )}

          {/* Policies Tab */}
          {activeTab === 1 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <Button startIcon={<Add />} variant="outlined" onClick={() => router.push(`/policies/new?clientId=${id}`)}>
                  Add Policy
                </Button>
              </Box>
              {client.policies?.length > 0 ? (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Policy Number</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Carrier</TableCell>
                        <TableCell>Premium</TableCell>
                        <TableCell>Effective</TableCell>
                        <TableCell>Expires</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {client.policies.map((policy: any) => (
                        <TableRow
                          key={policy.id}
                          hover
                          sx={{ cursor: 'pointer' }}
                          onClick={() => router.push(`/policies/${policy.id}`)}
                        >
                          <TableCell>{policy.policyNumber}</TableCell>
                          <TableCell>{policy.lineOfBusiness.replace(/_/g, ' ')}</TableCell>
                          <TableCell>{policy.carrier?.name}</TableCell>
                          <TableCell>${Number(policy.premium).toLocaleString()}</TableCell>
                          <TableCell>{format(new Date(policy.effectiveDate), 'MM/dd/yyyy')}</TableCell>
                          <TableCell>{format(new Date(policy.expirationDate), 'MM/dd/yyyy')}</TableCell>
                          <TableCell>
                            <Chip label={policy.status} size="small" color={getPolicyStatusColor(policy.status) as any} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  No policies found
                </Typography>
              )}
            </Box>
          )}

          {/* Quotes Tab */}
          {activeTab === 2 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <Button startIcon={<Add />} variant="outlined" onClick={() => router.push(`/quotes/new?clientId=${id}`)}>
                  New Quote
                </Button>
              </Box>
              {client.quotes?.length > 0 ? (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Quote Number</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Premium</TableCell>
                        <TableCell>Created</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {client.quotes.map((quote: any) => (
                        <TableRow
                          key={quote.id}
                          hover
                          sx={{ cursor: 'pointer' }}
                          onClick={() => router.push(`/quotes/${quote.id}`)}
                        >
                          <TableCell>{quote.quoteNumber}</TableCell>
                          <TableCell>{quote.lineOfBusiness.replace(/_/g, ' ')}</TableCell>
                          <TableCell>{quote.totalPremium ? `$${Number(quote.totalPremium).toLocaleString()}` : '-'}</TableCell>
                          <TableCell>{format(new Date(quote.createdAt), 'MM/dd/yyyy')}</TableCell>
                          <TableCell>
                            <Chip label={quote.status} size="small" color="info" />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  No quotes found
                </Typography>
              )}
            </Box>
          )}

          {/* Claims Tab */}
          {activeTab === 3 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <Button startIcon={<Add />} variant="outlined" onClick={() => router.push(`/claims/new?clientId=${id}`)}>
                  Report Claim
                </Button>
              </Box>
              {client.claims?.length > 0 ? (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Claim Number</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Date of Loss</TableCell>
                        <TableCell>Est. Loss</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {client.claims.map((claim: any) => (
                        <TableRow
                          key={claim.id}
                          hover
                          sx={{ cursor: 'pointer' }}
                          onClick={() => router.push(`/claims/${claim.id}`)}
                        >
                          <TableCell>{claim.claimNumber}</TableCell>
                          <TableCell>{claim.type}</TableCell>
                          <TableCell>{format(new Date(claim.dateOfLoss), 'MM/dd/yyyy')}</TableCell>
                          <TableCell>{claim.estimatedLoss ? `$${Number(claim.estimatedLoss).toLocaleString()}` : '-'}</TableCell>
                          <TableCell>
                            <Chip label={claim.status.replace(/_/g, ' ')} size="small" color="warning" />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  No claims found
                </Typography>
              )}
            </Box>
          )}

          {/* Documents Tab */}
          {activeTab === 4 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <Button startIcon={<Add />} variant="outlined" onClick={() => setDocumentDialogOpen(true)}>
                  Upload Document
                </Button>
              </Box>
              {client.documents?.length > 0 ? (
                <List>
                  {client.documents.map((doc: any) => (
                    <ListItem key={doc.id}>
                      <ListItemIcon><Description /></ListItemIcon>
                      <ListItemText
                        primary={doc.name}
                        secondary={`${doc.type} - Uploaded ${format(new Date(doc.uploadedAt), 'MMM d, yyyy')}`}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  No documents found
                </Typography>
              )}
            </Box>
          )}

          {/* Life Events Tab */}
          {activeTab === 5 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <Button startIcon={<Add />} variant="outlined" onClick={() => setLifeEventDialogOpen(true)}>
                  Add Life Event
                </Button>
              </Box>
              {client.lifeEvents?.length > 0 ? (
                <List>
                  {client.lifeEvents.map((event: any) => (
                    <ListItem key={event.id}>
                      <ListItemIcon><Event /></ListItemIcon>
                      <ListItemText
                        primary={event.title}
                        secondary={`${event.type} - ${format(new Date(event.eventDate), 'MMM d, yyyy')} - ${event.description || ''}`}
                      />
                      {!event.isCompleted && (
                        <Chip label="Pending" size="small" color="warning" />
                      )}
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  No life events found
                </Typography>
              )}
            </Box>
          )}

          {/* Activity Tab */}
          {activeTab === 6 && (
            <Box>
              {client.activities?.length > 0 ? (
                <List>
                  {client.activities.map((activity: any) => (
                    <ListItem key={activity.id}>
                      <ListItemText
                        primary={activity.title}
                        secondary={`${activity.description} - ${format(new Date(activity.createdAt), 'MMM d, yyyy h:mm a')}`}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  No activity found
                </Typography>
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Upload Document Dialog */}
      <Dialog open={documentDialogOpen} onClose={() => setDocumentDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Upload Document</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Document Name"
              value={documentForm.name}
              onChange={(e) => setDocumentForm({ ...documentForm, name: e.target.value })}
              fullWidth
              required
            />
            <FormControl fullWidth>
              <InputLabel>Document Type</InputLabel>
              <Select
                value={documentForm.type}
                label="Document Type"
                onChange={(e) => setDocumentForm({ ...documentForm, type: e.target.value })}
              >
                <MenuItem value="ID">ID / Identification</MenuItem>
                <MenuItem value="POLICY">Policy Document</MenuItem>
                <MenuItem value="CLAIM">Claim Document</MenuItem>
                <MenuItem value="APPLICATION">Application</MenuItem>
                <MenuItem value="ENDORSEMENT">Endorsement</MenuItem>
                <MenuItem value="INVOICE">Invoice</MenuItem>
                <MenuItem value="OTHER">Other</MenuItem>
              </Select>
            </FormControl>
            <Typography variant="body2" color="text.secondary">
              Note: File upload functionality requires additional backend configuration.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDocumentDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => documentMutation.mutate({ name: documentForm.name, type: documentForm.type })}
            disabled={!documentForm.name || documentMutation.isPending}
          >
            {documentMutation.isPending ? 'Adding...' : 'Add Document'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Life Event Dialog */}
      <Dialog open={lifeEventDialogOpen} onClose={() => setLifeEventDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Life Event</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Title"
              value={lifeEventForm.title}
              onChange={(e) => setLifeEventForm({ ...lifeEventForm, title: e.target.value })}
              fullWidth
              required
            />
            <FormControl fullWidth>
              <InputLabel>Event Type</InputLabel>
              <Select
                value={lifeEventForm.type}
                label="Event Type"
                onChange={(e) => setLifeEventForm({ ...lifeEventForm, type: e.target.value })}
              >
                <MenuItem value="MARRIAGE">Marriage</MenuItem>
                <MenuItem value="DIVORCE">Divorce</MenuItem>
                <MenuItem value="NEW_BABY">New Baby</MenuItem>
                <MenuItem value="HOME_PURCHASE">Home Purchase</MenuItem>
                <MenuItem value="HOME_SALE">Home Sale</MenuItem>
                <MenuItem value="NEW_VEHICLE">New Vehicle</MenuItem>
                <MenuItem value="RETIREMENT">Retirement</MenuItem>
                <MenuItem value="JOB_CHANGE">Job Change</MenuItem>
                <MenuItem value="BUSINESS_START">Business Start</MenuItem>
                <MenuItem value="OTHER">Other</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Event Date"
              type="date"
              value={lifeEventForm.eventDate}
              onChange={(e) => setLifeEventForm({ ...lifeEventForm, eventDate: e.target.value })}
              fullWidth
              InputLabelProps={{ shrink: true }}
              required
            />
            <TextField
              label="Description"
              value={lifeEventForm.description}
              onChange={(e) => setLifeEventForm({ ...lifeEventForm, description: e.target.value })}
              fullWidth
              multiline
              rows={3}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLifeEventDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => lifeEventMutation.mutate({
              title: lifeEventForm.title,
              type: lifeEventForm.type,
              eventDate: lifeEventForm.eventDate,
              description: lifeEventForm.description,
            })}
            disabled={!lifeEventForm.title || !lifeEventForm.eventDate || lifeEventMutation.isPending}
          >
            {lifeEventMutation.isPending ? 'Adding...' : 'Add Life Event'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
