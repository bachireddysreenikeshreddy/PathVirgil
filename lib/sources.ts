import { XMLParser } from 'fast-xml-parser';
import { pointInPolygon, distanceKm } from './domain';
const parser=new XMLParser({ignoreAttributes:false,removeNSPrefix:true,parseTagValue:false});
const array=(v:any)=>v==null?[]:Array.isArray(v)?v:[v];
export async function cached(db:D1Database,key:string,ttl:number,load:(previous:any)=>Promise<any>){
 const previous=await db.prepare('SELECT * FROM source_cache WHERE id=?').bind(key).first<any>();
 const stored=previous?JSON.parse(previous.body):null;
 if(previous&&(Date.now()-Date.parse(previous.fetched_at)<ttl||Date.now()<Date.parse(stored.upstreamExpiresAt||'')))return {...stored,cachedAt:previous.fetched_at};
 try{
  const next=await load(previous),fetchedAt=new Date().toISOString();
  if(next.unchanged&&previous){const renewed={...stored,...next};delete renewed.unchanged;await db.prepare('UPDATE source_cache SET fetched_at=?,body=? WHERE id=?').bind(fetchedAt,JSON.stringify(renewed),key).run();return {...renewed,fetchedAt};}
  await db.prepare('INSERT INTO source_cache(id,body,etag,fetched_at) VALUES(?,?,?,?) ON CONFLICT(id) DO UPDATE SET body=excluded.body,etag=excluded.etag,fetched_at=excluded.fetched_at').bind(key,JSON.stringify(next),next.etag||null,fetchedAt).run();
  return {...next,fetchedAt};
 }catch{
  if(previous)return {...JSON.parse(previous.body),stale:true,fetchedAt:previous.fetched_at,sourceError:true};
  throw new Error('This source is temporarily unavailable');
 }
}
export async function weather(db:D1Database,lat:number,lon:number){
 const a=lat.toFixed(2),b=lon.toFixed(2);
 return cached(db,'weather:'+a+':'+b,10*60000,async()=>{
  const u='https://api.open-meteo.com/v1/forecast?latitude='+a+'&longitude='+b+'&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,cloud_cover,wind_speed_10m,wind_direction_10m,wind_gusts_10m&hourly=temperature_2m,precipitation_probability,precipitation,wind_speed_10m,wind_gusts_10m,weather_code,visibility&forecast_days=2&timezone=auto';
  try{const res=await fetch(u,{signal:AbortSignal.timeout(9000)});
   if(res.ok)return {data:await res.json(),source:'Open-Meteo',sourceUrl:'https://open-meteo.com/',kind:'weather_model',sourceNote:'Current conditions are weather-model estimates, not street-level observations.'};
   console.warn('weather_source_status',{source:'Open-Meteo',status:res.status});
  }catch{console.warn('weather_source_unavailable',{source:'Open-Meteo'});}
  return metWeather(db,a,b);
 });
}
/** CAMS/Open-Meteo modelled AQI and contaminant concentrations. No invented values. */
export async function airQuality(db:D1Database,lat:number,lon:number){
 const a=lat.toFixed(2), b=lon.toFixed(2);
 return cached(db,'air-quality:'+a+':'+b,15*60000,async()=>{
  const q=new URLSearchParams({latitude:a,longitude:b,current:'us_aqi,pm2_5,pm10,ozone,nitrogen_dioxide,sulphur_dioxide,carbon_monoxide',timezone:'auto'});
  const r=await fetch('https://air-quality-api.open-meteo.com/v1/air-quality?'+q,{signal:AbortSignal.timeout(10000)});
  if(!r.ok)throw new Error('Air quality source unavailable');
  const v=await r.json() as any;
  return {current:v.current,units:v.current_units,source:'Open-Meteo / CAMS',sourceUrl:'https://open-meteo.com/en/docs/air-quality-api',kind:'modelled_air_quality',note:'Modelled air pollution estimates, not a nearby monitoring station reading.'};
 });
}

