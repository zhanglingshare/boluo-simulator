
(function(){
'use strict';
const D=window.IndustryData,E=window.IndustryEngine,I=window.TeaIntelligence,stage=document.getElementById('stage');
if(!D||!E||!I){stage.innerHTML='<div class="empty">原有产业数据尚未加载。请刷新页面，或返回旧产业工作区。</div>';return}
const STORE='bl-industry-next-v1',RECORDS='bl-industry-next-records-v1';
const $=id=>document.getElementById(id);
const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cleanURL=v=>{try{const u=new URL(v,location.href);return ['https:','http:'].includes(u.protocol)?u.href:'#'}catch(e){return '#'}};
const fmt=n=>Math.round(n).toLocaleString('zh-CN');
const get=k=>{try{return JSON.parse(localStorage.getItem(k)||'null')}catch(e){return null}};
const set=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
const names={home:'进入产业',graph:'看关系',changes:'找变化',trial:'试条件',bridges:'可选连接',records:'我的记录'};
const navIcons={home:'⌂',graph:'◇',changes:'◷',trial:'⚗',bridges:'⌁',records:'▤'};
const topicKeys=['quality','market','travel'];
const topicTitles={quality:'品质与供货',market:'渠道与人才',travel:'茶旅与复购'};
const symbol={leaf:'❧',globe:'◇',factory:'▣',store:'▤',school:'⌂',shield:'◇',users:'♙',mountain:'△',tag:'◇',chip:'▦',bolt:'ϟ',sprout:'❧',truck:'▱',box:'⬡',link:'⌁'};
const init={view:'home',sector:'tea',topic:'quality',node:'t-buyer',params:Object.assign({},E.DEFAULTS),bridge:'none',candidate:'packaging',checks:{},selectedEvent:'',observations:{sample:'unknown',supply:'unknown',repeat:'unknown'}};
let state=Object.assign({},init,get(STORE)||{});state.params=E.clean(state.params);state.checks=state.checks||{};
if(!D.industries.some(x=>x.id===state.sector))state.sector='tea';
if(!topicKeys.includes(state.topic))state.topic='quality';
if(!names[state.view])state.view='home';
let records=get(RECORDS);if(!Array.isArray(records))records=[];records=records.slice(0,30);
let registry=Object.assign({},D.fallback),dataStatus='已有资料快照';
const query=new URLSearchParams(location.search);
if(names[query.get('view')])state.view=query.get('view');
if(D.industries.some(x=>x.id===query.get('sector')))state.sector=query.get('sector');
if(topicKeys.includes(query.get('topic')))state.topic=query.get('topic');
if(query.get('node'))state.node=query.get('node').slice(0,80);
if(E.BRIDGES[query.get('bridge')])state.bridge=query.get('bridge');
if(Number.isFinite(+query.get('demand'))&&query.has('demand'))state.params=E.clean(Object.assign({},state.params,{demand:+query.get('demand')}));
const current=()=>D.industries.find(s=>s.id===state.sector)||D.industries[0];
const hypothesis=()=>I.hypotheses.find(h=>h.id===state.topic)||I.hypotheses[0];
const selectedCandidate=()=>D.candidates.find(c=>c.id===state.candidate)||D.candidates[0];
function persist(){set(STORE,state)}
function toast(s){const el=$('toast');el.textContent=s;el.hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.hidden=true,3000)}
function showModal(title,html){$('modalTitle').textContent=title;$('modalBody').innerHTML='<div class="modal-content">'+html+'</div>';$('detailModal').showModal()}
$('modalClose').onclick=()=>$('detailModal').close();
$('detailModal').addEventListener('click',e=>{if(e.target===$('detailModal'))$('detailModal').close()});
function linkSource(id){const s=I.sources.find(x=>x.id===id)||registry.sources.find(x=>x.source_id===id);return s?'<a target="_blank" rel="noopener noreferrer" href="'+esc(cleanURL(s.url))+'">'+esc(s.title)+' ↗</a><span class="muted small"> · '+esc(s.publisher)+' · '+esc(s.published_at||'日期未注明')+'</span>':''}
function openSource(id){const s=I.sources.find(x=>x.id===id)||registry.sources.find(x=>x.source_id===id);if(!s)return toast('此来源暂未取得');showModal('原始资料 · '+id,'<h3>'+esc(s.title)+'</h3><p>'+esc(s.publisher)+' · '+esc(s.published_at||'日期未注明')+'</p><p><b>资料范围：</b>'+esc(s.kind||'公开资料')+'</p><p><b>需要注意：</b>'+esc(s.limits||'请核对原文、时间和适用范围。')+'</p><p><a target="_blank" rel="noopener noreferrer" href="'+esc(cleanURL(s.url))+'">核对来源 ↗</a></p>')}
function nav(){document.querySelectorAll('[data-view]').forEach(b=>{if(b.closest('#stage'))return;b.classList.toggle('active',b.dataset.view===state.view)});
$('mobileNav').innerHTML=['home','graph','changes','trial','bridges'].map(k=>'<button data-view="'+k+'" class="'+(state.view===k?'active':'')+'"><span>'+navIcons[k]+'</span>'+names[k]+'</button>').join('');
$('crumbLabel').textContent='博罗 / '+current().title+' / '+(state.sector==='tea'?'柏塘山茶':'产业关系');
$('statusText').textContent=state.sector==='tea'?'公开检索 '+I.snapshot_at:dataStatus}
function goto(view,scroll=true){if(!names[view])return;state.view=view;persist();render();if(scroll){window.scrollTo({top:0,behavior:'instant'});stage.focus({preventScroll:true})}}
function sector(id,view='graph'){if(!D.industries.some(x=>x.id===id))return;state.sector=id;state.node=id==='tea'?hypothesis().node:'';state.selectedEvent='';persist();goto(view)}
function heading(n,title,sub){return '<div class="page-heading"><div class="eyebrow">'+n+' / '+esc(current().title)+' · 产业工作区</div><h1>'+esc(title)+'</h1><p>'+esc(sub)+'</p></div>'}
function statePill(){return '<span class="inline-tag">◈ '+esc(current().title)+'　｜　'+(state.sector==='tea'?'公开情报快照 '+esc(I.snapshot_at):esc(dataStatus))+'</span>'}
function currentSourceIds(){return state.sector==='tea'?hypothesis().basis.flatMap(b=>b.sources):[]}
function renderHome(){
const tiles=D.industries.map(s=>'<button data-sector-preview="'+esc(s.id)+'" class="industry-tile '+esc(s.class)+' '+(state.sector===s.id?'active':'')+'" aria-pressed="'+(state.sector===s.id)+'"><div><div class="tile-icon">'+(symbol[s.icon]||'◇')+'</div><strong>'+esc(s.title)+'</strong><small>'+esc(s.subtitle)+'</small></div><span class="tile-arrow">→</span></button>').join('');
const c=current();
const flowLabels={tea:['茶园','加工','品牌','渠道','消费者'],electronics:['材料','制造','配套','通道','客户'],energy:['项目','储能','电网','交付','应用'],tourism:['景区','停留','住宿','服务','回访'],agriculture:['种植','加工','品牌','渠道','消费']}[c.id]||['主体','生产','服务','渠道','用户'];
const chain='<svg class="hero-chain" viewBox="0 0 660 245" role="img" aria-label="所选行业的生产、服务和市场关系示意"><defs><filter id="hg"><feGaussianBlur stdDeviation="6"/></filter></defs><path class="hero-link" d="M73 130C130 130 130 105 178 105S270 130 316 130S415 100 456 100S530 130 584 130" fill="none"/>'+flowLabels.map((label,i)=>[label,[71,198,326,455,584][i],[130,105,130,100,130][i]]).map(x=>'<g><circle cx="'+x[1]+'" cy="'+x[2]+'" r="37"/><text x="'+x[1]+'" y="'+(x[2]+6)+'" text-anchor="middle">'+x[0]+'</text></g>').join('')+'</svg>';
return heading('01','你想进入博罗的哪门产业？','先从一门生意进去，再看谁与谁有关，哪里可能发生改变。')+'<div class="home-grid"><div class="home-left">'+tiles+'</div><section class="home-showcase sector-'+esc(c.id)+'"><div class="eyebrow">LIVE INDUSTRY EXPLORATION · '+esc(c.title)+'</div><h2>'+esc(c.question)+'</h2><p>'+esc(c.note)+'</p>'+chain+'<div class="hero-actions"><button class="secondary" data-topic="quality" data-view="changes">谁把变化连接起来？　↗</button><button class="secondary" data-view="graph">进入关系世界　↗</button></div><button class="primary" data-action="enter">进入'+esc(c.title)+'工作区　 →</button><div class="hero-bottom"><div class="eyebrow">也可以从一个具体问题进入</div><div class="home-quick"><button data-view="changes" data-topic="quality">订单来了，谁能接住？ ↗</button><button data-view="changes" data-topic="market">合作与课程，有什么后续？ ↗</button><button data-view="changes" data-topic="travel">茶旅能留下回头客吗？ ↗</button></div></div></section></div><div class="panel" style="padding:17px;margin-top:14px"><span class="jade">◉ 真实主体与证据</span>　<span class="muted">新建的关联和订单试验均有独立标识；没有完整数据的行业只展示已有关系，不制造业务预测。</span>　<button class="quiet" data-action="all-sources">查看柏塘茶情报依据 ↗</button></div>';
}
function graphData(){
if(state.sector==='tea')return I.graph(state.topic);
const nodes=registry.nodes.filter(n=>current().nodes.includes(n.node_id)).map((n,i,a)=>{const angle=-Math.PI/2+i*2*Math.PI/a.length,r=220;return {id:n.node_id,name:n.name,short:n.name.length>9?n.name.slice(0,9)+'…':n.name,sub:n.town||n.layer||'',icon:n.node_type==='external'?'globe':'factory',kind:'已登记主体',detail:n.description,unknown:'关联及现实意义需核对原来源与最新资料',sources:n.source_ids||[],x:570+Math.cos(angle)*r*1.55,y:300+Math.sin(angle)*r}});
const ids=new Set(nodes.map(n=>n.id)),edges=registry.edges.filter(e=>ids.has(e.source_node_id)&&ids.has(e.target_node_id)).map(e=>({id:e.edge_id,from:e.source_node_id,to:e.target_node_id,label:e.relation_description,status:e.evidence_grade==='A'?'observed':'reported',sources:e.source_ids||[]}));
return {nodes,edges};
}
function svgGraph(){
const g=graphData(),ids=new Set([state.node]);g.edges.filter(e=>e.from===state.node||e.to===state.node).forEach(e=>{ids.add(e.from);ids.add(e.to)});
if(!g.nodes.length)return '<div class="empty"><strong>公开关系还不完整</strong>此行业当前没有足够数据建立具体网络。<br><button class="secondary" data-action="sources-registry">查看原版资料</button></div>';
const edges=g.edges.map(e=>{
 const a=g.nodes.find(n=>n.id===e.from),b=g.nodes.find(n=>n.id===e.to);if(!a||!b)return '';
 const dx=b.x-a.x,dy=b.y-a.y,len=Math.max(1,Math.hypot(dx,dy)),ox=dx/len*39,oy=dy/len*39;
 const x1=a.x+ox,y1=a.y+oy,x2=b.x-ox,y2=b.y-oy;
 const status=e.status||'hypothesis',active=state.node&&(e.from===state.node||e.to===state.node);
 return '<path class="network-edge '+esc(status)+' '+(active?'active':'dim')+'" d="M'+x1.toFixed(1)+' '+y1.toFixed(1)+' Q'+((x1+x2)/2).toFixed(1)+' '+(((y1+y2)/2)-18).toFixed(1)+' '+x2.toFixed(1)+' '+y2.toFixed(1)+'"><title>'+esc(e.label||'关联')+' · '+esc(status)+'</title></path>';
}).join('');
const nodes=g.nodes.map(n=>'<g class="network-node '+(state.node===n.id?'active':(state.node&&!ids.has(n.id)?'dim':''))+'" data-node="'+esc(n.id)+'" transform="translate('+n.x+','+n.y+')" tabindex="0" role="button" aria-label="查看'+esc(n.name)+'"><circle class="halo" r="53"/><circle class="glow" r="44"/><circle class="shell" r="34"/><text class="symbol" y="8">'+esc(symbol[n.icon]||'◇')+'</text><text class="caption" y="59">'+esc(n.short||n.name.slice(0,11))+'</text><text class="subcaption" y="77">'+esc(n.sub||'')+'</text></g>').join('');
return '<svg viewBox="0 0 1160 605" role="img" aria-label="可点击的产业关系网络"><defs><radialGradient id="greenFog"><stop stop-color="#48755b" stop-opacity=".25"/><stop offset="1" stop-color="#48755b" stop-opacity="0"/></radialGradient></defs><ellipse class="network-bg-ring" cx="235" cy="305" rx="220" ry="240"/><ellipse class="network-bg-ring" cx="580" cy="305" rx="230" ry="255"/><ellipse class="network-bg-ring" cx="940" cy="305" rx="208" ry="230"/>'+edges+nodes+'</svg>';
}
function inspector(){
const g=graphData();const n=g.nodes.find(x=>x.id===state.node)||g.nodes[0];if(!n)return '<div class="panel inspector">尚无可选主体。</div>';
const links=g.edges.filter(e=>e.from===n.id||e.to===n.id);
const sources=n.sources||[];
return '<aside class="panel inspector"><span class="sticker '+(n.gap?'gold':'')+'">'+esc(n.gap?'待核角色':n.kind||'公开主体')+'</span><h2>'+esc(n.name)+'</h2><p class="description">'+esc(n.detail||'可以沿公开资料继续追踪此主体与其他节点的关系。')+'</p><div class="info"><label>沿着它，你可以继续追问</label><p>'+esc(n.unknown||n.question||'这条关系是否持续，现实影响是什么？')+'</p></div><div class="info"><label>与当前主体相关的联系</label><p>'+links.length+' 条 · '+links.filter(e=>e.status==='hypothesis').length+' 条待验证的假设连接</p></div><button class="primary" data-view="changes">沿证据找关键　 →</button><button class="secondary" data-view="bridges">看看可能的连接　 →</button><div class="divider"></div><div class="eyebrow">依据与局限</div><div class="source-links">'+(sources.length?sources.slice(0,5).map(id=>'<a href="#" data-source="'+esc(id)+'">'+esc(id)+'　查看原资料 ↗</a>').join(''):'<p class="muted small">还没有具体来源编号，需要继续核实。</p>')+'</div></aside>';
}
function tabs(){return '<div class="topic-tabs">'+topicKeys.map(k=>'<button class="'+(state.topic===k?'active':'')+'" data-topic="'+k+'">'+esc(topicTitles[k])+'</button>').join('')+'</div>'}
function renderGraph(){if(state.sector==='tea'){const g=graphData();if(!g.nodes.some(n=>n.id===state.node))state.node=hypothesis().node}
return heading('02','看得见的联系，与还没有接上的桥','已记录的关系和待验证的连接分开画。点一个主体，相关路径会亮起。')+statePill()+ (state.sector==='tea'?'<div style="margin-top:16px">'+tabs()+'</div>':'<div style="height:15px"></div>')+'<div class="graph-layout"><div><section class="graph-shell"><div class="graph-toolbar"><div><strong>'+esc(current().title)+'关系世界</strong><br><small>点击主体 · 高亮关联 · 探索证据</small></div><button class="secondary" data-view="changes">查看关键变化 ↗</button></div><div class="graph-canvas" id="graphCanvas">'+svgGraph()+'</div><div class="graph-bottom"><div class="legend"><span>公开记录或报道</span><span class="possible">尚待核实的假设</span></div><span class="muted small">关系并不等于交易或收益</span></div></section><section class="panel" style="padding:18px;margin-top:13px"><div class="eyebrow">这条关系正在回答什么？</div><div class="panel-title">'+esc(state.sector==='tea'?hypothesis().title:current().question)+'</div><div class="buttons" style="margin-top:15px"><button class="primary" data-view="changes">沿线索继续寻找　 →</button><button class="secondary" data-action="save">保存当前关系</button></div></section></div>'+inspector()+'</div>';
}
function references(ids){return [...new Set(ids)].map(id=>'<button class="quiet" data-source="'+esc(id)+'">'+esc(id)+' ↗</button>').join('')}
function hypothesisCard(h){return '<div class="finding-card"><strong>什么信息会改变这个判断？</strong><p>'+esc(h.falsifier)+'</p></div><div class="finding-card"><strong>还可能有别的解释</strong><ul>'+h.alternatives.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul></div>'}
function renderChanges(){
if(state.sector!=='tea'){
const ids=new Set(current().nodes),events=registry.changes.filter(e=>(e.involved_node_ids||[]).some(id=>ids.has(id))),selected=events.find(x=>x.change_id===state.selectedEvent)||events[0];
return heading('03','这门产业，最近有哪些值得追的变化？','先区分已登记事件与尚待验证的业务影响。')+'<div class="changes-grid"><aside class="panel event-list">'+(events.map(e=>'<button class="'+(selected===e?'active':'')+'" data-event="'+esc(e.change_id)+'"><small>'+esc(e.event_date||'日期待查')+'</small><b>'+esc(e.title)+'</b></button>').join('')||'<p class="muted">目前没有已登记的对应行业事件。</p>')+'</aside><article class="panel evidence-panel">'+(selected?'<div class="eyebrow">原项目事件记录</div><h2>'+esc(selected.title)+'</h2><p>'+esc(selected.before_after||'')+'</p><div class="note-box"><b>尚需核对</b><p>'+esc(selected.uncertainty||'影响路径需要进一步核实')+'</p></div><div class="buttons"><button class="primary" data-view="graph">查看主体关系 →</button><button class="secondary" data-action="save">保存线索</button></div>':'<h2>不能用其他行业的新闻冒充这门产业的变化</h2><p>请沿已登记主体继续探索，或进入原版全县资料。</p><a class="secondary" href="../network.html">全县关系原版 ↗</a>')+'</article></div>';
}
const h=hypothesis();
return heading('03','碎片连起来，哪里可能藏着关键？','不是先认定结论。让公开记录、竞争解释和新证据一起决定下一步。')+tabs()+'<div class="changes-grid"><aside class="panel event-list">'+I.hypotheses.map(q=>'<button data-topic="'+esc(q.id)+'" class="'+(state.topic===q.id?'active':'')+'"><small>'+esc(q.tag)+'</small><b>'+esc(q.short)+'</b><small>公开资料 → 尚待验证的研判</small></button>').join('')+'</aside><article class="panel evidence-panel"><span class="sticker gold">'+esc(h.tag)+' · 研判假设</span><h2>'+esc(h.title)+'</h2><p>'+esc(h.inference)+'</p><div class="note-box"><b>为什么值得追问</b><p>'+esc(h.summary)+'</p></div><div class="eyebrow" style="margin-top:22px">由哪些真实记录引出</div><div class="basis">'+h.basis.map((b,i)=>'<div class="basis-card"><b>证据碎片 0'+(i+1)+'</b><p>'+esc(b.text)+'</p>'+references(b.sources)+'</div>').join('')+'</div>'+hypothesisCard(h)+'<div class="buttons" style="margin-top:20px"><button class="primary" data-view="graph">在关系世界里查看 →</button><button class="secondary" data-view="trial">改一个条件试试 ↗</button><button class="secondary" data-action="save">保存这次研判</button></div><div class="divider"></div><p class="small">公开检索快照 '+esc(I.snapshot_at)+' · 同源转载不重复算独立证据；未查到的数据不能视为不存在。</p></article></div>';
}
function slider(key,label,min,max,step,unit){return '<div class="control-row"><label for="range-'+key+'">'+esc(label)+'<strong id="value-'+key+'">'+fmt(state.params[key])+esc(unit)+'</strong></label><input id="range-'+key+'" type="range" min="'+min+'" max="'+max+'" step="'+step+'" value="'+state.params[key]+'" data-param="'+key+'"></div>'}
function miniFlow(run,caption){
const c=run.capacities,d=run.params.demand,nom=run.nominal;
const points=[{x:155,y:37,k:'demand',name:'订单',v:d},{x:55,y:125,k:'processing',name:'加工',v:c.processing},{x:255,y:125,k:'packing',name:'包装',v:c.packing},{x:155,y:215,k:'shipping',name:'发货',v:c.shipping}];
const paths=[[0,1],[1,2],[2,3]].map(([a,b])=>'<path class="f-edge '+(run.bottleneck===points[b].k?'bad':'')+'" d="M'+points[a].x+' '+points[a].y+' L'+points[b].x+' '+points[b].y+'"/>').join('');
return '<div class="flow-scene"><h3>'+esc(caption)+'</h3><svg viewBox="0 0 310 270" role="img" aria-label="条件下的订单到加工、包装、发货的承接路径">'+paths+points.map(p=>'<g><circle class="f-circle '+(p.k===run.bottleneck?'bad':'')+'" cx="'+p.x+'" cy="'+p.y+'" r="38"/><text class="f-big" x="'+p.x+'" y="'+(p.y-3)+'">'+p.name+'</text><text x="'+p.x+'" y="'+(p.y+14)+'">'+fmt(p.v)+'</text></g>').join('')+'<text x="155" y="265">'+(run.bottleneck?'承压点：'+esc(run.bottleneckLabel):'条件下可承接')+'</text></svg></div>';
}
function calcTrial(){return {base:E.run(E.DEFAULTS,'none'),current:E.run(state.params,state.bridge)}}
function renderTrial(){
if(state.sector!=='tea')return heading('04','不同产业，需要不同的试验条件','这里暂不借用茶产业的订单模型给其他行业计算结果。')+'<div class="empty"><strong>该行业的数值试验尚未建立</strong>现有公开主体与事件仍可浏览；需要先明确行业约束和可核实的数据。<br><br><button class="secondary" data-view="graph">返回行业关系</button>　<a class="secondary" href="../windtunnel.html">进入全县原版风洞 ↗</a></div>';
const {base,current:r}=calcTrial();
return heading('04','订单多了，交付一定跟得上吗？','订单、加工、包装、交付同时放进一个受控试验。看压力落在哪里，再试有没有别的路径。')+statePill()+'<div class="trial-grid" style="margin-top:16px"><aside class="panel control-panel"><h2>只改这些条件</h2><p class="muted small">每一项都是可替换假设，不代表任何茶企实际经营。</p>'+slider('demand','每期假设订单',60,180,5,'份')+slider('processing','加工承接',75,175,5,'份')+slider('packing','包装承接',75,175,5,'份')+slider('shipping','发货承接',75,175,5,'份')+'<div class="control-row"><div class="small muted">可选支持（每期假设增补30份）</div><div class="mini-options">'+Object.keys(E.BRIDGES).map(k=>'<button class="'+(state.bridge===k?'active':'')+'" data-bridge="'+k+'">'+esc(E.BRIDGES[k].label)+'</button>').join('')+'</div></div><button class="secondary" data-action="reset" style="width:100%">↶ 恢复原有假设</button></aside><section class="panel compare-panel"><div class="eyebrow">BEFORE & AFTER</div><h2>哪一环可能先卡住？</h2><div class="flow-compare" id="flowCompare">'+miniFlow(base,'原有条件')+miniFlow(r,'你选择的条件')+'</div><div class="bars" id="capacityBars"></div><p class="small muted" style="margin-top:12px">节点亮起不代表真实企业出现问题，只表示在当前假设下，该环节的容量约束更紧。</p></section><aside class="panel result-panel" id="trialResult"><div class="result-item"><div class="eyebrow">模拟完成交付的占比 · 中位</div><div id="resultShare" class="stat-large">'+r.delivery.middle.toFixed(0)+'%</div><p id="resultBand">条件波动下的区间 '+r.delivery.low.toFixed(0)+'%–'+r.delivery.high.toFixed(0)+'%</p></div><div class="result-item"><div class="stat-label">期末等待中的订单</div><strong id="resultBacklog">'+fmt(r.backlog.middle)+' 份</strong><p>包含尚在加工、包装和发货排队的订单</p></div><div class="result-item"><div class="stat-label">当前最紧的一环</div><strong id="resultBottleneck">'+esc(r.bottleneckLabel)+'</strong><p>这不是已拟合的经营预测</p></div><div class="buttons" style="margin-top:15px"><button class="primary" data-view="bridges">看看可选支持 →</button><button class="secondary" data-action="save">保存情景</button></div></aside></div><div class="panel" style="padding:18px;margin-top:13px"><strong class="gold">还可以怎样验证？</strong><p class="muted">找一位真实买方、一份验收规格和连续交付记录，才有可能把模拟假设逐步收紧。模拟不宣称已有订单、产能或真实成交。</p></div>';
}
function updateTrial(){
if(state.view!=='trial'||state.sector!=='tea')return;
const {base,current:r}=calcTrial();
['demand','processing','packing','shipping'].forEach(k=>{const v=$('value-'+k);if(v)v.textContent=fmt(state.params[k])+'份'});
$('flowCompare').innerHTML=miniFlow(base,'原有条件')+miniFlow(r,'你选择的条件');
const bars=[['加工',r.capacities.processing],['包装',r.capacities.packing],['发货',r.capacities.shipping]];
$('capacityBars').innerHTML=bars.map(([name,cap])=>'<div class="barline"><span>'+name+'</span><div class="bartrack"><span class="'+(state.params.demand>cap?'bad':'')+'" style="width:'+Math.min(100,state.params.demand/cap*100)+'%"></span></div><span>'+fmt(cap)+'份</span></div>').join('');
$('resultShare').textContent=r.delivery.middle.toFixed(0)+'%';
$('resultBand').textContent='条件波动下的区间 '+r.delivery.low.toFixed(0)+'%–'+r.delivery.high.toFixed(0)+'%';
$('resultBacklog').textContent=fmt(r.backlog.middle)+' 份';
$('resultBottleneck').textContent=r.bottleneckLabel;
}
function bridgeSVG(){return '<svg viewBox="0 0 590 255" role="img" aria-label="从已观察到的缺口，通过待核支持连接到可能的交付环节"><path class="link" d="M122 125 C171 125 179 125 223 125"/><path class="link potential" d="M360 125 C402 125 417 125 465 125"/><circle cx="89" cy="125" r="62"/><circle class="potential" cx="292" cy="125" r="67"/><circle cx="504" cy="125" r="62"/><text x="89" y="122">待核缺口</text><text x="89" y="144" font-size="11">'+esc(selectedCandidate().id==='packaging'?'包装承接':'相关产能')+'</text><text x="292" y="120">'+esc(selectedCandidate().name.slice(0,7))+'</text><text x="292" y="144" font-size="11">潜在支持</text><text x="504" y="122">可选路径</text><text x="504" y="144" font-size="11">先验证再决定</text></svg>'}
function renderBridges(){
if(state.sector!=='tea')return heading('05','寻找尚未看见的连接','这里只展示有公开资料支撑的潜在线索；具体主体能力不能靠想象填充。')+'<div class="empty"><strong>当前缺少可核实的行业匹配资料</strong>先选择主体、查明需求和承接能力，再讨论是否存在值得连接的桥。<br><button class="secondary" data-view="graph">回到关系图</button></div>';
const candidate=selectedCandidate(),h=hypothesis(),comp=E.compare(state.params,candidate.id);
return heading('05','包装这一环，谁可能接得上？','不是系统替你找合作方，而是把潜在连接、证据缺口与不同安排放在一张图上。')+statePill()+'<div class="bridges-grid" style="margin-top:16px"><section class="panel bridge-left"><div class="eyebrow">01 / 当前值得追的缺口</div><div class="bridge-destination"><strong>'+esc(h.short)+'</strong><p>'+esc(h.summary)+'</p></div><div class="eyebrow">来自公开资料的延伸问题</div><p class="muted small">'+esc(h.inference)+'</p><div class="divider"></div><div class="eyebrow">02 / 选择一条可能路径</div>'+D.candidates.map(c=>'<button class="bridge-option '+(state.candidate===c.id?'active':'')+'" data-candidate="'+esc(c.id)+'"><strong>'+esc(c.name)+'</strong><small>'+esc(c.line)+'</small></button>').join('')+'</section><section class="panel bridge-center"><div class="eyebrow">POTENTIAL BRIDGE · NOT A CONFIRMED COOPERATION</div><div class="panel-title">从一个缺口，发现几种可能的连接</div><div class="bridge-route">'+bridgeSVG()+'</div><div class="note-box"><b>为什么可能相关？</b><p>'+esc(candidate.why)+'</p></div><div class="finding-card"><strong>如果假设增加对应承接能力，会怎样？</strong><p>同一组订单条件下：未增补时完成交付中位 '+comp.current.delivery.middle.toFixed(0)+'% → 假设增补后 '+comp.connected.delivery.middle.toFixed(0)+'%；等待订单中位 '+fmt(comp.current.backlog.middle)+' → '+fmt(comp.connected.backlog.middle)+' 份。</p><p class="small muted">这只是对假设支持的对照，不能证明任何候选方具有相关产能，也不代表合作已经存在。</p></div><div class="buttons"><button class="primary" data-action="apply-candidate">把这条支持放进风洞 →</button><button class="secondary" data-action="save">保存潜在连接</button></div></section><aside class="panel bridge-right"><div class="eyebrow">03 / 还需要核实</div><div class="panel-title">先把这些事问清楚</div>'+candidate.checks.map((q,i)=>'<label class="check-row"><input type="checkbox" data-check="'+esc(candidate.id)+'-'+i+'" '+(state.checks[candidate.id+'-'+i]?'checked':'')+'><span>'+esc(q)+'</span></label>').join('')+'<p class="small muted" style="margin:15px 0">勾选仅代表你记录了核实进度，不代表系统已经确认真实主体或合作。</p><div class="divider"></div><div class="eyebrow">这一判断的相关资料</div><div class="source-list">'+[...new Set(currentSourceIds())].map(id=>'<a href="#" data-source="'+esc(id)+'">'+esc(id)+'　'+esc((I.sources.find(s=>s.id===id)||{}).title||'查看资料')+' ↗</a>').join('')+'</div></aside></div>';
}
function renderRecords(){
return heading('06','把值得继续追的事情留下来','保存自己关注的产业、主体、情景和验证进度。信息只留在当前浏览器中。')+'<div class="records-grid"><div>'+ (records.length?records.map((r,i)=>'<article class="panel record-card"><div class="eyebrow">'+esc(r.date||'本地记录')+'</div><h3>'+esc(r.title)+'</h3><small>'+esc(r.note)+'</small><div class="record-actions"><button class="primary" data-restore="'+i+'">恢复探索</button><button class="secondary" data-remove="'+i+'">删除记录</button></div></article>').join(''):'<div class="empty"><strong>还没有保存过探索</strong>当你发现一条值得追的关系，保存它，下次可以从这里继续。</div>')+'</div><aside class="panel inspector"><div class="eyebrow">我的工作区</div><h2>连续积累自己的判断</h2><p class="description">不用重新打开每一条线。保存的只是个人探索快照，不会改写原版公开数据。</p><button class="primary" data-action="save">保存当前探索</button><button class="secondary" data-action="export">导出全部记录</button><div class="divider"></div><p class="muted small">记录存于本设备浏览器，清除网站数据会使记录消失。可导出JSON自行留存，不上传到服务器。</p></aside></div>';
}
function render(){nav();stage.innerHTML=({home:renderHome,graph:renderGraph,changes:renderChanges,trial:renderTrial,bridges:renderBridges,records:renderRecords})[state.view]();if(state.view==='trial')updateTrial();persist()}
function record(){const title=state.sector==='tea'?(state.view==='trial'?'订单与交付情景':hypothesis().short):current().title+'关系探索';const entry={id:Date.now().toString(36),date:new Date().toLocaleString('zh-CN'),title, note:current().title+' · '+names[state.view]+' · 个人观察快照',state:JSON.parse(JSON.stringify(state))};records.unshift(entry);records=records.slice(0,30);set(RECORDS,records);toast('已保存在此浏览器');if(state.view==='records')render()}
function share(){const p=new URLSearchParams({view:state.view,sector:state.sector,topic:state.topic,node:state.node||'',bridge:state.bridge,demand:state.params.demand});const url=location.origin+location.pathname+'?'+p.toString();const text='我在博罗产业风洞发现一条值得继续追的线索。';if(navigator.share)navigator.share({title:'博罗产业风洞 · 关系发现',text,url}).catch(()=>{});else if(navigator.clipboard)navigator.clipboard.writeText(text+'\n'+url).then(()=>toast('分享链接已复制')).catch(()=>prompt('复制链接',url));else prompt('复制链接',url)}
function action(name){
if(name==='enter')return goto('graph');
if(name==='reset'){state.params=Object.assign({},E.DEFAULTS);state.bridge='none';return render()}
if(name==='apply-candidate'){state.bridge=state.candidate;return goto('trial')}
if(name==='save')return record();
if(name==='export'){const blob=new Blob([JSON.stringify({version:1,exported_at:new Date().toISOString(),records},null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='boluo-industry-records.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),5000);return}
if(name==='all-sources')return showModal('柏塘茶产业 · 原始资料目录','<p>检索快照 '+esc(I.snapshot_at)+'。具体商业能力、真实订单与合作关系需另行核实。</p><div class="source-list">'+I.sources.map(s=>'<div>'+linkSource(s.id)+'</div>').join('')+'</div>');
if(name==='sources-registry')return location.assign('../network.html');
}
document.addEventListener('click',e=>{
const el=e.target.closest('[data-view],[data-topic],[data-node],[data-sector-preview],[data-action],[data-source],[data-bridge],[data-candidate],[data-event],[data-restore],[data-remove]');
if(!el)return;
if(el.tagName==='A')e.preventDefault();
if(el.dataset.source)return openSource(el.dataset.source);
if(el.dataset.restore!==undefined){const x=records[+el.dataset.restore];if(x){state=Object.assign({},init,x.state);state.params=E.clean(state.params);state.checks=state.checks||{};toast('已恢复探索快照');return render()}return}
if(el.dataset.remove!==undefined){records.splice(+el.dataset.remove,1);set(RECORDS,records);return render()}
if(el.dataset.action)return action(el.dataset.action);
if(el.dataset.sectorPreview)return sector(el.dataset.sectorPreview,'home');
if(el.dataset.topic){state.topic=el.dataset.topic;state.node=hypothesis().node;if(el.dataset.view)return goto(el.dataset.view);return render()}
if(el.dataset.node){state.node=el.dataset.node;return render()}
if(el.dataset.bridge){state.bridge=el.dataset.bridge;return render()}
if(el.dataset.candidate){state.candidate=el.dataset.candidate;return render()}
if(el.dataset.event){state.selectedEvent=el.dataset.event;return render()}
if(el.dataset.view)return goto(el.dataset.view);
});
document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('[data-node]')){e.preventDefault();state.node=e.target.dataset.node;render()}});
document.addEventListener('input',e=>{const k=e.target.dataset.param;if(!k)return;state.params=E.clean(Object.assign({},state.params,{[k]:Number(e.target.value)}));updateTrial();persist()});
document.addEventListener('change',e=>{if(e.target.dataset.check!==undefined){state.checks[e.target.dataset.check]=e.target.checked;persist()}});
$('industryPicker').addEventListener('click',()=>goto('home'));
$('shareButton').addEventListener('click',share);
$('searchInput').addEventListener('input',()=>{
const q=$('searchInput').value.trim().toLowerCase(),res=$('searchResults');if(!q){res.hidden=true;return}
const matches=D.industries.filter(i=>i.title.includes(q)||i.subtitle.includes(q)).map(i=>({label:i.title,kind:'产业',id:i.id}));
I.entities.filter(n=>n.name.toLowerCase().includes(q)||n.sub.toLowerCase().includes(q)).slice(0,7).forEach(n=>matches.push({label:n.name,kind:'主体',id:n.id}));
res.innerHTML=matches.length?matches.slice(0,9).map((m,i)=>'<button data-search="'+i+'">'+esc(m.kind)+' · '+esc(m.label)+'</button>').join(''):'<div class="muted small" style="padding:12px">尚未找到可核实的关联主体</div>';
res.hidden=false;res.onclick=e=>{const b=e.target.closest('[data-search]');if(!b)return;const m=matches[+b.dataset.search];if(!m)return;res.hidden=true;$('searchInput').value='';if(m.kind==='产业')sector(m.id,'graph');else{state.sector='tea';const topic=topicKeys.find(k=>I.graph(k).nodes.some(n=>n.id===m.id));if(topic)state.topic=topic;state.node=m.id;goto('graph')}};
});
async function connect(){
try{
const paths=['../data/relationship-evidence-v1.json','../data/relationship-sources-v1.json','../data/relationship-changes-v1.json'];
const rs=await Promise.allSettled(paths.map(p=>fetch(p,{cache:'no-store'}).then(x=>{if(!x.ok)throw Error(x.status);return x.json()})));
if(rs[0].status==='fulfilled'&&Array.isArray(rs[0].value.nodes)&&Array.isArray(rs[0].value.edges)){registry.nodes=rs[0].value.nodes;registry.edges=rs[0].value.edges;registry.generated_at=rs[0].value.generated_at}
if(rs[1].status==='fulfilled'&&Array.isArray(rs[1].value.sources))registry.sources=rs[1].value.sources;
if(rs[2].status==='fulfilled'&&Array.isArray(rs[2].value.changes))registry.changes=rs[2].value.changes;
dataStatus=rs.every(r=>r.status==='fulfilled')?'已连接原版关系库':'部分资料使用历史快照';
nav();if(state.view==='graph'&&state.sector!=='tea')render();
}catch(e){dataStatus='暂用内置资料快照';nav()}
}
render();connect();
})();