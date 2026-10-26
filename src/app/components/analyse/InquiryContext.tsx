const object = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
const text = (value: unknown) => typeof value === 'string' && value.trim() ? value : '';

function SavedValue({ value, empty, label }: { value: unknown; empty: string; label: string }) {
  const absent = value == null || (typeof value === 'string' && !value.trim())
    || (typeof value === 'object' && Object.keys(value).length === 0);
  if (absent) return <p className="mt-3 text-sm text-white/50">{empty}</p>;
  return <div className="mt-3"><p className="text-xs text-white/50">{label} · original format</p><pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-words text-sm leading-6 text-white/80">{JSON.stringify(value, null, 2)}</pre></div>;
}

export function InquiryContext({ context, outcome }: { context: unknown; outcome: unknown }) {
  const source = object(context);
  const items = Array.isArray(source.items) ? source.items.slice(0, 8).map(object) : [];
  const understanding = text(object(object(outcome).assessment).understanding);
  const sourceText = text(context) || text(source.content);
  const outcomeText = understanding || text(outcome);
  return <div className="space-y-5">
    <section className="rounded-xl border border-white/10 bg-white/[.025] p-5">
      <h3 className="text-sm font-medium text-cyan-200">What prompted this</h3>
      {sourceText && <p className="mt-3 whitespace-pre-wrap text-base leading-7 text-white/85">{sourceText}</p>}
      {items.filter(item => text(item.content)).map((item, index) => <div key={index} className="mt-3 border-l-2 border-cyan-300/25 pl-4">
        <p className="text-xs text-white/50">{text(item.source) || 'Supporting context'}{text(item.event_at) ? ` · ${text(item.event_at)}` : ''}</p>
        <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-white/75">{text(item.content)}</p>
      </div>)}
      {!sourceText && !items.some(item => text(item.content)) && <SavedValue value={context} label="Saved context" empty="No source context retained. Older or resolved records may no longer contain it." />}
    </section>
    <section className="rounded-xl border border-white/10 bg-white/[.025] p-5">
      <h3 className="text-sm font-medium text-cyan-200">{understanding ? 'Latest recorded understanding' : 'Recorded outcome'}</h3>
      {outcomeText ? <p className="mt-3 whitespace-pre-wrap text-base leading-7 text-white/80">{outcomeText}</p> : <SavedValue value={outcome} label="Saved outcome" empty="No recorded outcome retained. See the recorded status above." />}
    </section>
  </div>;
}
