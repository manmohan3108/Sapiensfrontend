import type { InspectionActivity, InspectionActivityPage, SimulationRun } from '../../types/simulationTypes';

export const simulationText = (value: unknown) => typeof value === 'string' ? value : '';
export const readableSimulationLabel = (value: string) => value.replaceAll('_', ' ').replaceAll('-', ' ');

export function simulationTime(value?: string | null) {
  if (!value || !Number.isFinite(Date.parse(value))) return 'Time not recorded';
  return new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) + ' IST';
}

// Operation names describe the request. Only an explicit result can establish success.
const toolNames: Record<string, string> = {
  jira_get_issue: 'Read issue', jira_get_comments: 'Read issue comments', jira_add_comment: 'Add comment',
  jira_update_issue: 'Update issue', jira_transition_issue: 'Change issue status', jira_list_transitions: 'Check available statuses',
  'send-chat-message': 'Send chat message', 'send-channel-message': 'Post channel message', 'list-users': 'Look up colleagues',
  'get-user': 'Look up colleague', 'create-chat': 'Create conversation', 'list-chats': 'Find conversations',
  'list-chat-members': 'Check conversation members', 'list-chat-messages': 'Read conversation',
};

export function toolOutcome(item: InspectionActivity) {
  if (item.event_type !== 'ToolActivity') return null;
  if (item.payload.is_error === true) return { label: 'Tool reported an error', tone: 'danger' as const };
  if (item.payload.is_error === false) return { label: 'Tool reported success', tone: 'success' as const };
  return { label: 'Tool outcome not recorded', tone: 'neutral' as const };
}

export function activityLabel(item: InspectionActivity, participant: string | null) {
  if (item.event_type === 'MessageDelivered') return item.payload.sender_id === participant ? 'Sent message' : 'Received message';
  if (item.event_type === 'ToolActivity') {
    const tool = simulationText(item.payload.tool);
    return toolNames[tool] || readableSimulationLabel(tool || 'Tool activity');
  }
  if (item.event_type === 'ConnectionNotification') return 'Notification created';
  if (item.event_type === 'NotificationDelivery') return 'Notification delivered';
  return readableSimulationLabel(item.event_type);
}

export function canInspectDecision(item: InspectionActivity, participant: string | null) {
  return !!participant && item.event_type === 'MessageDelivered' && item.payload.recipient_id === participant && item.payload.sender_id !== participant;
}

// Multiple channel-delivery records may represent one message. Keep every delivery
// in the reader, but offer a single list entry. Never deduplicate by text or time.
export function groupActivity(items: InspectionActivity[]) {
  const groups = new Map<string, { key: string; item: InspectionActivity; records: InspectionActivity[] }>();
  for (const item of items) {
    const messageId = item.message_id || simulationText(item.payload.message_id);
    const key = item.event_type === 'MessageDelivered' && messageId ? `message:${messageId}` : `record:${item.record_id}`;
    const group = groups.get(key);
    if (group) group.records.push(item);
    else groups.set(key, { key, item, records: [item] });
  }
  return [...groups.values()];
}

export function mergeActivityPages(current: InspectionActivityPage, next: InspectionActivityPage) {
  if (current.run_id !== next.run_id || current.through !== next.through) throw new Error('The evidence snapshot changed. Refresh to load it again.');
  const seen = new Set(current.items.map(item => item.record_id));
  return { ...next, items: [...current.items, ...next.items.filter(item => !seen.has(item.record_id))] };
}

export function simulationLabReturn(run: SimulationRun, name?: string | null, returnTo?: string | null) {
  const params = new URLSearchParams({ runId: run.run_id });
  if (run.sapien_id != null) params.set('sapienId', String(run.sapien_id));
  if (name) params.set('sapienName', name);
  if (returnTo === '/workspace' || /^\/admin\/analyse(?:\/[a-z-]+)?(?:\?[^#]*)?$/.test(returnTo || '')) params.set('returnTo', returnTo!);
  return `/admin/simulations?${params}`;
}

export function simulationSectionPath(run: SimulationRun, section: string, name?: string | null, returnTo?: string | null) {
  const query = new URLSearchParams(simulationLabReturn(run, name, returnTo).split('?')[1]);
  query.delete('runId');
  return `/admin/simulations/${encodeURIComponent(run.run_id)}/world/${section}${query.size ? `?${query}` : ''}`;
}
