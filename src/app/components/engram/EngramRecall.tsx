import { useState } from 'react';
import { Search, Loader2, Layers, Zap, Share2, GitMerge, Network } from 'lucide-react';
import { engramService } from '../../core/services/engramService';
import type { RecallResponse, MemoryRef, ComposedMemory, RecallDepth } from '../../types/engramTypes';
import { ErrorBox } from './EngramDashboard';
import { fmtId } from './EngramUnitDetail';

const STRATEGY_COLORS: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
  meaning: { color: '#818cf8', label: 'Meaning',  icon: <Layers className="w-3.5 h-3.5" /> },
  keyword: { color: '#34d399', label: 'Keyword',  icon: <Zap    className="w-3.5 h-3.5" /> },
  graph:   { color: '#f97316', label: 'Graph',    icon: <Share2  className="w-3.5 h-3.5" /> },
};

function ScorePill({ score, strategy }: { score: number; strategy: string }) {
  const color = STRATEGY_COLORS[strategy]?.color ?? '#94a3b8';
  return (
    <span
      className="px-1.5 py-0.5 rounded text-[9px] font-mono tabular-nums flex-shrink-0"
      style={{ color, background: `${color}18`, border: `1px solid ${color}35` }}
    >
      {score.toFixed(3)}
    </span>
  );
}

