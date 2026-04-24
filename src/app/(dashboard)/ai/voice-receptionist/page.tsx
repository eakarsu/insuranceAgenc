'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import {
  Box, Card, CardContent, Typography, Button, Grid, Avatar, Chip, Switch, FormControlLabel,
  List, ListItem, ListItemIcon, ListItemText, Alert, Paper, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Snackbar, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Slider, FormControl, InputLabel, Select, MenuItem, CircularProgress,
} from '@mui/material';
import {
  Mic, Phone, PhoneCallback, Schedule, Settings, PlayArrow, Stop, VolumeUp,
  CallReceived, Voicemail, QuestionAnswer, CheckCircle, Close, Send, AccessTime,
  RecordVoiceOver, Edit, Save, PhoneInTalk, CallEnd, AutoFixHigh,
} from '@mui/icons-material';

const recentCalls = [
  {
    id: '1',
    caller: '+1 (555) 123-4567',
    name: 'John Smith',
    duration: '2:34',
    result: 'Scheduled callback',
    time: '10 mins ago',
    type: 'incoming',
    transcript: 'Hi, I need to file a claim for my auto policy...',
  },
  {
    id: '2',
    caller: '+1 (555) 987-6543',
    name: 'Sarah Johnson',
    duration: '1:12',
    result: 'Transferred to agent',
    time: '25 mins ago',
    type: 'incoming',
    transcript: 'I would like to speak with someone about adding a driver...',
  },
  {
    id: '3',
    caller: '+1 (555) 456-7890',
    name: 'Michael Brown',
    duration: '3:45',
    result: 'Quote requested',
    time: '1 hour ago',
    type: 'incoming',
    transcript: 'I\'m looking to get a quote for homeowners insurance...',
  },
  {
    id: '4',
    caller: '+1 (555) 321-0987',
    name: 'Unknown',
    duration: '0:45',
    result: 'Left voicemail',
    time: '2 hours ago',
    type: 'missed',
    transcript: null,
  },
];

const stats = [
  { label: 'Calls Today', value: '127', icon: Phone, color: 'primary', gradient: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)' },
  { label: 'Resolution Rate', value: '89%', icon: PhoneCallback, color: 'success', gradient: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)' },
  { label: 'Avg. Call Duration', value: '1:42', icon: Schedule, color: 'info', gradient: 'linear-gradient(135deg, #e1f5fe 0%, #b3e5fc 100%)' },
  { label: 'Caller Satisfaction', value: '4.8', icon: VolumeUp, color: 'warning', gradient: 'linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%)' },
];

const getResultColor = (result: string) => {
  if (result.includes('callback') || result.includes('Quote')) return 'success';
  if (result.includes('Transferred')) return 'info';
  if (result.includes('voicemail')) return 'warning';
  return 'default';
};

