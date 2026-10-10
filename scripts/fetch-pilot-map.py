"""Refresh the pilot vector map from OSM API. ODbL; no tile prefetching."""
import urllib.request,json,time,xml.etree.ElementTree as ET
from pathlib import Path
url='https://api.openstreetmap.org/api/0.6/map?bbox=80.165,12.600,80.215,12.650'
with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'HarborHackathon/1.0'}),timeout=60) as response:root=ET.fromstring(response.read())
nodes={n.attrib['id']:[float(n.attrib['lon']),float(n.attrib['lat'])] for n in root.findall('node')}
features=[];places=[];now=time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime())
for e in root:
 tags={t.attrib['k']:t.attrib['v'] for t in e.findall('tag')}
 coords=[nodes[n.attrib['ref']] for n in e.findall('nd') if n.attrib['ref'] in nodes]
 if len(coords)>1 and ('highway' in tags or tags.get('natural')=='coastline'):
  features.append({'type':'Feature','properties':{k:tags[k] for k in ['name','highway','natural'] if k in tags},'geometry':{'type':'LineString','coordinates':coords}})
 if tags.get('amenity') in ['police','hospital','clinic']:
  loc=nodes.get(e.attrib['id']) if e.tag=='node' else (coords[0] if coords else None)
  if loc:places.append({'id':'osm-'+e.attrib['id'],'name':tags.get('name',tags['amenity'].title()),'lon':loc[0],'lat':loc[1],'kind':tags['amenity'],'availability':'unknown','source':'OpenStreetMap','sourceUrl':'https://www.openstreetmap.org/'+e.tag+'/'+e.attrib['id'],'fetchedAt':now})
Path('public/app/data/pilot-map.json').write_text(json.dumps({'type':'FeatureCollection','features':features,'attribution':'© OpenStreetMap contributors, ODbL','fetchedAt':now},separators=(',',':')))
Path('public/app/data/places.json').write_text(json.dumps(places,ensure_ascii=False,indent=2))
print(len(features),'features;',len(places),'help places')
