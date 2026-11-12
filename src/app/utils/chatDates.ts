import type { ChatMessage } from '../types/sapiensTypes';

const day = (date: Date) => Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000;

/** Calendar days in the same local timezone used by message times, not elapsed 24h. */
export function chatDate(timestamp: string, now: Date | null) {
  const date = new Date(timestamp);
  if (!Number.isFinite(date.getTime())) return null;
  const exact = date.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  const difference = now && Number.isFinite(now.getTime()) ? day(now) - day(date) : null;
  return { key: String(day(date)), exact, label: difference === 0 ? 'Today' : difference === 1 ? 'Yesterday' : exact };
}

export function datedMessages(messages: ChatMessage[], now: Date | null, simulation: boolean) {
  let previousDay: string | undefined;
  return messages.map(message => {
    // Optimistic simulation messages have browser timestamps until saved evidence arrives.
    const showTime = !message.isLoading && (!simulation || message.recordedTimestamp === true);
    const date = showTime ? chatDate(message.timestamp, now) : null;
    const separator = date && date.key !== previousDay ? date : null;
    if (date) previousDay = date.key;
    return { message, separator, showTime: showTime && date !== null };
  });
}
