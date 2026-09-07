// Metadata-only build step. Public snapshots are the source of truth.
import fs from 'node:fs/promises';
const root = new URL('../', import.meta.url);
const read = p => fs.readFile(new URL(p, root), 'utf8');
const encode = d => JSON.stringify(d, null, 2).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
const decode = s => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const snapshot = (html, id) => JSON.parse(html.match(new RegExp('<script type="application/json" id="' + id + '">([\\s\\S]*?)</script>'))[1]);
const https = value => { const u = new URL(value); if (u.protocol !== 'https:' || u.username || u.password) throw Error('Invalid public metadata URL'); return u.href; };
const home = await read('index.html');
const profiles = [...new Set(snapshot(home, 'public-social-snapshot').map(s => https(s.href)))];
const files = ['index.html', 'bio.html', 'certifications.html', ...(await fs.readdir(new URL('legal/', root))).filter(f => f.endsWith('.html')).map(f => 'legal/' + f)];
let sitemap = await read('sitemap.xml');
for (const file of files) {
  const original = await read(file);
  const canonical = original.match(/<link rel="canonical" href="([^"]+)"/)[1];
  const title = decode(original.match(/<title>([^<]+)<\/title>/)[1]);
  const description = decode(original.match(/<meta name="description" content="([^"]+)"/)[1]);
  let html = original;
  const pattern = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/;
  const data = pattern.test(html) ? JSON.parse(html.match(pattern)[1]) : { '@context': 'https://schema.org', '@type': 'WebPage', '@id': canonical + '#page', url: canonical, name: title, description, inLanguage: 'en-GB', isPartOf: { '@id': 'https://mas0ng.com/#website' } };
  for (const node of data['@graph'] || [data]) {
    if (node['@type'] === 'Person') {
      node.sameAs = profiles;
      node.subjectOf = [{ '@id': 'https://mas0ng.com/bio.html#profile' }, { '@id': 'https://mas0ng.com/certifications.html#page' }];
    }
    if (node['@type'] === 'ProfilePage') { node.mainEntity.sameAs = profiles; node.description = description; }
    if (['WebPage', 'CollectionPage'].includes(node['@type'])) node.description = description;
  }
  if (file === 'certifications.html') {
    const certs = snapshot(html, 'public-certifications-snapshot').certifications;
    data.mainEntity = {
      '@type': 'ItemList', '@id': canonical + '#credentials', numberOfItems: certs.length,
      itemListElement: certs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, item: {
        '@type': 'EducationalOccupationalCredential', name: c.name, credentialCategory: 'Certificate',
        creator: { '@type': 'Organization', name: c.issuing_organization },
        ...(c.credential_url ? { url: https(c.credential_url) } : {}), ...(c.credential_id ? { identifier: c.credential_id } : {})
      } }))
    };
  }
  const tag = '<script type="application/ld+json">\n' + encode(data) + '\n  </script>';
  html = pattern.test(html) ? html.replace(pattern, () => tag) : html.replace('</head>', () => '  ' + tag + '\n</head>');
  if (!html.includes('rel="sitemap"')) html = html.replace('</head>', '  <link rel="sitemap" type="application/xml" href="https://mas0ng.com/sitemap.xml" />\n</head>');
  if (html !== original) {
    const escaped = canonical.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    sitemap = sitemap.replace(new RegExp('(<loc>' + escaped + '</loc>\\s*<lastmod>)[^<]+'), (_, prefix) => prefix + new Date().toISOString().slice(0, 10));
    if (html.slice(html.indexOf('<body')) !== original.slice(original.indexOf('<body'))) throw Error('SEO step attempted to alter visible content: ' + file);
    await fs.writeFile(new URL(file, root), html);
  }
}
await fs.writeFile(new URL('sitemap.xml', root), sitemap);
console.log('Refreshed metadata for ' + files.length + ' pages without altering their bodies.');
