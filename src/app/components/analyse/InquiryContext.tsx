const object = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
const text = (value: unknown) => typeof value === 'string' ? value : '';

export function InquiryContext({ context, outcome }: { context: unknown; outcome: unknown }) {
  const source = object(context);
  const items = Array.isArray(source.items) ? source.items.slice(0, 8).map(object) : [];
  const understanding = text(object(object(outcome).assessment).understanding);
  return <div className="space-y-5">
    <section className="rounded-xl border border-white/10 bg-white/[.025] p-5">
      <h3 className="text-sm font-medium text-cyan-200">What prompted this</h3>
      {text(source.content) && <p className="mt-3 whitespace-pre-wrap text-base leading-7 text-white/85">{text(source.content)}</p>}
      {items.filter(item => text(item.content)).map((item, index) => <div key={index} className="mt-3 border-l-2 border-cyan-300/25 pl-4">
        <p className="text-xs text-white/50">{text(item.source) || 'Supporting context'}{text(item.event_at) ? ` · ${text(item.event_at)}` : ''}</p>
        <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-white/75">{text(item.content)}</p>
      </div>)}
      {!text(source.content) && !items.some(item => text(item.content)) && <p className="mt-3 text-sm text-white/50">No readable source context retained. Older or resolved records may no longer contain it.</p>}
    </section>
    <section className="rounded-xl border border-white/10 bg-white/[.025] p-5">
      <h3 className="text-sm font-medium text-cyan-200">Latest recorded understanding</h3>
      <p className="mt-3 whitespace-pre-wrap text-base leading-7 text-white/80">{understanding || 'No answer summary retained. See the recorded status above.'}</p>
    </section>
  </div>;
}
