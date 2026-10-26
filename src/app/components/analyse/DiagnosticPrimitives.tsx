import { useId, useState, type ReactNode } from 'react';

export function DiagnosticText({ text, limit = 380 }: { text: string; limit?: number }) {
  const [expanded, setExpanded] = useState(false);
  const id = useId();
  const long = text.length > limit;
  const preview = text.slice(0, limit).replace(/\s+\S*$/, '');
  return <div className="diagnostic-text"><p id={id}>{!long || expanded ? text : `${preview}…`}</p>
    {long && <button type="button" className="diagnostic-link" aria-expanded={expanded} aria-controls={id} onClick={() => setExpanded(!expanded)}>{expanded ? 'Show less' : 'Show full text'}</button>}
  </div>;
}

export function DiagnosticBadge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'success' | 'warning' | 'danger' }) {
  return <span className="diagnostic-badge" data-tone={tone}>{children}</span>;
}

export function DiagnosticDisclosure({ title, children }: { title: ReactNode; children: ReactNode }) {
  return <details className="diagnostic-disclosure"><summary>{title}</summary><div className="diagnostic-disclosure-body">{children}</div></details>;
}
