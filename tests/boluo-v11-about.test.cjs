"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const html=read("v11/about.html");
const css=read("v11/about-v11.css");
const readme=read("README.md");
const expected=[
"index.html","holo.html","base-target.html","industry-chain.html",
"impact.html","plan.html","wind.html","insights.html",
"challenge.html","region.html","brief.html","future.html"
];
test("public V11 introduction includes the twelve real experiences",()=>{
 assert.equal((html.match(/<details class="capability">/g)||[]).length,12);
 for(const file of expected){
  assert.ok(html.includes('href="./'+file+'"'),file);
  assert.ok(fs.existsSync(path.join(root,"v11",file)),file);
 }
 assert.match(html,/可以做什么/);
 assert.match(html,/为什么重要/);
 assert.match(html,/不只可以看/);
 assert.match(html,/没有预设哪一种一定发生/);
});
test("public prose focuses on capability and value, without naming internal techniques",()=>{
 const banned=/\b(?:SNA|SEM|SmartPLS|PLS-SNA|Monte Carlo)\b|蒙特卡洛|算法|内部推演|参数矩阵|系数/gi;
 assert.equal((html.match(banned)||[]).length,0);
 assert.equal((readme.match(banned)||[]).length,0);
 assert.match(readme,/你可以做什么，为什么重要/);
 assert.match(readme,/使用时需要知道/);
 for(const file of expected)assert.ok(readme.includes('v11/'+file),file);
});
test("styles and markup support phone, desktop and reduced motion",()=>{
 assert.match(html,/name="viewport"/);
 assert.match(html,/about-v11.css/);
 assert.match(css,/@media\(max-width:620px\)/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(html,/<main id="main">/);
 assert.match(html,/<footer class="footer">/);
 const links=[...html.matchAll(/href="\.\/([^"?]+\.html)"/g)].map(x=>x[1]);
 for(const f of links)assert.ok(fs.existsSync(path.join(root,"v11",f)),f);
});
