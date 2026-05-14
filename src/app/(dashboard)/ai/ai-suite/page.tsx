'use client';

/**
 * AI Suite — UI for the five new AI features:
 *   1. Underwriting decision narrator
 *   2. Loss-run PDF analyzer
 *   3. Renewal-risk auto-outreach
 *   4. Compliance-as-you-type
 *   5. Voice-call → FNOL claim draft
 *
 * Each tab paginates its own list and lets the user trigger a fresh AI run.
 */

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import {
  Box, Card, CardContent, Typography, Tabs, Tab, Button, TextField, Chip, Stack,
  Alert, CircularProgress, Pagination, MenuItem,
} from '@mui/material';
import {
  Description, Assessment, EventRepeat, Gavel, RecordVoiceOver, Refresh,
} from '@mui/icons-material';

function TabPanel({ value, index, children }: { value: number; index: number; children: React.ReactNode }) {
  if (value !== index) return null;
  return <Box sx={{ pt: 3 }}>{children}</Box>;
}

export default function AISuitePage() {
  const [tab, setTab] = useState(0);
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>AI Suite</Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Five new AI workflows: underwriting narrator, loss-run analyzer, renewal outreach, compliance-as-you-type, voice→FNOL.
      </Typography>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }} variant="scrollable">
        <Tab icon={<Description />} iconPosition="start" label="UW Narrator" />
        <Tab icon={<Assessment />} iconPosition="start" label="Loss-Run Analyzer" />
        <Tab icon={<EventRepeat />} iconPosition="start" label="Renewal Outreach" />
        <Tab icon={<Gavel />} iconPosition="start" label="Compliance-as-You-Type" />
        <Tab icon={<RecordVoiceOver />} iconPosition="start" label="FNOL from Voice" />
      </Tabs>
      <TabPanel value={tab} index={0}><UWNarratorTab /></TabPanel>
      <TabPanel value={tab} index={1}><LossRunTab /></TabPanel>
      <TabPanel value={tab} index={2}><RenewalTab /></TabPanel>
      <TabPanel value={tab} index={3}><ComplianceTab /></TabPanel>
      <TabPanel value={tab} index={4}><FNOLTab /></TabPanel>
    </Box>
  );
}

