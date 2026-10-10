import {t,steps} from './i18n.js';
import {sources,contacts,makeDemo,PACK_VERSION,guideSources} from './data.js';
import {VERSION,apiBase,NATIVE,PILOT} from './config.js';
import {get,put,allReports,saveReport,deleteReport,proveStorage,token,escapeHTML as h} from './storage.js';
import {icon as I} from './icons.js';
import {createViews} from './views.js';

const S={lang:'en',page:'home',demo:false,testOffline:false,ready:false,saving:false,loading:false,alertError:false,alerts:[],reports:[],notices:[],outbox:[],reviewReports:[],scenario:makeDemo(),weather:null,airQuality:null,satellite:null,showSatellite:false,frame:7,playing:false,lat:PILOT.lat,lon:PILOT.lon,gps:null,locationName:'Mamallapuram',locationPrompted:false,geo:null,helpPlaces:[],nearbyLive:[],nearbyStatus:'',nearbyLastKey:'',noticeLocation:null,session:null,draft:{},photo:null,photoURL:null,hotel:null,kitAt:null};
const T=k=>t(k,S.lang),connected=()=>navigator.onLine&&!S.testOffline;
const fmt=value=>{const d=new Date(value);return Number.isNaN(d.getTime())?'—':new Intl.DateTimeFormat({en:'en-IN',hi:'hi-IN',ta:'ta-IN',fr:'fr-FR'}[S.lang],{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit',timeZoneName:'short'}).format(d);};
const localNow=()=>{const d=new Date();return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16);};
// Resize photos locally so Cloudflare D1 (Free tier) can store them without R2 or billing activation.
// Canvas re-encoding also removes location metadata; any provenance must come from report review.
async function compactEvidence(original){
 if(!['image/jpeg','image/png','image/webp'].includes(original.type)||original.size>12*1024*1024)throw Error('Choose a JPEG, PNG or WebP image smaller than 12 MB.');
 const img=await createImageBitmap(original);
 try {
  for(const side of [1200,960,768,600])for(const quality of [.72,.58,.46]){
   const ratio=Math.min(1,side/Math.max(img.width,img.height)),canvas=document.createElement('canvas');
   canvas.width=Math.max(1,Math.round(img.width*ratio));canvas.height=Math.max(1,Math.round(img.height*ratio));
   canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);
   const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',quality));
   if(blob&&blob.size<=230000)return new File([blob],'pathvirgil-evidence.jpg',{type:'image/jpeg',lastModified:Date.now()});
  }
  throw Error('This photo could not be compressed below 230 KB; try a simpler or smaller photo.');
 }finally{img.close?.();}
}

const inPilot=()=>Math.abs(S.lat-PILOT.lat)<.15&&Math.abs(S.lon-PILOT.lon)<.15;
const activeAlerts=()=> (S.demo?S.scenario.alerts:inPilot()?S.alerts:[]).filter(a=>Date.parse(a.expiresAt)>Date.now());
const publicReports=()=> (S.demo?S.scenario.reports:S.reports).filter(a=>['pending','reviewed','corroborated'].includes(a.status)&&Date.parse(a.expiresAt)>Date.now());
const places=()=>[...(S.demo?S.scenario.shelters:S.notices.filter(n=>n.kind==='shelter'&&!n.body.demo&&Date.parse(n.expires_at)>Date.now()).map(n=>({...n.body,id:n.id,kind:n.kind,expiresAt:n.expires_at,source:'App reviewer'}))),...(S.nearbyLive.length?S.nearbyLive:S.helpPlaces)].filter(p=>Math.abs(p.lat-S.lat)<.135&&Math.abs(p.lon-S.lon)<.135);
const V=createViews({S,T,h,I,fmt,steps,activeAlerts,publicReports,places,connected,localNow,NATIVE});
let map,overlay,baseLayer,playTimer,toastTimer,installPrompt,syncing=false,refreshing=false,speechText='',aiWorker,privatePhotoURL;
const $=id=>document.getElementById(id);
function toast(text){$('toast').textContent=text;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),5500);}
function render(){if(map){map.remove();map=null;overlay=null;baseLayer=null;}clearInterval(playTimer);S.playing=false;document.documentElement.lang=S.lang;document.documentElement.dir=S.lang==='ar'?'rtl':'ltr';$('app').innerHTML=V.shell((V[S.page]||V.home)());if(['nearby','weather'].includes(S.page))requestAnimationFrame(mountMap);if(S.page==='offline')navigator.storage?.estimate?.().then(e=>{const el=$('storage-info');if(el)el.textContent=(e.usage/1048576).toFixed(1)+' MB / '+(e.quota/1048576).toFixed(0)+' MB';}).catch(()=>{});}
function quietRender(){if(!['report','review','offline'].includes(S.page))render();}
function modal(title,body){$('modal').innerHTML='<div class="row between"><h2>'+h(title)+'</h2><button class="icon-btn" data-action="close" aria-label="'+T('close')+'">'+I('close')+'</button></div>'+body;$('modal').showModal();}
function guidance(category){speechText=steps(category,S.lang).join(' ');const source=sources[guideSources[category]??2];modal(T(category),'<ol class="bullet-steps">'+steps(category,S.lang).map(s=>'<li>'+h(s)+'</li>').join('')+'</ol><p class="small muted">'+T('localPriority')+'</p><div class="row" style="margin:20px 0">'+V.btn('readAloud','speak','volume','light')+V.btn('helpCard','help-card','globe','light')+'</div><a class="small-link" href="'+h(source.url)+'" target="_blank" rel="noopener">'+h(source.name)+'</a>');}
function helpCard(){const key='helpPhrase';speechText=T(key);modal(T('helpCard'),'<div class="help-card"><p class="help-phrase">'+h(T(key))+'</p><p lang="ta" class="help-phrase local">'+h(t(key,'ta'))+'</p>'+(S.hotel?'<hr><strong>'+h(S.hotel.name)+'</strong><p>'+h(S.hotel.address)+'</p>':'')+'</div><a class="btn" href="tel:112">'+I('phone')+T('emergency')+' · 112</a><p class="small muted" style="margin-top:18px">'+T('callNote')+'</p>');}
function alertDetail(id){const a=activeAlerts().find(a=>a.id===id);if(!a)return;modal(T(a.category)+' · '+T(a.severity),'<span class="pill amber">'+T(S.demo?'demo':'official')+'</span><ol class="bullet-steps">'+steps(a.category,S.lang).map(s=>'<li>'+h(s)+'</li>').join('')+'</ol><p class="small muted">'+T('expires')+': '+h(fmt(a.expiresAt))+'</p><p class="small muted">'+h(a.area||PILOT.name)+'</p><details style="margin:18px 0"><summary>'+T('detailsOriginal')+'</summary><p class="small muted">'+T('originalNote')+'</p><div class="original">'+h([a.title,a.description,a.instruction].filter(Boolean).join('\n\n'))+'</div></details>'+(a.sourceUrl?'<a href="'+h(a.sourceUrl)+'" target="_blank" rel="noopener">'+h(a.source||'Source')+'</a>':''));}
function reportDetail(id){const r=publicReports().find(r=>r.id===id);if(!r)return;modal(T(r.category),V.badge(r.status)+(r.status==='pending'?'<p class="notice amber"><strong>UNVERIFIED COMMUNITY REPORT</strong> · Not an official alert. Details and exact location are hidden until reviewed.</p>':'<p class="small muted">Reviewed by app moderators · not an official government warning.</p>')+'<p style="margin:15px 0">'+h(r.landmark)+'</p><ol class="bullet-steps">'+steps(r.category,S.lang).map(s=>'<li>'+h(s)+'</li>').join('')+'</ol><p class="small muted">'+T('expires')+': '+h(fmt(r.expiresAt))+'</p><details><summary>'+T('detailsOriginal')+'</summary><div class="original">'+h(r.description)+'</div><p>'+h(r.reviewNote||'')+'</p></details>');}
function mountMap(){
 if(!globalThis.L)return;
 const weather=S.page==='weather',id=weather?'weather-map':'places-map';if(!$(id))return;
 map=L.map(id,{zoomControl:true,attributionControl:true}).setView([S.lat,S.lon],weather?11:14);
 if(connected())baseLayer=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap contributors'}).addTo(map);
 if(S.geo&&Math.abs(S.lat-PILOT.lat)<.15&&Math.abs(S.lon-PILOT.lon)<.15){L.geoJSON(S.geo,{style:{color:'#688680',weight:2,opacity:.6}}).addTo(map);map.attributionControl.addAttribution('Offline map © OpenStreetMap · ODbL');}
 if(S.gps)L.circle([S.lat,S.lon],{radius:Math.min(2000,Math.max(5,S.gps.accuracy)),color:'#086ca6',fillColor:'#5aa9dd',fillOpacity:.12,weight:2}).addTo(map).bindPopup(h(T('locate'))+' · ±'+Math.round(S.gps.accuracy)+'m');
 L.circleMarker([S.lat,S.lon],{radius:8,color:'#075e92',fillColor:'#2e99d9',fillOpacity:1,weight:3}).addTo(map).bindPopup(h(S.locationName));
 places().filter(p=>Math.abs(p.lat-S.lat)<.3&&Math.abs(p.lon-S.lon)<.3).forEach(p=>L.circleMarker([p.lat,p.lon],{radius:7,color:p.demo?'#b36b28':'#246f62',fillColor:'#fff',fillOpacity:1,weight:3}).addTo(map).bindPopup('<strong>'+h(p.name)+'</strong><p>'+h(p.address||'Full address not listed')+'</p><small>'+T('safetyCopy')+'</small>'));
 publicReports().forEach(r=>L.circleMarker([r.lat,r.lon],{radius:9,color:'#b76939',fillOpacity:.3}).addTo(map).bindPopup('<strong>'+T(r.category)+'</strong><p>'+h(r.landmark)+'</p><small>'+T(r.status)+'</small>'));
 if(weather)showFrame();
}

