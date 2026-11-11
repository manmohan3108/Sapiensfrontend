import type { ChatDetail, ChatMessage } from '../../types/sapiensTypes';

/** Project persisted messages and turn status without inventing assistant speech. */
export function chatMessages(detail: ChatDetail, previous: ChatMessage[] = []): ChatMessage[] {
  const turns = new Map((detail.turns ?? []).map(turn => [turn.message_id, turn]));
  const prior = new Map(previous.map(message => [message.id, message]));
  const seen = new Set<string>();
  return detail.messages.filter(message => !seen.has(message.id) && seen.add(message.id)).map(message => {
    const content = typeof message.content === 'string' ? message.content : '';
    return {
      ...prior.get(message.id), id: message.id, role: message.role, content,
      timestamp: message.occurred_at, sessionId: detail.thread_id,
      turnStatus: turns.get(message.id)?.status, isLoading: false,
      quota: turns.get(message.id)?.quota, recoveryStatus: turns.get(message.id)?.recovery_status,
      isError: message.role === 'assistant' && !content.trim(),
      emptyResponse: message.role === 'assistant' && !content.trim(),
    };
  });
}

export const pendingTurn = (status: ChatMessage['turnStatus']) =>
  status === 'queued' || status === 'processing' || status === 'replying' || status === 'waiting';
