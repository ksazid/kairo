import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const committed=spawnSync("git",["show","HEAD:package-lock.json"],{encoding:"utf8"});
if(committed.error)throw committed.error;
if(committed.status!==0)process.exit(committed.status??1);

function canonical(value){
  if(Array.isArray(value))return value.map(canonical);
  if(value&&typeof value==="object")return Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])]));
  return value;
}

const before=canonical(JSON.parse(committed.stdout));
const after=canonical(JSON.parse(readFileSync("package-lock.json","utf8")));
if(JSON.stringify(before)!==JSON.stringify(after)){
  console.error("package-lock.json is not synchronized with package manifests");
  process.exit(1);
}
console.log("package-lock.json is semantically synchronized");
