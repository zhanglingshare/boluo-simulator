/* 博罗单页风洞样式实验；只读取已有模型，绝不生成假评分。 */
(function(){
"use strict";
const root=document.querySelector("body.bl-nba-demo .wrap");
if(!root)return;
const $=id=>document.getElementById(id);
const txt=(id,v)=>{const n=$(id);if(n)n.textContent=String(v)};
const nf=(v,d=0)=>Number(v).toLocaleString("zh-CN",{minimumFractionDigits:d,maximumFractionDigits:d});
const safe=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const names=["双引擎","工业底盘","三产文旅","融深通道","特色农业"];
const pos=[["21%","22%"],["76%","21%"],["83%","69%"],["51%","88%"],["16%","72%"]];
const order=["base","investment","property","combined","trend","upside"];
const short={base:"规划兑现",investment:"工业投资低迷",property:"房地产探底",combined:"两重压力叠加",trend:"现状延续",upside:"双引擎超预期"};
const icons={base:"◎",investment:"↘",property:"⌂",combined:"⚡",trend:"↺",upside:"↗"};
const deep=$("nba-deep"),content=$("nba-deep-content");
if(deep&&content){
  [...root.children].filter(el=>el.classList&&el.classList.contains("card")).forEach(card=>content.append(card));
  deep.addEventListener("toggle",()=>{
    if(deep.open)requestAnimationFrame(()=>{
       window.dispatchEvent(new Event("resize"));
       const sel=$("pressGrid")?.querySelector(".ptile.sel");
       if(sel)sel.click();
    });
  });
}
if(typeof HT==="undefined"||typeof BL_SCENES==="undefined"||typeof blRunScene!=="function"){
 txt("nba-verdict","模型文件未成功载入。请检查原有 model.js 与 bl-viz/data.js 是否可访问。");
 return;
}
const base=JSON.parse(JSON.stringify(HT.DEFAULT_PATHS)),largest=Math.max(1,...base.map(x=>x.mu));
let scene=typeof blInitialScene==="function"?blInitialScene():"base",focused=-1;
const options=$("nba-scenarios");
options.innerHTML=order.map(k=>'<button type="button" class="nba-scene" data-scene="'+k+'"><span class="nba-scene-icon">'+icons[k]+'</span><span><b>'+safe(short[k])+'</b><small>'+safe(BL_SCENES[k].desc)+'</small></span><span class="nba-scene-arrow">›</span></button>').join("");
const nodes=$("nba-map-nodes");
nodes.innerHTML=names.map((n,i)=>'<button type="button" class="nba-node" data-path="'+i+'" style="--x:'+pos[i][0]+';--y:'+pos[i][1]+'"><strong>'+safe(n)+'</strong><span>—</span><em></em></button>').join("");
const mod=()=>JSON.parse(JSON.stringify(base));
const diffText=n=>(n>0?"+":"")+nf(n)+" 亿";
function lineup(k){
 const paths=BL_SCENES[k].adjust(mod());
 const diffs=paths.map((p,i)=>p.mu-base[i].mu);
 const cards=$("nba-paths");cards.replaceChildren();
 paths.forEach((p,i)=>{
   const d=diffs[i],changed=Math.abs(d)>.45;
   const n=nodes.querySelector('[data-path="'+i+'"]'),l=$("nba-line"+i);
   if(n){
     n.classList.toggle("changed",changed);n.classList.toggle("active",focused===i);
     n.querySelector("span").textContent=nf(p.mu)+" 亿";
     n.querySelector("em").textContent=changed?"Δ "+diffText(d):"未调整";
   }
   if(l){l.classList.toggle("changed",changed);l.classList.toggle("rising",d>.45)}
   const b=document.createElement("button");b.type="button";
   b.className="nba-player"+(changed?" changed":"")+(focused===i?" active":"");
   b.innerHTML='<span class="nba-player-pos"><span>发展路径 '+String(i+1).padStart(2,"0")+'</span><b>◆</b></span>'+
    '<h3>'+safe(names[i])+'</h3><div class="nba-player-value"><span>模型 μ 参数</span><strong>'+nf(p.mu)+'</strong></div>'+
    '<div class="nba-player-track"><i style="--w:'+Math.max(2,Math.min(100,p.mu/largest*100))+'%"></i></div>'+
    '<div class="nba-player-diff'+(changed?" changed":"")+'">相对基准：'+(changed?diffText(d):"未调整")+'</div>';
   b.addEventListener("click",()=>{focused=i;lineup(k)});
   cards.append(b);
 });
 nodes.querySelectorAll("button").forEach(n=>n.onclick=()=>{focused=Number(n.dataset.path);lineup(k)});
 if(focused>=0){
   const i=focused;
   txt("nba-path-insight",names[i]+"：本次情景将 μ 从 "+nf(base[i].mu)+" 调整到 "+nf(paths[i].mu)+" 亿元。变化："+diffText(diffs[i])+"。这是模型假设，不代表真实新增 GDP。");
 }else{
   const changed=diffs.filter(v=>Math.abs(v)>.45).length;
   txt("nba-path-insight",changed?"此次情景调整了 "+changed+" 条路径。点亮的节点只是模型假设变化，点击卡片可检查具体差额。":"当前为规划兑现基准，五条路径没有额外调整。切换压力情景即可观察它们的变化。");
 }
 return {diffs,paths};
}
function render(k){
 if(!BL_SCENES[k])k="base";
 scene=k;
 const baseline=blRunScene("base"),result=blRunScene(k);
 const diff=result.hit-baseline.hit,changeP50=result.p50-baseline.p50;
 const l=lineup(k);
 txt("nba-hit",nf(result.hit,1));txt("nba-p50",nf(result.p50));
 if(typeof BL_2026!=="undefined"){
    const get=(arr,label)=>arr.find(x=>x.k===label)?.v||"—";
    txt("nba-indinv",get(BL_2026.investment,"工业投资"));
    txt("nba-industry",get(BL_2026.production,"规上工业增加值"));
    txt("nba-invest",get(BL_2026.investment,"固定资产投资"));
    txt("nba-date",BL_2026.latestLabel);
    if($("nba-src"))$("nba-src").href=BL_2026.latestSource;
 }
 txt("nba-base-hit",nf(baseline.hit,1)+"%");
 txt("nba-now-hit",nf(result.hit,1)+"%");
 $("nba-now-hit").className=diff<-.05?"down":diff>.05?"up":"";
 txt("nba-delta",(diff>0?"+":"")+nf(diff,1)+" 个百分点 / 中位 "+diffText(changeP50));
 txt("nba-result-p50",nf(result.p50)+" 亿");
 txt("nba-result-range",nf(result.p10)+"—"+nf(result.p90)+" 亿");
 txt("nba-active-scene",BL_SCENES[k].name);
 options.querySelectorAll("button").forEach(b=>{
   const yes=b.dataset.scene===k;
   b.classList.toggle("active",yes);b.setAttribute("aria-pressed",String(yes));
 });
 const ranked=l.diffs.map((v,i)=>({v,i})).filter(x=>Math.abs(x.v)>.45).sort((a,b)=>Math.abs(b.v)-Math.abs(a.v));
 const top=ranked.slice(0,2).map(x=>names[x.i]).join("、");
 txt("nba-verdict",k==="base"?"当前是规划兑现基准。换一个压力情景，再看结果和阵容如何变化。":
  "与基准相比，达标比例"+(diff<0?"减少":"增加")+nf(Math.abs(diff),1)+"个百分点；"+
  (top?"调整幅度较大的模型路径："+top+"。":"这组情景的五条路径没有额外改变。")+
  "此为条件推演，不代表现实中这些行业已发生相同变化。");
}
function select(k){
 const real=$("pressGrid")?.querySelector('[data-key="'+k+'"]');
 if(real)real.click();
 else if(typeof blSaveScene==="function")blSaveScene(k);
 focused=-1;
 render(k);
}
options.querySelectorAll("button").forEach(b=>b.addEventListener("click",()=>select(b.dataset.scene)));
$("pressGrid")?.addEventListener("click",e=>{
 const t=e.target.closest("[data-key]");
 if(t&&BL_SCENES[t.dataset.key]){focused=-1;render(t.dataset.key)}
});
render(scene);
})();