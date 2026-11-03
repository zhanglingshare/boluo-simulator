/* 博罗 · 05 双图关系对照：不使用3D、不创造数值、不把假设画成事实 */
(function(){
'use strict';
const M=window.BoluoCompareModel;
const $=id=>document.getElementById(id);
const ns='http://www.w3.org/2000/svg';
const state={pack:null,changes:null,sources:null,selected:null,inspect:null,zoom:100,view:'after'};
const relationNames={supply_chain:'产业关联',transport:'交通联系',tourism_consumption:'文旅消费关联',eco_constraint:'生态约束',investment:'投资或产能联系',regional:'跨区域关联',commute:'人员往来线索'};
function el(tag,cls,text){
 const a=document.createElement(tag);if(cls)a.className=cls;if(text!=null)a.textContent=String(text);return a;
}
function svgEl(tag,attrs,text){
 const x=document.createElementNS(ns,tag);
 Object.entries(attrs||{}).forEach(([k,v])=>x.setAttribute(k,String(v)));
 if(text!=null)x.textContent=String(text);return x;
}
function setText(name,value){const x=$(name);if(x)x.textContent=String(value??'');}
function safeLink(url){try{const x=new URL(url);return /^https?:$/.test(x.protocol)?x.href:null;}catch(e){return null;}}
function fmtEventDate(d){return String(d||'').replace(/至/g,'—');}
function eventKey(d){const x=String(d||'').match(/^(\d{4})-(\d{2})(?:-(\d{2}))?/);return x?Number(x[1])*10000+Number(x[2])*100+Number(x[3]||1):0;}
function prettyStatus(c){
 if(c.change_id==='C004')return '签约已确认 · 项目待落地';
 if(c.change_id==='C005')return '项目建设中 · 未证实达产';
 if(c.change_id==='C006')return '桥梁施工 · 未建成';
 if(c.change_id==='C007')return '道路建设目标 · 通车待核实';
 if(c.change_id==='C008')return '生产线关停 · 不等于整家企业退出';
 if(c.change_id==='C009')return '停产整改 · 非永久退出';
 if(c.change_type==='new_entity')return '新主体／新设施记录';
 if(c.change_type==='strengthen')return '相关联系与产业信号';
 return '关系变化记录';
}
function word(s,len=42){s=String(s||'');return s.length>len?s.slice(0,len-1)+'…':s;}
function summarizeCase(c){
 if(c.change_id==='C004')return '四宗项目已经签约；四个项目尚未确认投产，三条拟议配套关系均未被核验。';
 if(c.change_id==='C006')return '老桥存在，施工改变当前通行条件；六车道新桥尚未建成。';
 if(c.change_id==='C007')return '通车仍属于目标，不能把规划通道画成实际开放道路。';
 if(c.change_id==='C008')return '退出的是日产2500吨的熟料生产线，不能推断整家企业全部退出。';
 if(c.change_id==='C009')return '相关企业被要求停产整改；关联约束的变化不等于整个产业永久消失。';
 if(c.change_id==='C010'||c.change_id==='C011'||c.change_id==='C012')return '已有结构中出现与事件相关的增强线索；当前材料没有足够的逐边数量变化，不能虚构强度。';
 return '把事件中明确涉及的主体和联系单独标出；没有直接证据的影响不自动扩展。';
}
function loadJSON(file){
 return fetch(file,{cache:'no-store'}).then(r=>{if(!r.ok)throw Error(file+' HTTP '+r.status);return r.json();});
}
function showError(message){
 const host=$('bc-error');host.hidden=false;host.replaceChildren(el('strong',null,'暂时不能建立可靠对比'));
 host.append(el('p',null,String(message)+'。为避免制造错误的“前后变化”，本页不使用虚构演示数据。'));
 const btn=el('button',null,'重新读取');btn.type='button';btn.onclick=()=>location.reload();host.append(btn);
}
function renderEvents(){
 const host=$('bc-event-list');host.replaceChildren();
 const items=[...state.changes.changes].sort((a,b)=>eventKey(b.event_date)-eventKey(a.event_date)||a.change_id.localeCompare(b.change_id));
 items.forEach((c,i)=>{
  const button=el('button','bc-event');button.type='button';button.dataset.id=c.change_id;
  button.setAttribute('aria-pressed',state.selected?.id===c.change_id?'true':'false');
  const top=el('div','bc-event-top');top.append(el('span','bc-id',c.change_id),el('span','bc-event-date',fmtEventDate(c.event_date)));
  button.append(top,el('div','bc-event-title',c.title));
  if(state.selected?.id===c.change_id)button.classList.add('is-active');
  button.onclick=()=>choose(c.change_id,true);
  button.onkeydown=e=>{
   if(e.key==='ArrowRight'||e.key==='ArrowLeft'){
    e.preventDefault();const next=items[(i+(e.key==='ArrowRight'?1:-1)+items.length)%items.length];
    const b=host.querySelector('[data-id="'+next.change_id+'"]');b?.focus();choose(next.change_id,true);
   }
  };
  host.append(button);
 });
 const current=host.querySelector('.is-active');
 current?.scrollIntoView({inline:'nearest',block:'nearest',behavior:'instant'});
}
function svgStatus(edge,which){
 const stateName=edge[which];
 if(stateName==='absent')return null;
 const selected=state.inspect?.type==='edge'&&state.inspect?.id===edge.id;
 if(stateName==='normal'){
  return {color:edge.focus?'#98a6b4':'#cdd5dd',width:edge.focus?2:1.25,dash:null,opacity:edge.focus?.9:.78};
 }
 if(stateName==='hypothesis'||stateName==='construction'||stateName==='inferred'){
  return {color:'#b57a40',width:selected?3.4:2.35,dash:'6 5',opacity:1};
 }
 if(stateName==='closed'){
  return {color:'#9e3035',width:selected?3.6:2.6,dash:'4 5',opacity:.92};
 }
 if(stateName==='related'||stateName==='recorded'){
  return {color:edge.focus?'#a13e47':'#bdc8d2',width:selected?3.6:edge.focus?2.55:1.45,
    dash:stateName==='related'?'7 4':null,opacity:1};
 }
 return {color:'#abb7c1',width:1.5,dash:null,opacity:.7};
}
function drawGraph(which){
 const svg=$(which==='before'?'bc-before':'bc-after');
 svg.replaceChildren();
 const build=state.selected;if(!build)return;
 const xScale=100/state.zoom,w=600*xScale,h=415*xScale;
 svg.setAttribute('viewBox',[300-w/2,204-h/2,w,h].join(' '));
 const bg=svgEl('rect',{x:0,y:0,width:600,height:415,fill:'#fcfdfe'});svg.append(bg);
 for(let i=44;i<600;i+=44)svg.append(svgEl('line',{x1:i,y1:0,x2:i,y2:415,stroke:'#f1f3f5','stroke-width':1}));
 for(let j=32;j<415;j+=44)svg.append(svgEl('line',{x1:0,y1:j,x2:600,y2:j,stroke:'#f1f3f5','stroke-width':1}));
 const nodeMap=new Map(build.nodes.map(n=>[n.id,n]));
 const drawEdges=[...build.edges].sort((a,b)=>Number(a.focus)-Number(b.focus));
 for(const edge of drawEdges){
  const styling=svgStatus(edge,which);
  if(!styling)continue;
  const start=nodeMap.get(edge.source),end=nodeMap.get(edge.target);
  if(!start||!end)continue;
  const a=start.position,b=end.position;
  const group=svgEl('g',{'class':'bc-edge',tabindex:'0',role:'button',
     'data-edge':edge.id,'aria-label':edge.id+' '+edge.label});
  const visible=svgEl('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,
    stroke:styling.color,'stroke-width':styling.width,'stroke-linecap':'round',
    'class':'bc-edge-visible',opacity:styling.opacity});
  if(styling.dash)visible.setAttribute('stroke-dasharray',styling.dash);
  group.append(visible,svgEl('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,
   stroke:'transparent','stroke-width':18,'pointer-events':'stroke'}));
  if(edge.after==='closed'&&which==='after'){
   const mx=(a.x+b.x)/2,my=(a.y+b.y)/2;
   group.append(svgEl('line',{x1:mx-5,y1:my-5,x2:mx+5,y2:my+5,stroke:'#9e3035','stroke-width':2.3}),
                svgEl('line',{x1:mx-5,y1:my+5,x2:mx+5,y2:my-5,stroke:'#9e3035','stroke-width':2.3}));
  }
  group.onclick=e=>{e.stopPropagation();setInspection('edge',edge.id);};
  group.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setInspection('edge',edge.id);}};
  svg.append(group);
 }
 const groupNodes=[...build.nodes].sort((a,b)=>Number(a.core)-Number(b.core));
 for(const node of groupNodes){
  const isBefore=which==='before',ghost=isBefore&&!node.beforeVisible;
  const chosen=state.inspect?.type==='node'&&state.inspect.id===node.id;
  const x=node.position.x,y=node.position.y;
  const core=node.core;
  const radius=core?20:14;
  const circleFill=ghost?'#fff':node.pending?'#fff9ef':node.closedLine&&!isBefore?'#fff3f2':core?'#eef2f5':'#fff';
  const color=ghost?'#cbd5dd':chosen?'#304d66':node.pending?'#b57a40':node.closedLine&&!isBefore?'#9e3035':
   core&&!isBefore&&node.introduced?'#9e3035':core?'#677b8d':'#aebbc5';
  const nodeG=svgEl('g',{'class':'bc-node '+(ghost?'bc-node-muted':core?'bc-node-focus':'')+
    (node.pending&&!isBefore?' bc-node-pending':''),
    tabindex:'0',role:'button','data-node':node.id,
    'aria-label':(ghost?'变化前尚未出现的主体位置：':'主体：')+node.name});
  if(chosen)nodeG.append(svgEl('circle',{cx:x,cy:y,r:radius+8,fill:'none',stroke:'#6c9cc1','stroke-width':2,opacity:.8}));
  const ring=svgEl('circle',{cx:x,cy:y,r:radius,fill:circleFill,stroke:color,
    'stroke-width':chosen?3.5:core?2.15:1.5,'class':'bc-node-ring'});
  if(ghost||node.pending&&!isBefore)ring.setAttribute('stroke-dasharray','4 4');
  nodeG.append(ring);
  if(node.closedLine&&!isBefore){
   nodeG.append(svgEl('line',{x1:x-7,y1:y-7,x2:x+7,y2:y+7,stroke:'#9e3035','stroke-width':2.2}));
  }else if(ghost){
   nodeG.append(svgEl('path',{d:'M'+(x-5)+' '+y+' H'+(x+5),stroke:'#c4cbd3','stroke-width':1.6}));
  }else{
   nodeG.append(svgEl('circle',{cx:x,cy:y,r:core?4:2.8,fill:color,opacity:.8}));
  }
  const t=svgEl('text',{x,y:y+radius+15,'class':'bc-node-label', 'font-size':core?10.5:9.4},
    word(node.shortName,core?12:9));
  nodeG.append(t);
  if(node.pending&&!isBefore)nodeG.append(svgEl('text',{x,y:y-radius-8,
    'font-size':9.2,'font-weight':'800',fill:'#a56c38','text-anchor':'middle'},'待落地'));
  if(node.closedLine&&!isBefore)nodeG.append(svgEl('text',{x,y:y-radius-8,
    'font-size':9,'font-weight':'800',fill:'#9e3035','text-anchor':'middle'},'产线退出'));
  nodeG.onclick=e=>{e.stopPropagation();setInspection('node',node.id);};
  nodeG.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setInspection('node',node.id);}};
  svg.append(nodeG);
 }
 svg.onclick=e=>{if(e.target===svg){state.inspect=null;renderGraphs();renderInspection();}};
}
function renderGraphs(){
 drawGraph('before');drawGraph('after');
 const data=state.selected;
 setText('bc-before-count',data.nodes.filter(n=>n.beforeVisible).length+'个可见主体 · 局部参考');
 setText('bc-after-count',data.nodes.length+'个主体 · '+data.counts.changedEdges+'条事件关联');
}
function renderInspection(){
 const obj=state.inspect,build=state.selected;
 if(!obj){setText('bc-selected-title','点击图中的主体或关系');
  setText('bc-selected-text','两图将同时定位同一对象。灰色是背景；红色强调事件相关变化；虚线提示建设、待验证关系或非直接事实。');
  return;}
 if(obj.type==='node'){
  const n=build.nodes.find(n=>n.id===obj.id);if(!n)return;
  const exists=n.introduced?'此前未记录该新增主体；当前已纳入事件记录。':'该主体在本次事件前后的局部对照中均保留。';
  let status=n.pending?'项目仍待落地；不能推断已投产或形成供货关系。':
   n.closedLine?'当前退出的是指定熟料生产线，不能等同整家企业注销。':
   n.introduced?'已收录新增主体，具体产能和达产结果仍须独立核验。':
   '本次对照未把该主体的其他关系推断成已经变化。';
  setText('bc-selected-title',n.name);
  setText('bc-selected-text',exists+' '+status+' '+(n.description||''));
 }else{
  const e=build.edges.find(x=>x.id===obj.id);if(!e)return;
  const n1=build.nodes.find(n=>n.id===e.source),n2=build.nodes.find(n=>n.id===e.target);
  setText('bc-selected-title',(n1?.name||e.source)+' → '+(n2?.name||e.target));
  setText('bc-selected-text',((relationNames[e.relation]||'结构联系')+' · '+e.label+'。')+
   ' '+(e.evidence==='待验证假设'?'这是待验证假设，不是已确认的采购合同。':
    e.evidence==='证据推断'?'这条关系涉及间接证据，不能直接当作已证实交易。':
    '这是一条有公开资料支持的关联记录，但不能自动推断实际交易或因果强度。')+
   ' '+e.description+(e.counter_evidence?' 注意：'+e.counter_evidence:''));
 }
}
function setInspection(type,id){
 state.inspect={type,id};renderGraphs();renderInspection();
}
function renderSources(){
 const data=state.selected;
 const box=$('bc-sources');box.replaceChildren();
 if(!data.sources.length){box.append(el('p',null,'当前事件没有可显示的来源记录，请勿据此做事实认定。'));return;}
 for(const src of data.sources){
  const href=safeLink(src.url);
  const a=el(href?'a':'div');
  if(href){a.href=href;a.target='_blank';a.rel='noopener noreferrer';}
  a.textContent=src.title||src.publisher||src.source_id;
  a.append(el('span',null,(src.publisher||'来源待核对')+' · '+(src.published_at||'发布时间未知')+(href?' · 打开原文 ↗':' · 暂无可用链接')));
  box.append(a);
 }
}
function eventView(c){
 state.selected=M.build(state.pack,state.changes,state.sources,c);
 state.inspect=null;
 const data=state.selected;
 setText('bc-event-id',c);
 setText('bc-event-status',prettyStatus(data.event));
 setText('bc-event-title',data.event.title);
 setText('bc-event-date','事件时间：'+fmtEventDate(data.event.event_date)+' · 最近核验：'+(data.event.last_verified_at||'未注明'));
 setText('bc-nodes',data.counts.allNodes);setText('bc-edges',data.counts.allEdges);
 setText('bc-cases',data.counts.events);setText('bc-local',data.counts.localNodes);
 setText('bc-before-sub',word(data.beforeText,90));
 setText('bc-after-sub',word(data.afterText,90));
 setText('bc-previous-text',data.beforeText);
 setText('bc-current-text',data.afterText);
 setText('bc-method-note',data.caution+' 本页不使用虚构关系强度或影响概率。');
 setText('bc-uncertainty','仍待观察：'+data.uncertainty+' '+summarizeCase(data.event));
 const encoded=encodeURIComponent(c);
 $('bc-back-change').href='holo-home-v9.html#change='+encoded;
 $('bc-back-baseline').href='who.html?from=changes&change='+encoded;
 $('bc-explore').href='experiments/holo-single/index.html?change='+encoded;
 renderEvents();renderGraphs();renderInspection();renderSources();
 const url=new URL(location.href);url.searchParams.set('change',c);url.hash='';
 history.replaceState(null,'',url.toString());
 document.dispatchEvent(new CustomEvent('bl:compare-selected',{detail:{changeId:c}}));
}
function choose(id,fromUser=false){
 if(!state.changes?.changes?.some(c=>c.change_id===id))return;
 try{eventView(id);}catch(e){showError(e.message);return;}
 if(fromUser){const b=$('bc-event-list').querySelector('.is-active');
  b?.scrollIntoView({inline:'nearest',block:'nearest'});}
}
function attach(){
 $('bc-zoom').oninput=e=>{state.zoom=Number(e.target.value)||100;renderGraphs();};
 $('bc-reset').onclick=()=>{state.zoom=100;$('bc-zoom').value='100';state.inspect=null;renderGraphs();renderInspection();};
 document.querySelectorAll('[data-bc-view]').forEach(b=>b.onclick=()=>{
  state.view=b.dataset.bcView;
  document.body.classList.remove('bc-view-before','bc-view-after','bc-view-both');
  document.body.classList.add('bc-view-'+state.view);
  document.querySelectorAll('[data-bc-view]').forEach(el=>{const active=el.dataset.bcView===state.view;el.classList.toggle('is-active',active);el.setAttribute('aria-pressed',String(active));});
 });
 $('bc-copy').onclick=async()=>{
  try{
   if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(location.href);setText('bc-copy-state','已复制本次对比链接');}
   else{setText('bc-copy-state','可从浏览器地址栏复制本次对比链接');}
  }catch(e){setText('bc-copy-state','无法自动复制，请使用地址栏');}
 };
 window.addEventListener('popstate',()=>{const q=new URLSearchParams(location.search);choose(q.get('change')||'C004');});
}
async function boot(){
 if(!M){showError('模型适配模块未加载');return;}
 attach();
 try{
  const result=await Promise.all([
   loadJSON('data/relationship-evidence-v1.json'),
   loadJSON('data/relationship-changes-v1.json'),
   loadJSON('data/relationship-sources-v1.json')
  ]);
  [state.pack,state.changes,state.sources]=result;
  M.validate(state.pack,state.changes);
  setText('bc-datestamp','数据快照：'+(state.changes.generated_at||state.pack.generated_at||'时间待确认'));
  const query=new URLSearchParams(location.search),hash=(location.hash||'').match(/change=(C\d{3})/);
  const wanted=query.get('change')||hash?.[1]||'C004';
  const present=state.changes.changes.some(x=>x.change_id===wanted);
  choose(present?wanted:'C004');
  if(!state.selected)choose(state.changes.changes[0]?.change_id);
 }catch(e){showError(e.message);}
}
boot();
})();