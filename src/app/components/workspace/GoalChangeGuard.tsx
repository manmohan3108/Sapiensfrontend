import { useEffect, useRef, useState } from 'react';
import { goalsService, SimulationGoalChangeError } from '../../core/services/goalsService';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from '../ui/dialog';

/** Shared by goal, plan and step controls in Analyse and Workspace. */
export function useGoalChangeGuard(sapienId: number, goalId: string, analyse = false) {
  const key = `${sapienId}/${goalId}`;
  const current = useRef(key);
  current.current = key;
  const generation = useRef(0), inFlight = useRef(false);
  const opener = useRef<HTMLElement | null>(null);
  const [checking, setChecking] = useState(false);
  const [notice, setNotice] = useState<{ key: string; simulation: boolean } | null>(null);
  useEffect(() => {
    inFlight.current = false;
    setChecking(false);
    setNotice(null);
    return () => { generation.current++; };
  }, [key]);

  function handleError(error: unknown) {
    if (!(error instanceof SimulationGoalChangeError)) return false;
    if (!opener.current?.isConnected) opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setNotice({ key, simulation: true });
    return true;
  }

  async function openIfAllowed(open: () => void, trigger: HTMLElement) {
    if (inFlight.current) return;
    inFlight.current = true;
    const version = generation.current;
    const valid = () => current.current === key && generation.current === version;
    opener.current = trigger;
    setChecking(true);
    try {
      await goalsService.checkGoalChanges(sapienId);
      if (valid()) open();
    } catch (error) {
      if (valid()) setNotice({ key, simulation: error instanceof SimulationGoalChangeError });
    } finally {
      if (valid()) { inFlight.current = false; setChecking(false); }
    }
  }

  const dialog = <Dialog open={notice?.key === key} onOpenChange={open => { if (!open) setNotice(null); }}>
    <DialogContent className={`max-h-[90dvh] w-[calc(100%-2rem)] max-w-md overflow-y-auto overscroll-contain motion-reduce:animate-none ${analyse ? '' : 'product-surface science-product-theme'}`}
      style={{ background: 'var(--sp-panel)', color: 'var(--sp-ink)', borderColor: 'var(--sp-line)', backgroundImage: 'none' }}
      onClick={event => event.stopPropagation()}
      onEscapeKeyDown={event => event.stopPropagation()}
      onCloseAutoFocus={event => { event.preventDefault(); if (opener.current?.isConnected) opener.current.focus({ preventScroll: true }); }}>
      <DialogTitle className="pr-6 leading-snug">{notice?.simulation ? 'Unavailable during simulation' : 'Could not check availability'}</DialogTitle>
      <DialogDescription className="text-base leading-relaxed" style={{ color: 'var(--sp-muted)' }}>
        {notice?.simulation
          ? 'Comments and plan reviews are unavailable while this Sapien is reserved for a simulation, including when paused. Simulation time can run faster than real time, so manual changes here could put work out of sync. You can still view goals and plans.'
          : 'No request was sent. Close this message and try again to check whether changes are available.'}
      </DialogDescription>
      <DialogClose asChild><button type="button" className="justify-self-end rounded-md px-4 py-2 text-sm font-semibold hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2"
        style={{ background: 'var(--sp-action)', color: 'var(--sp-on-action)', outlineColor: 'var(--sp-accent)' }}>Got it</button></DialogClose>
    </DialogContent>
  </Dialog>;
  return { checking, openIfAllowed, handleError, dialog };
}
