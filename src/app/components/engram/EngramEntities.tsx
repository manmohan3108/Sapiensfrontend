import { useEffect, useMemo, useState } from 'react';
import { User, FileText, Search, Share2 } from 'lucide-react';
import { engramService } from '../../core/services/engramService';
import type { EngramUnit, EntityEpisodesResponse } from '../../types/engramTypes';
import { CenteredLoader, ErrorBox } from './EngramDashboard';
import { fmtId } from './EngramUnitDetail';

type EntitySort = 'name' | 'worth' | 'frequency' | 'recency' | 'episode_count';
type SortOrder = 'asc' | 'desc';

const controlClass = 'rounded-lg border border-white/10 bg-transparent px-2 py-1.5 text-[9px] text-white/55 outline-none placeholder:text-white/20';
const selectStyle = { colorScheme: 'dark', backgroundColor: '#0b1020', color: 'rgba(255,255,255,0.65)' } as const;
const optionStyle = { backgroundColor: '#0b1020', color: '#cbd5e1' } as const;
const recencyLabel = (value?: string) => {
  if (!value) return 'never';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' });
};

export function EngramEntities({ sapienId, onOpenInGraph }: { sapienId: number; onOpenInGraph?: (id: string) => void }) {
  const [entities, setEntities] = useState<EngramUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<EngramUnit | null>(null);
  const [episodes, setEpisodes] = useState<EntityEpisodesResponse | null>(null);
  const [epLoading, setEpLoading] = useState(false);
  const [epError, setEpError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<EntitySort>('name');
  const [order, setOrder] = useState<SortOrder>('asc');
  const serverEntitySort = sort === 'episode_count' ? 'episode_count' : undefined;
  const serverEntityOrder = serverEntitySort ? order : undefined;

  useEffect(() => {
    setLoading(true);
    setError(null);
    engramService.getEntities({ sapienId, pageSize: 200, sort: serverEntitySort, order: serverEntityOrder })
      .then(r => setEntities(r.results))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [sapienId, serverEntitySort, serverEntityOrder]);

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

  const visibleEntities = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    const valueOf = (entity: EngramUnit): string | number | null => {
      if (sort === 'name') return entity.content.toLocaleLowerCase();
      if (sort === 'worth') return entity.weights?.worth ?? null;
      if (sort === 'frequency') return entity.weights?.frequency ?? null;
      if (sort === 'episode_count') return entity.episode_count ?? null;
      const timestamp = entity.weights?.recency ? Date.parse(entity.weights.recency) : NaN;
      return Number.isNaN(timestamp) ? null : timestamp;
    };
    return entities.filter(entity => entity.content.toLocaleLowerCase().includes(query)).sort((a, b) => {
      const left = valueOf(a); const right = valueOf(b);
      let primary = 0;
      if (left === null || right === null) {
        if (left !== right) return left === null ? 1 : -1;
      } else primary = typeof left === 'string' && typeof right === 'string' ? left.localeCompare(right) : Number(left) - Number(right);
      if (primary !== 0) return order === 'asc' ? primary : -primary;
      const name = a.content.localeCompare(b.content, undefined, { sensitivity: 'base' });
      return name || a.id.localeCompare(b.id);
    });
  }, [entities, search, sort, order]);

  if (loading) return <CenteredLoader />;
  if (error)   return <ErrorBox msg={error} />;

  return (
    <div className="flex flex-col gap-4 h-full min-h-0 sm:flex-row">
      {/* Left — entity list */}
      <div
        className="w-full max-h-56 flex-shrink-0 flex flex-col gap-1.5 overflow-y-auto pr-1 sm:w-56 sm:max-h-none"
        style={{ maxHeight: 'calc(100vh - 220px)' }}
      >
        <div className="flex-shrink-0 space-y-1.5 pb-1">
          <div className="relative"><Search className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-white/20" /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search loaded entities" className={`${controlClass} w-full pl-7`} /></div>
          <div className="grid grid-cols-2 gap-1.5"><select value={sort} onChange={event => setSort(event.target.value as EntitySort)} className={controlClass} style={selectStyle} aria-label="Entity sort field"><option style={optionStyle} value="name">Name</option><option style={optionStyle} value="worth">Worth</option><option style={optionStyle} value="frequency">Frequency</option><option style={optionStyle} value="recency">Last used</option><option style={optionStyle} value="episode_count">Episode count</option></select><select value={order} onChange={event => setOrder(event.target.value as SortOrder)} className={controlClass} style={selectStyle} aria-label="Entity sort direction"><option style={optionStyle} value="asc">Min / A–Z first</option><option style={optionStyle} value="desc">Max / Z–A first</option></select></div>
          <p className="px-1 text-[8px] font-mono text-white/25">Showing {visibleEntities.length} of {entities.length} loaded{sort === 'episode_count' ? ' · globally ordered before paging' : ''}</p>
        </div>
        {entities.length === 0 && (
          <p className="text-xs text-white/25 px-2">No entities found.</p>
        )}
        {entities.length > 0 && visibleEntities.length === 0 && <p className="text-xs text-white/25 px-2">No loaded entities match.</p>}
        {visibleEntities.map(e => (
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
              className="flex-1 flex items-start gap-2 px-3 py-2 text-left text-[11px] transition-all min-w-0"
              style={{ color: selected?.id === e.id ? '#67e8f9' : 'rgba(255,255,255,0.55)' }}
            >
              <User className="mt-0.5 w-3 h-3 flex-shrink-0" />
              <span className="min-w-0 flex-1"><span className="block truncate">{e.content}</span><span className="mt-0.5 block truncate text-[8px] font-mono text-white/25" title={e.weights?.recency}>episodes {e.episode_count ?? '—'} · freq {e.weights?.frequency ?? '—'} · used {recencyLabel(e.weights?.recency)}</span></span>
              {typeof e.weights?.worth === 'number' && (
                <span
                  className="ml-auto flex-shrink-0 rounded px-1.5 py-0.5 text-[8px] font-mono"
                  style={{ color: '#fbbf24', background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)' }}
                  title="Entity MemoryUnit worth"
                >
                  worth {e.weights.worth.toFixed(2)}
                </span>
              )}
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
      <div className="h-px w-full flex-shrink-0 sm:h-auto sm:w-px" style={{ background: 'rgba(255,255,255,0.07)' }} />

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
                {typeof (episodes?.entity.weights?.worth ?? selected.weights?.worth) === 'number' && (
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-mono text-amber-300"
                    style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)' }}
                    title="Entity MemoryUnit importance"
                  >
                    worth {(episodes?.entity.weights?.worth ?? selected.weights?.worth)!.toFixed(2)}
                  </span>
                )}
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
                  <span className="text-[9px] font-mono text-white/20" title="Entity mention relationship strength">link w={ep.weight.toFixed(2)}</span>
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
