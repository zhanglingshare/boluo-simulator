"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,".."),read=p=>fs.readFileSync(path.join(root,p),"utf8");
test("official project introduction is linked from V11 and stays distinct from legacy interactive intro",()=>{
 const about=read("v11/about.html"),home=read("v11/index.html");
 assert.match(about,/<title>关于项目｜博罗决策风洞 V11<\/title>/);
 assert.match(about,/<h1 id="heroTitle">/);
 assert.match(home,/href="\.\/about\.html"/);
 for(const p of ["index.html","relations.html","wind.html","insights.html"])
  assert.match(about,new RegExp('href="\\./'+p.replace(".","\\.")+'"'));
 assert.ok(fs.existsSync(path.join(root,"v11/about.css")));
});
test("project introduction explains experience and limits without internal research recipes",()=>{
 const html=read("v11/about.html"),content=html.replace(/<script[\s\S]*?<\/script>/gi,"");
 for(const phrase of ["哪些变化，与你有关","今天，哪里变了","它会牵动谁","如果情况不同呢","我们漏看了什么","不要把“如果”当成“已经”"])assert.ok(content.includes(phrase),phrase);
 assert.doesNotMatch(content,/SmartPLS|PLS-SEM|\bSEM\b|\bSNA\b|蒙特卡洛|随机种子|权重系数|中介效应|调节效应|采集→|变量拆解|方法论|技术架构|内部模型/);
 assert.match(content,/不是对未来的保证/);
 assert.match(content,/不自动证明因果/);
});
