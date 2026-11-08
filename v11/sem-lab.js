(() => {
"use strict";
const model=window.BoluoSemDemo;
if(!model){document.getElementById("targetInsight").textContent="模型说明未加载，请刷新后重试。";return;}
const $=id=>document.getElementById(id);
const params=new URL(location.href).searchParams;
const acceptable=(v,items,fallback)=>Object.prototype.hasOwnProperty.call(items,v)?v:fallback;
let target=acceptable(params.get("focus"),model.targets,"growth");
let factorId=params.get("factor")||model.targets[target].key;
const shockNames={delay:"项目延期",invest:"投资接续",orders:"订单外流",traffic:"通勤压力"};
if(params.get("shock")&&shockNames[params.get("shock")]){
const suffix=params.get("strength")?" · 档位 "+params.get("strength"):"";
$("arrivalNote").textContent="已接住第七页实验："+shockNames[params.get("shock")]+suffix+"。下方换一种观察目标，查查可能被遗漏的因素。";
$("arrivalNote").hidden=false;
}
function factor(){
const data=model.targets[target];
return data.factors.find(x=>x.id===factorId)||data.factors[0];
}
function urlWith(targetKey=factorId,selected=target){
const u=new URL(location.href);
u.searchParams.set("focus",selected);u.searchParams.set("factor",targetKey);
return u;
}
function windUrl(point){
const u=new URL("./wind.html",location.href);
u.searchParams.set("shock",point.link);
u.searchParams.set("strength",params.get("strength")||"1");
u.searchParams.set("buffer",params.get("buffer")==="1"?"1":"0");
u.searchParams.set("active","1");
for(const key of ["bs","bv","n","line","view","bp0","bp1","bp2","bp3","bp4"]){
 if(params.has(key))u.searchParams.set(key,params.get(key));
}
u.hash="results";
return u.href;
}
function sync(){
try{const u=urlWith();history.replaceState(null,"",u.pathname+u.search+u.hash);}catch{}
}
function showPoint(p) {
factorId=p.id;
const data=model.targets[target];
$("focusName").textContent=p.name;
$("focusKind").textContent=p.kind;
$("focusImportance").textContent=String(p.importance);
$("focusPerformance").textContent=String(p.performance);
$("focusWhy").textContent=p.why;
$("focusMissing").textContent=p.missing;
$("takeaway").textContent="你选择了“"+data.title+"”，想核对“"+p.name+"”。现在最值得寻找的资料是："+p.missing+"。";
$("testAgain").href=windUrl(p);
$("endReturn").href=windUrl(p);
document.querySelectorAll(".map-point").forEach(btn=>btn.setAttribute("aria-pressed",String(btn.dataset.factor===p.id)));
sync();
}
function mapPaint(){
const data=model.targets[target];$("mapDots").replaceChildren();
data.factors.forEach((p,i)=>{
const btn=document.createElement("button");
btn.type="button";btn.className="map-point"+(p.importance>=65&&p.performance<=50?" urgent":"");
btn.dataset.factor=p.id;
btn.setAttribute("aria-label",p.name+"：教学重要性 "+p.importance+"，教学表现 "+p.performance+"。查看应核验的真实数据");
btn.setAttribute("aria-pressed","false");
btn.style.left=Math.min(92,Math.max(9,p.importance))+"%";
btn.style.bottom=Math.min(87,Math.max(12,p.performance))+"%";
const bubble=document.createElement("span");bubble.className="bubble";bubble.textContent=String(i+1);
const label=document.createElement("span");label.className="point-label";label.textContent=p.name;
btn.append(bubble,label);
btn.addEventListener("click",()=>showPoint(p));
$("mapDots").append(btn);
});
$("targetQuestion").textContent=data.question;$("targetInsight").textContent=data.insight;
document.querySelectorAll("[data-target]").forEach(btn=>btn.setAttribute("aria-pressed",String(btn.dataset.target===target)));
showPoint(factor());
}
document.querySelectorAll("[data-target]").forEach(btn=>btn.addEventListener("click",()=>{
target=acceptable(btn.dataset.target,model.targets,"growth");
factorId=model.targets[target].key;
mapPaint();
}));
function toast(msg){
const e=$("insightToast");e.textContent=msg;e.classList.add("on");
clearTimeout(toast.timer);toast.timer=setTimeout(()=>e.classList.remove("on"),2300);
}
async function copyValue(value){
try{
if(!navigator.clipboard||!navigator.clipboard.writeText)throw Error("clipboard unavailable");
await navigator.clipboard.writeText(value);toast("已复制");
}catch{
const input=document.createElement("textarea");
input.value=value;input.setAttribute("readonly","");input.style.position="fixed";input.style.top="0";input.style.opacity="0";
document.body.append(input);input.select();
let success=false;try{success=document.execCommand("copy");}catch{}input.remove();
toast(success?"已复制":"无法自动复制，请使用浏览器分享地址");
}
}
$("shareInsight").addEventListener("click",()=>copyValue(urlWith().href));
$("copyQuestion").addEventListener("click",()=>{
const p=factor();
copyValue("博罗结构盲点："+p.name+"。"+p.why+" 下一步核验："+p.missing+"。\n方法演示（非实证结果）："+urlWith().href);
});
window.addEventListener("popstate",()=>{
const p=new URL(location.href).searchParams;
target=acceptable(p.get("focus"),model.targets,"growth");factorId=p.get("factor")||model.targets[target].key;mapPaint();
});
mapPaint();
window.BoluoInsights={getState:()=>({target,factor:factor().id}),getFactor:factor};
})();
