const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),file=p=>fs.readFileSync(path.join(root,p),'utf8');
const pages=['index-legacy-2026-11-03.html','town.html','holo-home-v9.html','who.html','relation-compare.html'];

test('五页共同引用编辑式视觉体系，内联脚本可解析',()=>{
 for(const p of pages){
  const html=file(p);
  assert.match(html,/assets\/boluo-ui\.css/,p);
  assert.match(html,/data-bl-journey=/,p);
  for(const m of html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g))
   assert.doesNotThrow(()=>new vm.Script(m[1]),p+' javascript');
  assert.equal((html.match(/<style\b/g)||[]).length,(html.match(/<\/style>/g)||[]).length,p+' styles');
 }
});
test('01入口只展示真实公开情报，不加载候选游戏模拟概率',()=>{
 const p=file(pages[0]);
 assert.match(p,/id="bl-live-brief"/);
 assert.doesNotMatch(p,/id="baseHit"|id="baseP50"|HT\.run\(|<script src="model\.js"/);
 assert.doesNotMatch(p,/id="kpiGrid"/);
 assert.match(p,/hot\.json/);
});
test('04不再混用企业数量和亿元，不再使用旧GDP及编造年度计划',()=>{
 const s=file('who.html');
 assert.match(s,/970\.87,1005\.45/);
 assert.doesNotMatch(s,/613,695,783,869,952,1005\.45/);
 assert.match(s,/68\.6%/);
 assert.match(s,/686家/);
 assert.match(s,/23\.0/);
 assert.match(s,/-4\.2/);
 assert.doesNotMatch(s,/石湾\(企业数\)|园洲344亿第一/);
 assert.doesNotMatch(s,/当前速度外推|data:\[1005\.45,1070,1145,1240,1380,1600\]/);
 assert.match(s,/等额插值/);
 assert.match(s,/不变价/);
 assert.match(s,/2025年统计公报/);
});
test('hot.json 新增2026-11-02报导严格标明两县合计，列表链接不能自动核验',()=>{
 const j=JSON.parse(file('hot.json'));
 assert.equal(j.count,j.items.length);
 assert.equal(new Set(j.items.map(x=>x.title)).size,j.items.length);
 assert.equal(j.editorial_reviewed_at,'2026-11-03');
 const newest=j.items.find(x=>/1672万人次/.test(x.title));
 assert.ok(newest);
 assert.match(newest.summary,/博罗、龙门两县/);
 assert.match(newest.summary,/不得记为博罗单县/);
 assert.match(newest.url,/dayoo\.com\/guangdong\/202611\/02/);
 for(const x of j.items){
  assert.ok(/^https?:\/\//.test(x.url||''),x.title+' no url');
  if(/\/tpxw\/|\?c=|\/gkmlpt\/mindex|\/index\.html$/.test(x.url))
   assert.notEqual(x.verified_status,'已核验',x.title+' evidence citation is only a listing');
 }
});
test('生活入口不把快照写成真正实时更新，03、05证据底座不被修改',()=>{
 assert.match(file('town.html'),/当前公开资料快照/);
 assert.match(file('relation-compare.html'),/before VS after|加入前 VS 加入后/);
 assert.match(file('holo-home-v9.html'),/data-bl-journey="changes"/);
});
