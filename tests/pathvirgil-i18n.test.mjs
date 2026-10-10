import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {SAFETY_GUIDES,SAFETY_LABELS} from '../public/app/safety-locales.js';
import {GUIDES,LANGUAGES,SAFETY_KEYS,SAFETY_LOCALES,SAFETY_CATEGORIES,steps,t} from '../public/app/i18n.js';
const languages=Object.keys(LANGUAGES);
test('PathVirgil offers 15 offline-selectable languages',()=>{
 assert.equal(languages.length,15);assert.deepEqual(SAFETY_LOCALES,languages);
});
test('Every emergency guide has localized, nonempty steps in all 15 languages',()=>{
 for(const lang of languages){for(const category of SAFETY_CATEGORIES){
  const local=steps(category,lang);assert.equal(local.length,GUIDES[category].length,`${lang}/${category} count`);
  for(const [i,line] of local.entries()){
   assert.ok(typeof line==='string'&&line.trim().length>=15,`${lang}/${category}/${i} empty`);
   if(!['en','hi','ta','fr'].includes(lang))assert.notEqual(line,GUIDES[category][i][0],`${lang}/${category}/${i} English fallback`);
  }
 }}
});
test('All high-impact warning, status and safety labels are localized in the 11 new languages',()=>{
 const baseline=Object.keys(SAFETY_LABELS.te).sort();
 for(const [lang,values] of Object.entries(SAFETY_LABELS)){
  assert.deepEqual(Object.keys(values).sort(),baseline,`${lang} key set drift`);
  for(const key of baseline){assert.ok(values[key]?.trim().length>=2,`${lang}/${key}`);
   assert.equal(t(key,lang),values[key],`${lang}/${key} unexpectedly falls back`);
  }
 }
 assert.ok(SAFETY_KEYS.includes('noWarningsNote'));
});
test('Visible PathVirgil branding used for website and Android install prompt',async()=>{
 for(const name of ['public/app/index.html','public/index.html','public/app/manifest.webmanifest','android/AndroidManifest.xml','public/app/views.js']){
  const body=await readFile(new URL('../'+name,import.meta.url),'utf8');
  assert.match(body,/PathVirgil/,name);
 }
 const html=await readFile(new URL('../public/index.html',import.meta.url),'utf8');
 assert.match(html,/<title>PathVirgil/);
 assert.doesNotMatch(html,/>Harbor</);
});
