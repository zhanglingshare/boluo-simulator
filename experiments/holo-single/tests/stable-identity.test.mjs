// Relation World: stable IDs + C004 pending project boundary regression
import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {M3_VERSION,FOCAL_IDS,simulate,compareWorlds} from '../m3/engine.mjs';

const base=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const repo=path.resolve(base,'../..');
const html=fs.readFileSync(path.join(base,'index.html'),'utf8');
const graph=JSON.parse(fs.readFileSync(path.join(repo,'data/industry-graph.json'),'utf8'));
const c=JSON.parse(fs.readFileSync(path.join(repo,'data/relationship-changes-v1.json'),'utf8'));
const evidence=JSON.parse(fs.readFileSync(path.join(repo,'data/relationship-evidence-v1.json'),'utf8'));
const first=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(first&&first.includes('window.BOLUO_DATA='));
function readGraph(edges){
 const MockXHR=class{
  open(){}
  send(){this.status=200;this.responseText=JSON.stringify({...graph,edges});}
 };
 return new Function('window','console','XMLHttpRequest',first+';return window.BOLUO_DATA;')({},{warn(){}},MockXHR);
}
test('Skills 数据包即使重新排序，30条关系ID及M3对象保持一致',()=>{
 const a=readGraph(graph.edges),b=readGraph([...graph.edges].reverse());
 assert.equal(a.nodes.length,27);assert.equal(a.edges.length,30);
 const ids=x=>x.edges.map(e=>e.id).sort();
 assert.deepEqual(ids(a),ids(b));
 assert.equal(new Set(ids(a)).size,a.edges.length);
 assert.ok(a.edges.every(e=>e.id.startsWith('rel:')));
 for(const id of FOCAL_IDS)assert.ok(ids(a).includes(id),'关键关系丢失：'+id);
 const la=simulate(a.nodes,a.edges,.2),ha=simulate(a.nodes,a.edges,.85);
 const lb=simulate(b.nodes,b.edges,.2),hb=simulate(b.nodes,b.edges,.85);
 assert.deepEqual(la.reachable,lb.reachable);
 assert.deepEqual(ha.reachable,hb.reachable);
 assert.equal(ha.totalWeight,hb.totalWeight);
 assert.equal(la.reachable.length,4);
 assert.equal(ha.reachable.length,9);
 assert.equal(compareWorlds(la,ha).changedCount,4);
});
test('C004只确认签约，项目待落地且三条产业协同是待验证的',()=>{
 const ev=c.changes.find(x=>x.change_id==='C004');
 assert.ok(ev);assert.equal(ev.involved_node_ids.length,4);
 assert.equal(ev.involved_edge_ids.length,3);
 const m=new Map(evidence.nodes.map(n=>[n.node_id,n]));
 const r=new Map(evidence.edges.map(e=>[e.edge_id,e]));
 for(const id of ev.involved_node_ids)assert.equal(m.get(id)?.node_status,'pending');
 for(const id of ev.involved_edge_ids)assert.equal(r.get(id)?.evidence_type,'待验证假设');
});
test('发现层不覆盖M2/M3并且公开入口能跳转到C004',()=>{
 const js=fs.readFileSync(path.join(base,'discovery.js'),'utf8');
 const css=fs.readFileSync(path.join(base,'discovery.css'),'utf8');
 assert.match(html,/discovery\.css/);assert.match(html,/discovery\.js/);
 assert.match(html,/window\.BOLUO_ENGINE/);assert.match(html,/m3\/ui\.mjs/);
 assert.match(js,/holo-home-v9\.html#change=C004/);
 assert.match(js,/relationship-changes-v1\.json/);
 assert.match(js,/node_status/);
 assert.match(css,/@media\(max-width:720px\)/);
 assert.equal(M3_VERSION,'m3-structural-0.3');
});
