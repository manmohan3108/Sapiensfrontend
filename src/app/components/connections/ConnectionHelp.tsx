import { useId, useState, type ReactNode } from 'react';
import { Info } from 'lucide-react';

/** Inline disclosure keeps setup help inside the dialog's keyboard and reading order. */
export function ConnectionHelp({ label, children }: { label: string; children: ReactNode }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  return <div className="connection-help">
    <button type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}>
      <Info size={15} aria-hidden="true" /><span>{label}</span>
    </button>
    <div id={id} hidden={!open} className="connection-help-content">{children}</div>
  </div>;
}
