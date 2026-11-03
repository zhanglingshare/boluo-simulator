const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const base='http://127.0.0.1:8765/';
const out=path.resolve(__dirname,'../artifacts/boluo-participation');fs.mkdirSync(out,{recursive:true});
const scenes=[['today','index-legacy-2026-11-03.html',3],['town','town.html',16],['changes','industry-changes.html',3],['basic','who.html',3],['comparison','relation-compare.html',3],['planning','plan-with-me.html',6]];
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});const errors=[];
 try{
  for(const width of [1440,390])for(const [id,file,count]of scenes){
   const context=await browser.newContext({viewport:{width,height:width===390?844:1000},isMobile:width===390,hasTouch:width===390});
   const p=await context.newPage();p.on('pageerror',e=>errors.push(id+' '+width+' '+e.message));
   await p.goto(base+file,{waitUntil:'domcontentloaded'});
   await p.locator('.bp-scene.is-ready .bp-choice').first().waitFor({timeout:15000});
   assert.equal(await p.locator('.bp-choice').count(),count,id+' real options');
   assert.equal(await p.locator('.bp-reveal').isEnabled(),false,'no answer before a choice');
   assert.equal(await p.locator('.bp-result').isVisible(),false,'no reveal before participation');
   await p.locator('.bp-choice').first().click();await p.locator('.bp-reveal').click();
   await p.locator('.bp-result').waitFor({state:'visible'});
   assert.equal(await p.locator('.bp-share').isVisible(),true,'result offers a reciprocal invitation');
   if(id==='comparison')assert.equal(await p.locator('.bp-closed-edge').count(),1,'only the recorded production-line relation is broken');
   if(id==='changes')assert.equal(await p.locator('#ec-detail-id').innerText(),'C006','scene and original graph select the same bridge event');
   await p.locator('.bp-share').click();await p.locator('.bp-sheet[open]').waitFor();
   const url=await p.locator('.bp-share-url').inputValue();const u=new URL(url);
   assert.equal(u.searchParams.get('challenge'),'boluo-discover-v1-'+id);
   assert.ok(u.searchParams.get('pick'),'selected view is in the share link');
   if(width===390){const box=await p.locator('.bp-sheet').boundingBox();assert.ok(Math.abs(box.y+box.height-844)<=4,'iOS sheet reaches bottom');assert.ok(box.width<=390,'mobile sheet stays in viewport');}
   await p.locator('.bp-sheet-done').click();await p.locator('.bp-sheet[open]').waitFor({state:'hidden'});
   assert.equal(await p.locator('.bp-share').evaluate(e=>e===document.activeElement),true,'focus returns to the invoking control');
   const overflow=await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth);assert.ok(overflow<=4,id+' no horizontal overflow '+width);
   await p.screenshot({path:path.join(out,id+'-'+width+'.png'),animations:'disabled'});await context.close();
  }
  const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
  const p=await context.newPage();
  await p.goto(base+'index-legacy-2026-11-03.html?challenge=boluo-discover-v1-today&pick=running');
  await p.locator('.bp-choice').first().waitFor();
  assert.equal(await p.locator('.bp-friend').isVisible(),true);
  assert.equal(await p.locator('.bp-duel').isVisible(),false,'inviter choice not exposed in the page before recipient selects');
  await p.locator('[data-pick="signed"]').click();await p.locator('.bp-reveal').click();
  await p.locator('.bp-duel b').waitFor({state:'visible'});
  assert.match(await p.locator('.bp-duel').innerText(),/厂子已经开起来了/);
  assert.match(await p.locator('.bp-duel').innerText(),/只确认了签约/);
  await p.locator('.bp-menu-button').click();await p.locator('.bp-menu').waitFor({state:'visible'});await p.keyboard.press('Escape');
  assert.equal(await p.locator('.bp-menu').isVisible(),false);
  await context.close();
  assert.deepEqual(errors,[],'all six scenes run without JavaScript exceptions');
  console.log('✓ Six participation scenes: 1440/390, actual source states, reciprocal URL challenge, modal focus, mobile sheets, reduced motion.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
