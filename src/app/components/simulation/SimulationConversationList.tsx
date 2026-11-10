import { Hash } from 'lucide-react';
import { conversationList, type ConversationFilter, type MessageIndex } from './conversationList';
import type { WorldChannel, WorldEmployee } from '../../types/simulationTypes';

const date = new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

export function SimulationConversationList({ people, channels, index, filter, search, selected, loading, error, onSelect }: {
  people: WorldEmployee[]; channels: WorldChannel[]; index: MessageIndex; filter: ConversationFilter;
  search: string; selected: string; loading: boolean; error: string; onSelect: (key: string) => void;
}) {
  const query = search.trim().toLocaleLowerCase();
  const rows = conversationList(people, channels, index).filter(row => (filter === 'all' || row.kind === filter)
    && (!query || row.name.toLocaleLowerCase().includes(query) || row.id.toLocaleLowerCase().includes(query)));
  return <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-3">
    <p className="simulation-messages-muted px-2 pb-2 text-xs" role="status">{loading ? 'Updating conversations…' : error ? 'Latest message order unavailable. Refresh to retry.' : `${rows.length} conversations · latest message first`}</p>
    <ul className="min-w-0 space-y-1" aria-label="Conversations">
      {rows.map(row => <li key={row.key} className="min-w-0">
        <button type="button" aria-current={selected === row.key ? 'true' : undefined} onClick={() => onSelect(row.key)} className="simulation-conversation-row flex min-h-16 w-full min-w-0 items-start gap-3 rounded-md px-3 py-3 text-left transition-colors">
          <span className={`simulation-conversation-avatar ${row.kind === 'channels' ? 'is-channel rounded-lg' : 'rounded-full'} grid size-9 shrink-0 place-items-center text-sm font-semibold`} aria-hidden="true">{row.kind === 'channels' ? <Hash className="size-5" /> : row.name.slice(0, 2).toUpperCase()}</span>
          <span className="min-w-0 flex-1">
            <span className="flex min-w-0 items-baseline gap-2">
              <strong className="min-w-0 flex-1 truncate text-sm font-semibold">{row.name}</strong>
              <span className="sr-only">{row.kind === 'channels' ? 'Channel' : 'Direct conversation'}</span>
              {row.count != null && <span className="simulation-messages-muted shrink-0 text-xs tabular-nums" title="Total recorded messages">{row.count} <span>{row.count === 1 ? 'message' : 'messages'}</span></span>}
            </span>
            {row.latest && <><span className="mt-1 block truncate text-sm">{row.latest.text || 'Message body was not recorded.'}</span>{Number.isFinite(Date.parse(row.latest.at)) && <time dateTime={row.latest.at} className="simulation-messages-muted mt-1 block text-xs tabular-nums">{date.format(new Date(row.latest.at))} IST</time>}</>}
          </span>
        </button>
      </li>)}
    </ul>
    {!loading && !rows.length && <p className="simulation-messages-muted px-3 py-4 text-sm">{query ? 'No matching conversations. Try another name or clear the search.' : 'No conversations in this view.'}</p>}
  </div>;
}
