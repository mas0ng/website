import fs from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const output = new URL('_site/', root);
// Refuse a reused output directory rather than risk carrying old/unreviewed files.
await fs.mkdir(output);
const folders = ['.well-known', 'errors', 'index_assets', 'legal', 'public_assets', 'redirect'];
const files = [
  'index.html', 'bio.html', 'certifications.html', '404.html', 'CNAME',
  'robots.txt', 'sitemap.xml', 'llms.txt', 'health_check.txt',
  'navbar.js', 'site-libs.js', 'site-theme.css'
];
for (const name of [...folders, ...files]) {
  await fs.cp(new URL(name, root), new URL(name, output), {
    recursive: true,
    filter: async (source) => {
      const stat = await fs.lstat(source);
      if (stat.isSymbolicLink()) throw new Error('Symlinks are not allowed in the Pages artifact');
      return !/(?:^|[\\/])(?:AGENTS\.md|README[^\\/]*|REVIEW-NOTES[^\\/]*)$/i.test(source);
    }
  });
}
console.log('Packaged refreshed public pages; Git metadata, build tools and workflow files are excluded.');
