#!/usr/bin/env node
/** Generate a safe local Pages config (ignored by Git). No tokens are stored. */
import {readFile,writeFile} from 'node:fs/promises';
const args=Object.fromEntries(process.argv.slice(2).reduce((a,v,i,x)=>{if(v.startsWith('--')&&x[i+1]&&!x[i+1].startsWith('--'))a.push([v.slice(2),x[i+1]]);return a;},[]));
const fail=s=>{console.error(s);process.exit(2);};
const uuid=args['database-id'];
if(!/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(uuid||'')||/^0{8}-0{4}-/.test(uuid))fail('Supply your real D1 UUID with --database-id.');
const name=args.name||'pathvirgil',db=args['database-name']||'harbor-production',bucket=args.bucket||'harbor-photos-production';
for(const [k,v] of Object.entries({name,db,bucket}))if(!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(v)||v.length>63)fail('Invalid '+k+'; use lowercase letters, digits, and hyphens.');
const withBucket=args['without-photos']!=='true';
const output={name,pages_build_output_dir:'./public',compatibility_date:'2026-10-10',compatibility_flags:['nodejs_compat'],d1_databases:[{binding:'DB',database_name:db,database_id:uuid,migrations_dir:'drizzle'}]};
if(withBucket)output.r2_buckets=[{binding:'BUCKET',bucket_name:bucket}];
const configText=JSON.stringify(output,null,2)+'\n';
await writeFile('wrangler.pages.json',configText);
await writeFile('wrangler.jsonc',configText);
console.log('Created standard wrangler.jsonc and D1-compatible wrangler.pages.json: '+name+'.pages.dev (subject to Pages project availability)');
console.log('API: same-origin /api/*; static assets: /app/*, service worker: /sw.js');
console.log(withBucket?'Private photo bucket binding enabled.':'Photo uploads disabled; reports without photos can still work.');
console.log('Reviewer secret must be entered separately with `wrangler pages secret put` (never here).');
