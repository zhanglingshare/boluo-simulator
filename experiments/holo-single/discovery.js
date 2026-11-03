/* 博罗全息关系世界 · 发现路径 / C004待落地项目层
 * 只读取已发布的关系变化数据。项目签约不自动加入现有产业供应网络。
 * 保持M2/M3引擎隔离；数据缺失时明确提示，不制造事实。
 */
(function(){
'use strict';
const ROOT='../../';
const SUBJECTS=['hpm','crs','acc','lcs'];
const LABELS={hpm:'精密制造',crs:'绿色冷轧钢',acc:'空压机产业园',lcs:'液冷散热',zw:'正威新材料'};
const POINTS={hpm:[178,65],crs:[478,65],acc:[178,202],lcs:[478,202],zw:[752,133]};
const escapeHTML=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const id=x=>document.getElementById(x);
let eventData=null,evidence=null,sources=null,fetchDone=false,loading=null;
let currentFocus=null;
function fetchJSON(path){
 let attempt=0;
 return new Promise(resolve=>{
   function next(){
     fetch(ROOT+path,{cache:'no-store'}).then(r=>{if(!r.ok)throw Error(String(r.status));return r.json();})
       .then(resolve).catch(()=>{if(++attempt>=3)resolve(null);else setTimeout(next,180*attempt);});
   }
   next();
 });
}
async function loadEvent(){
 if(fetchDone)return eventData;
 if(loading)return loading;
 loading=Promise.all([
  fetchJSON('data/relationship-changes-v1.json'),
  fetchJSON('data/relationship-evidence-v1.json'),
  fetchJSON('data/relationship-sources-v1.json')
 ]).then(([changePack,edgePack,sourcePack])=>{
   eventData=changePack?.changes?.find(c=>c.change_id==='C004')||null;
   evidence=edgePack||null;sources=sourcePack||null;fetchDone=true;
   return eventData;
 }).finally(()=>loading=null);
 return loading;
}
function nodeById(nodeId){return evidence?.nodes?.find(n=>n.node_id===nodeId);}
function edgeById(edgeId){return evidence?.edges?.find(e=>e.edge_id===edgeId);}
function sourceById(sourceId){return sources?.sources?.find(s=>s.source_id===sourceId);}
function nodeStatus(node){
 if(!node)return '资料未确认';
 switch(node.node_status){case 'pending':return '待落地';case 'active':return '已登记在营';case 'new':return '新项目（需核查）';case 'exit':return '退出（需核查范围）';default:return '状态待核实';}
}
const rail=document.createElement('section');
rail.id='bl-discovery-rail';
rail.setAttribute('aria-label','发现博罗结构联系');
rail.innerHTML=
 '<div class="bl-discover-head"><b>继续发现 · 一条联系带你走得更远</b><span id="bl-discovery-focus">从群落进入真实结构</span></div>'+
 '<div class="bl-discover-cards">'+
 '<button class="bl-discover-card" id="bl-discover-industry" type="button"><strong><i class="bl-ico">✧</i>园洲制造的联系</strong><small>点亮欣旺达及其已收录邻居</small></button>'+
 '<button class="bl-discover-card" id="bl-discover-external" type="button"><strong><i class="bl-ico">↗</i>跨界联系在哪里</strong><small>从东莞沿关系深入博罗</small></button>'+
 '<button class="bl-discover-card" id="bl-discover-c004" type="button" data-kind="pending"><strong><i class="bl-ico">◇</i>C004 · 四宗项目签约</strong><small>潜在连接，尚不能算已投产</small></button>'+
 '</div>';
const viewport=id('viewport');
if(!viewport)return;
viewport.appendChild(rail);
const sheet=document.createElement('div');
sheet.id='bl-discovery-sheet';
sheet.hidden=true;
sheet.setAttribute('role','dialog');
sheet.setAttribute('aria-modal','true');
sheet.setAttribute('aria-label','C004四宗签约项目与潜在联系');
document.body.appendChild(sheet);
let lastFocusEl=null;
function closeSheet(){
 if(sheet.hidden)return;
 sheet.hidden=true;sheet.innerHTML='';
 document.body.style.removeProperty('overflow');
 if(lastFocusEl&&lastFocusEl.isConnected)lastFocusEl.focus();
}
function drawGraph(ev){
 if(!evidence)return '';
 const lines=(ev.involved_edge_ids||[]).map(edgeId=>{
   const e=edgeById(edgeId);if(!e)return '';
   const a=POINTS[e.source_node_id],b=POINTS[e.target_node_id];if(!a||!b)return '';
   const c=e.evidence_type==='待验证假设'?'#e9b673':'#68dedc';
   return '<path d="M'+a[0]+' '+a[1]+' L'+b[0]+' '+b[1]+'" fill="none" stroke="'+c+'" stroke-width="3" stroke-dasharray="'+(e.evidence_type==='待验证假设'?'6 8':'none')+'" opacity=".84"/>';
 }).join('');
 const nodes=['hpm','crs','acc','lcs','zw'].map(nodeId=>{
   const node=nodeById(nodeId);if(!node)return '';
   const xy=POINTS[nodeId],existing=nodeId==='zw',color=existing?'#65e1e6':'#ffc987';
   return '<circle cx="'+xy[0]+'" cy="'+xy[1]+'" r="'+(existing?49:52)+'" fill="'+(existing?'#123b55':'#3b3029')+'" stroke="'+color+'" stroke-width="2.5" stroke-dasharray="'+(existing?'none':'5 6')+'"/>'+
    '<text x="'+xy[0]+'" y="'+(xy[1]-4)+'" fill="#ffffff" text-anchor="middle" font-size="15" font-weight="700">'+escapeHTML(LABELS[nodeId]||node.name)+'</text>'+
    '<text x="'+xy[0]+'" y="'+(xy[1]+17)+'" fill="'+color+'" text-anchor="middle" font-size="12">'+escapeHTML(existing?'已收录主体':nodeStatus(node))+'</text>';
 }).join('');
 return '<div class="bl-prospect-map"><svg viewBox="0 0 900 266" role="img" aria-label="四个待落地项目与现有主体的可能联系，虚线表示尚未确认的关系">'+
    '<defs><radialGradient id="bl-discovery-glow"><stop offset="0" stop-color="#1e7a96" stop-opacity=".4"/><stop offset="1" stop-color="#1e7a96" stop-opacity="0"/></radialGradient></defs>'+
    '<ellipse cx="442" cy="132" rx="410" ry="133" fill="url(#bl-discovery-glow)"/>'+lines+nodes+
    '<text x="450" y="257" fill="#c8a577" font-size="14" text-anchor="middle">虚线 = 潜在产业联系，不代表签署供货合同或已经投产</text></svg></div>';
}
function renderSheet(ev){
 const pending=(ev.involved_node_ids||[]).map(nodeById).filter(Boolean);
 const src=ev.source_ids?.map(sourceById).filter(Boolean).find(x=>/^https:/.test(x.url||''))||null;
 const chips=pending.map(n=>{
  const m=String(n.description||'').match(/总投资\s*([0-9.]+)\s*亿/);
  return '<div class="bl-prospect"><b>'+escapeHTML(n.name)+'</b><small>'+escapeHTML(nodeStatus(n))+'</small>'+
  (m?'<div class="bl-money">'+escapeHTML(m[1])+'亿元</div>':'<div class="bl-money">投资待核对</div>')+'</div>';
 }).join('');
 const proposals=(ev.involved_edge_ids||[]).map(edgeById).filter(Boolean);
 const proposalRows=proposals.map(e=>{
  const a=nodeById(e.source_node_id),b=nodeById(e.target_node_id);
  const pending=e.evidence_type==='待验证假设'||e.evidence_grade==='C';
  return '<div class="bl-proposal">'+escapeHTML(a?.name||e.source_node_id)+' ⇢ '+escapeHTML(b?.name||e.target_node_id)+
   ' · '+(pending?'待验证':'关联记录')+'</div>';
 }).join('');
 const sourceLink=src?'<a class="bl-action" href="'+escapeHTML(src.url)+'" target="_blank" rel="noopener noreferrer">查看签约原文</a>':'';
 sheet.innerHTML='<div class="bl-sheet" tabindex="-1">'+
 '<div class="bl-sheet-top"><div><span class="bl-eyebrow">C004 / 潜在连接层 / 2026-08-03</span><h2>签约已经发生，产业网络还在等待形成</h2></div><button id="bl-sheet-close" class="bl-close" type="button" aria-label="关闭">×</button></div>'+
 '<p class="bl-prompt">'+escapeHTML(ev.title)+'</p>'+
 '<div class="bl-status-row"><span class="bl-status">已发生：项目签约</span><span class="bl-status">待核验：建设与实际投产</span><span class="bl-status">尚未证实：本地配套合同</span></div>'+
 drawGraph(ev)+
 '<div class="bl-prospects">'+chips+'</div>'+
 '<div class="bl-proposal-title">可以继续观察的三条联系（不是已确认供应链）</div><div class="bl-proposal-list">'+proposalRows+'</div>'+
 '<div class="bl-observation">真正值得观察的是：签约 → 建设 → 投产 → 形成稳定供需关系。后续Skills更新时，应先改变项目状态，再依据新证据决定关系是否转为已确认。</div>'+
 '<div class="bl-actions"><button class="bl-action" type="button" id="bl-sheet-network">返回已收录网络</button>'+sourceLink+
 '<a class="bl-action primary" href="'+ROOT+'holo-home-v9.html#change=C004">进入C004变化现场 →</a></div>'+
 '</div>';
 id('bl-sheet-close').onclick=closeSheet;
 id('bl-sheet-network').onclick=()=>{
   closeSheet();
   const api=window.__boluoDebug;
   if(api?.openCluster)api.openCluster('industry');
 };
 sheet.querySelector('.bl-sheet').focus();
}
async function openC004(){
 lastFocusEl=document.activeElement;
 sheet.hidden=false;document.body.style.overflow='hidden';
 sheet.innerHTML='<div class="bl-sheet"><button id="bl-sheet-close" class="bl-close" type="button" style="float:right">×</button><div class="bl-unavailable">正在读取已发布的C004变化记录…</div></div>';
 id('bl-sheet-close').onclick=closeSheet;
 const ev=await loadEvent();
 if(sheet.hidden)return;
 if(!ev||!evidence){
  sheet.innerHTML='<div class="bl-sheet"><div class="bl-sheet-top"><h2>公开变化数据暂不可读</h2><button class="bl-close" id="bl-sheet-close">×</button></div>'+
   '<p class="bl-prompt">没有确认的数据时不展示推断连接。可以直接进入变化现场查看C004原记录。</p>'+
   '<div class="bl-actions"><a class="bl-action primary" href="'+ROOT+'holo-home-v9.html#change=C004">打开C004变化现场</a></div></div>';
  id('bl-sheet-close').onclick=closeSheet;
  return;
 }
 renderSheet(ev);
}

/* ---------- 关联主体、可验证的结构路径与回访记录 ---------- */
const SAVE_KEY='boluo_relation_observations_v1';
function nodes(){return window.BOLUO_DATA?.nodes||[];}
function edges(){return window.BOLUO_DATA?.edges||[];}
function getNode(nodeId){return nodes().find(n=>n.id===nodeId);}
function touching(nodeId){return edges().filter(e=>e.source===nodeId||e.target===nodeId);}
function adjacent(nodeId){return touching(nodeId).map(e=>({edge:e,other:getNode(e.source===nodeId?e.target:e.source)})).filter(x=>x.other);}
function twoHop(nodeId){
 const direct=new Set(adjacent(nodeId).map(x=>x.other.id));
 for(const step of adjacent(nodeId)){
  for(const next of adjacent(step.other.id)){
   if(next.other.id!==nodeId&&!direct.has(next.other.id)){
    return {via:step.other,end:next.other,first:step.edge,second:next.edge};
   }
  }
 }
 return null;
}
const publicLevel=e=>e.level==='A'?'已收录且有公开依据':'研究性产业关联';
const relLabel=e=>String(e.kind||'联系').replace('供应链','产业关联');
function shareLink(state){
 const url=new URL(location.pathname,location.origin);
 if(state.selected&&getNode(state.selected))url.searchParams.set('entity',state.selected);
 else if(state.focusTown)url.searchParams.set('town',state.focusTown);
 else if(state.focusCluster)url.searchParams.set('cluster',state.focusCluster);
 return url.toString();
}
function getSaved(){
 try{const a=JSON.parse(localStorage.getItem(SAVE_KEY)||'[]');return Array.isArray(a)?a:[];}
 catch(e){return [];}
}
function showFeedback(message){
 let n=id('bl-discovery-feedback');
 if(!n){
  n=document.createElement('div');n.id='bl-discovery-feedback';n.setAttribute('role','status');
  rail.appendChild(n);
 }
 n.textContent=message;n.hidden=false;
}
function saveObservation(state){
 const target=getNode(state.selected);
 if(!target){showFeedback('请先选择一个主体，再保存观察');return;}
 try{
  const observations=getSaved().filter(o=>o.id!==target.id);
  observations.unshift({id:target.id,name:target.name,town:target.town,
   loggedAt:new Date().toISOString(),directCount:adjacent(target.id).length,
   question:'这些已收录关联对我有什么意义？还有哪些关系需要核验？',
   link:shareLink(state)});
  localStorage.setItem(SAVE_KEY,JSON.stringify(observations.slice(0,30)));
  showFeedback('已保存到本机浏览器（不上传服务器）；可在「我的观察」中回访');
  const b=id('bl-saved-count');if(b)b.textContent=String(getSaved().length);
 }catch(e){showFeedback('当前浏览器未允许本地存储，请使用复制链接');}
}
async function copyFocus(state){
 const value=shareLink(state);
 try{
  if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(value);}
  else{
   const field=document.createElement('textarea');field.value=value;document.body.appendChild(field);
   field.select();const ok=document.execCommand('copy');field.remove();if(!ok)throw Error('copy failed');
  }
  showFeedback('已复制当前研究位置的链接');
 }catch(e){showFeedback('复制受到浏览器限制，可从地址栏复制：'+value);}
}
function showSaved(){
 lastFocusEl=document.activeElement;sheet.hidden=false;
 const records=getSaved();
 sheet.innerHTML='<div class="bl-sheet" tabindex="-1">'+
  '<div class="bl-sheet-top"><div><div class="bl-eyebrow">PRIVATE / LOCAL</div><h2>我的结构观察</h2></div>'+
  '<button class="bl-close" type="button" id="bl-sheet-close" aria-label="关闭">×</button></div>'+
  '<p class="bl-prompt">这些观察只存于当前浏览器，尚未与报告页同步，不包含用户身份信息。</p>'+
  (records.length?records.map(o=>'<a class="bl-record" href="'+escapeHTML(o.link)+'"><b>'+escapeHTML(o.name)+'</b>'+
   '<span>'+escapeHTML(o.town||'')+' · '+escapeHTML(o.loggedAt?.slice(0,10)||'')+' · '+Number(o.directCount||0)+'条当时直接联系</span></a>').join(''):
   '<div class="bl-unavailable">暂无记录。选择一个主体后点击「保存观察」。</div>')+
  '<div class="bl-actions"><button class="bl-action" id="bl-clear-local" type="button">清空本机记录</button></div></div>';
 id('bl-sheet-close').onclick=closeSheet;
 id('bl-clear-local').onclick=()=>{try{localStorage.removeItem(SAVE_KEY);}catch(e){}showSaved();};
 sheet.querySelector('.bl-sheet').focus();
}
function selectedToolkit(state){
 const target=getNode(state.selected);
 const old=id('bl-connection-insight');if(old)old.remove();
 if(!target)return;
 const near=adjacent(target.id).sort((a,b)=>(a.edge.level==='A'?0:1)-(b.edge.level==='A'?0:1));
 const hop=twoHop(target.id);
 const el=document.createElement('section');el.id='bl-connection-insight';el.setAttribute('aria-label','沿着关系继续研究');
 let html='<div class="bl-insight-heading">沿着关系继续研究 <span>'+near.length+' 条直接联系</span></div>';
 html+='<p class="bl-insight-sub">下列联系来自已发布的产业网络；结构路径不等于采购、投资或现实影响的因果证明。</p>';
 html+='<div class="bl-insight-list">'+(near.length?near.slice(0,5).map(x=>
   '<button type="button" class="bl-insight-link" data-bl-next="'+escapeHTML(x.other.id)+'">'+
   '<b>'+escapeHTML(x.other.name)+'</b><span>'+escapeHTML(relLabel(x.edge))+' · '+publicLevel(x.edge)+' ↗</span></button>'
 ).join(''):'<div class="bl-insight-empty">当前筛选条件下未显示直接联系，可以切换关系筛选。</div>')+'</div>';
 if(hop)html+='<div class="bl-insight-bridge"><span class="bl-insight-label">一个值得进一步研究的两跳路径</span>'+
   '<b>'+escapeHTML(target.name)+' → '+escapeHTML(hop.via.name)+' → '+escapeHTML(hop.end.name)+'</b>'+
   '<small>这代表图中可找到的间接连接，不是两端已建立直接交易。</small>'+
   '<button type="button" data-bl-next="'+escapeHTML(hop.end.id)+'">继续看 '+escapeHTML(hop.end.name)+' ↗</button></div>';
 html+='<div class="bl-insight-action-row">'+
  '<button type="button" id="bl-save-current">保存观察</button>'+
  '<button type="button" id="bl-copy-current">复制研究链接</button>'+
  '<a href="../../network.html?entity='+encodeURIComponent(target.id)+'&from=relation-world">进入产业X光 ↗</a>'+
  '</div>';
 el.innerHTML=html;
 const inspector=id('inspectorBody');
 if(inspector){inspector.appendChild(el);
  el.querySelectorAll('[data-bl-next]').forEach(b=>b.onclick=()=>window.__boluoDebug?.openNode?.(b.getAttribute('data-bl-next')));
  id('bl-save-current').onclick=()=>saveObservation(window.__boluoDebug?.state||state);
  id('bl-copy-current').onclick=()=>copyFocus(window.__boluoDebug?.state||state);
 }
}
function updateRail(state){
 const b1=id('bl-discover-industry'),b2=id('bl-discover-external'),focus=id('bl-discovery-focus');
 if(!b1||!b2||!focus)return;
 const target=getNode(state.selected);
 if(target){
  currentFocus=target.id;
  focus.textContent='已聚焦：'+target.name+' · '+(state.depth===2?'两跳':'直接联系');
  const neigh=adjacent(target.id);
  const go=neigh[0]?.other;
  if(go){
   b1.dataset.nextNode=go.id;
   b1.querySelector('strong').textContent='继续：'+go.name;
   b1.querySelector('small').textContent='沿现有记录追踪直接联系';
  }else{
   b1.dataset.nextNode='xwd';
   b1.querySelector('strong').textContent='进入园洲制造';
   b1.querySelector('small').textContent='从欣旺达看产业结构';
  }
  b2.querySelector('strong').textContent='切换到两跳探索';
  b2.querySelector('small').textContent=state.depth===2?'已显示两跳 · 点击可收起':'经由中间主体寻找关联';
  b2.dataset.action='depth';
 }else{
  delete b1.dataset.nextNode;b2.dataset.action='external';
  b1.querySelector('strong').textContent='园洲制造的联系';
  b1.querySelector('small').textContent='从欣旺达进入产业网络';
  b2.querySelector('strong').textContent='跨界联系在哪里';
  b2.querySelector('small').textContent='从东莞观察跨市关联';
  focus.textContent=state.focusTown?'当前镇街：'+state.focusTown:
   state.focusCluster?'当前群落：'+({
    industry:'产业制造',external:'外部联系',tourism:'山水文旅',agriculture:'农业乡村',life:'城镇生活'
   }[state.focusCluster]||state.focusCluster):'选择一处群落开始结构探索';
 }
}
function sync(){
 const state=window.__boluoDebug?.state;
 if(!state)return;
 updateRail(state);
 selectedToolkit(state);
}
id('bl-discover-c004').onclick=openC004;
id('bl-discover-industry').onclick=()=>{
 const n=id('bl-discover-industry').dataset.nextNode||'xwd';
 window.__boluoDebug?.openNode?.(n);
};
id('bl-discover-external').onclick=()=>{
 if(id('bl-discover-external').dataset.action==='depth'&&window.__boluoDebug?.state?.selected)
  id('depthButton')?.click();
 else window.__boluoDebug?.openNode?.('dg');
};
const saved=document.createElement('button');
saved.id='bl-saved-menu';saved.type='button';
saved.innerHTML='我的观察 <span id="bl-saved-count">0</span>';
saved.onclick=showSaved;
rail.querySelector('.bl-discover-head').appendChild(saved);
sheet.addEventListener('click',e=>{if(e.target===sheet)closeSheet();});
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&!sheet.hidden){e.stopImmediatePropagation();closeSheet();}},true);
window.__BOLUO_DISCOVERY={sync,openC004,closeSheet,showSaved};
try{id('bl-saved-count').textContent=String(getSaved().length);}catch(e){}
sync();
loadEvent();
const query=new URLSearchParams(location.search);
const hash=new URLSearchParams(location.hash.replace(/^#/,''));
const change=query.get('change')||hash.get('change');
const intentEntity=query.get('entity')||hash.get('entity');
const intentTown=query.get('town')||hash.get('town');
const intentCluster=query.get('cluster')||hash.get('cluster');
if(change==='C004'||['hpm','crs','acc','lcs'].includes(intentEntity||'')){
 openC004();
}else if(intentEntity&&getNode(intentEntity)){
 window.__boluoDebug?.openNode?.(intentEntity);
}else if(intentTown){
 window.__boluoDebug?.enterTown?.(intentTown);
}else if(intentCluster&&window.BOLUO_DATA?.clusters?.some(c=>c.id===intentCluster)){
 window.__boluoDebug?.openCluster?.(intentCluster);
}
})();