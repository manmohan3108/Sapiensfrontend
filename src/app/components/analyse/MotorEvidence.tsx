import type { MotorDetail } from '../../core/services/motorService';
import { DiagnosticDisclosure, DiagnosticText } from './DiagnosticPrimitives';
import { toolEvidence } from './feedbackEvidence';
import { StoredValue } from './StoredValue';

function compactedResult(source: string | undefined): unknown {
  const suffix = '\n[result preview compacted; complete result remains in the outcome]';
  if (!source?.endsWith(suffix)) return undefined;
  // Only strip the known projector notice; never repair incomplete JSON.
  try { return JSON.parse(source.slice(0, -suffix.length)); } catch { return undefined; }
}

/** Reuse Feedback's verified activity-envelope parser; unknown formats stay intact. */
export function MotorEvidence({ item }: { item: MotorDetail }) {
  const evidence = item.evidence;
  const tool = toolEvidence({
    id: item.id, source: 'tool_activity', occurred_at: item.occurred_at,
    details: { available: true, content: evidence.content || '',
      metadata: { server: item.server, tool: item.tool, arguments: item.arguments },
      observed_at: item.observed_at, truncated: !!evidence.truncated },
  });
  // Prefer the dedicated arguments field. The envelope is a fallback for older records.
  const args = item.arguments ?? tool?.args;
  const compacted = compactedResult(tool?.resultSource);
  const result = tool?.result !== undefined ? tool.result : compacted !== undefined ? compacted : tool?.resultText;
  const hasResult = result !== undefined && result !== '';
  return <>
    <div className="motor-evidence-flow" aria-label="Tool request and recorded outcome">
      <section className="motor-evidence-step" aria-label="What Sapiens requested">
        <h3>What Sapiens requested</h3><StoredValue value={args} />
      </section>
      <span className="motor-evidence-arrow" aria-hidden="true">→</span>
      <section className="motor-evidence-step" aria-label="What the tool returned">
        <h3>{item.status === 'error' ? 'What the tool reported' : 'What the tool returned'}</h3>
        {hasResult ? <StoredValue value={result} /> : tool?.parsed
          ? <p className="motor-help">The result is empty or only partially available. Its retained text is preserved under Original record below.</p>
          : evidence.content ? <><p className="motor-help">This older record has no recognised request/result structure.</p><DiagnosticText text={evidence.content} limit={500} /></>
          : <p className="motor-help">No result text was retained.</p>}
      </section>
    </div>
    <p className="motor-help">These are saved inputs and observations, not a new tool call. Some content may have been shortened or redacted before it reached this page.</p>
    {(evidence.truncated || compacted !== undefined) && <p className="motor-help">Only part of the saved evidence is supplied in this preview.</p>}
    {item.communication != null && <DiagnosticDisclosure title="Recorded message delivery"><StoredValue value={item.communication} /></DiagnosticDisclosure>}
    <DiagnosticDisclosure title="Origin and references"><StoredValue value={{ activity_id: item.id, execution_id: item.execution_id, context: item.context, correlation_id: item.correlation_id, source_ref: item.source_ref }} /></DiagnosticDisclosure>
    <DiagnosticDisclosure title="Original record (technical)"><p className="motor-help">The exact redacted data supplied by the API. Missing provider data cannot be reconstructed here.</p><pre tabIndex={0}>{JSON.stringify(item, null, 2)}</pre></DiagnosticDisclosure>
  </>;
}
