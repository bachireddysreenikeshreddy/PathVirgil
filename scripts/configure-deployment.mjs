#!/usr/bin/env node
/** Configure the Cloudflare Vite build output for an independently owned custom domain.
 * Run AFTER `pnpm build`, BEFORE `wrangler d1 migrations apply` or `wrangler deploy`.
 * No secrets are embedded here or in the generated Wrangler config.
 */
import { readFile, writeFile, mkdir, copyFile, readdir } from 'node:fs/promises';
import { resolve, join } from 'node:path';

const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, all) => {
  if (v.startsWith('--') && all[i + 1] && !all[i + 1].startsWith('--')) a.push([v.slice(2), all[i + 1]]);
  return a;
}, []));
function fail(message) { console.error('Deployment config error: ' + message); process.exit(2); }
function simpleName(value, desc, max=63) { if(!value || value.length>max || !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(value)) fail('Invalid '+desc+'. Use lowercase letters, numbers and hyphens.'); return value; }
const rawDomain=args.domain;
if(!rawDomain) fail('Pass --domain your-domain.com (an owned domain or subdomain).');
let host;
try {
  const u=new URL(rawDomain.includes('://')?rawDomain:'https://'+rawDomain);
  if(u.protocol!=='https:' || u.username || u.password || u.port || u.pathname!=='/' || u.search || u.hash || !u.hostname.includes('.')) throw new Error('Expected HTTPS hostname only');
  host=u.hostname.toLowerCase();
  if(host.endsWith('.example') || host.endsWith('.test') || host.endsWith('.invalid') || host.endsWith('.localhost')) throw new Error('Use a real domain');
} catch {fail('Provide a real HTTPS hostname without paths or ports, e.g. harbor.your-domain.com.');}
const id=args['database-id'];
if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id||'')) fail('Pass --database-id <UUID> returned from `wrangler d1 create`.');
const dbName=simpleName(args['database-name']||'harbor-production','database name');
const bucket=simpleName(args.bucket||'harbor-photos-production','R2 bucket');
const worker=simpleName(args.worker||'harbor-travel-safety','worker name');
const path=resolve('dist/server/wrangler.json');
let conf;
try {conf=JSON.parse(await readFile(path,'utf8'));} catch {fail('Cannot find dist/server/wrangler.json. First run `pnpm build`.');}
if (!conf.main && !conf.assets) fail('Build output is missing Worker entry/asset settings; do not deploy this file.');
conf.name=worker;
conf.compatibility_date=conf.compatibility_date||'2026-10-10';
conf.compatibility_flags=[...new Set([...(conf.compatibility_flags||[]),'nodejs_compat'])];
conf.workers_dev=false;
conf.routes=[{pattern:host,custom_domain:true}];
conf.d1_databases=[{binding:'DB',database_name:dbName,database_id:id,migrations_dir:'migrations'}];
conf.r2_buckets=[{binding:'BUCKET',bucket_name:bucket}];
conf.vars={...(conf.vars||{}),PUBLIC_APP_ORIGIN:'https://'+host};
// Copy committed migration files alongside the output config so Wrangler resolves paths
// the same way whether called from the repo root or a CI pipeline.
const migrations=resolve('dist/server/migrations');await mkdir(migrations,{recursive:true});
for(const name of (await readdir(resolve('drizzle'))).filter(n=>/^\d+_[a-z0-9_]+\.sql$/.test(n)).sort()){
  await copyFile(resolve('drizzle',name),join(migrations,name));
}
await writeFile(path,JSON.stringify(conf,null,2)+'\n');
console.log('Configured Worker:',worker,'\nCustom domain: https://'+host,'\nD1:',dbName,'('+id+')','\nR2:',bucket,'\nSecrets: NOT embedded (set MODERATOR_ACCESS_TOKEN securely using Wrangler)');
