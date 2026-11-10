import type { WorldActivityItem, WorldChannel, WorldEmployee } from '../../types/simulationTypes';

export type ConversationFilter = 'all' | 'direct' | 'channels';
export interface MessageSummary { at: string; sequence: number; text: string }
export type MessageIndex = Record<string, MessageSummary>;

// Only messages involving the participant belong to a direct conversation.
// Channel deliveries must never update the sender's or recipients' direct chat.
export function indexMessages(previous: MessageIndex, items: WorldActivityItem[], participantId: string | null): MessageIndex {
  const next = { ...previous };
  for (const item of items) {
    if (item.category !== 'messages') continue;
    const body = item.event.payload;
    const sender = typeof body.sender_id === 'string' ? body.sender_id : item.actor_id;
    const recipients = item.recipient_ids ?? (typeof body.recipient_id === 'string' ? [body.recipient_id] : []);
    const channel = typeof body.channel_id === 'string' ? body.channel_id : '';
    const keys = channel ? [`channel:${channel}`] : !participantId ? []
      : sender === participantId ? recipients.filter(id => id !== participantId).map(id => `person:${id}`)
      : sender && recipients.includes(participantId) ? [`person:${sender}`] : [];
    const summary = { at: item.event.occurred_at, sequence: item.event.sequence, text: typeof body.text === 'string' ? body.text : '' };
    for (const key of keys) {
      const old = next[key];
      const difference = (Date.parse(summary.at) || 0) - (Date.parse(old?.at ?? '') || 0);
      if (!old || difference > 0 || (difference === 0 && summary.sequence > old.sequence)) next[key] = summary;
    }
  }
  return next;
}

export function conversationList(people: WorldEmployee[], channels: WorldChannel[], index: MessageIndex) {
  return [
    ...people.map(person => ({ key: `person:${person.person_id}`, kind: 'direct' as const, name: person.name, id: person.person_id,
      count: person.direct_sent != null && person.direct_received != null ? person.direct_sent + person.direct_received : null })),
    ...channels.map(channel => ({ key: `channel:${channel.channel_id}`, kind: 'channels' as const, name: channel.title, id: channel.channel_id, count: channel.posts })),
  ].map(row => ({ ...row, latest: index[row.key] })).sort((a, b) =>
    (Date.parse(b.latest?.at ?? '') || 0) - (Date.parse(a.latest?.at ?? '') || 0)
    || (b.latest?.sequence ?? 0) - (a.latest?.sequence ?? 0)
    || a.name.localeCompare(b.name) || a.key.localeCompare(b.key));
}
