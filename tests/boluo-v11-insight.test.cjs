"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm"),path=require("node:path");
test("insight teaching model is bounded and substitution reduces illustrative pressure",()=>{
 const ctx={};ctx.window=ctx;vm.createContext(ctx);
 vm.runInContext(fs.readFileSync(path.join(__dirname,"../v11/insight-engine.js"),"utf8"),ctx);
 const E=ctx.BoluoInsightEngine,f={id:"a",importance:85,performance:40,substitute:30};
 const noBuffer=E.exposure(f,70,0),withBuffer=E.exposure(f,70,75);
 assert(noBuffer>withBuffer&&withBuffer>=0&&noBuffer<=100);
 const r=E.analyze([f,{id:"b",importance:40,performance:65,substitute:45}],"a",70);
 assert.equal(r.rows.length,2);
 assert(r.highImpact&&Number.isFinite(r.full));
 assert(E.grid(f).length>=1);
});
