(function boluoQuest(){
'use strict';
const QUESTIONS=[
{id:'C004',kind:'money',icon:'📝',label:'第1关 · 钱真的花了吗？',question:'签约80亿元，是已经花完80亿元吗？',options:['是，已经花完','不是，还要建设'],correct:1,explain:'80亿元是4个项目的计划投资。签约不等于实际投资。',source:'2026-08-03 · 博罗县政府',stat:'80亿元',status:'计划投资'},
{id:'C006',kind:'bridge',icon:'🌉',label:'第2关 · 桥真的通车了吗？',question:'石洲大桥计划6车道，现在能按6车道走吗？',options:['还不能，桥在修','能，已经通车了'],correct:0,explain:'旧桥是双向2车道。新桥计划双向6车道，施工期有交通管制。',source:'2026-10-26 · 交通管制通告',stat:'2 → 6',status:'原桥 → 计划新桥'},
{id:'M2025',kind:'numbers',icon:'📊',label:'第3关 · 两个数字对撞',question:'2025年博罗，工业涨、投资跌，能同时发生吗？',options:['能，两个都是真的','不能，不可能'],correct:0,explain:'工业增加值增长8.7%，固定资产投资下降18.8%。不是同一件事。',source:'2025年博罗统计公报',stat:'+8.7% / −18.8%',status:'工业 / 固定资产投资'},
{id:'C006-LINK',kind:'links',icon:'🔗',label:'第4关 · 找到那条联系',question:'石洲大桥施工，最该先看哪条联系？',options:['园洲和东莞的跨市往来','博罗所有民宿都涨价了'],correct:0,explain:'桥连着园洲和东莞石排。施工会涉及跨市通行，但影响多少还要查。',source:'2026-10-26 · 交通管制通告',stat:'园洲 ↔ 东莞',status:'已知地点 · 影响待查'}
];
const $=v=>document.getElementById(v);
let step=0,answers={},speed=null,best=0,roundDone=false;
try{const v=JSON.parse(localStorage.getItem('boluo-easy-quest-v1')||'{}');best=Number.isFinite(v.best)?Math.min(100,Math.max(0,v.best)):0;}catch(e){}
const hash=new URLSearchParams(location.hash.replace(/^#/,''));
if(hash.get('challenge')==='1'){const n=Number(hash.get('q'));if(Number.isInteger(n)&&n>=0&&n<4)step=n;}
const fmt=n=>Math.round(n).toLocaleString('zh-CN');
const correctCount=()=>Object.keys(answers).filter(i=>answers[i]===QUESTIONS[Number(i)].correct).length;
const score=()=>correctCount()*25;
let reportCache=new Map();
function simulate(v){
if(typeof HT==='undefined'||typeof HT.run!=='function')return null;
if(reportCache.has(v))return reportCache.get(v);
const paths=HT.DEFAULT_PATHS.map((p,i)=>({...p,mu:i===0?p.mu*(v/100):p.mu,sd:i===0?p.sd*(v/100):p.sd}));
const r=HT.run(42,3600,paths);reportCache.set(v,r);return r;
}
function visual(kind){
if(kind==='money')return '<div class="bp-figure"><div><small>已签约 · 计划投资</small><strong>80<b>亿元</b></strong></div><div class="planned"><small>已实际投资多少？</small><strong style="font-size:30px;letter-spacing:0;margin-top:16px">未知</strong></div></div><p class="bp-visual-note">签约数字不能直接当成已经花的钱。</p>';
if(kind==='bridge')return '<div class="bp-figure"><div><small>原来的桥</small><strong>2<b>车道</b></strong></div><div class="planned"><small>计划建好的桥</small><strong>6<b>车道</b></strong></div></div><p class="bp-visual-note">计划双向6车道 ≠ 现在已经能走6车道。</p>';
if(kind==='numbers')return '<div class="bp-figure"><div><small>2025 工业增加值</small><strong style="color:#aef6d5">+8.7<b>%</b></strong></div><div class="planned"><small>2025 固定资产投资</small><strong>−18.8<b>%</b></strong></div></div><p class="bp-visual-note">同一年的两种变化：一个增加，一个减少。</p>';
return '<div class="bp-linknet"><span>园洲</span><div class="arrow">↔</div><span>石洲大桥<br>正在重建</span><div class="arrow">↔</div><span>东莞石排</span></div><p class="bp-visual-note">跨市通行有关联。物流、上班受到多大影响，还需实测。</p>';
}
function question(){
const q=QUESTIONS[step],pick=answers[step],answered=pick!==undefined,win=pick===q.correct;
return `<div class="bp-sub">${q.label}</div><h2 class="bp-question">${q.question}</h2>
${answered?`<div class="bp-visual">${visual(q.kind)}</div>`:`<div class="bp-visual" style="display:flex;align-items:center;justify-content:center;min-height:117px"><span style="font-size:58px;margin-right:20px">${q.icon}</span><div><span style="font-size:13px;color:#9edbd2">博罗真实变化</span><div class="bp-result">${q.stat}</div><div class="bp-tiny">${q.status}</div></div></div>`}
<div class="bp-choices" role="group" aria-label="选择答案">${q.options.map((x,i)=>`<button data-action="play" data-value="answer:${i}" ${answered?'disabled':''} class="bp-choice ${pick===i?(win?'picked':'wrong'):''}" aria-pressed="${pick===i}">${x}</button>`).join('')}</div>
${answered?`<div class="bp-reveal"><strong>${win?'✓ 答对了，得25分！':'再看一眼，答案出来了'}</strong><p>${q.explain}</p><p style="opacity:.77;font-size:11px">${q.source}</p></div><button class="bp-next" data-action="play" data-value="next">${step===3?'去改变未来条件 →':'下一关 →'}</button><button class="bp-mini-share" data-action="play" data-value="shareq">发这一题给朋友</button>`:'<div class="bp-tiny" style="margin-top:8px">选一个。答完马上看图。</div>'}`;
}
function sandbox(){
const base=simulate(100),r=speed===null?null:simulate(speed),d=base&&r?r.p50-base.p50:0;
return `<div class="bp-sub">第5关 · 真正动手试一试</div><h2 class="bp-question">新工厂慢一点，2030会怎样？</h2><p class="bp-explain">选一个速度。真正让原版模型再算一遍。</p>
<div class="bp-choices" style="grid-template-columns:repeat(3,minmax(0,1fr))">${[[75,'慢一点'],[100,'照原计划'],[110,'快一点']].map(x=>`<button data-action="play" data-value="speed:${x[0]}" class="bp-choice ${speed===x[0]?'picked':''}" style="font-size:13px;min-height:77px"><span style="font-size:23px;display:block">${x[0]}%</span>${x[1]}</button>`).join('')}</div>
${r&&base?`<div class="bp-visual"><div class="bp-sub">2030年 · 模型结果中间值</div><div class="bp-bars"><div><span>原设定</span><span class="bp-track"><span class="bp-fill" style="display:block;width:${Math.min(100,base.p50/1900*100)}%"></span></span><b>${fmt(base.p50)}亿</b></div><div><span>你选的</span><span class="bp-track"><span class="bp-fill" style="display:block;width:${Math.min(100,r.p50/1900*100)}%"></span></span><b>${fmt(r.p50)}亿</b></div></div><div class="bp-figure" style="margin-top:10px"><div><small>中间值变化</small><strong style="font-size:36px">${d>=0?'+':''}${fmt(d)}<b>亿</b></strong></div><div><small>达到1600的模拟比例</small><strong style="font-size:36px">${r.hit.toFixed(1)}<b>%</b></strong></div></div><p class="bp-visual-note">模型内部重复计算的比例，不是现实中的成功率。</p></div><div class="bp-reveal"><strong>你已经做了一次推演。</strong><p>换一个条件，就出现不同的可能。但这不能证明未来一定这样。</p></div>`:speed!==null?'<div class="bp-reveal">模型暂时没有载入，这一关不提供数字。</div>':'<div class="bp-visual"><div class="bp-linknet"><span>新工厂</span><span class="arrow">→</span><span>博罗经济</span><span class="arrow">→</span><span>2030?</span></div><p class="bp-visual-note">选个速度，图表马上变化。</p></div>'}
${speed!==null?'<button class="bp-next" data-action="play" data-value="finish">完成挑战 · 领发现卡 →</button>':'<div class="bp-tiny">条件范围：75%—110%。只能改变模型里的假设。</div>'}`;
}
function done(){
const sim=simulate(speed??100);
return `<div class="bp-sub">闯关完成 · 你的个人发现卡</div><h2 class="bp-question">你发现了什么？</h2>
<div class="bp-done-stats"><div><strong>${correctCount()} / 4</strong><small>答对的真相题</small></div><div><strong>${score()}</strong><small>本轮学习分 · 满分100</small></div></div>
<div class="bp-reveal" style="margin:18px 0"><strong>你可能没想到：</strong><p>签约不等于投资，修路不等于通车，工业增长与投资下降也能同时发生。</p><p>你还亲手改了一次新工厂的速度。</p></div>
<div class="bp-visual"><div class="bp-figure"><div><small>你选的速度</small><strong>${speed??100}<b>%</b></strong></div><div><small>模型的2030中间值</small><strong style="font-size:42px">${sim?fmt(sim.p50):'—'}<b>亿</b></strong></div></div><p class="bp-visual-note">模型情景，不是对博罗未来的确定预测。</p></div>
<button class="bp-next" data-action="play" data-value="shareall">把同一套题发给朋友 →</button><button class="bp-mini-share" data-action="play" data-value="restart">再挑战一次</button>`;
}
function side(){
const titles=['签约的钱','桥修好了？','涨跌反转','找到关系','亲手推演'];
return `<aside class="bp-side"><div class="bp-aside"><h3>你的5关挑战</h3>${titles.map((x,i)=>`<div class="bp-mission ${step>i?'done':step===i?'current':''}"><span class="bp-num">${step>i?'✓':i+1}</span><span>${x}</span></div>`).join('')}<div class="bp-bottom"><a href="#page=wind">自由玩风洞 ↗</a><a href="#page=change">看全部变化 ↗</a></div></div><div class="bp-aside bp-fact"><h3>没有假装的排行榜</h3><b>${best}分</b><p>这是你在这台设备上的历史最好成绩。没有编造其他玩家的数据。</p><div class="bp-role"><button data-action="play" data-value="shareall">邀朋友来挑战 ↗</button></div></div></aside>`;
}
function view(){
const progress=step>=5?100:step/5*100;
return `<div class="bp-layout"><section class="bp-game" aria-label="博罗互动闯关游戏"><div class="bp-hero"><span class="bp-kicker">BO LUO · 5关挑战</span><span class="bp-score">得分 ${score()} / 100</span></div><div class="bp-progress" role="progressbar" aria-label="完成进度" aria-valuenow="${progress}" aria-valuemin="0" aria-valuemax="100"><i style="width:${progress}%"></i></div>${step<4?question():step===4?sandbox():done()}</section>${side()}</div>`;
}
function persist(){try{localStorage.setItem('boluo-easy-quest-v1',JSON.stringify({best,completed:Date.now()}));}catch(e){}}
function handle(v){
const [op,arg]=String(v||'').split(':');
if(op==='answer'&&step<4&&answers[step]===undefined&&['0','1'].includes(arg)){answers[step]=Number(arg);return;}
if(op==='next'&&step<4&&answers[step]!==undefined){step+=1;return;}
if(op==='speed'&&step===4&&[75,100,110].includes(Number(arg))){speed=Number(arg);return;}
if(op==='finish'&&step===4&&speed!==null){step=5;roundDone=true;best=Math.max(best,score());persist();return;}
if(op==='restart'){step=0;answers={};speed=null;roundDone=false;return;}
if(op==='shareq'){share(step);return;}
if(op==='shareall'){share(-1);return;}
}
async function share(question){
const link=location.href.split('#')[0]+'#page=home&challenge=1'+(question>=0&&question<4?'&q='+question:'');
const title=question>=0?'猜一题：'+QUESTIONS[question].question:'来挑战“博罗变了啥？”的5关游戏';
const message=roundDone&&question<0?`我在博罗挑战答对 ${correctCount()}/4 题。你也来试试？`:title;
try{if(navigator.share){await navigator.share({title:'博罗 · 一眼看懂',text:message,url:link});return;}if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(message+'\n'+link);notice('挑战链接已复制，发给朋友吧');return;}}catch(e){if(e.name==='AbortError')return;}
window.prompt('复制下面的挑战链接：',message+'\n'+link);
}
function notice(text){const t=$('snack');if(!t)return;t.textContent=text;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2200);}
window.BoluoPlay={view,handle,getState:()=>({step,answers:{...answers},speed,best,score:score(),completed:roundDone})};
})();