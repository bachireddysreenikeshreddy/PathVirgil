import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const api=readFileSync(new URL('../lib/api-handlers.ts',import.meta.url),'utf8');
const js=readFileSync(new URL('../public/app/app.js',import.meta.url),'utf8');
const sql=readFileSync(new URL('../drizzle/0002_report_photos_d1.sql',import.meta.url),'utf8');
test('D1 blob schema exists and is private',()=>{assert.match(sql,/bytes BLOB NOT NULL/);assert.match(sql,/report_id TEXT PRIMARY KEY/);assert.match(api,/if\(!await reviewer\(req\)&&!await receiptFor\(req,row\)\)/);});
test('No bucket uses transactional D1 photo insertion',()=>{assert.match(api,/photoKey=env\.BUCKET\?'reports\/'\+id:'d1:'/);assert.match(api,/await d\.batch\(\[insertReport/);assert.match(api,/SELECT bytes FROM report_photos/);});
test('Browser compresses photo before queuing',()=>{assert.match(js,/async function compactEvidence\(/);assert.match(js,/canvas\.toBlob/);assert.match(js,/blob\.size<=230000/);assert.match(js,/photo=await compactEvidence/);});
