import { FEEDBACK_STATES, type FeedbackReference, type FeedbackState } from '../../types/feedbackTypes';

export const feedbackLabels: Record<FeedbackState, string> = {
  unrelated: 'No clear connection', ambiguous: 'Needs interpretation',
  interpreted: 'Possible lesson', superseded: 'Replaced by a later finding',
};

export function feedbackMode(mode?: string) {
  if (mode === 'observe') return 'Observe mode: findings are recorded for inspection, not applied to behavior.';
  if (mode === 'off') return 'Feedback is off. Previously saved findings remain available.';
  if (mode === 'active') return 'Active mode makes findings available to other engines; this does not establish that they were used.';
  return 'Saved findings do not establish that learning was applied. Feedback mode is not available.';
}

export function feedbackTime(value?: string | null, precise = false) {
  if (!value) return 'Not recorded';
  if (!Number.isFinite(Date.parse(value))) return value;
  if (!/(?:Z|[+-]\d{2}:?\d{2})$/i.test(value)) return `${value} (timezone not recorded)`;
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
    ...(precise ? { second: '2-digit' as const } : {}), timeZoneName: 'short',
  }).format(new Date(value));
}

const readable = (value?: string) => value?.replace(/[_-]+/g, ' ').trim() || '';

/** Use explicit display fields only. Never extract identities or service names from prose. */
export function feedbackOrigin(reference?: FeedbackReference) {
  const display = reference?.details?.available ? reference.details.display : undefined;
  const service = ({ teams: 'Teams', jira: 'Jira' } as Record<string, string>)[display?.server || ''] || display?.server || '';
  const kind = readable(reference?.source);
  const action = readable(display?.tool);
  const people = display?.actor
    ? [display.actor, display.recipient].filter(Boolean).join(' → ')
    : display?.recipient ? `To ${display.recipient}` : '';
  return {
    primary: people || [service, action].filter(Boolean).join(' · ') || kind || 'Source not recorded',
    secondary: people ? [service, action || kind].filter(Boolean).join(' · ') : service || action ? kind : '',
  };
}

/** URL state belongs to one Sapien. Old selections must not carry into another Sapien. */
export function feedbackQuery(params: URLSearchParams, sapienId: string) {
  const scoped = params.get('feedbackFor') === sapienId ? params : new URLSearchParams();
  const requestedLimit = Number(scoped.get('feedbackLimit'));
  const requestedOffset = Number(scoped.get('feedbackOffset'));
  return {
    states: FEEDBACK_STATES.filter(state => scoped.getAll('feedbackState').includes(state)),
    limit: [10, 25, 50, 100].includes(requestedLimit) ? requestedLimit : 50,
    offset: Number.isSafeInteger(requestedOffset) && requestedOffset >= 0 ? requestedOffset : 0,
    selectedId: scoped.get('feedbackFinding') || null,
  };
}

export function updateFeedbackQuery(params: URLSearchParams, sapienId: string, patch: Partial<ReturnType<typeof feedbackQuery>>) {
  const next = new URLSearchParams(params);
  const state = { ...feedbackQuery(params, sapienId), ...patch };
  ['feedbackFor', 'feedbackState', 'feedbackLimit', 'feedbackOffset', 'feedbackFinding'].forEach(key => next.delete(key));
  next.set('feedbackFor', sapienId);
  state.states.forEach(value => next.append('feedbackState', value));
  if (state.limit !== 50) next.set('feedbackLimit', String(state.limit));
  if (state.offset) next.set('feedbackOffset', String(state.offset));
  if (state.selectedId) next.set('feedbackFinding', state.selectedId);
  return next;
}
