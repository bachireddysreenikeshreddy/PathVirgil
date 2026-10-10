// Shared API logic for the existing Worker/Next route and Cloudflare Pages Functions.
// Bindings are request scoped; never keep Cloudflare env in a module global.
import exifr from 'exifr';
import { validateReport,sha256,imageType,publicReport,cleanText,coordinate,VALID_STATUSES,distanceKm } from './domain';
import { weather,airQuality,officialAlerts,satellite,satelliteImage } from './sources';

export type HarborAPIEnv = { DB?: D1Database; BUCKET?: R2Bucket; MODERATOR_ACCESS_TOKEN?: string; JUDGE_ACCESS_TOKEN?: string; PUBLIC_APP_ORIGIN?: string };
export function createHarborHandlers(env: HarborAPIEnv) {
const json=(v:unknown,status=200)=>Response.json(v,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const random=()=>crypto.randomUUID().replaceAll('-','')+crypto.randomUUID().replaceAll('-','');
type AccessRole = 'moderator' | 'judge';
// Independent server-only access keys; judges are deliberately read-only.
async function reviewer(req:Request):Promise<AccessRole|null>{
 const provided=req.headers.get('Authorization')?.match(/^Bearer ([A-Za-z0-9_-]{32,256})$/)?.[1];
 if(!provided)return null;
 const candidate=await sha256(provided);
 const admin=env.MODERATOR_ACCESS_TOKEN;
 const judge=env.JUDGE_ACCESS_TOKEN;
 // Never promote a judge accidentally if both server secrets were set identically.
 if(admin&&judge&&admin===judge)return null;
 if(admin&&admin.length>=32&&candidate===await sha256(admin))return 'moderator';
 if(judge&&judge.length>=32&&candidate===await sha256(judge))return 'judge';
 return null;
}
function db(){if(!env.DB)throw new Error('Database unavailable');return env.DB;}
async function receiptFor(req:Request,row:any){const token=req.headers.get('authorization')?.replace(/^Bearer /,'');return !!token&&await sha256(token)===row.receipt_hash;}
function cors(req:Request,res:Response){const origin=req.headers.get('origin');if(origin==='https://appassets.androidplatform.net'||origin==='capacitor://localhost'||origin===env.PUBLIC_APP_ORIGIN){res.headers.set('Access-Control-Allow-Origin',origin);res.headers.set('Vary','Origin');res.headers.set('Access-Control-Allow-Headers','Content-Type,Authorization');res.headers.set('Access-Control-Allow-Methods','GET,POST,OPTIONS');}return res;}
async function OPTIONS(req:Request){return cors(req,new Response(null,{status:204}));}
async function GET(req:Request){try{
 const u=new URL(req.url),path=u.pathname.replace(/^\/api\//,'');const d=db();
 if(path==='health')return cors(req,json({ok:true,version:'1.0.0',now:new Date().toISOString()}));
 if(path==='session'){const role=await reviewer(req);return cors(req,json({signedIn:!!role,reviewer:!!role,role,canModerate:role==='moderator'}));}
 if(path==='weather')return cors(req,json(await weather(d,coordinate(u.searchParams.get('lat'),-90,90),coordinate(u.searchParams.get('lon'),-180,180))));
 if(path==='air-quality')return cors(req,json(await airQuality(d,coordinate(u.searchParams.get('lat'),-90,90),coordinate(u.searchParams.get('lon'),-180,180))));
 if(path==='alerts')return cors(req,json(await officialAlerts(d,coordinate(u.searchParams.get('lat'),-90,90),coordinate(u.searchParams.get('lon'),-180,180))));
 if(path==='satellite')return cors(req,json(await satellite(d)));
 if(path==='satellite/image'){const r=await satelliteImage(u.searchParams.get('time')||'');return cors(req,new Response(r.body,{headers:{'Content-Type':'image/png','Cache-Control':'public,max-age=900'}}));}
 if(path==='reports'){
  const demo=u.searchParams.get('demo')==='1'?1:0;
  const lat=coordinate(u.searchParams.get('lat')||'12.62',-90,90),lon=coordinate(u.searchParams.get('lon')||'80.19',-180,180);
  // Pending reports are shown only as unverified, approximate community observations.
  // No unreviewed descriptions, landmark details, or precise coordinates are published.
  const r=await d.prepare("SELECT * FROM reports WHERE demo=? AND status IN ('pending','reviewed','corroborated') AND expires_at>? ORDER BY updated_at DESC LIMIT 100").bind(demo,new Date().toISOString()).all();
  return cors(req,json({reports:r.results.filter((v:any)=>distanceKm(lat,lon,v.lat,v.lon)<30).map((v:any)=>publicReport(v)),fetchedAt:new Date().toISOString()}));
 }
 if(path==='notices'){const rows=await d.prepare("SELECT * FROM notices WHERE status='active' AND expires_at>? ORDER BY created_at DESC LIMIT 30").bind(new Date().toISOString()).all();return cors(req,json({notices:rows.results.map((v:any)=>({...v,body:JSON.parse(v.body)}))}));}
 if(path==='review'){
  const role=await reviewer(req);if(!role)return cors(req,json({error:'Reviewer or judge access required'},403));
  const rows=await d.prepare('SELECT * FROM reports ORDER BY created_at DESC LIMIT 100').all();
  return cors(req,json({reports:rows.results.map((v:any)=>({...publicReport(v),checks:JSON.parse(v.checks),hasPhoto:!!v.photo_key,description:v.description,landmark:v.landmark,lat:v.lat,lon:v.lon})),reviewer:true,role,canModerate:role==='moderator'}));
 }
 const match=path.match(/^reports\/([a-f0-9-]+)(\/photo|\/audit)?$/);
 if(match){
  const row=await d.prepare('SELECT * FROM reports WHERE id=?').bind(match[1]).first<any>();if(!row)return json({error:'Report not found'},404);
  if(!await reviewer(req)&&!await receiptFor(req,row))return json({error:'Access required'},403);
  if(match[2]==='/photo'){
   if(!row.photo_key)return json({error:'Photo unavailable'},404);
   let data:BodyInit;
   if(String(row.photo_key).startsWith('d1:')){
    const photo=await d.prepare('SELECT bytes FROM report_photos WHERE report_id=?').bind(row.id).first<{bytes:number[]|Uint8Array|ArrayBuffer}>();
    if(!photo)return json({error:'Photo unavailable'},404);
    data=Uint8Array.from(photo.bytes instanceof ArrayBuffer?new Uint8Array(photo.bytes):photo.bytes);
   }else{
    if(!env.BUCKET)return json({error:'Photo unavailable'},404);
    const object=await env.BUCKET.get(row.photo_key);if(!object)return json({error:'Photo unavailable'},404);
    data=object.body;
   }
   return cors(req,new Response(data,{headers:{'Content-Type':row.photo_type||'image/jpeg','Cache-Control':'private,no-store','X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY'}}));
  }
  if(match[2]==='/audit'){const rows=await d.prepare('SELECT action,note,created_at FROM audit WHERE report_id=? ORDER BY created_at').bind(row.id).all();return cors(req,json({events:rows.results}));}
  return cors(req,json({...publicReport(row),description:row.description,landmark:row.landmark,lat:row.lat,lon:row.lon,checks:JSON.parse(row.checks)}));
 }
 return json({error:'Not found'},404);
 }catch(e){return cors(req,json({error:e instanceof Error?e.message:'Source unavailable'},503));}}
async function POST(req:Request){try{
 const u=new URL(req.url),path=u.pathname.replace(/^\/api\//,'');const d=db();
 const origin=req.headers.get('origin');
 if(origin&&origin!==u.origin&&origin!==env.PUBLIC_APP_ORIGIN&&!['https://appassets.androidplatform.net','capacitor://localhost'].includes(origin))return json({error:'Origin not permitted'},403);
 if(path==='reports'){
  if(Number(req.headers.get('content-length')||0)>5*1024*1024)return json({error:'Photo is too large. Use an image under 4 MB.'},413);
  const form=await req.formData();let data:Record<string,unknown>;try{data=JSON.parse(String(form.get('report')));}catch{return json({error:'Invalid report'},400);}
  let input;try{input=validateReport(data);}catch(e){return json({error:(e as Error).message},400);}
  const providedReceipt=String(data.receipt||'');if(!/^[a-f0-9]{64}$/.test(providedReceipt))return json({error:'Invalid receipt'},400);
  const receiptHash=await sha256(providedReceipt);
  const existing=await d.prepare('SELECT * FROM reports WHERE client_id=? AND receipt_hash=?').bind(input.clientId,receiptHash).first<any>();
  if(existing)return cors(req,json({id:existing.id,status:existing.status,duplicateSubmission:true},200));
  const hour=new Date().toISOString().slice(0,13),ip=req.headers.get('cf-connecting-ip')||'unknown';
  const rateId=await sha256(ip+':'+hour);const limit=await d.prepare('INSERT INTO rate_limits(id,count,expires_at) VALUES(?,1,?) ON CONFLICT(id) DO UPDATE SET count=count+1 RETURNING count').bind(rateId,new Date(Date.now()+3600000).toISOString()).first<any>();
  if(limit.count>12)return cors(req,json({error:'Please wait before sending more reports.'},429));
  const id=crypto.randomUUID(),now=new Date().toISOString(),demo=data.demo===true?1:0;
  const checks:any={version:1,automatedAt:now,ai:{status:'not_run',note:'No detector result is accepted as proof of the incident.'},provenance:{status:'not_verified'},corroboration:{status:'needs_review'},flags:[]};
  let photoKey:null|string=null,photoHash:null|string=null,photoType:null|string=null,photoBytes:Uint8Array|null=null;
  const photo=form.get('photo');
  if(photo instanceof File&&photo.size){
   if(photo.size>4*1024*1024)return json({error:'Photo must be under 4 MB'},413);
   const bytes=await photo.arrayBuffer();photoType=imageType(new Uint8Array(bytes));if(!photoType)return json({error:'Use a JPEG, PNG, or WebP photograph'},400);
   if(!env.BUCKET&&photo.size>300000)return json({error:'Please select a photo that can compress to 300 KB. Re-select it and retry.'},413);
   photoHash=await sha256(bytes);
   const duplicate=await d.prepare('SELECT id FROM reports WHERE photo_hash=? AND demo=? LIMIT 1').bind(photoHash,demo).first();
   checks.duplicate={found:!!duplicate};if(duplicate)checks.flags.push('Image already appears in another report; it is not independent corroboration.');
   try{const meta=await exifr.parse(bytes,{gps:true,tiff:true,exif:true,iptc:false,xmp:false,icc:false,jfif:false,ihdr:false});
    checks.metadata={available:!!meta?.DateTimeOriginal||Number.isFinite(meta?.latitude),capturedAt:meta?.DateTimeOriginal?new Date(meta.DateTimeOriginal).toISOString():null};
    if(Number.isFinite(meta?.latitude)&&Number.isFinite(meta?.longitude)){const delta=distanceKm(input.lat,input.lon,meta.latitude,meta.longitude);checks.metadata.locationDistanceKm=Number(delta.toFixed(2));if(delta>5)checks.flags.push('Photo coordinates differ from the reported location by more than 5 km.');}
    if(meta?.DateTimeOriginal&&Math.abs(new Date(meta.DateTimeOriginal).getTime()-Date.parse(input.observedAt))>86400000)checks.flags.push('Photo date and observation date differ by more than one day; metadata can be edited.');
   }catch{checks.metadata={available:false};}
   const text=new TextDecoder('latin1').decode(bytes);checks.provenance={status:/c2pa|jumb/i.test(text)?'credentials_present_not_validated':'credentials_absent',note:'Presence or absence does not establish authenticity.'};
   if(/(Stable Diffusion|Midjourney|DALL-E|ComfyUI)/i.test(text))checks.flags.push('Generator-related metadata found; requires review and is not a reliable standalone verdict.');
   photoKey=env.BUCKET?'reports/'+id:'d1:'+id;
   if(env.BUCKET)await env.BUCKET.put(photoKey,bytes,{httpMetadata:{contentType:photoType}});
   else photoBytes=new Uint8Array(bytes);
  }else checks.flags.push('No photo supplied. Seek independent evidence.');
  if(Date.now()-Date.parse(input.observedAt)>6*3600000)checks.flags.push('Observation is more than 6 hours old.');
  const nearby=await d.prepare("SELECT lat,lon,photo_hash FROM reports WHERE category=? AND observed_at>? AND status IN ('pending','corroborated','reviewed') AND demo=? LIMIT 80").bind(input.category,new Date(Date.parse(input.observedAt)-3*3600000).toISOString(),demo).all<any>();
  checks.nearbyReports=nearby.results.filter((v:any)=>distanceKm(input.lat,input.lon,v.lat,v.lon)<1&&(!photoHash||v.photo_hash!==photoHash)).length;
  checks.note='These are evidence checks, not confirmation. Independent review is required.';
  const insertReport=d.prepare('INSERT INTO reports(id,client_id,receipt_hash,category,description,landmark,lat,lon,observed_at,created_at,updated_at,expires_at,status,photo_key,photo_hash,photo_type,checks,demo) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(id,input.clientId,receiptHash,input.category,input.description,input.landmark,input.lat,input.lon,input.observedAt,now,now,new Date(Date.parse(input.observedAt)+24*3600000).toISOString(),'pending',photoKey,photoHash,photoType,JSON.stringify(checks),demo);
  try{
   if(photoBytes){
    // A D1 batch is transactional: never acknowledge a report without its evidence image.
    await d.batch([insertReport,d.prepare('INSERT INTO report_photos(report_id,bytes,content_type,created_at) VALUES(?,?,?,?)').bind(id,photoBytes,photoType,now)]);
   } else await insertReport.run();
   // Reclaim expired evidence as new reports arrive; photos remain private throughout their life.
   await d.prepare('DELETE FROM report_photos WHERE report_id IN (SELECT id FROM reports WHERE expires_at<?)').bind(now).run().catch(()=>{});
  }catch(e){if(photoKey&&env.BUCKET)await env.BUCKET.delete(photoKey);const retry=await d.prepare('SELECT id,status FROM reports WHERE client_id=? AND receipt_hash=?').bind(input.clientId,receiptHash).first<any>();if(retry)return cors(req,json({...retry,duplicateSubmission:true}));throw e;}
  return cors(req,json({id,status:'pending',checks},201));
 }
 const match=path.match(/^review\/([a-f0-9-]+)$/);
 if(match){
  const actor=await reviewer(req);if(actor!=='moderator')return cors(req,json({error:'Moderator write access required'},403));
  const body=await req.json() as any;const status=String(body.status),note=cleanText(body.note,800);
  if(!VALID_STATUSES.includes(status as any)||status==='pending'||note.length<10)return json({error:'Choose a decision and give a reason (at least 10 characters).'},400);
  const version=Number(body.version);if(!Number.isInteger(version))return json({error:'Version is required'},400);
  const existing=await d.prepare('SELECT * FROM reports WHERE id=?').bind(match[1]).first<any>();if(!existing)return json({error:'Not found'},404);
  if(status==='reviewed'&&!body.independentEvidence)return json({error:'Record independent evidence before confirming.'},400);
  const hours=Math.min(48,Math.max(1,Number(body.hours)||6)),now=new Date().toISOString(),expiry=new Date(Date.now()+hours*3600000).toISOString();
  const results=await d.batch([
   d.prepare('UPDATE reports SET status=?,review_note=?,reviewer=?,updated_at=?,expires_at=?,version=version+1 WHERE id=? AND version=?').bind(status,note,actor,now,expiry,match[1],version),
   d.prepare('INSERT INTO audit(id,report_id,actor,action,note,created_at) SELECT ?,id,?,?,?,? FROM reports WHERE id=? AND version=? AND updated_at=?').bind(crypto.randomUUID(),actor,status,note,now,match[1],version+1,now)
  ]);
  if(!results[0].meta.changes)return json({error:'This report changed. Refresh before reviewing.'},409);
  return cors(req,json({ok:true,status,version:version+1}));
 }
 if(path==='notices'){
  if((await reviewer(req))!=='moderator')return cors(req,json({error:'Moderator write access required'},403));
  const data=await req.json() as any;const kind=String(data.kind);if(!['open','closed','unknown'].includes(String(data.availability||'unknown')))return json({error:'Invalid availability'},400);
  if(!['shelter','guidance'].includes(kind))return json({error:'Invalid notice type'},400);
  const body={name:cleanText(data.name,120),detail:cleanText(data.detail,800),sourceUrl:cleanText(data.sourceUrl,500),lat:coordinate(data.lat,-90,90),lon:coordinate(data.lon,-180,180),availability:String(data.availability||'unknown'),sourceType:'app_reviewed',demo:!!data.demo};
  if(!/^https:\/\//.test(body.sourceUrl)||body.name.length<3)return json({error:'A source URL and name are required'},400);
  const id=crypto.randomUUID(),now=new Date().toISOString(),expiry=new Date(Date.now()+6*3600000).toISOString();
  await d.prepare('INSERT INTO notices(id,kind,body,created_at,expires_at,status) VALUES(?,?,?,?,?,?)').bind(id,kind,JSON.stringify(body),now,expiry,'active').run();return cors(req,json({id},201));
 }
 return json({error:'Not found'},404);
 }catch(e){return cors(req,json({error:e instanceof Error?e.message:'Request failed'},500));}}

return {GET, POST, OPTIONS};
}
