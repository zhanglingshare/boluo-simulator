import {
 M3_VERSION, FOCAL_IDS, THRESHOLD, U_ANCHORS, COMMUTE_FLOW_ID,
 simulate, compareWorlds, sensitivity, uToFlow, scenariosFromFlow,
 snapshotSignature, validateSaved, findPath
} from './engine.mjs';

const D=window.BOLUO_DATA;
if(!D||!Array.isArray(D.nodes)||!Array.isArray(D.edges))throw Error('M3 requires the M2 data world');
const ids=new Map(D.nodes.map(n=>[n.id,n]));
const nameOf=(id)=>ids.get(id)?.name||id;
const sig=snapshotSignature(D.nodes,D.edges);
const clusterColors={industry:'#68d5ed',external:'#a88df1',life:'#ffc47f',tourism:'#64e7c0',agriculture:'#cbe780'};
const fmt=(n)=>Number(n).toLocaleString('zh-CN');

const state={open:false,a:U_ANCHORS.low.u,b:U_ANCHORS.high.u,yaw:-.2,pitch:-.20,zoom:1,selected:'dg',
 selectedEdge:null,path:null,guide:null,guideDone:false,
 flow:null,sc:null,models:null,sens:null,animation:[new Map(),new Map()],lastSaved:null};

const root=document.createElement('section');
root.id='m3-shell';root.hidden=true;root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-label','博罗M3双世界全息情景推演');
root.innerHTML=[
 '<header class="m3-top"><div><b>看见博罗 V2 · M3 · 双世界推演</b><small>两个可能世界｜园洲—东莞跨界联系强度情景 · 结构由真实计算驱动，非预制动画</small></div>',
 '<button id="m3-exit" aria-label="返回M2宇宙">返回 M2 宇宙 ×</button></header>',
 '<div class="m3-layout">',
 // 左栏：证据 + 区间
 '<aside class="m3-side"><span class="m3-badge" id="m3-flow-badge">B级推断区间 · C级情景推演</span>',
 '<h3 id="m3-flow-title">园洲—东莞 · 跨界通勤</h3>',
 '<div id="m3-flow-meta" class="m3-flow-meta"></div>',
 '<details class="m3-evidence" id="m3-evidence"><summary>查看证据、方法与口径（'+''+'）</summary><div id="m3-evidence-body"></div></details>',
 '<div class="m3-input" id="m3-ctrl-a"></div>',
 '<div class="m3-input" id="m3-ctrl-b"></div>',
 '<div class="m3-note">A 级关系权重恒为 1、不可调；只有四条与东莞产业联动相关的 B 级供应链关系随情景改变。可达阈值 '+THRESHOLD+' 是结构模型规则，无交通或统计含义。</div>',
 '<div class="m3-actions"><button class="m3-act" id="m3-save">保存两情景</button><button class="m3-act" id="m3-load">恢复</button></div>',
 '<div class="m3-actions"><button class="m3-act" id="m3-export">导出 JSON</button><button class="m3-act" id="m3-import">导入 JSON</button><input type="file" accept=".json,application/json" id="m3-restorefile"></div>',
 '<div class="m3-state" id="m3-state" aria-live="polite"></div></aside>',
 // 中间：双世界
 '<section class="m3-worlds" aria-label="两座同步视角、同一布局的全息关系空间">',
 '<div class="m3-legend"><i class="lg-a"></i>两个世界都连&nbsp;&nbsp;<i class="lg-only"></i>只有这个世界连&nbsp;&nbsp;<i class="lg-miss"></i>另一个世界连&nbsp;&nbsp;<i class="lg-focal"></i>随强度变化的关系</div>',
 '<div class="m3-world"><h3>世界 A <span id="m3-cap-a"></span></h3><canvas id="m3-canvas-a" aria-label="世界A全息关系空间"></canvas><div class="m3-pop" id="m3-pop-a" hidden></div><div class="m3-mini"><span>这个世界连到的节点</span><b id="m3-reach-a">—</b></div></div>',
 '<div class="m3-world"><h3>世界 B <span id="m3-cap-b"></span></h3><canvas id="m3-canvas-b" aria-label="世界B全息关系空间"></canvas><div class="m3-pop" id="m3-pop-b" hidden></div><div class="m3-mini"><span>这个世界连到的节点</span><b id="m3-reach-b">—</b></div></div>',
 '</section>',
 // 右栏：比较 + 稳健发现
 '<aside class="m3-side"><span class="m3-badge alt">稳健发现 · 敏感性分析 · 非事实判断</span><h3>同一个博罗，两套假设</h3>',
 '<div class="m3-aside-grid"><div class="m3-metric"><small>随区间改变的B级关系</small><b id="m3-changed">—</b></div>',
 '<div class="m3-metric"><small>两世界都可达（稳健）</small><b id="m3-stable">—</b></div>',
 '<div class="m3-metric"><small>仅一个世界可达（依赖假设）</small><b id="m3-dependent">—</b></div></div>',
 '<h3 class="m3-h">在整个区间上的稳定性</h3><div id="m3-reach-strip" class="m3-reachstrip"></div>',
 '<h3 class="m3-h">稳健结论（怎么调都成立）</h3><div id="m3-robust" class="m3-findings"></div>',
 '<h3 class="m3-h">关键未知（随假设翻转）</h3><div id="m3-conditional" class="m3-findings"></div>',
 '<h3 class="m3-h">下一步最有价值的公开数据</h3><div id="m3-next" class="m3-next"></div>',
 '<div class="m3-note" id="m3-compare-note"></div>',
 '<p id="m3-selected" class="m3-selected">点击或触摸星点查看主体；拖动任一画面，两座世界同步旋转。</p></aside></div>'].join('');
