const {chromium}=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');

const BASE='http://127.0.0.1:8765/';
const root=path.resolve(__dirname,'..','artifacts');
fs.mkdirSync(root,{recursive:true});
async function load(page,pathAndQuery){
 await page.goto(BASE+pathAndQuery,{waitUntil:'domcontentloaded',timeout:25000});
 await page.waitForFunction(()=>document.querySelector('#bc-event-id')?.textContent==='C004',{timeout:12000});
}
async function run(){
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const pageErrors=[];
 try{
  const desktop=await browser.newPage({viewport:{width:1600,height:1000},deviceScaleFactor:1});
  desktop.on('pageerror',e=>pageErrors.push('desktop '+e.message));
  await load(desktop,'relation-compare.html?from=basic&change=C004');
  assert.match(await desktop.locator('#bc-event-title').innerText(),/签约4宗/);
  assert.equal(await desktop.locator('#bc-event-list .bc-event').count(),12);
  assert.equal(await desktop.locator('#bc-before [data-node="hpm"]').count(),1);
  assert.equal(await desktop.locator('#bc-after [data-node="hpm"]').count(),1);
  assert.match(await desktop.locator('#bc-before [data-node="hpm"]').getAttribute('class'),/bc-node-muted/);
  assert.match(await desktop.locator('#bc-after [data-node="hpm"]').getAttribute('class'),/bc-node-pending/);
  assert.equal(await desktop.locator('#bc-before [data-edge="E019"]').count(),0);
  assert.equal(await desktop.locator('#bc-after [data-edge="E019"]').count(),1);
  const x1=await desktop.locator('#bc-before [data-node="hpm"] .bc-node-ring').getAttribute('cx');
  const x2=await desktop.locator('#bc-after [data-node="hpm"] .bc-node-ring').getAttribute('cx');
  assert.equal(x1,x2,'左右两图必须使用同一节点坐标');
  await desktop.locator('#bc-after [data-node="hpm"]').click({force:true});
  assert.match(await desktop.locator('#bc-selected-text').innerText(),/待落地/);
  const view0=await desktop.locator('#bc-before').getAttribute('viewBox');
  await desktop.locator('#bc-zoom').evaluate(el=>{el.value='130';el.dispatchEvent(new Event('input',{bubbles:true}));});
  const view1=await desktop.locator('#bc-before').getAttribute('viewBox');
  assert.notEqual(view0,view1,'同步缩放必须有效');
  assert.equal(view1,await desktop.locator('#bc-after').getAttribute('viewBox'),'两图缩放必须同步');
  await desktop.locator('#bc-reset').click();
  assert.equal(await desktop.locator('#bc-before').getAttribute('viewBox'),view0);
  await desktop.screenshot({path:path.join(root,'boluo-compare-desktop-1600.png'),fullPage:true});
  await desktop.locator('.bc-event[data-id="C008"]').click();
  assert.match(await desktop.locator('#bc-event-title').innerText(),/熟料生产线关停/);
  assert.equal(await desktop.locator('#bc-after [data-node="glc"]').count(),1,'不能把企业整体消失');
  assert.equal(await desktop.locator('#bc-after [data-edge="E044"]').count(),1);
  await desktop.locator('.bc-event[data-id="C006"]').click();
  assert.equal(await desktop.locator('#bc-after [data-edge="E026"]').count(),1);
  assert.match(await desktop.locator('#bc-uncertainty').innerText(),/未建成/);
  await desktop.locator('.bc-event[data-id="C012"]').click();
  const style=await desktop.locator('#bc-after [data-edge="E041"] .bc-edge-visible').getAttribute('stroke');
  assert.notEqual(style,'#a13e47','没有变化的E041不应该高亮为本次变化');
  assert.equal(new URL(desktop.url()).searchParams.get('change'),'C012','切换事件应更新可分享地址');
  await desktop.close();

  const mobile=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
  mobile.on('pageerror',e=>pageErrors.push('mobile '+e.message));
  await load(mobile,'relation-compare.html?from=basic&change=C004');
  assert.equal(await mobile.locator('.bc-panel--before').isVisible(),false,'手机默认突出当前变化');
  assert.equal(await mobile.locator('.bc-panel--after').isVisible(),true);
  await mobile.locator('[data-bc-view="both"]').click();
  assert.equal(await mobile.locator('.bc-panel--before').isVisible(),true,'手机必须可以开启同屏对比');
  assert.equal(await mobile.locator('.bc-panel--after').isVisible(),true);
  const overflow=await mobile.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
  assert.ok(overflow<=2,'移动端页面出现横向溢出：'+overflow);
  await mobile.screenshot({path:path.join(root,'boluo-compare-mobile-390.png'),fullPage:true});
  await mobile.close();

  const baseline=await browser.newPage({viewport:{width:1300,height:860}});
  baseline.on('pageerror',e=>pageErrors.push('baseline '+e.message));
  await baseline.goto(BASE+'who.html?from=changes&change=C004',{waitUntil:'domcontentloaded'});
  const href=await baseline.locator('#bl-journey-next').getAttribute('href');
  assert.ok(href.includes('relation-compare.html?from=basic&change=C004'),'04必须带着C004进入05');
  const direct=await baseline.locator('#bl-compare-next').getAttribute('href');
  assert.ok(direct.includes('change=C004'),'04页面内直达按钮也要保留C004');
  await baseline.close();
  assert.deepEqual(pageErrors,[],'浏览器JS运行错误');
  console.log('✓ 05桌面1600/手机390，12事件切换、C004/C006/C008/C012状态、同步选中与缩放、04→05深链接全部通过');
 }finally{await browser.close();}
}
run().catch(e=>{console.error(e);process.exitCode=1;});
