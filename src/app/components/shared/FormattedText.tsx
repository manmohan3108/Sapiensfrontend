import { memo } from 'react';
import Markdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import '../../../styles/formatted-text.css';

/** Only explicit web URLs can navigate; HTML and embedded remote images never execute/load. */
export function safeMessageUrl(value: string): string | undefined {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password
      ? url.href : undefined;
  } catch { return undefined; }
}

const components: Components = {
  a: ({ href, children }) => href
    ? <a href={href} target="_blank" rel="noopener noreferrer" title="Open link in a new tab">{children}<span className="sr-only"> (opens in a new tab)</span></a>
    : <span>{children}</span>,
  img: ({ src, alt }) => src
    ? <a href={src} target="_blank" rel="noopener noreferrer">{alt || 'View image'}<span className="sr-only"> (opens in a new tab)</span></a>
    : <span>{alt || 'Image'}</span>,
  pre: ({ children }) => <pre tabIndex={0} aria-label="Code block">{children}</pre>,
  table: ({ children }) => <div className="formatted-text-table" role="region" aria-label="Message table" tabIndex={0}><table>{children}</table></div>,
  input: ({ checked }) => <input type="checkbox" disabled checked={Boolean(checked)} aria-label={checked ? 'Completed task' : 'Incomplete task'} />,
};
const plugins = [remarkGfm];

/** Shared display only: callers retain the original message for copying, editing and storage. */
export const FormattedText = memo(function FormattedText({ text, className = '' }: { text: string; className?: string }) {
  return <div className={`formatted-text ${className}`}>
    <Markdown remarkPlugins={plugins} components={components} urlTransform={safeMessageUrl}>{text}</Markdown>
  </div>;
});
