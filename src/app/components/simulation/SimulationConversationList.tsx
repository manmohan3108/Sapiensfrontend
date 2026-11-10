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
  return <div className="min-h-0 flex-1 overflow-y-auto p-3">
    <p className="px-2 pb-2 text-xs text-white/65" role="status">{loading ? 'Updating conversations…' : error ? 'Latest message order unavailable. Refresh to retry.' : `${rows.length} conversations · latest message first`}</p>
    <ul className="space-y-1" aria-label="Conversations">
      {rows.map(row => <li key={row.key}>
        <button type="button" aria-current={selected === row.key ? 'true' : undefined} onClick={() => onSelect(row.key)} className={`flex min-h-16 w-full items-start gap-3 rounded-md px-3 py-3 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${selected === row.key ? 'bg-white/15 text-white' : 'text-white/80 hover:bg-white/10'}`}>
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-white/10 text-sm font-semibold" aria-hidden="true">{row.kind === 'channels' ? <Hash className="size-5" /> : row.name.slice(0, 2).toUpperCase()}</span>
          <span className="min-w-0 flex-1">
            <strong className="block truncate text-sm font-semibold">{row.name}</strong>
            <span className="block text-xs text-white/65">{row.kind === 'channels' ? 'Channel' : 'Direct'} · {row.count == null ? 'Count unavailable' : `${row.count} messages`}</span>
            {row.latest && <><span className="mt-1 block truncate text-sm text-white/80">{row.latest.text || 'Message body was not recorded.'}</span>{Number.isFinite(Date.parse(row.latest.at)) && <time dateTime={row.latest.at} className="mt-1 block text-xs tabular-nums text-white/65">{date.format(new Date(row.latest.at))} IST</time>}</>}
          </span>
        </button>
      </li>)}
    </ul>
    {!loading && !rows.length && <p className="px-3 py-4 text-sm text-white/70">{query ? 'No matching conversations. Try another name or clear the search.' : 'No conversations in this view.'}</p>}
  </div>;
}
