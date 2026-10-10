#!/usr/bin/env node
// Dependency-free safety check before cloud deployment; does not contact accounts.
import {readFileSync, existsSync, readdirSync, statSync} from 'node:fs';
import {resolve, relative, join} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const requireFile=(p)=>{if(!existsSync(resolve(root,p)))throw Error('Missing deployment file: '+p);};
for(const p of ['public/app/index.html','public/app/config.js','public/sw.js','public/_routes.json','public/index.html','functions/api/[[path]].ts','lib/api-handlers.ts','drizzle/0000_tan_silhouette.sql','drizzle/0001_violet_true_believers.sql','drizzle/0002_report_photos_d1.sql','scripts/deploy-pages.ps1'])requireFile(p);
const rootHtml=readFileSync(resolve(root,'public/index.html'),'utf8');
if(!rootHtml.includes('<base href="/app/">')||!rootHtml.includes('<title>PathVirgil'))throw Error('Root index.html must contain the PathVirgil app and base href=/app/.');
if(existsSync(resolve(root,'public/_redirects')))throw Error('Remove the conflicting root _redirects; Harbor is served directly by index.html');
const routes=JSON.parse(readFileSync(resolve(root,'public/_routes.json'),'utf8'));
if(!routes.include.includes('/api/*'))throw Error('Pages API route must include /api/*');
const sw=readFileSync(resolve(root,'public/sw.js'),'utf8');
const core=sw.match(/const CORE=(\[[^;]+\]);/)?.[1];
if(!core)throw Error('Offline service-worker asset list was not found');
const missing=JSON.parse(core).filter(p=>!existsSync(resolve(root,'public',p.slice(1))));
if(missing.length)throw Error('Missing offline resources: '+missing.join(', '));
const handler=readFileSync(resolve(root,'lib/api-handlers.ts'),'utf8');
if(!/^import exifr from 'exifr';/m.test(handler)||!/export function createHarborHandlers/m.test(handler))throw Error('Pages API has unexpected import layout');
const config=readFileSync(resolve(root,'public/app/config.js'),'utf8');
if(!config.includes("DEFAULT_BACKEND_ORIGIN='';"))throw Error('Web configuration has an unexpected default backend origin');
let checked=0;
const skip=new Set(['node_modules','.git','.wrangler','dist','build']);
function visit(d){for(const name of readdirSync(d)){if(skip.has(name))continue;const p=join(d,name);if(statSync(p).isDirectory())visit(p);else if(/\.(js|mjs|ts|tsx|json|html|md|css|xml|ps1|py)$/.test(name)&&!p.includes('/vendor/')&&!p.includes('/public/app/ml/')){
const s=readFileSync(p,'utf8');if(new RegExp('(' + ['chat','gpt'].join('') + '\\.|' + ['open','ai'].join('') + '\\.)','i').test(s))throw Error('Provider branding reference found: '+relative(root,p));checked++;
}}}
visit(root);
console.log('PASS: Pages Functions route, '+JSON.parse(core).length+' offline assets and '+checked+' text files checked.');
console.log('NEXT: Authenticate with Cloudflare and run scripts/deploy-pages.ps1.');
