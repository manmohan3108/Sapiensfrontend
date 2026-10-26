import type { AwarenessBeat, AwarenessBeatEvent, AwarenessHistoryItem } from '../../types/sapiensTypes';
import { activityView, traceObject, traceText } from '../workspace/awarenessTrace';

export function absoluteTime(value?: string) {
  if (!value) return 'Time unavailable';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Time unavailable' : date.toLocaleString(undefined, { timeZoneName: 'short' });
}

export const assessmentLabel = (state?: string) => ({
  completed: 'Assessed as complete', waiting: 'Waiting', ongoing: 'Still in progress',
  blocked: 'Blocked', unresolved: 'Unresolved',
}[state ?? ''] || state?.replaceAll('_', ' ') || 'Not assessed');

export function runTitle(item: AwarenessHistoryItem) {
  return item.subject?.content || item.focus || item.understanding || 'Input not recorded';
}

export function matchesRun(item: AwarenessHistoryItem, query: string) {
  const value = query.trim().toLocaleLowerCase();
  return [runTitle(item), item.understanding, item.subject?.source, item.remaining, item.state, assessmentLabel(item.state)]
    .some(text => text?.toLocaleLowerCase().includes(value));
}

export type RunStep = {
  id: string; index: number; round: number | null; event?: AwarenessBeatEvent;
  title: string; status: string; summary: string; response: string; reason: string;
  kind: 'action' | 'decision' | 'review' | 'record'; important: boolean;
};

/** Retain event order and every event. Flow annotations enrich existing events, never prove execution. */
export function runSteps(beat: AwarenessBeat): RunStep[] {
  const events = beat.events ?? [];
  const flow = beat.run_flow?.steps ?? [];
  const rows: { event?: AwarenessBeatEvent; index: number; step?: (typeof flow)[number] }[] = events.map((event, index) => ({ event, index, step: flow.find(step => step.event_index === index) }));
  // Some older records retain flow summaries but no corresponding events.
  for (const step of flow) {
    if (!events[step.event_index]) rows.push({ index: step.event_index, step });
  }
  return rows.map(({ event, index, step }, position) => {
    const view = activityView(event ?? {});
    const detail = traceObject(event?.detail);
    const move = view.move || step?.decision || '';
    const review = /guard|reconsider|review/.test(event?.stage ?? '') && !view.action;
    const decision = !view.action && !review && ['act', 'execute_plan', 'speak', 'hold', 'think'].includes(move);
    const response = traceText(detail.response);
    const titles: Record<string, string> = {
      act: 'Decided to use a tool', execute_plan: 'Decided to carry out a plan',
      speak: response ? 'Prepared a reply' : 'Decided to prepare a reply',
      hold: 'Decided to wait', think: 'Decided to think further',
    };
    const rawStatus = event?.status || traceText(detail.status);
    const rejected = review && /overreach|reject|blocked|denied|unsafe/.test(rawStatus ?? '');
    return {
      id: `step-${position}`, index, event, round: step?.round ?? null,
      title: decision ? titles[move] : event && view.title !== 'Recorded step' ? view.title : step?.title || 'Recorded step',
      status: rejected ? 'Proposal not approved' : decision ? 'Decision recorded' : event ? view.status : 'Summary only',
      kind: view.action ? 'action' : decision ? 'decision' : review ? 'review' : 'record',
      important: view.action || decision || review || /delivery/.test(event?.stage ?? '') || /fail|error/.test(rawStatus ?? ''),
      summary: view.summary || step?.summary || '', response, reason: traceText(detail.reason),
    };
  });
}

// Match the existing diagnostic privacy filter; technical payloads and secrets stay hidden.
export function safeEvidence(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(safeEvidence);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value as Record<string, unknown>)
    .filter(([key]) => !/(credential|secret|token|password|argument|\bargs?\b|payload|result|prompt|raw_response)/i.test(key))
    .map(([key, child]) => [key, safeEvidence(child)]));
}

/** Preserve the previous reader's allowlist for event detail fields. */
export function eventEvidence(event: AwarenessBeatEvent) {
  const allowed = ['summary', 'decision', 'reason', 'outcome', 'feedback', 'focus', 'selected_focus', 'focus_state', 'status', 'capability', 'uncertainty', 'activity_id', 'action_id', 'response_present', 'route', 'channel', 'understanding', 'remaining', 'confidence'];
  const detail = Object.fromEntries(allowed.flatMap(key => {
    const value = event.detail?.[key];
    return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || (Array.isArray(value) && value.every(item => typeof item === 'string')) ? [[key, value]] : [];
  }));
  return safeEvidence({ stage: event.stage, sequence: event.sequence, actor: event.actor, status: event.status,
    correlation_id: event.correlation_id, reference_id: event.reference_id, detail, technical_details: event.technical_details });
}
