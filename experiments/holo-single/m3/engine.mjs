/**
 * 博罗 V2 M3 · 不确定性图模型（M3-A/B/C）
 *
 * 严格的双轨设计（科学边界）：
 *  - 结构引擎 simulate()：输入无量纲“跨界联系强度” u（C 级用户假设），
 *    只计算关系权重、可达性、局部结构位置，绝不含真实人数 / GDP / 概率。
 *  - 区间映射 uToFlow()：把 u 的低/中/高锚点与 atlas 中 B 级推断的
 *    通勤人次区间（结构系数法）做“单调情景对应”，仅用于在界面上标注
 *    每个情景在现实中大致对应多大规模。它不反向驱动结构权重，也不是
 *    新的统计点估计；自定义位置的人次是 C 级插值示意。
 * 结构怎么变只由 u 决定；人次只是情景标签。两者关系是可解释的单调对应，
 * 不是因果换算，更不能解释为真实通勤人数、产值或 2030 概率。
 */
export const M3_VERSION = 'm3-structural-0.2';
export const FOCAL_IDS = Object.freeze(['e3','e12','e13','e14']);
const FOCAL = new Set(FOCAL_IDS);
export const INPUT_RANGE = Object.freeze({min:0,max:1,defaultA:0.2,defaultB:0.8});
export const SEED_ID = 'dg';
export const THRESHOLD = 0.48; // 纯演示模型中的可达性筛选阈值，无任何统计含义
export const COMMUTE_FLOW_ID = 'flow_yuanzhou_shiwan_dongguan_commute';

// 就业基数（人），来自 atlas 通勤流场的结构系数法（园洲+石湾，约 24 万）。
export const JOBS_BASE = 240000;
// 结构强度 u 的三个情景锚点，分别对应 B 级区间的低/中/高。
export const U_ANCHORS = Object.freeze({
 low:{u:0.20,key:'low'},
 mid:{u:0.50,key:'mid'},
 high:{u:0.85,key:'high'}
});

const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
const hash=(s)=>{let h=2166136261>>>0;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0};
const rand=(s)=>hash(String(s))/4294967295;
const safeNumber=(v,fallback)=>Number.isFinite(Number(v))?Number(v):fallback;

/**
 * 固定节点布局：抽象关系空间坐标，不是地理位置；
 * 使用 node id + cluster 的哈希保证双世界同主体空间对齐。
 */
export function basePositions(nodes){
 const centers={industry:[-0.3,0.15,0],external:[-1.4,-.7,-.4],life:[0.9,-.3,0],tourism:[1.4,.8,-.6],agriculture:[1.1,-1.1,-.3]};
 const clusters={};for(const n of nodes){(clusters[n.cluster]??=[]).push(n)}
 const map=new Map();
 for(const [cluster,list] of Object.entries(clusters)){
  const center=centers[cluster]||[0,0,0];
  list.forEach((n,i)=>{const angle=2*Math.PI*i/list.length+(rand(n.id+'a')-.5)*.45;
   const radius=.65+rand(n.id+'r')*.5;
   map.set(n.id,[center[0]+Math.cos(angle)*radius,center[1]+Math.sin(angle)*radius*.78,center[2]+(rand(n.id+'z')-.5)*.72]);
  });
 }
 return map;
}
export function isFocal(e){return FOCAL.has(e.id)&&e.level!=='A'}
export function weight(e,u){
 if(e.level==='A')return 1; // 不可因情景而变
 if(e.level==='B')return isFocal(e)?(.10+.85*clamp(u,0,1)):.28;
 return isFocal(e)?(.02+.22*clamp(u,0,1)):.07;
}
export function simulate(nodes,edges,input,opts={}){
 const u=clamp(safeNumber(input,0.5),0,1);
 const threshold=clamp(safeNumber(opts.threshold,THRESHOLD),0,1);
 const ids=new Set(nodes.map(n=>n.id));if(ids.size!==nodes.length)throw Error('Duplicate node ids');
 const positions=basePositions(nodes);
 const modeled=edges.map(e=>{
  if(!ids.has(e.source)||!ids.has(e.target))throw Error('Unknown relation endpoint '+e.id);
  return {...e,weight:weight(e,u),focal:isFocal(e),enabled:weight(e,u)>=threshold};
 });
 const scores=new Map(nodes.map(n=>[n.id,0]));
 const adj=new Map(nodes.map(n=>[n.id,[]]));
 for(const e of modeled){scores.set(e.source,scores.get(e.source)+e.weight);
  scores.set(e.target,scores.get(e.target)+e.weight);
  if(e.enabled){adj.get(e.source).push(e.target);adj.get(e.target).push(e.source);}
 }
 const reach=new Set(),todo=[SEED_ID];while(todo.length){const id=todo.shift();if(!ids.has(id)||reach.has(id))continue;reach.add(id);for(const n of adj.get(id))if(!reach.has(n))todo.push(n);}
 // 只在情景影响的 B/C 连线附近重排局部位置；A 边及其权重不变。
 const pulls=new Map();
 for(const e of modeled.filter(e=>e.focal)){
  const p=positions.get(e.source),q=positions.get(e.target);
  const delta=e.weight-weight(e,0.5);
  for(const [id,from,to] of [[e.source,p,q],[e.target,q,p]]){
   const v=pulls.get(id)||[0,0,0];
   for(let k=0;k<3;k++)v[k]+=(to[k]-from[k])*delta*.12;
   pulls.set(id,v);
  }
 }
 for(const [id,v] of pulls){const p=positions.get(id);positions.set(id,p.map((x,k)=>x+v[k]));}
 return {version:M3_VERSION,input:u,threshold,hypothesis:true,dimension:'dimensionless',
  seed:SEED_ID,edges:modeled,nodes,positions,scores,reachable:[...reach].sort(),
  activeEdges:modeled.filter(e=>e.enabled).length,affectedEdges:modeled.filter(e=>e.focal).length,
  totalWeight:modeled.reduce((t,e)=>t+e.weight,0)};
}
export function compareWorlds(a,b){
 if(a.version!==b.version)throw Error('Different model versions');
 const A=new Set(a.reachable),B=new Set(b.reachable);
 const common=[...A].filter(id=>B.has(id)).sort();
 const onlyA=[...A].filter(id=>!B.has(id)).sort();
 const onlyB=[...B].filter(id=>!A.has(id)).sort();
 const am=new Map(a.edges.map(e=>[e.id,e]));
 const changed=b.edges.filter(e=>Math.abs(e.weight-(am.get(e.id)?.weight??0))>1e-10)
  .map(e=>({id:e.id,from:am.get(e.id).weight,to:e.weight,level:e.level,source:e.source,target:e.target,
    direction:e.weight>am.get(e.id).weight?'stronger':'weaker'}));
 return {common,onlyA,onlyB,changed,changedCount:changed.length,
  deltaWeight:b.totalWeight-a.totalWeight,stableCount:common.length,
  note:'仅在本无量纲模型与所选参数范围内成立；不代表真实通勤、产出或因果关系'};
}

