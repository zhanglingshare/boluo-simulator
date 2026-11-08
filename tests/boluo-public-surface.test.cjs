"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,".."),read=p=>fs.readFileSync(path.join(root,p),"utf8");
const current=["v11/index.html","v11/reality.html","v11/industry-base.html","v11/relations.html","v11/impact.html","v11/plan.html","v11/wind.html","v11/insights.html"];
test("V11 public pages do not expose named statistical software or research formula lessons",()=>{
 for(const p of current){
  const c=read(p).replace(/<script[^>]*>[\s\S]*?<\/script>/g,"");
  assert.doesNotMatch(c,/SmartPLS|PLS-SEM|\bIPMA\b|蒙特卡洛|Monte Carlo|\bSNA\b|\bSEM\b/i,p);
 }
});
test("public source does not re-include retired coefficient displays",()=>{
 const wind=read("v11/wind.html"),insights=read("v11/insights.html");
 assert.doesNotMatch(wind,/sem-demo\.js|path-lab\.js|sem-bridge\.js|sem-viz-stage\.js|coefAInput|coefBInput|coefCInput|coefZInput|semVisualStage/);
 assert.doesNotMatch(insights,/sem-demo\.js/);
 assert.match(insights,/insight-topics\.js/);
});
test("relationship output does not ship internal weight recipe",()=>{
 const rel=JSON.parse(read("data/relationship-changes-v1.json"));
 assert.ok(!Object.hasOwn(rel.score_meta||{},"weights"));
 assert.ok(!Object.hasOwn(rel.score_meta||{},"method"));
 assert.ok(!Object.hasOwn(rel.score_meta||{},"generated_by"));
 const atlas=JSON.parse(read("experiments/holo-single/data/atlas.json"));
 assert.ok(Array.isArray(atlas.flows));
 for(const flow of atlas.flows) {
  assert.doesNotMatch(String(flow.formula||""),/就业基数|乘以|\d+%\s*\/\s*\d+%/);
  assert.doesNotMatch(String(flow.method||""),/就业密度法|结构系数法|自下而上/);
 }
});
test("public documentation does not restate internal scoring construction",()=>{
 for(const p of ["README.md","AGENTS.md","docs/SKILLS-INTEGRATION.md","docs/DATA-DICTIONARY.md","docs/DATA-GOVERNANCE.md","experiments/holo-single/ARCHITECTURE.md","experiments/holo-single/DATA_DICTIONARY.md"]){
  const c=read(p);
  assert.doesNotMatch(c,/节点度之和[×*]|B\s*级\s*0\.12|NODE_TYPE_W|\bmu\s*:\s*250|xToM\s*:\s*\.45/);
 }
});
