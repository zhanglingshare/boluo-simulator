(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./relations-world-data.js'));
  else root.BoluoWorld=factory(root.BoluoWorldData);
})(typeof window!=='undefined'?window:this,function(D){
  'use strict';
  const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
  const groups={...D.groups,environment:'生态与约束'};
  const safeTitles={C001:'园区开园与厂房交付',C002:'储能并网登记',C003:'铜来顺点火进展',C004:'四宗项目签约记录',C005:'增资扩产与在建项目',C006:'石洲大桥重建登记',C007:'惠霞高速进度线索',C008:'一条熟料线退出',C009:'环境整治与停产记录',C010:'荔枝组织与科研合作',C011:'农业示范与加工线索',C012:'文旅旺季与留客线索'};
  const safeURL=value=>{try{const u=new URL(value);return ['http:','https:'].includes(u.protocol)&&!u.username&&!u.password?u.href:'';}catch{return '';}};
  function build(graph={},sourceData={},changeData={}){
    const nodes=new Map(),edges=new Map(),sources=new Map(Object.entries(D.sources).map(([id,s])=>[id,{id,...s,reviewed:true}]));
    for(const s of sourceData.sources||[])sources.set(s.source_id,{id:s.source_id,title:s.title,publisher:s.publisher,date:s.published_at,url:safeURL(s.url),scope:s.summary,reviewed:false,grade:'原登记'});
    for(const n of graph.nodes||[]){
      const group=n.node_type==='external'?'regional':n.node_type==='eco'?'environment':n.node_type==='agriculture'?'agriculture':n.node_id==='hh'?'tourism':'industry';
      nodes.set(n.node_id,{id:n.node_id,name:n.name,short:n.name,group,kind:'registry',detail:n.description,source:[...(n.source_ids||[])],reviewed:false,registered:true,town:n.town,originalGrade:n.evidence_grade});
    }
    for(const n of D.nodes){const previous=nodes.get(n.id);nodes.set(n.id,{...previous,...n,source:[...new Set([...(n.source||[]),...(previous?.source||[])])],originalGrade:previous?.originalGrade});}
    nodes.set('yuanzhou',{id:'yuanzhou',name:'园洲镇',short:'园洲镇',group:'regional',kind:'record',source:['yuanzhou'],reviewed:true,detail:'汉德、密特斯和江丰的属地记录。共同属地不代表彼此有交易。'});
    nodes.set('baitang',{id:'baitang',name:'柏塘镇',short:'柏塘镇',group:'regional',kind:'record',source:['tea'],reviewed:true,detail:'新陂合作社所在地，不能把一个合作社的经营账外推全镇。'});
    const labels={supply_chain:'配套线索',regional:'跨城联系',commute:'往来线索',transport:'交通登记',eco_constraint:'生态约束',resource_competition:'资源关联',tourism_consumption:'文旅联系',investment:'退出记录'};
    for(const e of graph.edges||[]){
      if(!nodes.has(e.source_node_id)||!nodes.has(e.target_node_id))continue;
      let kind='registry',label=labels[e.relation_type]||'登记联系',detail=e.relation_description;
      if(['E010','E017','E023','E042'].includes(e.edge_id)){
        kind='inferred';label=e.edge_id==='E017'?'同产业线索':e.edge_id==='E023'?'电网侧能力':e.edge_id==='E042'?'同镇产品':'行业配套推断';
        detail+='；本页不据此认定两家主体存在具体采购合同或直接供电交易。';
      }
      if(e.edge_id==='E045'){label='整治登记';detail+='；不能据此认定整个群落所有企业停产。';}
      edges.set(e.edge_id,{id:e.edge_id,a:e.source_node_id,b:e.target_node_id,label,kind,detail,source:[...(e.source_ids||[])],before:'unreported',after:kind,reviewed:false,contextOnly:e.edge_id==='E044',boundary:e.counter_evidence||'既有登记未经本轮逐条复核；关联、同业或区位不自动等于交易和经济因果。'});
    }
    for(const e of D.edges)edges.set(e.id,{...e});
    const locality=[
      ['town-hande','yuanzhou','hande','属地记录','yuanzhou'],['town-jf','yuanzhou','jf','属地记录','yuanzhou'],['town-mts','yuanzhou','supplier','属地记录','yuanzhou'],['town-tea','baitang','tea-coop','属地记录','tea'],['tour-context','lswh','tour-bus','区域文旅联系','mobility']
    ];
    for(const [id,a,b,label,source]of locality)if(nodes.has(a)&&nodes.has(b))edges.set(id,{id,a,b,label,source:[source],kind:'record',before:'unreported',after:'record',reviewed:true,detail:label==='属地记录'?'只说明所在地，不证明企业之间存在订单。':'文旅区域与专线的关联，不表示20公里线路覆盖全部引领区。'});
    const changes=(changeData.changes||[]).filter(c=>safeTitles[c.change_id]).map(c=>({id:c.change_id,title:safeTitles[c.change_id],date:c.event_date,source:[...(c.source_ids||[])],nodes:c.involved_node_ids.filter(id=>nodes.has(id)),edges:c.involved_edge_ids.filter(id=>edges.has(id)),uncertainty:c.uncertainty,verified:c.last_verified_at,type:c.change_type,reviewed:false}));
    return {nodes,edges,sources,changes,registry:{nodes:(graph.nodes||[]).length,edges:(graph.edges||[]).length,changes:changes.length},groups,ready:Boolean(graph.nodes&&sourceData.sources&&changeData.changes)};
  }
  function read(input,atlas){
    const p=input instanceof URLSearchParams?input:new URLSearchParams(input||'');
    const id=D.scenes.some(s=>s.id===p.get('case'))?p.get('case'):'hande';
    const scene=D.scenes.find(s=>s.id===id);
    const view=['orders','jobs','commute'].includes(p.get('view'))?p.get('view'):'orders';
    const mode=['trace','compare','atlas'].includes(p.get('mode'))?p.get('mode'):p.get('phase')==='before'?'compare':'trace';
    const lens=p.get('lens')==='local'?'local':'company';
    const phase=p.get('phase')==='before'?'before':'current';
    const rawStep=p.has('step')?Number(p.get('step')):3;
    const step=Number.isFinite(rawStep)?Math.max(0,Math.min(3,Math.round(rawStep))):3;
    let focus=p.get('focus')||p.get('item')||'';
    const aliases={company:scene.root,local:'local-suppliers',jobs:id==='tea'?'tea-work':id==='hande'?'hande-jobs':'jf-jobs'};
    if(own(aliases,focus))focus=aliases[focus];
    if(!atlas.nodes.has(focus))focus='';
    const edge=atlas.edges.has(p.get('edge'))?p.get('edge'):'';
    const depth=Math.max(0,Math.min(2,Number(p.get('depth'))||0));
    const group=own(groups,p.get('group'))?p.get('group'):'all';
    const change=own(safeTitles,p.get('change'))?p.get('change'):'';
    const kind=['record','inferred','question'].includes(p.get('kind'))?p.get('kind'):'all';
    return {case:id,view,mode,lens,phase,step,focus:edge?'':focus,edge,depth,group,kind,candidates:p.get('candidates')==='1',change};
  }
  function query(state,atlas,shared=false){
    const s=read(new URLSearchParams({...state,candidates:state.candidates?'1':'0'}),atlas);
    const p=new URLSearchParams({case:s.case,view:s.view,mode:s.mode,lens:s.lens,phase:s.phase,step:String(s.step)});
    for(const k of ['focus','edge','change'])if(s[k])p.set(k,s[k]);
    if(s.depth)p.set('depth',String(s.depth));if(s.group!=='all')p.set('group',s.group);if(s.kind!=='all')p.set('kind',s.kind);if(s.candidates)p.set('candidates','1');if(shared)p.set('share','1');return p.toString();
  }
  function sceneFor(state,atlas){
    if(state.change==='C008')return D.scenes.find(s=>s.id==='cement');
    if(state.change){
      const c=atlas.changes.find(c=>c.id===state.change);
      if(c){const ids=[...new Set([...c.nodes,...c.edges.flatMap(id=>{const e=atlas.edges.get(id);return[e.a,e.b];})])];return{id:c.id,label:c.title,title:'这条变化，接到了谁？',group:'regional',root:ids[0],nodes:ids,edges:c.edges,source:c.source[0],legacy:true,metrics:[{label:'原登记涉及对象',value:String(ids.length),unit:'个',note:'记录范围，不是影响人数'},{label:'原登记涉及联系',value:String(c.edges.length),unit:'条',note:'原登记核对至 '+c.verified}],steps:[{label:'原登记',caption:'这是存量线索，先看涉及对象。',nodes:ids},{label:'联系',caption:'登记联系不能自动当成真实交易。',nodes:[]},{label:'边界',caption:c.uncertainty,nodes:[]},{label:'待核实',caption:'核对来源日期、具体范围与最新状态。',nodes:[]}],insight:{local:['把对象连起来，\n再查影响在哪里。','这是既有登记，尚未在本轮逐条复核。'],company:['这条变化，\n与你隔着哪一环？',c.uncertainty]},gaps:[{label:'最新状态',text:'原记录后有没有新的进展？'},{label:'具体联系',text:'哪些联系有直接记录，哪些只是行业推断？'},{label:'影响范围',text:c.uncertainty}],compare:{before:'前期记录未统一披露',after:'登记核对至 '+c.verified,note:'灰色表示未披露，不表示此前不存在；不重放未经核实的“从无到有”。'}};}
    }
    return D.scenes.find(s=>s.id===state.case)||D.scenes[0];
  }
  function traversable(e,state){return !e.contextOnly&&(e.reviewed||e.kind!=='question'||state.candidates);}
  function neighbors(id,atlas,state){return [...atlas.edges.values()].filter(e=>traversable(e,state)&&[e.a,e.b].includes(id));}
  function visible(state,atlas){
    const scene=sceneFor(state,atlas),ids=new Set();
    if(state.mode==='atlas'){
      for(const n of atlas.nodes.values())if(n.registered||!n.reviewed||scene.nodes.includes(n.id))if(state.group==='all'||n.group===state.group)ids.add(n.id);
      if(state.group!=='all'){const extra=[];for(const id of ids)for(const e of neighbors(id,atlas,state))for(const n of[e.a,e.b])if(!ids.has(n))extra.push(n);extra.slice(0,8).forEach(id=>ids.add(id));}
    }else if(state.mode==='compare')scene.nodes.forEach(id=>ids.add(id));
    else scene.steps.slice(0,state.step+1).forEach(s=>s.nodes.forEach(id=>ids.add(id)));
    if(state.focus&&state.depth){const limit=state.mode==='atlas'?ids.size+12:20;ids.add(state.focus);let frontier=[state.focus];for(let d=0;d<state.depth;d++){const next=[];for(const id of frontier)for(const e of neighbors(id,atlas,state))for(const n of[e.a,e.b])if(!ids.has(n)&&ids.size<limit){ids.add(n);next.push(n);}frontier=next;}}
    const scoped=state.mode==='atlas'||state.depth>0;
    const es=[...atlas.edges.values()].filter(e=>ids.has(e.a)&&ids.has(e.b)&&!e.contextOnly&&(scoped?traversable(e,state):scene.edges.includes(e.id))).filter(e=>state.kind==='all'||(state.kind==='record'?['record','registry'].includes(e.kind):e.kind===state.kind));
    return {scene,nodes:[...ids].map(id=>atlas.nodes.get(id)).filter(Boolean),edges:es};
  }
  function status(edge,phase){
    if(phase==='before')return edge.before||'unreported';
    return edge.after==='closed'?'closed':edge.kind;
  }
  function contextFor(state,atlas){
    if(state.mode!=='atlas')return sceneFor(state,atlas);
    const selected=state.edge?atlas.edges.get(state.edge):atlas.nodes.get(state.focus);
    if(!selected)return null;
    const ids=selected.a?[selected.a,selected.b]:[selected.id];
    return D.scenes.find(s=>ids.includes(s.root))||D.scenes.find(s=>ids.some(id=>s.nodes.includes(id)))||null;
  }
  function metricsFor(state,atlas,view=visible(state,atlas)){
    if(state.mode!=='atlas')return view.scene.metrics;
    return [{label:'当前画面 · 对象',value:String(view.nodes.length),unit:'个',note:'随筛选与展开更新；不是全县主体总数'},
      {label:'当前画面 · 联系',value:String(view.edges.length),unit:'条',note:'登记、推断和待核实分别查看'}];
  }
  function normalizeRecord(input,atlas){
    if(!input||typeof input!=='object'||!D.scenes.some(s=>s.id===input.case))return null;
    const clean=read(new URLSearchParams({...input,candidates:input.candidates?'1':'0'}),atlas);
    const body=typeof input.body==='string'?input.body.trim().slice(0,600):'';
    const url=input.url?safeURL(input.url):'';
    if(input.url&&!url)return null;
    return {...clean,...(body?{body,url,date:String(input.date||'').slice(0,10),status:'unreviewed'}:{})};
  }
  function parseRecords(raw,atlas){try{const a=JSON.parse(raw||'[]');return Array.isArray(a)?a.map(r=>normalizeRecord(r,atlas)).filter(Boolean).slice(0,50):[];}catch{return [];}}
  return {data:D,groups,build,read,query,sceneFor,visible,status,neighbors,contextFor,metricsFor,safeURL,parseRecords,normalizeRecord};
});
