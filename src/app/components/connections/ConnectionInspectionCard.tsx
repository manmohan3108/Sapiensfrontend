import { useRef, useState, type ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '../ui/dialog';

/** Compact entry point; inspection never starts a connection action. */
export function ConnectionInspectionCard({ title, subtitle, summary, status, footer, busy = false, children }: {
  title: string; subtitle: string; summary?: string; status?: ReactNode; footer?: string;
  busy?: boolean; children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  return <Dialog open={open} onOpenChange={next => { if (!busy) setOpen(next); }}>
    <DialogTrigger asChild>
      <button ref={trigger} type="button" className="connection-inspection-card" disabled={busy}>
        <span className="connection-card-heading"><span className="connection-card-title">{title}</span>{status}</span>
        <span className="connection-card-subtitle">{subtitle}</span>
        {summary && <span className="connection-card-summary">{summary}</span>}
        <span className="connection-card-footer"><span>{footer}</span><span>View details <ArrowRight size={16} aria-hidden="true" /></span></span>
      </button>
    </DialogTrigger>
    <DialogContent className="product-surface science-product-theme connections-dialog connections-review connection-inspection-dialog product-dialog border-sp-line text-sp-ink"
      onOpenAutoFocus={event => { event.preventDefault(); heading.current?.focus(); }}
      onCloseAutoFocus={event => {
        if (!trigger.current?.isConnected) {
          event.preventDefault();
          document.getElementById('connections-heading')?.focus({ preventScroll: true });
        }
      }}
      onInteractOutside={event => event.preventDefault()}
      onEscapeKeyDown={event => { if (busy) event.preventDefault(); }}>
      <div className="connection-inspection-heading">
        <DialogTitle ref={heading} tabIndex={-1}>{title}</DialogTitle>
        <DialogDescription className="text-sp-muted">{subtitle}</DialogDescription>
        {status}
      </div>
      <div className="connection-inspection-body">{children}</div>
    </DialogContent>
  </Dialog>;
}
