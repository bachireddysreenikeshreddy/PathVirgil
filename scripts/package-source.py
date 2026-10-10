"""Create a reproducible source snapshot for GitHub upload; omit credentials/cache."""
from pathlib import Path
import zipfile,hashlib,json
root=Path(__file__).resolve().parent.parent
skip={'.git','node_modules','dist','.next','.wrangler','.harbor-runtime','.pnpm-store','__pycache__'}
out=root/'public/downloads/Harbor-source.zip'
out.parent.mkdir(parents=True,exist_ok=True)
files=[]
for f in root.rglob('*'):
 if not f.is_file():continue
 rel=f.relative_to(root)
 if any(p in skip for p in rel.parts):continue
 if rel.parts[:2]==('android','build'):continue
 if rel.parts[:2]==('public','downloads'):continue
 if f.name.startswith('.env') and f.name!='.env.example':continue
 if f.suffix in {'.keystore','.tsbuildinfo'} or f.name=='_test-route.ts':continue
 files.append(f)
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for f in sorted(files):z.write(f,'Harbor/'+str(f.relative_to(root)))
print(out,len(files),'files',out.stat().st_size,'bytes')