// -------- UW Narrator
function UWNarratorTab() {
  const [refType, setRefType] = useState<'Policy' | 'Quote'>('Policy');
  const [refId, setRefId] = useState('');
  const [decision, setDecision] = useState('BIND');
  const [page, setPage] = useState(1);
  const list = useQuery({
    queryKey: ['narratives', page],
    queryFn: () => axios.get(`/api/ai/underwriting-narrator?page=${page}&pageSize=10`).then((r) => r.data),
  });
  const run = useMutation({
    mutationFn: () => axios.post('/api/ai/underwriting-narrator', { refType, refId, decision }),
    onSuccess: () => list.refetch(),
  });

  return (
    <Card>
      <CardContent>
        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          <TextField select size="small" label="Ref Type" value={refType} onChange={(e) => setRefType(e.target.value as any)}>
            <MenuItem value="Policy">Policy</MenuItem>
            <MenuItem value="Quote">Quote</MenuItem>
          </TextField>
          <TextField size="small" label="Ref ID" value={refId} onChange={(e) => setRefId(e.target.value)} sx={{ flex: 1 }} />
          <TextField select size="small" label="Decision" value={decision} onChange={(e) => setDecision(e.target.value)}>
            <MenuItem value="BIND">BIND</MenuItem>
            <MenuItem value="DECLINE">DECLINE</MenuItem>
            <MenuItem value="REFER">REFER</MenuItem>
          </TextField>
          <Button variant="contained" onClick={() => run.mutate()} disabled={!refId || run.isPending}>
            {run.isPending ? <CircularProgress size={20} /> : 'Generate narrative'}
          </Button>
        </Stack>
        {run.isError && <Alert severity="error">{(run.error as any)?.response?.data?.detail || (run.error as any)?.message}</Alert>}
        {list.isLoading ? <CircularProgress /> : (
          <Stack spacing={1}>
            {list.data?.data?.map((n: any) => (
              <Box key={n.id} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="subtitle2">{n.refType} {n.refId} — {n.decision}</Typography>
                  <Chip label={`E&O: ${n.eoExposure}`} color={n.eoExposure === 'high' ? 'error' : n.eoExposure === 'medium' ? 'warning' : 'success'} size="small" />
                </Stack>
                <Typography sx={{ mt: 1 }}>{n.narrative}</Typography>
              </Box>
            ))}
            {list.data?.pagination?.totalPages > 1 && (
              <Pagination
                page={page}
                count={list.data.pagination.totalPages}
                onChange={(_, p) => setPage(p)}
              />
            )}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}

// -------- Loss-Run Analyzer
function LossRunTab() {
  const [fileName, setFileName] = useState('');
  const [text, setText] = useState('');
  const [quoteId, setQuoteId] = useState('');
  const [page, setPage] = useState(1);
  const list = useQuery({
    queryKey: ['loss-run', page],
    queryFn: () => axios.get(`/api/ai/loss-run-analyzer?page=${page}&pageSize=10`).then((r) => r.data),
  });
  const run = useMutation({
    mutationFn: () => axios.post('/api/ai/loss-run-analyzer', { fileName, text, quoteId: quoteId || undefined }),
    onSuccess: () => list.refetch(),
  });

  return (
    <Card>
      <CardContent>
        <Stack spacing={1} sx={{ mb: 2 }}>
          <TextField size="small" label="File name" value={fileName} onChange={(e) => setFileName(e.target.value)} />
          <TextField size="small" label="Quote ID (optional)" value={quoteId} onChange={(e) => setQuoteId(e.target.value)} />
          <TextField size="small" label="Pasted loss-run text" multiline minRows={4} value={text} onChange={(e) => setText(e.target.value)} />
          <Button variant="contained" onClick={() => run.mutate()} disabled={!fileName || !text || run.isPending}>
            {run.isPending ? <CircularProgress size={20} /> : 'Analyze'}
          </Button>
        </Stack>
        {list.isLoading ? <CircularProgress /> : (
          <Stack spacing={1}>
            {list.data?.data?.map((r: any) => (
              <Box key={r.id} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                <Typography variant="subtitle2">{r.fileName}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {r.status} · {Array.isArray(r.extractedClaims) ? r.extractedClaims.length : 0} claims · premium impact {r.premiumImpactPct ?? '—'}%
                </Typography>
                {r.summary && <Typography variant="body2" sx={{ mt: 1 }}>{r.summary}</Typography>}
              </Box>
            ))}
            {list.data?.pagination?.totalPages > 1 && (
              <Pagination
                page={page}
                count={list.data.pagination.totalPages}
                onChange={(_, p) => setPage(p)}
              />
            )}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}

// -------- Renewal Outreach
function RenewalTab() {
  const [days, setDays] = useState(90);
  const [page, setPage] = useState(1);
  const list = useQuery({
    queryKey: ['renewal-risk', page],
    queryFn: () => axios.get(`/api/ai/renewal-outreach?page=${page}&pageSize=10`).then((r) => r.data),
  });
  const run = useMutation({
    mutationFn: () => axios.post(`/api/ai/renewal-outreach?days=${days}`),
    onSuccess: () => list.refetch(),
  });
  return (
    <Card>
      <CardContent>
        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          <TextField size="small" type="number" label="Lookahead (days)" value={days} onChange={(e) => setDays(Number(e.target.value))} />
          <Button variant="contained" startIcon={<Refresh />} onClick={() => run.mutate()} disabled={run.isPending}>
            {run.isPending ? <CircularProgress size={20} /> : 'Score upcoming renewals'}
          </Button>
        </Stack>
        {list.isLoading ? <CircularProgress /> : (
          <Stack spacing={1}>
            {list.data?.data?.map((r: any) => (
              <Box key={r.id} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="subtitle2">Policy {r.policyId} ({r.daysToRenewal}d)</Typography>
                  <Chip
                    label={`Retention ${(r.retentionScore * 100).toFixed(0)}%`}
                    color={r.retentionScore > 0.7 ? 'success' : r.retentionScore > 0.4 ? 'warning' : 'error'}
                    size="small"
                  />
                </Stack>
                {r.outreachContent && (
                  <Typography variant="body2" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>{r.outreachContent}</Typography>
                )}
              </Box>
            ))}
            {list.data?.pagination?.totalPages > 1 && (
              <Pagination page={page} count={list.data.pagination.totalPages} onChange={(_, p) => setPage(p)} />
            )}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}

// -------- Compliance-as-you-type
function ComplianceTab() {
  const [refType, setRefType] = useState('Policy');
  const [state, setState] = useState('TX');
  const [payload, setPayload] = useState('{"lineOfBusiness":"HOMEOWNERS","limits":{"dwelling":250000}}');
  const [result, setResult] = useState<any>(null);
  const run = useMutation({
    mutationFn: () => axios.post('/api/ai/compliance-as-you-type', { refType, state, payload: JSON.parse(payload) }),
    onSuccess: (r) => setResult(r.data),
  });
  return (
    <Card>
      <CardContent>
        <Stack spacing={1} sx={{ mb: 2 }}>
          <TextField select size="small" label="Ref Type" value={refType} onChange={(e) => setRefType(e.target.value)}>
            <MenuItem value="Policy">Policy</MenuItem>
            <MenuItem value="Endorsement">Endorsement</MenuItem>
          </TextField>
          <TextField size="small" label="State" value={state} onChange={(e) => setState(e.target.value)} />
          <TextField size="small" label="Payload (JSON)" multiline minRows={4} value={payload} onChange={(e) => setPayload(e.target.value)} />
          <Button variant="contained" onClick={() => run.mutate()} disabled={run.isPending}>
            {run.isPending ? <CircularProgress size={20} /> : 'Run compliance check'}
          </Button>
        </Stack>
        {result && (
          <Alert severity={result.blocking ? 'error' : 'info'}>
            <Typography variant="subtitle2">
              Score {result.complianceScore ?? '—'} · {result.blocking ? 'BLOCKING' : 'PASS'}
            </Typography>
            <Typography variant="body2">{(result.violations || []).length} violations · {(result.warnings || []).length} warnings</Typography>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

// -------- FNOL extractor
function FNOLTab() {
  const [utterance, setUtterance] = useState('');
  const [callerPhone, setCallerPhone] = useState('');
  const [last, setLast] = useState<any>(null);
  const [page, setPage] = useState(1);
  const list = useQuery({
    queryKey: ['fnol', page],
    queryFn: () => axios.get(`/api/ai/fnol-extract?page=${page}&pageSize=10`).then((r) => r.data),
  });
  const run = useMutation({
    mutationFn: () =>
      axios
        .post('/api/ai/fnol-extract', { utterance, callerPhone, existingDraftId: last?.draft?.id })
        .then((r) => r.data),
    onSuccess: (r) => {
      setLast(r);
      list.refetch();
    },
  });
  return (
    <Card>
      <CardContent>
        <Stack spacing={1} sx={{ mb: 2 }}>
          <TextField size="small" label="Caller phone" value={callerPhone} onChange={(e) => setCallerPhone(e.target.value)} />
          <TextField size="small" label="Caller utterance" multiline minRows={3} value={utterance} onChange={(e) => setUtterance(e.target.value)} />
          <Button variant="contained" onClick={() => run.mutate()} disabled={!utterance || run.isPending}>
            {run.isPending ? <CircularProgress size={20} /> : 'Extract FNOL fields'}
          </Button>
        </Stack>
        {last && (
          <Alert severity={last.complete ? 'success' : 'warning'} sx={{ mb: 2 }}>
            <Typography variant="subtitle2">Confirmation #{last.confirmationNumber}</Typography>
            <Typography variant="body2">{last.response}</Typography>
          </Alert>
        )}
        {list.isLoading ? <CircularProgress /> : (
          <Stack spacing={1}>
            {list.data?.data?.map((d: any) => (
              <Box key={d.id} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="subtitle2">{d.confirmationNumber}</Typography>
                  <Chip label={d.status} size="small" />
                </Stack>
                <Typography variant="body2">{d.lossType ?? '—'} · {d.description ?? '(no description)'}</Typography>
              </Box>
            ))}
            {list.data?.pagination?.totalPages > 1 && (
              <Pagination page={page} count={list.data.pagination.totalPages} onChange={(_, p) => setPage(p)} />
            )}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
