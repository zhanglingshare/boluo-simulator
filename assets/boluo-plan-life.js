/* 博罗 06 规划与你：由真实规划报道创建可检验的“生活条件”路径。
   无经济因果参数，无伪造损益，无伪随机概率；切换事件只影响候选传导链。
   No third-party network calls; sources link to public documents, facts are read from versioned JSON.
*/
(function(){
'use strict';
const $=s=>document.querySelector(s), el=(tag,cls,txt)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(txt!==undefined)x.textContent=String(txt);return x;};
const ns='http://www.w3.org/2000/svg',svg=(tag,attrs={},txt)=>{const x=document.createElementNS(ns,tag);Object.entries(attrs).forEach(([k,v])=>x.setAttribute(k,String(v)));if(txt!==undefined)x.textContent=String(txt);return x;};
const safeLink=u=>{try{const v=new URL(u);return ['http:','https:'].includes(v.protocol)?v.href:'';}catch{return '';}};
const state={data:null,role:'commuter',theme:'travel',shock:false};
const q=new URLSearchParams(location.search);
const requestedRole=(q.get('role')||'').slice(0,35),requestedTheme=(q.get('theme')||'').slice(0,45),requestedShock=q.get('pressure')==='1';
const reduced=!!(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);
const sourceIndex=()=>new Map(state.data.sources.map(x=>[x.id,x]));
const role=()=>state.data.roles.find(x=>x.id===state.role);
const theme=()=>state.data.themes.find(x=>x.id===state.theme);
const themeForRole=()=>state.data.themes.filter(x=>x.roles.includes(state.role));
function text(id,t){document.getElementById(id).textContent=String(t==null?'—':t);}
function h(tag,cls,s){return el(tag,cls,s);}
function fmt(n){return Number(n).toLocaleString('zh-CN',{maximumFractionDigits:2});}
function isSelected(){return role()&&theme();}
function updateQuery(){
 const u=new URL(location.href);
 u.searchParams.set('role',state.role);u.searchParams.set('theme',state.theme);
 if(state.shock)u.searchParams.set('pressure','1');else u.searchParams.delete('pressure');
 history.replaceState(null,'',u);
}
function statCard(m){
 const card=h('article','pl-stat');
 const label=h('div','pl-stat-label',m.label),num=h('strong','pl-stat-number',fmt(m.target)),unit=h('small',null,m.comparator+' · '+m.unit);
 num.append(unit);
 let compare=m.baseline!==undefined?m.baselineYear+'年 '+fmt(m.baseline)+m.unit+' → 2030目标'+m.comparator+' '+fmt(m.target)+m.unit:'2030目标'+m.comparator+' '+fmt(m.target)+m.unit;
 const comp=h('div','pl-stat-comp',compare);
 card.append(label,num,comp);
 if(m.baseline!==undefined){
  const track=h('div','pl-stat-track'),fill=h('i');
  fill.style.width=Math.min(100,Math.max(0,m.baseline/m.target*100))+'%';
  track.append(fill);card.append(track);
 }
 card.append(h('div','pl-stat-foot',m.caution));
 return card;
}
function renderMetrics(){const c=$('#pl-metrics');c.replaceChildren();state.data.headlineMetrics.forEach(m=>c.append(statCard(m)));}
function pickRole(next){
 if(!state.data.roles.some(x=>x.id===next))return;
 state.role=next;
 if(!theme()?.roles.includes(next))state.theme=themeForRole()[0]?.id||state.data.themes[0].id;
 state.shock=false;render();updateQuery();
}
function pickTheme(next){
 if(!themeForRole().some(x=>x.id===next))return;
 state.theme=next;state.shock=false;render();updateQuery();
}
function renderRoles(){
 const list=$('#pl-roles');list.replaceChildren();
 for(const r of state.data.roles){
  const button=h('button','pl-role',r.label);button.type='button';button.dataset.role=r.id;
  button.setAttribute('aria-pressed',String(r.id===state.role));
  button.addEventListener('click',()=>pickRole(r.id));
  list.append(button);
 }
}
function renderThemes(){
 const host=$('#pl-themes');host.replaceChildren();
 for(const item of themeForRole()){
  const button=h('button','pl-theme');button.type='button';button.dataset.theme=item.id;
  button.setAttribute('aria-pressed',String(item.id===state.theme));
  button.append(h('em',null,item.type),h('b',null,item.label),h('small',null,item.summary));
  button.addEventListener('click',()=>pickTheme(item.id));
  host.append(button);
 }
}
function makeNode(svgRoot,x,y,title,subtitle,eyebrow,stressed=false){
 const width=222,height=116;
 const group=svg('g',{class:'pl-map-node','data-name':title});
 const rect=svg('rect',{x:x-width/2,y:y-height/2,width,height,rx:14,class:'pl-svg-card'+(stressed?' is-stressed':' is-current')});
 group.append(rect,svg('text',{x,y:y-30,class:'pl-svg-badge'},eyebrow));
 const label=title.length>10?title.slice(0,10)+'…':title;
 group.append(svg('text',{x,y:y+1,class:'pl-svg-text'},label));
 group.append(svg('text',{x,y:y+26,class:'pl-svg-sub'},subtitle));
 svgRoot.append(group);
}
function drawGraph(){
 const target=$('#pl-network');
 const src=theme(),persona=role(),stressed=state.shock;
 target.replaceChildren(svg('title',{},'规划—现实条件—个人生活的候选传导图，虚线为待验证机制'));
 const groups=[{x:131,eyebrow:'PLAN / DIRECTION',title:src.label,sub:'规划方向'},
   {x:425,eyebrow:'EVIDENCE / GATE',title:stressed?'条件未满足':'仍需实测验证',sub:stressed?'压力情景':'待补充证据'},
   {x:719,eyebrow:'LIFE / POSITION',title:persona.short+'的生活',sub:'不是自动兑现'}];
 [[242,314],[536,608]].forEach(([x1,x2],i)=>{
  target.append(svg('line',{x1,y1:146,x2,y2:146,class:'pl-svg-line'+(stressed?' is-stressed':'')}));
  const arrow=svg('path',{d:'M '+(x2-12)+' 138 L '+x2+' 146 L '+(x2-12)+' 154',
   fill:'none',stroke:stressed?'#b65f60':'#9caab5','stroke-width':1.9,'stroke-linejoin':'round'});
  target.append(arrow);
  target.append(svg('text',{x:(x1+x2)/2,y:117,class:'pl-svg-badge'},stressed&&i===1?'条件受阻':'条件未证实'));
 });
 groups.forEach((g,i)=>makeNode(target,g.x,146,g.title,g.sub,g.eyebrow,stressed&&i===1));
 target.append(svg('text',{x:425,y:260,class:'pl-svg-sub'},'研究性关系示意 · 图中距离没有地理或因果强度含义'));
}
function renderSteps(){
 const path=theme().mechanisms[state.role],list=$('#pl-steps');list.replaceChildren();
 path.forEach((step,i)=>{
  const row=h('div','pl-step'+(state.shock&&i>=1?' is-blocked':''));
  row.append(h('span','pl-step-number',String(i+1).padStart(2,'0')+(state.shock&&i>=1?' / 受限':'')),h('b',null,step));
  list.append(row);
 });
}
function renderSources(){
 const host=$('#pl-sources');host.replaceChildren();
 const sources=sourceIndex();
 theme().sources.forEach(id=>{
  const src=sources.get(id);
  if(!src)return;
  const href=safeLink(src.url);
  if(!href)return;
  const a=h('a',null,id+' · '+src.title);a.href=href;a.target='_blank';a.rel='noopener noreferrer';
  host.append(a);
 });
 text('pl-evidence-note',theme().evidence+'。以上来源不能单独证明当前路径已实际发生。正式纲要全文条款尚未逐条校核。');
 const first=theme().events[0];
 $('#pl-event-link').href='intel-lab.html'+(first?'?change='+encodeURIComponent(first):'');
 $('#pl-event-link').textContent=first?'打开对应事件 '+first+' · 查看真实证据盲区 ↗':'打开证据实验台 · 查证结构关系 ↗';
}
function render(){
 if(!isSelected())return;
 const r=role(),t=theme();
 renderRoles();renderThemes();
 text('pl-stage-subtitle',r.label+' · '+t.label);
 text('pl-role-title',r.label);text('pl-role-question',r.question);
 text('pl-blind-text',t.blindspot);
 text('pl-shock-label',state.data.shocks.find(x=>x.id===t.pressure)?.label||'让一个条件不成立');
 text('pl-shock-description',state.data.shocks.find(x=>x.id===t.pressure)?.note||'按现实条件进行对照，不能推算实际经济损失。');
 $('#pl-shock').checked=state.shock;
 $('#pl-path-status').classList.toggle('is-pressured',state.shock);
 text('pl-path-status',state.shock?'前提承压 · 需重核路径':'研究中 · 需实测验证');
 $('#pl-result').classList.toggle('is-pressured',state.shock);
 text('pl-result-title',state.shock?'一项关键前提没有成立':'这是一条候选影响路径');
 text('pl-result-desc',state.shock?
  '当“'+(state.data.shocks.find(x=>x.id===t.pressure)?.label||'指定阻碍')+'”出现时，此条逻辑链不能再直接支持“生活已经改善”的说法。要判断实际影响，需要额外观测，不能直接算个人损益。':
  '如果这些条件逐项得到实际证据支持，才可能与“'+r.concern+'”有关。当前没有完整的个体结果数据，不能将十五五目标换算成你的收入、学位或通勤收益。');
 renderSteps();drawGraph();renderSources();
}
function copyState(){
 const path=theme().mechanisms[state.role].join(' → ');
 const out='博罗规划与你｜'+role().label+'\n方向：'+theme().label+'\n待验证条件：'+path+
  '\n情景：'+(state.shock?'施加压力：'+state.data.shocks.find(x=>x.id===theme().pressure)?.label:'未施加额外压力')+
  '\n最该补证据：'+theme().blindspot+'\n说明：关系尚未验证因果，不是经济损益预测。\n'+location.href;
 if(navigator.clipboard?.writeText)navigator.clipboard.writeText(out).then(()=>text('pl-copy','已复制观察场景')).catch(()=>fallback());
 else fallback();
 function fallback(){const input=document.createElement('textarea');input.value=out;input.style.position='fixed';input.style.top='0';document.body.append(input);input.select();try{document.execCommand('copy');text('pl-copy','已复制观察场景');}catch{text('pl-copy','请从地址栏分享链接');}input.remove();}
}
$('#pl-shock').addEventListener('change',e=>{state.shock=e.target.checked;render();updateQuery();});
$('#pl-copy').addEventListener('click',copyState);
async function init(){
 try{
  const resp=await fetch('data/boluo-plan-life.v1.json',{cache:'no-store'});if(!resp.ok)throw Error('规划资料 HTTP '+resp.status);
  const data=await resp.json();
  if(!Array.isArray(data.roles)||!Array.isArray(data.themes)||!Array.isArray(data.headlineMetrics)||!Array.isArray(data.sources))throw Error('规划资料结构缺失');
  state.data=data;
  if(data.roles.some(x=>x.id===requestedRole))state.role=requestedRole;
  state.theme=themeForRole().some(x=>x.id===requestedTheme)?requestedTheme:themeForRole()[0]?.id;
  if(!state.theme)throw Error('没有适配该身份的可检验路径');
  state.shock=requestedShock;
  renderMetrics();render();updateQuery();
 }catch(e){$('#pl-error').hidden=false;text('pl-error','规划与证据资料暂不能可靠读取：'+e.message+'。为避免伪造事实，本页不显示假数据。');}
}
init();
})();