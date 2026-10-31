import { useEffect, useRef, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router';
import { ChevronRight } from 'lucide-react';
import { feedbackService } from '../../core/services/feedbackService';
import { FEEDBACK_STATES, type FeedbackResponse, type FeedbackReference, type FeedbackFinding } from '../../types/feedbackTypes';
import type { ApiError } from '../../types/apiTypes';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '../ui/dialog';
import { AnalyseControls } from './AnalyseControls';
import { useNavigationMemory } from '../navigation/NavigationState';
import { DiagnosticDisclosure } from './DiagnosticPrimitives';
import { FeedbackFindingDetail, FeedbackStateBadge } from './FeedbackFindingDetail';
import { feedbackDetailTitle } from './feedbackEvidence';
import { feedbackLabels, feedbackMode, feedbackOrigin, feedbackQuery, feedbackTime, updateFeedbackQuery } from './feedbackPresentation';
import { hasSelectedRecordText, openRecordFromRow } from './recordRowInteraction';
import '../../../styles/analyse-feedback.css';
import '../../../styles/analyse-records.css';

/** Key the result as well as the effect: never paint a stale page during a filter/Sapien change. */
function useFeedbackRead(sapienId: string, query: ReturnType<typeof feedbackQuery>) {
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState<{ key: string; data?: FeedbackResponse; error?: ApiError }>();
  const key = JSON.stringify([sapienId, query.states, query.limit, query.offset, revision]);
  useEffect(() => {
    let active = true;
    feedbackService.list(sapienId, query.states, query.limit, query.offset).then(data => {
      if (String(data.sapien_id) !== sapienId) throw new Error('The returned findings belong to a different Sapien. Retry this read.');
      if (active) setResult({ key, data });
    }).catch((caught: unknown) => {
      const error = caught as ApiError | null;
      if (active) setResult({ key, error: { message: error?.message || 'Could not load feedback findings.', status: error?.status } });
    });
    return () => { active = false; };
    // The key includes every request input; opening/closing a finding does not refetch the list.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const current = result?.key === key ? result : undefined;
  return { data: current?.data, error: current?.error, loading: !current, refresh: () => setRevision(value => value + 1) };
}

function ReferenceSummary({ reference }: { reference: FeedbackReference }) {
  const origin = feedbackOrigin(reference);
  return <span className="feedback-origin"><span>{origin.primary}</span>{origin.secondary && <small>{origin.secondary}</small>}</span>;
}

export function FeedbackTable({ findings, selectedId, onSelect }: {
  findings: FeedbackFinding[]; selectedId: string | null; onSelect: (id: string, opener: HTMLButtonElement) => void;
}) {
  return <div className="feedback-table-wrap" role="region" aria-label="Feedback findings table" tabIndex={0}><table className="feedback-table">
    <caption className="sr-only">Saved feedback findings. Open an interpretation to inspect its evidence.</caption>
    <colgroup><col className="feedback-meaning-col" /><col /><col /><col className="feedback-state-col" /><col className="feedback-date-col" /></colgroup>
    <thead><tr>{['Recorded interpretation', 'Earlier activity', 'Later experience', 'Finding state', 'Recorded at'].map(label => <th scope="col" key={label}>{label}</th>)}</tr></thead>
    <tbody>{findings.map(finding => <tr key={finding._id} className="analyse-record-row" data-selected={selectedId === finding._id} onClick={openRecordFromRow}>
      <td><button type="button" className="feedback-open analyse-record-open" data-record-open aria-haspopup="dialog" onClick={event => { if (event.detail === 0 || !hasSelectedRecordText(event.currentTarget)) onSelect(finding._id, event.currentTarget); }}>
        <span className="feedback-excerpt">{finding.meaning || 'No interpretation recorded'}</span><span className="analyse-record-cue">View details<ChevronRight size={16} aria-hidden="true" /></span>
      </button></td>
      <td><ReferenceSummary reference={finding.activity} /></td>
      <td><ReferenceSummary reference={finding.experience} /></td>
      <td><FeedbackStateBadge state={finding.state} /></td>
      <td className="feedback-recorded">{feedbackTime(finding.created_at)}</td>
    </tr>)}</tbody>
  </table></div>;
}

function FeedbackError({ error, retry }: { error: ApiError; retry: () => void }) {
  return <div role="alert" className="feedback-empty">
    <h3>{error.status === 503 ? 'Saved feedback temporarily unavailable' : error.status === 400 ? 'Invalid feedback filters' : 'Could not load feedback'}</h3>
    <p>{error.message}</p><button type="button" className="analyse-button" onClick={retry}>{error.status === 400 ? 'Clear filters and retry' : 'Retry'}</button>
  </div>;
}

function FeedbackProcessing({ processing }: { processing: NonNullable<FeedbackResponse['processing']> }) {
  return <DiagnosticDisclosure title="Background reviews and diagnostics">
    <p className="feedback-help">Feedback reviews new experiences in batches. A batch becomes eligible at the next hour on Sapiens’ internal clock. These counts cover review jobs across all saved runs. A completed review may produce no findings.</p>
    <dl className="feedback-processing-counts">{(['pending', 'running', 'completed', 'failed'] as const).map(status => <div key={status}><dt>{({ pending: 'Queued', running: 'Recorded as processing', completed: 'Completed', failed: 'Failed' })[status]}</dt><dd>{processing.counts?.[status] ?? 'Not recorded'}</dd></div>)}</dl>
    <DiagnosticDisclosure title="Recent review jobs">
      <p className="feedback-help">A follow-up review can include earlier inputs. Some older reviews with no findings were not saved.</p>
      {processing.recent_jobs?.length ? <ul className="feedback-review-jobs">{processing.recent_jobs.map(job => <li key={job.id}>
        <p>{job.status} · {job.reviewed_count} reviewed here / {job.experience_count} supplied · {job.retries} retries</p>
        <p>Eligible from: {feedbackTime(job.eligible_at)} (cognitive time; not a guaranteed start)</p>
        <p>{job.run_id ? 'Simulation ' + job.run_id : 'Normal runtime'}</p>
      </li>)}</ul> : <p className="feedback-help">No recent review job records were supplied.</p>}
    </DiagnosticDisclosure>
  </DiagnosticDisclosure>;
}

export function FeedbackInspection({ sapienId }: { sapienId: string }) {
  return <FeedbackView key={sapienId} sapienId={sapienId} />;
}

function FeedbackView({ sapienId }: { sapienId: string }) {
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const navigation = useNavigationMemory();
  const query = feedbackQuery(params, sapienId);
  const { states, limit, offset, selectedId } = query;
  const { data, error, loading, refresh } = useFeedbackRead(sapienId, query);
  const opener = useRef<HTMLButtonElement | null>(null);
  const tableHeading = useRef<HTMLHeadingElement>(null);
  const firstFilter = useRef<HTMLInputElement>(null);
  const update = (patch: Partial<typeof query>, replace = false) => setParams(current => {
    const next = updateFeedbackQuery(current, sapienId, patch);
    // The app restores scroll by the complete URL. Seed the next reader URL with
    // this list's position so opening/closing details cannot jump to the first row.
    if ('selectedId' in patch && !('states' in patch || 'limit' in patch || 'offset' in patch)) {
      const container = firstFilter.current?.closest<HTMLElement>('[data-nav-scroll]');
      if (container) {
        const key = `${sapienId}:${location.pathname}?${next}:${container.dataset.navScroll}`;
        navigation.scroll.set(key, container.scrollTop);
      }
    }
    return next;
  }, { replace, preventScrollReset: true });
  const selectedIndex = data?.findings.findIndex(finding => finding._id === selectedId) ?? -1;
  const selected = selectedIndex >= 0 ? data?.findings[selectedIndex] : undefined;
  const close = () => update({ selectedId: null }, true);
  const retry = () => { if (error?.status === 400) update({ states: [], offset: 0, selectedId: null }); refresh(); };

  return <div className="feedback-page">
    <div className="feedback-intro"><p>The Feedback engine reviews earlier actions and later events to look for possible lessons. Open a finding to see those events and what Sapiens concluded.</p><p className="feedback-help">{loading ? 'Loading saved feedback…' : feedbackMode(data?.mode)}</p></div>
    <AnalyseControls label="Page options" primary={<fieldset className="feedback-state-filter"><legend>Finding state <span>(all when none selected)</span></legend>
      <div>{FEEDBACK_STATES.map((state, index) => <label key={state}><input ref={index === 0 ? firstFilter : undefined} type="checkbox" name="feedbackState" value={state} checked={states.includes(state)} onChange={event => update({ states: event.target.checked ? [...states, state] : states.filter(item => item !== state), offset: 0, selectedId: null })} />{feedbackLabels[state]}</label>)}</div>
    </fieldset>} summary={(states.length ? states.map(state => feedbackLabels[state]).join(', ') : 'All finding states') + ' · ' + limit + ' per page'} onRefresh={refresh} busy={loading}>
      <label className="feedback-page-size">Findings per page<select name="feedbackLimit" value={limit} onChange={event => update({ limit: Number(event.target.value), offset: 0, selectedId: null })}>{[10, 25, 50, 100].map(value => <option key={value} value={value}>{value}</option>)}</select></label>
    </AnalyseControls>

    {loading && <p role="status" className="feedback-loading">Loading feedback findings…</p>}
    {error && <FeedbackError error={error} retry={retry} />}
    {data && <section aria-label="Returned feedback findings">
      <div className="feedback-table-heading"><h2 ref={tableHeading} tabIndex={-1}>Findings</h2><p role="status">{data.findings.length} on this page{data.total !== undefined ? ' · ' + data.total + ' matching' : ''} · Sapien {data.sapien_id}</p><span>Open an interpretation to see its evidence.</span></div>
      {data.findings.length ? <>
        <p className="feedback-scroll-hint">Scroll across the table for sources, state and time.</p>
        <FeedbackTable findings={data.findings} selectedId={selectedId} onSelect={(id, button) => { opener.current = button; update({ selectedId: id }); }} />
      </> : <div className="feedback-empty"><h3>{offset ? 'No findings on this page' : states.length ? 'No findings match these states' : 'No saved findings yet'}</h3>
        <p>{offset ? 'Return to the first page or refresh the saved findings.' : states.length ? 'Clear the state filters to see all returned findings.' : 'Findings appear after Feedback reviews earlier actions alongside later events. Use Refresh to check for new findings.'}</p>
        {(offset > 0 || states.length > 0) && <button type="button" className="analyse-button" onClick={() => update({ states: [], offset: 0, selectedId: null })}>{offset ? 'First page, all states' : 'Clear state filters'}</button>}
      </div>}
      {(offset > 0 || data.has_more || (data.total !== undefined && data.total > limit)) && <nav aria-label="Feedback pages" className="feedback-pagination">
        <button type="button" className="analyse-button" disabled={offset === 0} onClick={() => update({ offset: Math.max(0, offset - limit), selectedId: null })}>Previous page</button>
        <span>Page {Math.floor(offset / limit) + 1}</span>
        <button type="button" className="analyse-button" disabled={!data.has_more} onClick={() => update({ offset: offset + limit, selectedId: null })}>Next page</button>
      </nav>}
    </section>}
    {data?.processing?.available && <FeedbackProcessing processing={data.processing} />}

    <Dialog open={selectedId !== null} onOpenChange={open => { if (!open) close(); }}>
      <DialogContent className="feedback-dialog" onCloseAutoFocus={event => { event.preventDefault(); (opener.current?.isConnected ? opener.current : tableHeading.current || firstFilter.current)?.focus({ preventScroll: true }); }}>
        <header className="feedback-dialog-header"><div className="feedback-dialog-heading"><DialogTitle>{selected ? feedbackDetailTitle(selected) : 'Feedback finding'}</DialogTitle><DialogDescription>Sapien {sapienId} · Feedback finding</DialogDescription></div>
          <div className="feedback-reader-navigation"><button type="button" className="analyse-button" onClick={close}>Back to findings</button>
            {selected && data && <><span>{selectedIndex + 1} of {data.findings.length} on this page</span><button type="button" className="analyse-button" disabled={selectedIndex === 0} onClick={() => update({ selectedId: data.findings[selectedIndex - 1]._id }, true)}>Previous finding</button><button type="button" className="analyse-button" disabled={selectedIndex === data.findings.length - 1} onClick={() => update({ selectedId: data.findings[selectedIndex + 1]._id }, true)}>Next finding</button></>}
          </div>
        </header>
        <div className="feedback-dialog-body" key={selectedId}>
          {loading ? <p role="status">Loading saved finding…</p> : error ? <FeedbackError error={error} retry={retry} /> : selected ? <FeedbackFindingDetail finding={selected} mode={data?.mode} /> : <p role="status">This finding is not in the returned page. Return to the findings to select an available record.</p>}
        </div>
      </DialogContent>
    </Dialog>
  </div>;
}
