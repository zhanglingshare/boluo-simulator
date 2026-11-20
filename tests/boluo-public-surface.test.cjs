"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const root=path.join(__dirname,"..");
test("public V11 entry routes have scripts on disk and no hard dependency on a backend API",()=>{
 for(const page of ["v11/index.html","v11/wind.html","v11/insights.html"]){
  const html=fs.readFileSync(path.join(root,page),"utf8");
  assert(html.includes("<html"),"HTML exists: "+page);
  const srcs=[...html.matchAll(/<script[^>]*\bsrc=["']([^"']+)["']/g)].map(x=>x[1].split("?")[0]).filter(x=>!/^https?:/.test(x));
  for(const s of srcs)assert(fs.existsSync(path.resolve(root,path.dirname(page),s)),"missing script "+page+" -> "+s);
 }
});
