// Metadata-only build step. Public snapshots are the source of truth.
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
const root = new URL('../', import.meta.url);
const read = p => fs.readFile(new URL(p, root), 'utf8');
const encode = d => JSON.stringify(d, null, 2).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
const decode = s => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const snapshot = (html, id) => JSON.parse(html.match(new RegExp('<script type="application/json" id="' + id + '">([\\s\\S]*?)</script>'))[1]);
const https = value => { const u = new URL(value); if (u.protocol !== 'https:' || u.username || u.password) throw Error('Invalid public metadata URL'); return u.href; };
const home = await read('index.html');
const profiles = [...new Set(snapshot(home, 'public-social-snapshot').map(s => https(s.href)))];
const allCerts = snapshot(await read('certifications.html'), 'public-certifications-snapshot').certifications;
const credentialId = c => 'https://mas0ng.com/certifications.html#credential-' + createHash('sha256').update(c.credential_url || c.issuing_organization + ':' + c.name).digest('hex').slice(0, 16);
// Read dimensions from the actual published JPEG, without image processing.
const avatarPath = 'public_assets/personal_branding/avatar/white_black.jpg';
const jpeg = await fs.readFile(new URL(avatarPath, root));
let dimensions;
for (let i = 2; i + 8 < jpeg.length;) {
  if (jpeg[i] !== 255) throw Error('Invalid avatar JPEG');
  const marker = jpeg[i + 1];
  if (marker === 218 || marker === 217) break;
  const length = jpeg.readUInt16BE(i + 2);
  if ([192, 193, 194, 195, 197, 198, 199, 201, 202, 203, 205, 206, 207].includes(marker)) { dimensions = { width: jpeg.readUInt16BE(i + 7), height: jpeg.readUInt16BE(i + 5) }; break; }
  if (length < 2) throw Error('Invalid JPEG segment');
  i += length + 2;
}
if (!dimensions) throw Error('Could not read avatar dimensions');
const person = {
  '@type': 'Person', '@id': 'https://mas0ng.com/#person', name: 'Mason Gibbs',
  alternateName: ['mas0ng', 'mas0ngi'], url: 'https://mas0ng.com/', sameAs: profiles,
  image: { '@type': 'ImageObject', '@id': 'https://mas0ng.com/#profile-image', contentUrl: 'https://mas0ng.com/' + avatarPath, url: 'https://mas0ng.com/' + avatarPath, encodingFormat: 'image/jpeg', ...dimensions },
  mainEntityOfPage: { '@id': 'https://mas0ng.com/bio.html#profile' },
  subjectOf: [{ '@id': 'https://mas0ng.com/bio.html#profile' }, { '@id': 'https://mas0ng.com/certifications.html#page' }],
  hasCredential: allCerts.map(c => ({ '@id': credentialId(c) }))
};
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
    if (node['@type'] === 'Person') { for (const key of Object.keys(node)) delete node[key]; Object.assign(node, person); }
    if (node['@type'] === 'ProfilePage') { node.mainEntity = structuredClone(person); node.description = description; }
    if (['WebPage', 'CollectionPage'].includes(node['@type'])) node.description = description;
  }
  if (file === 'certifications.html') {
    data.about = structuredClone(person);
    const certs = snapshot(html, 'public-certifications-snapshot').certifications;
    data.mainEntity = {
      '@type': 'ItemList', '@id': canonical + '#credentials', numberOfItems: certs.length,
      itemListElement: certs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, item: {
        '@type': 'EducationalOccupationalCredential', '@id': credentialId(c), name: c.name, credentialCategory: 'Certificate',
        creator: { '@type': 'Organization', name: c.issuing_organization },
        ...(c.credential_url ? { url: https(c.credential_url) } : {}), ...(c.credential_id ? { identifier: c.credential_id } : {})
      } }))
    };
  }
  const page = (data['@graph'] || [data]).find(n => ['WebPage', 'ProfilePage', 'CollectionPage'].includes(n['@type']));
  const sitemapEntry = [...sitemap.matchAll(/<url>([\s\S]*?)<\/url>/g)].find(m => m[1].includes('<loc>' + canonical + '</loc>'));
  const recordedDate = sitemapEntry?.[1].match(/<lastmod>([^<]+)<\/lastmod>/)?.[1];
  if (page && recordedDate) page.dateModified = recordedDate;
  const makeTag = () => '<script type="application/ld+json">\n' + encode(data) + '\n  </script>';
  let tag = makeTag();
  html = pattern.test(html) ? html.replace(pattern, () => tag) : html.replace('</head>', () => '  ' + tag + '\n</head>');
  if (!html.includes('rel="sitemap"')) html = html.replace('</head>', '  <link rel="sitemap" type="application/xml" href="https://mas0ng.com/sitemap.xml" />\n</head>');
  if (file.startsWith('legal/')) {
    const attr = value => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
    for (const [property, content] of Object.entries({ 'og:type': 'website', 'og:site_name': 'mas0ng.com', 'og:locale': 'en_GB', 'og:title': title, 'og:description': description, 'og:url': canonical })) {
      const meta = '<meta property="' + property + '" content="' + attr(content) + '" />';
      const existing = new RegExp('<meta property="' + property + '"[^>]*>');
      html = existing.test(html) ? html.replace(existing, () => meta) : html.replace('</head>', () => '  ' + meta + '\n</head>');
    }
  }
  if (html !== original) {
    if (page) { page.dateModified = new Date().toISOString().slice(0, 10); html = html.replace(pattern, () => makeTag()); }
    const escaped = canonical.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    sitemap = sitemap.replace(new RegExp('(<loc>' + escaped + '</loc>\\s*<lastmod>)[^<]+'), (_, prefix) => prefix + new Date().toISOString().slice(0, 10));
    if (html.slice(html.indexOf('<body')) !== original.slice(original.indexOf('<body'))) throw Error('SEO step attempted to alter visible content: ' + file);
    await fs.writeFile(new URL(file, root), html);
  }
}
await fs.writeFile(new URL('sitemap.xml', root), sitemap);
console.log('Refreshed metadata for ' + files.length + ' pages without altering their bodies.');
