// Run before publishing: node _tools/refresh-public-content.mjs
// Fetch only the two unauthenticated public endpoints, never private app data.
import fs from 'node:fs/promises';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const read = (file) => fs.readFile(new URL(file, root), 'utf8');
const write = (file, value) => fs.writeFile(new URL(file, root), value);
const escape = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const json = (value) => JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');

async function publicData(path) {
  const response = await fetch('https://mas0ng.com/unencrypted/api/' + path, {
    headers: { Accept: 'application/json' }, credentials: 'omit', redirect: 'error',
    signal: AbortSignal.timeout(15000)
  });
  if (!response.ok) throw new Error('Public content fetch failed');
  const data = await response.json();
  if (data.ok !== true) throw new Error('Invalid public content response');
  return data;
}

function text(value) {
  if (typeof value !== 'string' || value.length > 2000) throw new Error('Invalid public text field');
  return value;
}

function href(value, asset = false) {
  value = text(value);
  if (asset && /^\/public_assets\/[A-Za-z0-9/_.-]+$/.test(value) && !value.includes('..')) return value;
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password || /["'<>\s]/.test(value)) throw new Error('Invalid public URL');
  return url.href;
}

// Execute the existing browser renderers so the generated cards retain their design.
function element() {
  return { innerHTML: '', textContent: '', hidden: true, dataset: {},
    addEventListener() {}, querySelector() { return null; }, querySelectorAll() { return []; },
    classList: { add() {}, remove() {}, toggle() {} }, setAttribute() {}, removeAttribute() {} };
}

async function render(script, data) {
  const elements = new Map();
  const context = {
    URL, URLSearchParams, console: { warn() {} },
    document: {
      getElementById(id) { if (!elements.has(id)) elements.set(id, element()); return elements.get(id); },
      addEventListener() {}
    },
    window: { matchMedia: () => ({ matches: false }), location: { origin: 'https://mas0ng.com' }, navigator: { userAgent: '' } },
    fetch: async () => ({ ok: true, json: async () => data })
  };
  vm.runInNewContext(await read(script), context, { timeout: 1000, filename: script });
  await new Promise(setImmediate);
  return { elements, context };
}

function replaceGrid(html, id, content) {
  content = content.replace(/[\t ]+$/gm, '');
  const startPattern = new RegExp('<div[^>]*\\bid="' + id + '"[^>]*>');
  const match = startPattern.exec(html);
  if (!match) throw new Error('Missing content grid: ' + id);
  const start = match.index + match[0].length;
  const tags = /<\/?div\b[^>]*>/g;
  tags.lastIndex = start;
  let depth = 1;
  for (let tag; (tag = tags.exec(html));) {
    depth += tag[0].startsWith('</') ? -1 : 1;
    if (!depth) return html.slice(0, start) + '\n' + content + '\n          ' + html.slice(tag.index);
  }
  throw new Error('Unclosed content grid: ' + id);
}

function snapshot(html, id, data) {
  const tag = '<script type="application/json" id="' + id + '">' + json(data) + '</script>';
  const existing = new RegExp('<script type="application/json" id="' + id + '">[\\s\\S]*?</script>');
  return existing.test(html) ? html.replace(existing, () => tag) : html.replace('</head>', () => '  ' + tag + '\n</head>');
}

const [socialResponse, certResponse] = await Promise.all([
  publicData('social-links'), publicData('certifications?range=all')
]);
if (!Array.isArray(socialResponse.social_links) || !Array.isArray(certResponse.certifications)) throw new Error('Missing public lists');

const { context } = await render('public_assets/site/js/lib/social-tiles.js', {});
const socials = context.window.MAS0NG_SOCIAL_TILES.filterLive(socialResponse.social_links).map((item) => ({
  id: text(item.id), label: text(item.label), handle: text(item.handle), href: href(item.href), icon: href(item.icon, true)
}));
const certifications = certResponse.certifications.map((item) => ({
  name: text(item.name), issuing_organization: text(item.issuing_organization),
  icon_url: href(item.icon_url, true), type: text(item.type || ''),
  completed_through: text(item.completed_through || ''), credential_id: text(item.credential_id || ''),
  credential_url: item.credential_url ? href(item.credential_url) : ''
}));
if (socialResponse.count !== socialResponse.social_links.length || certifications.length !== certResponse.total) throw new Error('Incomplete public snapshot; leaving existing HTML unchanged');
const certData = { total: certifications.length, certifications };
const [preview, archive] = await Promise.all([
  render('index_assets/js/qualifications.js', { ...certData, certifications: certifications.slice(0, 6) }),
  render('index_assets/js/certifications.js', certData)
]);
const socialHtml = context.window.MAS0NG_SOCIAL_TILES.renderGrid(socials);
const output = new Map();
for (const file of ['index.html', 'bio.html']) {
  let html = replaceGrid(await read(file), 'social-grid', socialHtml);
  html = snapshot(html, 'public-social-snapshot', socials);
  if (file === 'index.html') {
    html = replaceGrid(html, 'qualification-preview-grid', preview.elements.get('qualification-preview-grid').innerHTML);
    html = snapshot(html, 'public-certifications-snapshot', certData);
  }
  output.set(file, html);
}
let html = replaceGrid(await read('certifications.html'), 'certification-grid', archive.elements.get('certification-grid').innerHTML);
html = replaceGrid(html, 'certification-filters', archive.elements.get('certification-filters').innerHTML);
html = html.replace(/(<span[^>]*id="certification-count"[^>]*>)[\s\S]*?(<\/span>)/, (_, start, end) => start + escape(archive.elements.get('certification-count').textContent) + end);
output.set('certifications.html', snapshot(html, 'public-certifications-snapshot', certData));

// Update modification dates only when published page content actually changes.
let sitemap = await read('sitemap.xml');
for (const file of ['index.html', 'bio.html', 'certifications.html']) {
  const normalize = (value) => value.replace(/\r\n/g, '\n');
  if (normalize(output.get(file)) === normalize(await read(file))) continue;
  const url = 'https://mas0ng.com/' + (file === 'index.html' ? '' : file);
  const escapedUrl = url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp('(<loc>' + escapedUrl + '</loc>)\\s*(?:<lastmod>[^<]*</lastmod>\\s*)?');
  sitemap = sitemap.replace(pattern, '$1\n    <lastmod>' + new Date().toISOString().slice(0, 10) + '</lastmod>\n  ');
}
output.set('sitemap.xml', sitemap);

// Write only after every fetch, validation and render has succeeded.
for (const [file, value] of output) await write(file, value);
console.log(`Rendered ${socials.length} public social links and ${certifications.length} certifications in ${fileURLToPath(root)}.`);
