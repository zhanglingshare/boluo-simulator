"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const read=name=>fs.readFileSync(path.join(root,name),"utf8");
const window={};
vm.runInNewContext(read("v11/sem-demo.js"),{window});
const engine=window.BoluoSemDemo;
test("SEM teaching engine is deterministic and anchored to public 2026 observation",()=>{
  assert.equal(engine.anchors.investmentIndex,55.3);
  assert.equal(engine.anchors.productionIndex,108.9);
  const base=engine.calculate({investmentIndex:55.3,network:50});
  assert.equal(base.total,0);
  assert.equal(base.direct,0);
  assert.equal(base.indirect,0);
  const a=engine.calculate({investmentIndex:100,network:50});
  const b=engine.calculate({investmentIndex:100,network:80});
  assert.ok(a.total>0);
  assert.ok(a.indirect>0);
  assert.ok(b.indirect>a.indirect,"illustrative moderator must change indirect path");
  assert.ok(Math.abs(a.total-(a.direct+a.indirect))<1e-12);
});
test("out of range inputs are bounded",()=>{
  const r=engine.calculate({investmentIndex:9000,network:-50});
  assert.equal(r.investmentIndex,110);
  assert.equal(r.network,20);
  assert.ok(Number.isFinite(r.total));
});
test("page 07 and 08 explicitly label teaching assumptions",()=>{
  const wind=read("v11/wind.html");
  const insights=read("v11/insights.html");
  assert.match(wind,/id="semInvestment"/);
  assert.match(wind,/id="semToEight"/);
  assert.match(wind,/不是GDP亿元/);
  assert.match(insights,/所有圆点位置均为教学假设/);
  assert.match(insights,/非实测系数/);
  assert.match(insights,/id="mapDots"/);
  assert.match(insights,/sem-input-template.csv/);
});
test("page links and script assets exist",()=>{
  for(const name of ["v11/sem-demo.js","v11/sem-bridge.js","v11/sem-bridge.css",
  "v11/sem-lab.js","v11/sem-lab.css","v11/insights.html",
  "v11/sem-method-kit.md","v11/sem-input-template.csv"])assert.ok(fs.existsSync(path.join(root,name)),name);
  for(const name of ["v11/sem-demo.js","v11/sem-bridge.js","v11/sem-lab.js"])assert.doesNotThrow(()=>new Function(read(name)),name);
  for(const name of ["v11/index.html","v11/industry-base.html","v11/relations.html","v11/impact.html","v11/plan.html","v11/wind.html"])
    assert.ok(read(name).includes('href="./insights.html"'),name+" 08 link");
});
test("no pseudo-data rows in the SmartPLS collection template",()=>{
  const lines=read("v11/sem-input-template.csv").trim().split(/\r?\n/);
  assert.equal(lines.length,1);
  assert.match(lines[0],/unit_id,period/);
});
