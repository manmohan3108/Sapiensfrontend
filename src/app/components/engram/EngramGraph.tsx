import { useState, useRef, useEffect, useCallback } from 'react';
import cytoscape from 'cytoscape';
import type { Core, ElementDefinition } from 'cytoscape';
import { Search, Loader2, ZoomIn, ZoomOut, Maximize2, Copy, Share2, List } from 'lucide-react';
import { engramService } from '../../core/services/engramService';
import { MECH_COLORS, fmtId } from './EngramUnitDetail';
import { ErrorBox } from './EngramDashboard';
import type { SubgraphResponse, OverviewResponse, SequenceDirection } from '../../types/engramTypes';

const MEMORY_TYPE_COLORS: Record<string, string> = {
  episodic:   '#818cf8',
  semantic:   '#34d399',
  procedural: '#f97316',
  working:    '#22d3ee',
  entity:     '#e879f9',
  summary:    '#4ade80',
  default:    '#94a3b8',
};

function truncate(text: string, max = 34): string {
  if (!text) return '';
  const s = text.replace(/\s+/g, ' ').trim();
  return s.length > max ? s.slice(0, max) + '…' : s;
}

// Build Cytoscape elements from a subgraph response
function buildFromSubgraph(
  data: SubgraphResponse | OverviewResponse,
  center: string | null,
  existingNodes: Set<string>,
  existingEdges: Set<string>
): ElementDefinition[] {
  const els: ElementDefinition[] = [];
  const nodes = data.nodes;
  const edges = data.edges;

  nodes.forEach(n => {
    if (!existingNodes.has(n.id)) {
      els.push({
        data: {
          id:          n.id,
          label:       truncate(n.content) || fmtId(n.id),
          content:     n.content,
          memory_type: n.memory_type,
          isCenter:    n.id === center || undefined,
        },
      });
      existingNodes.add(n.id);
    }
  });

  edges.forEach(e => {
    const eid = `${e.source}--${e.target}--${e.mechanism}`;
    if (!existingEdges.has(eid) && existingNodes.has(e.source) && existingNodes.has(e.target)) {
      els.push({
        data: {
          id:        eid,
          source:    e.source,
          target:    e.target,
          mechanism: e.mechanism,
          relation:  e.relation,
          weight:    e.weight,
        },
      });
      existingEdges.add(eid);
    }
  });

  return els;
}

interface SelectedNode {
  id: string;
  content: string;
  memory_type: string;
  mechanism?: string;
  weight?: number;
}

