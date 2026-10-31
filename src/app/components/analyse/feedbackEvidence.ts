import type { FeedbackFinding, FeedbackReference } from '../../types/feedbackTypes';

type RecordValue = Record<string, unknown>;
export type EvidenceField = { key: string; label: string; value: string };
const object = (value: unknown): RecordValue | undefined => value !== null && typeof value === 'object' && !Array.isArray(value) ? value as RecordValue : undefined;
const text = (value: unknown) => typeof value === 'string' ? value : '';
const readable = (value: string) => value.replace(/[_-]+/g, ' ');
const parseJson = (value: string): unknown => { try { return JSON.parse(value); } catch { return undefined; } };
const marker = (value: string) => /\[(?:truncated|redacted)[^\]]*\]/i.test(value);

/** Read saved Jira document text without interpreting markup or repairing cut records. */
export function feedbackDocumentText(value: unknown): string {
  if (typeof value === 'string') return value;
  const doc = object(value);
  if (doc?.type !== 'doc' || !Array.isArray(doc.content)) return '';
  let visited = 0, omitted = false;
  const read = (value: unknown, depth: number): string => {
    if (++visited > 1000 || depth > 20) { omitted = true; return ''; }
    const node = object(value);
    if (!node) return '';
    if (node.type === 'text') return text(node.text);
    if (node.type === 'hardBreak') return '\n';
    if (!Array.isArray(node.content)) return '';
    const content = node.content.map(child => read(child, depth + 1)).join('');
    return content + (/^(paragraph|heading|listItem|tableRow|blockquote)$/.test(text(node.type)) ? '\n' : '');
  };
  const content = read(doc, 0).trim();
  return content + (omitted ? '\n[Further document content omitted]' : '');
}

function resultItem(value: unknown) {
  const record = object(value);
  const body = feedbackDocumentText(record?.body) || text(object(record?.body)?.content) || text(record?.text);
  return {
    fields: fields(value),
    text: scalar(value) ?? (body || undefined),
    author: text(object(record?.author)?.displayName) || text(object(object(record?.from)?.user)?.displayName),
  };
}

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
    resultItems: Array.isArray(collection) ? collection.map(resultItem) : undefined,
    error: text(error?.message) || text(resultRecord?.error),
    resultText: tool?.resultText || (tool?.result !== undefined && !object(tool.result) && !Array.isArray(tool.result) ? scalar(tool.result) : '') || '',
  };
}

