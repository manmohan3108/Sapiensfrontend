import type { AwarenessRunSubject, AwarenessRunSummary, AwarenessRunStep } from '../../types/awarenessRunTypes';
import { activityView, traceObject, traceText } from '../workspace/awarenessTrace';

export function absoluteTime(value?: string | null) {
  if (!value) return 'Time unavailable';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Time unavailable' : date.toLocaleString(undefined, { timeZoneName: 'short' });
}

const assessmentLabels: Record<string, string> = {
  completed: 'Assessed as complete', waiting: 'Waiting', ongoing: 'Still in progress',
  blocked: 'Blocked', unresolved: 'Unresolved', not_recorded: 'Not assessed', deferred: 'Deferred',
};
export const assessmentLabel = (state?: string) => assessmentLabels[state ?? ''] || state?.replaceAll('_', ' ') || 'Not assessed';

const processingLabels: Record<string, string> = {
  completed: 'Processing finished', failed: 'Processing failed', no_focus: 'No focus selected',
  correction_failed: 'Correction incomplete', controller_unavailable: 'Decision unavailable',
  not_recorded: 'Processing status not recorded',
};
export const processingLabel = (state?: string) => processingLabels[state ?? ''] || state?.replaceAll('_', ' ') || 'Processing status not recorded';

export function subjectLabel(subject: AwarenessRunSubject) {
  if (subject.availability === 'not_recorded') return 'Trigger not recorded';
  if (subject.availability === 'not_applicable') return 'Self-directed run';
  const provider = subject.provider === 'teams' ? 'Teams' : subject.provider === 'jira' ? 'Jira' : subject.provider;
  // Related-subject attribution is not the current event's speaker.
  if (subject.origin_relation !== 'related_subject' && subject.sender?.name) {
    return (provider ? provider + ' · ' : '') + subject.sender.name;
  }
  const kinds: Record<string, string> = { message: provider ? provider + ' message · sender not recorded' : 'Message · sender not recorded',
    goal_review: 'Goal review', plan_review: 'Plan review', tool_result: 'Tool result',
    self_directed: 'Self-directed run' };
  return kinds[subject.kind] || 'Internal information';
}

export function matchesRun(item: AwarenessRunSummary, query: string) {
  const value = query.trim().toLocaleLowerCase();
  return [item.title, subjectLabel(item.focus), subjectLabel(item.trigger), item.focus.content,
    item.trigger.content, item.understanding_preview, item.remaining_preview,
    assessmentLabel(item.assessment_state), processingLabel(item.processing_state)]
    .some(text => text?.toLocaleLowerCase().includes(value));
}

export function actionSummary(item: AwarenessRunSummary) {
  const { recorded, succeeded, failed, uncertain, trace_truncated } = item.actions;
  if (!recorded) return trace_truncated ? 'No actions in the retained trace' : 'No tool actions recorded';
  return [recorded + ' recorded ' + (recorded === 1 ? 'action' : 'actions'),
    succeeded ? succeeded + ' reported success' : '', failed ? failed + ' reported failure' : '',
    uncertain ? uncertain + ' uncertain' : ''].filter(Boolean).join(' · ');
}

export function stepView(step: AwarenessRunStep) {
  const event = step.evidence ?? {};
  const view = activityView(event);
  const detail = traceObject(event.detail || event.technical_details);
  const action = step.action_detail;
  const move = step.decision || view.move;
  const titles: Record<string, string> = { speak: 'Prepared a reply', hold: 'Decided to wait',
    think: 'Decided to think further', act: 'Decided to use a tool', execute_plan: 'Planned tool actions' };
  const status = action?.match_status === 'exact'
    ? action.is_uncertain === true ? 'Outcome uncertain' : action.is_error === true ? 'Tool reported failure'
      : action.is_error === false ? 'Tool reported success' : view.status
    : view.status;
  return { title: view.action ? view.title : titles[move] || step.title,
    status, response: traceText(detail.response), reason: traceText(detail.reason),
    consequence: traceText(event.consequence),
    summary: view.summary || step.summary, when: view.when,
    tone: (/uncertain/.test(status) ? 'warning' : /fail|error|reject|blocked/.test(status) ? 'danger'
      : status === 'Tool reported success' ? 'success' : 'neutral') as 'warning' | 'danger' | 'success' | 'neutral' };
}

// Legacy diagnostics keep their payload filter. Explicit bounded action_detail
// fields use their own display; never loosen this filter globally.
export function safeEvidence(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(safeEvidence);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value as Record<string, unknown>)
    .filter(([key]) => !/(credential|secret|token|password|argument|\bargs?\b|payload|result|prompt|raw_response)/i.test(key))
    .map(([key, child]) => [key, safeEvidence(child)]));
}

export function inspectionError(error: unknown, detail = false) {
  const status = traceObject(error).status;
  if (status === 403) return 'An administrator account is needed to inspect these records.';
  if (status === 404) return detail ? 'This run is unavailable for the selected Sapien. The detail API may also need deployment.'
    : 'Saved run inspection is unavailable. Check the selected Sapien and backend deployment.';
  return 'Could not load saved records. Retry when the connection is available.';
}
