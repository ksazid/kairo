import { spawnSync } from "node:child_process";

const result=spawnSync("git",["diff","--exit-code","--","package-lock.json"],{stdio:"inherit"});
if(result.error)throw result.error;
if(result.status!==0){
  console.error("package-lock.json is not synchronized with package manifests");
  process.exit(result.status??1);
}
console.log("package-lock.json is synchronized");
