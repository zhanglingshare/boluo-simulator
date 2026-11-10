'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error' && !/favicon/i.test(message.text())) errors.push(message.text()); });

  await page.goto('http://127.0.0.1:8765/v11/industry-chain.html', { waitUntil: 'networkidle' });
  await page.waitForSelector('#sectorPicker .sector-choice');
  await page.waitForSelector('#chainMatrix .matrix-row-label');

  assert.equal(await page.locator('#sampleTotal').innerText(), '37', 'public site record count');
  assert.deepEqual(await page.locator('#ticks .tick b').allInnerTexts(), ['16', '15', '4', '2'], 'four project status counts');
  assert.equal(await page.locator('#sectorPicker .sector-choice').count(), 6, 'six industry selectors');
  assert.equal(await page.locator('#chainMatrix .matrix-row-label').count(), 6, 'six industry rows in matrix');
  assert.equal(await page.locator('#sectorStatusCompare .status-row').count(), 6, 'six industry status comparisons');
  assert.equal(await page.locator('#chainStageMap .stage-column').count(), 4, 'four chain stages');

  await page.locator('[data-sector-choice="precision"]').click();
  assert.match(await page.locator('#chartTitle').innerText(), /精密机械与电子/, 'industry selection updates main view');
  await page.locator('[data-matrix-sector="precision"][data-matrix-stage="processing"]').click();
  assert.equal(await page.locator('#chainStageMap .stage-column.focus').count(), 1, 'matrix selection focuses one chain stage');

  await page.locator('[data-view="build"]').click();
  assert.deepEqual(await page.locator('#chainStageMap .stage-column .stage-head strong').allInnerTexts(), ['已投产', '在建', '签约', '退出 / 受阻'], 'switch to project status view');
  await page.locator('#chainStageMap .site-node').first().click();
  assert.equal(await page.locator('#siteFold').evaluate(el => el.open), true, 'site detail opens after selecting a project');

  await page.screenshot({ path: 'artifacts/industry-chain-desktop.png', fullPage: true });
  assert.deepEqual(errors, [], 'no browser runtime errors on desktop');

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('#sectorPicker .sector-choice');
  const mobileOverflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  assert.ok(mobileOverflow <= 2, 'mobile page should not overflow horizontally, actual overflow: ' + mobileOverflow);
  assert.equal(await page.locator('#sectorPicker .sector-choice').count(), 6, 'mobile industry selectors remain available');
  assert.equal(await page.locator('#chainStageMap .stage-column').count(), 4, 'mobile chain stages remain available');
  await page.screenshot({ path: 'artifacts/industry-chain-mobile.png', fullPage: true });
  assert.deepEqual(errors, [], 'no browser runtime errors on mobile');

  await browser.close();
  process.stdout.write('Industry-chain browser checks passed: 37 records, four status counts, six-sector matrix, linked selection, project detail, desktop/mobile layout.\n');
})().catch(error => {
  console.error(error);
  process.exit(1);
});