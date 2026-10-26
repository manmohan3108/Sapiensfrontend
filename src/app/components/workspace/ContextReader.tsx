import { useEffect, useLayoutEffect, useRef, useState } from 'react';

/** Restore the originating row and scroll position after an unmounted list returns. */
export function useListReaderNavigation(selection: string | null, scope: number) {
  const container = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const previous = useRef(selection);
  const saved = useRef<{ id: string; top: number; scope: number } | null>(null);
  const remember = (id: string) => { saved.current = { id, top: list.current?.scrollTop ?? 0, scope }; };

  useLayoutEffect(() => {
    if (previous.current === selection) return;
    previous.current = selection;
    if (selection) {
      container.current?.querySelector<HTMLElement>('[data-reader-back]')?.focus();
      return;
    }
    const bookmark = saved.current?.scope === scope ? saved.current : null;
    const row = bookmark && Array.from(list.current?.querySelectorAll<HTMLElement>('[data-record-id]') ?? [])
      .find(element => element.dataset.recordId === bookmark.id);
    (row || container.current?.querySelector<HTMLElement>('[data-reader-heading]'))?.focus({ preventScroll: true });
    if (bookmark && list.current) list.current.scrollTop = bookmark.top;
    saved.current = null;
  }, [selection, scope]);

  return { container, list, remember };
}

/** Keep keyboard readers in the panel when a list is replaced by a detail view. */
export function useReaderNavigation(selection: unknown) {
  const container = useRef<HTMLDivElement>(null);
  const previous = useRef(selection);
  useEffect(() => {
    if (previous.current === selection) return;
    previous.current = selection;
    container.current?.querySelector<HTMLElement>(selection ? '[data-reader-back]' : '[data-reader-heading]')?.focus();
  }, [selection]);
  return container;
}

export function sourceName(value?: string) {
  const names: Record<string, string> = {
    awareness_thought: 'Recorded understanding', user: 'User input', chat: 'Conversation',
    jira: 'Jira', teams: 'Teams', working_memory: 'Working memory',
    memory: 'Memory', engine: 'Engine', stream: 'Activity',
  };
  return value ? names[value.toLowerCase()] ?? value.replace(/[_-]+/g, ' ') : 'Source not supplied';
}

export function recordDate(value?: string | null) {
  if (!value) return 'Time not supplied';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Time not supplied' : date.toLocaleString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

/** Exposes the original text. Clipping is visual, never a generated interpretation. */
export function RecordText({ text, lines = 4 }: { text: string; lines?: number }) {
  const [open, setOpen] = useState(false);
  const lengthy = text.length > 200;
  return <div className="context-record-text">
    <p className={!open && lengthy ? 'is-excerpt' : ''} style={{ WebkitLineClamp: lines }}>{text}</p>
    {lengthy && <button onClick={() => setOpen(value => !value)} aria-expanded={open}>{open ? 'Show less' : 'Read full text'}</button>}
  </div>;
}
