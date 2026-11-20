/* Boruo Franchise Manager V2 · game-facing orchestration over existing LivingWorld
   and V13 tactical attributes. No proprietary EA/2K assets, no claimed real firm data. */
(function(){
"use strict";
const C=window.BoluoCore,W=window.BoluoLivingWorld,A=window.BoluoEnterpriseAttributes;
const $=id=>document.getElementById(id);
const safe=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const fmt=(x,d=0)=>Number(x||0).toLocaleString("zh-CN",{minimumFractionDigits:d,maximumFractionDigits:d});
const clamp=(x,l=0,h=100)=>Math.min(h,Math.max(l,Number(x)||0));
const diff=(x,d=1)=>(x>0?"+":"")+fmt(x,d);
const sectorName={primary:"现代农业",secondary:"先进制造",tertiary:"生产性服务"};
const sectorIcon={primary:"🌾",secondary:"⚙",tertiary:"◈"};
const sectorColor={primary:"#8ddeaf",secondary:"#f0c982",tertiary:"#76d9d5"};
const actionCost={expedite:12,substitute:9,skills:10,investigate:3};
const actionName={expedite:"协调项目投产",substitute:"建立备选供应",skills:"企业技能支持",investigate:"专项调查"};
const titles={hub:"经理总部",squad:"产业阵容",scout:"球探中心",tactics:"经营战术",season:"赛季日历",office:"经营办公室",lab:"研发实验室"};
const STORE="boluo-manager-v2-state",OLD="boluo-living-world-browser-v1";
const sample=C.demo(),fingerprint=C.identity(sample),firmsSeed=sample.tables.enterprises;
let publicData=null,initial=null,world=null,view="hub",selectedFirm="I0236",selectedProject=null,
 watch=["I0236","I0087","A0001","S0001"],compareIds=["I0236","I0087"],queued=[],
 scenario="normal",filters={query:"",sector:"all",town:"all",order:"score"},scoutPage=0,
 selectedQuarter=0,busy=false,selectedSector="secondary",notice="",labResult=null;
const sectorFirms=k=>world.firms.filter(f=>f.sector===k);
const findFirm=id=>world.firms.find(f=>f.id===id);
const nextProjects=()=>world.projects.filter(p=>!p.activated&&p.arrivalQ>=world.q)
  .sort((a,b)=>a.arrivalQ-b.arrivalQ||a.id.localeCompare(b.id));
const last=()=>world.history.at(-1);
const qLabel=q=>(2026+Math.floor(q/4))+" · Q"+(q%4+1);
const externalAt=q=>{
 if(q<2||q>=8)return {};
 if(scenario==="supply")return {demandMultiplier:.94,supplyDisruption:.55};
 if(scenario==="demand")return {demandMultiplier:.70,supplyDisruption:.12};
 return {};
};
function rating(f){
 if(!f)return {values:[50,50,50,50,50,50],ovr:50,pot:55};
 const nbr=world.links.filter(e=>e.buyer===f.id||e.supplier===f.id).length;
 const backlogRatio=f.backlog/Math.max(.01,f.base),liquidity=f.cash/Math.max(.01,f.base);
 const util=f.utilization||clamp(f.base/Math.max(.001,f.capacity),.15,1);
 const values=[
  clamp(43+util*39+Math.min(13,13*f.capacity/Math.max(.1,f.base))/2,10,98),
  clamp(43+f.innovation*41-backlogRatio*11+f.talent*7,10,98),
  clamp(35+f.innovation*51+f.talent*15,10,98),
  clamp(40+Math.min(30,nbr*3)+(f.backupUntil>=world.q?12:0),10,98),
  clamp(32+liquidity*16-f.debt/Math.max(.1,f.base)*12+(f.backupUntil>=world.q?8:0),10,98),
  clamp(44+Math.min(25,nbr*2)+Math.min(15,f.capacity/Math.max(.1,f.base)*7),10,98)
 ].map(x=>Math.round(x*10)/10);
 const ovr=+((values.reduce((a,b)=>a+b,0))/6).toFixed(1);
 return {values,ovr,pot:clamp(ovr+8+f.innovation*7,0,99)};
}
function profile(f){
 const r=rating(f);return A.profile({id:f.id,club:f.subsector,team:f.sector,role:"synthetic",tags:[]},r);
}
function avatars(f){return '<div class="avatar '+(f.sector==="primary"?"agri":f.sector==="tertiary"?"service":"")+'">'+sectorIcon[f.sector]+'</div>'}
function badge(text,type=""){return '<span class="badge '+type+'">'+safe(text)+'</span>'}
function stats(tiles){return '<div class="data-tiles">'+tiles.map(t=>'<div class="tile"><small>'+safe(t[0])+'</small><strong>'+t[1]+'</strong><em>'+safe(t[2]||"")+'</em></div>').join("")+'</div>'}
function box(head,body,more="",cls=""){
 return '<article class="panel '+cls+'"><div class="paneltop"><h2>'+head+'</h2>'+more+'</div>'+body+'</article>';
}
function cardTitle(t,d){return '<div class="titlebar"><div><div class="overline">BORO INDUSTRY MANAGER / '+safe(view.toUpperCase())+'</div><h2>'+t+'</h2><p>'+d+'</p></div></div>'}
function meter(label,value,text){
 return '<div class="progressrow"><div class="head"><span>'+label+'</span><b>'+safe(text||fmt(value,0)+"%")+'</b></div><div class="meter"><span style="width:'+clamp(value,0,100)+'%"></span></div></div>';
}
function pairLine(l,v,u=""){return '<div class="commerce"><span>'+l+'</span><div><b>'+v+'</b> <small>'+u+'</small></div></div>'}
function marketOverview(){
 const H=last(),firms=world.firms,active=firms.filter(f=>!f.closed).length;
 const sampleTotal=H?.grossProduction??0;
 const sampleVA=H?.sampleValueAddedProxy??0;
 const ratio=H?(100*H.unmetFinalDemand/Math.max(H.grossProduction,1)):0;
 const activeProjects=world.projects.filter(p=>p.activated).length;
 return {active,sampleTotal,sampleVA,ratio,activeProjects,edges:H?.tradedEdges??0,
  cashTotal:H?.cashTotal??firms.reduce((s,f)=>s+f.cash,0),
  debtTotal:H?.debtTotal??firms.reduce((s,f)=>s+f.debt,0),
  productionAvg:H?.averageUtilization??0};
}
function plotSeries(h,width=630,height=194){
 if(!h.length)return '<svg class="chart" viewBox="0 0 630 194" role="img" aria-label="赛季还未开始"><rect x="20" y="28" width="590" height="125" rx="12" fill="#102a3f"/><text x="315" y="91" fill="#b7c9d6" text-anchor="middle">推进一个季度后开始记录产业运行曲线</text></svg>';
 const a=Math.max(1,...h.map(x=>x.grossProduction))*1.12;
 const step=Math.max(1,h.length-1);
 const x=i=>32+565*i/step,y=v=>154-129*v/a;
 const line=(key,color)=>'<polyline points="'+h.map((z,i)=>x(i).toFixed(1)+','+y(z[key]).toFixed(1)).join(" ")+'" fill="none" stroke="'+color+'" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>';
 const p=h.at(-1);
 return '<svg class="chart" viewBox="0 0 630 194" role="img" aria-label="合成样本季度产出和增加值代理曲线">'+
  '<line x1="30" y1="156" x2="604" y2="156" stroke="#7290a0"/>'+
  [1,2,3].map(i=>'<line x1="30" y1="'+(156-36*i)+'" x2="604" y2="'+(156-36*i)+'" stroke="#34536a" stroke-dasharray="4 7"/>').join("")+
  line("grossProduction","#f2ca85")+line("sampleValueAddedProxy","#6fe1d3")+
  '<text x="28" y="180" fill="#9cb5c2" font-size="11">'+safe(h[0].label)+'</text>'+
  '<text x="535" y="180" fill="#9cb5c2" font-size="11">'+safe(p.label)+'</text>'+
  '<text x="85" y="17" fill="#f2ca85" font-size="11">● 样本产出</text><text x="220" y="17" fill="#78d9d1" font-size="11">● 增加值代理</text></svg>';
}
function sectorTotals(){
 return ["primary","secondary","tertiary"].map(k=>{
  const f=sectorFirms(k),h=last();
  return {id:k,companies:f.length,capacity:f.reduce((s,x)=>s+x.capacity,0),
    sampleGross:h?.sectorGross?.[k]??0,va:h?.sectorVA?.[k]??0,
    cash:f.reduce((s,x)=>s+x.cash,0),
    projects:world.projects.filter(p=>p.sector===k&&p.activated).length,
    future:nextProjects().filter(p=>p.sector===k).length};
 });
}
function sectorBar(){
 const groups=sectorTotals(),s=groups.reduce((a,g)=>a+g.sampleGross,0)||1;
 return '<div class="sectorbars">'+groups.map(g=>'<span style="width:'+(100*g.sampleGross/s).toFixed(1)+'%;background:'+sectorColor[g.id]+'"></span>').join("")+'</div>'+
  '<div class="legend">'+groups.map(g=>'<span><b style="color:'+sectorColor[g.id]+'">●</b> '+sectorName[g.id]+' '+(100*g.sampleGross/s).toFixed(1)+'%</span>').join("")+'</div>';
}
function timeline(){
 const q=world.q;
 return '<div style="height:8px;background:#2a485d;border-radius:7px;overflow:hidden;margin:9px 0"><div style="height:100%;width:'+(100*q/28).toFixed(2)+'%;background:linear-gradient(90deg,#5ad3ca,#f1cb80)"></div></div><div class="sectionrow muted" style="justify-content:space-between;font-size:11px"><span>2026 Q1</span><b>'+q+' / 28季度</b><span>2032 Q4</span></div>';
}
function messages(){
 const H=last(),p=nextProjects()[0],rows=[];
 if(!H)rows.push(["📌","第一次经营决策","企业将自主接单、采购、生产并结算现金。你可以先观察一个季度。","开发场景"]);
 if(H?.projectsActivated)rows.push(["🏗","项目进入投产阶段",H.projectsActivated+"宗合成项目到达设定投产时点，但不代表真实达产。","本季度"]);
 if(H && H.unmetFinalDemand>H.grossProduction*.05)rows.push(["⚠","订单交付压力升高","样本未满足订单 "+fmt(H.unmetFinalDemand,0)+" 百万元等值，检查企业供应关系。","需关注"]);
 if(H?.external?.supplyDisruption>0)rows.push(["🌪","供应冲击正在发生","原料可得性降低，企业备选供应能力和库存缓冲成为关键。","环境"]);
 if(H?.external?.demandMultiplier<.9)rows.push(["📉","外部需求走弱","即使企业产能充足，也未必能维持订单增长。","环境"]);
 if(p)rows.push(["🗓","下一宗待投产项目",p.id+" · "+sectorName[p.sector]+" · 计划 "+qLabel(Math.max(0,p.arrivalQ)),"日程"]);
 if(H&&H.policy?.length)rows.push(["✓","经理指令已执行",H.policy.map(x=>actionName[x.type]+" "+x.target).join("；"),"回执"]);
 if(rows.length<4)rows.push(["◈","产业关系正在重构","本季成交 "+(H?.tradedEdges||0)+" 条合成联系，不等于原始网络所有边。","观察"]);
 return rows.slice(0,5);
}
function inboxHTML(rows=messages()){
 return '<div class="inbox">'+rows.map((m,i)=>'<div class="inboxitem"><div class="inboxico '+(i===0&&m[0]==="⚠"?"alert":"")+'">'+m[0]+'</div><div style="flex:1"><strong>'+safe(m[1])+'</strong><p>'+safe(m[2])+'</p></div><small>'+safe(m[3])+'</small></div>').join("")+'</div>';
}
function actionPlanHtml(){
 if(!queued.length)return '<p class="hint">还没有排入本季度的行动。你可以先观察，也可以进入战术中心分配最多三项行动。</p>';
 return queued.map((a,i)=>'<div class="queueitem"><span>'+safe(actionName[a.type])+' · '+safe(a.target)+'</span><div><b style="color:var(--gold)">'+actionCost[a.type]+'点</b> <button class="btn tiny ghost" data-do="remove-action" data-index="'+i+'">移除</button></div></div>').join("");
}
function renderHub(){
 const m=marketOverview(),h=last(),p=nextProjects()[0],nextQ=qLabel(world.q),activePct=100*m.active/world.firms.length;
 const danger=m.ratio>10?"警惕交付压力":!h?"接管产业世界":"经营进入下一季度";
 const long=h?('第'+world.q+'季度已结算。企业自主生产、采购、投资和结算，'+(h.projectsActivated?"本季度有项目进入产能形成阶段。":"你可以决定是否介入下一季。")):'这是一个有企业、有产业链、有项目和28季度历史的可演化世界。你无法直接设定经济增长率。';
 const future=p?'<div class="bigdual"><div class="ring" style="--pct:'+Math.min(99,Math.round(100*world.q/28))+'"><b>'+Math.max(0,p.arrivalQ-world.q)+'</b></div><div><small>距离下一宗项目预设投产期</small><strong style="font-size:20px">'+safe(p.id)+'</strong><div class="hint">'+sectorName[p.sector]+' · '+safe(p.town)+' · '+qLabel(Math.max(0,p.arrivalQ))+'</div></div></div>':'<p class="hint">已无后续计划投产项目。</p>';
 return '<div class="grid12">'+
  '<div class="span8">'+box('<span class="overline">MANAGER LIVE · '+nextQ+'</span>','<div class="hero-title">'+danger+'</div><p class="hero-desc">'+long+'</p>'+
   stats([["活跃企业",fmt(m.active),"合成主体"],["本季样本产出",h?fmt(m.sampleTotal,0):"待结算","百万元等值"],["订单缺口率",h?fmt(m.ratio,1)+"%":"待结算","演示经济"],["本季成交关系",h?fmt(m.edges):"待结算","网络实际交易"]])+
   '<div class="hero-row"><button class="btn primary" data-do="advance">▶ 推进下一季度</button><button class="btn" data-view="tactics">⚑ 布置下一季</button><button class="btn ghost" data-do="fast-forward">快进一年</button></div>',
    '',"hero glow")+'</div>'+
  '<div class="span4">'+box('◎ 下一个项目节点',future+meter("本赛季进度",100*world.q/28,world.q+"/28季度")+
   '<button class="btn" style="width:100%;margin-top:8px" data-view="season">查看完整赛季日历</button>',badge("项目为合成样本","gold"))+'</div>'+
  '<div class="span4">'+box('✉ 经理收件箱',inboxHTML(),'<button class="btn tiny ghost" data-view="season">历史</button>')+'</div>'+
  '<div class="span5">'+box('▥ 产业赛季走势',plotSeries(world.history)+sectorBar()+
    '<div class="hint" style="margin-top:8px">仅合成企业样本，无法换算成博罗GDP。</div>',
    '<button class="btn tiny ghost" data-view="office">详细数据</button>')+'</div>'+
  '<div class="span3">'+box('◈ 资源与决策','<div class="giantnumber">'+world.budget+'<span style="font-size:13px">行动点</span></div>'+
   '<p class="hint">模拟资源，不是财政预算。每季度最多安排3项行动。</p>'+actionPlanHtml()+
   '<button class="btn soft" style="width:100%;margin-top:7px" data-view="tactics">打开经营战术室</button>',
   badge(queued.length+"/3 已排入"))+'</div>'+
  '<div class="span6">'+box('◉ 产业阵容速览',
    '<div class="rosterboard">'+sectorTotals().map(g=>'<button class="rosterlane" data-do="sector" data-sector="'+g.id+'"><h3>'+sectorIcon[g.id]+' '+sectorName[g.id]+'</h3><div class="count">'+g.companies+'</div><p>合成经营主体</p><p>模拟产出 '+fmt(g.sampleGross,0)+'</p></button>').join("")+'</div>',
    '<button class="btn tiny ghost" data-view="squad">全部阵容</button>')+'</div>'+
  '<div class="span6">'+box('★ 球探观察名单',
    '<div class="inbox">'+watch.slice(0,4).map(id=>{const f=findFirm(id);if(!f)return "";return '<div class="playerline" data-do="open-firm" data-firm="'+f.id+'">'+avatars(f)+'<div class="info"><strong>'+safe(f.name)+'</strong><small>'+sectorName[f.sector]+' · '+safe(f.town)+'</small></div><div class="ovr small">'+Math.round(rating(f).ovr)+'</div></div>'}).join("")+'</div>',
    '<button class="btn tiny ghost" data-view="scout">去找更多主体</button>')+'</div>'+
 '</div>';
}
function tradeNetwork(id){
 const focus=findFirm(id);if(!focus)return '<p class="hint">请选择一家公司。</p>';
 const settled=new Map((world.lastTrades||[]).map(x=>[x.buyer+"|"+x.supplier,x.amount]));
 const edges=world.links.filter(e=>e.buyer===id||e.supplier===id)
  .sort((a,b)=>(settled.get(b.buyer+"|"+b.supplier)||0)-(settled.get(a.buyer+"|"+a.supplier)||0)||b.weight-a.weight)
  .slice(0,13);
 const pts=new Map([[id,{x:315,y:143}]]);
 edges.forEach(e=>{
  const nid=e.buyer===id?e.supplier:e.buyer;
  if(pts.has(nid))return;
  const n=pts.size-1,ang=n*2*Math.PI/Math.max(6,edges.length)-Math.PI/2;
  pts.set(nid,{x:315+232*Math.cos(ang),y:148+103*Math.sin(ang)});
 });
 let paths="",nodes="";
 for(const e of edges){
  const src=pts.get(e.supplier),dst=pts.get(e.buyer);if(!src||!dst)continue;
  const traded=settled.get(e.buyer+"|"+e.supplier)||0,active=traded>0;
  paths+='<path d="M'+src.x.toFixed(1)+' '+src.y.toFixed(1)+' L'+dst.x.toFixed(1)+' '+dst.y.toFixed(1)+'" stroke="'+(active?"#f1c782":"#67bdc5")+'" stroke-width="'+(active?Math.min(6,2+Math.log1p(traded)):1.2)+'" opacity="'+(active?".94":".36")+'" '+(active?'':'stroke-dasharray="5 6"')+' fill="none"/>';
 }
 for(const [id,p] of pts){
  const central=id===focus.id,r=central?29:17;
  nodes+='<g role="button" tabindex="0" data-do="open-firm" data-firm="'+safe(id)+'" style="cursor:pointer">'+
   '<circle cx="'+p.x.toFixed(1)+'" cy="'+p.y.toFixed(1)+'" r="'+r+'" fill="'+(central?"#1f797d":"#6b5a44")+'" stroke="'+(central?"#a1f3e5":"#f2cf96")+'" stroke-width="1.6"/>'+
   '<text x="'+p.x.toFixed(1)+'" y="'+(p.y+3).toFixed(1)+'" text-anchor="middle" font-size="'+(central?13:10)+'" fill="#fff">'+safe(central?"观察":id.slice(0,1))+'</text>'+
   '<text x="'+p.x.toFixed(1)+'" y="'+(p.y+(central?47:31)).toFixed(1)+'" text-anchor="middle" font-size="10" fill="#b5d4e0">'+safe(id)+'</text>'+
   '</g>';
 }
 return '<svg viewBox="0 0 630 310" role="img" aria-label="合成产业关系与本季实际成交网络" style="width:100%;height:300px;display:block">'+
  '<rect x="5" y="6" width="620" height="298" rx="13" fill="#0d2a3c"/>'+paths+nodes+'</svg>'+
  '<div class="legend"><span style="color:var(--gold)">━━ 本季实际模拟成交</span><span style="color:var(--aqua)">┄ 潜在合成关系，尚未成交</span></div>'+
  '<p class="hint">点击任意节点打开该企业完整V13能力卡。这个网络是开发合成关系，不是博罗真实采购网络。</p>';
}

function renderSquad(){
 const group=sectorTotals(),k=selectedSector,fs=sectorFirms(k);
 const top=[...fs].sort((a,b)=>rating(b).ovr-rating(a).ovr).slice(0,6);
 const w=watch.map(id=>findFirm(id)).filter(Boolean);
 return cardTitle("产业阵容","借鉴NBA阵容管理，观察产业主体、配置关注组合，但你不拥有这些企业。")+
 '<div class="grid12"><div class="span8">'+box('▦ 三大产业阵容',
   '<div class="rosterboard">'+group.map(g=>'<button class="rosterlane" data-do="sector" data-sector="'+g.id+'" style="'+(k===g.id?"border-color:#e5cb93;box-shadow:0 0 0 1px #e5c99245":"")+'"><h3>'+sectorIcon[g.id]+' '+sectorName[g.id]+'</h3><div class="count">'+g.companies+'</div><p>本季产出 '+fmt(g.sampleGross,0)+'</p><p>已兑现项目 '+g.projects+'</p></button>').join("")+'</div>'+
   '<div class="sectionrow" style="justify-content:space-between;margin-top:18px"><b>'+sectorName[k]+' · 重点观察主体</b><button class="btn tiny ghost" data-view="scout">查找全部企业</button></div>'+
   '<div class="inbox">'+top.map(f=>'<div class="playerline" data-do="open-firm" data-firm="'+f.id+'">'+avatars(f)+'<div class="info"><strong>'+safe(f.name)+'</strong><small>'+safe(f.town)+' · 季度产能 '+fmt(f.capacity,1)+'</small></div><div class="ovr small">'+Math.round(rating(f).ovr)+'</div></div>').join("")+'</div>',
  badge("能力评分为开发情景","gold"))+'</div>'+
 '<div class="span4">'+box('★ 我的重点观察名单','<div class="hint">最多关注8家，类似球队管理里的观察阵容。关注不代表拥有或指挥企业。</div>'+
   '<div class="inbox" style="margin-top:12px">'+w.map(f=>'<div class="playerline" data-do="open-firm" data-firm="'+f.id+'">'+avatars(f)+'<div class="info"><strong>'+safe(f.id)+'</strong><small>'+safe(f.subsector)+'</small></div><div class="ovr small">'+Math.round(rating(f).ovr)+'</div></div>').join("")+'</div>'+
   '<button class="btn" data-view="scout" style="margin-top:11px;width:100%">＋ 寻找新观察对象</button>',
  badge(w.length+"/8"))+'</div>'+
 '<div class="span7">'+box('产业组合的本期表现',sectorBar()+
   '<div class="mini-grid">'+group.map(g=>'<div class="mini-cell"><small>'+sectorName[g.id]+'</small><b>'+fmt(g.va,0)+'</b><em>增加值代理 · 百万元等值</em></div>').join("")+'</div>'+
   '<p class="hint">不同产业当前表现随每一季度的真实模拟产出更新；不能视为真实县域三次产业增加值。</p>')+'</div>'+
 '<div class="span5">'+box('阵容能力并非越高越好',
  '<div class="report"><h3>经营的真实约束</h3><p>高能力企业也可能面临订单不足、资金积压和供应链风险。给某家企业加分，不等于整个产业自动变强。</p></div>'+
  '<button class="btn soft" data-view="tactics">▶ 用现有企业配置下一季度行动</button>')+'</div>'+
 '<div class="span8">'+box('◈ 动态关系战术图',tradeNetwork(selectedFirm),badge("当前关注："+selectedFirm,"gold"))+'</div>'+
 '<div class="span4">'+box('关系不是简单的连线',
   pairLine("潜在合成关系",world.links.filter(e=>e.buyer===selectedFirm||e.supplier===selectedFirm).length,"条")+
   pairLine("本季已成交", (world.lastTrades||[]).filter(e=>e.buyer===selectedFirm||e.supplier===selectedFirm).length,"条")+
   '<div class="report"><h3>供需协调才有价值</h3><p>网络结构里的联系，不代表每个季度一定发生交易。实际成交由需求、上期成品库存和现金约束决定。</p></div>'+
   '<button class="btn soft" data-do="open-firm" data-firm="'+safe(selectedFirm)+'">打开企业深度档案</button>')+'</div></div>';
}
function filtered(){
 let a=world.firms;
 if(filters.query){const q=filters.query.toLowerCase();a=a.filter(f=>(f.id+" "+f.name+" "+f.subsector+" "+f.town).toLowerCase().includes(q))}
 if(filters.sector!=="all")a=a.filter(f=>f.sector===filters.sector);
 if(filters.town!=="all")a=a.filter(f=>f.town===filters.town);
 a=[...a];
 if(filters.order==="score")a.sort((a,b)=>rating(b).ovr-rating(a).ovr);
 if(filters.order==="capacity")a.sort((a,b)=>b.capacity-a.capacity);
 if(filters.order==="cash")a.sort((a,b)=>b.cash-a.cash);
 if(filters.order==="backlog")a.sort((a,b)=>b.backlog-a.backlog);
 return a;
}
function renderScout(){
 const all=filtered(),pages=Math.max(1,Math.ceil(all.length/12));scoutPage=Math.min(scoutPage,pages-1);
 const list=all.slice(scoutPage*12,(scoutPage+1)*12),towns=[...new Set(world.firms.map(f=>f.town))].sort();
 const renderOne=id=>{const f=findFirm(id);if(!f)return "";const r=rating(f);
  return '<div class="playerline" data-do="open-firm" data-firm="'+id+'">'+avatars(f)+'<div class="info"><strong>'+safe(f.name)+'</strong><small>'+safe(f.subsector)+' · '+safe(f.town)+'</small></div><div class="ovr small">'+Math.round(r.ovr)+'</div></div>'};
 return cardTitle("全球球探，博罗版本","830家合成企业可检索、按能力排序、跨产业比较，并查看V13的36项战术属性。")+
 '<div class="grid12"><div class="span8">'+box('◎ 产业球探数据库 · '+all.length+' 家主体',
  '<div class="searchbar"><input id="scoutQuery" aria-label="查找企业" placeholder="企业编号、行业、镇街" value="'+safe(filters.query)+'">'+
  '<select id="scoutSector" aria-label="筛选产业"><option value="all">全部产业</option>'+Object.entries(sectorName).map(([k,n])=>'<option value="'+k+'" '+(filters.sector===k?"selected":"")+'>'+n+'</option>').join("")+'</select>'+
  '<select id="scoutTown" aria-label="筛选镇街"><option value="all">全部镇街</option>'+towns.map(t=>'<option value="'+safe(t)+'" '+(filters.town===t?"selected":"")+'>'+safe(t)+'</option>').join("")+'</select>'+
  '<select id="scoutOrder" aria-label="排序"><option value="score" '+(filters.order==="score"?"selected":"")+'>情景能力</option><option value="capacity" '+(filters.order==="capacity"?"selected":"")+'>季度产能</option><option value="cash" '+(filters.order==="cash"?"selected":"")+'>企业现金</option><option value="backlog" '+(filters.order==="backlog"?"selected":"")+'>积压订单</option></select><button class="btn soft" data-do="apply-search">查找</button></div>'+
  '<div class="resulttable"><div class="resulthead"><div>产业主体</div><div>行业/镇街</div><div>产能</div><div>现金</div><div>订单积压</div><div>能力</div></div>'+
  list.map(f=>'<div class="resultrow '+(selectedFirm===f.id?"active":"")+'" data-do="open-firm" data-firm="'+f.id+'"><div><b>'+safe(f.id)+'</b><br><small>'+safe(f.name)+'</small></div><div>'+safe(f.subsector)+'<br><small>'+safe(f.town)+'</small></div><div>'+fmt(f.capacity,1)+'</div><div>'+fmt(f.cash,1)+'</div><div>'+fmt(f.backlog,1)+'</div><div class="ovr small">'+Math.round(rating(f).ovr)+'</div></div>').join("")+
  '</div><div class="sectionrow" style="margin-top:12px;justify-content:space-between"><span class="hint">共 '+all.length+' 家 · 页码 '+(scoutPage+1)+' / '+pages+'</span><div class="sectionrow"><button class="btn tiny ghost" data-do="scout-prev" '+(!scoutPage?"disabled":"")+'>上一页</button><button class="btn tiny ghost" data-do="scout-next" '+(scoutPage+1>=pages?"disabled":"")+'>下一页</button></div></div>',
  badge("公开统计之外均为合成资料","gold"))+'</div>'+
 '<div class="span4">'+box('★ 双企业球探对照',
   '<p class="hint">先在企业详情中加入对照对象，分析实际经营状态与V13合成能力指标。</p>'+compareIds.map(renderOne).join("")+
   (compareIds.length===2?comparisonHTML():"<p class='hint'>还未选择两个对照对象。</p>")+
   '<button class="btn" data-do="clear-compare" style="margin-top:12px;width:100%">清空对照名单</button>',
   badge("最多2家"))+'</div></div>';
}
function comparisonHTML(){
 const a=findFirm(compareIds[0]),b=findFirm(compareIds[1]);if(!a||!b)return "";
 const ra=rating(a),rb=rating(b);
 return '<div class="attributegrid" style="margin-top:14px">'+ra.values.map((x,i)=>'<div><div class="hint">'+safe(A.groups[i]?.name||"指标")+'</div><div class="sectionrow" style="justify-content:space-between"><b style="color:var(--gold)">'+Math.round(x)+'</b><b style="color:var(--aqua)">'+Math.round(rb.values[i])+'</b></div><div class="meter"><span style="width:'+x+'%"></span></div></div>').join("")+'</div>'+
  '<p class="hint">左侧金色：'+a.id+'；右侧青色：'+b.id+'。六轴由当前合成经营状态推导，不是实测评级。</p>';
}
function renderTactics(){
 const m=marketOverview(),p=nextProjects(),target=findFirm(selectedFirm)||world.firms[0];
 const scheduled=p.slice(0,10),spent=queued.reduce((a,x)=>a+actionCost[x.type],0);
 const project=world.projects.find(x=>x.id===selectedProject&&!x.activated)||p[0];
 const projectOptions=scheduled.map(p=>'<option value="'+safe(p.id)+'" '+(project?.id===p.id?"selected":"")+'>'+safe(p.id)+' · '+qLabel(Math.max(0,p.arrivalQ))+' · '+sectorName[p.sector]+'</option>').join("");
 return cardTitle("经营战术中心","用户不能直接操作GDP和企业利润。只能配置有限的公共行动，并承担资源成本和时间滞后。")+
 '<div class="grid12"><div class="span7">'+box('◇ 三次产业作战布局',
  '<div class="tactic-world"><button class="tactic-node" data-do="sector" data-sector="secondary"><strong>Ⅱ</strong><small>制造业</small></button><button class="tactic-node" data-do="sector" data-sector="primary"><strong>Ⅰ</strong><small>农业</small></button><button class="tactic-node" data-do="sector" data-sector="tertiary"><strong>Ⅲ</strong><small>服务业</small></button></div>'+
  '<p class="hint">类似战术阵型：三次产业不是可随意调整的球员位置。真实政策动作通过企业、项目和资源约束间接影响布局。</p>'+sectorBar(),
  badge("总产出1:5:4目标不等同增加值结构","warn"))+'</div>'+
 '<div class="span5">'+box('⚑ 本季度战术指令',
  '<div class="policygrid">'+[
    ["expedite","🏗","协调项目","提前一个合成项目的预设产能形成时点"],
    ["substitute","🔗","供应备份","改善指定企业未来几个季度原料可得性"],
    ["skills","🎓","技能升级","提升指定企业的能力与竞争条件"],
    ["investigate","🔎","调查线索","消耗模拟资源并记录调查行为，不改变现实数据"]
   ].map(x=>'<button class="policy" data-do="queue" data-type="'+x[0]+'"><b>'+x[1]+' '+x[2]+' <em style="float:right">'+actionCost[x[0]]+'点</em></b><small>'+x[3]+'</small></button>').join("")+'</div>'+
  '<div class="hint" style="margin:13px 0 6px">关注主体：<b>'+safe(target.id)+'</b> · '+safe(target.subsector)+'</div>'+
  '<button class="btn tiny ghost" data-do="open-firm" data-firm="'+target.id+'">查看企业详情</button>'+
  '<div class="hint" style="margin:13px 0 5px">选择项目</div><select id="projectTarget" style="width:100%">'+projectOptions+'</select>'+
  '<hr><div class="sectionrow" style="justify-content:space-between"><b>行动队列</b><span class="badge">'+queued.length+'/3项 · '+spent+'/'+world.budget+'点</span></div>'+
  actionPlanHtml()+
  '<div class="sectionrow" style="margin-top:13px"><button class="btn primary" data-do="advance">执行并推进季度</button><button class="btn soft" data-do="compare">四季度双路线对照</button></div>',
  badge("该系统并不拥有企业","gold"))+'</div>'+
 '<div class="span6">'+box('◈ 资源与冲击约束',
  '<div class="mini-grid"><div class="mini-cell"><small>可使用行动资源</small><b>'+world.budget+'</b><em>游戏点数</em></div><div class="mini-cell"><small>已排入资源消耗</small><b>'+spent+'</b><em>下季度结算</em></div><div class="mini-cell"><small>当前订单缺口率</small><b>'+fmt(m.ratio,1)+'%</b><em>合成企业样本</em></div></div>'+
  '<p class="hint" style="margin:12px 0 5px">外部世界条件</p><select id="scenarioSelector" style="width:100%"><option value="normal">正常市场波动</option><option value="supply">2026 Q3起供应冲击</option><option value="demand">2026 Q3起需求走弱</option></select>'+
  '<p class="hint">外部冲击按预先设定的时间表在2026 Q3至2027 Q4生效，不是实时市场事件。</p>')+'</div>'+
 '<div class="span6">'+box('▤ 未来四季度推演', '<div id="comparisonBox" class="report"><h3>尚未推演</h3><p>把行动加入队列，点击“四季度双路线对照”，系统将分别运行有无政策的两条相同种子轨迹。</p></div>'+
  '<p class="evidence warn">这是合成模型的条件差异，不是现实政策因果效应。即使干预有成本，模型也不保证增长。</p>')+'</div></div>';
}
function renderSeason(){
 const cur=world.q,h=world.history,projectAt=q=>world.projects.filter(p=>p.arrivalQ===q).length;
 const yearCols=Array.from({length:7},(_,year)=>{
  const q=year*4;
  return '<div class="yearcol"><h3>'+(2026+year)+'</h3>'+Array.from({length:4},(_,j)=>{
   const ix=q+j,record=h[ix],isNow=ix===cur;
   return '<button class="quarter '+(record?"past ":"")+(isNow?"now":"")+'" data-do="select-quarter" data-quarter="'+ix+'"><small>Q'+(j+1)+'</small><b>'+(record?fmt(record.grossProduction,0):"···")+'</b><small>'+(record?"产出（样本）":(isNow?"当前季度":"待模拟"))+'</small><span class="eventdot">'+(record?.projectsActivated?"◆ "+record.projectsActivated+" 项目":projectAt(ix)?"◇ "+projectAt(ix)+" 计划":"")+'</span></button>';
  }).join("")+'</div>';
 }).join("");
 const record=h[selectedQuarter]||h.at(-1),up=nextProjects().slice(0,6);
 const ledger=record?pairLine("合成季度产出",fmt(record.grossProduction,1),"百万元等值")+pairLine("增加值代理",fmt(record.sampleValueAddedProxy,1),"百万元等值")+pairLine("本季成交边",record.tradedEdges,"条")+pairLine("账目检查",record.balanced?"全部平衡":"异常","")+pairLine("项目到期",record.projectsActivated,"宗"):'<p class="hint">当前尚无结算记录，推进季度后产生。</p>';
 return cardTitle("赛季日历","经理游戏的时间轴。2026—2032共28个季度，项目投产和经营变化都会留下历史记录。")+
 '<div class="grid12"><div class="span8">'+box('▤ 2026—2032 · 28季度赛程',
  '<div class="calendar">'+yearCols+'</div>'+timeline(),badge("已完成 "+cur+" 季度"))+'</div>'+
 '<div class="span4">'+box('◉ 季度回顾',
  '<div class="bigdual"><div><small>选定季度</small><strong>'+safe(record?.label||qLabel(selectedQuarter))+'</strong></div></div>'+ledger+
  '<div class="sectionrow" style="margin-top:13px"><button class="btn primary" data-do="advance" '+(world.q>=28?"disabled":"")+'>推进下一季</button><button class="btn ghost" data-do="fast-forward" '+(world.q>=28?"disabled":"")+'>快进一年</button></div>')+'</div>'+
 '<div class="span7">'+box('△ 产业状态时间序列',plotSeries(h)+sectorBar())+'</div>'+
 '<div class="span5">'+box('⌛ 近期项目日程','<div class="inbox">'+(up.length?up.map(p=>'<div class="inboxitem"><div class="inboxico">🏗</div><div><strong>'+p.id+' · '+sectorName[p.sector]+'</strong><p>'+safe(p.town)+' · 计划 '+qLabel(Math.max(0,p.arrivalQ))+'</p></div></div>').join(""):'<p class="hint">全部可用项目已处理或过了观察窗口。</p>')+'</div>',badge("演示项目计划"))+'</div></div>';
}
function renderOffice(){
 const m=marketOverview(),h=last(),fs=world.firms,credits=world.budget,used=world.actions.reduce((s,x)=>s+x.cost,0);
 const real=publicData?.records||[],FY=real.find(x=>x.period==="FY"&&x.year===2025),YTD=real.find(x=>x.period==="Q3_YTD"&&x.year===2026);
 const sumWith=x=>fs.reduce((s,f)=>s+f[x],0);
 const quarters=world.history.slice(-12),max=Math.max(1,...quarters.map(x=>x.cashTotal));
 return cardTitle("经营办公室","参考NBA MyNBA的薪资与财务管理思路，把资源、经营账目、项目投入与历史报告放在独立工作区。")+
 '<div class="grid12"><div class="span5">'+box('▣ 经理行动预算',
  '<div class="bigdual"><div><small>剩余可用行动资源</small><strong>'+credits+' 点</strong></div><div class="separator"></div><div><small>赛季累计已使用</small><strong>'+used+' 点</strong></div></div>'+
  '<p class="hint">虚拟行动点不是政府财政预算。技能、供应替代、项目协调都要占用行动资源。</p>'+meter("剩余资源",credits,credits+"/100")+
  pairLine("项目协调",12,"点/次")+pairLine("供应备份",9,"点/次")+pairLine("技能支持",10,"点/次")+pairLine("调查线索",3,"点/次")+
  '<button class="btn soft" data-view="tactics" style="margin-top:12px">进入战术中心配置行动</button>')+'</div>'+
 '<div class="span7">'+box('◉ 合成企业经营总账',
  '<div class="mini-grid"><div class="mini-cell"><small>企业合计现金</small><b>'+fmt(m.cashTotal,0)+'</b><em>百万元等值</em></div><div class="mini-cell"><small>合计债务</small><b>'+fmt(m.debtTotal,0)+'</b><em>演示融资</em></div><div class="mini-cell"><small>模拟产能利用</small><b>'+fmt(m.productionAvg*100,1)+'%</b><em>全部企业均值</em></div></div>'+
  '<div class="financebars">'+quarters.map(x=>'<div class="bar" data-tip="'+safe(x.label)+' / '+fmt(x.cashTotal,0)+'" style="height:'+(100*x.cashTotal/max).toFixed(1)+'%"></div>').join("")+'</div>'+
  '<p class="hint">合成企业现金余额按季度记录，所有实际内部交易同时在买方和卖方结算，且通过存量与现金守恒检查。</p>',
  badge("货币单位仍为模型演示等值","gold"))+'</div>'+
 '<div class="span6">'+box('▣ 项目投资接续','<div class="mini-grid"><div class="mini-cell"><small>演示项目</small><b>'+world.projects.length+'</b><em>72宗合成</em></div><div class="mini-cell"><small>已达设定时点</small><b>'+m.activeProjects+'</b><em>形成部分产能</em></div><div class="mini-cell"><small>等待兑现</small><b>'+nextProjects().length+'</b><em>尚未激活</em></div></div>'+
  '<div class="hint" style="margin-top:12px">项目金额与企业现金流不能直接相加；当前项目匹配为开发假设，并非真实投资转增加值关系。</div>')+'</div>'+
 '<div class="span6">'+box('◈ 公开宏观参照',
  pairLine("2025博罗GDP",FY?fmt(FY.gdp,2):"待加载","亿元")+pairLine("2025第一产业增加值",FY?fmt(FY.primary,2):"—","亿元")+pairLine("2025第二产业增加值",FY?fmt(FY.secondary,2):"—","亿元")+pairLine("2025第三产业增加值",FY?fmt(FY.tertiary,2):"—","亿元")+
  pairLine("2026年前三季度累计GDP",YTD?fmt(YTD.gdp,2):"—","亿元")+
  '<p class="evidence warn">2026前三季度是累计数，不能直接拿来与2025全年比较；这些事实不会随游戏模拟变动。</p>',
  badge("公开统计，来源可核","gold"))+'</div></div>';
}
function renderLab(){
 const h=last(),FY=publicData?.records?.find(x=>x.period==="FY");
 const inspect='<div class="mini-grid"><div class="mini-cell"><small>合成企业</small><b>'+world.firms.length+'</b><em>唯一主体ID</em></div><div class="mini-cell"><small>关系边</small><b>'+world.links.length+'</b><em>可追溯方向</em></div><div class="mini-cell"><small>运行季度</small><b>'+world.q+'</b><em>守恒检验</em></div></div>';
 return cardTitle("研发实验室","这里开放后台结构、经济约束和原模型入口。未来普通玩家不必进入，但开发阶段可以审计。")+
 '<div class="grid12"><div class="span7">'+box('⚙ 实际模型引擎状态',inspect+
  '<div class="report"><h3>世界内核 · '+safe(W.VERSION)+'</h3><p>企业自主订单、生产、原料、库存、现金、融资、项目投产、关系成交，使用同一个季度状态递推。没有把宏观模拟结果强行塞入企业账目。</p></div>'+
  pairLine("合成数据指纹",safe(world.dataFingerprint))+pairLine("随机种子",world.seed)+pairLine("季度账目校验",h?.balanced?"通过":"待运行")+
  pairLine("当前企业属性模型","V13 · 36项情景战术指标")+
  '<div class="sectionrow" style="margin-top:14px"><button class="btn soft" data-do="lab-run">▶ 独立重跑28季度</button><button class="btn ghost" data-do="export">导出当前世界</button></div>'+
  '<div id="labRunResult" class="report">'+(labResult||"独立重跑不会改变当前玩家存档，将对现有世界进行28季度内的无人干预基准验证。")+'</div>')+'</div>'+
 '<div class="span5">'+box('◎ 已有专业研究编辑器',
  '<a class="researchlink" href="../workbench/"><b>12环节统一研究工作台</b><span>↗</span></a>'+
  '<a class="researchlink" href="../../lab-2032/"><b>2032研究实验室</b><span>↗</span></a>'+
  '<a class="researchlink" href="../../v11/internal/league.html#season"><b>内部V12季度经理</b><span>↗</span></a>'+
  '<a class="researchlink" href="./classic-v1.html"><b>上一代单页演示备份</b><span>↗</span></a>'+
  '<div class="evidence warn">现有网络、项目与企业关系都是合成世界；V12经理版仍使用自己的状态，不应把不同模型输出冒充同一经济结果。</div>')+'</div>'+
 '<div class="span6">'+box('▥ 可核验的公开锚点',
  '<div class="report"><h3>2025 GDP：'+(FY?fmt(FY.gdp,2):"—")+'亿元</h3><p>这是现实观察，不是游戏赛季结算结果。</p></div>'+
  (publicData?.records||[]).map(x=>'<div class="commerce"><span>'+x.year+' '+safe(x.period)+'</span><a target="_blank" rel="noopener noreferrer" href="'+safe(x.source)+'">'+fmt(x.gdp,2)+' 亿元 ↗</a></div>').join("")+
  '<p class="hint">数据基线、合成假设、模型代码与运行审计能够分别追踪。</p>')+'</div>'+
 '<div class="span6">'+box('▣ 口径与可信度检查',
  '<div class="report"><h3>三个不可混淆的数字</h3><p>企业营收 ≠ 地区生产总值；工业总产值 ≠ 第二产业增加值；企业能力评分 ≠ 宏观政策绩效。</p></div>'+
  '<div class="report"><h3>模型还没证明的事情</h3><p>项目与企业真实映射、细分物料、正式税费科目、外部竞争者的内生反应、实测企业退出与真实经济总产出核算。</p></div>'+
  '<p class="evidence">工程跑通是必要条件，但不是模型通过实证检验的充分条件。</p>')+'</div></div>';
}
function render(){
 if(!world)return;
 const m=marketOverview(),h=last();
 $("topQuarter").textContent=world.q>=28?"2032 · 完结":qLabel(world.q);
 $("topCredits").textContent=world.budget+" 点";$("topProgress").textContent=world.q+"/28";
 $("topAdvance").disabled=world.q>=28;
 $("liveCaption").textContent=fmt(m.active)+"家企业 · "+fmt(world.links.length)+"条关系 · "+world.projects.length+"宗项目 · "+(h?"本季实际交易"+fmt(m.edges)+"条":"等待首季结算");
 $("topScenario").textContent=scenario==="normal"?"正常波动":scenario==="supply"?"供应冲击":"需求走弱";
 document.querySelectorAll("#nav [data-view]").forEach(b=>b.classList.toggle("active",b.dataset.view===view));
 for(const k of Object.keys(titles))$("screen-"+k).classList.toggle("active",k===view);
 const screen=$("screen-"+view);
 screen.innerHTML={hub:renderHub,squad:renderSquad,scout:renderScout,tactics:renderTactics,season:renderSeason,office:renderOffice,lab:renderLab}[view]();
 const sc=$("scenarioSelector");if(sc)sc.value=scenario;
}
function save(){
 try{sessionStorage.setItem(STORE,JSON.stringify({schema:"boluo-manager-state/2",state:world,scenario,selectedFirm,watch,compareIds,selectedSector,queued}))}catch(e){console.warn("Cannot save V2 session",e)}
 // Keep backward compatibility with Classic V1 instead of splitting into two worlds.
 try{sessionStorage.setItem(OLD,JSON.stringify({schema:"boluo-world-session/1",state:world,scenario,firmId:selectedFirm}))}catch(e){}
}
function toast(s){const el=$("toast");el.textContent=s;el.hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.hidden=true,3100)}
function syncInputs(){const p=$("projectTarget");if(p)selectedProject=p.value}
function queueAction(type){
 if(queued.length>=3)return toast("一个季度最多安排3项行动");
 const target=type==="expedite"?(selectedProject||nextProjects()[0]?.id):type==="investigate"?"network":selectedFirm;
 if(!target)return toast("当前没有可协调的待投产项目");
 const a={type,target};
 if(queued.some(x=>x.type===a.type&&x.target===a.target))return toast("同一事项已在行动队列中");
 const spent=queued.reduce((s,x)=>s+actionCost[x.type],0)+actionCost[type];
 if(spent>world.budget)return toast("行动资源不足，不能下达这项指令");
 if(type==="expedite"&&!world.projects.some(p=>p.id===target&&!p.activated&&p.arrivalQ>=world.q))return toast("请选择未来尚未投产的项目");
 if((type==="skills"||type==="substitute")&&!findFirm(target))return toast("请先选择一家企业");
 queued.push(a);save();render();toast(actionName[type]+"已排入下一季度");
}
function execute(quarters){
 if(busy||world.q>=28)return;
 syncInputs();
 busy=true;$("topAdvance").disabled=true;
 const first=world.q;
 try{
  for(let i=0;i<quarters&&world.q<28;i++){
   const action=i===0?queued:[];
   world=W.step(world,action,externalAt(world.q));
  }
  queued=[];save();render();
  const h=last();toast("推进 "+(world.q-first)+" 个季度成功 · 账目 "+(h.balanced?"平衡":"异常")+" · 产出 "+fmt(h.grossProduction,0));
 }catch(e){toast("本次经营决策未能执行："+e.message);console.error(e)}
 finally{busy=false;$("topAdvance").disabled=world.q>=28}
}
function compareFour(){
 if(world.q>=28)return toast("赛季已经结束");
 const quarters=Math.min(4,28-world.q),q=world.q,policy={};if(queued.length)policy[q]=queued;
 const external={};for(let i=0;i<quarters;i++)external[q+i]=externalAt(q+i);
 try{
  const c=W.compare(world,quarters,policy,external);
  const el=$("comparisonBox");if(!el)return;
  el.innerHTML='<h3>相同条件 · '+quarters+'季度经营对照</h3>'+
   pairLine("终期样本产出变化",diff(c.delta.grossOutput,2),"百万元等值")+
   pairLine("样本增加值代理变化",diff(c.delta.valueAddedProxy,2),"百万元等值")+
   pairLine("订单缺口变化",diff(c.delta.unmetOrders,2),"百万元等值")+
   pairLine("样本企业现金变化",diff(c.delta.cash,2),"百万元等值")+
   '<p class="hint">同一随机种子与外部条件。没有模型保证每次干预都会提升产出，也不能据此认定政策现实效果。</p>';
  toast("四季度对照已完成，当前赛季进度未改变");
 }catch(e){toast("对照计算未完成："+e.message);console.error(e)}
}
function exportWorld(){
 const blob=new Blob([JSON.stringify({schema:"boluo-manager-export/2",model:W.VERSION,dataSnapshot:fingerprint,
    publicAnchors:publicData,world,scenario,watch,queue:queued},null,2)],{type:"application/json"});
 const link=document.createElement("a");link.href=URL.createObjectURL(blob);link.download="boluo-franchise-world-q"+world.q+".json";link.click();setTimeout(()=>URL.revokeObjectURL(link.href),1500);
}
function openDrawer(id){
 const f=findFirm(id);if(!f)return toast("未找到合成主体 "+id);
 selectedFirm=id;const r=rating(f),a=profile(f);
 $("drawerTitle").textContent=f.name;
 const count=world.links.filter(x=>x.buyer===id||x.supplier===id).length;
 $("drawerContent").innerHTML=
 '<div class="sectionrow" style="align-items:center;justify-content:space-between">'+avatars(f)+'<div class="ovr">'+Math.round(r.ovr)+'</div><div style="flex:1"><b>'+safe(f.id)+' · '+sectorName[f.sector]+'</b><div class="hint">'+safe(f.subsector)+' · '+safe(f.town)+'</div>'+badge("36项合成战术指标","gold")+'</div></div>'+
 '<div class="data-tiles">'+[["季度产能",fmt(f.capacity,1),"百万元等值"],["现金缓冲",fmt(f.cash,1),"百万元等值"],["订单积压",fmt(f.backlog,1),"模型状态"],["产业联系",count+"条","合成关系"]].map(t=>'<div class="tile"><small>'+t[0]+'</small><strong>'+t[1]+'</strong><em>'+t[2]+'</em></div>').join("")+'</div>'+
 '<hr><div class="paneltop"><h2>六大能力维度</h2>'+badge("V13参数衍生","gold")+'</div>'+
 a.groups.map((g,i)=>'<div class="attribute"><span>'+safe(g.name)+'</span><div class="metric"><b style="width:'+clamp(r.values[i])+'%"></b></div><strong>'+Math.round(r.values[i])+'</strong></div>').join("")+
 '<hr><div class="paneltop"><h2>完整36项战术档案</h2><span class="hint">可展开检查每一项</span></div>'+
 a.groups.map(g=>'<details class="report"><summary style="cursor:pointer;font-weight:700">'+safe(g.name)+' · 6项</summary>'+g.items.map(item=>'<div class="attribute"><span>'+safe(item.label)+'</span><div class="metric"><b style="width:'+clamp(item.value)+'%"></b></div><strong>'+Math.round(item.value)+'</strong></div>').join("")+'</details>').join("")+
 '<hr><div class="sectionrow"><button class="btn soft" data-do="watch" data-firm="'+id+'">'+(watch.includes(id)?"移出观察名单":"＋ 加入观察名单")+'</button><button class="btn" data-do="compare-add" data-firm="'+id+'">＋ 加入球探对照</button></div>'+
 '<div class="sectionrow" style="margin-top:8px"><button class="btn ghost" data-do="plan-skills" data-firm="'+id+'">下季支持技能</button><button class="btn ghost" data-do="plan-substitute" data-firm="'+id+'">下季供应备选</button></div>'+
 '<p class="evidence warn" style="margin-top:16px">企业本身、能力评分和36项分数均是开发合成设定。改善能力需要通过季度引擎里的资源与行为条件实现，不能直接修改评分。</p>';
 $("drawerOverlay").hidden=false;save();
}
function closeDrawer(){$("drawerOverlay").hidden=true}
function switchView(target){
 if(!titles[target])return;
 view=target;render();window.scrollTo({top:0,behavior:"auto"});
}
function onClick(e){
 const b=e.target.closest("[data-do],[data-view]");
 if(!b)return;
 if(b.hasAttribute("data-view"))return switchView(b.dataset.view);
 const id=b.dataset.firm;
 switch(b.dataset.do){
  case "advance":return execute(1);
  case "fast-forward":return execute(4);
  case "reset":return reset();
  case "queue":syncInputs();return queueAction(b.dataset.type);
  case "remove-action":queued.splice(+b.dataset.index,1);save();return render();
  case "open-firm":return openDrawer(id);
  case "close-drawer":return closeDrawer();
  case "sector":selectedSector=b.dataset.sector;return switchView("squad");
  case "watch":
   if(watch.includes(id))watch=watch.filter(x=>x!==id);
   else if(watch.length>=8)return toast("观察名单最多8家");
   else watch.push(id);
   save();openDrawer(id);return render();
  case "compare-add":
   if(compareIds.includes(id))return toast("该企业已在对照名单");
   compareIds=[...compareIds.slice(-1),id];save();closeDrawer();return switchView("scout");
  case "clear-compare":compareIds=[];save();return render();
  case "plan-skills":selectedFirm=id;closeDrawer();switchView("tactics");return queueAction("skills");
  case "plan-substitute":selectedFirm=id;closeDrawer();switchView("tactics");return queueAction("substitute");
  case "compare":return compareFour();
  case "apply-search":
   filters.query=$("scoutQuery")?.value.trim()||"";scoutPage=0;return render();
  case "scout-prev":scoutPage=Math.max(0,scoutPage-1);return render();
  case "scout-next":scoutPage++;return render();
  case "select-quarter":selectedQuarter=+b.dataset.quarter;return render();
  case "export":return exportWorld();
  case "lab-run":{
   const r=W.run(world,Math.min(28-world.q,28),{},{});
   const h=r.history.at(-1);
   labResult="独立执行完成：终期 "+safe(h?.label||"无")+"，合成样本产出 "+fmt(h?.grossProduction,1)+
     " 百万元等值，账目平衡 "+(h?.balanced?"通过":"未通过")+"。当前游戏存档没有改变。";
   return render();
  }
 }
}
function reset(){
 if(!confirm("重新开始28季度？已保存的当前赛季将被新的初始世界替代。"))return;
 world=initial;queued=[];selectedQuarter=0;watch=["I0236","I0087","A0001","S0001"];compareIds=["I0236","I0087"];selectedFirm="I0236";scenario="normal";labResult=null;
 save();switchView("hub");toast("新的产业赛季已创建");
}
function start(){
 const publicFY=publicData?.records?.find(x=>x.year===2025&&x.period==="FY");
 initial=W.createWorld(sample,{seed:20261120,projectDelayQuarters:4,affectedPct:50,
   publicBaseline:publicFY?{year:2025,gdp:publicFY.gdp,primary:publicFY.primary,secondary:publicFY.secondary,tertiary:publicFY.tertiary,source:publicFY.source}:null,
   dataFingerprint:fingerprint});
 let saved=null;try{saved=JSON.parse(sessionStorage.getItem(STORE)||"null")}catch(e){}
 if(saved?.schema==="boluo-manager-state/2"&&saved.state?.schema===W.VERSION&&saved.state.dataFingerprint===fingerprint&&saved.state.q>=0&&saved.state.q<=28){
  world=saved.state;scenario=saved.scenario||"normal";selectedFirm=findFirm? saved.selectedFirm||"I0236":"I0236";
  watch=Array.isArray(saved.watch)?saved.watch:watch;compareIds=Array.isArray(saved.compareIds)?saved.compareIds:compareIds;
  selectedSector=saved.selectedSector||"secondary";queued=Array.isArray(saved.queued)?saved.queued:[];
 }else {
  let old=null;try{old=JSON.parse(sessionStorage.getItem(OLD)||"null")}catch(e){}
  if(old?.schema==="boluo-world-session/1"&&old.state?.schema===W.VERSION&&old.state.dataFingerprint===fingerprint){
   world=old.state;scenario=old.scenario||"normal";selectedFirm=old.firmId||"I0236";
  }else world=initial;
 }
 if(!findFirm(selectedFirm))selectedFirm="I0236";
 selectedQuarter=Math.max(0,Math.min(27,world.q-1));
 document.addEventListener("click",onClick);
 $("topAdvance").addEventListener("click",()=>execute(1));
 $("topReset").addEventListener("click",reset);
 document.addEventListener("change",e=>{
  if(e.target.id==="projectTarget")selectedProject=e.target.value;
  if(e.target.id==="scoutSector"){filters.sector=e.target.value;scoutPage=0;render()}
  if(e.target.id==="scoutTown"){filters.town=e.target.value;scoutPage=0;render()}
  if(e.target.id==="scoutOrder"){filters.order=e.target.value;scoutPage=0;render()}
  if(e.target.id==="scenarioSelector"){scenario=e.target.value;save();render();toast("新外部情景将在后续季度生效，历史不会重算")}
 });
 document.addEventListener("keydown",e=>{
  if(e.key==="Escape")closeDrawer();
  if(e.key==="Enter"&&e.target.id==="scoutQuery"){filters.query=e.target.value.trim();scoutPage=0;render()}
 });
 $("drawerOverlay").addEventListener("click",e=>{if(e.target===$("drawerOverlay"))closeDrawer()});
 render();save();
}
fetch("../data/boluo-public-anchors-2026.v1.json")
 .then(r=>{if(!r.ok)throw Error("HTTP "+r.status);return r.json()})
 .then(x=>{publicData=x;start()})
 .catch(e=>{console.error(e);toast("公开数据加载异常；将仅运行合成世界");start()});
})();
