import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { transformWithEsbuild } from 'vite';
import * as React from 'react';
import * as Icons from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';

// Production components and handlers, isolated fixtures based on Sapien 71's
// review cases. No server, credentials, production writes or API requests.
const h = {
  values: [], refs: [], effects: [], cursor: 0, refCursor: 0, params: new URLSearchParams(),
  reset(values = []) { this.values = values; this.refs = []; this.params = new URLSearchParams(); this.begin(); },
  begin() { this.cursor = 0; this.refCursor = 0; this.effects = []; },
  useState(initial) { const i = h.cursor++; if (!(i in h.values)) h.values[i] = typeof initial === 'function' ? initial() : initial; return [h.values[i], value => { h.values[i] = typeof value === 'function' ? value(h.values[i]) : value; }]; },
  useRef(initial) { return h.refs[h.refCursor++] ||= { current: initial }; },
};
const test = globalThis.awarenessTest = { React, Icons, h, service: {} };
const hooks = `const {useState,useRef}=globalThis.awarenessTest.h; const useId=()=>"awareness-test"; const useEffect=fn=>globalThis.awarenessTest.h.effects.push(fn);`;
const realHooks = 'const {useState,useRef,useId,useEffect}=React;';
const bindings = name => `const {${Object.keys(test[name]).join(',')}}=globalThis.awarenessTest.${name};`;
async function load(file, prelude = '', extra = '') {
  const source = await readFile(new URL('../src/app/' + file, import.meta.url), 'utf8');
  const { code } = await transformWithEsbuild(`const React=globalThis.awarenessTest.React;\n${prelude}\n${source.replace(/^import[\s\S]*?;\r?\n/gm, '')}\n${extra}`, file,
    { loader: 'tsx', jsx: 'transform', jsxFactory: 'React.createElement', jsxFragment: 'React.Fragment' });
  return import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'));
}
test.trace = await load('components/workspace/awarenessTrace.ts');
test.presentation = await load('components/analyse/awarenessPresentation.ts', bindings('trace'));
test.primitives = await load('components/analyse/DiagnosticPrimitives.tsx', realHooks);
const dependencies = bindings('trace') + bindings('presentation') + bindings('primitives') + 'const sapiensService=globalThis.awarenessTest.service;';
test.evidence = await load('components/analyse/AwarenessEvidence.tsx', realHooks + dependencies + 'const AwarenessTechnicalDetails=()=>null;');
test.activity = await load('components/analyse/AwarenessActivity.tsx', realHooks + dependencies + bindings('evidence'));
const readerDeps = dependencies + bindings('evidence') + bindings('activity');
test.reader = await load('components/analyse/AwarenessRunReader.tsx', realHooks + readerDeps);
const controlledReader = await load('components/analyse/AwarenessRunReader.tsx', hooks + readerDeps);
const { absoluteTime, actionTitle, stepView, sourceGroups, sameSubject, processingProblem, deliverySummary, deliveryAudits, reviewView, safeEvidence } = test.presentation;
const { AwarenessSummary, AwarenessRunContent } = test.reader;
const html = node => renderToStaticMarkup(node);
const all = node => Array.isArray(node) ? node.flatMap(all) : React.isValidElement(node) ? [node, ...React.Children.toArray(node.props.children).flatMap(all)] : [];
const find = (tree, predicate) => { const found = all(tree).find(predicate); assert(found, 'Expected control'); return found; };
const source = { availability: 'recorded', kind: 'message', source: 'user', provider: 'teams', sender: { name: 'Julia Morgan' }, recipient: { name: 'Rashi' }, origin_relation: 'event', event_at: '2026-11-10T09:07:47Z',
  content: 'I recorded the proposed SD-32 review slot. I will confirm it after allocation and delegation are recorded.', source_reference: { id: 'message-71', memory_source: 'conversation', container_id: 'chat-71' } };