export function EngramGraph({
  sapienId,
  initialId,
}: {
  sapienId: number;
  initialId?: string;
}) {
  const cyRef      = useRef<HTMLDivElement>(null);
  const cyInst     = useRef<Core | null>(null);
  const nodeSet    = useRef<Set<string>>(new Set());
  const edgeSet    = useRef<Set<string>>(new Set());

  const [inputId, setInputId]     = useState(initialId ?? '');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [nodeCount, setNodeCount] = useState(0);
  const [selected, setSelected]   = useState<SelectedNode | null>(null);
  const [copied, setCopied]       = useState(false);
  const [isOverview, setIsOverview] = useState(false);
  const [seqDir, setSeqDir]       = useState<SequenceDirection>('both');
  const [seqLoading, setSeqLoading] = useState(false);

  // Init Cytoscape
  useEffect(() => {
    if (!cyRef.current) return;
    const cy = cytoscape({
      container: cyRef.current,
      style: [
        {
          selector: 'node',
          style: {
            label:              'data(label)',
            'background-color': '#818cf8',
            'border-width':     2,
            'border-color':     '#4f46e5',
            color:              'rgba(255,255,255,0.85)',
            'font-size':        9,
            'text-valign':      'bottom',
            'text-margin-y':    5,
            'text-wrap':        'wrap',
            'text-max-width':   '80px',
            width:              34,
            height:             34,
          },
        },
        {
          selector: 'node[isCenter]',
          style: {
            'background-color': '#7c3aed',
            'border-color':     '#c4b5fd',
            'border-width':     3,
            width:              46,
            height:             46,
          },
        },
        {
          selector: 'node:selected',
          style: { 'border-color': '#fbbf24', 'border-width': 3 },
        },
        {
          selector: 'edge',
          style: {
            width:                2,
            'line-color':         '#94a3b8',
            'target-arrow-color': '#94a3b8',
            'target-arrow-shape': 'triangle',
            'curve-style':        'bezier',
            opacity:              0.6,
          },
        },
        {
          selector: 'edge[sequence]',
          style: {
            'line-style':     'dashed',
            'line-dash-pattern': [6, 3],
            opacity:          0.8,
          },
        },
      ],
      layout: { name: 'cose', animate: false } as cytoscape.LayoutOptions,
    });

    // Color edges by mechanism
    cy.on('add', 'edge', evt => {
      const mech  = evt.target.data('mechanism') as string ?? 'default';
      const color = MECH_COLORS[mech] ?? '#94a3b8';
      evt.target.style({ 'line-color': color, 'target-arrow-color': color });
    });

    // Color nodes by memory_type
    cy.on('add', 'node', evt => {
      const mt     = evt.target.data('memory_type') as string | undefined;
      const isCenter = evt.target.data('isCenter');
      if (!isCenter && mt) {
        const color = MEMORY_TYPE_COLORS[mt] ?? MEMORY_TYPE_COLORS.default;
        evt.target.style({ 'background-color': color, 'border-color': color });
      }
    });

    cy.on('select', 'node', evt => {
      const n     = evt.target;
      const edges = n.connectedEdges();
      let mech: string | undefined;
      let weight: number | undefined;
      if (edges.length > 0) {
        mech   = edges[0].data('mechanism');
        weight = edges[0].data('weight');
      }
      setSelected({
        id:          n.id(),
        content:     n.data('content') ?? '',
        memory_type: n.data('memory_type') ?? 'default',
        mechanism:   mech,
        weight,
      });
    });
    cy.on('unselect', 'node', () => setSelected(null));

    cyInst.current = cy;
    return () => { cy.destroy(); cyInst.current = null; };
  }, []);

  const resetGraph = useCallback(() => {
    cyInst.current?.elements().remove();
    nodeSet.current.clear();
    edgeSet.current.clear();
    setNodeCount(0);
    setSelected(null);
    setIsOverview(false);
    setError(null);
  }, []);

  // Load a subgraph centered on id
  const loadSubgraph = useCallback(async (id: string, depth = 2) => {
    const cy = cyInst.current;
    if (!cy) return;
    if (nodeSet.current.size >= 200) return;

    setLoading(true);
    setError(null);
    try {
      const remaining = 200 - nodeSet.current.size;
      const data = await engramService.getSubgraph(id, { depth, limit: Math.min(50, remaining) });
      const els  = buildFromSubgraph(data, id, nodeSet.current, edgeSet.current);
      if (els.length > 0) {
        cy.add(els);
        cy.layout({ name: 'cose', animate: true, animationDuration: 400 } as cytoscape.LayoutOptions).run();
        setNodeCount(nodeSet.current.size);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load overview (no unit selected)
  const loadOverview = useCallback(async () => {
    const cy = cyInst.current;
    if (!cy) return;
    setLoading(true);
    setError(null);
    try {
      const data = await engramService.getOverview(sapienId, { seed: 'top_entities', limit: 100 });
      if (data.nodes.length === 0) return;
      const els = buildFromSubgraph(data, null, nodeSet.current, edgeSet.current);
      cy.add(els);
      cy.layout({ name: 'cose', animate: true, animationDuration: 600 } as cytoscape.LayoutOptions).run();
      setNodeCount(nodeSet.current.size);
      setIsOverview(true);
    } catch {
      // Overview is optional — silently ignore
    } finally {
      setLoading(false);
    }
  }, [sapienId]);

  // Load sequence (narrative chain) for selected node
  const loadSequence = useCallback(async (id: string) => {
    const cy = cyInst.current;
    if (!cy || !nodeSet.current.has(id)) return;
    setSeqLoading(true);
    try {
      const data = await engramService.getSequence(id, { direction: seqDir, limit: 20 });
      if (data.sequence.length === 0) return;

      // Add sequence nodes and chain edges
      let prevId = id;
      const els: ElementDefinition[] = [];
      data.sequence.forEach(ref => {
        if (!nodeSet.current.has(ref.id)) {
          els.push({
            data: {
              id:          ref.id,
              label:       ref.content ? truncate(ref.content) : fmtId(ref.id),
              content:     ref.content ?? '',
              memory_type: ref.memory_type ?? 'episodic',
            },
          });
          nodeSet.current.add(ref.id);
        }
        const eid = `${prevId}--${ref.id}--narrative_thread`;
        if (!edgeSet.current.has(eid)) {
          els.push({
            data: {
              id:        eid,
              source:    prevId,
              target:    ref.id,
              mechanism: 'narrative_thread',
              weight:    ref.score,
              sequence:  true,
            },
          });
          edgeSet.current.add(eid);
        }
        prevId = ref.id;
      });
      if (els.length > 0) {
        cy.add(els);
        cy.layout({ name: 'cose', animate: true, animationDuration: 400 } as cytoscape.LayoutOptions).run();
        setNodeCount(nodeSet.current.size);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSeqLoading(false);
    }
  }, [seqDir]);

  // Double-click to expand
  useEffect(() => {
    const cy = cyInst.current;
    if (!cy) return;
    const handler = (evt: cytoscape.EventObject) => {
      if (isOverview) {
        // First double-click on overview resets and focuses on that node
        resetGraph();
        setInputId(evt.target.id());
        loadSubgraph(evt.target.id(), 2);
        return;
      }
      loadSubgraph(evt.target.id(), 1);
    };
    cy.on('dblclick', 'node', handler);
    return () => { cy.off('dblclick', 'node', handler); };
  }, [loadSubgraph, loadOverview, resetGraph, isOverview]);

  // Auto-load when initialId changes
  useEffect(() => {
    if (!initialId) return;
    setInputId(initialId);
    resetGraph();
    loadSubgraph(initialId, 2);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialId]);

  // Load overview on mount if no initialId
  useEffect(() => {
    if (!initialId) {
      loadOverview();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = async () => {
    const id = inputId.trim();
    if (!id) return;
    resetGraph();
    await loadSubgraph(id, 2);
  };

  const copyId = (id: string) => {
    navigator.clipboard.writeText(id).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const mtColor   = selected ? (MEMORY_TYPE_COLORS[selected.memory_type] ?? MEMORY_TYPE_COLORS.default) : '#94a3b8';
  const mechColor = selected?.mechanism ? (MECH_COLORS[selected.mechanism] ?? '#94a3b8') : '#94a3b8';

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Controls */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div
          className="flex-1 flex items-center gap-2 rounded-lg px-3 py-2"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <Search className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
          <input
            value={inputId}
            onChange={e => setInputId(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }}
            placeholder="Paste unit ID to focus, or explore the overview…"
            className="flex-1 bg-transparent outline-none text-sm text-white/70 placeholder:text-white/20"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={!inputId.trim() || loading}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] transition-all disabled:opacity-40"
          style={{ background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.35)', color: '#c4b5fd' }}
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
          Load
        </button>
        <div className="flex items-center gap-1 ml-1">
          <button onClick={() => cyInst.current?.zoom({ level: (cyInst.current?.zoom() ?? 1) * 1.2 })}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-white/40 hover:text-white/70 transition-colors"
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => cyInst.current?.zoom({ level: (cyInst.current?.zoom() ?? 1) * 0.8 })}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-white/40 hover:text-white/70 transition-colors"
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => cyInst.current?.fit()}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-white/40 hover:text-white/70 transition-colors"
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {error && <ErrorBox msg={error} />}

      {/* Status */}
      <div className="flex items-center gap-3 text-[10px] text-white/25 flex-shrink-0">
        <span>{nodeCount} / 200 nodes</span>
        {isOverview && (
          <span className="text-violet-400/60">Overview — double-click a node to dive in</span>
        )}
        {loading && <span className="text-violet-400/60 animate-pulse">Loading…</span>}
        <span className="ml-auto">Click to inspect · Double-click to expand</span>
      </div>

      {/* Main area */}
      <div className="flex flex-1 gap-3 min-h-0">
        {/* Canvas */}
        <div
          ref={cyRef}
          className="flex-1 rounded-xl overflow-hidden"
          style={{ background: 'rgba(4,8,18,0.8)', border: '1px solid rgba(255,255,255,0.07)', minHeight: 340 }}
        />

        {/* Selection / legend panel */}
        <div
          className="w-56 flex-shrink-0 rounded-xl flex flex-col gap-3 p-4 overflow-y-auto"
          style={{ background: 'rgba(8,12,24,0.95)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          {selected ? (
            <>
              {/* ID */}
              <div>
                <div className="text-[9px] uppercase tracking-widest text-white/25 mb-1">Unit ID</div>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[11px] text-white/50">{fmtId(selected.id)}</span>
                  <button onClick={() => copyId(selected.id)} className="ml-auto text-white/25 hover:text-white/60 transition-colors" title="Copy full ID">
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
                {copied && <div className="text-[9px] text-emerald-400 mt-0.5">Copied!</div>}
              </div>

              {/* Memory type */}
              <div>
                <div className="text-[9px] uppercase tracking-widest text-white/25 mb-1.5">Memory Type</div>
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium"
                  style={{ background: `${mtColor}20`, border: `1px solid ${mtColor}40`, color: mtColor }}>
                  {selected.memory_type || 'unknown'}
                </span>
              </div>

              {/* Edge mechanism */}
              {selected.mechanism && (
                <div>
                  <div className="text-[9px] uppercase tracking-widest text-white/25 mb-1.5">Link via</div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px]"
                      style={{ background: `${mechColor}15`, border: `1px solid ${mechColor}35`, color: mechColor }}>
                      {selected.mechanism.replace(/_/g, ' ')}
                    </span>
                    {selected.weight !== undefined && (
                      <span className="text-[10px] text-white/30 tabular-nums">{selected.weight.toFixed(3)}</span>
                    )}
                  </div>
                </div>
              )}

              {/* Content */}
              <div className="flex-1">
                <div className="text-[9px] uppercase tracking-widest text-white/25 mb-1.5">Content</div>
                {selected.content ? (
                  <p className="text-[11px] text-white/65 leading-relaxed whitespace-pre-wrap break-words">
                    {selected.content.length > 400 ? selected.content.slice(0, 400) + '…' : selected.content}
                  </p>
                ) : (
                  <p className="text-[11px] text-white/20 italic">No content</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                {/* Open in graph (expand) */}
                <button
                  onClick={() => loadSubgraph(selected.id, 1)}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] transition-all disabled:opacity-40"
                  style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.25)', color: '#c4b5fd' }}
                >
                  <Share2 className="w-3 h-3" />
                  Expand neighbors
                </button>

                {/* Sequence explorer */}
                <div>
                  <div className="text-[9px] uppercase tracking-widest text-white/20 mb-1">Sequence chain</div>
                  <div className="flex items-center gap-1 mb-1.5">
                    {(['backward', 'both', 'forward'] as SequenceDirection[]).map(d => (
                      <button
                        key={d}
                        onClick={() => setSeqDir(d)}
                        className="flex-1 py-0.5 rounded text-[8px] transition-all"
                        style={seqDir === d
                          ? { background: 'rgba(148,163,184,0.2)', border: '1px solid rgba(148,163,184,0.35)', color: '#94a3b8' }
                          : { background: 'transparent', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.2)' }}
                      >
                        {d === 'backward' ? '←' : d === 'forward' ? '→' : '↔'}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => loadSequence(selected.id)}
                    disabled={seqLoading}
                    className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] transition-all disabled:opacity-40"
                    style={{ background: 'rgba(148,163,184,0.08)', border: '1px solid rgba(148,163,184,0.2)', color: '#94a3b8' }}
                  >
                    {seqLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <List className="w-3 h-3" />}
                    Load sequence
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* Legend */
            <div className="flex flex-col gap-4">
              <div>
                <div className="text-[9px] uppercase tracking-widest text-white/20 mb-2">Node — memory type</div>
                <div className="flex flex-col gap-1.5">
                  {Object.entries(MEMORY_TYPE_COLORS).filter(([k]) => k !== 'default').map(([mt, c]) => (
                    <div key={mt} className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c }} />
                      <span className="text-[9px] text-white/30">{mt}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-[9px] uppercase tracking-widest text-white/20 mb-2">Edge — mechanism</div>
                <div className="flex flex-col gap-1.5">
                  {Object.entries(MECH_COLORS).map(([mech, c]) => (
                    <div key={mech} className="flex items-center gap-1.5">
                      <span className="w-3 h-0.5 rounded-full flex-shrink-0" style={{ background: c }} />
                      <span className="text-[9px] text-white/30">{mech.replace(/_/g, ' ')}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="w-3 flex-shrink-0" style={{ borderBottom: '1px dashed #94a3b8' }} />
                  <span className="text-[9px] text-white/30">narrative sequence</span>
                </div>
              </div>
              {isOverview && (
                <p className="text-[9px] text-white/25 leading-relaxed">
                  Showing a sampled overview of this sapien's memory. Double-click any node to explore its subgraph.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
