import type { AwarenessRunDetail, AwarenessRunSubject, AwarenessRunSummary, AwarenessRunStep, AwarenessMemoryReference } from '../../types/awarenessRunTypes';
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
  completed: 'Processing finished', failed: 'Processing failed', no_focus: 'Check completed · no focus chosen',
  correction_failed: 'Correction incomplete', controller_unavailable: 'Decision unavailable',
  not_recorded: 'Processing status not recorded',
};
export const processingLabel = (state?: string) => processingLabels[state ?? ''] || state?.replaceAll('_', ' ') || 'Processing status not recorded';

export const processingProblem = (state: string) => ['failed', 'correction_failed', 'controller_unavailable'].includes(state);

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
  if (subject.source === 'jira') {
    const jiraKinds: Record<string, string> = { comment_created: 'comment', issue_updated: 'issue update' };
    return 'Jira ' + (jiraKinds[subject.kind] || subject.kind?.replaceAll('_', ' ') || 'notification');
  }
  if (subject.source === 'stream') return 'Previous thought';
  if (subject.source === 'connection') return 'Connection update';
  return kinds[subject.kind] || [subject.source, subject.kind?.replaceAll('_', ' ')].filter(Boolean).join(' · ') || 'Source not recorded';
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
  const view = activityView({ ...event, stage: event.kind || event.stage });
  const detail = traceObject(event.detail || event.technical_details);
  const action = step.action_detail;
  const move = step.decision || view.move;
  const titles: Record<string, string> = { speak: traceText(detail.response) ? 'Prepared a reply' : 'Decided to prepare a reply', hold: 'Decided to wait',
    think: 'Decided to think further', act: 'Decided to use a tool', execute_plan: 'Planned tool actions' };
  const recordedStatus = action?.match_status === 'exact'
    ? action.is_uncertain === true ? 'Outcome uncertain' : action.is_error === true ? 'Tool reported failure'
      : action.is_error === false ? 'Tool reported success' : view.status
    : view.status;
  const status = !view.action && ['not ready', 'not_ready'].includes(recordedStatus) ? 'Proposal needs revision'
    : !view.action && recordedStatus === 'overreach' ? 'Proposal outside scope' : recordedStatus;
  const isAction = (step.kind || event.kind || event.stage) === 'action' || view.action;
  return { title: isAction ? actionTitle(step) : titles[move] || step.title || view.title,
    status, response: traceText(detail.response), reason: traceText(detail.reason),
    consequence: traceText(event.consequence),
    summary: view.summary || step.summary, when: view.when,
    tone: (/uncertain|needs revision/.test(status) ? 'warning' : /fail|error|reject|blocked|outside scope/.test(status) ? 'danger'
      : status === 'Tool reported success' ? 'success' : 'neutral') as 'warning' | 'danger' | 'success' | 'neutral' };
}

// Only structured tool identities and exact arguments supply these labels.
// Infinitives describe the operation; the separate status says whether it succeeded.
export function actionTitle(step: AwarenessRunStep) {
  const action = step.action_detail;
  const detail = traceObject(step.evidence?.detail || step.evidence?.technical_details);
  const capability = action?.match_status === 'exact'
    ? [action.server, action.tool].filter(Boolean).join('.') : traceText(detail.capability);
  const names: Record<string, string> = {
    'jira.jira_get_issue': 'Read Jira issue', 'jira.get_issue': 'Read Jira issue',
    'jira.jira_get_comments': 'Read Jira comments', 'jira.get_comments': 'Read Jira comments',
    'teams.list-chat-messages': 'Read Teams messages',
    'teams.list-channel-messages': 'Read Teams channel messages',
    'teams.list-channel-message-replies': 'Read Teams replies',
    'teams.list-users': 'Find Teams users', 'teams.list-chats': 'Find Teams chats',
    'teams.create-one-on-one-chat': 'Create a Teams chat',
    'teams.send-chat-message': 'Send a Teams message',
    'teams.reply-to-channel-message': 'Reply in a Teams thread',
  };
  const title = names[capability] || capability || step.title || 'Recorded tool action';
  const issue = action?.match_status === 'exact' ? traceText(traceObject(action.arguments).issue_key) : '';
  return title + (issue && capability.startsWith('jira.') ? ' · ' + issue : '');
}