document.body.append(root);
const get=(id)=>document.getElementById(id);

// 首次发现引导（4 步，可跳过；完成后 localStorage 标记，不再弹）
const guideEl=document.createElement('div');guideEl.id='m3-guide';guideEl.hidden=true;
guideEl.innerHTML='<div class="m3-guide-spot" id="m3-guide-spot" hidden></div>'+
 '<div class="m3-guide-card"><div class="m3-guide-dots" id="m3-guide-dots"></div>'+
 '<div class="m3-guide-text" id="m3-guide-text"></div><div class="m3-guide-actions">'+
 '<button id="m3-guide-skip" class="m3-guide-ghost">跳过引导</button>'+
 '<button id="m3-guide-next">下一步</button></div></div>';
root.append(guideEl);

// 桌面入口：放进 M2 顶栏 .top-actions（≤720px 该容器被隐藏，故另配手机浮动按钮）
const launch=document.createElement('button');launch.id='m3-launch';launch.textContent='◈ 双世界推演';
const topActions=document.querySelector('.top-actions');
if(topActions)topActions.append(launch);
// 手机浮动入口：直接挂 body，不被 .top-actions 隐藏影响
const launchMobile=document.createElement('button');launchMobile.id='m3-launch-mobile';launchMobile.textContent='◈ 双世界';
launchMobile.setAttribute('aria-label','进入双世界推演');
document.body.append(launchMobile);
function openLaunch(){if(window.BOLUO_M3_APP)window.BOLUO_M3_APP.open(COMMUTE_FLOW_ID);else open();}
launch.onclick=openLaunch;launchMobile.onclick=openLaunch;
// M2「未知实验」面板内的主入口按钮（每次渲染面板后由 M3 重新绑定）
function bindScenarioEntry(){
 const entry=document.getElementById('m3-open-dual');
 if(entry)entry.onclick=()=>openLaunch();
}
new MutationObserver(()=>bindScenarioEntry()).observe(document.body,{childList:true,subtree:true});

function esc(s){return String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}

/* ---------- 区间控制面板（每个世界一份） ---------- */
function ctrlBlock(side){
 const cap=side==='a'?'A':'B';
 return `<div class="m3-world-head"><span class="m3-dot m3-dot-${side}">世界 ${cap}</span>
   <button class="m3-preset" data-side="${side}" data-key="low"><b>低 · ${state.sc?fmt(state.sc.low.persons):'…'}</b><small>低流动</small></button>
   <button class="m3-preset" data-side="${side}" data-key="mid"><b>中 · ${state.sc?fmt(state.sc.mid.persons):'…'}</b><small>中流动</small></button>
   <button class="m3-preset" data-side="${side}" data-key="high"><b>高 · ${state.sc?fmt(state.sc.high.persons):'…'}</b><small>高流动</small></button></div>
  <div class="m3-custom"><label>自定义强度 <strong id="m3-val-${side}">–</strong></label>
   <input id="m3-range-${side}" type="range" min="0" max="100" step="1" value="${Math.round(state[side]*100)}" aria-label="世界${cap}跨界联系强度">
   <div class="m3-persons" id="m3-persons-${side}">—</div></div>`;
}
function renderControls(){
 get('m3-ctrl-a').innerHTML=ctrlBlock('a');
 get('m3-ctrl-b').innerHTML=ctrlBlock('b');
 root.querySelectorAll('.m3-preset').forEach(btn=>btn.onclick=()=>setKey(btn.dataset.side,btn.dataset.key));
 ['a','b'].forEach(side=>{
  const r=get('m3-range-'+side);
  r.oninput=()=>setU(side,Number(r.value)/100);
 });
 syncControls();
}
function syncControls(){
 ['a','b'].forEach(side=>{
  const u=state[side];
  const el=get('m3-val-'+side);if(el)el.textContent=u.toFixed(2);
  const r=get('m3-range-'+side);if(r)r.value=String(Math.round(u*100));
  const pe=get('m3-persons-'+side);
  if(pe&&state.flow){
   const f=uToFlow(u,state.flow);
   const anchor=f.anchorKey?({low:'低',mid:'中',high:'高'}[f.anchorKey]):'自定义';
   pe.innerHTML=`≈ <b>${fmt(f.persons)}</b> 人次/工作日 · 系数 ${(f.multiplier*100).toFixed(1)}% · <span class="${f.withinB?'m3-tag-c':'m3-tag-out'}">${anchor}${f.withinB?'':' · 已到B区间边界'}</span><br/><small>区间带 ${fmt(f.band[0])}–${fmt(f.band[1])}（C级示意，非置信区间）</small>`;
  }
  root.querySelectorAll(`.m3-preset[data-side="${side}"]`).forEach(btn=>{
   const key=btn.dataset.key;const active=Math.abs(u-U_ANCHORS[key].u)<1e-9;
   btn.classList.toggle('active',active);
  });
 });
}

