import { Fragment, useMemo } from 'react';
import { splitTextLinks } from '../../utils/textLinks';

/** Inline plain-text renderer; the caller owns paragraph spacing and typography. */
export function LinkifiedText({ text, linkClassName = '' }: { text: string; linkClassName?: string }) {
  const parts = useMemo(() => splitTextLinks(text), [text]);
  return <>{parts.map((part, index) => part.href
    ? <a key={index} href={part.href} target="_blank" rel="noopener noreferrer"
      title="Open link in a new tab"
      className={`underline underline-offset-2 decoration-current [overflow-wrap:anywhere] rounded-sm hover:decoration-2 focus-visible:outline-2 focus-visible:outline-offset-2 ${linkClassName}`}>
      {part.text}<span className="sr-only"> (opens in a new tab)</span>
    </a>
    : <Fragment key={index}>{part.text}</Fragment>)}</>;
}
