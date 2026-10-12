"use client";

import { useEffect, useState } from "react";

export const promptFields = [
  ["prompt", "Request", false], ["goal", "Desired outcome", false],
  ["context", "Background", true], ["audience", "Audience", true],
  ["evidence", "Source information", true], ["constraints", "Constraints", true],
  ["budget", "Budget or resources", true], ["deadline", "Timing", true],
  ["tone", "Tone", true], ["format", "Report format", true],
] as const;

export function promptExamples(feature: string) {
  return ["Planning scenario", "Detailed review", "Executive briefing"].map((label, index) => ({ label, values: {
    prompt: `Fictional example for ${feature}: ${index === 0 ? "prepare an initial plan and identify decisions that need review" : index === 1 ? "review the supplied scenario, explain gaps and recommend next steps" : "prepare a concise briefing with decisions, priorities and follow-up questions"}.`,
    goal: index === 0 ? "Produce a practical plan with owners, assumptions and next steps." : index === 1 ? "Explain the findings, alternatives and evidence still needed." : "Provide an executive summary and three prioritized actions.",
    context: "This is a fictional planning exercise for a small team. No live system records or external actions are supplied.",
    audience: index === 2 ? "Project sponsor and leadership team" : "Project owner and operations team",
    evidence: "Fictional sample: 24 requests reviewed, 6 awaiting clarification, 3 requiring specialist review. These numbers are sample inputs, not verified business results.",
    constraints: "Use only supplied facts. Identify missing information. Require human review for consequential decisions and external actions.",
    budget: index === 0 ? "Illustrative planning budget: 1500 USD and 12 staff hours." : index === 1 ? "Illustrative planning budget: 4000 USD and 30 staff hours." : "Illustrative resource envelope: one project owner and two reviewers.",
    deadline: "Provide a plan for the next two weeks; exact dates require confirmation.",
    tone: index === 2 ? "Concise and professional" : "Professional and clear",
    format: index === 1 ? "Summary, findings, comparison table, next steps and review notes" : "Executive summary, prioritized actions, assumptions and open questions",
  }}));
}
function requestText(values: Record<string, string>) {
  return promptFields.map(([name, label]) => values[name]?.trim() ? `${label}:\n${values[name].trim()}` : "").filter(Boolean).join("\n\n");
}
export function promptValues(value: string): Record<string, string> {
  if (!value.startsWith("Request:\n")) return value ? { prompt: value } : {};
  const labels = new Map(promptFields.map(([name, label]) => [label, name]));
  const pattern = new RegExp(`(?:^|\\n\\n)(${promptFields.map(([, label]) => label).join("|")}):\\n`, "g");
  const matches = Array.from(value.matchAll(pattern)), values: Record<string, string> = {};
  for (let index = 0; index < matches.length; index++) {
    const match = matches[index], name = labels.get(match[1] as typeof promptFields[number][1]);
    if (name) values[name] = value.slice((match.index || 0) + match[0].length, matches[index + 1]?.index ?? value.length).trim();
  }
  return values;
}
export default function PromptWorkspaceFields({ feature, value, onChange, disabled = false, clearLabel = "Cancel" }: {
  feature: string; value: string; onChange: (value: string) => void; disabled?: boolean; clearLabel?: string;
}) {
  const [fields, setFields] = useState<Record<string, string>>(() => promptValues(value));
  const [example, setExample] = useState("");
  useEffect(() => {
    if (!value) { setFields({}); setExample(""); }
    else if (value !== requestText(fields)) { setFields(promptValues(value)); setExample(""); }
  }, [value]);
  function apply(next: Record<string, string>) { setFields(next); onChange(requestText(next)); }
  return <section aria-label="AI request fields" className="mb-4 space-y-4 rounded-xl border border-slate-200 bg-white p-5 text-slate-700">
    <div className="space-y-2 rounded-lg bg-slate-50 p-3"><h2 className="text-sm font-semibold text-slate-900">Fill every AI field</h2><p className="text-xs leading-5 text-slate-600">Choose a complete example, including optional fields. Review your inputs, then use the run button to request a response.</p><div className="flex flex-wrap gap-2">{promptExamples(feature).map(item => <button key={item.label} type="button" disabled={disabled} onClick={() => { apply(item.values); setExample(item.label); }} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium disabled:opacity-50">{item.label}</button>)}<button type="button" disabled={disabled} onClick={() => { apply({}); setExample(""); }} className="rounded-md border border-slate-300 px-3 py-2 text-sm disabled:opacity-50">{clearLabel}</button></div>{example ? <p role="status" className="text-xs text-amber-800">{example} loaded. These are fictional example inputs; replace them with your own information.</p> : null}</div>
    <div className="grid gap-4 md:grid-cols-2">{promptFields.map(([name, label, optional]) => <label key={name} className="block space-y-1 text-sm"><span className="font-medium text-slate-800">{label}{optional ? <span className="ml-1 text-xs font-normal text-slate-500">Optional</span> : null}</span><textarea aria-label={label} disabled={disabled} required={!optional} value={fields[name] || ""} rows={name === "prompt" || name === "evidence" ? 4 : 2} onChange={event => { apply({ ...fields, [name]: event.target.value }); setExample(""); }} className="w-full rounded-md border border-slate-300 p-3 text-sm disabled:bg-slate-50"/></label>)}</div>
  </section>;
}
