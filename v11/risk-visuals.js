(()=>{"use strict";
const root=document.getElementById("riskVisuals");if(!root)return;
const $=id=>document.getElementById(id);
const names={electronic:"电子信息",projects:"工业接续",tea:"柏塘春茶",ring:"环两山",innovation:"创新转化"};
const models={
 electronic:{base:773.8,target:1000,period:5},
 projects:{base:55.3,target:100,period:4},
 tea:{farm:23,process:32,channel:25,inputs:20},
 ring:{day:90,night:600,visitors:100},
 innovation:{converted:652,total:1407}
};
const c=id=>id||document.querySelector(".tab.active[data-case]")?.dataset.case||"electronic";
let active="electronic",v1=5,v2=20;
const f=(n,d=1)=>Number(n).toLocaleString("zh-CN",{minimumFractionDigits:d,maximumFractionDigits:d});
const bounded=(n,a,b)=>Math.max(a,Math.min(b,n));
const esc=s=>String(s).replace(/[&<>"']/g,x=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[x]));
function reset(){active=c();v1=Number($("slider").value);v2=Number($("slider2").value);document.querySelectorAll("[data-quick-case]").forEach(b=>{const on=b.dataset.quickCase===active;b.classList.toggle("active",on);b.setAttribute("aria-pressed",String(on))});render()}
const value=(id,a,b)=>{
 if(id==="electronic")return models.electronic.base*Math.pow(1+a/100,b-2025);
 if(id==="projects")return b<=2025?100:models.projects.base*Math.pow(1+a/100,b-2026);
 if(id==="tea")return 23+32*a/100+25*b/100;
 if(id==="ring")return ((100-a)*90+a*600)*b/100;
 if(id==="innovation"){let z=1.96,N=652,n=a;return 100*z*Math.sqrt(.25/n)*Math.sqrt((N-n)/(N-1))}
 return 0;
};
function sourceLabels(){return {electronic:"2025年产值报道下限 + 用户假设",projects:"2025同期指数100；2026=55.3",tea:"每100元销售额的假设分解",ring:"每100位游客的消费假设",innovation:"652家总体中的拟议随机抽样"}[active]}
function cellTitle(id,a,b,num){
 if(id==="electronic")return "年均增长 "+a+"%；"+b+"年下限情景产值 "+f(num,1)+"亿元";
 if(id==="projects")return "增长 "+a+"%；"+b+"年同季投资指数 "+f(num,1);
 if(id==="tea")return "加工本地留存 "+b+"%，渠道本地留存 "+a+"%；销售额中本地增值 "+f(num,1)+"%";
 if(id==="ring")return "过夜游客 "+b+"人/100人，本地留存 "+a+"%；本地消费代理 "+f(num,0)+"元";
 return "拟调查"+b+"家，"+a+"%置信水平假设的最大误差半宽 "+f(num,1)+"个百分点";
}
function heatDetails(){
 let rows=[],cols=[],compute,goal,click,title,sub;
 if(active==="electronic"){
 rows=[-5,0,3,5,8,12];cols=[2025,2026,2027,2028,2029,2030];
 compute=(r,k)=>value(active,r,k);goal=x=>x>=1000;click=(r)=>setSlider("slider",r);
 title="哪个增速 × 哪一年，可以跨过1000亿？";sub="以2025年报道的773.8亿元下限为基期；横向看年份、纵向换增长条件。";
 }else if(active==="projects"){
 rows=[-5,0,5,10,20,30];cols=[2025,2026,2027,2028,2029,2030];
 compute=(r,k)=>value(active,r,k);goal=x=>x>=100;click=r=>setSlider("slider",r);
 title="投资恢复，是时间问题还是增长条件问题？";sub="2025同期=100；2026同期=55.3。颜色只表示是否恢复参照水平。";
 }else if(active==="tea"){
 rows=[0,20,40,60,80,100];cols=[0,20,35,60,80,100];
 compute=(r,k)=>value(active,k,r);goal=x=>x>=60;click=(r,k)=>{setSlider("slider",k);setSlider("slider2",r)};
 title="加工、渠道分别留在本地多少？";sub="横轴加工留存、纵轴渠道留存；数字为每100元销售额本地增值（假设）。";
 }else if(active==="ring"){
 rows=[0,20,40,60,80,100];cols=[0,15,30,45,60,70];
 compute=(r,k)=>value(active,k,r);goal=x=>x>=14000;click=(r,k)=>{setSlider("slider",k);setSlider("slider2",r)};
 title="住下来 × 钱留下，哪个更关键？";sub="横轴每百名游客过夜人数，纵轴本地留存比例；格内为百游客本地消费代理（百元）。";
 }else{
 rows=[80,85,90,95,99,99.5];cols=[20,60,80,120,180,240];
 const zVals={80:1.282,85:1.44,90:1.645,95:1.96,99:2.576,99.5:2.807};
 compute=(r,n)=>value(active,n)*zVals[r]/1.96;goal=x=>x<=8;click=(r,n)=>setSlider("slider",n);
 title="抽多少家，估计误差才能缩小？";sub="拟随机抽样，不是已测量绩效；纵轴置信水平，横轴样本量。";
 }
 return {rows,cols,compute,goal,click,title,sub};
}
function setSlider(id,value,fire=true){const inp=$(id);inp.value=value;if(fire)inp.dispatchEvent(new Event("input",{bubbles:true}));}
function heat(){
 const H=heatDetails();$("rvHeatTitle").textContent=H.title;$("rvHeatSub").textContent=H.sub;
 let html='<div class="rv-heat"><div class="rv-tick"></div>'+H.cols.map(k=>'<div class="rv-tick">'+k+(active==="tea"||active==="ring"?"%":active==="innovation"?"家":"")+'</div>').join("");
 for(const row of H.rows){
   html+='<div class="rv-ylabel">'+row+(active==="tea"||active==="ring"||active==="innovation"?"%":"%")+'</div>';
   for(const col of H.cols){
    const n=H.compute(row,col);
    const label=active==="ring"?f(n/100,0):f(n,active==="innovation"?1:0);
    const mode=(active==="electronic"||active==="projects")?(H.goal(n)?"pass":"fail"):(active==="tea"?((n-23)/57):(active==="ring"?(n/44700):(1-bounded((n-5)/30,0,1))))>=.66?"highdata":(active==="tea"?((n-23)/57):(active==="ring"?(n/44700):(1-bounded((n-5)/30,0,1))))>=.33?"mediumdata":"lowdata";
    const selected=(active==="electronic"||active==="projects")&&Math.abs(v1-row)<1||active==="tea"&&v1===col&&v2===row||active==="ring"&&v1===col&&v2===row||active==="innovation"&&v1===col&&row===95;
    html+='<button class="rv-cell '+mode+(selected?' active':'')+'" data-r="'+row+'" data-c="'+col+'" title="'+esc(cellTitle(active,row,col,n))+'" aria-label="'+esc(cellTitle(active,row,col,n))+'">'+label+'</button>';
   }
 }
 html+='</div>';
 $("rvHeat").innerHTML=html;
 $("rvHeat").querySelectorAll("[data-r]").forEach(btn=>btn.onclick=()=>H.click(+btn.dataset.r,+btn.dataset.c));
 const legend=active==="electronic"?"绿色：跨越1000亿参照线；红色：未跨":active==="projects"?"绿色：投资指数恢复至100；红色：未恢复":active==="innovation"?"深蓝代表更小的拟议抽样误差；没有合格阈值":"颜色仅用于区分条件场景的数值大小；不表示产业风险或达成度";
 $("rvHeatLegend").textContent=legend;
$("rvLegend").innerHTML=(active==="electronic"||active==="projects")?'<span><i class="rv-key" style="background:#1e8f79"></i>跨越参照</span><span><i class="rv-key" style="background:#e4a081"></i>未跨参照</span>':'<span><i class="rv-key" style="background:#72bbdb"></i>相对高值</span><span><i class="rv-key" style="background:#eaf2fb"></i>相对低值</span><span>无实测目标</span>';
}
function chartLines(series,minOverride,target){
 const width=620,height=248,baseX=48,baseY=210,top=20,rt=570,labels=series[0].points.map(a=>a[0]);
 const vals=series.flatMap(s=>s.points.map(p=>p[1])).concat(Number.isFinite(target)?[target]:[]);
 const low=Math.min(minOverride??0,...vals),high=Math.max(...vals,1);
 const ylo=low-(high-low)*.11,yhi=high+(high-low)*.12;
 const x=i=>baseX+i*(rt-baseX)/Math.max(labels.length-1,1);
 const y=n=>baseY-(n-ylo)/(yhi-ylo)*(baseY-top);
 let svg='<svg viewBox="0 0 '+width+' '+height+'" role="img" aria-label="三种假设条件的变化路径比较">';
 for(let k=0;k<5;k++){const n=ylo+(yhi-ylo)*k/4;svg+='<line x1="'+baseX+'" x2="'+rt+'" y1="'+y(n)+'" y2="'+y(n)+'" class="rv-gridline"/><text x="40" y="'+(y(n)+4)+'" text-anchor="end">'+f(n,0)+'</text>'}
 if(Number.isFinite(target)){svg+='<line x1="'+baseX+'" x2="'+rt+'" y1="'+y(target)+'" y2="'+y(target)+'" class="rv-target"/><text x="'+rt+'" y="'+(y(target)-8)+'" text-anchor="end" style="fill:#c6765d;font-weight:800">参照 '+f(target,0)+'</text>'}
 series.forEach((s,j)=>{
  const pts=s.points.map((p,i)=>x(i)+','+y(p[1])).join(" ");
  svg+='<polyline points="'+pts+'" class="'+(j===1?"rv-trace":j===0?"rv-trace2":"rv-trace3")+'"/>';
  const last=s.points[s.points.length-1][1];
  svg+='<circle cx="'+x(labels.length-1)+'" cy="'+y(last)+'" r="'+(j===1?6:4)+'" fill="'+(j===1?"#1e7cda":j===0?"#84bed9":"#8d79d0")+'" stroke="#fff" stroke-width="2"/>';
 });
 labels.forEach((lab,i)=>{svg+='<text x="'+x(i)+'" y="236" text-anchor="middle">'+lab+'</text>'});
 svg+='</svg>';return svg;
}
function curve(){
 let title,sub,html,note;
 if(active==="electronic"||active==="projects"){
  const isE=active==="electronic",rates=isE?[bounded(v1-3,-5,15),v1,bounded(v1+3,-5,15)]:[bounded(v1-5,-5,35),v1,bounded(v1+5,-5,35)];
  const years=isE?[2025,2026,2027,2028,2029,2030]:[2026,2027,2028,2029,2030];
  const series=rates.map(rate=>({name:rate+"%",points:years.map(y=>[y,value(active,rate,y)])}));
  title=isE?"同一个行业，三条增长路径":"同一投资基期，三条恢复路径";sub=isE?"以产值报道下限为基期，其他条件保持不变。":"以2026年前三季度同期指数55.3为起点；不是产能预测。";
  html=chartLines(series,0,isE?1000:100);
  $("rvCurveLegend").innerHTML=rates.map((r,i)=>'<span><i style="background:'+["#84bed9","#227fd9","#8d79d0"][i]+'"></i>'+f(r,1)+'%情景</span>').join("");
  note="两侧仅是增长率扰动条件，不是概率区间；没有给每条情景分配发生概率。";
 }else if(active==="tea"){
  title="100元终端销售额，在哪些环节形成价值？";sub="假设种植增值23元，加工32元，渠道25元，外部中间投入20元；非柏塘实测。";
  const parts=[["种植增值",23,"#1885d5"],["加工增值",32,"#1db1a4"],["渠道增值",25,"#9478d8"],["中间投入",20,"#9aaac1"]];
  let x=0;html='<div class="rv-stacked">'+parts.map(p=>'<span style="width:'+p[1]+'%;background:'+p[2]+'" title="'+p[0]+p[1]+'元">'+p[1]+'</span>').join("")+'</div><div class="rv-sector-legend">'+parts.map(p=>'<span>'+p[0]+' '+p[1]+'元</span>').join("")+'</div>';
  const kept=[23,32*v1/100,25*v2/100,20],local=kept[0]+kept[1]+kept[2];
  html+='<div class="rv-flow"><div class="rv-flow-node"><small>每100元销售额</small><b>100元</b></div><span class="rv-flow-arrow"></span><div class="rv-flow-node"><small>增加值合计</small><b>80元</b></div><span class="rv-flow-arrow"></span><div class="rv-flow-node"><small>本地增值</small><b>'+f(local,1)+'元</b></div></div>';
  $("rvCurveLegend").innerHTML="";
  note="本地留存按经营主体发生地示意；外部中间投入和本地增加值不应混作同一概念。";
 }else if(active==="ring"){
  title="100名游客的消费，怎么留下来？";sub="当日游90元、过夜600元是示例假设，不能当作博罗实测人均消费。";
  const total=(100-v1)*90+v1*600,local=total*v2/100;
  html='<div class="rv-flow"><div class="rv-flow-node"><small>100位游客</small><b>'+v1+'人过夜</b></div><span class="rv-flow-arrow"></span><div class="rv-flow-node"><small>总消费示例</small><b>'+f(total,0)+'元</b></div><span class="rv-flow-arrow"></span><div class="rv-flow-node"><small>本地经营留存代理</small><b>'+f(local,0)+'元</b></div></div>';
  html+='<div class="rv-stacked"><span style="background:#1e8dd2;width:'+(100-v1)+'%" title="当日游">'+(100-v1)+'人当日游</span><span style="background:#8675d5;width:'+v1+'%" title="过夜游客">'+v1+'人过夜</span></div>';
  $("rvCurveLegend").innerHTML="";note="留存消费是代理量，不是经严格中间投入扣除后的地区增加值。";
 }else{
  title="转型覆盖和绩效证明，差了哪些环节？";sub="652家实施数字化转型是覆盖口径，不是转型效果。";
  const pct=652/1407*100;
  html='<div class="rv-donut-layout"><svg viewBox="0 0 205 205" role="img" aria-label="652家覆盖，755家其他规上企业"><circle cx="100" cy="100" r="72" stroke="#e6eef7" stroke-width="23" fill="none"/><circle cx="100" cy="100" r="72" stroke="#2180d8" stroke-width="23" fill="none" stroke-dasharray="'+(452.4*pct/100)+' 452.4" transform="rotate(-90 100 100)" stroke-linecap="round"/><text x="100" y="101" text-anchor="middle" style="font-size:32px;fill:#1972bd;font-weight:900">'+f(pct,1)+'%</text><text x="100" y="121" text-anchor="middle">实施覆盖率</text></svg><div><div class="rv-metric"><span>实施数字化转型</span><strong>652 家</strong></div><div class="rv-metric" style="margin-top:8px"><span>其他规上工业企业</span><strong>755 家</strong></div></div></div>';
  html+='<div class="rv-steps"><div class="rv-step done">企业数量 ✓</div><div class="rv-step">抽样回访 ?</div><div class="rv-step">经营指标 ?</div><div class="rv-step">可比对照 ?</div><div class="rv-step">绩效识别 ?</div></div>';
  $("rvCurveLegend").innerHTML="";note="覆盖状态已知；样本、对照组和经营绩效仍待收集。";
 }
 $("rvCurveTitle").textContent=title;$("rvCurveSub").textContent=sub;$("rvCurves").innerHTML=html;$("rvCurveNote").textContent=note;
}
function bullet(){
 let top,goal,achieved,desc,name,mode;
 if(active==="electronic"){
  const x=value(active,v1,2030);top=Math.max(1350,x*1.12);goal=1000;achieved=x;name="2030产值条件值 / 千亿参照线";desc="1000亿是产业规模参照，不是已核验的正式2030年度考核达成率。";mode="target";
 }else if(active==="projects"){
  top=Math.max(140,value(active,v1,2030)*1.1);goal=100;achieved=value(active,v1,2030);name="2030年同季投资恢复指数";desc="2025年前三季度为100的比较尺，不是产能或规划目标。";mode="target";
 }else if(active==="tea"){
  top=100;goal=null;achieved=value(active,v1,v2);name="每100元销售额：本地增值条件值";desc="暂无统一可核实的柏塘茶产业2030本地增值目标。";mode="open";
 }else if(active==="ring"){
  top=(100-v1)*90+v1*600;goal=null;achieved=value(active,v1,v2);name="每100位游客：本地消费留存代理";desc="暂无可比的官方2030本地消费留存目标；不能计算达成率。";mode="open";
 }else{
  top=25;goal=null;achieved=value(active,v1);name="拟抽样调查：95%最大误差半宽";desc="这是研究设计精度，不是数字化转型的绩效或目标达成率。";mode="precision";
 }
 const pct=bounded(achieved/top*100,0,100);
 let html='<div class="rv-metric"><span>'+esc(name)+'</span><strong>'+f(achieved,active==="ring"?0:1)+(active==="electronic"?"亿元":active==="ring"?"元":active==="innovation"?"pp":active==="tea"?"元":"指数")+'</strong></div>';
 html+='<div class="rv-progress" style="margin:14px 0 7px"><i style="width:'+pct+'%;'+(mode==="open"?'background:#1db5a7':mode==="precision"?'background:#7f8fd3':'')+'"></i>'+(mode==="target"?'<span class="rv-target-marker" style="left:'+f(100*goal/top,2)+'%" aria-hidden="true"></span>':'')+'</div>';
 html+='<div class="rv-toolbar"><b>'+esc(mode==="target"?"参照线："+f(goal,0):mode==="precision"?"数字越小，拟调查比例估计越精细":"只看条件分解，不显示官方目标率")+'</b><button id="rvMethodBtn" type="button">说明 ↗</button></div>';
 if(mode==="target"){
  const gap=achieved-goal;
  html+='<div class="rv-summary"><div class="rv-metric"><span>相对参照线差额</span><strong style="font-size:21px;color:'+(gap<0?"#c96d57":"#1a927c")+'">'+(gap>=0?"+":"")+f(gap,1)+'</strong></div><div class="rv-metric"><span>参照线不是概率</span><strong style="font-size:17px">未估计概率</strong></div></div>';
 }else if(mode==="precision"){
  html+='<div class="rv-alert">未取得企业经营绩效与对照组，SEM路径系数和转型成效均不可估计。</div>';
 }else{
  html+='<div class="rv-alert">情景参数可探索机制，但不得转述为博罗实际达成率或真实收益。</div>';
 }
 $("rvBulletTitle").textContent="关键边界：什么算得到，什么还算不到";
 $("rvBullet").innerHTML=html;
 $("rvBullet").querySelector("#rvMethodBtn").onclick=()=>$("methodBtn").click();
 $("rvBulletNote").textContent=desc;
}
function sensitivity(){
 let items=[],base,unit,label;
 if(active==="electronic"){
  base=value(active,v1,2030);unit="亿元";label="2030产值变化量";
  items=[["增速+1个百分点",value(active,bounded(v1+1,-5,15),2030)-base],["增速−1个百分点",value(active,bounded(v1-1,-5,15),2030)-base],["增速+3个百分点",value(active,bounded(v1+3,-5,15),2030)-base],["增速−3个百分点",value(active,bounded(v1-3,-5,15),2030)-base]];
 }else if(active==="projects"){
  base=value(active,v1,2030);unit="指数点";label="2030投资指数变化量";
  items=[["回升增速+5个百分点",value(active,bounded(v1+5,-5,35),2030)-base],["回升增速−5个百分点",value(active,bounded(v1-5,-5,35),2030)-base],["回升增速+10个百分点",value(active,bounded(v1+10,-5,35),2030)-base],["回升增速−10个百分点",value(active,bounded(v1-10,-5,35),2030)-base]];
 }else if(active==="tea"){
  base=value(active,v1,v2);unit="元/100元";label="本地增值变化量";
  items=[["加工留存+10个百分点",value(active,bounded(v1+10,0,100),v2)-base],["加工留存−10个百分点",value(active,bounded(v1-10,0,100),v2)-base],["渠道留存+10个百分点",value(active,v1,bounded(v2+10,0,100))-base],["渠道留存−10个百分点",value(active,v1,bounded(v2-10,0,100))-base]];
 }else if(active==="ring"){
  base=value(active,v1,v2);unit="元/100游客";label="本地消费代理变化量";
  items=[["过夜率+10个百分点",value(active,bounded(v1+10,0,70),v2)-base],["过夜率−10个百分点",value(active,bounded(v1-10,0,70),v2)-base],["本地留存+10个百分点",value(active,v1,bounded(v2+10,0,100))-base],["本地留存−10个百分点",value(active,v1,bounded(v2-10,0,100))-base]];
 }else{
  base=value(active,v1);unit="pp";label="最大误差半宽的变化量";
  items=[["再调查+50家",value(active,bounded(v1+50,20,250))-base],["减少调查50家",value(active,bounded(v1-50,20,250))-base],["再调查+100家",value(active,bounded(v1+100,20,250))-base],["减少调查100家",value(active,bounded(v1-100,20,250))-base]];
 }
 const max=Math.max(...items.map(x=>Math.abs(x[1])),1);
 let svg='<svg viewBox="0 0 675 244" role="img" aria-label="每个条件变化对结果的影响"><title>一次只调整一个变量，显示有界情景敏感性，不是回归系数</title>';
 const x0=342,scale=230/max;
 svg+='<line x1="'+x0+'" y1="10" x2="'+x0+'" y2="216" class="rv-zero"/>';
 items.forEach((p,i)=>{
  const y=32+i*50,n=p[1],w=Math.abs(n)*scale;
  svg+='<text x="185" y="'+(y+5)+'" text-anchor="end">'+esc(p[0])+'</text>';
  svg+='<rect x="'+(n<0?x0-w:x0)+'" y="'+(y-13)+'" width="'+Math.max(w,1)+'" height="27" rx="6" fill="'+(n<0?"#e3a194":"#3c9edc")+'"/>';
  svg+='<text x="'+(n<0?x0-w-8:x0+w+8)+'" y="'+(y+5)+'" text-anchor="'+(n<0?"end":"start")+'" class="rv-emph">'+(n>=0?"+":"")+f(n,1)+'</text>';
 });
 svg+='<text x="'+x0+'" y="234" text-anchor="middle" class="rv-annot">0 · '+esc(unit)+'</text></svg>';
 $("rvSensitivityTitle").textContent="只改一个条件，结果改变多少？";
 $("rvSensitivitySub").textContent=label+"。一次只改一个变量，不是因果系数。";
 $("rvSensitivity").innerHTML=svg;
 $("rvSensitivityNote").textContent="上方结果均来自当前假设计算，参数变化不代表真实政策效果。";
}
const readiness=[
 ["电子信息",["seen","partial","missing","missing"],"electronic"],
 ["工业接续",["seen","partial","missing","missing"],"projects"],
 ["柏塘春茶",["partial","missing","missing","missing"],"tea"],
 ["环两山",["partial","missing","missing","missing"],"ring"],
 ["创新转化",["seen","missing","missing","missing"],"innovation"]
];
function evidence(){
 const th=["专题","统计起点","数值参照","过程数据","目标完成率"];
 let html='<table aria-label="五个专题数据可用程度"><thead><tr>'+th.map(x=>'<th>'+x+'</th>').join("")+'</tr></thead><tbody>';
 readiness.forEach(row=>{
  html+='<tr><td><button type="button" class="rv-button" data-ready="'+row[2]+'">'+row[0]+'</button></td>';
  row[1].forEach(a=>html+='<td class="'+a+'" title="'+(a==="seen"?"已核实公开统计":a==="partial"?"部分公开线索或条件参照":"缺少可核对数据")+'">'+(a==="seen"?"●":a==="partial"?"◐":"—")+'</td>');
  html+='</tr>';
 });
 html+='</tbody></table>';
 $("rvEvidence").innerHTML=html;
 $("rvEvidence").querySelectorAll("[data-ready]").forEach(b=>b.onclick=()=>document.querySelector('[data-case="'+b.dataset.ready+'"]')?.click());
}
function render(){
 heat();curve();bullet();sensitivity();
 $("rvSource").textContent=sourceLabels();
}
document.querySelectorAll("[data-quick-case]").forEach(b=>b.addEventListener("click",()=>document.querySelector('[data-case="'+b.dataset.quickCase+'"]')?.click()));
document.addEventListener("risk-lab:render",reset);
evidence();reset();
})();