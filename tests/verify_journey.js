// Focused regression for the 01→03→04 evidence-first navigation (Node.js built-ins only)
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const get=p=>fs.readFileSync(path.join(root,p),'utf8');
const JS=get('assets/boluo-journey.js');
const expected={
 today:'index-legacy-2026-11-03.html',
 town:'town.html',
 changes:'holo-home-v9.html',
 basic:'who.html'
};
const changeData=JSON.parse(get('data/relationship-changes-v1.json'));
assert.ok(changeData.changes.some(c=>c.change_id==='C004'),'C004必须是已收录的正式变化ID');

for(const [page,file] of Object.entries(expected)){
 const html=get(file);
 assert.ok(html.includes('data-bl-journey="'+page+'"'),file+' 页面标识');
 assert.ok(html.includes('assets/boluo-journey.js'),file+' 引用统一导航逻辑');
 assert.ok(html.includes('assets/boluo-journey.css'),file+' 引用统一导航样式');
 assert.equal((html.match(/<style\b/g)||[]).length,(html.match(/<\/style>/g)||[]).length,file+' style标签必须闭合');
 for(const m of html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g))
  assert.doesNotThrow(()=>new vm.Script(m[1]),file+' 内联脚本语法');
}
assert.doesNotThrow(()=>new vm.Script(JS),'导航脚本语法');
assert.match(get(expected.today),/href="holo-home-v9\.html\?from=today"/,'01必须带上下文到03');
assert.match(get(expected.today),/topic="\+encodeURIComponent\(/,'每条公开话题应传递标题线索');
assert.match(get(expected.changes),/location\.pathname\+location\.search\+"#change="/,'03切事件保留查询参数');
assert.match(get(expected.changes),/bl:change-selected/,'03向接力栏广播真实选中事件');
assert.match(get(expected.basic),/<\/style>\s*<script>/,'04社交脚本不应被错误放入style里');
assert.match(get(expected.town),/<\/style>\s*<script>/,'02社交脚本不应被错误放入style里');

class MockNode{
 constructor(tag){this.tag=tag;this.children=[];this.attributes={};this.hidden=false;this.textContent='';this.href='';this.className='';this.parent=null;}
 append(...nodes){for(const n of nodes){if(n==null)continue;this.children.push(n);n.parent=this;}}
 appendChild(n){this.append(n);return n}
 insertBefore(n,other){const i=this.children.indexOf(other);if(i<0)this.append(n);else{this.children.splice(i,0,n);n.parent=this;}return n;}
 insertAdjacentElement(where,n){if(where==='afterend'&&this.parent){const i=this.parent.children.indexOf(this);this.parent.children.splice(i+1,0,n);n.parent=this;}}
 replaceChildren(...nodes){this.children=[];this.append(...nodes);}
 setAttribute(k,v){this.attributes[k]=String(v);}
 getAttribute(k){return this.attributes[k]||null;}
 get firstChild(){return this.children[0]||null}
 get firstElementChild(){return this.firstChild}
 querySelector(k){return this.queryMap?.[k]||null;}
}
function make(page,search='',hash=''){
 const body=new MockNode('body');body.setAttribute('data-bl-journey',page);body.append(new MockNode('old-content'));
 const wrap=new MockNode('div'),kpis=new MockNode('div');wrap.append(new MockNode('h1'),new MockNode('p'),kpis);
 body.queryMap={'.wrap':wrap};wrap.queryMap={'.kpis':kpis};
 const listeners={};const ids={detailTitle:new MockNode('div')};
 ids.detailTitle.textContent='四宗项目签约';
 const document={body,createElement:tag=>new MockNode(tag),
  createTextNode:txt=>{const n=new MockNode('text');n.textContent=txt;return n},
  getElementById:k=>ids[k]||null,addEventListener:(k,fn)=>{listeners[k]=fn}};
 const window={addEventListener:(k,fn)=>{listeners[k]=fn}};
 const location={search,hash,pathname:'/boluo-simulator/'+expected[page]};
 const fetch=()=>Promise.resolve({ok:true,json:()=>Promise.resolve(changeData)});
 const sandbox={document,window,location,fetch,URLSearchParams,console};
 vm.runInNewContext(JS,sandbox,{timeout:3000,filename:'assets/boluo-journey.js'});
 const nav=body.children.find(n=>n.id==='bl-journey-bar'),ctx=body.children.find(n=>n.id==='bl-journey-context');
 assert.ok(nav,'缺少共享导航');
 assert.ok(ctx,'缺少上下文条');
 return {body,nav,ctx,listeners};
}
function find(n,id){
 if(n?.id===id)return n;
 for(const x of n?.children||[]){const r=find(x,id);if(r)return r;}
 return null;
}
const today=make('today');
assert.equal(find(today.nav,'bl-journey-next').href,'holo-home-v9.html?from=today');
const town=make('town');
assert.equal(find(town.nav,'bl-journey-next').href,'holo-home-v9.html?from=town');
const changes=make('changes','?from=today&topic='+encodeURIComponent('企业重大消息'),'#change=C004');
assert.equal(find(changes.nav,'bl-journey-next').href,'who.html?from=changes&change=C004');
assert.equal(changes.ctx.hidden,false);
changes.listeners['bl:change-selected']({detail:{changeId:'C008'}});
assert.ok(find(changes.nav,'bl-journey-next').href.startsWith('who.html?from=changes'));
const basic=make('basic','?from=changes&change=C004');
const baseline=find(basic.body,'bl-journey-baseline');
assert.ok(baseline&&!baseline.hidden,'04页必须展示选中事件的宏观上下文');
assert.ok(find(basic.nav,'bl-journey-next')===null,'05未建成时不得制造假链接');
Promise.resolve().then(()=>Promise.resolve()).then(()=>{
 const text=(n)=>[n?.textContent,...(n?.children||[]).map(text)].join(' ');
 assert.ok(text(baseline).includes('80亿')||text(baseline).includes('签约'),'基本面应接收C004正式记录');
 console.log('✓ 01/02/03/04 统一导航、上下文传递、C004数据关联、语法和样式标签检查通过');
}).catch(e=>{console.error(e);process.exitCode=1;});
