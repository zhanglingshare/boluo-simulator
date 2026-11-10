'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require('playwright');
(async()=>{
 fs.mkdirSync('artifacts',{recursive:true});
 const browser=await chromium.launch({headless:true});
 const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1});
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error'&&!/favicon/i.test(m.text()))errors.push(m.text())});
 await page.goto('http://127.0.0.1:8765/v11/plan.html',{waitUntil:'networkidle'});
 await page.waitForSelector('#pathGraph .path-node');
 assert.equal(await page.locator('.v11-nav-groups a[href="./plan.html"][aria-current="page"]').count(),1,'06 is active in grouped navigation');
 assert.equal(await page.locator('.v11-nav-groups a[href="./impact.html"]').count(),1,'05 is reachable');
 assert.equal(await page.locator('.v11-nav-groups a[href="./wind.html"]').count(),1,'07 is reachable');
 assert.equal(await page.locator('.target-glance article').count(),3,'three additional target anchors visible');
 assert.equal(await page.locator('#goalsDisclosure').evaluate(el=>el.open),false,'detailed target comparison is folded by default');
 assert.equal(await page.locator('.spatial-context').evaluate(el=>el.open),false,'three-core spatial context is secondary and folded');
 assert.equal(await page.locator('#calendar').evaluate(el=>el.open),false,'annual milestones and missing-link notes are folded');
 assert.equal(await page.locator('[data-path][aria-pressed="true"]').count(),1,'one neutral starting route');
 assert.equal(await page.locator('#pathGraph .path-node').count(),4,'one route has four mechanism stages');
 assert.match(await page.locator('#pathBuildStatus').innerText(),/机制假设/,'path boundary is explicit');

 await page.locator('[data-path="services"]').click();
 assert.equal(await page.locator('[data-path][aria-pressed="true"]').count(),2,'two routes can be combined');
 assert.equal(await page.locator('#pathGraph .path-node').count(),8,'two route rows render');
 assert.match(await page.locator('#pathSynergy').innerText(),/新项目 × 本地价值链/,'known complementarity is surfaced as a hypothesis');
 await page.locator('#pathGraph [data-path-node="services:2"]').click();
 assert.match(await page.locator('#pathInspector').innerText(),/真实交易/,'node click opens evidence inspector');
 assert.match(await page.locator('#pathInspector').innerText(),/采购合同/,'inspector names verifiable evidence');

 await page.locator('[data-path="manufacturing"]').click();
 assert.equal(await page.locator('[data-path][aria-pressed="true"]').count(),3,'up to three routes can be combined');
 await page.locator('[data-path="innovation"]').click();
 assert.equal(await page.locator('[data-path][aria-pressed="true"]').count(),3,'fourth route is blocked');
 assert.match(await page.locator('#toast').innerText(),/最多组合三条/,'selection limit is explained');
 assert.match(await page.locator('#pathSynergy').innerText(),/新项目 × 本地价值链/,'pair complementarity remains visible');

 await page.locator('[data-path="services"]').click();
 assert.equal(await page.locator('[data-path][aria-pressed="true"]').count(),2,'a selected route can be removed');
 await page.locator('[data-path="innovation"]').click();
 assert.match(await page.locator('#pathSynergy').innerText(),/存量扩能 × 创新生产率/,'another complementarity pair is recognized');
 await page.locator('[data-path="innovation"]').click();
 assert.equal(await page.locator('[data-path][aria-pressed="true"]').count(),2,'route deselection updates the set');

 await page.locator('[data-stage="4"]').click();
 assert.match(await page.locator('#stageTitle').innerText(),/产生可核实贡献/,'delivery gates still follow primary route');
 await page.locator('#stageSource').click();
 assert.equal(await page.locator('#detailDialog').evaluate(el=>el.open),true,'route-specific evidence boundary opens');
 assert.match(await page.locator('#dialogBody').innerText(),/推断边界/,'dialog does not pretend a measured result');
 await page.locator('#dialogClose').click();

 await page.locator('#pathReset').click();
 assert.equal(await page.locator('[data-path][aria-pressed="true"]').count(),1,'reset returns to the primary route');
 const href=await page.locator('#enterWind').getAttribute('href');
 assert.match(href,/route=manufacturing/,'07 receives the primary route as its stress-test entry');
 assert.match(href,/paths=manufacturing/,'07 link preserves the selected path snapshot');
 await page.locator('#savePlan').click();
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('boluo-v11-plan-snapshots')||'[]'));
 assert.equal(saved.length,1,'path snapshot is saved locally');
 assert.deepEqual(saved[0].paths,['manufacturing'],'saved snapshot preserves the selected path');
 await page.locator('#viewSaved').click();
 assert.match(await page.locator('#dialogBody').innerText(),/存量企业扩能/,'saved path can be recovered');
 await page.locator('#dialogClose').click();

 await page.locator('.spatial-context > summary').click();
 assert.equal(await page.locator('.spatial-context').evaluate(el=>el.open),true,'three-core spatial context remains available');
 await page.locator('#calendar > summary').click();
 assert.equal(await page.locator('#calendar').evaluate(el=>el.open),true,'supporting annual facts can be expanded');
 assert.ok(await page.locator('#planGraph').count(),'original spatial network is preserved');
 await page.screenshot({path:'artifacts/plan-pathlab-desktop.png',fullPage:true});
 assert.deepEqual(errors,[],'desktop has no JS errors');

 const incoming=await browser.newPage({viewport:{width:1280,height:900}});
 await incoming.goto('http://127.0.0.1:8765/v11/plan.html?from=impact&scene=orders',{waitUntil:'networkidle'});
 assert.equal(await incoming.locator('[data-path="manufacturing"]').getAttribute('aria-pressed'),'true','05 order-change handoff selects the manufacturing route');
 assert.match(await incoming.locator('#pathBuildStatus').innerText(),/存量企业扩能/,'incoming fifth-page context is preserved');
 await incoming.close();

 await page.setViewportSize({width:390,height:844});
 await page.reload({waitUntil:'networkidle'});
 await page.waitForSelector('#pathGraph .path-node');
 assert.equal(await page.locator('.mobile-nav a').count(),6,'mobile navigation exposes 01 to 06');
 assert.equal(await page.locator('.mobile-nav a[aria-current="page"]').count(),1,'06 is active on mobile');
 assert.equal(await page.locator('#goalsDisclosure').evaluate(el=>el.open),false,'mobile target details remain folded');
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
 assert.ok(overflow<=2,'mobile document horizontal overflow '+overflow+'px');
 const mapOverflow=await page.locator('.path-map-scroll').evaluate(el=>el.scrollWidth>el.clientWidth);
 assert.equal(mapOverflow,true,'path map scrolls internally instead of widening the page');
 await page.locator('[data-path="connect"]').click();
 assert.equal(await page.locator('#pathGraph .path-node').count(),8,'mobile path combination works');
 await page.screenshot({path:'artifacts/plan-pathlab-mobile.png',fullPage:true});
 assert.deepEqual(errors,[],'mobile has no JS errors');
 await browser.close();
 process.stdout.write('PASS: V11 06 targets, grouped navigation, multi-path construction, evidence inspector, complementarity hypotheses, save/recover, 05 handoff, 07 handoff and mobile layout.\n');
})().catch(e=>{console.error(e);process.exit(1)});
