'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
  Box, Card, CardContent, Typography, Button, Grid, TextField, Alert,
  Paper, Chip, List, ListItem, ListItemText, Divider, CircularProgress,
} from '@mui/material';
import {
  Phone, CallEnd, PhoneInTalk, Business, LocalHospital, Restaurant,
  DirectionsCar, Hotel, AccountBalance, HomeWork,
} from '@mui/icons-material';
import StatusBadge from '@/components/ui/StatusBadge';
import { INDUSTRY_CONFIGS } from '@/lib/industry-config';

const INDUSTRY_ICONS: Record<string, any> = {
  dentistry: LocalHospital,
  restaurants: Restaurant,
  health_clinics: LocalHospital,
  real_estate: HomeWork,
  car_dealerships: DirectionsCar,
  hospitality: Hotel,
  debt_collection: AccountBalance,
};

interface TranscriptEntry {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export default function VoiceAgentDetailPage() {
  const params = useParams();
  const industryId = params.id as string;
  const industry = INDUSTRY_CONFIGS[industryId];

  const [phoneNumber, setPhoneNumber] = useState('');
  const [provider, setProvider] = useState<'twilio' | 'vapi'>('twilio');
  const [agentName, setAgentName] = useState('');
  const [customGreeting, setCustomGreeting] = useState('');
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [callSid, setCallSid] = useState<string | null>(null);
  const [callStatus, setCallStatus] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  // Poll for call status
  useEffect(() => {
    if (!callSid) return;

    const poll = async () => {
      try {
        const res = await fetch(`/api/voice/call/status/${callSid}`);
        const data = await res.json();
        setCallStatus(data.status);
        setTranscript(data.transcript || []);

        if (data.status === 'completed' || data.status === 'failed' || data.status === 'busy' || data.status === 'no-answer') {
          stopPolling();
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    };

    poll(); // Initial poll
    pollRef.current = setInterval(poll, 2000);

    return () => stopPolling();
  }, [callSid, stopPolling]);

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  const handleMakeCall = async () => {
    if (!phoneNumber.trim()) {
      setError('Please enter a phone number');
      return;
    }

    setIsLoading(true);
    setError(null);
    setTranscript([]);
    setCallStatus(null);

    try {
      const res = await fetch('/api/voice/call/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: industryId,
          phoneNumber: phoneNumber.trim(),
          industry: industryId,
          agentName: agentName || industry?.name + ' Assistant',
          greeting: customGreeting || undefined,
          conversationGoal: selectedGoal || undefined,
          provider,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to initiate call');
      }

      setCallSid(data.callSid);
      setCallStatus(data.status);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const isCallActive = callStatus === 'initiating' || callStatus === 'ringing' || callStatus === 'in-progress';

  if (!industry) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Industry &quot;{industryId}&quot; not found. Valid options: {Object.keys(INDUSTRY_CONFIGS).join(', ')}
        </Alert>
      </Box>
    );
  }

  const IconComponent = INDUSTRY_ICONS[industryId] || Business;

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <IconComponent sx={{ fontSize: 40, color: 'primary.main' }} />
        <Box>
          <Typography variant="h4">{industry.name} Voice Agent</Typography>
          <Typography variant="body2" color="text.secondary">
            AI-powered outbound calling with industry-specific conversation
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Left Column - Configuration & Call */}
        <Grid item xs={12} md={6}>
          {/* Agent Configuration */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Agent Configuration</Typography>

              <TextField
                fullWidth
                label="Agent Name"
                placeholder={`${industry.name} Assistant`}
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                sx={{ mb: 2 }}
                size="small"
              />

              <TextField
                fullWidth
                label="Custom Greeting"
                placeholder={industry.defaultGreeting}
                value={customGreeting}
                onChange={(e) => setCustomGreeting(e.target.value)}
                multiline
                rows={2}
                sx={{ mb: 2 }}
                size="small"
              />

              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Conversation Goals
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {industry.conversationGoals.map((goal, i) => (
                  <Chip
                    key={i}
                    label={goal}
                    clickable
                    onClick={() => setSelectedGoal(selectedGoal === goal ? null : goal)}
                    variant={selectedGoal === goal ? 'filled' : 'outlined'}
                    color={selectedGoal === goal ? 'primary' : 'default'}
                    sx={{
                      height: 'auto',
                      py: 1,
                      px: 0.5,
                      '& .MuiChip-label': {
                        whiteSpace: 'normal',
                        fontSize: '0.85rem',
                      },
                      ...(selectedGoal === goal && {
                        boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.5)',
                        fontWeight: 600,
                      }),
                    }}
                  />
                ))}
              </Box>

              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Escalation Triggers
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {industry.escalationTriggers.map((trigger, i) => (
                  <Chip key={i} label={trigger} size="small" color="warning" variant="outlined" />
                ))}
              </Box>
            </CardContent>
          </Card>

          {/* Make Call Section */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Phone sx={{ mr: 1, verticalAlign: 'middle' }} />
                Make Call
              </Typography>

              {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                  {error}
                </Alert>
              )}

              {selectedGoal && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    <strong>Focus Goal:</strong> {selectedGoal}
                  </Typography>
                </Alert>
              )}

