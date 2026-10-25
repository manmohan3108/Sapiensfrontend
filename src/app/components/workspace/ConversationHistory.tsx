import { useMemo, useState } from 'react';
import { History, Loader2, Plus, RefreshCw, Search, X } from 'lucide-react';
import type { ChatHistoryItem } from '../../types/sapiensTypes';

export function ConversationHistory({ history, historyLoading, historyError, detailLoading, isProcessing, chatSessionId, onRefresh, onNewChat, onSelectChat, onCollapse }: {
  history: ChatHistoryItem[]; historyLoading: boolean; historyError: string | null; detailLoading: boolean;
  isProcessing: boolean; chatSessionId: string | null; onRefresh: () => void; onNewChat: () => void;
  onSelectChat: (threadId: string) => void; onCollapse: () => void;
}) {
  const [search, setSearch] = useState('');
  const groups = useMemo(() => {
    const result = new Map<string, ChatHistoryItem[]>();
    const needle = search.trim().toLocaleLowerCase();
    [...history].sort((a,b) => (Date.parse(b.updated_at) || 0) - (Date.parse(a.updated_at) || 0)).forEach(chat => {
      if (needle && !chat.title?.toLocaleLowerCase().includes(needle)) return;
      const date = new Date(chat.updated_at);
      const label = Number.isNaN(date.getTime()) ? 'Date unavailable' : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
      result.set(label, [...(result.get(label) ?? []), chat]);
    });
    return [...result];
  }, [history, search]);
  return <>
    <div className="workspace-history-heading"><strong>Conversations</strong><div>
      <button className="workspace-icon-button" onClick={onRefresh} disabled={historyLoading} aria-label="Refresh chat history"><RefreshCw size={15} className={historyLoading ? 'animate-spin' : ''} /></button>
      <button className="workspace-icon-button" onClick={onCollapse} aria-label="Close conversation history"><X size={16} /></button>
    </div></div>
    <div className="workspace-history-controls">
      <button className="workspace-primary" onClick={onNewChat} disabled={isProcessing || detailLoading}><Plus size={16} />New conversation</button>
      <label className="workspace-search"><Search size={15} /><input type="search" aria-label="Search loaded conversations" placeholder="Search conversations" value={search} onChange={e => setSearch(e.target.value)} /></label>
      {search && <p className="workspace-search-scope">Searching loaded conversation titles.</p>}
    </div>
    {historyError && <p role="alert" className="workspace-history-error">{historyError}</p>}
    <div className="workspace-history-list workspace-scrollbar">
      {historyLoading && !history.length ? <p className="workspace-history-empty"><Loader2 size={18} className="animate-spin" />Loading conversations…</p>
      : historyError && !history.length ? <div className="workspace-history-empty"><p>Conversation history is unavailable.</p><button onClick={onRefresh}>Retry history</button></div>
      : !history.length ? <div className="workspace-history-empty"><History size={23} /><p>No saved conversations yet.</p><p>Start by sending a message.</p></div>
      : !groups.length ? <div className="workspace-history-empty"><p>No matching titles.</p><button onClick={() => setSearch('')}>Clear search</button></div>
      : groups.map(([date, chats]) => <section key={date}><h3>{date}</h3>{chats.map(chat => <button key={chat.thread_id} className="workspace-history-row" aria-current={chatSessionId === chat.thread_id ? 'true' : undefined} title={chat.title} onClick={() => onSelectChat(chat.thread_id)} disabled={detailLoading || isProcessing}>
        <span>{chat.title || 'Untitled conversation'}</span><small>{chat.message_count} {chat.message_count === 1 ? 'message' : 'messages'}</small>
      </button>)}</section>)}
    </div>
  </>;
}
