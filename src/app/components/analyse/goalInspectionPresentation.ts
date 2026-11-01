import type { GoalContext, GoalDetail, Plan, WorkflowRecord } from '../../types/goalTypes';
import { traceObject, traceText } from '../workspace/awarenessTrace';
import { questionEvidence } from './questioningPresentation';

const reference = /^(?:[a-z][\w-]*:)?(?:[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}|[a-f\d]{64})$/i;

/** Move only explicit ID-only citations out of prose. Keep qualifications and issue names intact. */
export function goalText(value: string | null | undefined) {
  const refs: string[] = [];
  const text = (value || '').replace(/\[([^\]\n]+)\]/g, (original, content: string) => {
    const candidates = content.replace(/^Evidence:\s*/i, '').trim().split(/[;,]\s*|\s+/);
    if (!candidates.length || !candidates.every(item => reference.test(item))) return original;
    refs.push(...candidates);
    return '';
  }).replace(/[ \t]+/g, ' ').replace(/ +\n/g, '\n').trim();
  return { text, refs: [...new Set(refs)] };
}

export function goalExcerpt(value: string | null | undefined, limit = 190) {
  const text = goalText(value).text.replace(/\s+/g, ' ');
  if (!text) return 'Goal description not recorded';
  if (text.length <= limit) return text;
  const cut = text.slice(0, limit).replace(/\s+\S*$/, '');
  return `${cut || text.slice(0, limit)}…`;
}

export function planSummary(plan?: Plan | null) {
  if (!plan) return 'No plan recorded';
  if (!plan.tasks.length) return 'Plan has no recorded steps';
  const unknown = plan.tasks.filter(step => step.finished == null).length;
  return `${plan.tasks.filter(step => step.finished === true).length} of ${plan.tasks.length} steps marked finished${unknown ? ` · ${unknown} unknown` : ''}`;
}

export function completion(record: Pick<WorkflowRecord, 'finished'>) {
  return record.finished === true ? 'Marked finished' : record.finished === false ? 'Unfinished' : 'Completion unknown';
}

export const contextCount = (context?: GoalContext | null) => context
  ? context.facts.length + context.decisions.length + context.assumptions.length + context.open_questions.length : 0;

export function goalInspection(detail: GoalDetail) {
  const outcome = traceObject(detail.attention?.outcome);
  const assessment = traceObject(outcome.assessment);
  const refs = Array.isArray(assessment.evidence_refs) ? assessment.evidence_refs.filter((ref): ref is string => typeof ref === 'string') : [];
  const records = Array.isArray(outcome.evidence) ? outcome.evidence : [];
  const evidence = records.map((entry, index) => {
    const record = traceObject(entry);
    const saved = questionEvidence(entry, index);
    const source = traceText(record.source), kind = traceText(record.kind);
    // Retrieved context can contain a tool name without being an action taken
    // for this goal. Classify from recorded provenance, never from its prose.
    const guidance = source === 'tool_learning_engine' || kind === 'learned_tool_guidance';
    const original = kind === 'original_impression';
    const earlier = kind === 'context' || kind === 'internal_understanding' || kind === 'prior_understanding' || kind === 'outcome_assessment';
    const label = guidance ? 'Earlier tool guidance' : original ? 'Review input'
      : earlier && source === 'user' ? 'Earlier message'
      : earlier && source === 'motor' ? 'Earlier tool activity'
      : earlier && source === 'stream' ? 'Earlier understanding'
      : earlier ? 'Earlier context' : kind === 'action' || kind === 'action_outcome' ? 'Recorded action' : 'Saved evidence';
    const category = guidance ? 'guidance' : original ? 'input' : 'evidence';
    const title = saved.title === 'Saved context' || original ? label
      : guidance ? `Tool guidance: ${saved.title}` : earlier && source === 'motor' ? `Earlier: ${saved.title}` : saved.title;
    return { ...saved, key: `${saved.id}:${index}`, title, label, category, earlier,
      cited: [record.id, record.handle, traceObject(record.source_reference).id].some(id => typeof id === 'string' && refs.includes(id)) };
  });
  const understanding = traceText(assessment.understanding);
  const remaining = traceText(assessment.remaining);
  const reason = traceText(assessment.reason);
  const pending = !!detail.attention?.request_id && detail.attention.request_id !== detail.attention.resolved_id;
  const state = traceText(assessment.state);
  return { understanding, remaining, reason, pending, evidence, refs, state };
}

/** Keep every record; put cited evidence before other context, without implying a timeline. */
export function goalEvidenceGroups(evidence: ReturnType<typeof goalInspection>['evidence']) {
  return [
    { key: 'cited', title: 'Cited evidence', entries: evidence.filter(item => item.category === 'evidence' && item.cited) },
    { key: 'other', title: 'Other saved evidence', entries: evidence.filter(item => item.category === 'evidence' && !item.cited) },
    { key: 'guidance', title: 'Earlier tool guidance', entries: evidence.filter(item => item.category === 'guidance') },
    { key: 'input', title: 'Review input', entries: evidence.filter(item => item.category === 'input') },
  ].filter(group => group.entries.length);
}

export function goalTargets(plan?: Plan | null) {
  return [
    { key: 'goal', label: 'This goal', scope: 'goal' as const },
    ...(plan ? [{ key: `plan:${plan.id}`, label: 'Current plan', scope: 'plan' as const }] : []),
    ...(plan?.tasks.flatMap((step, index) => step.id ? [{ key: `step:${plan.id}:${step.id}`, label: `Step ${index + 1}: ${goalExcerpt(step.description, 70)}`, scope: 'step' as const, stepId: step.id }] : []) || []),
  ];
}
