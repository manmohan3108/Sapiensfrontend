import { useEffect, useState } from 'react';
import { User, FileText, Share2 } from 'lucide-react';
import { engramService } from '../../core/services/engramService';
import type { EngramUnit, EntityEpisodesResponse } from '../../types/engramTypes';
import { CenteredLoader, ErrorBox } from './EngramDashboard';
import { fmtId } from './EngramUnitDetail';

export function EngramEntities({ sapienId, onOpenInGraph }: { sapienId: number; onOpenInGraph?: (id: string) => void }) {
  const [entities, setEntities] = useState<EngramUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<EngramUnit | null>(null);
  const [episodes, setEpisodes] = useState<EntityEpisodesResponse | null>(null);
  const [epLoading, setEpLoading] = useState(false);
  const [epError, setEpError] = useState<string | null>(null);

  useEffect(() => {
    engramService.getEntities({ sapienId, pageSize: 200 })
      .then(r => setEntities(r.results))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [sapienId]);

  const selectEntity = (entity: EngramUnit) => {
    setSelected(entity);
    setEpisodes(null);
    setEpError(null);
    setEpLoading(true);
    engramService.getEpisodes(entity.id)
      .then(setEpisodes)
      .catch((e: Error) => setEpError(e.message))
      .finally(() => setEpLoading(false));
  };

  if (loading) return <CenteredLoader />;
  if (error)   return <ErrorBox msg={error} />;

  return (
    <div className="flex gap-4 h-full min-h-0">
      {/* Left — entity list */}
      <div
        className="w-56 flex-shrink-0 flex flex-col gap-1.5 overflow-y-auto pr-1"
        style={{ maxHeight: 'calc(100vh - 220px)' }}
      >
        <p className="text-[9px] uppercase tracking-widest font-mono text-white/25 px-2 mb-1 flex-shrink-0">
          {entities.length} entities
        </p>
        {entities.length === 0 && (
          <p className="text-xs text-white/25 px-2">No entities found.</p>
        )}
        {entities.map(e => (
          <div
            key={e.id}
            className="flex items-center gap-1 rounded-lg transition-all"
            style={
              selected?.id === e.id
                ? { background: 'rgba(34,211,238,0.12)', border: '1px solid rgba(34,211,238,0.3)' }
                : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }
            }
          >
            <button
              onClick={() => selectEntity(e)}
              className="flex-1 flex items-center gap-2 px-3 py-2 text-left text-[11px] transition-all truncate min-w-0"
              style={{ color: selected?.id === e.id ? '#67e8f9' : 'rgba(255,255,255,0.55)' }}
            >
              <User className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{e.content}</span>
            </button>
            {onOpenInGraph && (
              <button
                onClick={() => onOpenInGraph(e.id)}
                className="px-1.5 text-white/20 hover:text-orange-400 transition-colors flex-shrink-0"
                title="Open in Graph Explorer"
              >
                <Share2 className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="w-px flex-shrink-0" style={{ background: 'rgba(255,255,255,0.07)' }} />

      {/* Right — episodes */}
      <div className="flex-1 min-w-0 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 220px)' }}>
        {!selected && (
          <div className="flex items-center justify-center h-40 text-sm text-white/20">
            Select an entity to see its episodes.
          </div>
        )}

        {selected && (
          <div className="space-y-4">
            {/* Entity header */}
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(34,211,238,0.15)', border: '1px solid rgba(34,211,238,0.3)' }}
              >
                <User className="w-4 h-4 text-cyan-300" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-white/85">{selected.content}</p>
                <p className="text-[10px] font-mono text-white/25">{fmtId(selected.id)}</p>
              </div>
              <div className="ml-auto flex items-center gap-2 flex-shrink-0">
                {episodes && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono text-cyan-300"
                    style={{ background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.2)' }}>
                    {episodes.count} episodes
                  </span>
                )}
                {onOpenInGraph && (
                  <button
                    onClick={() => onOpenInGraph(selected.id)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] transition-all hover:text-orange-300"
                    style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.25)', color: '#fb923c' }}
                    title="Open in Graph Explorer"
                  >
                    <Share2 className="w-3 h-3" />
                    Graph
                  </button>
                )}
              </div>
            </div>

            {epLoading && <CenteredLoader />}
            {epError   && <ErrorBox msg={epError} />}

            {episodes && episodes.episodes.length === 0 && (
              <p className="text-xs text-white/25">No episodes found for this entity.</p>
            )}

            {episodes && episodes.episodes.map(ep => (
              <div
                key={ep.id}
                className="rounded-xl p-4 space-y-2"
                style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <FileText className="w-3 h-3 text-white/30" />
                  <span className="text-[9px] font-mono text-white/30">{fmtId(ep.id)}</span>
                  <span
                    className="px-1.5 py-0.5 rounded text-[9px] font-mono"
                    style={{ color: '#818cf8', background: 'rgba(129,140,248,0.1)', border: '1px solid rgba(129,140,248,0.25)' }}
                  >
                    {ep.memory_type}
                  </span>
                  <span className="text-[9px] font-mono text-white/20">w={ep.weight.toFixed(2)}</span>
                  {onOpenInGraph && (
                    <button
                      onClick={() => onOpenInGraph(ep.id)}
                      className="ml-auto flex items-center gap-1 text-[9px] text-white/25 hover:text-orange-400 transition-colors"
                      title="Open in Graph Explorer"
                    >
                      <Share2 className="w-3 h-3" />
                      Graph
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-white/65 leading-relaxed">{ep.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
