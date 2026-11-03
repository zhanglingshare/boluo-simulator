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
const challengeId='boluo-discover-v1-'+page;
let rival=q.get('challenge')===challengeId?q.get('pick'):'',selected='',revealed=false,choices=[],facts=null,returnFocus=null;
let record={};try{record=JSON.parse(localStorage.getItem('boluo-discover-v1')||'{}')||{};}catch{}
if(!record||typeof record!=='object'||Array.isArray(record))record={};
function save(){record[page]={choice:selected,revealed:true};try{localStorage.setItem('boluo-discover-v1',JSON.stringify(record));}catch{}updateProgress();}
function updateProgress(){const total=order.filter(k=>record[k]?.revealed).length;progress.textContent='你已发现 '+total+' / 6';progress.setAttribute('aria-label','此设备已揭晓'+total+'个观察，不是全站参与人数');}
function safeSource(value){try{const u=new URL(value);return /^https?:$/.test(u.protocol)?u.href:'';}catch{return '';}}
function spring(e,frames,duration=420){if(!reduced.matches&&e.animate)e.animate(frames,{duration,easing:'cubic-bezier(.2,.8,.2,1)',fill:'none'});}
const scene=node('section','bp-scene');scene.setAttribute('aria-label','先参与，再看见不一样的博罗');scene.dataset.scene=page;
const top=node('div','bp-top'),eyebrow=node('div','bp-eyebrow',String(index+1).padStart(2,'0')+' / 六次发现'),progress=node('span','bp-progress');top.append(eyebrow,progress);
const menuWrap=node('div','bp-menu-wrap'),menuButton=button('⋯','bp-menu-button');menuButton.setAttribute('aria-label','更多操作');menuButton.setAttribute('aria-haspopup','menu');menuButton.setAttribute('aria-expanded','false');
const menu=node('div','bp-menu');menu.hidden=true;menu.setAttribute('role','menu');menuWrap.append(menuButton,menu);top.append(menuWrap);
const grid=node('div','bp-scene-grid'),copy=node('div','bp-copy'),heading=node('h1','bp-title'),lead=node('p','bp-lead'),friend=node('p','bp-friend');friend.hidden=!rival;friend.textContent='朋友给你留了一道挑战。先选，再看你们哪里不同。';
const pickLabel=node('p','bp-pick-label','先放下你的直觉'),pickHost=node('div','bp-choices');pickHost.setAttribute('role','group');pickHost.setAttribute('aria-label','选择你的第一反应');
const revealButton=button('揭开这一幕','bp-reveal',reveal);revealButton.disabled=true;
const result=node('div','bp-result');result.hidden=true;result.setAttribute('aria-live','polite');
const resultTitle=node('strong'),resultText=node('p'),duel=node('div','bp-duel');result.append(resultTitle,resultText,duel);
const actions=node('div','bp-actions'),shareButton=button('邀请朋友来选','bp-share',()=>openSheet(shareButton)),continueLink=node('a','bp-next');continueLink.href=routes[index+1]||'windtunnel.html';continueLink.textContent=index===5?'带着问题，去风洞试一试 →':'下一幕 · '+names[index+1]+' →';actions.append(shareButton,continueLink);actions.hidden=true;
function syncContinue(){const a=document.getElementById('bl-journey-next');const expected=routes[index+1];if(a&&expected&&new URL(a.href).pathname.endsWith('/'+expected))continueLink.href=a.href;}
document.addEventListener('bl:change-selected',syncContinue);document.addEventListener('bl:compare-selected',syncContinue);syncContinue();
copy.append(heading,lead,friend,pickLabel,pickHost,revealButton,result,actions);
const art=node('div','bp-art');art.setAttribute('aria-label','点击揭晓后，图形将展示当前资料能支持的变化');grid.append(copy,art);
const bottom=node('div','bp-bottom');const evidenceButton=button('这幕依据什么？','bp-evidence',()=>openSheet(evidenceButton,true)),review=node('a','bp-review','看完整内容 ↓');review.href='#bp-full-content';bottom.append(evidenceButton,review);
scene.append(top,grid,bottom);host.prepend(scene);updateProgress();
const originalChildren=[...host.children].filter(e=>e!==scene);const full=node('div','bp-full-content');full.id='bp-full-content';full.append(...originalChildren);host.append(full);
for(const old of full.querySelectorAll('h1')){old.setAttribute('role','heading');old.setAttribute('aria-level','2');}
body.classList.add('bp-experience');
const status=node('div','bp-toast');status.setAttribute('role','status');status.hidden=true;body.append(status);
function toast(text){status.textContent=text;status.hidden=false;setTimeout(()=>{status.hidden=true;},2200);}
function setChoices(list){choices=list;rival=choices.some(x=>x.id===rival)?rival:'';friend.hidden=!rival;pickHost.replaceChildren();for(const c of list){const b=button(c.label,'bp-choice',()=>choose(c.id));b.dataset.pick=c.id;b.setAttribute('aria-pressed','false');pickHost.append(b);} }
function choose(id){if(!choices.some(x=>x.id===id))return;selected=id;revealed=false;scene.classList.remove('is-revealed');result.hidden=true;actions.hidden=true;revealButton.hidden=false;revealButton.disabled=false;revealButton.textContent=page==='town'?'看看我选的这一站':page==='planning'?'看看中间隔着什么':'揭开这一幕';for(const b of pickHost.children)b.setAttribute('aria-pressed',String(b.dataset.pick===id));spring(pickHost.querySelector('[aria-pressed=true]'),[{transform:'scale(.97)'},{transform:'scale(1.015)'},{transform:'scale(1)'}],300);if(page==='town')paintTown();if(page==='planning')paintLife();}
function selectOriginalEvent(id){const selector=page==='changes'?'.ec-feed-item[data-event="'+id+'"]':'.bc-event[data-id="'+id+'"]';const target=document.querySelector(selector);const top=scrollY;target?.click();scrollTo({top,behavior:'instant'});}
function reveal(){if(!selected||!facts)return;revealed=true;scene.classList.add('is-revealed');result.hidden=false;actions.hidden=false;revealButton.hidden=true;resultTitle.textContent=facts.resultTitle;resultText.textContent=facts.resultText;
 if(page==='town'){const t=facts.towns.find(t=>t.n===selected);resultTitle.textContent='你的一站：'+t.n;resultText.textContent=t.foods.join('、')+'；'+t.plays.join('、')+'。';const original=[...document.querySelectorAll('.v3-town-cell')].find(b=>b.querySelector('strong')?.textContent===t.n);original?.click();}
 if(page==='planning'){const r=facts.plan.roles.find(r=>r.id===selected);resultTitle.textContent=r.question;resultText.textContent='目标到你的'+r.short+'之间，还隔着几层现实条件。先看这条路，再去后面的风洞推演。';document.querySelector('.pl-role[data-role="'+selected+'"]')?.click();}
 if(page==='changes')selectOriginalEvent('C006');if(page==='comparison')selectOriginalEvent('C008');
 duel.replaceChildren();if(rival){const a=choices.find(x=>x.id===rival),b=choices.find(x=>x.id===selected);duel.append(node('span',null,'朋友选「'+a.label+'」'),node('span',null,'你选「'+b.label+'」'),node('b',null,rival===selected?'这次，你们想到了同一处。':page==='town'?'你们选了两种博罗。把你的一站回给朋友。':page==='planning'?'换个身份，会看见另一组现实条件。':'第一反应不同，看看资料能确认哪一步。'));}
 save();paint();spring(result,[{opacity:0,transform:'translateY(16px)'},{opacity:1,transform:'translateY(0)'}]);
 if(page==='comparison')animateGraph();if(page==='changes')animateBridge();if(compact())art.scrollIntoView({block:'center',behavior:reduced.matches?'instant':'smooth'});
}
function number(text,label,cls=''){const box=node('div','bp-number '+cls);box.append(node('strong',null,text),node('span',null,label));return box;}
function paint(){
 art.replaceChildren();
 if(page==='today'){
  art.append(number('80','亿元 · 签约金额'));const steps=node('div','bp-lifecycle');['签约','建设','投产','实际产出'].forEach((t,i)=>{const n=node('div','bp-lifecycle-step'+(revealed&&i===0?' is-known':''));n.append(node('i',null,revealed?(i===0?'✓':'?'):'·'),node('span',null,t));steps.append(n);});art.append(steps,node('p','bp-art-note',revealed?'资料只确认签约，后面几个环节仍待核实。':'点击揭晓，看看新闻中的钱走到了哪一步。'));
 }
 if(page==='town')paintTown();
 if(page==='changes'){
  const canvas=svg('svg',{viewBox:'0 0 600 360',role:'img','aria-label':'老桥、施工与未来六车道新桥的阶段示意，不代表实际地理形状'});
  canvas.append(svg('path',{d:'M0 213 Q150 153 300 220T600 206',fill:'none',stroke:'#cbdfe8','stroke-width':70}));
  [95,505].forEach((x,i)=>{canvas.append(svg('circle',{cx:x,cy:163,r:32,fill:'#fff',stroke:'#adc3d4','stroke-width':2}),svg('text',{x,y:222,'text-anchor':'middle',class:'bp-svg-label'},i?'东莞石排':'博罗园洲'));});
  canvas.append(svg('line',{x1:130,y1:160,x2:470,y2:160,stroke:'#9aafbf','stroke-width':5,class:'bp-bridge-old'}));
  const g=svg('g',{class:'bp-bridge-new'});for(let i=0;i<6;i++)g.append(svg('line',{x1:130,y1:120+i*12,x2:470,y2:120+i*12,stroke:revealed?'#d29b54':'#d5dde4','stroke-width':4,'stroke-dasharray':'8 9'}));canvas.append(g,svg('text',{x:300,y:84,'text-anchor':'middle',class:'bp-svg-title'},revealed?'施工管控已发生':'六车道新桥'),svg('text',{x:300,y:288,'text-anchor':'middle',class:'bp-svg-label'},revealed?'新桥尚未通车 · 实际通勤变化仍待实测':'桥没通，变化就一定还没开始吗？'));art.append(canvas);
 }
 if(page==='basic'){
  art.append(node('div','bp-chart-head','2025 · 同一年，两股相反的风'));
  for(const [label,value,kind] of [['规上工业增加值',8.7,'up'],['固定资产投资',-18.8,'down']]){const row=node('div','bp-contrast-row '+kind);row.append(node('span',null,label),node('strong',null,revealed?(value>0?'+':'')+value+'%':'?'));const track=node('div','bp-contrast-track'),bar=node('i');bar.style.width=revealed?Math.abs(value)/25*70+'%':'0';track.append(bar);row.append(track);art.append(row);}
  art.append(node('p','bp-art-note','同比增速 · 工业与投资是不同口径，不能相加。'));
 }
 if(page==='comparison')paintGraph();
 if(page==='planning')paintLife();
 if(page==='basic'&&revealed){for(const bar of art.querySelectorAll('.bp-contrast-track i')){const width=bar.style.width;bar.style.width='0';requestAnimationFrame(()=>requestAnimationFrame(()=>{bar.style.width=width;}));}}
 if(revealed)spring(art,[{opacity:.6,transform:'scale(.985)'},{opacity:1,transform:'scale(1)'}],500);
}
function paintTown(){if(!facts)return;art.replaceChildren();const t=facts.towns.find(t=>t.n===selected)||facts.towns[0];const label=node('span','bp-town-tag',t.tag),title=node('strong','bp-town-title',t.n),food=node('p','bp-town-food',revealed?t.foods.join(' · '):'山水、街巷，还是一口味道？');art.append(node('div','bp-town-index','16 镇街 / 一站推荐'),label,title,food);const play=node('div','bp-town-play');play.append(node('span',null,'这一站，可以看什么'),node('b',null,revealed?t.plays.join(' · '):'先选一个镇，再打开它的生活。'));art.append(play,node('p','bp-art-note','公开特色资料 · 一站推荐是个人偏好，不是全县热度排名。'));}
function paintGraph(){if(!facts?.model)return;const model=facts.model;const canvas=svg('svg',{viewBox:'0 0 600 415',role:'img','aria-label':'固力水泥特定熟料生产线关停的局部关系示意。保留企业主体，只标记有依据的产线退出。'});const byId=new Map(model.nodes.map(n=>[n.id,n]));
 for(const edge of model.edges){const a=byId.get(edge.source).position,b=byId.get(edge.target).position,closed=revealed&&edge.after==='closed';const line=svg('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,stroke:closed?'#db8f98':'#91a9bb','stroke-width':closed?3:1.6,'stroke-dasharray':closed?'7 12':'none',class:closed?'bp-closed-edge':'bp-live-edge'});canvas.append(line);if(closed){const x=(a.x+b.x)/2,y=(a.y+b.y)/2;canvas.append(svg('path',{d:'M'+(x-9)+' '+(y-9)+'L'+(x+9)+' '+(y+9)+'M'+(x+9)+' '+(y-9)+'L'+(x-9)+' '+(y+9),stroke:'#eda7ae','stroke-width':3}));}}
 for(const n of model.nodes){canvas.append(svg('circle',{cx:n.position.x,cy:n.position.y,r:n.affected?25:16,fill:n.affected?'#46343e':'#1c3449',stroke:n.affected?'#e4a6af':'#a2bdce','stroke-width':2}),svg('text',{x:n.position.x,y:n.position.y+42,'text-anchor':'middle',class:'bp-svg-label'},n.shortName));}
 art.append(canvas,node('p','bp-art-note',revealed?'退出的是特定熟料生产线；企业主体保留，其他业务不能顺手删除。':'先看它原来的联系。揭晓后，只改变有明确记录的部分。'));
}
function animateGraph(){if(reduced.matches)return;for(const line of art.querySelectorAll('.bp-closed-edge'))spring(line,[{strokeDasharray:'0 0',opacity:1},{strokeDasharray:'7 12',opacity:.8}],700);}
function animateBridge(){if(reduced.matches)return;for(const [i,line]of [...art.querySelectorAll('.bp-bridge-new line')].entries()){line.animate([{strokeDashoffset:200,opacity:0},{strokeDashoffset:0,opacity:1}],{duration:480,delay:i*45,easing:'ease-out'});}}
function paintLife(){if(!facts?.plan)return;art.replaceChildren();const r=facts.plan.roles.find(r=>r.id===selected)||facts.plan.roles[0],theme=facts.plan.themes.find(t=>t.id===document.querySelector('.pl-theme[aria-pressed=true]')?.dataset.theme&&t.roles.includes(r.id))||facts.plan.themes.find(t=>t.roles.includes(r.id));const chain=theme.mechanisms[r.id];art.append(number('1,600','亿元 · 2030 GDP规划目标'));const gates=node('div','bp-life-gates');chain.forEach((text,i)=>{const gate=node('div','bp-life-gate'+(revealed?' is-open':''));gate.style.setProperty('--gate',i);gate.append(node('span',null,String(i+1).padStart(2,'0')),node('b',null,revealed?text:i===0?'先落地':'再过一关'));gates.append(gate);});art.append(gates,node('p','bp-art-note','目标与个人结果之间的条件示意，不是个人收入预测。'));}
function canonicalUrl(){const url=new URL(location.href);const change=new URLSearchParams(url.hash.slice(1)).get('change');if(/^C\d{3}$/.test(change||''))url.searchParams.set('change',change);url.searchParams.set('challenge',challengeId);url.searchParams.set('pick',selected);url.hash='';return url;}
const sheet=node('dialog','bp-sheet');sheet.setAttribute('aria-label','邀请朋友或查看这一幕的依据');
const grab=node('div','bp-sheet-grab'),sheetHead=node('div','bp-sheet-head'),sheetHeading=node('h2'),closeSheet=button('完成','bp-sheet-done',()=>hideSheet());sheetHead.append(sheetHeading,closeSheet);const sheetBody=node('div','bp-sheet-body');sheet.append(grab,sheetHead,sheetBody);body.append(sheet);
function openSheet(origin,evidence=false){if(!facts)return;returnFocus=origin;sheetBody.replaceChildren();sheetHeading.textContent=evidence?'这一幕的依据':'把这一幕，交给朋友';
 if(evidence){sheetBody.append(node('p','bp-sheet-intro',facts.evidence));for(const source of facts.sources||[]){const href=safeSource(source.url);if(!href)continue;const a=node('a','bp-source',source.title);a.href=href;a.target='_blank';a.rel='noopener noreferrer';sheetBody.append(a);}sheetBody.append(node('p','bp-sheet-foot','只使用当前收录资料。签约、施工、目标与实际结果分别标注。'));}
 else{
  if(!selected){toast('先选一次，再把你的观察交给朋友。');return;}
  const choice=choices.find(c=>c.id===selected),card=node('div','bp-postcard');card.append(node('span','bp-postcard-brand','博罗 · 六次发现'),node('strong',null,heading.textContent),node('p',null,'我的第一反应：'+choice.label),node('small',null,'你会选什么？打开后，先选，再看我们的差别。'));sheetBody.append(card);
  const nativeShare=button('发送这道挑战','bp-sheet-primary',async()=>{const url=canonicalUrl().href;try{if(navigator.share)await navigator.share({title:'博罗 · 你会怎么想？',text:heading.textContent+' 先选，再看我们想得一不一样。',url});else await copyLink();}catch(err){if(err.name!=='AbortError')await copyLink();}});
  const copy=button('复制挑战链接','bp-sheet-secondary',copyLink);const link=node('input','bp-share-url');link.readOnly=true;link.value=canonicalUrl().href;link.setAttribute('aria-label','可发送给朋友的挑战链接');link.addEventListener('focus',()=>link.select());
  sheetBody.append(nativeShare,copy,link,node('p','bp-sheet-foot','朋友打开后会先独立选择，再看到你们的不同。进度只保存在各自设备上。'));
 }
 if(!sheet.open)sheet.showModal();spring(sheet,[{opacity:0,transform:compact()?'translateY(80px)':'translateY(14px) scale(.95)'},{opacity:1,transform:'none'}],420);closeSheet.focus();
}
function compact(){return matchMedia('(max-width:800px)').matches;}
function hideSheet(){if(!sheet.open)return;if(reduced.matches){sheet.close();returnFocus?.focus();return;}const a=sheet.animate([{opacity:1,transform:'none'},{opacity:0,transform:compact()?'translateY(60px)':'translateY(12px) scale(.97)'}],{duration:180,easing:'ease-in'});a.finished.catch(()=>{}).then(()=>{sheet.close();returnFocus?.focus();});}
sheet.addEventListener('cancel',e=>{e.preventDefault();hideSheet();});sheet.addEventListener('click',e=>{const r=sheet.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)hideSheet();});
async function copyLink(){const value=canonicalUrl().href;try{await navigator.clipboard.writeText(value);toast('挑战链接已复制，朋友可以直接接着玩。');}catch{const input=sheet.querySelector('.bp-share-url');input?.focus();input?.select();toast('长按链接即可复制。');}}
function toggleMenu(on){menu.hidden=!on;menuButton.setAttribute('aria-expanded',String(on));if(on){spring(menu,[{opacity:0,transform:'translateY(-6px) scale(.95)'},{opacity:1,transform:'none'}],180);menu.querySelector('button')?.focus();}}
for(const [label,fn] of [['邀请朋友来选',()=>openSheet(menuButton)],['查看这一幕的依据',()=>openSheet(menuButton,true)],['重新选一次',()=>{selected='';revealed=false;scene.classList.remove('is-revealed');result.hidden=true;actions.hidden=true;revealButton.hidden=false;revealButton.disabled=true;for(const b of pickHost.children)b.setAttribute('aria-pressed','false');paint();pickHost.querySelector('button')?.focus();}]]){const b=button(label,'',()=>{toggleMenu(false);fn();});b.setAttribute('role','menuitem');menu.append(b);}
menuButton.addEventListener('click',()=>toggleMenu(menu.hidden));document.addEventListener('click',e=>{if(!menuWrap.contains(e.target))toggleMenu(false);});menu.addEventListener('keydown',e=>{const items=[...menu.children],at=items.indexOf(document.activeElement);if(e.key==='Escape'){toggleMenu(false);menuButton.focus();}if(['ArrowDown','ArrowUp'].includes(e.key)){e.preventDefault();items[(at+(e.key==='ArrowDown'?1:items.length-1))%items.length].focus();}});
const read=file=>fetch(file,{cache:'no-store'}).then(r=>{if(!r.ok)throw Error(file);return r.json();});
async function boot(){
 try{
 const [events,evidence,sources,life,plan]=await Promise.all(['data/relationship-changes-v1.json','data/relationship-evidence-v1.json','data/relationship-sources-v1.json','life.json','data/boluo-plan-life.v1.json'].map(read));
 const sourceFor=id=>{const event=events.changes.find(c=>c.change_id===id);return event.source_ids.map(id=>sources.sources.find(s=>s.source_id===id)).filter(Boolean).map(s=>({title:s.title,url:s.url}));};
 const presets={
 today:{title:'80亿签约。\n钱，已经落地了吗？',lead:'先别往下读。把你的第一反应放上来，再看这条新闻到了哪一步。',options:[['running','厂子已经开起来了'],['building','至少已经在建设'],['signed','只确认了签约']],resultTitle:'签约，是起点。实际产出还在后面。',resultText:'收录资料确认四宗项目签约。建设、投产、实际产出，不能提前当成已经发生。',evidence:'事件C004，发生于2026-08-03，结构库核验于2026-10-29。80亿元为签约投资，203亿元为预计年产值，均不是已实现产出。',sources:sourceFor('C004')},
 changes:{title:'桥还没通。\n变化就还没开始？',lead:'每天走这条路的人，可能会比新闻标题更早感到变化。你先想到哪一层？',options:[['wait','等通车才有变化'],['construction','施工期也会改变出行'],['opened','现在已经更快了']],resultTitle:'未通车，不等于没有变化。',resultText:'石洲大桥仍在重建，施工交通管控已被记录；实际多花几分钟，还需要出行实测。',evidence:'C006：石洲大桥重建，园洲—东莞石排，目标为双向六车道。事件2026-10-26，快照核验2026-10-29；预计2031年建成，不能提前算通车收益。',sources:sourceFor('C006')},
 basic:{title:'同一座博罗。\n两股相反的风。',lead:'不用算题。你猜，工业和投资在这一年朝着同一个方向走吗？',options:[['up','两个都在涨'],['down','两个都在跌'],['split','一个涨，一个跌']],resultTitle:'工业向上，投资向下。它们同时发生。',resultText:'2025年规上工业增加值增长8.7%，固定资产投资下降18.8%。眼前生产和未来投入，是两条不同的线索。',evidence:'2025年统计公报口径，沿用本站基本面页：规上工业增加值同比+8.7%，固定资产投资同比−18.8%。不同口径，不能相加或直接推出因果。',sources:[{title:'博罗县2025年国民经济和社会发展统计公报',url:'https://www.boluo.gov.cn/bmzb/xtjj/tjyj/tjfx/content/post_5801531.html'}]},
 comparison:{title:'关掉一条产线。\n整家公司会消失吗？',lead:'先看同一张网。点开变化，再看看真正退出的是什么。',options:[['company','整家公司退出'],['line','只标记这条产线退出'],['industry','整个行业一起退']],resultTitle:'断开的是有记录的产线，企业主体仍保留。',resultText:'固力水泥博罗分公司特定熟料生产线关停，并不等于企业所有业务消失，更不能把整个行业一起抹掉。',evidence:'C008：日产2500吨熟料生产线关停，主体设备拆除；仅涉及这条生产线，企业其他业务未说明。事件2026-02-13，核验快照2026-10-29。',sources:sourceFor('C008')},
 town:{title:'只留一站。\n你会带朋友去哪？',lead:'你熟悉的博罗，可能和朋友完全不一样。选一站，做你的本地推荐。',options:life.towns.map(t=>[t.n,t.n]),evidence:'镇街与吃玩特色沿用life.json公开资料快照（'+life.updated+'）。一站选择是个人偏好，不是实时人气排名。',sources:[{title:life.sourceLabel||'博罗公开文旅资料',url:'https://www.boluo.gov.cn/'}],towns:life.towns},
 planning:{title:'1600亿的目标。\n会落到你身上吗？',lead:'换一个身份，才看得见数字和自己的距离。这里先看联系，后面再进风洞推演。',options:plan.roles.map(r=>[r.id,r.label]),evidence:plan.note,sources:plan.sources.map(s=>({title:s.title,url:s.url})),plan}
 };
 facts=presets[page];if(!facts)throw Error('没有对应场景');if(page==='comparison')facts.model=window.BoluoCompareModel.build(evidence,events,sources,'C008');
 heading.textContent=facts.title;lead.textContent=facts.lead;setChoices(facts.options.map(([id,label])=>({id,label})));paint();scene.classList.add('is-ready');
 }catch(error){heading.textContent='这一幕暂时没能展开';lead.textContent='资料读取不完整，请先看下方原有内容。';pickLabel.hidden=true;pickHost.hidden=true;revealButton.hidden=true;art.textContent='没有用演示数字代替真实资料。';scene.classList.add('is-ready');}
}
heading.textContent='先看见，\n不一样的博罗。';lead.textContent='正在连接这一幕的真实资料…';boot();
})();
