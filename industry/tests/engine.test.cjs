'use strict';
const assert = require('node:assert/strict');
const E = require('../engine.js');
let checks = 0;
function test(name, body) { body(); checks++; console.log('PASS', name); }
test('fixed input and seed reproduce the same scenario', () => assert.deepEqual(E.run({demand:140}), E.run({demand:140})));
test('serial flow conserves incoming orders over multiple periods', () => {
  for(const demand of [50,100,140,200]) for(const processing of [70,150]) for(const packing of [60,160]) {
    const r=E.trajectory({demand,processing,packing,shipping:80,periods:8},'none');
    assert.ok(Math.abs(r.incoming-r.delivered-r.backlog)<1e-7);
    assert.ok(r.delivered>=0&&r.delivered<=r.incoming);
    for(const row of r.rows) for(const key of ['waitingProcess','waitingPack','waitingShip']) assert.ok(row[key]>=-1e-8);
  }
});
test('ample capacities clear all hypothetical orders', () => {
  const r=E.run({demand:100,processing:200,packing:200,shipping:200,uncertainty:0});
  assert.equal(r.delivery.middle,100);assert.equal(r.backlog.middle,0);assert.equal(r.bottleneck,null);
});
test('bottleneck moves when packaging support is increased', () => {
  const p={demand:140,processing:125,packing:115,shipping:130,uncertainty:0};
  const a=E.run(p,'none'),b=E.run(p,'packaging');
  assert.equal(a.bottleneck,'packing');assert.equal(b.bottleneck,'processing');assert.ok(b.delivery.middle>a.delivery.middle);
});
test('shipping support cannot magically clear an upstream constraint', () => {
  const p={demand:150,processing:90,packing:150,shipping:160,uncertainty:0};
  assert.equal(E.run(p,'none').delivery.middle,E.run(p,'coordination').delivery.middle);
});
test('increasing demand never improves the delivered share under fixed capacities', () => {
  let previous=101;
  for(const demand of [60,80,100,120,140,180,200]) {const r=E.run({...E.DEFAULTS,demand});assert.ok(r.delivery.middle<=previous+1e-8);previous=r.delivery.middle;}
});
test('invalid and untrusted inputs stay within supported bounds', () => {
  const p=E.clean({demand:NaN,processing:-1,packing:Infinity,shipping:1e12,uncertainty:90,periods:0,seed:-20});
  assert.equal(p.demand,100);assert.equal(p.processing,1);assert.equal(p.packing,115);assert.equal(p.shipping,100000);assert.equal(p.uncertainty,30);assert.equal(p.periods,1);assert.equal(p.seed,1);
  assert.deepEqual(E.run({},'bad-bridge'),E.run({},'none'));
});
test('conditional bands are ordered and never labelled world probabilities',()=>{
  const r=E.run({demand:140,uncertainty:20});assert.ok(r.delivery.low<=r.delivery.middle&&r.delivery.middle<=r.delivery.high);assert.ok(r.delivery.high<=100);assert.ok(r.backlog.low>=0);
});
console.log(`${checks} meaningful model checks passed.`);
