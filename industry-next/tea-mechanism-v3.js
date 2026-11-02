/* 柏塘茶产业2030机制推演 v3：公开事实和C/D假设分开；真实随机样本，可复现。 */
(function(root){
'use strict';
const E=root.BaitangEvidence;if(!E)throw Error('Evidence registry required');
const KEYS=['quality','processing','channels','tourism','coordination'];
const LABELS=['品质标准','标准化原料茶','特色品牌与渠道','茶旅消费','组织协同'];
const DEFAULT=[25,20,20,20,15];
const PRESETS={balance:{name:'均衡协同',weights:[25,20,20,20,15]},quality:{name:'品质与品牌',weights:[40,15,25,10,10]},b2b:{name:'标准化原料茶',weights:[18,42,15,10,15]},tourism:{name:'茶旅转化',weights:[16,12,16,43,13]},network:{name:'渠道与组织',weights:[16,16,32,12,24]}};
const STRESSES={none:{name:'正常波动'},demand:{name:'外部需求收缩'},labor:{name:'采茶劳动力紧张'},project:{name:'加工项目延迟'},tourism:{name:'茶旅热度下降'},compound:{name:'需求+用工叠加'}};
const FIELDS=['valueIndex','teaTonnes','visitorsWan','tourismRevenueYi','b2bSharePct','facilityUsePct'];
const FIELD_INFO={
valueIndex:{name:'产业价值能力指数',unit:'2025=100',limit:'假设机制指数，绝非已核验产值'},
teaTonnes:{name:'干茶供给情景',unit:'吨',limit:'2025取2449吨报道口径，未来为条件测算'},
visitorsWan:{name:'游客接待情景',unit:'万人次',limit:'2025约130万基线，2030为350万目标'},
tourismRevenueYi:{name:'文旅收入估算',unit:'亿元',limit:'游客×D级人均收入假设，不与茶业产值相加'},
b2bSharePct:{name:'B端原料茶份额',unit:'%',limit:'D级份额假设，尚未取得销售结构'},
facilityUsePct:{name:'新产业园单厂使用率',unit:'%',limit:'150吨设计能力，不能当成全镇产能'}
};
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),rnd=(x,d=1)=>Math.round(x*10**d)/10**d;
function random(seed){let s=seed>>>0;return()=>{s+=0x6D2B79F5;let t=s;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
function tri(r,a,m,b){let u=r(),z=(m-a)/(b-a);return u<z?a+Math.sqrt(u*(b-a)*(m-a)):b-Math.sqrt((1-u)*(b-a)*(b-m))}
function norm(r){return Math.sqrt(-2*Math.log(Math.max(r(),1e-12)))*Math.cos(2*Math.PI*r())}
function normalize(a){const w=(Array.isArray(a)&&a.length===5?a:DEFAULT).map(x=>clamp(+x||0,0,100)),s=w.reduce((x,y)=>x+y,0);return s?w.map(x=>x*100/s):DEFAULT.slice()}
function stats(v){const a=v.slice().sort((x,y)=>x-y),q=p=>{const k=(a.length-1)*p;return a[Math.floor(k)]+(a[Math.ceil(k)]-a[Math.floor(k)])*(k%1)};return{p10:rnd(q(.1)),p50:rnd(q(.5)),p90:rnd(q(.9)),mean:rnd(a.reduce((x,y)=>x+y,0)/a.length)}}
function createSession(o={}){
 const weights=normalize(o.weights),w=weights.map(x=>x/100),stress=STRESSES[o.stress]?o.stress:'none';
 const samples=clamp(Math.round(+o.samples||2600),300,12000),seed=(+o.seed||20261102)|0,r=random(seed);
 const uncertainty=['cautious','central','optimistic'].includes(o.uncertainty)?o.uncertainty:'central';
 const years=[2025,2026,2027,2028,2029,2030],raw=years.map(()=>Object.fromEntries(FIELDS.map(x=>[x,[]]))),terminal=Object.fromEntries(FIELDS.map(x=>[x,[]]));
 let completed=0,visitorHits=0,incomeHits=0,bothHits=0;const trajectories=[];
 function draw(id){const p=E.unknowns.find(x=>x.id===id);if(!p)throw Error('Unknown assumption '+id);const m=uncertainty==='cautious'?p.min+.6*(p.mid-p.min):uncertainty==='optimistic'?p.mid+.45*(p.max-p.mid):p.mid;return tri(r,p.min,m,p.max)}
 function one(){
  const baseTea=E.byId('tea2025').value,baseVisits=E.byId('visits').value;
  const visitorGrowth=draw('annualVisit'),spend=draw('avgSpend'),b0=draw('b2bShare'),u0=draw('processingUse'),qualityRate=draw('qualityUptake'),laborRate=draw('laborElasticity');
  const regionMarket=norm(r)*.012,regionWeather=norm(r)*.010,execution=.78+r()*.45;
  let tea=baseTea,visits=baseVisits,quality=1,brand=1,service=1,b2b=b0,use=u0;
  const path=[];
  for(const year of years){
   if(year>2025){
    const market=norm(r),weather=norm(r);
    const labor=(stress==='labor'||stress==='compound')&&year===2028?laborRate:0;
    const demand=(stress==='demand'||stress==='compound')&&year===2028?.07:0;
    const travel=stress==='tourism'&&year===2028?.24:0;
    const delayed=stress==='project'&&[2027,2028].includes(year)?.20:1;
    // 产量受种植/天气/采摘约束；不将150吨单体设计能力直接相加
    const productionRate=clamp(.012+.032*w[0]+.018*w[4]+regionWeather+.022*weather-.48*labor,-.15,.15);
    tea=clamp(tea*(1+productionRate),baseTea*.65,baseTea*1.46);
    quality*=1+clamp(qualityRate*(.4+2*w[0])*execution,.001,.08);
    brand*=1+clamp(.010+.056*w[2]+.014*w[0]+regionMarket+.01*market-demand*.6,-.12,.12);
    service*=1+clamp(.011+.098*w[3]+.037*w[4]+.012*market,-.12,.16);
    b2b=clamp(b2b+(.068*w[1]+.018*w[4])*delayed*execution*(1-b2b)-demand*.05,.01,.72);
    use=clamp(use+(.14*w[1]+.067*w[4])*delayed*execution+.024*market,.01,1);
    const vg=clamp(visitorGrowth*(.68+1.16*w[3]+.34*w[4])+.025*market+regionMarket/2-travel,-.35,.40);
    visits=clamp(visits*(1+vg),baseVisits*.55,baseVisits*4.5);
   }
   // 2025=100: 同一份未知B端份额基线被抵消，不能折算实际货币收入
   const consumer=quality*brand,business=.78*quality*(.92+.18*use);
   const baseMix=(1-b0)+b0*.78*(.92+.18*u0);
   const index=100*(tea/baseTea)*((1-b2b)*consumer+b2b*business)/baseMix;
   const item={year,valueIndex:index,teaTonnes:tea,visitorsWan:visits,tourismRevenueYi:visits*10000*spend*service/1e8,b2bSharePct:b2b*100,facilityUsePct:use*100};
   for(const k of FIELDS)raw[year-2025][k].push(item[k]);
   path.push(item);
  }
  const end=path[path.length-1];for(const k of FIELDS)terminal[k].push(end[k]);
  visitorHits+=+(end.visitorsWan>=350);incomeHits+=+(end.tourismRevenueYi>=15);bothHits+=+(end.visitorsWan>=350&&end.tourismRevenueYi>=15);
  if(trajectories.length<100)trajectories.push(path.map(p=>({year:p.year,valueIndex:rnd(p.valueIndex),teaTonnes:rnd(p.teaTonnes),visitorsWan:rnd(p.visitorsWan)})));
 }
 function snapshot(){if(!completed)return null;
  const bands=years.map((year,i)=>({year,...Object.fromEntries(FIELDS.map(k=>[k,stats(raw[i][k])]))}));
  return{seed,weights,stress,uncertainty,samples:completed,total:samples,years,bands,ending:bands[5],terminal:Object.fromEntries(FIELDS.map(k=>[k,terminal[k].slice()])),trajectories,
    coverage:{visitors350:rnd(100*visitorHits/completed),tourismIncome15:rnd(100*incomeHits/completed),both:rnd(100*bothHits/completed)},
    targets:{visitorsWan:350,tourismRevenueYi:15},explanation:'情景样本覆盖率不是现实概率；收入估算含D级假设；未校准企业SEM系数。'}
 }
 return{get completed(){return completed},get total(){return samples},get done(){return completed===samples},
 step(batch=200){const stop=Math.min(samples,completed+Math.max(1,Math.floor(+batch||200)));while(completed<stop){one();completed++}return{completed,total:samples,done:completed===samples}},snapshot};
}
function simulate(o={}){const s=createSession(o);s.step(s.total);return s.snapshot()}
function compare(o={}){return{chosen:simulate(o),base:simulate({...o,weights:DEFAULT,stress:'none'})}}
function sensitivity(o={}){const w=normalize(o.weights),base=simulate({...o,weights:w,samples:600});
return KEYS.map((key,i)=>{const donor=w.map((v,j)=>({v,j})).filter(x=>x.j!==i).sort((a,b)=>b.v-a.v)[0].j,weight=w.slice(),step=Math.min(10,weight[donor]);
weight[donor]-=step;weight[i]+=step;
const v=simulate({...o,weights:weight,samples:600});
return{key,label:LABELS[i],donor:LABELS[donor],points:step,deltaIndex:rnd(v.ending.valueIndex.p50-base.ending.valueIndex.p50),deltaVisit:rnd(v.ending.visitorsWan.p50-base.ending.visitorsWan.p50),deltaGoal:rnd(v.coverage.visitors350-base.coverage.visitors350)};
}).sort((a,b)=>Math.abs(b.deltaIndex)-Math.abs(a.deltaIndex))}
root.BaitangMechanism=Object.freeze({version:'3.0',KEYS,LABELS,DEFAULT,PRESETS,STRESSES,FIELDS,FIELD_INFO,normalize,createSession,simulate,compare,sensitivity});
if(typeof module==='object'&&module.exports)module.exports=root.BaitangMechanism;
})(typeof window!=='undefined'?window:globalThis);
