import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read = path => readFileSync(new URL(path,import.meta.url),'utf8');
const api=read('../lib/api-handlers.ts');
const domain=read('../lib/domain.ts');
const view=read('../public/app/views.js');
const app=read('../public/app/app.js');
test('role secrets are independent and stay server side',()=>{
 assert.match(api,/JUDGE_ACCESS_TOKEN/);assert.match(api,/role==='moderator'/);
 assert.match(api,/actor!=='moderator'/);assert.match(api,/\(await reviewer\(req\)\)!=='moderator'/);
 assert.doesNotMatch(view,/JUDGE_ACCESS_TOKEN/);assert.doesNotMatch(app,/JUDGE_ACCESS_TOKEN/);
});
test('judge has no moderator form and receives read-only banner',()=>{
 assert.match(view,/S\.session\?\.canModerate/);assert.match(view,/Judge preview · READ ONLY/);
 assert.match(app,/Judge access is read-only/);
});
test('unverified public submissions hide unreviewed details',()=>{
 assert.match(domain,/pending\?'Unverified community observation/);
 assert.match(domain,/Math\.round\(Number\(r\.lat\)\*100\)/);
 assert.match(api,/status IN \('pending','reviewed','corroborated'\)/);
 assert.match(view,/Unverified submissions/);
});