/* ===================== 区间 ↔ 情景映射（C 级，仅展示语境） ===================== */

/**
 * 从 atlas 的 B 级通勤流场构造低/中/高情景锚点。
 * 每个锚点同时携带：结构强度 u、跨界通勤系数 multiplier、对应人次 persons、说明。
 */
export function scenariosFromFlow(flow){
 if(!flow||!flow.range||!flow.scenarios)throw Error('需要 atlas 的 B 级流场对象');
 const pick=(key)=>{
  const sc=flow.scenarios[key];const r=flow.range[key];
  return {key,u:U_ANCHORS[key].u,label:sc.label||key,multiplier:safeNumber(sc.multiplier,NaN),
   persons:r,unit:flow.range.unit,note:sc.note||'',evidenceLevel:flow.evidenceLevel};
 };
 return {id:flow.id,low:pick('low'),mid:pick('mid'),high:pick('high'),
  range:{low:flow.range.low,high:flow.range.high,unit:flow.range.unit,period:flow.range.period},
  cKind:'C',flowLevel:flow.evidenceLevel};
}
/**
 * 把任意 u（0..1）映射到通勤人次情景。
 * 锚点直接采用 atlas 的 B 级取整区间（4500/10000/17000）；自定义位置在相邻锚点间
 * 对“人次”和“系数”分段线性插值，不重新用基数×系数反算（避免取整误差）。
 * 超出 B 级区间时人次钳到边界，不向外外推。±12% 带宽是 C 级示意，绝非置信区间。
 */
export function uToFlow(u,flow){
 const s=scenariosFromFlow(flow);
 const uu=clamp(safeNumber(u,0.5),0,1);
 const pts=[[s.low.u,s.low.persons,s.low.multiplier],[s.mid.u,s.mid.persons,s.mid.multiplier],[s.high.u,s.high.persons,s.high.multiplier]];
 const lerp=(x,x0,y0,x1,y1)=>y0+(y1-y0)*(x-x0)/(x1-x0);
 let persons,multiplier;
 if(uu<=pts[0][0]){persons=pts[0][1];multiplier=pts[0][2]*(uu/pts[0][0]);}
 else if(uu>=pts[2][0]){persons=pts[2][1];multiplier=pts[2][2];}
 else{
  for(let i=0;i<pts.length-1;i++){
   if(uu>=pts[i][0]&&uu<=pts[i+1][0]){
    persons=lerp(uu,pts[i][0],pts[i][1],pts[i+1][0],pts[i+1][1]);
    multiplier=lerp(uu,pts[i][0],pts[i][2],pts[i+1][0],pts[i+1][2]);
    break;
   }
  }
 }
 persons=Math.round(persons/100)*100;
 const clampBand=(v)=>clamp(v,s.range.low,s.range.high);
 const band=[Math.round(clampBand(persons*0.88)/100)*100,Math.round(clampBand(persons*1.12)/100)*100];
 const anchorKey=uu<=s.low.u?'low':(uu>=s.high.u?'high':(Math.abs(uu-s.mid.u)<0.04?'mid':null));
 return {u:uu,multiplier:Math.round(multiplier*1000)/1000,persons,band,
  withinB:uu>=s.low.u&&uu<=s.high.u,anchorKey,unit:s.range.unit,kind:'C',
  period:s.range.period,note:'人次为 B 级区间的情景对应；自定义位置为 C 级插值示意（±12% 带宽非置信区间），不是统计值。'};
}
/** 最近的情景锚点（低/中/高），用于 UI 高亮。 */
export function nearestAnchor(u){
 const uu=clamp(safeNumber(u,0.5),0,1);
 const order=['low','mid','high'];
 let best=order[0],bd=Infinity;
 for(const k of order){const d=Math.abs(U_ANCHORS[k].u-uu);if(d<bd){bd=d;best=k;}}
 return {key:best,u:U_ANCHORS[best].u,exact:bd<1e-9};
}

