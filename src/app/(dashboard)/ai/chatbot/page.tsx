'use client';

import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  Box, Card, CardContent, Typography, Grid, TextField, Button, FormControl, Autocomplete,
  CircularProgress, Paper, Chip, Avatar, IconButton, InputLabel, Select, MenuItem,
} from '@mui/material';
import { SmartToy, Send, Person, Delete, Add, AutoFixHigh } from '@mui/icons-material';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const quickPrompts = [
  'Explain this coverage type',
  'Draft a response to a client',
  'What are the compliance requirements?',
  'Help me with a renewal strategy',
  'Explain deductible options',
];

export default function ChatbotPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [contextType, setContextType] = useState('');
  const [contextId, setContextId] = useState('');
  const [contextData, setContextData] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: clients = [] } = useQuery({
    queryKey: ['clients-list'],
    queryFn: async () => {
      const response = await axios.get('/api/clients?limit=100');
      return response.data.clients || [];
    },
  });

  const { data: policies = [] } = useQuery({
    queryKey: ['policies-list'],
    queryFn: async () => {
      const response = await axios.get('/api/policies?limit=100');
      return response.data.policies || [];
    },
  });

  const { data: claimsList = [] } = useQuery({
    queryKey: ['claims-list'],
    queryFn: async () => {
      const response = await axios.get('/api/claims?limit=100');
      return response.data.claims || [];
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (contextType && contextId) {
      const fetchContext = async () => {
        try {
          const endpoint = contextType === 'client' ? `/api/clients/${contextId}`
            : contextType === 'policy' ? `/api/policies/${contextId}`
            : `/api/claims/${contextId}`;
          const response = await axios.get(endpoint);
          setContextData(response.data);
        } catch {
          setContextData(null);
        }
      };
      fetchContext();
    } else {
      setContextData(null);
    }
  }, [contextType, contextId]);

  const sendMessage = async (text?: string) => {
    const messageText = text || input;
    if (!messageText.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: messageText };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await axios.post('/api/ai/chat', {
        messages: newMessages,
        context: contextData,
      });
      setMessages([...newMessages, { role: 'assistant', content: response.data.message }]);
    } catch {
      setMessages([...newMessages, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getContextOptions = () => {
    if (contextType === 'client') return clients;
    if (contextType === 'policy') return policies;
    if (contextType === 'claim') return claimsList;
    return [];
  };

  const getContextLabel = (option: any) => {
    if (contextType === 'client') {
      return option.businessName || `${option.firstName} ${option.lastName}`;
    }
    if (contextType === 'policy') return option.policyNumber || option.id;
    if (contextType === 'claim') return option.claimNumber || option.id;
    return option.id;
  };

  return (
    <Box className="animate-fade-in">
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <SmartToy sx={{ fontSize: 32, color: 'primary.main' }} />
        <Box>
          <Typography variant="h4" fontWeight={700}>AI Chatbot</Typography>
          <Typography color="text.secondary">Your intelligent insurance assistant</Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Context Panel */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>Context</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Optionally share a record to give the AI more context.
              </Typography>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Context Type</InputLabel>
                <Select value={contextType} label="Context Type" onChange={(e) => { setContextType(e.target.value); setContextId(''); }}>
                  <MenuItem value="">None</MenuItem>
                  <MenuItem value="client">Client</MenuItem>
                  <MenuItem value="policy">Policy</MenuItem>
                  <MenuItem value="claim">Claim</MenuItem>
                </Select>
              </FormControl>

              {contextType && (
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <Autocomplete
                    options={getContextOptions()}
                    getOptionLabel={getContextLabel}
                    value={getContextOptions().find((o: any) => o.id === contextId) || null}
                    onChange={(_, value) => setContextId(value?.id || '')}
                    renderInput={(params) => <TextField {...params} label={`Select ${contextType}`} />}
                  />
                </FormControl>
              )}

              {contextData && (
                <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, bgcolor: 'primary.50' }}>
                  <Typography variant="caption" color="primary.main" fontWeight={600}>Context Loaded</Typography>
                </Paper>
              )}

              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" gutterBottom>Quick Prompts</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  {quickPrompts.map((qp) => (
                    <Chip
                      key={qp}
                      label={qp}
                      size="small"
                      variant="outlined"
                      onClick={() => sendMessage(qp)}
                      sx={{ cursor: 'pointer', justifyContent: 'flex-start' }}
                    />
                  ))}
                </Box>
              </Box>

              {/* Sample Test Conversations */}
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mt: 3, bgcolor: 'grey.50', border: '1px dashed', borderColor: 'grey.300' }}>
                <Typography variant="caption" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary', mb: 1 }}>
                  <AutoFixHigh fontSize="small" /> SAMPLE TEST DATA
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Chip label="Claims Question" size="small" variant="outlined" color="primary" sx={{ cursor: 'pointer', justifyContent: 'flex-start' }}
                    onClick={() => setInput('My client John Smith had a car accident last week on Highway 101. The other driver ran a red light. John has a personal auto policy with $100,000/$300,000 BI limits and $500 collision deductible. What are the steps to file this claim and what coverage applies?')} />
                  <Chip label="Coverage Advice" size="small" variant="outlined" color="primary" sx={{ cursor: 'pointer', justifyContent: 'flex-start' }}
                    onClick={() => setInput('I have a commercial client who runs a restaurant with a liquor license. They currently have a BOP policy but I think they might need additional coverage. Can you recommend what endorsements or additional policies they should consider?')} />
                  <Chip label="Compliance Help" size="small" variant="outlined" color="primary" sx={{ cursor: 'pointer', justifyContent: 'flex-start' }}
                    onClick={() => setInput('What are the minimum auto insurance requirements in California for 2025? My client wants to know if they can reduce their coverage limits to save money. What should I advise them?')} />
                </Box>
              </Paper>

              <Button
                fullWidth
                variant="outlined"
                size="small"
                startIcon={<Delete />}
                onClick={() => setMessages([])}
                sx={{ mt: 3 }}
                disabled={messages.length === 0}
              >
                Clear Chat
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Chat Panel */}
        <Grid item xs={12} md={9}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ p: 3, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 500 }}>
              {/* Messages */}
              <Box sx={{ flex: 1, overflow: 'auto', mb: 2 }}>
                {messages.length === 0 && (
                  <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
                    <SmartToy sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                    <Typography variant="h6" gutterBottom>How can I help you today?</Typography>
                    <Typography variant="body2">Ask me anything about insurance - coverage, compliance, client management, and more.</Typography>
                  </Box>
                )}

                {messages.map((msg, i) => (
                  <Box
                    key={i}
                    sx={{
                      display: 'flex',
                      gap: 1.5,
                      mb: 2,
                      flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 32, height: 32,
                        bgcolor: msg.role === 'user' ? 'primary.main' : 'secondary.main',
                      }}
                    >
                      {msg.role === 'user' ? <Person sx={{ fontSize: 18 }} /> : <SmartToy sx={{ fontSize: 18 }} />}
                    </Avatar>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        maxWidth: '70%',
                        borderRadius: 2,
                        bgcolor: msg.role === 'user' ? 'primary.50' : 'grey.100',
                        border: '1px solid',
                        borderColor: msg.role === 'user' ? 'primary.light' : 'divider',
                      }}
                    >
                      <Typography variant="body2" sx={{ lineHeight: 1.7, whiteSpace: 'pre-line' }}>
                        {msg.content}
                      </Typography>
                    </Paper>
                  </Box>
                ))}

                {isLoading && (
                  <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                      <SmartToy sx={{ fontSize: 18 }} />
                    </Avatar>
                    <Paper elevation={0} sx={{ p: 2, borderRadius: 2, bgcolor: 'grey.100' }}>
                      <CircularProgress size={20} />
                    </Paper>
                  </Box>
                )}

                <div ref={messagesEndRef} />
              </Box>

              {/* Input */}
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  multiline
                  maxRows={3}
                  placeholder="Type your message..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  size="small"
                />
                <IconButton
                  color="primary"
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || isLoading}
                  sx={{ bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' }, '&:disabled': { bgcolor: 'grey.300' } }}
                >
                  <Send />
                </IconButton>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
