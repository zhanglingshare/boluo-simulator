/* 博罗产业风洞 · 相关者自有台账运行内核
 * API: BoluoIndustryLab.parseCSV(text), validate(rows), run({rows,scenario,openingCashYuan}), evaluateStrengthening({rows,scenario,openingCashYuan})
 * 只在浏览器内执行，不存储、不上传数据。演示输入不是柏塘实测。
 */
(function(root){
'use strict';
const FIELDS=['date','pickers','picked_fresh_kg','process_capacity_fresh_kg','dry_yield_ratio','pack_capacity_dry_kg','ship_capacity_dry_kg','orders_dry_kg','cash_in_yuan','cash_out_yuan'];
const LABELS={date:'日期',pickers:'采摘人员数',picked_fresh_kg:'当日采得鲜叶kg',process_capacity_fresh_kg:'鲜叶加工上限kg',dry_yield_ratio:'鲜叶转干茶得率(0-1)',pack_capacity_dry_kg:'干茶包装上限kg',ship_capacity_dry_kg:'干茶发货上限kg',orders_dry_kg:'已确认干茶订单kg',cash_in_yuan:'当天实际收款元',cash_out_yuan:'当天实际付款元'};
const DEFAULT_SCENARIO=Object.freeze({pickerPct:0,ordersPct:0,processPct:0,packPct:0,shipPct:0,receiptsDelayDays:0});
function csvRows(text){
 if(typeof text!=='string'||text.length>2000000)throw Error('CSV文件为空或超过2MB，请按时间段拆分。');
 let lines=[],line=[],s='',quoted=false;const src=text.replace(/^\uFEFF/,'');
 for(let i=0;i<src.length;i++){const c=src[i];if(c==='"'){if(quoted&&src[i+1]==='"'){s+='"';i++}else quoted=!quoted}
 else if(c===','&&!quoted){line.push(s);s=''}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&src[i+1]==='\n')i++;line.push(s);s='';if(line.some(x=>x.trim()))lines.push(line);line=[]}
 else s+=c}
 if(quoted)throw Error('CSV引号未闭合，请检查包含逗号的单元格。');
 line.push(s);if(line.some(x=>x.trim()))lines.push(line);
 return lines;
}
function parseCSV(text){
 const lines=csvRows(text);
 if(lines.length<2)throw Error('请至少提供表头和一天数据。');
 const head=lines[0].map(x=>x.trim());if(new Set(head).size!==head.length)throw Error('CSV表头有重复列。');
 if(!head.includes('date'))throw Error('缺少必需的 date 日期列。');
 return lines.slice(1).map((row,i)=>{const obj={};head.forEach((h,j)=>{if(FIELDS.includes(h))obj[h]=(row[j]??'').trim()});obj.__row=i+2;return obj});
}
function parseJSON(text){
 let input;try{input=JSON.parse(text)}catch(e){throw Error('JSON语法无效')}
 const arr=Array.isArray(input)?input:input&&input.rows;
 if(!Array.isArray(arr))throw Error('JSON必须是记录数组，或包含rows数组的对象。');
 if(arr.length>366)throw Error('最多一次处理366天；请拆分时间范围。');
 return arr.map((r,i)=>Object.assign({__row:i+1},r));
}
function parseDate(s){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(String(s||'')))return null;
 const [y,m,d]=String(s).split('-').map(Number);
 const stamp=Date.UTC(y,m-1,d);
 const dte=new Date(stamp);
 return dte.getUTCFullYear()===y&&dte.getUTCMonth()===m-1&&dte.getUTCDate()===d?stamp:null;
}
function valueOf(x){
 if(x===null||x===undefined||String(x).trim()==='')return null;
 const n=Number(String(x).trim());return Number.isFinite(n)?n:NaN;
}
function validate(input){
 const issues=[],rows=[];if(!Array.isArray(input))return {rows:[],issues:[{severity:'error',message:'台账必须为记录数组。'}],modules:{picking:false,flow:false,cash:false},ok:false};
 if(input.length>366)issues.push({severity:'error',message:'一次最多处理366天。'});
 if(!input.length)issues.push({severity:'error',message:'当前没有数据行。'});
 const dates=new Set();
 for(let i=0;i<Math.min(input.length,366);i++){
  const raw=input[i];if(!raw||typeof raw!=='object'){issues.push({severity:'error',message:'第'+(i+1)+'行不是有效记录。'});continue}
  const date=String(raw.date||'').trim(),stamp=parseDate(date);
  if(stamp===null)issues.push({severity:'error',message:'第'+(i+1)+'行日期无效，需 YYYY-MM-DD。'});
  if(dates.has(date))issues.push({severity:'error',message:'日期 '+date+' 重复，不能重复计入。'});dates.add(date);
  const o={date,stamp};
  for(const field of FIELDS.slice(1)){
   const n=valueOf(raw[field]);o[field]=n;
   if(Number.isNaN(n)||n!==null&&(n<0||(field==='dry_yield_ratio'&&(n<=0||n>1))||(field==='pickers'&&!Number.isInteger(n))))
    issues.push({severity:'error',message:date+' · '+LABELS[field]+' 数值无效。'});
  }
  rows.push(o);
 }
 rows.sort((a,b)=>a.stamp-b.stamp);
 let gaps=0;
 for(let i=1;i<rows.length;i++)if(rows[i].stamp-rows[i-1].stamp!==86400000)gaps++;
 const all=fields=>rows.length>0&&fields.every(k=>rows.every(r=>r[k]!==null&&!Number.isNaN(r[k])));
 const modules={
  picking:all(['pickers','picked_fresh_kg']),
  flow:all(['picked_fresh_kg','process_capacity_fresh_kg','dry_yield_ratio','pack_capacity_dry_kg','ship_capacity_dry_kg','orders_dry_kg'])&&gaps===0,
  cash:all(['cash_in_yuan','cash_out_yuan'])&&gaps===0
 };
 if(gaps)issues.push({severity:'warning',message:'日期不连续（'+gaps+'处）。需要连续日报才能模拟跨日库存与现金延迟；其他单日统计仍可展示。'});
 if(!modules.picking)issues.push({severity:'info',message:'缺少完整采工数与采得鲜叶重量，不能估计人均采摘量或劳动冲击。'});
 if(!modules.flow)issues.push({severity:'info',message:'加工、包装、发货、已确认订单及干茶得率需要连续、同单位日报才能模拟跨环节积压。'});
 if(!modules.cash)issues.push({severity:'info',message:'缺少连续收款/付款流水，不计算现金低点与占款变化。'});
 return {rows,issues,modules,ok:!issues.some(x=>x.severity==='error'),gaps};
}
function scenarioClean(s){
 const x=s||{},result={};for(const k of Object.keys(DEFAULT_SCENARIO)){
 const n=Number(x[k]??0);result[k]=Number.isFinite(n)?Math.max(k==='receiptsDelayDays'?0:-80,Math.min(k==='receiptsDelayDays'?90:200,k==='receiptsDelayDays'?Math.round(n):n)):0;
 }
 return result;
}
const sum=(a,k)=>a.reduce((v,row)=>v+(row[k]||0),0);
const fix=x=>Math.round(x*100)/100;
function simulateFlow(rows,s,enablePicks){
 let fresh=0,dry=0,packed=0,orders=0,delivered=0,produced=0,ordered=0,maxFresh=0,maxOrders=0,maxOrderWait=0;
 const timeline=[];
 for(const r of rows){
  const input=r.picked_fresh_kg*(enablePicks?Math.max(0,1+s.pickerPct/100):1);
  const processingCap=r.process_capacity_fresh_kg*Math.max(0,1+s.processPct/100);
  const packCap=r.pack_capacity_dry_kg*Math.max(0,1+s.packPct/100);
  const shipCap=r.ship_capacity_dry_kg*Math.max(0,1+s.shipPct/100);
  const newOrders=r.orders_dry_kg*Math.max(0,1+s.ordersPct/100);
  fresh+=input;const processed=Math.min(fresh,processingCap);fresh-=processed;produced+=processed*r.dry_yield_ratio;
  dry+=processed*r.dry_yield_ratio;const processedPack=Math.min(dry,packCap);dry-=processedPack;
  packed+=processedPack;orders+=newOrders;ordered+=newOrders;
  const shipped=Math.min(packed,shipCap,orders);orders-=shipped;packed-=shipped;delivered+=shipped;
  maxFresh=Math.max(maxFresh,fresh);maxOrders=Math.max(maxOrders,orders);maxOrderWait=Math.max(maxOrderWait,orders);
  timeline.push({date:r.date,harvestedFreshKg:fix(input),processedFreshKg:fix(processed),freshWaitingKg:fix(fresh),dryReadyKg:fix(dry),packedReadyKg:fix(packed),newOrderKg:fix(newOrders),shippedDryKg:fix(shipped),orderWaitingKg:fix(orders)});
 }
 return {incomingFreshKg:fix(timeline.reduce((v,r)=>v+r.harvestedFreshKg,0)),producedDryKg:fix(produced),orderedDryKg:fix(ordered),deliveredDryKg:fix(delivered),freshWaitingEndKg:fix(fresh),freshWaitingPeakKg:fix(maxFresh),orderWaitingEndKg:fix(orders),orderWaitingPeakKg:fix(maxOrders),dryUnpackedEndKg:fix(dry),packedUnshippedEndKg:fix(packed),fulfilledPct:ordered>0?fix(100*delivered/ordered):null,timeline};
}
function simulateCash(rows,s,opening){
 let net=0,minNet=0,minBalance=opening===null?null:opening,closing=opening===null?null:opening;
 const detail=[];
 for(let i=0;i<rows.length;i++){
  const cashIn=i>=s.receiptsDelayDays?rows[i-s.receiptsDelayDays].cash_in_yuan:0,cashOut=rows[i].cash_out_yuan;
  net+=cashIn-cashOut;minNet=Math.min(minNet,net);
  if(opening!==null){closing+=cashIn-cashOut;minBalance=Math.min(minBalance,closing)}
  detail.push({date:rows[i].date,scenarioCashInYuan:fix(cashIn),cashOutYuan:fix(cashOut),cumulativeNetYuan:fix(net)});
 }
 return {totalCashInYuan:fix(detail.reduce((v,r)=>v+r.scenarioCashInYuan,0)),totalCashOutYuan:fix(sum(rows,'cash_out_yuan')),lowestCumulativeNetYuan:fix(minNet),openingCashYuan:opening,lowestCashBalanceYuan:minBalance===null?null:fix(minBalance),closingCashBalanceYuan:closing===null?null:fix(closing),additionalBufferYuan:opening===null?null:fix(Math.max(0,-minBalance)),timeline:detail};
}
function run({rows:rawRows,scenario,openingCashYuan=null}={}){
 const validation=validate(rawRows),s=scenarioClean(scenario);
 if(!validation.ok)return {ok:false,validation,scenario:s,picking:null,flow:null,cash:null};
 const rows=validation.rows;
 const opening=openingCashYuan===null||openingCashYuan===undefined||String(openingCashYuan).trim()===''?null:Number(openingCashYuan);
 const warnings=validation.issues.slice();
 if(opening!==null&&(!Number.isFinite(opening)||opening<0))return {ok:false,validation:{...validation,issues:[...warnings,{severity:'error',message:'初始可用现金必须为非负金额。'}]},scenario:s,picking:null,flow:null,cash:null};
 const pick=validation.modules.picking?(()=>{
  const n=sum(rows,'pickers'),kg=sum(rows,'picked_fresh_kg');
  const adjusted=n*(1+s.pickerPct/100),adjustedKg=kg*(1+s.pickerPct/100);
  return {recordedWorkerDays:fix(n),recordedFreshKg:fix(kg),kgPerWorkerDay:n>0?fix(kg/n):null,scenarioWorkerDays:fix(adjusted),scenarioFreshKg:fix(adjustedKg),note:'采工百分比仅按原有人均产出等比例改变采摘量；无法推断缺工实际发生、可采鲜叶总量或品质。'};
 })():null;
 const flow=validation.modules.flow?simulateFlow(rows,s,validation.modules.picking):null;
 const cash=validation.modules.cash?simulateCash(rows,s,opening):null;
 return {ok:true,validation,scenario:s,picking:pick,flow,cash,trace:{days:rows.length,from:rows[0].date,to:rows[rows.length-1].date,mode:'local-private',sources:'user-input',rules:'same-day processing, packaging and shipping; end-of-day queues carried forward; no spoilage assumed; nonnegative constraints'}};
}
function evaluateStrengthening({rows,scenario,openingCashYuan=null}={}){
 const s=scenarioClean(scenario),base=run({rows,scenario:s,openingCashYuan});if(!base.ok||!base.flow)return {ok:false,reason:'缺少完整连续台账，无法比较环节补强。'};
 const proposals=[['picking','补采工+20%',{pickerPct:s.pickerPct+20}],['processing','加工能力+20%',{processPct:s.processPct+20}],['pack','包装能力+20%',{packPct:s.packPct+20}],['shipping','发货能力+20%',{shipPct:s.shipPct+20}]].map(([key,label,change])=>{
  const res=run({rows,scenario:{...s,...change},openingCashYuan}),f=res.flow;
  return {key,label,deltaDeliveredDryKg:fix(f.deliveredDryKg-base.flow.deliveredDryKg),deltaFreshWaitingPeakKg:fix(f.freshWaitingPeakKg-base.flow.freshWaitingPeakKg),deltaOrderWaitingEndKg:fix(f.orderWaitingEndKg-base.flow.orderWaitingEndKg),result:f};
 });
 return {ok:true,base:base.flow,proposals,notes:'每次只调整一项，增量不代表实际可采购的能力；不同方案的成本、品质与协作约束未计入。现金影响单独分析。'};
}
root.BoluoIndustryLab=Object.freeze({FIELDS,LABELS,DEFAULT_SCENARIO,parseCSV,parseJSON,validate,run,evaluateStrengthening});
if(typeof module==='object'&&module.exports)module.exports=root.BoluoIndustryLab;
})(typeof window!=='undefined'?window:globalThis);