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

test("07 and 08 use meaningful animated visualizations and direct controls",()=>{
 const w=read("v11/wind.html");
 const i=read("v11/insights.html");
 const css=read("v11/sem-viz-stage.css");
 const js=read("v11/sem-viz-stage.js");
 assert.match(w,/id="semVisualStage"/);
 assert.match(w,/id="vizBarDirect"/);
 assert.match(w,/id="vizBarIndirect"/);
 assert.match(w,/id="vizBarTotal"/);
 assert.match(w,/data-viz-preset="100"/);
 assert.match(w,/id="vizFocusBody"/);
 assert.match(i,/id="blindspotScene"/);
 assert.match(i,/id="blindspotOrbit"/);
 assert.match(i,/id="blindspotSvg"/);
 assert.match(i,/id="blindspotNext"/);
 assert.match(i,/id="blindspotToggle"/);
 assert.match(js,/classList\.toggle\("is-cut"/);
 assert.match(js,/severed=!severed/);
 assert.match(i,/两个公开观察窗口/);
 assert.match(css,/@media\(max-width:760px\)/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.match(css,/vizWire/);
 assert.match(js,/m.calculate/);
 assert.match(js,/\.dispatchEvent\(new Event\("input"/);
 assert.match(js,/BoluoInsights\.getState/);
 assert.doesNotThrow(()=>new Function(js));
});
test("illustrative effect decomposition may reverse, but does not become GDP",()=>{
 const weak=engine.calculate({investmentIndex:45,network:30});
 const stronger=engine.calculate({investmentIndex:100,network:80});
 assert.ok(weak.total<0);
 assert.ok(stronger.total>0);
 assert.ok(Math.abs(stronger.total-(stronger.direct+stronger.indirect))<1e-12);
 const w=read("v11/wind.html");
 const i=read("v11/insights.html");
 assert.match(w,/不是结构模型的因果证据/);
 assert.match(w,/绝不是已经估计的博罗实证系数或GDP变化/);
 assert.match(i,/连线表达待检验的候选机制/);
});
