import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import {
  ChevronLeft, ChevronDown, ChevronRight, RefreshCw, MessageSquare,
  Loader2, AlertCircle, RotateCcw, CheckCircle2, Circle,
  MinusCircle, Zap, AlertTriangle, Send,
} from 'lucide-react';
import { goalsService, OverloadedError } from '../../core/services/goalsService';
import { useSapiensStore } from '../../core/state/sapiensStore';
import type {
  Goal, GoalDetail, GoalStatus, GoalSource, StepStatus,
  GoalContext, Plan, PlanStep, ContextQuestion, ContextDecision,
} from '../../types/goalTypes';

// ── Color maps ────────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<GoalStatus, { label: string; color: string; bg: string; border: string }> = {
  pending:   { label: 'Pending',   color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.25)' },
  active:    { label: 'Active',    color: '#60a5fa', bg: 'rgba(96,165,250,0.12)', border: 'rgba(96,165,250,0.3)'  },
  blocked:   { label: 'Blocked',   color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',  border: 'rgba(251,191,36,0.3)'  },
  done:      { label: 'Done',      color: '#34d399', bg: 'rgba(52,211,153,0.1)',  border: 'rgba(52,211,153,0.3)'  },
  failed:    { label: 'Failed',    color: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.3)' },
  abandoned: { label: 'Abandoned', color: '#64748b', bg: 'rgba(100,116,139,0.1)', border: 'rgba(100,116,139,0.25)' },
};

const SOURCE_STYLE: Record<GoalSource, { label: string; color: string; bg: string }> = {
  user:      { label: 'You',       color: '#c4b5fd', bg: 'rgba(196,181,253,0.12)' },
  curiosity: { label: 'Curiosity', color: '#22d3ee', bg: 'rgba(34,211,238,0.1)'  },
  parent:    { label: 'Parent',    color: '#818cf8', bg: 'rgba(129,140,248,0.12)' },
  lesson:    { label: 'Lesson',    color: '#fb923c', bg: 'rgba(251,146,60,0.1)'   },
  external:  { label: 'External',  color: '#94a3b8', bg: 'rgba(148,163,184,0.1)'  },
};

const STEP_ICON: Record<StepStatus, React.ReactNode> = {
  pending: <Circle        className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#475569' }} />,
  active:  <Zap           className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#60a5fa' }} />,
  done:    <CheckCircle2  className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#34d399' }} />,
  skipped: <MinusCircle   className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#475569' }} />,
  blocked: <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#fbbf24' }} />,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function planProgress(plan: Plan | null | undefined) {
  if (!plan?.steps?.length) return { done: 0, total: 0, pct: 0 };
  const done = plan.steps.filter(s => s.status === 'done').length;
  return { done, total: plan.steps.length, pct: done / plan.steps.length };
}

function fmtDate(iso: string) {
  try { return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); }
  catch { return iso; }
}

// ── Shared primitives ─────────────────────────────────────────────────────────

function StatusPill({ status }: { status: GoalStatus }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.pending;
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium flex-shrink-0"
      style={{ color: s.color, background: s.bg, border: `1px solid ${s.border}` }}>
      {s.label}
    </span>
  );
}

function SourceBadge({ source }: { source: GoalSource }) {
  const s = SOURCE_STYLE[source] ?? SOURCE_STYLE.external;
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] flex-shrink-0"
      style={{ color: s.color, background: s.bg }}>
      {s.label}
    </span>
  );
}