const decision = { event_index: 0, kind: 'decision', decision: 'speak', title: 'Prepared a reply', round: 1, summary: 'A reply was prepared.', evidence: { kind: 'decision', status: 'speak', detail: { response: 'Understood. I will keep the slot unconfirmed.', reason: 'Allocation has not been recorded.' } } };
const action = { event_index: 1, kind: 'action', title: 'An external action finished', round: 1, summary: 'jira.jira_get_issue success.', evidence: { kind: 'action', status: 'success', detail: { capability: 'jira.jira_get_issue' } }, action_detail: { activity_id: 'activity-71', match_status: 'exact', server: 'jira', tool: 'jira_get_issue', arguments: { issue_key: 'SD-32' }, result: 'SD-32 remains Proposed. A status change is not approval.', is_error: false, observed_at: '2026-11-10T09:22:00Z' } };
const run = { id: '567a692a-a830-4873-8659-21891a4eea9f', mode: 'reactive', title: source.content.repeat(5), started_at: '2026-11-10T10:07:27Z', trigger: source, focus: source,
  processing_state: 'completed', assessment_state: 'waiting', understanding_preview: '', remaining_preview: '', actions: { recorded: 0, succeeded: 0, failed: 0, uncertain: 0, trace_truncated: false },
  delivery: { outward_expected: false, response_present: true, reply_satisfied_by_tool: false, confirmed_tool_messages: 0 }, thought_link: { status: 'unavailable', id: null } };
const data = { sapien_id: 71, inspection_mode: 'stored', run, trigger: source, focus: source,
  focus_selection: { status: 'selected', content: 'Check the proposed slot.', contributors: [source], provenance: 'recorded' },
  understanding: 'The slot is unconfirmed until allocation and delegation are recorded.', assessment: { state: 'waiting', reason: 'Confirmation is still pending.', remaining: 'Wait for allocation and delegation.' },
  activity: { steps: [decision], round_count: 1, ordering: 'recorded', truncated: false }, context: {}, technical: {},
  delivery: { recorded: { route: 'returned_to_caller' }, communication: { reply_route_ref: 'simulation:run-71:teams:chat:chat-71' } },
  source_records: [{ reference: source.source_reference, availability: 'available', content: source.content, content_truncated: false, metadata: { reply_delivery_status: 'confirmed' } }] };

assert.equal(actionTitle(action), 'Read Jira issue · SD-32');
assert.equal(stepView(action).status, 'Tool reported success');
assert.equal(stepView(decision).title, 'Prepared a reply');
assert(!stepView(decision).status.includes('success'));
assert.equal(stepView({ ...decision, evidence: { kind: 'decision', detail: {} } }).title, 'Decided to prepare a reply');
assert.equal(stepView({ ...action, action_detail: { ...action.action_detail, is_uncertain: true, is_error: true } }).status, 'Outcome uncertain');
assert.equal(stepView({ ...action, action_detail: { ...action.action_detail, is_error: true } }).status, 'Tool reported failure');
for (const match_status of ['ambiguous', 'unavailable']) assert(!actionTitle({ ...action, action_detail: { ...action.action_detail, match_status } }).includes('SD-32'), 'No arguments from an inexact match');
assert.equal(actionTitle({ ...action, action_detail: { ...action.action_detail, server: 'teams', tool: 'list-chat-messages', arguments: { chat_id: 'unknown-name' } } }), 'Read Teams messages', 'No person inferred from a chat ID');
assert(processingProblem('correction_failed')); assert(processingProblem('controller_unavailable')); assert(!processingProblem('completed'));
assert.equal(stepView({ ...decision, decision: null, evidence: { kind: 'scope_review', status: 'not_ready' } }).status, 'Proposal needs revision');
assert.equal(stepView({ ...decision, decision: null, evidence: { kind: 'scope_review', status: 'overreach' } }).tone, 'danger');
assert.equal(absoluteTime(null), 'Time unavailable'); assert.equal(absoluteTime('bad date'), 'Time unavailable');
assert.equal(reviewView('anything'), 'summary');
assert.deepEqual(safeEvidence({ summary: 'kept', detail: { api_token: 'secret', arguments: 'secret', reason: 'kept' } }), { summary: 'kept', detail: { reason: 'kept' } });
assert.equal(sourceGroups(data).length, 1, 'Identical identified source appears once with all roles');
assert.equal(sourceGroups(data)[0].roles.length, 3);
assert(sameSubject(source, { ...source, sender: { name: 'Julia Morgan' } }));
assert(!sameSubject(source, { ...source, content: 'A different snapshot.' }));
assert(!sameSubject(source, { ...source, source_reference: { ...source.source_reference, container_id: 'other-chat' } }));
assert(!sameSubject({ ...source, source_reference: null }, { ...source, source_reference: null }), 'Prose without identity is not deduplicated');
assert.equal(deliveryAudits(data)[0].status, 'confirmed');
assert.match(deliverySummary(data), /returned to the calling service/);
assert(!deliverySummary(data).includes('confirmed'), 'Later audit must not establish historical delivery');
assert.equal(deliveryAudits({ ...data, source_records: [{ ...data.source_records[0], availability: 'unavailable' }] }).length, 0);

