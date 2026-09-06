import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { promisify } from 'node:util';
import { execFile } from 'node:child_process';
const run = promisify(execFile);
const root = new URL('../', import.meta.url);
const files = ['index.html', 'bio.html', 'certifications.html', 'sitemap.xml',
  '_tools/refresh-public-content.mjs', 'index_assets/js/qualifications.js',
  'index_assets/js/certifications.js', 'public_assets/site/js/lib/social-tiles.js'];

async function fixture() {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'public-snapshot-test-'));
  for (const file of files) {
    const dest = path.join(dir, file);
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.copyFile(new URL(file, root), dest);
  }
  const home = await fs.readFile(path.join(dir, 'index.html'), 'utf8');
  const social = JSON.parse(home.match(/id="public-social-snapshot">(.*?)<\/script>/s)[1]);
  const certs = JSON.parse(home.match(/id="public-certifications-snapshot">(.*?)<\/script>/s)[1]);
  return { dir, social: { ok: true, count: social.length, social_links: social }, certs: { ok: true, ...certs } };
}

async function generate({ dir, social, certs }, fail = false) {
  const code = `globalThis.fetch = async url => ({ok:${!fail}, json:async()=>String(url).includes('social-links')?${JSON.stringify(social)}:${JSON.stringify(certs)}}); await import(${JSON.stringify(pathToFileURL(path.join(dir, '_tools/refresh-public-content.mjs')).href)});`;
  return run(process.execPath, ['--input-type=module', '-e', code]);
}

test('refreshes changed public content, escapes markup and remains deterministic', async () => {
  const f = await fixture();
  f.certs.certifications[0].name = 'Updated <script>example</script> & course';
  await generate(f);
  const html = await fs.readFile(path.join(f.dir, 'certifications.html'), 'utf8');
  assert.match(html, /Updated &lt;script&gt;example&lt;\/script&gt; &amp; course/);
  assert.ok(!html.includes('Updated <script>'));
  const first = await fs.readFile(path.join(f.dir, 'sitemap.xml'), 'utf8');
  assert.ok(first.includes(new Date().toISOString().slice(0, 10)));
  await generate(f);
  assert.equal(await fs.readFile(path.join(f.dir, 'certifications.html'), 'utf8'), html);
  assert.equal(await fs.readFile(path.join(f.dir, 'sitemap.xml'), 'utf8'), first);
});

test('API failure and incomplete payloads leave every published file unchanged', async () => {
  const f = await fixture();
  const before = await Promise.all(files.slice(0, 4).map(file => fs.readFile(path.join(f.dir, file), 'utf8')));
  await assert.rejects(generate(f, true));
  f.certs.total++;
  await assert.rejects(generate(f));
  const after = await Promise.all(files.slice(0, 4).map(file => fs.readFile(path.join(f.dir, file), 'utf8')));
  assert.deepEqual(after, before);
});

test('explicitly empty successful lists remove stale cards', async () => {
  const f = await fixture();
  f.social = { ok: true, count: 0, social_links: [] };
  f.certs = { ok: true, total: 0, certifications: [] };
  await generate(f);
  const home = await fs.readFile(path.join(f.dir, 'index.html'), 'utf8');
  const certs = await fs.readFile(path.join(f.dir, 'certifications.html'), 'utf8');
  assert.doesNotMatch(home, /class="social-tile social-tile--/);
  assert.doesNotMatch(certs, /<article class="certification-card">/);
});