function showFrame(){
 if(!map||S.page!=='weather')return;
 if(overlay){map.removeLayer(overlay);overlay=null;}
 const time=S.satellite?.frames?.[S.frame],label=$('frame-label');
 if(!S.showSatellite){if(label)label.textContent='Street map centred on your location. Satellite layer is off for clarity.';return;}
 if(!connected()||!time){if(label)label.textContent=T('imageryOffline');return;}
 if(label)label.textContent='Infrared satellite (cloud temperatures, not surface flooding) · '+fmt(time)+(S.satellite.stale?' · '+T('stale'):'');
 const base=apiBase();if(!base)return;
 const bounds=S.satellite?.bounds||[[0,55],[35,105]];
 overlay=L.imageOverlay(base+'/satellite/image?time='+encodeURIComponent(time),bounds,{opacity:.32,attribution:'© EUMETSAT'}).addTo(map);
 overlay.on('error',()=>{if($('frame-label'))$('frame-label').textContent=T('unavailable');});
}

async function api(path,options={}){if(!connected())throw new Error(T('offlineStatus'));const base=apiBase();if(!base)throw new Error(T('backendRequired'));const headers=new Headers(options.headers||{});const key=sessionStorage.getItem('harbor-reviewer-token');if(key&&(path==='session'||path.startsWith('review')||path==='notices'&&options.method==='POST'))headers.set('Authorization','Bearer '+key);const r=await fetch(base+'/'+path,{credentials:NATIVE?'omit':'same-origin',signal:AbortSignal.timeout(25000),...options,headers});const body=await r.json();if(!r.ok)throw new Error(body.error||T('unavailable'));return body;}
async function loadNearby(){
 if(!connected())return;
 const key=S.lat.toFixed(2)+','+S.lon.toFixed(2);
 if(S.nearbyLastKey===key)return;
 S.nearbyLastKey=key;S.nearbyStatus='Checking nearby map listings…';
 const query='[out:json][timeout:15];(nwr["amenity"~"^(hospital|police|fire_station|clinic)$"](around:12000,'+S.lat+','+S.lon+');nwr["emergency"="assembly_point"](around:12000,'+S.lat+','+S.lon+'););out center 70;';
 try{const r=await fetch('https://overpass.kumi.systems/api/interpreter',{method:'POST',body:new URLSearchParams({data:query}),signal:AbortSignal.timeout(17000)});if(!r.ok)throw Error('Mapping service unavailable');const json=await r.json();const hits=(json.elements||[]).map(x=>{const tags=x.tags||{},lat=x.lat??x.center?.lat,lon=x.lon??x.center?.lon;if(!Number.isFinite(lat)||!Number.isFinite(lon))return null;const address=[tags['addr:housenumber'],tags['addr:street'],tags['addr:suburb'],tags['addr:city'],tags['addr:postcode']].filter(Boolean).join(', ');return {id:'live-'+x.type+'-'+x.id,name:tags.name||({'hospital':'Hospital','police':'Police station','clinic':'Clinic','fire_station':'Fire station'}[tags.amenity]||'Emergency assembly point'),lat,lon,kind:tags.amenity==='hospital'||tags.amenity==='clinic'?'hospital':tags.amenity==='police'?'police':'shelter',address:address||'Street address not published — inspect map listing',phone:tags['contact:phone']||tags.phone||null,availability:'unknown',source:'OpenStreetMap community listing · unverified',sourceUrl:'https://www.openstreetmap.org/'+x.type+'/'+x.id};}).filter(Boolean);hits.sort((a,b)=>(a.lat-S.lat)**2+(a.lon-S.lon)**2-(b.lat-S.lat)**2-(b.lon-S.lon)**2);S.nearbyLive=hits.slice(0,35);S.nearbyStatus=hits.length?'Live community map listings near selected location · verify numbers and opening hours':'No live listings found. Try official local services or 112.';}catch(e){S.nearbyStatus='Live listings unavailable. Showing any applicable saved records; do not assume they are current.';S.nearbyLastKey='';}if(S.page==='nearby')quietRender();
}
async function resolveNoticeAddress(address){
 if(!connected())throw Error('Address lookup requires internet.');
 const u='https://nominatim.openstreetmap.org/search?format=json&limit=3&q='+encodeURIComponent(address);
 const r=await fetch(u,{headers:{'Accept':'application/json'},signal:AbortSignal.timeout(12000)});if(!r.ok)throw Error('Address lookup unavailable');const a=await r.json();if(!a.length)throw Error('Address not found: provide a more precise address.');return {lat:Number(a[0].lat),lon:Number(a[0].lon),address:a[0].display_name};
}
function noticeGPS(){return new Promise((resolve,reject)=>{if(!navigator.geolocation)return reject(Error('Location unsupported'));navigator.geolocation.getCurrentPosition(p=>resolve({lat:p.coords.latitude,lon:p.coords.longitude,address:'Device GPS position (±'+Math.round(p.coords.accuracy)+' m)'}),e=>reject(Error(e.message)),{enableHighAccuracy:true,timeout:12000,maximumAge:0});});}
async function refresh(){if(!connected()||refreshing)return;refreshing=true;S.loading=true;
 const q='?lat='+S.lat.toFixed(5)+'&lon='+S.lon.toFixed(5),keys=['weather','air-quality','alerts','reports','notices','satellite','session'];
 const results=await Promise.allSettled(keys.map(k=>k==='alerts'&&!inPilot()?Promise.reject(Error('Pilot-only official alert feed; do not infer safety outside covered area.')):api(k+(['weather','air-quality','alerts','reports'].includes(k)?q:''))));
 for(let i=0;i<keys.length;i++){const k=keys[i],r=results[i];if(r.status==='fulfilled'){const v=r.value;if(k==='alerts'){S.alerts=v.alerts;S.alertsFetched=v.fetchedAt;S.alertError=!!(v.stale||v.partial);await put('alertSnapshot',v).catch(()=>{});}else if(k==='reports'){S.reports=v.reports;await put(k,v.reports).catch(()=>{});}else if(k==='notices'){S.notices=v.notices;await put(k,v.notices).catch(()=>{});}else{S[k==='air-quality'?'airQuality':k]=v;if(k!=='session')await put(k==='air-quality'?'airQuality':k,v).catch(()=>{});}}else if(k==='alerts'){S.alertError=true;if(!inPilot()){S.alerts=[];S.alertsFetched=null;}}else if(k==='weather'&&S.weather)S.weather.stale=true;}
 S.loading=false;refreshing=false;quietRender();loadNearby().catch(()=>{});
}
function workerMessage(worker,type){return new Promise((resolve,reject)=>{const ch=new MessageChannel(),timer=setTimeout(()=>reject(new Error(T('unavailable'))),35000);ch.port1.onmessage=e=>{clearTimeout(timer);ch.port1.close();resolve(e.data);};worker.postMessage({type},[ch.port2]);});}
async function checkOffline(force=false){S.ready=false;await proveStorage();if(NATIVE){const r=await Promise.all(['./data/pilot-map.json','./data/places.json'].map(u=>fetch(u)));if(r.some(v=>!v.ok))throw new Error(T('notReady'));S.ready=true;}else{if(!('serviceWorker' in navigator))throw new Error(T('notReady'));const registration=await navigator.serviceWorker.register('/sw.js',{scope:'/'});const ready=await Promise.race([navigator.serviceWorker.ready,new Promise((_,reject)=>setTimeout(()=>reject(new Error(T('notReady'))),20000))]);const worker=ready.active||registration.active;if(!worker)throw new Error(T('notReady'));const result=await workerMessage(worker,force?'SAVE':'CHECK');S.ready=!!result.ready;if(!S.ready)throw new Error(T('notReady')+' ('+(result.missing?.length||0)+')');}S.kitAt=new Date().toISOString();await put('kit',{at:S.kitAt,version:PACK_VERSION});return true;}
async function saveOffline(force=true){if(S.saving)return;S.saving=true;render();try{await checkOffline(force);toast(T('offlineReady'));}catch(e){toast(e.message);}finally{S.saving=false;render();}}
async function loadOutbox(){S.outbox=(await allReports()).filter(r=>!!r.demo===S.demo).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));}
async function sync(){if(syncing||!connected()||S.demo)return;syncing=true;try{const rows=await allReports();for(const r of rows.filter(v=>!v.demo)){if(!r.serverId){try{const form=new FormData();form.append('report',JSON.stringify({clientId:r.clientId,receipt:r.receipt,category:r.category,description:r.description,landmark:r.landmark,lat:r.lat,lon:r.lon,observedAt:r.observedAt}));if(r.photo){if(r.photo.size>230000){r.photo=await compactEvidence(r.photo);await saveReport(r);}form.append('photo',r.photo,'evidence.jpg');}const ack=await api('reports',{method:'POST',body:form});r.serverId=ack.id;r.status=ack.status;r.error=null;await saveReport(r);}catch(e){r.error=e.message;await saveReport(r);}}else{try{const latest=await api('reports/'+r.serverId,{headers:{Authorization:'Bearer '+r.receipt}});r.status=latest.status;r.error=null;await saveReport(r);}catch{/* Keep the last acknowledged state. */}}}await loadOutbox();quietRender();}finally{syncing=false;}}
async function submitReport(form){if(!form.reportValidity())return;const values=Object.fromEntries(new FormData(form));const date=new Date(values.observedAt);if(!Number.isFinite(date.getTime())||date.getTime()>Date.now()+300000||date.getTime()<Date.now()-7*86400000){toast(T('validation'));return;}if(S.photo?.size>300000){toast('Photo was not compressed. Please select it again.');return;}if(!Number.isFinite(Number(values.lat))||!Number.isFinite(Number(values.lon))||values.lat===''||values.lon===''){toast('Please use My Location or choose the approximate pilot area before submitting.');return;}
 const button=$('submit-report');button.disabled=true;
 try{const r={clientId:crypto.randomUUID(),receipt:token(),category:values.category,description:values.category==='other'?('Other incident: '+values.description.trim()):values.description.trim(),landmark:values.landmark.trim(),lat:Number(values.lat),lon:Number(values.lon),observedAt:date.toISOString(),createdAt:new Date().toISOString(),status:'pending',demo:S.demo,photo:S.photo||null};
 if(S.demo){r.serverId='demo-'+r.clientId;S.scenario.reports.unshift({...r,id:r.serverId,version:1,expiresAt:new Date(Date.now()+6*3600000).toISOString(),checks:{flags:['Simulation only. No live incident or authenticity decision.']}});await put('scenario',S.scenario);}await saveReport(r);S.draft={};S.photo=null;if(S.photoURL)URL.revokeObjectURL(S.photoURL);S.photoURL=null;await loadOutbox();location.hash='community';toast(T(S.demo?'simulationLocal':'savedOK'));await sync();}catch(e){toast(T('notSaved')+': '+e.message);button.disabled=false;}}