export default function VoiceReceptionistPage() {
  const [isActive, setIsActive] = useState(true);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [hoursDialogOpen, setHoursDialogOpen] = useState(false);
  const [voicemailDialogOpen, setVoicemailDialogOpen] = useState(false);
  const [testCallDialogOpen, setTestCallDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });
  const [testPhoneNumber, setTestPhoneNumber] = useState('');

  // Twilio configuration query
  const { data: twilioConfig } = useQuery({
    queryKey: ['twilio-config'],
    queryFn: async () => {
      const response = await axios.get('/api/voice/test-call');
      return response.data;
    },
  });

  // Test call mutation
  const testCallMutation = useMutation({
    mutationFn: async (phoneNumber: string) => {
      const response = await axios.post('/api/voice/test-call', { phoneNumber });
      return response.data;
    },
    onSuccess: (data) => {
      setSnackbar({ open: true, message: `Call initiated! Call SID: ${data.callSid}` });
      setTestCallDialogOpen(false);
      setTestPhoneNumber('');
    },
    onError: (error: any) => {
      setSnackbar({ open: true, message: `Call failed: ${error.response?.data?.error || error.message}` });
    },
  });

  // Test Voice Agent state
  const [testMessage, setTestMessage] = useState('');
  const [testConversation, setTestConversation] = useState<{ role: 'user' | 'ai'; text: string }[]>([
    { role: 'ai', text: 'Hello! Thank you for calling Akarsu Insurance Agency. How may I help you today?' }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Configuration state
  const [greeting, setGreeting] = useState('Thank you for calling Akarsu Insurance Agency. How may I help you today?');
  const [voiceSpeed, setVoiceSpeed] = useState(1.0);
  const [voiceType, setVoiceType] = useState('female');

  // Business hours state
  const [businessHours, setBusinessHours] = useState({
    monday: { start: '09:00', end: '17:00', enabled: true },
    tuesday: { start: '09:00', end: '17:00', enabled: true },
    wednesday: { start: '09:00', end: '17:00', enabled: true },
    thursday: { start: '09:00', end: '17:00', enabled: true },
    friday: { start: '09:00', end: '17:00', enabled: true },
    saturday: { start: '10:00', end: '14:00', enabled: false },
    sunday: { start: '10:00', end: '14:00', enabled: false },
  });

  // Voicemail state
  const [voicemailGreeting, setVoicemailGreeting] = useState('We are currently unavailable. Please leave a message after the beep and we will return your call as soon as possible.');
  const [maxVoicemailLength, setMaxVoicemailLength] = useState(120);
  const [emailNotification, setEmailNotification] = useState(true);

  const handleTestSend = async () => {
    if (!testMessage.trim()) return;

    const userMessage = testMessage;
    setTestMessage('');
    setTestConversation(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsProcessing(true);

    // Simulate AI response (in production, this would call the AI API)
    setTimeout(() => {
      let aiResponse = '';
      const lowerMessage = userMessage.toLowerCase();

      if (lowerMessage.includes('claim')) {
        aiResponse = 'I can help you with a claim. Could you please tell me the type of claim (auto, home, or other) and when the incident occurred?';
      } else if (lowerMessage.includes('quote')) {
        aiResponse = 'I\'d be happy to help you get a quote. What type of insurance are you interested in? We offer auto, home, life, and commercial insurance.';
      } else if (lowerMessage.includes('payment') || lowerMessage.includes('bill')) {
        aiResponse = 'For payment inquiries, I can provide your current balance or help you make a payment. Would you like me to transfer you to our billing department?';
      } else if (lowerMessage.includes('agent') || lowerMessage.includes('speak') || lowerMessage.includes('person')) {
        aiResponse = 'I\'ll connect you with an agent right away. Please hold while I transfer your call. Your estimated wait time is 2 minutes.';
      } else if (lowerMessage.includes('hours') || lowerMessage.includes('open')) {
        aiResponse = 'Our office hours are Monday through Friday, 9 AM to 5 PM. We are closed on weekends and major holidays.';
      } else {
        aiResponse = 'I understand. Let me help you with that. Could you provide more details about what you need assistance with?';
      }

      setTestConversation(prev => [...prev, { role: 'ai', text: aiResponse }]);
      setIsProcessing(false);
    }, 1500);
  };

  const handleSaveConfig = () => {
    setConfigDialogOpen(false);
    setSnackbar({ open: true, message: 'Voice configuration saved successfully!' });
  };

  const handleSaveHours = () => {
    setHoursDialogOpen(false);
    setSnackbar({ open: true, message: 'Business hours updated successfully!' });
  };

  const handleSaveVoicemail = () => {
    setVoicemailDialogOpen(false);
    setSnackbar({ open: true, message: 'Voicemail settings saved successfully!' });
  };

  return (
    <Box className="animate-fade-in">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Mic sx={{ fontSize: 32, color: 'secondary.main' }} />
          <Box>
            <Typography variant="h4" fontWeight={700}>AI Voice Receptionist</Typography>
            <Typography color="text.secondary">24/7 automated phone answering with natural language AI</Typography>
          </Box>
        </Box>
        <FormControlLabel
          control={
            <Switch
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              color="success"
              size="medium"
            />
          }
          label={
            <Chip
              label={isActive ? 'Active' : 'Paused'}
              color={isActive ? 'success' : 'default'}
              size="small"
            />
          }
        />
      </Box>

      {/* Twilio Status */}
      {twilioConfig?.configured ? (
        <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }} icon={<Phone />}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <Box>
              <Typography variant="body2" fontWeight={600}>Twilio Connected</Typography>
              <Typography variant="caption">
                Phone: {twilioConfig.phoneNumber} | Webhook: {twilioConfig.webhookUrl}
              </Typography>
            </Box>
            <Button
              size="small"
              variant="contained"
              color="success"
              startIcon={<PhoneInTalk />}
              onClick={() => setTestCallDialogOpen(true)}
            >
              Make Test Call
            </Button>
          </Box>
        </Alert>
      ) : (
        <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
          Twilio not configured. Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER to .env
        </Alert>
      )}

      <Alert
        severity={isActive ? 'success' : 'warning'}
        sx={{ mb: 3, borderRadius: 2 }}
        icon={isActive ? <CheckCircle /> : <Voicemail />}
      >
        {isActive
          ? 'AI Voice Receptionist is active and handling incoming calls. Average wait time: 0 seconds.'
          : 'AI Voice Receptionist is paused. Incoming calls will be routed to voicemail.'}
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

      <Grid container spacing={3}>
        {/* Recent Calls */}
        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>Recent Calls</Typography>
              <List disablePadding>
                {recentCalls.map((call, idx) => (
                  <Paper
                    key={call.id}
                    variant="outlined"
                    sx={{
                      mb: idx < recentCalls.length - 1 ? 2 : 0,
                      borderRadius: 2,
                      overflow: 'hidden',
                      transition: 'all 0.2s',
                      '&:hover': { boxShadow: 2 },
                    }}
                  >
                    <ListItem sx={{ py: 2, px: 3, alignItems: 'flex-start' }}>
                      <ListItemIcon>
                        <Avatar
                          sx={{
                            bgcolor: call.type === 'missed' ? 'error.light' : 'primary.light',
                            color: call.type === 'missed' ? 'error.main' : 'primary.main',
                          }}
                        >
                          {call.type === 'missed' ? <Voicemail /> : <CallReceived />}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box>
                              <Typography fontWeight={600}>{call.name}</Typography>
                              <Typography variant="body2" color="text.secondary">{call.caller}</Typography>
                            </Box>
                            <Box sx={{ textAlign: 'right' }}>
                              <Chip
                                label={call.result}
                                size="small"
                                color={getResultColor(call.result) as any}
                              />
                              <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                                Duration: {call.duration} | {call.time}
                              </Typography>
                            </Box>
                          </Box>
                        }
                        secondary={
                          call.transcript && (
                            <Box sx={{ mt: 1, p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                                <QuestionAnswer fontSize="small" /> Transcript Preview
                              </Typography>
                              <Typography variant="body2" color="text.primary" sx={{ fontStyle: 'italic' }}>
                                "{call.transcript}"
                              </Typography>
                            </Box>
                          )
                        }
                      />
                    </ListItem>
                  </Paper>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions & Settings */}
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3, mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>Quick Actions</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<PlayArrow />}
                  fullWidth
                  size="large"
                  onClick={() => setTestDialogOpen(true)}
                >
                  Test Voice Agent
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Settings />}
                  fullWidth
                  size="large"
                  onClick={() => setConfigDialogOpen(true)}
                >
                  Configure Responses
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Schedule />}
                  fullWidth
                  size="large"
                  onClick={() => setHoursDialogOpen(true)}
                >
                  Set Business Hours
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Voicemail />}
                  fullWidth
                  size="large"
                  onClick={() => setVoicemailDialogOpen(true)}
                >
                  Voicemail Settings
                </Button>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>AI Capabilities</Typography>
              <List dense disablePadding>
                {[
                  'Answer policy questions',
                  'Schedule appointments',
                  'Create claim intakes',
                  'Transfer to agents',
                  'Take messages',
                  'Process payments',
                ].map((capability, i) => (
                  <ListItem key={i} sx={{ px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <CheckCircle color="success" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary={capability}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Features Info */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={4}>
          <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Mic color="primary" />
              <Typography variant="subtitle1" fontWeight={600}>Natural Conversation</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              AI understands natural language and responds like a human receptionist, handling complex inquiries with ease.
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Schedule color="success" />
              <Typography variant="subtitle1" fontWeight={600}>24/7 Availability</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Never miss a call again. AI receptionist answers calls around the clock, including holidays and weekends.
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <PhoneCallback color="info" />
              <Typography variant="subtitle1" fontWeight={600}>Smart Routing</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Intelligently routes calls to the right agent or department based on caller needs and agent availability.
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Test Voice Agent Dialog */}
      <Dialog open={testDialogOpen} onClose={() => setTestDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <RecordVoiceOver color="primary" />
            <Typography variant="h6">Test Voice Agent</Typography>
          </Box>
          <IconButton onClick={() => setTestDialogOpen(false)}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Alert severity="info" sx={{ mb: 2 }}>
            Type a message to simulate a caller inquiry. The AI will respond as it would on a real call.
          </Alert>

          {/* Sample Test Data */}
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 2, bgcolor: 'grey.50', border: '1px dashed', borderColor: 'grey.300' }}>
            <Typography variant="caption" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary', mb: 1 }}>
              <AutoFixHigh fontSize="small" /> SAMPLE TEST DATA
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <Chip label="File a Claim" size="small" variant="outlined" color="primary" sx={{ cursor: 'pointer' }}
                onClick={() => setTestMessage('Hi, I was just in a car accident about an hour ago. My name is Robert Thompson and my policy number is POL-2024-00456. The other driver hit me from behind at a stop sign. I need to file a claim right away.')} />
              <Chip label="Get a Quote" size="small" variant="outlined" color="primary" sx={{ cursor: 'pointer' }}
                onClick={() => setTestMessage('Hello, I am looking to get a quote for homeowners insurance. I just purchased a house at 234 Oak Street. It is a 3-bedroom, 2-bathroom home built in 2015, about 2,100 square feet. What do I need to get a quote?')} />
              <Chip label="Payment Issue" size="small" variant="outlined" color="primary" sx={{ cursor: 'pointer' }}
                onClick={() => setTestMessage('I received a cancellation notice saying my policy will be cancelled for non-payment, but I set up autopay last month. My name is Lisa Chen and my policy number is POL-2024-00789. Can someone help me figure out what happened?')} />
            </Box>
          </Paper>

          <Paper sx={{ p: 2, maxHeight: 300, overflow: 'auto', bgcolor: 'grey.50', mb: 2 }}>
            {testConversation.map((msg, idx) => (
              <Box
                key={idx}
                sx={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  mb: 1,
                }}
              >
                <Paper
                  sx={{
                    p: 1.5,
                    maxWidth: '80%',
                    bgcolor: msg.role === 'user' ? 'primary.main' : 'white',
                    color: msg.role === 'user' ? 'white' : 'text.primary',
                  }}
                >
                  <Typography variant="body2">{msg.text}</Typography>
                </Paper>
              </Box>
            ))}
            {isProcessing && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                <Paper sx={{ p: 1.5, bgcolor: 'white' }}>
                  <Typography variant="body2" color="text.secondary">AI is responding...</Typography>
                </Paper>
              </Box>
            )}
          </Paper>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              placeholder="Type your message (e.g., 'I need to file a claim')"
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleTestSend()}
              disabled={isProcessing}
            />
            <Button
              variant="contained"
              onClick={handleTestSend}
              disabled={isProcessing || !testMessage.trim()}
            >
              <Send />
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setTestConversation([{ role: 'ai', text: 'Hello! Thank you for calling Akarsu Insurance Agency. How may I help you today?' }]);
          }}>
            Reset Conversation
          </Button>
          <Button onClick={() => setTestDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Configure Responses Dialog */}
      <Dialog open={configDialogOpen} onClose={() => setConfigDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Settings color="primary" />
            <Typography variant="h6">Configure Voice Agent</Typography>
          </Box>
          <IconButton onClick={() => setConfigDialogOpen(false)}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <TextField
            fullWidth
            label="Greeting Message"
            multiline
            rows={3}
            value={greeting}
            onChange={(e) => setGreeting(e.target.value)}
            sx={{ mb: 3 }}
          />
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Voice Type</InputLabel>
            <Select value={voiceType} label="Voice Type" onChange={(e) => setVoiceType(e.target.value)}>
              <MenuItem value="female">Female (Professional)</MenuItem>
              <MenuItem value="male">Male (Professional)</MenuItem>
              <MenuItem value="female-friendly">Female (Friendly)</MenuItem>
              <MenuItem value="male-friendly">Male (Friendly)</MenuItem>
            </Select>
          </FormControl>
          <Box sx={{ mb: 2 }}>
            <Typography gutterBottom>Speech Speed: {voiceSpeed.toFixed(1)}x</Typography>
            <Slider
              value={voiceSpeed}
              onChange={(_, value) => setVoiceSpeed(value as number)}
              min={0.5}
              max={1.5}
              step={0.1}
              marks={[
                { value: 0.5, label: 'Slow' },
                { value: 1.0, label: 'Normal' },
                { value: 1.5, label: 'Fast' },
              ]}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfigDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" startIcon={<Save />} onClick={handleSaveConfig}>
            Save Configuration
          </Button>
        </DialogActions>
      </Dialog>

      {/* Business Hours Dialog */}
      <Dialog open={hoursDialogOpen} onClose={() => setHoursDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccessTime color="primary" />
            <Typography variant="h6">Business Hours</Typography>
          </Box>
          <IconButton onClick={() => setHoursDialogOpen(false)}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Alert severity="info" sx={{ mb: 2 }}>
            Set hours when the AI receptionist should answer calls. Outside these hours, calls go to voicemail.
          </Alert>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Day</TableCell>
                  <TableCell>Enabled</TableCell>
                  <TableCell>Start</TableCell>
                  <TableCell>End</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(businessHours).map(([day, hours]) => (
                  <TableRow key={day}>
                    <TableCell sx={{ textTransform: 'capitalize' }}>{day}</TableCell>
                    <TableCell>
                      <Switch
                        checked={hours.enabled}
                        onChange={(e) => setBusinessHours({
                          ...businessHours,
                          [day]: { ...hours, enabled: e.target.checked }
                        })}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="time"
                        size="small"
                        value={hours.start}
                        onChange={(e) => setBusinessHours({
                          ...businessHours,
                          [day]: { ...hours, start: e.target.value }
                        })}
                        disabled={!hours.enabled}
                        sx={{ width: 120 }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="time"
                        size="small"
                        value={hours.end}
                        onChange={(e) => setBusinessHours({
                          ...businessHours,
                          [day]: { ...hours, end: e.target.value }
                        })}
                        disabled={!hours.enabled}
                        sx={{ width: 120 }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHoursDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" startIcon={<Save />} onClick={handleSaveHours}>
            Save Hours
          </Button>
        </DialogActions>
      </Dialog>

      {/* Voicemail Settings Dialog */}
      <Dialog open={voicemailDialogOpen} onClose={() => setVoicemailDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Voicemail color="primary" />
            <Typography variant="h6">Voicemail Settings</Typography>
          </Box>
          <IconButton onClick={() => setVoicemailDialogOpen(false)}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <TextField
            fullWidth
            label="Voicemail Greeting"
            multiline
            rows={3}
            value={voicemailGreeting}
            onChange={(e) => setVoicemailGreeting(e.target.value)}
            sx={{ mb: 3 }}
          />
          <Box sx={{ mb: 3 }}>
            <Typography gutterBottom>Max Message Length: {maxVoicemailLength} seconds</Typography>
            <Slider
              value={maxVoicemailLength}
              onChange={(_, value) => setMaxVoicemailLength(value as number)}
              min={30}
              max={300}
              step={30}
              marks={[
                { value: 30, label: '30s' },
                { value: 120, label: '2min' },
                { value: 300, label: '5min' },
              ]}
            />
          </Box>
          <FormControlLabel
            control={
              <Switch
                checked={emailNotification}
                onChange={(e) => setEmailNotification(e.target.checked)}
              />
            }
            label="Send email notification for new voicemails"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVoicemailDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" startIcon={<Save />} onClick={handleSaveVoicemail}>
            Save Settings
          </Button>
        </DialogActions>
      </Dialog>

      {/* Test Call Dialog */}
      <Dialog open={testCallDialogOpen} onClose={() => setTestCallDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PhoneInTalk color="success" />
            <Typography variant="h6">Make Test Call</Typography>
          </Box>
          <IconButton onClick={() => setTestCallDialogOpen(false)}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            The AI receptionist will call this number and you can test the conversation.
          </Alert>
          <TextField
            fullWidth
            label="Phone Number"
            placeholder="+1 (555) 123-4567"
            value={testPhoneNumber}
            onChange={(e) => setTestPhoneNumber(e.target.value)}
            helperText="Enter a phone number with country code (e.g., +1 for US)"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTestCallDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="success"
            startIcon={testCallMutation.isPending ? <CircularProgress size={20} color="inherit" /> : <Phone />}
            onClick={() => testCallMutation.mutate(testPhoneNumber)}
            disabled={!testPhoneNumber || testCallMutation.isPending}
          >
            {testCallMutation.isPending ? 'Calling...' : 'Call Now'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />
    </Box>
  );
}