/* ---------- 证据面板 ---------- */
function renderEvidence(){
 const f=state.flow;if(!f)return;
 get('m3-flow-title').textContent='园洲+石湾 → 东莞 · 跨界通勤（工作日）';
 const r=f.range;
 get('m3-flow-meta').innerHTML=
  `<div class="m3-range-row"><span>低</span><b>${fmt(r.low)}</b><span>中</span><b>${fmt(r.mid)}</b><span>高</span><b>${fmt(r.high)}</b></div>
   <small class="m3-unit">${esc(r.unit)} · ${esc(r.period||'')} · 双向合计</small>`;
 const ev=f.directEvidence.map(x=>`<li>${esc(x)}</li>`).join('');
 get('m3-evidence-body').innerHTML=
  `<div class="m3-ev-sec"><div class="m3-ev-label">直接 / 间接证据（${f.sources.length} 个来源）</div><ul>${ev}</ul></div>
   <div class="m3-ev-sec"><div class="m3-ev-label">推断方法</div><p>${esc(f.method).replace(/\n/g,'<br/>')}</p></div>
   <div class="m3-ev-sec"><div class="m3-ev-label">公式</div><p class="m3-mono">${esc(f.formula).replace(/\n/g,'<br/>')}</p></div>
   <div class="m3-ev-sec"><div class="m3-ev-label warn">口径与限制</div><p>${esc(f.caveats)}</p></div>
   <div class="m3-ev-sec"><div class="m3-ev-label">如何收紧（D 级缺口）</div><p>${esc(f.toTighten)}</p></div>`;
 get('m3-evidence').querySelector('summary').textContent='查看证据、方法与口径（'+f.sources.length+' 个来源，含手机信令总量校验）';
}

/* ---------- 模型计算 + 右栏 ---------- */
function recompute(){
 state.models=[simulate(D.nodes,D.edges,state.a),simulate(D.nodes,D.edges,state.b)];
 const [a,b]=state.models,c=compareWorlds(a,b);
 get('m3-cap-a').textContent=capText(state.a);
 get('m3-cap-b').textContent=capText(state.b);
 get('m3-reach-a').textContent=a.reachable.length+' / '+D.nodes.length;
 get('m3-reach-b').textContent=b.reachable.length+' / '+D.nodes.length;
 get('m3-changed').textContent=String(c.changedCount);
 get('m3-stable').textContent=String(c.stableCount);
 get('m3-dependent').textContent=String(c.onlyA.length+c.onlyB.length);
 get('m3-compare-note').textContent=c.note;
 renderSensitivity();
}
function capText(u){
 const f=state.flow?uToFlow(u,state.flow):null;
 const anchor=u===U_ANCHORS.low.u?'低流动':u===U_ANCHORS.mid.u?'中流动':u===U_ANCHORS.high.u?'高流动':'自定义';
 return f?`${anchor} · ≈${fmt(f.persons)} 人次/工作日（C级情景）`:'起点：东莞 · 结构实验';
}
function renderSensitivity(){
 if(!state.sens){state.sens=sensitivity(D.nodes,D.edges,state.flow);}
 const s=state.sens;
 // 低/中/高可达数条带
 const rc=s.reachCount;
 get('m3-reach-strip').innerHTML=
  `<div class="m3-bar"><span style="width:${rc.low/rc.u1*100}%"></span><label>低 ${rc.low}</label></div>`+
  `<div class="m3-bar mid"><span style="width:${rc.mid/rc.u1*100}%"></span><label>中 ${rc.mid}</label></div>`+
  `<div class="m3-bar high"><span style="width:${rc.high/rc.u1*100}%"></span><label>高 ${rc.high}</label></div>`+
  `<small>从东莞出发的可达主体数（低/中/高情景，共 ${D.nodes.length} 个）</small>`;
 // 稳健：全情景都可达，排除起点本身，取前6
 const robust=s.stableIn.filter(x=>x.id!=='dg').slice(0,6);
 get('m3-robust').innerHTML=
  `<p class="ok">无论跨界强弱，<b>${s.stableIn.length}</b> 个主体始终与东莞网络连通，是稳健的结构事实。</p>`+
  (robust.length?`<div class="m3-chips">${robust.map(x=>`<span class="chip ok">${nameOf(x.id)}</span>`).join('')}</div>`:'');
 // 条件性：翻转区间
 const tag=(t)=>t<=U_ANCHORS.low.u?'低于低即连':t<=U_ANCHORS.mid.u?'低→中之间连入':t<=U_ANCHORS.high.u?'中→高之间连入':'高情景仍不连';
 const cond=s.conditional;
 get('m3-conditional').innerHTML=
  `<p class="warn">${cond.length} 个主体是否连通取决于跨界强度假设，是本模型最敏感的未知。</p>`+
  cond.slice(0,7).map(x=>`<div class="m3-cond"><span>${nameOf(x.id)}</span><small>阈值 u≈${x.threshold.toFixed(2)} · ${tag(x.threshold)}</small></div>`).join('');
 get('m3-next').innerHTML=`<p>${esc(s.nextBestData||'需要补充 OD 与道路断面客流数据。')}</p><small class="m3-src">取到该项原始数据，最能把上面的“条件性”结论转为“稳健”结论。</small>`;
}

