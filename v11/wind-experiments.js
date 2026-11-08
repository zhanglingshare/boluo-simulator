(() => {
"use strict";
const $=id=>document.getElementById(id);
const clamp=(v,a,b)=>Math.min(b,Math.max(a,Number.isFinite(+v)?+v:a));
const qs=new URL(location.href).searchParams;
const state={
 baseScale:clamp(qs.get("bs")??1,.65,1.35),
 volScale:clamp(qs.get("bv")??1,.6,1.6),
 paths:Array.from({length:5},(_,i)=>clamp(qs.get("bp"+i)??1,.5,1.5)),
 count:[2000,5000,10000].includes(Number(qs.get("n")))?Number(qs.get("n")):5000,
 threshold:clamp(qs.get("line")??1600,1250,1850),
 view:["density","hist","cdf"].includes(qs.get("view"))?qs.get("view"):"density"
};
let latest=null,fullLatest=null,range=null,job=0,playTimer=0;
const format=n=>Number(n).toLocaleString("zh-CN",{maximumFractionDigits:0});
const colors=["#7bd9ff","#ffbd82","#69ebcf"];
const configs=[["基准","base"],["施压","stress"],["缓冲","buffer"]];
const labels=()=>{
 $("baseScaleValue").textContent=Math.round(state.baseScale*100)+"%";
 $("baseVolValue").textContent=state.volScale.toFixed(2)+" 倍";
 $("baseCount").value=String(state.count);
 $("detailThreshold").value=String(state.threshold);
 $("detailThresholdValue").textContent=String(state.threshold);
 $("baseScale").value=String(state.baseScale);
 $("baseVol").value=String(state.volScale);
 document.querySelectorAll("[data-baseline-path]").forEach(sl=>{
   const i=Number(sl.dataset.baselinePath);
   sl.value=String(state.paths[i]);
   const v=$("basePathValue"+i);if(v)v.textContent=Math.round(state.paths[i]*100)+"%";
 });
 document.querySelectorAll("[data-dist-view]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.distView===state.view)));
};
function syncURL(){
 const u=new URL(location.href);
 u.searchParams.set("bs",state.baseScale.toFixed(2));
 u.searchParams.set("bv",state.volScale.toFixed(2));
 state.paths.forEach((v,i)=>u.searchParams.set("bp"+i,v.toFixed(2)));
 u.searchParams.set("n",String(state.count));
 u.searchParams.set("line",String(state.threshold));
 u.searchParams.set("view",state.view);
 history.replaceState(null,"",u.pathname+u.search+u.hash);
}
function rerun(animate=false){
 labels();syncURL();
 if(window.BoluoWind?.rerun)window.BoluoWind.rerun(animate);
}
function schedule(){
 clearTimeout(job);job=setTimeout(()=>rerun(false),65);
}
function reset(shouldRun=true){
 state.baseScale=1;state.volScale=1;state.paths=[1,1,1,1,1];state.count=5000;state.threshold=1600;state.view="density";
 labels();
 if(shouldRun)rerun(true);
}
window.BoluoExperimentBaseline={getParams:()=>({baseScale:state.baseScale,volScale:state.volScale,paths:state.paths.slice(),count:state.count}),reset};
const pathBox=$("basePathControls");
if(pathBox && typeof HT!=="undefined"){
 HT.DEFAULT_PATHS.forEach((p,i)=>{
   const label=document.createElement("label");
   label.innerHTML='<span>'+String(i+1).padStart(2,"0")+' · '+p.name+' <strong id="basePathValue'+i+'">'+Math.round(state.paths[i]*100)+'%</strong></span><input type="range" data-baseline-path="'+i+'" min=".5" max="1.5" step=".05" value="'+state.paths[i]+'"><small>默认情景贡献 '+p.mu+' 亿 · 当前 '+Math.round(p.mu*state.paths[i]*state.baseScale)+' 亿（仅路径假设）</small>';
   pathBox.append(label);
 });
}
const baseInput=$("baseScale"),volInput=$("baseVol");
baseInput?.addEventListener("input",e=>{state.baseScale=clamp(e.target.value,.65,1.35);labels();schedule();});
baseInput?.addEventListener("change",()=>rerun(true));
volInput?.addEventListener("input",e=>{state.volScale=clamp(e.target.value,.6,1.6);labels();schedule();});
volInput?.addEventListener("change",()=>rerun(true));
pathBox?.addEventListener("input",e=>{
 const i=Number(e.target.dataset.baselinePath);
 if(!Number.isInteger(i)||i<0||i>4)return;
 state.paths[i]=clamp(e.target.value,.5,1.5);labels();schedule();
});
pathBox?.addEventListener("change",()=>rerun(true));
$("baseCount")?.addEventListener("change",e=>{state.count=[2000,5000,10000].includes(+e.target.value)?+e.target.value:5000;rerun(true);});
$("baseRun")?.addEventListener("click",()=>rerun(true));
$("baseReset")?.addEventListener("click",()=>reset(true));
$("detailThreshold")?.addEventListener("input",e=>{
 state.threshold=clamp(e.target.value,1250,1850);labels();syncURL();if(latest)render(latest);
});
document.querySelectorAll("[data-dist-view]").forEach(b=>b.addEventListener("click",()=>{
 state.view=b.dataset.distView;labels();syncURL();if(latest)render(latest);
}));
function stopSampleReplay(showFinal=false){
 clearTimeout(playTimer);playTimer=0;
 if($("detailReplay"))$("detailReplay").textContent="播放抽样累积 ↻";
 if(showFinal&&fullLatest){render(fullLatest);setSampleStatus(fullLatest.base.rawResults.length,fullLatest.base.rawResults.length);}
}
function setSampleStatus(k,N){
 const p=$("samplingProgress"),bar=$("samplingBar");
 if(p)p.textContent=k>=N?"已完成 "+format(N)+" 次":format(k)+" / "+format(N)+" 次";
 if(bar)bar.style.width=(Math.min(100,k/N*100)).toFixed(1)+"%";
}
function prefixOutcome(s,k){
 const raw=s.rawResults.slice(0,k),sorted=[...raw].sort((a,b)=>a-b);
 return {rawResults:raw,results:sorted,p10:HT.quantile(sorted,.10),p50:HT.quantile(sorted,.50),p90:HT.quantile(sorted,.90),hit:100*raw.filter(x=>x>=HT.TARGET).length/raw.length};
}
function playSampleReplay(){
 if(!fullLatest)return;
 stopSampleReplay(false);
 const N=fullLatest.base.rawResults.length;
 const increments=[150,350,750,1400,2600,4000,N].map(k=>Math.min(k,N));
 const steps=[...new Set(increments)].filter(k=>k>=20);
 let index=0;
 $("detailReplay").textContent="正在演化 · 点击恢复结果";
 const next=()=>{
  const k=steps[index++];
  const partial={base:prefixOutcome(fullLatest.base,k),stress:prefixOutcome(fullLatest.stress,k),buffer:fullLatest.buffer?prefixOutcome(fullLatest.buffer,k):null};
  render(partial);setSampleStatus(k,N);
  if(index<steps.length)playTimer=setTimeout(next,170);
  else{$("detailReplay").textContent="播放抽样累积 ↻";playTimer=0;}
 };
 next();
}
$("detailReplay")?.addEventListener("click",()=>{
 if(playTimer){stopSampleReplay(true);$("detailReplay").textContent="播放抽样累积 ↻";}
 else playSampleReplay();
});
function quant(arr,q){return HT.quantile(arr,q);}
function moments(s){
 const raw=s.rawResults,mean=raw.reduce((a,v)=>a+v,0)/raw.length;
 return {mean,sd:Math.sqrt(raw.reduce((a,v)=>a+(v-mean)**2,0)/raw.length)};
}
function cdf(arr,x){
 let lo=0,hi=arr.length;
 while(lo<hi){const mid=(lo+hi)>>1;if(arr[mid]<=x)lo=mid+1;else hi=mid;}
 return lo/arr.length;
}
function stats(s,threshold){
 const m=moments(s);
 return {p5:quant(s.results,.05),p10:s.p10,p25:quant(s.results,.25),p50:s.p50,p75:quant(s.results,.75),p90:s.p90,p95:quant(s.results,.95),...m,share:100*(1-cdf(s.results,threshold))};
}
function bins(arr,lower,upper,n=85){
 const out=new Float64Array(n),w=(upper-lower)/n;
 arr.forEach(v=>{const i=Math.floor((v-lower)/w);if(i>=0&&i<n)out[i]++;});
 for(let i=0;i<out.length;i++)out[i]/=arr.length;
 return out;
}
function smooth(arr){
 const w=[1,3,6,10,14,10,6,3,1],out=[];
 for(let i=0;i<arr.length;i++){
  let s=0,z=0;
  for(let j=-4;j<=4;j++){if(arr[i+j]===undefined)continue;s+=arr[i+j]*w[j+4];z+=w[j+4];}
  out.push(z?s/z:0);
 }
 return out;
}
function curve(points){return points.map((p,i)=>(i?"L":"M")+p[0].toFixed(1)+" "+p[1].toFixed(1)).join(" ");}
function render(all){
 latest=all;
 if(!all?.base?.results?.length)return;
 const arr=configs.filter(([name,key])=>all[key]).map(([name,key],i)=>({name,key,results:all[key],color:colors[i],stat:stats(all[key],state.threshold)}));
 let low=Math.min(...arr.map(s=>s.stat.p5),state.threshold,1600)-55,high=Math.max(...arr.map(s=>s.stat.p95),state.threshold,1600)+55;
 low=50*Math.floor(low/50);high=50*Math.ceil(high/50);
 if(high-low<300){const mid=(low+high)/2;low=mid-150;high=mid+150;}
 range={low,high};const W=960,H=370,L=60,R=26,T=35,B=44,n=85,plotW=W-L-R,plotH=H-T-B;
 const sx=x=>L+(x-low)/(high-low)*plotW,ys=v=>T+(1-v)*plotH;
 const rows=arr.map(s=>({...s,bin:bins(s.results.results,low,high,n)}));
 rows.forEach(s=>{s.density=smooth(s.bin);});
 const maxi=Math.max(.0001,...rows.flatMap(s=>s.density));
 let svg='<defs><clipPath id="distClip2"><rect x="'+L+'" y="'+T+'" width="'+plotW+'" height="'+plotH+'"/></clipPath></defs>';
 for(let j=0;j<5;j++){
  const y=T+j*plotH/4;
  svg+='<line x1="'+L+'" y1="'+y+'" x2="'+(W-R)+'" y2="'+y+'" stroke="#3c617f" opacity=".45"/>';
  if(state.view==="cdf")svg+='<text x="'+(L-10)+'" y="'+(y+4)+'" text-anchor="end" fill="#8daec7" font-size="11">'+(100-25*j)+'%</text>';
 }
 for(let i=0;i<=5;i++){
  const x=low+(high-low)*i/5;
  svg+='<line x1="'+sx(x)+'" y1="'+T+'" x2="'+sx(x)+'" y2="'+(H-B)+'" stroke="#355a75" opacity=".4"/><text x="'+sx(x)+'" y="'+(H-14)+'" fill="#a7c6df" text-anchor="middle" font-size="12">'+format(x)+'</text>';
 }
 if(state.view==="hist"){
  const maxCount=Math.max(...rows.flatMap(s=>Array.from(s.bin)),.001)*1.14;
  rows.forEach((s,k)=>{
   for(let i=0;i<n;i++){
    const left=sx(low+(high-low)*i/n),bw=plotW/n;
    const h=s.bin[i]/maxCount*plotH;
    svg+='<rect x="'+(left+k*.25*bw).toFixed(1)+'" y="'+(H-B-h).toFixed(1)+'" width="'+(bw*.72).toFixed(1)+'" height="'+h.toFixed(1)+'" fill="'+s.color+'" fill-opacity=".44"/>';
   }
  });
 }else{
  rows.forEach(s=>{
   const points=Array.from({length:n},(_,i)=>{
    const x=sx(low+(high-low)*(i+.5)/n);
    const v=state.view==="cdf"?cdf(s.results.results,low+(high-low)*(i+.5)/n):s.density[i]/(maxi*1.2);
    return [x,ys(v)];
   });
   const d=curve(points),last=points[points.length-1];
   if(state.view==="density")svg+='<path d="'+d+'L'+last[0].toFixed(1)+' '+(H-B)+'L'+points[0][0].toFixed(1)+' '+(H-B)+'Z" fill="'+s.color+'" fill-opacity=".09"/>';
   svg+='<path class="sim-curve" d="'+d+'" fill="none" stroke="'+s.color+'" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>';
  });
 }
 rows.forEach(s=>{
  const left=sx(s.stat.p10),right=sx(s.stat.p90),y=H-B-10;
  svg+='<rect x="'+left.toFixed(1)+'" y="'+(y-3)+'" width="'+(right-left).toFixed(1)+'" height="6" rx="3" fill="'+s.color+'" opacity=".75"/>';
  const x=sx(s.stat.p50);
  svg+='<line x1="'+x.toFixed(1)+'" y1="'+(T+8)+'" x2="'+x.toFixed(1)+'" y2="'+(H-B)+'" stroke="'+s.color+'" stroke-width="1.5" stroke-dasharray="3 6" opacity=".85"/>';
 });
 const officialX=sx(1600),lineX=sx(state.threshold);
 svg+='<line x1="'+officialX+'" y1="'+T+'" x2="'+officialX+'" y2="'+(H-B)+'" stroke="#f9fbff" stroke-width="2" stroke-dasharray="7 5"/>';
 if(state.threshold!==1600)svg+='<line x1="'+lineX+'" y1="'+T+'" x2="'+lineX+'" y2="'+(H-B)+'" stroke="#facc73" stroke-width="3" stroke-dasharray="5 5"/>';
 svg+='<text x="'+Math.min(W-R-70,Math.max(L+75,officialX))+'" y="21" text-anchor="middle" font-size="13" fill="#f0f9ff" font-weight="800">规划 1600亿</text>';
 svg+='<g id="detailCursor" style="display:none"><line id="detailCrossLine" x1="0" y1="'+T+'" x2="0" y2="'+(H-B)+'" stroke="#facc73" stroke-width="1.5"/><circle id="detailCrossDot" cx="0" cy="'+(T+12)+'" r="5" fill="#facc73"/></g>';
 const chart=$("detailChart");chart.innerHTML=svg;
 chart.setAttribute("aria-label",state.view+"图：基准、施压、缓冲的条件结果分布，标有1600亿元规划线、用户参照线与三个中位数");
 const body=$("quantileRows");
 body.replaceChildren();
 rows.forEach(s=>{
  const tr=document.createElement("tr");
  const vals=[s.name,s.stat.p5,s.stat.p10,s.stat.p25,s.stat.p50,s.stat.p75,s.stat.p90,s.stat.p95,s.stat.mean,s.stat.sd];
  vals.forEach((v,i)=>{const td=document.createElement("td");td.textContent=i===0?v:format(v);if(i===4)td.className="median";if(i===0)td.style.color=s.color;tr.append(td);});
  body.append(tr);
 });
 const tails=$("detailTails");tails.replaceChildren();
 rows.forEach(s=>{
  const b=document.createElement("div");b.className="tail-row";
  const span=document.createElement("span");span.textContent=s.name+" · 高于参照线";
  const strong=document.createElement("strong");strong.style.color=s.color;strong.textContent=s.stat.share.toFixed(1)+"%";
  b.append(span,strong);tails.append(b);
 });
 const delta=rows[1].stat.p50-rows[0].stat.p50;
 $("detailObservation").textContent="当前基准P10—P90："+format(rows[0].stat.p10)+"—"+format(rows[0].stat.p90)+"亿；压力相对基准的P50移动 "+(delta>0?"+":"")+format(delta)+"亿。";
 const inspector=$("detailCrossLabel");inspector.textContent=state.view==="cdf"?"移动位置，查看累计不超过某个值的模型内占比":"移动位置，查看三种条件落在位置右侧的模型内占比";
 $("detailCrossValue").textContent="—";
 chart.onpointermove=ev=>{
   const rect=chart.getBoundingClientRect();const rel=clamp((ev.clientX-rect.left)/rect.width,0,1);
   const x=low+(high-low)*clamp((rel-L/W)/(plotW/W),0,1);
   const unit=sx(x),node=chart.querySelector("#detailCursor"),line=chart.querySelector("#detailCrossLine"),dot=chart.querySelector("#detailCrossDot");
   node.style.display="";line.setAttribute("x1",unit);line.setAttribute("x2",unit);dot.setAttribute("cx",unit);
   $("detailCrossValue").textContent=format(x)+" 亿";
   inspector.textContent=rows.map(s=>s.name+" "+(state.view==="cdf"?(cdf(s.results.results,x)*100).toFixed(1)+"%":"右侧 "+((1-cdf(s.results.results,x))*100).toFixed(1)+"%")).join("　|　");
 };
 chart.onpointerleave=()=>{const n=chart.querySelector("#detailCursor");if(n)n.style.display="none";};
}
window.addEventListener("boluo:wind-run",e=>{stopSampleReplay(false);fullLatest=e.detail.results;render(fullLatest);setSampleStatus(fullLatest.base.rawResults.length,fullLatest.base.rawResults.length);const box=$("distributionWork");if(box&&e.detail.animate){box.classList.remove("is-running");void box.offsetWidth;box.classList.add("is-running");}});
window.BoluoDistribution={getState:()=>({...state,paths:[...state.paths]}),render:()=>{const r=window.BoluoWind?.getDistributions();if(r)render(r);}};
labels();
})();