export function sameReference(a?: AwarenessMemoryReference | null, b?: AwarenessMemoryReference | null) {
  return !!a?.id && !!b?.id && a.id === b.id && a.memory_source === b.memory_source
    && (a.container_id || '') === (b.container_id || '');
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, child]) => [key, stableValue(child)]));
}

export function sameSubject(a: AwarenessRunSubject, b: AwarenessRunSubject) {
  // A matching source ID alone does not prove that two historical snapshots agree.
  return sameReference(a.source_reference, b.source_reference)
    && JSON.stringify(stableValue(a)) === JSON.stringify(stableValue(b));
}

export function sourceGroups(data: AwarenessRunDetail) {
  const entries: Array<{ subject: AwarenessRunSubject; roles: string[] }> = [];
  const add = (subject: AwarenessRunSubject, role: string) => {
    if (!subject.content && !subject.source_reference && !subject.source && !subject.handle) return;
    const existing = entries.find(entry => sameSubject(entry.subject, subject));
    if (existing) existing.roles.push(role);
    else entries.push({ subject, roles: [role] });
  };
  add(data.trigger, 'Started this review');
  add(data.focus, 'Primary source for the focus');
  data.focus_selection?.contributors?.forEach(subject => add(subject, 'Helped shape the focus'));
  return entries;
}

export function runOverview(data: AwarenessRunDetail) {
  const noFocus = data.focus_selection?.status === 'no_focus' || data.run.processing_state === 'no_focus';
  const steps = data.activity.steps;
  const replies = steps.filter(step => !!stepView(step).response);
  const decisions = steps.filter(step => !!step.decision || !!traceText(traceObject(step.evidence?.detail).move));
  return { noFocus, problem: processingProblem(data.run.processing_state),
    understanding: data.understanding || data.run.understanding_preview,
    reason: traceText(data.assessment.reason),
    remaining: traceText(data.assessment.remaining) || data.run.remaining_preview || traceText(traceObject(data.technical.conclusion).unfinished),
    reply: replies.at(-1), replyCount: replies.length, decision: decisions.at(-1),
    actions: steps.filter(step => (step.kind || step.evidence?.kind || step.evidence?.stage) === 'action'),
    incomplete: data.activity.truncated || data.run.actions.trace_truncated,
  };
}

export function deliverySummary(data: AwarenessRunDetail) {
  const recorded = traceObject(data.delivery.recorded);
  const communication = traceObject(data.delivery.communication);
  const route = traceText(recorded.route) || traceText(communication.route);
  const count = data.run.delivery.confirmed_tool_messages;
  if (typeof count === 'number' && count > 0) return `${count} tool message${count === 1 ? '' : 's'} confirmed in this review.`;
  if (route === 'returned_to_caller') return 'The reply was returned to the calling service. Delivery is recorded separately.';
  return 'Preparing a reply does not confirm that it was sent.';
}

export function deliveryAudits(data: AwarenessRunDetail) {
  // An audit is the current linked message state, not this run’s historical send state.
  return data.source_records.filter(source => source.availability === 'available' && typeof source.metadata.reply_delivery_status === 'string')
    .map(source => ({ reference: source.reference, status: traceText(source.metadata.reply_delivery_status),
      subject: [data.trigger, data.focus, ...(data.focus_selection?.contributors || [])].find(subject => sameReference(subject.source_reference, source.reference)) }));
}

export function reviewView(value: string | null): 'summary' | 'activity' | 'sources' {
  return value === 'activity' || value === 'sources' ? value : 'summary';
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
  if (status === 400 && !detail) return 'The run filters are invalid. Clear filters or use a search of up to 160 characters.';
  if (status === 403) return 'Your account needs analysis and simulation access to inspect these records.';
  if (status === 404) return detail ? 'This run is unavailable for the selected Sapien. The detail API may also need deployment.'
    : 'Saved run inspection is unavailable. Check the selected Sapien and backend deployment.';
  return 'Could not load saved records. Retry when the connection is available.';
}
