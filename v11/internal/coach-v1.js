/* V11 Strategic Coach. Loaded after league.html's classic script.
 * Presentation is intentionally method-neutral; core metadata retains assumptions.
 * This module never overwrites roster, seasons or simulation parameters by itself.
 */
(function(){
 "use strict";
 if(typeof document==="undefined" || !window.BoluoCoachCore)return;
 const Core=window.BoluoCoachCore;
 const $c=id=>document.getElementById(id);
 const e=s=>String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
 const fmt=n=>Number(n).toFixed(1);
 const coach={open:false,tab:"diagnose",focus:null,uncertainty:"normal",other:"supply",inRender:false};
 function currentFocus(){
  let id=coach.focus;
  if(!id&&currentView==="wind")id=wtState.source;
  else if(!id&&currentView==="tactics")id=cxState.id||id;
  else if(!id&&(currentView==="players"||currentView==="scout"))id=selectedPlayer||id;
  if(!companies.some(p=>p.id===id))id=managerSelected()[0]?.id||companies[0]?.id;
  return id;
 }
 function context(){
  const view=managerCompute(),roster=managerSelected(),id=currentFocus();
  return {
   focus:id,roster:roster.map(p=>({id:p.id,short:p.short,name:p.name,club:p.club,ovr:getRating(p).ovr})),
   edges:wtLinks.map(x=>({a:x.a,b:x.b,w:x.w})),resources:view.used.slice(),
   score:careerScore(),policy:career.policy,networkScore:managerChemistry().net,
   resilience:career.training.resilience,recovery:career.recovery,fatigue:career.fatigue,
   quarter:career.quarter,horizon:Math.max(1,28-career.quarter),event:manager.event,
   focusName:companies.find(p=>p.id===id)?.short||"未选择"
  };
 }
 function calcScore(vals,w){const total=w.reduce((a,b)=>a+b,0);return vals.reduce((a,x,i)=>a+x*w[i],0)/total}
 function diagnostics(ctx){
  const result=Core.graph(ctx),p=companies.find(p=>p.id===ctx.focus),current=p?getRating(p):null;
  const sector=ctx.roster.map(x=>x.id);
  const isolate=result.isolated.length;
  const ranked=result.nodes[0];
  const scoreA=current?calcScore(current.values,presetWeights.growth):0,scoreB=current?calcScore(current.values,presetWeights.safe):0;
  const difference=Math.abs(scoreA-scoreB);
  let alert="当前未发现阵容中的明显孤立节点，但已知关系都是演示假设，不能据此确认真实配套。";
  if(isolate)alert="当前有 "+isolate+" 家阵容主体在演示网络中没有连接。它们可能是独立赛道，也可能是关系资料缺口，不能直接判定为弱企业。";
  else if(ranked&&ranked.removalShare>40)alert="假设网络对 "+companies.find(p=>p.id===ranked.id)?.short+" 的依赖集中。移除后涉及 "+ranked.removalShare+"% 的当前相关边权重，需要检查替代能力。";
  const kpi=(n,v)=>'<div class="blc-kpi"><span>'+n+'</span><b>'+e(v)+'</b></div>';
  const links=result.nodes.slice(0,4).map(x=>{
   const p=companies.find(q=>q.id===x.id);
   return '<button class="blc-row" data-blc-focus="'+e(x.id)+'"><span><b>'+e(p?.short||x.id)+'</b><small>假设连接 '+x.links+' 条 · 内部 '+x.internal+' / 外部 '+x.external+'</small></span><strong>'+x.removalShare+'%</strong></button>';
  }).join("");
  return '<div class="blc-hero"><div class="head">01 · IDENTIFY / 阵容诊断</div><strong>'+e(alert)+'</strong><p>关注关键依赖、缺失连接和评价口径，而不只看企业的总分。</p></div>'+
   '<div class="blc-panel"><h3>阵容网络检查 · 当前状态</h3><div class="blc-kpis">'+kpi("在阵容主体",ctx.roster.length)+kpi("假设关联边",result.assumedLinks)+kpi("无连接主体",isolate)+'</div>'+networkSvg(ctx)+'</div>'+
   '<div class="blc-panel"><h3>谁值得优先核查？</h3>'+ (links||'<p>当前阵容为空，请先选择产业主体。</p>')+
   '<div class="blc-info">右侧百分比为“当前假设关联边权重中，涉及该主体的份额”，不是产值贡献或真实关键性概率。</div><div class="blc-actions"><button class="blc-action secondary" data-blc-act="wind">进入全景关系风洞</button><button class="blc-action" data-blc-tab="change">查看可改变的条件</button></div></div>'+
   '<div class="blc-panel"><h3>评价标准一变，判断是否反转？</h3>'+
   (current?'<div class="blc-columns"><div class="blc-col"><strong>'+fmt(scoreA)+'</strong><span>成长权重下的 '+e(p.short)+'</span></div><div class="blc-col"><strong>'+fmt(scoreB)+'</strong><span>韧性权重下的 '+e(p.short)+'</span></div></div><div class="blc-info">同一家企业模型估分相差 '+fmt(difference)+' 分。变化来自评价偏好，不等于企业真实能力改变。</div>':'<p>请选择企业查看。</p>')+
   '<div class="blc-actions"><button class="blc-action secondary" data-blc-weight="growth">应用成长偏好</button><button class="blc-action secondary" data-blc-weight="safe">应用韧性偏好</button></div></div>'+
   '<div class="blc-disclosure">本栏关系来自 V5 的假设网络；连接数量和“移除份额”只用于结构侦察。企业能力分数是演示模型估值，不是官方企业评定。</div>';
 }
 function networkSvg(ctx){
  const focus=ctx.focus,links=ctx.edges.filter(x=>x.a===focus||x.b===focus).sort((a,b)=>b.w-a.w).slice(0,6);
  const positions=links.map((x,i)=>({id:x.a===focus?x.b:x.a,w:x.w,x:190+145*Math.cos(i*2*Math.PI/Math.max(1,links.length)-Math.PI/2),y:100+66*Math.sin(i*2*Math.PI/Math.max(1,links.length)-Math.PI/2)}));
  let s='<svg class="blc-chart" style="margin-top:10px" viewBox="0 0 380 202" aria-label="焦点企业及其假设关联示意"><rect width="380" height="202" rx="10" fill="#092133"/>';
  for(const p of positions)s+='<line x1="190" y1="100" x2="'+p.x.toFixed(1)+'" y2="'+p.y.toFixed(1)+'" stroke="#a6c9d8" stroke-width="'+(p.w*3).toFixed(2)+'" stroke-dasharray="4 5" opacity=".85"/>';
  for(const p of positions){const name=companies.find(x=>x.id===p.id)?.short||p.id;s+='<circle cx="'+p.x.toFixed(1)+'" cy="'+p.y.toFixed(1)+'" r="18" fill="#254960" stroke="#74afc6"/><text x="'+p.x.toFixed(1)+'" y="'+(p.y+4).toFixed(1)+'" text-anchor="middle" fill="#e1eef3" font-size="9">'+e(name.slice(0,4))+'</text>'}
  s+='<circle cx="190" cy="100" r="29" fill="#614a2a" stroke="#f8d999" stroke-width="2"/><text x="190" y="104" fill="#ffe1a4" text-anchor="middle" font-size="11" font-weight="900">'+e(ctx.focusName.slice(0,5))+'</text></svg>';
  return s;
 }
 function mechanismHtml(ctx){
  const x=Core.mechanism(ctx);
  return '<div class="blc-panel"><h3>路径透视 · 机制假设</h3>'+x.paths.map(p=>
   '<div class="blc-step"><span class="blc-dot">↗</span><div class="blc-steptext"><span>'+e(p.from)+' → '+e(p.to)+'</span><small>演示关联系数 '+fmt(p.coef)+'</small></div></div>').join('')+
   '<div class="blc-info">示例：资源投入经“技术转化”间接作用于生产能力，路径乘积约 '+x.indirect+'。这只是设定的机制系数，不是通过样本验证的因果效果。</div></div>';
 }
 function change(ctx){
  const sample=Core.sensitivity(ctx,{n:150,seed:20261120});
  const max=Math.max(1,...sample.items.map(x=>x.amplitude));
  const policyCards=Object.entries(Core.POLICY).map(([key,x])=>
   '<button class="blc-row" data-blc-policy="'+key+'"><span><b>'+e(x.label)+(key===ctx.policy?' · 当前':'')+'</b><small>下季度采用；不立即改变当前数据</small></span><strong>应用 ›</strong></button>').join('');
  return '<div class="blc-hero"><div class="head">02 · CHANGE / 可改变的条件</div><strong>先找瓶颈，再决定投入</strong><p>以当前阵容、经营状态和同一组随机扰动做条件扫描；变化最明显的未必是投资最多的变量。</p></div>'+
   '<div class="blc-panel"><h3>什么变量最影响未来区间中位数？</h3><div class="blc-sensitivity">'+sample.items.map(x=>
    '<div class="blc-sensrow"><span>'+e(x.label)+'</span><div class="blc-sensbar"><i style="width:'+Math.max(2,x.amplitude/max*100).toFixed(0)+'%"></i></div><strong>'+(x.delta>0?'+':'')+fmt(x.delta)+'</strong></div>').join('')+
   '</div><div class="blc-info">对单个条件做约±20%扫描，其余假设不变。结果是情景模型内的中位数变化，不能解释为已验证的因果效应。</div></div>'+
   mechanismHtml(ctx)+
   '<div class="blc-panel"><h3>下一季度怎么选择？</h3>'+policyCards+
   '<div class="blc-actions"><button class="blc-action secondary" data-blc-tab="future">先看不同未来</button></div></div>'+
   '<div class="blc-disclosure">路径系数目前是可编辑的机制假设，尚没有基于真实调查数据的参数估计和稳健性检验；相应验证留在后台完成。</div>';
 }
 function chart(forecast){
  const t=forecast.path,length=t.length-1,x=i=>35+i/Math.max(1,length)*410,y=v=>204-Math.max(0,Math.min(100,v))*1.74;
  const upper=t.map((v,i)=>x(i).toFixed(1)+','+y(v.p90).toFixed(1)),lower=t.map((v,i)=>x(i).toFixed(1)+','+y(v.p10).toFixed(1));
  const mid=t.map((v,i)=>x(i).toFixed(1)+','+y(v.p50).toFixed(1)).join(' ');
  let s='<svg class="blc-chart" viewBox="0 0 470 235" role="img" aria-label="演示未来季度中位数与P10到P90区间">';
  for(const k of [20,40,60,80,100])s+='<line x1="34" y1="'+y(k)+'" x2="453" y2="'+y(k)+'" stroke="#29475b" stroke-dasharray="3 5"/><text x="7" y="'+(y(k)+4)+'" fill="#9ab8c8" font-size="10">'+k+'</text>';
  s+='<polygon points="'+upper.concat(lower.reverse()).join(' ')+'" fill="#4baba548" stroke="none"/>';
  s+='<polyline points="'+mid+'" stroke="#f5d28f" stroke-width="2.8" fill="none"/>';
  s+='<text x="34" y="223" fill="#c0d4e1" font-size="10">现在</text><text x="452" y="223" text-anchor="end" fill="#c0d4e1" font-size="10">第 '+length+' 季</text></svg>';
  return s;
 }
 function future(ctx){
  if(coach.other===ctx.policy)coach.other=ctx.policy==="supply"?"technology":"supply";
  const vol=coach.uncertainty==="calm"?.75:coach.uncertainty==="hard"?1.25:1;
  const options={n:850,seed:20261120,horizon:ctx.horizon,factors:{volatility:vol}};
  const result=Core.forecast(ctx,options);
  const comparison=Core.pairedPolicies(ctx,coach.other,{n:450,seed:20261120,horizon:ctx.horizon,factors:{volatility:vol}});
  const opts=Object.entries(Core.POLICY).filter(([key])=>key!==ctx.policy).map(([key,x])=>'<option value="'+key+'" '+(key===coach.other?'selected':'')+'>'+e(x.label)+'</option>').join('');
  return '<div class="blc-hero"><div class="head">03 · FUTURE / 多条未来</div><strong>你的阵容，不只有一种结局</strong><p>以当前经营状态为起点，固定后续策略，进行850次可复现的随机季度演化，观察不同外部条件下的区间。</p></div>'+
   '<div class="blc-panel"><div class="blc-formrow"><label>外部扰动<select class="blc-select" id="blcVol"><option value="calm" '+(coach.uncertainty==="calm"?'selected':'')+'>偏弱</option><option value="normal" '+(coach.uncertainty==="normal"?'selected':'')+'>中等</option><option value="hard" '+(coach.uncertainty==="hard"?'selected':'')+'>偏强</option></select></label><label>替代经营策略<select class="blc-select" id="blcOther">'+opts+'</select></label></div>'+
   '<h3 style="margin-top:13px">未来区间 · '+ctx.horizon+' 季</h3>'+chart(result)+
   '<div class="blc-kpis"><div class="blc-kpi"><span>P10</span><b>'+fmt(result.p10)+'</b></div><div class="blc-kpi"><span>P50</span><b>'+fmt(result.p50)+'</b></div><div class="blc-kpi"><span>P90</span><b>'+fmt(result.p90)+'</b></div></div>'+
   '<div class="blc-info">在人为设定的扰动分布下，'+fmt(result.atOrAboveStart)+'% 的演示轨迹期末指数不低于本轮起点 '+fmt(result.anchor)+'。这不是博罗真实增长或达标概率。</div></div>'+
   '<div class="blc-panel"><h3>同一批扰动，两种策略谁更稳？</h3><div class="blc-kpis"><div class="blc-kpi"><span>替代策略差值 P10</span><b>'+fmt(comparison.p10)+'</b></div><div class="blc-kpi"><span>差值中位数</span><b>'+(comparison.p50>0?'+':'')+fmt(comparison.p50)+'</b></div><div class="blc-kpi"><span>差值 P90</span><b>'+fmt(comparison.p90)+'</b></div></div>'+
   '<p>模拟未来重复使用当前策略：'+e(Core.POLICY[ctx.policy]?.label||"稳健经营")+'；替代策略：'+e(Core.POLICY[coach.other]?.label||"补链强链")+'。两组使用相同随机种子，差值代表模型情景对比，非真实政策收益。</p>'+
   '<div class="blc-actions"><button class="blc-action" data-blc-policy="'+e(coach.other)+'">改用替代策略</button><button class="blc-action secondary" data-blc-act="season">返回成长赛季</button></div></div>'+
   '<div class="blc-disclosure">此区间基于旧版固定种子与分位数方法重写的动态情景代理，不是对旧版1600亿元产值风洞的直接换算。它不推算2032年产业布局1:5:4目标达成率。内部数值用于比较方案对假设的敏感程度。</div>';
 }
 function render(){
  if(!coach.open||coach.inRender)return;
  coach.inRender=true;
  try{
   const ctx=context();
   const p=companies.find(x=>x.id===ctx.focus);
   $c("blcContext").textContent=(currentView==="season"?"经营赛季":currentView==="wind"?"关系风洞":currentView==="tactics"?"阵容实验室":"企业侦察")+" · "+(career.quarter?careerPrintQuarter(career.quarter):"2026 开局")+" · "+(p?.short||"未选企业")+" · "+ctx.roster.length+"家阵容主体";
   document.querySelectorAll("#blcTabs button").forEach(b=>b.classList.toggle("active",b.dataset.blcTab===coach.tab));
   $c("blcBody").innerHTML=coach.tab==="diagnose"?diagnostics(ctx):coach.tab==="change"?change(ctx):future(ctx);
  }catch(err){$c("blcBody").innerHTML='<div class="blc-panel"><h3>分析暂不可用</h3><p>'+e(err.message)+'</p></div>';if(window.console)console.error("BoluoCoach",err)}
  coach.inRender=false;
 }
 function open(){
  coach.open=true;
  $c("blcBackdrop").classList.add("open");$c("blcDrawer").classList.add("open");
  $c("blcToggle").setAttribute("aria-expanded","true");
  $c("blcDrawer").setAttribute("aria-hidden","false");
  render();$c("blcClose").focus();
 }
 function close(){
  coach.open=false;
  $c("blcBackdrop").classList.remove("open");$c("blcDrawer").classList.remove("open");
  $c("blcToggle").setAttribute("aria-expanded","false");
  $c("blcDrawer").setAttribute("aria-hidden","true");$c("blcToggle").focus();
 }
 function applyPolicy(key){
  if(!Core.POLICY[key])return;
  career.policy=key;
  if(typeof renderCareer==="function")renderCareer();
  coach.tab="change";render();
 }
 function changeWeight(key){
  if(!["growth","safe"].includes(key))return;
  scorePreset=key;overrides=null;
  $c("scorePreset").value=key;
  renderWeightControls();refreshScores();
  managerSync();render();
 }
 function act(type){
  if(type==="wind"){wtState.source=currentFocus();close();setView("wind")}
  if(type==="season"){close();setView("season")}
 }
 function init(){
  const root=document.createElement("div");root.id="blCoachRoot";
  root.innerHTML='<button class="blc-launch" id="blcToggle" aria-expanded="false" aria-controls="blcDrawer"><span class="blc-pulse"></span>◎ 决策教练席</button>'+
    '<div class="blc-screen" id="blcBackdrop"></div>'+
    '<aside class="blc-drawer" id="blcDrawer" role="dialog" aria-modal="true" aria-label="博罗产业决策教练席" aria-hidden="true">'+
    '<div class="blc-top"><div class="blc-mini">BORO / STRATEGY COACH</div><div class="blc-brandrow"><div class="blc-brand">◈ 决策教练席</div><button id="blcClose" class="blc-close" aria-label="关闭教练席">关闭 ✕</button></div><div id="blcContext" class="blc-context"></div></div>'+
    '<div id="blcTabs" class="blc-tabs"><button data-blc-tab="diagnose" class="active">忽略了什么</button><button data-blc-tab="change">能改变什么</button><button data-blc-tab="future">可能怎样</button></div>'+
    '<div class="blc-body" id="blcBody" aria-live="polite"></div></aside>';
  document.body.appendChild(root);
  $c("blcToggle").addEventListener("click",()=>coach.open?close():open());
  $c("blcClose").addEventListener("click",close);
  $c("blcBackdrop").addEventListener("click",close);
  document.addEventListener("keydown",ev=>{if(ev.key==="Escape"&&coach.open)close()});
  $c("blcDrawer").addEventListener("click",ev=>{
   const tab=ev.target.closest("[data-blc-tab]");if(tab){coach.tab=tab.dataset.blcTab;render();return}
   const policy=ev.target.closest("[data-blc-policy]");if(policy){applyPolicy(policy.dataset.blcPolicy);return}
   const w=ev.target.closest("[data-blc-weight]");if(w){changeWeight(w.dataset.blcWeight);return}
   const focus=ev.target.closest("[data-blc-focus]");if(focus){coach.focus=focus.dataset.blcFocus;render();return}
   const action=ev.target.closest("[data-blc-act]");if(action)act(action.dataset.blcAct);
  });
  $c("blcDrawer").addEventListener("change",ev=>{
   if(ev.target.id==="blcVol")coach.uncertainty=ev.target.value;
   if(ev.target.id==="blcOther")coach.other=ev.target.value;
   render();
  });
  // Keep this one floating coach synchronized with all established V5–V10 spaces.
  const oldSync=managerSync;
  managerSync=function(){const result=oldSync.apply(this,arguments);render();return result};
  const oldSetView=setView;
  setView=function(){coach.focus=null;const result=oldSetView.apply(this,arguments);render();return result};
  const oldRefresh=refreshScores;
  refreshScores=function(){const result=oldRefresh.apply(this,arguments);render();return result};
  const oldOpenPlayer=openPlayer;
  openPlayer=function(id){coach.focus=id;const result=oldOpenPlayer.apply(this,arguments);render();return result};
  window.BoluoCoach={open,close,render,context,core:Core};
 }
 init();
})();
