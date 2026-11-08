import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, CircleHelp, RefreshCw } from 'lucide-react';
import { workspaceQuestionsService } from '../../core/services/workspaceQuestionsService';
import type { WorkspaceQuestion, WorkspaceQuestionDetail, WorkspaceQuestionPage } from '../../types/workspaceQuestionTypes';
import { RecordText, recordDate, useListReaderNavigation } from './ContextReader';

// The Workspace keys this reader by Sapien so selection and paging reset together.
export function OpenQuestionsPanel({ sapienId, active }: { sapienId: string; active: boolean }) {
  const [page, setPage] = useState<WorkspaceQuestionPage | null>(null);
  const [offset, setOffset] = useState(0);
  const [revision, setRevision] = useState(0);
  const [selected, setSelected] = useState<WorkspaceQuestion | null>(null);
  const [detail, setDetail] = useState<WorkspaceQuestionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState(false);
  const [detailError, setDetailError] = useState(false);
  const { container, list, remember } = useListReaderNavigation(selected?.id ?? null, Number(sapienId));

  useEffect(() => {
    if (!active) return;
    let current = true;
    setLoading(true); setError(false);
    workspaceQuestionsService.list(sapienId, offset).then(next => {
      if (current) setPage(next);
    }).catch(() => { if (current) setError(true); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [sapienId, active, offset, revision]);

  useEffect(() => {
    if (!active || !selected) return;
    let current = true;
    setDetail(null); setDetailLoading(true); setDetailError(false);
    workspaceQuestionsService.detail(sapienId, selected.id).then(next => {
      if (current) setDetail(next);
    }).catch(() => { if (current) setDetailError(true); })
      .finally(() => { if (current) setDetailLoading(false); });
    return () => { current = false; };
  }, [sapienId, active, selected?.id, revision]);

  const refresh = () => setRevision(value => value + 1);
  function changePage(next: number) {
    setPage(null); setError(false); setLoading(true); setOffset(next);
    if (list.current) list.current.scrollTop = 0;
  }
  const record = detail ?? selected;

  return <div ref={container} className="context-reader">
    <header className="context-reader-heading">
      <div><h2 data-reader-heading tabIndex={-1}>Open questions</h2><p>What your Sapien is trying to understand. These are reflections, not requests for you to answer.</p></div>
      <button type="button" className="workspace-icon-button" aria-label="Refresh questions"
        disabled={loading || detailLoading} onClick={refresh}><RefreshCw size={16} aria-hidden="true" /></button>
    </header>
    <div ref={list} className="context-reader-body" aria-busy={selected ? detailLoading : loading}>
      {selected && record ? <>
        <button type="button" data-reader-back className="context-back" onClick={() => { setSelected(null); setDetail(null); setDetailLoading(false); setDetailError(false); }}><ArrowLeft size={16} aria-hidden="true" />Back to questions</button>
        <div className="context-record-caption"><span>{record.simulation_run_id ? 'From a simulation' : 'Saved question'}</span><time>{recordDate(record.created_at)}</time></div>
        <section className="workspace-reading-section"><h3>Question</h3><RecordText text={record.question || 'Question text is unavailable.'} lines={8} /></section>
        {detail && detail.state !== 'open' && <p className="context-footnote">{detail.state === 'answered' ? 'This question is now recorded as answered.' : detail.state === 'stale' ? 'This question is no longer recorded as open.' : 'The saved status is unavailable.'}{detail.closed_at ? ' Updated ' + recordDate(detail.closed_at) : ''}</p>}
        {detailLoading && <p role="status" className="context-footnote">Loading context…</p>}
        {detailError && <p role="alert" className="context-notice">Couldn’t load this question’s context. It may no longer be available.<button type="button" onClick={refresh}>Retry</button></p>}
        {detail && <>
          <section className="workspace-reading-section"><h3>What this relates to</h3>
            {detail.explanation ? <><p className="context-footnote">Your Sapien’s recorded explanation</p><RecordText text={detail.explanation} lines={8} /></> :
              detail.original_input ? <RecordText text={detail.original_input} lines={8} /> :
                <p className="context-footnote">No explanation was saved with this question.</p>}
          </section>
          {detail.explanation && detail.original_input && <details className="workspace-reading-more"><summary>Original input</summary><RecordText text={detail.original_input} /></details>}
          {!!detail.supporting_context.length && <details className="workspace-reading-more"><summary>Supporting context</summary>
            {detail.supporting_context.map((text, index) => <div className="context-related" key={index}><RecordText text={text} /></div>)}
          </details>}
        </>}
      </> : <>
        {error && <p role="alert" className="context-notice">Couldn’t refresh questions.{page ? ' The previous page is still shown.' : ''}<button type="button" onClick={refresh}>Retry</button></p>}
        {loading && !page ? <p role="status" className="context-empty">Loading questions…</p> :
          !page?.items.length ? <div className="context-empty"><CircleHelp size={28} aria-hidden="true" /><h3>{error ? 'Questions unavailable' : 'No open questions in this view'}</h3><p>{error ? 'Try refreshing this view.' : 'Questions appear here when your Sapien records something it wants to understand.'}</p>{offset > 0 && <button type="button" onClick={() => changePage(0)}>Back to newest questions</button>}</div> :
            <>
              <p className="context-footnote">Showing {offset + 1}–{offset + page.items.length} of {page.total} questions saved as open, newest first. This includes remembered simulation experiences.</p>
              {page.items.map(question => <button type="button" key={question.id} data-record-id={question.id} className="context-list-row"
                onClick={() => { remember(question.id); setDetail(null); setDetailLoading(true); setDetailError(false); setSelected(question); }}>
                <div><span className="context-row-excerpt">{question.question || 'Question text unavailable'}</span><small>{question.simulation_run_id ? 'Simulation · ' : ''}{recordDate(question.created_at)}</small></div><ArrowRight size={16} aria-hidden="true" />
              </button>)}
            </>}
        {page && (offset > 0 || page.has_more) && <nav className="context-browser-tools" aria-label="Question pages">
          <button type="button" disabled={loading || offset === 0} onClick={() => changePage(Math.max(0, offset - page.limit))}>Previous</button>
          <button type="button" disabled={loading || !page.has_more} onClick={() => changePage(offset + page.limit)}>Next</button>
        </nav>}
      </>}
    </div>
  </div>;
}
