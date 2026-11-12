import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { transformWithEsbuild } from 'vite';

process.env.TZ = 'America/New_York';
const { code } = await transformWithEsbuild(await readFile(new URL('../src/app/utils/chatDates.ts', import.meta.url), 'utf8'), 'chatDates.ts', { loader: 'ts' });
const { chatDate, datedMessages } = await import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'));
const now = new Date('2026-11-02T00:10:00-05:00');
assert.equal(chatDate('2026-11-02T00:01:00-05:00', now).label, 'Today');
assert.equal(chatDate('2026-11-01T00:01:00-04:00', now).label, 'Yesterday', 'DST day exceeds 24 hours');
assert.equal(chatDate('2026-10-31T23:59:00-04:00', now).label, 'October 31, 2026');
assert.equal(chatDate('2027-01-01T00:00:00-05:00', now).label, 'January 1, 2027');
assert.equal(chatDate('invalid', now), null);
assert.equal(chatDate('2026-11-02T00:01:00-05:00', null).label, 'November 2, 2026', 'Unknown simulation clock must not use browser today');
const message = (id, timestamp, extra = {}) => ({ id, timestamp, role: 'user', content: 'Hello', ...extra });
const rows = datedMessages([
  message('1', '2026-11-01T12:00:00-05:00'),
  message('2', '2026-11-01T13:00:00-05:00'),
  message('3', '2026-11-02T00:01:00-05:00'),
], now, false);
assert.deepEqual(rows.map(row => row.separator?.label), ['Yesterday', undefined, 'Today']);
const pending = datedMessages([message('1', now.toISOString()), message('2', now.toISOString(), { recordedTimestamp: true })], null, true);
assert.equal(pending[0].showTime, false);
assert.equal(pending[0].separator, null);
assert.ok(pending[1].separator);
assert.equal(datedMessages([message('1', now.toISOString(), { isLoading: true })], now, false)[0].showTime, false);
await transformWithEsbuild(await readFile(new URL('../src/app/components/workspace/ChatWindow.tsx', import.meta.url), 'utf8'), 'ChatWindow.tsx', { loader: 'tsx' });
console.log('Chat date checks passed.');

const clockCode = await transformWithEsbuild(await readFile(new URL('../src/app/utils/workspaceChatClock.ts', import.meta.url), 'utf8'), 'workspaceChatClock.ts', { loader: 'ts' });
const { activeChatRun, projectChatClock, needsSimulationClock } = await import('data:text/javascript;base64,' + Buffer.from(clockCode.code).toString('base64'));
const run = { run_id: 'run-1', sapien_id: 10, status: 'running', paused: false, speed: 60, simulated_time: '2026-11-01T23:59:00-04:00', end_at: '2026-11-05T00:00:00Z' };
assert.equal(needsSimulationClock({ simulationEnabled: false }), false);
assert.equal(needsSimulationClock({ simulationEnabled: true }), true);
assert.equal(activeChatRun([run], '11'), null, 'Never use a different Sapien’s clock');
assert.equal(activeChatRun([run, { ...run, run_id: 'run-2' }], '10'), null);
assert.equal(activeChatRun([{ ...run, status: 'stopped' }], '10'), null);
assert.equal(activeChatRun([{ ...run, archived: true }], '10'), null);
assert.equal(activeChatRun([{ ...run, runtime_available: false }], '10'), null);
assert.equal(projectChatClock(run, 1000, 3000).getTime(), Date.parse(run.simulated_time) + 120000);
assert.equal(projectChatClock({ ...run, status: 'paused', paused: true }, 1000, 3000).getTime(), Date.parse(run.simulated_time));
assert.equal(projectChatClock(run, 1000, 47000), null, 'Stale snapshots use exact dates');
assert.equal(projectChatClock({ ...run, simulated_time: 'invalid' }, 1000, 3000), null);
assert.equal(projectChatClock({ ...run, end_at: run.simulated_time }, 1000, 3000).getTime(), Date.parse(run.simulated_time));
await transformWithEsbuild(await readFile(new URL('../src/app/hooks/useWorkspaceChatClock.ts', import.meta.url), 'utf8'), 'useWorkspaceChatClock.ts', { loader: 'ts' });
console.log('Workspace clock selection and projection checks passed.');