async function loadReview(){if(S.demo){render();return;}try{const v=await api('review');S.reviewReports=v.reports;render();}catch(e){toast(e.message);}}
async function review(form){if(!S.demo&&!S.session?.canModerate){toast('Judge access is read-only.');return;}if(!form.reportValidity())return;const data=Object.fromEntries(new FormData(form));data.independentEvidence=data.independentEvidence==='on';data.version=Number(form.dataset.version);if(data.status==='reviewed'&&!data.independentEvidence){toast(T('confirmEvidence'));return;}const button=form.querySelector('[type=submit]');button.disabled=true;try{if(S.demo){const r=S.scenario.reports.find(r=>r.id===form.dataset.id);if(!r||r.version!==data.version)throw new Error(T('refresh'));Object.assign(r,{status:data.status,reviewNote:data.note,version:r.version+1,expiresAt:new Date(Date.now()+Math.min(48,Math.max(1,Number(data.hours)||6))*3600000).toISOString()});await put('scenario',S.scenario);const own=(await allReports()).find(x=>x.serverId===r.id);if(own){own.status=r.status;await saveReport(own);}}else await api('review/'+form.dataset.id,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});toast(T('savedOK'));await loadReview();if(!S.demo)await refresh();}catch(e){toast(e.message);button.disabled=false;}}
async function saveNotice(form){if(!S.demo&&!S.session?.canModerate){toast('Judge access is read-only.');return;}if(!form.reportValidity())return;const v=Object.fromEntries(new FormData(form));try{const position=S.noticeLocation||await resolveNoticeAddress(String(v.address||'').trim());v.lat=position.lat;v.lon=position.lon;v.address=position.address; if(S.demo){S.scenario.shelters.push({...v,id:'demo-'+crypto.randomUUID(),kind:'shelter',demo:true,source:'Simulation only'});await put('scenario',S.scenario);}else await api('notices',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...v,kind:'shelter'})});toast(T('savedOK'));form.reset();S.noticeLocation=null;await refresh();}catch(e){toast(e.message);}}
function locate(forForm=false,quiet=false){
 if(!navigator.geolocation){if(!quiet)toast('Location unavailable. You can use an approximate area for reporting.');return;}
 if(!connected()){if(!quiet)toast('Live GPS position may be available offline, but fresh place names and forecasts require internet.');return;}
 if(!quiet)toast('Requesting your location permission…');
 navigator.geolocation.getCurrentPosition(async position=>{
  const {latitude,longitude,accuracy}=position.coords;
  S.lat=latitude;S.lon=longitude;S.gps={accuracy,at:new Date().toISOString()};
  S.locationName='Near your current position';
  if(forForm){S.draft.lat=latitude;S.draft.lon=longitude;S.draft.locationSource='gps';
   if($('lat'))$('lat').value=latitude;if($('lon'))$('lon').value=longitude;
   if($('report-location-status'))$('report-location-status').textContent='GPS location attached (±'+Math.round(accuracy)+' m). Landmark is still required.';
  }
  if(map){map.setView([latitude,longitude],14);L.circleMarker([latitude,longitude],{radius:8,color:'#086ca6'}).addTo(map).bindPopup('Your location ±'+Math.round(accuracy)+' m');}
  if(!quiet)toast('Location updated (±'+Math.round(accuracy)+' m).');
  quietRender();refresh();setTimeout(()=>refresh(),2000);
  // Provider permits current, user-consented device coordinates only, not stored place lookups.
  try{const u='https://api.bigdatacloud.net/data/reverse-geocode-client?latitude='+encodeURIComponent(latitude)+'&longitude='+encodeURIComponent(longitude)+'&localityLanguage=en';
   const res=await fetch(u,{signal:AbortSignal.timeout(8500)});if(res.ok){const v=await res.json();S.locationName=[v.locality||v.city,v.principalSubdivision,v.countryName].filter(Boolean).join(', ')||'Near your current position';quietRender();}
  }catch{/* Keep the GPS position even if reverse geocoding is unavailable. */}
 },()=>{if(!quiet)toast(T('locationDenied')+' · '+T('pilot'));},{enableHighAccuracy:true,timeout:18000,maximumAge:0});
}
function approximateReportLocation(){
 S.draft.lat=PILOT.lat;S.draft.lon=PILOT.lon;S.draft.locationSource='approximate';
 if($('lat'))$('lat').value=PILOT.lat;if($('lon'))$('lon').value=PILOT.lon;
 if($('report-location-status'))$('report-location-status').textContent='Approximate Mamallapuram area selected — NOT your exact GPS position. Describe the landmark precisely.';
}

