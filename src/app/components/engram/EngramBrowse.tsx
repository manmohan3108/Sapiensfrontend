import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Share2 } from 'lucide-react';
import { engramService } from '../../core/services/engramService';
import type { EngramUnit, MemoryType, UnitsListResponse } from '../../types/engramTypes';
import { EngramUnitDetail, fmtId } from './EngramUnitDetail';
import { CenteredLoader, ErrorBox } from './EngramDashboard';

const TYPES: { label: string; value: MemoryType | '' }[] = [
  { label: 'All types',  value: '' },
  { label: 'Episodic',   value: 'episodic' },
  { label: 'Entity',     value: 'entity' },
  { label: 'Summary',    value: 'summary' },
  { label: 'Semantic',   value: 'semantic' },
];

const TYPE_COLOR: Record<string, string> = {
  episodic: '#818cf8', entity: '#22d3ee', summary: '#34d399', semantic: '#f59e0b',
};

const PAGE_SIZE = 50;

export function EngramBrowse({ sapienId, onOpenInGraph }: { sapienId: number; onOpenInGraph?: (id: string) => void }) {
  const [filterType, setFilterType] = useState<MemoryType | ''>('');
  const [page, setPage]             = useState(1);
  const [data, setData]             = useState<UnitsListResponse | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailStack, setDetailStack] = useState<string[]>([]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    engramService.getUnits({
      sapienId,
      memoryType: filterType || null,
      page,
      pageSize: PAGE_SIZE,
    })
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [sapienId, filterType, page]);

  // Reset page when filter changes
  useEffect(() => { setPage(1); }, [filterType]);

  const openDetail = (id: string) => {
    if (selectedId) setDetailStack(s => [...s, selectedId]);
    setSelectedId(id);
  };

  const goBack = () => {
    const prev = detailStack[detailStack.length - 1] ?? null;
    setDetailStack(s => s.slice(0, -1));
    setSelectedId(prev);
  };

  if (selectedId) {
    return (
      <EngramUnitDetail
        unitId={selectedId}
        onBack={goBack}
        onNavigate={openDetail}
        onOpenInGraph={onOpenInGraph}
      />
    );
  }

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 1;

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        {TYPES.map(t => (
          <button
            key={t.value}
            onClick={() => setFilterType(t.value)}
            className="px-3 py-1.5 rounded-lg text-[11px] transition-all"
            style={
              filterType === t.value
                ? { background: 'rgba(129,140,248,0.18)', border: '1px solid rgba(129,140,248,0.4)', color: '#a5b4fc' }
                : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }
            }
          >
            {t.label}
          </button>
        ))}
        {data && (
          <span className="ml-auto text-[10px] font-mono text-white/25">
            {data.total.toLocaleString()} units
          </span>
        )}
      </div>

      {loading && <CenteredLoader />}
      {!loading && error && <ErrorBox msg={error} />}

      {!loading && !error && data && (
        <>
          {data.results.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-sm text-white/25">No units found.</div>
          ) : (
            <div className="space-y-1.5">
              {data.results.filter(Boolean).map(unit => (
                <UnitRow key={unit.id} unit={unit} onClick={() => openDetail(unit.id)} onOpenInGraph={onOpenInGraph} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] text-white/40 hover:text-white/70 disabled:opacity-30 transition-all"
                style={{ border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Prev
              </button>
              <span className="text-[11px] font-mono text-white/30">{page} / {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] text-white/40 hover:text-white/70 disabled:opacity-30 transition-all"
                style={{ border: '1px solid rgba(255,255,255,0.08)' }}
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function UnitRow({ unit, onClick, onOpenInGraph }: { unit: EngramUnit; onClick: () => void; onOpenInGraph?: (id: string) => void }) {
  if (!unit) return null;
  const color = TYPE_COLOR[unit.memory_type] ?? '#94a3b8';
  const preview = (unit.content ?? '').length > 120 ? unit.content.slice(0, 120) + '…' : (unit.content ?? '');

  return (
    <div
      className="flex items-start gap-3 px-4 py-3 rounded-xl transition-all"
      style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = `${color}35`; (e.currentTarget as HTMLElement).style.background = `${color}08`; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.025)'; }}
    >
      <span
        className="mt-1 w-2 h-2 rounded-full flex-shrink-0"
        style={{ background: color, boxShadow: `0 0 6px ${color}60` }}
      />
      <button onClick={onClick} className="flex-1 min-w-0 text-left">
        <p className="text-[11px] text-white/65 leading-relaxed break-words line-clamp-2">{preview}</p>
      </button>
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <span
          className="px-1.5 py-0.5 rounded text-[9px] font-mono"
          style={{ color, background: `${color}18`, border: `1px solid ${color}30` }}
        >
          {unit.memory_type}
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-mono text-white/20">{fmtId(unit.id)}</span>
          {onOpenInGraph && (
            <button
              onClick={e => { e.stopPropagation(); onOpenInGraph(unit.id); }}
              className="text-white/20 hover:text-orange-400 transition-colors"
              title="Open in Graph Explorer"
            >
              <Share2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
