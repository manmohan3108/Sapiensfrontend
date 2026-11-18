import type { MotorResultPreview, MotorStatus } from '../../core/services/motorService';
import { DiagnosticDisclosure, DiagnosticText } from './DiagnosticPrimitives';
import { StoredValue } from './StoredValue';

function isOmissionMarker(value: unknown): boolean {
  if (value === '[truncated]' || value === '[nested content omitted]') return true;
  return !!value && typeof value === 'object' && !Array.isArray(value)
    && Object.keys(value).length === 1 && '_omitted_items' in value;
}

function resultLink(value: unknown, allowed: string[]): { url: string; title: string; excerpt: string } | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const row = value as Record<string, unknown>;
  if (typeof row.url !== 'string' || !allowed.includes(row.url) || /\[(?:truncated|text truncated|redacted|nested content omitted)/i.test(row.url)) return undefined;
  try {
    const url = new URL(row.url);
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) return undefined;
    return { url: url.href, title: typeof row.title === 'string' && row.title ? row.title : url.href,
      excerpt: [row.content, row.snippet, row.text].find((text): text is string => typeof text === 'string') || '' };
  } catch { return undefined; }
}

function entryCaption(shown: number, total: number | null): string {
  if (total === 0 && shown === 0) return 'The saved result contains no entries.';
  return total === null
    ? `${shown.toLocaleString()} entries in this preview; the saved total is unavailable.`
    : `${shown.toLocaleString()} of ${total.toLocaleString()} saved entries included in this preview.`;
}

/** Interpret the saved response shape, independently of provider or tool name. */
export function MotorResult({ result, status }: { result: MotorResultPreview; status: MotorStatus }) {
  const value = result.value;
  const object = value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
  const collection = Array.isArray(value) ? value : Array.isArray(object?.results) ? object.results : undefined;
  const entries = collection?.filter(entry => !isOmissionMarker(entry));
  const omitted = !!collection && entries?.length !== collection.length;
  const allowed = result.link_urls ?? [];
  const hasLinks = entries?.some(entry => !!resultLink(entry, allowed));
  // Keep collection markers in the technical record, not among numbered results.
  const displayValue = entries ? Array.isArray(value) ? entries : { ...object, results: entries } : value;
  const outcome = status === 'error' ? 'The tool reported a failure.'
    : status === 'uncertain' ? 'The tool’s execution outcome is uncertain.'
    : status === 'success' ? 'The tool reported success; this does not establish task completion.'
    : 'The execution outcome was not recorded.';
  return <>
    <p className="motor-help">{outcome}</p>
    {(result.shortened || omitted) && <p className="motor-result-notice">Shortened preview. Some saved details are not shown here.</p>}
    {result.kind === 'missing' ? <p className="motor-help">No retained result was supplied.</p>
      : result.kind === 'unparsed' ? <>
        <p className="motor-help">The saved preview is incomplete or has an unrecognized format. This does not mean the tool returned no results.</p>
        <DiagnosticDisclosure title="Retained result text"><StoredValue value={value} /></DiagnosticDisclosure>
      </> : <>
        {entries && <p className="motor-help">{entryCaption(entries.length, result.entry_count)}</p>}
        {hasLinks && entries ? <>
          <ol className="motor-result-links">{entries.map((entry, index) => {
            const link = resultLink(entry, allowed);
            return <li key={index}>{link ? <>
              <a href={link.url} target="_blank" rel="noopener noreferrer" aria-label={`${link.title} (opens in a new tab)`}>{link.title}</a>
              <span className="motor-result-url">{link.url}</span>
              {link.excerpt && <DiagnosticText text={link.excerpt} limit={240} />}
            </> : <StoredValue value={entry} />}</li>;
          })}</ol>
          <DiagnosticDisclosure title="All supplied result fields"><pre tabIndex={0}>{JSON.stringify(value, null, 2)}</pre></DiagnosticDisclosure>
        </> : <StoredValue value={displayValue} />}
        {entries?.some(entry => entry && typeof entry === 'object' && 'url' in entry && !resultLink(entry, allowed)) &&
          <p className="motor-help">Addresses that could not be verified as unchanged are shown as text.</p>}
      </>}
  </>;
}
