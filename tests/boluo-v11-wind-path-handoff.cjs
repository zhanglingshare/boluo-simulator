'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require('playwright');
(async()=>{
 fs.mkdirSync('artifacts',{recursive:true});
 const browser=await chromium.launch({headless:true});
 const errors=[];
 const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1});
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error'&&!/favicon/i.test(m.text()))errors.push(m.text());});

 await page.goto('http://127.0.0.1:8765/v11/wind.html?from=plan&route=manufacturing&paths=manufacturing&shock=orders&active=1',{waitUntil:'networkidle'});
 await page.waitForFunction(()=>window.BoluoWind&&window.BoluoWind.getResults());
 for(const selector of ['#baseScale','#baseVol','#basePathControls','#baseCount','#baseReset','#baseRun','#strength','#runTest','#detailChart','#distChart','#detailThreshold','#conditionBoard','#chainTrack','#bufferOn','#saveExp','#savedList','#copyLink','#goDecisionChallenge']){
  assert.equal(await page.locator(selector).count(),1,'existing page-07 feature retained: '+selector);
 }
 assert.equal(await page.locator('#pathHandoff').isVisible(),true,'06 path handoff appears when a path snapshot is present');
 assert.equal(await page.locator('[data-scope="selected"]').getAttribute('aria-pressed'),'true','path-scoped stress test is the default after page 06');
 assert.match(await page.locator('#pathHandoffPaths').innerText(),/存量企业扩能/,'selected route name is carried into page 07');
 assert.match(await page.locator('#pathExposureStatus').innerText(),/命中 1 个/,'the selected route maps to one relevant model channel');

 const scoped=await page.evaluate(()=>window.BoluoWind.getResults());
 await page.locator('[data-scope="all"]').click();
 const whole=await page.evaluate(()=>window.BoluoWind.getResults());
 assert.ok(whole.stress.p50<scoped.stress.p50-20,'whole-county order shock affects more baseline channels than the manufacturing-only path scope');
 assert.equal(await page.locator('[data-scope="all"]').getAttribute('aria-pressed'),'true','whole-county scope toggle is active');
 await page.locator('[data-scope="selected"]').click();
 await page.locator('.rescue-toggle').click();
 assert.equal(await page.locator('#bufferOn').isChecked(),true,'original buffer toggle remains usable');
 const buffered=await page.evaluate(()=>window.BoluoWind.getResults());
 assert.ok(buffered.buffer.p50>buffered.stress.p50,'the original buffer scenario remains active under path-scoped stress');
 assert.match(await page.locator('#shareSummary').innerText(),/存量企业扩能/,'share summary names the selected path context');

 const challenge=new URL(await page.locator('#goDecisionChallenge').getAttribute('href'));
 assert.equal(challenge.searchParams.get('paths'),'manufacturing','page 09 handoff preserves selected paths');
 assert.equal(challenge.searchParams.get('scope'),'selected','page 09 handoff preserves experiment scope');
 const insights=new URL(await page.locator('#conditionToEight').getAttribute('href'));
 assert.equal(insights.searchParams.get('paths'),'manufacturing','page 08 handoff preserves selected paths');
 assert.equal(insights.searchParams.get('scope'),'selected','page 08 handoff preserves experiment scope');

 await page.locator('#saveExp').click();
 const record=await page.evaluate(()=>JSON.parse(localStorage.getItem('boluo-v11-wind-experiments')||'[]')[0]);
 assert.deepEqual(record.paths,['manufacturing'],'saved experiment preserves the selected path set');
 assert.equal(record.scope,'selected','saved experiment preserves its scope');
 await page.locator('#savedList').click();
 const restored=new URL(await page.locator('#modalBody a').first().getAttribute('href'));
 assert.equal(restored.searchParams.get('paths'),'manufacturing','saved experiment link restores the path set');
 assert.equal(restored.searchParams.get('scope'),'selected','saved experiment link restores the scope');
 await page.screenshot({path:'artifacts/wind-path-handoff-desktop.png',fullPage:true});

 const noMatch=await browser.newPage({viewport:{width:1280,height:900}});
 noMatch.on('pageerror',e=>errors.push(e.message));
 await noMatch.goto('http://127.0.0.1:8765/v11/wind.html?from=plan&route=services&paths=services&shock=orders&active=1',{waitUntil:'networkidle'});
 await noMatch.waitForFunction(()=>window.BoluoWind&&window.BoluoWind.getResults());
 const noMatchResult=await noMatch.evaluate(()=>window.BoluoWind.getResults());
 assert.equal(noMatchResult.base.p50,noMatchResult.stress.p50,'unmapped indirect order-to-services effect is not fabricated as a GDP loss');
 assert.match(await noMatch.locator('#pathExposureStatus').innerText(),/没有直接映射/,'unmapped relationship is explicitly disclosed');
 await noMatch.locator('[data-scope="all"]').click();
 const allResult=await noMatch.evaluate(()=>window.BoluoWind.getResults());
 assert.ok(allResult.stress.p50<allResult.base.p50,'global mode restores the original full-scope shock');
 await noMatch.close();

 const fullCoverage=await browser.newPage({viewport:{width:1280,height:900}});
 await fullCoverage.goto('http://127.0.0.1:8765/v11/wind.html?from=plan&route=innovation&paths=new,manufacturing,innovation&shock=orders&active=1',{waitUntil:'networkidle'});
 await fullCoverage.waitForFunction(()=>window.BoluoWind&&window.BoluoWind.getResults());
 const combined=await fullCoverage.evaluate(()=>window.BoluoWind.getResults());
 await fullCoverage.locator('[data-scope="all"]').click();
 const combinedAll=await fullCoverage.evaluate(()=>window.BoluoWind.getResults());
 assert.equal(combined.stress.p50,combinedAll.stress.p50,'overlapping route mappings are deduplicated and full coverage matches whole-county scope');
 await fullCoverage.close();

 await page.setViewportSize({width:390,height:844});
 await page.reload({waitUntil:'networkidle'});
 await page.waitForFunction(()=>window.BoluoWind&&window.BoluoWind.getResults());
 assert.equal(await page.locator('#pathHandoff').isVisible(),true,'path handoff remains visible on mobile');
 assert.ok(await page.locator('.path-scope-toggle button').count()===2,'both stress scopes remain available on mobile');
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
 assert.ok(overflow<=2,'mobile document horizontal overflow '+overflow+'px');
 await page.screenshot({path:'artifacts/wind-path-handoff-mobile.png',fullPage:true});
 assert.deepEqual(errors,[],'no JavaScript or console errors');
 await browser.close();
 process.stdout.write('PASS: page-06 path handoff, path-scoped Monte Carlo stress, global mode, unmapped-link honesty, buffer, save/restore, page-08/page-09 handoffs, retained controls and mobile layout.\n');
})().catch(e=>{console.error(e);process.exit(1);});
