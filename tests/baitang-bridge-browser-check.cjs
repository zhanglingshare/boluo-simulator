const assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true});
 const page=await browser.newPage({viewport:{width:1280,height:850},deviceScaleFactor:1});
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 const base='http://127.0.0.1:8765';
 try{
  // V1031: a relevant lived experience, genuine arithmetic preview, and exact return.
  await page.goto(base+'/v1031/?focus=money&scene=base&view=discover',{waitUntil:'domcontentloaded'});
  await page.locator('#teaCaseSlot').waitFor({state:'visible',timeout:10000});
  assert.match(await page.locator('#teaCaseSlot').innerText(),/游客|2030/);
  await page.locator('#teaGrowth').fill('22');
  assert.match(await page.locator('#teaTargetGap').innerText(),/超过|达到|门槛/);
  await page.locator('#teaOpenLab').click();
  await page.waitForURL(/tea-lab-v3\.html.*origin=v1031/, {timeout:15000});
  await page.locator('.case-bridge-bar a').waitFor({state:'visible',timeout:10000});
  const v3return=await page.locator('.case-bridge-bar a').getAttribute('href');
  assert.match(v3return,/focus=money/);assert.match(v3return,/view=discover/);
  await page.locator('.case-bridge-bar a').click();
  await page.waitForURL(/v1031\/.*focus=money/, {timeout:12000});
  assert.equal(await page.locator('#discover').evaluate(e=>e.classList.contains('active')),true);
  // Reveal deep dive returns to reveal.
  await page.goto(base+'/v1031/?focus=money&scene=base&view=reveal',{waitUntil:'domcontentloaded'});
  assert.equal(await page.locator('#reveal').evaluate(e=>e.classList.contains('active')),true);
  await page.locator('.tea-reveal-go').click();
  await page.locator('.case-bridge-bar a').waitFor({state:'visible',timeout:12000});
  assert.match(await page.locator('.case-bridge-bar a').getAttribute('href'),/view=reveal/);
  // County network: click a real sc node to go deeper and return to the same node.
  await page.goto(base+'/network.html?entity=sc',{waitUntil:'domcontentloaded'});
  await page.locator('#teaDeepPanel').waitFor({state:'visible',timeout:15000});
  await page.locator('#teaDeepLaunch').click();
  await page.locator('.case-bridge-bar a').waitFor({state:'visible',timeout:12000});
  assert.match(await page.locator('.case-bridge-bar a').getAttribute('href'),/network.html\?entity=sc/);
  // Holographic evidence graph: sc remains selected after coming back.
  await page.goto(base+'/holo-home-v10.html#mode=evidence&node=sc',{waitUntil:'domcontentloaded'});
  const teaHolo=page.locator('#evidenceDetail a[href*="tea-lab-v3.html"]');
  await teaHolo.waitFor({state:'visible',timeout:15000});
  await teaHolo.click();
  await page.locator('.case-bridge-bar a').waitFor({state:'visible',timeout:10000});
  const holoBack=await page.locator('.case-bridge-bar a').getAttribute('href');
  assert.match(holoBack,/holo-home-v10/);assert.match(holoBack,/node=sc/);
  await page.locator('.case-bridge-bar a').click();
  await page.waitForURL(/holo-home-v10\.html.*node=sc/, {timeout:12000});
  await page.waitForFunction(()=>document.querySelector('#evidenceDetail h4')?.textContent.includes('柏塘山茶'),{timeout:15000});
  // Responsive: no horizontal overflow in the new V1031 case.
  await page.setViewportSize({width:390,height:844});
  await page.goto(base+'/v1031/?focus=money',{waitUntil:'domcontentloaded'});
  await page.locator('#teaCaseSlot').waitFor({state:'visible'});
  assert.equal(await page.locator('#teaOpenLab').isVisible(),true);
  assert.ok((await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth))<24);
  assert.deepEqual(errors,[], 'No page JS exceptions during the bridge journey');
  console.log('PASS: V1031 money/reveal, network sc, holographic sc, return context and mobile case');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
