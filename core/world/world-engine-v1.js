/* Boluo Living World v1. Quarterly stock-flow simulation on existing synthetic firms.
 * Only 2025 public GDP anchors are observational. All micro parameters are authored
 * demo assumptions. This engine NEVER maps synthetic output to official GDP.
 * Standalone browser and CommonJS; no network, API or persistence dependency.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==="object"&&module.exports)module.exports=api;
 if(root)root.BoluoLivingWorld=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
"use strict";
const VERSION="boluo-living-world/1";
const round=(n,p=6)=>Math.round(n*10**p)/10**p;
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
const copy=x=>JSON.parse(JSON.stringify(x));
const assert=(c,m)=>{if(!c)throw Error(m)};
function random01(seed,q,id,salt){
 let h=(seed^Math.imul(q+1,0x9e3779b9))>>>0;
 const s=String(id)+"|"+String(salt);
 for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619)>>>0;
 h^=h>>>16;h=Math.imul(h,0x7feb352d)>>>0;h^=h>>>15;
 return (h>>>0)/4294967296;
}
const MAT={primary:.34,secondary:.51,tertiary:.29};
const GROW={primary:.007,secondary:.012,tertiary:.008};
const COST={expedite:12,substitute:9,skills:10,investigate:3};
function linkOrder(r){
 // Existing research dataset has MIXED link-direction semantics.
 // Professional service = purchaser→provider; primary processing = supplier→processor.
 const src=String(r.source),dst=String(r.target);
 if(r.type==="professional_service")return {buyer:src,supplier:dst,type:r.type,weight:+r.value};
 if(["industrial_supply","agricultural_processing","agricultural_distribution"].includes(r.type))
  return {buyer:dst,supplier:src,type:r.type,weight:+r.value};
 return null;
}
function createWorld(bundle,opts={}){
 assert(bundle&&bundle.tables&&bundle.meta,"Research dataset bundle required");
 assert(bundle.meta.enterprise_revenue_unit==="million_CNY","Import must explicitly map enterprise revenue to million_CNY/year");
 const {enterprises,projects,relations}=bundle.tables;
 assert(Array.isArray(enterprises)&&enterprises.length&&Array.isArray(projects)&&Array.isArray(relations),"Missing world tables");
 const seed=opts.seed??20261120;
 assert(Number.isSafeInteger(seed)&&seed>=0&&seed<=4294967295,"Seed must be uint32");
 const ids=new Set();const firms=enterprises.map((p)=>{
  assert(p.id&&!ids.has(String(p.id)),"Duplicate or missing enterprise ID "+p.id);ids.add(String(p.id));
  const annual=Number(p.revenue),cap=Number(p.capacity),innov=Number(p.innovation);
  assert(Number.isFinite(annual)&&annual>0&&Number.isFinite(cap)&&cap>0,"Invalid enterprise revenue/capacity");
  const base=annual/4,sector=p.sector;
  assert(MAT[sector],"Unknown sector "+sector);
  const mat=MAT[sector]+.045*(.5-random01(seed,0,p.id,"mat"));
  const capacity=base/clamp(cap,.52,.99);
  return {id:String(p.id),name:p.name||String(p.id),sector,subsector:p.subsector||"未分类",town:p.town||"未知",
    base,capacity,mat:round(mat),innovation:clamp(innov||.2,.02,.99),talent:.55,
    raw:round(capacity*mat*.66),finished:round(base*.23),cash:round(base*2.0),debt:0,
    backlog:0,closed:false,distress:0,backupUntil:-1,skillUntil:-1,
    producedLifetime:0,soldLifetime:0,ordersLifetime:0,receiptsLifetime:0,profitLifetime:0,
    utilization:0,quarterSales:0,quarterOutput:0,quarterVA:0,quarterCashChange:0};
 });
 const links=relations.map(linkOrder).filter(x=>x&&ids.has(x.buyer)&&ids.has(x.supplier)&&x.buyer!==x.supplier&&x.weight>0)
   .sort((a,b)=>a.buyer.localeCompare(b.buyer)||a.supplier.localeCompare(b.supplier));
 const eligible=projects.filter(x=>x.stage!=="operating"&&Number.isFinite(Number(x.commissionYear)))
  .sort((a,b)=>String(a.id).localeCompare(String(b.id)));
 const affectedPct=opts.affectedPct??50,delay=opts.projectDelayQuarters??4;
 assert(Number.isFinite(affectedPct)&&affectedPct>=0&&affectedPct<=100,"AffectedPct 0..100");
 assert(Number.isInteger(delay)&&delay>=0&&delay<=12,"Project delay 0..12 quarters");
 const affected=new Set(eligible.slice(0,Math.round(eligible.length*affectedPct/100)).map(p=>String(p.id)));
 const firmsByTownSector=new Map();
 for(const f of firms){const k=f.town+"|"+f.sector;if(!firmsByTownSector.has(k))firmsByTownSector.set(k,[]);firmsByTownSector.get(k).push(f.id)}
 const projectsState=projects.map((p,i)=>{
  const matching=firmsByTownSector.get(p.town+"|"+p.sector)||firms.filter(f=>f.sector===p.sector).map(f=>f.id);
  const target=matching.length?matching[i%matching.length]:null;
  const before=4*(Number(p.commissionYear)-2026)+2;
  const arrival=p.stage==="operating"?-1:before+(affected.has(String(p.id))?delay:0);
  return {id:String(p.id),sector:p.sector,town:p.town,stage:p.stage,
    linkedFirmId:target,plannedQ:before,arrivalQ:arrival,activated:p.stage==="operating",
    size:round(Math.max(0,+p.investment||0)),assumption:"synthetic_capacity_sensitivity"};
 });
 return {schema:VERSION,seed,q:0,year:2026,quarter:1,
   budget:100,budgetUnit:"demo_action_credits_not_public_finance",
   publicBaseline:opts.publicBaseline||null,
   dataFingerprint:opts.dataFingerprint||bundle.meta.dataset_id||"synthetic-unidentified",
   firms,links,projects:projectsState,history:[],events:[],actions:[],
   config:{projectDelayQuarters:delay,affectedPct,
    priceBasis:"one synthetic finished-output token = 1 million CNY at demo price 1",
    govPolicyCredits:"fictitious action budget, not government spending"}};
}
function executeActions(w,actions){
 assert(Array.isArray(actions)&&actions.length<=3,"Up to three policy actions per quarter");
 const log=[];
 for(const a of actions){
  assert(a&&COST[a.type]!==undefined,"Unknown action");
  const cost=COST[a.type];
  assert(w.budget>=cost,"Insufficient public-action credits (not CNY)");
  if(a.type==="expedite"){
   const p=w.projects.find(x=>x.id===a.target&&!x.activated&&x.arrivalQ>=w.q);
   assert(p,"Expedite must target an unfinished project: "+a.target);
   p.arrivalQ=Math.max(w.q,p.arrivalQ-2);
  }else if(a.type==="substitute"||a.type==="skills"){
   const f=w.firms.find(x=>x.id===a.target&&!x.closed);
   assert(f,"Action must target an active firm: "+a.target);
   if(a.type==="substitute")f.backupUntil=w.q+4;
   else {f.talent=clamp(f.talent+.08,0,1);f.skillUntil=w.q+8;}
  }else if(a.type==="investigate"){
   assert(a.target==="network"||a.target==="projects"||a.target==="industry","Investigation target invalid");
  }
  w.budget-=cost;
  log.push({q:w.q,type:a.type,target:a.target,cost,unit:"demo_action_credits",impactKind:a.type==="investigate"?"information_only":"conditional_mechanism"});
 }
 w.actions.push(...log);
 return log;
}
function step(world,actions=[],external={}){
 assert(world?.schema===VERSION,"Wrong or missing world schema");
 assert(world.q<28,"28-quarter development season has ended");
 const w=copy(world),q=w.q,eps=1e-6;
 assert(Number.isFinite(external.demandMultiplier??1)&&(external.demandMultiplier??1)>=.35&&(external.demandMultiplier??1)<=1.6,"Invalid demand multiplier");
 assert(Number.isFinite(external.supplyDisruption??0)&&(external.supplyDisruption??0)>=0&&(external.supplyDisruption??0)<=.95,"Supply disruption 0..0.95");
 const demandMultiplier=external.demandMultiplier??1,supplyDisruption=external.supplyDisruption??0;
 const policyLog=executeActions(w,actions);
 const byId=new Map(w.firms.map(f=>[f.id,f]));
 const ledger=new Map(w.firms.map(f=>[f.id,{openCash:f.cash,openingRaw:f.raw,openingFinished:f.finished,
   outsideSales:0,internalSales:0,localPurchases:0,imports:0,wages:0,fixed:0,interest:0,capex:0,borrowed:0,
   rawConsumed:0,produced:0,soldExternal:0,shippedInternal:0,receivedInternal:0}]));
 const events=[],projectArrivals=[];
 // Stage 1: planned facilities are linked to individual synthetic firms.
 for(const p of w.projects){
  if(p.activated||p.arrivalQ>q||p.arrivalQ<0)continue;
  p.activated=true;
  const f=byId.get(p.linkedFirmId);
  if(!f||f.closed)continue;
  // Capacity gains intentionally bounded. Synthetic investment size is NOT GDP.
  const factor=clamp(.035+.00008*p.size,.035,.12);
  f.capacity=round(f.capacity*(1+factor));
  projectArrivals.push({id:p.id,firmId:f.id,capacityGainPct:round(factor*100,2)});
 }
 // Stage 2: establish desired production and intermediate-input requests.
 const plans=new Map(),buyerLinks=new Map();
 for(const e of w.links){if(!buyerLinks.has(e.buyer))buyerLinks.set(e.buyer,[]);buyerLinks.get(e.buyer).push(e)}
 for(const f of w.firms){
  const baseline=f.base*Math.pow(1+GROW[f.sector],q);
  const noise=(random01(w.seed,q,f.id,"market")-.5)*.18;
  const demand=baseline*clamp((1+noise)*demandMultiplier,.25,2);
  const desired=clamp(demand+f.backlog*.35+f.base*.20-f.finished,0,f.capacity);
  const rawGap=Math.max(0,desired*f.mat-f.raw);
  plans.set(f.id,{demand,desired,rawGap,remaining:rawGap,
    localTarget:rawGap*(buyerLinks.has(f.id)?.46:0),localDelivered:0});
 }
 // Stage 3: actual interfirm trades settle cash on delivery. Seller finished stocks
 // were produced in an earlier period; no supplier can sell nonexistent units.
 let internalShip=0,internalSpend=0;
 for(const f of w.firms){
  if(f.closed)continue;
  const p=plans.get(f.id),edges=buyerLinks.get(f.id)||[];
  if(!edges.length)continue;
  const sum=edges.reduce((a,e)=>a+e.weight,0);
  for(const e of edges){
   const seller=byId.get(e.supplier);
   if(!seller||seller.closed)continue;
   const qty=Math.min(p.localTarget*e.weight/sum,seller.finished,Math.max(0,f.cash));
   if(qty<=eps)continue;
   seller.finished=round(seller.finished-qty);f.raw=round(f.raw+qty);f.cash=round(f.cash-qty);
   seller.cash=round(seller.cash+qty);const bl=ledger.get(f.id),sl=ledger.get(seller.id);
   bl.localPurchases+=qty;bl.receivedInternal+=qty;sl.internalSales+=qty;sl.shippedInternal+=qty;
   p.localDelivered+=qty;internalShip+=qty;internalSpend+=qty;
  }
 }
 // Stage 4: externally supplied raw inputs, financing, production, final orders.
 let importSpend=0,finalRevenue=0,borrowSum=0,productionTotal=0,vaProxy=0,unfilled=0,closedCount=0;
 const sectorVA={primary:0,secondary:0,tertiary:0},sectorGross={primary:0,secondary:0,tertiary:0};
 for(const f of w.firms){
  const l=ledger.get(f.id),p=plans.get(f.id);
  if(f.closed){closedCount++;continue}
  const backup=f.backupUntil>=q;
  const avail=clamp(1-supplyDisruption*(backup?.25:1),.02,1);
  const importNeed=Math.max(0,p.rawGap-p.localDelivered);
  const marketSupply=importNeed*avail;
  const importPrice=backup?1.12:1.05;
  const imports=Math.min(marketSupply,Math.max(0,f.cash*.88/importPrice));
  f.raw=round(f.raw+imports);f.cash=round(f.cash-imports*importPrice);
  l.imports+=imports*importPrice;importSpend+=imports*importPrice;
  // A synthetic credit line finances temporary production liquidity, not permanent cash creation.
  const expectedMaxWages=p.desired*.22,overhead=f.base*.025;
  const extra=Math.max(0,expectedMaxWages+overhead-f.cash);
  const room=Math.max(0,2*f.base-f.debt),draw=Math.min(extra,room);
  f.cash=round(f.cash+draw);f.debt=round(f.debt+draw);l.borrowed+=draw;borrowSum+=draw;
  const canPay=Math.max(0,(f.cash-overhead)/.22);
  const skill=1+(f.skillUntil>=q?f.talent*.035:0);
  const prod=Math.max(0,Math.min(f.capacity*skill,p.desired,f.raw/f.mat,canPay));
  const material=prod*f.mat,wage=prod*.22;
  f.raw=round(Math.max(0,f.raw-material));f.finished=round(f.finished+prod);
  f.cash=round(f.cash-wage);l.rawConsumed=material;l.wages=wage;l.produced=prod;
  productionTotal+=prod;const va=prod-material;vaProxy+=va;sectorVA[f.sector]+=va;sectorGross[f.sector]+=prod;
  const fixed=Math.min(f.cash,overhead);f.cash=round(f.cash-fixed);l.fixed=fixed;
  const targetSales=p.demand+f.backlog*.25;
  const sold=Math.min(f.finished,targetSales);
  f.finished=round(Math.max(0,f.finished-sold));
  f.cash=round(f.cash+sold);l.outsideSales=sold;l.soldExternal=sold;finalRevenue+=sold;
  f.backlog=round(Math.max(0,f.backlog*.65+Math.max(0,p.demand-sold)));
  unfilled+=Math.max(0,p.demand-sold);
  const interest=Math.min(f.cash,f.debt*.008);f.cash=round(f.cash-interest);l.interest=interest;
  if(f.cash>f.base*2.2&&prod/Math.max(eps,f.capacity)>.78&&random01(w.seed,q,f.id,"invest")<.14){
   const investment=Math.min(f.cash-f.base*1.8,f.base*.22);
   f.cash=round(f.cash-investment);l.capex=investment;f.capacity=round(f.capacity+investment*.13);
  }
  if(f.cash>f.base*.8&&f.debt>0){
   // Debt principal repayment, separate from interest and operating profit.
   const repaid=Math.min(f.debt,(f.cash-f.base*.8)*.18);
   f.cash=round(f.cash-repaid);f.debt=round(f.debt-repaid);l.repayment=repaid;
  }
  f.distress=f.cash<f.base*.10&&f.debt>f.base*1.85?f.distress+1:0;
  if(f.distress>=3){f.closed=true;events.push({type:"exit",id:f.id,reason:"cash_and_credit_constraint"})}
  f.quarterSales=round(l.outsideSales+l.internalSales);f.quarterOutput=round(prod);
  f.quarterVA=round(va);f.quarterCashChange=round(f.cash-l.openCash);
  f.utilization=round(prod/Math.max(f.capacity,eps));
  f.producedLifetime+=prod;f.soldLifetime+=f.quarterSales;f.ordersLifetime+=p.demand;
  f.receiptsLifetime+=f.quarterSales;f.profitLifetime+=f.quarterSales-material-wage-fixed-interest;
  assert(f.raw>=-eps&&f.finished>=-eps&&f.cash>=-eps,"Negative firm stock/cash: "+f.id);
 }
 // Stage 5: reconcile BOTH each firm and the complete economic subsystem.
 const fail=[],tol=0.002,totals={cashOpen:0,cashClose:0,internalSales:0,internalPurchases:0,
   openingRaw:0,closingRaw:0,importsQty:0,internalReceived:0,rawConsumed:0,
   openingFinished:0,closingFinished:0,production:0,internalShipped:0,externalShipped:0,
   externalFinalSales:0,externalImportsCost:0,wages:0,fixed:0,interest:0,capex:0,
   borrowed:0,repayments:0};
 for(const f of w.firms){
  const l=ledger.get(f.id);const repay=l.repayment||0;
  const expected=l.openCash+l.outsideSales+l.internalSales+l.borrowed
   -l.localPurchases-l.imports-l.wages-l.fixed-l.interest-l.capex-repay;
  if(Math.abs(f.cash-expected)>tol)fail.push({id:f.id,type:"cash",diff:round(f.cash-expected)});
  const rawExpected=l.openingRaw+l.receivedInternal+l.imports/(f.backupUntil>=q?1.12:1.05)-l.rawConsumed;
  if(Math.abs(f.raw-rawExpected)>tol)fail.push({id:f.id,type:"raw",diff:round(f.raw-rawExpected)});
  const finishExpected=l.openingFinished+l.produced-l.shippedInternal-l.soldExternal;
  if(Math.abs(f.finished-finishExpected)>tol)fail.push({id:f.id,type:"finished",diff:round(f.finished-finishExpected)});
  totals.cashOpen+=l.openCash;totals.cashClose+=f.cash;totals.internalSales+=l.internalSales;
  totals.internalPurchases+=l.localPurchases;totals.openingRaw+=l.openingRaw;totals.closingRaw+=f.raw;
  totals.importsQty+=l.imports/(f.backupUntil>=q?1.12:1.05);totals.internalReceived+=l.receivedInternal;
  totals.rawConsumed+=l.rawConsumed;totals.openingFinished+=l.openingFinished;
  totals.closingFinished+=f.finished;totals.production+=l.produced;totals.internalShipped+=l.shippedInternal;
  totals.externalShipped+=l.soldExternal;totals.externalFinalSales+=l.outsideSales;
  totals.externalImportsCost+=l.imports;totals.wages+=l.wages;totals.fixed+=l.fixed;
  totals.interest+=l.interest;totals.capex+=l.capex;totals.borrowed+=l.borrowed;totals.repayments+=repay;
 }
 if(Math.abs(totals.internalSales-totals.internalPurchases)>tol)fail.push({type:"internal_cash_mismatch"});
 if(Math.abs(totals.internalShipped-totals.internalReceived)>tol)fail.push({type:"internal_goods_mismatch"});
 if(Math.abs(totals.closingFinished-(totals.openingFinished+totals.production-totals.internalShipped-totals.externalShipped))>tol)
  fail.push({type:"aggregate_finished_mismatch"});
 if(Math.abs(totals.closingRaw-(totals.openingRaw+totals.importsQty+totals.internalReceived-totals.rawConsumed))>tol)
  fail.push({type:"aggregate_raw_mismatch"});
 assert(!fail.length,"Stock-flow reconciliation failed: "+JSON.stringify(fail.slice(0,4)));
 const exits=w.firms.filter(f=>f.closed).length;
 const quarter={index:q,label:(2026+Math.floor(q/4))+" Q"+(q%4+1),
   policy:policyLog,projectsActivated:projectArrivals.length,projectArrivals:projectArrivals.slice(0,10),
   firms:w.firms.length,activeFirms:w.firms.length-exits,exits,newExits:events.length,
   grossProduction:round(productionTotal),sampleValueAddedProxy:round(vaProxy),
   sectorGross:Object.fromEntries(Object.entries(sectorGross).map(([k,v])=>[k,round(v)])),
   sectorVA:Object.fromEntries(Object.entries(sectorVA).map(([k,v])=>[k,round(v)])),
   outsideSales:round(finalRevenue),internalTrade:round(internalShip),
   importsCost:round(importSpend),newCredit:round(borrowSum),
   unmetFinalDemand:round(unfilled),cashTotal:round(totals.cashClose),
   debtTotal:round(w.firms.reduce((s,f)=>s+f.debt,0)),
   averageUtilization:round(w.firms.reduce((s,f)=>s+f.utilization,0)/w.firms.length),
   balanced:true,ledgerResidualMax:round(Math.max(0,...fail.map(x=>Math.abs(x.diff||0)))),
   accounting:"Synthetic million CNY equivalent tokens; not official GDP, gross industrial output or full-county aggregates."};
 w.history.push(quarter);w.events.push(...events);w.q++;w.year=2026+Math.floor(w.q/4);w.quarter=w.q%4+1;
 w.budget=clamp(w.budget+3,0,100);
 return w;
}
function run(world,quarters=4,policy={},external={}){
 assert(Number.isInteger(quarters)&&quarters>=0&&quarters<=28-world.q,"Invalid number of quarters");
 let w=copy(world);
 for(let i=0;i<quarters;i++){
  const q=w.q;w=step(w,policy[q]||[],external[q]||{});
 }return w;
}
function compare(initial,quarters,policy={},external={}){
 const base=run(initial,quarters,{},external),withPolicy=run(initial,quarters,policy,external);
 const get=w=>({grossOutput:w.history.at(-1)?.grossProduction??0,
    valueAddedProxy:w.history.at(-1)?.sampleValueAddedProxy??0,
    unmetOrders:w.history.at(-1)?.unmetFinalDemand??0,
    cash:w.history.at(-1)?.cashTotal??0,
    active:w.history.at(-1)?.activeFirms??w.firms.length,
    projectArrivals:w.history.reduce((a,x)=>a+x.projectsActivated,0)});
 const b=get(base),p=get(withPolicy);return {schema:"boluo-world-compare/1",seed:initial.seed,quarters,
   baseline:b,intervention:p,delta:Object.fromEntries(Object.keys(b).map(k=>[k,round(p[k]-b[k])])),
   firstDifferentQuarter:base.history.findIndex((x,i)=>JSON.stringify(x)!==JSON.stringify(withPolicy.history[i])),
   warning:"Paired model response to developer-authored mechanisms, NOT causal effect identified from real Boluo data."};
}
return Object.freeze({VERSION,createWorld,step,run,compare,linkOrder});
});
