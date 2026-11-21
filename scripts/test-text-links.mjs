import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { transformWithEsbuild } from 'vite';

const source = await readFile(new URL('../src/app/utils/textLinks.ts', import.meta.url), 'utf8');
const { code } = await transformWithEsbuild(source, 'textLinks.ts', { loader: 'ts' });
const { splitTextLinks } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
const links = text => splitTextLinks(text).filter(part => part.href);

assert.deepEqual(links('See https://example.com/docs?q=one&x=2#top.'), [
  { text: 'https://example.com/docs?q=one&x=2#top', href: 'https://example.com/docs?q=one&x=2#top' },
]);
assert.equal(links('www.example.com')[0].href, 'https://www.example.com/');
assert.equal(links('(https://example.com/a_(b)).')[0].text, 'https://example.com/a_(b)');
assert.equal(links('[https://example.com/docs];')[0].text, 'https://example.com/docs');
assert.equal(links('http://localhost:8000/api')[0].href, 'http://localhost:8000/api');
assert.equal(links('https://example.com\nhttp://example.org').length, 2);
for (const text of ['', 'No link here', 'javascript:alert(1)', 'data:text/html,test', 'https://', 'https://user:password@example.com', 'name@www.example.com', 'abchttps://example.com']) {
  assert.equal(links(text).length, 0, text);
}
for (const text of ['Hello\nhttps://example.com.\nNext', '<script>alert(1)</script>', 'See (https://example.com/a_(b)).', 'www.example.com and https://example.org!']) {
  assert.equal(splitTextLinks(text).map(part => part.text).join(''), text, 'Original text must be preserved');
}
console.log('Text link parsing checks passed.');
