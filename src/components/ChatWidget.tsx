'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box, Fab, Paper, Typography, TextField, IconButton, Chip,
  Avatar, Fade, CircularProgress, Badge,
} from '@mui/material';
import {
  Chat as ChatIcon, Close, Send, SmartToy, Person,
  ArrowDownward,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import axios from 'axios';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface SuggestedAction {
  label: string;
  action: string;
}

export default function ChatWidget() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedActions, setSuggestedActions] = useState<SuggestedAction[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  // Add welcome message when opened for the first time
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: "Hello! I'm your InsureFlow AI assistant. I can help with your policies, claims, payments, documents, and coverage questions. What can I help you with today?",
      }]);
      setSuggestedActions([
        { label: 'View my policies', action: '/portal/policies' },
        { label: 'File a claim', action: '/portal/claims' },
        { label: 'Make a payment', action: '/portal/payments' },
      ]);
    }
  }, [open, messages.length]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMessage: Message = { role: 'user', content: trimmed };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);
    setSuggestedActions([]);

    try {
      // Send only user/assistant history (skip welcome message context)
      const history = updatedMessages.filter((_, i) => i > 0 || updatedMessages[0].role === 'user');

      const response = await axios.post('/api/customer/chat', {
        message: trimmed,
        history: history.slice(-10), // Last 10 messages for context
      });

      const assistantMessage: Message = {
        role: 'assistant',
        content: response.data.message,
      };
      setMessages((prev) => [...prev, assistantMessage]);

      if (response.data.suggestedActions?.length > 0) {
        setSuggestedActions(response.data.suggestedActions);
      }
    } catch (error: any) {
      const errorMsg = error.response?.status === 401
        ? 'Your session has expired. Please log in again.'
        : 'Sorry, I had trouble processing that. Please try again.';
      setMessages((prev) => [...prev, { role: 'assistant', content: errorMsg }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleActionClick = (action: string) => {
    if (action.startsWith('/')) {
      router.push(action);
      setOpen(false);
    }
  };

  return (
    <>
      {/* Chat FAB */}
      <Fade in={!open}>
        <Badge
          badgeContent={messages.length === 0 ? '!' : 0}
          color="error"
          sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1200 }}
        >
          <Fab
            color="primary"
            onClick={() => setOpen(true)}
            sx={{
              width: 64,
              height: 64,
              background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
              boxShadow: '0 4px 20px rgba(25, 118, 210, 0.4)',
              '&:hover': {
                background: 'linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)',
                transform: 'scale(1.05)',
              },
              transition: 'all 0.2s ease',
            }}
          >
            <SmartToy sx={{ fontSize: 32 }} />
          </Fab>
        </Badge>
      </Fade>

      {/* Chat Window */}
      <Fade in={open}>
        <Paper
          elevation={8}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            width: { xs: 'calc(100vw - 32px)', sm: 400 },
            height: { xs: 'calc(100vh - 100px)', sm: 560 },
            borderRadius: 3,
            display: open ? 'flex' : 'none',
            flexDirection: 'column',
            overflow: 'hidden',
            zIndex: 1300,
          }}
        >
          {/* Header */}
          <Box
            sx={{
              background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
              color: 'white',
              p: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
            }}
          >
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 40, height: 40 }}>
              <SmartToy />
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" fontWeight={700}>InsureFlow AI</Typography>
              <Typography variant="caption" sx={{ opacity: 0.85 }}>
                Always here to help
              </Typography>
            </Box>
            <IconButton size="small" onClick={() => setOpen(false)} sx={{ color: 'white' }}>
              <Close />
            </IconButton>
          </Box>

          {/* Messages */}
          <Box
            sx={{
              flex: 1,
              overflow: 'auto',
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5,
              bgcolor: '#f8f9fa',
            }}
          >
            {messages.map((msg, i) => (
              <Box
                key={i}
                sx={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  gap: 1,
                  alignItems: 'flex-end',
                }}
              >
                {msg.role === 'assistant' && (
                  <Avatar sx={{ width: 28, height: 28, bgcolor: '#1976d2', mb: 0.5 }}>
                    <SmartToy sx={{ fontSize: 16 }} />
                  </Avatar>
                )}
                <Paper
                  elevation={0}
                  sx={{
                    px: 2,
                    py: 1.25,
                    maxWidth: '80%',
                    borderRadius: msg.role === 'user'
                      ? '16px 16px 4px 16px'
                      : '16px 16px 16px 4px',
                    bgcolor: msg.role === 'user' ? '#1976d2' : 'white',
                    color: msg.role === 'user' ? 'white' : 'text.primary',
                    border: msg.role === 'assistant' ? '1px solid' : 'none',
                    borderColor: 'divider',
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      whiteSpace: 'pre-wrap',
                      lineHeight: 1.5,
                      '& strong': { fontWeight: 700 },
                    }}
                    dangerouslySetInnerHTML={{
                      __html: msg.content
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\n/g, '<br/>'),
                    }}
                  />
                </Paper>
                {msg.role === 'user' && (
                  <Avatar sx={{ width: 28, height: 28, bgcolor: '#9c27b0', mb: 0.5 }}>
                    <Person sx={{ fontSize: 16 }} />
                  </Avatar>
                )}
              </Box>
            ))}

            {isLoading && (
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Avatar sx={{ width: 28, height: 28, bgcolor: '#1976d2' }}>
                  <SmartToy sx={{ fontSize: 16 }} />
                </Avatar>
                <Paper
                  elevation={0}
                  sx={{
                    px: 2, py: 1.5, borderRadius: '16px 16px 16px 4px',
                    bgcolor: 'white', border: '1px solid', borderColor: 'divider',
                  }}
                >
                  <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                    <CircularProgress size={14} />
                    <Typography variant="caption" color="text.secondary">Thinking...</Typography>
                  </Box>
                </Paper>
              </Box>
            )}

            <div ref={messagesEndRef} />
          </Box>

          {/* Suggested Actions */}
          {suggestedActions.length > 0 && (
            <Box sx={{ px: 2, py: 1, display: 'flex', gap: 0.75, flexWrap: 'wrap', bgcolor: '#f8f9fa' }}>
              {suggestedActions.map((action, i) => (
                <Chip
                  key={i}
                  label={action.label}
                  size="small"
                  clickable
                  onClick={() => handleActionClick(action.action)}
                  sx={{
                    fontSize: '0.75rem',
                    bgcolor: 'white',
                    border: '1px solid',
                    borderColor: 'primary.main',
                    color: 'primary.main',
                    '&:hover': { bgcolor: 'primary.50' },
                  }}
                />
              ))}
            </Box>
          )}

          {/* Input */}
          <Box
            sx={{
              p: 1.5,
              borderTop: '1px solid',
              borderColor: 'divider',
              bgcolor: 'white',
              display: 'flex',
              gap: 1,
              alignItems: 'flex-end',
            }}
          >
            <TextField
              inputRef={inputRef}
              fullWidth
              multiline
              maxRows={3}
              placeholder="Type a message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              variant="outlined"
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                  bgcolor: '#f5f5f5',
                  '&.Mui-focused': { bgcolor: 'white' },
                },
              }}
            />
            <IconButton
              color="primary"
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              sx={{
                bgcolor: 'primary.main',
                color: 'white',
                width: 40,
                height: 40,
                '&:hover': { bgcolor: 'primary.dark' },
                '&.Mui-disabled': { bgcolor: 'grey.300', color: 'grey.500' },
              }}
            >
              <Send sx={{ fontSize: 20 }} />
            </IconButton>
          </Box>
        </Paper>
      </Fade>
    </>
  );
}
