import type { InquiryDetail, InquiryFilters } from '../../types/inquiryTypes';
import { traceObject as object, traceText as text } from '../workspace/awarenessTrace';
import { feedbackDocumentText } from './feedbackEvidence';

const records = (value: unknown) => Array.isArray(value) ? value.map(object) : [];
const present = (value: unknown) => value != null && value !== ''
  && (typeof value !== 'object' || Object.keys(value).length > 0);

export const questionStateLabel = (state: unknown) => state === 'answered' ? 'Answer recorded'
  : state === 'open' ? 'Open' : state === 'stale' ? 'Closed without an answer' : 'Status not recorded';
export const questionSourceLabel = (source: string | null) => source === 'awareness_engine' ? 'Sapiens’ Awareness'
  : source?.replaceAll('_', ' ') || 'Source not recorded';

export function questionQuery(params: URLSearchParams, sapienId: string) {
  const sameSapien = !params.get('questionFor') || params.get('questionFor') === sapienId;
  const number = (key: string, fallback: number, max: number) => {
    const value = Number(params.get(key));
    return params.has(key) && Number.isSafeInteger(value) && value >= 0 && value <= max ? value : fallback;
  };
  const state = sameSapien ? params.get('questionState') : '';
  const filters: InquiryFilters = {
    limit: sameSapien ? Math.max(1, number('questionLimit', 50, 200)) : 50,
    state: state === 'open' || state === 'answered' || state === 'stale' ? state : '',
    source: sameSapien ? params.get('questionSource') || '' : '', channel: '', delivery_state: '',
  };
  return { filters, offset: sameSapien ? number('questionOffset', 0, Number.MAX_SAFE_INTEGER) : 0,
    selectedId: sameSapien ? params.get('record_id') || null : null };
}

export function updateQuestionQuery(params: URLSearchParams, sapienId: string, patch: {
  filters?: InquiryFilters; offset?: number; selectedId?: string | null;
}) {
  const query = { ...questionQuery(params, sapienId), ...patch };
  const next = new URLSearchParams(params);
  next.set('questionFor', sapienId);
  const set = (key: string, value: string | null) => value ? next.set(key, value) : next.delete(key);
  set('questionState', query.filters.state); set('questionSource', query.filters.source);
  set('questionLimit', query.filters.limit === 50 ? null : String(query.filters.limit));
  set('questionOffset', query.offset ? String(query.offset) : null); set('record_id', query.selectedId);
  return next;
}

export interface QuestionMessage { author: string; body: string; when: string; location: string }
export interface QuestionEvidence {
  id: string; title: string; source: string; body: string; messages: QuestionMessage[];
  when: string; timeLabel: string; status: string; derived: boolean; partial: boolean; raw: unknown;
}
const operationNames: Record<string, string> = {
  'list-chat-messages': 'Read chat messages', 'get-chat-message': 'Read a chat message',
  'list-channel-messages': 'Read channel messages', 'get-channel-message': 'Read a channel message',
  'jira_get_comments': 'Read issue comments', 'jira_get_issue': 'Read an issue',
};
const kindNames: Record<string, string> = {
  internal_understanding: 'Earlier understanding', prior_understanding: 'Earlier understanding',
  observation: 'Sapiens’ observation', learned_tool_guidance: 'Guidance from earlier tool use',
  original_impression: 'Original input', outcome_assessment: 'Earlier assessment',
};
function parseResult(content: string): { operation: string; value: unknown } | undefined {
  // Only the complete, explicitly delimited saved-result envelope. Never repair truncated JSON.
  const match = /^\[([\w-]+)\] did: ([\s\S]+)$/.exec(content);
  if (!match) return;
  try { return { operation: match[1], value: JSON.parse(match[2]) }; } catch { return; }
}
function message(value: Record<string, unknown>): QuestionMessage | undefined {
  const body = object(value.body);
  const content = text(body.content) || feedbackDocumentText(value.body);
  if (!content) return;
  const channel = object(value.channelIdentity);
  return { body: content, author: text(object(object(value.from).user).displayName) || text(object(value.author).displayName),
    when: text(value.createdDateTime) || text(value.created),
    location: [text(channel.teamId), text(channel.channelId)].filter(Boolean).join(' / ') };
}

