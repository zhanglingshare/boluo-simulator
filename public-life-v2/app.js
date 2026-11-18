(()=>{'use strict';
const $=id=>document.getElementById(id);
const page=document.body.dataset.page;
const qs=new URLSearchParams(location.search);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeUrl=s=>{try{let u=new URL(s);return ['http:','https:'].includes(u.protocol)?u.href:'#'}catch{return '#'}};
const store=(k,v)=>{try{localStorage.setItem('bl-life-'+k,JSON.stringify(v))}catch{}};
const read=(k,f)=>{try{const o=JSON.parse(localStorage.getItem('bl-life-'+k));return o??f}catch{return f}};
const date=raw=>{const v=Date.parse(String(raw||''));return Number.isNaN(v)?null:new Date(v)};
const today=new Date();
function toast(m){const n=$('toast');if(!n)return;n.textContent=m;n.style.display='block';clearTimeout(window.__toast);window.__toast=setTimeout(()=>n.style.display='none',2600)}
function base64(o){return btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
function unbase(s){if(s.length>6500)throw Error('oversize');return JSON.parse(decodeURIComponent(escape(atob(s.replace(/-/g,'+').replace(/_/g,'/')))))}
async function share(data){const {title,text,url}=data;try{if(navigator.share){await navigator.share({title,text,url});return}if(navigator.clipboard){await navigator.clipboard.writeText(text+'\n'+url);toast('链接已复制，发给朋友吧');return}prompt('复制分享链接：',url)}catch(e){if(e.name!=='AbortError')prompt('复制链接：',url)}}
function status(t){$('syncInfo').textContent=t}
function sourceStatus(v){return v==='已核验'?'已核验':v==='待核实'?'待核实':'资料待核实'}
function guessSet(item){
const c=item.cat;return c==='industry'?['最先出现新就业','立刻增加实际产出','要等建设与投产进展','现在还不知道']:c==='tourism'?['附近消费一定上涨','游客可能改变出行计划','全县旅游收入立刻增长','还要核实活动与时间']:c==='livelihood'?['相关参与者直接感受到','马上改变全县经济','不会有任何变化','还要看更多反馈']:['直接影响周边生活','立刻影响整个县','只是一个无意义事件','需要继续核实'];
}
function matchedTown(item,towns){
const all=(item.title+' '+item.summary+' '+(item.fate?.objects||''));const named=towns.filter(t=>all.includes(t.n));return named;
}
function renderToday(data){
const list=Array.isArray(data.items)?data.items.filter(x=>x&&x.title).slice(0,35):[];
if(!list.length){$('eventStage').innerHTML='<p>暂时没有可显示的事件，稍后再来看看。</p>';return}
let allTowns=[];
fetch('../legacy/2026-10-11/life.json').then(r=>r.ok?r.json():Promise.reject()).then(d=>{allTowns=d.towns||[];select(active)}).catch(()=>{});
const bookmarked=read('followed',{});
const answers=read('answers',{});
const incomingGuess=qs.get('guess');
const incomingEvent=qs.get('event');
let active=Math.max(0,list.findIndex((x,i)=>String(i)===incomingEvent));
const stateKey=i=>'e'+i+':'+(list[i]?.published_at||'')+':'+list[i]?.title;
function select(i){active=i;const it=list[i],key=stateKey(i);if(!it)return;
const options=guessSet(it);const selected=answers[key]??'';
const incoming=String(i)===incomingEvent&&incomingGuess!==null&&/^\d$/.test(incomingGuess)&&+incomingGuess<options.length?+incomingGuess:null;
const isOld=(()=>{let d=date(it.event_date||it.published_at);return d&&today-d>86400000?true:false})();
$('eventStage').innerHTML=`
<div class="tag">${esc(it.emoji||'🔎')} ${esc(it.cat==='tourism'?'文旅活动':it.cat==='industry'?'产业变化':it.cat==='livelihood'?'身边生活':'博罗动态')} · ${esc(sourceStatus(it.verified_status))}</div>
<h2>${esc(it.title)}</h2>
<div class="kpis"><span>发生/报道：${esc(it.event_date||it.published_at||'日期待核实')}</span><span>资料采集：${esc((it.fetched_at||data.fetched_at||'待核实').slice(0,16))}</span><span>${isOld?'⚠ 已发生事件，勿当成实时活动':'请核对实际时效'}</span></div>
<div class="city-graphic"></div><p style="font-weight:750;color:#fff1dc">你觉得最值得关注的是？</p>
<div class="choices">${options.map((s,n)=>`<button class="choice ${selected===n?'active':''}" data-guess="${n}">${esc(s)}</button>`).join('')}</div>
<div id="reveal" class="reveal ${selected===''?'hidden':''}">
<strong>不是标准答案，而是证据核查。</strong>
<p>${esc(it.summary||'暂无完整摘要')}</p>
<p>这件事已经发生的部分，与未来可能产生的影响是两回事。不要把猜测当成事实。${incoming!==null?' 朋友的选择：'+esc(options[incoming])+'。':''}</p>
<div class="source">信息来源：${esc(it.source||'来源待核实')} · ${esc(sourceStatus(it.verified_status))} · <a href="${esc(safeUrl(it.url))}" target="_blank" rel="noopener noreferrer">打开原始线索 ↗</a></div></div>
<div class="actions"><button id="followBtn" class="button ${bookmarked[key]?'light':''}">${bookmarked[key]?'★ 已关注事件':'☆ 留下问题、关注后续'}</button><button id="shareEvent" class="button gold">↗ 发给朋友猜</button></div>
<p class="source">本页记录的是你的兴趣与判断，数据按来源实际更新。没有核实到后续，不会自动宣称结果已发生。</p>`;
$('eventStage').querySelectorAll('[data-guess]').forEach(btn=>btn.onclick=()=>{const n=+btn.dataset.guess;answers[key]=n;store('answers',answers);select(active);toast('判断已留在本机。下一步是看证据。')});
$('followBtn').onclick=()=>{if(bookmarked[key])delete bookmarked[key];else bookmarked[key]={title:it.title,at:new Date().toISOString(),index:i};store('followed',bookmarked);select(active);renderFollowed();toast(bookmarked[key]?'已关注，欢迎回来查看新进展':'已取消关注')};
$('shareEvent').onclick=()=>{const u=new URL(location.href);u.search='';u.searchParams.set('event',String(i));if(answers[key]!==undefined)u.searchParams.set('guess',String(answers[key]));share({title:it.title,text:'这件博罗的事，你怎么看？先选，再看证据。',url:u.href})};
const related=matchedTown(it,allTowns);const u=new URL('./towns.html',location.href);u.searchParams.set('fromEvent',it.title.slice(0,75));if(related[0])u.searchParams.set('town',related[0].n);$('townLink').href=u.href;$('townLink').textContent=related.length?'去看看'+related.map(t=>t.n).slice(0,2).join('、')+' ↗':'去过一种博罗生活 ↗';
document.querySelectorAll('.mini-item[data-event]').forEach(n=>n.classList.toggle('active',Number(n.dataset.event)===i));
}
$('eventList').innerHTML=list.map((it,i)=>`<button class="mini-item" data-event="${i}"><small>${esc(it.emoji||'📍')} ${esc(it.event_date||it.published_at||'待核实')} · ${esc(sourceStatus(it.verified_status))}</small><strong>${esc(it.title)}</strong><small>点击进入变化现场 →</small></button>`).join('');
$('eventList').querySelectorAll('[data-event]').forEach(btn=>btn.onclick=()=>select(+btn.dataset.event));
function renderFollowed(){const items=Object.values(bookmarked);$('followed').innerHTML=items.length?items.map(b=>`<div class="mini-item"><strong>${esc(b.title)}</strong><small>已保存关注 · 请打开最新公开资料核对实际进展</small></div>`).join(''):'<div class="empty">还没有收藏。选一件事，先留下你的判断。</div>'}
$('dataNotice').textContent='事件数据最近采集：'+(data.fetched_at||data.updated||'未知')+'。不代表实时直播。';
renderFollowed();select(active);
status('公开事件 '+list.length+' 条 · 采集 '+(data.updated||'待核实'));
}
const moods=[{id:'tea',label:'🍵 喝茶发呆',words:['茶','山茶','咖啡','山水','民宿','田园'],note:'适合慢下来，优先显示茶乡、田园和休闲线索'},{id:'walk',label:'🥾 山里散步',words:['山','绿道','水库','古村','东江','徒步','公园'],note:'优先显示自然景观与步行探索线索'},{id:'food',label:'🍲 吃点特别',words:['客家','肉丸','鸡','河鲜','菜','茶','水果','农家','甘蔗','柑'],note:'优先显示地方味道，不保证具体店铺营业'},{id:'friends',label:'👥 带朋友逛',words:['商圈','风情','古村','山','绿道','景区','夜宵','球场'],note:'适合共游的探索主题，不等于已安排好的路线'},{id:'alone',label:'🌿 一个人待着',words:['茶','田园','山','江','村','水库','绿道'],note:'优先考虑慢生活和自然环境，实际安静程度需现场核实'},{id:'home',label:'🏡 找家乡记忆',words:['客家','侨','古村','家乡','圩镇','农','老'],note:'从在地饮食、故事和乡土线索开始'}];
function renderTowns(data){
const towns=(data.towns||[]).filter(t=>t&&t.n);
let mood=read('mood','tea');if(!moods.some(m=>m.id===mood))mood='tea';
let plan=read('plan',[]).filter(x=>typeof x==='string'&&towns.some(t=>t.n===x)).slice(0,4);
if(qs.has('plan'))try{const incoming=unbase(qs.get('plan'));if(Array.isArray(incoming)&&incoming.length<=4&&incoming.every(x=>typeof x==='string'&&towns.some(t=>t.n===x))){if(confirm('收到朋友发来的探索计划。要在本机加载这份计划吗？')){plan=incoming;store('plan',plan)}}}catch(e){toast('分享链接无法读取，已保留本机计划')}
const townFrom=qs.get('town');if(townFrom&&towns.some(t=>t.n===townFrom)){$('townFilter').value=townFrom}
const savedTown=townFrom&&towns.some(t=>t.n===townFrom)?townFrom:'';
$('townFilter').innerHTML='<option value="">不指定镇街</option>'+towns.map(t=>`<option value="${esc(t.n)}">${esc(t.n)}</option>`).join('');
if(savedTown)$('townFilter').value=savedTown;
const event=qs.get('fromEvent');if(event){$('incomingEvent').textContent='你从这件现实变化来到这里：'+event.slice(0,75)+'。挑一个地方继续探索，具体活动有效期需要另行核实。'}
$('moods').innerHTML=moods.map(m=>`<button class="chip ${mood===m.id?'active':''}" data-mood="${m.id}">${m.label}</button>`).join('');
$('moods').querySelectorAll('[data-mood]').forEach(btn=>btn.onclick=()=>{mood=btn.dataset.mood;store('mood',mood);paint()});
function rank(t){const m=moods.find(x=>x.id===mood);const text=[t.tag,t.why,...(t.foods||[]),...(t.plays||[])].join(' ');return m.words.reduce((p,s)=>p+(text.includes(s)?2:0),0)+(mood==='friends'&&t.plays?.length>=2?1:0)}
function paint(){
$('moods').querySelectorAll('button').forEach(b=>b.classList.toggle('active',b.dataset.mood===mood));
const f=$('townFilter').value;let sorted=towns.map((t,i)=>({...t,score:rank(t),original:i})).filter(t=>!f||t.n===f).sort((a,b)=>b.score-a.score||a.original-b.original);
if(!f&&sorted.some(t=>t.score>0))sorted=sorted.filter(t=>t.score>0);
const duration=$('duration').value;
const limit=duration==='half'?6:duration==='day'?9:12;
const visible=sorted.slice(0,limit);
$('matchCount').textContent=visible.length+'个探索主题';
$('filterHint').textContent=moods.find(x=>x.id===mood).note+' · '+(duration==='half'?'半日先少选，留足交通时间':duration==='day'?'一天也不宜安排过多跨镇点位':'按兴趣慢慢挑')+'。';
$('townGrid').innerHTML=visible.map(t=>`<article class="town-card"><div class="tag">🏘️ ${esc(t.tag||'地方线索')} · ${t.verified_status==='pending'?'待进一步核实':'资料待核实'}</div><h3>${esc(t.n)}</h3><div class="mood">${esc((t.foods||[]).slice(0,2).join(' · ')||'了解当地味道')}</div><p>🌿 ${esc((t.plays||[]).join(' / ')||'待补充真实体验地点')}</p><p style="min-height:0;font-size:11px">为什么值得看看：${esc(t.why||'待核实')}</p><div class="foot"><small>${plan.includes(t.n)?'已加入共同计划':'探索主题，不代表营业地点'}</small><button class="button" data-add="${esc(t.n)}" ${plan.includes(t.n)?'disabled':''}>${plan.includes(t.n)?'已加入':'＋ 加入计划'}</button></div></article>`).join('')||'<div class="empty">没有匹配的线索，换一种心情试试。</div>';
$('townGrid').querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>{if(plan.length>=4)return toast('最多选4个镇街，减少赶路');if(!plan.includes(b.dataset.add)){plan.push(b.dataset.add);store('plan',plan);paint();renderPlan();toast('已加入共同计划')}});
}
function renderPlan(){$('planList').innerHTML=plan.length?plan.map((n,i)=>`<div class="plan-item"><span><strong>${i+1}. ${esc(n)}</strong><br><small class="muted">探索主题，具体地点与交通待确认</small></span><button aria-label="移除${esc(n)}" data-remove="${i}">移除</button></div>`).join(''):'<div class="empty">还没有计划。先从上面选一个想去的地方。</div>';$('planList').querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>{plan.splice(+b.dataset.remove,1);store('plan',plan);renderPlan();paint()})}
$('clearPlan').onclick=()=>{if(!plan.length)return;plan=[];store('plan',plan);paint();renderPlan();toast('已清空')};
$('sharePlan').onclick=()=>{if(!plan.length)return toast('先添加一个想去的地方');const u=new URL('./towns.html',location.href);u.searchParams.set('plan',base64(plan));$('shareNote').textContent='这是手动接力链接。朋友修改后需要重新分享，不是自动同步。';share({title:'我们的博罗探索计划',text:'我选了'+plan.join('、')+'，你再加一个想去的地方？',url:u.href})};
$('duration').onchange=paint;$('companion').onchange=()=>{$('filterHint').textContent='同行信息只用于整理你的计划，不会上传个人数据。';paint()};$('townFilter').onchange=paint;
paint();renderPlan();status('已读取 '+towns.length+' 个镇街线索 · 更新 '+(data.updated||'日期待核实'));
}
if(page==='today'){fetch('../data/hot-last.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('HTTP '+r.status);return r.json()}).then(renderToday).catch(()=>{status('事件数据暂不可用');$('eventStage').innerHTML='<div class="empty">数据暂时没有加载成功。<button class="button" onclick="location.reload()">重试加载</button></div>';toast('请确认网络连接')})}
if(page==='towns'){fetch('../legacy/2026-10-11/life.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('HTTP '+r.status);return r.json()}).then(renderTowns).catch(()=>{status('镇街资料暂不可用');$('townGrid').innerHTML='<div class="empty">资料加载失败，请检查网络并刷新。</div>'})}
})();