export function parseCap(xml:string,lat:number,lon:number,district:string){
 const cap=parser.parse(xml).alert;if(!cap||cap.status!=='Actual'||cap.msgType==='Cancel')return null;
 const infos=array(cap.info);const info=infos.find((v:any)=>String(v.language||'en').startsWith('en'))||infos[0];if(!info)return null;
 const areas=array(info.area);let relevant=false,areaName='';
 for(const a of areas){
  const polygons=array(a.polygon).map((s:any)=>String(s).trim().split(/\s+/).map((q:string)=>q.split(',').map(Number)));
  const circles=array(a.circle).map((s:any)=>String(s).trim().split(/\s+/));
  const geometric=polygons.length||circles.length;
  const polygonMatch=polygons.some((p:number[][])=>pointInPolygon(lat,lon,p));
  const circleMatch=circles.some((v:string[])=>{const [x,y]=v[0].split(',').map(Number);return distanceKm(x,y,lat,lon)<=Number(v[1]);});
  const name=String(a.areaDesc||'');
  if(polygonMatch||circleMatch||(!geometric&&name.toLowerCase().includes(district.toLowerCase()))){relevant=true;areaName=name;}
 }
 if(!relevant)return null;
 const expiresAt=info.expires?new Date(info.expires).toISOString():new Date(Date.parse(cap.sent)+3*3600000).toISOString();
 if(Date.parse(expiresAt)<=Date.now())return null;
 const text=String(info.event||'')+' '+String(info.headline||'');
 const category=/cyclone|storm surge/i.test(text)?'cyclone':/flood/i.test(text)?'flood':/lightning|thunder/i.test(text)?'storm':/rain/i.test(text)?'rain':'general';
 return {id:String(cap.identifier),title:String(info.headline||info.event),description:String(info.description||''),instruction:String(info.instruction||''),severity:String(info.severity||'Unknown'),category,source:String(info.senderName||cap.sender||'SACHET'),sourceType:'official',sourceUrl:info.web&&String(info.web).startsWith('https://')?String(info.web):'https://sachet.ndma.gov.in/',issuedAt:String(info.effective||cap.sent),expiresAt,area:areaName,language:String(info.language||'en'),status:'active'};
}
export async function officialAlerts(db:D1Database,lat:number,lon:number,district='Chengalpattu'){
 const rss=await cached(db,'sachet:rss',120000,async previous=>{
  const res=await fetch('https://sachet.ndma.gov.in/cap_public_website/rss/rss_india.xml',{headers:previous?.etag?{'If-None-Match':previous.etag}:{},signal:AbortSignal.timeout(12000)});
  if(res.status===304)return {unchanged:true};if(!res.ok)throw new Error('Alert source unavailable');
  return {items:array(parser.parse(await res.text()).rss?.channel?.item),etag:res.headers.get('etag')};
 });
 const matching=rss.items.filter((v:any)=>new RegExp(district+'|Mamallapuram|Mahabalipuram|Tamil Nadu|Tamilnadu|cancel','i').test(String(v.title)+' '+String(v.description)));
 const candidates=matching.slice(0,20);
 const results=await Promise.allSettled(candidates.map(async(v:any)=>{
  const u=new URL(String(v.link));if(u.hostname!=='sachet.ndma.gov.in'||u.pathname!=='/cap_public_website/FetchXMLFile')return null;
  const r=await fetch(u,{signal:AbortSignal.timeout(8000)});if(!r.ok)throw new Error('CAP fetch failed');return await r.text();
 }));
 return {alerts:collectCapAlerts(results.flatMap(v=>v.status==='fulfilled'&&v.value?[v.value]:[]),lat,lon,district),source:'NDMA SACHET / issuing agencies',sourceUrl:'https://sachet.ndma.gov.in/',fetchedAt:rss.fetchedAt||rss.cachedAt,stale:!!rss.stale,partial:matching.length>20||results.some(v=>v.status==='rejected'),coverage:district+' district',scope:'pilot'};
}
export async function satellite(db:D1Database){
 return cached(db,'satellite:meta',5*60000,async()=>{
  const r=await fetch('https://view.eumetsat.int/geoserver/wms?service=WMS&version=1.3.0&request=GetCapabilities',{signal:AbortSignal.timeout(12000)});
  if(!r.ok)throw new Error('Imagery unavailable');
  const xml=await r.text();const i=xml.indexOf('<Name>msg_iodc:ir108</Name>');
  if(i<0)throw new Error('Satellite layer unavailable');
  const fragment=xml.slice(i,i+18000);const m=fragment.match(/<Dimension[^>]*name="time"[^>]*default="([^"]+)"/);
  if(!m)throw new Error('Image timestamp unavailable');
  const latest=m[1],end=Date.parse(latest);if(!Number.isFinite(end))throw new Error('Bad image timestamp');
  return {latest,frames:Array.from({length:8},(_,j)=>new Date(end-(7-j)*15*60000).toISOString()),source:'EUMETSAT Meteosat — Indian Ocean',sourceUrl:'https://view.eumetsat.int/',bounds:[[0,55],[35,105]],layer:'msg_iodc:ir108',kind:'satellite_infrared'};
 });
}
export async function satelliteImage(time:string){
 const date=Date.parse(time);if(!Number.isFinite(date)||date>Date.now()+3600000||date<Date.now()-3*86400000)throw new Error('Image time is unavailable');
 const u='https://view.eumetsat.int/geoserver/wms?service=WMS&version=1.1.1&request=GetMap&layers=msg_iodc%3Air108&styles=&format=image%2Fpng&transparent=true&srs=EPSG%3A3857&bbox=6122571.9936,0,11688546.5333,4163881.1441&width=1000&height=748&time='+encodeURIComponent(time);
 const r=await fetch(u,{signal:AbortSignal.timeout(20000)});if(!r.ok||!r.headers.get('content-type')?.startsWith('image/'))throw new Error('Satellite image unavailable');return r;
}

