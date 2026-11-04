import { useState } from 'react';
import { DiagnosticText } from './DiagnosticPrimitives';
import { feedbackDocumentText } from './feedbackEvidence';

const label = (key: string) => key.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ').replace(/^./, character => character.toUpperCase());

/** Present saved values without inventing meaning or requiring tool-specific schemas. */
export function StoredValue({ value, depth = 0 }: { value: unknown; depth?: number }) {
  const [expanded, setExpanded] = useState(false);
  const [limit, setLimit] = useState(3);
  if (value === undefined) return <span className="stored-value-empty">Not recorded</span>;
  if (value === null) return <span className="stored-value-empty">No value (null)</span>;
  if (typeof value === 'string') return value ? <DiagnosticText text={value} limit={500} /> : <span className="stored-value-empty">Empty text</span>;
  if (typeof value === 'boolean') return <span>{value ? 'Yes' : 'No'}</span>;
  if (typeof value === 'number') return <span>{String(value)}</span>;
  if (typeof value !== 'object') return <span>Unsupported saved value</span>;
  if (depth >= 5 && !expanded) return <button className="diagnostic-link" type="button" onClick={() => setExpanded(true)}>Show nested fields</button>;
  const nextDepth = depth >= 5 ? 0 : depth + 1;
  if (Array.isArray(value)) {
    if (!value.length) return <span className="stored-value-empty">No entries</span>;
    return <div className="stored-value-list">
      <p className="stored-value-caption">{value.length} {value.length === 1 ? 'entry' : 'entries'} retained</p>
      <ol>{value.slice(0, limit).map((entry, index) => <li key={index}><StoredValue value={entry} depth={nextDepth} /></li>)}</ol>
      {limit < value.length && <button type="button" className="diagnostic-link" onClick={() => setLimit(current => current + 20)}>Show more entries ({value.length - limit} remaining)</button>}
      {limit > 3 && <button type="button" className="diagnostic-link" onClick={() => setLimit(3)}>Show fewer entries</button>}
    </div>;
  }
  const entries = Object.entries(value);
  if (!entries.length) return <span className="stored-value-empty">No fields</span>;
  const document = feedbackDocumentText(value);
  if (document && !expanded) return <div><DiagnosticText text={document} limit={500} /><button className="diagnostic-link" type="button" onClick={() => setExpanded(true)}>Show document fields</button></div>;
  return <dl className="stored-value-fields">{entries.map(([key, entry]) => <div key={key}>
    <dt title={key}>{label(key)}</dt><dd><StoredValue value={entry} depth={nextDepth} /></dd>
  </div>)}</dl>;
}
