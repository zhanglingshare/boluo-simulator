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
 page.on('console',m=>{if(m.type()==='error'&&!/favicon|fonts\.googleapis/i.test(m.text()))errors.push(m.text())});

 await page.goto('http://127.0.0.1:8765/v11/industry-chain.html',{waitUntil:'networkidle'});
 await page.waitForSelector('#sectorList .sector-row');
 assert.match(await page.locator('h1').innerText(),/产业结构/,'04 is the structure benchmark page');
 assert.equal(await page.locator('.target-card').count(),3,'three distinct official target metrics');
 assert.equal(await page.locator('#sectorList .sector-row').count(),6,'five major industries plus other industries');
 assert.equal(await page.locator('#sectorMap .quad-dot').count(),5,'five industries with disclosed comparable growth rates');
 assert.equal(await page.locator('.insight-rail a').count(),4,'four section jump controls');
 assert.match(await page.locator('#sectorMapState').innerText(),/2025年/,'default industry slice is 2025');
 assert.equal(await page.locator('.target-card.output .target-meter.unknown').count(),1,'industrial output has no fabricated completion meter');
 assert.equal(await page.locator('#peerBars .peer-row').count(),4,'four county benchmark samples');
 assert.equal(await page.locator('#peerScatter .scatter-dot').count(),4,'four county dots');
 assert.equal(await page.locator('#investmentBars .dual-row').count(),4,'output and investment trends across two years');
 assert.equal(await page.locator('#scaleLegend > div').count(),3,'large, medium, small/micro enterprise scale structure');
 assert.equal(await page.locator('.source-list a').count(),13,'thirteen traceable sources');
 assert.equal(await page.locator('.cluster-strip > div').count(),4,'four industrial scale signals');
 assert.equal(await page.locator('.county-signatures .county-signature').count(),4,'four county industrial signatures');
 assert.match(await page.locator('.target-caveat').innerText(),/不伪造/,'official target sector decomposition is not invented');
 assert.equal(await page.locator('#structural-constraints .signal-card').count(),4,'four structural signal cards');
 assert.match(await page.locator('#structural-constraints').innerText(),/70%/,'industrial GDP contribution signal');
 assert.match(await page.locator('#structural-constraints').innerText(),/181\.2亿/,'producer-services 2025 baseline');
 assert.match(await page.locator('#peerSelected').innerText(),/第1位/,'2026 peer rank is shown separately from 2024 statistics');

 await page.locator('#sectorMap [data-sector="rubber"]').evaluate(el=>el.dispatchEvent(new MouseEvent('click',{bubbles:true})));
 assert.match(await page.locator('#sectorDetail').innerText(),/橡胶塑料/,'industry detail changes');
 await page.locator('#sectorMap [data-sector="electronics"]').focus();
 await page.locator('#sectorMap [data-sector="electronics"]').press('Enter');
 assert.match(await page.locator('#sectorDetail').innerText(),/电子信息/,'industry quadrant supports keyboard selection');
 await page.locator('[data-year="2024"]').click();
 assert.match(await page.locator('#sectorMapState').innerText(),/2024年/,'year switch changes chart slice');
 assert.match(await page.locator('#sectorDetail').innerText(),/20\.2%/,'2024 share is shown in the detail panel');
 assert.match(await page.locator('#sectorDetail').innerText(),/\+10\.4%/,'2024 growth is shown in the detail panel');
 await page.locator('[data-year="2025"]').click();
 await page.locator('#sectorThreshold').evaluate(el=>{el.value='20';el.dispatchEvent(new Event('input',{bubbles:true}))});
 assert.equal(await page.locator('#sectorThresholdResult').innerText(),'1','threshold lens filters industry count');
 await page.locator('#sectorThreshold').evaluate(el=>{el.value='10';el.dispatchEvent(new Event('input',{bubbles:true}))});
 assert.equal(await page.locator('#sectorThresholdResult').innerText(),'2','threshold lens restores industry count');
 await page.locator('#sectorMap [data-sector="electronics"]').hover();
 assert.equal(await page.locator('#sectorTooltip').evaluate(el=>el.classList.contains('show')),true,'hover tooltip appears on sector point');

 assert.match(await page.locator('#sectorDetail').innerText(),/印制电路板产量 -0\.1%/,'product quantity cross-check appears for electronics');
 await page.locator('#sectorMap [data-sector="rubber"]').evaluate(el=>el.dispatchEvent(new MouseEvent('click',{bubbles:true})));
 assert.match(await page.locator('#sectorDetail').innerText(),/−4\.2%|-4\.2%/,'negative industry growth is visible');
 assert.match(await page.locator('#sectorDetail').innerText(),/−0\.9个百分点|-0\.9个百分点/,'share change is visible');
 assert.match(await page.locator('#sectorDetail').innerText(),/塑料制品产量 \+7\.9%/,'product quantity cross-check appears for rubber/plastics');

 await page.locator('#netAdds').evaluate(el=>{el.value='200';el.dispatchEvent(new Event('input',{bubbles:true}))});
 assert.equal(await page.locator('#netAddsTotal').innerText(),'2,407家','enterprise target arithmetic');
 assert.match(await page.locator('#netAddsGap').innerText(),/还差 93 家/,'enterprise target gap arithmetic');
 await page.locator('#netAdds').evaluate(el=>{el.value='220';el.dispatchEvent(new Event('input',{bubbles:true}))});
 assert.equal(await page.locator('#netAddsTotal').innerText(),'2,507家','slider restores');

 await page.locator('#peerBars [data-peer="huidong"]').click();
 assert.match(await page.locator('#peerSelected').innerText(),/惠东/,'peer selection updates details');
 await page.locator('#peerBars [data-peer="heshan"]').hover();
 assert.equal(await page.locator('#peerScatter [data-peer="heshan"]').evaluate(el=>el.classList.contains('linked-hover')),true,'county comparison cross-highlights on hover');
 await page.locator('#peerScatter .scatter-dot').nth(2).click();
 assert.match(await page.locator('#peerSelected').innerText(),/四会/,'scatter point updates peer details');
 assert.deepEqual(errors,[],'no desktop runtime errors');
 await page.screenshot({path:'artifacts/industry-structure-desktop.png',fullPage:true});

 await page.setViewportSize({width:390,height:844});
 await page.reload({waitUntil:'networkidle'});
 await page.waitForSelector('#sectorList .sector-row');
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
 assert.ok(overflow<=2,'mobile horizontal overflow: '+overflow);
 assert.equal(await page.locator('.mobile-nav a').count(),5,'mobile main navigation has five items');
 assert.equal(await page.locator('#peerBars .peer-row').count(),4,'mobile peer chart remains available');
 assert.equal(await page.locator('.county-signatures .county-signature').count(),4,'mobile county signatures remain available');
 await page.locator('#sectorList [data-sector="electronics"]').click();
 assert.match(await page.locator('#sectorDetail').innerText(),/电子信息/,'mobile industry interaction');
 assert.deepEqual(errors,[],'no mobile runtime errors');
 await page.screenshot({path:'artifacts/industry-structure-mobile.png',fullPage:true});

 // Preserve the previous project-level exploration as a separate legacy page.
 await page.goto('http://127.0.0.1:8765/v11/industry-chain-projects-legacy.html',{waitUntil:'networkidle'});
 await page.waitForSelector('#handoffRunway .runway-node');
 assert.equal(await page.locator('#handoffRunway .runway-node').count(),37,'legacy 37-record project runway is preserved');

 await browser.close();
 process.stdout.write('V11 04 structure benchmark PASS: target pressure, six industrial sectors, four 2024 peer samples, enterprise arithmetic, desktop/mobile, and 37-record legacy page.\n');
})().catch(e=>{console.error(e);process.exit(1)});
