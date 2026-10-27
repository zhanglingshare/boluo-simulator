/* DOM behavioral smoke without a browser: catches initialization/runtime exceptions.
   Not a replacement for real WebGL, pointer, or mobile rendering tests. */
import fs from 'node:fs';import vm from 'node:vm';import path from 'node:path';import assert from 'node:assert/strict';
const root=path.resolve(import.meta.dirname,'..');
const elements=new Map();const children=[];
const ctx2d={canvas:{width:1440,height:900},setTransform(){},clearRect(){},save(){},restore(){},scale(){},translate(){},rotate(){},beginPath(){},ellipse(){},arc(){},moveTo(){},lineTo(){},quadraticCurveTo(){},stroke(){},fill(){},fillText(){},setLineDash(){},createRadialGradient(){return {addColorStop(){}}}};
function fake(id=''){if(!elements.has(id)){let cl=new Set();let el={id,style:{},dataset:{},disabled:false,classList:{add(s){cl.add(s)},remove(s){cl.delete(s)},toggle(s,v){if(v)cl.add(s);else cl.delete(s)},contains(s){return cl.has(s)}},setAttribute(){},addEventListener(){},appendChild(v){children.push(v)},getContext(type){return type==='webgl2'?null:ctx2d},getBoundingClientRect(){return {left:0,top:0,width:1440,height:900}},textContent:'',innerHTML:'',width:0,height:0};elements.set(id,el)}return elements.get(id)}
const document={getElementById:fake,querySelectorAll:()=>[],createElement:()=>fake('created_'+elements.size)};
let frame;
const window={innerWidth:1440,innerHeight:900,devicePixelRatio:1,matchMedia:()=>({matches:false}),addEventListener(){}};
const sandbox={window,document,console,setTimeout:()=>0,clearTimeout(){},requestAnimationFrame(cb){frame=cb},Math};
window.window=window;
const context=vm.createContext(sandbox);
for(const file of ['data.js','engine.js','app.js'])vm.runInContext(fs.readFileSync(path.join(root,'src',file),'utf8'),context,{filename:file});
const debug=window.__boluoDebug;
assert(debug,'debug API missing');
assert.equal(debug.state.focusCluster,null);
assert.equal(debug.state.webgl,false);
debug.openCluster('industry');assert.equal(debug.state.focusCluster,'industry');
debug.openNode('htd');assert.equal(debug.state.selected,'htd');
debug.mode('relations');assert.equal(debug.state.mode,'relations');
debug.mode('scenario');assert.equal(debug.state.mode,'scenario');
const before=debug.state.score;debug.setScenario(.88);assert(debug.state.score>before);
debug.home();assert.equal(debug.state.focusCluster,null);assert.equal(debug.state.selected,null);
frame?.(1800);
console.log('INSPECTOR',fake('inspectorBody').innerHTML.slice(0,190));assert(fake('inspectorBody').innerHTML.length>100);
console.log('PASS DOM 初始化、星群、节点、透镜、假设重算、返回、单帧渲染（不含WebGL）');