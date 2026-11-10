'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('playwright');

(async () => {
  fs.mkdirSync('artifacts',{recursive:true});
  const browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error'&&!/favicon/i.test(m.text()))errors.push(m.text())});

  await page.goto('http://127.0.0.1:8765/v11/industry-chain.html',{waitUntil:'networkidle'});
  await page.waitForSelector('#handoffRunway .runway-node',{state:'attached'});
  assert.equal(await page.locator('#sampleTotal').textContent(),'37','37 public records');
  assert.equal(await page.locator('#handoffRunway .runway-lane').count(),4,'four handoff runways');
  assert.equal(await page.locator('#handoffRunway .runway-node').count(),37,'each public record appears exactly once');
  assert.equal(await page.locator('#storySectorTabs button').count(),6,'six domain-specific value journeys');
  assert.equal(await page.locator('#industryValueRail .value-phase').count(),5,'copper journey five stages');
  assert.equal(await page.locator('#storyTimeline .timeline-month').count(),13,'twelve months and one undated group');
  assert.equal(await page.locator('#storyGaps .gap-node').count(),6,'six evidence questions');

  await page.locator('[data-story-sector="tour"]').click();
  assert.match(await page.locator('#valueStoryTitle').textContent(),/游客来了/,'tour journey selected');
  assert.equal(await page.locator('#industryValueRail .value-phase').count(),5,'tourism five distinct value stages');
  assert.match(await page.locator('#industryValueRail').textContent(),/住宿与停留/,'tourism includes overnight stage');

  await page.locator('[data-story-sector="agri"]').click();
  assert.equal(await page.locator('#industryValueRail .value-phase').count(),4,'agriculture four stages');
  assert.match(await page.locator('#industryValueRail').textContent(),/制茶与干茶/,'processed tea is not raw leaf');
  assert.match(await page.locator('#industryValueRail').textContent(),/柏塘/,'cooperative statistics preserved');
  await page.locator('[data-story-id="tea"]').first().click();
  assert.match(await page.locator('#storyEpisode').textContent(),/统计口径/,'tea correctly represented as statistics');

  await page.locator('[data-run-filter="all"]').click();
  assert.equal(await page.locator('#handoffRunway .runway-node').count(),37,'all record filter restores 37');
  await page.locator('#handoffRunway [data-story-id="sign4"]').click();
  assert.match(await page.locator('#storyEpisode').textContent(),/8月3日一次签4宗/,'aggregate signing record retains its own identity');

  await page.locator('#legacyChainAudit > summary').click();
  assert.equal(await page.locator('#sectorPicker .sector-choice').count(),6,'legacy sector selections preserved');
  assert.equal(await page.locator('#chainMatrix .matrix-row-label').count(),6,'legacy stage matrix preserved');
  await page.locator('[data-sector-choice="precision"]').click();
  assert.match(await page.locator('#chartTitle').textContent(),/精密机械与电子/,'legacy charts still work');
  await page.locator('[data-matrix-sector="precision"][data-matrix-stage="processing"]').click();
  assert.equal(await page.locator('#chainStageMap .stage-column.focus').count(),1,'legacy stage focus works');

  await page.screenshot({path:'artifacts/industry-chain-desktop.png',fullPage:true});
  assert.deepEqual(errors,[],'desktop browser runtime errors');

  await page.setViewportSize({width:390,height:844});
  await page.reload({waitUntil:'networkidle'});
  await page.waitForSelector('#handoffRunway .runway-node',{state:'attached'});
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
  assert.ok(overflow<=2,'mobile horizontal overflow: '+overflow);
  assert.equal(await page.locator('#handoffRunway .runway-node').count(),37,'mobile runway');
  assert.equal(await page.locator('#storySectorTabs button').count(),6,'mobile value journey selectors');
  await page.locator('[data-story-sector="food"]').click();
  assert.match(await page.locator('#industryValueRail').textContent(),/加工与无菌灌装/,'mobile food journey');
  await page.screenshot({path:'artifacts/industry-chain-mobile.png',fullPage:true});
  assert.deepEqual(errors,[],'mobile browser runtime errors');
  await browser.close();
  process.stdout.write('04 industry story audit PASS: 37 records, four runway states, six distinct value journeys, monthly film, evidence gaps, legacy preservation, desktop/mobile.\n');
})().catch(e=>{console.error(e);process.exit(1)});
