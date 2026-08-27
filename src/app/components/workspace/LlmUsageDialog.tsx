import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, BarChart3, Loader2, RefreshCw } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { aiUsageService } from '../../core/services/llmUsageService';
import type { AiUsageKind, AiUsageResponse } from '../../types/llmUsageTypes';

interface LlmUsageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sapienId: string;
  sapienName: string;
}

interface KindState {
  global: AiUsageResponse | null;
  sapien: AiUsageResponse | null;
  errors: Array<{ scope: string; message: string }>;
  loading: boolean;
}

const emptyState = (): KindState => ({ global: null, sapien: null, errors: [], loading: false });
const number = new Intl.NumberFormat();

function label(value: string) {
  return value.replaceAll('_', ' ').replace(/\b\w/g, (character) => character.toUpperCase());
}

function errorMessage(reason: unknown) {
  return typeof reason === 'object' && reason && 'message' in reason
    ? String(reason.message)
    : 'The usage endpoint could not be reached.';
}

function MetricRows({ values, emptyText }: { values: Record<string, number>; emptyText: string }) {
  const rows = Object.entries(values);
  if (!rows.length) return <p className="text-xs text-white/35">{emptyText}</p>;
  return (
    <dl className="grid gap-2 sm:grid-cols-2">
      {rows.map(([name, value]) => (
        <div key={name} className="flex items-center justify-between gap-3 rounded-lg border border-white/[.07] bg-white/[.025] px-3 py-2">
          <dt className="min-w-0 truncate text-xs text-white/45" title={name}>{label(name)}</dt>
          <dd className="shrink-0 font-mono text-xs text-white/80">{number.format(value)}</dd>
        </div>
      ))}
    </dl>
  );
}

function TierLimitCards({ limits, usage, ariaScope }: { limits: Record<string, number>; usage: Record<string, number>; ariaScope: string }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {Object.entries(limits).map(([tier, limit]) => {
        const used = usage[tier] ?? 0;
        const percent = limit > 0 ? Math.min(100, used / limit * 100) : 0;
        return (
          <div key={tier} className="rounded-xl border border-cyan-400/15 bg-cyan-400/[.04] p-4">
            <div className="flex items-center justify-between gap-3"><span className="text-xs text-white/55">{label(tier)}</span><span className="font-mono text-xs text-cyan-100">{number.format(used)} / {number.format(limit)}</span></div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[.07]" role="progressbar" aria-label={`${ariaScope}, ${label(tier)} usage`} aria-valuemin={0} aria-valuemax={limit} aria-valuenow={Math.min(used, limit)}><div className="h-full rounded-full bg-cyan-400" style={{ width: `${percent}%` }} /></div>
          </div>
        );
      })}
    </div>
  );
}

function UsageHistory({ usage, unit }: { usage: AiUsageResponse; unit: string }) {
  if (!usage.history.length) return <p className="text-xs text-white/35">No usage has been recorded in this period.</p>;
  return (
    <div className="overflow-hidden rounded-lg border border-white/[.07]">
      <table className="w-full text-left text-xs">
        <thead className="bg-white/[.035] text-white/35"><tr><th className="px-3 py-2 font-medium">UTC date</th><th className="px-3 py-2 text-right font-medium">{unit}</th></tr></thead>
        <tbody className="divide-y divide-white/[.06]">{usage.history.map((day) => <tr key={day.date}><td className="px-3 py-2 text-white/55">{day.date}</td><td className="px-3 py-2 text-right font-mono text-white/75">{number.format(day.total)}</td></tr>)}</tbody>
      </table>
    </div>
  );
}

function ScopeError({ scope, message }: { scope: string; message: string }) {
  return (
    <div className="rounded-xl border border-red-400/20 bg-red-400/[.05] p-3" role="alert">
      <p className="flex items-center gap-2 text-xs text-red-200"><AlertCircle className="h-3.5 w-3.5" />{scope} data unavailable</p>
      <p className="mt-1 pl-5 text-[11px] text-white/35">{message}</p>
    </div>
  );
}

