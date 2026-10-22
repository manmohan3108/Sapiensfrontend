import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { SapiensExperienceGraph } from './SapiensExperienceGraph';

export function ExperienceDialog({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    const frame = requestAnimationFrame(() => {
      dialog.querySelector('.experience-graph')?.dispatchEvent(new Event('experience-replay'));
    });
    return () => {
      cancelAnimationFrame(frame);
      dialog.close();
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus({ preventScroll: true });
    };
  }, []);
  return <dialog ref={ref} className="experience-dialog" aria-labelledby="experience-dialog-title" onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => {
    if (event.target !== event.currentTarget) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
  }}>
    <header className="experience-dialog-header"><div><span>INSIDE SAPIENS</span><h2 id="experience-dialog-title">How it works</h2></div><button autoFocus onClick={onClose} aria-label="Close flowchart"><X size={24}/></button></header>
    <div className="experience-dialog-content direction-flowchart"><SapiensExperienceGraph identityImage="/concepts/sapiens-amber.png" showControls={false}/></div>
  </dialog>;
}