              <TextField
                select
                fullWidth
                label="Call Provider"
                value={provider}
                onChange={(e) => setProvider(e.target.value as 'twilio' | 'vapi')}
                disabled={isCallActive}
                sx={{ mb: 2 }}
                size="small"
                SelectProps={{ native: true }}
              >
                <option value="twilio">Twilio (Default)</option>
                <option value="vapi">Vapi.ai</option>
              </TextField>

              <TextField
                fullWidth
                label="Phone Number"
                placeholder="+1 (555) 123-4567"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                disabled={isCallActive}
                sx={{ mb: 2 }}
                size="small"
              />

              <Button
                variant="contained"
                fullWidth
                size="large"
                onClick={handleMakeCall}
                disabled={isLoading || isCallActive || !phoneNumber.trim()}
                startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : isCallActive ? <PhoneInTalk /> : <Phone />}
                color={isCallActive ? 'warning' : 'success'}
                sx={{ mb: 2 }}
              >
                {isLoading ? 'Initiating...' : isCallActive ? 'Call In Progress' : 'Make Call'}
              </Button>

              {callStatus && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" color="text.secondary">Status:</Typography>
                  <StatusBadge status={callStatus} />
                  {callSid && (
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                      {callSid.slice(0, 12)}...
                    </Typography>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column - Live Transcript */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', minHeight: 500 }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" gutterBottom>
                Live Transcript
                {isCallActive && (
                  <CircularProgress size={16} sx={{ ml: 1, verticalAlign: 'middle' }} />
                )}
              </Typography>

              <Paper
                variant="outlined"
                sx={{
                  flex: 1,
                  overflow: 'auto',
                  p: 2,
                  bgcolor: 'grey.50',
                  minHeight: 400,
                }}
              >
                {transcript.length === 0 ? (
                  <Typography color="text.secondary" sx={{ textAlign: 'center', mt: 4 }}>
                    {callSid ? 'Waiting for conversation...' : 'Start a call to see the live transcript'}
                  </Typography>
                ) : (
                  <List disablePadding>
                    {transcript.map((entry, i) => (
                      <ListItem
                        key={i}
                        sx={{
                          flexDirection: 'column',
                          alignItems: entry.role === 'assistant' ? 'flex-start' : 'flex-end',
                          px: 0,
                        }}
                      >
                        <Chip
                          label={entry.role === 'assistant' ? 'AI' : 'Caller'}
                          size="small"
                          color={entry.role === 'assistant' ? 'primary' : 'default'}
                          sx={{ mb: 0.5 }}
                        />
                        <Paper
                          sx={{
                            p: 1.5,
                            maxWidth: '85%',
                            bgcolor: entry.role === 'assistant' ? 'primary.50' : 'white',
                            border: 1,
                            borderColor: entry.role === 'assistant' ? 'primary.200' : 'grey.300',
                          }}
                        >
                          <Typography variant="body2">{entry.content}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(entry.timestamp).toLocaleTimeString()}
                          </Typography>
                        </Paper>
                        {i < transcript.length - 1 && <Divider sx={{ my: 1, width: '100%' }} />}
                      </ListItem>
                    ))}
                    <div ref={transcriptEndRef} />
                  </List>
                )}
              </Paper>
            </CardContent>
          </Card>
        </Grid>

        {/* Compliance Notes */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Compliance Notes</Typography>
              <Grid container spacing={1}>
                {industry.complianceNotes.map((note, i) => (
                  <Grid item xs={12} sm={6} key={i}>
                    <Alert severity="info" sx={{ py: 0 }}>{note}</Alert>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