async function screenImage(url,target='ai-result'){if(!url){toast(T('photoMissing'));return;}let el=$(target);if(!el)return;el.textContent=T('working')+' '+T('aiNote');if(!connected()){el.textContent=T('unavailable')+' · '+T('aiNote');return;}aiWorker?.terminate();aiWorker=new Worker('./ai-worker.js',{type:'module'});const timer=setTimeout(()=>{aiWorker?.terminate();if($(target))$(target).textContent=T('unavailable')+' · '+T('aiNote');},180000);aiWorker.onmessage=e=>{el=$(target);if(!el)return;const v=e.data;if(v.type==='progress')el.textContent=T('working')+(v.progress?' '+v.progress+'%':'')+' · '+T('modelDownload');else{clearTimeout(timer);if(v.type==='result')el.innerHTML='<strong>'+T('experimental')+'</strong><p>'+v.result.map(p=>h(p.label)+': '+Number(p.score).toFixed(3)).join(' · ')+'</p><p>'+T('aiNote')+'</p><small>'+h(v.model)+'</small>';else el.textContent=T('unavailable')+' · '+T('aiNote');}};aiWorker.onerror=()=>{clearTimeout(timer);if($(target))$(target).textContent=T('unavailable');};aiWorker.postMessage({url});}
async function reviewPhoto(id){try{let blob;if(S.demo){blob=(await allReports()).find(r=>r.serverId===id)?.photo;}else{const base=apiBase();if(!base)throw new Error(T('backendRequired'));const key=sessionStorage.getItem('harbor-reviewer-token');const r=await fetch(base+'/reports/'+id+'/photo',{headers:key?{Authorization:'Bearer '+key}:{},credentials:NATIVE?'omit':'same-origin'});if(!r.ok)throw new Error(T('unavailable'));blob=await r.blob();}if(!blob)throw new Error(T('photoMissing'));if(privatePhotoURL)URL.revokeObjectURL(privatePhotoURL);privatePhotoURL=URL.createObjectURL(blob);modal(T('showPhoto'),'<img class="upload-preview" src="'+privatePhotoURL+'" alt="'+T('photo')+'"><div style="margin:16px 0">'+V.btn('aiCheck','review-ai','camera','light')+'</div><div id="review-ai-result"></div><p class="small muted">'+T('reviewNeeded')+'</p>');}catch(e){toast(e.message);}}
async function changeMode(demo){S.demo=demo;await put('demo',demo).catch(()=>{});await loadOutbox().catch(()=>{});render();if(!demo){refresh();sync();}}
document.addEventListener('click',async event=>{const b=event.target.closest('[data-action]');if(!b)return;const a=b.dataset.action,id=b.dataset.id;try{
 if(a==='close')$('modal').close();
 else if(a.startsWith('guide:'))guidance(a.split(':')[1]);
 else if(a==='help-card'){$('modal').close();helpCard();}
 else if(a==='alert')alertDetail(id);
 else if(a==='report-detail')reportDetail(id);
 else if(a==='refresh'){toast(T('working'));await refresh();toast(T(S.alertError?'unavailable':'lastCheck'));}
 else if(a==='live'||a==='demo')await changeMode(a==='demo');
 else if(a==='notice-gps'){try{S.noticeLocation=await noticeGPS();const el=$('notice-location-status');if(el)el.textContent='Using '+S.noticeLocation.address;}catch(e){toast(e.message);}}
 else if(a==='notice-address'){const address=$('notice-address')?.value?.trim();if(!address)return toast('Enter an address first.');try{S.noticeLocation=await resolveNoticeAddress(address);const el=$('notice-location-status');if(el)el.textContent='Found: '+S.noticeLocation.address+' · Verify location before publishing.';}catch(e){toast(e.message);}}
 else if(a==='scenario-select'){S.scenario=makeDemo(b.dataset.scenario||'chennai');S.lat=S.scenario.origin.lat;S.lon=S.scenario.origin.lon;S.locationName=S.scenario.origin.name;S.nearbyLive=[];S.nearbyLastKey='';await put('scenario',S.scenario);await changeMode(true);}
 else if(a==='reset-demo'){S.scenario=makeDemo('chennai');await put('scenario',S.scenario);for(const r of (await allReports()).filter(v=>v.demo))await deleteReport(r.clientId);await changeMode(true);}
 else if(a==='save-offline'||a==='check-offline')await saveOffline(a==='save-offline');
 else if(a==='sync'){await sync();render();}
 else if(a==='delete-report'){await deleteReport(id);await loadOutbox();render();}
 else if(a==='load-review')await loadReview();
 else if(a==='reviewer-logout'){sessionStorage.removeItem('harbor-reviewer-token');S.session={reviewer:false,signedIn:false,role:null,canModerate:false};S.reviewReports=[];render();}
 else if(a==='locate'||a==='form-locate')locate(a==='form-locate');
 else if(a==='approximate-report-location')approximateReportLocation();
 else if(a==='toggle-satellite'){S.showSatellite=!S.showSatellite;showFrame();b.textContent=S.showSatellite?'Hide satellite overlay':'Show satellite overlay';}
 else if(a==='persist')toast(await navigator.storage?.persist?.()?T('savedOK'):T('storageNote'));
 else if(a==='test-offline'){S.testOffline=true;render();}
 else if(a==='test-online'){S.testOffline=false;render();refresh();sync();}
 else if(a==='install'){if(installPrompt){await installPrompt.prompt();installPrompt=null;}else toast(T('installHelp'));}
 else if(a==='play'){if(!connected()||!S.satellite)return toast(T('imageryOffline'));S.playing=!S.playing;clearInterval(playTimer);b.innerHTML=I(S.playing?'pause':'play')+T(S.playing?'pause':'play');if(S.playing)playTimer=setInterval(()=>{S.frame=(S.frame+1)%S.satellite.frames.length;if($('frame'))$('frame').value=S.frame;showFrame();},1600);}
 else if(a==='map-layer'){if(baseLayer&&map){if(map.hasLayer(baseLayer))map.removeLayer(baseLayer);else baseLayer.addTo(map);}}
 else if(a==='speak'){if(!globalThis.speechSynthesis)return toast(T('voiceNote'));speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(speechText);u.lang={en:'en-IN',hi:'hi-IN',ta:'ta-IN',fr:'fr-FR'}[S.lang];speechSynthesis.speak(u);}
 else if(a==='ai-screen')screenImage(S.photoURL);
 else if(a==='review-photo')await reviewPhoto(id);
 else if(a==='review-ai')screenImage(privatePhotoURL,'review-ai-result');
 else if(a==='place'){const p=places().find(p=>p.id===id);if(p){const directions='https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route='+S.lat+'%2C'+S.lon+'%3B'+p.lat+'%2C'+p.lon;modal(p.name,'<span class="pill">'+T(p.demo?'demo':p.availability||'unknown')+'</span><p style="margin:15px 0">'+h(p.address||'Exact street address is not listed in available map records.')+'</p><p>'+h(p.detail||'Verify availability before travelling.')+'</p><p><strong>Phone:</strong> '+(p.phone?'<a href="tel:'+h(p.phone)+'">'+h(p.phone)+'</a>':'Not verified — call 112 in emergencies')+'</p><a href="'+h(directions)+'" target="_blank" rel="noopener">View location and possible directions (check route safety)</a><p class="small muted">'+T('safetyCopy')+'</p>'+(p.sourceUrl?'<p><a href="'+h(p.sourceUrl)+'" rel="noopener" target="_blank">Source listing</a></p>':'') );if(map)map.setView([p.lat,p.lon],16);}}
 }catch(e){toast(e.message||T('unavailable'));}});
