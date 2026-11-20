"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm"),path=require("node:path");
test("existing synthetic PLS source model runs with finite paths",()=>{
 const sandbox={};sandbox.window=sandbox;vm.createContext(sandbox);
 for(const p of ["lab-2032/core.js","lab-2032/engine.js"])vm.runInContext(fs.readFileSync(path.join(__dirname,"..",p),"utf8"),sandbox,{filename:p});
 const data=sandbox.BoluoCore.demo(),fit=sandbox.BoluoEngine.models(data,{seed:20261120,bootstrap:8});
 assert.equal(fit.n,420);assert.equal(fit.model_id,"experimental-mode-a-pls-v2");
 for(const v of Object.values(fit.fit.paths))assert(Number.isFinite(v));
 assert.equal(fit.bootstrap,8);assert(fit.notes.some(s=>s.includes("SmartPLS")));
});
