import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const websiteRoot = path.resolve(fileURLToPath(new URL('../', import.meta.url)));
const repositoryRoot = path.resolve(websiteRoot, '..');
const sourceRoot = path.join(repositoryRoot, 'publications-source');
const outputRoot = path.join(websiteRoot, 'publications');
const today = new Date().toISOString().slice(0, 10);

const escapeHtml = value => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');
const json = value => JSON.stringify(value, null, 2).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function parseFrontMatter(source, filename) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  assert(match, `${filename}: start the file with YAML-style front matter (---).`);
  const meta = {};
  for (const line of match[1].split(/\r?\n/)) {
    if (!line.trim()) continue;
    const field = line.match(/^([a-zA-Z][a-zA-Z0-9_]*):\s*(.*)$/);
    assert(field, `${filename}: invalid front-matter line: ${line}`);
    const [, key, raw] = field;
    assert(!Object.hasOwn(meta, key), `${filename}: ${key} is defined more than once.`);
    meta[key] = raw.trim().replace(/^['"]|['"]$/g, '');
  }
  return { meta, body: match[2].trim() };
}

async function findMarkdown(directory) {
  const items = await fs.readdir(directory, { withFileTypes: true }).catch(error => {
    if (error.code === 'ENOENT') return [];
    throw error;
  });
  const files = [];
  for (const item of items) {
    if (item.name.startsWith('_')) continue;
    const full = path.join(directory, item.name);
    if (item.isDirectory()) files.push(...await findMarkdown(full));
    else if (item.isFile() && item.name.endsWith('.md')) files.push(full);
  }
  return files;
}

function validateArticle(meta, filename) {
  const required = ['title', 'description', 'category', 'published', 'slug'];
  for (const key of required) assert(meta[key], `${filename}: ${key} is required.`);
  assert(meta.title.length <= 110, `${filename}: title must be 110 characters or fewer.`);
  assert(meta.description.length >= 40 && meta.description.length <= 180, `${filename}: description must be 40–180 characters.`);
  assert(slugPattern.test(meta.category), `${filename}: category must be a lower-case URL slug.`);
  assert(slugPattern.test(meta.slug), `${filename}: slug must be a lower-case URL slug.`);
  for (const key of ['published', ...(meta.updated ? ['updated'] : [])]) {
    assert(datePattern.test(meta[key]) && !Number.isNaN(Date.parse(meta[key])), `${filename}: ${key} must be YYYY-MM-DD.`);
    assert(meta[key] <= today, `${filename}: ${key} cannot be in the future.`);
  }
  const draft = (meta.draft || 'false').toLowerCase();
  assert(['true', 'false'].includes(draft), `${filename}: draft must be true or false.`);
  return { ...meta, draft: draft === 'true', updated: meta.updated || meta.published };
}

function safeLink(value) {
  if (/^(?:https?:\/\/|mailto:|\/)/i.test(value) && !/[\s<>]/.test(value)) return value;
  return null;
}

function inline(markdown) {
  let value = escapeHtml(markdown);
  value = value.replace(/`([^`]+)`/g, '<code>$1</code>');
  value = value.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  value = value.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  value = value.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, href) => {
    const url = safeLink(href);
    return url ? `<a href="${escapeHtml(url)}"${url.startsWith('http') ? ' rel="noreferrer"' : ''}>${label}</a>` : label;
  });
  return value;
}

function imageBlock(line, filename) {
  const match = line.match(/^!\[([^\]]*)\]\((\/public_assets\/publications\/([a-f0-9]{32})\.jpg)(?:\s+"([^"]*)")?\)$/i);
  if (!match) return null;
  const [, alt, source, imageId, caption] = match;
  const asset = path.join(websiteRoot, 'public_assets', 'publications', `${imageId}.jpg`);
  return fs.access(asset).then(() => `<figure class="publication-figure"><img src="${source}" alt="${escapeHtml(alt)}" loading="lazy" decoding="async">${caption ? `<figcaption>${inline(caption)}</figcaption>` : ''}</figure>`)
    .catch(() => { throw new Error(`${filename}: image ${source} does not exist.`); });
}

async function renderMarkdown(markdown, filename) {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const chunks = [];
  let index = 0;
  const headingIds = new Set();
  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) { index++; continue; }
    if (line.startsWith('```')) {
      const language = line.slice(3).trim();
      const code = [];
      index++;
      while (index < lines.length && !lines[index].startsWith('```')) code.push(lines[index++]);
      assert(index < lines.length, `${filename}: unterminated code block.`);
      index++;
      chunks.push(`<pre><code${language ? ` class="language-${escapeHtml(language)}"` : ''}>${escapeHtml(code.join('\n'))}</code></pre>`);
      continue;
    }
    const image = await imageBlock(line, filename);
    if (image) { chunks.push(image); index++; continue; }
    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      assert(heading[1].length > 1, `${filename}: use the publication title instead of a second H1.`);
      const id = heading[2].toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'section';
      assert(!headingIds.has(id), `${filename}: duplicate heading “${heading[2]}”.`);
      headingIds.add(id);
      chunks.push(`<h${heading[1].length} id="${id}">${inline(heading[2])}</h${heading[1].length}>`);
      index++; continue;
    }
    if (/^[-*]\s+/.test(line)) {
      const items = [];
      while (index < lines.length && /^[-*]\s+/.test(lines[index])) items.push(`<li>${inline(lines[index++].replace(/^[-*]\s+/, ''))}</li>`);
      chunks.push(`<ul>${items.join('')}</ul>`); continue;
    }
    if (/^\d+\.\s+/.test(line)) {
      const items = [];
      while (index < lines.length && /^\d+\.\s+/.test(lines[index])) items.push(`<li>${inline(lines[index++].replace(/^\d+\.\s+/, ''))}</li>`);
      chunks.push(`<ol>${items.join('')}</ol>`); continue;
    }
    if (line.startsWith('> ')) { chunks.push(`<blockquote>${inline(line.slice(2))}</blockquote>`); index++; continue; }
    const paragraph = [];
    while (index < lines.length && lines[index].trim() && !/^#{1,3}\s+|^[-*]\s+|^\d+\.\s+|^> |^```|^!\[/.test(lines[index])) paragraph.push(lines[index++]);
    chunks.push(`<p>${inline(paragraph.join(' '))}</p>`);
  }
  return chunks.join('\n          ');
}

