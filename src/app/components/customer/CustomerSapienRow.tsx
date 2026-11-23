import { ChevronRight, Loader2, SlidersHorizontal } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { activityStatusLabel } from '../../utils/activityPresentation';
import { useSapienActivity } from '../../hooks/useSapienActivity';
import type { SapienActivity, Sapiens } from '../../types/sapiensTypes';
import { SapienActivityActions } from './SapienActivityControl';

export function CustomerSapienRow({ individual, opening, disabled, error, onOpen, onActivityChange }: {
  individual: Sapiens; opening: boolean; disabled: boolean; error?: string;
  onOpen: () => void;
  onActivityChange: (id: string, activity: SapienActivity | null) => void;
}) {
  const controller = useSapienActivity(individual, false, onActivityChange);
  const management = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    if (controller.error && management.current) management.current.open = true;
  }, [controller.error]);
  const { activity, pending } = controller;
  const reason = activity?.activityUnavailableReason;
  const status = pending ? (pending === 'saving' ? 'Updating…' : 'Checking…')
    : `${activityStatusLabel(activity)}${activity?.draining ? ' · Finishing work…' : ''}`;
  return <article className="customer-sapien-row">
    <button type="button" className="customer-sapien-open" disabled={disabled} onClick={onOpen}
      aria-label={`Open ${individual.name}, ID ${individual.id}`} aria-busy={opening}>
      <span className="customer-sapien-avatar" aria-hidden="true">{Array.from(individual.name)[0]?.toUpperCase()}</span>
      <span className="customer-sapien-identity">
        <span className="customer-sapien-name">{individual.name}</span>
        <span className="customer-sapien-role">{individual.role || 'Generalist'}</span>
        <span className="customer-sapien-id">ID {individual.id}{opening ? ' · Opening…' : ''}</span>
      </span>
      {opening ? <Loader2 size={20} className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <ChevronRight size={20} aria-hidden="true" />}
    </button>
    {error && <p className="customer-sapien-error" role="alert">{error}</p>}
    <details ref={management} className="customer-sapien-manage">
      <summary>
        <span className="customer-sapien-status" role="status" aria-live="polite" data-active={!reason && !pending && !activity?.draining && activity?.activityState === 'active'}><span aria-hidden="true" />{status}</span>
        <span className="customer-sapien-manage-label"><SlidersHorizontal size={15} aria-hidden="true" />Manage<span className="sr-only"> {individual.name}</span><ChevronRight size={14} aria-hidden="true" /></span>
      </summary>
      <div className="customer-sapien-controls"><SapienActivityActions sapien={individual} controller={controller} compact /></div>
    </details>
  </article>;
}
