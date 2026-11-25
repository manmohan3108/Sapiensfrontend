import { useId, useState, type ReactNode } from 'react';
import { FormattedText } from '../shared/FormattedText';

export function DiagnosticText({ text, limit = 380, plain = false }: { text: string; limit?: number; plain?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const id = useId();
  const long = text.length > limit;
  const preview = text.slice(0, limit).replace(/\s+\S*$/, '');
  const visible = !long || expanded ? text : `${preview}…`;
  return <div className="diagnostic-text"><div id={id}>{plain ? <p>{visible}</p> : <FormattedText text={visible} />}</div>
    {long && <button type="button" className="diagnostic-link" aria-expanded={expanded} aria-controls={id} onClick={() => setExpanded(!expanded)}>{expanded ? 'Show less' : 'Show full text'}</button>}
  </div>;
}

export function DiagnosticBadge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'success' | 'warning' | 'danger' }) {
  return <span className="diagnostic-badge" data-tone={tone}>{children}</span>;
}

export function DiagnosticDisclosure({ title, children }: { title: ReactNode; children: ReactNode }) {
  return <details className="diagnostic-disclosure"><summary>{title}</summary><div className="diagnostic-disclosure-body">{children}</div></details>;
}
