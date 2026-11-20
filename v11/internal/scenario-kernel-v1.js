/* Shared industry scenario kernel v1. Fictional archetypes only.
   No mapping to named real-world enterprises or measured GDP. */
(function(root){
"use strict";
const ids=["A","B","C","D","E","F"];
const names=["电子零部件骨干","先进装备成长型","食品加工链主型","专业物流服务型","特色农业合作型","数字技术服务型"];
// Dimensions are group averages from the fictional 24-attribute scout roster.
const cap=[[80,69,60,66,74,73],[72,79,67,60,60,75],[73,49,67,72,76,65],[77,64,72,67,73,75],[57,40,49,49,63,58],[81,88,74,78,60,89]];
// from→to: demonstration exposure. Outgoing shock propagates to the dependent node.
const links=[[0,1,.7],[0,3,.8],[1,0,.6],[1,5,.5],[2,3,.65],[2,4,.9],[3,0,.65],[3,2,.7],[4,2,.8],[4,3,.6],[5,0,.5],[5,1,.7],[5,3,.55]];
const bound=(x,min,max)=>Math.max(min,Math.min(max,Number(x)||0));
function input(v){return {demand:bound(v.demand,0,60),supply:bound(v.supply,0,70),tech:bound(v.tech,0,50)}}
function step(v,noise){
 const p=input(v),direct=cap.map((d,i)=>((p.demand/100)*(1-d[2]/170)+(p.supply/100)*(1-d[0]/175))*(1-(p.tech/100)*(d[1]/105))*noise[i]);
 let effects=direct.slice();
 // True synchronous two-hop model: no traversal-order dependence.
 for(let t=0;t<2;t++){
  const delta=Array(6).fill(0);
  for(const [from,to,w] of links)delta[to]+=effects[from]*w*(t===0?.13:.07);
  effects=direct.map((d,i)=>d+delta[i]);
 }
 return effects.map(x=>Math.max(0,x*100));
}
function seeded(seed){let s=seed>>>0;return ()=>{s=(1664525*s+1013904223)>>>0;return s/4294967296}}
function evaluate(v,draws=500){
 const p=input(v),n=bound(draws,100,2000),random=seeded(20261120),baseline=step(p,Array(6).fill(1));
 const trials=[];
 for(let t=0;t<n;t++){
  const noise=Array.from({length:6},()=>1+(random()+random()+random()-1.5)*.42);
  trials.push(step(p,noise).reduce((a,b)=>a+b,0)/6);
 }
 trials.sort((a,b)=>a-b);
 const q=x=>trials[Math.floor((trials.length-1)*x)];
 const median=q(.5);
 const sens={};
 for(const key of ["demand","supply","tech"]){
  const lo=input({...p,[key]:p[key]-5}),hi=input({...p,[key]:p[key]+5});
  const v0=step(lo,Array(6).fill(1)).reduce((a,b)=>a+b,0)/6;
  const v1=step(hi,Array(6).fill(1)).reduce((a,b)=>a+b,0)/6;
  sens[key]=+(v1-v0).toFixed(2);
 }
 const rank=baseline.map((value,i)=>({id:ids[i],name:names[i],value:+value.toFixed(2)})).sort((a,b)=>b.value-a.value);
 return {schema:1,params:p,baselineMean:+(baseline.reduce((a,b)=>a+b,0)/6).toFixed(2),median:+median.toFixed(2),p10:+q(.1).toFixed(2),p90:+q(.9).toFixed(2),sensitivity:sens,rank,trials,draws:n,model:"shared-demo-v1"};
}
root.BoluoScenarioKernel=Object.freeze({evaluate,input,names,links});
})(window);
