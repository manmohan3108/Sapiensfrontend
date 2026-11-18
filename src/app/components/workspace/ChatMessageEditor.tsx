import { useEffect, useId, useRef, useState } from 'react';
import type { ChatMessage } from '../../types/sapiensTypes';

export type EditChatMessage = (messageId: string, text: string, requestId: string) => Promise<void>;

/** Local drafts are separate from the immutable versions returned by chat history. */
export function ChatMessageEditor({ message, disabled, onSave }: {
  message: ChatMessage; disabled: boolean; onSave: EditChatMessage;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [baseId, setBaseId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const request = useRef<{ text: string; baseId: string; id: string } | null>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const inputId = useId();
  const restoreFocus = useRef(false);
  const buttonClass = 'min-h-10 rounded-md px-3 text-sm text-sp-muted hover:text-sp-ink focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50';
  useEffect(() => {
    if (editing && !saving) input.current?.focus();
    else if (!editing && !saving && !disabled && restoreFocus.current) {
      trigger.current?.focus();
      restoreFocus.current = false;
    }
  }, [editing, saving, disabled]);

  function close() {
    restoreFocus.current = true;
    setEditing(false);
    setError('');
  }

  async function save() {
    if (saving || disabled || !draft.trim()) return;
    const text = draft.trim();
    if (!request.current || request.current.text !== text || request.current.baseId !== baseId) {
      request.current = { text, baseId, id: crypto.randomUUID() };
    }
    setSaving(true); setError('');
    try {
      await onSave(baseId, text, request.current.id);
      close();
    } catch (failure) {
      input.current?.focus();
      setError((failure as { message?: string }).message || 'Could not save the edit. Check conversation history.');
    } finally {
      setSaving(false);
    }
  }

  return <div className="w-full min-w-0 space-y-2">
    {message.waitingForMessageId && <p role="status" className="text-sm text-sp-muted">Edit saved. Waiting for earlier work to finish or recover before continuing.</p>}
    {message.editable && <button ref={trigger} type="button" className={buttonClass}
      disabled={disabled || saving || editing} aria-expanded={editing}
      onClick={() => { setDraft(message.content); setBaseId(message.latestMessageId ?? message.id); setError(''); setEditing(true); }}>
      Edit message
    </button>}
    {editing && <div className="space-y-2 rounded-lg border border-sp-line bg-sp-panel p-3">
      <label htmlFor={inputId} className="block text-sm text-sp-ink">Edit your message</label>
      <textarea ref={input} id={inputId} name="message_edit" autoComplete="off" value={draft} disabled={saving} rows={4}
        aria-describedby={`${inputId}-help`} onChange={event => setDraft(event.target.value)}
        onKeyDown={event => { if (event.key === 'Escape' && !saving) { event.preventDefault(); close(); } }}
        className="w-full resize-y rounded-md border border-sp-line bg-[var(--sp-recessed)] p-3 text-base text-sp-ink focus-visible:outline-2 focus-visible:outline-offset-2" />
      <p id={`${inputId}-help`} className="text-sm text-sp-muted">The earlier version stays in history. Completed actions and replies are preserved.</p>
      {baseId !== (message.latestMessageId ?? message.id) && <p role="status" className="text-sm text-sp-muted">A newer edit is available. Cancel and reopen the editor to use it.</p>}
      <div className="flex flex-wrap gap-2">
        <button type="button" className={buttonClass} disabled={disabled || saving || !draft.trim() || baseId !== (message.latestMessageId ?? message.id)} onClick={() => void save()}>
          {saving ? 'Saving…' : 'Save edit'}
        </button>
        <button type="button" className={buttonClass} disabled={saving} onClick={close}>Cancel</button>
      </div>
      {error && <p role="alert" className="text-sm text-sp-danger">{error}</p>}
    </div>}
    {(message.revisions?.length ?? 0) > 1 && <details className="text-sm text-sp-muted">
      <summary className="min-h-10 cursor-pointer rounded-md py-2 focus-visible:outline-2 focus-visible:outline-offset-2">
        Edited · {message.revisions!.length} versions
      </summary>
      <p className="pb-2">Earlier replies may refer to an older version.</p>
      <ol className="space-y-3 border-l border-sp-line pl-3">
        {message.revisions!.map((version, index) => <li key={version.id}>
          <span>{index === 0 ? 'Original' : `Version ${index + 1}`}</span>
          {version.timestamp && <time dateTime={version.timestamp} className="ml-2">{new Date(version.timestamp).toLocaleString()}</time>}
          <p className="whitespace-pre-wrap break-words text-sp-ink">{version.content}</p>
        </li>)}
      </ol>
    </details>}
  </div>;
}
