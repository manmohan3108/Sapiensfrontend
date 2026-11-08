import type { QuotaDetails, QuotaRecoveryStatus } from '../types/quotaTypes';

export function quotaSummary(quota: QuotaDetails): string {
  const label = quota.scope === 'global' ? `Shared service ${quota.tier} allowance`
    : quota.allowance === 'conversation' ? 'Conversation allowance'
    : `${quota.allowance} allowance`;
  const kind = quota.kind === 'llm' ? 'LLM' : quota.kind;
  return `${label} reached: ${quota.count.toLocaleString()} of ${quota.limit.toLocaleString()} ${kind} calls.`;
}

export function quotaReset(quota: QuotaDetails): string {
  const date = new Date(quota.resets_at);
  if (!Number.isFinite(date.getTime())) return 'Reset time was not recorded.';
  const simulated = quota.time_basis === 'simulated_utc';
  const time = new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium', timeStyle: 'long', ...(simulated ? { timeZone: 'UTC' } : {}),
  }).format(date);
  return simulated ? `Allowance resets at simulated ${time}; pausing also pauses this clock.`
    : `Allowance reset: ${time}.`;
}

export function quotaRecovery(status?: QuotaRecoveryStatus | null): string {
  if (status === 'manual_required') return 'The message and progress are saved. Automatic recovery is unavailable in this manual chat runtime.';
  if (status === 'failed') return 'Progress is retained, but automatic recovery is not scheduled.';
  if (status === 'pending') return 'Recovery is queued. It can continue after reset while its original runtime is running.';
  if (status === 'running') return 'Recovery is processing.';
  return '';
}
