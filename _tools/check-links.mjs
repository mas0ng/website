import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(fileURLToPath(new URL('../',import.meta.url)));
const pages=['index.html','bio.html','certifications.html',...(await fs.readdir(path.join(root,'legal'))).filter(x=>x.endsWith('.html')).map(x=>'legal/'+x)];
const missing=new Set();
for(const page of pages){
 const html=await fs.readFile(path.join(root,page),'utf8');
 for(const match of html.matchAll(/(?:href|src)=["']([^"']+)["']/g)){
  const value=match[1];
  if(!value || /^(?:#|mailto:|tel:|data:|javascript:)/i.test(value))continue;
  const url=new URL(value,'https://mas0ng.com/'+page);
  if(url.origin !== 'https://mas0ng.com')continue;
  const pathname=decodeURIComponent(url.pathname);
  // Worker routes and dynamic services are deliberately outside this static check.
  if(!/\.(?:html|css|js|png|jpg|jpeg|svg|webp|woff2?|ico|json|pdf)$/i.test(pathname))continue;
  const target=path.resolve(root,'.'+pathname);
  if(!target.startsWith(root+path.sep))throw Error('Path escaped static root');
  try{await fs.access(target);}catch{missing.add(page+': '+pathname);}
 }
}
if(missing.size){console.error([...missing].join('\n'));process.exitCode=1;}else console.log('Static page links and assets exist ('+pages.length+' pages).');
