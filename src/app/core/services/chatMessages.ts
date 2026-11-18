import type { ChatDetail, ChatMessage } from '../../types/sapiensTypes';

/** Project persisted messages and turn status without inventing assistant speech. */
export function chatMessages(detail: ChatDetail, previous: ChatMessage[] = []): ChatMessage[] {
  const turns = new Map((detail.turns ?? []).map(turn => [turn.message_id, turn]));
  const prior = new Map(previous.map(message => [message.id, message]));
  const seen = new Set<string>();
  const messages = detail.messages.filter(message => !seen.has(message.id) && seen.add(message.id)).map(message => {
    const content = typeof message.content === 'string' ? message.content : '';
    return {
      ...prior.get(message.id), id: message.id, role: message.role, content,
      latestMessageId: message.id,
      waitingForMessageId: turns.get(message.id)?.waiting_for_message_id,
      editable: detail.message_editing_supported === true && message.role === 'user' && message.source?.type === 'chat' && typeof message.source?.actor_ref === 'string',
      timestamp: message.occurred_at, recordedTimestamp: true, sessionId: detail.thread_id,
      turnStatus: turns.get(message.id)?.status, isLoading: false,
      quota: turns.get(message.id)?.quota, recoveryStatus: turns.get(message.id)?.recovery_status,
      isError: message.role === 'assistant' && !content.trim(),
      emptyResponse: message.role === 'assistant' && !content.trim(),
    };
  });
  // Collapse only the display. Each saved version and every reply remain in history.
  const originals = new Map(detail.messages.map(message => [message.id, message]));
  const rows = new Map<string, ChatMessage>();
  for (const message of messages) {
    const revision = originals.get(message.id)?.source?.revision as { root_message_id?: string; edited_at?: string } | undefined;
    const rootId = message.role === 'user' && revision?.root_message_id ? revision.root_message_id : message.id;
    const root = rows.get(rootId);
    const version = { id: message.id, content: message.content, timestamp: message.timestamp };
    rows.set(rootId, root ? { ...message, id: rootId, timestamp: root.timestamp,
      editedAt: revision?.edited_at ?? message.timestamp, revisions: [...(root.revisions ?? []), version] }
      : { ...message, revisions: [version] });
  }
  return [...rows.values()];
}

export const pendingTurn = (status: ChatMessage['turnStatus']) =>
  status === 'queued' || status === 'processing' || status === 'replying' || status === 'waiting';
