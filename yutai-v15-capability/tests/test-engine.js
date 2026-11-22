const assert=require('node:assert/strict');
const E=require('../kernel/engine.js');
global.window={};require('../data/scenarios.js');
const scenarios=window.UTEK_SCENARIOS,w=E.createWorld(scenarios);
assert.equal(scenarios.length,6);
assert.equal(w.stats().calls,300);
assert.equal(w.ledger.verify(),true);
for(const s of scenarios){
 const p=w.profiles[s.id];
 assert.equal(p.n,50);
 assert.equal(p.vals.length,6);
 assert.ok(p.vals.every(x=>x>=0&&x<=100));
 assert.ok(p.confidence.lo<=p.successRate&&p.confidence.hi>=p.successRate);
 assert.equal(E.funnel(w.ledger.events.filter(e=>e.token===s.token)).length,7);
 assert.equal(E.benchmark(s,p).length,3);
}
const n=w.stats().calls;w.run('research');
assert.equal(w.stats().calls,n+1);assert.ok(w.ledger.verify());
assert.ok(w.profiles.cooling.authority<3);
const l=new E.Ledger();l.append('T','call',{success:true},1);
assert.ok(l.verify());l.events[0]={...l.events[0],kind:'tampered'};
assert.equal(l.verify(),false);
console.log('PASS V15: six scenarios, six-dimensional metrics, lifecycle, benchmarks, governance, append-only consistency');