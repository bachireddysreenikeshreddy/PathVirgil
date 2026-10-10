import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import {Window} from 'happy-dom';
import 'fake-indexeddb/auto';
import {readFile} from 'node:fs/promises';
import {get,allReports} from '../public/app/storage.js';
const win=new Window({url:'https://harbor.test/app/index.html'});
win.document.write(await readFile('public/app/index.html','utf8'));
for(const k of ['window','document','location','navigator','FormData','requestAnimationFrame'])Object.defineProperty(globalThis,k,{value:k==='window'?win:win[k],configurable:true,writable:true});
const interval=globalThis.setInterval;globalThis.setInterval=(...v)=>{const id=interval(...v);id.unref?.();return id;};
Object.defineProperty(win.navigator,'onLine',{get:()=>false});
globalThis.fetch=async url=>{if(String(url).includes('data/'))return new Response(await readFile('public/app/'+String(url).replace('./','')));throw new Error('Offline test');};
await import('../public/app/app.js');
const settle=()=>new Promise(r=>setTimeout(r,60));
const click=selector=>{const el=document.querySelector(selector);assert.ok(el,selector);el.click();return el;};
async function route(page){location.hash=page;await settle();}
after(()=>{win.happyDOM.abort();win.close();});
test('offline interface renders, translates and opens essential guidance',async()=>{await settle();assert.match(document.body.textContent,/PathVirgil/);const lang=document.querySelector('#language');lang.value='ta';lang.dispatchEvent(new win.Event('change',{bubbles:true}));await settle();assert.equal(document.documentElement.lang,'ta');click('[data-action="guide:flood"]');assert.match(document.querySelector('#modal').textContent,/வெள்ளநீரில்/);click('[data-action="close"]');assert.equal(await get('lang'),'ta');});
test('offline report stays queued until an actual server acknowledgement',async()=>{await route('report');const f=document.querySelector('#report-form');f.elements.landmark.value='Offline test bridge';f.elements.description.value='Simulated broken approach in an offline queue test.';click('[data-action="approximate-report-location"]');f.dispatchEvent(new win.Event('submit',{bubbles:true,cancelable:true}));await settle();const reports=await allReports();assert.equal(reports.length,1);assert.equal(reports[0].serverId,undefined);assert.equal(reports[0].status,'pending');assert.equal(location.hash,'#community');});
test('simulation decisions remain separate from live public reports',async()=>{click('[data-action="demo"]');await settle();await route('review');const f=document.querySelector('.review-form');assert.ok(f);f.elements.status.value='reviewed';f.elements.note.value='Training: checked local authority confirmation fixture.';f.elements.independentEvidence.checked=true;f.dispatchEvent(new win.Event('submit',{bubbles:true,cancelable:true}));await settle();const s=await get('scenario');assert.equal(s.reports[0].status,'reviewed');click('[data-action="live"]');await settle();await route('community');assert.doesNotMatch(document.querySelector('main').textContent,/Practice bridge/);});
test('offline hotel card saves and stays available without network',async()=>{await route('offline');const f=document.querySelector('#hotel-form');f.elements.name.value='Test hotel';f.elements.address.value='Test address';f.dispatchEvent(new win.Event('submit',{bubbles:true,cancelable:true}));await settle();assert.equal((await get('hotel')).name,'Test hotel');click('[data-action="help-card"]');assert.match(document.querySelector('#modal').textContent,/Test hotel/);});

test('new reporting form omits coordinate widgets, requires explicit location',async()=>{await route('report');const f=document.querySelector('#report-form');assert.equal(f.querySelector('#lat').type,'hidden');assert.equal(f.querySelector('#lon').type,'hidden');assert.ok(f.querySelector('[data-action="form-locate"]'));assert.ok(f.querySelector('[data-action="approximate-report-location"]'));assert.ok([...f.elements.category.options].some(o=>o.value==='other'));});
