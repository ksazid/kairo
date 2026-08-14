import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const committed=spawnSync("git",["show","HEAD:package-lock.json"],{encoding:"utf8"});
if(committed.error)throw committed.error;
if(committed.status!==0)process.exit(committed.status??1);

function canonical(value){
  if(Array.isArray(value))return value.map(canonical);
  if(value&&typeof value==="object")return Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])]));
  return value;
}

const currentLock=readFileSync("package-lock.json","utf8");
const before=canonical(JSON.parse(committed.stdout));
const after=canonical(JSON.parse(currentLock));
if(JSON.stringify(before)!==JSON.stringify(after)){
  console.warn("package-lock.json drift detected during VS-11 security readiness; exporting regenerated lock for review");
  mkdirSync("dashboard",{recursive:true});
  writeFileSync("dashboard/regenerated-package-lock.json",currentLock);
  process.exit(0);
}
console.log("package-lock.json is semantically synchronized");
