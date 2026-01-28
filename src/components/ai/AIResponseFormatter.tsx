'use client';

import React from 'react';
import {
  Box, Typography, Paper, List, ListItem, ListItemIcon, ListItemText,
  Divider, Chip, Alert,
} from '@mui/material';
import {
  CheckCircle, Info, Warning, ArrowForward, TipsAndUpdates,
} from '@mui/icons-material';

interface AIResponseFormatterProps {
  text: string;
  variant?: 'default' | 'compact';
}

// Parse text into structured sections
function parseAIResponse(text: string): { type: string; content: string; items?: string[] }[] {
  const sections: { type: string; content: string; items?: string[] }[] = [];
  const lines = text.split('\n').filter(line => line.trim());

  let currentSection: { type: string; content: string; items: string[] } | null = null;

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Check for headers (## Header or **Header** or HEADER:)
    if (trimmedLine.match(/^#{1,3}\s+/) || trimmedLine.match(/^\*\*[^*]+\*\*:?$/) || trimmedLine.match(/^[A-Z][A-Z\s]+:$/)) {
      if (currentSection) {
        sections.push(currentSection);
      }
      const headerText = trimmedLine
        .replace(/^#{1,3}\s+/, '')
        .replace(/^\*\*/, '')
        .replace(/\*\*:?$/, '')
        .replace(/:$/, '');
      currentSection = { type: 'header', content: headerText, items: [] };
      continue;
    }

    // Check for bullet points
    if (trimmedLine.match(/^[-•*]\s+/) || trimmedLine.match(/^\d+[.)]\s+/)) {
      const bulletText = trimmedLine
        .replace(/^[-•*]\s+/, '')
        .replace(/^\d+[.)]\s+/, '');
      if (currentSection) {
        currentSection.items.push(bulletText);
      } else {
        currentSection = { type: 'list', content: '', items: [bulletText] };
      }
      continue;
    }

    // Regular paragraph
    if (currentSection && currentSection.items.length === 0) {
      currentSection.content += (currentSection.content ? ' ' : '') + trimmedLine;
    } else {
      if (currentSection) {
        sections.push(currentSection);
      }
      currentSection = { type: 'paragraph', content: trimmedLine, items: [] };
    }
  }

  if (currentSection) {
    sections.push(currentSection);
  }

  return sections;
}

// Format inline text (bold, italic, etc.)
function formatInlineText(text: string): React.ReactNode {
  // Replace **bold** with bold text
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

// Get icon based on content keywords
function getSectionIcon(content: string) {
  const lowerContent = content.toLowerCase();
  if (lowerContent.includes('recommend') || lowerContent.includes('suggestion')) {
    return <TipsAndUpdates color="primary" />;
  }
  if (lowerContent.includes('warning') || lowerContent.includes('risk') || lowerContent.includes('gap')) {
    return <Warning color="warning" />;
  }
  if (lowerContent.includes('important') || lowerContent.includes('note')) {
    return <Info color="info" />;
  }
  return <CheckCircle color="success" />;
}

export default function AIResponseFormatter({ text, variant = 'default' }: AIResponseFormatterProps) {
  const sections = parseAIResponse(text);

  if (sections.length === 0) {
    return (
      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
        {text}
      </Typography>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {sections.map((section, index) => {
        if (section.type === 'header') {
          return (
            <Box key={index}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                {getSectionIcon(section.content)}
                <Typography variant="subtitle1" fontWeight={600} color="primary">
                  {section.content}
                </Typography>
              </Box>
              {section.items && section.items.length > 0 && (
                <List dense sx={{ pl: 1 }}>
                  {section.items.map((item, i) => (
                    <ListItem key={i} sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 28 }}>
                        <ArrowForward fontSize="small" color="action" />
                      </ListItemIcon>
                      <ListItemText
                        primary={formatInlineText(item)}
                        primaryTypographyProps={{ variant: 'body2' }}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
              {section.content && !section.items?.length && (
                <Typography variant="body2" sx={{ ml: 4 }}>
                  {formatInlineText(section.content)}
                </Typography>
              )}
            </Box>
          );
        }

        if (section.type === 'list') {
          return (
            <List key={index} dense>
              {section.items?.map((item, i) => (
                <ListItem key={i} sx={{ py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 28 }}>
                    <ArrowForward fontSize="small" color="action" />
                  </ListItemIcon>
                  <ListItemText
                    primary={formatInlineText(item)}
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
              ))}
            </List>
          );
        }

        // Paragraph
        return (
          <Typography key={index} variant="body2" sx={{ lineHeight: 1.7 }}>
            {formatInlineText(section.content)}
          </Typography>
        );
      })}
    </Box>
  );
}

// Component for displaying key-value pairs from AI responses
export function AIKeyValueDisplay({ data }: { data: Record<string, any> }) {
  const entries = Object.entries(data).filter(([key]) =>
    !['text', 'raw'].includes(key)
  );

  if (entries.length === 0) return null;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {entries.map(([key, value]) => {
        const formattedKey = key
          .replace(/([A-Z])/g, ' $1')
          .replace(/_/g, ' ')
          .trim()
          .replace(/^\w/, c => c.toUpperCase());

        if (Array.isArray(value)) {
          return (
            <Box key={key}>
              <Typography variant="subtitle2" fontWeight={600} color="primary" gutterBottom>
                {formattedKey}
              </Typography>
              <List dense>
                {value.map((item, i) => (
                  <ListItem key={i} sx={{ py: 0.25 }}>
                    <ListItemIcon sx={{ minWidth: 24 }}>
                      <CheckCircle fontSize="small" color="success" />
                    </ListItemIcon>
                    <ListItemText
                      primary={typeof item === 'object' ? JSON.stringify(item) : String(item)}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          );
        }

        if (typeof value === 'object' && value !== null) {
          return (
            <Box key={key}>
              <Typography variant="subtitle2" fontWeight={600} color="primary" gutterBottom>
                {formattedKey}
              </Typography>
              <Paper variant="outlined" sx={{ p: 1.5 }}>
                <AIKeyValueDisplay data={value} />
              </Paper>
            </Box>
          );
        }

        return (
          <Box key={key} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 120 }}>
              {formattedKey}:
            </Typography>
            <Typography variant="body2" fontWeight={500}>
              {String(value)}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}
