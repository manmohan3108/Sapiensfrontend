import type { MotorDetail, MotorResultPreview } from '../../core/services/motorService';
import { DiagnosticDisclosure } from './DiagnosticPrimitives';
import { toolEvidence } from './feedbackEvidence';
import { MotorResult } from './MotorResult';
import { StoredValue } from './StoredValue';

/** Compatibility for an older API; never repair an incomplete saved response. */
function legacyResult(item: MotorDetail, tool: ReturnType<typeof toolEvidence>): MotorResultPreview {
  const source = tool?.resultSource;
  const suffix = '\n[result preview compacted; complete result remains in the outcome]';
  let value = tool?.result;
  let compacted = false;
  if (value === undefined && source?.endsWith(suffix)) {
    try { value = JSON.parse(source.slice(0, -suffix.length)); compacted = true; } catch { /* Keep the retained text. */ }
  }
  if (value !== undefined) {

    return { kind: 'structured', value, shortened: !!item.evidence.truncated || compacted,
      entry_count: null };
  }
  return { kind: tool?.resultText || source === '' ? 'text' : source || item.evidence.content ? 'unparsed' : 'missing',
    value: tool?.resultText || (source ?? item.evidence.content ?? ''),
    shortened: !!item.evidence.truncated, entry_count: null };
}

export function MotorEvidence({ item }: { item: MotorDetail }) {
  const evidence = item.evidence;
  const tool = toolEvidence({
    id: item.id, source: 'tool_activity', occurred_at: item.occurred_at,
    details: { available: true, content: evidence.content || '',
      metadata: { server: item.server, tool: item.tool, arguments: item.arguments },
      observed_at: item.observed_at, truncated: !!evidence.truncated },
  });
  const args = item.arguments ?? tool?.args;
  return <>
    <div className="motor-evidence-flow" aria-label="Tool request and recorded outcome">
      <section className="motor-evidence-step" aria-label="What Sapiens requested">
        <h3>What Sapiens requested</h3><StoredValue value={args} />
      </section>
      <span className="motor-evidence-arrow" aria-hidden="true">→</span>
      <section className="motor-evidence-step" aria-label="What the tool returned">
        <h3>{item.status === 'error' ? 'What the tool reported' : 'What the tool returned'}</h3>
        <MotorResult result={item.result ?? legacyResult(item, tool)} status={item.status} />
      </section>
    </div>
    <p className="motor-help">These are saved inputs and observations, not a new tool call. Private information may have been redacted.</p>
    {item.communication != null && <DiagnosticDisclosure title="Recorded message delivery"><StoredValue value={item.communication} /></DiagnosticDisclosure>}
    <DiagnosticDisclosure title="Origin and references"><StoredValue value={{ activity_id: item.id, execution_id: item.execution_id, context: item.context, correlation_id: item.correlation_id, source_ref: item.source_ref }} /></DiagnosticDisclosure>
    <DiagnosticDisclosure title="API record (technical)"><p className="motor-help">The redacted preview supplied by the API; it may not contain the complete original result.</p><pre tabIndex={0}>{JSON.stringify(item, null, 2)}</pre></DiagnosticDisclosure>
  </>;
}
