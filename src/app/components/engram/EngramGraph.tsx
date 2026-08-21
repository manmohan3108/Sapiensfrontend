import { useState, useRef, useEffect, useCallback } from 'react';
import cytoscape from 'cytoscape';
import type { Core, ElementDefinition } from 'cytoscape';
import { Search, Loader2, ZoomIn, ZoomOut, Maximize2, RotateCcw, Copy, Share2, List } from 'lucide-react';
import { engramService } from '../../core/services/engramService';
import { MECH_COLORS, fmtId } from './EngramUnitDetail';
import { ErrorBox } from './EngramDashboard';
import type { SequenceDirection } from '../../types/engramTypes';

// ── Palettes (only well-known Cytoscape properties used) ─────────────────────
const MT_COLOR: Record<string, string> = {
  episodic:   '#818cf8',
  semantic:   '#34d399',
  entity:     '#22d3ee',
  summary:    '#fbbf24',
  procedural: '#f97316',
  working:    '#c4b5fd',
  default:    '#94a3b8',
};

function truncate(text: string, max = 28): string {
  if (!text) return '';
  const s = text.replace(/\s+/g, ' ').trim();
  return s.length > max ? s.slice(0, max) + '…' : s;
}

interface SelectedNode {
  id: string;
  content: string;
  memory_type: string;
  mechanism?: string;
  weight?: number;
}

