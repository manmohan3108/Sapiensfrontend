import type { WMEntry } from '../../types/engramTypes';
import { sourceName } from '../workspace/ContextReader';

const object = (value: unknown): Record<string, unknown> => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
const text = (...values: unknown[]) => values.find(value => typeof value === 'string' && value.trim()) as string | undefined;

/** Present recorded origin fields only; never extract identities from prose. */
export function memoryOrigin(entry: WMEntry) {
  const metadata = object(entry.metadata), origin = object(metadata.origin), provenance = object(entry.provenance);
  const service = text(origin.type, provenance.source_type, metadata.source_type);
  const person = text(origin.actor_name, provenance.actor_name, metadata.actor_name);
  const place = text(origin.issue_key, origin.name, provenance.source_name, metadata.source_name);
  const channel = text(origin.channel_id), thread = text(origin.thread_id);
  const simulation = !!text(origin.simulation_run_id) || [origin.actor_ref, origin.reply_route_ref].some(value => typeof value === 'string' && value.startsWith('simulation:'));
  return { service: service ? sourceName(service) : undefined, person, place, channel, thread, simulation };
}

export function memoryKind(entry: WMEntry) {
  return entry.memory_source === 'memory_unit' ? 'Stored memory' : sourceName(entry.memory_source);
}

export function memoryActivation(entry: WMEntry): number | undefined {
  const value = entry.activation ?? entry.score;
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}
export function activationLabel(entry: WMEntry) {
  const value = memoryActivation(entry);
  return value === undefined ? 'Not recorded' : new Intl.NumberFormat(undefined, { style: 'percent', maximumFractionDigits: 0 }).format(value);
}

export function recordedDate(...values: unknown[]): string | undefined {
  // Require an explicit timezone: do not interpret a timezone-less backend date
  // using the browser's clock or silently shift its meaning.
  return values.find(value => typeof value === 'string' && /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value) && Number.isFinite(Date.parse(value))) as string | undefined;
}
export function memoryTimes(entry: WMEntry) {
  const metadata = object(entry.metadata);
  const numericLastUsed = typeof entry.last_used === 'number' && Number.isFinite(entry.last_used) ? new Date(entry.last_used * 1000) : null;
  return {
    activated: recordedDate(entry.last_used_at, typeof entry.last_used === 'string' ? entry.last_used : undefined,
      numericLastUsed && Number.isFinite(numericLastUsed.getTime()) ? numericLastUsed.toISOString() : undefined),
    created: recordedDate(entry.created_at, metadata.created_at),
    event: recordedDate(entry.event_at, metadata.observed_at, metadata.occurred_at),
  };
}
export function memoryDate(value?: string) {
  return value ? new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }).format(new Date(value)) : 'Not recorded';
}

export function matchesMemory(entry: WMEntry, query: string) {
  const origin = memoryOrigin(entry);
  const needle = query.trim().toLocaleLowerCase();
  return !needle || [entry.content, entry.id, entry.memory_source, memoryKind(entry), entry.memory_type,
    ...Object.values(origin).filter(value => typeof value === 'string'), ...(entry.tags ?? []), ...(entry.references ?? [])]
    .some(value => String(value ?? '').toLocaleLowerCase().includes(needle));
}

export function activationBuckets(entries: WMEntry[]) {
  return Array.from({ length: 10 }, (_, index) => ({ label: `${index * 10}–${(index + 1) * 10}%`, count: entries.filter(entry => {
    const value = memoryActivation(entry);
    return value !== undefined && value >= index / 10 && (index === 9 ? value <= 1 : value < (index + 1) / 10);
  }).length }));
}