/* ===================== 敏感性分析（M3-C） ===================== */

/**
 * 在 u∈[0,1] 上扫描，识别每个主体的结构可达性是否随假设变化。
 * focal 边权重随 u 单调增，可达集合因此单调扩张（只增不减），
 * 每个条件性主体存在唯一“可达阈值”。
 */
export function sensitivity(nodes,edges,flow=null,opts={}){
 const steps=opts.steps||21;
 const samples=[];
 for(let i=0;i<steps;i++){const u=i/(steps-1);samples.push({u,model:simulate(nodes,edges,u)});}
 const nodeInfo=new Map();
 for(const n of nodes){
  const flags=samples.map(s=>s.model.reachable.includes(n.id));
  const ever=flags.some(Boolean),always=flags.every(Boolean);
  let cls='stable-out',threshold=null;
  if(always)cls='stable-in';
  else if(ever){cls='conditional';const first=flags.findIndex(Boolean);threshold=samples[first].u;}
  nodeInfo.set(n.id,{id:n.id,cls,threshold});
 }
 const arr=[...nodeInfo.values()];
 const stableIn=arr.filter(x=>x.cls==='stable-in');
 const stableOut=arr.filter(x=>x.cls==='stable-out');
 const conditional=arr.filter(x=>x.cls==='conditional').sort((a,b)=>a.threshold-b.threshold);
 // 焦点边在不同情景下的权重区间与跨越阈值点
 const edgeInfo=edges.filter(e=>isFocal(e)).map(e=>{
  const w0=weight(e,0),w1=weight(e,1);
  const isB=e.level==='B';
  const uCross=isB?(THRESHOLD-0.10)/0.85:(THRESHOLD-0.02)/0.22;
  return {id:e.id,level:e.level,source:e.source,target:e.target,
    wLow:w0,wHigh:w1,enabledAtHigh:w1>=THRESHOLD,
    crosses:(w0<THRESHOLD&&w1>=THRESHOLD),uCross:clamp(uCross,0,1)};
 });
 const lu=U_ANCHORS.low.u,mu=U_ANCHORS.mid.u,hu=U_ANCHORS.high.u;
 const between=(t,a,b)=>t!==null&&t>a&&t<=b;
 const buckets={
  belowLow:conditional.filter(c=>c.threshold<=lu),
  lowToMid:conditional.filter(c=>between(c.threshold,lu,mu)),
  midToHigh:conditional.filter(c=>between(c.threshold,mu,hu)),
  aboveHigh:conditional.filter(c=>c.threshold>hu)
 };
 const result={version:M3_VERSION,steps,
  stableIn,stableOut,conditional,edgeInfo,buckets,
  reachCount:{'low':samples[Math.round(lu*(steps-1))].model.reachable.length,
    'mid':samples[Math.round(mu*(steps-1))].model.reachable.length,
    'high':samples[Math.round(hu*(steps-1))].model.reachable.length,
    'u0':samples[0].model.reachable.length,'u1':samples[steps-1].model.reachable.length},
  nextBestData:flow?.toTighten||null,
  note:'稳健=在全部假设下结论一致；条件性=连通与否取决于跨界强度假设。阈值为结构模型结果，不是统计临界值。'};
 return result;
}

/* ===================== 保存 / 复算（M3-D） ===================== */

export function snapshotSignature(nodes,edges){
 return [nodes.map(n=>n.id).sort().join(','),edges.map(e=>[e.id,e.source,e.target,e.level].join(':')).sort().join(',')].join('|');
}
export function validateSaved(data,nodes,edges){
 if(!data||data.modelVersion!==M3_VERSION)throw Error('模型版本不一致');
 if(data.signature!==snapshotSignature(nodes,edges))throw Error('数据版本不一致，禁止直接复用旧结论');
 if(!Array.isArray(data.inputs)||data.inputs.length!==2||data.inputs.some(v=>!Number.isFinite(v)||v<0||v>1))throw Error('情景参数无效');
 return data.inputs;
}
