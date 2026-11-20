"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm"),path=require("node:path");
const root=path.resolve(__dirname,".."),read=p=>fs.readFileSync(path.join(root,p),"utf8");
const sandbox={};sandbox.window=sandbox;vm.createContext(sandbox);
vm.runInContext(read("lab-2032/core.js"),sandbox,{filename:"lab-2032/core.js"});
const W=require("../core/world/world-engine-v1.js"),C=sandbox.BoluoCore;
const original=C.demo(),id=C.identity(original);
const publicData=JSON.parse(read("core/data/boluo-public-anchors-2026.v1.json"));
const init=W.createWorld(original,{seed:20261120,projectDelayQuarters:4,affectedPct:50,
 publicBaseline:{year:2025,gdp:publicData.records.find(x=>x.year===2025&&x.period==="FY").gdp}});
assert.equal(init.firms.length,830);assert.equal(init.links.length,1699);assert.equal(init.projects.length,72);
assert.equal(init.schema,"boluo-living-world/1");
assert.equal(W.linkOrder({source:"I0001",target:"S0001",type:"professional_service",value:1}).buyer,"I0001");
assert.equal(W.linkOrder({source:"A0001",target:"I0001",type:"agricultural_processing",value:1}).buyer,"I0001");
const before=JSON.stringify(init);
const full=W.run(init,28);
assert.equal(JSON.stringify(init),before,"source world must remain untouched");
assert.equal(C.identity(original),id,"input dataset unchanged");
assert.equal(full.q,28);assert.equal(full.history.length,28);
assert(full.history.every(h=>h.balanced&&h.ledgerResidualMax===0));
assert(full.history.every(h=>h.grossProduction>=0&&h.sampleValueAddedProxy>=0));
assert(full.history.some(h=>h.projectsActivated>0),"projects actually arrive");
assert(full.history.every(h=>h.outsideSales>=0&&h.internalTrade>=0));
for(const f of full.firms){
 assert(f.cash>=0&&f.raw>=0&&f.finished>=0,"no negative stocks");
 assert(Number.isFinite(f.capacity)&&Number.isFinite(f.quarterVA));
}
const repeated=W.run(init,28);
assert.deepEqual(full,repeated,"fixed seed, same initial world and policy must produce identical world");
const shaken={};
for(let q=0;q<12;q++)shaken[q]={demandMultiplier:.77,supplyDisruption:.75};
const stressed=W.run(init,12,{},shaken),normal=W.run(init,12);
assert(stressed.history[11].sampleValueAddedProxy<normal.history[11].sampleValueAddedProxy,
 "external supply and demand shock should reduce sample economy");
const skills=W.run(init,4,{0:[{type:"skills",target:"I0001"}]});
assert(skills.actions.some(x=>x.type==="skills"));
assert(skills.firms.find(x=>x.id==="I0001").talent>normal.firms.find(x=>x.id==="I0001").talent);
assert.equal(skills.history[0].policy[0].cost,10,"policy must consume credits");
assert(W.step(init,[{type:"skills",target:"I0001"}]).budget<100,"quarterly budget cost is enforced before replenishment");
const expedite=W.run(init,8,{0:[{type:"expedite",target:"P001"}]});
assert(expedite.projects.find(x=>x.id==="P001").arrivalQ<normal.projects.find(x=>x.id==="P001").arrivalQ);
const compared=W.compare(init,8,{0:[{type:"skills",target:"I0001"}]});
assert.equal(compared.schema,"boluo-world-compare/1");
assert(compared.firstDifferentQuarter>=0);
assert.equal(compared.warning.includes("NOT causal"),true);
assert.throws(()=>W.step(init,[{type:"skills",target:"DOES_NOT_EXIST"}]),/active firm/);
assert.throws(()=>W.createWorld({...original,meta:{...original.meta,enterprise_revenue_unit:"unknown"}}),/million_CNY/);
assert.throws(()=>W.step(init,[],{supplyDisruption:4}),/Supply disruption/);
assert.throws(()=>W.step(full),/28-quarter/);
console.log("PASS world economy: 830 synthetic firms, 1699 links, 72 projects, 28 quarters, identity, cash/input/inventory invariants, deterministic paired policies, real autonomy and shocks");
console.log(JSON.stringify({startingGDP2025PublicReference:init.publicBaseline.gdp,
 firms:full.firms.length,links:full.links.length,projects:full.projects.length,
 firstQuarter:full.history[0],lastQuarter:full.history.at(-1),stressSampleVA:stressed.history.at(-1).sampleValueAddedProxy,
 baselineSampleVA:normal.history.at(-1).sampleValueAddedProxy}).slice(0,1600));
