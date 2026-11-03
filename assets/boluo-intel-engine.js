/* 博罗情报实验台 · Evidence / Relation / Mechanism / Blindspots v1
   Deterministic evidence-network stress; NOT a calibrated economic cascade or probability.
   No invented relationships, no API/remote AI inference, no mutation of evidence.
   Browser UMD and Node CommonJS; one pre-existing compare-model dependency.
*/
(function(root,factory){
 'use strict';
 const compare=typeof module==='object'&&module.exports?require('./boluo-compare-model.js'):root.BoluoCompareModel;
 const api=factory(compare);
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.BoluoIntelEngine=api;
})(typeof window!=='undefined'?window:null,function(Compare){
 'use strict';
 const VERSION='intel-evidence-topology-v1.0';
 const GRADES={A:['A'],AB:['A','B'],ABC:['A','B','C']};
 const gradeName={A:'有明确公开来源的关联',B:'间接证据推断',C:'待验证的研究假设'};
 const by=(items,key)=>new Map((items||[]).map(x=>[x[key],x]));
 const clean=v=>String(v==null?'':v);
 const uniq=a=>[...new Set(a)];
 function assert(cond,msg){if(!cond)throw Error(msg);}
 function hash(s){
  // Stable checksums for local reproducibility; NOT a cryptographic authenticity proof.
  let a=2166136261,b=2166136261;
  for(let i=0;i<s.length;i++){const c=s.charCodeAt(i);a=Math.imul(a^c,16777619);b=Math.imul(b^(c+i%251),16777619);}
  return [(a>>>0).toString(16).padStart(8,'0'),(b>>>0).toString(16).padStart(8,'0')].join('');
 }
 function load(evidence,changes,sources,changeId){
  assert(Compare&&Compare.build,'比较模型模块不可用');
  Compare.validate(evidence,changes);
  assert(Array.isArray(sources?.sources),'来源库不完整');
  const model=Compare.build(evidence,changes,sources,changeId);
  const raw=by(evidence.edges,'edge_id');
  const sourceMap=by(sources.sources,'source_id');
  const nodeMap=by(evidence.nodes,'node_id');
  const links=model.edges.map(e=>{
   const original=raw.get(e.id);
   return {...e,verified_at:original?.last_verified_at||'',direction:original?.direction||'未标注',metric:original?.metric||null,
     original_source_ids:original?.source_ids||[],original_strength_basis:original?.strength_basis||'',
     original_counter_evidence:original?.counter_evidence||''};
  });
  const known=new Set(sources.sources.map(s=>s.source_id));
  const missingSourceIds=uniq([
   ...(model.event.source_ids||[]),
   ...links.flatMap(e=>e.source_ids||[])
  ]).filter(id=>!known.has(id));
  const snapshot={
   version:VERSION,changeId,event:model.event,model,edges:links,
   sources:sourceMap,nodes:nodeMap,
   generatedAt:{evidence:evidence.generated_at,changes:changes.generated_at,sources:sources.generated_at},
   recordCount:{nodes:evidence.nodes.length,edges:evidence.edges.length,sources:sources.sources.length},
   missingSourceIds
  };
  snapshot.digest=hash(JSON.stringify([evidence,changes,sources]));
  return snapshot;
 }
 function reach(nodes,edges,origin,omit){
  const graph=new Map(nodes.map(n=>[n.id,new Set()]));
  edges.forEach(e=>{
   if(e.id===omit||!graph.has(e.source)||!graph.has(e.target))return;
   graph.get(e.source).add(e.target);graph.get(e.target).add(e.source);
  });
  const set=new Set();
  if(graph.has(origin)){const q=[origin];set.add(origin);for(let i=0;i<q.length;i++){for(const next of graph.get(q[i]))if(!set.has(next)){set.add(next);q.push(next);}}}
  return [...set].sort();
 }
 function scan(snapshot,mode,pivot){
  const grades=GRADES[mode];assert(grades,'请选择 A、AB 或 ABC 证据情景');
  const ids=new Set(snapshot.model.nodes.map(n=>n.id));
  assert(ids.has(pivot),'主体不在此事件局部网络中');
  const edges=snapshot.edges.filter(e=>grades.includes(e.grade)&&e.after!=='absent');
  const original=reach(snapshot.model.nodes,edges,pivot);
  const impacts=edges.map(e=>{
   const next=reach(snapshot.model.nodes,edges,pivot,e.id);
   const lost=original.filter(id=>!next.includes(id));
   return {edgeId:e.id,grade:e.grade,source:e.source,target:e.target,loss:lost.length,lostIds:lost,focus:e.focus,
     evidence:e.evidence,label:e.label};
  }).sort((a,b)=>b.loss-a.loss||Number(b.focus)-Number(a.focus)||a.edgeId.localeCompare(b.edgeId));
  return {mode,pivot,edgeCount:edges.length,reachable:original.length,reachableIds:original,impacts};
 }
 function inspect(snapshot,options={}){
  const mode=options.mode||'A';
  const pivot=options.pivot||snapshot.model.coreIds[0]||snapshot.model.nodes[0].id;
  const omitEdge=options.omitEdge||'';
  const series=scan(snapshot,mode,pivot);
  assert(!omitEdge||series.impacts.some(x=>x.edgeId===omitEdge),'被移除的连线不属于当前证据情景');
  const chosen=series.impacts.find(x=>x.edgeId===omitEdge);
  const edgeList=snapshot.edges.filter(e=>GRADES[mode].includes(e.grade)&&e.after!=='absent');
  const after=reach(snapshot.model.nodes,edgeList,pivot,omitEdge);
  const difference=series.reachableIds.filter(id=>!after.includes(id));
  const scenarios=['A','AB','ABC'].map(m=>{
   const z=scan(snapshot,m,pivot);
   return {mode:m,edges:z.edgeCount,reachable:z.reachable,fragile:z.impacts.filter(x=>x.loss>0).length,
     maxLoss:z.impacts.length?z.impacts[0].loss:0};
  });
  const blindspots=deriveBlindspots(snapshot,scenarios);
  const conditions={
   mode,pivot,omitEdge,description:'仅删除观察网内一条已纳入的研究性连线；不等于现实中企业停产或道路中断。',
   grades:GRADES[mode],topology:'无向连通性，仅代表现有记录形成的可观察路径，不代表实际物流、供货或经济影响'
  };
  const runId='BL-'+snapshot.changeId+'-'+hash(JSON.stringify({version:VERSION,digest:snapshot.digest,conditions})).slice(0,12).toUpperCase();
  return {runId,engine:VERSION,snapshotDigest:snapshot.digest,eventId:snapshot.changeId,
   conditions,baseline:series.reachable,after:after.length,baselineIds:series.reachableIds,afterIds:after,
   lostIds:difference,removed:chosen||null,scenarios,scan:series.impacts,blindspots,
   constraints:['事件局部网络并非完整历史网络快照','A/B/C 为证据状态，不是发生概率','无向路径只是研究中的可达性，不证明商业交易、因果级联或经济损失','情景结果依赖当前收录样本，不能外推全县'],
  };
 }
 function deriveBlindspots(snapshot,scenarios){
  const e=snapshot.model.event,links=snapshot.edges.filter(x=>x.focus),out=[];
  const add=(id,kind,title,note,grade,priority,sources,linkId)=>{
   out.push({id,kind,title,note,grade,priority,sourceIds:uniq(sources||[]),linkId:linkId||''});
  };
  if(e.uncertainty){
   add('event-'+e.change_id,'事件限制','本事件仍需确认什么？',e.uncertainty,'未知',1,e.source_ids||[]);
  }
  for(const rel of links){
   const uncertain=rel.grade!=='A',notDone=['construction','hypothesis','inferred'].includes(rel.after),limited=!!(rel.counter_evidence||rel.original_counter_evidence);
   if(!uncertain&&!notDone&&!limited)continue;
   const n1=snapshot.nodes.get(rel.source)?.name||rel.source,n2=snapshot.nodes.get(rel.target)?.name||rel.target;
   const note=rel.counter_evidence||rel.original_counter_evidence||(
    rel.grade==='C'?'未找到直接证据来证明该候选联系已经发生。':
    rel.grade==='B'?'基于间接资料推断，不能当作已发生的交易或冲击传导。':
    '施工、签约或关联状态仍有条件，不能视为已投入运营。');
   add('edge-'+rel.id,uncertain?'关系待核验':'关系限制',n1+' ↔ '+n2,note,rel.grade,
    rel.grade==='C'?1:rel.grade==='B'?2:3,rel.source_ids||[],rel.id);
  }
  if(snapshot.missingSourceIds.length){
   add('missing-sources','来源缺口','部分引用来源未入库',
    '缺少条目：'+snapshot.missingSourceIds.join('、')+'。此处不能展示为已交叉验证。','未知',1,snapshot.missingSourceIds);
  }
  const referenced=uniq([...(e.source_ids||[]),...links.flatMap(x=>x.source_ids||[])]);
  const unresolved=referenced.filter(id=>snapshot.sources.get(id)?.independent_corroboration==null);
  if(unresolved.length){
   add('corroboration','元数据盲区','独立交叉核验状态未登记',
    unresolved.length+' 条关联来源没有填写 independent_corroboration 字段；未登记不等于没有其他证据。','未知',3,unresolved);
  }
  if(!out.some(x=>x.kind==='关系待核验')){
   add('mechanism','机制盲区','关系成立，不等于可传导经济影响',
    '当前库未记录完整的传导强度、方向、时滞与容量约束。需要订单、采购、通勤或运量等观测，才能建立可检验的定量传导机制。','未知',2,[]);
  }else{
   add('mechanism','机制盲区','候选关系如何传导，尚无机制校准',
    'A/B/C 网络仅提供研究候选路径；未校准传导强度、时滞和约束前，不输出GDP或就业损失。','未知',2,[]);
  }
  const abc=scenarios.find(x=>x.mode==='ABC'),onlyA=scenarios.find(x=>x.mode==='A');
  if(abc&&onlyA&&abc.reachable>onlyA.reachable){
   add('grade-sensitive','证据敏感','部分可达关系依赖 B/C 级记录',
    '纳入 B/C 时可达主体从 '+onlyA.reachable+' 变为 '+abc.reachable+'，这是证据覆盖差异，不是现实系统可靠度。','B/C',2,[]);
  }
  return out.sort((a,b)=>a.priority-b.priority||a.id.localeCompare(b.id));
 }
 function mechanismCandidate(e){
  // Research-only conditional mechanisms: evidence of an association is not evidence for transmission.
  if(e.after==='construction')return {
   premise:'只有工程实际完成、通行安排发生变化，才可能出现新的通达结构。',
   needs:'通车或验收公告、同口径车流/通勤时间的前后观测，以及绕行和替代路径资料。'};
  if(e.after==='closed')return {
   premise:'只有确认该产线退出的产能范围和替代供给，才能讨论下游影响。',
   needs:'停产设备清单、上下游实际订单、产能替代和企业其余业务的证据。'};
  const type=e.relation;
  if(type==='supply_chain')return {
   premise:'只有存在实际交付、采购或稳定的生产依赖，这条关联才可能传递供应冲击。',
   needs:'可核对采购合同、交付记录、企业披露和替代供应商能力；当前关系收录本身不能证明交易。'};
  if(type==='investment')return {
   premise:'只有项目资金、设备和产线形成实际能力，投资关联才可能传导到产能和就业。',
   needs:'到资、开工、设备安装、正式投产时间及同口径真实产出。'};
  if(type==='regional')return {
   premise:'只有跨区合作形成真实业务、人员或要素联系，区域关系才可能形成传导通道。',
   needs:'合作实际履约、就业与采购所在地、通勤观测和跨域业务记录。'};
  if(type==='transport')return {
   premise:'只有道路可用能力、真实流量或通勤时耗改变，通道关联才可能改变网络约束。',
   needs:'正式通行状态、分时交通量、出行时长、货运分布和替代通道信息。'};
  if(type==='tourism_consumption')return {
   premise:'只有能观察到真实消费或停留结构变化，文旅关联才可能传导至本地收益。',
   needs:'过夜游客同口径数据、游客消费结构、酒店经营数据以及淡旺季对照。'};
  return {premise:'只有确认主体之间存在可观察的实际依赖，才可能提出具有传导意义的假设。',
   needs:'明确传导方向、影响对象、时滞、容量约束与可反驳的实际观测指标。'};
 }
 function propositions(snapshot){
  const event=snapshot.event;
  const sourceNames=(ids)=>ids.map(id=>snapshot.sources.get(id)?.title||'来源条目未收录：'+id);
  const rows=[{id:'event-'+event.change_id,kind:'事件记录',title:event.title||event.change_id,
   status:'已收录的公开事件',basis:event.before_after||'无结构化此前/当前说明',caveat:event.uncertainty||'暂无单独标注的限制',
   sourceIds:event.source_ids||[],sourceNames:sourceNames(event.source_ids||[])}];
  snapshot.edges.filter(x=>x.focus).forEach(x=>{
   rows.push({id:x.id,kind:'关系命题',title:(snapshot.nodes.get(x.source)?.name||x.source)+' ↔ '+(snapshot.nodes.get(x.target)?.name||x.target),
    status:x.grade+' · '+gradeName[x.grade],basis:x.description||x.label,caveat:x.counter_evidence||x.original_counter_evidence||'关系仅表示收录证据中的关联，不单独证明因果机制。',
    sourceIds:x.source_ids||[],sourceNames:sourceNames(x.source_ids||[]),after:x.after,grade:x.grade});
   const mechanism=mechanismCandidate(x);
   rows.push({id:'mechanism-'+x.id,kind:'机制候选',
    title:'如果 '+(snapshot.nodes.get(x.source)?.name||x.source)+' 与 '+(snapshot.nodes.get(x.target)?.name||x.target)+' 的依赖成立…',
    status:'待检验机制 · 非已证实因果',
    basis:mechanism.premise,
    caveat:'需补证据：'+mechanism.needs+'。相关来源只能支持上游关联，不能直接支持此机制已经发生。',
    sourceIds:x.source_ids||[],sourceNames:sourceNames(x.source_ids||[]),
    originatingEdgeId:x.id});
  });
  return rows;
 }
 function exportRun(snapshot,run,notes=''){
  // Contains the FULL raw data snapshot required to re-run with this exact engine version.
  return {manifest:{runId:run.runId,engine:VERSION,region:'博罗县',reproducible_with:'同版本 assets/boluo-intel-engine.js',
    disclaimer:'研究性证据图压力实验，不代表现实损失、概率或已验证的因果结论'},
   selection:{eventId:run.eventId,...run.conditions,analystNotes:clean(notes).slice(0,2000)},
   result:run,
   inputs:{evidence:snapshot.fullEvidence,changes:snapshot.fullChanges,sources:snapshot.fullSources}};
 }
 function withInputs(evidence,changes,sources,eventId){
  const s=load(evidence,changes,sources,eventId);
  s.fullEvidence=evidence;s.fullChanges=changes;s.fullSources=sources;return s;
 }
 return {VERSION,GRADES,hash,load,withInputs,reach,scan,inspect,propositions,exportRun};
});
