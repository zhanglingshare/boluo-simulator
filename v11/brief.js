/* V11 / 11.2 — personal research dossier: facts, saved experiments, falsifiers and evidence gaps. */
(function(){
"use strict";
const $=id=>document.getElementById(id),D=window.BoluoBriefData;
if(!D){$("completionAdvice").textContent="记录组件未加载，请刷新后重试。";return;}
const PREFIX="./",safe=t=>D.safeText(t||"",260);
const el=(tag,cls,txt)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=txt;return n;};
const SVG="http://www.w3.org/2000/svg";
function svg(tag,attrs,body){const n=document.createElementNS(SVG,tag);Object.entries(attrs||{}).forEach(([k,v])=>n.setAttribute(k,String(v)));if(body!==undefined)n.textContent=String(body);return n;}
function read(){return D.load(window.localStorage,window.sessionStorage)}
let data=read(),toastTimer=0;
function toast(message){const n=$("toast");n.textContent=message;n.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>n.classList.remove("show"),3100);}
function number(x){return Math.round(x).toLocaleString("zh-CN")}
function labelDate(t){if(!t)return"当前浏览器本机记录";try{return new Date(t).toLocaleDateString("zh-CN",{year:"numeric",month:"2-digit",day:"2-digit"})+" 已保存"}catch(e){return"当前浏览器本机记录"}}
function status(node,yes){node.textContent=yes?"已保存":"尚未保存";node.classList.toggle("done",!!yes)}
function pair(label,value,warn){const row=el("div","audit-pair");row.append(el("span","",label),el("strong",warn?"warn":"",value||"未保存"));return row;}
function tag(value,highlight){return el("span","audit-tag"+(highlight?" highlight":""),value);}
function link(label,href){const a=el("a","audit-link",label+" ↗");a.href=href;return a;}
function empty(message,href,label){const box=el("div","audit-empty");box.append(el("div","",message));if(href)box.append(link(label||"去补充记录",href));return box;}
function pairs(items){const box=el("div","audit-pairs");items.forEach(x=>box.append(pair(x[0],x[1],x[2])));return box;}
function progress(){
 $("savedCount").textContent=data.completed;$("completionFill").style.width=Math.round(data.completed/data.total*100)+"%";
 $("completionSegments").replaceChildren(...data.steps.map(s=>el("i",s.exists?"active":"")));
 $("completionStatus").textContent=data.completed?"已收录 "+data.completed+" 项记录":"未建立个人记录";
 const description=data.completed===0?"你还没有在当前浏览器保存过任何一次探索；下面不会编造实验数值。":data.completed===data.total?"已保存所有八个可保存环节的选择。请继续检查数据口径和缺失证据。":"已保存 "+data.completed+" 项，另有 "+(data.total-data.completed)+" 项尚缺记录；这不等于你没有浏览过相应页面。";
 $("completionAdvice").textContent=description;$("recordStamp").textContent="本机保存 · 非服务器档案";
}
function journey(){
 const out=$("journeySteps");out.replaceChildren();
 data.steps.forEach((s,i)=>{
  const card=el("article","journey-step"+(s.exists?" done":""));
  const numberNode=el("span","journey-num","STEP "+String(i+1).padStart(2,"0"));
  const symbol=el("span","journey-mark",s.exists?"✓":"·");
  const title=el("strong","",s.name),desc=el("p","",s.detail);
  const anchor=el("a","",s.exists?"回看原页面 ↗":"去完成并保存 ↗");anchor.href=PREFIX+s.page;
  card.append(numberNode,symbol,title,desc,anchor);out.append(card);
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
 const saved=data.windSaved;$("experimentFlag").textContent=saved?"本机已保存实验":"仅临时计算";$("experimentFlag").className="chip"+(saved?" saved":" temporary");
 const diff=w.median-w.baseline,delta=(diff>=0?"+":"−")+number(Math.abs(diff));
 c.replaceChildren(el("span","chart-placeholder-title",w.name+" · 中位数变化 "+delta+" 亿元"),el("p","","对照仅反映第七页的条件设定。结果没有被第十一页重新计算，不表示真实经济损益。"));
 name.textContent="假设“"+w.name+"”，情景中位数发生什么变化？";
 $("conditionName").textContent=w.name;$("conditionStrength").textContent=Number(w.strength).toFixed(1)+" ×";
 $("conditionBuffer").textContent=w.buffer?"已选缓冲条件":"未选缓冲条件";$("conditionSource").textContent=saved?"第07页明确保存":"浏览器临时快照";
 const chart=data.windRange||(data.windRangeTemporary&&!saved?data.windRangeTemporary:null);
 if(chart){$("rangeChart").hidden=false;$("rangeCaution").textContent=(saved?"已匹配本机保存的实验条件与临时区间快照。":"临时区间快照尚未保存为个人实验。")+"P10—P90只反映该次条件运行的数值分布，不能直接称为现实达标概率。";drawInterval(chart);if(!saved)$("tempWarning").hidden=false;}
 else{$("midChart").hidden=false;$("medianBase").textContent=number(w.baseline)+" 亿元";$("medianStress").textContent=number(w.median)+" 亿元";if(!saved){$("tempWarning").hidden=false;$("tempWarning").textContent="该结果只在同浏览器中暂存，不能当作已完成的个人实验记录。";}}
}
function drawInterval(c){
 const vals=[c.base.p10,c.base.p90,c.stress.p10,c.stress.p90],lo0=Math.min(...vals,1600),hi0=Math.max(...vals,1600);
 const margin=Math.max(32,(hi0-lo0)*.11),lo=Math.max(0,Math.floor((lo0-margin)/50)*50),hi=Math.ceil((hi0+margin)/50)*50;
 const graph=$("intervalGraph"),guides=$("chartGuide"),ranges=$("chartRanges"),labels=$("chartLabels");
 guides.replaceChildren();ranges.replaceChildren();labels.replaceChildren();const left=76,right=715,width=right-left,sx=n=>left+(n-lo)/(hi-lo)*width;
 for(let i=0;i<=5;i++){const value=lo+(hi-lo)*i/5,x=sx(value);guides.append(line(x,43,x,182,"#47778b",.8,"3 7"));labels.append(text(x,203,number(value),"#a7c3cc",10));}
 if(1600>=lo&&1600<=hi){const x=sx(1600);guides.append(line(x,24,x,185,"#c0c0e6",2,"4 5"));labels.append(text(x,19,"1600亿规划线","#c9cbef",11));}
 [{k:"base",label:"基准",y:80,col:"#7ce3d1"},{k:"stress",label:"压力",y:148,col:"#ffb88b"}].forEach(item=>{
  const s=c[item.k];labels.append(text(18,item.y+4,item.label,"#c9e5e9",12,"start"));
  const x1=sx(s.p10),x2=sx(s.p90),xm=sx(s.p50);ranges.append(line(x1,item.y,x2,item.y,item.col,10));ranges.append(line(x1,item.y-15,x1,item.y+15,item.col,2.5));ranges.append(line(x2,item.y-15,x2,item.y+15,item.col,2.5));ranges.append(svg("circle",{cx:xm,cy:item.y,r:9,fill:"#17394b",stroke:item.col,"stroke-width":4}));
  labels.append(text(Math.max(82,Math.min(697,xm)),item.y-18,"P50 "+number(s.p50),item.col,12));
 });
 const desc="基准 P10 "+number(c.base.p10)+"、P50 "+number(c.base.p50)+"、P90 "+number(c.base.p90)+"亿元；压力 P10 "+number(c.stress.p10)+"、P50 "+number(c.stress.p50)+"、P90 "+number(c.stress.p90)+"亿元。";
 graph.setAttribute("aria-label","第七页条件实验对照："+desc);
}
function findings(){
 const i=data.insight,ch=data.challenge,r=data.region;
 status($("insightStatus"),!!i);
 if(i){$("insightTitle").textContent=i.name||"已保存的待核实联系";$("insightDescription").textContent=i.question||"选择的联系仍需公开证据或企业资料核验。";$("insightMissing").textContent=i.missing||"尚未提供具体材料";}
 else{$("insightTitle").textContent="你最想核实哪一条联系？";$("insightDescription").textContent="请在第八页选择一个联系并点击“保存我的观察”，这里才会留下记录。";$("insightMissing").textContent="尚未选择";}
 status($("challengeStatus"),!!ch);
 if(ch){$("challengeTitle").textContent=ch.title;$("challengeDescription").textContent="竞争解释："+ch.rivalTitle+"。待检验证据："+ch.evidenceTitle+"。"+(ch.note?"本机备注："+ch.note:"")+" 用户自评并非平台核实。";$("challengeProof").textContent=ch.proofLabel;}
 else{$("challengeTitle").textContent="你的判断被反驳过吗？";$("challengeDescription").textContent="第九页的竞争解释只是待验证的另一种可能。请先明确保存自己的判断。";$("challengeProof").textContent="尚未选择";}
 status($("regionStatus"),!!r);
 if(r){$("regionTitle").textContent=r.question;$("regionDescription").textContent="你的区域观察："+r.title+"。"+(r.layerTitle?r.layerTitle+"。":"")+(r.roleTitle?"研究角色："+r.roleTitle+"。":"")+(r.flowTitle?"价值链视角："+r.flowTitle+(r.flowStageTitle?" / "+r.flowStageTitle:"")+"。":"")+(r.pressure?"结构暴露指数："+r.pressure.score+"/100（演示条件，非经济损失）。":"");$("regionMissing").textContent=r.evidence;}
 else{$("regionTitle").textContent="博罗在区域中应该如何连接？";$("regionDescription").textContent="区域合作并不代表具体企业交易。进入第十页保存一个真正关心的问题。";$("regionMissing").textContent="尚未选择";}
}
function buildWindReplay(w){
 const u=new URL("./wind.html",location.href);u.searchParams.set("shock",w.shock);u.searchParams.set("strength",String(w.strength));u.searchParams.set("buffer",w.buffer?"1":"0");u.searchParams.set("active",w.active?"1":"0");
 if(w.paths&&w.paths.length){u.searchParams.set("paths",w.paths.join(","));if(w.primary)u.searchParams.set("route",w.primary);u.searchParams.set("scope",w.scope==="仅所选路径"?"selected":"all");}
 const p=w.baselineParams;if(p){if(Number.isFinite(p.baseScale))u.searchParams.set("bs",String(p.baseScale));if(Number.isFinite(p.volScale))u.searchParams.set("bv",String(p.volScale));if(Number.isFinite(p.count))u.searchParams.set("n",String(p.count));if(Array.isArray(p.paths))p.paths.forEach((v,i)=>u.searchParams.set("bp"+i,String(v)));}
 const d=w.distribution;if(d){if(Number.isFinite(d.threshold))u.searchParams.set("line",String(d.threshold));if(d.view)u.searchParams.set("view",d.view);}
 u.hash="results";return u.href;
}
function renderWindAudit(){
 const out=$("windAudit");out.replaceChildren();const w=data.wind;
 status($("windAuditStatus"),data.windSaved);
 if(!data.windSaved||!w){out.append(empty(w?"发现临时结果，但没有明确保存。它不会计入已完成实验。":"尚无已保存的风洞实验。临时运行结果不计入完成。","wind.html","去第07页运行并保存"));return;}
 const rows=[
  ["压力条件",w.name],["压力档位",Number(w.strength).toFixed(1)+" ×"],["缓冲条件",w.buffer?"已开启":"未开启"],
  ["作用范围",w.scope],["中位数对照",number(w.baseline)+" → "+number(w.median)+" 亿元"],
  ["所选路径",w.pathLabels.length?w.pathLabels.join("、"):"未单独限定路径"],
  ["基准规模",w.baselineParams&&Number.isFinite(w.baselineParams.baseScale)?w.baselineParams.baseScale.toFixed(2):"未保存"],
  ["波动设置",w.baselineParams&&Number.isFinite(w.baselineParams.volScale)?w.baselineParams.volScale.toFixed(2):"未保存"],
  ["运行次数",w.baselineParams&&Number.isFinite(w.baselineParams.count)?number(w.baselineParams.count):"未保存"],
  ["保存时间",labelDate(w.date)]
 ];
 out.append(pairs(rows));
 if(w.baselineParams&&w.baselineParams.paths){const box=el("div","audit-tags");w.baselineParams.paths.forEach((v,i)=>box.append(tag("通道"+(i+1)+" × "+v.toFixed(2))));out.append(box);}
 if(data.windRange){const c=data.windRange;out.append(el("div","audit-tags"));const box=el("div","audit-tags");box.append(tag("基准P10 "+number(c.base.p10)),tag("基准P50 "+number(c.base.p50)),tag("基准P90 "+number(c.base.p90)),tag("压力P10 "+number(c.stress.p10)),tag("压力P50 "+number(c.stress.p50)),tag("压力P90 "+number(c.stress.p90),true));out.append(box);}
 else out.append(el("p","audit-note","当前本机保存了中位数和条件；没有找到与该次实验匹配的完整区间快照，因此不补造P10—P90。"));
 out.append(link("按保存条件重新打开风洞",buildWindReplay(w)));
}
function renderChallengeAudit(){
 const out=$("challengeAudit"),ch=data.challenge;out.replaceChildren();status($("challengeAuditStatus"),!!ch);
 if(!ch){out.append(empty("尚未保存自己的判断、竞争解释或反证条件。","challenge.html","去第09页写下判断"));return;}
 out.append(pairs([["原判断",ch.title],["竞争解释",ch.rivalTitle],["待检验证据",ch.evidenceTitle],["当前自评",ch.proofLabel],["反证条件",ch.falsifier||"尚未填写",!ch.falsifier],["观察阈值",ch.threshold||"尚未设定",!ch.threshold],["观察期限",ch.horizon],["保存时间",labelDate(ch.date)]]));
 const confidence=el("div","audit-confidence");confidence.append(pair("主观确信",ch.confidence+"/100"));const meter=el("div","audit-meter"),fill=el("i");fill.style.width=ch.confidence+"%";meter.append(fill);confidence.append(meter);out.append(confidence);
 if(ch.note)out.append(el("p","audit-note","个人备注："+ch.note));
 out.append(el("p","audit-note","确信度是填写者的主观刻度，不是统计置信度；当前证据状态也是个人自评。"));
 out.append(link("回到第09页修改或复核","challenge.html"));
}
function buildRegionReplay(r){
 const u=new URL("./region.html",location.href);u.searchParams.set("area","boluo");u.searchParams.set("topic",r.topic);
 if(r.layer)u.searchParams.set("layer",r.layer);
 if(r.flow)u.searchParams.set("flow",r.flow);
 if(r.flowStage!==null&&r.flowStage!==undefined)u.searchParams.set("flowStage",String(r.flowStage));
 if(r.role)u.searchParams.set("role",r.role);
 if(r.layer)u.searchParams.set("pressureLayer",r.layer);
 if(r.pressure){u.searchParams.set("dep",String(r.pressure.dependency));u.searchParams.set("shock",String(r.pressure.shock));u.searchParams.set("sub",String(r.pressure.substitute));u.searchParams.set("pressureAdjusted",r.pressure.adjusted?"1":"0");}
 u.hash="finalQuestion";return u.href;
}
function renderRegionAudit(){
 const out=$("regionAudit"),r=data.region;out.replaceChildren();status($("regionAuditStatus"),!!r);
 if(!r){out.append(empty("尚未保存区域问题与压力条件。","region.html","去第10页选择并保存"));return;}
 out.append(pairs([["区域问题",r.question],["联系层",r.layerTitle],["研究角色",r.roleTitle||"尚未保存"],["价值链",r.flowTitle||"尚未选择"],["当前环节",r.flowStageTitle||"尚未选择"],["保存时间",labelDate(r.date)]]));
 if(r.pressure){
  const box=el("div","audit-tags");box.append(tag("外部依赖 "+r.pressure.dependency),tag("冲击强度 "+r.pressure.shock),tag("替代能力 "+r.pressure.substitute),tag("结构暴露 "+r.pressure.score+"/100",true));out.append(box);
 }else out.append(el("p","audit-note","保存了区域问题，但当前记录没有完整的三项压力滑杆值；不以默认值补齐。"));
 out.append(pair("待补证据",r.evidence,true));
 out.append(link(r.pressure?"按保存条件重开第10页":"回到第10页补充条件",buildRegionReplay(r)));
}
function buildFutureReplay(f){
 const u=new URL("./future.html",location.href);
 for(const k of ["scene","link","mode","intensity","year"])u.searchParams.set(k,String(f[k]));
 u.hash="lab";return u.href;
}
function renderFutureAudit(){
 const out=$("futureAudit"),f=data.future;out.replaceChildren();status($("futureAuditStatus"),!!f);
 if(!f){out.append(empty("没有主动保存未来方案。访问第12页或调整过参数，都不等于已经完成保存。","future.html","去第12页试着重构一条联系"));return;}
 const modes={strengthen:"加强",weaken:"削弱",cut:"断开",add:"新增"};
 const names={manufacturing:"工业本地配套",agriculture:"柏塘农品价值链",commuting:"通勤与就业"};
 out.append(pairs([
  ["观察场景",names[f.scene]],["改造关系",f.summary],["改变方式",modes[f.mode]],
  ["调整强度",f.intensity+"%"],["观察年份",String(f.year)],["本地可达",f.baseline.local+" → "+f.future.local],
  ["连接指数",f.baseline.connection+" → "+f.future.connection],["替代韧性",f.baseline.resilience+" → "+f.future.resilience],
  ["保存时间",labelDate(f.savedAt)]
 ]));
 out.append(pair("证据缺口",f.evidenceGap,true));
 out.append(el("p","audit-note","所有结构指数均为受控条件演示，不是现实经济收益、GDP增长或已识别因果效应。"));
 out.append(link("按保存条件重新打开双世界",buildFutureReplay(f)));
}
function evidenceTasks(){
 const tasks=[];
 if(data.future)tasks.push({title:"验证第12页新建的结构连接是否现实可行",detail:data.future.evidenceGap+"。请核实真实合作、成本与替代路径，不能把演示指数当成实际贡献。",href:"future.html",label:"回到未来实验"});
 if(data.insight)tasks.push({title:data.insight.question||("核实："+data.insight.name),detail:"缺少材料："+(data.insight.missing||"尚未填写")+"。先取得可追溯的合同、统计或调查记录。",href:"insights.html",label:"回到第08页"});
 if(data.challenge){
  tasks.push({title:data.challenge.falsifier?"观察反证条件是否出现":"为当前判断写下一条可推翻它的条件",detail:"待检验证据："+data.challenge.evidenceTitle+"；阈值："+(data.challenge.threshold||"尚未设定")+"；期限："+data.challenge.horizon+"。",href:"challenge.html",label:"回到第09页"});
 }
 if(data.region)tasks.push({title:data.region.question,detail:"优先补齐："+data.region.evidence+"。"+(data.region.pressure?(data.region.pressure.adjusted?"本次滑杆已调整，仍需核实三项取值是否贴近真实关系。":"已保存的是默认初始档位，尚未记录手动压力测试。"):"当前没有保存完整压力条件。"),href:"region.html",label:data.region.pressure&&!data.region.pressure.adjusted?"调整第10页压力条件":"回到第10页"});
 if(!data.windSaved)tasks.push({title:"保存一次完整的条件实验",detail:"运行后明确保存压力类型、档位、缓冲、作用范围和基准设置；临时结果不计入档案。",href:"wind.html",label:"回到第07页"});
 else if(!data.wind.baselineParams)tasks.push({title:"补齐实验基准设置",detail:"本机记录有中位数和压力条件，但没有完整保存基准参数；重新运行并保存，才能提高复现程度。",href:"wind.html",label:"重新运行实验"});
 if(data.plan)tasks.push({title:"核对规划方向的项目兑现节点",detail:"当前保存的方向："+data.plan.routeTitle+"。还需要逐项核对项目进度、责任主体和实际投产节点。",href:"plan.html",label:"回到第06页"});
 if(!tasks.length)tasks.push({title:"从一条可以核验的具体问题开始",detail:"选择一个真实变化，写清楚它影响谁、需要什么证据、什么结果会改变你的判断。",href:"index.html",label:"从第01页开始"});
 return tasks.slice(0,5);
}
function renderLedger(){
 $("ledgerSaved").textContent=data.completed;
 $("ledgerExperiments").textContent=(Number(data.windSaved)+Number(Boolean(data.future))).toString();
 $("ledgerFalsifiers").textContent=data.challenge&&data.challenge.falsifier? "1":"0";
 const tasks=evidenceTasks();$("ledgerOpen").textContent=tasks.length;
 renderWindAudit();renderChallengeAudit();renderRegionAudit();renderFutureAudit();
 const out=$("evidenceQueue");out.replaceChildren();
 tasks.forEach((t,i)=>{const row=el("div","evidence-task"),n=el("span","",String(i+1).padStart(2,"0")),body=el("div","");body.append(el("strong","",t.title),el("p","",t.detail));const a=el("a","",t.label+" ↗");a.href=t.href;row.append(n,body,a);out.append(row);});
 $("reportStamp").textContent="本机档案读取于 "+new Date().toLocaleString("zh-CN",{hour12:false});
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
 const i=data.insight,ch=data.challenge,r=data.region,p=data.plan,f=data.future;
 $("finalQuestion").textContent=r?r.question:i?(i.question||"这条联系的真实证据在哪里？"):ch?(ch.falsifier||"什么事实能推翻我关于博罗的判断？"):p?"规划路径兑现中，哪个项目节点值得优先核实？":f?"哪一条假设关系需要最先取得真实证据？":"哪个环节最值得下一步核实？";
 $("finalKnown").textContent="2025年博罗GDP现价1005.45亿元；2026年前三季度规上工业增加值同比+8.9%，工业投资同比−44.7%（不同口径，不据此推断因果）。";
 $("finalMissing").textContent=r?r.evidence:i?(i.missing||"这条联系仍需外部资料核实"):ch?ch.evidenceTitle:f?f.evidenceGap:"请从第八、第十或第十二页选择一条待核实联系。";
 $("finalRevision").textContent=ch?(ch.falsifier||("需要出现能检验“"+ch.rivalTitle+"”的可靠证据"))+"；阈值："+(ch.threshold||"未设定")+"；期限："+ch.horizon:r?"取得可以证实或否定相关区域联系的合同、调查或项目资料": "新增具有可比口径、可交叉核验的企业、项目或交易资料";
}
function render(){data=read();progress();journey();range();findings();optional();renderLedger();conclusion();}
function exportRecord(){
 const payload={format:"boluo-v11-research-dossier",version:2,exportedAt:new Date().toISOString(),
  provenance:"Current browser's explicit saved selections. Temporary computations are separately marked and are not counted as completed research.",
  readme:"Facts, scenarios, personal judgments and unknowns are separate. No missing values are imputed. This export contains no private statistical engine or undisclosed model implementation. User-entered notes may be present; inspect before sharing.",
  publicFacts:{year2025_GDP_current_billion:1005.45,industrialValueAdded_2026Q1Q3_yoyPercent:8.9,industrialInvestment_2026Q1Q3_yoyPercent:-44.7,planning2030GDP:1600},
  audit:{savedSteps:data.completed,totalSteps:data.total,windIsSaved:data.windSaved,challengeHasFalsifier:Boolean(data.challenge&&data.challenge.falsifier),regionPressureSaved:Boolean(data.region&&data.region.pressure),futureExperimentSaved:Boolean(data.future)},
  record:data,originalPages:["01/index.html","05/impact.html","06/plan.html","07/wind.html","08/insights.html","09/challenge.html","10/region.html","11/brief.html","12/future.html"]};
 const file=new Blob([JSON.stringify(payload,null,2)],{type:"application/json;charset=utf-8"}),url=URL.createObjectURL(file),a=document.createElement("a");a.href=url;a.download="博罗V11-个人研究档案-2.0.json";document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1200);toast("已导出研究档案 JSON。文件可能包含你的个人备注，分享前请先检查。");
}
async function copy(){
 const message=D.textSummary(data)+"\n报告入口：https://zhanglingshare.github.io/boluo-simulator/v11/brief.html\n提示：链接不会携带当前设备的本机记录，完整参数请使用JSON导出。";
 try{await navigator.clipboard.writeText(message);toast("已复制研究档案摘要");}
 catch(e){const a=el("textarea");a.value=message;a.style.cssText="position:fixed;left:-9999px;opacity:0";document.body.append(a);a.select();const ok=document.execCommand("copy");a.remove();toast(ok?"已复制研究档案摘要":"复制受限，请使用浏览器分享");}
}
$("printTop").addEventListener("click",()=>window.print());
$("exportPDF").addEventListener("click",()=>window.print());
$("exportJSON").addEventListener("click",exportRecord);
$("copySummary").addEventListener("click",copy);
$("refreshReport").addEventListener("click",()=>{render();toast("已重新读取当前浏览器已保存的研究记录");});
window.addEventListener("storage",e=>{if(Object.values(D.KEYS).includes(e.key))render();});
render();
window.BoluoResearchDossier={refresh:render,summary:()=>D.textSummary(data),snapshot:()=>data};
})();
