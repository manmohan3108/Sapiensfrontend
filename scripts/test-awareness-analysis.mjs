import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { transformWithEsbuild } from 'vite';
const moduleUrl = async (path, imports = {}) => {
  let source = await readFile(new URL(path, import.meta.url), 'utf8');
  for (const [specifier, url] of Object.entries(imports)) source = source.replaceAll(`'${specifier}'`, `'${url}'`);
  const { code } = await transformWithEsbuild(source, path, { loader: 'ts' });
  return 'data:text/javascript;base64,' + Buffer.from(code).toString('base64');
};
const trace = await moduleUrl('../src/app/components/workspace/awarenessTrace.ts');
const { runSteps, safeEvidence, eventEvidence, matchesRun, assessmentLabel } = await import(await moduleUrl('../src/app/components/analyse/awarenessPresentation.ts', { '../workspace/awarenessTrace': trace }));
const events = [
  { stage: 'controller', status: 'act', detail: { capability: 'teams.reply-to-channel-message' }, summary: 'Consider replying.' },
  { stage: 'guard', status: 'overreach', title: 'Reviewed the proposal', summary: 'Approval is missing.' },
  { stage: 'reconsider', status: 'revised', title: 'Reconsidered the proposal' },
  { stage: 'action', status: 'success', detail: { capability: 'teams.list-channel-message-replies' }, summary: 'Read the available replies.' },
  { stage: 'action', status: 'failed', detail: { capability: 'jira.get_issue' } },
  { stage: 'controller', status: 'speak', detail: { response: 'I will wait for confirmation.' } },
  { stage: 'controller', status: 'hold' },
  { stage: 'thought_commit', title: 'Saved understanding' },
];
const rows = runSteps({ events, run_flow: { steps: [{ event_index: 3, title: 'Action result', round: 2, summary: '' }], round_count: 2 } });
assert.equal(rows.length, events.length, 'Every stored event remains inspectable');
assert.deepEqual(rows.map(row => row.event), events, 'Do not reorder the evidence by inferred causality');
assert.equal(rows[0].kind, 'decision');
assert.equal(rows[0].status, 'Decision recorded');
assert.equal(rows[1].status, 'Proposal not approved');
assert.equal(rows[1].kind, 'review');
assert.equal(rows[3].title, 'Read Teams replies');
assert.equal(rows[3].status, 'Tool reported success');
assert.equal(rows[3].round, 2);
assert.equal(rows[4].status, 'Tool reported failure');
assert.equal(rows[5].title, 'Prepared a reply');
assert.equal(rows[5].status, 'Decision recorded', 'Prepared reply must not be labelled sent');
assert.equal(rows[6].title, 'Decided to wait');
assert.equal(rows[7].important, false, 'Retain storage bookkeeping in full trace');
assert.equal(runSteps({ events: [{ stage: 'controller', status: 'speak' }] })[0].title, 'Decided to prepare a reply', 'Do not invent a prepared reply without recorded reply text');
assert.equal(runSteps({ events: [{ stage: 'action', status: 'success', detail: { uncertain: true } }] })[0].status, 'Outcome uncertain');
const summaryOnly = runSteps({ events: [], run_flow: { steps: [{ event_index: 5, title: 'Proposed action', decision: 'act', round: 1, summary: 'Use a tool' }] } });
assert.equal(summaryOnly[0].kind, 'decision');
assert.equal(summaryOnly[0].event, undefined);
assert.deepEqual(runSteps({ final: { actions_used: 4 } }), [], 'Counters do not establish action records');
const record = { id: 'r', subject: { content: 'Delivery date?', source: 'teams' }, state: 'completed', understanding: 'Needs confirmation.' };
assert(matchesRun(record, ' Teams '));
assert(matchesRun(record, 'assessed as complete'));
assert(!matchesRun(record, 'not present'));
assert.equal(assessmentLabel('completed'), 'Assessed as complete');
assert.deepEqual(safeEvidence({ summary: 'safe', detail: { api_token: 'secret', args: { email: 'private' }, reason: 'safe', payload: 'secret' }, rows: [{ password: 'secret', status: 'ok' }] }), { summary: 'safe', detail: { reason: 'safe' }, rows: [{ status: 'ok' }] });
const evidence = eventEvidence({ stage: 'action', detail: { summary: 'Safe summary', unknown_field: 'hidden', reason: { nested: 'hidden' }, response: 'hidden', capability: 'teams.read' }, technical_details: { api_token: 'hidden', status: 'ok' } });
assert.deepEqual(evidence.detail, { summary: 'Safe summary', capability: 'teams.read' }, 'Keep the established event detail allowlist');
assert.deepEqual(evidence.technical_details, { status: 'ok' });
console.log('Awareness analysis checks passed: event preservation, proposals vs actions, reviews, replies, uncertainty, flow-only records, search and privacy filtering.');
