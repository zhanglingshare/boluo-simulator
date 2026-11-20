/* BORO INDUSTRY MANAGER V13
 * Deep enterprise capability vocabulary: six legacy domains x six tactical traits.
 * All sub-traits are synthesized development hypotheses, NOT measured enterprise data.
 * Domain means are anchored to the existing V5–V12 six-dimensional career engine.
 * Detailed metrics depend on sector, enterprise profile and evolving career state.
 */
(function(root,factory){
 const api=factory();
 if(typeof module!=="undefined"&&module.exports)module.exports=api;
 if(root)root.BoluoEnterpriseAttributes=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
 "use strict";
 const clamp=(x,a=0,b=100)=>Math.max(a,Math.min(b,x));
 const round=x=>Math.round(x*10)/10;
 const G=[
  {id:"SCL",name:"经营承载",axis:0,items:[
   ["capacity","产能/服务承载",0,1],["utilization","负荷利用效率",0,4],["delivery","交付兑现",0,3],
   ["expansion","扩容准备度",1,0],["assetEfficiency","固定要素效率",4,2],["execution","项目执行力",0,1]]},
  {id:"GRW",name:"成长与市场",axis:1,items:[
   ["orders","订单增长动能",1,0],["customerAcquisition","新客户拓展",1,3],["marketAccess","市场覆盖",1,5],
   ["productGrowth","产品成长曲线",2,1],["projectMaturity","项目兑现准备",1,0],["demandStability","需求持续性",4,1]]},
  {id:"TEC",name:"产品与技术",axis:2,items:[
   ["productMoat","产品壁垒",2,4],["process","核心工艺",2,0],["rnd","研发转化",2,1],
   ["digital","数字化运营",2,3],["quality","质量管理",2,4],["skillDepth","技能梯队",2,5]]},
  {id:"LNK",name:"网络与协同",axis:3,items:[
   ["suppliers","上游协作",3,4],["localSupply","本地采购连接",3,5],["substitution","替代供应准备",4,3],
   ["logistics","物流/交付连接",3,0],["chainFit","产业链契合",3,2],["sharedServices","平台协同使用",3,5]]},
  {id:"RST",name:"经营韧性",axis:4,items:[
   ["cashBuffer","周转缓冲",4,0],["customerMix","客户分散",4,1],["backup","关键供给备份",4,3],
   ["energy","能源保障",4,0],["retention","人才稳定",4,2],["recovery","冲击恢复能力",4,3]]},
  {id:"IMP",name:"本地带动",axis:5,items:[
   ["jobs","本地岗位吸纳",5,0],["supplierDev","配套企业培育",5,3],["localValue","本地价值留存",5,1],
   ["spillover","技术知识扩散",5,2],["anchor","产业牵引力",5,0],["townLink","镇街经济连接",5,3]]}
 ];
 const sectorLabels={
  primary:{capacity:"种养/加工承载",delivery:"季节交付稳定",orders:"订单/收购增长",productGrowth:"品种与深加工",process:"标准化生产",logistics:"冷链与集散",cashBuffer:"产季回款缓冲",energy:"水土/设施保障",localValue:"农产品价值留存",townLink:"农户与镇村联结",customerMix:"收购渠道分散"},
  secondary:{capacity:"工业产线承载",utilization:"产线利用效率",productGrowth:"产品升级潜力",process:"核心制造工艺",quality:"质量与良率",energy:"用能保障与效率",supplierDev:"本地配套培育"},
  tertiary:{capacity:"服务供给承载",delivery:"服务履约稳定",orders:"服务需求增长",productGrowth:"服务产品创新",process:"服务交付流程",logistics:"客流/服务触达",localValue:"本地消费留存",townLink:"镇街服务覆盖",customerMix:"客群结构分散"}
 };
 function hash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
 const cache=new Map();
 function signature(p){
  const text=[p.club||"",p.role||"",...(p.tags||[])].join("|");
  return {
   technology:/电子|AI|HDI|FPC|SMT|机器人|智能|装备|新材料|锂|铜|电池|数字/i.test(text),
   agriculture:p.team==="primary",
   service:p.team==="tertiary",
   processing:/加工|制造|材料|产线|饲料|物流/i.test(text),
   anchor:/龙头|核心|重点|产业园|链主/i.test(text),
   travel:/文旅|旅游|客流|景区|酒店|消费/i.test(text)
  }
 }
 function modifiers(p,key,flags){
  let m=0;
  if(flags.technology&&["rnd","digital","process","productMoat","skillDepth","productGrowth"].includes(key))m+=5;
  if(flags.agriculture&&["townLink","localSupply","localValue","delivery","backup"].includes(key))m+=4;
  if(flags.service&&["marketAccess","customerAcquisition","sharedServices","jobs","townLink"].includes(key))m+=4;
  if(flags.processing&&["quality","utilization","capacity","logistics"].includes(key))m+=3;
  if(flags.anchor&&["anchor","supplierDev","capacity","chainFit"].includes(key))m+=4;
  if(flags.travel&&["marketAccess","customerMix","townLink","customerAcquisition"].includes(key))m+=4;
  if(flags.agriculture&&["rnd","digital"].includes(key))m-=2;
  return m;
 }
 function profile(p,rating){
  const v=rating.values,flags=signature(p);
  const key=p.id+"|"+v.map(n=>round(n)).join(",")+"|"+rating.pot;
  if(cache.has(key))return cache.get(key);
  const traits={},groups=[],all=[];
  for(const g of G){
   const init=g.items.map(([id,label,primary,cross],i)=>{
    const noise=((hash(p.id+"|"+id)%2001)/1000-1)*8;
    const bias=modifiers(p,id,flags);
    const base=v[primary]*.78+v[cross]*.22+bias+noise;
    return {id,label:(sectorLabels[p.team]||{})[id]||label,domain:g.id,base,order:i};
   });
   const mean=init.reduce((s,x)=>s+x.base,0)/init.length;
   const shift=v[g.axis]-mean;
   const values=init.map(x=>clamp(x.base+shift,2,99));
   // Preserve six-domain semantics; re-center after any limiting at 2 and 99.
   const diff=v[g.axis]-values.reduce((s,x)=>s+x,0)/values.length;
   const metrics=init.map((x,i)=>{
    const value=round(clamp(values[i]+diff,2,99));
    const m={id:x.id,label:x.label,group:g.id,groupName:g.name,
     value,developmentPotential:round(clamp(value+Math.max(0,rating.pot-rating.ovr)*.42+((hash("future"+p.id+x.id)%5)-2),2,99)),
     category:"开发情景推导",recordStatus:"缺企业级分项观测"};
    traits[x.id]=m;all.push(m);return m;
   });
   groups.push({id:g.id,name:g.name,axis:g.axis,score:v[g.axis],items:metrics});
  }
  const val=id=>traits[id].value;
  function avg(keys){return keys.reduce((sum,k)=>sum+val(k),0)/keys.length}
  const exposures={
   orders:round(clamp(100-avg(["demandStability","marketAccess","customerMix"]),4,97)),
   talent:round(clamp(100-avg(["retention","skillDepth","supplierDev"]),4,97)),
   supply:round(clamp(100-avg(["substitution","backup","suppliers"]),4,97)),
   funding:round(clamp(100-avg(["cashBuffer","assetEfficiency","execution"]),4,97)),
   energy:round(clamp(100-avg(["energy","assetEfficiency","recovery"]),4,97))
  };
  const roles={
   core:avg(["capacity","delivery","anchor","projectMaturity"]),
   growth:avg(["orders","productGrowth","rnd","expansion"]),
   supply:avg(["localSupply","substitution","process","chainFit"]),
   service:avg(["sharedServices","digital","marketAccess","supplierDev"]),
   base:avg(["delivery","energy","recovery","cashBuffer"]),
   reserve:avg(["projectMaturity","rnd","skillDepth","expansion"])
  };
  const roleRanks=Object.entries(roles).map(([role,score])=>({role,score:round(score)})).sort((a,b)=>b.score-a.score);
  const risks=Object.entries(exposures).map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value);
  const strengths=[...all].sort((a,b)=>b.value-a.value).slice(0,4).map(x=>x.id);
  const weaknesses=[...all].sort((a,b)=>a.value-b.value).slice(0,4).map(x=>x.id);
  const output={companyId:p.id,groups,traits,all,exposures,roles,roleRanks,risks,strengths,weaknesses,
   count:all.length,baseSix:v.slice(),synthetic:true,scenarioVersion:13};
  if(cache.size>3200)cache.clear();
  cache.set(key,output);
  return output;
 }
 function exposure(p,rating,type){
  return profile(p,rating).exposures[type]??50;
 }
 function resourceFactors(p,rating){
  const a=profile(p,rating).traits,val=k=>a[k].value;
  return [
   clamp(1+(55-val("assetEfficiency"))/400,.87,1.13),
   clamp(1+(55-val("cashBuffer"))/340,.85,1.15),
   clamp(1+(55-val("energy"))/360,.86,1.14),
   clamp(1+(55-val("skillDepth"))/420,.88,1.12),
   clamp(1+(55-val("sharedServices"))/390,.86,1.14)
  ];
 }
 function roleFit(p,rating,role){return round(profile(p,rating).roles[role]??50)}
 return {groups:G,profile,exposure,resourceFactors,roleFit,metricCount:36,scenarioVersion:13,explain:"36 authored, deterministic scenario-derived traits per enterprise, not collected enterprise observations"};
});
