(() => {
"use strict";
const $=id=>document.getElementById(id);
const m=window.BoluoSemDemo;
if(!m)return;
const ranges={xToM:[-.2,.85],mToY:[-.2,.85],xToY:[-.3,.65],moderation:[-.5,.5]};
const defaults={...m.coefficients};
const data={...defaults};
const config=[
 ["xToM","coefAInput","coefAVal","coefA","edgeA"],
 ["mToY","coefBInput","coefBVal","coefB","edgeB"],
 ["xToY","coefCInput","coefCVal","coefC","edgeC"],
 ["moderation","coefZInput","coefZVal","coefZ","edgeZ"]
];
const bound=(x,lo,hi)=>Math.max(lo,Math.min(hi,+x));
window.BoluoPathLab={getCoefficients:()=>({...data})};
function update(){
 for(const [k,inputId,valueId,coefId,edgeId] of config){
  $(inputId).value=data[k].toFixed(2);
  $(valueId).textContent=(data[k]>=0?"+":"")+data[k].toFixed(2);
  $(coefId).textContent=(data[k]>=0?"+":"")+data[k].toFixed(2);
  const line=$(edgeId);
  line.style.strokeWidth=(2+Math.abs(data[k])*8).toFixed(1);
  line.classList.toggle("negative",data[k]<0);
  line.style.opacity=(.45+Math.min(1,Math.abs(data[k]))*.5).toFixed(2);
 }
 const out=m.calculate({investmentIndex:Number($("semInvestment").value),network:Number($("semNetwork").value),coefficients:data});
 [["pathDirect",out.direct],["pathIndirect",out.indirect],["pathTotal",out.total]].forEach(([id,v])=>{
  const e=$(id);e.textContent=(v>0?"+":"")+v.toFixed(3);
  e.dataset.direction=v<0?"negative":"positive";
 });
 const diagram=$("pathLabBoard");
 diagram.dataset.direction=out.total<0?"negative":"positive";
 const note=$("pathGraph");
 note.setAttribute("aria-label","路径假设系数：项目至产能 "+data.xToM.toFixed(2)+"，产能至增长 "+data.mToY.toFixed(2)+"，项目直接至增长 "+data.xToY.toFixed(2)+"，网络调节 "+data.moderation.toFixed(2)+"。均非实证估计。");
}
function propagate(){
 update();
 $("semInvestment")?.dispatchEvent(new Event("input",{bubbles:true}));
 $("semNetwork")?.dispatchEvent(new Event("input",{bubbles:true}));
 window.BoluoStageSeven?.render?.();
}
config.forEach(([k,id])=>$(id).addEventListener("input",e=>{
 const [lo,hi]=ranges[k];data[k]=bound(e.target.value,lo,hi);
 propagate();
}));
function preset(next){Object.assign(data,next);propagate();}
$("pathReset")?.addEventListener("click",()=>preset(defaults));
$("pathPresetA")?.addEventListener("click",()=>preset({xToM:.7,mToY:.75,xToY:.05,moderation:.3}));
$("pathPresetB")?.addEventListener("click",()=>preset({xToM:.25,mToY:.35,xToY:.55,moderation:.1}));
$("semInvestment")?.addEventListener("input",update);
$("semNetwork")?.addEventListener("input",update);
$("semReset")?.addEventListener("click",update);
update();
})();