let rendered = html(React.createElement(AwarenessRunContent, { data, view: 'summary', selectedStep: '', onView() {} }));
for (const text of ['What started this', 'Julia Morgan', 'What Sapiens understood', 'Prepared reply', 'Still needed', 'Latest linked-message delivery', 'confirmed', 'newer than the review', 'simulation']) assert(rendered.includes(text), text);
assert(!rendered.includes(run.title), 'Long focus must not fill the persistent header');
assert(!rendered.includes('Request sent to the tool'));
assert.equal((rendered.match(/I recorded the proposed SD-32 review slot/g) || []).length, 1);
assert(rendered.indexOf('What Sapiens understood') < rendered.indexOf('Response &amp; actions'));
let activityCalls = 0;
const summary = AwarenessSummary({ data, onActivity: () => activityCalls++ });
find(summary, n => n.type === 'button' && n.props.children.join?.('').includes('View all')).props.onClick();
assert.equal(activityCalls, 1);
const steps = Array.from({ length: 38 }, (_, index) => ({ ...action, event_index: index, round: Math.floor(index / 4) + 1 }));
const long = { ...data, run: { ...run, actions: { ...run.actions, recorded: 38, succeeded: 38 } }, activity: { ...data.activity, steps }, understanding: 'Retained understanding. '.repeat(80) };
rendered = html(React.createElement(AwarenessRunContent, { data: long, view: 'activity', selectedStep: '25', onView() {} }));
assert.equal((rendered.match(/aria-current="step"/g) || []).length, 1);
assert(rendered.includes('26<!-- --> of <!-- -->38') || rendered.includes('26 of 38'));
assert(rendered.includes('SD-32 remains Proposed'));
assert.equal((rendered.match(/Request sent to the tool/g) || []).length, 1, 'Only the selected step expands');
assert.equal((rendered.match(/<option /g) || []).length, 38, 'Every step available on mobile');
assert.deepEqual([...rendered.matchAll(/<option value="(\d+)"/g)].map(match => Number(match[1])), steps.map(step => step.event_index), 'Preserve saved step order');
for (const match_status of ['ambiguous', 'unavailable']) {
  const value = { ...data, activity: { ...data.activity, steps: [{ ...action, action_detail: { ...action.action_detail, match_status, result: 'DO NOT ATTACH THIS' } }] } };
  rendered = html(React.createElement(test.activity.AwarenessActivity, { data: value, selected: '', onSelect() {} }));
  assert(!rendered.includes('DO NOT ATTACH THIS')); assert(rendered.includes(match_status === 'ambiguous' ? 'Conflicting records' : 'unavailable'));
}
const controlledActivity = await load('components/analyse/AwarenessActivity.tsx', hooks + dependencies + bindings('evidence'));
let selectedStep = '1'; h.reset();
let activityTree = controlledActivity.AwarenessActivity({ data: long, selected: selectedStep, onSelect: value => { selectedStep = value; } });
find(activityTree, n => n.type === 'button' && n.props.children === 'Next step').props.onClick(); assert.equal(selectedStep, '2');
h.begin(); activityTree = controlledActivity.AwarenessActivity({ data: long, selected: '0', onSelect() {} });
assert(find(activityTree, n => n.type === 'button' && n.props.children === 'Previous step').props.disabled);
h.begin(); activityTree = controlledActivity.AwarenessActivity({ data: long, selected: '37', onSelect() {} });
assert(find(activityTree, n => n.type === 'button' && n.props.children === 'Next step').props.disabled);
h.begin(); activityTree = controlledActivity.AwarenessActivity({ data: long, selected: 'unknown', onSelect() {} });
assert(html(activityTree).includes('The linked step is unavailable'));
const noFocus = { ...data, run: { ...run, processing_state: 'no_focus' }, understanding: '', focus_selection: { ...data.focus_selection, status: 'no_focus', reason: '' }, activity: { ...data.activity, steps: [] } };
rendered = html(React.createElement(AwarenessSummary, { data: noFocus, onActivity() {} }));
assert(rendered.includes('Nothing was selected')); assert(!rendered.includes('Response &amp; actions')); assert(!rendered.includes('Sapiens’ assessment'));
assert(html(React.createElement(test.activity.AwarenessActivity, { data: noFocus, selected: '', onSelect() {} })).includes('No step-by-step activity'));
const correction = { ...long, run: { ...long.run, processing_state: 'correction_failed', assessment_state: 'unresolved' }, technical: { final: { reason: 'Same-beat correction limit reached: replace internal terminology.' } } };
rendered = html(React.createElement(AwarenessSummary, { data: correction, onActivity() {} }));
assert(rendered.includes('Correction incomplete')); assert(rendered.includes('Recorded review note')); assert(rendered.includes('Still needed'));
const unsafe = { ...action, action_detail: { ...action.action_detail, result: '<script>alert(1)</script>' } };
rendered = html(React.createElement(test.activity.AwarenessActivity, { data: { ...data, activity: { ...data.activity, steps: [unsafe] } }, selected: '', onSelect() {} }));
assert(!rendered.includes('<script>')); assert(rendered.includes('&lt;script&gt;'));
rendered = html(React.createElement(test.activity.AwarenessActivity, { data: { ...data, activity: { ...data.activity, steps: [{ ...action, action_detail: { ...action.action_detail, result: 'Saved result [shortened]' } }] } }, selected: '', onSelect() {} }));
assert(rendered.includes('The saved result was shortened'));
rendered = html(React.createElement(test.evidence.AwarenessEvidence, { data }));
for (const text of ['Started this review', 'Primary source for the focus', 'Helped shape the focus', 'Source identifiers', 'Reply and delivery information']) assert(rendered.includes(text));

