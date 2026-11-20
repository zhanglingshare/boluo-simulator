/* Cross-page scenario handoff, v1. No fictional company is mapped to a named real enterprise. */
(function(){
"use strict";
const KEY="boluo-scout-scenario-v1";
const base="./scout-lab.html";
const css=document.createElement("style");css.textContent=".scout-bridge{border:1px solid #bd985e;background:linear-gradient(120deg,#40341e,#152e43);border-radius:13px;padding:15px;margin:13px 0;color:#e9d7af}.scout-bridge h4{font-size:15px;margin:0 0 7px;color:#ffe0a1}.scout-bridge p{font-size:11px;color:#bdced7;margin:5px 0 12px}.scout-bridge a,.scout-bridge button{display:inline-block;border-radius:8px;border:1px solid #dbbe7b;background:#72562c;color:#fff0c8;padding:9px 13px;margin-right:6px;text-decoration:none;font-size:12px;cursor:pointer}.scout-bridge small{display:block;margin-top:10px;color:#c0b4a2}";document.head.appendChild(css);
const jump=document.createElement("div");jump.className="scout-bridge";jump.innerHTML='<h4>◈ 产业球探实验室 · 24项属性与网络压力测试</h4><p>从企业能力诊断出发，设计压力情景，再把同一组参数交给产业关系风洞校验。演示原型不等于现有企业档案。</p><a href="'+base+'">打开球探实验室 →</a>';
const scout=document.getElementById("view-scout");
if(scout)scout.insertBefore(jump,scout.children[1]||null);
const wind=document.getElementById("view-wind");
if(!wind)return;
const pane=document.createElement("div");pane.className="scout-bridge";pane.id="scoutBridgePanel";wind.insertBefore(pane,wind.children[1]||null);
function read(){try{let p=JSON.parse(sessionStorage.getItem(KEY)||"null");return p&&p.schema===1&&Number.isFinite(p.demand)&&Number.isFinite(p.supply)&&Number.isFinite(p.tech)?p:null}catch(e){return null}}
function paint(){
const p=read();
const shared=p&&window.BoluoScenarioKernel?window.BoluoScenarioKernel.evaluate(p):null;
const summary=shared?'<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:12px 0"><div><b style="font-size:23px;color:#ffda90">'+shared.median+'</b><small>共享内核压力中位数</small></div><div><b style="font-size:20px;color:#8ce6d5">'+shared.p10+'–'+shared.p90+'</b><small>P10–P90 模拟区间</small></div><div><b style="font-size:20px;color:#ffda90">'+shared.rank[0].id+'</b><small>最高暴露虚构原型</small></div></div><div style="font-size:11px;color:#d4e4eb">局部敏感性 · 每项参数增加5个百分点：外需 '+shared.sensitivity.demand+' / 断供 '+shared.sensitivity.supply+' / 技改 '+shared.sensitivity.tech+'</div>':'';
pane.innerHTML='<h4>◈ 球探实验室 → 产业关系风洞</h4>'+
(p?'<p>已接收：'+String(p.archetype||"虚构主体").replace(/[<>&"]/g,"")+'｜外需 '+p.demand+'%｜断供 '+p.supply+'%｜技改 '+p.tech+'%</p><button id="scoutApply">套用情景参数</button><button id="scoutClear">清除快照</button>':'<p>尚无球探快照。先在球探实验室调整参数，点击“发送到产业风洞”。</p><a href="'+base+'">去球探实验室 →</a>')+
summary+'<small>注意：参数只做单位相容的近似映射；两套模型的拓扑和计算方法不同，结果不得直接视为一致。冲击源沿用当前风洞选择的真实档案主体，不自动映射虚构原型。</small>';
const apply=pane.querySelector("#scoutApply");
if(apply)apply.onclick=()=>{
 const safe=(v,min,max)=>Math.max(min,Math.min(max,Math.round(v/5)*5));
 // "Supply" is mapped to existing wind shock, demand to market divergence, technology to buffer.
 // In this handoff, use the dominant stress as source shock; do not pretend to conserve output units.
 wtState.type=p.supply>=p.demand?"supply":"orders";
 wtState.shock=safe(Math.max(p.demand,p.supply),0,50);
 wtState.sub=safe(30+p.tech*.8,0,100);
 wtState.market=safe(20+(60-p.demand)*.25,0,100);
 wtState.coord=safe(10+p.tech*.5,0,100);
 wtState.phase=2;
 if(typeof renderWind==="function")renderWind();
 const warning=document.createElement("p");warning.style.color="#f2d08b";warning.textContent="已套用参数。请核对当前冲击源和参数映射，再运行风洞；此操作不构成跨模型结果校准。";pane.appendChild(warning);
};
const clear=pane.querySelector("#scoutClear");if(clear)clear.onclick=()=>{sessionStorage.removeItem(KEY);paint()};
}
paint();window.addEventListener("focus",paint);

// Shared-kernel scenario strip in season view. Advisory overlay; does not modify existing quarterly engine.
const season=document.getElementById("view-season");
if(season){
 const strip=document.createElement("section");strip.className="scout-bridge";strip.id="scoutSeasonScenario";
 season.insertBefore(strip,season.children[1]||null);
 function seasonPaint(){
  const p=read();
  if(!p){strip.innerHTML='<h4>◈ 球探情景 · 赛季外部压力参考</h4><p>尚无已保存情景。可先在球探实验室设置外需、断供、技改，再导入。不会改动原有季度经营计算。</p><a href="'+base+'">建立情景 →</a>';return}
  const s=window.BoluoScenarioKernel.evaluate(p);
  // Quarter tape is only a deterministic illustrative exposure path, not a forecast or endogenous company evolution.
  const points=Array.from({length:29},(_,q)=>{const phase=Math.exp(-q/10),cycle=1+.09*Math.sin(q*.55);return {q,value:s.median*phase*cycle}});
  const xy=points.map(x=>(30+x.q*18.2)+','+(144-x.value/Math.max(1,s.median)*100)).join(' ');
  strip.innerHTML='<h4>◈ 同一球探情景 · 28季度压力参考曲线</h4><div style="display:flex;gap:18px;flex-wrap:wrap"><div><b style="font-size:30px;color:#ffe1a3">'+s.median+'</b><small>期初标准化压力中位数</small></div><div><b style="font-size:30px;color:#78e3d4">'+s.p10+'–'+s.p90+'</b><small>期初模拟区间</small></div></div><svg style="width:100%;height:180px" viewBox="0 0 590 180" aria-label="假设冲击按固定衰减路径递减的28季度示意曲线"><line x1="28" y1="146" x2="565" y2="146" stroke="#628aa2"/><polyline points="'+xy+'" fill="none" stroke="#7be1da" stroke-width="3"/><text x="30" y="165" fill="#aac5d3" font-size="12">2026 Q1</text><text x="500" y="165" fill="#aac5d3" font-size="12">2032 Q4</text></svg><p>演示衰减规则：压力随季度按 exp(−q/10) 衰减，叠加9%固定周期扰动。这不是企业成长预测，也不自动影响经理模式的资源与分数。</p><a href="'+base+'">修改球探情景</a>';
 }
 seasonPaint();window.addEventListener("focus",seasonPaint);
}

const btn=document.createElement("a");btn.href=base;btn.className="mgr-hero-launch";btn.textContent="◈ 24项产业球探实验室";const hero=document.querySelector(".hero-main");if(hero)hero.appendChild(btn);
})();
