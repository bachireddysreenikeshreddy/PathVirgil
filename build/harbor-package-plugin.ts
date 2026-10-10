import {access,cp,mkdir,rm} from "node:fs/promises";
import {resolve} from "node:path";
import type {Plugin} from "vite";
// Packaging metadata for an independently hosted Harbor build.
export function harborPackage():Plugin {
  let root=process.cwd();let command="build";
  return {name:"harbor-package",configResolved(config){root=config.root;command=config.command;},async closeBundle(){
    if(command!=="build")return;
    const out=resolve(root,"dist",".hosting");await rm(out,{recursive:true,force:true});await mkdir(out,{recursive:true});
    await cp(resolve(root,".hosting","hosting.json"),resolve(out,"hosting.json"));
    const migrations=resolve(root,"drizzle");
    try{await access(migrations);await cp(migrations,resolve(out,"drizzle"),{recursive:true});}catch(e){if((e as NodeJS.ErrnoException).code!=="ENOENT")throw e;}
  }};
}