export function collectCapAlerts(xmls:string[],lat:number,lon:number,district:string){
 const superseded=new Set<string>();
 for(const xml of xmls){const cap=parser.parse(xml).alert;if(cap?.status==='Actual'&&['Cancel','Update'].includes(cap.msgType))for(const ref of String(cap.references||'').trim().split(/\s+/)){const id=ref.split(',')[1];if(id)superseded.add(id);}}
 const byId=new Map<string,ReturnType<typeof parseCap>>();
 for(const xml of xmls){const alert=parseCap(xml,lat,lon,district);if(alert&&!superseded.has(alert.id))byId.set(alert.id,alert);}
 return [...byId.values()];
}

export function normalizeMetForecast(payload:any,now=Date.now()){
 const points=payload?.properties?.timeseries;
 if(!Array.isArray(points)||!points.length)throw new Error('Forecast unavailable');
 const candidates=points.filter((p:any)=>Date.parse(p.time)<=now);
 const currentPoint=candidates.at(-1)||points[0],d=currentPoint.data.instant.details;
 if(Math.abs(Date.parse(currentPoint.time)-now)>3*3600000)throw new Error('Forecast is too old');
 const local=(time:string)=>new Date(Date.parse(time)+19800000).toISOString().slice(0,16);
 const hourlyPoints=points.filter((p:any)=>Date.parse(p.time)>=now-3600000).slice(0,48);
 const symbol=currentPoint.data.next_1_hours?.summary?.symbol_code||'';
 return {
  current:{time:local(currentPoint.time),temperature_2m:d.air_temperature,relative_humidity_2m:d.relative_humidity,cloud_cover:d.cloud_area_fraction,wind_speed_10m:Number((d.wind_speed*3.6).toFixed(1)),precipitation:currentPoint.data.next_1_hours?.details?.precipitation_amount??null,weather_code:/rain|sleet|snow/.test(symbol)?61:3},
  hourly:{time:hourlyPoints.map((p:any)=>local(p.time)),temperature_2m:hourlyPoints.map((p:any)=>p.data.instant.details.air_temperature),precipitation_probability:hourlyPoints.map(()=>null),precipitation:hourlyPoints.map((p:any)=>p.data.next_1_hours?.details?.precipitation_amount??null),wind_speed_10m:hourlyPoints.map((p:any)=>Number((p.data.instant.details.wind_speed*3.6).toFixed(1)))},
  timezone:'Asia/Kolkata',utc_offset_seconds:19800
 };
}
export async function metWeather(db:D1Database,lat:string,lon:string){
 const result=await cached(db,'met:'+lat+':'+lon,10*60000,async previous=>{
  const old=previous?JSON.parse(previous.body):null;
  const headers:Record<string,string>={'User-Agent':'HarborTouristSafety/1.0'};
  if(old?.lastModified)headers['If-Modified-Since']=old.lastModified;
  const r=await fetch('https://api.met.no/weatherapi/locationforecast/2.0/compact?lat='+lat+'&lon='+lon,{headers,signal:AbortSignal.timeout(12000)});
  const upstreamExpiresAt=r.headers.get('expires');
  if(r.status===304)return {unchanged:true,upstreamExpiresAt};
  if(!r.ok){console.warn('weather_source_status',{source:'MET Norway',status:r.status});throw new Error('Forecast source unavailable');}
  const payload=await r.json() as any;
  return {raw:payload,source:'MET Norway',sourceUrl:'https://www.met.no/en/free-meteorological-data/Licensing-and-crediting',kind:'weather_model',precipitationPeriod:'next_hour',sourceNote:'Forecast model estimates. Precipitation is the next-hour amount; probability is unavailable.',modelUpdatedAt:payload.properties.meta.updated_at,lastModified:r.headers.get('last-modified'),upstreamExpiresAt};
 });
 const {raw,upstreamExpiresAt,...safe}=result;
 return {...safe,data:normalizeMetForecast(raw)};
}
