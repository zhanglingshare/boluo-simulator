/* 博罗产业案例桥接协议 v1：只传问题、已选节点、返回上下文。模型数据与算法完全独立。 */
(function(root){
'use strict';
const script=document.currentScript;
const base=script&&script.src?new URL('.',script.src):new URL('industry-next/',location.href);
const registry=Object.freeze({
 'baitang-tea-2030':Object.freeze({id:'baitang-tea-2030',name:'柏塘山茶',networkNode:'sc',evidenceEdges:['E038'],topics:['money','travel'],model:'tea-lab-v3.html',version:'3.0',horizon:2030})
});
const origins=['v1031','network','holo'];
const allow=(v,list,fallback)=>list.includes(v)?v:fallback;
const modes=['lab','mechanism','evidence','report'],focuses=['money','travel','jobs','future'],scenes=['base','investment','property','combined','trend','upside'],views=['discover','test','reveal','library'],metrics=['valueIndex','visitorsWan','teaTonnes','tourismRevenueYi','b2bSharePct','facilityUsePct'];
function entry(origin,options={}){
 const from=allow(origin,origins,'network'),url=new URL('tea-lab-v3.html',base);
 const page=allow(options.page,modes,from==='v1031'?'lab':'mechanism');
 url.searchParams.set('page',page);url.searchParams.set('case','baitang-tea-2030');url.searchParams.set('origin',from);
 if(from==='v1031'){
  url.searchParams.set('focus',allow(options.focus,focuses,'money'));
  url.searchParams.set('scene',allow(options.scene,scenes,'base'));
  url.searchParams.set('returnView',allow(options.returnView,views,'discover'));
 }else if(from==='holo'){
  const hash=String(options.hash||'');
  if(hash.startsWith('#')&&hash.length<1200&&/^[#a-zA-Z0-9&=%_.+\-\u4e00-\u9fff]*$/.test(hash))url.searchParams.set('returnHash',hash);
 }
 if(metrics.includes(options.metric))url.searchParams.set('field',options.metric);
 return url.href;
}
function getReturn(query){
 const p=query instanceof URLSearchParams?query:new URLSearchParams(query||location.search);
 const from=allow(p.get('origin'),origins,'');
 if(!from)return null;
 if(from==='v1031'){
  const url=new URL('../v1031/',base);
  url.searchParams.set('focus',allow(p.get('focus'),focuses,'money'));
  url.searchParams.set('scene',allow(p.get('scene'),scenes,'base'));
  url.searchParams.set('view',allow(p.get('returnView'),views,'discover'));
  return {label:'返回V1031原话题',url:url.href,origin:from};
 }
 if(from==='network')return {label:'回到博罗产业网络 · 柏塘节点',url:new URL('../network.html?entity=sc',base).href,origin:from};
 if(from==='holo'){
  const url=new URL('../holo-home-v10.html',base),hash=p.get('returnHash')||'';
  url.hash=hash.startsWith('#')&&hash.length<1200&&/^[#a-zA-Z0-9&=%_.+\-\u4e00-\u9fff]*$/.test(hash)?hash:'#mode=evidence&node=sc';
  return {label:'返回博罗全息关系世界',url:url.href,origin:from};
 }
 return null;
}
root.BoluoCaseBridge=Object.freeze({version:'1.0',registry,entry,getReturn});
})(typeof window!=='undefined'?window:globalThis);