document.addEventListener('input',event=>{if(event.target.closest('#report-form')&&event.target.name!=='photo')S.draft[event.target.name]=event.target.value;if(event.target.id==='notice-address')S.noticeLocation=null;if(event.target.id==='frame'){S.frame=Number(event.target.value);showFrame();}});
document.addEventListener('change',async event=>{if(event.target.id==='language'){S.lang=event.target.value;await put('lang',S.lang).catch(()=>{});render();}if(event.target.id==='photo'){const f=event.target.files?.[0];if(!f)return;try{
  const compact=await compactEvidence(f);
  if(S.photoURL)URL.revokeObjectURL(S.photoURL);
  S.photo=compact;S.photoURL=URL.createObjectURL(compact);
  $('photo-preview').innerHTML='<img class="upload-preview" src="'+S.photoURL+'" alt=""> <small>Photo ready · '+Math.ceil(compact.size/1024)+' KB · privately stored on submission</small>';
 }catch(error){event.target.value='';S.photo=null;toast(error.message||T('photoNote'));}}});
document.addEventListener('submit',async e=>{const f=e.target;if(f.id==='report-form'){e.preventDefault();await submitReport(f);}else if(f.classList.contains('review-form')){e.preventDefault();await review(f);}else if(f.id==='notice-form'){e.preventDefault();await saveNotice(f);}else if(f.id==='reviewer-login'){e.preventDefault();const secret=String(new FormData(f).get('secret')||'');if(secret.length<32){toast(T('invalidReviewerToken'));return;}sessionStorage.setItem('harbor-reviewer-token',secret);try{const result=await api('session');if(!result.reviewer)throw new Error(T('invalidReviewerToken'));S.session=result;await loadReview();}catch(err){sessionStorage.removeItem('harbor-reviewer-token');S.session={reviewer:false,signedIn:false};toast(err.message);render();}}else if(f.id==='backend-form'){e.preventDefault();const value=String(new FormData(f).get('origin')||'').trim().replace(/\/$/,'');try{const url=new URL(value);if(url.protocol!=='https:'||url.username||url.password||url.pathname!=='/'||url.search||url.hash)throw Error();localStorage.setItem('harbor-backend-origin',url.origin);S.session=null;toast(T('savedOK'));render();await refresh();}catch{toast(T('invalidBackend'));}}else if(f.id==='hotel-form'){e.preventDefault();S.hotel=Object.fromEntries(new FormData(f));try{await put('hotel',S.hotel);toast(T('savedOK'));}catch(e){toast(T('notSaved'));}}});
function route(){const page=location.hash.slice(1);if(page==='main'){document.querySelector('#main')?.focus();return;}S.page=Object.hasOwn(V,page)&&!['shell','btn','notice','badge','warningCards','reportCard'].includes(page)?page:'home';render();window.scrollTo(0,0);if(S.page==='review'&&(S.demo||S.session?.reviewer))loadReview();}
window.addEventListener('hashchange',route);
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;});
window.addEventListener('online',()=>{quietRender();refresh();sync();});
window.addEventListener('offline',()=>{if(S.weather)S.weather.stale=true;quietRender();});
document.addEventListener('visibilitychange',()=>{if(!document.hidden){refresh();sync();}});
async function boot(){try{const keys=['lang','weather','airQuality','reports','notices','satellite','scenario','demo','hotel'];const values=await Promise.all(keys.map(k=>get(k)));keys.forEach((k,i)=>{if(values[i]!=null)S[k]=values[i];});if(!['en','hi','ta','te','kn','ml','bn','mr','gu','pa','fr','es','de','ar','ja'].includes(S.lang))S.lang='en';const a=await get('alertSnapshot');if(a){S.alerts=a.alerts;S.alertsFetched=a.fetchedAt;S.alertError=!!a.stale||Date.now()-Date.parse(a.fetchedAt)>15*60000;}if(S.weather)S.weather.stale=true;if(S.airQuality)S.airQuality.stale=true;S.kitAt=(await get('kit'))?.at;await loadOutbox();}catch{toast(T('storageNote'));}
 route();
 const results=await Promise.allSettled(['./data/pilot-map.json','./data/places.json'].map(async u=>{const r=await fetch(u);if(!r.ok)throw new Error('Map unavailable');return r.json();}));
 if(results[0].status==='fulfilled')S.geo=results[0].value;if(results[1].status==='fulfilled')S.helpPlaces=results[1].value.places||results[1].value;
 quietRender();if(connected()&&!sessionStorage.getItem('harbor-location-requested')){sessionStorage.setItem('harbor-location-requested','1');setTimeout(()=>locate(false,true),650);}
 checkOffline().then(()=>quietRender()).catch(()=>{});refresh();sync();setInterval(()=>{if(!document.hidden){refresh();sync();}},60000);
}
boot();
