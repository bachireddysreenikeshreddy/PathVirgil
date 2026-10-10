#!/usr/bin/env node
// Non-destructive smoke test for a deployed Harbor origin.
const arg=process.argv[2];
if(!arg){console.error('Usage: node scripts/check-production.mjs https://your-domain.com');process.exit(2);}
let url;try{url=new URL(arg);if(url.protocol!=='https:'||url.pathname!=='/'||url.search||url.hash)throw Error();}catch{console.error('Provide the deployed HTTPS origin only.');process.exit(2);}
let failures=0;
for(const [path,check] of [
 ['/',async r=>(await r.text()).includes('<title>Harbor')],
 ['/app/index.html',async r=>(await r.text()).includes('Harbor')],
 ['/app/config.js',async r=>(await r.text()).includes('backendOrigin')],
 ['/sw.js',async r=>(await r.text()).includes('CACHE')],
 ['/api/health',async r=>(await r.json()).ok===true]
]){
 try{
   const r=await fetch(new URL(path,url),{signal:AbortSignal.timeout(12000),cache:'no-store'});
   const ok=r.ok&&(await check(r));console.log((ok?'PASS':'FAIL'),r.status,path);if(!ok)failures++;
 }catch(e){console.log('FAIL',path,String(e));failures++;}
}
console.log(failures?'Deployment has '+failures+' failed checks.':'Basic production checks passed. Now test reports, weather, moderation and offline mode manually.');
process.exitCode=failures?1:0;
