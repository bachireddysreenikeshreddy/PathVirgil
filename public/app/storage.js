let opened;
export function database(){if(!opened)opened=new Promise((resolve,reject)=>{if(!globalThis.indexedDB){reject(new Error('Storage unavailable'));return;}const r=indexedDB.open('harbor-offline',1);r.onupgradeneeded=()=>{const d=r.result;d.createObjectStore('kv');d.createObjectStore('outbox',{keyPath:'clientId'});};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});return opened;}
export async function transact(store,mode,fn){const d=await database();return new Promise((resolve,reject)=>{const tx=d.transaction(store,mode),req=fn(tx.objectStore(store));let result;req.onsuccess=()=>{result=req.result;};tx.oncomplete=()=>resolve(result);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('Storage write failed'));});}
export const get=(key)=>transact('kv','readonly',s=>s.get(key));
export const put=(key,value)=>transact('kv','readwrite',s=>s.put(value,key));
export const allReports=()=>transact('outbox','readonly',s=>s.getAll());
export const saveReport=(value)=>transact('outbox','readwrite',s=>s.put(value));
export const deleteReport=(id)=>transact('outbox','readwrite',s=>s.delete(id));
export async function proveStorage(){const token=crypto.randomUUID();await put('storage-probe',token);if(await get('storage-probe')!==token)throw new Error('Storage verification failed');return true;}
export function token(){const a=new Uint8Array(32);crypto.getRandomValues(a);return Array.from(a,v=>v.toString(16).padStart(2,'0')).join('');}
export function escapeHTML(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
