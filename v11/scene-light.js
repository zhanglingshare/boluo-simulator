(()=>{"use strict";
const stage=document.getElementById("expOrbitNodes");
if(!stage)return;
const towns=["罗阳街道","龙溪街道","石湾镇","园洲镇","杨村镇","公庄镇","湖镇镇","长宁镇","横河镇","龙华镇","柏塘镇","泰美镇","杨侨镇","麻陂镇","观音阁镇","石坝镇"];
const mountainTowns=new Set(["园洲镇","石湾镇","长宁镇","湖镇镇","横河镇"]);
const titleMap={
"罗阳街道":"罗阳","龙溪街道":"龙溪","石湾镇":"石湾","园洲镇":"园洲","杨村镇":"杨村","公庄镇":"公庄","湖镇镇":"湖镇","长宁镇":"长宁","横河镇":"横河","龙华镇":"龙华","柏塘镇":"柏塘","泰美镇":"泰美","杨侨镇":"杨侨","麻陂镇":"麻陂","观音阁镇":"观音阁","石坝镇":"石坝"
};
const $=id=>document.getElementById(id);
const orbit=towns.map((name,i)=>{
 const theta=(i*360/towns.length-90)*Math.PI/180;
 return {name,x:50+41.5*Math.cos(theta),y:50+36.8*Math.sin(theta)};
});
function mode(){
 return document.querySelector("[data-exp-mode].active")?.dataset.expMode || "town";
}
function selected(){
 return $("expTownSelect")?.value || "罗阳街道";
}
function sync(){
 const m=mode(),s=selected();
 const label=m==="town"?s:m==="economy"?"千亿产业":"环两山";
 $("expSceneCore").textContent=label;
 $("expSceneCoreCaption").textContent=m==="town"?"点一下看已知与未知":m==="economy"?"点击拆解GDP结构":"跨镇协同 · 规划视角";
 $("expSceneMode").textContent=m==="town"?"选中镇街":m==="economy"?"GDP构成":"环两山";
 $("expSceneFrameCount").textContent=m==="town"?"16镇街 · 1个焦点":m==="economy"?"3类产业 · 16镇街":"涉及博罗5个镇";
 let line="";
 const connections=[];
 orbit.forEach((n,i)=>{
  const highlight=(m==="town"&&n.name===s)||(m==="mountains"&&mountainTowns.has(n.name));
  const node=document.getElementById("expNode"+i);
  if(node){
    node.classList.toggle("selected",m==="town"&&n.name===s);
    node.classList.toggle("ring-town",m==="mountains"&&mountainTowns.has(n.name));
    node.style.opacity=m==="economy"?".74":m==="mountains"&&!highlight?".47":"1";
    node.setAttribute("aria-pressed",String(m==="town"&&n.name===s));
  }
  if(highlight){
   let x=n.x*10,y=n.y*7;
   const sw=m==="town"?2.9:1.5;
   connections.push('<path class="exp-signal-flow" style="stroke-width:'+sw+'" d="M '+x+' '+y+' Q '+((x+500)/2+12)+' '+((y+350)/2-18)+' 500 350"/>');
   if(m==="town")connections.push('<circle cx="'+x+'" cy="'+y+'" r="16" class="exp-halo" />');
  }
 });
 $("expConnections").innerHTML=connections.join("");
 $("expSceneFootnote").textContent=m==="mountains"?"绿色为规划涉及镇街，不代表已经形成产业联系":"节点是可点击的概念索引，不代表真实空间位置或企业交易联系";
}
function chooseTown(name){
 const modeTown=document.querySelector('[data-exp-mode="town"]');
 if(mode()!=="town")modeTown?.click();
 const p=$("expTownSelect");p.value=name;
 p.dispatchEvent(new Event("change",{bubbles:true}));
 // Coordinate the main town explorer with the first-screen selection.
 if(typeof selectTown==="function")selectTown(name);
 sync();
}
stage.innerHTML=orbit.map((n,i)=>{
 const label=titleMap[n.name]||n.name;
 return '<button type="button" class="exp-town-node" id="expNode'+i+'" style="left:'+n.x.toFixed(2)+'%;top:'+n.y.toFixed(2)+'%" data-orbit-town="'+n.name+'" title="'+n.name+'" aria-label="观察'+n.name+'">'+label+'</button>';
}).join("");
stage.querySelectorAll("[data-orbit-town]").forEach(b=>b.onclick=()=>chooseTown(b.dataset.orbitTown));
document.querySelectorAll("[data-exp-mode],[data-exp-town]").forEach(b=>b.addEventListener("click",()=>queueMicrotask(sync)));
$("expTownSelect")?.addEventListener("change",()=>queueMicrotask(sync));
$("expSceneCoreButton")?.addEventListener("click",()=>{
 const m=mode();
 if(m==="town"){if(typeof selectTown==="function")selectTown(selected());}
 if(m==="mountains"){if(typeof setMode==="function")setMode("ring");}
 if(m==="economy"){document.querySelector('[data-viz-mode="gdp"]')?.click();document.body.classList.add("exp-show-deep");}
 (m==="economy"?$("v11VizBoard"):$("v11Explore"))?.scrollIntoView({behavior:"smooth",block:"start"});
});
sync();
})();