import { useId, useState } from 'react';
import type { AwarenessStory, AwarenessStoryReview } from '../../types/awarenessRunTypes';
import { DiagnosticBadge, DiagnosticDisclosure, DiagnosticText } from './DiagnosticPrimitives';
import { absoluteTime } from './awarenessPresentation';

function StoryText({ text, label = 'understanding' }: { text: string; label?: string }) {
  const [expanded, setExpanded] = useState(false);
  const id = useId();
  const long = text.length > 240 || text.includes('\n');
  return <div className="awareness-story-text">
    <p id={id} className={long && !expanded ? 'awareness-story-preview' : undefined}>{text}</p>
    {long && <button type="button" className="diagnostic-link" aria-expanded={expanded} aria-controls={id} aria-label={`${expanded ? 'Show less' : 'Read full understanding'}: ${label}`}
      onClick={() => setExpanded(value => !value)}>{expanded ? 'Show less' : 'Read full understanding'}</button>}
  </div>;
}

function Story({ story, historical = false }: { story?: AwarenessStory; historical?: boolean }) {
  if (!story || story.availability === 'not_recorded') return <p className="awareness-caption">
    {historical ? 'No perspective snapshot is available for this run.' : 'Current understanding is not included in this response.'}
  </p>;
  if (story.availability === 'ambiguous') return <p className="awareness-caption">
    This run links to conflicting records, so its understanding cannot be identified reliably.
  </p>;
  if (story.availability === 'unavailable') return <p className="awareness-caption">
    {historical ? 'The story was unavailable to this run.' : 'The saved understanding could not be read. Use Refresh to try again.'}
  </p>;
  if (story.availability === 'empty') return <p className="awareness-caption">
    {historical ? 'Both perspectives were empty when this run began.' : 'No perspective understanding has been saved yet.'}
  </p>;
  return <>
    {story.summary_record_id && <DiagnosticBadge>Summarized</DiagnosticBadge>}
    <dl className="awareness-story-perspectives">
      {(['overall_perspective', 'immediate_perspective'] as const).map(key => {
        const text = story[key] || '';
        return <div key={key}>
          <dt>{key === 'overall_perspective' ? 'Overall perspective' : 'Immediate perspective'}</dt>
          <dd>{text
            ? <StoryText key={`${story.reference}:${text}`} text={text}
                label={key === 'overall_perspective' ? 'overall perspective' : 'immediate perspective'}/>
            : <p className="awareness-caption">No understanding recorded here yet.</p>}</dd>
        </div>;
      })}
    </dl>
    {story.summary_record_id && <DiagnosticDisclosure title="Summary source">
      <p className="awareness-caption">This version was compressed from a retained proposal. Its record identifier is shown below.</p>
      <p className="awareness-story-reference">{story.summary_record_id}</p>
    </DiagnosticDisclosure>}
    {story.recorded_at && <p className="awareness-caption"><time dateTime={story.recorded_at}>
      {historical ? 'Version recorded' : 'Last updated'} {absoluteTime(story.recorded_at)}
    </time></p>}
  </>;
}

export function CurrentUnderstanding({ story, loading, failed }: { story?: AwarenessStory; loading: boolean; failed: boolean }) {
  const headingId = useId();
  return <section className="awareness-current-story" aria-labelledby={headingId} aria-busy={loading}>
    <h2 id={headingId}>Current understanding</h2>
    <p className="awareness-caption">How this Sapien currently understands its situation. This is its latest saved account.</p>
    {loading && !story ? <p role="status" className="awareness-caption">Loading understanding…</p>
      : failed && !story ? <p className="awareness-caption">Understanding could not be loaded. Retry the refresh below.</p>
      : <Story story={story}/>}
  </section>;
}

const updateLabels = {
  ambiguous: 'Conflicting thought links; no update has been attached to this run.',
  saved: 'Saved as a story revision.',
  pending: 'Waiting for the saved update to finish processing.',
  review_pending: 'The story changed before this update could be saved. The proposal is waiting for reconsideration.',
  reviewed: 'This conflicting proposal was reconsidered later. It was not saved as this exact revision.',
  failed: 'Saving this update failed. The proposal remains retained.',
  no_update_recorded: 'No accepted story update was recorded for this run. This alone does not establish why.',
  not_recorded: 'The update outcome was not recorded.',
  unavailable: 'The saved update status could not be read.',
} satisfies Record<AwarenessStoryReview['update']['status'], string>;

export function RunUnderstanding({ review }: { review?: AwarenessStoryReview }) {
  const update = review?.update;
  const proposal = update?.proposal;
  return <DiagnosticDisclosure title="Ongoing understanding in this run">
    <p className="awareness-caption">The account supplied to this run, separate from its task-level assessment and today’s latest story.</p>
    <h3 className="awareness-story-heading">Supplied to this run</h3>
    <Story story={review?.supplied} historical/>
    <h3 className="awareness-story-heading">Story update</h3>
    <p>{update ? updateLabels[update.status] || 'Update status is unavailable.' : 'No update details were recorded.'}</p>
    {update && <p className="awareness-caption">Save and reconsideration status reflects the records available when these details were loaded.</p>}
    {!!proposal?.edits?.length && <ol className="awareness-story-edits">{proposal.edits.map((edit, index) => <li key={index}>
      <h4>{edit.perspective === 'overall_perspective' ? 'Overall perspective · ' : edit.perspective === 'immediate_perspective' ? 'Immediate perspective · ' : ''}{!edit.old_text ? 'Added' : !edit.new_text ? 'Removed' : 'Updated'}</h4>
      {edit.old_text && <><p className="awareness-caption">Previous passage</p><DiagnosticText text={edit.old_text} plain/></>}
      {edit.new_text && <><p className="awareness-caption">Proposed passage</p><DiagnosticText text={edit.new_text} plain/></>}
      <p className="awareness-caption">Reason: {edit.reason}</p>
      {!!edit.evidence_refs?.length && <DiagnosticDisclosure title="Supporting evidence identifiers">
        <ul>{edit.evidence_refs.map(reference => <li key={reference} className="awareness-story-reference">{reference}</li>)}</ul>
      </DiagnosticDisclosure>}
    </li>)}</ol>}
    {proposal && <DiagnosticDisclosure title="Full proposed understanding">
      <Story story={{ availability: 'available', overall_perspective: proposal.overall_perspective,
        immediate_perspective: proposal.immediate_perspective }} historical/>
    </DiagnosticDisclosure>}
    {update?.saved_story && <><h3 className="awareness-story-heading">Saved version from this update</h3><Story story={update.saved_story} historical/></>}
    {review && <DiagnosticDisclosure title="Story identifiers and recorded update">
      <pre className="awareness-saved-value" tabIndex={0} aria-label="Recorded story details">{JSON.stringify(review, null, 2)}</pre>
    </DiagnosticDisclosure>}
  </DiagnosticDisclosure>;
}
