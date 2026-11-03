const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const BASE='http://127.0.0.1:8765/';
const out=path.resolve(__dirname,'../artifacts/boluo-intel');fs.mkdirSync(out,{recursive:true});
async function run(){
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const errors=[];
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900},acceptDownloads:true});
  page.on('pageerror',e=>errors.push('lab desktop '+e.message));
  await page.goto(BASE+'intel-lab.html?change=C004',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelector('#ia-run-id')?.textContent?.startsWith('BL-C004-'),{timeout:19000});
  assert.equal(await page.locator('.ia-event').count(),12,'all recorded changes');
  assert.equal(await page.locator('.ia-edge').count()>0,true,'drawn graph edges');
  assert.equal(await page.locator('.ia-node').count()>0,true,'drawn graph nodes');
  assert.ok(await page.locator('#ia-blind-list .ia-brief-item').count()>=2,'blindspots visible');
  assert.ok(await page.locator('#ia-claims-list .ia-brief-item').count()>=2,'propositions grounded');
  const beforeA=await page.locator('#ia-scenarios .ia-scenario').first().locator('strong').innerText();
  await page.selectOption('#ia-grade','ABC');
  const nowABC=await page.locator('#ia-scenarios .ia-scenario').nth(2).locator('strong').innerText();
  assert.match(beforeA,/\d+ \/ \d+/);assert.match(nowABC,/\d+ \/ \d+/);
  await page.locator('#ia-remove option').last().evaluate(el=>{el.selected=true;el.closest('select').dispatchEvent(new Event('change',{bubbles:true}));});
  const id=await page.locator('#ia-run-id').innerText();
  assert.ok(id.startsWith('BL-C004-'));
  const dlPromise=page.waitForEvent('download');
  await page.locator('#ia-export').click();
  const dl=await dlPromise;
  assert.equal(dl.suggestedFilename(),id+'.json');
  const data=JSON.parse(fs.readFileSync(await dl.path(),'utf8'));
  assert.equal(data.inputs.evidence.nodes.length,36);
  assert.equal(data.inputs.changes.changes.length,12);
  assert.equal(data.manifest.runId,id);
  await page.locator('#ia-import').setInputFiles(await dl.path());
  await page.waitForFunction(()=>document.querySelector('#ia-import-status')?.textContent?.includes('校验通过'),{timeout:10000});
  assert.equal(await page.locator('#ia-run-id').innerText(),id,'importing restores the same run');
  await page.locator('[data-ia-tab="sources"]').click();
  assert.ok(await page.locator('#ia-tab-sources a[href^="http"]').count()>=1,'real source links');
  await page.locator('.ia-event[data-id="C008"]').click();
  await page.waitForFunction(()=>document.querySelector('#ia-run-id')?.textContent?.startsWith('BL-C008-'));
  assert.equal(new URL(page.url()).searchParams.get('change'),'C008');
  assert.match(await page.locator('#ia-event-title').innerText(),/熟料|固力|生产线/);
  await page.screenshot({path:path.join(out,'lab-1440.png'),fullPage:true,animations:'disabled'});
  await page.close();

  const bridge=await browser.newPage({viewport:{width:1440,height:900}});
  bridge.on('pageerror',e=>errors.push('bridge '+e.message));
  await bridge.goto(BASE+'industry-changes.html?change=C004',{waitUntil:'domcontentloaded'});
  await bridge.locator('.ibi-trigger').waitFor();
  await bridge.locator('.ibi-trigger').click();
  await bridge.locator('.ibi-item').first().waitFor({timeout:15000});
  assert.ok(await bridge.locator('.ibi-item').count()>=1);
  assert.match(await bridge.locator('.ibi-open-lab').getAttribute('href'),/change=C004/);
  await bridge.locator('.ibi-open-lab').click();
  await bridge.waitForURL(/intel-lab\.html\?change=C004/);
  await bridge.close();

  const topic=await browser.newPage({viewport:{width:1440,height:900}});
  topic.on('pageerror',e=>errors.push('topic '+e.message));
  await topic.goto(BASE+'industry-changes.html?from=today&topic='+encodeURIComponent('公开新闻观察'),{waitUntil:'domcontentloaded'});
  await topic.locator('.ibi-trigger').click();
  assert.match(await topic.locator('.ibi-status').innerText(),/尚未绑定结构事件/,'default C004 must not be assumed as real causal link');
  await topic.locator('#ec-feed-list [data-event="C006"]').click({force:true});
  await topic.locator('.ibi-item').first().waitFor({timeout:15000});
  assert.match(await topic.locator('.ibi-open-lab').getAttribute('href'),/change=C006/);
  await topic.close();

  for(const file of ['intel-lab.html?change=C004','index-legacy-2026-11-03.html','town.html','industry-changes.html','who.html','relation-compare.html']){
   const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
   mobile.on('pageerror',e=>errors.push(file+' 390 '+e.message));
   await mobile.goto(BASE+file,{waitUntil:'domcontentloaded'});
   if(file.startsWith('intel-lab'))await mobile.waitForFunction(()=>document.querySelector('#ia-run-id')?.textContent?.startsWith('BL-C004-'));
   else await mobile.locator('.ibi-trigger').waitFor({timeout:10000});
   const overflow=await mobile.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
   assert.ok(overflow<=4,file+' mobile horizontal overflow: '+overflow);
   if(!file.startsWith('intel-lab')){await mobile.locator('.ibi-trigger').click();assert.ok(await mobile.locator('.ibi-panel').isVisible());}
   await mobile.screenshot({path:path.join(out,file.split('?')[0].replace('.html','')+'-390.png'),fullPage:true,animations:'disabled'});
   await mobile.close();
  }
  assert.deepEqual(errors,[],'no JS page errors');
  console.log('✓ Evidence workspace: 12 events, real A/B/C stress, blindspots, full Run-ID export, first-five bridge, 390px mobile, source links');
 }finally{await browser.close();}
}
run().catch(err=>{console.error(err);process.exitCode=1;});