function dateLabel(date) {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`));
}

function summaryActions(canonical) {
  const prompt = encodeURIComponent(`Summarise this article and highlight its key ideas: ${canonical}`);
  const providers = [
    { label: 'ChatGPT', icon: 'openai.svg', href: `https://chatgpt.com/?q=${prompt}` },
    { label: 'Claude', icon: 'claude.svg', href: `https://claude.ai/new?q=${prompt}` },
    { label: 'Perplexity', icon: 'perplexity.svg', href: `https://www.perplexity.ai/search?q=${prompt}` },
    { label: 'Grok', icon: 'grok.svg', href: `https://grok.com/?q=${prompt}` }
  ];
  return `<section class="publication-ai-actions" aria-labelledby="ai-actions-title">
              <div><h2 id="ai-actions-title">Use AI to summarise this publication.</h2><p>Choose a tool to open this article in a new chat.</p></div>
              <div class="publication-ai-buttons">${providers.map(provider => `<a href="${provider.href}" target="_blank" rel="noopener noreferrer" aria-label="Summarise this article with ${provider.label}"><img src="/public_assets/ai_provider_icons/${provider.icon}" alt="" width="22" height="22"><span>${provider.label}</span><span aria-hidden="true">↗</span></a>`).join('')}</div>
            </section>`;
}

