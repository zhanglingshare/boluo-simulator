/* Public UI contract across the main journey and auxiliary instruments. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
const pages=['index.html','future-lab.html','index-legacy-2026-11-03.html','town.html','industry-changes.html','who.html','relation-compare.html','plan-with-me.html','choices.html','future.html','windtunnel.html','blindspot.html','report.html','ending.html','network.html','role.html','intel-lab.html','holo-home-v9.html','experiments/holo-single/index.html','tea/index.html','tea/deck.html'];
(async()=>{const browser=await chromium.launch({headless:true,args:['--no-sandbox']});const failures=[];fs.mkdirSync('artifacts/boluo-system',{recursive:true});try{
 for(const width of [1440,390]){
  const c=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce',isMobile:width===390,hasTouch:width===390});
  for(const file of pages){const p=await c.newPage();try{
   await p.goto('http://127.0.0.1:8765/'+file,{waitUntil:'domcontentloaded'});
   await p.locator('body[data-ui-ready="true"]').waitFor();
   assert.equal(await p.locator('.bl-header').count(),1,file+' one brand/navigation');
   assert.equal(await p.locator('.bl-dock').count(),1,file+' one chapter navigator');
   assert.equal(await p.locator('body').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(14, 20, 32)');
   const overflow=await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth);assert.ok(overflow<=4,file+' '+width+' overflow '+overflow);
   await p.locator('.bl-directory-open').click();await p.locator('.bl-directory[open]').waitFor();
   assert.equal(await p.locator('.bl-directory-row').count(),20,'all routes visible in grouped directory');
   await p.getByLabel('搜索探索目录',{exact:true}).fill('风洞');
   assert.equal(await p.locator('.bl-directory-row:visible').count(),1,'directory actually filters');
   await p.keyboard.press('Escape');await p.locator('.bl-directory[open]').waitFor({state:'hidden'});
   assert.equal(await p.locator('.bl-directory-open').evaluate(e=>document.activeElement===e),true,'directory restores focus');
   if(file==='who.html'){
    await p.locator('.bp-scene.is-ready').waitFor();await p.locator('[data-pick="investment25"]').click();assert.match(await p.locator('.bp-art').innerText(),/47.6%/);
    await p.locator('[data-pick="investment26"]').click();assert.match(await p.locator('.bp-art').innerText(),/46.7%/);assert.match(await p.locator('.bp-art').innerText(),/统计区间不同/);
   }
   if(file==='town.html'){
    await p.locator('[data-pick="stays"]').click();assert.match(await p.locator('.bp-art').innerText(),/约25%/);assert.match(await p.locator('.bp-denominator').innerText(),/游客人次/);
   }
   if(file==='experiments/holo-single/index.html')await p.locator('#labels .node-label').first().waitFor({timeout:15000});
   if(file==='choices.html'){
    const sw=p.locator('.path').first();const before=await sw.getAttribute('aria-checked');await sw.focus();await p.keyboard.press('Space');assert.notEqual(await sw.getAttribute('aria-checked'),before,'path works by keyboard');
   }
   if(file==='windtunnel.html'){
    const label=await p.locator('#pressName').innerText();await p.locator('.ptile[data-key]').nth(1).click();assert.notEqual(await p.locator('#pressName').innerText(),label);assert.notEqual(await p.locator('#hitNum').innerText(),'50.5%');
   }
   if(file==='relation-compare.html'){
    await p.locator('.bp-full-disclosure>summary').click();await p.locator('.bc-event[data-id="C006"]').click();assert.match(await p.locator('.bl-dock-next').getAttribute('href'),/plan-with-me.html.*change=C006/);
   }
   if(['index.html','who.html','windtunnel.html','report.html','experiments/holo-single/index.html'].includes(file))await p.screenshot({path:'artifacts/boluo-system/'+width+'-'+file.replaceAll('/','-')+'.png',animations:'disabled'});
   console.log('PASS',width,file);
  }catch(e){failures.push(width+' '+file+': '+e.message);console.error(failures.at(-1));await p.screenshot({path:'artifacts/boluo-system/FAIL-'+width+'-'+file.replaceAll('/','-')+'.png'}).catch(()=>{});}finally{await p.close();}}
  await c.close();
 }
 assert.deepEqual(failures,[]);console.log('20 surfaces × desktop/mobile; directory, focus, comparisons, keyboard, scenario state, event handoff passed.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
