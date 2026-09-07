import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const root = new URL('../', import.meta.url);
const read = file => fs.readFile(new URL(file, root), 'utf8');
const sitemap = await read('sitemap.xml');
const entries = [...sitemap.matchAll(/<url>([\s\S]*?)<\/url>/g)].map(m => ({
  url: m[1].match(/<loc>([^<]+)<\/loc>/)?.[1], date: m[1].match(/<lastmod>([^<]+)<\/lastmod>/)?.[1]
}));
assert.equal(new Set(entries.map(e => e.url)).size, entries.length, 'Duplicate sitemap URLs');
const titles = new Set();
const descriptions = new Set();
const expected = ['index.html', 'bio.html', 'certifications.html', ...(await fs.readdir(new URL('legal/', root))).filter(f => f.endsWith('.html')).map(f => 'legal/' + f)];
assert.equal(entries.length, expected.length, 'Sitemap coverage changed');
for (const file of expected) {
  const html = await read(file);
  const head = html.split('</head>')[0];
  const canonical = 'https://mas0ng.com/' + (file === 'index.html' ? '' : file === 'legal/index.html' ? 'legal/' : file);
  const links = [...head.matchAll(/<link rel="canonical" href="([^"]+)"/g)];
  assert.equal(links.length, 1, file + ': expected one canonical');
  assert.equal(links[0][1], canonical, file + ': wrong canonical');
  const entry = entries.find(e => e.url === canonical);
  assert(entry, file + ': missing from sitemap');
  assert(/^\d{4}-\d{2}-\d{2}$/.test(entry.date) && !Number.isNaN(Date.parse(entry.date)), file + ': invalid lastmod');
  assert(entry.date <= new Date().toISOString().slice(0, 10), file + ': future lastmod');
  const robots = [...head.matchAll(/<meta name="(?:robots|googlebot)" content="([^"]+)"/g)];
  assert(robots.length && robots.every(m => !/\b(noindex|none)\b/i.test(m[1])), file + ': indexing blocked');
  const title = head.match(/<title>([^<]+)<\/title>/)?.[1];
  const description = head.match(/<meta name="description" content="([^"]+)"/)?.[1];
  assert(title && !titles.has(title), file + ': missing or duplicate title'); titles.add(title);
  assert(description && !descriptions.has(description), file + ': missing or duplicate description'); descriptions.add(description);
  assert(head.includes('rel="describedby" href="https://mas0ng.com/llms.txt"'), file + ': missing AI discovery link');
  const og = head.match(/<meta property="og:url" content="([^"]+)"/);
  if (og) assert.equal(og[1], canonical, file + ': sharing URL conflicts');
  const schemas = [...head.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => JSON.parse(m[1]));
  assert(schemas.length, file + ': missing structured data');
  if (file === 'certifications.html') {
    const snapshot = JSON.parse(head.match(/id="public-certifications-snapshot">([\s\S]*?)<\/script>/)[1]);
    const list = schemas[0].mainEntity;
    assert.equal(list.numberOfItems, snapshot.certifications.length);
    assert.deepEqual(list.itemListElement.map(e => e.item.name), snapshot.certifications.map(c => c.name));
  }
}
for (const file of ['404.html', 'errors/default.html']) assert(/<meta name="robots" content="[^\"]*noindex/.test(await read(file)), file + ': error page became indexable');
console.log('SEO checks passed for ' + expected.length + ' indexable pages and error-page exclusions.');