/** Exact saved excerpts for graph nodes; no generated summaries, identities or causal claims. */
export function feedbackNodePreview(reference: FeedbackReference, names = new Map<string, string>()) {
  const event = eventEvidence(reference, names);
  const available = !!reference?.details?.available;
  const issue = text(event.tool?.args?.issue_key || event.tool?.args?.issueKey);
  const result = object(event.tool?.result);
  // Jira tools return either native `fields` or a flattened issue. Both contain
  // the same reader-facing information; housekeeping fields stay in source details.
  const issueFields = object(result?.fields) || result;
  const commentTool = event.tool?.server === 'jira' && event.tool.tool === 'jira_get_comments';
  const issueTool = event.tool?.server === 'jira' && event.tool.tool === 'jira_get_issue';
  // A batch is evidence as a whole. Its first entry is not necessarily the one
  // that explains the finding, so expose every saved entry without ranking it.
  const singleItem = event.resultItems?.length === 1 ? event.resultItems[0] : undefined;
  const entries = !event.error && (event.resultItems?.length || 0) > 1 ? event.resultItems : undefined;
  let title = event.title;
  let excerpt = event.body;
  let caption = '';
  let context = event.actor;
  const issueStatus = issueTool ? text(issueFields?.status) || text(object(issueFields?.status)?.name) : '';
  const facts = (values: EvidenceField[]) => values.map(field => `${field.label}: ${field.value}`).join('\n');

  if (event.kind === 'message') {
    title = event.tool ? 'Sapiens’ message request' : event.actor ? `Message from ${event.actor}` : 'Message received';
    context = event.recipient ? `To ${event.recipient}` : '';
    caption = event.tool ? 'Message submitted to the tool' : 'Saved message';
    // Do not show an unparsed serialization envelope as a human message.
    if (event.tool && /^Tool activity /.test(excerpt)) excerpt = '';
  } else if (event.tool) {
    title = commentTool ? `${singleItem ? 'Comment' : 'Comments'}${singleItem?.author ? ` from ${singleItem.author}` : ''}${issue ? ` on ${issue}` : ' from Jira'}`
      : issueTool ? `Jira issue${issue ? ` ${issue}` : ' details'}`
      : event.tool.server === 'teams' && event.tool.tool === 'create-chat' ? 'Create a Teams chat'
      : event.tool.server === 'teams' && /^(list-chat-messages|list-channel-messages)$/.test(event.tool.tool) ? 'Request to read Teams messages'
      : event.title || 'Tool record';
    const resultExcerpt = singleItem?.text || (singleItem ? facts(singleItem.fields) : '')
      || event.resultText || (issueTool ? feedbackDocumentText(issueFields?.description) || text(issueFields?.summary) : facts(event.resultFields));
    if (event.error) { excerpt = event.error; caption = 'Error returned by the tool'; }
    else if (entries) {
      excerpt = ''; caption = `${entries.length} entries in this saved result`;
    }
    else if (event.resultItems?.length === 0) {
      excerpt = 'The saved result contains no entries.'; caption = 'Saved result';
    } else if (resultExcerpt) {
      excerpt = resultExcerpt;
      caption = issueTool ? 'Issue description' : 'Saved result';
      context = singleItem?.author && !commentTool ? `From ${singleItem.author}` : issueTool ? text(issueFields?.summary) : '';
      if (context === excerpt) context = '';
    } else if (event.body && !/^Tool activity /.test(event.body)) {
      excerpt = event.body; caption = 'Saved event text';
    } else {
      excerpt = 'No readable result was supplied.'; caption = 'Result unavailable';
    }
    const members = object(event.tool.args?.body)?.members;
    if (event.tool.server === 'teams' && event.tool.tool === 'create-chat' && Array.isArray(members) && members.length) {
      context = `Participants: ${members.map((value, index) => {
        const member = object(value);
        return member && names.get(memberId(member)) || `Member ${index + 1} (name not supplied)`;
      }).join(', ')}`;
    }
  } else if (event.kind === 'update') {
    const domain = reference.details?.available ? text(reference.details.metadata?.domain) : '';
    title = domain ? `Recorded ${readable(domain)} progress` : 'Recorded progress update';
    caption = 'Saved assessment of progress';
  } else {
    title = 'Saved record'; caption = 'Saved event text';
  }

  return {
    title, excerpt: available ? excerpt || (entries ? '' : 'No readable text was supplied.') : 'Details unavailable. The original event could not be loaded.',
    caption, context, entries, issueStatus, service: event.service,
    detailAction: event.tool ? event.kind === 'message' ? 'View tool details' : 'View request and result' : available ? 'View source details' : 'View saved reference',
    status: event.tool ? `Tool reported: ${event.tool.outcome || 'result not recorded'}` : event.state ? `Recorded state: ${event.state}` : '',
    tone: event.tool?.outcome === 'Failed' ? 'danger' as const : event.tool?.outcome === 'Uncertain' ? 'warning' as const : 'neutral' as const,
    partial: !!(reference?.details?.available && (reference.details.truncated || reference.details.metadata?._truncated === true)),
  };
}

export function feedbackDetailTitle(finding: FeedbackFinding) {
  const events = [finding.activity, finding.experience, ...(finding.supporting_experiences || [])].map(ref => eventEvidence(ref));
  const issues = [...new Set(events.filter(event => event.tool?.server === 'jira')
    .map(event => text(event.tool?.args?.issue_key || event.tool?.args?.issueKey)).filter(Boolean))];
  if (issues.length === 1) return `Feedback on Jira issue ${issues[0]}`;
  const [a, b] = events;
  if (a.tool?.server === 'teams' && b.tool?.server === 'teams' && a.tool.tool === 'create-chat' && b.tool.tool === 'create-chat') return 'Review of Teams chat requests';
  const actors = [...new Set(events.map(event => event.actor).filter(Boolean))];
  if (actors.length === 1 && events.some(event => event.kind === 'message')) return `Conversation feedback involving ${actors[0]}`;
  if (events.some(event => event.service === 'Teams') && events.some(event => event.kind === 'message')) return 'Feedback on a Teams conversation';
  if (a.kind === 'update' && b.kind === 'update') return 'Feedback on recorded progress';
  return 'Feedback on linked activity';
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
