#!/usr/bin/env node
/**
 * Configure the generated Cloudflare Worker build for the free workers.dev URL.
 * Run this AFTER `pnpm build`. The deployed URL is assigned by Cloudflare.
 * This script never needs a domain purchase or a hosting-account subdomain.
 * No server secret is written into public assets or version-controlled files.
 */
import { readFile, writeFile, mkdir, copyFile, readdir } from 'node:fs/promises';
import { resolve, join } from 'node:path';

const args = Object.fromEntries(process.argv.slice(2).reduce((list, value, index, all) => {
  if (value.startsWith('--') && all[index + 1] && !all[index + 1].startsWith('--')) {
    list.push([value.slice(2), all[index + 1]]);
  }
  return list;
}, []));
const fail = (msg) => { console.error('Free deployment config error: ' + msg); process.exit(2); };
const validateName = (name, label, max = 63) => {
  if (!name || name.length > max || !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(name)) {
    fail(`Invalid ${label}. Use only lowercase letters, numbers and hyphens.`);
  }
  return name;
};
if (args.domain || args.origin || args['account-subdomain']) fail('No domain/hostname argument is required for free workers.dev hosting.');
const databaseId = args['database-id'];
if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(databaseId || '') || /^0{8}-0{4}-/.test(databaseId)) {
  fail('Supply the actual D1 UUID printed by `wrangler d1 create` via --database-id.');
}
const worker = validateName(args.worker || 'harbor-travel-safety', 'worker name');
const database = validateName(args['database-name'] || 'harbor-production', 'database name');
const bucket = validateName(args.bucket || 'harbor-photos-production', 'R2 bucket');
const configPath = resolve('dist/server/wrangler.json');
let config;
try { config = JSON.parse(await readFile(configPath, 'utf8')); }
catch { fail('Cannot read dist/server/wrangler.json. Run `pnpm build` first.'); }
if (!config.main && !config.assets) fail('Worker build entry or assets missing.');
config.name = worker;
config.compatibility_date = config.compatibility_date || '2026-10-10';
config.compatibility_flags = [...new Set([...(config.compatibility_flags || []), 'nodejs_compat'])];
// Important: a custom-domain config sets workers_dev false; do not inherit it.
config.workers_dev = true;
delete config.route;
delete config.routes;
config.d1_databases = [{ binding: 'DB', database_name: database, database_id: databaseId, migrations_dir: 'migrations' }];
config.r2_buckets = [{ binding: 'BUCKET', bucket_name: bucket }];
// The public URL depends on the user's Cloudflare account subdomain. It must
// not be guessed or hard-coded here. Same-origin web requests and the native
// app's documented origin are accepted without PUBLIC_APP_ORIGIN.
if (config.vars) {
  delete config.vars.PUBLIC_APP_ORIGIN;
  if (!Object.keys(config.vars).length) delete config.vars;
}
const targetMigrations = resolve('dist/server/migrations');
await mkdir(targetMigrations, { recursive: true });
const migrationFiles = (await readdir(resolve('drizzle')))
  .filter((file) => /^\d+_[a-z0-9_]+\.sql$/.test(file)).sort();
if (!migrationFiles.length) fail('No checked-in migration SQL files found.');
for (const file of migrationFiles) {
  await copyFile(resolve('drizzle', file), join(targetMigrations, file));
}
await writeFile(configPath, JSON.stringify(config, null, 2) + '\n');
console.log(`Configured free Worker "${worker}" with D1 "${database}" and private R2 "${bucket}".`);
console.log('Cloudflare will print the actual HTTPS workers.dev URL after deployment.');
console.log('Reviewer secret is not included. Configure it using `wrangler secret put MODERATOR_ACCESS_TOKEN`.');
