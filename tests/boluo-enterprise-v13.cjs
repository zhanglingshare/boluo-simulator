'use strict';
const assert=require('node:assert/strict');
const A=require('../v11/internal/enterprise-attributes-v13.js');
const examples=[
 {id:'huatong',team:'secondary',club:'新一代电子信息',role:'重点主体候选',tags:['HDI','SMT']},
 {id:'banyongkang',team:'primary',club:'农业产业化',role:'骨干企业',tags:['稻谷加工','种植']},
 {id:'luofushantravel',team:'tertiary',club:'罗浮山旅游服务',role:'服务主体候选',tags:['旅游','客流']}
];
const r={values:[78,65,83,76,70,82],pot:90,ovr:78};
for(const p of examples){
 const source=JSON.stringify({p,r}),d=A.profile(p,r);
 assert.equal(d.count,36,'six categories each have six tactical traits');
 assert.equal(d.groups.length,6);
 assert.equal(new Set(d.all.map(m=>m.id)).size,36,'no duplicates');
 assert.ok(d.all.every(m=>m.value>=2&&m.value<=99));
 assert.ok(d.all.every(m=>m.developmentPotential>=2&&m.developmentPotential<=99));
 assert.ok(d.groups.every(g=>Math.abs(g.items.reduce((s,x)=>s+x.value,0)/6-g.score)<1),
  'sub-attribute group averages stay anchored to the old six-dimensional engine');
 for(const [kind,risk] of Object.entries(d.exposures)){
  assert.ok(Math.abs(A.exposure(p,r,kind)-risk)<.11,'fast event exposure must match full scouting card');
 }
 for(const [role,score] of Object.entries(d.roles)){
  assert.ok(Math.abs(A.roleFit(p,r,role)-score)<.11,'fast role match must equal scouting card');
 }
 const resources=A.resourceFactors(p,r);
 assert.equal(resources.length,5);
 assert.ok(resources.every(x=>x>=.84&&x<=1.16));
 assert.equal(JSON.stringify({p,r}),source,'computation never changes source data');
 assert.equal(A.profile(p,r),d,'repeat inspection uses stable cache');
}
const anchor=A.profile(examples[0],{values:[95,88,94,88,76,87],ovr:90,pot:94});
assert.ok(anchor.roles.core>anchor.roles.reserve+15,'mature industry anchor must not automatically top reserve slots');
const newer=A.profile(examples[0],{values:[95,90,98,91,77,88],ovr:93,pot:95});
assert.ok(newer.traits.rnd.value>=anchor.traits.rnd.value,'technical investment affects related sub-skills');
const less=A.profile(examples[0],{values:[95,88,75,67,59,87],ovr:83,pot:94});
assert.ok(less.exposures.supply>anchor.exposures.supply,'lower readiness worsens supply disruption exposure');
assert.match(A.profile(examples[1],r).traits.capacity.label,/种养/);
assert.match(A.profile(examples[2],r).traits.capacity.label,/服务/);
console.log('PASS: 36 enterprise traits, sector identities, role fit, risk response and legacy-six consistency');
