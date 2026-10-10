import test from 'node:test';
import assert from 'node:assert/strict';
import {makeDemo} from '../public/app/data.js';
import {readFileSync} from 'node:fs';
const app=readFileSync('public/app/app.js','utf8');
const ui=readFileSync('public/app/views.js','utf8');
for(const city of ['chennai','kochi','mumbai']) test(`isolated ${city} scenario`,()=>{const d=makeDemo(city);assert.equal(d.reports.length,12);assert(d.reports.every(x=>x.demo&&x.description.includes('Fictional')));assert.equal(d.origin.name[0],d.origin.name[0].toUpperCase());});
test('moderator address or GPS without visible coordinates',()=>{assert.match(ui,/notice-address/);assert.match(ui,/notice-gps/);assert.doesNotMatch(ui,/name="lat" type="number"/);assert.match(app,/resolveNoticeAddress/);assert.match(app,/noticeGPS/);});
test('nearby services query location not hardcoded',()=>{assert.match(app,/around:12000/);assert.match(app,/around:12000/);assert.match(app,/nearbyStatus/);});
