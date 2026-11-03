/* BOLUO Huicheng-inspired interaction kernel — read-only evidence, active exploration.
 * 02: selectable town constellation (not geographic coordinates);
 * 03: event-linked relation inspector + local node drag with live connected edges;
 * 04: reveal cards drawn from published 2025 statistics;
 * 05: evidence delta shortcuts controlling the existing synchronized pair.
 * No forecast/model/record writes, no invented relationship strength or traffic.
 */
(function(){
'use strict';
const page=document.body?.getAttribute('data-bl-journey')||'';
if(!['town','changes','basic','comparison'].includes(page))return;
const $=s=>document.querySelector(s);
const $all=(s,p=document)=>Array.from(p.querySelectorAll(s));
const h=(tag,cls,txt)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(txt!=null)e.textContent=String(txt);return e;};
const ns='http://www.w3.org/2000/svg';
const sv=(tag,attrs={},txt)=>{const e=document.createElementNS(ns,tag);Object.keys(attrs).forEach(k=>e.setAttribute(k,String(attrs[k])));if(txt!=null)e.textContent=String(txt);return e;};
const reduced=!!(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);
function button(label,cls,cb){const e=h('button',cls,label);e.type='button';if(cb)e.onclick=cb;return e;}
function scheduleObserver(root,fn,subtree=false){
 if(!root||!window.MutationObserver)return;
 let busy=false;
 const o=new MutationObserver(()=>{if(busy)return;busy=true;requestAnimationFrame(()=>{busy=false;fn();});});
 o.observe(root,{childList:true,subtree});
}
function flash(el){if(!el||reduced)return;el.animate([{boxShadow:'0 0 0 0 rgba(169,58,77,.29)'},{boxShadow:'0 0 0 16px rgba(169,58,77,0)'}],{duration:750,iterations:1});}
function townWorld(){
 const grid=$('#grid'),wrap=$('.wrap');if(!grid||!wrap)return;
 const section=h('section','hcx-world');section.setAttribute('aria-label','16镇街交互探索星图，不代表地图位置');
 const hdr=h('div','hcx-world-header'),heading=h('div');
 heading.append(h('div','hcx-kicker','02 / CITY LENS · 镇街感知世界'),h('h2','hcx-title','点亮一个镇，看见它的吃和玩'));
 const modes=h('div','hcx-mode-set');const bs={};
 hdr.append(heading,modes);
 const body=h('div','hcx-world-body'),svgBox=h('div','hcx-town-stage');
 const canvas=sv('svg',{id:'hcx-town-svg',viewBox:'0 0 820 450',role:'img','aria-label':'可点击16镇街的探索星图，排列不代表实际地理位置'});
 svgBox.append(canvas);
 const aside=h('div','hcx-world-aside');
 const sel=h('strong','hcx-selected','读取镇街资料中…');
 const food=h('span'),play=h('span'),recommend=h('span');
 const createFact=(name,content)=>{const x=h('div','hcx-aside-fact');x.append(h('b',null,name),content);return x;};
 const jump=button('看这个镇的完整介绍 →','hcx-focus-btn',()=>{
   const source=towns.find(x=>x.name===selected);
   if(!source)return;
   $all('.town.hcx-card-active',grid).forEach(el=>el.classList.remove('hcx-card-active'));
   source.el.classList.add('hcx-card-active');
   flash(source.el);
   source.el.scrollIntoView({behavior:reduced?'auto':'smooth',block:'center'});
 });
 aside.append(h('div','hcx-kicker','SELECTED TOWN · 真实介绍'),sel,createFact('好吃',food),createFact('好玩',play),createFact('当前公开资料提示',recommend),jump);
 body.append(svgBox,aside);
 const disclaimer=h('div','hcx-disclaimer','星图位置仅用于交互展示，不表示地图方位、交通线路或镇街间真实产业联系；人气档为公开打卡线索分类，不是实时人数。');
 section.append(hdr,body,disclaimer);
 const target=$('.blx-town-route')||$('.scan');target?.insertAdjacentElement('afterend',section);
 let towns=[],selected='',mode='all';
 [['all','看所有镇'],['pick','今日推荐'],['high','较高关注']].forEach(([id,label])=>{
   const b=button(label,'hcx-mode',()=>{mode=id;draw();});b.setAttribute('aria-pressed',String(mode===id));bs[id]=b;modes.append(b);
 });
 function read(){
  towns=$all('.town',grid).map(el=>{
   const name=el.querySelector('.n')?.textContent?.trim()||'镇街';
   const rows=$all('.row',el).map(x=>x.textContent.trim());
   const text=el.textContent||'';
   return {el,name,foods:rows[0]?.replace(/^🍜\s*吃\s*/,'')||'待补充',plays:rows[1]?.replace(/^🏔️\s*玩\s*/,'')||'待补充',level:(text.match(/人气\s*[·：:]\s*(高|较高|中)/)||[])[1]||'见原卡',pick:el.classList.contains('pick')};
  });
  if(towns.length&&!towns.some(x=>x.name===selected))selected=(towns.find(x=>x.pick)||towns[0]).name;
  draw();
 }
 function draw(){
  Object.entries(bs).forEach(([id,b])=>b.setAttribute('aria-pressed',String(id===mode)));
  canvas.replaceChildren();
  if(!towns.length){canvas.append(sv('text',{x:410,y:225,fill:'#b2d5dd','text-anchor':'middle','font-size':17},'正在读取公开镇街快照'));return;}
  const points=[];
  canvas.append(sv('ellipse',{cx:410,cy:225,rx:330,ry:176,'class':'hcx-atlas-ring'}));
  canvas.append(sv('ellipse',{cx:410,cy:225,rx:193,ry:112,'class':'hcx-atlas-ring'}));
  canvas.append(sv('circle',{cx:410,cy:225,r:44,fill:'#27627c',stroke:'#4f9caa','stroke-width':1.5}));
  canvas.append(sv('text',{x:410,y:223,fill:'#e1faff','font-size':18,'font-weight':900,'text-anchor':'middle'},'博罗'));
  canvas.append(sv('text',{x:410,y:241,fill:'#9acbd5','font-size':10,'text-anchor':'middle'},'探索中心'));
  towns.forEach((t,i)=>{
   const outer=i<10,slot=outer?i:i-10,count=outer?10:Math.max(1,towns.length-10),a=(slot/count*2*Math.PI-Math.PI/2)+(outer?0:.15);
   const x=410+Math.cos(a)*(outer?315:185),y=225+Math.sin(a)*(outer?167:106);
   points.push({...t,x,y});
  });
  const current=points.find(p=>p.name===selected)||points[0];
  if(current)canvas.append(sv('line',{x1:410,y1:225,x2:current.x,y2:current.y,'class':'hcx-atlas-aim'}));
  points.forEach(t=>{
   const active=t.name===selected,muted=mode==='pick'&&!t.pick||mode==='high'&&t.level!=='高'&&t.level!=='较高';
   const gr=sv('g',{'class':'hcx-atlas-node'+(t.pick?' is-picked':'')+(active?' is-current':'')+(muted?' is-muted':''),role:'button',tabindex:0,'aria-label':'查看'+t.name+'吃喝玩乐',transform:'translate('+t.x+' '+t.y+')'});
   gr.append(sv('circle',{r:31,'class':'hcx-aura'}),sv('circle',{r:7,'class':'hcx-point'}));
   gr.append(sv('text',{x:0,y:26,'class':'hcx-town-text'},t.name));
   gr.addEventListener('click',()=>{selected=t.name;draw();flash(svgBox);});
   gr.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();selected=t.name;draw();}});
   canvas.append(gr);
  });
  const item=current;
  if(item){
   sel.textContent=item.name;food.textContent=item.foods;play.textContent=item.plays;
   recommend.textContent=(item.pick?'本次随机推荐 · ':'')+'公开打卡关注档：'+item.level+'（不是实时热度）';
  }
 }
 scheduleObserver(grid,read);read();
}
function changeBridge(){
 const graph=$('#ec-graph'),panel=$('.ec-graph-panel'),wrap=$('.ec-graph-wrap');if(!graph||!panel||!wrap)return;
 const bridge=h('section','hcx-bridge');
 bridge.setAttribute('aria-label','可点击关系桥梁与主体拖动提示');
 const header=h('div','hcx-bridge-head'),title=h('b',null,'这件事连到了谁？'),count=h('small',null,'等待事件图');
 header.append(title,count);
 const tools=h('div','hcx-bridge-tools');
 let only=false;
 const toggle=button('只看事件变化','hcx-bridge-toggle',()=>{only=!only;toggle.setAttribute('aria-pressed',String(only));graph.classList.toggle('hcx-focus-graph',only);});
 toggle.setAttribute('aria-pressed','false');
 const reset=button('复位节点位置','hcx-bridge-toggle',()=>{const event=eventKey();if(layout.has(event))layout.delete(event);applyOffsets();flash(graph);});
 const msg=h('span','hcx-bridge-status','拖动节点，关联线实时跟随');
 tools.append(toggle,reset,msg);
 const links=h('div','hcx-rel-list'),caution=h('p','hcx-hint','点击下方真实关联，图中对应连线及右侧解释会同步聚焦。位置可拖拽，但拖动只改变本次展示布局，不改变数据或关系。');
 bridge.append(header,tools,links,caution);
 wrap.insertAdjacentElement('afterend',bridge);
 const layout=new Map();let painting=false,pending=false;
 const eventKey=()=>$('#ec-detail-id')?.textContent?.trim()||'default';
 function basis(){
  return new Map($all('.ec-graph-node',graph).map(g=>{
   const circle=g.querySelector('circle');return [g.getAttribute('data-node'),{g,x:Number(circle?.getAttribute('cx')),y:Number(circle?.getAttribute('cy'))}];
  }));
 }
 function applyOffsets(){
  if(painting)return;
  painting=true;
  const positions=basis(),offsets=layout.get(eventKey())||new Map();
  positions.forEach((p,id)=>{
   const d=offsets.get(id)||{x:0,y:0};
   p.g.setAttribute('transform','translate('+d.x+' '+d.y+')');
  });
  const pts=Array.from(positions.entries()).map(([id,p])=>({...p,id,d:offsets.get(id)||{x:0,y:0}}));
  $all('.ec-graph-edge',graph).forEach(g=>{
   $all('line',g).forEach(line=>{
     if(!line.dataset.hcxX1){line.dataset.hcxX1=line.getAttribute('x1');line.dataset.hcxY1=line.getAttribute('y1');line.dataset.hcxX2=line.getAttribute('x2');line.dataset.hcxY2=line.getAttribute('y2');}
     const b=[Number(line.dataset.hcxX1),Number(line.dataset.hcxY1),Number(line.dataset.hcxX2),Number(line.dataset.hcxY2)];
     const from=pts.find(p=>Math.abs(p.x-b[0])<.6&&Math.abs(p.y-b[1])<.6);
     const to=pts.find(p=>Math.abs(p.x-b[2])<.6&&Math.abs(p.y-b[3])<.6);
     line.setAttribute('x1',b[0]+(from?.d.x||0));line.setAttribute('y1',b[1]+(from?.d.y||0));
     line.setAttribute('x2',b[2]+(to?.d.x||0));line.setAttribute('y2',b[3]+(to?.d.y||0));
   });
  });
  painting=false;
 }
 function nameAt(x,y,pts){
  const p=pts.find(n=>Math.hypot(n.x-x,n.y-y)<1);
  return p?p.name:'邻近主体';
 }
 function rebuild(){
  if(painting)return;
  const nodes=basis();if(!nodes.size)return;
  applyOffsets();
  const pts=Array.from(nodes.entries()).map(([id,p])=>({...p,id,name:(p.g.getAttribute('aria-label')||id).replace(/^主体\s*/, '')}));
  const featured=[];
  $all('.ec-graph-edge',graph).forEach(g=>{
   const line=g.querySelector('.ec-line-visible');if(!line)return;
   const width=Number(line.getAttribute('stroke-width'));
   const active=width>=2.6;
   g.classList.toggle('hcx-current-edge',active);
   if(!active)return;
   const groupId=g.getAttribute('data-edge');
   const x1=Number(line.dataset.hcxX1||line.getAttribute('x1')),y1=Number(line.dataset.hcxY1||line.getAttribute('y1'));
   const x2=Number(line.dataset.hcxX2||line.getAttribute('x2')),y2=Number(line.dataset.hcxY2||line.getAttribute('y2'));
   const from=pts.find(p=>Math.hypot(p.x-x1,p.y-y1)<1),to=pts.find(p=>Math.hypot(p.x-x2,p.y-y2)<1);
   if(from)from.g.classList.add('hcx-current-node');
   if(to)to.g.classList.add('hcx-current-node');
   const hue=(line.getAttribute('stroke')||'').toLowerCase();
   const provisional=hue==='#b78a52'||line.hasAttribute('stroke-dasharray')&&hue!=='#9b3541';
   featured.push({g,groupId,from:from?.name||'主体',to:to?.name||'主体',label:g.getAttribute('aria-label')||'结构关联',provisional});
  });
  count.textContent=featured.length+' 条事件相关局部连接';
  links.replaceChildren();
  featured.slice(0,5).forEach((e,i)=>{
   const b=button('','hcx-rel-link'+(e.provisional?' is-provisional':''),()=>{
    const target=graph.querySelector('.ec-graph-edge[data-edge="'+e.groupId+'"]');
    target?.dispatchEvent(new MouseEvent('click',{bubbles:true}));
    flash($('.ec-inspector')); // Existing inspector is the source of truth.
   });
   b.append(h('b',null,e.provisional?'待核验／施工':'事件相关联系'),h('span',null,e.from+' → '+e.to),h('em',null,e.label));
   links.append(b);
  });
  if(!featured.length)links.append(h('span','hcx-muted','本事件没有可突出显示的连接。仍可点击节点观察背景关系。'));
 }
 function schedule(){if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;rebuild();});}
 scheduleObserver(graph,schedule);
 document.addEventListener('bl:change-selected',schedule);
 let drag=null,suppress=false;
 function pointerPosition(ev){
  const p=graph.createSVGPoint();p.x=ev.clientX;p.y=ev.clientY;
  const m=graph.getScreenCTM();
  return m?p.matrixTransform(m.inverse()):{x:0,y:0};
 }
 graph.addEventListener('pointerdown',ev=>{
  if(ev.button!==0)return;
  const node=ev.target.closest?.('.ec-graph-node');
  if(!node||!graph.contains(node))return;
  const original=pointerPosition(ev),id=node.dataset.node;
  drag={id,pid:ev.pointerId,start:original,last:original,orig:layout.get(eventKey())?.get(id)||{x:0,y:0},moved:false};
 });
 window.addEventListener('pointermove',ev=>{
  if(!drag||ev.pointerId!==drag.pid)return;
  const p=pointerPosition(ev);
  if(!drag.moved&&Math.hypot(p.x-drag.start.x,p.y-drag.start.y)<6)return;
  drag.moved=true;
  const m=layout.get(eventKey())||new Map();
  m.set(drag.id,{x:drag.orig.x+p.x-drag.start.x,y:drag.orig.y+p.y-drag.start.y});
  layout.set(eventKey(),m);
  applyOffsets();
  msg.textContent='正在移动主体；关联线同步更新';
 });
 function endDrag(ev){
  if(!drag||ev.pointerId!==drag.pid)return;
  if(drag.moved){
   suppress=true;
   msg.textContent='位置已更新 · 不改变真实关系';
   graph.querySelector('.blx-svg-annotations')?.remove();
   graph.dispatchEvent(new Event('keyup',{bubbles:true}));
   window.setTimeout(()=>{suppress=false;},180);
  }
  drag=null;
 }
 window.addEventListener('pointerup',endDrag);
 window.addEventListener('pointercancel',endDrag);
 graph.addEventListener('click',ev=>{if(suppress){ev.preventDefault();ev.stopImmediatePropagation();suppress=false;}},true);
 schedule();
}
function basicFlip(){
 const target=$('.blx-signal-lab')||$('.kpis');if(!target)return;
 const deck=h('section','hcx-flip-deck');deck.setAttribute('aria-label','2025年博罗三个反直觉信号，可点击揭示');
 deck.append(h('div','hcx-kicker','04 / REVEAL · 不止看数据，还要看矛盾'),h('h2','hcx-title','三个真实数字，背后藏着三个问题'),h('p','hcx-muted','点开卡片，看看一个数字还不能说明什么；数据均为2025年统计口径，2030年为规划目标。'));
 const grid=h('div','hcx-flip-grid');
 const cases=[
  {label:'工业向上',front:'+8.7%',note:'2025年规上工业增加值',back:'工业增长，为什么投资还在下降？',detail:'2025年固定资产投资同比下降18.8%。两者并存，不等于增长完全来自旧产能；还要观察新增项目、订单和产能。'},
  {label:'文旅很热',front:'1028万',note:'2025年游客人次（约数）',back:'游客多，钱一定留在本地吗？',detail:'2025年旅游收入约52亿元。游客人次不等于独立游客，也不等于每次消费都留在县内。需要进一步核对消费结构。'},
  {label:'千亿之后',front:'1600亿',note:'2030年规划目标',back:'规划目标，等于未来必然实现吗？',detail:'2025年现价GDP为1005.45亿元。1600亿元是2030年规划参考，不是确定预测；目标能否实现需由情景和证据继续检验。'}
 ];
 cases.forEach(c=>{
   const flip=button('','hcx-flip-item',()=>{
    const turned=flip.getAttribute('aria-pressed')==='true';
    flip.setAttribute('aria-pressed',String(!turned));flash(flip);
   });
   flip.setAttribute('aria-pressed','false');
   flip.setAttribute('aria-label','点击翻看：'+c.label+'，'+c.back);
   const inner=h('span','hcx-flip-inner'),face=h('span','hcx-flip-face hcx-flip-front');
   face.append(h('span','hcx-small',c.label),h('strong',null,c.front),h('p',null,c.note),h('span','hcx-small','点击翻面看反常识 →'));
   const back=h('span','hcx-flip-face hcx-flip-back');
   back.append(h('span','hcx-small','可能忽略了什么'),h('strong',null,c.back),h('p',null,c.detail));
   inner.append(face,back);flip.append(inner);grid.append(flip);
 });
 deck.append(grid,h('div','hcx-flip-hint','翻牌是对现实指标的解释与追问，不是对项目效果、企业交易或未来GDP的新增预测。'));
 target.insertAdjacentElement('afterend',deck);
}
function deltaPanel(){
 const stage=$('.bc-stage');if(!stage)return;
 const box=h('section','hcx-delta');
 box.setAttribute('aria-label','点击变化线索，两张关系图同步定位');
 const head=h('div','hcx-delta-title'),title=h('b',null,'本次到底变了哪条关系？'),sum=h('span',null,'读取当前事件');
 head.append(title,sum);
 const list=h('div','hcx-delta-list'),desc=h('div','hcx-hint','点击一条线索，双图同步定位并在下方显示证据含义；未建成与待验证的关系不会标成已实现。');
 box.append(head,list,desc);stage.insertAdjacentElement('beforebegin',box);
 let pending=false;
 function render(){
  const after=$('#bc-after'),before=$('#bc-before');if(!after||!before)return;
  const found=$all('.bc-edge',after);
  if(!found.length)return;
  const prior=new Set($all('.bc-edge',before).map(x=>x.dataset.edge));
  const focus=found.map(g=>({g,line:g.querySelector('.bc-edge-visible')})).filter(x=>x.line).filter(x=>{
    const color=(x.line.getAttribute('stroke')||'').toLowerCase();
    return ['#a13e47','#b57a40','#9e3035'].includes(color);
  });
  sum.textContent=focus.length+' 条着重呈现的关联';
  list.replaceChildren();
  focus.slice(0,8).forEach((x,i)=>{
   const color=(x.line.getAttribute('stroke')||'').toLowerCase();
   const speculative=color==='#b57a40';
   const closed=color==='#9e3035';
   const fresh=!prior.has(x.g.dataset.edge);
   const kind=speculative?'施工／待验证':closed?'停产／退出范围':fresh?'本次新增记录':'事件关联';
   const b=button('','hcx-delta-item'+(speculative?' is-pending':''),()=>{
    const current=$('#bc-after .bc-edge[data-edge="'+x.g.dataset.edge+'"]');
    current?.dispatchEvent(new MouseEvent('click',{bubbles:true}));
    flash($('.bc-focus-panel'));
    $('.bc-focus-panel')?.scrollIntoView({behavior:reduced?'auto':'smooth',block:'nearest'});
   });
   const name=(x.g.getAttribute('aria-label')||x.g.dataset.edge||'关系').replace(/^E\d+\s*/,'');
   b.append(h('b',null,kind),h('strong',null,name),h('small',null,'点击在两图定位 · 查看依据'));
   list.append(b);
  });
  if(!focus.length)list.append(h('span','hcx-muted','当前没有可突出展示的关系边；请选择其他事件或查看证据详情。'));
 }
 function schedule(){if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;render();});}
 scheduleObserver($('#bc-after'),schedule);
 document.addEventListener('bl:compare-selected',schedule);
 schedule();
}
if(page==='town')townWorld();
if(page==='changes')changeBridge();
if(page==='basic')basicFlip();
if(page==='comparison')deltaPanel();
})();