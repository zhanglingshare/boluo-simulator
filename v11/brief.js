/* V11 / 11 — a report of observed facts, saved user selections and bounded experiments. */
(function(){
"use strict";
const $=id=>document.getElementById(id),D=window.BoluoBriefData;
if(!D){$("completionAdvice").textContent="记录组件未加载，请刷新后重试。";return;}
const PREFIX="./";
const safe=t=>D.safeText(t||"",260);
const el=(tag,cls,txt)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=txt;return n;};
const SVG="http://www.w3.org/2000/svg";
function svg(tag,attrs,body){const n=document.createElementNS(SVG,tag);Object.entries(attrs||{}).forEach(([k,v])=>n.setAttribute(k,String(v)));if(body!==undefined)n.textContent=String(body);return n;}
function read(){return D.load(window.localStorage,window.sessionStorage)}
let data=read(),toastTimer=0;
function toast(message){const n=$("toast");n.textContent=message;n.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>n.classList.remove("show"),3100);}
function number(x){return Math.round(x).toLocaleString("zh-CN")}
function labelDate(t){if(!t)return"当前浏览器本机记录";try{return new Date(t).toLocaleDateString("zh-CN",{year:"numeric",month:"2-digit",day:"2-digit"})+" 已保存"}catch(e){return"当前浏览器本机记录"}}
function status(node,yes){node.textContent=yes?"已保存":"尚未保存";node.classList.toggle("done",!!yes)}
function progress(){
 $("savedCount").textContent=data.completed;$("completionFill").style.width=Math.round(data.completed/data.total*100)+"%";
 $("completionSegments").replaceChildren(...data.steps.map(s=>el("i",s.exists?"active":"")));
 $("completionStatus").textContent=data.completed?"已收录 "+data.completed+" 项记录":"未建立个人记录";
 const description=data.completed===0?"你还没有在当前浏览器保存过任何一次探索；下面不会编造实验数值。":data.completed===data.total?"已保存所有七个环节的选择。请继续检查数据口径和缺失证据。":"已保存 "+data.completed+" 项，另有 "+(data.total-data.completed)+" 项尚缺记录；这不等于你没有浏览过相应页面。";
 $("completionAdvice").textContent=description;$("recordStamp").textContent="本机保存 · 非服务器档案";
}
function journey(){
 const out=$("journeySteps");out.replaceChildren();
 data.steps.forEach((s,i)=>{
  const card=el("article","journey-step"+(s.exists?" done":""));
  const number=el("span","journey-num","STEP "+String(i+1).padStart(2,"0"));
  const symbol=el("span","journey-mark",s.exists?"✓":"·");
  const title=el("strong","",s.name);
  const desc=el("p","",s.detail);
  const anchor=el("a","",s.exists?"回看原页面 ↗":"去完成并保存 ↗");anchor.href=PREFIX+s.page;
  card.append(number,symbol,title,desc,anchor);out.append(card);
 });
}
function line(x1,y1,x2,y2,stroke,width=1,dash){const e=svg("line",{x1,y1,x2,y2,stroke,"stroke-width":width});if(dash)e.setAttribute("stroke-dasharray",dash);return e}
function text(x,y,s,color,size=12,anchor="middle"){return svg("text",{x,y,fill:color,"font-size":size,"font-weight":750,"text-anchor":anchor},s)}
function range(){
 const c=$("scenarioDetails"),name=$("scenarioName"),w=data.wind;
 $("rangeChart").hidden=true;$("midChart").hidden=true;$("tempWarning").hidden=true;
 if(!w){$("experimentFlag").textContent="尚未保存实验";$("experimentFlag").className="chip";
 c.replaceChildren(el("span","chart-placeholder-title","这次还没有风洞结果"),el("p","","请在第七页调整条件并运行实验，然后明确保存到当前浏览器。"));
 name.textContent="改变一项条件，会发生什么？";$("conditionName").textContent="尚未选择";$("conditionStrength").textContent="—";$("conditionBuffer").textContent="—";$("conditionSource").textContent="暂无记录";return;}
 const saved=data.windSaved;
 $("experimentFlag").textContent=saved?"本机已保存实验":"仅临时计算";$("experimentFlag").className="chip"+(saved?" saved":" temporary");
 const diff=w.median-w.baseline,delta=(diff>=0?"+":"−")+number(Math.abs(diff));
 c.replaceChildren(el("span","chart-placeholder-title",w.name+" · 中位数变化 "+delta+" 亿元"),el("p","","对照仅反映第七页的条件设定。结果没有被第十一页重新计算，不表示真实经济损益。"));
 name.textContent="假设“"+w.name+"”，情景中位数发生什么变化？";
 $("conditionName").textContent=w.name;
 $("conditionStrength").textContent=Number(w.strength).toFixed(1)+" ×";
 $("conditionBuffer").textContent=w.buffer?"已选缓冲条件":"未选缓冲条件";
 $("conditionSource").textContent=saved?"第07页明确保存":"浏览器临时快照";
 const chart=data.windRange||(data.windRangeTemporary&&!saved?data.windRangeTemporary:null);
 if(chart){
  $("rangeChart").hidden=false;
  $("rangeCaution").textContent=(saved?"已匹配本机保存的实验条件与临时区间快照。":"临时区间快照尚未保存为个人实验。")+"P10—P90只反映该次条件运行的数值分布，不能直接称为现实达标概率。";
  drawInterval(chart);if(!saved)$("tempWarning").hidden=false;
 }else{
  $("midChart").hidden=false;
  $("medianBase").textContent=number(w.baseline)+" 亿元";
  $("medianStress").textContent=number(w.median)+" 亿元";
  if(!saved){$("tempWarning").hidden=false;$("tempWarning").textContent="该结果只在同浏览器中暂存，不能当作已完成的个人实验记录。";}
 }
}
function drawInterval(c){
 const vals=[c.base.p10,c.base.p90,c.stress.p10,c.stress.p90],lo0=Math.min(...vals,1600),hi0=Math.max(...vals,1600);
 const margin=Math.max(32,(hi0-lo0)*.11),lo=Math.max(0,Math.floor((lo0-margin)/50)*50),hi=Math.ceil((hi0+margin)/50)*50;
 const graph=$("intervalGraph"),guides=$("chartGuide"),ranges=$("chartRanges"),labels=$("chartLabels");
 guides.replaceChildren();ranges.replaceChildren();labels.replaceChildren();const left=76,right=715,width=right-left;
 const sx=n=>left+(n-lo)/(hi-lo)*width;
 const ticks=5;for(let i=0;i<=ticks;i++){const value=lo+(hi-lo)*i/ticks,x=sx(value);guides.append(line(x,43,x,182,"#47778b",.8,"3 7"));labels.append(text(x,203,number(value),"#a7c3cc",10));}
 if(1600>=lo&&1600<=hi){const x=sx(1600);guides.append(line(x,24,x,185,"#c0c0e6",2,"4 5"));labels.append(text(x,19,"1600亿规划线","#c9cbef",11));}
 [{k:"base",label:"基准",y:80,col:"#7ce3d1"},{k:"stress",label:"压力",y:148,col:"#ffb88b"}].forEach(item=>{
  const s=c[item.k];labels.append(text(18,item.y+4,item.label,"#c9e5e9",12,"start"));
  const x1=sx(s.p10),x2=sx(s.p90),xm=sx(s.p50);
  ranges.append(line(x1,item.y,x2,item.y,item.col,10));
  ranges.append(line(x1,item.y-15,x1,item.y+15,item.col,2.5));
  ranges.append(line(x2,item.y-15,x2,item.y+15,item.col,2.5));
  ranges.append(svg("circle",{cx:xm,cy:item.y,r:9,fill:"#17394b",stroke:item.col,"stroke-width":4}));
  const x=Math.max(82,Math.min(697,xm));
  labels.append(text(x,item.y-18,"P50 "+number(s.p50),item.col,12));
 });
 const desc="基准 P10 "+number(c.base.p10)+"、P50 "+number(c.base.p50)+"、P90 "+number(c.base.p90)+"亿元；压力 P10 "+number(c.stress.p10)+"、P50 "+number(c.stress.p50)+"、P90 "+number(c.stress.p90)+"亿元。";
 graph.setAttribute("aria-label","第七页条件实验对照："+desc);
}
function findings(){
 const i=data.insight,ch=data.challenge,r=data.region;
 status($("insightStatus"),!!i);
 if(i){$("insightTitle").textContent=i.name||"已保存的待核实联系";$("insightDescription").textContent=i.question||"选择的联系仍需公开证据或企业资料核验。";$("insightMissing").textContent=i.missing||"尚未提供具体材料";}else{$("insightTitle").textContent="你最想核实哪一条联系？";$("insightDescription").textContent="请在第八页选择一个联系并点击“保存我的观察”，这里才会留下记录。";$("insightMissing").textContent="尚未选择"}
 status($("challengeStatus"),!!ch);
 if(ch){$("challengeTitle").textContent=ch.title;$("challengeDescription").textContent="已记录一次竞争解释选择与证据判断。"+(ch.note?"本机备注："+ch.note:"用户自评并非平台核实。");$("challengeProof").textContent=D.PROOF[ch.proof];}else{$("challengeTitle").textContent="你的判断被反驳过吗？";$("challengeDescription").textContent="第九页的竞争解释只是待验证的另一种可能。请先明确保存自己的判断。";$("challengeProof").textContent="尚未选择";}
 status($("regionStatus"),!!r);
 if(r){$("regionTitle").textContent=r.question;$("regionDescription").textContent="你的区域观察："+r.title+"。外部协作不是必然好或坏，需要真实合同与成本收益。"+(r.role?" 研究角色："+r.role+"。":"")+(r.flow?" 价值链视角："+r.flow+"。":"")+(r.exposure!==null?" 情景结构暴露指数："+r.exposure+"/100（演示条件，非经济损失）。":"");$("regionMissing").textContent=r.evidence;}else{$("regionTitle").textContent="博罗在区域中应该如何连接？";$("regionDescription").textContent="区域合作并不代表具体企业交易。进入第十页保存一个真正关心的问题。";$("regionMissing").textContent="尚未选择";}
}
function optional(){
 const box=$("optionalList");box.replaceChildren();
 const entry=(name,value,target)=>{const card=el("div","optional-record");card.append(el("span","",name),el("strong","",value));const a=el("a","","查看原页面 ↗");a.href=PREFIX+target;card.append(a);box.append(card)};
 if(data.discovery.length)entry("01 / 今日博罗 · 发现",data.discovery.length+"条本机保存的追问（不等于已完成核验）","index.html");
 if(data.impact)entry("05 / 变化影响",data.impact.sceneTitle+" · 已保存的条件链","impact.html");
 if(data.plan)entry("06 / 规划路径",data.plan.routeTitle+" · 保存的规划关注点","plan.html");
 if(!box.childElementCount)box.append(el("div","optional-record empty","尚未保存前面的变化、影响和规划记录。需要时可以返回相应页面选择并保存。"));
}
function conclusion(){
 const i=data.insight,ch=data.challenge,r=data.region,p=data.plan;
 $("finalQuestion").textContent=r?r.question:i?(i.question||"这条联系的真实证据在哪里？"):ch?"什么事实能推翻我关于博罗的判断？":p?"规划路径兑现中，哪个项目节点值得优先核实？":"哪个环节最值得下一步核实？";
 $("finalKnown").textContent="2026年前三季度规上工业增加值同比+8.9%，工业投资同比−44.7%（口径不同）。";
 $("finalMissing").textContent=i?(i.missing||"这条联系仍需外部资料核实"):r?r.evidence:"请从第八或第十页选择一条有意义的待核实联系。";
 $("finalRevision").textContent=ch?(ch.proof==="unknown"?"目前尚缺能排除竞争解释的关键证据":D.PROOF[ch.proof]+"；仍需核验"):r?"取得可以证实或否定“"+r.title+"”有关联系的实际资料":"新增具有可比口径、可交叉核验的企业、项目或交易资料";
}
function render(){data=read();progress();journey();range();findings();optional();conclusion()}
function exportRecord(){
 const payload={format:"boluo-v11-decision-brief",version:1,exportedAt:new Date().toISOString(),provenance:"Current browser's explicit saved selections; temporary computations separately marked; not official statistics.",readme:"Numerical scenario values originate from page 07; they are conditional. This export does not contain a private statistical engine. Missing records are null; no values are imputed.",publicFacts:{year2025_GDP_current_billion:1005.45,industrialValueAdded_2026Q1Q3_yoyPercent:8.9,industrialInvestment_2026Q1Q3_yoyPercent:-44.7,planning2030GDP:1600},record:data,originalPages:["01/index.html","05/impact.html","06/plan.html","07/wind.html","08/insights.html","09/challenge.html","10/region.html"]};
 const file=new Blob([JSON.stringify(payload,null,2)],{type:"application/json;charset=utf-8"});const url=URL.createObjectURL(file),a=document.createElement("a");a.href=url;a.download="博罗V11-我的决策报告记录.json";document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1200);toast("已导出本机记录 JSON；文件包含你主动保存的备注与选择");
}
async function copy(){
 const message=D.textSummary(data)+"\n报告入口：https://zhanglingshare.github.io/boluo-simulator/v11/brief.html\n提示：链接不会携带当前设备的本机记录，完整内容请使用PDF或JSON分享。";
 try{await navigator.clipboard.writeText(message);toast("已复制摘要。完整报告请导出PDF或JSON");}
 catch(e){const a=el("textarea");a.value=message;a.style.cssText="position:fixed;left:-9999px;opacity:0";document.body.append(a);a.select();const ok=document.execCommand("copy");a.remove();toast(ok?"已复制摘要":"复制受限，请使用浏览器分享");}
}
$("printTop").addEventListener("click",()=>window.print());
$("exportPDF").addEventListener("click",()=>window.print());
$("exportJSON").addEventListener("click",exportRecord);
$("copySummary").addEventListener("click",copy);
$("refreshReport").addEventListener("click",()=>{render();toast("已重新读取当前浏览器已保存的记录")});
window.addEventListener("storage",e=>{if(Object.values(D.KEYS).includes(e.key))render()});
render();
})();