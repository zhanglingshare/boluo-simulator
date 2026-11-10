/* Boluo V11 Page 12. Interactive two-world structural experiment.
   Network animation and numeric outputs are controlled teaching scenarios, not observations. */
(function(){
"use strict";
const C=window.BoluoFutureCore,$=id=>document.getElementById(id),all=q=>Array.from(document.querySelectorAll(q)),SVG="http://www.w3.org/2000/svg";
if(!C){document.body.dataset.futureError="model-unavailable";return;}
const qp=new URLSearchParams(location.search),defaults={scene:"manufacturing",link:"m-supply",mode:"strengthen",intensity:65,year:2028};
let state=C.validate({...defaults,...Object.fromEntries(qp)}),mobileWorld="B",playing=null,toastTimeout=null;
const MODES={strengthen:"加强",weaken:"削弱",cut:"断开",add:"新增"};
const TITLES={local:"本地环节可达",connection:"结构连接密度",resilience:"替代路径韧性",coordination:"协作负担提示"};
const SUBS={local:"关键环节相互可达的演示尺度",connection:"不同主体之间的可达程度",resilience:"存在可替代路径的演示指数",coordination:"关系协调复杂性的提示指数"};
const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
const svg=(tag,attrs,text)=>{const n=document.createElementNS(SVG,tag);for(const [k,v] of Object.entries(attrs||{}))n.setAttribute(k,String(v));if(text!==undefined)n.textContent=text;return n;};
const round=n=>Number(n).toFixed(1),fmtDelta=n=>(n>0?"+":"")+round(n);
const clearPlaying=()=>{if(playing!==null){clearInterval(playing);playing=null;}const p=$("playTime");p.textContent="▶ 播放";p.setAttribute("aria-pressed","false")};
function toast(msg){const n=$("toast");n.textContent=msg;n.classList.add("visible");clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>n.classList.remove("visible"),3100);}
function persistUrl(){const u=new URL(location.href),p=new URLSearchParams(C.shareQuery(state));for(const key of ["scene","link","mode","intensity","year"])u.searchParams.set(key,p.get(key));history.replaceState(null,"",u.pathname+u.search+u.hash);}
function setState(v){state=C.validate({...state,...v});persistUrl();render();}
function changeScene(key){clearPlaying();const s=C.SCENES[key];if(!s)return;const c=s.candidates[0];setState({scene:key,link:c.id,mode:"strengthen",intensity:65,year:2028});}
function chooseLink(id){clearPlaying();const s=C.SCENES[state.scene],c=s.candidates.find(x=>x.id===id);if(!c)return;const baseline=s.edges.some(e=>e.id===id);setState({link:id,mode:baseline?"strengthen":"add"});}
function renderChooser(){
 all("[data-scene]").forEach(b=>{const active=b.dataset.scene===state.scene;b.classList.toggle("active",active);b.setAttribute("aria-pressed",String(active))});
 const s=C.SCENES[state.scene];$("sceneQuestion").textContent=s.question;
 const list=$("linkOptions");list.replaceChildren();
 s.candidates.forEach((c,i)=>{
  const b=el("button","link-choice"+(c.id===state.link?" active":""));b.type="button";b.dataset.link=c.id;
  b.setAttribute("aria-pressed",String(c.id===state.link));
  b.append(el("span","link-choice-idx",String(i+1).padStart(2,"0")),el("span","",c.title));
  b.addEventListener("click",()=>chooseLink(c.id));list.append(b);
 });
 const modes=$("modeOptions");modes.replaceChildren();const selected=C.getCandidate(state),has=s.edges.some(e=>e.id===selected.id);
 (has?["strengthen","weaken","cut"]:["add"]).forEach(k=>{
  const b=el("button",k===state.mode?"active":"",MODES[k]);b.type="button";b.dataset.mode=k;b.setAttribute("aria-pressed",String(k===state.mode));
  b.addEventListener("click",()=>{clearPlaying();setState({mode:k})});modes.append(b);
 });
 $("intensityRange").value=state.intensity;$("intensityValue").textContent=state.intensity+"%";
}
function curve(a,b,ix){
 const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||1;
 const bend=(ix%3-1)*24+(ix%2?12:-12);
 const x=(a.x+b.x)/2-bend*dy/d,y=(a.y+b.y)/2+bend*dx/d;
 return "M"+a.x+","+a.y+" Q"+x+","+y+" "+b.x+","+b.y;
}
function graph(containerId,edges,isFuture){
 const s=C.SCENES[state.scene],root=$(containerId),nodes=new Map(s.nodes.map(n=>[n.id,n]));root.replaceChildren();
 const bg=svg("g",{"aria-hidden":"true"});
 [180,340,510].forEach(y=>bg.append(svg("line",{x1:22,y1:y,x2:980,y2:y,stroke:"#82a7bd","stroke-opacity":".07","stroke-dasharray":"4 18"})));
 [230,505,770].forEach(x=>bg.append(svg("line",{x1:x,y1:17,x2:x,y2:510,stroke:"#82a7bd","stroke-opacity":".07","stroke-dasharray":"4 18"})));
 root.append(bg);
 const layer=svg("g",{"class":"edges"});
 edges.forEach((e,i)=>{
  const a=nodes.get(e.a),b=nodes.get(e.b),path=curve(a,b,i),isSelected=e.id===state.link;
  if(e.w<=.001&&!isSelected)return;
  const line=svg("path",{d:path,"class":"network-edge"+(e.w<=.02?" dim":"")+(isFuture&&isSelected?(state.mode==="cut"&&e.w<.18?" cut":" hot"):""),"stroke-opacity":e.w<=.02?".15":String(.3+.5*e.w)});
  layer.append(line);
  if(isFuture&&isSelected&&e.w>.055&&state.year>2026)layer.append(svg("path",{d:path,"class":"network-edge-pulse"}));
  const hit=svg("path",{d:path,"class":"network-hit",tabindex:"0",role:"button","aria-label":"选择关系："+e.label,"data-link":e.id});
  const selectedCandidate=s.candidates.some(c=>c.id===e.id);
  if(selectedCandidate){
   hit.addEventListener("click",()=>chooseLink(e.id));
   hit.addEventListener("keydown",ev=>{if(ev.key==="Enter"||ev.key===" "){ev.preventDefault();chooseLink(e.id);}});
  }else{hit.setAttribute("tabindex","-1");hit.setAttribute("aria-hidden","true");}
  layer.append(hit);
 });
 root.append(layer);
 const group=svg("g",{"class":"nodes"});
 s.nodes.forEach((n,i)=>{
  const connected=edges.some(e=>e.id===state.link&&e.w>.05&&(e.a===n.id||e.b===n.id));
  const g=svg("g",{"class":"network-node"+(n.id===s.origin?" core":"")+(n.kind==="external"?" external":"")+(isFuture&&connected?" affected":"")});
  g.append(svg("circle",{cx:n.x,cy:n.y,r:57,"class":"network-node-halo"}));
  g.append(svg("circle",{cx:n.x,cy:n.y,r:38,"class":"network-node-ring"}));
  g.append(svg("text",{x:n.x,y:n.y+10,"font-size":32},String(i+1).padStart(2,"0")));
  g.append(svg("text",{x:n.x,y:n.y+73,"class":"node-meta"},n.label));
  group.append(g);
 });
 root.append(group);
}
function renderWorldTabs(){
 const mobile=window.matchMedia("(max-width:700px)").matches;
 $("worldCardA").classList.toggle("is-visible",!mobile||mobileWorld==="A");
 $("worldCardB").classList.toggle("is-visible",!mobile||mobileWorld==="B");
 for(const [id,key] of [["worldTabA","A"],["worldTabB","B"]]){const on=key===mobileWorld;$(id).classList.toggle("active",on);$(id).setAttribute("aria-pressed",String(on))}
}
function renderWorld(r){
 graph("networkA",r.baseEdges,false);graph("networkB",r.edges,true);
 const a=r.baseEdges.filter(e=>e.w>.03).length,b=r.edges.filter(e=>e.w>.03).length;
 $("edgeCountA").textContent=a+" 条示意关系";$("edgeCountB").textContent=b+" 条示意关系";
 $("worldBTitle").textContent=MODES[state.mode]+" · "+r.link.title;
 $("worldBDiff").textContent=r.linkChange>0?"一条关系在演示中增强":r.linkChange<0?"一条关系在演示中减弱":"尚未产生结构差异";
 renderWorldTabs();
}
function renderChange(r){
 $("linkChange").textContent=fmtDelta(r.linkChange);
 $("linkChange").style.color=r.linkChange>=0?"#a6efda":"#ffbc92";
 $("linkDescription").textContent="仅表示假设联系在模型中变化 "+fmtDelta(r.linkChange)+" 个百分点。不是实际交易份额。";
 $("impactSource").textContent=r.source;$("impactTarget").textContent=r.target;
 $("impactResult").textContent="这条连接改变以后，其他节点可能通过网络传导受到影响；未核验实际业务、收入与就业效果。";
 $("opportunity").textContent=state.mode==="cut"||state.mode==="weaken"?"减少依赖或关系协调，可能腾出其他替代机会。":r.link.benefit;
 $("tradeoff").textContent=state.mode==="cut"||state.mode==="weaken"?"弱化或断开联系也可能丢掉已有合作、降低可达性。":r.link.tradeoff;
 $("evidenceGap").textContent=r.link.gap;
}
function renderMetrics(r){
 const root=$("metricsGrid");root.replaceChildren();
 for(const k of ["local","connection","resilience","coordination"]){
  const card=el("article","metric-card");const delta=r.delta[k],bad=k==="coordination"?delta>0:delta<0;
  card.append(el("small","",TITLES[k]));
  const head=el("div","metric-head");head.append(el("strong","",round(r.future[k])),el("span",bad?"negative":"",fmtDelta(delta)+" 对比 A"));card.append(head);
  const bars=el("div","metric-bars");
  [["A",r.base[k],"a"],["B",r.future[k],"b"]].forEach(([label,value,cls])=>{
   const line=el("div");line.append(el("label","",label));const track=el("div","metric-track"),inner=el("i",cls);inner.style.width=value+"%";track.append(inner);line.append(track);bars.append(line);
  });
  card.append(bars,el("div","metric-foot",SUBS[k]));root.append(card);
 }
}
function renderTrend(){
 const root=$("trendChart"),key="local",a=C.simulate({...state,year:2026}).base[key],years=[2026,2027,2028,2029,2030];
 const values=years.map(y=>C.simulate({...state,year:y}).future[key]);
 let lo=Math.min(a,...values),hi=Math.max(a,...values),pad=Math.max((hi-lo)*.36,3);
 lo=Math.max(0,lo-pad);hi=Math.min(100,hi+pad);
 if(hi-lo<8){lo=Math.max(0,lo-4);hi=Math.min(100,hi+4);}
 const x=(i)=>70+i*180,y=v=>211-(v-lo)/Math.max(.01,hi-lo)*165;
 root.replaceChildren();
 for(let i=0;i<5;i++){
  const xx=x(i),grid=svg("line",{x1:xx,y1:22,x2:xx,y2:213,"class":"chart-grid"});root.append(grid);
  root.append(svg("text",{x:xx,y:243,"text-anchor":"middle","class":"chart-label"},years[i]));
 }
 [lo,(lo+hi)/2,hi].forEach(v=>{root.append(svg("line",{x1:52,y1:y(v),x2:806,y2:y(v),"class":"chart-grid"}));root.append(svg("text",{x:40,y:y(v)+5,"text-anchor":"end","class":"chart-label"},String(Math.round(v))));});
 const baseline=years.map((_,i)=>x(i)+","+y(a)).join(" "),future=values.map((v,i)=>x(i)+","+y(v)).join(" ");
 root.append(svg("polyline",{points:baseline,"class":"chart-line-a"}));
 root.append(svg("polyline",{points:future,"class":"chart-line-b"}));
 values.forEach((v,i)=>root.append(svg("circle",{cx:x(i),cy:y(v),r:6,"class":"chart-spot"})));
 const idx=state.year-2026;
 root.append(svg("line",{x1:x(idx),y1:22,x2:x(idx),y2:212,stroke:"#fbc194","stroke-width":2,"stroke-dasharray":"5 7"}));
 root.setAttribute("aria-label","2026—2030的结构演示轨迹。原结构指数 "+round(a)+"，改造结构在2030年为 "+round(values[4])+"。这是内部演示指数，不是GDP曲线。");
}
function renderTime(){
 $("yearRange").value=state.year;$("yearValue").textContent=String(state.year);
 $("stageLabel").textContent=state.year===2026?"基准起点":state.year===2030?"结构调整已展开":"演示传播中";
}
function render(){
 const r=C.simulate(state);renderChooser();renderWorld(r);renderChange(r);renderMetrics(r);renderTrend();renderTime();
}
function readHistory(){
 try{const parsed=JSON.parse(localStorage.getItem(C.STORE_KEY)||"[]");return Array.isArray(parsed)?parsed.slice(0,15).map(C.cleanSnapshot).filter(Boolean):[];}catch(e){return [];}
}
function renderHistory(){
 const data=readHistory(),root=$("historyList");root.replaceChildren();$("saveCount").textContent=data.length+" 条";
 if(!data.length){root.append(el("p","","尚未保存任何未来方案。"));return;}
 data.slice(0,5).forEach(item=>{
  const s=C.SCENES[item.scene],b=el("button","history-entry");
  const name=el("strong","",s.short+" · "+item.summary),small=el("small","",item.year+"年 / "+MODES[item.mode]+" / "+item.intensity+"%"),arr=el("i","","重新打开 ↗");
  b.append(name,small,arr);b.addEventListener("click",()=>{clearPlaying();state=C.validate(item);persistUrl();render();toast("已恢复历史方案条件");document.getElementById("lab").scrollIntoView({behavior:"smooth"});});root.append(b);
 });
}
function save(){
 if(state.intensity<5||state.year===2026){toast("请设置非零调整强度，并把年份移到2027—2030。");return;}
 const record=C.snapshot(state),data=readHistory().filter(x=>!(x.scene===record.scene&&x.link===record.link&&x.mode===record.mode&&x.intensity===record.intensity&&x.year===record.year));
 data.unshift(record);
 try{localStorage.setItem(C.STORE_KEY,JSON.stringify(data.slice(0,12)));renderHistory();toast("已保存方案。第11页可读取并复核此条件实验。");}
 catch(e){toast("本机存储不可用。可以尝试导出方案JSON。");}
}
async function copyLink(){
 const url=new URL("./future.html",location.href);url.search="?"+C.shareQuery(state);url.hash="lab";
 try{await navigator.clipboard.writeText(url.href);toast("已复制可复现实验链接（只包含条件，不包含个人资料）。");}
 catch(e){const area=el("textarea");area.value=url.href;area.style.cssText="position:fixed;left:-9999px;opacity:0";document.body.append(area);area.select();const ok=document.execCommand("copy");area.remove();toast(ok?"已复制实验链接":"复制受限，可直接使用浏览器地址栏");}
}
function exportCurrent(){
 const payload={format:"boluo-v11-future-structural-experiment",version:1,scope:"illustrative",exportedAt:new Date().toISOString(),note:"结构指数为条件演示，不是GDP、投资、交易额、收入、真实预测或因果效应。",snapshot:C.snapshot(state)};
 const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json;charset=utf-8"}),url=URL.createObjectURL(blob),a=el("a");
 a.href=url;a.download="博罗V11-未来结构实验-"+state.scene+"-"+state.year+".json";document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1300);
 toast("已导出当前方案JSON。");
}
all("[data-scene]").forEach(b=>b.addEventListener("click",()=>changeScene(b.dataset.scene)));
$("intensityRange").addEventListener("input",e=>{clearPlaying();setState({intensity:Number(e.target.value)})});
$("yearRange").addEventListener("input",e=>{clearPlaying();setState({year:Number(e.target.value)})});
$("playTime").addEventListener("click",()=>{
 if(playing!==null){clearPlaying();return;}
 if(state.year>=2030)setState({year:2026});
 $("playTime").textContent="Ⅱ 暂停";$("playTime").setAttribute("aria-pressed","true");
 playing=setInterval(()=>{if(state.year>=2030){clearPlaying();return;}setState({year:state.year+1});if(state.year>=2030)clearPlaying();},1100);
});
$("worldTabA").addEventListener("click",()=>{mobileWorld="A";renderWorldTabs()});
$("worldTabB").addEventListener("click",()=>{mobileWorld="B";renderWorldTabs()});
window.addEventListener("resize",renderWorldTabs);
$("resetLab").addEventListener("click",()=>{clearPlaying();const s=C.SCENES[state.scene];setState({link:s.candidates[0].id,mode:"strengthen",intensity:65,year:2028});toast("已恢复当前场景的初始演示条件");});
$("saveExperiment").addEventListener("click",save);
$("copyFutureLink").addEventListener("click",copyLink);
$("exportFuture").addEventListener("click",exportCurrent);
window.addEventListener("storage",e=>{if(e.key===C.STORE_KEY)renderHistory()});
persistUrl();render();renderHistory();
window.BoluoFutureLab=Object.freeze({getState:()=>({...state}),getResult:()=>C.simulate(state),restore:raw=>{clearPlaying();state=C.validate(raw);persistUrl();render();},save,history:readHistory});
})();