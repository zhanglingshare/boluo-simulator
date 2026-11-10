(function(){
'use strict';
const D=window.BoluoDiscoveryData,API=window.BoluoIndustryChain;
if(!D||!API)return;
const $=id=>document.getElementById(id);
const status=[
 {key:3,code:'live',name:'已投产',short:'投产'},
 {key:2,code:'build',name:'在建',short:'在建'},
 {key:1,code:'sign',name:'签约',short:'签约'},
 {key:0,code:'out',name:'退出 / 受阻',short:'退出'}
];
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const evMap=new Map(D.events.map(e=>[e.id,e]));
const state=()=>API.getState();
const sectors=()=>API.getSectors();
function bucket(e){
 if(!e||e.state==='stat')return null;
 if(e.state==='out')return 0;
 if(e.state==='live')return 3;
 return e.stage===1?1:2;
}
function idsFor(s,stage){return s.stages.find(x=>x.key===stage)?.ids||[]}
function projectIds(ids){return ids.filter(id=>evMap.has(id)&&evMap.get(id).state!=='stat')}
function countsFor(ids){
 const c={3:0,2:0,1:0,0:0,stat:0};
 ids.forEach(id=>{const e=evMap.get(id);if(!e)return;if(e.state==='stat')c.stat++;else c[bucket(e)]++});
 return c;
}
function pct(v,n){return n?100*v/n:0}
function renderHero(){
 const projects=D.events.filter(e=>e.state!=='stat');
 const counts={3:0,2:0,1:0,0:0};
 projects.forEach(e=>counts[bucket(e)]++);
 if($('sampleTotal'))$('sampleTotal').textContent=projects.length;
 if($('relayInFlight'))$('relayInFlight').textContent=counts[2]+counts[1];
 const note=document.querySelector('.relay-callout span');
 if(note)note.innerHTML=counts[2]+'在建 + '+counts[1]+'签约';
}
function renderInvestment(){
 const host=$('investmentPulse');if(!host)return;
 const cliff=D.topics?.factory?.cliff;
 const bars=(cliff?.bars||[]).filter(x=>x.val!==null&&x.y!=='2026').slice(0,3);
 const max=Math.max(1,...bars.map(x=>x.val||0));
 const x0=30,step=105,bottom=61,chartH=43;
 let svg='<svg viewBox="0 0 360 78" role="img" aria-label="2023至2025年工业投资额，2026年前三季度同比下降44.7%，当期绝对额未公布">';
 svg+='<line x1="12" y1="'+bottom+'" x2="348" y2="'+bottom+'" stroke="#dce3e8"/>';
 bars.forEach((b,i)=>{
  const x=x0+i*step,w=42,h=chartH*(b.val/max),y=bottom-h;
  const approximate=String(b.txt||'').indexOf('超')>=0;
  svg+='<rect x="'+x+'" y="'+y.toFixed(1)+'" width="'+w+'" height="'+h.toFixed(1)+'" rx="4" fill="'+(i===1?'#bd625b':'#739dbd')+'" opacity=".92"/>';
  if(approximate)svg+='<path d="M'+x+' '+(y-5)+' h'+w+'" stroke="#bd625b" stroke-width="2" stroke-dasharray="3 3"/>';
  svg+='<text x="'+(x+w/2)+'" y="'+Math.max(10,y-5)+'" text-anchor="middle" fill="#4d6074" font-size="9" font-weight="800">'+esc(b.txt)+'</text>';
  svg+='<text x="'+(x+w/2)+'" y="74" text-anchor="middle" fill="#8a97a4" font-size="9">'+esc(b.y)+'</text>';
 });
 svg+='</svg>';
 host.innerHTML='<div><div class="pulse-label">工业投资 · 历史规模</div><div class="pulse-main">−44.7%</div></div><div class="pulse-note">2026年前三季度<br>同比变化</div>'+svg+'<div class="pulse-legend"><span><i></i>2023—2025年度口径</span><span><i class="missing"></i>2026同期绝对额未公布，不补值</span></div>';
}
function renderPicker(slist,st){
 const host=$('sectorPicker');if(!host)return;
 const max=Math.max(1,...slist.map(s=>projectIds(s.all).length));
 host.innerHTML=slist.map((s,i)=>{
  const ids=projectIds(s.all),stats=s.all.length-ids.length,active=st.active===s.key;
  const colors=['#299688','#6d9fc9','#d4a04e','#c45b54'];
  const cells=s.stages.map((stage,j)=>{
   const c=countsFor(stage.ids),n=stage.ids.length;
   return '<i style="--fill:'+(n?Math.max(7,n/max*100):0)+'%;--bar-color:'+(colors[j])+'" title="'+esc(stage.name)+' '+n+'条记录"></i>';
  }).join('');
  return '<button type="button" class="sector-choice '+(active?'active':'')+'" data-sector-choice="'+esc(s.key)+'" aria-pressed="'+active+'">'+
   '<span class="sector-code">CHAIN / 0'+(i+1)+'</span>'+
   '<strong class="sector-title">'+esc(s.name)+'</strong>'+
   '<span class="sector-count"><b>'+ids.length+'</b>条现场'+(stats?' · '+stats+'条统计':'')+'</span>'+
   '<span class="sector-mini">'+cells+'</span>'+
   '<span class="sector-stages"><span>原料</span><span>加工</span><span>配套</span><span>出货</span></span>'+
  '</button>';
 }).join('');
}
function renderMatrix(slist,st){
 const host=$('chainMatrix');if(!host)return;
 const heads=['原料','加工','配套','出货'];
 let html='<div class="matrix-head">产业链样本</div>'+heads.map(x=>'<div class="matrix-head">'+x+'</div>').join('');
 slist.forEach(s=>{
  const ids=projectIds(s.all),stats=s.all.length-ids.length;
  html+='<div class="matrix-row-label"><span>'+esc(s.name)+'</span><small>'+ids.length+'条现场'+(stats?' / '+stats+'条统计':'')+'</small></div>';
  s.stages.forEach(stage=>{
   const raw=stage.ids.filter(id=>evMap.has(id)),c=countsFor(raw),n=c[3]+c[2]+c[1]+c[0],statCount=c.stat;
   const active=st.active===s.key&&st.view==='chain'&&st.activeStage===stage.key;
   const mix=status.map(x=>c[x.key]?'<i class="'+x.code+'" style="width:'+pct(c[x.key],n)+'%"></i>':'').join('');
   let main=n?'<strong>'+n+'</strong><small>条公开现场</small>':statCount?'<strong>统计</strong><small>'+statCount+'条口径记录</small>':'<strong>—</strong><small>暂未见公开现场</small>';
   html+='<button type="button" class="matrix-cell '+(!n&&!statCount?'empty':'')+(active?' active':'')+'" data-matrix-sector="'+esc(s.key)+'" data-matrix-stage="'+esc(stage.key)+'" aria-label="'+esc(s.name)+' '+esc(stage.name)+'，'+(n?n+'条现场':statCount+'条统计口径')+'">'+
    '<span class="matrix-count">'+main+'</span>'+(n?'<span class="mix">'+mix+'</span>':'')+(statCount?'<span class="stat-mark">非项目现场统计</span>':'')+
   '</button>';
  });
 });
 host.innerHTML=html;
}
function statusLabel(e){
 const b=bucket(e);return status.find(x=>x.key===b)||{code:'',name:'统计口径'};
}
function renderStatusCompare(slist,st){
 const host=$('sectorStatusCompare');if(!host)return;
 const max=Math.max(1,...slist.map(s=>projectIds(s.all).length));
 host.innerHTML=slist.map(s=>{
  const c=countsFor(s.all),n=c[3]+c[2]+c[1]+c[0],stats=c.stat;
  const parts=status.map(x=>c[x.key]?'<i class="'+x.code+'" style="width:'+pct(c[x.key],max)+'%" title="'+x.name+' '+c[x.key]+'"></i>':'').join('');
  return '<button type="button" class="status-row '+(st.active===s.key?'active':'')+'" data-status-sector="'+esc(s.key)+'">'+
   '<span class="status-row-name">'+esc(s.short||s.name)+'</span>'+
   '<span class="status-row-track">'+parts+'</span>'+
   '<span class="status-row-count">'+n+(stats?' + '+stats+'统':'')+'</span>'+
  '</button>';
 }).join('');
}
function renderMainMap(slist,st){
 const host=$('chainStageMap');if(!host)return;
 const s=slist.find(x=>x.key===st.active)||slist[0];if(!s)return;
 const chainMode=st.view!=='build';
 const columns=chainMode?s.stages:status.map(x=>({key:'b'+x.key,name:x.name,en:'',ids:s.bk[x.key]}));
 host.innerHTML=columns.map((col,i)=>{
  const ids=col.ids||[],count=ids.length,focus=chainMode?st.activeStage===col.key:st.activeBucket===col.key;
  const nodes=ids.map(id=>{
   const e=evMap.get(id);if(!e)return '';
   const label=statusLabel(e);
   return '<button type="button" class="site-node '+(st.detId===id?'selected':'')+'" data-site-id="'+esc(id)+'">'+
    '<span class="site-name">'+esc(e.title.replace(/^.*?·\s*/,'')||e.title)+'</span>'+
    '<span class="site-town">'+esc(e.town||'全县')+'</span>'+
    '<span class="site-value">'+(e.big?esc(e.big+(e.unit||'')):'')+(e.subtitle?' · '+esc(e.subtitle):'')+'</span>'+
    '<span class="site-state '+label.code+'">'+label.name+'</span>'+
   '</button>';
  }).join('');
  const attr=chainMode?'data-stage="'+esc(col.key)+'"':'data-bucket="'+esc(col.key)+'"';
  const foot=chainMode?'环节归类，不代表实际供货关系':'按公开进度状态归档';
  return '<section class="stage-column '+(focus?'focus':'')+'">'+
   '<button type="button" class="stage-head" '+attr+'><span><strong>'+esc(col.name)+'</strong><small>'+(col.en?esc(col.en):'PROJECT STATUS')+'</small></span><b class="stage-num">'+count+'</b></button>'+
   '<div class="stage-sites">'+(nodes||'<div class="stage-empty">暂未见公开现场<br>不代表该环节不存在</div>')+'</div>'+
   '<div class="stage-foot">'+foot+'</div>'+
  '</section>';
 }).join('');
}
function renderAll(st){
 const slist=sectors();
 renderHero();renderPicker(slist,st);renderMatrix(slist,st);renderStatusCompare(slist,st);renderMainMap(slist,st);
}
document.addEventListener('click',e=>{
 const sector=e.target.closest('[data-sector-choice],[data-status-sector],[data-matrix-sector]');
 if(sector){
  const key=sector.dataset.sectorChoice||sector.dataset.statusSector||sector.dataset.matrixSector;
  API.selectSector(key);
  if(sector.dataset.matrixStage)API.selectStage(sector.dataset.matrixStage);
  return;
 }
 const stage=e.target.closest('[data-stage]');
 if(stage){API.selectStage(stage.dataset.stage);return;}
 const bucketNode=e.target.closest('[data-bucket]');
 if(bucketNode){API.selectBucket(bucketNode.dataset.bucket);return;}
 const site=e.target.closest('[data-site-id]');
 if(site){API.selectEvent(site.dataset.siteId);return;}
});
window.addEventListener('boluo:industry-state',e=>renderAll(e.detail||state()));
renderInvestment();
renderAll(state());
})();