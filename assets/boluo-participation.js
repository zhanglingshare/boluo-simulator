/* BOLUO · six discoveries. Choices are personal observations, never public vote totals.
   Friend challenges are encoded in URLs; no accounts or fabricated live activity. */
(function(){
'use strict';
const body=document.body,page=body.dataset.blJourney;
const order=['today','town','changes','basic','comparison','planning'];if(!order.includes(page))return;
const host=document.querySelector('main,.wrap');if(!host)return;
const node=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=String(text);return e;};
const button=(text,cls,fn)=>{const e=node('button',cls,text);e.type='button';if(fn)e.addEventListener('click',fn);return e;};
const ns='http://www.w3.org/2000/svg',svg=(tag,attrs={},text)=>{const e=document.createElementNS(ns,tag);Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,String(v)));if(text!=null)e.textContent=String(text);return e;};
const routes=['index-legacy-2026-11-03.html','town.html','industry-changes.html','who.html','relation-compare.html','plan-with-me.html'];
const names=['今日博罗','各镇探索','产业变化','博罗基本面','前后关系','规划与你'];
const index=order.indexOf(page),q=new URLSearchParams(location.search),reduced=matchMedia('(prefers-reduced-motion:reduce)');
const challengeId='boluo-discover-v2-'+page;
let rival=q.get('challenge')===challengeId?q.get('pick'):'',selected='',revealed=false,choices=[],facts=null,returnFocus=null;
let record={};try{record=JSON.parse(localStorage.getItem('boluo-discover-v1')||'{}')||{};}catch{}
if(!record||typeof record!=='object'||Array.isArray(record))record={};
function save(){record[page]={choice:selected,revealed:true};try{localStorage.setItem('boluo-discover-v1',JSON.stringify(record));}catch{}updateProgress();}
function updateProgress(){const total=order.filter(k=>record[k]?.revealed).length;progress.textContent='你已发现 '+total+' / 6';progress.setAttribute('aria-label','此设备已揭晓'+total+'个观察，不是全站参与人数');}
function safeSource(value){try{const u=new URL(value);return /^https?:$/.test(u.protocol)?u.href:'';}catch{return '';}}
function spring(e,frames,duration=420){if(!reduced.matches&&e.animate)e.animate(frames,{duration,easing:'cubic-bezier(.2,.8,.2,1)',fill:'none'});}
const scene=node('section','bp-scene');scene.setAttribute('aria-label','六个可以亲手拆开的观察现场');scene.dataset.scene=page;
const top=node('div','bp-top'),eyebrow=node('div','bp-eyebrow',String(index+1).padStart(2,'0')+' / 六次发现'),progress=node('span','bp-progress');top.append(eyebrow,progress);
const menuWrap=node('div','bp-menu-wrap'),menuButton=button('⋯','bp-menu-button');menuButton.setAttribute('aria-label','更多操作');menuButton.setAttribute('aria-haspopup','menu');menuButton.setAttribute('aria-expanded','false');
const menu=node('div','bp-menu');menu.hidden=true;menu.setAttribute('role','menu');menuWrap.append(menuButton,menu);top.append(menuWrap);
const grid=node('div','bp-scene-grid'),copy=node('div','bp-copy'),heading=node('h1','bp-title'),lead=node('p','bp-lead'),friend=node('p','bp-friend');friend.hidden=!rival;friend.textContent='朋友留了一个观察入口。先打开你的，再看你们的差别。';
const pickLabel=node('p','bp-pick-label','换个视角，画面跟着变'),pickHost=node('div','bp-choices');pickHost.setAttribute('role','group');pickHost.setAttribute('aria-label','切换当前观察视角');
const revealButton=button('揭开这一幕','bp-reveal',reveal);revealButton.hidden=true;
const result=node('div','bp-result');result.hidden=true;result.setAttribute('aria-live','polite');
const resultTitle=node('strong'),resultText=node('p'),duel=node('div','bp-duel');result.append(resultTitle,resultText,duel);
const actions=node('div','bp-actions'),shareButton=button('把发现交给朋友','bp-share',()=>openSheet(shareButton)),continueLink=node('a','bp-next');continueLink.href=routes[index+1]||'choices.html';continueLink.textContent=index===5?'带着问题，进入五条路径 →':'下一幕 · '+names[index+1]+' →';actions.append(shareButton,continueLink);actions.hidden=true;
function syncContinue(){const a=document.getElementById('bl-journey-next');const expected=routes[index+1];if(a&&expected&&new URL(a.href).pathname.endsWith('/'+expected))continueLink.href=a.href;}
document.addEventListener('bl:change-selected',syncContinue);document.addEventListener('bl:compare-selected',syncContinue);syncContinue();
copy.append(heading,lead,friend,pickLabel,pickHost,revealButton,result,actions);
const art=node('div','bp-art');art.setAttribute('aria-label','切换观察视角，查看数字、时间和关系的变化');grid.append(copy,art);
const bottom=node('div','bp-bottom');const evidenceButton=button('这幕依据什么？','bp-evidence',()=>openSheet(evidenceButton,true)),review=node('a','bp-review','进入完整现场 ↓');review.href='#bp-full-content';bottom.append(evidenceButton,review);
scene.append(top,grid,bottom);host.prepend(scene);updateProgress();
const originalChildren=[...host.children].filter(e=>e!==scene);const full=node('div','bp-full-content');full.id='bp-full-content';full.append(...originalChildren);host.append(full);
for(const old of full.querySelectorAll('h1')){old.setAttribute('role','heading');old.setAttribute('aria-level','2');}
body.classList.add('bp-experience');
const status=node('div','bp-toast');status.setAttribute('role','status');status.hidden=true;body.append(status);
function toast(text){status.textContent=text;status.hidden=false;setTimeout(()=>{status.hidden=true;},2200);}
function setChoices(list){choices=list;rival=choices.some(x=>x.id===rival)?rival:'';friend.hidden=!rival;pickHost.replaceChildren();for(const c of list){const b=button(c.label,'bp-choice',()=>choose(c.id));b.dataset.pick=c.id;b.setAttribute('aria-pressed','false');pickHost.append(b);} }
function choose(id){if(!choices.some(x=>x.id===id))return;selected=id;for(const b of pickHost.children)b.setAttribute('aria-pressed',String(b.dataset.pick===id));reveal();}
function selectOriginalEvent(id){const selector=page==='changes'?'.ec-feed-item[data-event="'+id+'"]':'.bc-event[data-id="'+id+'"]';const target=document.querySelector(selector);const top=scrollY;target?.click();scrollTo({top,behavior:'instant'});}
function reveal(){if(!selected||!facts)return;revealed=true;scene.classList.add('is-revealed');result.hidden=false;actions.hidden=false;revealButton.hidden=true;resultTitle.textContent=facts.resultTitle;resultText.textContent=facts.resultText;
 const view=facts.views?.[selected];if(view){resultTitle.textContent=view[0];resultText.textContent=view[1];}
 if(page==='planning'){const r=facts.plan.roles.find(r=>r.id===selected);resultTitle.textContent=r.question;resultText.textContent='先看这几道条件，再决定要不要进入后面的推演。';document.querySelector('.pl-role[data-role="'+selected+'"]')?.click();}
 if(page==='changes')selectOriginalEvent('C006');if(page==='comparison')selectOriginalEvent('C008');
 duel.replaceChildren();if(rival){const a=choices.find(x=>x.id===rival),b=choices.find(x=>x.id===selected);duel.append(node('span',null,'朋友先看「'+a.label+'」'),node('span',null,'你先看「'+b.label+'」'),node('b',null,rival===selected?'你们从同一个入口看见了这座城。':page==='town'?'你们选了两种博罗。把你的一站回给朋友。':page==='planning'?'换个身份，会看见另一组现实条件。':'你们关注的不同。把两种视角放在一起看。'));}
 save();paint();spring(result,[{opacity:0,transform:'translateY(16px)'},{opacity:1,transform:'translateY(0)'}]);
 if(page==='comparison')animateGraph();if(page==='changes')animateBridge();
}
function number(text,label,cls=''){const box=node('div','bp-number '+cls);box.append(node('strong',null,text),node('span',null,label));return box;}
function cap(text){return node('div','bp-instrument-cap',text);}
function paint(){
 if(!facts)return;art.replaceChildren();const current=selected||facts.options[0][0];
 if(page==='today'){
  art.append(cap('四宗项目 / 签约与本地连接'),number('80','亿元 · 已收录的签约投资'));
  if(current==='stages'){const steps=node('div','bp-lifecycle');['签约','建设','投产','本地订单'].forEach((t,i)=>{const n=node('div','bp-lifecycle-step'+(i===0?' is-known':''));n.append(node('i',null,i===0?'✓':'?'),node('span',null,t));steps.append(n);});art.append(steps);}
  else{const links=node('div','bp-links'+(current==='facts'?' is-fact':''));facts.links.forEach(([a,b])=>{const row=node('div','bp-link-row');row.append(node('span',null,a),node('i'),node('span',null,b));links.append(row);});art.append(links);}
  art.append(node('p','bp-art-note',current==='facts'?'三条本地配套线均未证实，暂不当作订单画进来。':'虚线是待核对的配套方向。产品规格、采购地、客户与交付记录仍缺。'));
 }
 if(page==='town'){
  const stays=current==='stays',value=stays?25:92;art.append(cap(stays?'需求一侧 / 国庆片区游客':'供给一侧 / 节前沿线民宿'),number((stays?'约':'')+value+'%',stays?'过夜游客占片区游客人次':'节前民宿预订率'));
  const squares=node('div','bp-room-grid');squares.setAttribute('aria-hidden','true');for(let i=0;i<100;i++)squares.append(node('i',i<value?'on':''));art.append(squares,node('p','bp-denominator',stays?'分母换成：片区游客人次':'分母是：沿线民宿可预订房间'),node('p','bp-art-note','两组地域、分母和观测阶段不同。不能相减，也不能当作全年实际入住率。'));
 }
 if(page==='changes'){
  art.append(cap('石洲大桥 / 施工、目标与预计建成'));const line=node('div','bp-time-track');[['2026','施工管控已发生','construction'],['2030','GDP目标年份','target'],['2031','新桥预计建成','bridge']].forEach(([year,label,key])=>{const stop=node('div','bp-time-stop'+(current===key?' is-now':''));stop.append(node('strong',null,year),node('span',null,label));line.append(stop);});art.append(line,node('div','bp-bridge-status',current==='construction'?'现在先承受施工变化':current==='target'?'2030截线：不能提前计入新桥通车收益':'2031是预计时间，并非已完工或已延期'),node('p','bp-art-note','园洲 ⇄ 东莞石排 · 由双向两车道改建为六车道。实际通勤影响仍需实测。'));
 }
 if(page==='basic'){
  if(current==='production'){
   art.append(cap('2026年1—8月 / 增长的集中度'),number(facts.contribution+'%','电子设备＋电气机械 · 对规上工业增长的贡献率'));
   const strip=node('div','bp-contribution');strip.setAttribute('aria-label','两行业贡献'+facts.contribution+'%，其余行业合计贡献'+(100-facts.contribution).toFixed(1)+'%');const fill=node('i');fill.style.width=facts.contribution+'%';strip.append(fill);art.append(strip);
   const blocks=node('div','bp-sector-grid');blocks.setAttribute('aria-hidden','true');for(let i=0;i<facts.sectors;i++)blocks.append(node('i',i<2?'major':i<facts.growing?'up':''));art.append(blocks,node('p','bp-art-note',facts.sectors+'个行业中'+facts.growing+'个总产值正增长；亮格为两个重点行业。贡献率不是产值占比。'));
  }else{
   const newer=current==='investment26';art.append(cap(newer?'2026年1—8月 / 投资同比降幅':'2025全年 / 投资同比降幅'));
   for(const [label,value]of newer?facts.invest26:facts.invest25){const row=node('div','bp-contrast-row');row.append(node('span',null,label),node('strong',null,'−'+value+'%'));const track=node('div','bp-contrast-track'),bar=node('i');bar.style.width=value/60*100+'%';track.append(bar);row.append(track);art.append(row);}
   art.append(node('p','bp-art-note','最深降幅的位置从地产转向工业。统计区间不同，只比较各期内部位置，不能据此计算GDP损失。'));
  }
 }
 if(page==='comparison')paintGraph();
 if(page==='planning')paintLife();
 if(revealed)spring(art,[{opacity:.6,transform:'translateY(5px)'},{opacity:1,transform:'none'}],340);
}
function paintGraph(){if(!facts?.model)return;const model=facts.model;const canvas=svg('svg',{viewBox:'0 0 600 415',role:'img','aria-label':'固力水泥特定熟料生产线关停的局部关系示意。保留企业主体，只标记有依据的产线退出。'});const byId=new Map(model.nodes.map(n=>[n.id,n]));
 for(const edge of model.edges){const a=byId.get(edge.source).position,b=byId.get(edge.target).position,closed=(selected||'before')!=='before'&&edge.after==='closed';const line=svg('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,stroke:closed?'#db8f98':'#91a9bb','stroke-width':closed?3:1.6,'stroke-dasharray':closed?'7 12':'none',class:closed?'bp-closed-edge':'bp-live-edge'});canvas.append(line);if(closed){const x=(a.x+b.x)/2,y=(a.y+b.y)/2;canvas.append(svg('path',{d:'M'+(x-9)+' '+(y-9)+'L'+(x+9)+' '+(y+9)+'M'+(x+9)+' '+(y-9)+'L'+(x-9)+' '+(y+9),stroke:'#eda7ae','stroke-width':3}));}}
 for(const n of model.nodes){canvas.append(svg('circle',{cx:n.position.x,cy:n.position.y,r:n.affected?25:16,fill:n.affected?'#46343e':'#1c3449',stroke:n.affected?'#e4a6af':'#a2bdce','stroke-width':2}),svg('text',{x:n.position.x,y:n.position.y+42,'text-anchor':'middle',class:'bp-svg-label'},n.shortName));}
 art.append(canvas,node('p','bp-art-note',(selected||'before')!=='before'?'特定熟料线退出，企业主体保留。其他业务与下游订单尚未披露。':'关停前的局部关系。点击切换，只改变有明确记录的那一条线。'));
}
function animateGraph(){if(reduced.matches)return;for(const line of art.querySelectorAll('.bp-closed-edge'))spring(line,[{strokeDasharray:'0 0',opacity:1},{strokeDasharray:'7 12',opacity:.8}],700);}
function animateBridge(){if(reduced.matches)return;for(const [i,line]of [...art.querySelectorAll('.bp-bridge-new line')].entries()){line.animate([{strokeDashoffset:200,opacity:0},{strokeDashoffset:0,opacity:1}],{duration:480,delay:i*45,easing:'ease-out'});}}
function paintLife(){if(!facts?.plan)return;art.replaceChildren();const r=facts.plan.roles.find(r=>r.id===selected)||facts.plan.roles[0],theme=facts.plan.themes.find(t=>t.id===document.querySelector('.pl-theme[aria-pressed=true]')?.dataset.theme&&t.roles.includes(r.id))||facts.plan.themes.find(t=>t.roles.includes(r.id));const chain=theme.mechanisms[r.id];art.append(number('1,600','亿元 · 2030 GDP规划目标'));const gates=node('div','bp-life-gates');chain.forEach((text,i)=>{const gate=node('div','bp-life-gate'+(revealed?' is-open':''));gate.style.setProperty('--gate',i);gate.append(node('span',null,String(i+1).padStart(2,'0')),node('b',null,text));gates.append(gate);});art.append(gates,node('p','bp-art-note','目标与个人结果之间的条件示意，不是个人收入预测。'));}
function canonicalUrl(){const url=new URL(location.href);const change=new URLSearchParams(url.hash.slice(1)).get('change');if(/^C\d{3}$/.test(change||''))url.searchParams.set('change',change);url.searchParams.set('challenge',challengeId);url.searchParams.set('pick',selected);url.hash='';return url;}
const sheet=node('dialog','bp-sheet');sheet.setAttribute('aria-label','邀请朋友或查看这一幕的依据');
const grab=node('div','bp-sheet-grab'),sheetHead=node('div','bp-sheet-head'),sheetHeading=node('h2'),closeSheet=button('完成','bp-sheet-done',()=>hideSheet());sheetHead.append(sheetHeading,closeSheet);const sheetBody=node('div','bp-sheet-body');sheet.append(grab,sheetHead,sheetBody);body.append(sheet);
function openSheet(origin,evidence=false){if(!facts)return;returnFocus=origin;sheetBody.replaceChildren();sheetHeading.textContent=evidence?'这一幕的依据':'把这一幕，交给朋友';
 if(evidence){sheetBody.append(node('p','bp-sheet-intro',facts.evidence));for(const source of facts.sources||[]){const href=safeSource(source.url);if(!href)continue;const a=node('a','bp-source',source.title);a.href=href;a.target='_blank';a.rel='noopener noreferrer';sheetBody.append(a);}sheetBody.append(node('p','bp-sheet-foot','只使用当前收录资料。签约、施工、目标与实际结果分别标注。'));}
 else{
  if(!selected){toast('先选一次，再把你的观察交给朋友。');return;}
  const choice=choices.find(c=>c.id===selected),card=node('div','bp-postcard');card.append(node('span','bp-postcard-brand','博罗 · 六次发现'),node('strong',null,heading.textContent),node('p',null,'我先看见：'+choice.label),node('small',null,'你会从哪里看？打开自己的视角，再对照我们的不同。'));sheetBody.append(card);
  const nativeShare=button('分享这一幕','bp-sheet-primary',async()=>{const url=canonicalUrl().href;try{if(navigator.share)await navigator.share({title:'博罗 · 你会怎么想？',text:heading.textContent+' 先选，再看我们想得一不一样。',url});else await copyLink();}catch(err){if(err.name!=='AbortError')await copyLink();}});
  const copy=button('复制发现链接','bp-sheet-secondary',copyLink);const link=node('input','bp-share-url');link.readOnly=true;link.value=canonicalUrl().href;link.setAttribute('aria-label','可发送给朋友的挑战链接');link.addEventListener('focus',()=>link.select());
  sheetBody.append(nativeShare,copy,link,node('p','bp-sheet-foot','朋友打开后会先独立选择，再看到你们的不同。进度只保存在各自设备上。'));
 }
 if(!sheet.open)sheet.showModal();spring(sheet,[{opacity:0,transform:compact()?'translateY(80px)':'translateY(14px) scale(.95)'},{opacity:1,transform:'none'}],420);closeSheet.focus();
}
function compact(){return matchMedia('(max-width:800px)').matches;}
function hideSheet(){if(!sheet.open)return;if(reduced.matches){sheet.close();returnFocus?.focus();return;}const a=sheet.animate([{opacity:1,transform:'none'},{opacity:0,transform:compact()?'translateY(60px)':'translateY(12px) scale(.97)'}],{duration:180,easing:'ease-in'});a.finished.catch(()=>{}).then(()=>{sheet.close();returnFocus?.focus();});}
sheet.addEventListener('cancel',e=>{e.preventDefault();hideSheet();});sheet.addEventListener('click',e=>{const r=sheet.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)hideSheet();});
async function copyLink(){const value=canonicalUrl().href;try{await navigator.clipboard.writeText(value);toast('发现链接已复制，朋友可以直接接着看。');}catch{const input=sheet.querySelector('.bp-share-url');input?.focus();input?.select();toast('长按链接即可复制。');}}
function toggleMenu(on){menu.hidden=!on;menuButton.setAttribute('aria-expanded',String(on));if(on){spring(menu,[{opacity:0,transform:'translateY(-6px) scale(.95)'},{opacity:1,transform:'none'}],180);menu.querySelector('button')?.focus();}}
for(const [label,fn] of [['把发现交给朋友',()=>openSheet(menuButton)],['查看这一幕的依据',()=>openSheet(menuButton,true)],['回到初始视角',()=>{selected='';revealed=false;scene.classList.remove('is-revealed');result.hidden=true;actions.hidden=true;revealButton.hidden=false;revealButton.hidden=true;for(const b of pickHost.children)b.setAttribute('aria-pressed','false');paint();pickHost.querySelector('button')?.focus();}]]){const b=button(label,'',()=>{toggleMenu(false);fn();});b.setAttribute('role','menuitem');menu.append(b);}
menuButton.addEventListener('click',()=>toggleMenu(menu.hidden));document.addEventListener('click',e=>{if(!menuWrap.contains(e.target))toggleMenu(false);});menu.addEventListener('keydown',e=>{const items=[...menu.children],at=items.indexOf(document.activeElement);if(e.key==='Escape'){toggleMenu(false);menuButton.focus();}if(['ArrowDown','ArrowUp'].includes(e.key)){e.preventDefault();items[(at+(e.key==='ArrowDown'?1:items.length-1))%items.length].focus();}});
const read=file=>fetch(file,{cache:'no-store'}).then(r=>{if(!r.ok)throw Error(file);return r.json();});
async function boot(){
 try{
 const [events,evidence,sources,life,plan]=await Promise.all(['data/relationship-changes-v1.json','data/relationship-evidence-v1.json','data/relationship-sources-v1.json','life.json','data/boluo-plan-life.v1.json'].map(read));
 const sourceFor=id=>{const event=events.changes.find(c=>c.change_id===id);return event.source_ids.map(id=>sources.sources.find(s=>s.source_id===id)).filter(Boolean).map(s=>({title:s.title,url:s.url}));};
 const latest=typeof BL_2026!=='undefined'?BL_2026:null,annual=typeof BL_2025!=='undefined'?BL_2025:null;
 if(!latest||!annual)throw Error('统计快照未读取');
 const note=latest.production.find(x=>x.k==='规上工业增加值').note,sectorNote=latest.production.find(x=>x.k==='规上工业总产值').note;
 const contribution=Number(note.match(/贡献率([\d.]+)%/)[1]),counts=sectorNote.match(/(\d+)个工业行业大类中(\d+)个正增长/),investment25=annual.metrics.find(x=>x.k==='固定资产投资').note;
 const presets={
 today:{title:'80亿签约。\n本地订单，在哪里？',lead:'四宗项目签约。把“方向相邻”和“已经合作”拆开看。',options:[['candidates','打开候选联系'],['facts','只看已证实'],['stages','走到哪一步']],resultTitle:'',resultText:'',views:{candidates:['三条配套方向，都还缺交付证据。','液冷、冷轧钢、空压机与本地制造可能有关；产品能否适配、客户是否本地，还不能跳过。'],facts:['线先拿掉，企业还在。','筛掉待验证的联系后，这三条本地订单都不能算已发生。下一条有用信息，是具体客户与交付。'],stages:['签约以后，还有三道门。','建设、投产、本地订单，需要各自的证据。203亿元是预计年产值，不能先当作产出。']},links:evidence.edges.filter(e=>['E019','E020','E021'].includes(e.edge_id)).map(e=>[evidence.nodes.find(n=>n.node_id===e.source_node_id)?.short_name||evidence.nodes.find(n=>n.node_id===e.source_node_id)?.name,evidence.nodes.find(n=>n.node_id===e.target_node_id)?.short_name||evidence.nodes.find(n=>n.node_id===e.target_node_id)?.name]),evidence:'C004：2026-08-03四宗项目签约80亿元；E019/E020/E021均为C级候选联系，没有本地订单的直接证据。预计年产值203亿元，非已实现产出。',sources:sourceFor('C004')},
 town:{title:'预订92%。\n为什么只约25%过夜？',lead:'同一片文旅热度，换一个分母，看到的是另一件事。',options:[['rooms','从房间看'],['stays','从游客看']],views:{rooms:['房间快订满，不代表游客都住下。','92%看的是沿线民宿节前预订。还需要房间总量、取消情况与实际入住。'],stays:['游客多，留下来的是另一部分。','约25%看的是国庆片区游客过夜比例。下一问：住在哪个镇，钱进入哪些商户？']},resultTitle:'',resultText:'',evidence:'C012及E037/E041：国庆博罗片区接待52.97万人次、过夜约25%；218旅游公路沿线民宿节前预订率92%。地域、分母与观测阶段不同，不可相减。格子是百分比示意，不代表真实房间或人数。',sources:sourceFor('C012'),towns:life.towns},
 changes:{title:'目标在2030。\n桥，预计2031。',lead:'把两条时间线叠起来，哪些收益不能提前算？',options:[['construction','现在 · 施工'],['target','2030 · 目标'],['bridge','2031 · 预计通车']],views:{construction:['收益还没来，施工变化已经发生。','公开记录有交通管控；究竟谁多绕路、多久，仍要看实际路线与测量。'],target:['2030之前，替代通道是哪条？','新桥预计2031建成，不能用它的未来收益解释2030目标如何实现。'],bridge:['车道从两条到六条。便利还要实测。','计划能力与实际通勤并非同一件事。接线路段、出行时段和使用者都影响结果。']},resultTitle:'',resultText:'',evidence:'C006及规划生活库：石洲大桥连接园洲与东莞石排，双向两车道改建为六车道，预计2031年建成。2030为GDP规划目标年份；两者并置仅揭示时间约束，不计算经济缺口。',sources:sourceFor('C006')},
 basic:{title:'22个行业在涨。\n59.3%增长靠两个。',lead:'看增长铺多广，也看增长靠谁撑。再切到投资，看看下一棒。',options:[['production','增长靠谁'],['investment25','2025 · 投资'],['investment26','2026 · 投资']],views:{production:['广度和集中度，可以同时存在。','电子设备与电气机械贡献59.3%的工业增长。是大厂拉动还是订单普遍增加？公开汇总数还没有回答。'],investment25:['2025，地产投资的降幅更深。','工业投资−12.7%，房地产开发投资−47.6%。切到2026，看看位置如何改变。'],investment26:['更深的投资降幅，转到了工业。','2026年1—8月工业投资−46.7%，房地产−32.5%。要继续核对：厂房、设备还是项目进度？']},contribution,sectors:Number(counts[1]),growing:Number(counts[2]),invest25:[['工业投资',Number(investment25.match(/工业投资[−-]([\d.]+)%/)[1])],['房地产开发投资',Number(investment25.match(/房地产开发?投资?[−-]([\d.]+)%/)?.[1]||investment25.match(/房地产[−-]([\d.]+)%/)[1])]],invest26:['工业投资','房地产开发投资'].map(k=>[k,Math.abs(Number(latest.investment.find(x=>x.k===k).v.replace('−','-').replace('%','')))]),evidence:'数据来自bl-viz/data.js所收录统计局公报：2026年1—8月33个工业行业大类中22个总产值正增长；电子设备、电气机械两行业对工业增长贡献59.3%。投资比较保留2025全年与2026年1—8月各自口径。',sources:[{title:latest.latestSourceName,url:latest.latestSource},{title:annual.sourceName,url:annual.source}]},
 comparison:{title:'产线退出。\n哪条联系真的断了？',lead:'切换前后，只让有记录的关系发生变化。',options:[['before','关停前'],['after','关停后'],['unknown','还不知道什么']],views:{before:['先保留同一组主体。','对比前后，才看得清是产线变化，还是整家公司退出。'],after:['只断开特定熟料线的关系。','日产2500吨熟料线关停。企业仍保留，不能连同它的其他业务一起删除。'],unknown:['谁的订单被影响，仍是一处空白。','目前没有逐企采购、替代供应与库存数据。不能从一条关停记录，推成全行业损失。']},resultTitle:'',resultText:'',evidence:'C008：2026-02-13记录固力水泥博罗分公司日产2500吨熟料生产线关停及主体设备拆除，仅针对该线。其余业务、下游订单与替代供应未披露。图来自同一组入库节点与关系。',sources:sourceFor('C008')},
 planning:{title:'1600亿。\n到你，还隔几道门？',lead:'换个身份，让宏观目标走一遍你的生活。',options:plan.roles.map(r=>[r.id,r.label]),evidence:plan.note,sources:plan.sources.map(s=>({title:s.title,url:s.url})),plan}
 };
 facts=presets[page];if(!facts)throw Error('没有对应场景');if(page==='comparison')facts.model=window.BoluoCompareModel.build(evidence,events,sources,'C008');
 const lines=facts.title.split('\n');heading.replaceChildren(node('span',null,lines[0]),node('br'),node('em',null,lines[1]||''));lead.textContent=facts.lead;setChoices(facts.options.map(([id,label])=>({id,label})));paint();scene.classList.add('is-ready');document.dispatchEvent(new CustomEvent('bl:discovery-ready'));
 }catch(error){heading.textContent='这一幕暂时没能展开';lead.textContent='资料读取不完整，请先看下方原有内容。';pickLabel.hidden=true;pickHost.hidden=true;revealButton.hidden=true;art.textContent='没有用演示数字代替真实资料。';scene.classList.add('is-ready');}
}
heading.textContent='先看见，\n不一样的博罗。';lead.textContent='正在连接这一幕的真实资料…';boot();
})();
