"use strict";
const {chromium}=require("playwright"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const out=path.resolve(__dirname,"../artifacts/v11-region");fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 try{
  for(const width of [1440,390]){
   const mobile=width===390,ctx=await browser.newContext({viewport:{width,height:mobile?844:900},isMobile:mobile,hasTouch:mobile,acceptDownloads:true,deviceScaleFactor:1});
   const page=await ctx.newPage(),errors=[];page.on("pageerror",e=>errors.push(e.message));
   const res=await page.goto("http://127.0.0.1:8765/v11/region.html",{waitUntil:"load"});assert.equal(res.status(),200);
   await page.locator("#regionRows button").first().waitFor();
   assert.equal(await page.locator("#regionRows button").count(),3);
   await page.locator('[data-region="dongguan"]').click();
   assert.match(await page.locator("#compareValue").innerText(),/56\.1/);
   await page.locator('[data-sector="tertiary"]').click();
   assert.match(await page.locator("#compareValue").innerText(),/43\.6/);
   await page.locator('[data-layer="people"]').click();
   assert.match(await page.locator("#networkCaption").innerText(),/人才与通勤/);
   assert.match(await page.locator("#graphNodes").innerText(),/通勤通道/);
   await page.locator('[data-filter="plan"]').click();
   const edgeCount=await page.locator("#graphEdges .graph-edge:not(.dim)").count();
   assert.ok(edgeCount>0 && edgeCount<6,"plan filtered edges count "+edgeCount);
   await page.locator('[data-filter="all"]').click();
   const node=page.locator('#graphNodes .graph-node').filter({hasText:"博罗"}).first();await node.click();
   assert.match(await page.locator("#focusName").innerText(),/博罗/);
   await page.locator("#playNetwork").click();assert.equal(await page.locator("#graphParticles circle").count(),0);
   await page.locator("#playNetwork").click();assert.ok(await page.locator("#graphParticles circle").count()>0);
   await page.locator('[data-trade="tourism"]').click();
   assert.match(await page.locator("#upsideTitle").innerText(),/旅游/);
   await page.locator('#questionPicker [data-topic="cooperation"]').click();
   assert.match(await page.locator("#chosenQuestion").innerText(),/外部联系/);
   const url=new URL(page.url());assert.equal(url.searchParams.get("topic"),"cooperation");
   await page.locator("#saveQuestion").click();
   const stored=await page.evaluate(()=>localStorage.getItem("boluo-v11-region-focus"));assert.match(stored,/cooperation/);
   const dlPromise=page.waitForEvent("download",{timeout:15000});
   await page.locator("#downloadQuestion").click();const dl=await dlPromise;assert.match(dl.suggestedFilename(),/\.png$/);
   const overflow=await page.evaluate(()=>Math.max(0,document.documentElement.scrollWidth-innerWidth));assert.ok(overflow<=25,"viewport overflow "+width+": "+overflow);
   await page.evaluate(()=>scrollTo(0,0));
   await page.screenshot({path:path.join(out,"region-"+width+".png"),fullPage:true,animations:"disabled"});
   assert.deepEqual(errors,[],"Page JS errors: "+errors.join(" | "));
   console.log("PASS region "+width+" width; chart/network/proof/PNG; overflow="+overflow);
   await ctx.close();
  }
  const context=await browser.newContext({viewport:{width:1280,height:800}});
  const page=await context.newPage();
  await page.goto("http://127.0.0.1:8765/v11/challenge.html",{waitUntil:"domcontentloaded"});
  const next=page.locator('a[href="./region.html"]').last();await next.click();
  assert.match(await page.locator("h1").first().innerText(),/博罗都要有/);
  const back=page.locator("#questionToNine");await page.locator('#questionPicker [data-topic="people"]').click();
  assert.match(await back.getAttribute("href"),/claim=people/);
  console.log("PASS 09 -> 10 -> 09, selected question handoff");
  await context.close();
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