function pageShell({ title, description, canonical, schema, content, asciiCanvas = '' }) {
  return `<!doctype html>
<html lang="en-GB">
  <head>
    <meta charset="utf-8">
    <script src="/public_assets/site/js/layout/loader.js?v=20260728-loader2"></script>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}">
    <meta name="author" content="Mason Gibbs">
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
    <link rel="canonical" href="${canonical}">
    <link rel="author" href="https://mas0ng.com/#person">
    <link rel="describedby" href="https://mas0ng.com/llms.txt">
    <link rel="sitemap" type="application/xml" href="https://mas0ng.com/sitemap.xml">
    <meta name="theme-color" content="#050505">
    <meta property="og:type" content="article">
    <meta property="og:site_name" content="mas0ng.com">
    <meta property="og:locale" content="en_GB">
    <meta property="og:title" content="${escapeHtml(title)}">
    <meta property="og:description" content="${escapeHtml(description)}">
    <meta property="og:url" content="${canonical}">
    <meta name="twitter:card" content="summary">
    <meta name="twitter:title" content="${escapeHtml(title)}">
    <meta name="twitter:description" content="${escapeHtml(description)}">
    <link rel="icon" type="image/svg+xml" href="/public_assets/site_branding/favicon/blue.svg">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=ABeeZee:ital@0;1&display=swap">
    <link rel="stylesheet" href="/public_assets/site/css/site.css?v=20260906-shared1">
    <link rel="stylesheet" href="/public_assets/site/css/publications.css?v=20260915-publications7">
    <script type="application/ld+json">
${json(schema)}
    </script>
  </head>
  <body data-page="publications">
    <div id="site-main">${content}</div>
    <script src="/public_assets/site/js/config/site-data.js?v=20260906-nav16"></script>
    <script src="/public_assets/site/js/lib/cache.js"></script>
    <script src="/public_assets/site/js/layout/nav-scroll.js"></script>
    ${asciiCanvas ? `<script src="/public_assets/site/js/ascii-background.js?v=20260906-shared1" data-shared-ascii-background data-ascii-canvas="#${asciiCanvas}" defer></script>` : ''}
    <script src="/public_assets/site/js/layout/shell.js?v=20260907-snippet1" data-active="publications" defer></script>
  </body>
</html>`;
}

function websitePage(canonical, name, description, modified, mainEntity) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebPage', '@id': `${canonical}#page`, url: canonical, name, description, inLanguage: 'en-GB', isPartOf: { '@id': 'https://mas0ng.com/#website' }, dateModified: modified, ...(mainEntity ? { mainEntity } : {}) }
    ]
  };
}

