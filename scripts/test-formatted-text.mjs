import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { transformWithEsbuild } from 'vite';

const path = '../src/app/components/shared/FormattedText.tsx';
const source = (await readFile(new URL(path, import.meta.url), 'utf8')).replace(/import '[^']+\.css';/g, '');
const compiled = await transformWithEsbuild(source, path, { loader: 'tsx', jsx: 'automatic' });
const code = compiled.code.replace(/from (["'])(react(?:\/jsx-runtime)?|react-markdown|remark-gfm)\1/g,
  (_, quote, name) => `from ${quote}${import.meta.resolve(name)}${quote}`);
const { FormattedText, safeMessageUrl } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
const render = text => renderToStaticMarkup(createElement(FormattedText, { text }));

assert.match(render('**bold** and *italic* and ~~removed~~'), /<strong>bold<\/strong>.*<em>italic<\/em>.*<del>removed<\/del>/);
assert.match(render('# Heading\n\n- first\n- second'), /<h1>Heading<\/h1>[\s\S]*<ul>[\s\S]*<li>second<\/li>/);
assert.match(render('1. First\n2. Second\n\n> quote'), /<ol>[\s\S]*<blockquote>/);
assert.match(render('- [x] Done\n- [ ] Waiting'), /aria-label="Completed task"/);
assert.match(render('| Name | Value |\n| --- | --- |\n| Item | 2 |'), /aria-label="Message table"[\s\S]*<table>/);
assert.match(render('line one\nline two'), /line one\nline two/);
assert.match(render('`**literal**`'), /<code>\*\*literal\*\*<\/code>/);
const codeBlock = render('```js\nconst url = "https://example.com";\n```');
assert.match(codeBlock, /<pre[^>]*>[\s\S]*<code/);
assert.doesNotMatch(codeBlock, /<a /);
for (const text of ['https://example.com', 'www.example.com', '[Example](https://example.com)']) {
  const html = render(text);
  assert.match(html, /<a href="https?:\/\/[^\"]+" target="_blank" rel="noopener noreferrer"/);
}
for (const url of ['javascript:alert(1)', 'data:text/html,test', 'file:///etc/passwd', '//example.com', 'https://user:password@example.com']) {
  assert.equal(safeMessageUrl(url), undefined);
  assert.doesNotMatch(render(`[unsafe](${url})`), /<a /);
}
assert.doesNotMatch(render('<script>alert(1)</script><img src="x" onerror="alert(1)">'), /<(script|img)\b/);
const image = render('![Diagram](https://example.com/image.png)');
assert.doesNotMatch(image, /<img\b/);
assert.match(image, /<a href="https:\/\/example.com\/image.png"/);
assert.doesNotThrow(() => render('**incomplete [link](https://example.com'));
assert.doesNotThrow(() => render(''));
console.log('Markdown checks passed: formatting, links, code, tables, tasks, incomplete text, and unsafe-content handling.');
