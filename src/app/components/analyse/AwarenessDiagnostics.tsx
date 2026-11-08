import { useEffect, useId, useRef, useState, type MouseEvent } from 'react';
import { Link, useSearchParams } from 'react-router';
import { ChevronRight, Loader2, RefreshCw, Search } from 'lucide-react';
import { sapiensService } from '../../core/services/sapiensService';
import type { AwarenessRunsResponse } from '../../types/awarenessRunTypes';
import { DiagnosticBadge, DiagnosticDisclosure } from './DiagnosticPrimitives';
import { AwarenessRunReader } from './AwarenessRunReader';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '../ui/dialog';
import { absoluteTime, assessmentLabel, inspectionError, processingLabel, processingProblem, reviewView, subjectLabel } from './awarenessPresentation';
import '../../../styles/awareness-reader.css';

function RunBrowser({ sapienId }: { sapienId: string }) {
  const [params, setParams] = useSearchParams();
  const scoped = params.get('awarenessFor') === sapienId;
  const parsedOffset = scoped ? Number(params.get('awarenessOffset') || 0) : 0;
  const offset = Number.isSafeInteger(parsedOffset) && parsedOffset >= 0 && parsedOffset <= 2147483647 ? parsedOffset : 0;
  const requestedId = scoped ? params.get('awarenessRun') || '' : '';
  const search = scoped ? params.get('awarenessSearch') || '' : '';
  const trigger = scoped ? params.get('awarenessTrigger') || '' : '';
  const [draftSearch, setDraftSearch] = useState(search);
  useEffect(() => setDraftSearch(search), [search]);
  const validRunId = !requestedId || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(requestedId);
  const [loaded, setLoaded] = useState<AwarenessRunsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const opener = useRef<HTMLAnchorElement | null>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const detailHeading = useRef<HTMLHeadingElement>(null);
  const listId = useId();
  const data = loaded?.sapien_id === Number(sapienId) && loaded.offset === offset
    && (loaded.filters?.trigger || '') === trigger && (loaded.filters?.search || '') === search.trim() ? loaded : null;
  const categories = loaded?.trigger_categories ?? [];
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setLoading(true); setError('');
    void sapiensService.getAwarenessRuns(sapienId, offset, controller.signal, { trigger, search }).then(result => {
      if (active) setLoaded(result);
    }).catch(caught => { if (active) setError(inspectionError(caught)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; controller.abort(); };
  }, [sapienId, offset, trigger, search, revision]);
  const rows = data?.items ?? [];
  const selectedId = requestedId;
  const selectedIndex = rows.findIndex(row => row.id === selectedId);
  const selectedView = reviewView(scoped ? params.get('awarenessView') : null);
  const selectedStep = scoped ? params.get('awarenessStep') || '' : '';
  const query = (values: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    if (!scoped) for (const key of ['awarenessRun', 'awarenessOffset', 'awarenessSearch', 'awarenessTrigger', 'awarenessView', 'awarenessStep']) next.delete(key);
    next.set('awarenessFor', sapienId);
    for (const [key, value] of Object.entries(values)) value === null ? next.delete(key) : next.set(key, value);
    if ('awarenessRun' in values && values.awarenessRun !== selectedId) {
      next.delete('awarenessView'); next.delete('awarenessStep');
    }
    return next;
  };
  const page = (nextOffset: number) => setParams(query({ awarenessOffset: String(nextOffset), awarenessRun: null }));
  const refresh = () => {
    setParams(query({ awarenessOffset: '0', awarenessRun: selectedId || null }), { replace: true });
    setRevision(value => value + 1);
  };
  const choose = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.button || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
    opener.current = event.currentTarget;
  };
  const close = () => setParams(query({ awarenessRun: null }), { replace: true });
  const adjacent = (index: number) => {
    if (rows[index]) setParams(query({ awarenessRun: rows[index].id }), { replace: true });
  };
  return <div className="awareness-reader">
    <header className="awareness-intro"><div><h2>Saved runs</h2><p>Open a run to inspect its trigger, decisions, actions and outcome.</p></div>
      <button type="button" className="analyse-button" onClick={refresh} disabled={loading}>{loading ? <Loader2 size={16} className="animate-spin" aria-hidden="true"/> : <RefreshCw size={16} aria-hidden="true"/>}Refresh</button>
    </header>
    {!scoped && params.has('awarenessFor') && <p role="status" className="awareness-caption">The linked selection belongs to another Sapien. Showing records for the currently selected Sapien.</p>}
    {error && <div role="alert" className="awareness-error">{data ? 'Refresh failed; showing the last loaded page. ' : ''}{error} <button type="button" className="diagnostic-link" disabled={loading} onClick={() => setRevision(value => value + 1)}>Retry list</button></div>}
    <section className="awareness-runs" aria-label="Saved runs">
      <div className="awareness-table-toolbar">
          <form role="search" onSubmit={event => { event.preventDefault(); setParams(query({ awarenessSearch: draftSearch.trim() || null, awarenessOffset: '0', awarenessRun: null })); }}>
            <label className="awareness-filter" htmlFor={listId + '-search'}>Search saved run text</label>
            <div className="awareness-search"><input ref={searchInput} id={listId + '-search'} name="awarenessSearch" type="search" autoComplete="off"
              maxLength={160} value={draftSearch} onChange={event => setDraftSearch(event.target.value)} placeholder="E.g. onboarding…"/>
              <button type="submit" aria-label="Search saved runs" disabled={loading}><Search size={18} aria-hidden="true"/></button>
            </div>
          </form>
          <label className="awareness-filter">Triggered by
            <select name="awarenessTrigger" value={trigger} disabled={!categories.length}
              onChange={event => setParams(query({ awarenessTrigger: event.target.value || null, awarenessOffset: '0', awarenessRun: null }))}>
              <option value="">All sources</option>
              {trigger && !categories.some(item => item.value === trigger) && <option value={trigger}>Selected source ({trigger})</option>}
              {categories.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </label>
          {(search || trigger) && <button type="button" className="diagnostic-link" onClick={() => {
            setDraftSearch(''); setParams(query({ awarenessSearch: null, awarenessTrigger: null, awarenessOffset: '0', awarenessRun: null }));
          }}>Clear filters</button>}
      </div>
      {loaded && !categories.length && <p className="awareness-caption">Trigger filters require the backend filtering update.</p>}
      <div className="awareness-table-heading"><h3>Saved reviews <span>{data ? data.total.toLocaleString() + (search || trigger ? ' matches' : ' total') : ''}</span></h3>
        <p className="awareness-caption" role="status">{loading ? 'Loading runs…' : 'Newest first · Select a row to inspect'}</p>
      </div>
      <p className="awareness-caption">Processing shows whether the review finished. Work status is Sapiens’ assessment of the situation.</p>
      <div className="awareness-table-wrap" aria-busy={loading}>
        <table className="awareness-table" role="table">
          <caption className="sr-only">Saved Awareness runs, newest first. Open a situation to inspect its source, decisions and actions.</caption>
          <colgroup><col className="awareness-situation-col"/><col className="awareness-trigger-col"/><col/><col/><col className="awareness-actions-col"/><col className="awareness-time-col"/></colgroup>
          <thead role="rowgroup"><tr role="row">
            <th scope="col" role="columnheader">Situation / focus</th><th scope="col" role="columnheader">Triggered by</th>
            <th scope="col" role="columnheader">Processing</th><th scope="col" role="columnheader">Work status</th>
            <th scope="col" role="columnheader">Tool actions</th><th scope="col" role="columnheader" aria-sort="descending">Started</th>
          </tr></thead>
          <tbody role="rowgroup">{rows.map(item => {
            const category = categories.find(value => value.value === item.trigger_category)?.label;
            const noFocus = item.processing_state === 'no_focus' || item.focus_selection?.status === 'no_focus';
            const preview = noFocus ? item.focus_selection?.reason || '' : '';
            const title = item.title === 'internal event' ? 'Recorded run' : item.title || 'Recorded run';
            return <tr key={item.id} role="row" data-selected={selectedId === item.id}>
              <td role="cell" className="awareness-situation-cell">
                <Link className="awareness-table-link" to={{ search: '?' + query({ awarenessRun: item.id }) }}
                  aria-haspopup="dialog" aria-current={selectedId === item.id ? 'true' : undefined} onClick={choose}>
                  <span><span className="awareness-run-excerpt">{title}</span><span className="awareness-view-cue">View details <ChevronRight size={14} aria-hidden="true"/></span></span>
                </Link>
                {preview && preview !== title && <p className="awareness-caption awareness-run-preview">{preview}</p>}
              </td>
              <td role="cell" data-label="Triggered by"><span>{category || subjectLabel(item.trigger)}</span>
                {category && item.trigger.origin_relation !== 'related_subject' && item.trigger.sender?.name && <small>{item.trigger.sender.name}</small>}
              </td>
              <td role="cell" data-label="Processing">{processingProblem(item.processing_state)
                ? <DiagnosticBadge tone={item.quota ? "warning" : "danger"}>{item.quota ? "Call limit reached" : processingLabel(item.processing_state)}</DiagnosticBadge>
                : <span className="awareness-processing-state">{item.processing_state === 'completed' || noFocus ? 'Finished' : processingLabel(item.processing_state)}</span>}</td>
              <td role="cell" data-label="Work status"><DiagnosticBadge tone={item.assessment_state === 'blocked' ? 'danger' : ['waiting', 'unresolved'].includes(item.assessment_state) ? 'warning' : 'neutral'}>
                {assessmentLabel(item.assessment_state)}
              </DiagnosticBadge></td>
              <td role="cell" data-label="Tool actions"><span>{item.actions.recorded.toLocaleString()} recorded</span>
                {!!item.actions.uncertain && <small>{item.actions.uncertain.toLocaleString()} uncertain</small>}
                {item.actions.trace_truncated && <small>Partial trace</small>}
              </td>
              <td role="cell" data-label="Started"><time dateTime={item.started_at || undefined}>{absoluteTime(item.started_at)}</time></td>
            </tr>;
          })}</tbody>
        </table>
      </div>
      {!loading && data && !rows.length && <p role="status" className="awareness-caption">{offset ? 'No records remain on this page. Return to the latest runs.'
        : search || trigger ? 'No saved runs match these filters. Try another search or clear the filters.'
        : 'No runs have been saved yet. Refresh after Sapien processes information.'}</p>}
      <div className="awareness-pagination">
        <button type="button" className="analyse-button" disabled={loading || offset === 0} onClick={() => page(Math.max(0, offset - 20))}>Newer</button>
        <button type="button" className="analyse-button" disabled={loading || !data?.has_more || data.next_offset == null} onClick={() => data?.next_offset != null && page(data.next_offset)}>Older</button>
      </div>
      <p className="awareness-caption" aria-live="polite">{data && rows.length ? 'Showing ' + (offset + 1) + '–' + (offset + rows.length) + ' of ' + data.total.toLocaleString() + (search || trigger ? ' matching runs.' : ' saved runs.') : ''}</p>
      <DiagnosticDisclosure title="Search and filter scope"><p>Filters cover all saved runs for this Sapien. Search matches literal text in retained sources, focus, decisions and assessments—not full prompts, linked memories or complete tool responses. Older or shortened records may contain less searchable text.</p>
        <p>Triggered by uses the initiating source, not the focus selected later. A self-directed check can therefore select a message as its focus. No focus chosen is a separate result, not a source.</p></DiagnosticDisclosure>
      <DiagnosticDisclosure title="About these records"><p>Saved runs, not a live queue. Times use your timezone; simulation dates can be ahead of today. Refresh returns to the latest page with your filters. New runs can shift page boundaries.</p></DiagnosticDisclosure>
    </section>
    <Dialog open={!!selectedId} onOpenChange={open => { if (!open) close(); }}>
      <DialogContent className="awareness-reader awareness-detail-dialog" onOpenAutoFocus={event => { event.preventDefault(); detailHeading.current?.focus(); }}
        onCloseAutoFocus={event => { event.preventDefault(); if (opener.current?.isConnected) opener.current.focus(); else searchInput.current?.focus(); }}>
        <div className="awareness-dialog-top">
          <DialogTitle ref={detailHeading} tabIndex={-1} className="awareness-selected-heading">Awareness review <span>Sapien {sapienId}</span></DialogTitle>
          <DialogDescription className="sr-only">Inspect a saved review. Summary, Activity, and Sources and details are available below. No Sapien actions are triggered here.</DialogDescription>
          <div className="awareness-review-navigation"><button type="button" className="diagnostic-link" onClick={close}>Back to reviews</button>
            <div><span className="awareness-caption" role="status">{selectedIndex >= 0 ? `${selectedIndex + 1} of ${rows.length} on this page` : 'Outside this result page'}</span>
              <button type="button" className="analyse-button" disabled={loading || selectedIndex <= 0} onClick={() => adjacent(selectedIndex - 1)}>Previous</button>
              <button type="button" className="analyse-button" disabled={loading || selectedIndex < 0 || selectedIndex === rows.length - 1} onClick={() => adjacent(selectedIndex + 1)}>Next</button></div>
          </div>
        </div>
        {!validRunId ? <p role="alert" className="awareness-error">The run ID in this link is invalid. Select a saved run.</p>
          : selectedId && <AwarenessRunReader key={sapienId + ':' + selectedId + ':' + revision} sapienId={sapienId} runId={selectedId} revision={revision}
            view={selectedView} selectedStep={selectedStep} onView={(view, step) => setParams(query({ awarenessView: view === 'summary' ? null : view, ...(step !== undefined ? { awarenessStep: step } : {}) }), { replace: true })}/>}
      </DialogContent>
    </Dialog>
  </div>;
}

export function AwarenessDiagnostics({ sapienId }: { sapienId: string }) {
  // Remount all page/detail state on an identity change, including failed requests.
  return <RunBrowser key={sapienId} sapienId={sapienId}/>;
}
