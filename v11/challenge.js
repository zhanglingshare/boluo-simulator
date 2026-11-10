/* Boluo V11 / 09 — challenge facts, not people. Public presentation only. */
(function(){
"use strict";
const $=id=>document.getElementById(id);
const q=new URL(location.href).searchParams;
const topics=window.BoluoPublicTopics&&window.BoluoPublicTopics.targets;
const shocks={delay:"project",invest:"project",orders:"orders",traffic:"people"};
const CONFIG={
 project:{
  position:"投资下降，下一棒可能接不上。",
  aTitle:"未来项目可能接续吃紧",
  aIntro:"投资降幅是真实统计现象，但是否影响下轮项目仍需具体核实。",
  aNodes:["投资","建设","产能"],aQuestion:"哪些项目的投产进度受到影响？",
  rivals:[
   {title:"现有产能仍可能支撑增长。",summary:"现有产能的利用率与订单情况，可能解释工业增速为何仍为正。",nodes:["存量","利用率","产出"],question:"现有产能还能支撑多久？"},
   {title:"其他项目可能提前接棒。",summary:"一个项目延期，不代表其他新产线不能补位；需要逐项目确认。",nodes:["替代项目","投产","接续"],question:"哪些项目已经真正投产？"},
   {title:"投资统计期与生产周期可能错开。",summary:"投资与工业产出统计对象和期间不同，不能直接推出未来产能下降。",nodes:["统计期","建设期","产出期"],question:"投资与产出变化是否存在时间错位？"}
  ],
  proof:[
   {id:"progress",name:"项目投产的真实进度",hint:"开工、设备安装、试产、达产"},
   {id:"capacity",name:"存量产能与订单",hint:"开机率、产能利用率、真实订单"},
   {id:"replace",name:"可替代项目的兑现记录",hint:"能否补位及其实际时间"}
  ],
  fallbackMissing:"关键项目开工、设备安装、投产及达产的实际时间"
 },
 orders:{
  position:"工业增长，未必让本地配套受益。",
  aTitle:"总产出增长，不等于本地订单同步增长",
  aIntro:"一个地区工业增加值增长，不能单独证明本地供应商得到了更多采购。",
  aNodes:["工业","采购","本地配套"],aQuestion:"新增订单究竟留在谁手上？",
  rivals:[
   {title:"本地供应商可能已经拿到新订单。",summary:"本地采购比例、订单金额与真实合同可能与公开总量走势不同。",nodes:["新需求","合同","本地供方"],question:"有多少订单来自真实本地采购？"},
   {title:"供应链转移存在时间差。",summary:"产能扩张与配套订单兑现未必同步，需要比较不同季度与企业。",nodes:["产线","认证","配套"],question:"配套认证和交付发生在哪一阶段？"},
   {title:"利润和工资可能在别的环节体现。",summary:"产值、增加值、利润与工资是不同口径，不能简单互相替代。",nodes:["产出","价值链","收入"],question:"本地留存发生在哪个环节？"}
  ],
  proof:[
   {id:"purchase",name:"真实的本地采购合同",hint:"供应商所在地、金额与时间"},
   {id:"customers",name:"配套企业客户结构",hint:"集中度、替代订单、账期"},
   {id:"retention",name:"本地增加值与收入记录",hint:"可比较的利润、工资、采购"}
  ],
  fallbackMissing:"实际本地采购额、配套合同及供应商归属地"
 },
 people:{
  position:"数字增长，未必同步改善居民获得。",
  aTitle:"增长可能还没有传到所有人身上",
  aIntro:"工业产出和居民就业、收入、通勤成本分属不同口径，需要真实数据串起来。",
  aNodes:["产出","岗位","家庭"],aQuestion:"哪些人实际感受到了增长？",
  rivals:[
   {title:"就业机会可能滞后于项目投产。",summary:"部分项目可能先投产、再招工，短期统计尚不足以说明长期结果。",nodes:["投产","招聘","岗位"],question:"岗位什么时候发布并实际到岗？"},
   {title:"通勤与居住条件可能正在改善。",summary:"交通与公共服务的变化，可能改变居民抵达岗位的实际成本。",nodes:["通勤","可达性","就业"],question:"真实通勤时间和成本是否下降？"},
   {title:"收入变化可能没有被同步观察到。",summary:"家庭收入与产业增长的统计时点和口径不同，不能由一种指标代替。",nodes:["企业","薪酬","收入"],question:"工资和就业是否出现可核实的变化？"}
  ],
  proof:[
   {id:"jobs",name:"实际新增岗位与到岗记录",hint:"工种、薪资、招聘周期"},
   {id:"commute",name:"真实通勤时间和成本",hint:"出行调查、用工范围、住房"},
   {id:"income",name:"可比工资和就业数据",hint:"同口径、同期间、可追溯"}
  ],
  fallbackMissing:"企业实际岗位、居民收入与通勤样本"
 },
 agri:{
  position:"农产品卖出去了，价值未必留在本地。",
  aTitle:"销售规模不等于本地增值",
  aIntro:"产量、销售额、加工量、渠道利润和农户结算是不同口径，需要逐环节核对。",
  aNodes:["采收","加工","结算"],aQuestion:"本地加工、品牌和渠道收益分别留在哪里？",
  rivals:[
   {title:"本地加工可能正在提高价值留存。",summary:"加工量、损耗、出厂价和农户收购价可能显示本地增值环节正在形成。",nodes:["原料","加工","增值"],question:"本地加工量和单位增值是否持续提高？"},
   {title:"渠道与账期可能吞噬现金流。",summary:"销售额不等于现金到账，渠道账期、加工垫资和农户结算可能存在错位。",nodes:["发货","账期","回款"],question:"货款实际何时到账，谁在承担垫资？"},
   {title:"产品结构与季节性可能改变表面表现。",summary:"不同等级、采收窗口和销售渠道的价格差异，可能使总量掩盖收益分化。",nodes:["等级","季节","售价"],question:"不同等级产品的价格、损耗和收益如何分布？"}
  ],
  proof:[
   {id:"processing",name:"本地加工量与加工损耗",hint:"原料量、成品量、等级与损耗"},
   {id:"settlement",name:"渠道合同、账期与农户结算",hint:"合同账期、实际回款、垫资和结算日期"},
   {id:"margin",name:"分环节价格与收益记录",hint:"收购价、出厂价、渠道价及各环节成本"}
  ],
  fallbackMissing:"本地加工量、渠道合同账期、加工厂垫资和农户实际结算记录"
 }
};
const storageKey="boluo-v11-challenge-last";
const snapshotKey="boluo-v11-challenge-07";
const allow=(value,choices,fallback)=>choices.includes(value)?value:fallback;
const claimFromFactor={project:"project",capacity:"project",network:"orders",services:"orders",agri:"agri",people:"people"};
const initialClaim=allow(q.get("claim"),Object.keys(CONFIG),claimFromFactor[q.get("factor")]||shocks[q.get("shock")]||"project");
const state={claim:initialClaim,rival:0,evidence:0,proof:"unknown",note:"",falsifier:"",threshold:"",horizon:"未设定",confidence:50};
state.rival=Math.min(2,Math.max(0,Number.parseInt(q.get("rival")||"0",10)||0));
state.evidence=Math.min(2,Math.max(0,Number.parseInt(q.get("evidence")||"0",10)||0));
state.proof=allow(q.get("proof"),["unknown","current","alternative"],"unknown");
const BL={unknown:["关键证据尚未到位","目前证据不足，还不能排除其他解释。继续核实比立即下结论更有价值。"],current:["原判断暂时获得支持","这是你对现有资料的判断，而不是平台自动核验的事实。新的可靠证据仍可能推翻它。"],alternative:["原判断值得重新检查","你认为新证据更符合另一种解释。现在要重新审视条件与结论，不能直接视作真实经济效应。"]};
const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
function validUrl(k){const u=new URL(location.href);const next=new URL("./"+k+".html",u);const passthrough=["shock","strength","buffer","active","bs","bv","n","line","view","bp0","bp1","bp2","bp3","bp4","focus","factor","sv","cut","blind","missing","v08","vname","s08","sname","h08","hname","e08","ename","equestion","edge08"];passthrough.forEach(key=>{if(u.searchParams.has(key))next.searchParams.set(key,u.searchParams.get(key))});return next;}
function currentLink(){const u=validUrl("challenge");u.searchParams.set("claim",state.claim);u.searchParams.set("rival",String(state.rival));u.searchParams.set("evidence",String(state.evidence));u.searchParams.set("proof",state.proof);u.hash="myCard";return u;}
function sync(){try{history.replaceState(null,"",currentLink().pathname+currentLink().search+location.hash)}catch(e){}}
function narrate(){
 const config=CONFIG[state.claim],rival=config.rivals[state.rival],proof=config.proof[state.evidence],verdict=BL[state.proof];
 $("worldATitle").textContent=config.aTitle;$("worldAIntro").textContent=config.aIntro;$("worldAQuestion").textContent=config.aQuestion;
 $("worldBTitle").textContent=rival.title;$("worldBIntro").textContent=rival.summary;$("worldBQuestion").textContent=rival.question;
 config.aNodes.forEach((t,i)=>$("aNode"+(i+1)).textContent=t);
 rival.nodes.forEach((t,i)=>$("bNode"+(i+1)).textContent=t);
 $("verdictTitle").textContent=verdict[0];$("verdictBody").textContent=verdict[1];
 $("cardClaim").textContent=config.position;$("cardRival").textContent=rival.title;$("cardEvidence").textContent=proof.name;$("cardVerdict").textContent=verdict[0];
 $("cardFalsifier").textContent=state.falsifier||"尚未设定反证条件";
 $("cardFalsifierMeta").textContent="阈值："+(state.threshold||"未设定")+" · 期限："+state.horizon+" · 主观确信："+state.confidence+"/100";
 $("falsifierPreview").textContent=state.falsifier||"尚未写下可以推翻原判断的具体条件。";
 $("falsifierMeta").textContent="阈值："+(state.threshold||"未设定")+" · 期限："+state.horizon;
 $("confidenceValue").textContent=state.confidence+" / 100";
 $("cardNote").textContent=state.note;$("cardNote").hidden=!state.note;
 $("cardStamp").textContent=state.proof==="unknown"?"待核实 · 不代表真实结论":"用户自评 · 非平台核验";
 $("arenaMode").textContent="当前比较："+config.aNodes[0]+" vs "+rival.nodes[0]+" · 示意关系";
}
function renderChoices(){
 const config=CONFIG[state.claim];document.querySelectorAll("[data-claim]").forEach(b=>{const active=b.dataset.claim===state.claim;b.classList.toggle("selected",active);b.setAttribute("aria-pressed",String(active));});
 const r=$("rivalChoices");r.replaceChildren();config.rivals.forEach((item,i)=>{
  const b=el("button",i===state.rival?"active":"",""+(i+1).toString().padStart(2,"0")+" · "+item.title);b.type="button";b.dataset.rival=String(i);b.setAttribute("aria-pressed",String(i===state.rival));b.addEventListener("click",()=>{state.rival=i;state.proof="unknown";render(true)});r.append(b);
 });
 const p=$("evidenceOptions");p.replaceChildren();config.proof.forEach((item,i)=>{
  const b=el("button",i===state.evidence?"active":"");b.type="button";b.dataset.evidence=item.id;b.setAttribute("aria-pressed",String(i===state.evidence));
  b.append(el("span","proof-num","0"+(i+1)),el("strong","",item.name),el("small","",item.hint));
  b.addEventListener("click",()=>{state.evidence=i;state.proof="unknown";render(true)});p.append(b);
 });
 document.querySelectorAll("[data-proof]").forEach(b=>{const active=b.dataset.proof===state.proof;b.classList.toggle("active",active);b.setAttribute("aria-pressed",String(active));});
}
function incoming(){
 const focus=q.get("focus"),factor=q.get("factor"),record=topics&&topics[focus]&&topics[focus].factors.find(f=>f.id===factor);
 const customMissing=(q.get("missing")||"").slice(0,240),blind=(q.get("blind")||"").slice(0,80);
 const variableName=(q.get("vname")||"").slice(0,80),signalName=(q.get("sname")||"").slice(0,100),hypothesisName=(q.get("hname")||"").slice(0,100),evidenceName=(q.get("ename")||"").slice(0,100),evidenceQuestion=(q.get("equestion")||"").slice(0,240);
 if(customMissing){
  $("incomingMissing").textContent=[variableName?"变量："+variableName:"",signalName?"信号："+signalName:"",hypothesisName?"原解释："+hypothesisName:"",evidenceName?"待核验证据："+evidenceName:"",customMissing?"具体问题："+customMissing:""].filter(Boolean).join(" ｜ ");
  $("handoffTitle").textContent="已接入第八页的完整研究线索";
  $("handoffDesc").textContent="从第八页带入变量、信号、解释和证据问题。现在要做的不是重复探索，而是寻找能推翻原解释的反证。"+(evidenceQuestion?" 待核验问题："+evidenceQuestion:"");
 }else if(record){
  $("incomingMissing").textContent=record.name+" · "+record.missing;
  $("handoffTitle").textContent="已接入第八页的关注联系："+record.name;
  $("handoffDesc").textContent="先前的关系实验只是条件对照；这里继续挑战它的解释。";
 }else if(q.get("shock")&&shocks[q.get("shock")]){
  $("handoffTitle").textContent="已接入第七页的压力条件";
  $("handoffDesc").textContent="保留压力类型及公开条件。请判断还有哪些可能的解释。";
 }else{$("incomingMissing").textContent=CONFIG[state.claim].fallbackMissing}
 if(blind&&customMissing)$("handoffDesc").textContent+=" 关注编号："+blind+"。";
 $("openPast").href=validUrl(q.get("focus")?"insights":"wind").href;
 $("backToWind").href=validUrl("wind").href;
 $("backToInsights").href=validUrl("insights").href;
}
function showSnapshot(){
 let saved;try{saved=JSON.parse(sessionStorage.getItem(snapshotKey)||"null")}catch(e){saved=null}
 const shock=q.get("shock"),str=q.get("strength");
 if(!shock||!saved||saved.shock!==shock||!saved.base||!saved.stress)return;
 if(str&&Math.abs(Number(str)-Number(saved.strength))>.011)return;
 const data=saved,range=[data.base.p10,data.base.p90,data.stress.p10,data.stress.p90].map(Number);
 if(!range.every(Number.isFinite))return;
 const min=Math.min(...range)-70,max=Math.max(...range)+70,width=Math.max(1,max-min);
 const line=(id,lo,hi)=>{const node=$(id);node.style.left=(100*(lo-min)/width).toFixed(2)+"%";node.style.width=(100*(hi-lo)/width).toFixed(2)+"%"};
 line("baseSpan",data.base.p10,data.base.p90);line("stressSpan",data.stress.p10,data.stress.p90);
 const fmt=n=>Math.round(n).toLocaleString("zh-CN");
 $("baseNumbers").textContent=fmt(data.base.p10)+"—"+fmt(data.base.p90)+" 亿元";
 $("stressNumbers").textContent=fmt(data.stress.p10)+"—"+fmt(data.stress.p90)+" 亿元";
 $("rerunSnapshot").href=validUrl("wind").href;
 $("snapshot").hidden=false;
}
function render(doSync){
 renderChoices();narrate();if(doSync)sync();
}
document.querySelectorAll("[data-claim]").forEach(b=>b.addEventListener("click",()=>{state.claim=b.dataset.claim;state.rival=0;state.evidence=0;state.proof="unknown";state.falsifier="";state.threshold="";state.horizon="未设定";state.confidence=50;$("falsifier").value="";$("falsifierThreshold").value="";$("falsifierHorizon").value="未设定";$("confidence").value=50;render(true);document.querySelector(".arena-section").scrollIntoView({behavior:window.matchMedia("(prefers-reduced-motion:reduce)").matches?"auto":"smooth",block:"start"})}));
document.querySelectorAll("[data-proof]").forEach(b=>b.addEventListener("click",()=>{state.proof=b.dataset.proof;render(true)}));
$("myNote").addEventListener("input",e=>{state.note=e.target.value.slice(0,120);$("noteCount").textContent=state.note.length+" / 120";narrate()});
$("falsifier").addEventListener("input",e=>{state.falsifier=e.target.value.slice(0,180);narrate()});
$("falsifierThreshold").addEventListener("input",e=>{state.threshold=e.target.value.slice(0,100);narrate()});
$("falsifierHorizon").addEventListener("change",e=>{state.horizon=e.target.value;narrate()});
$("confidence").addEventListener("input",e=>{state.confidence=Math.max(0,Math.min(100,Number(e.target.value)||0));narrate()});
let toastTimer=0;function toast(msg){const t=$("toast");t.textContent=msg;t.classList.add("visible");clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove("visible"),3200)}
function judgmentText(){
 const c=CONFIG[state.claim],r=c.rivals[state.rival],ev=c.proof[state.evidence];return "博罗 · 我的判断挑战\n我目前认为："+c.position+"\n另一种可能："+r.title+"\n会改变我判断的证据："+ev.name+"\n证据状态（个人判断）："+BL[state.proof][0]+"\\n反证条件："+(state.falsifier||"尚未设定")+"\\n观察阈值："+(state.threshold||"未设定")+"\\n观察期限："+state.horizon+"\\n主观确信程度："+state.confidence+"/100"+(state.note?"\n我的补充："+state.note:"")+"\n\n公开事实与情景判断不能混同。一起挑战这项判断：\n"+currentLink().href;
}
async function copyText(value){
 try{if(!navigator.clipboard||!navigator.clipboard.writeText)throw Error("unsupported");await navigator.clipboard.writeText(value);toast("已复制判断与复核链接");return}
 catch(e){const input=el("textarea");input.value=value;input.style.cssText="position:fixed;opacity:0;left:-9999px";document.body.append(input);input.select();const ok=document.execCommand("copy");input.remove();toast(ok?"已复制判断与复核链接":"复制受限，请尝试浏览器分享功能")}
}
$("copyChallenge").addEventListener("click",()=>copyText(judgmentText()));
$("saveChallenge").addEventListener("click",()=>{const record={v:2,claim:state.claim,rival:state.rival,evidence:state.evidence,proof:state.proof,note:state.note,falsifier:state.falsifier,threshold:state.threshold,horizon:state.horizon,confidence:state.confidence,url:currentLink().href,at:new Date().toISOString()};try{localStorage.setItem(storageKey,JSON.stringify(record));toast("判断已保存到当前浏览器")}catch(e){toast("本机保存受限，请复制分享文字")}});
$("restoreChallenge").addEventListener("click",()=>{let s;try{s=JSON.parse(localStorage.getItem(storageKey)||"null")}catch(e){}if(!s||!CONFIG[s.claim]){toast("还没有本机保存的判断");return}state.claim=s.claim;state.rival=Math.min(2,Math.max(0,Number(s.rival)||0));state.evidence=Math.min(2,Math.max(0,Number(s.evidence)||0));state.proof=allow(s.proof,["unknown","current","alternative"],"unknown");state.note=String(s.note||"").slice(0,120);state.falsifier=String(s.falsifier||"").slice(0,180);state.threshold=String(s.threshold||"").slice(0,100);state.horizon=allow(s.horizon,["未设定","未来一个季度","未来半年","未来一年","下一轮统计发布","项目下一关键节点"],"未设定");state.confidence=Math.max(0,Math.min(100,Number(s.confidence??50)||0));$("myNote").value=state.note;$("noteCount").textContent=state.note.length+" / 120";$("falsifier").value=state.falsifier;$("falsifierThreshold").value=state.threshold;$("falsifierHorizon").value=state.horizon;$("confidence").value=state.confidence;render(true);toast("已恢复本机判断")});
const cvs=$("exportCanvas"),ctx=cvs.getContext("2d");
function blockText(text,x,y,maxW,lineH,maxLines,font,color){
 ctx.font=font;ctx.fillStyle=color;const chars=Array.from(String(text));let line="",lines=0;
 for(let i=0;i<chars.length;i++){const next=line+chars[i];if(ctx.measureText(next).width>maxW&&line){ctx.fillText(line,x,y+lines*lineH);lines++;line="";if(lines>=maxLines)return y+lines*lineH;}line+=chars[i]}
 if(line){ctx.fillText(line,x,y+lines*lineH);lines++;}return y+lines*lineH;
}
function rounded(x,y,w,h,r,fill){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill()}
function makeImage(){
 if(!ctx){toast("当前浏览器不支持生成图片");return}
 const W=1080,H=1600,c=CONFIG[state.claim],r=c.rivals[state.rival],ev=c.proof[state.evidence];
 const bg=ctx.createLinearGradient(0,0,W,H);bg.addColorStop(0,"#082238");bg.addColorStop(1,"#0e3e4b");ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
 ctx.strokeStyle="rgba(129,232,215,.13)";ctx.lineWidth=2;for(let x=45;x<1120;x+=80){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x-220,H);ctx.stroke()}
 ctx.fillStyle="#8ddedc";ctx.font="700 27px sans-serif";ctx.fillText("BO LUO  /  09  ·  DECISION CHALLENGE",66,110);
 ctx.font="800 66px sans-serif";ctx.fillStyle="#fff";ctx.fillText("你的判断，经得起反驳吗？",66,218);
 ctx.font="500 29px sans-serif";ctx.fillStyle="#a2c9d2";ctx.fillText("一场可以被证据推翻的判断挑战",66,275);
 rounded(55,337,970,1120,28,"#f3f8f8");
 let y=406;ctx.font="700 25px sans-serif";ctx.fillStyle="#2e7881";ctx.fillText("我目前的判断",92,y);
 y=blockText(c.position,92,y+70,870,63,2,"800 46px sans-serif","#153b4b")+38;
 ctx.strokeStyle="#d2e3e5";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(92,y);ctx.lineTo(985,y);ctx.stroke();y+=58;
 ctx.font="700 25px sans-serif";ctx.fillStyle="#267181";ctx.fillText("最强反对意见",92,y);y+=49;
 y=blockText(r.title,92,y,875,43,3,"700 30px sans-serif","#234250")+39;
 ctx.font="700 25px sans-serif";ctx.fillStyle="#267181";ctx.fillText("什么会改变我的判断？",92,y);y+=46;
 y=blockText(ev.name,92,y,870,42,2,"700 31px sans-serif","#234250")+34;
 rounded(90,y,880,77,16,state.proof==="unknown"?"#e8eff0":state.proof==="current"?"#d5f1e8":"#ffe8dc");
 ctx.font="800 30px sans-serif";ctx.fillStyle="#184d59";ctx.fillText(BL[state.proof][0],115,y+49);
 y+=125;ctx.font="700 24px sans-serif";ctx.fillStyle="#267181";ctx.fillText("什么会让我改变判断？",92,y);
 y=blockText(state.falsifier||"尚未设定反证条件",92,y+43,870,34,2,"700 25px sans-serif","#234250")+22;
 ctx.font="500 21px sans-serif";ctx.fillStyle="#527987";ctx.fillText("阈值："+(state.threshold||"未设定")+"  ·  期限："+state.horizon+"  ·  主观确信："+state.confidence+"/100",92,y);
 let footY=1500;
 ctx.strokeStyle="#539a9f";ctx.beginPath();ctx.moveTo(65,footY);ctx.lineTo(1010,footY);ctx.stroke();
 ctx.font="500 25px sans-serif";ctx.fillStyle="#a8d5d3";ctx.fillText("事实 ≠ 条件情景 ≠ 真实因果",68,1550);
 ctx.font="500 23px sans-serif";ctx.fillText("zhanglingshare.github.io/boluo-simulator/v11/challenge.html",68,1588);
 const a=document.createElement("a");a.href=cvs.toDataURL("image/png");a.download="博罗-我的判断挑战.png";document.body.append(a);a.click();a.remove();toast("判断卡图片已生成");
}
$("downloadCard").addEventListener("click",makeImage);
incoming();render(false);showSnapshot();
})();