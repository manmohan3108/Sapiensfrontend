import type { AwarenessBeat, AwarenessBeatEvent, AwarenessBeatsResponse } from '../../types/sapiensTypes';

export const traceObject = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
export const traceText = (value: unknown) => typeof value === 'string' ? value : '';

// Older APIs may ignore thought_id. Never attach a merely recent run to a record.
export function matchedTrace(data: AwarenessBeatsResponse, sapienId: string, thoughtId: string): AwarenessBeat | null {
  return data.match_status === 'exact' && data.thought_id === thoughtId
    && Number(data.sapien_id) === Number(sapienId)
    && Number(data.current_beat?.sapien_id) === Number(sapienId)
    ? data.current_beat : null;
}

export function traceContext(beat: AwarenessBeat) {
  const context = traceObject(beat.curation).selected_context;
  return Array.isArray(context) ? context.map(traceObject).map(item => ({
    content: traceText(item.content) || traceText(item.summary),
    source: traceText(item.source),
  })) : [];
}

const decisions: Record<string, string> = {
  speak: 'Prepared a reply', hold: 'Decided to wait', think: 'Decided to think further',
  act: 'Decided to use a tool', execute_plan: 'Decided to carry out a plan',
};
const tools: Record<string, string> = {
  'teams.list-channel-message-replies': 'Read Teams replies',
  'teams.list-channel-messages': 'Read Teams messages',
  'teams.reply-to-channel-message': 'Reply in a Teams thread',
  'jira.get_comments': 'Read Jira comments', 'jira.jira_get_comments': 'Read Jira comments',
  'jira.get_issue': 'Read a Jira issue', 'jira.jira_get_issue': 'Read a Jira issue',
};

export function activityView(event: AwarenessBeatEvent) {
  const detail = traceObject(event.detail);
  const technical = traceObject(event.technical_details);
  const capability = traceText(detail.capability) || traceText(technical.capability);
  const move = traceText(detail.move) || traceText(detail.decision)
    || (event.stage === 'controller' ? event.status : '') || '';
  const action = event.stage === 'action' || event.actor === 'motor';
  const status = event.status || traceText(detail.status);
  const uncertain = detail.uncertain === true || technical.uncertain === true;
  return {
    action, capability, move,
    title: action ? (tools[capability] || capability || event.title || 'Recorded action')
      : decisions[move] || event.title || 'Recorded step',
    status: uncertain ? 'Outcome uncertain' : action && status === 'success' ? 'Tool reported success'
      : action && ['failed', 'failure', 'error'].includes(status) ? 'Tool reported failure'
      : !action && decisions[move] ? 'Decision recorded' : status ? status.replaceAll('_', ' ') : 'Result not supplied',
    summary: event.summary || traceText(detail.summary) || traceText(detail.response)
      || traceText(detail.reason) || '',
    when: event.occurred_at || event.at,
  };
}

export function traceActivity(beat: AwarenessBeat) {
  // Keep stored event order; timestamps and sequence numbers are not causal proof.
  const events = beat.events ?? [];
  const actions = events.filter(event => activityView(event).action);
  const controllers = events.filter(event => event.stage === 'controller' || Boolean(traceText(traceObject(event.detail).move)));
  return {
    actions,
    lastDecision: controllers.at(-1),
    other: events.filter(event => !actions.includes(event) && event !== controllers.at(-1)),
    incomplete: Boolean(beat.events_truncated || beat.run_flow?.truncated),
  };
}