function ThinMeter({ value, color = '#818cf8' }: { value: number; color?: string }) {
  return (
    <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
      <div className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.min(100, value * 100)}%`, background: color }} />
    </div>
  );
}

function CollapsibleSection({ title, children, defaultOpen = false }: {
  title: string; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
      <button onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-2 px-3 py-2.5 text-left transition-colors hover:bg-white/[0.03]"
        style={{ background: 'rgba(255,255,255,0.03)' }}>
        {open
          ? <ChevronDown  className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
          : <ChevronRight className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />}
        <span className="text-[11px] font-medium text-white/60">{title}</span>
      </button>
      {open && <div className="p-3">{children}</div>}
    </div>
  );
}

// ── CommentPopover ────────────────────────────────────────────────────────────

interface CommentPopoverProps {
  sapienId: number;
  goalId: string;
  scope: 'goal' | 'plan' | 'step';
  stepId?: string;
  examples: string[];
  label?: string;
  /** Called on successful 200 so parent can start fast-polling */
  onSuccess?: (submittedAt: number) => void;
  /** Soft-disabled style (overloaded) */
  overloaded?: boolean;
  /** How the trigger renders */
  triggerVariant?: 'icon' | 'pill';
  /** Popover opens upward (for items near bottom) */
  openUp?: boolean;
}

function CommentPopover({
  sapienId, goalId, scope, stepId, examples, label = 'Add note',
  onSuccess, overloaded, triggerVariant = 'icon', openUp = false,
}: CommentPopoverProps) {
  const [open, setOpen]         = useState(false);
  const [text, setText]         = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const lastSubmitRef = useRef(0);
  const wrapRef       = useRef<HTMLDivElement>(null);
  const textareaRef   = useRef<HTMLTextAreaElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Focus textarea when popover opens
  useEffect(() => {
    if (open) setTimeout(() => textareaRef.current?.focus(), 50);
  }, [open]);

  const submit = async () => {
    const now = Date.now();
    if (now - lastSubmitRef.current < 1000) return; // debounce 1s
    lastSubmitRef.current = now;
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    setInlineError(null);
    const submittedAt = Date.now();
    try {
      await goalsService.comment(sapienId, goalId, {
        comment: text.trim(),
        scope,
        ...(stepId ? { step_id: stepId } : {}),
      });
      setText('');
      setOpen(false);
      toast.success('Got it — Sapien is updating.');
      onSuccess?.(submittedAt);
    } catch (e) {
      if (e instanceof OverloadedError) {
        toast.warning("Sapien is busy right now — try again in a moment.");
        setOpen(false);
      } else {
        setInlineError((e as Error).message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const popoverStyle: React.CSSProperties = {
    position: 'absolute',
    right: 0,
    zIndex: 100,
    width: 280,
    background: 'rgba(10,15,30,0.98)',
    border: '1px solid rgba(129,140,248,0.3)',
    borderRadius: 12,
    padding: 12,
    boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
    ...(openUp ? { bottom: '100%', marginBottom: 6 } : { top: '100%', marginTop: 6 }),
  };

  return (
    <div ref={wrapRef} style={{ position: 'relative', display: 'inline-block' }}>
      {/* Trigger */}
      {triggerVariant === 'icon' ? (
        <button
          onClick={e => { e.stopPropagation(); setOpen(v => !v); }}
          title={overloaded
            ? 'Sapien is catching up — comments may take longer to apply.'
            : label}
          className="w-5 h-5 flex items-center justify-center rounded transition-colors flex-shrink-0"
          style={{ color: open ? '#818cf8' : 'rgba(255,255,255,0.2)' }}
          onMouseEnter={e => { if (!open) (e.currentTarget as HTMLElement).style.color = 'rgba(129,140,248,0.7)'; }}
          onMouseLeave={e => { if (!open) (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.2)'; }}
        >
          <MessageSquare className="w-3 h-3" />
        </button>
      ) : (
        <button
          onClick={e => { e.stopPropagation(); setOpen(v => !v); }}
          title={overloaded ? 'Sapien is catching up — comments may take longer to apply.' : undefined}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] transition-all"
          style={{
            background: open ? 'rgba(129,140,248,0.15)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${open ? 'rgba(129,140,248,0.35)' : 'rgba(255,255,255,0.1)'}`,
            color: open ? '#a5b4fc' : overloaded ? 'rgba(251,191,36,0.6)' : 'rgba(255,255,255,0.4)',
          }}
        >
          <MessageSquare className="w-3 h-3" />
          {label}
        </button>
      )}

      {/* Popover */}
      {open && (
        <div style={popoverStyle} onClick={e => e.stopPropagation()}>
          <p className="text-[10px] font-medium text-white/50 mb-2">
            {scope === 'step' ? 'Comment on this step' : scope === 'plan' ? 'Comment on the plan' : 'Comment on this goal'}
          </p>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit(); }}
            placeholder="Tell Sapien anything — change of mind, deadline, blocker, what worked, what to skip…"
            rows={3}
            className="w-full bg-transparent border rounded-lg px-2.5 py-2 text-[11px] text-white/75 placeholder:text-white/20 resize-none outline-none mb-2"
            style={{ borderColor: inlineError ? 'rgba(248,113,113,0.4)' : 'rgba(255,255,255,0.15)' }}
          />
          {/* Faint examples */}
          <div className="flex flex-col gap-0.5 mb-3">
            {examples.map((ex, i) => (
              <button key={i} onClick={() => setText(ex)}
                className="text-left text-[9px] text-white/20 hover:text-white/40 transition-colors truncate">
                e.g. "{ex}"
              </button>
            ))}
          </div>
          {inlineError && (
            <p className="text-[10px] text-red-400 mb-2">{inlineError}</p>
          )}
          <div className="flex items-center justify-between gap-2">
            <span className="text-[9px] text-white/20">⌘↵ to send</span>
            <div className="flex gap-2">
              <button onClick={() => { setOpen(false); setText(''); setInlineError(null); }}
                className="px-2.5 py-1 rounded-lg text-[10px] text-white/30 hover:text-white/60 transition-colors">
                Cancel
              </button>
              <button onClick={submit} disabled={!text.trim() || submitting}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium disabled:opacity-40 transition-all"
                style={{ background: 'rgba(129,140,248,0.2)', border: '1px solid rgba(129,140,248,0.4)', color: '#a5b4fc' }}>
                {submitting
                  ? <><Loader2 className="w-3 h-3 animate-spin" />Processing…</>
                  : <><Send className="w-3 h-3" />Send</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Context block ─────────────────────────────────────────────────────────────

function ContextBlock({ ctx, label, highlightAfter }: {
  ctx: GoalContext | null;
  label: string;
  highlightAfter?: number; // epoch ms — decisions after this time get highlighted
}) {
  if (!ctx) return (
    <CollapsibleSection title={label}>
      <p className="text-[10px] text-white/25 italic">(no context yet)</p>
    </CollapsibleSection>
  );

  return (
    <CollapsibleSection title={label} defaultOpen={!!highlightAfter}>
      <div className="flex flex-col gap-3">
        {ctx.facts?.length > 0 && (
          <div>
            <p className="text-[9px] uppercase tracking-widest text-white/25 mb-1.5">Facts</p>
            <div className="flex flex-col gap-1">
              {ctx.facts.map((f, i) => (
                <div key={i} className="flex gap-2 text-[10px]">
                  <span className="text-white/40 font-medium min-w-[80px] flex-shrink-0">{f.key}</span>
                  <span className="text-white/65 break-words">{f.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {ctx.decisions?.length > 0 && (
          <div>
            <p className="text-[9px] uppercase tracking-widest text-white/25 mb-1.5">What Sapien decided</p>
            <div className="flex flex-col gap-2">
              {ctx.decisions.map((d: ContextDecision, i) => {
                const isNew = highlightAfter
                  ? new Date(d.at).getTime() > highlightAfter
                  : false;
                return (
                  <div key={i} className="rounded-lg p-2 transition-all duration-1000"
                    style={{
                      background: isNew ? 'rgba(129,140,248,0.1)' : 'rgba(255,255,255,0.03)',
                      border: isNew ? '1px solid rgba(129,140,248,0.35)' : '1px solid rgba(255,255,255,0.06)',
                    }}>
                    {isNew && (
                      <span className="text-[8px] px-1.5 py-0.5 rounded font-mono mr-1"
                        style={{ background: 'rgba(129,140,248,0.2)', color: '#818cf8', border: '1px solid rgba(129,140,248,0.3)' }}>
                        new
                      </span>
                    )}
                    <p className="text-[10px] text-white/70 inline">{d.decision}</p>
                    {d.rationale && <p className="text-[9px] text-white/35 mt-0.5">{d.rationale}</p>}
                    <p className="text-[8px] text-white/20 mt-1 font-mono">{fmtDate(d.at)}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {ctx.open_questions?.length > 0 && (
          <div>
            <p className="text-[9px] uppercase tracking-widest text-white/25 mb-1.5">Open Questions</p>
            <div className="flex flex-col gap-1.5">
              {ctx.open_questions.map((q: ContextQuestion) => (
                <div key={q.id} className="flex gap-2 items-start">
                  <span className="text-[9px] mt-0.5 flex-shrink-0" style={{ color: q.resolved_at ? '#34d399' : '#fbbf24' }}>
                    {q.resolved_at ? '✓' : '?'}
                  </span>
                  <div>
                    <p className={`text-[10px] ${q.resolved_at ? 'line-through text-white/30' : 'text-white/60'}`}>
                      {q.question}
                    </p>
                    {q.resolution && <p className="text-[9px] text-white/40 mt-0.5">{q.resolution}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!ctx.facts?.length && !ctx.decisions?.length && !ctx.open_questions?.length && (
          <p className="text-[10px] text-white/25 italic">No context entries yet.</p>
        )}
      </div>
    </CollapsibleSection>
  );
}

// ── Goal Card ─────────────────────────────────────────────────────────────────

function GoalCard({ goal, sapienId, onClick }: { goal: Goal; sapienId: number; onClick: () => void }) {
  const { done, total, pct } = planProgress(goal.current_plan);
  const isOverloaded = useSapiensStore(s => s.isOverloaded);

  return (
    <div className="rounded-xl transition-all"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(129,140,248,0.3)'; (e.currentTarget as HTMLElement).style.background = 'rgba(129,140,248,0.06)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'; }}>

      {/* Clickable body */}
      <button onClick={onClick} className="w-full text-left p-3 flex flex-col gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <SourceBadge source={goal.source} />
          <StatusPill  status={goal.status} />
          <span className="ml-auto text-[8px] font-mono text-white/20">
            {total > 0 ? `${done}/${total} steps` : 'no plan yet'}
          </span>
        </div>
        <p className="text-[12px] text-white/80 leading-snug line-clamp-2">{goal.description}</p>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[8px] text-white/25 w-14 flex-shrink-0">Importance</span>
            <div className="flex-1"><ThinMeter value={goal.importance} color="#818cf8" /></div>
          </div>
          {total > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-[8px] text-white/25 w-14 flex-shrink-0">Progress</span>
              <div className="flex-1"><ThinMeter value={pct} color="#34d399" /></div>
            </div>
          )}
        </div>
      </button>

      {/* Comment affordance */}
      <div className="px-3 pb-2.5 flex justify-end">
        <CommentPopover
          sapienId={sapienId}
          goalId={goal.id}
          scope="goal"
          examples={['This is lower priority now.', 'Deadline moved to next week.', 'Blocked on external dependency.']}
          label="Add note"
          overloaded={isOverloaded}
          triggerVariant="pill"
          openUp
        />
      </div>
    </div>
  );
}

// ── Goal Detail ───────────────────────────────────────────────────────────────

const GOAL_EXAMPLES   = ['Change of mind — drop this.', 'This is now the top priority.', 'Blocked — waiting on someone.'];
const PLAN_EXAMPLES   = ['This won\'t work. Restart.', 'Step 3 doesn\'t matter for me.', 'Add a step for reviewing chapter 1.'];
const STEP_EXAMPLES   = ['Done.', 'Skip this.', 'Blocked on Alice.'];

function GoalDetailPane({
  sapienId, goalId, onBack,
}: {
  sapienId: number; goalId: string; onBack: () => void;
}) {
  const isOverloaded = useSapiensStore(s => s.isOverloaded);
  const [detail, setDetail]     = useState<GoalDetail | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [replanReason, setReplanReason] = useState('');
  const [replanning, setReplanning]     = useState(false);
  const [replanOpen, setReplanOpen]     = useState(false);
  // Epoch ms of last successful comment — drives fast poll + decision highlights
  const [lastCommentAt, setLastCommentAt] = useState<number>(0);

  const normalTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fastTimerRef   = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchDetail = useCallback(async (showSpinner = false) => {
    if (document.visibilityState !== 'visible') return; // don't poll hidden tabs
    if (showSpinner) setLoading(true);
    setError(null);
    try {
      const d = await goalsService.getGoal(sapienId, goalId);
      setDetail(d);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [sapienId, goalId]);

  // Normal 30s poll (pause while fast-polling is active)
  useEffect(() => {
    fetchDetail(true);
    normalTimerRef.current = setInterval(() => {
      if (!fastTimerRef.current) fetchDetail(false); // skip if fast poll is running
    }, 120_000); // 2 min
    return () => { if (normalTimerRef.current) clearInterval(normalTimerRef.current); };
  }, [fetchDetail]);

  // Slow post-comment poll: every 30s for up to 3 min, replaces normal poll
  const startFastPoll = useCallback((submittedAt: number) => {
    setLastCommentAt(submittedAt);
    if (fastTimerRef.current) clearInterval(fastTimerRef.current);
    const deadline = Date.now() + 180_000; // 3 min window
    fastTimerRef.current = setInterval(() => {
      if (Date.now() > deadline) {
        clearInterval(fastTimerRef.current!);
        fastTimerRef.current = null;
        return;
      }
      fetchDetail(false);
    }, 30_000);
    // One fetch ~10s after submit
    setTimeout(() => fetchDetail(false), 10_000);
  }, [fetchDetail]);

  useEffect(() => () => { if (fastTimerRef.current) clearInterval(fastTimerRef.current); }, []);

  const handleReplan = async () => {
    if (!replanReason.trim()) return;
    setReplanning(true);
    try {
      await goalsService.replan(sapienId, goalId, replanReason.trim());
      setReplanReason('');
      setReplanOpen(false);
      toast.success('Replan requested — new plan appears within ~60s.');
      setTimeout(() => fetchDetail(false), 30_000); // replan check after 30s
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setReplanning(false);
    }
  };

  if (loading && !detail) return (
    <div className="flex flex-col h-full">
      <BackBtn onClick={onBack} />
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-white/30" />
      </div>
    </div>
  );

  if (error && !detail) return (
    <div className="flex flex-col h-full gap-3">
      <BackBtn onClick={onBack} />
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-[11px] text-red-300"
        style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
        <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
      </div>
    </div>
  );

  if (!detail) return null;
  const { goal, context, current_plan, plan_context } = detail;
  const { done, total } = planProgress(current_plan);

  return (
    <div className="flex flex-col h-full gap-3 overflow-hidden">
      <BackBtn onClick={onBack} />

      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-3 pr-0.5">
        {/* Header */}
        <div className="rounded-2xl p-4 flex flex-col gap-3"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <SourceBadge source={goal.source} />
              <StatusPill  status={goal.status} />
            </div>
            <CommentPopover
              sapienId={sapienId} goalId={goalId} scope="goal"
              examples={GOAL_EXAMPLES} label="Comment" overloaded={isOverloaded}
              triggerVariant="pill" onSuccess={startFastPoll}
            />
          </div>
          <p className="text-[13px] text-white/88 leading-snug">{goal.description}</p>
          {goal.motivation && <p className="text-[11px] text-white/40 leading-relaxed">{goal.motivation}</p>}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-white/30 w-14">Importance</span>
              <div className="flex-1"><ThinMeter value={goal.importance} color="#818cf8" /></div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-white/30 w-14">Priority</span>
              <div className="flex-1"><ThinMeter value={goal.priority} color="#c4b5fd" /></div>
            </div>
          </div>
        </div>

        {/* Plan */}
        <div className="rounded-2xl flex flex-col gap-0"
          style={{ border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden' }}>

          {/* Plan header */}
          <div className="px-4 py-3 flex items-center justify-between"
            style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium text-white/60">Plan</span>
              {total > 0 && (
                <span className="text-[9px] font-mono text-white/30">{done}/{total}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <CommentPopover
                sapienId={sapienId} goalId={goalId} scope="plan"
                examples={PLAN_EXAMPLES} label="Comment on plan" overloaded={isOverloaded}
                triggerVariant="pill" onSuccess={startFastPoll}
              />
            </div>
          </div>

          {/* Steps */}
          {current_plan === null ? (
            <div className="px-4 py-4 flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-white/25" />
              <span className="text-[11px] text-white/30">Sapien is still planning…</span>
            </div>
          ) : (
            <div className="px-4 py-3 flex flex-col gap-2">
              {current_plan.steps.map((step: PlanStep, i) => (
                <div key={step.id} className="flex items-start gap-2.5 group">
                  <span className="mt-0.5">{STEP_ICON[step.status]}</span>
                  <p className={`flex-1 text-[11px] leading-snug min-w-0 ${step.status === 'done' ? 'text-white/35 line-through' : step.status === 'skipped' ? 'text-white/25 line-through' : 'text-white/70'}`}>
                    {step.description}
                  </p>
                  {/* Per-step comment */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <CommentPopover
                      sapienId={sapienId} goalId={goalId} scope="step" stepId={step.id}
                      examples={STEP_EXAMPLES} overloaded={isOverloaded}
                      triggerVariant="icon" onSuccess={startFastPoll} openUp
                    />
                  </div>
                  <span className="text-[8px] text-white/15 font-mono mt-0.5 flex-shrink-0">{i + 1}</span>
                </div>
              ))}
              {current_plan.steps.length === 0 && (
                <p className="text-[10px] text-white/30 italic">No steps yet.</p>
              )}
            </div>
          )}

          {/* Replan */}
          <div className="px-4 pb-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 10 }}>
            {!replanOpen ? (
              <button onClick={() => setReplanOpen(true)}
                className="flex items-center gap-1.5 text-[10px] text-white/30 hover:text-white/60 transition-colors">
                <RotateCcw className="w-3 h-3" /> Request replan
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                <textarea
                  value={replanReason}
                  onChange={e => setReplanReason(e.target.value)}
                  placeholder="Why replan?"
                  rows={2}
                  className="w-full bg-transparent border rounded-lg px-2.5 py-1.5 text-[11px] text-white/70 placeholder:text-white/20 resize-none outline-none"
                  style={{ borderColor: 'rgba(255,255,255,0.15)' }}
                />
                <div className="flex gap-2">
                  <button onClick={handleReplan} disabled={!replanReason.trim() || replanning}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] disabled:opacity-40 transition-all"
                    style={{ background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.35)', color: '#c4b5fd' }}>
                    {replanning ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
                    {replanning ? 'Replanning…' : 'Submit'}
                  </button>
                  <button onClick={() => { setReplanOpen(false); setReplanReason(''); }}
                    className="px-3 py-1.5 rounded-lg text-[10px] text-white/30 hover:text-white/60 transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Context sections */}
        <ContextBlock ctx={context}      label="What Sapien knows about this goal" highlightAfter={lastCommentAt || undefined} />
        <ContextBlock ctx={plan_context} label="What Sapien knows about this plan" highlightAfter={lastCommentAt || undefined} />
      </div>
    </div>
  );
}

function BackBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="flex items-center gap-1.5 text-[11px] text-white/35 hover:text-white/70 transition-colors flex-shrink-0">
      <ChevronLeft className="w-3.5 h-3.5" /> All goals
    </button>
  );
}

// ── Main GoalsPanel ───────────────────────────────────────────────────────────

type StatusFilter = 'all' | 'active' | 'done' | 'failed' | 'abandoned';
const SOURCE_OPTIONS: { key: GoalSource; label: string }[] = [
  { key: 'user',      label: 'You'       },
  { key: 'curiosity', label: 'Curiosity' },
  { key: 'parent',    label: 'Parent'    },
  { key: 'lesson',    label: 'Lesson'    },
  { key: 'external',  label: 'External'  },
];

export function GoalsPanel({ sapienId }: { sapienId: number }) {
  const isOverloaded = useSapiensStore(s => s.isOverloaded);

  const [goals, setGoals]         = useState<Goal[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [statusFilter, setStatusFilter]   = useState<StatusFilter>('active');
  const [sourceFilters, setSourceFilters] = useState<Set<GoalSource>>(new Set());
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchGoals = useCallback(async (showSpinner = false) => {
    if (document.visibilityState !== 'visible') return;
    if (showSpinner) setLoading(true);
    setError(null);
    try {
      const statusIn: string[] =
        statusFilter === 'all'    ? ['pending', 'active', 'blocked', 'done', 'failed', 'abandoned'] :
        statusFilter === 'active' ? ['pending', 'active', 'blocked'] : [statusFilter];
      const res = await goalsService.listGoals(sapienId, {
        activeOnly: false,
        statusIn,
        sourceIn: sourceFilters.size > 0 ? [...sourceFilters] : undefined,
        topK: 30, orderBy: 'priority', includePlan: true,
      });
      setGoals(res.goals ?? []);
      setLastFetch(new Date());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [sapienId, statusFilter, sourceFilters]);

  useEffect(() => {
    fetchGoals(true);
    timerRef.current = setInterval(() => fetchGoals(false), 120_000); // 2 min
    const onVis = () => { if (document.visibilityState === 'visible') fetchGoals(false); };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [fetchGoals]);

  const toggleSource = (s: GoalSource) =>
    setSourceFilters(prev => { const n = new Set(prev); n.has(s) ? n.delete(s) : n.add(s); return n; });

  if (selectedGoalId) {
    return (
      <div className="h-full rounded-2xl flex flex-col p-4"
        style={{ background: 'rgba(8,12,22,0.85)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', overflow: 'hidden' }}>
        <GoalDetailPane
          sapienId={sapienId} goalId={selectedGoalId}
          onBack={() => setSelectedGoalId(null)}
        />
      </div>
    );
  }

  return (
    <div className="h-full rounded-2xl flex flex-col overflow-hidden"
      style={{ background: 'rgba(8,12,22,0.85)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)' }}>

      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-[12px] font-medium text-white/70">Goals</span>
          <div className="flex items-center gap-2">
            {lastFetch && <span className="text-[9px] font-mono text-white/20">{lastFetch.toLocaleTimeString()}</span>}
            <button onClick={() => fetchGoals(true)} disabled={loading}
              className="w-5 h-5 flex items-center justify-center rounded text-white/25 hover:text-white/60 disabled:opacity-40 transition-colors">
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Overloaded banner */}
        {isOverloaded && (
          <div className="flex items-start gap-2 px-3 py-2 rounded-lg mb-3 text-[10px]"
            style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)', color: 'rgba(251,191,36,0.8)' }}>
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            Sapien is processing background work — plans and new goals may take longer. Comments will still queue.
          </div>
        )}

        {/* Status filter */}
        <div className="flex gap-1 flex-wrap">
          {(['all', 'active', 'done', 'failed', 'abandoned'] as StatusFilter[]).map(f => (
            <button key={f} onClick={() => setStatusFilter(f)}
              className="px-2.5 py-1 rounded-lg text-[10px] transition-all capitalize"
              style={statusFilter === f
                ? { background: 'rgba(129,140,248,0.18)', border: '1px solid rgba(129,140,248,0.35)', color: '#a5b4fc' }
                : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.35)' }}>
              {f === 'active' ? 'Active' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Source chips */}
        <div className="flex gap-1 flex-wrap mt-2">
          {SOURCE_OPTIONS.map(({ key, label }) => {
            const on = sourceFilters.has(key);
            const s  = SOURCE_STYLE[key];
            return (
              <button key={key} onClick={() => toggleSource(key)}
                className="px-2 py-0.5 rounded text-[9px] transition-all"
                style={on
                  ? { background: s.bg, border: `1px solid ${s.color}40`, color: s.color }
                  : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.25)' }}>
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 min-h-0 overflow-y-auto px-3 py-3">
        {loading && goals.length === 0 ? (
          <div className="flex items-center justify-center h-24">
            <Loader2 className="w-5 h-5 animate-spin text-white/25" />
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-[11px] text-red-300"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
          </div>
        ) : goals.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3 text-center px-4">
            <Circle className="w-8 h-8 text-white/10" />
            <div>
              <p className="text-[12px] text-white/35 mb-1">No active goals yet.</p>
              <p className="text-[10px] text-white/20 leading-relaxed">
                Mention something you want help with and Sapien will track it.
              </p>
              <p className="text-[9px] text-white/15 mt-2">Extracted intents take ~10 min to commit.</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {goals.map(g => (
              <GoalCard key={g.id} goal={g} sapienId={sapienId} onClick={() => setSelectedGoalId(g.id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
