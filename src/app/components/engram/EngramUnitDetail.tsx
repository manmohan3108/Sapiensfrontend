import { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight, ArrowLeft, ExternalLink, Share2 } from 'lucide-react';
import { engramService } from '../../core/services/engramService';
import type { UnitDetailResponse, EngramLink, LinkMechanism } from '../../types/engramTypes';
import { CenteredLoader, ErrorBox } from './EngramDashboard';

export const MECH_COLORS: Record<string, string> = {
  entity_mention:      '#22d3ee',
  semantic_similarity: '#f97316',
  narrative_thread:    '#94a3b8',
  temporal_proximity:  '#eab308',
  provenance_analysis: '#a78bfa',
};

export function fmtId(id: string) {
  return id.length >= 8 ? `${id.slice(0, 4)}…${id.slice(-4)}` : id;
}

function MechBadge({ mechanism }: { mechanism: LinkMechanism | string }) {
  const color = MECH_COLORS[mechanism] ?? '#94a3b8';
  return (
    <span
      className="px-1.5 py-0.5 rounded text-[9px] font-mono flex-shrink-0"
      style={{ color, background: `${color}18`, border: `1px solid ${color}40` }}
    >
      {mechanism.replace(/_/g, ' ')}
    </span>
  );
}

function ContextSlot({ label, value }: { label: string; value: unknown }) {
  const [open, setOpen] = useState(false);
  const str = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
  const isLong = str.length > 60;
  const preview = isLong && !open ? str.slice(0, 80) + '…' : str;

  return (
    <div className="rounded-lg overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left"
        style={{ background: 'rgba(255,255,255,0.03)' }}
      >
        {open ? <ChevronDown className="w-3 h-3 text-white/30 flex-shrink-0" /> : <ChevronRight className="w-3 h-3 text-white/30 flex-shrink-0" />}
        <span className="text-[11px] font-mono text-white/55">{label}</span>
      </button>
      {open && (
        <div className="px-3 pb-3 pt-1">
          <pre className="text-[10px] text-white/50 whitespace-pre-wrap break-all font-mono leading-relaxed">{preview}</pre>
          {isLong && (
            <button onClick={() => setOpen(!open)} className="text-[9px] text-white/25 hover:text-white/50 mt-1 transition-colors">
              {open ? 'Collapse' : 'Show more'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function LinkRow({ link, onNavigate }: { link: EngramLink; onNavigate: (id: string) => void }) {
  const color = MECH_COLORS[link.mechanism] ?? '#94a3b8';
  return (
    <button
      onClick={() => onNavigate(link.id)}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left group transition-all"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = `${color}40`; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)'; }}
    >
      <span
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ background: color, boxShadow: `0 0 6px ${color}70` }}
      />
      <span className="text-[11px] font-mono text-white/45 flex-shrink-0">{fmtId(link.id)}</span>
      <span className="text-[10px] text-white/30 flex-shrink-0">{link.relation}</span>
      <MechBadge mechanism={link.mechanism} />
      <span className="ml-auto text-[9px] font-mono text-white/20">{link.weight.toFixed(2)}</span>
      <ExternalLink className="w-3 h-3 text-white/20 group-hover:text-white/50 transition-colors flex-shrink-0" />
    </button>
  );
}

export function EngramUnitDetail({
  unitId,
  onBack,
  onNavigate,
  onOpenInGraph,
}: {
  unitId: string;
  onBack?: () => void;
  onNavigate: (id: string) => void;
  onOpenInGraph?: (id: string) => void;
}) {
  const [data, setData] = useState<UnitDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    engramService.getUnit(unitId)
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [unitId]);

  if (loading) return <CenteredLoader />;
  if (error)   return <ErrorBox msg={error} />;
  if (!data)   return null;

  const { unit, context, links } = data;

  // Group links by mechanism
  const grouped = links.reduce<Record<string, EngramLink[]>>((acc, l) => {
    (acc[l.mechanism] ??= []).push(l);
    return acc;
  }, {});

  const typeColor: Record<string, string> = {
    episodic: '#818cf8', entity: '#22d3ee', summary: '#34d399', semantic: '#f59e0b',
  };
  const tc = typeColor[unit.memory_type] ?? '#94a3b8';

  return (
    <div className="space-y-5">
      {/* Back */}
      {onBack && (
        <button onClick={onBack} className="flex items-center gap-1.5 text-[11px] text-white/35 hover:text-white/70 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to list
        </button>
      )}

      {/* Header */}
      <div className="flex items-center gap-3">
        <span
          className="px-2 py-0.5 rounded-full text-[10px] font-mono flex-shrink-0"
          style={{ color: tc, background: `${tc}18`, border: `1px solid ${tc}40` }}
        >
          {unit.memory_type}
        </span>
        <span className="text-[11px] font-mono text-white/30">{fmtId(unit.id)}</span>
        <span className="text-[10px] text-white/20">{new Date(unit.created_at).toLocaleDateString()}</span>
        {onOpenInGraph && (
          <button
            onClick={() => onOpenInGraph(unit.id)}
            className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] transition-all hover:text-orange-300"
            style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.25)', color: '#fb923c' }}
            title="Open this unit in Graph Explorer"
          >
            <Share2 className="w-3 h-3" />
            Graph
          </button>
        )}
      </div>

      {/* Content */}
      <div
        className="rounded-xl p-5"
        style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${tc}20` }}
      >
        <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap">{unit.content}</p>
      </div>

      {/* Context slots */}
      {Object.keys(context).length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-widest font-mono text-white/25 px-1">Context</p>
          {Object.entries(context).map(([k, v]) => (
            <ContextSlot key={k} label={k} value={v} />
          ))}
        </div>
      )}

      {/* Links grouped by mechanism */}
      {Object.keys(grouped).length > 0 && (
        <div className="space-y-4">
          <p className="text-[10px] uppercase tracking-widest font-mono text-white/25 px-1">Links ({links.length})</p>
          {Object.entries(grouped).map(([mech, mechLinks]) => (
            <div key={mech} className="space-y-1.5">
              <div className="flex items-center gap-2 px-1">
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: MECH_COLORS[mech] ?? '#94a3b8' }}
                />
                <span className="text-[10px] font-mono text-white/35">{mech.replace(/_/g, ' ')} ({mechLinks.length})</span>
              </div>
              {mechLinks.map(l => (
                <LinkRow key={l.id} link={l} onNavigate={onNavigate} />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
