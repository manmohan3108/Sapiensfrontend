import type { MouseEvent } from 'react';

export function hasSelectedRecordText(element: HTMLElement): boolean {
  const selection = element.ownerDocument.defaultView?.getSelection();
  return !!selection && !selection.isCollapsed
    && (element.contains(selection.anchorNode) || element.contains(selection.focusNode));
}

/** The native button remains the keyboard target. Row clicks are an extra pointer affordance. */
export function openRecordFromRow(event: MouseEvent<HTMLTableRowElement>) {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey
    || hasSelectedRecordText(event.currentTarget)) return;
  const target = event.target as Element;
  if (target.closest('a,button,input,select,textarea,label,summary,[role="button"],[role="link"],[contenteditable="true"]')) return;
  event.currentTarget.querySelector<HTMLButtonElement>('button[data-record-open]')?.click();
}
