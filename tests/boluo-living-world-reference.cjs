"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm"),path=require("node:path");
const root=path.resolve(__dirname,".."),file=p=>fs.readFileSync(path.join(root,p),"utf8");
const c={};c.window=c;vm.createContext(c);vm.runInContext(file("lab-2032/core.js"),c);
const World=require("../core/world/world-engine-v1.js");
const ref=JSON.parse(file("core/world/world-reference-2026-2032.v1.json"));
const d=c.BoluoCore.demo();
const start=World.createWorld(d,{seed:ref.seed,projectDelayQuarters:4,affectedPct:50,
 publicBaseline:ref.publicGDPFY2025,dataFingerprint:c.BoluoCore.identity(d)});
assert.equal(ref.evidence.count.firms,start.firms.length);
assert.equal(ref.evidence.count.links,start.links.length);
const env={};for(let q=2;q<8;q++)env[q]={demandMultiplier:.94,supplyDisruption:.55};
const arr=[
 ["baseline",World.run(start,28)],
 ["supplyStress",World.run(start,28,{},env)],
 ["policyWithStress",World.run(start,28,{0:[{type:"skills",target:"I0236"}],2:[{type:"substitute",target:"I0236"}]},env)]
];
for(const [key,w] of arr){
 assert.deepEqual(w.history.at(-1),ref[key].lastQuarter,key+" last-quarter result changed");
 assert.equal(w.history.reduce((a,x)=>a+x.projectsActivated,0),ref[key].totalProjectsActivated);
 const currentTrades=w.lastTrades.reduce((a,x)=>a+x.amount,0);
 assert(Math.abs(currentTrades-w.history.at(-1).internalTrade)<.0001,"settled trade quantity reconciles to network result");
 assert.equal(w.lastTrades.length,w.history.at(-1).tradedEdges);
 assert(w.history.every(x=>x.balanced),"all quarters balance");
}
console.log("PASS committed world reference: 28Q full run, exact 2025 macro anchor, stress and decision paired traces, changing transaction links");
