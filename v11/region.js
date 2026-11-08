/* Boluo V11 page 10. Presentation-only hypotheses; connections are not inferred transactions. */
(function(){
"use strict";
const $=id=>document.getElementById(id),all=s=>Array.from(document.querySelectorAll(s)),q=new URL(location.href).searchParams;
const PLAN="https://epaper.nfnews.com/nfdaily/html/202610/30/content_10184753.html?origin=4",SVG="http://www.w3.org/2000/svg";
const REGIONS={boluo:{name:"博罗县",scope:"县域",d:[10.7,54.6,34.7]},dongguan:{name:"东莞市",scope:"地级市",d:[.3,56.1,43.6]},huicheng:{name:"惠城区",scope:"中心城区",d:[3.4,27.6,69.0]}};
const SECTORS={primary:{n:"第一产业",i:0,question:"农业占比更高，收益就能留在当地吗？",desc:"农业生产结构不能代替加工、流通、品牌和农户收入情况。",missing:"加工收益、回款周期、消费地点"},secondary:{n:"第二产业",i:1,question:"工业占比接近，产业网络就相同吗？",desc:"制造业占比无法证明供应链深度、研发服务、生产效率或实际利润相近。",missing:"采购合同、真实产业链分工、研发和生产性服务"},tertiary:{n:"第三产业",i:2,question:"服务业占比高，服务能力就更强吗？",desc:"产业结构占比与服务质量、真实采购、居民可达性是不同问题。",missing:"服务采购合同、质量与实际使用情况"}};
const N=(id,name,x,y,kind,desc,missing)=>({id,name,x,y,kind,desc,missing});
const E=(a,b,kind,name,desc,missing,source)=>({a,b,kind,name,desc,missing,source});
const LAYERS={
industry:{name:"产业与订单",caption:"产业与订单 · 谁生产，谁拿到订单？",headline:"工业增长以后，订单真正留在哪里？",intro:"从县内制造镇域进入，再看周边地区的候选客户与配套。图中商业关系不代表已发生合同。",tag:"01 / INDUSTRY & ORDERS",missing:"本地采购额、供应商所在地和客户集中度",nodes:[
N("boluo","博罗",486,275,"hub","县域产业观察起点，不是区域经济的地理中心。","企业真实订单"),
N("yuan","石湾·园洲",296,165,"fact","博罗镇域制造主体；属地关系不等于采购网络。","企业间真实采购"),
N("urban","县域主城",685,173,"plan","县域主城是规划的三核之一，项目兑现需要另行核实。","园区投产和城市服务"),
N("dg","东莞",100,130,"external","东莞制造业结构可比，但交易份额未核实。","跨市采购合同"),
N("sz","深圳",872,135,"external","潜在市场与创新协作方向，不代表具体企业合同。","企业订单与研发合同"),
N("hc","惠城",808,431,"external","经济结构不同，互补关系需要合同核实。","服务采购"),
N("supplier","本地配套",260,426,"question","工业增长是否让本地供应商获得订单，公开总量无法证明。","本地采购额"),
N("client","最终客户",485,508,"question","最终市场需要具体销售数据确认。","真实订单及其来源")],
edges:[
E("boluo","yuan","fact","镇域属地","石湾与园洲属于博罗，不表示真实采购关系。","企业合同"),
E("boluo","urban","plan","“三区三核”布局","县域主城属于规划核心，不代表产业或公共服务已完全兑现。","建设与经营进度",PLAN),
E("yuan","dg","question","制造与东莞订单？","这是一条需要核实的商业联系。","跨市采购额"),
E("urban","sz","question","与深圳的创新合作？","具体技术合同不能由区域规划推断。","研发和客户合同"),
E("boluo","supplier","question","本地配套是否受益？","总产出增长不证明供应商订单增加。","企业真实订单"),
E("supplier","client","question","客户与配套联系？","尚无县域完整合同网络。","交易凭证"),
E("urban","hc","question","跨区服务采购？","实际合作方向需真实采购核实。","服务合同"),
E("boluo","dg","plan","融湾协作方向","公开发展方向不等于企业合同已经履行。","合作项目落地",PLAN)]},
people:{name:"人才与通勤",caption:"人才与通勤 · 工作在哪里，生活在哪里？",headline:"产业聚集以后，人真的能留下来吗？",intro:"把岗位、出行和居住分开观察。没有通勤实测就不画出虚构的人流量。",tag:"02 / PEOPLE & COMMUTING",missing:"就业到岗、跨城通勤时间、住房负担和服务使用",nodes:[
N("boluo","博罗",486,275,"hub","观察县域内外的工作与生活联系。","招聘与真实居住数据"),
N("luofu","罗浮未来城",286,172,"plan","规划核心之一，不等于规划人口已经落地。","项目兑现与实际居住"),
N("urban","县域主城",685,173,"plan","城市功能规划需要实测可达性。","学校医疗和交通服务"),
N("dg","东莞",100,135,"external","可能的跨市通勤方向，未取得OD流量。","跨城通勤调查"),
N("hc","惠城",864,135,"external","跨区服务和就业需要真实使用数据。","通勤时间和服务使用"),
N("jobs","新增岗位",262,430,"question","招聘信息不等于实际到岗人数。","企业实招人数"),
N("housing","住房配套",700,430,"question","住房供给与可负担性不同。","租金和实际居住"),
N("route","通勤通道",484,505,"question","道路存在不代表实测通勤更短。","起终点与高峰时耗")],
edges:[
E("boluo","luofu","plan","产城融合规划","罗浮未来城作为规划项目，仍需核验兑现阶段。","落地进度",PLAN),
E("boluo","urban","plan","县域主城规划","规划和现有服务设施分开判断。","真实使用",PLAN),
E("dg","luofu","question","跨城通勤流量？","未实测跨市通勤人数。","通勤样本"),
E("urban","hc","question","中心城区服务辐射？","需要实测使用情况。","实际就医和就业起终点"),
E("boluo","jobs","question","增长变成岗位？","不能从投资数量直接推出实招岗位。","岗位与薪酬"),
E("boluo","housing","question","人口能够住下来？","需要住房可负担与学校配套。","住房与使用数据"),
E("jobs","route","question","岗位通勤可达？","需高峰时段实际通行调查。","通勤时耗"),
E("route","housing","question","住房与工作的连接？","需要可达性和成本证据。","交通成本")]},
services:{name:"生产性服务",caption:"生产性服务 · 制造之外的价值在哪里？",headline:"工厂留下了，设计物流服务留在哪里？",intro:"制造业比重不能直接说明科研、物流和专业服务的实际提供地。",tag:"03 / PRODUCER SERVICES",missing:"研发、物流、设计与检验检测的采购合同及提供地",nodes:[
N("boluo","博罗",486,275,"hub","从本地制造观察专业服务的来源与收益。","服务采购结构"),
N("factories","制造企业",284,176,"fact","制造主体存在不等于所有服务本地化。","企业服务采购"),
N("urban","县域主城",682,167,"plan","规划节点不是服务交易记录。","实际运营",PLAN),
N("dg","东莞",104,136,"external","可能的外部专业服务供给地，尚未核实合同。","实际服务合同"),
N("sz","深圳",865,140,"external","候选创新服务联系。","技术采购"),
N("design","研发设计",265,426,"question","研发实际发生地需要企业数据。","研发服务合同"),
N("logistics","物流检测",703,423,"question","物流检测可能跨区组织。","价格时效与实际来源"),
N("platform","服务平台",482,506,"question","平台建设不等于已经形成服务收入。","运营和订单")],
edges:[
E("boluo","urban","plan","空间服务配套方向","规划功能不表示实际兑现。","运营进度",PLAN),
E("boluo","factories","fact","县域制造主体","此线仅表示县域制造主体观察，不是采购合同。","个体企业资料"),
E("factories","dg","question","跨区专业服务？","需要真实合同证实。","专业服务采购"),
E("urban","sz","question","创新合作？","需要项目合同而不是空间距离。","研发合同"),
E("factories","design","question","设计发生在哪？","研发职能未核实。","设计服务合同"),
E("factories","logistics","question","物流检测供给？","实际成本和服务来源未知。","物流合同"),
E("boluo","platform","question","平台是否被使用？","建设平台不同于实际业务形成。","真实交易"),
E("platform","logistics","question","本地能否替代？","替代能力需要成本、质量验证。","服务比较")]},
rural:{name:"农业与消费",caption:"农业与消费 · 产出与客流的钱留在哪？",headline:"农品与游客更多，谁得到更多收益？",intro:"区分生产、加工、游客、商户与渠道的不同收入，而不是把客流量当成利润。",tag:"04 / AGRICULTURE & CONSUMPTION",missing:"渠道回款、游客停留、实际消费地点与加工收益",nodes:[
N("boluo","博罗",486,275,"hub","农业、文旅和消费需要分环节看收入。","农户与企业回款"),
N("baitang","柏塘",285,169,"fact","柏塘属博罗；实际山茶交易结构未由属地关系测得。","茶叶回款与加工收益"),
N("east","博东新城",697,171,"plan","博东新城是规划核心之一。","运营结果",PLAN),
N("dg","东莞",100,134,"external","客流来源方向待核实。","游客来源地"),
N("sz","深圳",871,134,"external","客源联系需真实调查。","游客消费来源"),
N("process","加工品牌",260,425,"question","加工可能增加收益，也可能增加成本。","加工利润和合同"),
N("shops","本地经营",698,425,"question","客流不等于实际商户实收。","经营收入"),
N("tourists","游客消费",484,502,"question","游客人数、过夜率和本地消费不同。","调查消费额")],
edges:[
E("boluo","baitang","fact","县域镇街属地","柏塘属于博罗，不代表茶叶采购关系。","交易合同"),
E("boluo","east","plan","博东新城规划","城乡三产融合属于规划方向。","真实项目运营",PLAN),
E("baitang","process","question","加工增值？","茶叶加工的实际收益未核实。","茶农加工厂回款"),
E("east","shops","question","消费留在本地？","客流增长未必改善经营收入。","实收与毛利"),
E("dg","tourists","question","游客来源？","无来源地实测。","游客调查"),
E("sz","tourists","question","跨城客流？","尚待调查。","游客来源"),
E("tourists","shops","question","消费在哪里发生？","人数不是营业收入。","消费问卷"),
E("process","shops","question","渠道收益？","渠道分配待核实。","加工与商户合同")]}
};
const TRADE={
factories:{label:"工厂更多了",short:"工厂与订单",symbol:"▥",claim:"工厂更多，未必让本地配套更强。",up:"生产项目可能增加配套机会",upDesc:"制造新增需求有机会给本地企业创造业务。",down:"订单也可能继续在县外完成",downDesc:"外部采购并非天然不好，应比较成本、效率与韧性。",evidence:"企业真实采购合同、供应商所在地与配套收入",question:"工业增长以后，本地配套得到多少真实订单？",why:"工业总量无法证明县域供应商实际获得了多少业务。",challenge:"orders"},
people:{label:"项目更多了",short:"工作与生活",symbol:"⌂",claim:"项目更多，生活承载未必同步。",up:"项目可能形成更多岗位",upDesc:"新企业带来就业与城市服务需求。",down:"工作与居住可能存在时间差",downDesc:"投资计划不等于已投产，更不等于人已到岗。",evidence:"项目投产节点、真实岗位、通勤成本与住房使用",question:"产业聚集后，工作与生活配套能否真正接上？",why:"项目、岗位与居民获得需要分开核验。",challenge:"people"},
tourism:{label:"游客更多了",short:"城市与乡村",symbol:"♧",claim:"游客更多，未必等于收益更多。",up:"旅游与农品消费可能带来需求",upDesc:"餐饮、住宿、加工和农户可能得到更多机会。",down:"低停留和渠道分配可能改变留存",downDesc:"客流量不是人均消费、利润或实际回款。",evidence:"游客来源、过夜消费、加工利润及渠道账期",question:"游客和农产品增长，收益到底在哪一环留下？",why:"客流规模无法代替本地经营和农户收入。",challenge:"orders"},
cooperation:{label:"合作更多了",short:"博罗与大湾区",symbol:"◇",claim:"跨区域联系更多，不一定更强或更弱。",up:"外部市场与技术可能提高效率",upDesc:"开放的区域分工有时比所有环节本地化更划算。",down:"单一依赖也可能增加脆弱性",downDesc:"需要核验真实依赖和可替代渠道，而不是统计连线数量。",evidence:"跨城采购、客户集中度和替代服务成本",question:"哪些外部联系值得加强，哪些依赖需要备选方案？",why:"跨区域协作应比较真实收益、成本和韧性。",challenge:"orders"}
};
const state={region:REGIONS[q.get("area")]?q.get("area"):"boluo",sector:SECTORS[q.get("sector")]?q.get("sector"):"secondary",layer:LAYERS[q.get("layer")]?q.get("layer"):"industry",filter:"all",focus:{kind:"node",id:"boluo"},topic:TRADE[q.get("topic")]?q.get("topic"):"factories",paused:matchMedia("(prefers-reduced-motion: reduce)").matches};
const create=(tag,cl,txt)=>{const n=document.createElement(tag);if(cl)n.className=cl;if(txt!==undefined)n.textContent=txt;return n;};
const svg=(tag,props)=>{const n=document.createElementNS(SVG,tag);Object.entries(props||{}).forEach(([k,v])=>n.setAttribute(k,String(v)));return n;};
function shareURL(){const url=new URL(location.href);Object.entries({area:state.region,sector:state.sector,layer:state.layer,topic:state.topic}).forEach(([k,v])=>url.searchParams.set(k,v));url.hash="finalQuestion";return url.href}
function sync(){try{const u=new URL(shareURL());history.replaceState(null,"",u.pathname+u.search+location.hash)}catch(e){}}
function toast(message){$("toast").textContent=message;$("toast").classList.add("visible");clearTimeout(toast.timer);toast.timer=setTimeout(()=>$("toast").classList.remove("visible"),2800)}
function renderCompare(){
 const list=$("regionRows");list.replaceChildren();const sector=SECTORS[state.sector];
 Object.entries(REGIONS).forEach(([id,r])=>{
  const b=create("button","region-row"+(id===state.region?" active":""));b.type="button";b.dataset.region=id;b.setAttribute("aria-pressed",String(id===state.region));
  const top=create("div","region-row-top");top.append(create("span","region-row-name",r.name),create("small","",r.scope));const bar=create("div","stack");
  ["primary","secondary","tertiary"].forEach((key,i)=>{const el=create("i","seg-"+key+(key===state.sector?" highlight":" muted"));el.style.width=r.d[i]+"%";bar.append(el)});
  const summary=create("div","region-summary");["第一产业","第二产业","第三产业"].forEach((label,i)=>summary.append(create("span","",label+" "+r.d[i].toFixed(1)+"%")));
  b.append(top,bar,summary);b.addEventListener("click",()=>{state.region=id;renderCompare();sync()});list.append(b);
 });
 all("[data-sector]").forEach(b=>{const a=b.dataset.sector===state.sector;b.classList.toggle("active",a);b.setAttribute("aria-pressed",String(a))});
 const r=REGIONS[state.region],v=r.d[sector.i];$("compareSelected").textContent=r.name+" · "+sector.n;
 $("compareValue").replaceChildren(document.createTextNode(v.toFixed(1)),create("small","","%"));$("compareFill").style.width=v+"%";$("compareQuestion").textContent=sector.question;$("compareText").textContent=sector.desc;$("compareMissing").textContent=sector.missing;
}
all("[data-sector]").forEach(b=>b.addEventListener("click",()=>{state.sector=b.dataset.sector;renderCompare();sync()}));
const labels={hub:"观察起点",external:"区域主体",fact:"公开事实",plan:"规划方向",question:"尚待核实"};
function currentItem(){
 const l=LAYERS[state.layer];if(state.focus.kind==="edge"&&l.edges[state.focus.index]){const ed=l.edges[state.focus.index];return {name:ed.name,kind:ed.kind,desc:ed.desc,missing:ed.missing,source:ed.source}}
 return l.nodes.find(n=>n.id===state.focus.id)||l.nodes[0];
}
function renderDetail(){
 const l=LAYERS[state.layer],v=currentItem();$("lensTag").textContent=l.tag;$("lensTitle").textContent=l.headline;$("lensIntro").textContent=l.intro;$("focusName").textContent=v.name;$("focusDesc").textContent=v.desc;$("focusMissing").textContent=v.missing;$("evidenceBadge").textContent=labels[v.kind]||"观察对象";const link=$("focusLink");link.href=v.source||"./relations.html";link.textContent=v.source?"查看公开规划资料 ↗":"进入第四页继续核验联系 ↗";if(v.source){link.target="_blank";link.rel="noopener noreferrer"}else{link.removeAttribute("target");link.removeAttribute("rel")};
}
function tracePath(a,b,i){const dx=b.x-a.x,dy=b.y-a.y,dist=Math.hypot(dx,dy)||1,curve=(i%3-1)*21+(i%2?12:-12),cx=(a.x+b.x)/2-curve*dy/dist,cy=(a.y+b.y)/2+curve*dx/dist;return "M"+a.x+","+a.y+" Q"+cx.toFixed(1)+","+cy.toFixed(1)+" "+b.x+","+b.y}
function renderGraph(){
 const l=LAYERS[state.layer],p=Object.fromEntries(l.nodes.map(n=>[n.id,n])),eg=$("graphEdges"),pg=$("graphParticles"),ng=$("graphNodes");
 eg.replaceChildren();pg.replaceChildren();ng.replaceChildren();
 l.edges.forEach((edge,i)=>{
  const path=tracePath(p[edge.a],p[edge.b],i),show=state.filter==="all"||edge.kind===state.filter;
  const chosen=state.focus.kind==="edge"&&state.focus.index===i;
  const line=svg("path",{d:path,class:"graph-edge "+edge.kind+(!show?" dim":"")+(chosen?" is-selected":""),role:"button","aria-label":edge.name+"，"+labels[edge.kind],tabindex:0});
  const hit=svg("path",{d:path,class:"graph-hit",role:"button","aria-label":"查看"+edge.name,tabindex:0});
  if(!show){hit.style.pointerEvents="none";line.setAttribute("aria-hidden","true");hit.removeAttribute("tabindex");line.removeAttribute("tabindex")}
  const choose=()=>{state.focus={kind:"edge",index:i};renderDetail();renderGraph()};
  for(const a of [line,hit]){a.addEventListener("click",choose);a.addEventListener("keydown",ev=>{if(ev.key==="Enter"||ev.key===" "){ev.preventDefault();choose()}})}
  eg.append(line,hit);
  if(show&&!state.paused){const dot=svg("circle",{r:edge.kind==="question"?3:4,class:"graph-particle"+(edge.kind==="question"?" question":"")});dot.append(svg("animateMotion",{dur:(3+(i%4)*.8).toFixed(1)+"s",repeatCount:"indefinite",path,begin:"-"+(i*.3).toFixed(2)+"s"}));pg.append(dot)}
 });
 l.nodes.forEach(n=>{
  const inView=l.edges.some(ed=>(ed.a===n.id||ed.b===n.id)&&(state.filter==="all"||ed.kind===state.filter));
  const current=state.focus.kind==="node"&&state.focus.id===n.id;
  const g=svg("g",{class:"graph-node "+n.kind+(!inView?" dim":"")+(current?" active":""),tabindex:0,role:"button","aria-label":n.name+"，"+labels[n.kind]});
  const title=svg("title");title.textContent=n.desc;
  const circle=svg("circle",{cx:n.x,cy:n.y,r:n.kind==="hub"?51:n.name.length>=5?36:31});
  const tx=svg("text",{x:n.x,y:n.y+5,"text-anchor":"middle"});tx.textContent=n.name;
  const choose=()=>{state.focus={kind:"node",id:n.id};renderDetail();renderGraph()};
  g.addEventListener("click",choose);g.addEventListener("keydown",ev=>{if(ev.key==="Enter"||ev.key===" "){ev.preventDefault();choose()}});
  g.append(title,circle,tx);ng.append(g);
 });
 $("networkCaption").textContent=l.caption;$("playNetwork").textContent=state.paused?"▶ 播放动画":"Ⅱ 暂停动画";$("playNetwork").setAttribute("aria-pressed",String(!state.paused));
 all("[data-layer]").forEach(b=>{const active=b.dataset.layer===state.layer;b.classList.toggle("active",active);b.setAttribute("aria-pressed",String(active))});
 all("[data-filter]").forEach(b=>{const active=b.dataset.filter===state.filter;b.classList.toggle("active",active);b.setAttribute("aria-pressed",String(active))});
}
all("[data-layer]").forEach(b=>b.addEventListener("click",()=>{state.layer=b.dataset.layer;state.focus={kind:"node",id:"boluo"};state.filter="all";renderGraph();renderDetail();sync()}));
all("[data-filter]").forEach(b=>b.addEventListener("click",()=>{state.filter=b.dataset.filter;renderGraph()}));
$("playNetwork").addEventListener("click",()=>{state.paused=!state.paused;renderGraph()});
function renderTrade(){
 const out=$("tradeoffCards");out.replaceChildren();
 Object.entries(TRADE).forEach(([key,t],i)=>{
  const b=create("button","trade-card"+(state.topic===key?" active":""));b.type="button";b.dataset.trade=key;b.setAttribute("aria-pressed",String(key===state.topic));
  b.append(create("span","index","0"+(i+1)+" / "+t.label),create("span","symbol",t.symbol),create("strong","",t.claim),create("span","",t.short+" · 点击展开"));
  b.addEventListener("click",()=>{state.topic=key;renderTrade();renderQuestion();sync()});out.append(b)
 });
 const t=TRADE[state.topic];$("tradeoffIndex").textContent=t.label;$("upsideTitle").textContent=t.up;$("upsideText").textContent=t.upDesc;$("downsideTitle").textContent=t.down;$("downsideText").textContent=t.downDesc;$("tradeoffEvidence").textContent=t.evidence;$("tradeoffNext").href="./challenge.html?claim="+t.challenge;
}
function renderQuestion(){
 const out=$("questionPicker");out.replaceChildren();
 Object.entries(TRADE).forEach(([key,t])=>{const b=create("button",state.topic===key?"active":"",t.short);b.type="button";b.dataset.topic=key;b.setAttribute("aria-pressed",String(state.topic===key));b.addEventListener("click",()=>{state.topic=key;renderTrade();renderQuestion();sync()});out.append(b)});
 const t=TRADE[state.topic];$("chosenQuestion").textContent=t.question;$("chosenWhy").textContent=t.why;$("chosenEvidence").textContent=t.evidence;$("questionToNine").href="./challenge.html?claim="+t.challenge;
}
function shareText(){const t=TRADE[state.topic];return "博罗 V11｜区域联系观察\n我想追问："+t.question+"\n为什么值得核实："+t.why+"\n可能改变判断的资料："+t.evidence+"\n\n这是待核实问题，不是政策结论或预测。\n"+shareURL()}
async function copyText(text){
 try{await navigator.clipboard.writeText(text);toast("已复制问题与复现链接")}catch(_){const ta=document.createElement("textarea");ta.value=text;ta.style.cssText="position:fixed;left:-9999px;opacity:0";document.body.append(ta);ta.select();const ok=document.execCommand("copy");ta.remove();toast(ok?"已复制问题与复现链接":"复制受限，请使用浏览器分享")}
}
$("copyQuestion").addEventListener("click",()=>copyText(shareText()));
$("saveQuestion").addEventListener("click",()=>{try{localStorage.setItem("boluo-v11-region-focus",JSON.stringify({topic:state.topic,layer:state.layer,date:new Date().toISOString()}));toast("已在本机保存关注的问题")}catch(_){toast("保存受限，可复制问题链接")}});
function rounded(ctx,x,y,w,h,r,color){ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill()}
function split(ctx,text,x,y,maxWidth,lh,maxLines,font,color){
 ctx.font=font;ctx.fillStyle=color;let line="",rows=0;
 for(const ch of Array.from(text)){if(ctx.measureText(line+ch).width>maxWidth&&line){ctx.fillText(line,x,y+rows*lh);rows++;line="";if(rows>=maxLines)return y+rows*lh}line+=ch}
 if(line){ctx.fillText(line,x,y+rows*lh);rows++}return y+rows*lh
}
function exportImage(){
 const cv=$("shareCanvas"),ctx=cv.getContext("2d");if(!ctx){toast("不支持图片导出");return}
 const t=TRADE[state.topic],g=ctx.createLinearGradient(0,0,1080,1350);g.addColorStop(0,"#081b2b");g.addColorStop(1,"#164c5c");ctx.fillStyle=g;ctx.fillRect(0,0,1080,1350);
 ctx.strokeStyle="#70d4d41e";for(let x=0;x<1300;x+=84){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x-255,1350);ctx.stroke()}
 ctx.font="850 27px sans-serif";ctx.fillStyle="#a3e9df";ctx.fillText("BO LUO  /  V11  ·  REGIONAL CONNECTIONS",65,109);
 ctx.font="900 63px sans-serif";ctx.fillStyle="#f4ffff";ctx.fillText("不只看增长多少",65,222);ctx.fillStyle="#ffcca0";ctx.fillText("还要看怎样连接",65,299);
 rounded(ctx,55,355,970,787,30,"#f0faf8");
 ctx.font="850 28px sans-serif";ctx.fillStyle="#357b85";ctx.fillText("我想继续追问",92,428);
 let y=split(ctx,t.question,91,519,866,67,4,"850 46px sans-serif","#174051")+33;
 ctx.strokeStyle="#d0e2e0";ctx.beginPath();ctx.moveTo(91,y);ctx.lineTo(987,y);ctx.stroke();y+=59;
 ctx.font="850 26px sans-serif";ctx.fillStyle="#327c88";ctx.fillText("为什么值得核实",91,y);y+=55;
 y=split(ctx,t.why,91,y,872,47,4,"500 29px sans-serif","#365b6a")+40;
 ctx.font="850 26px sans-serif";ctx.fillStyle="#327c88";ctx.fillText("可能改变判断的资料",91,y);y+=54;
 y=split(ctx,t.evidence,91,y,870,49,4,"720 30px sans-serif","#285566")+29;
 if(y<1070){rounded(ctx,90,y,885,53,12,"#dff3ed");ctx.font="800 23px sans-serif";ctx.fillStyle="#215e69";ctx.fillText("区分事实、规划与待核实联系",110,y+34)}
 ctx.font="500 23px sans-serif";ctx.fillStyle="#a0d5d7";ctx.fillText("不是排名 · 不是政策预测 · 不是已证实的企业交易网络",66,1220);ctx.fillText("zhanglingshare.github.io/boluo-simulator/v11/region.html",66,1290);
 const a=document.createElement("a");a.href=cv.toDataURL("image/png");a.download="博罗-区域联系观察.png";document.body.append(a);a.click();a.remove();toast("区域观察卡已生成")
}
$("downloadQuestion").addEventListener("click",exportImage);
if(!q.has("topic")){try{const s=JSON.parse(localStorage.getItem("boluo-v11-region-focus")||"null");if(s&&TRADE[s.topic])state.topic=s.topic}catch(_){}}
renderCompare();renderGraph();renderDetail();renderTrade();renderQuestion();
})();