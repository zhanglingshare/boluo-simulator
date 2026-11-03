/* 博罗 01—05 动态认知体验层。只读取现有DOM与公开快照的呈现，不修改模型/数据/事实判定。 */
(function(){
'use strict';
const page=document.body&&document.body.getAttribute('data-bl-journey');
if(!/^(today|town|changes|basic|comparison)$/.test(page))return;
const $=id=>document.getElementById(id);
const make=(tag,cls,txt)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(txt!=null)e.textContent=String(txt);return e;};
const reduce=!!(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);
const svgNS='http://www.w3.org/2000/svg';
const svg=(tag,props,text)=>{const e=document.createElementNS(svgNS,tag);Object.entries(props||{}).forEach(([k,v])=>e.setAttribute(k,String(v)));if(text!=null)e.textContent=String(text);return e;};
function elButton(txt,cls,cb){const x=make('button',cls,txt);x.type='button';x.addEventListener('click',cb);return x;}
function flash(el){if(!el||reduce)return;el.classList.remove('blx-focus-flash');void el.offsetWidth;el.classList.add('blx-focus-flash');}
function listenMutations(host,fn,deep){
 if(!host||typeof MutationObserver==='undefined')return;
 let queued=false;
 const observer=new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;fn();});});
 observer.observe(host,{childList:true,subtree:!!deep});
}
function entryMotion(){
 if(reduce||typeof IntersectionObserver==='undefined')return;
 const selectors=page==='today'?'#topicList .tcard,.bl-home-hero':page==='town'?'.town,.scan':page==='basic'?'.kpi,.card':page==='changes'?'.ec-head,.ec-graph-panel,.ec-detail':'.bc-brief,.bc-panel';
 const io=new IntersectionObserver((entries)=>{entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('blx-entered');io.unobserve(e.target);}});},{threshold:.08});
 const seen=new WeakSet();
 function register(){document.querySelectorAll(selectors).forEach(e=>{if(!seen.has(e)){seen.add(e);io.observe(e);}});}
 register();
 if(page==='today'||page==='town'){
  const host=$(page==='today'?'topicList':'grid');
  listenMutations(host,register);
 }
}
function initToday(){
 const hero=document.querySelector('.bl-home-hero'),feed=$('topicList');
 if(!hero||!feed)return;
 const stage=make('section','blx-signal-deck');
 stage.setAttribute('aria-label','三条公开观察线索交互选择');
 const main=make('div','blx-signal-main');
 const k=make('div','blx-eyebrow','01 / TODAY · 从事实进入变化');
 const title=make('h2','blx-shell-title','今天，先追哪条线索？');
 const current=make('div','blx-signal-current');
 current.append(make('i','blx-pulse-dot'),make('span',null,'读取公开话题中'));
 const big=make('div','blx-signal-headline','正在等待公开话题快照…');
 big.setAttribute('aria-live','polite');
 const note=make('p','blx-sub','点击右侧线索，展开对应公开报道；线索与结构变化不会被自动认作同一事实。');
 const actions=make('div','blx-signal-cta');
 const focus=elButton('展开这条线索','blx-plain',()=>focusCard());
 const follow=make('a','blx-primary','沿这条线索看产业变化 →');
 follow.href='industry-changes.html?from=today';
 actions.append(focus,follow);main.append(k,title,current,big,note,actions);
 const side=make('div','blx-signal-side');
 side.append(make('div','blx-eyebrow','可切换的真实线索'));
 const picks=make('div');picks.style.display='contents';side.append(picks);
 stage.append(main,side);
 hero.insertAdjacentElement('afterend',stage);
 let index=0,cards=[];
 function focusCard(){
  const c=cards[index];if(!c)return;
  feed.querySelectorAll('.tcard.blx-is-focused').forEach(e=>e.classList.remove('blx-is-focused'));
  c.classList.add('blx-is-focused');
  const detail=c.querySelector('.detail');if(detail)detail.style.display='block';
  flash(c);c.scrollIntoView({behavior:reduce?'auto':'smooth',block:'center'});
 }
 function repaint(){
  const found=[...feed.querySelectorAll('.tcard')].slice(0,3);
  if(!found.length){
   cards=[];picks.replaceChildren(make('span','blx-sub','公开话题未加载；可使用原页面「重新扫描」。'));
   big.textContent='公开话题暂不可用';focus.disabled=true;return;
  }
  const previous=cards[index]?.getAttribute('data-t');
  cards=found;
  const oldIndex=cards.findIndex(c=>c.getAttribute('data-t')===previous);
  index=oldIndex<0?0:oldIndex;focus.disabled=false;
  picks.replaceChildren();
  cards.forEach((c,i)=>{
   const title=c.getAttribute('data-t')||'未命名观察线索';
   const b=elButton('','blx-slot',()=>{
    index=i;updateSelected();flash(stage);
   });
   b.setAttribute('aria-pressed',String(i===index));
   b.append(make('b','blx-mono',String(i+1).padStart(2,'0')),make('span',null,title));
   picks.append(b);
  });
  updateSelected();
 }
 function updateSelected(){
  const c=cards[index];if(!c)return;
  const title=c.getAttribute('data-t')||'公开观察线索';
  big.textContent=title;
  const meta=c.querySelector(':scope > div')?.textContent||'来源情况见原话题卡';
  const state=meta.includes('待核实')?'待核实':meta.includes('已核验')?'已核验':'来源状态见原话题卡';
  current.querySelector('span').textContent='当前选择 · '+state;
  follow.href='industry-changes.html?from=today&topic='+encodeURIComponent(title);
  [...picks.querySelectorAll('button')].forEach((b,i)=>b.setAttribute('aria-pressed',String(i===index)));
 }
 listenMutations(feed,repaint);repaint();
}
function initTown(){
 const scan=document.querySelector('.scan'),grid=$('grid');
 if(!scan||!grid)return;
 const stage=make('section','blx-town-route');stage.setAttribute('aria-label','可点击的三镇探索路线');
 const head=make('div','blx-route-head');
 const lhs=make('div');
 lhs.append(make('div','blx-eyebrow','02 / EXPLORE · 三站随手选'),make('h2','blx-shell-title','今天先走这三站'));
 const rhs=make('div','blx-route-actions');
 const rechoose=elButton('再换三个镇','blx-primary',()=>{$('btnScan')?.click();flash(stage);});
 const share=elButton('分享各镇入口','blx-plain',async()=>{
  const url=location.origin+location.pathname;
  if(navigator.share){try{await navigator.share({title:'博罗各镇好吃好玩',url});return;}catch(e){if(e.name==='AbortError')return;}}
  try{if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(url);share.textContent='入口链接已复制';}}
  catch(e){share.textContent='请从地址栏分享';}
 });
 rhs.append(rechoose,share);head.append(lhs,rhs);
 const stops=make('div','blx-stops');stops.setAttribute('aria-live','polite');
 const foot=make('p','blx-route-foot','三站来自本页镇街资料的随机推荐，并非真实交通路线、热度排名或实测行程。点击一站可定位完整吃玩介绍。');
 stage.append(head,stops,foot);scan.insertAdjacentElement('afterend',stage);
 function repaint(){
  const found=[...grid.querySelectorAll('.town.pick')];
  if(!found.length){stops.replaceChildren(make('div','blx-sub','正在读取镇街资料…'));return;}
  stops.replaceChildren();
  found.forEach((c,i)=>{
   const name=c.querySelector('.n')?.textContent||'镇街';
   const rows=[...c.querySelectorAll('.row')].map(x=>x.textContent.trim());
   const b=elButton('','blx-stop',()=>{
    grid.querySelectorAll('.town.blx-is-focused').forEach(x=>x.classList.remove('blx-is-focused'));
    c.classList.add('blx-is-focused');flash(c);c.scrollIntoView({behavior:reduce?'auto':'smooth',block:'center'});
   });
   b.append(make('span','blx-stop-index',String(i+1)),make('strong','blx-stop-title',name),make('span','blx-stop-desc',rows.join(' · ')));
   stops.append(b);
  });
 }
 listenMutations(grid,repaint);repaint();
}
function labelSvg(host,line,text,kind,offset){
 const x1=Number(line.getAttribute('x1')),x2=Number(line.getAttribute('x2'));
 const y1=Number(line.getAttribute('y1')),y2=Number(line.getAttribute('y2'));
 if(![x1,x2,y1,y2].every(Number.isFinite))return;
 const x=Math.max(62,Math.min(538,(x1+x2)/2));
 const y=Math.max(22,Math.min(380,(y1+y2)/2-17-offset*22));
 const w=12*text.length+17;
 const group=svg('g',{'class':'blx-svg-label '+kind,transform:'translate('+x+' '+y+')'});
 group.append(svg('rect',{x:-w/2,y:-12,width:w,height:22,rx:5}));
 group.append(svg('text',{x:0,y:3},text));host.append(group);
}
function graphPulse(target){
 if(!target||reduce)return;
 target.classList.remove('blx-graph-playing');
 void target.getBoundingClientRect();
 target.classList.add('blx-graph-playing');
 window.setTimeout(()=>target.classList.remove('blx-graph-playing'),1300);
}
function initChanges(){
 const panel=document.querySelector('.ec-graph-panel'),graph=$('ec-graph');
 if(!panel||!graph)return;
 const lens=make('div','blx-change-lens');
 const lhs=make('div','blx-lens-copy');
 const title=make('b',null,'变化透镜 · 选一件事，看一组联系');
 const desc=make('span',null,'红色为事件相关记录；棕色虚线为施工、估算或待验证。');
 lhs.append(title,desc);
 const actions=make('div','blx-lens-actions');
 const replay=elButton('重放连线变化','blx-primary',()=>{annotate();graphPulse(graph);});
 const proof=elButton('查看证据','blx-plain',()=>document.querySelector('.ec-detail')?.scrollIntoView({behavior:reduce?'auto':'smooth',block:'start'}));
 actions.append(replay,proof);lens.append(lhs,actions);
 panel.querySelector('.ec-graph-wrap').insertAdjacentElement('beforebegin',lens);
 let busy=false,queued=false;
 function annotate(){
  if(busy||!graph.querySelector('.ec-graph-node'))return;
  busy=true;
  graph.querySelector('.blx-svg-annotations')?.remove();
  graph.querySelectorAll('.blx-edge-line').forEach(e=>e.classList.remove('blx-edge-line'));
  const layer=svg('g',{'class':'blx-svg-annotations','aria-hidden':'true'});
  const focus=[...graph.querySelectorAll('.ec-graph-edge')].map(g=>({g,line:g.querySelector('.ec-line-visible')})).filter(x=>x.line&&Number(x.line.getAttribute('stroke-width'))>=2.6);
  focus.slice(0,2).forEach((x,i)=>{
   const color=x.line.getAttribute('stroke')||'';
   const uncertain=color.toLowerCase()==='#b78a52';
   x.line.classList.add('blx-edge-line');
   labelSvg(layer,x.line,uncertain?'待确认联系':'事件相关变化',uncertain?'is-uncertain':'is-changed',i);
  });
  if(layer.childNodes.length)graph.append(layer);
  busy=false;
 }
 function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;annotate();});}
 if(typeof MutationObserver!=='undefined'){
  new MutationObserver(()=>{if(!busy&&!graph.querySelector('.blx-svg-annotations'))schedule();}).observe(graph,{childList:true});
 }
 graph.addEventListener('click',schedule);graph.addEventListener('keyup',schedule);
 document.addEventListener('bl:change-selected',e=>{
  const c=e.detail?.changeId||'';
  title.textContent=c+' · 变化透镜';
  desc.textContent=($('ec-event-status')?.textContent||'')+'。只高亮本事件局部关系，不代表已产生经济因果。';
  schedule();requestAnimationFrame(()=>graphPulse(graph));
 });
 schedule();
}
function initBasic(){
 const kpis=document.querySelector('.kpis');if(!kpis)return;
 const stage=make('section','blx-signal-lab');
 stage.setAttribute('aria-label','2025年三项同比变化的交互对照');
 const head=make('div','blx-lab-head');
 const headL=make('div');
 headL.append(make('div','blx-eyebrow','04 / CONTRAST · 同年三信号'),make('h2','blx-lab-title','工业向上，投资向下'));
 const hint=make('p','blx-sub','三项都为2025年同比变化率，指标不同，不代表彼此存在因果。');
 head.append(headL,hint);
 const rateGrid=make('div','blx-rate-grid');
 const insight=make('div','blx-lab-insight');insight.setAttribute('aria-live','polite');
 const footer=make('div','blx-lab-actions');
 footer.append(make('span',null,'横条以 ±50% 为统一显示范围，零线居中。非模型预测。'));
 const jump=elButton('看原始统计图 →','blx-plain',()=>{
  const c=$('c5')?.closest('.card');if(c){flash(c);c.scrollIntoView({behavior:reduce?'auto':'smooth',block:'center'});}
 });
 footer.append(jump);stage.append(head,rateGrid,insight,footer);kpis.insertAdjacentElement('afterend',stage);
 const entries=[
  {name:'规上工业增加值',v:8.7,msg:'工业同比增长8.7%。这是2025年已公布的工业增加值增长，并不证明所有新增项目已经投产。'},
  {name:'固定资产投资',v:-18.8,msg:'固定资产投资同比下降18.8%。投资下降与工业增长同时存在，但不能简单推断未来产能必然下降。'},
  {name:'房地产开发投资',v:-47.6,msg:'房地产开发投资同比下降47.6%。它是固定资产投资的组成部分，两者不能相加，也不是两项独立冲击。'}
 ];
 const buttons=[];
 entries.forEach((r,i)=>{
  const b=elButton('','blx-rate'+(r.v>0?' is-positive':''),
   ()=>{buttons.forEach(x=>x.setAttribute('aria-pressed','false'));b.setAttribute('aria-pressed','true');insight.textContent=r.msg;flash(b);});
  b.setAttribute('aria-pressed',String(i===0));
  b.append(make('span','blx-rate-name',r.name),make('strong','blx-rate-value blx-mono',(r.v>0?'+':'−')+Math.abs(r.v).toFixed(1)+'%'));
  const bar=make('span','blx-scale'),fill=make('span','blx-scale-fill');
  fill.style.width=(Math.abs(r.v)/50*50)+'%';
  if(r.v>0)fill.style.left='50%';else fill.style.right='50%';
  bar.append(fill);b.append(bar,make('span','blx-rate-note','2025年同比 · 点击读懂'));
  rateGrid.append(b);buttons.push(b);
 });
 insight.textContent=entries[0].msg;
}
function initCompare(){
 const stage=$('bc-after'),before=$('bc-before'),holder=document.querySelector('.bc-stage');
 if(!stage||!before||!holder)return;
 const player=make('section','blx-compare-player');player.setAttribute('aria-label','逐帧播放结构变化');
 const head=make('div','blx-player-head');
 const lhs=make('div');
 lhs.append(make('div','blx-eyebrow','05 / REPLAY · 前后两图同坐标'),make('h2','blx-player-title','一件变化，分三步看清'));
 const replay=elButton('播放结构变化','blx-plain',()=>runReplay());lhs.append();head.append(lhs,replay);
 const steps=make('div','blx-player-steps');
 const foot=make('div','blx-player-foot');
 const summary=make('span',null,'选一项变化，沿“此前 → 当前 → 对照”看见局部结构差异。');
 foot.append(summary,make('span',null,'仅为公开证据局部重建 · 不是历史全网录像'));
 player.append(head,steps,foot);holder.insertAdjacentElement('beforebegin',player);
 const variants=[
  {key:'before',num:'01',text:'先看此前',desc:'从事件描述重建的参考状态'},
  {key:'after',num:'02',text:'揭示当前',desc:'突出已有记录与待验证联系'},
  {key:'both',num:'03',text:'并排核对',desc:'同主体、同位置观察变化'}
 ];
 const buttons={};let phase='both',timers=[];
 function stop(){timers.forEach(t=>clearTimeout(t));timers=[];replay.disabled=false;replay.textContent='播放结构变化';}
 function setPhase(v){
  phase=v;document.body.classList.remove('blx-phase-before','blx-phase-after','blx-phase-both');
  document.body.classList.add('blx-phase-'+v);
  Object.keys(buttons).forEach(k=>buttons[k].setAttribute('aria-pressed',String(k===v)));
  summary.textContent=variants.find(x=>x.key===v).desc+'。' + ($('bc-event-status')?.textContent||'');
  const mobile=window.matchMedia&&window.matchMedia('(max-width:580px)').matches;
  if(mobile){const input=document.querySelector('[data-bc-view="'+v+'"]');if(input)input.click();}
  if(v==='after'||v==='both')graphPulse(stage);
 }
 variants.forEach(x=>{
  const b=elButton('','blx-phase',()=>{stop();setPhase(x.key);});
  b.setAttribute('aria-pressed',String(x.key===phase));
  b.append(make('i','blx-mono',x.num),make('span',null,x.text));steps.append(b);buttons[x.key]=b;
 });
 function runReplay(){
  stop();replay.disabled=true;replay.textContent='正在播放…';
  setPhase('before');
  const delay=reduce?220:850;
  timers.push(setTimeout(()=>setPhase('after'),delay));
  timers.push(setTimeout(()=>{setPhase('both');stop();},delay*2.4));
 }
 let busy=false,queued=false;
 function annotate(){
  if(busy||!stage.querySelector('.bc-node'))return;
  busy=true;
  stage.querySelector('.blx-svg-annotations')?.remove();
  stage.querySelectorAll('.blx-edge-line').forEach(e=>e.classList.remove('blx-edge-line'));
  const layer=svg('g',{'class':'blx-svg-annotations','aria-hidden':'true'});
  const beforeIds=new Set([...before.querySelectorAll('.bc-edge')].map(x=>x.dataset.edge));
  const candidates=[...stage.querySelectorAll('.bc-edge')].map(g=>({g,line:g.querySelector('.bc-edge-visible')}))
   .filter(x=>x.line&&['#a13e47','#b57a40','#9e3035'].includes((x.line.getAttribute('stroke')||'').toLowerCase()))
   .sort((a,b)=>Number(beforeIds.has(a.g.dataset.edge))-Number(beforeIds.has(b.g.dataset.edge)));
  candidates.slice(0,2).forEach((x,i)=>{
   const stroke=(x.line.getAttribute('stroke')||'').toLowerCase(),newEdge=!beforeIds.has(x.g.dataset.edge);
   const uncertain=stroke==='#b57a40',closed=stroke==='#9e3035';
   const label=uncertain?'施工／待核实':closed?'退出／整改':newEdge?'新收录联系':'事件相关联系';
   const kind=uncertain?'is-uncertain':closed?'is-closed':'is-changed';
   x.line.classList.add('blx-edge-line');
   labelSvg(layer,x.line,label,kind,i);
  });
  if(layer.childNodes.length)stage.append(layer);
  busy=false;
 }
 function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;annotate();});}
 if(typeof MutationObserver!=='undefined')new MutationObserver(()=>{if(!busy&&!stage.querySelector('.blx-svg-annotations'))schedule();}).observe(stage,{childList:true});
 stage.addEventListener('click',schedule);stage.addEventListener('keyup',schedule);
 document.addEventListener('bl:compare-selected',()=>{stop();setPhase('both');schedule();});
 setPhase('both');schedule();
}
if(page==='today')initToday();
if(page==='town')initTown();
if(page==='changes')initChanges();
if(page==='basic')initBasic();
if(page==='comparison')initCompare();
window.addEventListener('load',entryMotion,{once:true});
})();
