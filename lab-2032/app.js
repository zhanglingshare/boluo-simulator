/* 博罗2032公开Demo：浏览器本地运行，模拟数据而非真实企业与政策效应。 */
"use strict";
(function(){
const $=s=>document.querySelector(s),$$=s=>Array.from(document.querySelectorAll(s));
const KEYS=["primary","secondary","tertiary"],NAME=["第一产业","第二产业","第三产业"];
const COLOR=["#73d8b1","#4c90da","#e7ab63"],BASE={primary:107.44,secondary:549.01,tertiary:349};
const SCENARIOS={
 balanced:{name:"三次产业协同",delta:[0,0,0]},
 industrial:{name:"制造业升级",delta:[0,.017,.004]},
 agriculture:{name:"农业价值提升",delta:[.026,.004,.009]},
 service:{name:"生产性服务增强",delta:[.002,.007,.020]},
 stress:{name:"项目与人才承压",delta:[-.006,-.017,-.016]}
};
const EFFECTS={agriculture:[.023,.002,.003],manufacturing:[.001,.016,.004],services:[.001,.004,.019],talent:[0,.008,.011],project_delay:[0,-.014,-.004]};
const MTYPES=["电子信息","装备制造","新能源材料","食品加工","其他制造"],STYPES=["研发设计","检测认证","物流仓储","工业软件","商务服务"];
const ATYPES=["茶叶","蔬果","畜牧","其他农业"];
const TOWNS=["罗阳","园洲","石湾","龙溪","长宁","柏塘","福田","湖镇","龙华","杨村","泰美","公庄"];
const BLOCKS={SA:["SA1","SA2","SA3","SA4"],SU:["SU1","SU2","SU3"],OP:["OP1","OP2","OP3"]};
const modelPaths={"SA->SU":"服务可得性 → 实际使用","SA->OP":"服务可得性 → 经营表现","SU->OP":"实际使用 → 经营表现"};
const state={data:null,id:"BOLUO_2032_DEMO_V1",mode:"DEMO",scenario:"balanced",knobs:{},calc:null,network:null,model:null};
const format=x=>Number(x).toLocaleString("zh-CN",{maximumFractionDigits:1});
const pct=x=>(Number(x)*100).toFixed(1)+"%";
const escapeHTML=x=>String(x==null?"":x).replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
function seeded(seed){let a=seed>>>0;return function(){a+=0x6D2B79F5;let x=a;x=Math.imul(x^(x>>>15),x|1);x^=x+Math.imul(x^(x>>>7),x|61);return ((x^(x>>>14))>>>0)/4294967296}}
function normal(rng){return Math.sqrt(-2*Math.log(Math.max(1e-12,rng())))*Math.cos(2*Math.PI*rng())}
function clip(x,min,max){return Math.max(min,Math.min(max,x))}
function createDemo(){
 const rng=seeded(20321111),tables={macro:[],enterprise:[],survey:[],relation:[],project:[],worker:[]};
 for(let year=2020;year<=2025;year++){
  const age=2025-year;tables.macro.push({year,primary:+(BASE.primary/Math.pow(1.057,age)).toFixed(4),secondary:+(BASE.secondary/Math.pow(1.083,age)).toFixed(4),tertiary:+(BASE.tertiary/Math.pow(1.088,age)).toFixed(4),provenance:year===2025?"PUBLIC_REFERENCE_CHECK_PENDING":"SYNTHETIC_BACKCAST"});
 }
 for(const [sector,count,types,prefix] of [["manufacturing",300,MTYPES,"M"],["services",120,STYPES,"S"],["agriculture",80,ATYPES,"A"]]){
  for(let i=0;i<count;i++){const employees=Math.floor(clip(Math.exp((sector==="manufacturing"?3.5:2.9)+.7*normal(rng)),3,2200));
   tables.enterprise.push({enterprise_id:prefix+String(i+1).padStart(4,"0"),sector,subsector:types[i%types.length],town:TOWNS[i%TOWNS.length],employees,revenue_million:+(employees*(.35+.9*rng())).toFixed(3),provenance:"SYNTHETIC"});
  }
 }
 const mfg=tables.enterprise.filter(x=>x.sector==="manufacturing"),services=tables.enterprise.filter(x=>x.sector==="services"),agri=tables.enterprise.filter(x=>x.sector==="agriculture");
 for(let j=0;j<mfg.length;j++)for(let k=0;k<2;k++){
  const supplier=services[(j*17+k*31)%services.length];
  tables.relation.push({source_id:mfg[j].enterprise_id,target_id:supplier.enterprise_id,relation_type:"service_purchase",value_million:+(.05+3.95*rng()).toFixed(3),provenance:"SYNTHETIC"});
 }
 for(let j=0;j<agri.length;j++){tables.relation.push({source_id:agri[j].enterprise_id,target_id:mfg[(j*7)%mfg.length].enterprise_id,relation_type:"agricultural_supply",value_million:+(.05+1.95*rng()).toFixed(3),provenance:"SYNTHETIC"})}
 function likert(z){return Math.round(clip(4+1.1*z+.7*normal(rng),1,7))}
 for(const firm of mfg){
  const size=(Math.log(1+firm.employees)-3.5)/1.4,access=.2*size+.95*normal(rng),usage=.61*access+.13*size+.72*normal(rng),perf=.37*usage+.17*access+.2*size+.78*normal(rng);
  const row={respondent_id:"R"+firm.enterprise_id,enterprise_id:firm.enterprise_id,sector:"manufacturing",size_log:+Math.log(1+firm.employees).toFixed(5),provenance:"SYNTHETIC"};
  for(let i=1;i<=4;i++)row["SA"+i]=likert(access);
  for(let i=1;i<=3;i++){row["SU"+i]=likert(usage);row["OP"+i]=likert(perf)}
  tables.survey.push(row);
 }
 for(let j=0;j<30;j++)tables.project.push({project_id:"P"+String(j+1).padStart(3,"0"),sector:["manufacturing","services","agriculture"][j%3],stage:["signed","construction","commissioning","operating"][j%4],start_year:2025+j%4,investment_million:+(40+1160*rng()).toFixed(2),provenance:"SYNTHETIC"});
 for(let j=0;j<250;j++)tables.worker.push({respondent_id:"W"+String(j+1).padStart(4,"0"),sector:["manufacturing","services","agriculture"][j%3],commute_minutes:Math.floor(8+92*rng()),skills_gap:Math.ceil(5*rng()),monthly_pay_cny:Math.floor(3500+11500*rng()),provenance:"SYNTHETIC"});
 return tables;
}
function status(txt){$("#status").innerHTML='<span class="status-dot"></span>'+escapeHTML(txt)}
let toastTimer;
function toast(txt){const e=$("#toast");e.textContent=txt;e.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>e.hidden=true,5700)}
function quantile(sorted,q){const pos=(sorted.length-1)*q,lo=Math.floor(pos),hi=Math.ceil(pos);return sorted[lo]*(1-(pos-lo))+sorted[hi]*(pos-lo)}
function baseline(){const rows=state.data.macro.filter(x=>+x.year===2025);if(rows.length!==1)throw Error("宏观数据必须且只能包含一条2025年基准");const b=rows[0];const arr=KEYS.map(k=>Number(b[k]));if(arr.some(v=>!Number.isFinite(v)||v<=0))throw Error("2025产业增加值无效");const total=arr.reduce((a,b)=>a+b,0);return {values:arr,gdp:total,shares:arr.map(x=>x/total)}}
function rates(){
 const r=[.06,.073,.105].map((x,i)=>x+SCENARIOS[state.scenario].delta[i]);
 for(const [k,v] of Object.entries(state.knobs)){for(let i=0;i<3;i++)r[i]+=EFFECTS[k][i]*Number(v)}
 if(r.some(v=>v<=-.25||v>=.35))throw Error("情景增速假设超出允许区间");
 return r;
}
function simulate(){
 const b=baseline(),growth=rates(),rng=seeded(2032),runs=2000;
 const values=[[],[],[]],totals=[],shares=[[],[],[]];
 for(let i=0;i<runs;i++){
  const cur=b.values.slice();
  for(let year=2026;year<=2032;year++){
   const z1=normal(rng),z2=normal(rng),z3=normal(rng);
   const shocks=[.026*z1,.035*(.20*z1+Math.sqrt(1-.20*.20)*z2),.04*(.13*z1+.30*z2+Math.sqrt(1-.13*.13-.30*.30)*z3)];
   for(let j=0;j<3;j++)cur[j]*=1+clip(growth[j]+shocks[j],-.18,.30);
  }
  const total=cur.reduce((a,b)=>a+b,0);totals.push(total);
  for(let j=0;j<3;j++){values[j].push(cur[j]);shares[j].push(cur[j]/total)}
 }
 totals.sort((a,b)=>a-b);
 const parts=values.map((v,i)=>{v.sort((a,b)=>a-b);shares[i].sort((a,b)=>a-b);return {p10:quantile(v,.1),p50:quantile(v,.5),p90:quantile(v,.9),share:quantile(shares[i],.5)}});
 const count=Array(24).fill(0),min=totals[0],max=totals[totals.length-1];
 for(const value of totals){const idx=Math.min(23,Math.floor((value-min)/Math.max(max-min,1e-9)*24));count[idx]++}
 return {b,growth,runs,totals:{p10:quantile(totals,.1),p50:quantile(totals,.5),p90:quantile(totals,.9)},parts,hist:{counts:count,min,max},dataId:state.id,scene:state.scenario,mode:state.mode,seed:2032};
}
function stack(el,values){const t=values.reduce((a,b)=>a+b,0);el.innerHTML=values.map((v,i)=>'<span style="width:'+(100*v/t).toFixed(5)+'%;background:'+COLOR[i]+';color:'+(i===1?"white":"#16364a")+'">'+(v/t>.075?pct(v/t):"")+'</span>').join("")}
function drawHist(r){
 const {counts,min,max}=r.hist,hmax=Math.max(...counts),w=800,base=171;
 const rectangles=counts.map((v,i)=>{const barH=v/hmax*138;return '<rect x="'+(i*800/24+1).toFixed(1)+'" y="'+(base-barH).toFixed(1)+'" width="'+(800/24-2).toFixed(1)+'" height="'+barH.toFixed(1)+'" rx="2" fill="'+(i%2===0?"#3c8cc0":"#68b4d8")+'"/>'}).join("");
 let marks="";
 for(const [v,c] of [[r.totals.p10,"#a9d2db"],[r.totals.p50,"#e9ae6b"],[r.totals.p90,"#a9d2db"]]){
  const x=clip((v-min)/Math.max(max-min,1e-8)*800,0,800);
  marks+='<line x1="'+x+'" y1="4" x2="'+x+'" y2="171" stroke="'+c+'" stroke-dasharray="5 6" stroke-width="2"/>';
 }
 $("#histogram").innerHTML='<line x1="0" y1="171" x2="800" y2="171" stroke="#d9e8ec"/>'+rectangles+marks+'<text x="6" y="205" font-size="14" fill="#7995a4">'+format(min)+'亿</text><text x="793" y="205" text-anchor="end" font-size="14" fill="#7995a4">'+format(max)+'亿</text>';
}
function renderScenario(){
 const r=simulate();state.calc=r;
 $("#baseGdp").textContent=format(r.b.gdp);
 $("#resultGdp").textContent=format(r.totals.p50);
 $("#thirdShare").textContent=pct(r.parts[2].share);
 stack($("#barBase"),r.b.values);
 stack($("#barFuture"),r.parts.map(x=>x.p50));
 $("#sectorCards").innerHTML=r.parts.map((x,i)=>'<div class="sector-card"><small>'+NAME[i]+'</small><strong>'+format(x.p50)+'亿</strong><span>P10 '+format(x.p10)+' · P90 '+format(x.p90)+'</span></div>').join("");
 $("#p10").textContent=format(r.totals.p10)+"亿";$("#p50").textContent=format(r.totals.p50)+"亿";$("#p90").textContent=format(r.totals.p90)+"亿";
 drawHist(r);
 $("#runInfo").textContent=SCENARIOS[state.scenario].name+" · "+r.runs.toLocaleString()+"次独立扰动 · 固定种子2032";
 status((state.mode==="DEMO"?"完整合成Demo":"混合/未核实数据")+" · 情景已重新计算 · "+SCENARIOS[state.scenario].name);
}
function networkAnalysis(){
 const byId=new Map(state.data.enterprise.map(e=>[String(e.enterprise_id),e]));
 const demand=new Map(),edges=[],receivers=new Map(),counts={};
 let missed=0;
 for(const rel of state.data.relation){
  const source=byId.get(String(rel.source_id)),target=byId.get(String(rel.target_id)),amount=Number(rel.value_million);
  if(!source||!target||!Number.isFinite(amount)||amount<0){missed++;continue}
  edges.push(rel);counts[rel.relation_type]=(counts[rel.relation_type]||0)+1;
  receivers.set(target.enterprise_id,(receivers.get(target.enterprise_id)||0)+amount);
  if(target.sector==="services")demand.set(target.subsector,(demand.get(target.subsector)||0)+amount);
 }
 return {nodes:byId.size,edges:edges.length,missed,demand:[...demand].sort((a,b)=>b[1]-a[1]),counts};
}
function showNetwork(){
 const net=networkAnalysis();state.network=net;
 const max=Math.max(1,...net.demand.map(r=>r[1]));
 $("#serviceBars").innerHTML=net.demand.length?net.demand.map(([name,v])=>'<div class="service-item"><div class="row"><strong>'+escapeHTML(name)+'</strong><span>'+format(v)+'百万元</span></div><div class="track"><span style="width:'+(v/max*100).toFixed(1)+'%"></span></div></div>').join(""):'<p class="help">未找到具有有效主体对应关系的服务采购数据。</p>';
 $("#networkStats").textContent="主体 "+format(net.nodes)+" 个 · 有效关联 "+format(net.edges)+" 条 · 无法匹配 "+format(net.missed)+" 条；这些均不是正式产业核算结果。";
 const svg=$("#networkViz");let paths="";
 net.demand.forEach(([name,value],i)=>{
  const y=40+i*72,weight=(2+value/max*12).toFixed(1);
  paths+='<path d="M205 195 C 310 195, 312 '+y+', 425 '+y+'" fill="none" stroke="#528ec7" stroke-opacity=".42" stroke-width="'+weight+'"/>';
  paths+='<rect x="425" y="'+(y-24)+'" width="250" height="48" rx="12" stroke="#c9dfe6" fill="#edf6f8"/>';
  paths+='<text x="443" y="'+(y+5)+'" font-size="16" fill="#25576d">'+escapeHTML(name)+'</text>';
 });
 svg.innerHTML='<rect x="16" y="148" width="189" height="94" rx="16" fill="#153e55"/><text x="110" y="190" font-size="19" text-anchor="middle" fill="white" font-weight="700">制造业企业</text><text x="110" y="212" font-size="13" text-anchor="middle" fill="#b6dbe8">合成需求来源</text>'+paths;
}
function mean(v){return v.reduce((a,b)=>a+b,0)/v.length}
function variance(v){const m=mean(v);return mean(v.map(x=>(x-m)*(x-m)))}
function zscore(v){const m=mean(v),sd=Math.sqrt(variance(v));if(sd<1e-8)throw Error("问卷某指标零方差，无法运行路径模型");return v.map(x=>(x-m)/sd)}
function avgCols(rows,columns){const zs=columns.map(col=>zscore(rows.map(r=>{const v=Number(r[col]);if(!Number.isFinite(v)||v<1||v>7)throw Error("问卷题目数据无效："+col);return v})));return zscore(rows.map((r,i)=>mean(zs.map(v=>v[i]))))}
function correlation(x,y){return mean(x.map((v,i)=>v*y[i]))}
function regress(rows){
 const SA=avgCols(rows,BLOCKS.SA),SU=avgCols(rows,BLOCKS.SU),OP=avgCols(rows,BLOCKS.OP);
 const a=correlation(SA,SU),b=correlation(SA,OP),c=correlation(SU,OP),den=1-a*a;
 if(den<1e-5)throw Error("自变量高度共线，不能估计");
 const direct=(b-a*c)/den,mediated=(c-a*b)/den;
 return {"SA->SU":a,"SA->OP":direct,"SU->OP":mediated};
}
function modelEstimate(){
 const rows=state.data.survey;if(rows.length<60)throw Error("当前探索分析至少需要60份完整问卷；这不是正式统计功效标准");
 const paths=regress(rows),rng=seeded(317),draws={"SA->SU":[],"SA->OP":[],"SU->OP":[]};let failures=0;
 for(let b=0;b<150;b++){
  const sample=Array.from({length:rows.length},()=>rows[Math.floor(rng()*rows.length)]);
  try{const result=regress(sample);for(const k of Object.keys(draws))draws[k].push(result[k])}catch(e){failures++}
 }
 const intervals={};for(const k of Object.keys(draws)){const arr=draws[k].sort((a,b)=>a-b);intervals[k]=arr.length>=120?[quantile(arr,.025),quantile(arr,.975)]:null}
 return {mode:state.mode,dataset_id:state.id,model_id:"composite_regression_demo_v1",n:rows.length,paths,intervals,bootstraps:150,failed:failures,warning:"这是探索性构念得分回归，不是SmartPLS等价的PLS-SEM，也不证明因果效应。"};
}
function runModel(){
 try{
  const m=modelEstimate();state.model=m;
  $("#modelResults").innerHTML=Object.entries(m.paths).map(([key,value])=>{
   const ci=m.intervals[key];
   return '<div class="model-row"><div><strong>'+escapeHTML(modelPaths[key])+'</strong><small>'+(ci?"95%重抽样区间 ["+ci[0].toFixed(3)+", "+ci[1].toFixed(3)+"]":"区间不稳定")+'</small></div><span>'+value.toFixed(3)+'</span></div>'
  }).join("")+'<p class="help">使用 '+m.n+' 份数据，Bootstrap '+m.bootstraps+' 次。仅用于Demo工程验证，不应直接用于政策推断。</p>';
  status("已运行探索性程序模型 · "+m.n+"份问卷 · 非SmartPLS等价结果");
 }catch(err){$("#modelResults").textContent="当前模型无法运行："+err.message;toast(err.message)}
}
function dataSummary(){
 const id=state.id,rows=[["数据模式",state.mode],["数据版本",id],["2025宏观基准",format(baseline().gdp)+"亿元"],...Object.entries(state.data).map(([key,v])=>[key,format(v.length)+"条"])];
 $("#dataSummary").innerHTML=rows.map(([name,value])=>'<div class="data-item"><span>'+escapeHTML(name)+'</span><strong>'+escapeHTML(value)+'</strong></div>').join("");
 $("#dataBadge").textContent=state.mode;
}
function saveAs(filename,content,type){
 const blob=content instanceof Blob?content:new Blob([content],{type:type||"application/json;charset=utf-8"});
 const href=URL.createObjectURL(blob),a=document.createElement("a");a.href=href;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(href),2000);
}
function csvText(rows){
 if(!rows.length)return "";
 const headers=[...new Set(rows.flatMap(x=>Object.keys(x)))];
 const encode=s=>{const v=String(s==null?"":s);return /[",\r\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v};
 return [headers.map(encode).join(","),...rows.map(row=>headers.map(h=>encode(row[h])).join(","))].join("\r\n")+"\r\n";
}
function crcTable(){const a=[];for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=(c&1)?(0xEDB88320^(c>>>1)):(c>>>1);a.push(c>>>0)}return a}
const CRC=crcTable();
function crc32(bytes){let c=0xFFFFFFFF;for(const b of bytes)c=CRC[(c^b)&255]^(c>>>8);return (c^0xFFFFFFFF)>>>0}
function zipFiles(files){
 const enc=new TextEncoder(),chunks=[],central=[];let offset=0;
 const u16=(view,off,n)=>view.setUint16(off,n,true),u32=(view,off,n)=>view.setUint32(off,n>>>0,true);
 for(const [name,text] of Object.entries(files)){
  const filename=enc.encode(name),data=enc.encode(text),crc=crc32(data);
  const header=new Uint8Array(30+filename.length),h=new DataView(header.buffer);
  u32(h,0,0x04034b50);u16(h,4,20);u16(h,6,0x800);u16(h,8,0);u32(h,14,crc);u32(h,18,data.length);u32(h,22,data.length);u16(h,26,filename.length);header.set(filename,30);
  chunks.push(header,data);
  const entry=new Uint8Array(46+filename.length),e=new DataView(entry.buffer);
  u32(e,0,0x02014b50);u16(e,4,20);u16(e,6,20);u16(e,8,0x800);u16(e,10,0);u32(e,16,crc);u32(e,20,data.length);u32(e,24,data.length);u16(e,28,filename.length);u32(e,42,offset);entry.set(filename,46);
  central.push(entry);offset+=header.length+data.length;
 }
 const centralSize=central.reduce((n,v)=>n+v.length,0),end=new Uint8Array(22),d=new DataView(end.buffer);
 u32(d,0,0x06054b50);u16(d,8,central.length);u16(d,10,central.length);u32(d,12,centralSize);u32(d,16,offset);
 return new Blob([...chunks,...central,end],{type:"application/zip"});
}
function exportPack(){
 const files={};
 for(const [name,rows]of Object.entries(state.data))files["data/"+name+".csv"]=csvText(rows);
 const manifest={dataset_id:state.id,mode:state.mode,source:"browser-only Demo",counts:Object.fromEntries(Object.entries(state.data).map(([k,v])=>[k,v.length])),note:"Synthetic or unverified data. Do not state official findings."};
 files["manifest.json"]=JSON.stringify(manifest,null,2);
 files["model/variables.json"]=JSON.stringify(BLOCKS,null,2);
 files["model/external_result_template.json"]=JSON.stringify({dataset_id:state.id,model_id:"composite_regression_demo_v1",software:"SmartPLS",software_version:"FILL_ME",n:state.data.survey.length,paths:{"SA->SU":null,"SA->OP":null,"SU->OP":null},notes:"Replace placeholders using actual external software output; methods may not be numerically equivalent."},null,2);
 files["README.txt"]="Boluo 2032 / OPEN DEMO DATA PACK\nSynthetic Demo or user-supplied unverified CSV. Demo business relationships are not observed Boluo facts.\nSurvey columns SA1..SA4, SU1..SU3, OP1..OP3. Import survey.csv into your professional software.\nThe program estimates composite-score standardized regressions, not a verified SmartPLS PLS-SEM algorithm.\nRun the external model independently, retain its settings and software version. Import actual coefficients into the webpage as JSON.\n";
 saveAs("BOLUO_2032_"+state.mode+"_analysis_pack.zip",zipFiles(files),"application/zip");
 toast("已下载完整CSV和专业软件结果模板。");
}
function importExternal(evt){
 const file=evt.target.files[0];if(!file)return;
 file.text().then(text=>{
  const out=JSON.parse(text);
  if(out.dataset_id!==state.id)throw Error("数据版本不一致，不可对照");
  if(out.n!==state.data.survey.length)throw Error("样本量不一致，不可对照");
  if(!out.software_version||out.software_version==="FILL_ME")throw Error("请填写实际使用的软件版本");
  const names=Object.keys(modelPaths);
  if(names.some(k=>!Number.isFinite(out.paths?.[k])))throw Error("真实软件结果必须包含3个有限路径系数，不能用空模板");
  if(!state.model)runModel();
  if(!state.model)throw Error("程序模型未运行，无法比较");
  $("#compareResults").innerHTML='<p class="body-copy">'+escapeHTML(out.software||"专业软件")+' '+escapeHTML(out.software_version)+' 与程序探索结果的数值对照（算法可能不等价）</p>'+
    names.map(k=>'<div class="model-row"><div><strong>'+escapeHTML(modelPaths[k])+'</strong><small>程序 '+state.model.paths[k].toFixed(3)+' · 外部 '+Number(out.paths[k]).toFixed(3)+'</small></div><span>差 '+(state.model.paths[k]-out.paths[k]).toFixed(3)+'</span></div>').join("")+
    '<p class="help">注意：仅是数值差异展示。测量模型、算法和估计目标可能不同，尚不构成等价性认证。</p>';
  toast("专业软件结果已在本地对照。");
 }).catch(err=>toast("导入失败："+err.message)).finally(()=>{evt.target.value=""});
}
function parseCSV(text){
 const rows=[];let row=[],value="",quoted=false;
 for(let i=0;i<text.length;i++){
  const ch=text[i];
  if(quoted){if(ch==='"'&&text[i+1]==='"'){value+='"';i++}else if(ch==='"'){quoted=false}else value+=ch}
  else if(ch==='"'){quoted=true}
  else if(ch===","){row.push(value);value=""}
  else if(ch==="\r"||ch==="\n"){if(ch==="\r"&&text[i+1]==="\n")i++;row.push(value);value="";if(row.some(x=>x.trim()!==""))rows.push(row);row=[]}
  else value+=ch;
 }
 if(quoted)throw Error("CSV包含未关闭的引号");
 if(value||row.length){row.push(value);rows.push(row)}
 if(rows.length<2||rows.length>20001)throw Error("CSV需要1—20000条数据记录");
 const header=rows.shift().map(x=>x.trim());if(new Set(header).size!==header.length)throw Error("CSV列名重复");
 return rows.map((cols,index)=>{if(cols.length!==header.length)throw Error("第"+(index+2)+"行字段数量不一致");const obj={};header.forEach((k,j)=>obj[k]=cols[j].trim());return obj})
}
const RULES={
 macro:{keys:["year","primary","secondary","tertiary"],unique:"year",numeric:["year","primary","secondary","tertiary"]},
 enterprise:{keys:["enterprise_id","sector","subsector","town","employees","revenue_million"],unique:"enterprise_id",numeric:["employees","revenue_million"]},
 survey:{keys:["respondent_id",...Object.values(BLOCKS).flat()],unique:"respondent_id",numeric:Object.values(BLOCKS).flat()},
 relation:{keys:["source_id","target_id","relation_type","value_million"],numeric:["value_million"]},
 project:{keys:["project_id","sector","stage","start_year","investment_million"],unique:"project_id",numeric:["start_year","investment_million"]},
 worker:{keys:["respondent_id","sector","commute_minutes","skills_gap","monthly_pay_cny"],unique:"respondent_id",numeric:["commute_minutes","skills_gap","monthly_pay_cny"]}
};
function validateTable(type,rows){
 const rule=RULES[type],keys=Object.keys(rows[0]);const missing=rule.keys.filter(k=>!keys.includes(k));if(missing.length)throw Error("缺少必需字段："+missing.join("、"));
 const seen=new Set();
 return rows.map((r,i)=>{
  const out={};
  for(const k of rule.keys){
   const raw=r[k];if(raw==null||raw==="")throw Error("第"+(i+2)+"行缺少："+k);
   const v=rule.numeric.includes(k)?Number(raw):String(raw).slice(0,150);
   if(typeof v==="number"&&!Number.isFinite(v))throw Error("第"+(i+2)+"行数值非法："+k);
   out[k]=v;
  }
  if(rule.unique){const id=out[rule.unique];if(seen.has(id))throw Error("存在重复键："+id);seen.add(id)}
  if(type==="macro"&&(out.year<1990||out.year>2032||KEYS.some(k=>out[k]<=0)))throw Error("宏观年份或增加值无效");
  if(type==="survey"&&Object.values(BLOCKS).flat().some(k=>!Number.isInteger(out[k])||out[k]<1||out[k]>7))throw Error("问卷题目必须为1—7的整数");
  if(type==="relation"&&out.value_million<0)throw Error("关系金额不得为负");
  return {...out,provenance:"IMPORTED_UNVERIFIED"};
 });
}
function importCsv(){
 const file=$("#csvFile").files[0],type=$("#tableType").value;
 if(!file){toast("请先选择一个CSV文件");return}
 if(file.size>3000000){toast("文件超过3MB，当前浏览器Demo不接受");return}
 file.text().then(text=>{
  const rows=validateTable(type,parseCSV(text.replace(/^\uFEFF/,"")));
  if(type==="macro"&&rows.filter(x=>x.year===2025).length!==1)throw Error("宏观数据必须包含一条2025基准");
  state.data={...state.data,[type]:rows};state.mode="MIXED_UNVERIFIED";state.id="MIXED-"+type.toUpperCase()+"-"+rows.length+"-"+Math.floor(Date.now()/1000);
  state.model=null;state.network=null;showData();renderScenario();
  $("#modelResults").textContent="数据已替换，请重新运行程序模型";
  $("#compareResults").textContent="数据版本改变后，原有专业软件结果不可继续使用";
  $("#importFeedback").textContent="已替换 "+type+" 模块："+rows.length+"条。仅当前浏览器有效，不传服务器。其余模块仍是Demo。";
  toast("本地导入完成，新情景已重新计算；仍属于混合、未经核实的数据。");
 }).catch(err=>toast("导入失败："+err.message)).finally(()=>{$("#csvFile").value=""});
}
function showData(){try{dataSummary()}catch(err){toast(err.message)}}
function downloadReport(){
 if(!state.calc)renderScenario();
 const report={title:"博罗2032三次产业协同公开Demo",warning:"合成/未核实数据，不构成真实经济预测、正式调查或政策建议",dataset_id:state.id,mode:state.mode,scenario:SCENARIOS[state.scenario].name,knobs:state.knobs,annual_growth_assumptions:state.calc.growth,baseline:state.calc.b,scenario_results:state.calc.parts,total:state.calc.totals,network:state.network,exploratory_model:state.model,seed:2032};
 saveAs("boluo2032-demo-research.json",JSON.stringify(report,null,2));toast("已导出本次Demo研究结果与假设。");
}
function openTab(name){
 $$(".nav button").forEach(b=>{const sel=b.dataset.tab===name;b.classList.toggle("current",sel);b.setAttribute("aria-current",sel?"page":"false")});
 $$(".panel").forEach(p=>p.hidden=p.id!=="panel-"+name);
 if(name==="relations")showNetwork();
 if(name==="data")showData();
}
function init(){
 state.data=createDemo();
 $$(".nav button").forEach(b=>b.addEventListener("click",()=>openTab(b.dataset.tab)));
 $$("#choices button").forEach(btn=>btn.addEventListener("click",()=>{
  state.scenario=btn.dataset.scene;$$("#choices button").forEach(x=>x.classList.toggle("chosen",x===btn));
  renderScenario();
 }));
 $$("input[data-knob]").forEach(inp=>{inp.addEventListener("input",()=>{$("#out-"+inp.dataset.knob).textContent=inp.value;state.knobs[inp.dataset.knob]=Number(inp.value)});inp.addEventListener("change",renderScenario)});
 $("#rerun").addEventListener("click",renderScenario);
 $("#resetConditions").addEventListener("click",()=>{
  state.scenario="balanced";state.knobs={};$$("#choices button").forEach(x=>x.classList.toggle("chosen",x.dataset.scene==="balanced"));
  $$("input[data-knob]").forEach(inp=>{inp.value="0";$("#out-"+inp.dataset.knob).textContent="0"});renderScenario();
 });
 $("#runModel").addEventListener("click",runModel);
 $("#downloadData").addEventListener("click",exportPack);
 $("#softwareFile").addEventListener("change",importExternal);
 $("#importCsv").addEventListener("click",importCsv);
 $("#restoreDemo").addEventListener("click",()=>{state.data=createDemo();state.mode="DEMO";state.id="BOLUO_2032_DEMO_V1";state.model=null;state.network=null;renderScenario();showData();toast("已恢复完整可复现Demo。")});
 $("#downloadReport").addEventListener("click",downloadReport);
 renderScenario();showData();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();
