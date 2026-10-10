export const PACK_VERSION='2026-10-10.3';
export const sources=[
{name:'Emergency Response Support System',url:'https://112.gov.in/',purpose:'India emergency number'},
{name:'Chengalpattu district helpline',url:'https://chengalpattu.nic.in/helpline/',purpose:'District disaster control contacts'},
{name:'IMD Chennai preparedness guidance',url:'https://mausam.imd.gov.in/chennai/mcdata/dos%26donts.pdf',purpose:'Flood and cyclone precautions'},
{name:'Government of India: cyclones',url:'https://www.dgfscdhg.gov.in/cyclones',purpose:'Cyclone guidance'},
{name:'NDMA SACHET',url:'https://sachet.ndma.gov.in/',purpose:'Official Common Alerting Protocol bulletins'},
{name:'Open-Meteo',url:'https://open-meteo.com/',purpose:'Weather-model estimates; CC BY 4.0'},
{name:'EUMETSAT',url:'https://view.eumetsat.int/',purpose:'Meteosat infrared imagery; acquisition timestamps'},
{name:'MET Norway',url:'https://www.met.no/en/free-meteorological-data/Licensing-and-crediting',purpose:'Fallback model forecast; CC BY 4.0; units/time adapted'},
{name:'OpenStreetMap contributors',url:'https://www.openstreetmap.org/copyright',purpose:'Pilot road and location data, ODbL'}
];
export const contacts=[
{id:'emergency',number:'112',label:'emergency',source:0},
{id:'disaster',number:'+914427427412',label:'disaster',source:1},
{id:'disaster2',number:'+914427427414',label:'disaster',source:1}
];
export const guideSources={flood:2,cyclone:3,storm:2,rain:2,bridge:2,power:2,tree:2,landslide:2,shelter:1};
export function makeDemo(city='chennai'){
 const sites={
  chennai:{name:'Chennai',lat:13.0827,lon:80.2707,landmarks:['Marina Beach','Triplicane','Adyar','Guindy','Mylapore','Velachery','Besant Nagar','T Nagar','Anna Salai','Thiruvanmiyur','Royapettah','Perambur']},
  kochi:{name:'Kochi',lat:9.9312,lon:76.2673,landmarks:['Fort Kochi','Mattancherry','Marine Drive','Kaloor','Edappally','Vyttila','Kakkanad','Palarivattom','Thevara','Willingdon Island','Ernakulam South','Thrippunithura']},
  mumbai:{name:'Mumbai',lat:19.076,lon:72.8777,landmarks:['Dadar','Kurla','Sion','Bandra','Andheri','Powai','Chembur','Worli','Matunga','Colaba','Mahim','Lower Parel']}
 };const c=sites[city]||sites.chennai,now=Date.now();
 const categories=['flood','tree','power','bridge','flood','shelter','landslide','tree','flood','power','bridge','shelter'];
 const descriptions=['Training: waterlogging reported near main road.','Training: fallen tree obstructing one lane.','Training: power cable reported close to pavement.','Training: crossing reported damaged; do not use.','Training: rainfall-related water accumulation.','Training: shelter availability needs official confirmation.','Training: possible slope instability; avoid area.','Training: branches obstruct local street.','Training: standing water reported at intersection.','Training: electrical equipment near wet road.','Training: road closure reported near bridge.','Training: shelter enquiry; capacity not confirmed.'];
 return {city,origin:{name:c.name,lat:c.lat,lon:c.lon},alerts:[{id:'scenario-'+city,category:'storm',severity:'Severe',sourceType:'simulation',source:'PathVirgil fictional training scenario',issuedAt:new Date(now-10*60000).toISOString(),expiresAt:new Date(now+3*3600000).toISOString(),area:c.name+' · training only',status:'active'}],reports:c.landmarks.map((landmark,i)=>({id:'scenario-'+city+'-'+i,category:categories[i],landmark:landmark+' (simulation)',lat:c.lat+Math.sin(i*2)*.024,lon:c.lon+Math.cos(i*2)*.026,description:descriptions[i]+' Fictional event, not a real warning.',status:i%4===0?'pending':i%3===0?'corroborated':'reviewed',demo:true,version:1,createdAt:new Date(now-(i+1)*4*60000).toISOString(),observedAt:new Date(now-(i+1)*5*60000).toISOString(),updatedAt:new Date(now-(i+1)*3*60000).toISOString(),expiresAt:new Date(now+3*3600000).toISOString(),reviewNote:'Fictional training item; not verified in the real world.'})),shelters:[{id:'scenario-shelter-1',name:c.name+' training shelter (not a real facility)',lat:c.lat+.012,lon:c.lon-.009,kind:'shelter',availability:'unknown',demo:true,source:'Simulation only',capacity:null}]};
}
