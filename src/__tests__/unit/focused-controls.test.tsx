/** @jest-environment jsdom */
import React, { useState } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import AIResponseReport from '../../components/AIResponseReport';
import PromptWorkspaceFields, { promptFields } from '../../components/PromptWorkspaceFields';
import FullAIExamples, { useFullAIExamples } from '../../components/FullAIExamples';
import LoginPage from '../../app/(auth)/login/page';
import FeatureReportWorkspace from '../../components/FeatureReportWorkspace';
import { signIn } from 'next-auth/react';

jest.mock('next-auth/react', () => ({ signIn: jest.fn() }));
jest.mock('next/server', () => ({ NextResponse: { json: (data: unknown, options?: { status?: number; headers?: Record<string, string> }) => ({ status: options?.status || 200, json: async () => data, headers: { get: (key: string) => options?.headers?.[key] || null } }) } }));
jest.mock('next/navigation', () => ({ useRouter: () => ({ replace: jest.fn(), refresh: jest.fn() }) }));

let host: HTMLDivElement, root: Root;
beforeEach(() => { host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); jest.clearAllMocks(); });
function mount(element: React.ReactElement) { act(() => root.render(element)); }
function click(text: string) { const button = Array.from(host.querySelectorAll('button')).find(item => item.textContent?.includes(text)); expect(button).toBeTruthy(); act(() => button!.click()); }

test('all prompt presets fill required and optional fields without generating', () => {
  const change = jest.fn(); mount(<PromptWorkspaceFields feature="Insurance review" value="" onChange={change} />);
  for (const title of ['Planning scenario', 'Detailed review', 'Executive briefing']) {
    click(title);
    expect(host.querySelectorAll('textarea').length).toBe(promptFields.length);
    host.querySelectorAll('textarea').forEach(field => expect(field.value.trim()).not.toBe(''));
  }
  expect(change).toHaveBeenCalledTimes(3);
});

test('native presets preserve an actual record and never submit', () => {
  const submit = jest.fn();
  function Fixture() {
    const controller = useFullAIExamples();
    const [description, setDescription] = useState('');
    const [record, setRecord] = useState('real-42');
    return <form data-full-ai-workspace="fixture" onSubmit={event => { event.preventDefault(); submit(); }}>
      <FullAIExamples controller={controller} />
      <input aria-label="Description" value={description} onChange={event => setDescription(event.target.value)} data-full-ai-field={controller.bind({ current: description, change: event => setDescription(event.target.value), label: 'description' }, 'description')} />
      <select aria-label="Record ID" value={record} onChange={event => setRecord(event.target.value)} data-full-ai-field={controller.bind({ current: record, change: event => setRecord(event.target.value), label: 'recordId', reference: true }, 'record')}><option value="real-42">Actual</option><option value="other-43">Other</option></select>
      <button type="submit">Generate</button>
    </form>;
  }
  mount(<Fixture />); click('Quick review');
  expect((host.querySelector('input') as HTMLInputElement).value.trim()).not.toBe('');
  expect((host.querySelector('select') as HTMLSelectElement).value).toBe('real-42');
  expect(submit).not.toHaveBeenCalled();
});

test('returned and saved JSON display nested facts, tables, zero, false and empty string', () => {
  const data = { result: { output: JSON.stringify({ findings: [{ name: 'Example', approved: false, count: 0, note: '' }], details: { active: false, total: 0, comment: '' } }) } };
  mount(<><AIResponseReport value={data} title="Returned report" /><AIResponseReport value={data} title="Saved report" /></>);
  expect(host.querySelectorAll('table')).toHaveLength(2);
  expect(host.textContent).toContain('No'); expect(host.textContent).toContain('0'); expect(host.textContent).toContain('Empty string');
  expect(host.textContent).toContain('Details');
});

test('demo fill does not submit or sign in', async () => {
  const oldFetch = global.fetch;
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ email: 'example@example.com', password: 'fixture-only' }) }) as typeof fetch;
  try {
    mount(<LoginPage />); await act(async () => { click('Fill demo credentials'); await Promise.resolve(); });
    expect((host.querySelector('input[type=email]') as HTMLInputElement).value).toBe('example@example.com');
    expect((host.querySelector('input[type=password]') as HTMLInputElement).value).toBe('fixture-only');
    expect(signIn).not.toHaveBeenCalled();
  } finally { global.fetch = oldFetch; }
});


test('saved history detail uses the readable report surface', async () => {
  const oldFetch = global.fetch;
  const item = { id: 'fixture-1', prompt: 'Request:\nReview this example', version: '1', result: { output: JSON.stringify({ findings: [{ status: false, count: 0, note: '' }] }), model: 'fixture' }, model: 'fixture', createdAt: '2026-10-10T00:00:00Z' };
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ items: [item] }) }) as typeof fetch;
  const showModal = HTMLDialogElement.prototype.showModal;
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
  try {
    await act(async () => { root.render(<FeatureReportWorkspace title="Fixture advisory" apiPath="/api/fixture" />); });
    click('Open report');
    expect(host.querySelector('dialog[open]')).toBeTruthy();
    expect(host.querySelector('dialog table')).toBeTruthy();
    expect(host.querySelector('dialog')?.textContent).toContain('Empty string');
    expect(host.querySelector('dialog')?.textContent).toContain('No');
    expect(host.querySelector('dialog')?.textContent).toContain('0');
  } finally { global.fetch = oldFetch; HTMLDialogElement.prototype.showModal = showModal; }
});

test('local demo credential endpoint uses configured demo account without exposing values in checks', async () => {
  const { GET } = await import('../../app/api/auth/demo-credentials/route');
  const response = await GET();
  expect(response.status).toBe(200);
  const data = await response.json();
  expect(typeof data.email).toBe('string');
  expect(typeof data.password).toBe('string');
  expect(data.email.length).toBeGreaterThan(0);
  expect(data.password.length).toBeGreaterThan(0);
  expect(response.headers.get('Cache-Control')).toBe('no-store');
});