export function EngramGraph({ sapienId: _sapienId, initialId }: { sapienId: number; initialId?: string }) {
  const cyRef   = useRef<HTMLDivElement>(null);
  const cyInst  = useRef<Core | null>(null);
  const loaded  = useRef<Set<string>>(new Set()); // IDs already expanded

  const [inputId, setInputId]       = useState(initialId ?? '');
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [nodeCount, setNodeCount]   = useState(0);
  const [selected, setSelected]     = useState<SelectedNode | null>(null);
  const [copied, setCopied]         = useState(false);
  const [seqDir, setSeqDir]         = useState<SequenceDirection>('both');
  const [seqLoading, setSeqLoading] = useState(false);

  // ── Init cytoscape ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!cyRef.current) return;

    const cy = cytoscape({
      container: cyRef.current,
      style: [
        {
          selector: 'node',
          style: {
            width:               36,
            height:              36,
            shape:               'ellipse',
            'background-color':  '#818cf8',
            'border-width':      2,
            'border-color':      '#4f46e5',
            label:               'data(label)',
            color:               '#ffffff',
            'font-size':         9,
            'text-valign':       'bottom',
            'text-halign':       'center',
            'text-margin-y':     6,
            'text-wrap':         'wrap',
            'text-max-width':    '80px',
            'text-outline-width': 2,
            'text-outline-color': '#060a15',
          },
        },
        {
          selector: 'node[isCenter = 1]',
          style: {
            width:              52,
            height:             52,
            'background-color': '#7c3aed',
            'border-color':     '#c4b5fd',
            'border-width':     3,
          },
        },
        {
          selector: 'node[shape = "diamond"]',
          style: { shape: 'diamond' },
        },
        {
          selector: 'node:selected',
          style: {
            'border-color': '#fbbf24',
            'border-width':  3,
          },
        },
        {
          selector: 'edge',
          style: {
            width:                2,
            'line-color':         '#475569',
            'target-arrow-color': '#475569',
            'target-arrow-shape': 'triangle',
            'curve-style':        'bezier',
            opacity:              0.65,
          },
        },
        {
          selector: 'edge[dashed = 1]',
          style: {
            'line-style':        'dashed',
            'line-dash-pattern': [6, 3],
          },
        },
      ],
      layout: { name: 'preset' } as cytoscape.LayoutOptions,
    });

    cy.on('add', 'node', evt => {
      const mt       = evt.target.data('mt') as string;
      const isCenter = evt.target.data('isCenter') as number;
      if (!isCenter) {
        evt.target.style({ 'background-color': MT_COLOR[mt] ?? MT_COLOR.default, 'border-color': MT_COLOR[mt] ?? MT_COLOR.default });
      }
      if (mt === 'entity') evt.target.style({ shape: 'diamond' });
    });

    cy.on('add', 'edge', evt => {
      const mech  = evt.target.data('mech') as string;
      const color = MECH_COLORS[mech] ?? '#475569';
      const w     = Math.max(1, Math.min(4, (evt.target.data('weight') as number ?? 0.5) * 3));
      evt.target.style({ 'line-color': color, 'target-arrow-color': color, width: w });
    });

    cy.on('select', 'node', evt => {
      const n = evt.target;
      const edge = n.connectedEdges().first();
      setSelected({
        id:          n.id(),
        content:     n.data('content') ?? '',
        memory_type: n.data('mt') ?? 'default',
        mechanism:   edge.length ? edge.data('mech')   : undefined,
        weight:      edge.length ? edge.data('weight')  : undefined,
      });
    });
    cy.on('unselect', 'node', () => setSelected(null));

    cyInst.current = cy;
    return () => { cy.destroy(); cyInst.current = null; };
  }, []);

  // ── Core expand: load a node's neighbors via getAdjacent ───────────────────
  const expand = useCallback(async (centerId: string) => {
    const cy = cyInst.current;
    if (!cy) return;
    if (loaded.current.has(centerId)) return; // already expanded
    loaded.current.add(centerId);

    // Ensure center node exists
    if (!cy.getElementById(centerId).length) {
      // Fetch center node content
      try {
        const detail = await engramService.getUnit(centerId);
        const u = detail.unit;
        cy.add({
          data: {
            id:       centerId,
            label:    truncate(u.content) || fmtId(centerId),
            content:  u.content,
            mt:       u.memory_type,
            isCenter: 1,
          },
        });
      } catch {
        cy.add({ data: { id: centerId, label: fmtId(centerId), content: '', mt: 'default', isCenter: 1 } });
      }
    } else {
      // Mark existing node as center
      cy.getElementById(centerId).data('isCenter', 1);
      cy.getElementById(centerId).style({ 'background-color': '#7c3aed', 'border-color': '#c4b5fd', 'border-width': 3, width: 52, height: 52 });
    }

    // Fetch neighbors
    const res = await engramService.getAdjacent(centerId);
    const newNodes: ElementDefinition[] = [];
    const newEdges: ElementDefinition[] = [];

    res.neighbors.filter(Boolean).forEach(n => {
      if (!cy.getElementById(n.id).length) {
        newNodes.push({
          data: {
            id:      n.id,
            label:   n.content ? truncate(n.content) : fmtId(n.id),
            content: n.content ?? '',
            mt:      n.memory_type ?? 'default',
            isCenter: 0,
          },
        });
      }
      const eid = `${centerId}__${n.id}`;
      if (!cy.getElementById(eid).length) {
        newEdges.push({
          data: {
            id:     eid,
            source: centerId,
            target: n.id,
            mech:   n.meta?.mechanism ?? 'default',
            weight: n.score ?? 0.5,
          },
        });
      }
    });

    cy.add([...newNodes, ...newEdges]);

    // Re-run layout on everything
    cy.layout({
      name:    'cose',
      animate: true,
      animationDuration: 400,
      fit:     true,
      padding: 40,
    } as cytoscape.LayoutOptions).run();

    setNodeCount(cy.nodes().length);
  }, []);

  // ── Load center ─────────────────────────────────────────────────────────────
  const loadCenter = useCallback(async (id: string) => {
    const cy = cyInst.current;
    if (!cy) return;

    // Reset
    cy.elements().remove();
    loaded.current.clear();
    setNodeCount(0);
    setSelected(null);
    setError(null);

    setLoading(true);
    try {
      await expand(id);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [expand]);

  // ── Sequence ────────────────────────────────────────────────────────────────
  const loadSequence = useCallback(async (id: string) => {
    const cy = cyInst.current;
    if (!cy) return;
    setSeqLoading(true);
    try {
      const res = await engramService.getSequence(id, { direction: seqDir, limit: 20 });
      if (!res.sequence?.length) return;
      const els: ElementDefinition[] = [];
      let prevId = id;
      res.sequence.forEach(ref => {
        if (!cy.getElementById(ref.id).length) {
          els.push({ data: { id: ref.id, label: truncate(ref.content ?? '') || fmtId(ref.id), content: ref.content ?? '', mt: ref.memory_type ?? 'episodic', isCenter: 0 } });
        }
        const eid = `${prevId}__${ref.id}__seq`;
        if (!cy.getElementById(eid).length) {
          els.push({ data: { id: eid, source: prevId, target: ref.id, mech: 'narrative_thread', weight: 0.5, dashed: 1 } });
        }
        prevId = ref.id;
      });
      if (els.length) {
        cy.add(els);
        cy.layout({ name: 'cose', animate: true, fit: true, padding: 40 } as cytoscape.LayoutOptions).run();
        setNodeCount(cy.nodes().length);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSeqLoading(false);
    }
  }, [seqDir]);

  // ── Effects ─────────────────────────────────────────────────────────────────
  // Double-click expands neighbors
  useEffect(() => {
    const cy = cyInst.current;
    if (!cy) return;
    const h = (evt: cytoscape.EventObject) => {
      setLoading(true);
      expand(evt.target.id()).finally(() => setLoading(false));
    };
    cy.on('dblclick', 'node', h);
    return () => { cy.off('dblclick', 'node', h); };
  }, [expand]);

  // Auto-load when initialId prop changes
  useEffect(() => {
    if (!initialId) return;
    setInputId(initialId);
    loadCenter(initialId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialId]);

  const handleSearch = () => {
    const id = inputId.trim();
    if (!id || loading) return;
    loadCenter(id);
  };

  // ── Colors for the panel ────────────────────────────────────────────────────
  const selColor   = selected ? (MT_COLOR[selected.memory_type] ?? MT_COLOR.default) : '#94a3b8';
  const mechColor  = selected?.mechanism ? (MECH_COLORS[selected.mechanism] ?? '#475569') : '#475569';

  return (
    <div className="flex flex-col gap-3 h-full">

      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-2 flex-shrink-0"
        style={{ background: 'rgba(6,10,20,0.85)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '8px 12px' }}>
        <div className="flex min-w-[12rem] flex-1 items-center gap-2 rounded-lg px-3 py-1.5"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <Search className="w-3.5 h-3.5 text-white/25 flex-shrink-0" />
          <input
            value={inputId}
            onChange={e => setInputId(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }}
            placeholder="Paste unit ID and press Enter…"
            className="flex-1 bg-transparent outline-none text-[12px] text-white/65 placeholder:text-white/20 min-w-0"
          />
          {inputId && <button onClick={() => setInputId('')} className="text-white/20 hover:text-white/50 text-sm leading-none">×</button>}
        </div>

        <button onClick={handleSearch} disabled={!inputId.trim() || loading}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[11px] font-medium disabled:opacity-30 transition-all"
          style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: '#fff', boxShadow: '0 0 12px rgba(124,58,237,0.3)' }}>
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
          Load
        </button>

        <div className="w-px h-5 flex-shrink-0" style={{ background: 'rgba(255,255,255,0.08)' }} />

        <div className="flex items-center gap-1">
          {[
            { icon: <ZoomIn className="w-3.5 h-3.5" />,    title: 'Zoom in',  fn: () => { const cy = cyInst.current; if (cy) cy.zoom({ level: cy.zoom() * 1.25 }); } },
            { icon: <ZoomOut className="w-3.5 h-3.5" />,   title: 'Zoom out', fn: () => { const cy = cyInst.current; if (cy) cy.zoom({ level: cy.zoom() * 0.8 }); } },
            { icon: <Maximize2 className="w-3.5 h-3.5" />, title: 'Fit all',  fn: () => cyInst.current?.fit(undefined, 40) },
            { icon: <RotateCcw className="w-3.5 h-3.5" />, title: 'Reset',    fn: () => { if (!cyInst.current) return; cyInst.current.elements().remove(); loaded.current.clear(); setNodeCount(0); setSelected(null); setError(null); } },
          ].map(({ icon, title, fn }) => (
            <button key={title} onClick={fn} title={title}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-white/35 hover:text-white/70 hover:bg-white/5 transition-all">
              {icon}
            </button>
          ))}
        </div>
      </div>

      {error && <ErrorBox msg={error} />}

      {/* ── Main: canvas + panel ── */}
      <div className="flex flex-1 flex-col gap-3 min-h-0 md:flex-row">

        {/* Canvas — cyRef IS the direct flex child so dimensions are always correct */}
        <div
          ref={cyRef}
          className="flex-1 rounded-2xl overflow-hidden"
          style={{
            minHeight: 340,
            background: '#030912',
            backgroundImage: 'radial-gradient(rgba(99,102,241,0.1) 1.2px, transparent 1.2px)',
            backgroundSize: '28px 28px',
            border: '1px solid rgba(99,102,241,0.2)',
            position: 'relative',   // needed for Cytoscape internal positioning
          }}
        >
          {/* Empty state — rendered INSIDE cyRef, Cytoscape co-exists with React children here */}
          {nodeCount === 0 && !loading && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 1 }}>
              <div style={{ background: 'rgba(3,9,18,0.75)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '28px 36px', textAlign: 'center' }}>
                <Share2 style={{ width: 24, height: 24, color: 'rgba(129,140,248,0.4)', margin: '0 auto 12px' }} />
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>Paste a unit ID and click Load</p>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.18)', marginTop: 4 }}>Double-click any node to expand its neighbors</p>
              </div>
            </div>
          )}
          {loading && (
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, zIndex: 2, background: 'linear-gradient(90deg,transparent,rgba(129,140,248,0.8),transparent)', animation: 'pulse 1.2s ease-in-out infinite' }} />
          )}
          {nodeCount > 0 && (
            <div style={{ position: 'absolute', bottom: 12, left: 12, zIndex: 2, pointerEvents: 'none' }}>
              <span style={{ fontSize: 9, fontFamily: 'monospace', background: 'rgba(3,9,18,0.8)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 6, padding: '3px 8px', color: 'rgba(255,255,255,0.3)' }}>
                {nodeCount} nodes
              </span>
            </div>
          )}
        </div>

        {/* Detail / legend panel */}
        <div className="w-full flex-shrink-0 flex flex-col rounded-2xl overflow-hidden md:w-[216px]"
          style={{ background: 'rgba(6,10,20,0.96)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)' }}>

          {/* Color strip */}
          <div className="h-1 flex-shrink-0"
            style={{ background: selected ? `linear-gradient(90deg,${selColor},${selColor}60)` : 'linear-gradient(90deg,rgba(99,102,241,0.5),rgba(139,92,246,0.3))' }} />

          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 min-h-0">
            {selected ? (
              <>
                {/* ID + type */}
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: selColor }} />
                  <span className="text-[10px] font-medium" style={{ color: selColor }}>{selected.memory_type}</span>
                  <div className="ml-auto flex items-center gap-1.5">
                    <span className="text-[9px] font-mono text-white/30">{fmtId(selected.id)}</span>
                    <button onClick={() => { navigator.clipboard.writeText(selected.id).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
                      className="text-white/20 hover:text-white/60 transition-colors">
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                {copied && <p className="text-[9px] text-emerald-400 -mt-2">Copied!</p>}

                {/* Mechanism */}
                {selected.mechanism && (
                  <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg"
                    style={{ background: `${mechColor}12`, border: `1px solid ${mechColor}35` }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: mechColor }} />
                    <span className="text-[9px]" style={{ color: mechColor }}>{selected.mechanism.replace(/_/g, ' ')}</span>
                    {selected.weight !== undefined && (
                      <span className="ml-auto text-[9px] font-mono tabular-nums" style={{ color: `${mechColor}99` }}>{selected.weight.toFixed(3)}</span>
                    )}
                  </div>
                )}

                {/* Content */}
                <div className="flex-1">
                  <p className="text-[9px] uppercase tracking-widest text-white/20 mb-2">Content</p>
                  <div className="rounded-xl p-3" style={{ background: `${selColor}15`, border: `1px solid ${selColor}25` }}>
                    <p className="text-[11px] text-white/70 leading-relaxed break-words">
                      {selected.content || <span className="italic text-white/25">No content</span>}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 12 }}>
                  <button onClick={() => { setLoading(true); expand(selected.id).finally(() => setLoading(false)); }}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] font-medium disabled:opacity-30 transition-all"
                    style={{ background: `${selColor}25`, border: `1px solid ${selColor}40`, color: selColor }}>
                    <Share2 className="w-3 h-3" /> Expand neighbors
                  </button>

                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-white/20 mb-1.5">Narrative chain</p>
                    <div className="flex gap-1 mb-1.5">
                      {(['backward', 'both', 'forward'] as SequenceDirection[]).map(d => (
                        <button key={d} onClick={() => setSeqDir(d)}
                          className="flex-1 py-1 rounded-lg text-[9px] transition-all"
                          style={seqDir === d
                            ? { background: 'rgba(148,163,184,0.18)', border: '1px solid rgba(148,163,184,0.35)', color: '#cbd5e1' }
                            : { background: 'transparent', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.2)' }}>
                          {d === 'backward' ? '←' : d === 'forward' ? '→' : '↔'}
                        </button>
                      ))}
                    </div>
                    <button onClick={() => loadSequence(selected.id)} disabled={seqLoading}
                      className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] disabled:opacity-30 transition-all"
                      style={{ background: 'rgba(148,163,184,0.07)', border: '1px solid rgba(148,163,184,0.15)', color: '#94a3b8' }}>
                      {seqLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <List className="w-3 h-3" />}
                      Load sequence
                    </button>
                  </div>
                </div>
              </>
            ) : (
              /* Legend */
              <div className="flex flex-col gap-5">
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-white/20 mb-2.5">Node — memory type</p>
                  <div className="flex flex-col gap-2">
                    {Object.entries(MT_COLOR).filter(([k]) => k !== 'default').map(([mt, c]) => (
                      <div key={mt} className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: c }} />
                        <span className="text-[9px] text-white/40">{mt}</span>
                        {mt === 'entity' && <span className="text-[8px] text-white/20 ml-auto">◆ diamond</span>}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-white/20 mb-2.5">Edge — mechanism</p>
                  <div className="flex flex-col gap-2">
                    {Object.entries(MECH_COLORS).map(([mech, c]) => (
                      <div key={mech} className="flex items-center gap-2">
                        <span className="flex-shrink-0 rounded-sm" style={{ width: 14, height: 2, background: c, display: 'inline-block' }} />
                        <span className="text-[9px] text-white/35">{mech.replace(/_/g, ' ')}</span>
                      </div>
                    ))}
                    <div className="flex items-center gap-2">
                      <span className="flex-shrink-0" style={{ width: 14, display: 'inline-block', borderBottom: '2px dashed #475569' }} />
                      <span className="text-[9px] text-white/35">narrative sequence</span>
                    </div>
                  </div>
                </div>
                <div className="mt-auto pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <p className="text-[9px] text-white/20 leading-relaxed">
                    Click node to inspect · Double-click to expand
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
