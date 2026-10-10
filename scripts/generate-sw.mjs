import {readdir,readFile,writeFile,copyFile,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
async function walk(dir){const out=[];for(const e of await readdir(dir,{withFileTypes:true})){if(e.name==='ml')continue;const p=dir+'/'+e.name;if(e.isDirectory())out.push(...await walk(p));else out.push(p);}return out;}
const files=(await walk('public/app')).filter(p=>!p.endsWith('ai-worker.js')).sort();
const hash=createHash('sha256');for(const f of files){hash.update(f);hash.update(await readFile(f));}
const prelude='const CACHE="pathvirgil-core-'+hash.digest('hex').slice(0,12)+'";\nconst CORE='+JSON.stringify(files.map(f=>f.slice('public'.length)))+';\n';
await writeFile('public/sw.js',prelude+await readFile('scripts/sw-template.js','utf8'));
// Pages requires a root index.html for the bare pages.dev URL. The <base> in
// the copied HTML keeps all assets inside /app/. Never use a root redirect.
await copyFile('public/app/index.html','public/index.html');
await rm('public/_redirects',{force:true});
console.log('Offline manifest:',files.length,'files; root homepage prepared');