const router = `const useSearchParams=()=>[globalThis.awarenessTest.h.params,value=>{globalThis.awarenessTest.h.params=value;}];
const Link=({to,children,...props})=>React.createElement('a',{href:to.search,...props},children);
const Dialog=({open,children})=>open?children:null,DialogContent=({children})=>children,DialogTitle=React.forwardRef(({children,...props},ref)=>React.createElement('h2',{...props,ref},children)),DialogDescription=({children})=>children;
const {ChevronRight,Loader2,RefreshCw,Search}=globalThis.awarenessTest.Icons;
const AwarenessRunReader=()=>null;`;
const browser = await load('components/analyse/AwarenessDiagnostics.tsx', hooks + dependencies + router, 'export {RunBrowser};');
const page = { sapien_id: 71, offset: 0, total: 189, items: [run, { ...run, id: 'c337406f-6763-4341-84fa-f53a9ea04424' }], filters: { search: '', trigger: '' }, trigger_categories: [{ value: 'teams', label: 'Teams' }, { value: 'jira', label: 'Jira' }], has_more: true, next_offset: 20 };
const renderBrowser = () => { h.begin(); return browser.RunBrowser({ sapienId: '71' }); };
h.reset(['', page, false, '', 0]); h.params = new URLSearchParams('awarenessFor=71&awarenessRun=' + run.id);
let tree = renderBrowser();
assert(html(tree).includes('View details')); assert.equal(all(tree).filter(n => n.type === 'table').length, 1);
assert(html(tree).includes('value="jira"'), 'A source with no rows on the current page remains in the full server catalogue');
find(tree, n => n.type === 'button' && n.props.children === 'Next').props.onClick();
assert.equal(h.params.get('awarenessRun'), page.items[1].id); assert(!h.params.has('awarenessView'));
tree = renderBrowser(); find(tree, n => n.type === 'button' && n.props.children === 'Back to reviews').props.onClick();
assert(!h.params.has('awarenessRun')); assert.equal(h.params.get('awarenessFor'), '71');
for (const [values, expected] of [
  [['', { ...page, items: [], total: 0 }, false, '', 0], 'No runs have been saved yet'],
  [['', null, true, '', 0], 'Loading runs'],
  [['', null, false, 'Could not load saved records.', 0], 'Retry list'],
]) {
  h.reset(values); rendered = html(renderBrowser()); assert(rendered.includes(expected));
}
h.reset(['missing', { ...page, filters: { search: 'missing', trigger: '' }, items: [], total: 0 }, false, '', 0]);
h.params = new URLSearchParams('awarenessFor=71&awarenessSearch=missing');
assert(html(renderBrowser()).includes('No saved runs match these filters'));
h.reset(['', page, false, '', 0]); h.params = new URLSearchParams('awarenessFor=71');
tree = renderBrowser(); find(tree, n => n.type === 'button' && n.props.children === 'Older').props.onClick();
assert.equal(h.params.get('awarenessOffset'), '20');
h.reset(['', page, false, '', 0]); h.params = new URLSearchParams('awarenessFor=71&awarenessRun=' + run.id + '&awarenessView=activity&awarenessStep=1&awarenessOffset=20&awarenessSearch=slot');
tree = renderBrowser(); find(tree, n => n.type === 'button' && n.props.children === 'Back to reviews').props.onClick();
assert.equal(h.params.get('awarenessOffset'), '20'); assert.equal(h.params.get('awarenessSearch'), 'slot'); assert(!h.params.has('awarenessView')); assert(!h.params.has('awarenessStep'));
h.reset(['', page, false, '', 0]); h.params = new URLSearchParams('awarenessFor=66&awarenessRun=' + run.id + '&awarenessView=activity&awarenessStep=25');
tree = renderBrowser(); const link = find(tree, n => n.props.className === 'awareness-table-link');
assert(!link.props.to.search.includes('awarenessView')); assert(!link.props.to.search.includes('awarenessStep')); assert(link.props.to.search.includes('awarenessFor=71'));
const linkElement = { isConnected: true, focus() {} };
link.props.onClick({ button: 0, ctrlKey: true, currentTarget: linkElement }); assert.equal(h.refs[0].current, null);
link.props.onClick({ button: 0, currentTarget: linkElement }); assert.equal(h.refs[0].current, linkElement);

