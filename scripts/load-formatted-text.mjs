import { readFile } from 'node:fs/promises';
import { transformWithEsbuild } from 'vite';

// Load the production Markdown renderer in Node without importing browser CSS.
const path = '../src/app/components/shared/FormattedText.tsx';
const source = (await readFile(new URL(path, import.meta.url), 'utf8')).replace(/import '[^']+\.css';/g, '');
const compiled = await transformWithEsbuild(source, path, { loader: 'tsx', jsx: 'automatic' });
const code = compiled.code.replace(/from (["'])(react(?:\/jsx-runtime)?|react-markdown|remark-gfm)\1/g,
  (_, quote, name) => `from ${quote}${import.meta.resolve(name)}${quote}`);
export const { FormattedText, safeMessageUrl } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
