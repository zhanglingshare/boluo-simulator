/* Boluo 2032 Research Studio — DEMO/data contract layer.
 * All generated enterprises, surveys, relations and projects are synthetic.
 * Data never leaves the browser; replacing data does not make assumptions empirical. */
(function(root){
"use strict";
const V="2.0.0", SEED=20321112;
const SECTORS=["primary","secondary","tertiary"];
const BASE={primary:107.44,secondary:549.01,tertiary:349};
const TOWNS=["罗阳街道","园洲镇","石湾镇","龙溪街道","长宁镇","柏塘镇","福田镇","湖镇镇","杨村镇","泰美镇","龙华镇","公庄镇"];
const SUBSECTORS={
 primary:["特色茶叶","蔬菜水果","特色种养","农业服务"],
 secondary:["电子信息","先进装备","新材料","食品加工","其他制造"],
 tertiary:["科技研发","检测认证","工业物流","信息软件","商务服务","零售消费","文旅服务"]
};
const REQUIRED={
 macro:["year","primary","secondary","tertiary"],
 enterprises:["id","sector","subsector","town","employees","revenue","productivity"],
 relations:["source","target","type","value"],
 surveys:["id","enterpriseId","SA1","SA2","SA3","SA4","SU1","SU2","SU3","OP1","OP2","OP3"],
 projects:["id","sector","town","stage","investment","commissionYear","jobs"],
 workforce:["id","sector","town","commute","wage","skillGap"]
};
const ALIASES={
 id:["编号","主体编号","企业编号","企业ID","受访者编号","项目编号","员工编号"],
 enterpriseId:["企业ID","企业编号","所属企业","企业标识"],
 year:["年份","年度","统计年度"],primary:["第一产业","一产","第一产业增加值"],secondary:["第二产业","二产","第二产业增加值"],tertiary:["第三产业","三产","第三产业增加值"],
 sector:["产业","产业类型","行业门类"],subsector:["细分行业","行业","行业类别"],town:["镇街","所在镇街","镇","街道"],
 employees:["员工数","职工数","就业人数"],revenue:["营业收入","营收","营业收入万元"],productivity:["人均营收","生产率代理指标"],
 source:["来源企业","采购方","起点"],target:["目标企业","供应商","终点"],type:["关系类型","关系"],value:["关系金额","采购金额","金额"],
 stage:["项目阶段","进展阶段"],investment:["投资额","项目投资"],commissionYear:["投产年份","投产年"],jobs:["岗位数","就业岗位"],
 commute:["通勤分钟","通勤时间"],wage:["月工资","月薪"],skillGap:["技能缺口","技能匹配缺口"]
};
const MFG=["制造企业"],SERVICE=["服务企业"],FARM=["农业主体"];
function rng(seed){let a=(Number(seed)||SEED)>>>0;return function(){a+=0x6D2B79F5;let x=a;x=Math.imul(x^(x>>>15),x|1);x^=x+Math.imul(x^(x>>>7),x|61);return ((x^(x>>>14))>>>0)/4294967296;};}
function normal(random){return Math.sqrt(-2*Math.log(Math.max(1e-12,random())))*Math.cos(2*Math.PI*random());}
function clamp(x,a,b){return Math.max(a,Math.min(b,x));}
function sum(arr){return arr.reduce((a,b)=>a+Number(b||0),0);}
function mean(arr){return arr.length?sum(arr)/arr.length:0;}
function round(x,n=3){return +Number(x).toFixed(n);}
function hash(str){let h=2166136261;for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619);}return (h>>>0).toString(16).padStart(8,"0");}
function identity(bundle){return hash(JSON.stringify(bundle.tables));}
function demo(){
 const random=rng(SEED);
 const tables={macro:[],enterprises:[],relations:[],surveys:[],projects:[],workforce:[]};
 // Only 2025 anchor is drawn from a public reference and remains unverified for official research.
 for(let y=2020;y<=2025;y++){
  const d=2025-y,values={primary:BASE.primary/Math.pow(1.052,d),secondary:BASE.secondary/Math.pow(1.079,d),tertiary:BASE.tertiary/Math.pow(1.083,d)};
  tables.macro.push({year:y,...Object.fromEntries(SECTORS.map(k=>[k,round(values[k],4)])),evidence:y===2025?"PUBLIC_REFERENCE_PENDING_RECHECK":"SYNTHETIC_HISTORY"});
 }
 const specs=[["primary",110,"A"],["secondary",460,"I"],["tertiary",260,"S"]];
 for(const [sector,count,prefix] of specs){
  const kinds=SUBSECTORS[sector],mu=sector==="secondary"?3.63:sector==="tertiary"?2.88:2.46;
  for(let i=0;i<count;i++){
   const id=prefix+String(i+1).padStart(4,"0");
   const employees=Math.round(clamp(Math.exp(mu+.78*normal(random)),2,1800));
   const productivity=round((sector==="secondary"?.47:sector==="tertiary"?.43:.26)+random()*.68,4);
   const revenue=round(employees*productivity,3); // Synthetic million CNY, not GDP.
   const town=TOWNS[(i*7+(sector==="primary"?5:sector==="tertiary"?3:0))%TOWNS.length];
   tables.enterprises.push({id,name:"Demo "+(sector==="primary"?"农业主体":sector==="secondary"?"制造企业":"服务企业")+" "+id,sector,subsector:kinds[i%kinds.length],town,employees,productivity,revenue,
        innovation:round(random()*.6+.15,3),capacity:round(.55+random()*.4,3),evidence:"SYNTHETIC"});
  }
 }
 const industry=tables.enterprises.filter(x=>x.sector==="secondary"),services=tables.enterprises.filter(x=>x.sector==="tertiary"),farms=tables.enterprises.filter(x=>x.sector==="primary");
 for(let i=0;i<industry.length;i++){
  for(let j=0;j<3;j++){
   const target=services[(i*19+j*37)%services.length];
   tables.relations.push({source:industry[i].id,target:target.id,type:"professional_service",value:round(.04+random()*1.9,3),evidence:"SYNTHETIC"});
  }
  if(i%3===0){const target=industry[(i*11+97)%industry.length];if(target.id!==industry[i].id)tables.relations.push({source:industry[i].id,target:target.id,type:"industrial_supply",value:round(.25+random()*5.2,3),evidence:"SYNTHETIC"});}
 }
 for(let i=0;i<farms.length;i++){
  tables.relations.push({source:farms[i].id,target:industry[(i*23+7)%industry.length].id,type:"agricultural_processing",value:round(.1+random()*1.4,3),evidence:"SYNTHETIC"});
  if(i%2===0)tables.relations.push({source:farms[i].id,target:services[(i*13)%services.length].id,type:"agricultural_distribution",value:round(.02+random()*.8,3),evidence:"SYNTHETIC"});
 }
 function likert(latent){return Math.round(clamp(4+1.05*latent+.73*normal(random),1,7));}
 for(let i=0;i<420;i++){
  const firm=industry[i],size=(Math.log1p(firm.employees)-3.65)/1.35;
  const access=.21*size+.87*normal(random),usage=.56*access+.13*size+.73*normal(random),perf=.39*usage+.17*access+.16*size+.81*normal(random);
  const item={id:"Q"+String(i+1).padStart(4,"0"),enterpriseId:firm.id,town:firm.town,subsector:firm.subsector,employees:firm.employees,serviceSpend:round(Math.max(.01,.5+.25*usage+.55*random()),3),evidence:"SYNTHETIC"};
  for(let j=1;j<=4;j++)item["SA"+j]=likert(access);
  for(let j=1;j<=3;j++){item["SU"+j]=likert(usage);item["OP"+j]=likert(perf);}
  tables.surveys.push(item);
 }
 for(let i=0;i<72;i++){
  const sector=SECTORS[i%3],stage=["signed","construction","commissioning","operating"][i%4];
  tables.projects.push({id:"P"+String(i+1).padStart(3,"0"),name:"Demo 项目 "+String(i+1).padStart(3,"0"),sector,town:TOWNS[(i*7+3)%TOWNS.length],stage,
    investment:round(35+random()*1100,2),commissionYear:2026+(i%7),jobs:Math.round(20+random()*1000),confidence:round(.45+random()*.45,3),evidence:"SYNTHETIC"});
 }
 for(let i=0;i<420;i++){
  const sector=SECTORS[i%3],town=TOWNS[(i*5+7)%TOWNS.length];
  tables.workforce.push({id:"W"+String(i+1).padStart(4,"0"),sector,town,commute:Math.round(9+random()*100),
    wage:Math.round(3200+random()*12500),skillGap:Math.ceil(random()*5),evidence:"SYNTHETIC"});
 }
 const meta={
  dataset_id:"BOLUO_2032_DEMO_V2",mode:"DEMO",schema_version:"2.0",generated_seed:SEED,created:"REPRODUCIBLE",
  baseline_year:2025,target_year:2032,currency:"CNY",enterprise_revenue_unit:"million_CNY",
  macro_value_unit:"100_million_CNY",price_basis:"demo_nominal",has_restricted_records:false,
  note:"2025 public reference requires independent verification. Other records are wholly synthetic and do not prove actual Boluo relationships."
 };
 return {meta,tables,evidence:{macro:"2025_PUBLIC_REFERENCE_UNVERIFIED_OTHER_SYNTHETIC",enterprises:"SYNTHETIC",relations:"SYNTHETIC",surveys:"SYNTHETIC",projects:"SYNTHETIC",workforce:"SYNTHETIC"}};
}
function validateOne(type,rows){
 if(!REQUIRED[type])throw Error("未知数据类别："+type);
 if(!Array.isArray(rows)||rows.length<1||rows.length>20000)throw Error("数据行数必须是1—20000");
 const cols=Object.keys(rows[0]),missing=REQUIRED[type].filter(k=>!cols.includes(k));if(missing.length)throw Error("字段缺失："+missing.join("、"));
 const key=({macro:"year",enterprises:"id",surveys:"id",projects:"id",workforce:"id"})[type];
 const numeric={macro:["year","primary","secondary","tertiary"],enterprises:["employees","revenue","productivity"],relations:["value"],
  surveys:["SA1","SA2","SA3","SA4","SU1","SU2","SU3","OP1","OP2","OP3"],projects:["investment","commissionYear","jobs"],workforce:["commute","wage","skillGap"]}[type];
 const seen=new Set();const errors=[],out=[];
 for(let i=0;i<rows.length;i++){
  const raw=rows[i],entry={};for(const [k,v] of Object.entries(raw)){if(v==null||v==="")continue;entry[k]=numeric.includes(k)?Number(v):typeof v==="string"?v.trim().slice(0,240):v;}
  for(const k of REQUIRED[type])if(entry[k]===undefined)errors.push("第"+(i+2)+"行缺少"+k);
  for(const k of numeric)if(entry[k]!==undefined&&!Number.isFinite(entry[k]))errors.push("第"+(i+2)+"行"+k+"不是有限数字");
  if(key){if(seen.has(entry[key]))errors.push("主键重复："+entry[key]);seen.add(entry[key]);}
  if(type==="macro"&&SECTORS.some(k=>entry[k]<=0))errors.push("宏观增加值必须为正数");
  if(type==="macro"&&(entry.year<1990||entry.year>2035))errors.push("宏观年份不合法");
  if(type==="surveys"&&numeric.some(k=>entry[k]<1||entry[k]>7||!Number.isInteger(entry[k])))errors.push("问卷指标须为1—7整数");
  if(type==="relations"&&entry.value<0)errors.push("关系金额不允许为负");
  if(type==="workforce"&&(entry.wage<0||entry.commute<0||entry.skillGap<0))errors.push("劳动者指标不能为负");
  if(type==="projects"&&(entry.investment<0||entry.jobs<0))errors.push("项目金额或就业不能为负");
  entry.evidence="IMPORTED_UNVERIFIED";out.push(entry);
  if(errors.length>=12)break;
 }
 if(type==="macro"&&out.filter(x=>x.year===2025).length!==1)errors.push("必须且只能有一条2025年基准");
 if(errors.length)throw Error(errors.slice(0,8).join("；"));
 return out;
}
function inspect(data){
 const flags=[],counts={},coverage={},tables=data.tables||{};
 for(const [type,required] of Object.entries(REQUIRED)){
  const rows=tables[type];counts[type]=Array.isArray(rows)?rows.length:0;
  if(!Array.isArray(rows)||!rows.length){flags.push({level:"error",scope:type,message:"缺失数据模块"});coverage[type]=0;continue;}
  const missing=required.filter(k=>!Object.prototype.hasOwnProperty.call(rows[0],k));
  coverage[type]=(required.length-missing.length)/required.length;
  if(missing.length)flags.push({level:"error",scope:type,message:"缺少 "+missing.join(",")});
 }
 const macro=tables.macro||[],b=macro.filter(r=>Number(r.year)===2025);
 if(b.length!==1)flags.push({level:"error",scope:"macro",message:"2025基准不存在或重复"});
 else if(SECTORS.some(k=>!Number.isFinite(Number(b[0][k]))||Number(b[0][k])<=0))
  flags.push({level:"error",scope:"macro",message:"基准产业增加值不合法"});
 const ids=new Set((tables.enterprises||[]).map(x=>String(x.id)));
 let badEdges=0;for(const r of tables.relations||[])if(!ids.has(String(r.source))||!ids.has(String(r.target)))badEdges++;
 if(badEdges)flags.push({level:"warning",scope:"relations",message:badEdges+"条关系找不到对应企业"});
 const missingSurveyIds=(tables.surveys||[]).filter(x=>x.enterpriseId&&!ids.has(String(x.enterpriseId))).length;
 if(missingSurveyIds)flags.push({level:"warning",scope:"surveys",message:missingSurveyIds+"份企业问卷无法匹配企业"});
 const imported=Object.keys(tables).filter(k=>data.evidence?.[k]==="IMPORTED_UNVERIFIED");
 if(imported.length)flags.push({level:"warning",scope:"provenance",message:"新导入的数据尚未经过来源、授权和统计口径复核"});
 if((tables.surveys||[]).length<60)flags.push({level:"warning",scope:"surveys",message:"问卷数量不足以运行当前探索性模型（非正式统计功效标准）"});
 if(data.meta?.mode!=="DEMO")flags.push({level:"warning",scope:"provenance",message:"当前为混合或未核实数据，不能称为真实县域预测"});
 return {counts,coverage,flags,missingEndpoints:badEdges,missingSurveyIds,score:Math.round(100*mean(Object.values(coverage))),status:flags.some(x=>x.level==="error")?"BLOCKED":flags.length?"NEEDS_REVIEW":"DEMO_VALID"};
}
function replace(data,type,rows){
 const updated=JSON.parse(JSON.stringify(data)),validated=validateOne(type,rows);
 updated.tables[type]=validated;updated.evidence[type]="IMPORTED_UNVERIFIED";
 updated.meta.mode=Object.values(updated.evidence).every(x=>x==="IMPORTED_UNVERIFIED")?"REAL_UNVERIFIED":"MIXED_UNVERIFIED";
 updated.meta.dataset_id="SNAP-"+hash(JSON.stringify(updated.tables));
 updated.meta.generated_seed=null;
 const check=inspect(updated);if(check.status==="BLOCKED")throw Error(check.flags.filter(x=>x.level==="error").map(x=>x.message).join("；"));
 return updated;
}
function normalizeAlias(txt){return String(txt).replace(/[\s（）()_\-]/g,"").toLowerCase()}
function suggestMapping(type,cols){
 return Object.fromEntries(REQUIRED[type].map(key=>{
  const variants=[key,...(ALIASES[key]||[])].map(normalizeAlias);
  return [key,cols.find(column=>variants.includes(normalizeAlias(column)))||""];
 }));
}
function applyMapping(rows,map){return rows.map(row=>Object.fromEntries(Object.entries(map).filter(([,source])=>source).map(([key,source])=>[key,row[source]])))}
function parseCSV(text){
 const rows=[];let row=[],cell="",quoted=false;
 text=String(text).replace(/^\uFEFF/,"");
 for(let i=0;i<text.length;i++){
  const ch=text[i];
  if(quoted){if(ch==='"'&&text[i+1]==='"'){cell+='"';i++;}else if(ch==='"')quoted=false;else cell+=ch;}
  else if(ch==='"')quoted=true;
  else if(ch===","){row.push(cell);cell="";}
  else if(ch==="\r"||ch==="\n"){if(ch==="\r"&&text[i+1]==="\n")i++;row.push(cell);cell="";if(row.some(v=>v.trim()))rows.push(row);row=[];}
  else cell+=ch;
 }
 if(quoted)throw Error("CSV引号不闭合");
 if(cell!==""||row.length){row.push(cell);rows.push(row);}
 if(rows.length<2||rows.length>20001)throw Error("CSV必须包含1—20000条记录");
 const cols=rows.shift().map(x=>x.trim());if(new Set(cols).size!==cols.length)throw Error("字段名称有重复");
 return rows.map((cells,i)=>{if(cells.length!==cols.length)throw Error("第"+(i+2)+"行列数不一致");return Object.fromEntries(cols.map((name,j)=>[name,cells[j].trim()]));});
}
function encodeCSV(rows){
 if(!rows?.length)return "";
 const keys=[...new Set(rows.flatMap(r=>Object.keys(r)))];
 const quote=v=>{const s=String(v===undefined||v===null?"":v);return /[",\r\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;};
 return [keys.map(quote).join(","),...rows.map(r=>keys.map(k=>quote(r[k])).join(","))].join("\r\n")+"\r\n";
}
async function unzipXlsx(arrayBuffer){
 const bytes=new Uint8Array(arrayBuffer),dv=new DataView(arrayBuffer),text=new TextDecoder("utf-8");
 let eocd=-1;
 for(let i=bytes.length-22;i>=Math.max(0,bytes.length-65557);i--)if(dv.getUint32(i,true)===0x06054b50){eocd=i;break;}
 if(eocd<0)throw Error("Excel ZIP文件缺少目录");
 const count=dv.getUint16(eocd+10,true),start=dv.getUint32(eocd+16,true);
 if(count>200)throw Error("Excel文件结构过大");
 const out={};let p=start;
 for(let idx=0;idx<count;idx++){
  if(dv.getUint32(p,true)!==0x02014b50)throw Error("Excel文件目录损坏");
  const method=dv.getUint16(p+10,true),comp=dv.getUint32(p+20,true),rawlen=dv.getUint32(p+24,true);
  const nlen=dv.getUint16(p+28,true),elen=dv.getUint16(p+30,true),clen=dv.getUint16(p+32,true),local=dv.getUint32(p+42,true);
  const name=text.decode(bytes.slice(p+46,p+46+nlen));
  if((name==="xl/sharedStrings.xml"||name==="xl/worksheets/sheet1.xml")&&rawlen<12000000){
   if(dv.getUint32(local,true)!==0x04034b50)throw Error("Excel数据段异常");
   const offset=local+30+dv.getUint16(local+26,true)+dv.getUint16(local+28,true);
   const packed=bytes.slice(offset,offset+comp);let result;
   if(method===0)result=packed;
   else if(method===8){
    if(typeof DecompressionStream==="undefined")throw Error("当前浏览器暂不支持本地Excel解压，请先转为CSV");
    const ds=new DecompressionStream("deflate-raw");
    result=new Uint8Array(await new Response(new Blob([packed]).stream().pipeThrough(ds)).arrayBuffer());
   }else throw Error("无法处理Excel压缩方式");
   out[name]=text.decode(result);
  }
  p+=46+nlen+elen+clen;
 }
 if(!out["xl/worksheets/sheet1.xml"])throw Error("只支持Excel第一工作表；请另存为CSV");
 return out;
}
async function parseXlsx(file){
 const zip=await unzipXlsx(await file.arrayBuffer()),xml=new DOMParser();
 const parse=s=>{const d=xml.parseFromString(s,"application/xml");if(d.querySelector("parsererror"))throw Error("Excel XML解析失败");return d};
 let shared=[];
 if(zip["xl/sharedStrings.xml"]){
  const doc=parse(zip["xl/sharedStrings.xml"]);
  shared=Array.from(doc.getElementsByTagName("si")).map(item=>Array.from(item.getElementsByTagName("t")).map(n=>n.textContent).join(""));
 }
 const sheet=parse(zip["xl/worksheets/sheet1.xml"]),rows=[];
 for(const row of sheet.getElementsByTagName("row")){
  const obj={};for(const cell of row.getElementsByTagName("c")){
   const ref=cell.getAttribute("r")||"",col=ref.match(/^[A-Z]+/);if(!col)continue;
   let index=0;for(const ch of col[0])index=index*26+ch.charCodeAt(0)-64;index--;
   const kind=cell.getAttribute("t");
   const v=cell.getElementsByTagName("v")[0]?.textContent??cell.getElementsByTagName("t")[0]?.textContent??"";
   obj[index]=kind==="s"?shared[Number(v)]??"":v;
  }
  if(Object.keys(obj).length)rows.push(obj);
 }
 if(rows.length<2||rows.length>20001)throw Error("Excel必须包含1—20000条记录");
 const header=rows.shift(),head=Object.keys(header).map(Number).sort((a,b)=>a-b);
 return rows.map(r=>Object.fromEntries(head.map(i=>[String(header[i]),r[i]??""])));
}
async function parseFile(file){
 if(!file)throw Error("请选择数据文件");
 if(file.size>6_000_000)throw Error("文件超过6MB浏览器测试限制");
 if(/\.csv$/i.test(file.name))return parseCSV(await file.text());
 if(/\.xlsx$/i.test(file.name))return parseXlsx(file);
 if(/\.json$/i.test(file.name)){
  const data=JSON.parse(await file.text());
  if(Array.isArray(data))return data;
  if(data&&data.tables)return data;
  throw Error("JSON文件需要是数据行数组或完整研究数据包");
 }
 throw Error("目前支持CSV、XLSX及JSON");
}
root.BoluoCore={V,SEED,SECTORS,BASE,TOWNS,SUBSECTORS,REQUIRED,ALIASES,rng,normal,clamp,sum,mean,round,hash,identity,demo,validateOne,inspect,replace,suggestMapping,applyMapping,parseCSV,encodeCSV,parseFile};
})(window);