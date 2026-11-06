(() => {
'use strict';
const $=id=>document.getElementById(id);
const qa=s=>Array.from(document.querySelectorAll(s));
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const MODELS={
 delay:{
  label:'关键项目晚一年',effect:[-36,0,0,0,0],spread:[15,0,0,0,0],
  buffer:'其他项目提前接棒',bufferDetail:'恢复部分新产能接续，并压低部分不确定性',
  nodes:['项目延期','新产线接续','本地工程配套','2030产出形成'],
  questions:['关键项目的真实投产时间有没有调整？','延迟是否影响某些新增产线？','设备与工程订单真正交给了谁？','产出会在2030年前补回多少？'],
  unknown:'首先核查项目级建设状态、生产线真实投产时间与订单。'
 },
 invest:{
  label:'投资接续走弱',effect:[-18,-30,0,0,0],spread:[8,12,0,0,0],
  buffer:'存量产能效率提升',bufferDetail:'允许既有企业部分抵消新增投入的减弱',
  nodes:['新增投资收缩','项目建设节奏','存量产线利用','2030产业规模'],
  questions:['工业投资收缩具体来自什么项目与阶段？','是否影响实际开工、设备安装和验收？','存量产线是否仍有增加产出的余地？','新的实际生产能否弥补投入缺口？'],
  unknown:'先追踪在建项目、设备安装与产能利用，不把投资降幅当成GDP降幅。'
 },
 orders:{
  label:'本地订单外流',effect:[-25,-13,0,0,0],spread:[12,8,0,0,0],
  buffer:'企业拓展替代客户',bufferDetail:'允许配套企业获得部分替代订单',
  nodes:['供应订单变化','配套企业暴露','替代客户能力','2030增加值'],
  questions:['真实订单来自哪些客户、哪些地区？','本地供应企业的集中度有多高？','替代客户能否在合同周期内形成？','当地增加值和工资究竟受到多大影响？'],
  unknown:'优先补供应商交易矩阵、客户集中度与合同替代时间。'
 },
 traffic:{
  label:'通勤压力上升',effect:[0,0,-8,-25,0],spread:[0,0,8,11,0],
  buffer:'改善通勤与服务接驳',bufferDetail:'允许部分人才流动与服务效率约束缓解',
  nodes:['通勤成本上升','招聘与人才流动','产业服务协同','2030发展贡献'],
  questions:['跨镇及跨城通勤时间是否实际变长？','受影响的岗位与企业是哪一类？','服务与人才约束是否形成真实延迟？','影响能否被其他空间与服务安排缓冲？'],
  unknown:'需要实测通勤时间、招聘与岗位变化，而不是用交通拥堵直接估计GDP。'
 }
};
const qs=new URL(location.href).searchParams;
const allowable=(x,vals,f)=>vals.includes(x)?x:f;
const shockFromRoute={new:'delay',manufacturing:'orders',innovation:'invest',services:'orders',connect:'traffic'};
const first=allowable(qs.get('shock'),Object.keys(MODELS),allowable(shockFromRoute[qs.get('route')],Object.keys(MODELS),'delay'));
const inputStrength=Number(qs.get('strength'));
const initialStrength=Number.isFinite(inputStrength)&&inputStrength>=.6&&inputStrength<=1.4?Math.round(inputStrength*5)/5:1;
const state={shock:first,strength:initialStrength,buffer:qs.get('buffer')==='1',active:qs.get('active')!=='0',focused:0,running:false,seed:42,count:3200,reduced:matchMedia('(prefers-reduced-motion: reduce)').matches};
let last=null,animTimer=0,toastTimer=0;
const fmt=n=>Number.isFinite(n)?Math.round(n).toLocaleString('zh-CN'):'—';
const signed=n=>Number.isFinite(n)?(n>0?'+':'')+fmt(n):'—';
const pct=n=>Number.isFinite(n)?n.toFixed(1)+'%':'—';
function goodModel(){return typeof HT!=='undefined'&&HT&&typeof HT.run==='function'&&Array.isArray(HT.DEFAULT_PATHS);}
function copyPaths(paths){return paths.map(p=>({...p}));}
function testPaths(meta,strength,buffer) {
 const r=copyPaths(HT.DEFAULT_PATHS);
 for(let i=0;i<r.length;i++){
   const change=meta.effect[i]*strength;
   const rescue=buffer ? -change*.55 : 0;
   r[i].mu=Math.max(0,r[i].mu+change+rescue);
   const uncertainty=meta.spread[i]*strength*(buffer?.58:1);
   r[i].sd=Math.max(0,r[i].sd+uncertainty);
 }
 return r;
}
function runThree(){
 if(!goodModel())return null;
 const m=MODELS[state.shock],args={base:HT.BASE,target:HT.TARGET,noise:HT.NOISE_SD};
 const reference=HT.run(state.seed,state.count,copyPaths(HT.DEFAULT_PATHS),args);
 const stressed=state.active?HT.run(state.seed,state.count,testPaths(m,state.strength,false),args):reference;
 const recovered=state.buffer&&state.active?HT.run(state.seed,state.count,testPaths(m,state.strength,true),args):null;
 return {base:reference,stress:stressed,buffer:recovered};
}
function tickLabels(){
 const v=state.strength;
 return v<=.6?'轻度压力':v>=1.4?'较强压力':'中等压力';
}
function renderControls(){
 qa('[data-shock]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.shock===state.shock)));
 $('strength').value=String(state.strength);
 $('strengthLabel').textContent=tickLabels();
 $('bufferOn').checked=state.buffer;
 const m=MODELS[state.shock];
 $('bufferName').textContent=m.buffer;
 $('bufferDesc').textContent=m.bufferDetail;
 $('resultLead').textContent=state.active?m.label+' · 与未施加冲击的基准情景并排对照。':'当前为基准条件。点击“开始一次实验”查看所选冲击。';
}
function renderNumbers(r){
 const s=r.stress,b=r.base;
 $('afterMedian').textContent=fmt(s.p50);
 $('medianDelta').textContent=signed(s.p50-b.p50);
 $('afterHit').textContent=pct(s.hit);
 $('hitDetail').textContent='基准 '+pct(b.hit)+' · 仅模型内占比';
 $('rangeBase').textContent='基准 P10—P90：'+fmt(b.p10)+'—'+fmt(b.p90);
 $('rangeShock').textContent='压力 P10—P90：'+fmt(s.p10)+'—'+fmt(s.p90);
 $('rangeBuffer').hidden=!r.buffer;
 $('bufferLegend').hidden=!r.buffer;
 if(r.buffer)$('rangeBuffer').textContent='缓冲 P10—P90：'+fmt(r.buffer.p10)+'—'+fmt(r.buffer.p90);
 $('beforeBuffer').textContent=fmt(s.p50);
 $('afterBuffer').textContent=r.buffer?fmt(r.buffer.p50):'—';
 const delta=s.p50-b.p50, spread=s.p90-s.p10,baseSpread=b.p90-b.p10;
 const meta=MODELS[state.shock];
 $('resultInsight').textContent=!state.active?'没有添加冲击，就不应该凭空产生损失。':
 r.buffer?'缓冲有用吗？比较的是三组条件结果。':
 Math.abs(delta)>30?'目标可能不变，但结果的分布已经明显移动。':
 '一处变化，不一定产生巨大的总量变化。';
 $('resultExplain').textContent=!state.active?'基准情景没有施加额外压力。这并不意味着现实世界没有风险。':
 '本次中位数相对基准'+signed(delta)+'亿元；P10—P90区间宽度'+(spread>=baseSpread?'扩大约':'缩小约')+fmt(Math.abs(spread-baseSpread))+'亿元。均为条件设定下的模拟结果。';
 $('bufferTakeaway').textContent=r.buffer?'缓冲假设下，中位数相对未缓冲变化 '+signed(r.buffer.p50-s.p50)+' 亿元。它不是已实施政策的效果评估。':'开启一种缓冲条件后，展示同一种子下的第三组模拟结果。';
 $('shareSummary').textContent=state.active?'选择“'+meta.label+'”，压力档位'+tickLabels()+'，模型中位数由'+fmt(b.p50)+'变为'+fmt(s.p50)+'亿元。'+(r.buffer?'增加缓冲后为'+fmt(r.buffer.p50)+'亿元。':'')+'这是可复现实验，不是事实预测。':'当前是原有基准模型，尚未加入额外变化。';
 const impacts=meta.effect.map((v,i)=>v===0?null:HT.DEFAULT_PATHS[i].name+'：均值'+signed(v*state.strength)+'亿元').filter(Boolean).join('；');
 $('assumptionText').textContent='当前场景“'+meta.label+'”使用受控 C 级机制假设：'+(impacts||'没有额外均值调整')+'。同时对指定路径增加有限标准差以模拟不确定性。缓冲仅部分恢复该调整幅度；这些系数尚未通过项目级独立数据识别，不能当作已证实的GDP因果效应。';
}
function pathFor(points){
 if(!points.length)return '';
 let out='M'+points[0][0].toFixed(1)+' '+points[0][1].toFixed(1);
 for(let i=1;i<points.length;i++){
  const [x,y]=points[i];out+='L'+x.toFixed(1)+' '+y.toFixed(1);
 }
 return out;
}
function density(xs,x,band) {
 let sum=0;
 for(let i=0;i<xs.length;i++){
  const z=(x-xs[i])/band;
  if(Math.abs(z)<4)sum+=Math.exp(-.5*z*z);
 }
 return sum/xs.length/band;
}
function chartRender(results,animate=false){
 const mobile=matchMedia('(max-width:620px)').matches;
 const W=mobile?360:720,H=mobile?233:276;
 const L=mobile?34:47,R=mobile?13:26,T=mobile?29:34,B=mobile?39:43;
 const x0=L,x1=W-R,y0=T,y1=H-B,plotW=x1-x0,plotH=y1-y0;
 const series=[{name:'base',m:results.base},{name:'stress',m:results.stress}];
 if(results.buffer)series.push({name:'buffer',m:results.buffer});
 const all=series.map(s=>s.m);
 const min=Math.floor((Math.min(...all.map(m=>m.p10),HT.TARGET)-80)/50)*50;
 const max=Math.ceil((Math.max(...all.map(m=>m.p90),HT.TARGET)+80)/50)*50;
 const lower=Math.min(min,1250),upper=Math.max(max,1850),n=67;
 const sx=x=>x0+(x-lower)/(upper-lower)*plotW;
 const bw=22;
 const densities=series.map(s=>Array.from({length:n},(_,i)=>{
  const v=lower+(upper-lower)*i/(n-1);
  return {x:v,d:density(s.m.results,v,bw)};
 }));
 const highest=Math.max(0.001,...densities.flat().map(d=>d.d))*1.19;
 let svg='<defs><clipPath id="windClip"><rect x="'+x0+'" y="'+y0+'" width="'+plotW+'" height="'+plotH+'"/></clipPath></defs>';
 for(let j=0;j<4;j++){
  const y=y0+(plotH/3)*j;
  svg+='<path class="distribution-grid" d="M'+x0+' '+y.toFixed(1)+'H'+x1+'"/>';
 }
 const xlabels=mobile?4:5;
 for(let j=0;j<xlabels;j++){
  const val=lower+(upper-lower)*j/(xlabels-1),x=sx(val);
  svg+='<text class="x-tick" x="'+x.toFixed(1)+'" y="'+(H-15)+'">'+fmt(val)+'</text>';
 }
 svg+='<text x="'+(x0-6)+'" y="'+(y0+7)+'" text-anchor="end" fill="#80a8d2" font-size="10">频度</text>';
 const targetX=sx(HT.TARGET),chipX=clamp(targetX,x0+47,x1-47);
 svg+='<path class="target-line" d="M'+targetX.toFixed(1)+' '+(y0-7)+'V'+y1+'"/>'+
 '<rect class="target-chip" x="'+(chipX-(mobile?39:49))+'" y="2" width="'+(mobile?78:98)+'" height="23" rx="11"/>'+
 '<text class="target-label" x="'+chipX+'" y="18">'+(mobile?'1600亿':'目标 1600亿')+'</text>';
 for(let i=0;i<series.length;i++){
  const s=series[i],p=densities[i].map(q=>[sx(q.x),y1-q.d/highest*plotH]);
  const d=pathFor(p);
  const area=d+'L'+x1+' '+y1+'L'+x0+' '+y1+'Z';
  svg+='<g clip-path="url(#windClip)"><path class="area-path '+s.name+'-area" d="'+area+'"/><path class="dist-path '+s.name+'-line" d="'+d+'"/></g>';
 }
 const chart=$('distChart');chart.setAttribute('viewBox','0 0 '+W+' '+H);
 chart.innerHTML=svg;chart.classList.remove('wave');
 if(animate&&!state.reduced){void chart.getBoundingClientRect().width;chart.classList.add('wave');}
 chart.setAttribute('aria-label','相同随机种子下模拟GDP分布：基准中位'+fmt(results.base.p50)+'亿元，冲击中位'+fmt(results.stress.p50)+'亿元'+(results.buffer?'，缓冲中位'+fmt(results.buffer.p50)+'亿元':'')+'。目标线为1600亿元。');
}
function renderChain(){
 const m=MODELS[state.shock];
 for(let i=0;i<4;i++){$('chain'+i).textContent=m.nodes[i];}
 qa('[data-link]').forEach((b,i)=>b.classList.toggle('active',i===state.focused));
 $('chainStepTag').textContent=['变化起点','第一层传导','第二层传导','可能的2030结果'][state.focused];
 $('chainQuestion').textContent=m.questions[state.focused];
 $('chainCaveat').textContent='这是一条可能的机制路径。'+m.unknown;
}
function progressChain(){
 clearInterval(animTimer);
 const group=$('chainTrack');
 if(state.reduced){state.focused=3;renderChain();return;}
 state.focused=0;group.classList.add('running');renderChain();
 let step=0;
 animTimer=setInterval(()=>{
  step++;state.focused=clamp(step,0,3);renderChain();
  if(step>=3){clearInterval(animTimer);animTimer=0;group.classList.remove('running');}
 },480);
}
function run(animate=false){
 if(!goodModel()){$('modelFailure').hidden=false;return;}
 $('modelFailure').hidden=true;
 renderControls();
 const output=runThree();
 if(!output)return;
 last=output;
 renderNumbers(output);
 if(animate&&!state.reduced){
  qa('.readout').forEach(node=>{node.classList.remove('recomputed');void node.offsetWidth;node.classList.add('recomputed');});
 }
 chartRender(output,animate);
 renderChain();
 if(animate)progressChain();
 syncURL();
}
function syncURL(){
 try{
  const u=new URL(location.href);
  u.searchParams.set('shock',state.shock);
  u.searchParams.set('strength',String(state.strength));
  u.searchParams.set('buffer',state.buffer?'1':'0');
  u.searchParams.set('active',state.active?'1':'0');
  history.replaceState(null,'',u.pathname+u.search+u.hash);
 }catch{}
}
function toast(message){
 const e=$('toast');e.textContent=message;e.classList.add('on');clearTimeout(toastTimer);
 toastTimer=setTimeout(()=>e.classList.remove('on'),2800);
}
function modify(updates,animate=true) {
 Object.assign(state,updates);clearInterval(animTimer);animTimer=0;
 run(animate);
}
qa('[data-shock]').forEach(b=>b.addEventListener('click',()=>modify({shock:b.dataset.shock,active:true,focused:0},true)));
$('strength').addEventListener('input',e=>modify({strength:clamp(Math.round(Number(e.target.value)*5)/5,.6,1.4),active:true},false));
$('strength').addEventListener('change',()=>run(true));
$('runTest').addEventListener('click',()=>modify({active:true,focused:0},true));
$('replay').addEventListener('click',()=>{state.focused=0;run(true);});
$('reset').addEventListener('click',()=>modify({active:false,buffer:false,focused:0},true));
$('bufferOn').addEventListener('change',e=>modify({buffer:Boolean(e.target.checked),active:true},true));
qa('[data-link]').forEach(b=>b.addEventListener('click',()=>{clearInterval(animTimer);animTimer=0;state.focused=Number(b.dataset.link);$('chainTrack').classList.remove('running');renderChain();}));
function modal(title,body){
 $('modalTitle').textContent=title;$('modalBody').innerHTML=body;if(!$('modal').open)$('modal').showModal();
}
$('modalClose').addEventListener('click',()=>$('modal').close());
$('modal').addEventListener('click',e=>{if(e.target===$('modal'))$('modal').close();});
$('whyButton').addEventListener('click',()=>{
 if(!last)return;
 const m=MODELS[state.shock];
 const rows=HT.DEFAULT_PATHS.map((p,i)=>m.effect[i]===0&&m.spread[i]===0?'':'<div class="fact-row"><strong>'+esc(p.name)+'</strong><p>本次设定：五年累计路径贡献的假设均值调整 '+esc(signed(m.effect[i]*state.strength))+' 亿元，标准差增加 '+esc(fmt(m.spread[i]*state.strength))+' 亿元；这些数字不是直接观测。</p></div>').join('');
 modal('情景是怎样改变结果的？','<p><strong>'+esc(m.label)+'</strong> 不是一个被实证估计的单一因果系数。此页用同一粒随机种子，在既有模型上有限度调整路径贡献的均值和离散程度，比较结果分布。</p>'+rows+'<p>目前既有基准路径贡献之和被设定得与2030目标规模差额接近，模型给出的达标占比并非独立验证的真实概率。请重点比较情景之间的方向、条件和不确定性，而非单个百分数。</p><p><a href="../windtunnel-v2.html" target="_blank" rel="noopener noreferrer">检查历史风洞 V2 ↗</a></p>');
});
function link(){
 syncURL();const u=new URL(location.href);u.hash='results';return u.href;
}
async function share(){
 const url=link();
 try{if(!navigator.clipboard?.writeText)throw Error('clipboard unsupported');await navigator.clipboard.writeText(url);toast('已复制复现实验链接');}
 catch{modal('复制复现实验链接','<p>以下链接包含冲击、压力档位与缓冲开关，不包含个人资料。</p><input id="shareFallback" readonly style="width:100%;padding:11px;border:1px solid #bfddf8;border-radius:8px" value="'+esc(url)+'"><p>如无法自动复制，请长按选中。</p>');$('shareFallback').focus();$('shareFallback').select();}
}
$('copyLink').addEventListener('click',share);$('shareTop').addEventListener('click',share);
$('saveExp').addEventListener('click',()=>{
 if(!last)return;
 const record={shock:state.shock,strength:state.strength,buffer:state.buffer,active:state.active,median:last.stress.p50,baseline:last.base.p50,savedAt:new Date().toISOString()};
 try{
 const key='boluo-v11-wind-experiments',stored=JSON.parse(localStorage.getItem(key)||'[]');
 localStorage.setItem(key,JSON.stringify([record,...(Array.isArray(stored)?stored:[])].slice(0,25)));
 toast('实验条件保存在本机，可由分享链接复现');
 }catch{toast('浏览器未允许本机保存，请使用分享链接');}
});
$('savedList').addEventListener('click',()=>{
 let data=[];try{const v=JSON.parse(localStorage.getItem('boluo-v11-wind-experiments')||'[]');data=Array.isArray(v)?v:[];}catch{}
 if(!data.length){modal('我的风洞记录','<p>还没有本机保存的实验。先选一种压力条件，运行后点击“保存本机实验”。</p>');return;}
 const markup=data.slice(0,25).map((d,i)=>{
  const shock=allowable(d.shock,Object.keys(MODELS),'delay');
  const strength=Number.isFinite(+d.strength)?clamp(+d.strength,.6,1.4):1;
  const u=new URL(location.href);u.searchParams.set('shock',shock);u.searchParams.set('strength',String(strength));u.searchParams.set('buffer',d.buffer?'1':'0');u.searchParams.set('active',d.active===false?'0':'1');u.hash='results';
  return '<div class="fact-row"><strong>'+String(i+1).padStart(2,'0')+' · '+esc(MODELS[shock].label)+'</strong><p>档位 '+esc(String(strength))+' / 缓冲 '+(d.buffer?'开':'关')+' / 模型中位 '+esc(fmt(Number(d.median)))+'亿元</p><a href="'+esc(u.href)+'">恢复此实验 ↗</a></div>';
 }).join('');
 modal('我的风洞记录 · 仅本机','<p>记录存放在当前浏览器。分享链接只有公开模型参数。</p>'+markup);
});
document.addEventListener('visibilitychange',()=>{if(document.hidden)clearInterval(animTimer);});
window.addEventListener('pagehide',()=>clearInterval(animTimer));
window.addEventListener('resize',()=>{if(last)chartRender(last,false);},{passive:true});
window.addEventListener('popstate',()=>{
 const q=new URL(location.href).searchParams;
 state.shock=allowable(q.get('shock'),Object.keys(MODELS),'delay');
 const num=Number(q.get('strength'));state.strength=Number.isFinite(num)&&num>=.6&&num<=1.4?Math.round(num*5)/5:1;
 state.buffer=q.get('buffer')==='1';state.active=q.get('active')!=='0';state.focused=0;
 run(false);
});
if(!goodModel()){
 $('modelFailure').hidden=false;
 qa('[data-shock]').forEach(b=>b.disabled=true);
 $('runTest').disabled=true;
 $('strength').disabled=true;
 $('bufferOn').disabled=true;
}else{
 run(false);
}
window.BoluoWind={getState:()=>({...state}),rerun:()=>run(false),getResults:()=>last&&({base:{p10:last.base.p10,p50:last.base.p50,p90:last.base.p90,hit:last.base.hit},stress:{p10:last.stress.p10,p50:last.stress.p50,p90:last.stress.p90,hit:last.stress.hit},buffer:last.buffer&&({p10:last.buffer.p10,p50:last.buffer.p50,p90:last.buffer.p90,hit:last.buffer.hit})})};
})();