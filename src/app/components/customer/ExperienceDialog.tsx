import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { SapiensArchitecture } from './SapiensArchitecture';

export function ExperienceDialog({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus({ preventScroll: true });
    };
  }, []);
  return <dialog ref={ref} className="experience-dialog architecture-dialog" aria-labelledby="experience-dialog-title" onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => {
    if (event.target !== event.currentTarget) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
  }}>
    <header className="experience-dialog-header"><div><span>INSIDE SAPIENS</span><h2 id="experience-dialog-title">Full architecture</h2></div><button autoFocus onClick={onClose} aria-label="Close flowchart"><X size={24}/></button></header>
    <div className="architecture-dialog-content"><SapiensArchitecture/></div>
  </dialog>;
}
