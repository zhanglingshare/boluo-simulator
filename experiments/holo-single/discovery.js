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
id('bl-discover-c004').onclick=openC004;
id('bl-discover-industry').onclick=()=>window.__boluoDebug?.openNode?.('xwd');
id('bl-discover-external').onclick=()=>window.__boluoDebug?.openNode?.('dg');
sheet.addEventListener('click',e=>{if(e.target===sheet)closeSheet();});
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&!sheet.hidden){e.stopImmediatePropagation();closeSheet();}},true);
function sync(){
 const state=window.__boluoDebug?.state;
 if(!state)return;
 const node=window.BOLUO_DATA?.nodes?.find(n=>n.id===state.selected);
 const focus=id('bl-discovery-focus');
 if(node){currentFocus=node.id;focus.textContent='已选中：'+node.name;}
 else if(state.focusTown){focus.textContent='当前镇街：'+state.focusTown;}
 else if(state.focusCluster){focus.textContent='当前群落：'+(state.focusCluster==='industry'?'产业制造':state.focusCluster==='external'?'外部联系':state.focusCluster==='tourism'?'山水文旅':state.focusCluster==='agriculture'?'农业乡村':'城镇生活');}
 else focus.textContent='从五群进入真实结构';
}
window.__BOLUO_DISCOVERY={sync,openC004,closeSheet};
sync();
loadEvent(); // 非阻塞预取；不影响M2和M3
})();
