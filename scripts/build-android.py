"""Build a development APK from the shared web app, without Gradle.
Set HARBOR_ANDROID_BUILD_TOOLS and HARBOR_ANDROID_PLATFORM_JAR to SDK paths.
The generated development key is for sideload testing, not Play Store release.
"""
from pathlib import Path
import os,shutil,subprocess,zipfile,json,re
root=Path(__file__).resolve().parent.parent
os.chdir(root)
tools=Path(os.environ['HARBOR_ANDROID_BUILD_TOOLS'])
platform=Path(os.environ['HARBOR_ANDROID_PLATFORM_JAR'])
build=root/'android/build';build.mkdir(parents=True,exist_ok=True)
for p in ['classes','dex','assets/app','gen']: (build/p).mkdir(parents=True,exist_ok=True)
shutil.copytree(root/'public/app',build/'assets/app',dirs_exist_ok=True)
# A custom domain can be bundled as the initial API address while retaining the
# Settings override. This does not change the website's offline behavior.
origin=os.getenv('HARBOR_ANDROID_SERVER_ORIGIN','').strip().rstrip('/')
if origin:
 from urllib.parse import urlparse
 u=urlparse(origin)
 if (u.scheme!='https' or not u.hostname or not '.' in u.hostname or
     u.username or u.password or u.port or u.path or u.query or u.fragment):
  raise ValueError('HARBOR_ANDROID_SERVER_ORIGIN must be an HTTPS origin without a path or port')
 config=build/'assets/app/config.js'
 content=config.read_text()
 old="export const DEFAULT_BACKEND_ORIGIN='';"
 if content.count(old)!=1:raise RuntimeError('Expected one Android backend placeholder in config.js')
 config.write_text(content.replace(old,"export const DEFAULT_BACKEND_ORIGIN="+json.dumps(origin)+";"))
 print('Android API default:',origin)
else:
 print('No domain baked into APK: configure PathVirgil server address in Android Settings.')

icon=root/'android/res/drawable/icon.png';icon.parent.mkdir(exist_ok=True);shutil.copyfile(root/'public/app/icon-192.png',icon)
def run(*args): subprocess.run([str(a) for a in args],check=True)
run(tools/'aapt','package','-f','-m','-J',build/'gen','-M','android/AndroidManifest.xml','-S','android/res','-A',build/'assets','-I',platform,'-F',build/'unsigned.apk')
sources=list((root/'android/src').rglob('*.java'))+list((build/'gen').rglob('*.java'))
run('java','com.sun.tools.javac.Main','-source','8','-target','8','-bootclasspath',platform,'-d',build/'classes',*sources)
run(tools/'d8','--lib',platform,'--min-api','26','--output',build/'dex',*list((build/'classes').rglob('*.class')))
with zipfile.ZipFile(build/'unsigned.apk','a',zipfile.ZIP_DEFLATED) as z:
 for f in (build/'dex').glob('*.dex'):z.write(f,f.name)
run(tools/'zipalign','-f','-p','4',build/'unsigned.apk',build/'aligned.apk')
key=build/'harbor-development.keystore'
if not key.exists():run('keytool','-genkeypair','-keystore',key,'-storepass','android','-keypass','android','-alias','harbor-dev','-keyalg','RSA','-keysize','2048','-validity','3650','-dname','CN=PathVirgil Development, O=Hackathon, C=IN')
output=root/'public/downloads/PathVirgil-Android.apk';output.parent.mkdir(exist_ok=True)
run(tools/'apksigner','sign','--ks',key,'--ks-pass','pass:android','--key-pass','pass:android','--out',output,build/'aligned.apk')
run(tools/'apksigner','verify','--verbose',output)
run(tools/'aapt','dump','badging',output)
print('APK:',output,'bytes:',output.stat().st_size)