function RefCard({ ref: r, multiSource, strategy, onOpenInGraph }: { ref: MemoryRef; multiSource: boolean; strategy: string; onOpenInGraph?: (id: string) => void }) {
  if (!r) return null;
  const stratColor = STRATEGY_COLORS[strategy]?.color ?? '#94a3b8';
  const mtColors: Record<string, string> = {
    episodic: '#818cf8', entity: '#22d3ee', summary: '#34d399', semantic: '#f59e0b',
  };
  const mtColor = r.memory_type ? (mtColors[r.memory_type] ?? '#94a3b8') : null;

  return (
    <div
      className="flex flex-col gap-1.5 px-3 py-2.5 rounded-lg transition-all"
      style={{
        background: multiSource ? 'rgba(251,191,36,0.06)' : 'rgba(255,255,255,0.025)',
        border: `1px solid ${multiSource ? 'rgba(251,191,36,0.3)' : 'rgba(255,255,255,0.06)'}`,
      }}
    >
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[9px] font-mono text-white/30 flex-shrink-0">{fmtId(r.id)}</span>
        {mtColor && r.memory_type && (
          <span className="px-1 py-0.5 rounded text-[8px] font-mono flex-shrink-0"
            style={{ color: mtColor, background: `${mtColor}15`, border: `1px solid ${mtColor}25` }}>
            {r.memory_type}
          </span>
        )}
        {multiSource && (
          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono flex-shrink-0"
            style={{ color: '#fbbf24', background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.3)' }}>
            multi
          </span>
        )}
        <ScorePill score={r.score} strategy={strategy} />
        {onOpenInGraph && (
          <button onClick={() => onOpenInGraph(r.id)}
            className="ml-auto text-white/20 hover:text-orange-400 transition-colors flex-shrink-0"
            title="Open in Graph Explorer">
            <Network className="w-3 h-3" />
          </button>
        )}
      </div>
      {r.content && (
        <p className="text-[9px] leading-relaxed line-clamp-2" style={{ color: `${stratColor}99` }}>
          {r.content}
        </p>
      )}
    </div>
  );
}

function StageColumn({
  title, strategy, refs, multiIds, onOpenInGraph,
}: {
  title: string; strategy: string; refs: MemoryRef[]; multiIds: Set<string>; onOpenInGraph?: (id: string) => void;
}) {
  const { color, icon } = STRATEGY_COLORS[strategy] ?? { color: '#94a3b8', icon: null };
  return (
    <div className="flex flex-col min-w-0 flex-1" style={{ minWidth: 0 }}>
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-t-xl flex-shrink-0"
        style={{ background: `${color}12`, border: `1px solid ${color}30`, borderBottom: 'none' }}
      >
        <span style={{ color }}>{icon}</span>
        <span className="text-[11px] font-medium" style={{ color }}>{title}</span>
        <span className="ml-auto text-[10px] font-mono text-white/25">{refs.length} refs</span>
      </div>
      <div
        className="flex flex-col gap-1.5 p-2 overflow-y-auto flex-1"
        style={{
          background: 'rgba(255,255,255,0.015)',
          border: `1px solid ${color}20`,
          borderTop: 'none',
          borderRadius: '0 0 12px 12px',
          maxHeight: '340px',
        }}
      >
        {refs.length === 0 ? (
          <p className="text-[10px] text-white/20 text-center py-4">No results</p>
        ) : (
          refs.filter(Boolean).map(r => (
            <RefCard key={r.id} ref={r} multiSource={multiIds.has(r.id)} strategy={strategy} onOpenInGraph={onOpenInGraph} />
          ))
        )}
      </div>
    </div>
  );
}

function MergedCard({ item, multiIds, onOpenInGraph }: { item: ComposedMemory; multiIds: Set<string>; onOpenInGraph?: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  if (!item) return null;
  const stratInfo = STRATEGY_COLORS[item.strategy] ?? { color: '#94a3b8', label: item.strategy ?? '' };
  const isMulti = multiIds.has(item.unit_id);

  const typeColor: Record<string, string> = {
    episodic: '#818cf8', entity: '#22d3ee', summary: '#34d399', semantic: '#f59e0b',
  };
  const tc = typeColor[item.memory_type] ?? '#94a3b8';

  const prov    = item.context?.provenance;
  const nouns   = item.context?.entities?.nouns ?? [];
  const sysAt   = item.context?.temporal?.system_at;
  const dateStr = sysAt ? new Date(sysAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : null;

  const CONTENT_PREVIEW = 260;
  const isLong = item.content.length > CONTENT_PREVIEW;

  return (
    <div
      className="rounded-xl p-4 space-y-2.5"
      style={{
        background: isMulti ? 'rgba(251,191,36,0.04)' : 'rgba(255,255,255,0.025)',
        border: `1px solid ${isMulti ? 'rgba(251,191,36,0.25)' : 'rgba(255,255,255,0.07)'}`,
      }}
    >
      {/* Header row */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] font-mono text-white/30">{fmtId(item.unit_id)}</span>
        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono"
          style={{ color: tc, background: `${tc}18`, border: `1px solid ${tc}30` }}>
          {item.memory_type}
        </span>
        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono"
          style={{ color: stratInfo.color, background: `${stratInfo.color}15`, border: `1px solid ${stratInfo.color}30` }}>
          {stratInfo.label}
        </span>
        {isMulti && (
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono"
            style={{ color: '#fbbf24', background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.3)' }}>
            multi-source
          </span>
        )}
        <span className="ml-auto text-[10px] font-mono tabular-nums" style={{ color: stratInfo.color }}>
          {item.score.toFixed(3)}
        </span>
        {onOpenInGraph && (
          <button onClick={() => onOpenInGraph(item.unit_id)}
            className="text-white/20 hover:text-orange-400 transition-colors flex-shrink-0"
            title="Open in Graph Explorer">
            <Network className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Provenance row */}
      {prov?.source_name && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[9px] text-white/30 flex items-center gap-1">
            <span style={{ opacity: 0.5 }}>📄</span>
            <span className="font-medium text-white/45">{prov.source_name}</span>
          </span>
          {prov.chunk_index !== undefined && (
            <span className="text-[8px] font-mono text-white/20">chunk {prov.chunk_index}</span>
          )}
          {dateStr && (
            <span className="text-[8px] font-mono text-white/20 ml-auto">{dateStr}</span>
          )}
        </div>
      )}

      {/* Entity tags */}
      {nouns.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap">
          {nouns.map(noun => (
            <span key={noun}
              className="px-1.5 py-0.5 rounded text-[8px] font-mono"
              style={{ color: '#22d3ee', background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.2)' }}>
              {noun}
            </span>
          ))}
        </div>
      )}

      {/* Content */}
      <div>
        <p className="text-[11px] text-white/65 leading-relaxed">
          {isLong && !expanded ? item.content.slice(0, CONTENT_PREVIEW) + '…' : item.content}
        </p>
        {isLong && (
          <button onClick={() => setExpanded(v => !v)}
            className="mt-1 text-[9px] transition-colors"
            style={{ color: `${stratInfo.color}80` }}>
            {expanded ? 'Show less' : 'Show more'}
          </button>
        )}
      </div>

      {/* Linked snippets (entity mentions etc.) */}
      {item.links && item.links.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-1" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <span className="text-[8px] text-white/20 mr-1 self-center">links:</span>
          {item.links.slice(0, 6).map((l, i) => {
            const mechColor: Record<string, string> = {
              entity_mention: '#22d3ee', semantic_similarity: '#f97316',
              narrative_thread: '#94a3b8', temporal_proximity: '#eab308', provenance_analysis: '#a78bfa',
            };
            const lc = mechColor[l.mechanism] ?? '#94a3b8';
            return (
              <span key={i}
                className="px-1.5 py-0.5 rounded text-[8px] font-mono"
                style={{ color: lc, background: `${lc}12`, border: `1px solid ${lc}25` }}
                title={`${l.mechanism} · w=${l.weight}`}>
                {l.snippet || fmtId(l.unit_id)}
              </span>
            );
          })}
          {item.links.length > 6 && (
            <span className="text-[8px] text-white/20 self-center">+{item.links.length - 6}</span>
          )}
        </div>
      )}
    </div>
  );
}

export function EngramRecall({ sapienId, onOpenInGraph }: { sapienId: number; onOpenInGraph?: (id: string) => void }) {
  const [query, setQuery]   = useState('');
  const [depth, setDepth]   = useState<RecallDepth>('shallow');
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState<string | null>(null);
  const [result, setResult] = useState<RecallResponse | null>(null);

  const submit = async () => {
    if (!query.trim() || loading) return;
    setLoading(true);
    setError(null);
    try {
      const r = await engramService.recall({ sapienId, query: query.trim(), depth });
      setResult(r);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit();
  };

  // Compute which unit IDs appear in >1 stage
  const multiIds = new Set<string>();
  if (result) {
    const counts = new Map<string, number>();
    const all = [
      ...result.stages.meaning.map(r => r.id),
      ...result.stages.keyword.map(r => r.id),
      ...result.stages.graph.map(r => r.id),
    ];
    all.forEach(id => counts.set(id, (counts.get(id) ?? 0) + 1));
    counts.forEach((n, id) => { if (n > 1) multiIds.add(id); });
    // Also include merged unit_ids that are multi-source
    result.merged.forEach(m => { if (multiIds.has(m.unit_id)) multiIds.add(m.unit_id); });
  }

  return (
    <div className="space-y-5">
      {/* Query form */}
      <div
        className="rounded-xl p-4 space-y-3"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div className="flex items-center gap-2 mb-1">
          <Search className="w-4 h-4 text-violet-400" />
          <span className="text-sm text-white/70">Recall Debugger</span>
        </div>

        <textarea
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={onKey}
          placeholder="Enter a query to trace through the recall pipeline…"
          rows={2}
          className="w-full bg-transparent border rounded-lg px-3 py-2 text-sm text-white/80
            placeholder:text-white/20 resize-none outline-none transition-colors"
          style={{ borderColor: 'rgba(255,255,255,0.1)' }}
          onFocus={e => { (e.target as HTMLElement).style.borderColor = 'rgba(124,58,237,0.4)'; }}
          onBlur={e  => { (e.target as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)'; }}
        />

        <div className="flex flex-wrap items-center gap-3">
          {/* Depth toggle */}
          <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
            {(['shallow', 'deep'] as RecallDepth[]).map(d => (
              <button
                key={d}
                onClick={() => setDepth(d)}
                className="px-3 py-1.5 text-[11px] transition-all"
                style={
                  depth === d
                    ? { background: 'rgba(124,58,237,0.25)', color: '#c4b5fd' }
                    : { background: 'transparent', color: 'rgba(255,255,255,0.35)' }
                }
              >
                {d}
              </button>
            ))}
          </div>

          <p className="text-[10px] text-white/20">Ctrl+Enter to run</p>

          <button
            onClick={submit}
            disabled={!query.trim() || loading}
            className="ml-auto flex items-center gap-2 px-4 py-1.5 rounded-lg text-[12px] font-medium transition-all disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: '#fff', boxShadow: '0 0 16px rgba(124,58,237,0.3)' }}
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            {loading ? 'Running…' : 'Run Recall'}
          </button>
        </div>
      </div>

      {error && <ErrorBox msg={error} />}

      {result && (
        <>
          {/* Stage columns */}
          <div className="flex flex-col gap-3 md:flex-row">
            <StageColumn title="Meaning" strategy="meaning" refs={result.stages.meaning} multiIds={multiIds} onOpenInGraph={onOpenInGraph} />
            <StageColumn title="Keyword" strategy="keyword" refs={result.stages.keyword} multiIds={multiIds} onOpenInGraph={onOpenInGraph} />
            <StageColumn title="Graph"   strategy="graph"   refs={result.stages.graph}   multiIds={multiIds} onOpenInGraph={onOpenInGraph} />
          </div>

          {/* Merged results */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <GitMerge className="w-4 h-4 text-white/40" />
              <span className="text-[11px] text-white/50">Merged results ({result.merged.length})</span>
              {multiIds.size > 0 && (
                <span
                  className="px-2 py-0.5 rounded-full text-[9px] font-mono"
                  style={{ color: '#fbbf24', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)' }}
                >
                  {multiIds.size} multi-source
                </span>
              )}
            </div>
            {result.merged.length === 0 ? (
              <p className="text-xs text-white/25">No merged results.</p>
            ) : (
              result.merged.filter(Boolean).map(m => (
                <MergedCard key={m.unit_id} item={m} multiIds={multiIds} onOpenInGraph={onOpenInGraph} />
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
