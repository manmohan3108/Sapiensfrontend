import { useId, useState } from 'react';
import type { ConnectionGuidance as Guidance } from '../../types/connectionTypes';
import { ConnectionHelp } from './ConnectionHelp';

function PublicConnectionValue({ label, value, help_text }: { label: string; value: string; help_text: string }) {
  const id = useId();
  const [message, setMessage] = useState('');
  const copy = async () => {
    try { await navigator.clipboard.writeText(value); setMessage('Copied'); }
    catch { setMessage('Select the value and copy it manually.'); }
  };
  return <div className="space-y-2">
    <label htmlFor={id} className="block text-sm font-medium">{label}</label>
    <textarea id={id} readOnly value={value} rows={3} spellCheck={false} aria-describedby={help_text ? `${id}-help` : undefined}
      className="w-full rounded-lg border border-sp-line bg-sp-panel p-2 font-mono text-sm text-sp-ink" />
    {help_text && <p id={`${id}-help`} className="text-sm text-sp-muted">{help_text}</p>}
    <button type="button" onClick={() => void copy()} className="rounded-lg border border-sp-line px-3 py-2 text-sm hover:bg-sp-ink/5">Copy {label.toLowerCase()}</button>
    <p role="status" className="text-sm text-sp-muted">{message}</p>
  </div>;
}

export function ConnectionGuidance({ guidance, compact = false, disclosure = false, showStatus = false, description }: { guidance?: Guidance | null; compact?: boolean; disclosure?: boolean; showStatus?: boolean; description?: string }) {
  if (!guidance) return null;
  if (disclosure) return <section className="connection-setup" aria-label={guidance.title}>
    {showStatus && <div className="connection-setup-status"><h3>{guidance.title}</h3><p>{guidance.description}</p></div>}
    {guidance.public_values?.map((item, index) => <PublicConnectionValue key={index} {...item} />)}
    <ConnectionHelp label="Setup and access info">
      {description && <p>{description}</p>}
      {!showStatus && <p>{guidance.description}</p>}
      {guidance.steps.length > 0 && <ol className="list-decimal space-y-2 pl-5">{guidance.steps.map((step, index) => <li key={index}>{step}</li>)}</ol>}
      {guidance.disconnect_notice && <p>{guidance.disconnect_notice}</p>}
    </ConnectionHelp>
  </section>;
  const instructions = <>
    {guidance.steps.length > 0 && <ol className="list-decimal space-y-2 pl-5 text-sm text-sp-muted">{guidance.steps.map((step, index) => <li key={index}>{step}</li>)}</ol>}
    {guidance.public_values?.map((item, index) => <PublicConnectionValue key={index} {...item} />)}
    {guidance.disconnect_notice && <details><summary className="cursor-pointer text-sm">Removing or replacing access</summary><p className="mt-2 text-sm text-sp-muted">{guidance.disconnect_notice}</p></details>}
  </>;
  return <section aria-label={guidance.title} className="my-4 space-y-3 rounded-lg border border-sp-line p-4 break-words">
    <h3 className="text-sm font-semibold">{guidance.title}</h3>
    <p className="text-sm text-sp-muted">{guidance.description}</p>
    {compact ? <details><summary className="cursor-pointer text-sm">Setup and access details</summary><div className="mt-3 space-y-3">{instructions}</div></details> : instructions}
  </section>;
}
