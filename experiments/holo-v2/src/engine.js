/* Pure, deterministic graph/scenario functions. No rendering and no external services. */
window.BOLUO_ENGINE=(()=>{
 const D=window.BOLUO_DATA;
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
 const groups=new Map(D.clusters.map(c=>[c.id,c]));
 const hash=(s)=>{let h=2166136261>>>0;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0};
 const rand=(key,salt=0)=>((hash(key+'|'+salt)%100000)/100000);
 const dataNodes=D.nodes.concat(D.towns.map(t=>({id:'town:'+t.name,name:t.name,type:'town',town:t.name,desc:t.tag+' · '+t.food+' · '+t.play,cluster:'life',editorial:true,verification:t.verification})));
 const nodeMap=new Map(dataNodes.map(n=>[n.id,n]));
 function originalPosition(n){
   const c=groups.get(n.cluster), p=c.pos;
   const r=0.21+rand(n.id,1)*0.65, a=rand(n.id,2)*Math.PI*2, b=(rand(n.id,3)-.5)*1.4;
   return [p[0]+Math.cos(a)*r,p[1]+Math.sin(a)*r*.78,p[2]+b*.6];
 }
 const basePositions=new Map(dataNodes.map(n=>[n.id,originalPosition(n)]));
 function edgeStrength(edge,uncertainty){
  const u=clamp(uncertainty,0,1);
  if(edge.level==='A')return 1;
  if(edge.level==='B')return 0.12+u*0.85;
  return 0.035+u*0.22;
 }
 function compute(uncertainty=0.50,grade='all'){
  const nodes=dataNodes.map(n=>({...n}));
  const edges=D.edges.filter(e=>grade==='all'||e.level===grade).map(e=>({...e,strength:edgeStrength(e,uncertainty)}));
  const scores=new Map(nodes.map(n=>[n.id,0]));
  const neighbors=new Map(nodes.map(n=>[n.id,new Set()]));
  for(const e of edges){scores.set(e.source,(scores.get(e.source)||0)+e.strength);scores.set(e.target,(scores.get(e.target)||0)+e.strength);neighbors.get(e.source)?.add(e.target);neighbors.get(e.target)?.add(e.source)}
  const top=[...scores.entries()].sort((a,b)=>b[1]-a[1]);
  const positions=new Map();
  // Layout displacement derives from weighted evidence links. It is NOT a measured distance/flow.
  for(const n of nodes){let base=basePositions.get(n.id).slice();
   const touch=edges.filter(e=>e.source===n.id||e.target===n.id);
   if(touch.length){let fx=0,fy=0,fz=0,ws=0;for(const e of touch){const other=basePositions.get(e.source===n.id?e.target:e.source);if(!other)continue;const w=e.strength*0.08;fx+=(other[0]-base[0])*w;fy+=(other[1]-base[1])*w;fz+=(other[2]-base[2])*w;ws+=w;}const q=1/(1+ws);base=[base[0]+fx*q,base[1]+fy*q,base[2]+fz*q];}
   positions.set(n.id,base);
  }
  const totalWeight=edges.reduce((a,e)=>a+e.strength,0);
  return {nodes,edges,scores,neighbors,positions,top,totalWeight,grade,uncertainty,edgeCount:edges.length};
 }
 function neighborhood(graph,id,depth=1){let visited=new Set([id]);let frontier=new Set([id]);for(let step=0;step<depth;step++){let next=new Set();for(const n of frontier)for(const x of graph.neighbors.get(n)||[]){if(!visited.has(x)){visited.add(x);next.add(x)}}frontier=next;}return visited}
 function clusterCounts(){return D.clusters.map(c=>({...c,nodes:dataNodes.filter(n=>n.cluster===c.id).length,edges:D.edges.filter(e=>nodeMap.get(e.source)?.cluster===c.id||nodeMap.get(e.target)?.cluster===c.id).length}))}
 function intervalComparison(){const low=compute(.16),high=compute(.88);return {low,high,delta:high.totalWeight-low.totalWeight}}
 return {D,dataNodes,nodeMap,hash,rand,clamp,basePositions,groups,compute,neighborhood,clusterCounts,intervalComparison,edgeStrength};
})();
