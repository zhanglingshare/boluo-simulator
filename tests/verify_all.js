"use strict";
/* Repository verification entrypoint. Runs existing offline tests and syntax checks only. */
const fs=require("node:fs");
const path=require("node:path");
const {spawnSync}=require("node:child_process");
const root=path.resolve(__dirname,"..");
const syntaxFiles=[
 "v11/brief-data.js",
 "v11/brief.js",
 "v11/region.js",
 "v11/region-lab.js",
 "v11/challenge.js",
 "v11/future-core.js",
 "v11/future.js",
 "v11/visual-story.js"
];
function run(args,label){
 const r=spawnSync(process.execPath,args,{cwd:root,stdio:"inherit",encoding:"utf8"});
 if(r.error)throw r.error;
 if(r.status!==0){console.error("\nQUALITY GATE FAILED: "+label+" (exit "+r.status+")");process.exit(r.status||1);}
}
for(const file of syntaxFiles){
 if(!fs.existsSync(path.join(root,file)))throw new Error("Missing syntax target: "+file);
 run(["--check",file],"syntax "+file);
}
const tests=fs.readdirSync(path.join(root,"tests")).filter(x=>/\.test\.cjs$/.test(x)).sort().map(x=>"tests/"+x);
if(!tests.length)throw new Error("No offline Node test files found.");
run(["--test",...tests],"offline contract, data and evidence tests");
console.log("\nQUALITY GATE PASSED: "+syntaxFiles.length+" syntax targets; "+tests.length+" test files.");
