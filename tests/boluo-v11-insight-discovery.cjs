'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const fs=require('node:fs');
(async()=>{
 fs.mkdirSync('artifacts',{recursive:true});
 const browser=await chromium.launch({headless:true});
 const errors=[];
 const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1});
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error'&&!/favicon/i.test(m.text()))errors.push(m.text());});
 await page.goto('http://127.0.0.1:8765/v11/insights.html',{waitUntil:'networkidle'});
 await page.waitForFunction(()=>window.BoluoDiscoveryLab&&window.BoluoDiscoveryCore);

 for(const id of ['iqSignalGrid','iqVariableList','iqVariableLines','iqVariableNodes','iqCustomVariable','iqCustomAdd','iqHypothesisChoices','iqDiscriminatingEvidence','iqBreakGrid','iqBreakDependence','iqBreakShock','iqBreakSubstitute','iqEvidenceCards','iqSaveAllWatch','iqExportWatch']){
  assert.equal(await page.locator('#'+id).count(),1,'module exists: '+id);
 }
 assert.equal(await page.locator('#iqSignalGrid [data-signal]').count(),6,'six evidence-aware signals/questions');
 assert.match(await page.locator('#iqSignalDetailTitle').innerText(),/工业增加值增长/,'observed signal is selected first');
 assert.match(await page.locator('#iqSignalType').innerText(),/公开统计信号/,'observed statistics are distinguished from hypotheses');

 await page.locator('[data-signal="local-value"]').click();
 assert.match(await page.locator('#iqSignalDetailText').innerText(),/不能替代/,'signal detail avoids claiming local value retention');
 await page.locator('[data-variable="customer"]').click();
 assert.match(await page.locator('#iqVariableWhy').innerText(),/客户集中/,'variable selection updates evidence detail');
 assert.ok(await page.locator('#iqVariableNodes .iq-variable-node').count()>0,'candidate relation network is rendered');
 await page.locator('#iqCustomVariable').fill('用电接入周期');
 await page.locator('#iqCustomAdd').click();
 assert.match(await page.locator('#iqVariableStatus').innerText(),/用户自定义/,'custom variable is clearly marked unverified');
 assert.match(await page.locator('#iqVariableMechanism').innerText(),/尚未定义/,'custom variable does not fabricate a causal relationship');

 await page.locator('[data-hypothesis="mix"]').click();
 assert.match(await page.locator('#iqHypothesisTitle').innerText(),/行业与项目结构/,'competing explanation selection updates');
 assert.equal(await page.locator('#iqDiscriminatingEvidence .iq-discriminator').count(),3,'each hypothesis has discriminating evidence');
 await page.locator('#iqDiscriminatingEvidence .iq-proof-state button').nth(1).click();
 assert.match(await page.locator('#iqHypothesisStatus').innerText(),/用户自评/,'evidence state is not represented as automatic verification');

 assert.equal(await page.locator('.iq-break-cell').count(),25,'breakpoint matrix has 25 scenario combinations');
 const expected=windowlessExposure(75,70,35);
 const actual=await page.evaluate(()=>window.BoluoDiscoveryLab.exposure(75,70,35));
 assert.ok(Math.abs(expected-actual)<0.01,'transparent scenario-only exposure formula');
 await page.locator('#iqBreakShock').evaluate(el=>{el.value='95';el.dispatchEvent(new Event('input',{bubbles:true}));});
 assert.equal(await page.locator('#iqBreakShockValue').innerText(),'95','breakpoint sliders recalculate');
 assert.equal(await page.locator('.iq-break-cell').count(),25,'heatmap redraw remains complete');

 const firstSave=page.locator('#iqEvidenceCards .iq-evidence-card').first().locator('.iq-evidence-save');
 await firstSave.click();
 const watch=await page.evaluate(()=>JSON.parse(localStorage.getItem('boluo-v11-evidence-watchlist')||'[]'));
 assert.ok(watch.includes('project-records'),'evidence watchlist is stored locally');
 const challenge=page.locator('#iqEvidenceCards .iq-evidence-card').first().locator('.iq-evidence-challenge');
 const href=await challenge.getAttribute('href');
 assert.match(href,/missing=/,'evidence question is carried into page 09');
 await page.screenshot({path:'artifacts/boluo-v11-insight-discovery-desktop.png',fullPage:true});
 await challenge.click();
 await page.waitForURL(/challenge\.html/);
 assert.match(await page.locator('#incomingMissing').innerText(),/项目分别处于立项/,'page 09 receives the selected evidence question');
 assert.match(await page.locator('#handoffTitle').innerText(),/待核验线索/,'page 09 labels the handoff as unverified');

 await page.setViewportSize({width:390,height:844});
 await page.goto('http://127.0.0.1:8765/v11/insights.html',{waitUntil:'networkidle'});
 await page.waitForFunction(()=>window.BoluoDiscoveryLab);
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
 assert.ok(overflow<=2,'mobile horizontal overflow '+overflow+'px');
 assert.ok(await page.locator('#iqSignalGrid [data-signal]').count()===6,'signals remain usable on mobile');
 assert.ok(await page.locator('#iqEvidenceCards .iq-evidence-card').count()===6,'evidence cards remain available on mobile');
 await page.screenshot({path:'artifacts/boluo-v11-insight-discovery-mobile.png',fullPage:true});
 assert.deepEqual(errors,[],'no browser JavaScript or console errors');
 await browser.close();
 process.stdout.write('PASS: signal separation, candidate variables, custom variable, competing explanations, evidence states, breakpoint heatmap, local watchlist, page-09 handoff and mobile layout.\n');
})().catch(e=>{console.error(e);process.exit(1);});
function windowlessExposure(d,s,b){return Math.round((d/100)*(s/100)*(1-.75*b/100)*1000)/10;}
