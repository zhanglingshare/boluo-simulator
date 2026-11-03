/* 博罗情报实验台 · Human-in-the-loop viewer. All factual claims from public JSON.
   UI runs a structural evidence stress test, not a physical-economic failure simulation. */
(function(){
'use strict';
const Engine=window.BoluoIntelEngine,$=s=>document.querySelector(s),$$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const make=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=String(text);return e;};
const svgNS='http://www.w3.org/2000/svg';
const svg=(tag,attrs={},text)=>{const e=document.createElementNS(svgNS,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,String(v));if(text!==undefined)e.textContent=String(text);return e;};
const b=(label,cls,fn)=>{const x=make('button',cls,label);x.type='button';if(fn)x.onclick=fn;return x;};
const $id=s=>document.getElementById(s);
let payload=null,snapshot=null,run=null,changeId='',pivot='',selectedEdge='',activeTab='blind',textFilter='';
const reduce=!!(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);
const ids={events:'ia-events',props:'ia-claims-list',blind:'ia-blind-list',sources:'ia-sources-list'};
const labelGrade=g=>({A:'A级 · 已记录关联',B:'B级 · 间接推断',C:'C级 · 待验证假设'})[g]||'资料待核实';
const truncate=(s,n)=>String(s||'').length>n?String(s).slice(0,n-1)+'…':String(s||'');
function setText(id,value){const el=$id(id);if(el)el.textContent=String(value==null?'—':value);}
function safeHref(url){try{const u=new URL(url);return u.protocol==='https:'||u.protocol==='http:'?u.href:'';}catch{return '';}}
function scrollTo(el){el?.scrollIntoView({behavior:reduce?'auto':'smooth',block:'nearest'});}
function setTab(name){
 activeTab=name;$$('[data-ia-tab]').forEach(x=>x.setAttribute('aria-selected',String(x.dataset.iaTab===name)));
 for(const t of ['blind','claims','sources'])$id('ia-tab-'+t).hidden=t!==name;
}
function panelCard(meta,title,note,opts={}){
 const card=make('article','ia-brief-item'+(opts.important?' is-priority':''));
 card.append(make('span','meta',meta),make('h3',null,title),make('p',null,note));
 if(opts.foot)card.append(make('small',null,opts.foot));
 if(opts.action){card.append(b(opts.actionLabel||'在关系图定位','',opts.action));}
 return card;
}
function eventRead(c){
 const status=(c.uncertainty||'').replace(/\s+/g,' ').slice(0,50);
 return status||'具体证据限制见右侧';
}
function listEvents(){
 const list=$id(ids.events),all=payload.changes.changes;
 const filtered=all.filter(e=>(e.change_id+' '+e.title+' '+e.uncertainty).toLowerCase().includes(textFilter));
 list.replaceChildren();
 for(const e of filtered){
  const btn=b('','ia-event',()=>selectEvent(e.change_id));
  btn.dataset.id=e.change_id;btn.setAttribute('aria-pressed',String(e.change_id===changeId));
  const left=make('span','eid',e.change_id),right=make('span');
  right.append(make('strong',null,e.title),make('small',null,e.event_date+' · '+eventRead(e)));
  btn.append(left,right);list.append(btn);
 }
 if(!filtered.length)list.append(make('p','ia-brief-item','未找到匹配的事件；可尝试其他关键词。'));
}
function listClaims(){
 const host=$id(ids.props);host.replaceChildren();
 const claims=Engine.propositions(snapshot);
 for(const c of claims){
  const card=panelCard(c.status,c.title,c.basis,{foot:'限制：'+c.caveat});
  if(c.kind==='关系命题'){
   card.append(b('在图中检查这条关联','',()=>{selectEdge(c.id);setTab('claims');}));
  }
  const meta=make('small',null,'来源编号：'+(c.sourceIds.join('、')||'未登记'));
  card.append(meta);host.append(card);
 }
}
function inspectNode(nodeId){
 const n=snapshot.model.nodes.find(n=>n.id===nodeId);
 if(!n)return;
 selectedEdge='';
 setText('ia-inspect-title',n.name);
 const original=snapshot.nodes.get(nodeId);
 setText('ia-inspect-note',(original?.description||'关系说明未登记')+'。证据等级：'+(original?.evidence_grade||'未登记')+'；当前图仅是此事件的局部网络。');
 drawGraph();
}
function selectEdge(edgeId){
 const e=snapshot.edges.find(x=>x.id===edgeId);
 if(!e)return;
 selectedEdge=edgeId;
 const n=id=>snapshot.nodes.get(id)?.name||id;
 setText('ia-inspect-title',n(e.source)+' ↔ '+n(e.target)+' · '+labelGrade(e.grade));
 setText('ia-inspect-note',(e.description||e.label||'暂无详细描述')+
  '。限制：'+(e.original_counter_evidence||e.counter_evidence||'关联不证明真实交易、经济传导或因果。'));
 drawGraph();
}
function listBlindspots(){
 const host=$id(ids.blind);host.replaceChildren();
 const {blindspots}=Engine.inspect(snapshot,{mode:'ABC',pivot});
 setText('ia-blind-count',blindspots.length);
 blindspots.forEach((item,i)=>{
  const card=panelCard((item.priority===1?'优先核验 · ':'')+item.kind+(item.grade==='未知'?'':' · '+item.grade),
   item.title,item.note,{
    important:item.priority===1,
    foot:item.sourceIds.length?'依据/待核条目：'+item.sourceIds.slice(0,5).join('、'):'尚无可直接绑定的来源编号'
   });
  if(item.linkId)card.append(b('查看对应关系','',()=>{selectEdge(item.linkId);}));
  host.append(card);
 });
}
function listSources(){
 const ids=new Set([...(snapshot.event.source_ids||[]),
  ...snapshot.edges.filter(e=>e.focus).flatMap(e=>e.source_ids||[])]);
 const host=$id('ia-sources-list');host.replaceChildren();
 [...ids].forEach(id=>{
  const s=snapshot.sources.get(id);
  if(!s){host.append(panelCard('来源缺口',id,'引用了此编号，但当前来源库没有条目。',{important:true}));return;}
  const card=panelCard(id+' · '+(s.publisher||s.source_type||'公开来源'),s.title||id,
   (s.summary||'无摘要')+(s.independent_corroboration==null?'；独立交叉核验状态未登记。':''),{
    foot:'资料日期：'+(s.published_at||'未注明')+' · 入库：'+(s.fetched_at||'未注明')});
  const href=safeHref(s.url);
  if(href){const a=make('a',null,'打开原始资料');a.href=href;a.target='_blank';a.rel='noopener noreferrer';card.append(a);}
  host.append(card);
 });
 if(!ids.size)host.append(panelCard('来源缺口','该事件尚无来源编号','请返回结构情报页核对事实。'));
}
function graphEdgeStyle(e,included){
 const type=e.grade;
 const base=type==='A'?'#6ec8ce':type==='B'?'#e8b375':'#a9a2c9';
 const col=selectedEdge===e.id?'#ffd1dd':e.focus?'#f47f98':base;
 return {col,width:selectedEdge===e.id?4.7:e.focus?3.1:1.65,
  dash:type==='B'?'7 6':type==='C'?'2 7':'',opacity:included?1:.13};
}
function drawGraph(){
 const map=$id('ia-map'),mode=$id('ia-grade').value;
 if(!snapshot)return;
 // Keep the fixed defs and dot grid; never rebuild genuine evidence data.
 const def=map.querySelector('defs'),background=map.querySelector('rect');
 map.replaceChildren();if(def)map.append(def);if(background)map.append(background);
 const grades=new Set(Engine.GRADES[mode]);
 const loc=new Map(snapshot.model.nodes.map(n=>[n.id,n]));
 const selected=run?.removed?.edgeId||'';
 const paths=make('g'); // SVG groups are created below.
 snapshot.edges.filter(e=>e.after!=='absent').forEach(e=>{
  const a=loc.get(e.source),b=loc.get(e.target);if(!a||!b)return;
  const included=grades.has(e.grade);
  const st=graphEdgeStyle(e,included);
  const gr=svg('g',{class:'ia-edge'+(!included?' is-off':'')+(selected===e.id?' is-selected':''),role:'button',tabindex:0,
   'data-edge':e.id,'aria-label':'关系 '+e.id+' '+labelGrade(e.grade)});
  const line=svg('line',{x1:a.position.x,y1:a.position.y,x2:b.position.x,y2:b.position.y,stroke:st.col,
   'stroke-width':st.width,'stroke-dasharray':st.dash,opacity:st.opacity,class:'visible'});
  const hit=svg('line',{x1:a.position.x,y1:a.position.y,x2:b.position.x,y2:b.position.y,class:'hit'});
  gr.append(line,hit);
  gr.addEventListener('click',()=>selectEdge(e.id));
  gr.addEventListener('keydown',ev=>{if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();selectEdge(e.id);}});
  map.append(gr);
 });
 snapshot.model.nodes.forEach(n=>{
  const p=n.position,r=n.core?15:11;
  const modeEdges=snapshot.edges.filter(e=>e.after!=='absent'&&grades.has(e.grade)&&(e.source===n.id||e.target===n.id));
  const isOn=modeEdges.length>0||n.id===pivot;
  const g=svg('g',{class:'ia-node'+(n.core?' core':'')+(!isOn?' is-off':'')+(n.id===pivot?' is-selected':''),role:'button',tabindex:0,
   'data-node':n.id,'aria-label':'查看主体 '+n.name,transform:'translate('+p.x+' '+p.y+')'});
  g.append(svg('circle',{r:r+7,fill:n.id===pivot?'#de81954a':'#50b5c213',stroke:'none'}),
    svg('circle',{r,class:'ring'}),
    svg('text',{y:r+18,class:'name'},truncate(n.shortName||n.name,10)),
    svg('text',{y:r+30,class:'sub'},n.id===pivot?'观察起点':n.affected?'事件相关':'背景'));
  g.addEventListener('click',()=>inspectNode(n.id));
  g.addEventListener('keydown',ev=>{if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();inspectNode(n.id);}});
  map.append(g);
 });
}
function updatePivots(){
 const host=$id('ia-pivot');host.replaceChildren();
 snapshot.model.nodes.forEach(n=>{
  const o=document.createElement('option');o.value=n.id;o.textContent=n.name+(n.affected?' · 事件相关':' · 背景');host.append(o);
 });
 if(!snapshot.model.nodes.some(n=>n.id===pivot))pivot=snapshot.model.coreIds.find(x=>snapshot.model.nodes.some(n=>n.id===x))||snapshot.model.nodes[0].id;
 host.value=pivot;
}
function updateEdges(){
 const mode=$id('ia-grade').value;
 const host=$id('ia-remove'),prev=host.value;host.replaceChildren();
 const start=document.createElement('option');start.value='';start.textContent='不移除 · 基准';host.append(start);
 snapshot.edges.filter(e=>Engine.GRADES[mode].includes(e.grade)&&e.after!=='absent').forEach(e=>{
  const n=id=>snapshot.nodes.get(id)?.name||id,o=document.createElement('option');
  o.value=e.id;o.textContent=e.id+' · '+truncate(n(e.source)+' ↔ '+n(e.target),28)+(e.focus?' · 事件相关':'');
  host.append(o);
 });
 host.value=[...host.options].some(o=>o.value===prev)?prev:'';
}
function drawResult(){
 const host=$id('ia-scenarios');host.replaceChildren();
 run.scenarios.forEach(s=>{
  const cell=make('div','ia-scenario'+(s.mode===run.conditions.mode?' is-active':''));
  const text=s.mode==='A'?'只看明确记录':s.mode==='AB'?'包括间接推断':'包括待验证假设';
  cell.append(make('b',null,s.mode+' · '+text),make('strong',null,s.reachable+' / '+snapshot.model.nodes.length),
   make('small',null,'可达主体 / 局部主体'),make('small',null,s.edges+' 条纳入联系 · '+s.fragile+' 条单边敏感'));
  host.append(cell);
 });
 setText('ia-before',run.baseline);setText('ia-after',run.after);
 setText('ia-change',run.lostIds.length===0?'0':'−'+run.lostIds.length);
 const names=run.lostIds.map(x=>snapshot.nodes.get(x)?.name||x);
 setText('ia-affected',names.length?
  '这些主体在当前局部记录中失去到观察起点的路径：'+names.join('、')+'。不等于现实关系断裂。':
  run.removed?'本次移除并未改变观察起点在局部记录中的可达主体。':'基准状态：尚未移除任何连线。');
 setText('ia-run-id',run.runId);
 setText('ia-run-status','同条件+同快照可重复 · '+snapshot.generatedAt.changes);
 const scanHost=$id('ia-scan');scanHost.replaceChildren();
 const sorted=run.scan.slice(0,7);
 sorted.forEach((item,i)=>{
  const n=id=>snapshot.nodes.get(id)?.name||id;
  const row=b('','ia-scan-row',()=>{
   $id('ia-remove').value=item.edgeId;perform();
  });
  const label=make('strong',null,item.edgeId+' · '+truncate(n(item.source)+' ↔ '+n(item.target),22));
  const track=make('span','ia-scan-track'),bar=make('i');
  const max=Math.max(1,run.baseline-1);
  bar.style.width=(item.loss>0?Math.max(8,Math.round(item.loss/max*100)):0)+'%';
  track.append(bar);
  row.append(label,track,make('span',null,item.loss>0?'−'+item.loss:'无变化'));
  row.title='仅代表当前局部证据图；点击以实际运行移除此关系';
  scanHost.append(row);
 });
 if(!sorted.length)scanHost.append(make('div','ia-affected','本证据情景没有可移除的入库连线。换个证据条件再观察。'));
 $id('ia-export').disabled=false;
 drawGraph();
}
function perform(){
 try{
  run=Engine.inspect(snapshot,{mode:$id('ia-grade').value,pivot:$id('ia-pivot').value,omitEdge:$id('ia-remove').value});
  drawResult();return run;
 }catch(e){
  $id('ia-error').hidden=false;setText('ia-error','实验没有运行：'+e.message);return null;
 }
}
function selectEvent(id){
 if(!payload)return;
 const event=payload.changes.changes.find(x=>x.change_id===id);if(!event)return;
 try{
  snapshot=Engine.withInputs(payload.evidence,payload.changes,payload.sources,id);
  changeId=id;pivot=snapshot.model.coreIds.find(x=>snapshot.model.nodes.some(n=>n.id===x))||snapshot.model.nodes[0].id;
  run=null;selectedEdge='';
  const u=new URL(location.href);u.searchParams.set('change',id);
  history.replaceState(null,'',u);
  setText('ia-event-title',event.title);setText('ia-event-date',event.event_date+' · '+event.change_id);
  setText('ia-event-snapshot','入库快照 '+snapshot.generatedAt.changes);
  updatePivots();updateEdges();
  listEvents();listClaims();listSources();
  perform();
  listBlindspots();drawGraph();
  setText('ia-inspect-title','当前事件 '+id+' · 点击连线核查');
  setText('ia-inspect-note',event.uncertainty||'事后状态仍需要核对独立证据。');
 }catch(e){$id('ia-error').hidden=false;setText('ia-error','无法建立可信的局部实验：'+e.message);}
}
async function boot(){
 if(!Engine){$id('ia-error').hidden=false;setText('ia-error','证据实验模块未加载。不会用编造数据补全页面。');return;}
 try{
  const records=await Promise.all(['evidence','changes','sources'].map(name=>
   fetch('data/relationship-'+name+'-v1.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error(name+' HTTP '+r.status);return r.json();})));
  payload={evidence:records[0],changes:records[1],sources:records[2]};
  Engine.load(...records,payload.changes.changes[0].change_id);
  setText('ia-stat-events',payload.changes.changes.length);setText('ia-stat-nodes',payload.evidence.nodes.length);
  setText('ia-stat-edges',payload.evidence.edges.length);setText('ia-stat-sources',payload.sources.sources.length);
  setText('ia-dates','数据快照：'+payload.changes.generated_at+' · 证据库：'+payload.evidence.generated_at);
  const req=new URLSearchParams(location.search).get('change');
  selectEvent(payload.changes.changes.some(x=>x.change_id===req)?req:'C004');
 }catch(e){$id('ia-error').hidden=false;setText('ia-error','现有公开数据无法完整加载或校验：'+e.message+'。此页不会用假数据代替。');}
}
$id('ia-search').addEventListener('input',e=>{textFilter=e.target.value.trim().toLowerCase();if(payload)listEvents();});
$$('[data-ia-tab]').forEach(x=>x.addEventListener('click',()=>setTab(x.dataset.iaTab)));
$id('ia-grade').addEventListener('change',()=>{if(snapshot){updateEdges();perform();}});
$id('ia-pivot').addEventListener('change',e=>{if(snapshot){pivot=e.target.value;perform();listBlindspots();}});
$id('ia-remove').addEventListener('change',()=>{if(snapshot)perform();});
$id('ia-run').addEventListener('click',()=>{if(snapshot)perform();});
$id('ia-replay').addEventListener('click',()=>{
 if(!snapshot)return;
 const baseline=Engine.inspect(snapshot,{mode:$id('ia-grade').value,pivot:$id('ia-pivot').value});
 const first=baseline.scan.find(x=>x.loss>0)||baseline.scan[0];
 $id('ia-remove').value=first?first.edgeId:'';
 perform();
 const map=$id('ia-map');if(!reduce&&map.animate)map.animate([{filter:'brightness(1)'},{filter:'brightness(1.27)'},{filter:'brightness(1)'}],{duration:650});
});
$id('ia-export').addEventListener('click',()=>{
 if(!snapshot||!run)return;
 const report=Engine.exportRun(snapshot,run,$id('ia-notes').value);
 const blob=new Blob([JSON.stringify(report,null,2)],{type:'application/json'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download=run.runId+'.json';document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),700);
});
setTab('blind');boot();
})();