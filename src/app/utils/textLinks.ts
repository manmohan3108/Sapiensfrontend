export type TextLinkPart = { text: string; href?: string };

/** Recognize web addresses in plain text without interpreting HTML or Markdown. */
export function splitTextLinks(text: string): TextLinkPart[] {
  const parts: TextLinkPart[] = [];
  const candidates = /\b(?:https?:\/\/|www\.)[^\s<>"'`]+/gi;
  let cursor = 0;
  for (const match of text.matchAll(candidates)) {
    const start = match.index!;
    // Do not turn a URL-shaped substring inside another identifier into a link.
    if (start > 0 && /[\w@/]/.test(text[start - 1])) continue;
    let label = match[0];
    let previous: string;
    do {
      previous = label;
      label = label.replace(/[.,!?;:…]+$/, '');
      for (const [open, close] of [['(', ')'], ['[', ']'], ['{', '}']]) {
        if (label.endsWith(close) && label.split(close).length > label.split(open).length) {
          label = label.slice(0, -1);
        }
      }
    } while (label !== previous);
    try {
      const url = new URL(/^www\./i.test(label) ? `https://${label}` : label);
      if (!['http:', 'https:'].includes(url.protocol) || !url.hostname || url.username || url.password) continue;
      if (cursor < start) parts.push({ text: text.slice(cursor, start) });
      parts.push({ text: label, href: url.href });
      cursor = start + label.length;
    } catch { /* Invalid addresses remain ordinary text. */ }
  }
  if (cursor < text.length) parts.push({ text: text.slice(cursor) });
  return parts;
}