function UsageKindSection({ kind, state, sapienId, sapienName, onRetry }: { kind: AiUsageKind; state: KindState; sapienId: string; sapienName: string; onRetry: () => void }) {
  const title = kind === 'llm' ? 'LLM calls' : 'Embedding calls';
  const hasData = Boolean(state.global || state.sapien);
  const sapienLimits = state.sapien?.sapien_limits ?? {};
  const globalLimits = state.global?.global_limits ?? state.global?.limits ?? {};
  return (
    <section aria-labelledby={`${kind}-usage-heading`} className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div><h3 id={`${kind}-usage-heading`} className={`text-sm font-semibold ${kind === 'llm' ? 'text-violet-200' : 'text-cyan-200'}`}>{title}</h3><p className="mt-1 text-[11px] text-white/30">Daily {kind === 'llm' ? 'model' : 'vector embedding'} call accounting.</p></div>
        {state.errors.length > 0 && <button onClick={onRetry} disabled={state.loading} className="flex shrink-0 items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-[11px] text-white/55 hover:bg-white/5 disabled:opacity-40"><RefreshCw className={`h-3 w-3 ${state.loading ? 'animate-spin' : ''}`} />Retry {title}</button>}
      </div>
      {state.loading && !hasData && <div className="flex min-h-32 items-center justify-center gap-2 text-sm text-white/45" role="status"><Loader2 className="h-4 w-4 animate-spin" />Loading {title.toLowerCase()}…</div>}
      {state.errors.map((error) => <ScopeError key={error.scope} {...error} />)}
      {state.sapien && (
        <div>
          <div className="mb-3"><h4 className="text-xs font-semibold text-white/65">{sapienName} · per-sapien quota</h4><p className="mt-1 text-[11px] text-white/30">{title} for sapien {sapienId} count toward this sapien’s enforced daily tier quota.</p></div>
          <div className="mb-3 rounded-xl border border-violet-400/15 bg-violet-400/[.05] p-4"><p className="text-[10px] uppercase tracking-wider text-white/30">{title} today · {state.sapien.today} UTC</p><p className="mt-1 font-mono text-2xl text-violet-200">{number.format(state.sapien.today_total)}</p></div>
          <h5 className="mb-2 text-xs font-medium text-white/50">Per-sapien daily tier quota</h5>
          {Object.keys(sapienLimits).length > 0 ? <TierLimitCards limits={sapienLimits} usage={state.sapien.today_by_tier} ariaScope={`${title}, ${sapienName} per-sapien quota`} /> : <p className="text-xs text-white/35">No per-sapien tier quota was returned.</p>}
          <h5 className="mb-2 mt-4 text-xs font-medium text-white/50">Today by purpose</h5><MetricRows values={state.sapien.today_by_purpose} emptyText={`No ${title.toLowerCase()} are attributed to this sapien today.`} />
          <h5 className="mb-2 mt-4 text-xs font-medium text-white/50">Recent daily per-sapien usage</h5><UsageHistory usage={state.sapien} unit={title} />
        </div>
      )}
      {state.global && (
        <div className="border-t border-white/[.07] pt-4">
          <div className="mb-3"><h4 className="text-xs font-semibold text-white/65">Shared global quota</h4><p className="mt-1 text-[11px] text-white/30">Enforced daily tier quota shared across all sapiens and system {title.toLowerCase()}. System calls consume only this global pool.</p></div>
          <TierLimitCards limits={globalLimits} usage={state.global.today_by_tier} ariaScope={`${title}, global shared limit`} />
          {!Object.keys(globalLimits).length && <p className="text-xs text-white/35">No global shared limits were returned.</p>}
          <h5 className="mb-2 mt-4 text-xs font-medium text-white/50">Global {title.toLowerCase()} today by purpose</h5><MetricRows values={state.global.today_by_purpose} emptyText={`No global ${title.toLowerCase()} have been recorded today.`} />
        </div>
      )}
    </section>
  );
}

export function LlmUsageDialog({ open, onOpenChange, sapienId, sapienName }: LlmUsageDialogProps) {
  const [states, setStates] = useState<Record<AiUsageKind, KindState>>({ llm: emptyState(), embedding: emptyState() });
  const loadKind = useCallback(async (kind: AiUsageKind) => {
    setStates((current) => ({ ...current, [kind]: { ...current[kind], errors: [], loading: true } }));
    const [globalResult, sapienResult] = await Promise.allSettled([aiUsageService.getUsage(kind), aiUsageService.getUsage(kind, sapienId)]);
    const errors: KindState['errors'] = [];
    if (globalResult.status === 'rejected') errors.push({ scope: 'Global', message: errorMessage(globalResult.reason) });
    if (sapienResult.status === 'rejected') errors.push({ scope: sapienName, message: errorMessage(sapienResult.reason) });
    setStates((current) => ({ ...current, [kind]: { global: globalResult.status === 'fulfilled' ? globalResult.value : null, sapien: sapienResult.status === 'fulfilled' ? sapienResult.value : null, errors, loading: false } }));
  }, [sapienId, sapienName]);

  useEffect(() => {
    if (!open) return;
    void loadKind('llm');
    void loadKind('embedding');
  }, [open, loadKind]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] w-[calc(100%-1rem)] max-w-3xl overflow-y-auto border-white/10 bg-[#090e1c] p-0 text-white shadow-2xl sm:w-full">
        <DialogHeader className="border-b border-white/[.07] px-5 py-4 pr-12 text-left sm:px-6"><DialogTitle className="flex items-center gap-2 text-base"><BarChart3 className="h-4 w-4 text-cyan-300" />AI usage & limits</DialogTitle><DialogDescription className="text-xs text-white/35">LLM and embedding accounting reset on UTC dates. History covers the latest 7 recorded days.</DialogDescription></DialogHeader>
        <div className="space-y-6 px-5 pb-6 sm:px-6" aria-live="polite"><UsageKindSection kind="llm" state={states.llm} sapienId={sapienId} sapienName={sapienName} onRetry={() => void loadKind('llm')} /><div className="border-t border-white/10" /><UsageKindSection kind="embedding" state={states.embedding} sapienId={sapienId} sapienName={sapienName} onRetry={() => void loadKind('embedding')} /></div>
      </DialogContent>
    </Dialog>
  );
}
