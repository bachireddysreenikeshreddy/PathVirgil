export const CATEGORIES=['flood','bridge','tree','power','landslide','shelter','other'] as const;
export const VALID_STATUSES=['pending','corroborated','reviewed','rejected','withdrawn'] as const;
export function coordinate(value:unknown,min:number,max:number):number{const n=Number(value);if(value===null||value===''||!Number.isFinite(n)||n<min||n>max)throw new Error('Invalid coordinates');return n;}
export function cleanText(value:unknown,max:number):string{if(typeof value!=='string')throw new Error('Text is required');const s=value.trim().replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'');if(s.length>max)throw new Error('Text is too long');return s;}
export function validateReport(data:Record<string,unknown>,now=Date.now()){
 const category=String(data.category);if(!CATEGORIES.includes(category as typeof CATEGORIES[number]))throw new Error('Choose an incident type');
 const lat=coordinate(data.lat,-90,90),lon=coordinate(data.lon,-180,180);const observedAt=new Date(String(data.observedAt));
 if(!Number.isFinite(observedAt.getTime())||observedAt.getTime()>now+300000||observedAt.getTime()<now-7*86400000)throw new Error('Observation time must be within the last 7 days and not in the future');
 const description=cleanText(data.description,1200),landmark=cleanText(data.landmark,120);if(description.length<10||landmark.length<2)throw new Error('Add a short description and a landmark');
 const clientId=String(data.clientId);if(!/^[a-zA-Z0-9-]{16,80}$/.test(clientId))throw new Error('Invalid submission identifier');
 return {category,lat,lon,observedAt:observedAt.toISOString(),description,landmark,clientId};
}
export function distanceKm(a:number,b:number,c:number,d:number){const r=Math.PI/180,h=Math.sin((c-a)*r/2)**2+Math.cos(a*r)*Math.cos(c*r)*Math.sin((d-b)*r/2)**2;return 6371*2*Math.atan2(Math.sqrt(h),Math.sqrt(Math.max(0,1-h)));}
export function pointInPolygon(lat:number,lon:number,points:number[][]){let inside=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const [yi,xi]=points[i],[yj,xj]=points[j];if(((yi>lat)!==(yj>lat))&&(lon<(xj-xi)*(lat-yi)/(yj-yi)+xi))inside=!inside;}return inside;}
export function active(record:{status:string;expiresAt:string},now=Date.now()){return ['reviewed','corroborated','active'].includes(record.status)&&Date.parse(record.expiresAt)>now;}
export async function sha256(input:string|ArrayBuffer){const bytes=typeof input==='string'?new TextEncoder().encode(input):input;const hash=await crypto.subtle.digest('SHA-256',bytes);return Array.from(new Uint8Array(hash)).map(v=>v.toString(16).padStart(2,'0')).join('');}
export function imageType(bytes:Uint8Array){if(bytes[0]===255&&bytes[1]===216&&bytes[2]===255)return 'image/jpeg';if(bytes[0]===137&&bytes[1]===80&&bytes[2]===78&&bytes[3]===71&&bytes[4]===13&&bytes[5]===10)return 'image/png';if(new TextDecoder().decode(bytes.slice(0,4))==='RIFF'&&new TextDecoder().decode(bytes.slice(8,12))==='WEBP')return 'image/webp';return null;}
export function publicReport(r:Record<string,unknown>){
 // An unverified submission is only a community observation, never a safety alert.
 // Hide its raw text and obscure GPS to ~1 km until a moderator reviews it.
 const pending=r.status==='pending';
 return {id:r.id,category:r.category,description:pending?'Unverified community observation; details hidden pending review.':r.description,
  landmark:pending?'Approximate area — not independently verified':r.landmark,
  lat:pending?Math.round(Number(r.lat)*100)/100:r.lat,lon:pending?Math.round(Number(r.lon)*100)/100:r.lon,
  observedAt:r.observed_at,createdAt:r.created_at,updatedAt:r.updated_at,expiresAt:r.expires_at,
  status:r.status,reviewNote:pending?null:r.review_note,version:r.version,demo:!!r.demo};
}
