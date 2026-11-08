(()=>{"use strict";
const root=document.getElementById("riskVisuals");if(!root)return;
const $=id=>document.getElementById(id);
const motion=window.RiskMotion,lab=window.RiskLab;
let inspected=null,curveState=null,sensitivityItems=[],topicChanged=true;
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
function reset(event){
 const snapshot=lab.getState(),next=snapshot.case;
 topicChanged=active!==next||!curveState;
 if(topicChanged)inspected=null;
 active=next;v1=snapshot.values[0];v2=snapshot.values[1]??20;
 document.querySelectorAll("[data-quick-case]").forEach(b=>{const on=b.dataset.quickCase===active;b.classList.toggle("active",on);b.setAttribute("aria-pressed",String(on));});
 render();
 if(topicChanged)motion.reveal("rvCurves");
}
const value=(id,a,b)=>{
 if(id==="electronic")return models.electronic.base*Math.pow(1+a/100,b-2025);
 if(id==="projects")return b<=2025?100:models.projects.base*Math.pow(1+a/100,b-2026);
 if(id==="tea")return 23+32*a/100+25*b/100;
 if(id==="ring")return ((100-a)*90+a*600)*b/100;
 if(id==="innovation"){let z=lab.zScores[b??v2],N=652,n=a;return 100*z*Math.sqrt(.25/n)*Math.sqrt((N-n)/(N-1))}
 return 0;
};
function sourceLabels(){return {electronic:"2025年产值报道下限 + 用户假设",projects:"2025同期指数100；2026=55.3",tea:"每100元销售额的假设分解",ring:"每100位游客的消费假设",innovation:"652家总体中的待核验企业记录"}[active]}
function cellTitle(id,a,b,num){
 if(id==="electronic")return "年均增长 "+a+"%；"+b+"年下限情景产值 "+f(num,1)+"亿元";
 if(id==="projects")return "增长 "+a+"%；"+b+"年同季投资指数 "+f(num,1);
 if(id==="tea")return "加工本地留存 "+b+"%，渠道本地留存 "+a+"%；销售额中本地增值 "+f(num,1)+"%";
 if(id==="ring")return "过夜游客 "+b+"人/100人，本地留存 "+a+"%；本地消费代理 "+f(num,0)+"元";
 return "拟核验"+b+"家，"+a+"%条件下可能的样本差异 "+f(num,1)+"个百分点";
}
function heatDetails(){
 let rows=[],cols=[],compute,goal,click,title,sub;
 if(active==="electronic"){
 rows=[-5,0,3,5,8,12];cols=[2025,2026,2027,2028,2029,2030];
 compute=(r,k)=>value(active,r,k);goal=x=>x>=1000;click=(r,k)=>{inspected=k;lab.setValues([r],"heat");curve();heat();};
 title="哪个增速 × 哪一年，可以跨过1000亿？";sub="以2025年报道的773.8亿元下限为基期；横向看年份、纵向换增长条件。";
 }else if(active==="projects"){
 rows=[-5,0,5,10,20,30];cols=[2025,2026,2027,2028,2029,2030];
 compute=(r,k)=>value(active,r,k);goal=x=>x>=100;click=(r,k)=>{inspected=k;lab.setValues([r],"heat");curve();heat();};
 title="投资恢复，是时间问题还是增长条件问题？";sub="2025同期=100；2026同期=55.3。颜色只表示是否恢复参照水平。";
 }else if(active==="tea"){
 rows=[0,20,40,60,80,100];cols=[0,20,35,60,80,100];
 compute=(r,k)=>value(active,k,r);goal=x=>x>=60;click=(r,k)=>lab.setValues([k,r],"heat");
 title="加工、渠道分别留在本地多少？";sub="横轴加工留存、纵轴渠道留存；数字为每100元销售额本地增值（假设）。";
 }else if(active==="ring"){
 rows=[0,20,40,60,80,100];cols=[0,15,30,45,60,70];
 compute=(r,k)=>value(active,k,r);goal=x=>x>=14000;click=(r,k)=>lab.setValues([k,r],"heat");
 title="住下来 × 钱留下，哪个更关键？";sub="横轴每百名游客过夜人数，纵轴本地留存比例；格内为百游客本地消费代理（百元）。";
 }else{
 rows=[80,85,90,95,99,99.5];cols=[20,60,80,120,180,240];

 compute=(r,n)=>value(active,n,lab.confidence.indexOf(r));goal=x=>x<=8;click=(r,n)=>lab.setValues([n,lab.confidence.indexOf(r)],"heat");
 title="抽多少家，估计误差才能缩小？";sub="拟随机抽样，不是已测量绩效；纵轴置信水平，横轴样本量。";
 }
 return {rows,cols,compute,goal,click,title,sub};
}
function setSlider(id,value){lab.setValues(id==="slider"?[value]:[undefined,value],"heat");}
function heat(){
 const H=heatDetails();$("rvHeatTitle").textContent=H.title;$("rvHeatSub").textContent=H.sub;
 let html='<div class="rv-heat"><div class="rv-tick"></div>'+H.cols.map(k=>'<div class="rv-tick">'+k+(active==="tea"||active==="ring"?"%":active==="innovation"?"家":"")+'</div>').join("");
 for(const row of H.rows){
   html+='<div class="rv-ylabel">'+row+(active==="tea"||active==="ring"||active==="innovation"?"%":"%")+'</div>';
   for(const col of H.cols){
    const n=H.compute(row,col);
    const label=active==="ring"?f(n/100,0):f(n,active==="innovation"?1:0);
    const mode=(active==="electronic"||active==="projects")?(H.goal(n)?"pass":"fail"):(active==="tea"?((n-23)/57):(active==="ring"?(n/44700):(1-bounded((n-5)/30,0,1))))>=.66?"highdata":(active==="tea"?((n-23)/57):(active==="ring"?(n/44700):(1-bounded((n-5)/30,0,1))))>=.33?"mediumdata":"lowdata";
    const selected=(active==="electronic"||active==="projects")&&v1===row&&col===(inspected??2030)||active==="tea"&&v1===col&&v2===row||active==="ring"&&v1===col&&v2===row||active==="innovation"&&v1===col&&row===lab.confidence[v2];
    html+='<button class="rv-cell '+mode+(selected?' active':'')+'" aria-pressed="'+selected+'" data-r="'+row+'" data-c="'+col+'" title="'+esc(cellTitle(active,row,col,n))+'" aria-label="'+esc(cellTitle(active,row,col,n))+'">'+label+'</button>';
   }
 }
 html+='</div>';
 motion.html("rvHeat",html,false);

 const legend=active==="electronic"?"绿色：跨越1000亿参照线；红色：未跨":active==="projects"?"绿色：投资指数恢复至100；红色：未恢复":active==="innovation"?"深蓝代表更小的拟议抽样误差；没有合格阈值":"颜色仅用于区分条件场景的数值大小；不表示产业风险或达成度";
 $("rvHeatLegend").textContent=legend;
$("rvLegend").innerHTML=(active==="electronic"||active==="projects")?'<span><i class="rv-key" style="background:#1e8f79"></i>跨越参照</span><span><i class="rv-key" style="background:#e4a081"></i>未跨参照</span>':'<span><i class="rv-key" style="background:#72bbdb"></i>相对高值</span><span><i class="rv-key" style="background:#eaf2fb"></i>相对低值</span><span>无实测目标</span>';
}
function chartLines(series,minOverride,target,unit="亿元",samples=false){
 const narrow=matchMedia("(max-width:760px)").matches,width=narrow?520:740,height=310,left=58,right=width-58,bottom=251,top=28,labels=series[0].points.map(p=>p[0]);
 const all=series.flatMap(s=>s.points.map(p=>p[1])).concat(Number.isFinite(target)?[target]:[]);
 const hi=Math.max(...all,1)*1.18,lo=Math.min(0,...all),x=i=>left+(samples?(labels[i]-20)/230:i/(labels.length-1))*(right-left),y=n=>bottom-(n-lo)/(hi-lo)*(bottom-top);
 const index=Math.max(0,labels.indexOf(inspected??labels[labels.length-1]));
 curveState={series,labels,unit,samples,index,x,y};
 let svg='<svg viewBox="0 0 '+width+' '+height+'" role="group" aria-label="可点选的三条假设路径">';
 svg+='<text x="'+left+'" y="13" class="rv-annot">'+esc(unit)+'</text>';
 for(let i=0;i<=4;i++){
  const n=lo+(hi-lo)*i/4,yy=y(n);
  svg+='<line x1="'+left+'" x2="'+right+'" y1="'+yy+'" y2="'+yy+'" class="rv-gridline"/><text x="46" y="'+(yy+4)+'" text-anchor="end">'+f(n,samples?1:0)+'</text>';
 }
 if(Number.isFinite(target))svg+='<line x1="'+left+'" x2="'+right+'" y1="'+y(target)+'" y2="'+y(target)+'" class="rv-target"/><text x="'+right+'" y="'+(y(target)-9)+'" text-anchor="end" class="target-label">参照 '+f(target,0)+'</text>';
 svg+='<line class="rv-cursor" x1="'+x(index)+'" x2="'+x(index)+'" y1="'+top+'" y2="'+bottom+'"/>';
 series.forEach((s,j)=>{
  const points=s.points.map((p,i)=>x(i)+','+y(p[1])).join(' '),color=['#8ba5b8','#1675d1','#9578c9'][j];
  svg+='<polyline points="'+points+'" class="'+(j===1?'rv-trace':j===0?'rv-trace2':'rv-trace3')+'"/>';
  s.points.forEach((p,i)=>{svg+='<circle cx="'+x(i)+'" cy="'+y(p[1])+'" r="'+(j===1?4.5:2.5)+'" fill="'+color+'" stroke="#fff" stroke-width="1.5"/>';});
 });
 labels.forEach((label,i)=>{
  const yy=y(series[1].points[i][1]);
  svg+='<g class="rv-year-hit" data-inspect="'+i+'" role="button" tabindex="0" aria-label="查看'+label+(samples?'家抽样精度':'年三种条件值')+'" aria-pressed="'+(index===i)+'"><rect x="'+(x(i)-24)+'" y="'+top+'" width="48" height="'+(bottom-top+40)+'" fill="transparent"/><circle class="rv-hit-dot" cx="'+x(i)+'" cy="'+yy+'" r="'+(i===index?8:5)+'" fill="#1675d1" stroke="#fff" stroke-width="3"/><text x="'+x(i)+'" y="280" text-anchor="middle">'+label+'</text></g>';
 });
 if(samples){
  const xx=left+(v1-20)/230*(right-left),yy=y(value('innovation',v1,v2));
  svg+='<circle cx="'+xx+'" cy="'+yy+'" r="8" fill="#1675d1" stroke="#fff" stroke-width="3"/><text x="'+xx+'" y="'+Math.max(20,yy-17)+'" text-anchor="middle" class="rv-emph">当前 '+v1+'家</text>';
 }
 return svg+'</svg>';
}
function inspector(){
 if(!curveState)return;
 const {series,labels,unit,samples,index}=curveState;
 const label=labels[index];
 const chips=series.map((s,i)=>'<span class="inspect-series s'+i+'"><i></i>'+esc(s.name)+' <b>'+f(s.points[index][1],samples?1:1)+'</b></span>').join('');
 motion.html('curveInspector','<strong>'+label+(samples?'家':'年')+'</strong>'+chips+'<small>'+esc(unit)+'</small>',false);
}
function bindCurve(){
 $('rvCurves').querySelectorAll('[data-inspect]').forEach(node=>{
  const inspect=()=>{const i=+node.dataset.inspect;if(curveState.index===i)return;inspected=curveState.labels[i];curve();heat();};
  node.onpointerenter=inspect;node.onfocus=inspect;
  node.onclick=()=>{inspect();if(curveState.samples)lab.setValues([curveState.labels[+node.dataset.inspect]],'curve');};
  node.onkeydown=event=>{
   if(event.key==='Enter'||event.key===' '){event.preventDefault();node.onclick();}
   if(event.key==='ArrowLeft'||event.key==='ArrowRight'){
    event.preventDefault();const nodes=[...$('rvCurves').querySelectorAll('[data-inspect]')],i=bounded(+node.dataset.inspect+(event.key==='ArrowRight'?1:-1),0,nodes.length-1);nodes[i].focus();
   }
  };
 });
}
function ribbon(x1,x2,y1,y2,h1,h2){
 const middle=(x1+x2)/2;
 return 'M '+x1+' '+y1+' C '+middle+' '+y1+' '+middle+' '+y2+' '+x2+' '+y2+' L '+x2+' '+(y2+h2)+' C '+middle+' '+(y2+h2)+' '+middle+' '+(y1+h1)+' '+x1+' '+(y1+h1)+' Z';
}
function valueFlow(total,local,tea){
 const fraction=total?local/total:0,H=145,kept=H*fraction,other=H-kept;
 const a=tea?'本地增值':'本地消费留存代理',otherLabel=tea?'本地以外 / 中间投入':'其他消费份额';
 const values=tea?[['种植',23],['加工',32*v1/100],['渠道',25*v2/100]]:[];
 let svg='<svg viewBox="0 0 740 310" role="group" aria-label="'+(tea?'每100元销售额的假设价值分流':'每100游客的假设消费分流')+'">';
 svg+='<text x="35" y="27" class="flow-title">'+(tea?'100元销售额':'100位游客 · 假设消费')+'</text>';
 svg+='<text x="35" y="53" class="flow-amount">'+f(total,tea?0:0)+'元</text>';
 svg+='<path d="'+ribbon(160,507,78,78,kept,kept)+'" fill="#b8d9f6" class="flow-ribbon"/><path d="'+ribbon(160,507,78+kept,112+kept,other,other)+'" fill="#e1e7ee" class="flow-ribbon"/>';
 svg+='<rect x="143" y="78" width="17" height="145" rx="4" fill="#4b8dca"/><rect x="507" y="78" width="17" height="'+kept+'" rx="4" fill="#1675d1"/><rect x="507" y="'+(112+kept)+'" width="17" height="'+other+'" rx="4" fill="#a4b5c6"/>';
 const arrowY=78+kept/2;
 svg+='<path d="M 167 '+arrowY+' C 295 '+arrowY+' 380 '+arrowY+' 496 '+arrowY+'" class="flow-travel"/>';
 svg+='<g role="button" tabindex="0" class="flow-hit" data-flow="local" aria-label="查看'+a+'的计算"><rect x="145" y="72" width="380" height="'+Math.max(kept,24)+'" fill="transparent"/><text x="540" y="91" class="flow-label">'+a+'</text><text x="540" y="122" class="flow-amount">'+f(local,1)+'元</text></g>';
 svg+='<g role="button" tabindex="0" class="flow-hit" data-flow="other" aria-label="查看'+otherLabel+'"><rect x="145" y="'+(112+kept)+'" width="380" height="'+Math.max(other,16)+'" fill="transparent"/><text x="540" y="'+(132+kept)+'" class="flow-label">'+otherLabel+'</text><text x="540" y="'+(160+kept)+'" class="flow-secondary">'+f(total-local,1)+'元</text></g>';
 if(tea)svg+='<text x="35" y="294" class="rv-annot">23元种植 + '+f(32*v1/100,1)+'元加工 + '+f(25*v2/100,1)+'元渠道 ＝ 本地增值</text>';
 else svg+='<text x="35" y="294" class="rv-annot">'+(100-v1)+'人当日游 × 90元 + '+v1+'人过夜 × 600元 ＝ 总消费</text>';
 return svg+'</svg>';
}
function curve(){
 let title,sub,html,note,series,unit;
 const isE=active==='electronic';
 if(isE||active==='projects'){
  const rates=isE?[bounded(v1-3,-5,15),v1,bounded(v1+3,-5,15)]:[bounded(v1-5,-5,35),v1,bounded(v1+5,-5,35)];
  const years=isE?[2025,2026,2027,2028,2029,2030]:[2026,2027,2028,2029,2030];
  series=rates.map(rate=>({name:f(rate,1)+'%情景',points:years.map(y=>[y,value(active,rate,y)])}));
  title=isE?'同一起点，增长条件拉开多大差距？':'投资要恢复，需要多强的回升？';sub=isE?'实色为当前条件，另外两条为增速上下扰动。':'2026同季投资指数55.3为起点；2025同期＝100。';
  unit=isE?'亿元 · 条件值':'同季投资指数';html=chartLines(series,0,isE?1000:100,unit);
  note='所示路径来自增长假设，不是预测区间；参照线不代表达成概率。';
  $('curveHint').textContent='点年份 · 看三条路径读数';
 }else if(active==='tea'||active==='ring'){
  const tea=active==='tea',total=tea?100:(100-v1)*90+v1*600,local=tea?value(active,v1,v2):total*v2/100;
  title=tea?'同样卖100元，本地能留下多少？':'游客来了，钱在哪一环留下？';
  sub=tea?'演示核算 · 加工和渠道留存一变，蓝色价值流随之改变。':'演示核算 · 改变过夜比例和本地留存，观察消费分流。';
  html=valueFlow(total,local,tea);curveState=null;
  $('rvCurveLegend').innerHTML='<span><i style="background:#1675d1"></i>本地条件值</span><span><i style="background:#a4b5c6"></i>其他份额</span>';
  note=tea?'种植23、加工32、渠道25、中间投入20元为演示假设，非柏塘实测。':'当日游90元、过夜600元是演示假设；消费留存代理不等于地区增加值。';
  $('curveHint').textContent='点蓝色流带 · 看计算分解';
  motion.html('curveInspector','<strong>演示假设</strong><span>改变右侧两个比例，看价值流怎么分。</span>',false);
 }else{
  const confs=[v2===0?1:0,v2,v2===5?3:5],ns=[20,60,80,120,180,240,250];
  series=confs.map(ci=>({name:lab.confidence[ci]+'%置信',points:ns.map(n=>[n,value('innovation',n,ci)])}));
  title='查更多企业，估计能精细多少？';sub='652家是拟抽样总体；曲线比较置信水平，尚无转型绩效调查。';
  if(inspected===null)inspected=v1;
  unit='误差半宽 · 百分点';html=chartLines(series,0,null,unit,true);
  note='简单随机抽样、最坏情形比例p＝0.5，含有限总体修正；未计非响应偏差。';
  $('curveHint').textContent='点样本量 · 直接切换调查规模';
 }
 if(series)$('rvCurveLegend').innerHTML=series.map((s,i)=>'<span><i style="background:'+['#8ba5b8','#1675d1','#9578c9'][i]+'"></i>'+esc(s.name)+'</span>').join('');
 $('rvCurveTitle').textContent=title;$('rvCurveSub').textContent=sub;$('rvCurveNote').textContent=note;
 motion.html('rvCurves',html,!topicChanged);
 if(curveState){inspector();bindCurve();}
 else $('rvCurves').querySelectorAll('[data-flow]').forEach(node=>{
  const inspect=()=>{
   const local=node.dataset.flow==='local',tea=active==='tea',total=tea?100:(100-v1)*90+v1*600,amount=value(active,v1,v2);
   const description=local?(tea?'23 + 32 × '+v1+'% + 25 × '+v2+'% ＝ '+f(amount,1)+'元':f(total,0)+'元 × '+v2+'% ＝ '+f(amount,1)+'元'):(tea?'100 − '+f(amount,1)+' ＝ '+f(100-amount,1)+'元，含外部中间投入20元':f(total,0)+' − '+f(amount,1)+' ＝ '+f(total-amount,1)+'元');
   motion.html('curveInspector','<strong>'+(local?'本地条件值':'其他份额')+'</strong><span>'+esc(description)+'</span>',false);
  };
  node.onpointerenter=inspect;node.onfocus=inspect;node.onclick=inspect;node.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();inspect();}};
 });
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
  top=25;goal=null;achieved=value(active,v1);name="拟抽样调查："+lab.confidence[v2]+"%最大误差半宽";desc="这是研究设计精度，不是数字化转型的绩效或目标达成率。";mode="precision";
 }
 const pct=bounded(achieved/top*100,0,100);
 let html='<div class="rv-metric"><span>'+esc(name)+'</span><strong>'+f(achieved,active==="ring"?0:1)+(active==="electronic"?"亿元":active==="ring"?"元":active==="innovation"?"pp":active==="tea"?"元":"指数")+'</strong></div>';
 html+='<div class="rv-progress" style="margin:14px 0 7px"><i style="width:'+pct+'%;'+(mode==="open"?'background:#1db5a7':mode==="precision"?'background:#7f8fd3':'')+'"></i>'+(mode==="target"?'<span class="rv-target-marker" style="left:'+f(100*goal/top,2)+'%" aria-hidden="true"></span>':'')+'</div>';
 html+='<div class="rv-toolbar"><b>'+esc(mode==="target"?"参照线："+f(goal,0):mode==="precision"?"数字越小，拟核验比例估计越精细":"只看条件分解，不显示官方目标率")+'</b><button id="rvMethodBtn" type="button">说明 ↗</button></div>';
 if(mode==="target"){
  const gap=achieved-goal;
  html+='<div class="rv-summary"><div class="rv-metric"><span>相对参照线差额</span><strong style="font-size:21px;color:'+(gap<0?"#c96d57":"#1a927c")+'">'+(gap>=0?"+":"")+f(gap,1)+'</strong></div><div class="rv-metric"><span>参照线不是概率</span><strong style="font-size:17px">未估计概率</strong></div></div>';
 }else if(mode==="precision"){
  html+='<div class="rv-alert">未取得可比的企业经营数据，当前不能核算真实转型成效。</div>';
 }else{
  html+='<div class="rv-alert">情景参数可探索机制，但不得转述为博罗实际达成率或真实收益。</div>';
 }
 $("rvBulletTitle").textContent=(active==="electronic"||active==="projects")?"距离参照线，还差多少？":"这个结果，能解释到哪一步？";
 motion.html("rvBullet",html,!topicChanged);
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
 const shifts=active==="electronic"?[1,-1,3,-3]:active==="projects"?[5,-5,10,-10]:active==="innovation"?[50,-50,100,-100]:[10,-10,10,-10];
 sensitivityItems=items.map((item,i)=>({label:item[0],values:(active==="tea"||active==="ring")&&i>1?[undefined,v2+shifts[i]]:[v1+shifts[i]]}));
 const max=Math.max(...items.map(x=>Math.abs(x[1])),1),x0=443,scale=156/max;
 let svg='<svg viewBox="0 0 740 250" role="group" aria-label="点击一条敏感性条，应用那个条件"><title>改变条件后的变化，不是现实成效</title><line x1="'+x0+'" y1="9" x2="'+x0+'" y2="217" class="rv-zero"/>';
 items.forEach((p,i)=>{
  const y=33+i*50,n=p[1],w=Math.abs(n)*scale;
  svg+='<g class="sensitivity-row" role="button" tabindex="0" data-change="'+i+'" aria-label="应用'+esc(p[0])+'"><rect class="sensitivity-hit" x="0" y="'+(y-23)+'" width="735" height="46" rx="8" fill="transparent"/><text x="233" y="'+(y+5)+'" text-anchor="end">'+esc(p[0])+'</text><rect class="sensitivity-bar" x="'+(n<0?x0-w:x0)+'" y="'+(y-12)+'" width="'+Math.max(w,1)+'" height="25" rx="5" fill="'+(n<0?'#b0bbc9':'#3a8ed6')+'"/><text x="'+(n<0?x0-w-9:x0+w+9)+'" y="'+(y+5)+'" text-anchor="'+(n<0?'end':'start')+'" class="rv-emph">'+(n>=0?'+':'')+f(n,1)+'</text></g>';
 });
 svg+='<text x="'+x0+'" y="239" text-anchor="middle" class="rv-annot">0 · '+esc(unit)+'</text></svg>';
 $("rvSensitivityTitle").textContent="只改这一项，差多少？";
 $("rvSensitivitySub").textContent=label+" · 点一条，直接应用那个条件。";
 motion.html("rvSensitivity",svg,!topicChanged);
 $("rvSensitivity").querySelectorAll('[data-change]').forEach(node=>{
  const apply=()=>lab.setValues(sensitivityItems[+node.dataset.change].values,'sensitivity');
  node.onclick=apply;node.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();apply();}};
 });
 $("rvSensitivityNote").textContent="每次改变一项情景条件；变化幅度不代表已证实的政策效果。";
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
  html+='<tr data-evidence-case="'+row[2]+'"><td><button type="button" class="rv-button" data-ready="'+row[2]+'">'+row[0]+'</button></td>';
  row[1].forEach((a,col)=>html+='<td class="'+a+'"><button type="button" class="evidence-cell" data-gap="'+row[2]+'" data-column="'+col+'" aria-label="查看'+row[0]+th[col+1]+'的证据状态">'+(a==="seen"?"●":a==="partial"?"◐":"—")+'</button></td>');
  html+='</tr>';
 });
 html+='</tbody></table><output id="rvEvidenceDetail" class="rv-evidence-detail" aria-live="polite">点一个证据格，查看它能支持什么。</output>';
 $("rvEvidence").innerHTML=html;
 $("rvEvidence").querySelectorAll("[data-ready]").forEach(b=>b.onclick=()=>lab.selectCase(b.dataset.ready));
 $("rvEvidence").querySelectorAll('[data-gap]').forEach(b=>b.onclick=()=>{
  const row=readiness.find(r=>r[2]===b.dataset.gap),column=+b.dataset.column,status=row[1][column];
  const detail=status==='seen'?'有公开数值起点，可作对应口径的条件核算。':status==='partial'?'有公开线索或条件参照，尚不足以认定实际目标达成度。':'缺少可核对数据，当前无法计算该项实测结果。';
  $("rvEvidenceDetail").textContent=row[0]+' · '+th[column+1]+'：'+detail;
 });
}
function render(){
 heat();curve();bullet();sensitivity();
 $("rvSource").textContent=sourceLabels();
 document.querySelectorAll("[data-evidence-case]").forEach(row=>row.classList.toggle("is-active",row.dataset.evidenceCase===active));
}
$("rvHeat").addEventListener("click",event=>{const cell=event.target.closest("[data-r]");if(cell)heatDetails().click(+cell.dataset.r,+cell.dataset.c);});
document.querySelectorAll("[data-quick-case]").forEach(b=>b.addEventListener("click",()=>document.querySelector('[data-case="'+b.dataset.quickCase+'"]')?.click()));
document.addEventListener("risk-lab:render",reset);
evidence();reset();
})();
