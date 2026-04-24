'use client';

import { useState, use } from 'react';
import { Box, Typography, Card, CardContent, Chip, Button, TextField, Divider, List, ListItem, ListItemText, Switch, FormControlLabel } from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

export default function ComplaintDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [noteContent, setNoteContent] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const queryClient = useQueryClient();

  const { data: complaint } = useQuery({
    queryKey: ['complaint', id],
    queryFn: async () => {
      const res = await axios.get(`/api/complaints/${id}`);
      return res.data;
    },
  });

  const addNoteMutation = useMutation({
    mutationFn: (data: any) => axios.post(`/api/complaints/${id}/notes`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complaint', id] });
      setNoteContent('');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => axios.patch(`/api/complaints/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['complaint', id] }),
  });

  if (!complaint) return <Box p={3}><Typography>Loading...</Typography></Box>;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>{complaint.complaintNumber}</Typography>
          <Typography color="text.secondary">{complaint.summary}</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Chip label={complaint.status} color={complaint.status === 'RESOLVED' ? 'success' : 'warning'} />
          {complaint.aiSentiment && <Chip label={complaint.aiSentiment} size="small" />}
        </Box>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 3 }}>
        <Box>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Description</Typography>
              <Typography>{complaint.description}</Typography>
            </CardContent>
          </Card>

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Notes Timeline</Typography>
              <List>
                {(complaint.notes || []).map((note: any) => (
                  <ListItem key={note.id} sx={{ bgcolor: note.isInternal ? '#fff3e0' : '#f5f5f5', mb: 1, borderRadius: 1 }}>
                    <ListItemText
                      primary={note.content}
                      secondary={`${note.createdBy} - ${new Date(note.createdAt).toLocaleString()} ${note.isInternal ? '(Internal)' : ''}`}
                    />
                  </ListItem>
                ))}
              </List>

              <Divider sx={{ my: 2 }} />
              <TextField label="Add Note" value={noteContent} onChange={(e) => setNoteContent(e.target.value)} fullWidth multiline rows={2} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                <FormControlLabel control={<Switch checked={isInternal} onChange={(e) => setIsInternal(e.target.checked)} />} label="Internal Note" />
                <Button variant="contained" size="small" disabled={!noteContent} onClick={() => addNoteMutation.mutate({ content: noteContent, isInternal })}>
                  Add Note
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Box>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Details</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box><Typography variant="caption" color="text.secondary">Source</Typography><Typography>{complaint.source}</Typography></Box>
                <Box><Typography variant="caption" color="text.secondary">Category</Typography><Typography>{complaint.category}</Typography></Box>
                <Box><Typography variant="caption" color="text.secondary">AI Classification</Typography><Typography>{complaint.aiClassification || 'N/A'}</Typography></Box>
                <Box><Typography variant="caption" color="text.secondary">SLA Deadline</Typography><Typography>{new Date(complaint.slaDeadline).toLocaleString()}</Typography></Box>
                <Box><Typography variant="caption" color="text.secondary">Created</Typography><Typography>{new Date(complaint.createdAt).toLocaleString()}</Typography></Box>
                <Divider />
                {complaint.status !== 'RESOLVED' && complaint.status !== 'CLOSED' && (
                  <>
                    <TextField label="Resolution" size="small" multiline rows={2} onChange={(e) => setNoteContent(e.target.value)} />
                    <Button variant="contained" color="success" onClick={() => updateMutation.mutate({ status: 'RESOLVED', resolution: noteContent })}>
                      Resolve Complaint
                    </Button>
                  </>
                )}
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
}