async function main() {
  const articles = [];
  const markdown = await findMarkdown(sourceRoot);
  for (const filename of markdown.sort()) {
    const { meta: raw, body } = parseFrontMatter(await fs.readFile(filename, 'utf8'), path.relative(repositoryRoot, filename));
    const meta = validateArticle(raw, path.relative(repositoryRoot, filename));
    if (meta.draft) continue;
    const categoryFromPath = path.basename(path.dirname(filename));
    assert(categoryFromPath === meta.category, `${filename}: category must match its source directory.`);
    const canonical = `https://mas0ng.com/publications/${meta.category}/${meta.slug}/`;
    articles.push({ ...meta, body: await renderMarkdown(body, path.relative(repositoryRoot, filename)), canonical });
  }
  const seenUrls = new Set();
  for (const article of articles) {
    assert(!seenUrls.has(article.canonical), `Duplicate publication URL: ${article.canonical}`);
    seenUrls.add(article.canonical);
  }

  assert(path.resolve(outputRoot).startsWith(websiteRoot + path.sep), 'Refusing to write outside website/publications.');
  await fs.rm(outputRoot, { recursive: true, force: true });
  await fs.mkdir(outputRoot, { recursive: true });

  for (const article of articles) {
    const schema = websitePage(article.canonical, article.title, article.description, article.updated, {
      '@type': 'Article', '@id': `${article.canonical}#article`, headline: article.title, description: article.description,
      datePublished: article.published, dateModified: article.updated, inLanguage: 'en-GB',
      author: { '@id': 'https://mas0ng.com/#person' }, publisher: { '@id': 'https://mas0ng.com/#person' },
      mainEntityOfPage: { '@id': `${article.canonical}#page` }, articleSection: article.category
    });
    const content = `
      <main class="publication-shell">
        <article class="publication-article">
          <p class="publication-breadcrumb"><a href="/publications/">Publications</a><span>/</span><a href="/publications/#${article.category}">${escapeHtml(article.category)}</a></p>
          <header class="publication-header">
            <h1>${escapeHtml(article.title)}</h1>
            <p class="publication-deck">${escapeHtml(article.description)}</p>
            <p class="publication-byline">By <a href="/">Mason Gibbs</a> <span aria-hidden="true">·</span> <time datetime="${article.published}">${dateLabel(article.published)}</time>${article.updated !== article.published ? ` <span aria-hidden="true">·</span> Updated <time datetime="${article.updated}">${dateLabel(article.updated)}</time>` : ''}</p>
          </header>
          ${summaryActions(article.canonical)}
          <div class="publication-content">${article.body}</div>
        </article>
      </main>`;
    const target = path.join(outputRoot, article.category, article.slug, 'index.html');
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, pageShell({ title: `${article.title} | Mason Gibbs (@mas0ng)`, description: article.description, canonical: article.canonical, schema, content }));
  }

  const hubModified = articles.reduce((latest, article) => latest > article.updated ? latest : article.updated, today);
  const categories = Map.groupBy(articles.toSorted((a, b) => b.published.localeCompare(a.published)), article => article.category);
  const listHtml = [...categories].sort(([a], [b]) => a.localeCompare(b)).map(([category, entries]) => {
    const label = category.replace(/-/g, ' ').replace(/\b[a-z]/g, letter => letter.toUpperCase());
    return `<section class="publication-category-section" id="${category}" aria-labelledby="category-${category}">
          <h2 id="category-${category}">${escapeHtml(label)}</h2>
          <div class="publication-card-grid">${entries.map(article => `<article class="publication-card">
            <a href="/publications/${article.category}/${article.slug}/">
              <time datetime="${article.published}">${dateLabel(article.published)}</time>
              <h3>${escapeHtml(article.title)}</h3>
              <p>${escapeHtml(article.description)}</p>
              <span class="publication-card-action">Read publication <span aria-hidden="true">↗</span></span>
            </a>
          </article>`).join('')}</div>
        </section>`;
  }).join('');
  const hubCanonical = 'https://mas0ng.com/publications/';
  const hubContent = `
      <main class="publication-hub">
        <header class="publication-ascii-hero" aria-labelledby="publications-title">
          <canvas id="publications-ascii" aria-hidden="true"></canvas>
          <h1 id="publications-title">Publications</h1>
        </header>
        <div class="publication-shell publication-hub-list" aria-label="Published articles">
          ${listHtml}
        </div>
      </main>`;
  const hubSchema = websitePage(hubCanonical, 'Publications | Mason Gibbs (@mas0ng)', 'Notes, ideas, and publications by Mason Gibbs (@mas0ng).', hubModified, {
    '@type': 'ItemList', numberOfItems: articles.length,
    itemListElement: articles.toSorted((a, b) => b.published.localeCompare(a.published)).map((article, position) => ({ '@type': 'ListItem', position: position + 1, url: article.canonical, name: article.title }))
  });
  await fs.writeFile(path.join(outputRoot, 'index.html'), pageShell({ title: 'Publications | Mason Gibbs (@mas0ng)', description: 'Notes, ideas, and publications by Mason Gibbs (@mas0ng).', canonical: hubCanonical, schema: hubSchema, content: hubContent, asciiCanvas: 'publications-ascii' }));

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${articles.map(article => `\n  <url>\n    <loc>${article.canonical}</loc>\n    <lastmod>${article.updated}</lastmod>\n  </url>`).join('')}\n</urlset>\n`;
  await fs.writeFile(path.join(outputRoot, 'sitemap.xml'), sitemap);
  const staticSitemapPath = path.join(websiteRoot, 'sitemap-static.xml');
  const staticSitemap = await fs.readFile(staticSitemapPath, 'utf8');
  const updatedStaticSitemap = staticSitemap.replace(/(<loc>https:\/\/mas0ng\.com\/publications\/<\/loc><lastmod>)[^<]+/, `$1${hubModified}`);
  assert(updatedStaticSitemap !== staticSitemap || staticSitemap.includes('<loc>https://mas0ng.com/publications/</loc>'), 'Core sitemap is missing the publications hub.');
  await fs.writeFile(staticSitemapPath, updatedStaticSitemap);
  const sitemapIndexPath = path.join(websiteRoot, 'sitemap.xml');
  const sitemapIndex = await fs.readFile(sitemapIndexPath, 'utf8');
  const updatedSitemapIndex = sitemapIndex.replace(/(<loc>https:\/\/mas0ng\.com\/publications\/sitemap\.xml<\/loc>\s*<lastmod>)[^<]+/, `$1${hubModified}`);
  assert(updatedSitemapIndex !== sitemapIndex || sitemapIndex.includes('<loc>https://mas0ng.com/publications/sitemap.xml</loc>'), 'Sitemap index is missing the publications sitemap.');
  await fs.writeFile(sitemapIndexPath, updatedSitemapIndex);
  console.log(`Built ${articles.length} publication${articles.length === 1 ? '' : 's'} from ${markdown.length} source file${markdown.length === 1 ? '' : 's'}.`);
}

await main();