/* ---------- 交互 ---------- */
function setKey(side,key){setU(side,U_ANCHORS[key].u);}
function setU(side,u){
 state[side]=Math.min(1,Math.max(0,u));
 syncControls();recompute();
}
function showState(m){get('m3-state').textContent=m;}
const savedData=()=>({modelVersion:M3_VERSION,signature:sig,flowId:COMMUTE_FLOW_ID,
 inputs:[state.a,state.b],selected:state.selected,rotation:[state.yaw,state.pitch,state.zoom],
 mode:'C-HYPOTHESIS',savedAt:new Date().toISOString()});
function restore(p){
 const [a,b]=validateSaved(p,D.nodes,D.edges);
 state.a=a;state.b=b;
 if(p.flowId&&state.flow&&p.flowId!==state.flow.id)showState('注意：恢复的情景来自另一条流场，当前仅复用参数。');
 if(p.selected&&ids.has(p.selected))state.selected=p.selected;
 if(Array.isArray(p.rotation)&&p.rotation.length===3){state.yaw=Number(p.rotation[0])||-.2;state.pitch=Math.min(.8,Math.max(-.8,Number(p.rotation[1])||0));state.zoom=Math.min(2,Math.max(.65,Number(p.rotation[2])||1));}
 renderControls();recompute();showState('已按相同数据版本恢复情景，并已重新计算。');
}
get('m3-save').onclick=()=>{try{localStorage.setItem('boluo_m3_scenarios',JSON.stringify(savedData()));showState('已保存两情景、区间、视角与数据版本到本机。');}catch(e){showState('保存失败：'+e.message);}};
get('m3-load').onclick=()=>{try{const raw=localStorage.getItem('boluo_m3_scenarios');if(!raw)throw Error('尚无已保存情景');restore(JSON.parse(raw));}catch(e){showState('无法恢复：'+e.message);}};
get('m3-export').onclick=()=>{const blob=new Blob([JSON.stringify(savedData(),null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='boluo-m3-scenarios.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);showState('已导出情景参数、数据签名与模型版本。');};
get('m3-import').onclick=()=>get('m3-restorefile').click();
get('m3-restorefile').onchange=async(e)=>{const file=e.target.files[0];if(!file)return;try{restore(JSON.parse(await file.text()));}catch(err){showState('导入失败：'+err.message);}e.target.value='';};

/* ---------- 双世界渲染 ---------- */
let dragging=null;
const canvases=[get('m3-canvas-a'),get('m3-canvas-b')];
function dims(canvas){const w=canvas.clientWidth,h=canvas.clientHeight;
 const dpr=Math.min(1.5,window.devicePixelRatio||1),pw=Math.round(w*dpr),ph=Math.round(h*dpr);
 if(canvas.width!==pw||canvas.height!==ph){canvas.width=pw;canvas.height=ph;}
 const ctx=canvas.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);return{w,h,ctx};}
function point(p,w,h){const ca=Math.cos(state.yaw),sa=Math.sin(state.yaw),cp=Math.cos(state.pitch),sp=Math.sin(state.pitch);
 const rx=ca*p[0]-sa*p[2],rz=sa*p[0]+ca*p[2];const ry=cp*p[1]-sp*rz;const z=sp*p[1]+cp*rz;
 const scale=Math.min(w/5.4,h/4.4)*state.zoom/(1-z*.075);
 return [w*.5+rx*scale,h*.51-ry*scale,scale];}
function animatedPosition(world,n){const model=state.models[world];const target=model.positions.get(n.id);let cur=state.animation[world].get(n.id);
 if(!cur){cur=target.slice();state.animation[world].set(n.id,cur);}
 for(let k=0;k<3;k++)cur[k]+=(target[k]-cur[k])*.14;
 return cur;}
function draw(canvas,world){
 if(!state.models)return;
 const {w,h,ctx}=dims(canvas);if(w<4||h<4)return;
 ctx.clearRect(0,0,w,h);
 const m=state.models[world],other=state.models[1-world];
 const reach=new Set(m.reachable),otherReach=new Set(other.reachable);
 const otherEdgeW=new Map(other.edges.map(e=>[e.id,e.weight]));
 // 路径高亮 / 选中边：仅在对应世界生效；存在时其余关系降亮
 const pathOn=state.path&&state.path.world===world;
 const pathEdgeSet=pathOn?new Set(state.path.edgeIds):null;
 const pathNodeSet=pathOn?new Set(state.path.nodeIds):null;
 const selEdgeId=state.selectedEdge&&state.selectedEdge.world===world?state.selectedEdge.id:null;
 const focusOn=pathOn||!!selEdgeId;
 // 网格环
 ctx.strokeStyle='rgba(101,171,199,.06)';ctx.lineWidth=1;
 for(let r=1;r<5;r++){ctx.beginPath();ctx.ellipse(w*.5,h*.53,r*w*.1,r*h*.09,-.24,0,Math.PI*2);ctx.stroke();}
 const screen=new Map(m.nodes.map(n=>[n.id,point(animatedPosition(world,n),w,h)]));
 const labels=[];
 // 边
 for(const e of m.edges){const a=screen.get(e.source),b=screen.get(e.target);if(!a||!b)continue;
  const onPath=pathEdgeSet?.has(e.id),isSelEdge=selEdgeId===e.id;
  ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);
  if(onPath){
   // 决定路径：A 级明亮青、随情景变化的焦点边明亮金（让用户看到是哪条边点亮它）
   if(e.level==='A'){ctx.lineWidth=2.6;ctx.strokeStyle='rgba(122,226,250,.95)';ctx.setLineDash([]);}
   else{ctx.lineWidth=3.0;ctx.strokeStyle=e.focal?'rgba(255,206,130,.98)':'rgba(230,170,255,.9)';ctx.setLineDash([]);}
  }else if(isSelEdge){
   ctx.lineWidth=3.0;ctx.strokeStyle='rgba(255,255,255,.95)';ctx.setLineDash([]);
  }else if(e.level==='A'){ctx.lineWidth=1.6;ctx.strokeStyle=`rgba(89,203,238,${focusOn?.18:.55})`;ctx.setLineDash([]);}
  else if(e.focal){
   const ew=otherEdgeW.get(e.id)??e.weight;
   const stronger=e.weight>ew+1e-9;
   ctx.lineWidth=Math.max(.6,e.weight*3.0);
   ctx.strokeStyle=stronger?`rgba(244,191,120,${focusOn?.08:.20+e.weight*.7})`:`rgba(231,155,255,${focusOn?.06:.14+e.weight*.7})`;
   ctx.setLineDash(e.level==='C'?[4,6]:[]);
  }else{
   ctx.lineWidth=Math.max(.5,e.weight*2.4);
   ctx.strokeStyle=e.level==='B'?`rgba(242,174,100,${focusOn?.08:.26})`:`rgba(169,123,208,${focusOn?.06:.18})`;
   ctx.setLineDash(e.level==='C'?[4,6]:[]);
  }
  ctx.stroke();ctx.setLineDash([]);
 }
 // 节点
 for(const n of m.nodes){const p=screen.get(n.id),score=m.scores.get(n.id);
  const here=reach.has(n.id),there=otherReach.has(n.id),selected=n.id===state.selected;
  const onlyHere=here&&!there,missing=!here&&there;
  const rr=selected?11:Math.max(3,Math.min(7,3+score*.6));
  const clr=clusterColors[n.cluster]||'#afcce0';
  // 辉光
  const g=ctx.createRadialGradient(p[0],p[1],0,p[0],p[1],rr*3);
  let core;
  if(selected)core=['rgba(255,255,255,.95)','rgba(189,156,247,.7)'];
  else if(onlyHere)core=['rgba(255,196,127,.95)','rgba(244,191,120,.28)'];      // 仅本世界连通 → 暖橙
  else if(here)core=['rgba(130,243,252,.82)','rgba(87,173,212,.22)'];          // 共同连通 → 青
  else core=['rgba(90,115,156,.32)','rgba(0,0,0,0)'];
  g.addColorStop(0,core[0]);g.addColorStop(.28,core[1]);g.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=g;ctx.beginPath();ctx.arc(p[0],p[1],rr*3,0,Math.PI*2);ctx.fill();
  // 实心点
  ctx.fillStyle=clr;ctx.globalAlpha=here?1:.32;ctx.beginPath();ctx.arc(p[0],p[1],rr*.72,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
  // 仅本世界连通：暖橙描边环；另一世界连通而本世界缺失：灰色空心环
  if(onlyHere){ctx.strokeStyle='rgba(255,196,127,.9)';ctx.lineWidth=1.6;ctx.beginPath();ctx.arc(p[0],p[1],rr*1.35,0,Math.PI*2);ctx.stroke();}
  else if(missing){ctx.strokeStyle='rgba(150,165,185,.4)';ctx.lineWidth=1.2;ctx.setLineDash([2,3]);ctx.beginPath();ctx.arc(p[0],p[1],rr*1.35,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);}
  // 决定路径上的节点：白色描边环，标示“从东莞到它”的链路
  if(pathNodeSet?.has(n.id)&&!selected){ctx.strokeStyle='rgba(255,255,255,.85)';ctx.lineWidth=1.4;ctx.beginPath();ctx.arc(p[0],p[1],rr*1.75,0,Math.PI*2);ctx.stroke();}
  // 标签：选中、起点、共同可达主体、仅本世界连通（收集后统一做碰撞避让）
  if(selected||n.id==='dg'||onlyHere||(here&&['mj','htd','lq','xwd','ddc','sz','jq','jf','bmc'].includes(n.id))){
   labels.push({x:p[0],y:p[1]+rr+13,text:n.name,anchorY:p[1]+rr,
    color:selected?'#ffffff':onlyHere?'#ffd9a8':here?'#c8eefa':'#739bad',bold:selected});
  }
 }
 // 同列标签 y 过近则向下错位，必要时补一条细引线，避免标签互相压字
 labels.sort((a,b)=>a.y-b.y);
 for(let i=0;i<labels.length;i++){for(let j=0;j<i;j++){if(Math.abs(labels[i].x-labels[j].x)<46&&Math.abs(labels[i].y-labels[j].y)<15)labels[i].y=labels[j].y+15;}}
 ctx.textAlign='center';
 for(const t of labels){
  ctx.font=(t.bold?'bold 12px':'10px')+" 'PingFang SC',sans-serif";
  if(t.y-t.anchorY>5){ctx.strokeStyle='rgba(140,180,205,.16)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(t.x,t.anchorY+2);ctx.lineTo(t.x,t.y-9);ctx.stroke();}
  ctx.fillStyle=t.color;ctx.fillText(t.text,t.x,t.y,90);
 }
}
function distToSegment(px,py,x1,y1,x2,y2){
 const dx=x2-x1,dy=y2-y1,len2=dx*dx+dy*dy;
 let t=len2?((px-x1)*dx+(py-y1)*dy)/len2:0;t=Math.max(0,Math.min(1,t));
 const cx=x1+t*dx,cy=y1+t*dy;return Math.hypot(px-cx,py-cy);
}
function screenMap(world,w,h){
 const m=state.models[world];
 return new Map(m.nodes.map(n=>[n.id,point(state.animation[world].get(n.id)||m.positions.get(n.id),w,h)]));
}
function pickEdge(world,x,y){
 const {w,h}=dims(canvases[world]);const s=screenMap(world,w,h);
 let best=null,dist=9;
 for(const e of state.models[world].edges){
  const a=s.get(e.source),b=s.get(e.target);if(!a||!b)continue;
  const d=distToSegment(x,y,a[0],a[1],b[0],b[1]);
  if(d<dist){dist=d;best=e.id;}
 }
 return best;
}
function placePop(pop,x,y,w,h){
 pop.hidden=false;
 const cw=pop.offsetWidth||230,ch=pop.offsetHeight||170;
 let left=x+15,top=y-12;
 if(left+cw>w-8)left=x-cw-15;
 if(left<8)left=8;
 if(top+ch>h-8)top=h-ch-8;
 if(top<8)top=8;
 pop.style.left=left+'px';pop.style.top=top+'px';
}
const capLetter=(w)=>w===0?'A':'B';
function closePops(){get('m3-pop-a').hidden=true;get('m3-pop-b').hidden=true;}
function selectNode(id,world,x,y){
 state.selected=id;state.selectedEdge=null;
 const inA=state.models[0].reachable.includes(id),inB=state.models[1].reachable.includes(id);
 let pathInfo=null;
 for(const w of [world,1-world]){
  if(state.models[w].reachable.includes(id)){
   const p=findPath(state.models[w],id);
   if(p){pathInfo={...p,world:w};break;}
  }
 }
 state.path=pathInfo;
 renderNodePop(id,world,x,y,pathInfo,inA,inB);
 const status=inA&&inB?'两世界都连通':inA?'仅世界 A 连通':inB?'仅世界 B 连通':'两世界当前均不连通';
 get('m3-selected').textContent='当前主体：'+nameOf(id)+' · '+status+(pathInfo?'（已在世界'+capLetter(pathInfo.world)+'高亮从东莞到它的决定路径）':'')+'。';
}
function selectEdge(id,world,x,y){
 state.selectedEdge={id,world};state.path=null;
 renderEdgePop(id,world,x,y);
 const e=state.models[world].edges.find(x=>x.id===id);
 get('m3-selected').textContent='当前关系：'+nameOf(e.source)+' — '+nameOf(e.target)+'（'+e.level+'级·'+e.kind+'）。';
}
function renderNodePop(id,world,x,y,pathInfo,inA,inB){
 const pop=get(world===0?'m3-pop-a':'m3-pop-b');const n=ids.get(id);
 const statusCls=inA&&inB?'both':(inA||inB?'one':'none');
 const statusTxt=inA&&inB?'两世界都连通':inA?'仅世界 A 连通':inB?'仅世界 B 连通':'两世界都不连通';
 let plain;
 if(inA&&inB)plain='不管跨界强弱，它都和东莞网络连着，是稳健的结构事实。';
 else if(inA||inB)plain='它是被跨界联系“点亮”的：只有跨界强度够大时，才连入东莞网络。';
 else plain='当前两个世界都连不到它。';
 let pathHtml='';
 if(pathInfo){
  const chain=pathInfo.nodeIds.map(nid=>nameOf(nid)).join(' → ');
  const focalN=pathInfo.edgeIds.map(eid=>state.models[pathInfo.world].edges.find(e=>e.id===eid)).filter(e=>e&&e.focal).length;
  pathHtml='<div class="pop-sec"><div class="pop-label">在世界'+capLetter(pathInfo.world)+'，从东莞到它的路径</div><div class="pop-chain">'+esc(chain)+'</div>'+
   (focalN?'<div class="pop-key">金色 '+focalN+' 条边随跨界强度变化，是它“亮/灭”的关键。</div>':'<div class="pop-key">这条路径全部由 A 级关系构成，不随假设变化。</div>')+'</div>';
 }
 const cond=state.sens?.conditional?.find(c=>c.id===id);
 const thrHtml=cond?'<div class="pop-thr">连入阈值：跨界强度 u ≈ '+cond.threshold.toFixed(2)+'</div>':'';
 pop.innerHTML='<button class="pop-close" aria-label="关闭">×</button><div class="pop-title">'+esc(n.name)+'</div>'+
  '<span class="pop-status '+statusCls+'">'+statusTxt+'</span><p class="pop-plain">'+esc(plain)+'</p>'+thrHtml+pathHtml;
 pop.querySelector('.pop-close').onclick=()=>{pop.hidden=true;};
 const {w,h}=dims(canvases[world]);placePop(pop,x,y,w,h);
}
function renderEdgePop(id,world,x,y){
 const pop=get(world===0?'m3-pop-a':'m3-pop-b');const e=state.models[world].edges.find(x=>x.id===id);
 const u=world===0?state.a:state.b;
 let formula,plain;
 if(e.level==='A'){formula='权重恒为 1（有直接证据，不随假设变化）';plain='A 级关系：有直接证据支撑，任何情景下都连通。';}
 else if(e.focal){
  const base=e.level==='B'?0.10:0.02,slope=e.level==='B'?0.85:0.22;
  formula='权重 = '+base+' + '+slope+' × u<br/>当前 u='+u.toFixed(2)+' → 权重 '+e.weight.toFixed(2)+'（'+(e.enabled?'≥':'<')+' 阈值 '+THRESHOLD+'，'+(e.enabled?'连通':'断开')+'）';
  plain='这条关系随跨界强度变化，是网络重组的关键边。';
 }else{formula='权重固定 '+e.weight.toFixed(2);plain=e.level+' 级关系，权重不随跨界强度变化。';}
 pop.innerHTML='<button class="pop-close" aria-label="关闭">×</button><div class="pop-title">'+esc(nameOf(e.source))+' — '+esc(nameOf(e.target))+'</div>'+
  '<span class="pop-status lvl-'+e.level+'">'+e.level+'级 · '+esc(e.kind)+'</span><p class="pop-plain">'+esc(plain)+'</p>'+
  '<div class="pop-formula">'+formula+'</div><div class="pop-src">'+esc(e.detail)+'<br/>来源：'+esc(e.sourceRef)+'</div>';
 pop.querySelector('.pop-close').onclick=()=>{pop.hidden=true;};
 const {w,h}=dims(canvases[world]);placePop(pop,x,y,w,h);
}
function pick(canvas,world,x,y){const {w,h}=dims(canvas);
 let node=null,nd=22;
 for(const n of state.models[world].nodes){
  const p=point(state.animation[world].get(n.id)||state.models[world].positions.get(n.id),w,h),d=Math.hypot(p[0]-x,p[1]-y);
  if(d<nd){nd=d;node=n.id;}}
 if(node){selectNode(node,world,x,y);return;}
 const edge=pickEdge(world,x,y);
 if(edge){selectEdge(edge,world,x,y);return;}
 // 点空白：关闭浮卡、退出路径/选中边（保留节点高亮）
 state.path=null;state.selectedEdge=null;closePops();
 get('m3-selected').textContent='点击星点查看主体；点击关系线查看权重；拖动画面，两座世界同步旋转。';
}
for(let i=0;i<2;i++){const c=canvases[i];
 c.addEventListener('pointerdown',e=>{dragging={id:e.pointerId,x:e.clientX,y:e.clientY,travel:0};c.setPointerCapture?.(e.pointerId);});
 c.addEventListener('pointermove',e=>{if(!dragging||dragging.id!==e.pointerId)return;const dx=e.clientX-dragging.x,dy=e.clientY-dragging.y;dragging.travel+=Math.abs(dx)+Math.abs(dy);state.yaw+=dx*.008;state.pitch=Math.min(.8,Math.max(-.8,state.pitch+dy*.006));dragging.x=e.clientX;dragging.y=e.clientY;});
 c.addEventListener('pointerup',e=>{if(dragging&&dragging.travel<9){const rect=c.getBoundingClientRect();pick(c,i,e.clientX-rect.left,e.clientY-rect.top);}dragging=null;});
 c.addEventListener('pointercancel',()=>dragging=null);
 c.addEventListener('wheel',e=>{e.preventDefault();state.zoom=Math.min(2,Math.max(.65,state.zoom-(e.deltaY>0?.1:-.1)));},{passive:false});
}
function loop(){if(!state.open)return;guideTick();draw(canvases[0],0);draw(canvases[1],1);requestAnimationFrame(loop);}

function open(){
 if(state.open)return;
 state.open=true;root.hidden=false;
 // 打开时（可能尚未拿到 flow）先渲染占位，拿到 flow 后 renderControls
 renderControls();
 if(state.flow){renderEvidence();}
 recompute();
 requestAnimationFrame(loop);
 document.body.style.overflow='hidden';get('m3-exit').focus();
 startGuide();
}
function close(){state.open=false;root.hidden=true;document.body.style.overflow='';launch.focus();}
get('m3-exit').onclick=close;
window.addEventListener('keydown',e=>{if(state.open&&e.key==='Escape')close();});

/* ---------- 首次发现引导 ---------- */
const GUIDE_KEY='boluo_m3_guided';
const guideSteps=[
 {text:'先让两个世界回到相同起点：都只有 4 个节点连通。',spot:null,next:'manual'},
 {text:'现在，把「世界 B」的强度滑块向右拖，看着节点亮起。',spot:'range-b',next:'wait-b'},
 {text:'新节点被点亮了（4 → 9）。点击一个亮起的橙色节点，看它的路径。',spot:'canvas-b',next:'wait-node'},
 {text:'这就是它被点亮的路径——金色的边随跨界强度变化。你已经会探索了。',spot:null,next:'done'}
];
function startGuide(){
 if(state.guideDone)return;
 let seen=false;try{seen=!!localStorage.getItem(GUIDE_KEY);}catch(e){}
 if(seen)return;
 state.guide={step:0,active:true};
 state.a=U_ANCHORS.low.u;state.b=U_ANCHORS.low.u;
 renderControls();recompute();
 guideEl.hidden=false;renderGuide();
}
function renderGuide(){
 const s=state.guide.step,st=guideSteps[s];
 get('m3-guide-text').textContent=(s+1)+' / '+guideSteps.length+' · '+st.text;
 get('m3-guide-dots').innerHTML=guideSteps.map((_,i)=>'<i class="'+(i===s?'on':'')+'"></i>').join('');
 const nextBtn=get('m3-guide-next');
 if(st.next==='manual'){nextBtn.hidden=false;nextBtn.textContent='下一步';}
 else if(st.next==='done'){nextBtn.hidden=false;nextBtn.textContent='开始探索';}
 else{nextBtn.hidden=true;}
 positionSpot(st.spot);
}
function positionSpot(target){
 const spot=get('m3-guide-spot');
 if(!target){spot.hidden=true;return;}
 const el=target==='range-b'?get('m3-range-b'):get('m3-canvas-b');
 if(!el){spot.hidden=true;return;}
 try{el.scrollIntoView({block:'center',behavior:'smooth'});}catch(e){}
 const r=el.getBoundingClientRect(),shell=root.getBoundingClientRect();
 spot.hidden=false;
 spot.style.left=(r.left-shell.left-8)+'px';spot.style.top=(r.top-shell.top-8)+'px';
 spot.style.width=(r.width+16)+'px';spot.style.height=(r.height+16)+'px';
}
function guideTick(){
 const g=state.guide;if(!g?.active)return;const st=guideSteps[g.step];
 if(st.next==='wait-b'&&state.b>0.45){g.step=2;renderGuide();}
 else if(st.next==='wait-node'){
  const id=state.selected;
  if(id&&state.models[1].reachable.includes(id)&&!state.models[0].reachable.includes(id)){g.step=3;renderGuide();}
 }
}
function finishGuide(){
 if(state.guide)state.guide.active=false;
 state.guideDone=true;guideEl.hidden=true;
 try{localStorage.setItem(GUIDE_KEY,'1');}catch(e){}
}
get('m3-guide-next').onclick=()=>{
 const g=state.guide,st=guideSteps[g.step];
 if(st.next==='manual'){g.step=1;renderGuide();}
 else if(st.next==='done')finishGuide();
};
get('m3-guide-skip').onclick=finishGuide;

// 从 M2 场景面板跳入：window.BOLUO_M3_APP.open(flowId)
function openForFlow(flowId){
 if(state.flow){open();return;}
 // 若还在 fetch，等待
 let tries=0;const t=setInterval(()=>{tries++;if(state.flow){clearInterval(t);open();}else if(tries>60){clearInterval(t);open();}},100);
}

// 读取 atlas 通勤流场（B 级区间）；GitHub Pages 边缘代理偶发 503，做有限次重试（最终失败 resolve null）
const fetchJSONRetry=(url,n=4)=>new Promise(resolve=>{
 let i=0;
 const go=()=>fetch(url,{cache:'no-store'}).then(r=>r.ok?r.json():Promise.reject(new Error('HTTP '+r.status)))
  .then(resolve).catch(()=>{i++;if(i>=n)resolve(null);else setTimeout(go,400*i+200);});
 go();
});
fetchJSONRetry('data/atlas.json').then(atlas=>{
 const f=atlas?.flows?.find(x=>x.id===COMMUTE_FLOW_ID)||atlas?.flows?.[0];
 if(!f){get('m3-flow-meta').textContent='未取到 B 级流场，仅显示无量纲结构实验。';return;}
 state.flow=f;state.sc=scenariosFromFlow(f);state.sens=null;
 renderEvidence();
 if(state.open){renderControls();recompute();}
});

window.BOLUO_M3_APP={
 open:openForFlow,close,
 compute:(a,b)=>compareWorlds(simulate(D.nodes,D.edges,a),simulate(D.nodes,D.edges,b)),
 modelVersion:M3_VERSION,
 flowId:COMMUTE_FLOW_ID
};