export function questionEvidence(value: unknown, index = 0): QuestionEvidence {
  const record = object(value);
  const data = object(record.data);
  const evidence = object(record.evidence);
  const content = text(record.content) || text(data.content) || text(value);
  const parsed = parseResult(content);
  const operation = text(record.tool) || text(evidence.tool) || parsed?.operation || '';
  const server = text(record.server) || text(evidence.server)
    || (text(record.source).startsWith('teams.') ? 'teams' : text(record.source).startsWith('jira.') ? 'jira' : '')
    || (parsed && /^(list|get)-(chat|channel)-message(s)?$/.test(operation) ? 'teams' : parsed && /^jira_/.test(operation) ? 'jira' : '');
  const service = server === 'teams' ? 'Teams' : server === 'jira' ? 'Jira' : server;
  const result = object(parsed?.value);
  const entries = Array.isArray(result.value) ? records(result.value) : Array.isArray(result.comments) ? records(result.comments) : [result];
  const messages = entries.map(message).filter((item): item is QuestionMessage => !!item);
  // If a mixed result cannot be fully represented as messages, retain the whole saved content.
  const completeMessages = messages.length > 0 && messages.length === entries.length;
  const issue = present(result.fields) ? object(result.fields) : result;
  const issueText = parsed && operation === 'jira_get_issue' ? [
    text(result.key) && `Issue: ${text(result.key)}`, text(issue.summary),
    (text(object(issue.status).name) || text(issue.status)) && `Recorded status: ${text(object(issue.status).name) || text(issue.status)}`,
    feedbackDocumentText(issue.description),
  ].filter(Boolean).join('\n') : '';
  const origin = object(evidence.subject_origin || object(evidence.provenance).origin);
  const source = [service || text(record.source)?.replaceAll('_', ' '), text(origin.actor_name)].filter(Boolean).join(' · ');
  const derived = record.content_kind === 'derived_summary' || data.content_kind === 'derived_summary'
    || content.startsWith('[Derived summary;');
  const partial = record.result_detail_truncated === true || record.content_truncated === true
    || evidence.content_truncated === true || data.content_truncated === true || /\[(?:shortened|truncated)[^\]]*\]/i.test(content);
  return {
    id: text(record.id) || text(record.handle) || text(object(record.source_reference).id) || `saved-${index}`,
    title: operation ? [service, operationNames[operation] || operation.replaceAll('_', ' ').replaceAll('-', ' ')].filter(Boolean).join(' · ')
      : kindNames[text(record.kind)] || 'Saved context',
    source, body: completeMessages ? '' : issueText || content.replace(/^\[Derived summary; original retained, details may be omitted\]\s*/, ''), messages: completeMessages ? messages : [],
    when: text(record.observed_at) || text(record.event_at),
    timeLabel: record.observed_at ? 'Observed' : 'Event time',
    status: record.is_uncertain === true ? 'Tool outcome uncertain' : record.is_error === true ? 'Tool reported failure'
      : record.is_error === false ? 'Tool reported success' : '', derived, partial, raw: value,
  };
}

export function questioningView(item: InquiryDetail['item']) {
  const context = object(item.context);
  const outcome = object(item.outcome);
  // Only this question's outcome supplies its answer; nested prior assessments are context.
  const assessment = object(outcome.assessment);
  const trigger: QuestionEvidence[] = [];
  if (present(context.content)) trigger.push(questionEvidence({ content: context.content, kind: 'original_impression' }));
  else if (typeof item.context === 'string' && item.context.trim()) trigger.push(questionEvidence(item.context));
  records(context.items).forEach((entry, index) => trigger.push(questionEvidence(entry, index + 1)));

  const evidence = records(outcome.evidence);
  const refs = new Set(Array.isArray(assessment.evidence_refs) ? assessment.evidence_refs.filter((id): id is string => typeof id === 'string') : []);
  const cited: QuestionEvidence[] = [], checked: QuestionEvidence[] = [], additional: QuestionEvidence[] = [];
  const seen = new Set<string>();
  evidence.forEach((entry, index) => {
    const view = questionEvidence(entry, index);
    if (entry.kind === 'original_impression' && text(entry.content) === item.question) return;
    if (seen.has(view.id)) return;
    seen.add(view.id);
    if ([entry.id, entry.handle, object(entry.source_reference).id].some(id => typeof id === 'string' && refs.has(id))) cited.push(view);
    else if (entry.kind === 'action' || entry.kind === 'action_outcome') checked.push(view);
    else additional.push(view);
  });
  records(outcome.context).forEach((entry, index) => {
    const view = questionEvidence(entry, index + evidence.length);
    // Collapse only exact retained copies, not merely similar text or matching names.
    if (seen.has(view.id) || [...cited, ...checked, ...additional].some(other => other.body && other.body === view.body && other.source === view.source)) return;
    seen.add(view.id); additional.push(view);
  });
  return { trigger, cited, checked, additional,
    answer: text(assessment.understanding) || text(item.outcome), reason: text(assessment.reason), remaining: text(assessment.remaining),
    unknownContext: !trigger.length && present(item.context), hasOutcome: present(item.outcome),
  };
}
