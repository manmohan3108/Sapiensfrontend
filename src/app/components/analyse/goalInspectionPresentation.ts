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
    return { ...questionEvidence(entry, index), cited: [record.id, record.handle, traceObject(record.source_reference).id].some(id => typeof id === 'string' && refs.includes(id)) };
  });
  const understanding = traceText(assessment.understanding);
  const remaining = traceText(assessment.remaining);
  const reason = traceText(assessment.reason);
  const pending = !!detail.attention?.request_id && detail.attention.request_id !== detail.attention.resolved_id;
  const absent = [!understanding && !remaining && !reason && 'assessment text', !detail.current_plan && 'plan',
    !contextCount(detail.context) && !contextCount(detail.plan_context) && 'supporting context'].filter(Boolean);
  return { understanding, remaining, reason, pending, evidence, refs,
    absent: absent.length ? `Not supplied in this record: ${absent.join(', ')}.` : '',
  };
}

export function goalTargets(plan?: Plan | null) {
  return [
    { key: 'goal', label: 'This goal', scope: 'goal' as const },
    ...(plan ? [{ key: `plan:${plan.id}`, label: 'Current plan', scope: 'plan' as const }] : []),
    ...(plan?.tasks.flatMap((step, index) => step.id ? [{ key: `step:${plan.id}:${step.id}`, label: `Step ${index + 1}: ${goalExcerpt(step.description, 70)}`, scope: 'step' as const, stepId: step.id }] : []) || []),
  ];
}
