/* BOLUO / Five-Scene World v3
 * A single, evidence-aware presentation layer. Replaces prior stacked visual experiments.
 * No model, evidence, source, or crawler mutation. Fact -> relation -> context -> contrast.
 */
(function(){
'use strict';
const page=document.body?.getAttribute('data-bl-journey');
if(!['today','town','changes','basic','comparison'].includes(page))return;
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=String(text);return n;};
const btn=(label,cls,fn)=>{const n=el('button',cls,label);n.type='button';if(fn)n.addEventListener('click',fn);return n;};
const SVG='http://www.w3.org/2000/svg';
const svg=(tag,attrs={},text)=>{const n=document.createElementNS(SVG,tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,String(v));if(text!==undefined)n.textContent=String(text);return n;};
const reduce=!!(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);
const scrollToEl=x=>x?.scrollIntoView({behavior:reduce?'auto':'smooth',block:'center'});
const validId=x=>/^C\d{3}$/.test(x||'')?x:'';
const params=new URLSearchParams(location.search),hash=new URLSearchParams(location.hash.slice(1));
const ctx={topic:(params.get('topic')||'').slice(0,120),town:(params.get('town')||'').slice(0,60),change:validId(hash.get('change')||params.get('change'))};
let notify=()=>{};
function flash(n){if(!n||reduce||!n.animate)return;n.animate([{boxShadow:'0 0 0 0 rgba(187,78,96,.34)'},{boxShadow:'0 0 0 15px rgba(187,78,96,0)'}],{duration:710});}
function observe(host,fn){
 if(!host||!window.MutationObserver)return;
 let pending=false;
 new MutationObserver(()=>{if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;fn();});}).observe(host,{childList:true});
}
function contextName(){
 if(ctx.change)return ['结构事件 '+ctx.change,'事件有独立收录记录；与今日话题或镇街观察不自动视为同一事实'];
 if(ctx.town)return ['镇街线索 · '+ctx.town,'生活观察不等于已经证实一条产业关系'];
 if(ctx.topic)return ['公开话题 · '+ctx.topic,'这是一条观察线索，尚未证明与结构事件属于同一因果链'];
 return ['从一条真实变化开始','先发现线索，再核对关系与证据'];
}
function shareUrl(){return location.href;}
function linkWithState(a){
 const href=a.getAttribute('href');if(!href||href.startsWith('#')||/^(mailto:|tel:|javascript:)/i.test(href))return;
 let to;try{to=new URL(href,location.href);}catch{return;}
 if(to.origin!==location.origin)return;
 const file=to.pathname.split('/').pop(),targets=['index-legacy-2026-11-03.html','town.html','industry-changes.html','who.html','relation-compare.html'];
 if(!targets.includes(file))return;
 if(file==='industry-changes.html'||file==='who.html'||file==='relation-compare.html'){
  if(ctx.topic&&!to.searchParams.has('topic'))to.searchParams.set('topic',ctx.topic);
  if(ctx.town&&!to.searchParams.has('town'))to.searchParams.set('town',ctx.town);
  if(ctx.change){
   if(file==='industry-changes.html')to.hash='change='+ctx.change;
   else to.searchParams.set('change',ctx.change);
  }
 }
 // For first two pages, do not auto-assert a structural event association.
 if(file==='town.html'&&ctx.topic&&!to.searchParams.has('topic'))to.searchParams.set('topic',ctx.topic);
 a.href=to.href;
}
document.addEventListener('click',ev=>{
 const a=ev.target.closest?.('a[href]');if(a)linkWithState(a);
},true);
function makeRibbon(){
 const nav=$('#bl-journey-bar');if(!nav)return;
 const ribbon=el('section','v3-story-ribbon');
 ribbon.setAttribute('aria-label','跨页面观察线索');const mark=el('div','v3-story-mark');
 mark.append(el('span','v3-live-pip'),el('span',null,'正在追踪 / FOLLOW THE SIGNAL'));
 const info=el('div','v3-story-info'),heading=el('strong'),sub=el('span');
 info.append(heading,sub);
 const actions=el('div','v3-story-actions');
 const share=btn('分享当前观察','v3-ghost',async()=>{
  const text=shareUrl();
  try{
   if(navigator.share){await navigator.share({title:'博罗结构变化观察',url:text});return;}
   if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(text);share.textContent='链接已复制';return;}
   share.textContent='请复制地址栏链接';
  }catch(e){if(e.name!=='AbortError')share.textContent='请复制地址栏链接';}
 });
 const next=el('a','v3-story-next','继续追踪 →');next.href='industry-changes.html?from=today';
 actions.append(share,next);ribbon.append(mark,info,actions);
 nav.insertAdjacentElement('afterend',ribbon);
 const nextByPage={today:'industry-changes.html?from=today',town:'industry-changes.html?from=town',changes:'who.html?from=changes',basic:'relation-compare.html?from=basic',comparison:'industry-changes.html?from=comparison'};
 const txtByPage={today:'03 · 观察产业变化 →',town:'03 · 追问结构变化 →',changes:'04 · 核对县域底盘 →',basic:'05 · 查看前后关系 →',comparison:'返回 03 · 继续探索 →'};
 notify=()=>{
  const [name,limitation]=contextName();heading.textContent=name;sub.textContent=limitation;
  next.textContent=txtByPage[page];next.href=nextByPage[page];
  linkWithState(next);
  ribbon.classList.toggle('v3-has-structural-event',!!ctx.change);
 };
 notify();
}
makeRibbon();
document.addEventListener('bl:change-selected',ev=>{if(validId(ev.detail?.changeId)){ctx.change=ev.detail.changeId;notify();}});
document.addEventListener('bl:compare-selected',ev=>{if(validId(ev.detail?.changeId)){ctx.change=ev.detail.changeId;notify();}});
function initToday(){
 const cards=$('#topicList'),hero=$('.bl-home-hero'),nativeFeed=$('#bl-live-brief');
 if(!cards||!hero||!nativeFeed)return;
 document.body.classList.add('v3-world');
 const consoleBox=el('section','v3-news-console');consoleBox.id='v3-news-console';
 consoleBox.append(el('div','v3-console-ey','PUBLIC SIGNALS / 可查的公开线索'));
 const showcase=el('div','v3-current-topic');
 const h=el('strong','v3-current-title','加载今日公开资料…');
 const m=el('span','v3-current-meta','按当前数据快照，不冒充实时监测');
 showcase.append(h,m);
 const list=el('div','v3-topic-list');const actions=el('div','v3-topic-actions');
 const locate=btn('展开这条新闻','v3-action-light',()=>focusCard());
 const follow=el('a','v3-action-hot','沿此线索追问关系 →');follow.href='industry-changes.html?from=today';
 actions.append(locate,follow);consoleBox.append(showcase,list,actions);
 nativeFeed.insertAdjacentElement('afterend',consoleBox);
 let current=-1,records=[];
 function focusCard(){
  const r=records[current];if(!r)return;
  $$('.tcard.v3-news-selected',cards).forEach(x=>x.classList.remove('v3-news-selected'));
  r.card.classList.add('v3-news-selected');
  const detail=$('.detail',r.card);if(detail)detail.style.display='block';
  scrollToEl(r.card);flash(r.card);
 }
 function choose(i){
  if(!records[i])return;
  current=i;const r=records[i];ctx.topic=r.title;
  h.textContent=r.title;m.textContent=r.category+' · '+r.status+' · 资料以实际快照为准';
  follow.href='industry-changes.html?from=today&topic='+encodeURIComponent(r.title);
  $$('button',list).forEach((x,j)=>x.setAttribute('aria-pressed',String(i===j)));
  notify();
 }
 function render(){
  const raw=$$('.tcard',cards).slice(0,4);
  if(!raw.length){list.replaceChildren(el('p','v3-empty','当前话题数据不可用，请使用下方重新扫描。'));return;}
  const old=records[current]?.title||ctx.topic;
  records=raw.map((card,i)=>{
   const title=(card.getAttribute('data-t')||'').trim();
   const meta=(card.firstElementChild?.textContent||'');
   return {card,title,category:(meta.match(/产业|民生|城市|农业|文旅/)||['公开话题'])[0],status:meta.includes('待核实')?'待核实':meta.includes('已核验')?'已核验':'来源待核',i};
  });
  list.replaceChildren();
  records.forEach((r,i)=>{
   const b=btn('', 'v3-topic-option',()=>choose(i));b.setAttribute('aria-pressed',String(i===current));
   b.append(el('span','v3-topic-index',String(i+1).padStart(2,'0')),el('span','v3-topic-text',r.title),el('small',null,r.status));list.append(b);
  });
  const x=records.findIndex(x=>x.title===old);choose(x>=0?x:0);
 }
 observe(cards,render);render();
}
function initTown(){
 const scan=$('.scan'),grid=$('#grid');if(!scan||!grid)return;
 document.body.classList.add('v3-world');
 const arena=el('section','v3-town-arena');arena.setAttribute('aria-label','可点亮16镇街的探索舞台');
 const intro=el('div','v3-arena-head');
 const copy=el('div');copy.append(el('span','v3-mini-kicker','02 / EXPLORE · 小镇有自己的节奏'),el('h2','v3-arena-title','点一个镇，今晚去哪？'));
 const controls=el('div','v3-town-controls');
 const modeEat=btn('寻味','v3-choice',()=>setMood('eat')),modePlay=btn('看山水','v3-choice',()=>setMood('play'));
 const modePick=btn('只看今日三站','v3-choice',()=>{onlyPicks=!onlyPicks;modePick.setAttribute('aria-pressed',String(onlyPicks));renderCells();});
 controls.append(modeEat,modePlay,modePick);intro.append(copy,controls);
 const layout=el('div','v3-town-layout'),board=el('div','v3-town-board'),focus=el('aside','v3-town-focus');
 const over=el('div','v3-town-overline','TOWN SIGNAL / 非地图');
 const focusName=el('h3','v3-town-name','正在读取镇街资料');
 const focusText=el('p','v3-town-story','点亮一个镇，查看真实公开资料。');
 const stats=el('div','v3-town-stats'),food=el('div','v3-town-fact'),play=el('div','v3-town-fact'),extra=el('div','v3-town-fact');
 const find=btn('看完整吃玩介绍 →','v3-action-hot',()=>{
  const t=towns.find(x=>x.name===active);if(!t)return;
  $$('.town.v3-town-active',grid).forEach(x=>x.classList.remove('v3-town-active'));
  t.element.classList.add('v3-town-active');flash(t.element);scrollToEl(t.element);
 });
 const next=el('a','v3-action-quiet','从这个镇，继续追问产业变化 →');next.href='industry-changes.html?from=town';
 stats.append(food,play,extra);focus.append(over,focusName,focusText,stats,find,next);
 layout.append(board,focus);arena.append(intro,layout,el('p','v3-arena-note','这是16镇街的探索界面，不是实际地图、距离、交通路线或商业连接；今日三站是随机推荐，不是客流排名。'));
 scan.insertAdjacentElement('afterend',arena);
 let towns=[],active='',mood='eat',onlyPicks=false;
 function setMood(v){mood=v;modeEat.setAttribute('aria-pressed',String(v==='eat'));modePlay.setAttribute('aria-pressed',String(v==='play'));updateFocus();}
 function select(name){if(!towns.some(x=>x.name===name))return;active=name;ctx.town=name;renderCells();updateFocus();notify();}
 function updateFocus(){
  const t=towns.find(x=>x.name===active);if(!t)return;
  focusName.textContent=t.name;
  focusText.textContent=mood==='eat'?'先从这里的食物和街巷认识它。':'看看这里的山水、游玩与日常生活。';
  food.replaceChildren(el('b',null,'吃什么'),el('span',null,t.eat||'资料待补充'));
  play.replaceChildren(el('b',null,'玩什么'),el('span',null,t.play||'资料待补充'));
  extra.replaceChildren(el('b',null,'公开打卡关注档'),el('span',null,t.popularity+' · 不是真实实时人数'));
  next.href='industry-changes.html?from=town&town='+encodeURIComponent(t.name);
 }
 function renderCells(){
  board.replaceChildren();
  towns.forEach((t,i)=>{
   const b=btn('', 'v3-town-cell',()=>select(t.name));
   const on=t.name===active;
   b.classList.toggle('is-active',on);
   b.classList.toggle('is-muted',onlyPicks&&!t.picked);
   b.setAttribute('aria-pressed',String(on));
   b.append(el('span','v3-town-number',String(i+1).padStart(2,'0')),el('strong',null,t.name),el('span','v3-town-spark',t.picked?'今日推荐':'查看资料'));
   board.append(b);
  });
 }
 function read(){
  towns=$$('.town',grid).map((element,i)=>{
   const name=$('.n',element)?.textContent?.trim()||'镇街'+(i+1);
   const rows=$$('.row',element).map(x=>x.textContent.trim().replace(/^[^\u4e00-\u9fa5]+/u,''));
   const m=element.textContent.match(/人气\s*[·：:]\s*(高|较高|中)/);
   return {name,element,eat:(rows[0]||'').replace(/^吃\s*/,''),play:(rows[1]||'').replace(/^玩\s*/,''),popularity:m?.[1]||'请查阅来源',picked:element.classList.contains('pick')};
  });
  if(!towns.length){board.textContent='正在读取公开资料…';return;}
  if(!towns.some(x=>x.name===active))active=towns.find(x=>x.name===ctx.town)?.name||towns.find(x=>x.picked)?.name||towns[0].name;
  renderCells();updateFocus();
 }
 setMood('eat');observe(grid,read);read();
}
const readModel=()=>{
 if(!window.BoluoCompareModel)return Promise.reject(Error('对照模块未加载'));
 const base='data/relationship-';
 return Promise.all(['evidence-v1','changes-v1','sources-v1'].map(s=>fetch(base+s+'.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('HTTP '+r.status);return r.json();})))
  .then(([a,b,c])=>({a,b,c}));
};
const edgeText=e=>{
 if(e.after==='hypothesis')return '待验证联系';
 if(e.after==='construction')return '施工／未通车';
 if(e.after==='inferred')return '间接证据';
 if(e.after==='closed')return '生产线退出';
 if(e.before==='absent'&&e.after==='recorded')return '新增记录';
 if(e.after==='related')return '事件相关';
 return '公开关联';
};
const truncate=(s,n)=>String(s||'').length>n?String(s).slice(0,n-1)+'…':String(s||'');
function taggedLayer(host,edges,selector,positionFn){
 host.querySelector('.v3-annotations')?.remove();
 const overlay=svg('g',{'class':'v3-annotations','aria-hidden':'true'}),used=[];
 edges.filter(x=>x.focus&&x.before!==x.after).slice(0,3).forEach((edge,i)=>{
  const g=host.querySelector(selector+'[data-edge="'+edge.id+'"]');
  const line=g?.querySelector('line:not([stroke="transparent"])');if(!line)return;
  const coord=positionFn(line);
  if(!coord)return;
  const msg=truncate(edgeText(edge),9),w=msg.length*12+20;
  const candidates=[[coord.x,coord.y-19],[coord.x,coord.y+29],[coord.x-70,coord.y-26],[coord.x+70,coord.y+25]];
  const pt=candidates.find(([x,y])=>x>w/2+6&&x<600-w/2-6&&y>24&&y<398&&!used.some(p=>Math.abs(p.x-x)<(p.w+w)/2+7&&Math.abs(p.y-y)<27));
  if(!pt)return;
  used.push({x:pt[0],y:pt[1],w});
  const type=edge.after==='hypothesis'||edge.after==='construction'||edge.after==='inferred'?'is-uncertain':'is-confirmed';
  const tag=svg('g',{class:'v3-edge-tag '+type,transform:'translate('+pt[0]+' '+pt[1]+')'});
  tag.append(svg('rect',{x:-w/2,y:-13,width:w,height:25,rx:8}),svg('text',{y:4,'text-anchor':'middle'},msg));
  overlay.append(tag);
 });
 if(overlay.childNodes.length)host.append(overlay);
}
function initChanges(){
 const graph=$('#ec-graph'),pane=$('.ec-graph-panel'),frame=$('.ec-graph-wrap');if(!graph||!pane||!frame)return;
 document.body.classList.add('v3-world');
 const dock=el('section','v3-graph-dock'),left=el('div','v3-dock-copy'),head=el('strong',null,'变化观察台'),
 sub=el('span',null,'选事件，网络会指向已收录的关键联系。');
 left.append(head,sub);
 const right=el('div','v3-dock-actions');
 const isolate=btn('只看本次变化','v3-switch',()=>{isolateMode=!isolateMode;isolate.setAttribute('aria-pressed',String(isolateMode));graph.classList.toggle('v3-only-change',isolateMode);});
 const replay=btn('播放变化','v3-action-hot',()=>pulse());
 const restore=btn('恢复布局','v3-switch',()=>{positions.delete(ctx.change);applyDrag();annotate();});
 isolate.setAttribute('aria-pressed','false');right.append(isolate,replay,restore);dock.append(left,right);
 frame.insertAdjacentElement('beforebegin',dock);
 const cards=el('div','v3-relation-cards');frame.insertAdjacentElement('afterend',cards);
 const note=el('p','v3-graph-note','连线标注来自已收录事件与证据等级。位置是结构示意而非地图；签约、施工、推断不等于实际交易或已投产。');
 cards.insertAdjacentElement('afterend',note);
 let data=null,pack=null,queued=false,isolateMode=false,suppress=false,drag=null;
 const positions=new Map();
 function build(){
  if(!pack||!validId(ctx.change))return null;
  try{return window.BoluoCompareModel.build(pack.a,pack.b,pack.c,ctx.change);}catch{return null;}
 }
 function annotate(){
  if(!data||!graph.querySelector('.ec-graph-node'))return;
  const changed=new Set(data.selectedEdges.filter(e=>e.before!==e.after).map(e=>e.id));
  const touched=new Set();
  data.edges.filter(e=>changed.has(e.id)).forEach(e=>{touched.add(e.source);touched.add(e.target);});
  $$('.ec-graph-edge',graph).forEach(g=>g.classList.toggle('v3-event-edge',changed.has(g.dataset.edge)));
  $$('.ec-graph-node',graph).forEach(g=>g.classList.toggle('v3-event-node',touched.has(g.dataset.node)));
  applyDrag();
  taggedLayer(graph,data.selectedEdges,'.ec-graph-edge',line=>({
   x:(Number(line.getAttribute('x1'))+Number(line.getAttribute('x2')))/2,
   y:(Number(line.getAttribute('y1'))+Number(line.getAttribute('y2')))/2
  }));
 }
 function applyDrag(){
  if(!data)return;
  const offset=positions.get(ctx.change)||new Map();
  const nmap=new Map();
  $$('.ec-graph-node',graph).forEach(g=>{
   const c=g.querySelector('circle');if(!c)return;
   const xy={x:Number(c.getAttribute('cx')),y:Number(c.getAttribute('cy'))},d=offset.get(g.dataset.node)||{x:0,y:0};
   nmap.set(g.dataset.node,{x:xy.x+d.x,y:xy.y+d.y});
   g.setAttribute('transform','translate('+d.x+' '+d.y+')');
  });
  const emap=new Map(data.edges.map(e=>[e.id,e]));
  $$('.ec-graph-edge',graph).forEach(g=>{
   const e=emap.get(g.dataset.edge);if(!e)return;
   const a=nmap.get(e.source),b=nmap.get(e.target);if(!a||!b)return;
   $$('line',g).forEach(l=>{l.setAttribute('x1',a.x);l.setAttribute('y1',a.y);l.setAttribute('x2',b.x);l.setAttribute('y2',b.y);});
  });
 }
 function paint(){
  if(!data)return;
  head.textContent=ctx.change+' · '+truncate(data.event.title,26);
  sub.textContent='本事件涉及 '+data.nodes.filter(x=>x.affected).length+' 个明确主体、'+data.selectedEdges.length+' 条关联记录；不等于全部有实质变化。';
  cards.replaceChildren();
  const meaningful=data.selectedEdges.filter(e=>e.before!==e.after);
  const focused=meaningful.length?meaningful:data.selectedEdges;
  focused.slice(0,5).forEach(e=>{
   const n=id=>data.nodes.find(x=>x.id===id)?.shortName||id;
   const b=btn('','v3-relation-card',()=>{
    const target=graph.querySelector('.ec-graph-edge[data-edge="'+e.id+'"]');
    target?.dispatchEvent(new MouseEvent('click',{bubbles:true}));
    flash($('.ec-inspector'));scrollToEl($('.ec-inspector'));
   });
   b.append(el('small',null,edgeText(e)+' · '+(e.grade||'证据待核对')+'级'),el('strong',null,n(e.source)+' → '+n(e.target)),el('span',null,truncate(e.label,52)));
   cards.append(b);
  });
  if(!focused.length)cards.append(el('span','v3-empty','此次记录没有明确的新增或退出关系；请查看主体状态及来源。'));
  annotate();
 }
 function sync(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;annotate();});}
 observe(graph,()=>{if(!graph.querySelector('.v3-annotations'))sync();});
 document.addEventListener('bl:change-selected',()=>{
  data=build();paint();if(data)pulse();
 });
 function pulse(){
  if(reduce)return;
  graph.classList.remove('v3-revealing');void graph.getBoundingClientRect();graph.classList.add('v3-revealing');
  window.setTimeout(()=>graph.classList.remove('v3-revealing'),1400);
 }
 function coord(ev){
  const point=graph.createSVGPoint();point.x=ev.clientX;point.y=ev.clientY;
  const m=graph.getScreenCTM();return m?point.matrixTransform(m.inverse()):{x:0,y:0};
 }
 graph.addEventListener('pointerdown',ev=>{
  if(ev.button!==0)return;const target=ev.target.closest?.('.ec-graph-node');
  if(!target||!graph.contains(target))return;
  const orig=coord(ev),offset=positions.get(ctx.change)?.get(target.dataset.node)||{x:0,y:0};
  drag={pid:ev.pointerId,node:target.dataset.node,start:orig,base:offset,moved:false};
 });
 window.addEventListener('pointermove',ev=>{
  if(!drag||ev.pointerId!==drag.pid||!data)return;
  const p=coord(ev);if(!drag.moved&&Math.hypot(p.x-drag.start.x,p.y-drag.start.y)<7)return;
  drag.moved=true;
  const map=positions.get(ctx.change)||new Map();
  map.set(drag.node,{x:drag.base.x+p.x-drag.start.x,y:drag.base.y+p.y-drag.start.y});
  positions.set(ctx.change,map);annotate();
 });
 function finish(ev){
  if(!drag||ev.pointerId!==drag.pid)return;
  if(drag.moved){suppress=true;window.setTimeout(()=>{suppress=false;},180);}
  drag=null;
 }
 window.addEventListener('pointerup',finish);window.addEventListener('pointercancel',finish);
 graph.addEventListener('click',ev=>{if(suppress){ev.stopImmediatePropagation();ev.preventDefault();suppress=false;}},true);
 graph.addEventListener('click',()=>requestAnimationFrame(annotate));
 readModel().then(x=>{
  pack=x;
  const first=validId($('#ec-detail-id')?.textContent)||ctx.change;
  if(first){ctx.change=first;data=build();paint();notify();}
 }).catch(()=>{sub.textContent='关系附加视图未加载，原始事件图与证据仍可使用。';});
}
function initBasic(){
 const kpis=$('.kpis');if(!kpis)return;
 document.body.classList.add('v3-world');
 const lab=el('section','v3-tension-lab');lab.setAttribute('aria-label','2025年工业与投资反方向变化的可操作数据对照');
 const title=el('div','v3-lab-title');
 title.append(el('span','v3-mini-kicker','04 / STRUCTURAL CONTRAST · 真实统计'),el('h2',null,'两个方向，一座千亿工业县'),el('p',null,'点击一个指标，看它提出什么问题。左右横条为同一百分比刻度，不是两项可以相加的冲击。'));
 const content=el('div','v3-lab-body'),bars=el('div','v3-tension-chart'),story=el('aside','v3-tension-story');
 const storyMeta=el('div','v3-tension-overline','你可能忽略了什么'),storyTitle=el('h3'),storyDesc=el('p'),storyLimit=el('div','v3-tension-limitation');
 const see=btn('查看原始统计图 →','v3-action-hot',()=>{flash($('#c5'));scrollToEl($('#c5'));});
 story.append(storyMeta,storyTitle,storyDesc,storyLimit,see);
 content.append(bars,story);lab.append(title,content);
 kpis.insertAdjacentElement('afterend',lab);
 const metrics=[
  {label:'规上工业增加值',n:8.7,trend:'向上',heading:'工业在增长，新增能力从哪里来？',desc:'2025年规上工业增加值同比增长8.7%。它本身不能证明增长完全来自新企业，也不能证明产业链配套已经形成。',limit:'仍需观察：产能利用率、新项目实际投产、上下游订单与就业变化。'},
  {label:'固定资产投资',n:-18.8,trend:'向下',heading:'投资在下降，未来接力棒在哪里？',desc:'2025年固定资产投资同比下降18.8%。它与工业增长同时存在；两个指标的口径不同，不应直接推定增长的原因。',limit:'仍需观察：工业投资、设备更新、建设进度与项目投产时点。'},
  {label:'房地产开发投资',n:-47.6,trend:'显著下降',heading:'地产投资跌得更快，影响如何传导？',desc:'2025年房地产开发投资同比下降47.6%。它属于固定资产投资的一部分，不能与固投下降18.8%直接相加。',limit:'仍需观察：土地、建筑业、财政与居民住房需求之间的实际传导。'}
 ];
 let active=0;
 bars.append(el('div','v3-tension-axis','下降 ←　　　　　　 零线　　　　　　 → 增长'));
 const buttons=[];
 metrics.forEach((r,i)=>{
  const b=btn('','v3-tension-row',()=>select(i));
  const top=el('div','v3-tension-top');top.append(el('strong',null,r.label),el('span',null,(r.n>0?'+':'')+r.n.toFixed(1)+'%'));
  const track=el('div','v3-tension-track'),zero=el('i','v3-zero-line'),fill=el('span','v3-tension-fill '+(r.n>0?'is-up':'is-down'));
  fill.style.width=(Math.min(50,Math.abs(r.n))/50*50)+'%';fill.style.left=r.n>0?'50%':(50-Math.min(50,Math.abs(r.n)))/1+'%';
  track.append(fill,zero);
  b.append(top,track,el('small',null,'2025年同比 · '+r.trend));
  bars.append(b);buttons.push(b);
 });
 function select(i){
  active=i;const r=metrics[i];
  buttons.forEach((b,j)=>b.setAttribute('aria-pressed',String(i===j)));
  storyTitle.textContent=r.heading;storyDesc.textContent=r.desc;storyLimit.textContent=r.limit;
 }
 select(0);
}
function initComparison(){
 const stage=$('.bc-stage'),before=$('#bc-before'),after=$('#bc-after');if(!stage||!before||!after)return;
 document.body.classList.add('v3-world');
 const board=el('section','v3-compare-deck');board.setAttribute('aria-label','按证据状态逐步揭示前后关系变化');
 const top=el('div','v3-compare-top'),titles=el('div');
 titles.append(el('span','v3-mini-kicker','05 / BEFORE → NOW → COMPARE'),el('h2',null,'看见变化，不等于证明影响'));
 const controls=el('div','v3-compare-controls'),play=btn('播放一遍变化','v3-action-hot',()=>replay());
 const modes=['此前','当前','并排'],switches=[];
 let phase=window.matchMedia?.('(max-width:580px)')?.matches?1:2,timers=[];
 modes.forEach((name,i)=>{
  const b=btn(name,'v3-mode',()=>{stop();setPhase(i);});
  controls.append(b);switches.push(b);
 });
 controls.append(play);top.append(titles,controls);
 const summary=el('div','v3-delta-summary','正在读取事件局部关系…');
 const chips=el('div','v3-delta-list');
 const caution=el('p','v3-delta-warning','前后对照是单项事件的局部重建，不是两份完整历史网络快照；签约、在建、待验证联系不自动算成新增供货。');
 board.append(top,summary,chips,caution);
 stage.insertAdjacentElement('beforebegin',board);
 let pack=null,data=null;
 function stop(){timers.forEach(clearTimeout);timers=[];play.disabled=false;play.textContent='播放一遍变化';}
 function setPhase(i){
  phase=i;document.body.classList.remove('v3-phase-before','v3-phase-now','v3-phase-both');
  document.body.classList.add(['v3-phase-before','v3-phase-now','v3-phase-both'][i]);
  switches.forEach((b,j)=>b.setAttribute('aria-pressed',String(i===j)));
  if(window.matchMedia?.('(max-width:580px)')?.matches){
   const b=document.querySelector('[data-bc-view="'+['before','after','both'][i]+'"]');
   if(b)b.click();
  }
  if(i>0&&!reduce){
   after.classList.remove('v3-revealing');void after.getBoundingClientRect();after.classList.add('v3-revealing');
   window.setTimeout(()=>after.classList.remove('v3-revealing'),1350);
  }
 }
 function replay(){
  stop();play.disabled=true;play.textContent='展示进行中…';setPhase(0);
  const speed=reduce?140:780;
  timers.push(setTimeout(()=>setPhase(1),speed));
  timers.push(setTimeout(()=>{setPhase(2);stop();},speed*2.6));
 }
 function show(){
  if(!pack||!validId(ctx.change))return;
  try{data=window.BoluoCompareModel.build(pack.a,pack.b,pack.c,ctx.change);}catch{return;}
  const changed=data.selectedEdges.filter(e=>e.before!==e.after),pending=changed.filter(e=>['hypothesis','inferred','construction'].includes(e.after)).length;
  summary.replaceChildren();
  const facts=[
   ['局部主体',String(data.counts.localNodes)],
   ['事件相关联系',String(data.selectedEdges.length)],
   ['前后状态不同',String(changed.length)],
   ['其中待核实／在建',String(pending)]
  ];
  facts.forEach(([name,value])=>{const box=el('div','v3-delta-number');box.append(el('strong',null,value),el('span',null,name));summary.append(box);});
  chips.replaceChildren();
  const set=changed.length?changed:data.selectedEdges;
  set.slice(0,7).forEach(e=>{
   const n=id=>data.nodes.find(x=>x.id===id)?.shortName||id;
   const b=btn('','v3-delta-chip',()=>{
    const target=after.querySelector('.bc-edge[data-edge="'+e.id+'"]');target?.dispatchEvent(new MouseEvent('click',{bubbles:true}));
    flash($('.bc-focus-panel'));scrollToEl($('.bc-focus-panel'));
   });
   b.append(el('b',null,edgeText(e)+' · '+(e.grade||'待核')+'级'),el('strong',null,n(e.source)+' → '+n(e.target)),el('small',null,truncate(e.label,35)));
   chips.append(b);
  });
  if(!set.length)chips.append(el('span','v3-empty','当前事件没有可列出的重点连接；请继续查看主体及原始证据。'));
  highlight();
 }
 function highlight(){
  if(!data)return;
  const changed=new Set(data.selectedEdges.filter(e=>e.before!==e.after).map(e=>e.id));
  $$('.bc-edge',after).forEach(g=>g.classList.toggle('v3-event-edge',changed.has(g.dataset.edge)));
  $$('.bc-edge',before).forEach(g=>g.classList.toggle('v3-event-edge',changed.has(g.dataset.edge)));
  taggedLayer(after,data.selectedEdges,'.bc-edge',line=>({
   x:(Number(line.getAttribute('x1'))+Number(line.getAttribute('x2')))/2,
   y:(Number(line.getAttribute('y1'))+Number(line.getAttribute('y2')))/2
  }));
 }
 let queued=false;observe(after,()=>{
  if(queued||after.querySelector('.v3-annotations'))return;
  queued=true;requestAnimationFrame(()=>{queued=false;highlight();});
 });
 document.addEventListener('bl:compare-selected',ev=>{
  if(validId(ev.detail?.changeId)){ctx.change=ev.detail.changeId;stop();show();notify();}
 });
 readModel().then(x=>{
  pack=x;ctx.change=validId($('#bc-event-id')?.textContent)||ctx.change||'C004';show();notify();
 }).catch(()=>{summary.textContent='变化附加视图未加载。原有双图、证据与事件选择仍可用。';});
 setPhase(phase);
}
if(page==='today')initToday();
if(page==='town')initTown();
if(page==='changes')initChanges();
if(page==='basic')initBasic();
if(page==='comparison')initComparison();
})();
