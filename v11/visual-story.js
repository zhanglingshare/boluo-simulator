/* Boluo V11 | 03—12 | progressive visual storytelling controller.
   Purely additive; no original chart, model, stored record, evidence or control is deleted.
   Visual line widths are illustrations unless populated from the original page's own data. */
(function(){
"use strict";
const pageMap={"base-target.html":"03","industry-chain.html":"04","impact.html":"05","plan.html":"06","wind.html":"07","insights.html":"08","challenge.html":"09","region.html":"10","brief.html":"11","future.html":"12"};
const page=pageMap[location.pathname.split("/").pop()];
if(!page||document.querySelector(".v11-story"))return;
const q=(sel,root=document)=>root.querySelector(sel),qa=(sel,root=document)=>Array.from(root.querySelectorAll(sel));
const mk=(tag,cls,txt)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(txt!==undefined)x.textContent=String(txt);return x;};
const node=(tag,attrs={})=>{const x=document.createElementNS("http://www.w3.org/2000/svg",tag);for(const [k,v] of Object.entries(attrs))x.setAttribute(k,String(v));return x;};
const text=(t,x,y,sz=12,color="#d9f5f1")=>{const n=node("text",{x,y,fill:color,"font-size":sz,"font-weight":850,"text-anchor":"middle"});n.textContent=t;return n;};
const num=x=>Number.isFinite(Number(x))?Number(x).toLocaleString("zh-CN",{maximumFractionDigits:2}):"—";
const reduced=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const stage=mk("section","v11-story");stage.setAttribute("aria-label","本页快速发现与交互图");stage.dataset.page=page;
const head=mk("div","v11-story-head"),eyebrow=mk("span","","BOLUO · "+page+" / 一眼看懂"),provenance=mk("small","","图形优先 · 解释可展开");head.append(eyebrow,provenance);
const heading=mk("h2"),sub=mk("p","v11-story-sub"),content=mk("div","v11-story-content"),foot=mk("div","v11-story-footer");
const visual=mk("div","v11-story-card visual"),aside=mk("div","v11-story-card aside"),claim=mk("p","v11-story-claim"),boundary=mk("p","v11-story-boundary"),actions=mk("div","v11-story-actions");
aside.append(claim,boundary);content.append(visual,aside);stage.append(head,heading,sub,content,actions,foot);
const main=q("main");if(!main)return;
const parentTargets={"03":".page-intro","04":".hero","05":".fact-strip","06":".plan-hero","07":".wind-hero","08":".iq-hero","09":".opening","10":".hero","11":".hero","12":".hero"};
const parent=q(parentTargets[page],main)||q(":scope > section",main);
if(parent)parent.insertAdjacentElement("afterend",stage);else main.prepend(stage);
document.body.classList.add("v11-visual-refresh");document.body.dataset.v11Page=page;
function intro(title,subtitle,insight,limit){
 heading.textContent="";const emText=title.split("｜");heading.append(document.createTextNode(emText[0]));if(emText[1]){const em=mk("em","",emText[1]);heading.append(em);}
 sub.textContent=subtitle;claim.textContent=insight;boundary.textContent=limit;
 foot.replaceChildren(mk("span","","真实观测 ≠ 情景假设 · 触碰图形查看更多"),mk("span","","↓ 原有深度图表与参数完整保留"));
}
function action(label,fn,primary=false){const b=mk("button",primary?"active":"",label);b.type="button";b.addEventListener("click",fn);actions.append(b);return b;}
function jump(sel){const target=q(sel);if(!target)return;target.scrollIntoView({behavior:reduced?"auto":"smooth",block:"start"});target.classList.add("v11-highlight-anchor");setTimeout(()=>target.classList.remove("v11-highlight-anchor"),2200);}
function invoke(sel){const el=q(sel);if(el){el.click();return true;}return false;}
function nativeButton(sel,scroll){const x=q(sel);if(x){x.click();if(scroll)jump(scroll);}}
function badge(txt){return mk("span","v11-story-live-label",txt);}
function bar(label,value,denom=100){const row=mk("div","v11-story-barline"),line=mk("div","v11-story-bar-head");line.append(mk("span","",label),mk("strong","",num(value)+(denom===100?"%":"亿")));const track=mk("div","v11-story-bar-track"),fill=mk("b");fill.style.width=Math.max(0,Math.min(100,value/denom*100))+"%";track.append(fill);row.append(line,track);return row;}
function metric(label,val,detail,alert=false){const card=mk("div","v11-story-metric"+(alert?" alert":""));card.append(mk("span","",label),mk("strong","",val),mk("small","",detail));return card;}
function clearVisual(){visual.replaceChildren();}
function flow(labels,idx=1){const f=mk("div","v11-story-flow");labels.forEach((label,i)=>{const n=mk("div","v11-story-node"+(i===idx?" hot":""));n.append(mk("i","",String(i+1).padStart(2,"0")),mk("strong","",label));f.append(n)});return f;}
function foldedText(){
 const selectors=[".hero-sub",".section-lede",".section-heading p",".section-head p",".intro-lead",".section-desc",".control-desc",".section-intro",".chart-note",".section-note",".intro-copy > p"];
 const skip="details,dialog,nav,footer,.v11-story,.evidence,.source,.disclaimer,.warning,.fine,.privacy,.result-disclaimer,.model-boundary";
 const seen=new Set();for(const e of selectors.flatMap(x=>qa(x))){
  if(seen.has(e)||e.closest(skip)||e.querySelector("a,button,input,svg,canvas,table")||e.textContent.trim().length<105)continue;
  seen.add(e);if(e.id&&e.getAttribute("aria-live"))continue;
  e.classList.add("v11-copy-folded");
  const b=mk("button","v11-copy-toggle","展开解释 ↓");b.type="button";b.setAttribute("aria-expanded","false");e.insertAdjacentElement("afterend",b);
  b.addEventListener("click",()=>{const open=e.classList.toggle("v11-copy-expanded");b.textContent=open?"收起解释 ↑":"展开解释 ↓";b.setAttribute("aria-expanded",String(open));});
 }
}
function observe(sel,handler){
 const target=q(sel);if(!target)return;
 let scheduled=false;const run=()=>{scheduled=false;handler(target)};
 const observer=new MutationObserver(()=>{if(!scheduled){scheduled=true;requestAnimationFrame(run)}});
 observer.observe(target,{childList:true,subtree:true,characterData:true,attributes:false});run();return observer;
}
function getStory() {
 switch(page){
 case "03":{
  intro("1005.45亿｜距离1600亿，还差什么？","2025实际规模与2030规划目标放在同一张比例图中。点击下面的入口，再深入看产业树与历史年轮。","594.55亿元：这是规模差额，不是已经测出的未来增长。","把不同年份、不同价格口径的数字放在一起，不能当作目标达成概率。");
  clearVisual();const m=mk("div","v11-story-metrics");m.append(metric("2025 · 实际","1005.45","亿元 · 历史基数"),metric("2030 · 规划","1600","亿元 · 不代表预测"),metric("两端规模差额","594.55","亿元 · 目标减基数",true));visual.append(m);
  const bars=mk("div","v11-story-barlines");bars.append(bar("2025规模 / 2030目标",1005.45/1600*100),bar("离目标的静态差额",594.55/1600*100));visual.append(bars);
  action("① 看规模与目标",()=>jump(".compare-deck"),true);
  action("② 拖动历史年轮",()=>{jump("#baseCompareYear");q("#baseCompareYear")?.focus()});
  action("③ 拆开产业结构",()=>jump("#industryTree, .tree-stage, .industry-tree, .tree-section"));
  break;
 }
 case "04":{
  intro("比一比｜产业占比接近，发展就一样吗？","用同一年的三次产业占比，把博罗和另一县区摆在同一把尺上。点选县区，下面原图同步切换。","同样重工业，不等于一样的增长能力。","只比较同年同口径的结构比例；比例不等于效率、收入或竞争力评分。");
  const chart=mk("div","v11-story-stage"),nav=mk("div","v11-story-bench-nav");visual.append(nav,chart);
  let selected="huidong";
  const names={huidong:"惠东",sihui:"四会",heshan:"鹤山"};
  function peerData(){
   const list={};qa("#peerBars .peer-stack").forEach(b=>{const id=b.dataset.peer,parts=[".p1",".p2",".p3"].map(sel=>parseFloat(q(sel,b)?.style.width||"NaN"));if(parts.every(Number.isFinite))list[id]={name:id==="boluo"?"博罗":names[id]||id,parts};});
   return list;
  }
  function render(){
   const data=peerData();
   chart.replaceChildren();
   if(!data.boluo||!data[selected]){chart.append(badge("同类县区原图加载后，将显示双行产业结构镜像。"));return;}
   for(const id of ["boluo",selected]){
    const d=data[id],title=mk("div","v11-story-bar-head");title.append(mk("span","",d.name+" · 2024年"),mk("strong","",d.parts[1].toFixed(1)+"% 第二产业"));chart.append(title);
    const stack=mk("div","v11-story-stack");d.parts.forEach((v,i)=>{const seg=mk("span",["p1","p2","p3"][i],v>=12?v.toFixed(1)+"%":"");seg.style.width=v+"%";seg.title=["第一","第二","第三"][i]+"产业占比 "+v+"%";stack.append(seg);});chart.append(stack);
   }
   const delta=data[selected].parts[1]-data.boluo.parts[1];
   chart.append(badge("第二产业比重相差 "+Math.abs(delta).toFixed(1)+" 个百分点。先看结构，再讨论原因。"));
   claim.textContent="博罗与"+names[selected]+"的第二产业占比，能解释谁增长更快吗？";
  }
  Object.keys(names).forEach(id=>{const b=mk("button","",names[id]);b.type="button";b.setAttribute("aria-pressed",String(id===selected));b.addEventListener("click",()=>{selected=id;qa("button",nav).forEach(x=>x.setAttribute("aria-pressed",String(x===b)));invoke('#peerBars [data-peer="'+id+'"]');render();});nav.append(b);});
  observe("#peerBars",()=>render());setTimeout(render,180);
  action("查看完整同类县区图",()=>jump("#peer-benchmark"),true);
  action("看行业权重 × 增长",()=>jump("#industrial-portfolio"));
  break;
 }
 case "05":{
  intro("一处变化｜可能沿谁传导？","点选一个已经出现的统计信号，观察它可能触及的下一环。发光并不代表已发生的交易。","工业产出在涨，投资在降：不同指标讲的是不同事情。","左侧变化是统计观察，右侧传导路径只是应核实的机制，不得当成已证实因果。");
  const variants=[
   ["项目接续",["投资变化","项目节点","配套订单？","就业承接？"],"先核对项目兑现，而不是推定已经减少了多少岗位。"],
   ["本地订单",["工业生产","本地采购？","供应商？","居民收益？"],"本地配套是否受益，必须查看真实采购合同。"],
   ["就业生活",["产业岗位","企业招聘？","通勤住房？","到岗留任？"],"增长不能自动等同个人获得。"]
  ];let idx=0;const selectors=qa(".scenario-strip button[data-case]");
  const draw=()=>{clearVisual();visual.append(flow(variants[idx][1],1));visual.append(badge("虚线问号环节：尚需资料核验。"));claim.textContent=variants[idx][2];};
  draw();variants.forEach((v,i)=>action(v[0],()=>{idx=i;const native=selectors[i];if(native)native.click();draw()},i===0));
  action("查看真实双网络",()=>jump("#explore"));
  break;
 }
 case "06":{
  intro("五条路径｜谁直接贡献，谁帮助兑现？","不要把五条路径误读成五份可以直接相加的GDP。点选方向，查看它的关键兑现链条。","关键不是选最多，而是哪条路径有真正的接棒条件。","直接贡献路径与创新、通勤等促进条件不能重复计入经济贡献。");
  const paths=[["new","新项目兑现","直接贡献",["签约","投产","稳定生产","新增产出"]],["manufacturing","存量企业扩能","直接贡献",["存量企业","订单","扩产","稳定产出"]],["services","本地价值链延伸","直接贡献",["制造主体","本地服务","合同","价值留存"]],["innovation","创新生产率","放大条件",["技术落地","投入","转化","验证结果"]],["connect","连接与承载","放大条件",["跨区联系","通勤服务","协作","兑现条件"]]];
  const nav=mk("div","v11-story-paths"),board=mk("div","v11-story-stage");let selected=0;
  const draw=()=>{board.replaceChildren(flow(paths[selected][3],1),badge("本次只展示机制观察路线，节点不是已核实的因果链。"));claim.textContent="“"+paths[selected][1]+"”真正能走通吗？";};
  paths.forEach(([key,label,kind],i)=>{const b=mk("button",i===0?"active":"");b.type="button";b.append(mk("b","",label),mk("small","",kind));b.setAttribute("aria-pressed",String(i===selected));b.addEventListener("click",()=>{selected=i;qa("button",nav).forEach((x,j)=>x.setAttribute("aria-pressed",String(i===j)));nativeButton('[data-path="'+key+'"]');draw();});nav.append(b);});
  visual.append(nav,board);draw();
  action("进入完整路径实验台",()=>jump("#pathBuilder"),true);
  action("查看五路依赖",()=>jump("#pathSynergy"));
  break;
 }
 case "07":{
  intro("调一项压力｜整片分布怎样移动？","这里把原有风洞的真实计算分布镜像到首屏。可直接切换压力情景，完整计算和参数仍在下方。","最有价值的不是单个“达标率”，而是压力如何改变整片结果分布。","三条曲线是受控情景的模拟结果，不是已校准的现实预测或客观概率。");
  const viewer=mk("div","v11-story-live"),status=badge("加载原有条件模拟分布中…");viewer.append(status);visual.append(viewer);
  let drawing=false;
  const mirror=()=>{if(drawing)return;drawing=true;requestAnimationFrame(()=>{drawing=false;const src=q("#distChart");if(!src||!src.childNodes.length)return;const clone=src.cloneNode(true);clone.removeAttribute("id");qa("[id]",clone).forEach(x=>x.removeAttribute("id"));clone.setAttribute("aria-hidden","true");clone.style.width="100%";clone.style.height="auto";viewer.replaceChildren(clone,badge((q("#rangeShock")?.textContent||"2030 压力区间：按现有模型计算").slice(0,150)));claim.textContent=(q("#resultInsight")?.textContent||"压力条件发生变化，分布可能整体移动").slice(0,95);});};
  observe("#distChart",mirror);setTimeout(mirror,350);
  qa("[data-shock]").slice(0,4).forEach((b,i)=>action(b.querySelector("strong")?.textContent.trim()||"压力"+(i+1),()=>{b.click();setTimeout(mirror,180)},i===0));
  action("放大分布 / 调目标参照线",()=>jump("#distributionWork"),true);
  action("展开基准参数",()=>jump("#baselineConsole"));
  break;
 }
 case "08":{
  intro("断开一环｜重点排查顺序会变吗？","五个候选联系的优先关注顺序已经由原实验台计算。点一项，下面网络、权重排名、热力图同步响应。","最敏感的联系，未必是规模最大的主体。","排序是情景条件敏感性，不是经过SEM估计的真实路径系数或政府政策评分。");
  const list=mk("div","v11-story-rank-list"),hud=mk("div","v11-story-metrics");visual.append(hud,list);
  const read=()=>{
   hud.replaceChildren(metric("关注联系",q("#iqActiveName")?.textContent||"选择节点","当前线索"),metric("模拟暴露",q("#iqActiveScore")?.textContent||"—","情景指数"),metric("排查次序",q("#iqActiveRank")?.textContent||"—","根据条件调整"));
   const native=qa("#iqRankingBars button, #iqRankingBars [role=button]");
   list.replaceChildren();
   native.slice(0,4).forEach((item,i)=>{
    const t=item.textContent.replace(/\s+/g," ").trim().slice(0,52);if(!t)return;
    const b=mk("button","v11-story-rank-chip");b.type="button";b.append(mk("b","",String(i+1).padStart(2,"0")),mk("span","",t));b.addEventListener("click",()=>{item.click();jump("#iqLab");});list.append(b);
   });
   if(!list.children.length)list.append(badge("原实验台计算完成后，在这里显示候选联系排名。"));
   claim.textContent=(q("#iqStageHeadline")?.textContent||"试着改变一条关系，再问它还能否站得住。").slice(0,100);
  };
  observe("#iqRankingBars",read);setTimeout(read,220);
  action("切断当前假设联系",()=>{invoke("#iqSever");read()},true);
  action("换一条联系",()=>{invoke("#iqCycle");read()});
  action("查看三图联动",()=>jump("#iqLab"));
  break;
 }
 case "09":{
  intro("让反对意见上场｜你会改变判断吗？","两个观点不必争输赢。试着更换证据状态，看看哪些地方仍然没有答案。","知道什么证据能推翻自己，比急着证明自己正确更重要。","这是用户的证据状态自评，不是统计置信度，也不是平台自动裁决。");
  const sides=mk("div","v11-story-sides");visual.append(sides);
  function draw(){
   const current=q(".claim[aria-pressed=true] strong")?.textContent||"我原来的判断";
   const rival=q("#rivalTitle")?.textContent||q(".rival.active strong")?.textContent||"最强竞争解释";
   const proof=q("[data-proof][aria-pressed=true]")?.dataset.proof||"unknown";
   sides.replaceChildren();
   const left=mk("div","v11-story-side"+(proof==="current"?" selected":""));left.append(mk("small","","原判断"),mk("strong","",current));
   const right=mk("div","v11-story-side"+(proof==="alternative"?" selected":""));right.append(mk("small","","竞争解释"),mk("strong","",rival));
   sides.append(left,mk("span","v11-story-versus","VS"),right);
   claim.textContent=q("#verdictTitle")?.textContent||"关键证据尚未到位";
  }
  draw();const labels=[["unknown","还不知道"],["current","暂支持原判断"],["alternative","暂支持另一解释"]];
  labels.forEach(([k,v],i)=>action(v,()=>{invoke('[data-proof="'+k+'"]');draw()},i===0));
  qa("[data-claim]").forEach(b=>b.addEventListener("click",()=>setTimeout(draw,50)));
  observe("#verdictTitle",draw);
  action("查看反证条件",()=>jump("#falsify"));
  break;
 }
 case "10":{
  intro("54.6% VS 56.1%｜产业比例接近，就一样吗？","2025第二产业占GDP比重接近，但并不能据此评价县域与城市的产业链深度。点击下方再看真实价值流环节。","工业占比接近，不代表供应链、服务和居民收益也相同。","2025公开统计占比，跨行政层级对比，仅描述构成，不做竞争力评分。");
  const bars=mk("div","v11-story-barlines");bars.append(bar("博罗 · 第二产业占比",54.6),bar("东莞 · 第二产业占比",56.1));visual.append(bars);
  visual.append(badge("同为2025年第二产业比重，相差 1.5 个百分点。"));
  const items=[["manufacturing","工业产品"],["agriculture","农产品"],["tourism","游客消费"]];
  items.forEach(([key,label],i)=>action("追踪"+label,()=>{invoke('[data-value-flow="'+key+'"]');jump("#valueFlow")},i===0));
  action("如果外部联系断开",()=>jump("#regionalPressure"));
  break;
 }
 case "11":{
  intro("不是一份报告｜是你亲手走过的研究路。","只有主动保存的记录才被点亮。点击某个环节回到原页面，继续核验或重新进行实验。","空白不是失败，而是下一步最值得补的证据。","本机记录不会自动跨设备同步；未保存的推演不得当作完成。");
  const stamps=mk("div","v11-story-steps");visual.append(stamps);const desc=badge("读取本机已保存记录中…");visual.append(desc);
  const draw=()=>{
   const d=window.BoluoResearchDossier?.snapshot?.();if(!d)return;
   stamps.replaceChildren();d.steps.forEach((s,i)=>{
    const a=mk("a",s.exists?"done":"empty");a.href="./"+s.page;a.append(mk("b","",s.exists?"✓":String(i+1).padStart(2,"0")),mk("span","",s.name));a.setAttribute("aria-label",s.name+" "+(s.exists?"有保存":"未保存"));stamps.append(a);
   });
   desc.textContent=d.completed+" / "+d.total+" 项已保存。点击任意节点回看原始实验。";
   claim.textContent=d.completed?("最值得看的不是完成数量，而是这些记录还能被什么证据挑战。"):"当前还没有本机保存记录，先从一个问题开始。";
  };
  setTimeout(draw,140);observe("#savedCount",draw);
  action("展开我的研究轨迹",()=>jump("#myPath"),true);
  action("看最关键的缺失证据",()=>jump("#researchLedger"));
  break;
 }
 case "12":{
  intro("两个世界｜谁多了一条路，谁少了一条？","直接读取当前第十二页的结构实验结果，突出你修改的那条联系。其他指标与控制仍然保留在下方。","增加一条联系可能扩大机会，也可能制造新的依赖。","节点、权重和指数是演示性结构假设，不是真实交易或未来经济预测。");
  const metrics=mk("div","v11-story-metrics"),route=mk("div","v11-story-sides");visual.append(metrics,route);
  const draw=()=>{const d=window.BoluoFutureLab?.getResult?.();if(!d)return;
   metrics.replaceChildren(metric("世界A · 本地可达",Number(d.base.local).toFixed(1),"演示指数"),metric("世界B · 本地可达",Number(d.future.local).toFixed(1),"改变关系后"),metric("两世界差值",(d.delta.local>0?"+":"")+Number(d.delta.local).toFixed(1),"非GDP变化",d.delta.local<0));
   route.replaceChildren();
   const left=mk("div","v11-story-side");left.append(mk("small","","改变的起点"),mk("strong","",d.source));
   const right=mk("div","v11-story-side selected");right.append(mk("small","","影响的候选联系"),mk("strong","",d.target));
   route.append(left,mk("span","v11-story-versus","→"),right);
   claim.textContent=d.link.benefit;
  };
  setTimeout(draw,160);observe("#linkChange",draw);observe("#yearValue",draw);
  action("触摸双世界关系图",()=>jump("#lab"),true);
  action("看五年演化",()=>jump("#time"));
  action("发现可能的副作用",()=>jump("#redteam"));
  break;
 }
 }
}
getStory();foldedText();
})();
