import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { transformWithEsbuild } from 'vite';

const source = await readFile(new URL('../src/app/components/workspace/awarenessTrace.ts', import.meta.url), 'utf8');
const { code } = await transformWithEsbuild(source, 'awarenessTrace.ts', { loader: 'ts' });
const { matchedTrace, traceContext, traceActivity, activityView } = await import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'));
const beat = { sapien_id: 58, events: [] };
const response = { sapien_id: 58, thought_id: 'thought-a', match_status: 'exact', current_beat: beat };
assert.equal(matchedTrace(response, '58', 'thought-a'), beat);
for (const change of [{ thought_id: 'other' }, { match_status: 'ambiguous' }, { match_status: undefined }, { sapien_id: 59 }, { current_beat: { sapien_id: 59 } }, { current_beat: null }]) {
  assert.equal(matchedTrace({ ...response, ...change }, '58', 'thought-a'), null, 'No unrelated or ambiguous trace may be attached');
}
assert.deepEqual(traceContext({ candidate_summary: { candidates: [{ content: 'Unselected information' }] } }), []);
assert.deepEqual(traceContext({ curation: { selected_context: [{ content: 'Retained memory', source: 'working_memory' }] } }), [{ content: 'Retained memory', source: 'working_memory' }]);
const decision = { stage: 'controller', status: 'act', detail: { capability: 'teams.reply-to-channel-message' } };
assert.equal(activityView(decision).action, false, 'A proposed tool use is not a completed action');
const action = { stage: 'action', status: 'success', detail: { capability: 'teams.reply-to-channel-message' } };
assert.equal(activityView(action).status, 'Tool reported success');
assert.equal(activityView({ ...action, detail: { ...action.detail, uncertain: true } }).status, 'Outcome uncertain');
assert.equal(activityView({ ...action, status: 'failed' }).status, 'Tool reported failure');
assert.equal(activityView({ stage: 'controller', status: 'speak' }).title, 'Prepared a reply');
assert.equal(activityView({ stage: 'controller', status: 'hold' }).title, 'Decided to wait');
const wait = { stage: 'controller', status: 'hold' };
const activity = traceActivity({ events: [decision, action, wait], events_truncated: true });
assert.deepEqual(activity.actions, [action]);
assert.equal(activity.lastDecision, wait);
assert.deepEqual(activity.other, [decision]);
assert.equal(activity.incomplete, true);
assert.deepEqual(traceActivity({ final: { actions_used: 3 }, events: [] }).actions, [], 'Do not invent missing action events from a counter');
console.log('Awareness reader checks passed: exact identity matching, selected context, decisions versus actions, uncertain outcomes and incomplete traces.');
