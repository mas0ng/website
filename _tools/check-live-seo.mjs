// Read-only deployment audit. Checks the served HTML and headers, not local templates.
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const sitemap = await fs.readFile(new URL('../sitemap.xml', import.meta.url), 'utf8');
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
const people = [];
await Promise.all(urls.map(async url => {
  const response = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(20000) });
  assert.equal(response.status, 200, url + ': HTTP error');
  assert(!/\b(noindex|none)\b/i.test(response.headers.get('x-robots-tag') || ''), url + ': blocked by HTTP header');
  const head = (await response.text()).split('</head>')[0];
  const canonical = [...head.matchAll(/<link rel="canonical" href="([^"]+)"/g)];
  assert.equal(canonical.length, 1, url + ': canonical count');
  assert.equal(canonical[0][1], url, url + ': canonical mismatch');
  assert(!/<meta name="(?:robots|googlebot)" content="[^"]*\b(?:noindex|none)\b/i.test(head), url + ': noindex metadata');
  assert(head.includes('rel="describedby" href="https://mas0ng.com/llms.txt"'), url + ': missing discovery link');
  const schema = [...head.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => JSON.parse(m[1]));
  const nodes = schema.flatMap(d => d['@graph'] || [d]);
  const page = nodes.find(n => ['WebPage', 'ProfilePage', 'CollectionPage'].includes(n['@type']));
  assert(page?.dateModified && !Number.isNaN(Date.parse(page.dateModified)), url + ': missing modification date');
  assert(page.dateModified <= new Date().toISOString().slice(0, 10), url + ': future modification date');
  for (const node of nodes) {
    const person = node['@type'] === 'Person' ? node : node.mainEntity?.['@type'] === 'Person' ? node.mainEntity : node.about?.['@type'] === 'Person' ? node.about : null;
    if (person) people.push(person);
  }
  if (url.includes('/legal/')) for (const property of ['og:title', 'og:description', 'og:type', 'og:site_name', 'og:locale', 'og:url']) assert(head.includes('property="' + property + '"'), url + ': missing ' + property);
  if (url.endsWith('/certifications.html')) {
    const snapshot = JSON.parse(head.match(/id="public-certifications-snapshot">([\s\S]*?)<\/script>/)[1]);
    assert.deepEqual(page.mainEntity.itemListElement.map(i => i.item.name), snapshot.certifications.map(c => c.name));
    assert.deepEqual(page.about.hasCredential.map(c => c['@id']), page.mainEntity.itemListElement.map(i => i.item['@id']));
  }
}));
assert.equal(people.length, 3, 'Expected identity markup on home, bio and certifications');
for (const person of people) {
  assert.deepEqual(person, people[0], 'Inconsistent published Person records');
  assert.deepEqual(person.alternateName, ['mas0ng', 'mas0ngi']);
  assert(person.image.width > 0 && person.image.height > 0 && person.image['@type'] === 'ImageObject');
}
console.log('Live metadata and HTTP indexing checks passed on ' + urls.length + ' pages; all three identity records agree.');
