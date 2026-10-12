"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import AIResponseReport from "./AIResponseReport";
import PromptWorkspaceFields from "./PromptWorkspaceFields";

type SavedReport = { id: string; prompt: string; version: string; result: { output: string; model: string }; model: string; createdAt: string };
function date(value: string) { const result = new Date(value); return Number.isNaN(result.valueOf()) ? "Saved report" : result.toLocaleString(); }
async function responseJson(response: Response) {
  const value = await response.json();
  if (!response.ok) throw new Error(typeof value.error === "string" ? value.error : `The report request could not complete (${response.status}).`);
  return value;
}
const button = "rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium disabled:opacity-50";

export default function FeatureReportWorkspace({ apiPath, title }: { apiPath: string; title: string }) {
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState<SavedReport | null>(null);
  const [history, setHistory] = useState<SavedReport[]>([]);
  const [selected, setSelected] = useState<SavedReport | null>(null);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const controller = useRef<AbortController | null>(null), originalDraft = useRef("");
  const dialog = useRef<HTMLDialogElement>(null), headingId = useId();
  async function loadHistory() {
    try { const data = await responseJson(await fetch(`${apiPath}${apiPath.includes("?") ? "&" : "?"}history=1`, { cache: "no-store", credentials: "same-origin" })); setHistory(data.items || []); }
    catch (error) { setError(error instanceof Error ? error.message : "Saved reports could not be loaded."); }
  }
  useEffect(() => { void loadHistory(); return () => controller.current?.abort(); }, [apiPath]);
  useEffect(() => { if (selected && dialog.current && !dialog.current.open) dialog.current.showModal(); }, [selected]);
  function close() {
    if (loading) controller.current?.abort();
    if (editing) setPrompt(originalDraft.current);
    dialog.current?.close(); setSelected(null); setEditing(false); setDeleting(false);
  }
  function edit() { if (!selected) return; originalDraft.current = prompt; setPrompt(selected.prompt); setEditing(true); setDeleting(false); setError(""); }
  function cancelEdit() { setPrompt(originalDraft.current); setEditing(false); setError(""); }
  async function generate(event: FormEvent) {
    event.preventDefault(); if (loading) return;
    const active = new AbortController(); controller.current = active;
    setLoading(true); setError("");
    try {
      const saved = await responseJson(await fetch(apiPath, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin", signal: active.signal, body: JSON.stringify({ prompt, ...(editing && selected ? { id: selected.id, version: selected.version } : {}) }) })) as SavedReport;
      if (active.signal.aborted) return;
      setResult(saved);
      if (editing) { setSelected(saved); setEditing(false); setPrompt(originalDraft.current); }
      await loadHistory();
    } catch (error) { if (!active.signal.aborted) setError(error instanceof Error ? error.message : "The AI report could not be generated."); }
    finally { if (controller.current === active) { controller.current = null; setLoading(false); } }
  }
  async function remove() {
    if (!selected || loading) return;
    setLoading(true); setError("");
    try {
      await responseJson(await fetch(apiPath, { method: "DELETE", headers: { "Content-Type": "application/json" }, credentials: "same-origin", body: JSON.stringify({ id: selected.id, version: selected.version }) }));
      if (result?.id === selected.id) setResult(null);
      dialog.current?.close(); setSelected(null); setDeleting(false);
      await loadHistory();
    } catch (error) { setError(error instanceof Error ? error.message : "This report could not be deleted."); }
    finally { setLoading(false); }
  }
  function form(inDialog = false) { return <form onSubmit={generate} className="space-y-4"><PromptWorkspaceFields feature={title} value={prompt} onChange={setPrompt} disabled={loading} clearLabel="Clear fields"/><div className="flex flex-wrap gap-3"><button type="submit" disabled={loading || !prompt.trim()} className={`${button} border-blue-600 bg-blue-600 text-white`}>{loading ? "Generating…" : "Generate with OpenRouter"}</button>{loading ? <button type="button" onClick={() => controller.current?.abort()} className={button}>Cancel request</button> : inDialog ? <button type="button" onClick={cancelEdit} className={button}>Cancel</button> : null}</div></form>; }
  return <main className="mx-auto max-w-5xl space-y-6 p-6 text-slate-800"><header className="space-y-2"><p className="text-xs font-semibold uppercase tracking-wider text-blue-700">AI advisory workspace</p><h1 className="text-2xl font-bold">{title.replace(/^No\s+/i, "")}</h1><p className="max-w-3xl text-sm leading-6 text-slate-600">Create a reviewable report from the information you provide. This screen generates advice; connected system actions and operational decisions require their own tools and review.</p></header>{!editing ? form() : null}{error && !selected ? <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p> : null}{result ? <AIResponseReport value={result} title="OpenRouter advisory report"/> : null}<section className="space-y-3" aria-label="Saved AI reports"><h2 className="text-lg font-semibold">Saved reports</h2>{history.length ? <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">{history.map(item => <button key={item.id} type="button" onClick={() => { setSelected(item); setEditing(false); setDeleting(false); setError(""); }} className="flex w-full flex-col gap-1 border-b border-slate-200 p-4 text-left last:border-b-0 hover:bg-slate-50"><span className="text-sm font-medium">{date(item.createdAt)}</span><span className="line-clamp-2 text-sm text-slate-600">{item.prompt.replace(/^Request:\s*/, "").slice(0, 160)}</span><span className="text-xs text-blue-700">Open report</span></button>)}</div> : <p className="rounded-lg border border-dashed border-slate-300 p-5 text-sm text-slate-500">Your saved reports will appear here after a successful OpenRouter response.</p>}</section><dialog ref={dialog} aria-labelledby={headingId} onCancel={event => { event.preventDefault(); close(); }} className="fixed left-1/2 top-1/2 m-0 max-h-[90vh] w-[calc(100%-2rem)] max-w-5xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 text-slate-800 shadow-2xl backdrop:bg-slate-900/40">{selected ? <><header className="mb-4 flex items-center justify-between gap-3"><div><h2 id={headingId} className="text-lg font-semibold">{editing ? "Edit saved AI report" : "Saved AI report"}</h2><p className="text-xs text-slate-500">{date(selected.createdAt)}</p></div><button type="button" disabled={loading && !controller.current} onClick={close} className={button}>Cancel</button></header>{editing ? form(true) : <><details className="rounded-lg border border-slate-200 p-3 text-sm"><summary className="cursor-pointer font-medium">Request information</summary><p className="mt-3 whitespace-pre-wrap leading-6">{selected.prompt}</p></details><AIResponseReport value={selected} title="OpenRouter advisory report"/></>}{error ? <p role="alert" className="my-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p> : null}{!editing ? deleting ? <div className="space-y-3 rounded-lg border border-red-200 bg-red-50 p-4"><p className="text-sm text-red-800">Delete this saved report permanently?</p><div className="flex gap-3"><button type="button" disabled={loading} onClick={remove} className={`${button} border-red-600 bg-red-600 text-white`}>Confirm deletion</button><button type="button" disabled={loading} onClick={() => setDeleting(false)} className={button}>Cancel</button></div></div> : <div className="flex flex-wrap gap-3"><button type="button" disabled={loading} onClick={edit} className={button}>Edit</button><button type="button" disabled={loading} onClick={() => setDeleting(true)} className={`${button} text-red-700`}>Delete</button><button type="button" onClick={close} className={button}>Cancel</button></div> : null}</> : null}</dialog></main>;
}
