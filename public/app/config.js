export const VERSION='1.2.0';
export const NATIVE=location.hostname==='appassets.androidplatform.net';
export const DEFAULT_BACKEND_ORIGIN=''; // Set in the Android APK at build time, not in web production assets.
export const backendOrigin=()=>NATIVE?(localStorage.getItem('harbor-backend-origin')||DEFAULT_BACKEND_ORIGIN):location.origin;
export const apiBase=()=>{const origin=backendOrigin();return origin?origin.replace(/\/$/,'')+'/api':null;};
export const PILOT={id:'mamallapuram',name:'Mamallapuram',district:'Chengalpattu',country:'India',lat:12.6208,lon:80.1945,bounds:[[12.59,80.15],[12.66,80.22]]};
