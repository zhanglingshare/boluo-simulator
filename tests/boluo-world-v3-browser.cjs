/* Five-scene acceptance: connected evidence trail, real graph interactions and responsive layout. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const BASE='http://127.0.0.1:8765/';
const dir=path.resolve(__dirname,'../artifacts/boluo-world-v3');fs.mkdirSync(dir,{recursive:true});
async function open(page,url,ready){
 await page.goto(BASE+url,{waitUntil:'domcontentloaded'});
 await page.locator(ready).first().waitFor({timeout:18000});
}
async function run(){
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const pageErrors=[];const notes=[];
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  page.on('pageerror',e=>pageErrors.push('desktop '+e.message));
  await open(page,'index-legacy-2026-11-03.html','#v3-topic-list .v3-topic-option');
  const options=page.locator('#v3-topic-list .v3-topic-option');
  assert.ok(await options.count()>=3,'real topic controls');
  const title=await options.nth(1).locator('.v3-topic-text').innerText();
  await options.nth(1).click();
  assert.ok((await page.locator('.v3-story-info strong').innerText()).includes(title));
  await page.locator('.v3-topic-actions a').click();
  await page.waitForURL(/industry-changes\.html\?/);
  await page.locator('#ec-graph .ec-graph-node').first().waitFor();
  assert.equal(new URL(page.url()).searchParams.get('topic'),title);
  assert.match(await page.locator('.v3-story-info strong').innerText(),/公开话题/,'default example not auto linked');
  assert.equal(await page.locator('.v3-graph-dock').count(),1);
  await page.locator('#ec-feed-list [data-event="C006"]').click({force:true});
  assert.match(await page.locator('.v3-story-info strong').innerText(),/C006/);
  assert.ok(await page.locator('.v3-relation-cards').count(),'real relation shortcuts');
  await page.locator('#ec-graph .ec-graph-node').first().click({force:true});
  assert.ok((await page.locator('#ec-inspector-title').innerText()).length>1);
  const n=page.locator('#ec-graph .ec-graph-node').first();
  const was=await n.getAttribute('transform');
  const bb=await n.boundingBox();
  if(bb){
   const x=bb.x+bb.width/2,y=bb.y+Math.min(bb.height/3,10);
   await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+40,y+22,{steps:5});await page.mouse.up();
   const now=await page.locator('#ec-graph .ec-graph-node').first().getAttribute('transform');
   assert.notEqual(was,now,'dragging changes visual layout without changing relation data');
  }
  await page.screenshot({path:path.join(dir,'03-desktop.png'),fullPage:true,animations:'disabled'});
  await page.locator('.v3-story-next').click();
  await page.waitForURL(/who\.html/);
  assert.equal(new URL(page.url()).searchParams.get('change'),'C006');
  assert.equal(await page.locator('.v3-tension-row').count(),3);
  assert.match(await page.locator('.v3-tension-story h3').innerText(),/工业/);
  await page.locator('.v3-tension-row').nth(2).click();
  assert.match(await page.locator('.v3-tension-story h3').innerText(),/地产/);
  await page.screenshot({path:path.join(dir,'04-desktop.png'),fullPage:true,animations:'disabled'});
  await page.locator('.v3-story-next').click();
  await page.waitForURL(/relation-compare\.html/);
  await page.locator('#bc-after .bc-edge').first().waitFor({state:'attached'});
  assert.equal(new URL(page.url()).searchParams.get('change'),'C006');
  await page.locator('.v3-delta-number').first().waitFor();
  assert.equal(await page.locator('.v3-delta-number').count(),4);
  await page.locator('.v3-compare-controls .v3-mode').first().click();
  assert.equal(await page.locator('.v3-compare-controls .v3-mode').first().getAttribute('aria-pressed'),'true');
  await page.locator('.v3-compare-controls .v3-mode').last().click();
  await page.screenshot({path:path.join(dir,'05-desktop.png'),fullPage:true,animations:'disabled'});
  await page.close();

  const town=await browser.newPage({viewport:{width:1440,height:900}});
  town.on('pageerror',e=>pageErrors.push('town '+e.message));
  await open(town,'town.html','.v3-town-cell');
  assert.equal(await town.locator('.v3-town-cell').count(),16);
  await town.locator('.v3-town-cell').nth(5).click();
  const chosen=await town.locator('.v3-town-cell').nth(5).locator('strong').innerText();
  assert.equal((await town.locator('.v3-town-name').innerText()),chosen);
  await town.locator('.v3-town-focus a').click();
  await town.waitForURL(/industry-changes\.html/);
  assert.equal(new URL(town.url()).searchParams.get('town'),chosen);
  await town.close();

  for(const [file,selector] of [
   ['index-legacy-2026-11-03.html','#v3-news-console'],
   ['town.html','.v3-town-arena'],
   ['industry-changes.html','.v3-graph-dock'],
   ['who.html','.v3-tension-lab'],
   ['relation-compare.html?change=C004','.v3-compare-deck']
  ]){
   const mobile=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
   mobile.on('pageerror',e=>pageErrors.push(file+' mobile '+e.message));
   await open(mobile,file,selector);
   if(file.startsWith('relation-compare'))await mobile.locator('#bc-after .bc-edge').first().waitFor({state:'attached'});
   const overflow=await mobile.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
   assert.ok(overflow<=4,file+' mobile overflow='+overflow);
   if(file.startsWith('relation-compare')){
    assert.equal(await mobile.locator('.bc-panel--after').isVisible(),true);
    assert.equal(await mobile.locator('.bc-panel--before').isVisible(),false);
   }
   await mobile.screenshot({path:path.join(dir,file.split('?')[0].replace('.html','')+'-390.png'),fullPage:true,animations:'disabled'});
   notes.push({file,overflow});
   await mobile.close();
  }
  assert.deepEqual(pageErrors,[],'JS runtime errors');
  console.log('✓ Five-scene world: news→event→baseline→compare, town→event, graph drag, mobile screenshots '+JSON.stringify(notes));
 }finally{await browser.close();}
}
run().catch(e=>{console.error(e);process.exitCode=1;});