// Real request effects against deferred stub promises: no cross-Sapien/run attachment.
const tick = () => new Promise(resolve => setImmediate(resolve));
const props = { sapienId: '71', runId: run.id, revision: 0, view: 'summary', selectedStep: '', onView() {} };
let settle, requestSignal;
test.service.getAwarenessRun = (_sapien, _run, signal) => { requestSignal = signal; return new Promise(resolve => { settle = resolve; }); };
h.reset(); controlledReader.AwarenessRunReader(props); let cleanup = h.effects[0]();
cleanup(); settle(data); await tick(); assert(requestSignal.aborted); assert.equal(h.values[0], null);
h.reset(); controlledReader.AwarenessRunReader(props); cleanup = h.effects[0]();
settle({ ...data, sapien_id: 66 }); await tick(); assert.equal(h.values[0], null); assert(h.values[1]); cleanup();
h.reset(); controlledReader.AwarenessRunReader(props); cleanup = h.effects[0]();
settle({ ...data, run: { ...run, id: 'other-run' } }); await tick(); assert.equal(h.values[0], null); assert(h.values[1]); cleanup();
h.reset(); controlledReader.AwarenessRunReader(props); cleanup = h.effects[0]();
settle(data); await tick(); assert.equal(h.values[0], data); cleanup();
h.reset([null, 'Could not load saved records.', 0]); tree = controlledReader.AwarenessRunReader(props);
find(tree, n => n.type === 'button').props.onClick(); assert.equal(h.values[2], 1);
console.log('Awareness checks passed: Sapien 71 message, long tool sequence, no focus and incomplete correction; source identity, reply/delivery separation, exact actions, safe output, all-step access, table navigation, URL scope, loading/errors and stale-response cancellation. Render/handler checks only; no browser or localhost.');
