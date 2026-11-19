/* Boluo V11 strategic coach scenario-engine regression checks.
 * Node built-ins only; synthetic parameters are not real economic estimates.
 */
"use strict";
const assert=require("node:assert/strict");
const Coach=require("../v11/internal/coach-core-v1.js");

const context={
 score:84,resources:[65,81,53,72,60],resilience:4,recovery:3,fatigue:3,
 networkScore:1.2,policy:"technology",horizon:28,
 roster:[{id:"huatong"},{id:"unionfoil"}],
 edges:[{a:"huatong",b:"unionfoil",w:.74},{a:"huatong",b:"bolan",w:.4}]
};
const before=JSON.stringify(context);
const a=Coach.forecast(context,{n:550,seed:20261120,horizon:28});
const again=Coach.forecast(context,{n:550,seed:20261120,horizon:28});
assert.deepEqual(a,again,"Seeded forecasts must be exactly reproducible");
assert.equal(a.n,550);
assert.equal(a.path.length,29,"28-quarter forecasts include opening state");
assert.ok(a.p10<=a.p50 && a.p50<=a.p90,"Forecast quantiles are ordered");
assert.ok(a.path.every(q=>q.p10>=0&&q.p90<=100&&q.p10<=q.p50&&q.p50<=q.p90));
assert.ok(a.atOrAboveStart>=0&&a.atOrAboveStart<=100);

const uncertainty=Coach.sensitivity(context,{n:110,seed:20261120});
assert.equal(uncertainty.items.length,5);
assert.deepEqual(uncertainty.items.map(x=>x.amplitude),uncertainty.items.map(x=>x.amplitude).sort((a,b)=>b-a));
assert.ok(uncertainty.items.some(x=>x.key==="network"&&x.amplitude>.01),"Redundancy must influence scenarios");
assert.ok(uncertainty.items.every(x=>Number.isFinite(x.low)&&Number.isFinite(x.high)));

const duels=Coach.pairedPolicies(context,"supply",{n:450,seed:3001,factors:{volatility:1.25}});
assert.equal(duels.n,450);
assert.ok(duels.p10<=duels.p50&&duels.p50<=duels.p90);
assert.ok(duels.improved>=0&&duels.improved<=100);
assert.deepEqual(duels,Coach.pairedPolicies(context,"supply",{n:450,seed:3001,factors:{volatility:1.25}}));

const graph=Coach.graph(context);
assert.equal(graph.assumedLinks,2);
assert.equal(graph.nodes.length,2);
assert.equal(graph.nodes[0].id,"huatong");
assert.ok(graph.nodes[0].removalShare>=graph.nodes[1].removalShare);
assert.equal(Coach.graph({...context,roster:[],edges:[]}).nodes.length,0);

const mechanism=Coach.mechanism(context);
assert.equal(mechanism.paths.length,8);
assert.equal(mechanism.n,260);
assert.equal(mechanism.bootstrap,140);
assert.ok(mechanism.indirect>0);
assert.ok(mechanism.paths.every(p=>p.low<=p.coef&&p.coef<=p.high));
assert.deepEqual(mechanism,Coach.mechanism(context),"Synthetic path estimation is deterministic");

assert.equal(JSON.stringify(context),before,"Analyses must not mutate live user state");
console.log("PASS: Boluo V11 coach seeded distributions, path estimation, sensitivity and network checks");
