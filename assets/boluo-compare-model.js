/* 博罗05：仅根据已收录事件重建事件局部的“此前/当前”结构。
 * 非完整历史快照；不得把签约、在建、推断关联当作已形成真实供货/交通联系。
 * CommonJS tests + browser global, intentionally no external dependencies.
 */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.BoluoCompareModel=api;
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 const MAX_NODES=14;
 const isPending=n=>n&&n.node_status==='pending';
 const isIntroduced=n=>n&&(n.node_status==='new'||n.node_status==='pending');
 const short=t=>String(t||'').replace(/[（(][^（）()]{12,}[）)]/g,'').replace(/项目（.*?）/g,'项目');
 const byId=(arr,k)=>new Map((arr||[]).map(x=>[x[k],x]));
 const isAssumption=e=>e?.evidence_grade==='C'||e?.evidence_type==='待验证假设';
 const isInferred=e=>e?.evidence_grade==='B'||e?.evidence_type==='证据推断';
 const hasConstruction=(c,e)=>/施工|重建|建设|在建|预计|目标|冲刺|尚未通车/.test([c.title,c.uncertainty,e?.valid_period].join(''));
 function validate(evidence,changes){
  if(!evidence||!Array.isArray(evidence.nodes)||!Array.isArray(evidence.edges)||!changes||!Array.isArray(changes.changes))throw Error('数据包结构不完整');
  const nm=byId(evidence.nodes,'node_id'),em=byId(evidence.edges,'edge_id');
  if(nm.size!==evidence.nodes.length||em.size!==evidence.edges.length)throw Error('节点或关系ID重复');
  for(const e of evidence.edges){
   if(!nm.has(e.source_node_id)||!nm.has(e.target_node_id))throw Error('关系端点缺失：'+e.edge_id);
  }
  for(const c of changes.changes){
   if(!/^C\d{3}$/.test(c.change_id))throw Error('变化ID格式错误');
   for(const n of c.involved_node_ids||[])if(!nm.has(n))throw Error(c.change_id+'主体缺失 '+n);
   for(const e of c.involved_edge_ids||[])if(!em.has(e))throw Error(c.change_id+'关系缺失 '+e);
  }
  return {nodeMap:nm,edgeMap:em};
 }
 function lifecycle(c,e,nm){
  if(isAssumption(e)||isPending(nm.get(e.source_node_id))||isPending(nm.get(e.target_node_id)))return 'hypothesis';
  if(isInferred(e))return 'inferred';
  if(c.change_id==='C006')return 'construction';
  if(c.change_id==='C007')return 'not_open';
  if(c.change_id==='C008')return 'line_closed';
  if(c.change_id==='C009')return 'rectification';
  if(c.change_type==='strengthen')return 'related';
  if(c.change_type==='new_entity'||c.change_type==='new_edge')return 'recorded';
  if(c.change_type==='weaken')return 'related';
  return 'related';
 }
 function position(id,index,count,coreCount){
  // Position depends on sorted node ids and event scope, never on before/after state.
  const core=index<coreCount;
  const slot=core?index:index-coreCount,n=core?Math.max(coreCount,1):Math.max(count-coreCount,1);
  const angle=(slot/n)*Math.PI*2-(core?Math.PI/2:Math.PI/2-Math.PI/(n+1));
  const rx=core?116:232,ry=core?88:163;
  const jitter=(str)=>{let h=2166136261;for(let i=0;i<str.length;i++)h=Math.imul(h^str.charCodeAt(i),16777619);return ((h>>>0)%1000)/1000;};
  const delta=(jitter(id)-.5)*10;
  return {x:300+Math.cos(angle)*(rx+delta),y:204+Math.sin(angle)*(ry+delta*.6)};
 }
 function build(evidence,changes,sources,changeId){
  const {nodeMap:nm,edgeMap:em}=validate(evidence,changes);
  const c=changes.changes.find(x=>x.change_id===changeId);
  if(!c)throw Error('没有找到变化：'+changeId);
  const involvedEdges=(c.involved_edge_ids||[]).map(id=>em.get(id));
  const changedIds=new Set(involvedEdges.map(e=>e.edge_id));
  const explicitNodes=new Set(c.involved_node_ids||[]);
  const core=new Set(explicitNodes);
  involvedEdges.forEach(e=>{core.add(e.source_node_id);core.add(e.target_node_id);});
  const coreIds=[...core].sort();
  // Context: highest observed local degree first, then deterministic IDs. Do not claim a complete county network.
  const counts=new Map();
  for(const e of evidence.edges){
   for(const [a,b] of [[e.source_node_id,e.target_node_id],[e.target_node_id,e.source_node_id]]){
    if(core.has(a)&&!core.has(b))counts.set(b,(counts.get(b)||0)+1);
   }
  }
  const extras=[...counts].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).map(x=>x[0]);
  const list=[...coreIds,...extras.slice(0,Math.max(0,MAX_NODES-coreIds.length))];
  const inView=new Set(list);
  const nodes=list.map((id,i)=>{
   const n=nm.get(id),intro=c.change_type==='new_entity'&&explicitNodes.has(id)&&isIntroduced(n);
   const isClosed=c.change_id==='C008'&&id==='glc';
   return {id,name:n.name,shortName:short(n.name),description:n.description||'',status:n.node_status,core:core.has(id),affected:explicitNodes.has(id),pending:isPending(n),
    introduced:intro,closedLine:isClosed,
    beforeVisible:!intro,afterVisible:true,position:position(id,i,list.length,coreIds.length),source_ids:n.source_ids||[]};
  });
  const involvedEdgeSet=new Set(c.involved_edge_ids||[]);
  const allEdges=evidence.edges.filter(e=>inView.has(e.source_node_id)&&inView.has(e.target_node_id));
  const edges=allEdges.map(e=>{
   const focus=involvedEdgeSet.has(e.edge_id);
   const status=focus?lifecycle(c,e,nm):'background';
   const introduced=e.source_node_id&&nodes.some(n=>n.id===e.source_node_id&&n.introduced)||nodes.some(n=>n.id===e.target_node_id&&n.introduced);
   const baseline=isAssumption(e)?'hypothesis':isInferred(e)?'inferred':'normal';
   let before=baseline,after=baseline,label='已收录背景关系';
   if(introduced){before='absent';after=(status==='hypothesis'?'hypothesis':status==='inferred'?'inferred':'recorded');}
   else if(focus){
    if(status==='line_closed'){before='normal';after='closed';label='生产线退出';}
    else if(status==='construction'){before='normal';after='construction';label='施工中，不代表新桥已通车';}
    else if(status==='not_open'){before='absent';after='construction';label='建设／目标，不代表已通车';}
    else if(status==='rectification'){before='normal';after=e.change_status==='无显著变化'?'normal':'related';label='停产整改，非永久退出';}
    else if(status==='hypothesis'){before='absent';after='hypothesis';label='待验证产业关联';}
    else if(status==='inferred'){before='inferred';after='inferred';label='间接证据关联：此事件未证实该边新增或增强';}
    else if(c.change_type==='new_edge'){before='absent';after='recorded';label='新增记录';}
    else if(c.change_type==='strengthen'){before='normal';after='related';label='事件相关，关系变化幅度未量化';}
    else if(c.change_type==='weaken'){before='normal';after='related';label='事件相关，不可据此判断所有关系减弱';}
   }
   if(!focus){label='背景关系（未认定由本事件改变）';}
   if(focus&&e.change_status==='无显著变化'){after=baseline;label='与事件关联，未记录本次发生变化';}
   if(isAssumption(e)&&focus&&after!=='absent'&&after!=='closed'){after='hypothesis';label='待验证关系，不代表实际供货';}
   else if(isInferred(e)&&focus&&after!=='absent'&&after!=='closed'&&after!=='normal'){after='inferred';label='根据间接证据建立的研究性关联';}
   return {id:e.edge_id,source:e.source_node_id,target:e.target_node_id,relation:e.relation_type,description:e.relation_description,
    evidence:e.evidence_type,grade:e.evidence_grade,status,focus,before,after,label,source_ids:e.source_ids||[],change_status:e.change_status,
    counter_evidence:e.counter_evidence||''};
  });
  const edgeById=byId(edges,'id');
  const selectedEdges=involvedEdges.map(e=>edgeById.get(e.edge_id)).filter(Boolean);
  const srcMap=byId(sources?.sources||[],'source_id');
  const sourceList=(c.source_ids||[]).map(id=>srcMap.get(id)).filter(Boolean);
  const bText=String(c.before_after||'');
  const m=bText.match(/此前[：:]\s*([\s\S]*?)(?:；|;)\s*此后[：:]\s*([\s\S]*)/);
  return {
   id:c.change_id,event:c,kind:c.change_type,nodes,edges,coreIds,selectedEdges,sources:sourceList,
   beforeText:m?m[1].trim():'事件记录未提供结构化此前描述',
   afterText:m?m[2].trim():bText,
   caution:'左右两图由当前关系底座与事件记录局部重建，并非两份完整历史网络快照；未被本事件明确改变的联系保持背景。',
   uncertainty:c.uncertainty||'尚无更多核验信息。',
   counts:{allNodes:evidence.nodes.length,allEdges:evidence.edges.length,events:changes.changes.length,
    localNodes:nodes.length,localEdges:edges.length,changedEdges:selectedEdges.length,
    unverified:selectedEdges.filter(e=>e.after==='hypothesis').length}
  };
 }
 return {validate,build,short};
});
