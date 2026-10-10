import {mkdir,copyFile,cp} from 'node:fs/promises';
await mkdir('public/app/vendor',{recursive:true});
for(const f of ['leaflet.js','leaflet.css'])await copyFile('node_modules/leaflet/dist/'+f,'public/app/vendor/'+f);
await cp('node_modules/leaflet/dist/images','public/app/vendor/images',{recursive:true});
await mkdir('public/app/ml',{recursive:true});
for(const f of ['transformers.web.min.js','ort-wasm-simd-threaded.jsep.mjs','ort-wasm-simd-threaded.jsep.wasm'])await copyFile('node_modules/@huggingface/transformers/dist/'+f,'public/app/ml/'+f);
console.log('Local map and optional AI runtime copied.');
