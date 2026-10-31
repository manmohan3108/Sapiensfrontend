import type { FeedbackFinding, FeedbackReference } from '../../types/feedbackTypes';

type RecordValue = Record<string, unknown>;
export type EvidenceField = { key: string; label: string; value: string };
const object = (value: unknown): RecordValue | undefined => value !== null && typeof value === 'object' && !Array.isArray(value) ? value as RecordValue : undefined;
const text = (value: unknown) => typeof value === 'string' ? value : '';
const readable = (value: string) => value.replace(/[_-]+/g, ' ');
const parseJson = (value: string): unknown => { try { return JSON.parse(value); } catch { return undefined; } };
const marker = (value: string) => /\[(?:truncated|redacted)[^\]]*\]/i.test(value);

/** Parse only the backend's documented tool-activity envelope. Never repair cut JSON. */
export function toolEvidence(reference: FeedbackReference) {
  const details = reference?.details;
  if (!details?.available) return undefined;
  const display = details.display;
  const metadata = details.metadata || {};
  if (reference.source !== 'tool_activity') return undefined;
  const server = text(display?.server || metadata.server);
  const tool = text(display?.tool || metadata.tool);
  const envelope = /^Tool activity (\S+) (succeeded|failed|has an uncertain result)\.\r?\nArguments: ([^\r\n]*)\.\r?\nResult: ([\s\S]*)$/.exec(details.content);
  const matched = envelope && server && tool && envelope[1] === `${server}.${tool}` ? envelope : undefined;
  const args = object(matched ? parseJson(matched[3]) : undefined) || object(metadata.arguments);
  const result = matched ? parseJson(matched[4]) : undefined;
  const resultText = matched && result === undefined && !/^[\s]*[\[{]/.test(matched[4]) ? matched[4] : '';
  // The canonical envelope preserves uncertain outcomes omitted by older display fields.
  const outcome = matched?.[2] === 'has an uncertain result' ? 'Uncertain' : text(display?.outcome)
    || (matched?.[2] === 'failed' ? 'Failed' : matched?.[2] === 'succeeded' ? 'Succeeded'
      : typeof metadata.is_error === 'boolean' ? metadata.is_error ? 'Failed' : 'Succeeded' : '');
  return { server, tool, args, result, resultText, outcome, parsed: !!matched };
}

function memberId(member: RecordValue) {
  const binding = text(member['user@odata.bind']);
  return text(member.userId) || /^https:\/\/graph\.microsoft\.com\/v1\.0\/users\('([^']+)'\)$/.exec(binding)?.[1] || '';
}

/** Resolve names only from exact user IDs in returned members, never from prose. */
export function evidenceNames(references: FeedbackReference[]) {
  const names = new Map<string, string>();
  const conflicts = new Set<string>();
  for (const reference of references) {
    const members = object(toolEvidence(reference)?.result)?.members;
    if (!Array.isArray(members)) continue;
    for (const value of members) {
      const member = object(value);
      if (!member) continue;
      const id = memberId(member), name = text(member.displayName);
      if (!id || !name || marker(id) || marker(name) || conflicts.has(id)) continue;
      if (names.has(id) && names.get(id) !== name) { names.delete(id); conflicts.add(id); }
      else names.set(id, name);
    }
  }
  return names;
}

const fieldLabels: Record<string, string> = {
  chatType: 'Chat type', topic: 'Topic', content: 'Message', issue_key: 'Issue', issueKey: 'Issue',
  summary: 'Summary', description: 'Description', status: 'Status', state: 'State',
  project_key: 'Project', projectKey: 'Project', jql: 'Jira query', query: 'Query', name: 'Name',
};
const technicalKey = (key: string) => /^(?:id|.*_id|.*Id|.*_ref|.*Ref|@.*|.*@.*|_truncated|preview)$/.test(key);
const scalar = (value: unknown): string | undefined => value === null ? 'Not supplied'
  : typeof value === 'string' ? value || 'Empty' : typeof value === 'number' || typeof value === 'boolean' ? String(value) : undefined;

/** A bounded view of stored fields. Complex arrays and infrastructure IDs stay in the raw record. */
function fields(value: unknown, prefix = '', depth = 0): EvidenceField[] {
  const record = object(value);
  if (!record || depth > 3) return [];
  return Object.entries(record).flatMap(([key, item]) => {
    if (technicalKey(key) || key === 'members' || key === 'contentType') return [];
    const path = prefix ? `${prefix}.${key}` : key;
    const plain = scalar(item);
    if (plain !== undefined) return [{ key: path, label: fieldLabels[key] || readable(path), value: plain }];
    if (Array.isArray(item) && item.every(part => typeof part === 'string')) return [{ key: path, label: fieldLabels[key] || readable(path), value: item.length ? item.join(', ') : 'None supplied' }];
    return fields(item, path, depth + 1);
  }).slice(0, 12);
}

function requestFields(tool: NonNullable<ReturnType<typeof toolEvidence>>, names: Map<string, string>) {
  const ordinary = fields(tool.args);
  const members = object(tool.args?.body)?.members;
  if (!Array.isArray(members)) return ordinary;
  const rows: EvidenceField[] = [];
  for (const [index, item] of members.entries()) {
    const member = object(item);
    if (!member) continue;
    const id = memberId(member);
    const roles = member.roles;
    rows.push({
      key: id && !marker(id) ? `member:${id}:roles` : `unmatched-member:${index}`,
      label: `${names.get(id) || `Member ${index + 1}`} — roles`,
      value: Array.isArray(roles) && roles.every(role => typeof role === 'string')
        ? roles.length ? roles.join(', ') : 'No role supplied' : 'Roles not recorded',
    });
  }
  return [...rows, ...ordinary].slice(0, 12);
}

export function eventEvidence(reference: FeedbackReference, names = new Map<string, string>()) {
  const details = reference?.details;
  const display = details?.available ? details.display : undefined;
  const metadata = details?.available ? details.metadata : undefined;
  const tool = toolEvidence(reference);
  const domain = text(metadata?.domain), state = text(metadata?.state);
  const isMessage = reference?.source === 'conversation_message' || !!tool && /^(send-chat-message|send-channel-message)$/.test(tool.tool);
  const kind = isMessage ? 'message' : tool ? 'tool' : reference?.source === 'domain_lifecycle' ? 'update' : 'other';
  const service = ({teams:'Teams',jira:'Jira'} as Record<string,string>)[tool?.server || ''] || tool?.server || '';
  const action = readable((tool?.tool || '').replace(/^jira[_-]/, ''));
  const title = kind === 'message' ? (tool ? `${service || 'Tool'} message request` : 'Message received')
    : tool ? [service, action].filter(Boolean).join(' · ')
    : kind === 'update' ? `${domain ? readable(domain) : 'Progress'} update` : readable(reference?.source || 'Saved event');
  let body = details?.available ? display?.text || details.content : '';
  if (tool?.parsed) {
    const messageBody = object(tool.args?.body);
    const nestedBody = object(messageBody?.body);
    // Communication text supplied by the API takes priority over the tool envelope.
    body = display?.text && display.text !== details?.content ? display.text
      : isMessage ? text(nestedBody?.content || messageBody?.content || tool.args?.content) : '';
  }
  // Remove only the verified serialization prefix; retain the goal's exact recorded update.
  if (kind === 'update' && domain && state && body.startsWith(`${domain} `)) {
    const end = body.indexOf(` changed to ${state}. `);
    if (end > domain.length && !body.slice(domain.length + 1, end).includes(' ')) body = body.slice(end + ` changed to ${state}. `.length);
  }
  const resultRecord = object(tool?.result);
  const error = object(resultRecord?.error);
  const collection = Array.isArray(tool?.result) ? tool.result
    : ['value', 'messages', 'issues', 'comments', 'chats'].map(key => resultRecord?.[key]).find(Array.isArray);
  return {
    kind, title, service, action, tool, body, state,
    actor: text(display?.actor), recipient: text(display?.recipient),
    fields: tool ? requestFields(tool, names) : [],
    resultFields: resultRecord ? fields(resultRecord).filter(field => !field.key.startsWith('error.')) : [],
    resultItems: Array.isArray(collection) ? collection.map(item => ({ fields: fields(item), text: scalar(item) })) : undefined,
    error: text(error?.message) || text(resultRecord?.error),
    resultText: tool?.resultText || (tool?.result !== undefined && !object(tool.result) && !Array.isArray(tool.result) ? scalar(tool.result) : '') || '',
  };
}

export function feedbackDetailTitle(finding: FeedbackFinding) {
  const a = eventEvidence(finding.activity), b = eventEvidence(finding.experience);
  if (a.kind === 'message' && b.kind === 'message') return 'Messages and feedback';
  if (a.tool && b.tool && a.tool.server === b.tool.server && a.tool.tool === b.tool.tool) return a.title;
  if (a.kind === 'update' && b.kind === 'update') return a.title === b.title ? a.title : 'Progress updates';
  return 'Activity and follow-up';
}

/** Compare only matching stored fields of the same tool, not arbitrary event pairs. */
export function changedRequestFields(finding: FeedbackFinding, names: Map<string,string>) {
  const a = eventEvidence(finding.activity, names), b = eventEvidence(finding.experience, names);
  if (!a.tool?.server || !a.tool.tool || !b.tool || a.tool.server !== b.tool.server || a.tool.tool !== b.tool.tool) return [];
  return a.fields.flatMap(field => {
    const later = b.fields.find(item => item.key === field.key);
    if (!later || field.key.startsWith('unmatched-') || marker(field.value) || marker(later.value) || field.value === 'Roles not recorded' || later.value === 'Roles not recorded' || field.value === later.value) return [];
    return [{ label: field.label, earlier: field.value, later: later.value }];
  });
}

export function additionalEvidence(finding: FeedbackFinding) {
  const seen = new Map([finding.activity, finding.experience].filter(Boolean).filter(ref => ref.id).map(ref => [ref.id, JSON.stringify(ref)]));
  let repeated = 0;
  const references = (finding.supporting_experiences || []).filter(ref => {
    const signature = JSON.stringify(ref);
    if (ref.id && seen.get(ref.id) === signature) { repeated++; return false; }
    if (ref.id) seen.set(ref.id, signature);
    return true;
  });
  return { references, repeated };
}
