/* 博罗03 · 事件变化观察台：一处变化突出一组相关路径。
 * 依赖已发布关系JSON，不把新闻直接变成供应链。纯SVG，无3D/随机运动。
 */
(function(){
'use strict';
const Model=window.BoluoCompareModel,SVG='http://www.w3.org/2000/svg';
const $=id=>document.getElementById(id);
const app={evidence:null,changes:null,sources:null,sourceMap:null,c:null,model:null,filter:'all',search:'',inspect:null};
const n=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=String(text);return e;};
const svg=(tag,props={},text)=>{const el=document.createElementNS(SVG,tag);for(const [k,v] of Object.entries(props))el.setAttribute(k,String(v));if(text!=null)el.textContent=String(text);return el;};
const txt=(id,value)=>{$(id).textContent=String(value??'');};
const dateKey=s=>{const m=String(s).match(/^(\d{4})-(\d{2})(?:-(\d{2}))?/);return m?Number(m[1])*10000+Number(m[2])*100+Number(m[3]||1):0;};
function eventBadge(c){
 if(c.change_id==='C004')return '签约 · 待落地';
 if(c.change_id==='C005')return '在建 · 待投产';
 if(c.change_id==='C006')return '施工 · 未通车';
 if(c.change_id==='C007')return '目标 · 未通车';
 if(c.change_id==='C008')return '产线已退出';
 if(c.change_id==='C009')return '停产整改';
 if(c.change_type==='strengthen')return '增强相关线索';
 if(c.change_type==='new_entity')return '新增主体记录';
 return '已收录关系事件';
}
function brief(c){
 const map={
 C001:'产业园开始投产爬坡；达产产值不是当前实际产出。',
 C002:'储能电站已并网；具体企业电价变化尚缺观测。',
 C003:'铜来顺已点火投产；百亿为后续目标。',
 C004:'四宗项目签约，尚未投产。三条候选关联尚无直接交易证据。',
 C005:'两个增资扩产主体仍在建，不能算作新增已实现产值。',
 C006:'石洲大桥施工，六车道新桥尚未建成。',
 C007:'高速通车时间是目标，须以正式通车公告确认。',
 C008:'关闭的是熟料生产线，不能把整家企业画成消失。',
 C009:'停产整改不同于永久退出，后续复产仍需跟踪。',
 C010:'荔枝协会成立属于可观察事实，不自动证明游客采购增强。',
 C011:'示范区认定与具体山茶交易关系并非一回事。',
 C012:'旺季游客和预订强劲，不能自动外推全年留客能力。'
 };
 return map[c.change_id]||c.uncertainty||'继续核验关联范围。';
}
function sourceUrl(value){try{const u=new URL(String(value));return /^https?:$/.test(u.protocol)?u.href:null;}catch{return null;}}
const read=name=>fetch('data/'+name+'.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('HTTP '+r.status);return r.json();});
function select(id,updateURL=true){
 if(!app.changes||!app.changes.changes.some(c=>c.change_id===id))return;
 const c=app.changes.changes.find(c=>c.change_id===id);
 app.c=c;app.model=Model.build(app.evidence,app.changes,app.sources,id);app.inspect=null;
 txt('ec-graph-title',c.title);txt('detailTitle',c.title);txt('ec-event-time','事件：'+c.event_date+' · 最近核验：'+(c.last_verified_at||'未说明'));
 txt('ec-detail-id',c.change_id);txt('ec-event-status',eventBadge(c));
 txt('ec-before',app.model.beforeText);txt('ec-after',app.model.afterText);
 txt('ec-uncertainty',(c.uncertainty||'相关影响仍需核验。')+' '+brief(c));
 $('ec-compare').href='relation-compare.html?change='+encodeURIComponent(id)+'&from=changes';
 $('ec-deep').href='holo-home-v9.html#change='+encodeURIComponent(id);
 $('ec-next').href='who.html?from=changes&change='+encodeURIComponent(id);
 renderFeed();drawGraph();renderInspector();renderSources();
 if(updateURL){
  const url=new URL(location.href);url.hash='#change='+id;history.replaceState(null,'',url.toString());
 }
 document.dispatchEvent(new CustomEvent('bl:change-selected',{detail:{changeId:id}}));
}
function renderFeed(){
 const host=$('ec-feed-list');host.replaceChildren();
 const list=app.changes.changes.filter(c=>{
  if(app.filter!=='all'&&c.change_type!==app.filter)return false;
  const names=(c.involved_node_ids||[]).map(id=>app.evidence.nodes.find(n=>n.node_id===id)?.name||'').join(' ');
  const hay=(c.title+' '+c.change_id+' '+names+' '+c.before_after).toLowerCase();
  return hay.includes(app.search);
 }).sort((a,b)=>dateKey(b.event_date)-dateKey(a.event_date)||a.change_id.localeCompare(b.change_id));
 txt('ec-feed-total',list.length+' / '+app.changes.changes.length);
 for(const c of list){
  const b=n('button','ec-feed-item'+(app.c?.change_id===c.change_id?' is-active':''));
  b.type='button';b.dataset.event=c.change_id;
  b.setAttribute('aria-pressed',String(app.c?.change_id===c.change_id));
  const top=n('div','ec-feed-item-top');
  top.append(n('b','ec-feed-item-id',c.change_id),n('span',null,c.event_date));
  b.append(top,n('strong',null,c.title),n('em',null,eventBadge(c)));
  b.onclick=()=>select(c.change_id);
  host.append(b);
 }
 if(!list.length)host.append(n('div','ed-note','该筛选下没有匹配记录。清空搜索或选择“全部”。'));
}
function setInspect(type,id){app.inspect={type,id};drawGraph();renderInspector();}
function renderInspector(){
 const d=app.model,x=app.inspect;
 if(!d||!x){
  txt('ec-inspector-title','点击结构图中的主体或联系');
  txt('ec-inspector-text','灰色是未被本事件明确改变的背景；红色是已记录的变化；棕色虚线表示施工、估算或待验证。');
  return;
 }
 if(x.type==='node'){
  const it=d.nodes.find(n=>n.id===x.id);if(!it)return;
  txt('ec-inspector-title',it.name);
  txt('ec-inspector-text',it.pending?'主体处于签约或在建阶段，不能当作已投产企业。':
    it.closedLine?'本事件关停的是特定生产线，并非公司所有业务结束。':
    it.affected?'这条记录明确涉及该主体，但不能推出它的所有关系都已经改变。':
    '这是相邻背景主体，不代表此次事件对它产生了可证实的直接影响。');
 }else{
  const e=d.edges.find(e=>e.id===x.id);if(!e)return;
  const nn=id=>d.nodes.find(n=>n.id===id)?.name||id;
  txt('ec-inspector-title',nn(e.source)+' → '+nn(e.target));
  txt('ec-inspector-text',(e.label||'研究关系')+'。'+
   (e.grade==='C'?'C级候选联系，不是已确认的直接采购。':
    e.grade==='B'?'B级研究推断，不宜将其直接当作因果证明。':'该联系有公开依据，但也不等于经证实的直接交易。')+
   ' '+(e.description||''));
 }
}
function drawGraph(){
 const d=app.model,host=$('ec-graph');
 if(!d||!host)return;
 host.replaceChildren(svg('title',{},'当前事件 '+d.id+' 关联结构'));
 host.append(svg('rect',{x:0,y:0,width:600,height:420,fill:'#fcfdfe'}));
 for(let x=50;x<600;x+=50)host.append(svg('line',{x1:x,y1:0,x2:x,y2:420,stroke:'#f0f2f4','stroke-width':1}));
 for(let y=50;y<420;y+=50)host.append(svg('line',{x1:0,y1:y,x2:600,y2:y,stroke:'#f0f2f4','stroke-width':1}));
 const nm=new Map(d.nodes.map(n=>[n.id,n]));
 const activeEdges=d.edges.filter(e=>e.focus&&e.before!==e.after);
 const activeNodeIds=new Set(activeEdges.flatMap(e=>[e.source,e.target]));
 d.edges.slice().sort((a,b)=>Number(a.focus)-Number(b.focus)).forEach(e=>{
  const from=nm.get(e.source),to=nm.get(e.target);if(!from||!to)return;
  const state=e.after,change=e.focus&&e.before!==e.after;
  const imagined=state==='hypothesis'||state==='construction'||state==='inferred';
  const red=change&&!imagined;
  const hue=red?'#9b3541':imagined?'#b78a52':'#c6d0d8';
  const selected=app.inspect?.type==='edge'&&app.inspect.id===e.id;
  const g=svg('g',{role:'button',tabindex:0,'class':'ec-graph-edge','aria-label':e.label||e.description,'data-edge':e.id});
  const line=svg('line',{x1:from.position.x,y1:from.position.y,x2:to.position.x,y2:to.position.y,stroke:hue,
    'stroke-width':selected?4:change?2.8:1.35,opacity:change?1:.7,'class':'ec-line-visible'});
  if(imagined||state==='closed')line.setAttribute('stroke-dasharray','6 5');
  g.append(line,svg('line',{x1:from.position.x,y1:from.position.y,x2:to.position.x,y2:to.position.y,stroke:'transparent','stroke-width':18,'pointer-events':'stroke'}));
  g.onclick=()=>setInspect('edge',e.id);
  g.onkeydown=ev=>{if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();setInspect('edge',e.id);}};
  host.append(g);
 });
 d.nodes.slice().sort((a,b)=>Number(a.core)-Number(b.core)).forEach(nd=>{
  const isFocal=nd.core&& (nd.affected||activeNodeIds.has(nd.id));
  const selected=app.inspect?.type==='node'&&app.inspect.id===nd.id;
  const pending=nd.pending;const r=isFocal?19:13;
  const color=pending?'#b78a52':isFocal?'#8d3740':'#afbbc6';
  const gr=svg('g',{'class':'ec-graph-node'+(isFocal?' is-key':''),role:'button',tabindex:0,'data-node':nd.id,'aria-label':'主体 '+nd.name});
  if(selected)gr.append(svg('circle',{cx:nd.position.x,cy:nd.position.y,r:r+8,fill:'none',stroke:'#477492','stroke-width':2}));
  const outer=svg('circle',{cx:nd.position.x,cy:nd.position.y,r,fill:pending?'#fff8ec':isFocal?'#fff6f6':'#f8fafb',stroke:color,'stroke-width':isFocal?2.5:1.5});
  if(pending)outer.setAttribute('stroke-dasharray','4 4');gr.append(outer);
  gr.append(svg('circle',{cx:nd.position.x,cy:nd.position.y,r:isFocal?3.8:2.5,fill:color}));
  gr.append(svg('text',{x:nd.position.x,y:nd.position.y+r+16,'class':'ec-graph-label','font-size':isFocal?11:9.5},nd.shortName||nd.name.slice(0,7)));
  if(pending)gr.append(svg('text',{x:nd.position.x,y:nd.position.y-r-8,'font-size':9,'text-anchor':'middle',fill:'#93673d'},'待落地'));
  if(nd.closedLine)gr.append(svg('text',{x:nd.position.x,y:nd.position.y-r-8,'font-size':9,'text-anchor':'middle',fill:'#9b3541'},'产线退出'));
  gr.onclick=()=>setInspect('node',nd.id);
  gr.onkeydown=ev=>{if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();setInspect('node',nd.id);}};
  host.append(gr);
 });
}
function renderSources(){
 const host=$('ec-sources');host.replaceChildren();
 const c=app.c;
 for(const sid of c.source_ids||[]){
  const s=app.sourceMap.get(sid);if(!s)continue;
  const url=sourceUrl(s.url),a=n(url?'a':'div');
  if(url){a.href=url;a.target='_blank';a.rel='noopener noreferrer';}
  a.textContent=s.title||sid;
  a.append(n('small',null,(s.publisher||'来源待核验')+' · '+(s.published_at||'日期未登记')));
  host.append(a);
 }
 if(!host.children.length)host.append(n('div','ed-note','本条暂无可打开的来源记录，不能据此断定现实关系成立。'));
}
async function boot(){
 if(!Model){$('ec-error').textContent='图谱模块未加载，当前无法展示可信结构。';$('ec-error').hidden=false;return;}
 try{
  const [e,c,s]=await Promise.all([read('relationship-evidence-v1'),read('relationship-changes-v1'),read('relationship-sources-v1')]);
  Model.validate(e,c);app.evidence=e;app.changes=c;app.sources=s;app.sourceMap=new Map(s.sources.map(src=>[src.source_id,src]));
  txt('ec-total',c.changes.length);txt('ec-nodes',e.nodes.length);txt('ec-edges',e.edges.length);
  txt('ec-snapshot-date','快照：'+String(c.generated_at||e.generated_at||'日期未注明'));txt('ec-snapshot-count','收录'+c.changes.length+'处结构变化');
  const params=new URLSearchParams(location.search),hash=new URLSearchParams(location.hash.slice(1));
  const id=hash.get('change')||params.get('change');
  select(c.changes.some(x=>x.change_id===id)?id:'C004',false);
 }catch(e){const b=$('ec-error');b.textContent='数据包读取或核验失败：'+String(e.message)+ '。本页不使用虚构网络替代。';b.hidden=false;}
}
document.querySelectorAll('#ec-filters button').forEach(b=>b.onclick=()=>{
 app.filter=b.dataset.filter;
 document.querySelectorAll('#ec-filters button').forEach(x=>{const on=x===b;x.classList.toggle('is-active',on);x.setAttribute('aria-pressed',String(on));});
 if(app.changes)renderFeed();
});
$('ec-search').addEventListener('input',ev=>{app.search=ev.target.value.trim().toLowerCase();if(app.changes)renderFeed();});
window.addEventListener('hashchange',()=>{
 const params=new URLSearchParams(location.hash.slice(1)),c=params.get('change');
 if(c&&c!==app.c?.change_id)select(c,false);
});
boot();
})();