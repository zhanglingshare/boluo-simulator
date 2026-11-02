/* 柏塘数据实验室: 纯本地CSV/JSON, 非云端接口。 */
(function(){
'use strict';
const M=window.BoluoIndustryLab;if(!M)throw Error('data-lab-engine.js not loaded');
const $=id=>document.getElementById(id),esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const names={farmer:['茶农 / 合作社','看实际采工、采摘效率、鲜叶入厂时段。'],processor:['加工主体','看鲜叶积压、干茶产出与包装承接的跨日变化。'],packaging:['包装 / 交付','看包装上限、待发货库存与订单积压。'],buyer:['采购 / 渠道','看已确认订单和实际交付，而不是新闻里的签约数。'],services:['技术 / 服务','检查哪一环最需要补真实操作记录。'],coordinator:['镇级协调','看跨主体瓶颈与不确定数据，但不评价具体企业绩效。']};
const scenarioKeys={sPicker:'pickerPct',sOrders:'ordersPct',sProcess:'processPct',sPack:'packPct',sShip:'shipPct',sDelay:'receiptsDelayDays'};
const sample=[
['2026-03-20',40,800,950,.2,145,150,140,20000,28000],
['2026-03-21',38,760,900,.2,145,145,160,21000,29000],
['2026-03-22',36,720,880,.2,145,145,155,22000,30000],
['2026-03-23',42,840,920,.2,145,145,180,23000,32000],
['2026-03-24',39,780,910,.2,145,145,150,24000,28000],
['2026-03-25',41,820,950,.2,145,145,170,25000,31000],
['2026-03-26',38,760,920,.2,145,145,155,27000,29000]
];
const header=M.FIELDS.join(','),sampleText=header+'\n'+sample.map(x=>x.join(',')).join('\n');
const display=(n,d=1)=>n===null||n===undefined?'未计算':Number(n).toLocaleString('zh-CN',{maximumFractionDigits:d});
let role='farmer',rows=null,validation=null,base=null,current=null,resultReady=false,example=false,debounce;
function stateScenario(){return Object.fromEntries(Object.entries(scenarioKeys).map(([id,k])=>[k,Number($(id).value)||0]))}
function parse(){const input=$('rawData').value.trim();if(!input){rows=null;validation=null;return}
try{rows=input.startsWith('[')||input.startsWith('{')?M.parseJSON(input):M.parseCSV(input);validation=M.validate(rows)}
catch(e){rows=null;validation={ok:false,modules:{picking:false,flow:false,cash:false},issues:[{severity:'error',message:String(e.message||e)}]}}}
function check(){
 parse();
 const status=(id,k)=>{$(id).textContent=validation?(validation.modules[k]?'已就绪':'缺字段'):'未检查';$(id).style.color=validation?.modules[k]?'#a5e7ba':'#f4bc78'};
 status('coveragePicking','picking');status('coverageFlow','flow');status('coverageCash','cash');
 $('modeBadge').textContent=!rows?'未载入台账':example?'虚构演示数据':'用户自报台账';
 $('issueList').innerHTML=validation?validation.issues.map(x=>'<div class="issue '+x.severity+'">'+esc(x.message)+'</div>').join('')+(validation.ok?'<div class="ready">已检查 '+validation.rows.length+' 天记录；按照模块完整程度分别计算。</div>':''):'<p class="muted tiny">等待数据。至少填date；需要对应字段才会启动具体模块。</p>';
 $('runStatus').textContent=validation?(validation.ok?'可运行已完整的模块':'请修正错误后运行'):'尚无可处理的数据';
 return validation?.ok;
}
function updateRole(){
 document.querySelectorAll('[data-role]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.role===role?'true':'false'));
 $('roleHint').innerHTML='<b>'+names[role][0]+'</b>　'+names[role][1];
}
function updateControls(){
 for(const [id,k] of Object.entries(scenarioKeys))$('v'+id.slice(1)).textContent=($(id).value>0?'+':'')+$(id).value+(id==='sDelay'?'天':'%');
}
function graph(current){
 const f=current.flow;
 const label=(id,t)=>$(id).textContent=t;
 if(!f){['graphPick','graphProcess','graphPack','graphShip','graphOrders','graphCash'].forEach(id=>label(id,'无完整数据'));return}
 label('graphPick',current.picking?display(current.picking.scenarioWorkerDays,0)+'人日':'缺劳动字段');
 label('graphProcess',display(f.freshWaitingPeakKg)+'kg峰值');
 label('graphPack',display(f.dryUnpackedEndKg)+'kg待包');
 label('graphShip',display(f.deliveredDryKg)+'kg交付');
 label('graphOrders',display(f.orderWaitingEndKg)+'kg积压');
 label('graphCash',current.cash?display(current.cash.lowestCumulativeNetYuan,0)+'元':'缺收支字段');
}
function timeline(rows){
 const arr=rows||[],max=Math.max(1,...arr.map(x=>x.orderWaitingKg)),w=640,h=210;
 let y=x=>h-24-x/max*166,x=i=>32+i*(w-60)/Math.max(1,arr.length-1);
 return '<svg viewBox="0 0 '+w+' '+h+'" role="img" aria-label="每日未完成订单积压"><path d="M32 14V186H610" stroke="#688c7e" fill="none"/><polyline fill="none" stroke="#f7c58c" stroke-width="3" points="'+arr.map((r,i)=>x(i)+','+y(r.orderWaitingKg)).join(' ')+'"/>'+arr.map((r,i)=>'<circle cx="'+x(i)+'" cy="'+y(r.orderWaitingKg)+'" r="3" fill="#e5c18e"><title>'+esc(r.date)+'：'+display(r.orderWaitingKg)+'kg待交付</title></circle>').join('')+'<text x="33" y="12" fill="#a0d8bd" font-size="10">订单积压峰值 '+display(max)+'kg</text></svg>';
}
function run(){
 if(!check()){resultReady=false;return}
 const opening=$('openingCash').value.trim()===''?null:Number($('openingCash').value);
 const scenario=stateScenario();
 base=M.run({rows,scenario:M.DEFAULT_SCENARIO,openingCashYuan:opening});
 current=M.run({rows,scenario,openingCashYuan:opening});
 if(!current.ok){$('runStatus').textContent='运行失败：'+current.validation.issues.map(x=>x.message).join('；');return}
 resultReady=true;renderResult();
}
function renderResult(){
 if(!current?.ok)return;
 const f=current.flow,b=base?.flow,p=current.picking,c=current.cash;
 $('resultBadge').textContent=example?'虚构样例的条件试验':'用户自报数据的条件试验';
 $('graphTag').textContent='已计算 '+current.trace.days+' 天';
 $('resultSub').textContent='每日输入、跨日加工与订单等待，独立于柏塘公开产业基本面；不上传这些数据。';
 graph(current);
 $('metricDelivered').textContent=f?display(f.deliveredDryKg)+'kg':'缺字段';
 $('metricOrders').textContent=f?display(f.orderWaitingEndKg)+'kg':'缺字段';
 $('metricFresh').textContent=f?display(f.freshWaitingPeakKg)+'kg':'缺字段';
 $('metricLabor').textContent=p&&p.kgPerWorkerDay!==null?display(p.kgPerWorkerDay)+'kg':'缺字段';
 $('metricCash').textContent=c?display(c.lowestCumulativeNetYuan,0)+'元':'缺字段';
 $('timelineChart').innerHTML=f?timeline(f.timeline):'<p class="muted">需要连续的加工、包装、订单与发货台账。</p>';
 const metrics=[
 ['已交付干茶kg',b?.deliveredDryKg,f?.deliveredDryKg],
 ['期末未交付订单kg',b?.orderWaitingEndKg,f?.orderWaitingEndKg],
 ['鲜叶峰值待加工kg',b?.freshWaitingPeakKg,f?.freshWaitingPeakKg],
 ['期末待包装干茶kg',b?.dryUnpackedEndKg,f?.dryUnpackedEndKg],
 ['相对累计收支低点元',base?.cash?.lowestCumulativeNetYuan,c?.lowestCumulativeNetYuan]
 ];
 $('compareRows').innerHTML=metrics.map(([name,a,z])=>'<tr><td>'+name+'</td><td>'+display(a)+'</td><td><b>'+display(z)+'</b></td></tr>').join('');
 if(f&&b){
 const dd=f.deliveredDryKg-b.deliveredDryKg,wait=f.orderWaitingEndKg-b.orderWaitingEndKg;
 $('storyTitle').textContent=dd<0?'当前情景交付减少，传导值得进一步追踪':dd>0?'交付增加，但不等于真实获利':'本轮交付没有变化，可能瓶颈在另一环';
 $('storyText').textContent='相较未受冲击的同一份台账，已交付干茶变化'+display(dd)+'kg，期末订单等待变化'+display(wait)+'kg。请核实库存保质期、返工、真实产能与采购合同；不能直接等同收入损失。';
 }else{$('storyTitle').textContent='数据不足以模拟完整交付链';$('storyText').textContent='当前只能使用已经具备完整数据的模块，不能填充缺失字段。'}
 const proposals=M.evaluateStrengthening({rows,scenario:stateScenario(),openingCashYuan:$('openingCash').value.trim()===''?null:Number($('openingCash').value)});
 $('reinforceRows').innerHTML=proposals.ok?proposals.proposals.map(x=>'<tr><td>'+esc(x.label)+'</td><td>'+display(x.deltaDeliveredDryKg)+'kg</td><td>'+display(x.deltaOrderWaitingEndKg)+'kg</td><td>'+display(x.deltaFreshWaitingPeakKg)+'kg</td></tr>').join(''):'<tr><td colspan="4">'+esc(proposals.reason||'没有完整数据')+'</td></tr>';
 $('runStatus').textContent='已完成本机运行：'+current.trace.from+'—'+current.trace.to+'；'+current.trace.days+'天';
}
function usePreset(name){
 const options={
 orders:{sOrders:30},workers:{sPicker:-20},processing:{sProcess:-25},cash:{sDelay:7},mix:{sOrders:30,sPicker:-20},reset:{}
 };
 if(!Object.hasOwn(options,name))return;
 Object.keys(scenarioKeys).forEach(k=>$(k).value=options[name][k]??0);
 updateControls();if(rows)run();
}
function download(name,content,type){
 const blob=new Blob([content],{type}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1500)
}
function exportResults(){
 if(!current?.ok)return $('runStatus').textContent='请先运行有效数据';
 // No original records in exported results unless separately opted by the user (this file never does)
 const output={version:1,kind:'local-conditional-experiment',example,role,exportedAt:new Date().toISOString(),scenario:stateScenario(),
 modules:current.validation.modules,trace:current.trace,picking:current.picking,flow:current.flow?{...current.flow,timeline:undefined}:null,cash:current.cash?{...current.cash,timeline:undefined}:null};
 download('boluo-tea-local-result.json',JSON.stringify(output,null,2),'application/json');
}
const schema=$('schemaTable');if(schema)schema.innerHTML=M.FIELDS.map(k=>'<tr><td>'+esc(k)+'</td><td>'+esc(M.LABELS[k]||k)+'</td></tr>').join('');
$('rawData').addEventListener('input',()=>{example=false;clearTimeout(debounce);debounce=setTimeout(check,200)});
$('openingCash').addEventListener('change',()=>{if(rows)run()});
document.querySelectorAll('[data-role]').forEach(x=>x.addEventListener('click',()=>{role=x.dataset.role;updateRole()}));
document.querySelectorAll('[data-preset]').forEach(x=>x.addEventListener('click',()=>usePreset(x.dataset.preset)));
$('sampleButton').onclick=()=>{example=true;$('rawData').value=sampleText;check();run()};
$('templateButton').onclick=()=>download('boluo-tea-daily-template.csv',header+'\n','text/csv;charset=utf-8');
$('clearButton').onclick=()=>{rows=null;validation=null;base=null;current=null;example=false;resultReady=false;$('rawData').value='';$('openingCash').value='';check();$('runStatus').textContent='数据已从当前工作区清空';};
$('validateButton').onclick=check;$('runButton').onclick=run;$('rerunButton').onclick=run;
$('exportButton').onclick=exportResults;$('exportInline').onclick=exportResults;
$('copySchema').onclick=()=>{if(navigator.clipboard?.writeText)navigator.clipboard.writeText(header).then(()=>$('runStatus').textContent='CSV表头已复制');else prompt('复制表头',header)};
$('fileInput').addEventListener('change',async e=>{const f=e.target.files?.[0];if(!f)return;if(f.size>2000000){$('runStatus').textContent='文件超过2MB，请按阶段拆分。';return}try{$('rawData').value=await f.text();example=false;check()}catch(err){$('runStatus').textContent='无法读取文件：'+err.message}});
for(const id of Object.keys(scenarioKeys))$(id).addEventListener('input',()=>{updateControls();if(rows)run()});
updateRole();updateControls();check();
})();