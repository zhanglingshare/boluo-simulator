/* 柏塘产业级情景实验 v1 — 公开数据只用于事实基线；模拟为假设指数，不是已校准预测。
 * 2025年产业结构指数=100。 Monte Carlo with seeded, correlated yearly shocks.
 * 变更、算法和参数可复现。无SEM样本，不报告已估系数。
 */
(function(root){
'use strict';
const KEYS=['quality','processing','channels','tourism','coordination'];
const LABELS=['品质标准','加工产品','品牌渠道','茶旅转化','组织协同'];
const DEFAULT=[24,22,21,16,17];
const PRESETS={
balance:{name:'均衡推进',weights:[24,22,21,16,17]},
quality:{name:'品质优先',weights:[40,13,17,10,20]},
process:{name:'加工与产品',weights:[15,42,20,10,13]},
channel:{name:'渠道与品牌',weights:[17,16,41,13,13]},
tourism:{name:'茶旅体验',weights:[16,13,17,42,12]},
collaboration:{name:'组织协同',weights:[19,18,17,14,32]}
};
const STRESSES={
none:{name:'正常波动',note:'仅包含年度随机扰动'},
demand:{name:'外部需求收缩',note:'假设2029年市场需求负面冲击，后续逐步恢复'},
labor:{name:'采茶劳动力紧张',note:'假设2029年产地劳动力约束加剧'},
project:{name:'加工项目晚两年',note:'假设2028—2029年加工升级效果推迟'},
tourism:{name:'茶旅热度退潮',note:'假设2029年茶旅需求下滑'},
compound:{name:'双重冲击',note:'假设2029年需求与劳动力压力同时发生'}
};
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function normalize(weights){
 const w=(Array.isArray(weights)&&weights.length===5?weights:DEFAULT).map(x=>clamp(Number.isFinite(+x)?+x:0,0,100));
 const sum=w.reduce((a,b)=>a+b,0);
 return sum>0?w.map(x=>x/sum*100):DEFAULT.slice();
}
function rng(seed){let s=(seed|0)>>>0;return ()=>{s+=0x6D2B79F5;let t=s;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296}}
function normal(random){return Math.sqrt(-2*Math.log(Math.max(1e-12,random())))*Math.cos(2*Math.PI*random())}
function quantile(sorted,p){const k=(sorted.length-1)*p,i=Math.floor(k);return sorted[i]+(sorted[Math.ceil(k)]-sorted[i])*(k-i)}
const f=n=>Math.round(n*10)/10;
function scoreGrowth(year,w,world,execution,shock) {
 const q=w[0]/100,p=w[1]/100,c=w[2]/100,t=w[3]/100,o=w[4]/100;
 const mature=Math.min(1,(year-2025)/4);
 const qual=0.029*q*(0.4+0.6*mature);
 const proc=0.049*p*(year<=2027?0.25:(year===2028?0.72:1))*execution;
 const channel=0.040*c*(0.6+0.4*mature)*(0.66+0.35*q*3);
 const tourism=0.052*t*(0.6+0.4*mature);
 const coordination=0.029*o*(0.65+0.35*mature);
 let effect=0;
 if(shock==='demand'||shock==='compound')effect+=year===2029?-(0.065+0.05*c):year===2030?-0.016:0;
 if(shock==='labor'||shock==='compound')effect+=year===2029?-0.067:year===2030?-0.013:0;
 if(shock==='project'&&year>=2028&&year<=2029)effect-=0.026*p*4;
 if(shock==='tourism')effect+=year===2029?-(0.04+0.15*t):year===2030?-0.012:0;
 const concentration=Math.max(...w)/100;const fragile=Math.max(0,concentration-.35)*.027;
 return .016+qual+proc+channel+tourism+coordination-fragile+effect+world;
}
function simulate(opts={}){
 const weights=normalize(opts.weights),stress=STRESSES[opts.stress]?opts.stress:'none',n=clamp(Math.round(Number(opts.samples)||2400),300,6000),seed=(Number(opts.seed)||20261101)|0,rand=rng(seed);
 const years=Array.from({length:10},(_,i)=>2026+i),arrays=years.map(()=>[]),strength=years.map(()=>[]);
 for(let i=0;i<n;i++){
  let index=100,prod=100;
  const region=normal(rand)*.012,market=normal(rand)*.012;
  const execution=clamp(0.84+rand()*.31,.84,1.15);
  for(let j=0;j<years.length;j++){
   const year=years[j];
   const zMarket=normal(rand),zClimate=normal(rand),zOperations=normal(rand);
   // shared market shock and correlated climate/operations components; NOT observed covariance
   const world=region+market+(.019*zMarket+.015*zClimate+.014*zOperations);
   const g=clamp(scoreGrowth(year,weights,world,execution,stress),-.23,.22);
   index=Math.max(1,index*(1+g));
   const volumeGrowth=clamp(.01+.021*zClimate+.008*zOperations-.008*(stress==='labor'&&year===2029?1:0),-.17,.18);
   prod=Math.max(1,prod*(1+volumeGrowth));
   arrays[j].push(index);strength[j].push(prod);
  }
 }
 const bands=years.map((year,j)=>{const v=arrays[j].sort((a,b)=>a-b);const s=strength[j].sort((a,b)=>a-b);return {year,p10:f(quantile(v,.1)),p50:f(quantile(v,.5)),p90:f(quantile(v,.9)),volumeP50:f(quantile(s,.5))}});
 return {weights,stress,samples:n,seed,bands,ending:bands[bands.length-1],mid:bands[4],unit:'2025结构价值指数=100',kind:'假设情景分布，非真实发展预测',assumptions:'增长响应、滞后、随机扰动和冲击传导是模型假设；未经本地逐年经营与产业统计数据校准。'};
}
function compare({weights,stress='none',samples=2400,seed=20261101}={}){
 const base=simulate({weights:PRESETS.balance.weights,stress:'none',samples,seed});
 const chosen=simulate({weights,stress,samples,seed});
 const baselineShock=stress==='none'?base:simulate({weights,stress:'none',samples,seed});
 return {base,chosen,noShock:baselineShock,shift2035:f(chosen.ending.p50-baselineShock.ending.p50)};
}
function sensitivity({weights,stress='none',samples=1200,seed=20261101}={}){
 const w=normalize(weights),base=simulate({weights:w,stress,samples,seed});
 const out=KEYS.map((k,i)=>{
  const trial=w.slice();const donor=trial.map((v,j)=>({v,j})).filter(x=>x.j!==i).sort((a,b)=>b.v-a.v)[0].j;
  const amount=Math.min(10,trial[donor]);trial[i]+=amount;trial[donor]-=amount;
  const newResult=simulate({weights:trial,stress,samples,seed});
  return {key:k,label:LABELS[i],gain:f(newResult.ending.p50-base.ending.p50),shiftPoints:amount,donor:LABELS[donor]};
 });
 return out.sort((a,b)=>b.gain-a.gain);
}
root.BoluoTeaModel=Object.freeze({KEYS,LABELS,DEFAULT,PRESETS,STRESSES,normalize,simulate,compare,sensitivity});
if(typeof module==='object'&&module.exports)module.exports=root.BoluoTeaModel;
})(typeof window!=='undefined'?window:globalThis);