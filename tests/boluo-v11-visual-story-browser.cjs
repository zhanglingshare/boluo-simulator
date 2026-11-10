"use strict";
const {chromium}=require("playwright"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const pages=["base-target","industry-chain","impact","plan","wind","insights","challenge","region","brief","future"];
const root=path.resolve(__dirname,".."),out=path.join(root,"artifacts/v11-visual-story");fs.mkdirSync(out,{recursive:true});
const origin="http://127.0.0.1:8765/v11/";
async function visible(page,selector){await page.locator(selector).first().waitFor({state:"visible",timeout:10000});}
(async()=>{
 const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 try{
  for(const width of [1440,390]){
   const mobile=width===390;
   const ctx=await browser.newContext({viewport:{width,height:mobile?844:900},isMobile:mobile,hasTouch:mobile,deviceScaleFactor:1,acceptDownloads:true});
   for(let i=0;i<pages.length;i++){
    const name=pages[i],page=await ctx.newPage(),exceptions=[];
    page.on("pageerror",e=>exceptions.push(e.message));
    const resp=await page.goto(origin+name+".html",{waitUntil:"load",timeout:15000});
    assert.equal(resp.status(),200,name+" HTTP");
    await visible(page,".v11-story");
    assert.equal(await page.locator(".v11-story").count(),1,name+" stage duplicated");
    assert.equal(await page.locator("body").getAttribute("data-v11-page"),String(i+3).padStart(2,"0"));
    await page.waitForTimeout(350);
    assert.ok((await page.locator(".v11-story h2").textContent()).trim().length>5,name+" missing headline");
    if(["base-target","industry-chain","plan","region","brief"].includes(name)){
      assert.equal(await page.locator(".v11-original-toggle").count(),1,name+" no legacy disclosure");
      await page.locator(".v11-original-toggle").scrollIntoViewIfNeeded();
      const original={ "base-target":".hero-kpis","industry-chain":"main > .hero","plan":".target-dashboard","region":"main > .hero","brief":"main > .hero"}[name];
      assert.equal(await page.locator(original).isVisible(),false,name+" duplicate intro not collapsed");
      await page.locator(".v11-original-toggle").click();
      await page.waitForTimeout(120);
      assert.equal(await page.locator(original).isVisible(),true,name+" legacy content inaccessible after expansion");
      await page.locator(".v11-original-toggle").click();
    }
    const stageWidth=await page.locator(".v11-story").evaluate(e=>e.getBoundingClientRect().width);
    assert.ok(stageWidth>150&&stageWidth<=width+1,name+" stage width="+stageWidth+" viewport="+width);
    if(name==="base-target"){
      assert.match(await page.locator(".v11-story").innerText(),/1005.45/);
      assert.match(await page.locator(".v11-story").innerText(),/594.55/);
      assert.ok(await page.locator("#treeScene").count());
    }else if(name==="industry-chain"){
      await page.waitForFunction(()=>document.querySelectorAll("#peerBars .peer-stack").length>=3,{timeout:9000});
      assert.equal(await page.locator(".v11-story-stack").count(),2);
      await page.locator('.v11-story-bench-nav button').nth(1).click();
      assert.match(await page.locator(".v11-story").innerText(),/四会/);
      assert.match(await page.locator(".v11-story").innerText(),/2024/);
    }else if(name==="impact"){
      await page.locator(".v11-story-actions button").nth(1).click();
      assert.match(await page.locator(".v11-story-flow").innerText(),/本地采购/);
      assert.ok(await page.locator(".scenario-strip [data-case]").count()>=3);
    }else if(name==="plan"){
      await page.locator(".v11-story-paths button").nth(1).click();
      assert.match(await page.locator(".v11-story-flow").innerText(),/存量企业/);
      assert.ok(await page.locator("#pathGraph").count());
    }else if(name==="wind"){
      await page.waitForFunction(()=>document.querySelector("#distChart")?.children.length>0,{timeout:10000});
      await page.waitForFunction(()=>document.querySelector(".v11-story-live svg")!==null,{timeout:10000});
      await page.locator(".v11-story-actions button").nth(2).click();
      assert.ok(await page.locator("#detailChart").count());
      assert.ok(await page.locator("#baseScale").count());
    }else if(name==="insights"){
      await page.waitForFunction(()=>document.querySelector("#iqRankingBars")?.children.length>0,{timeout:10000});
      assert.ok(await page.locator(".v11-story-rank-chip").count()>0);
      assert.ok(await page.locator("#iqNetworkLines").count());
      await page.locator(".v11-story-actions button").nth(0).click();
    }else if(name==="challenge"){
      await page.locator(".v11-story-actions button").nth(2).click();
      assert.match(await page.locator(".v11-story-sides").innerText(),/竞争解释/);
      assert.equal(await page.locator('[data-proof="alternative"]').getAttribute("aria-pressed"),"true");
    }else if(name==="region"){
      await page.locator(".v11-story-actions button").nth(1).click();
      assert.match(await page.locator("#valueFlowHeadline").innerText(),/农产品/);
      assert.ok(await page.locator("#regionalPressure").count());
    }else if(name==="brief"){
      await page.waitForFunction(()=>document.querySelectorAll(".v11-story-steps a").length===8,{timeout:10000});
      assert.ok(await page.locator("#futureAudit").count());
      assert.ok(await page.locator("#exportJSON").count());
    }else if(name==="future"){
      await page.waitForFunction(()=>document.querySelectorAll(".v11-story-metric").length===3,{timeout:10000});
      assert.ok(await page.locator("#metricsGrid").count());
      assert.ok(await page.locator("#saveExperiment").count());
    }
    const overflow=await page.evaluate(()=>({w:innerWidth,doc:document.documentElement.scrollWidth,story:document.querySelector(".v11-story")?.getBoundingClientRect().right}));
    assert.ok(overflow.doc<=overflow.w+3,name+" "+width+"px horizontal overflow "+JSON.stringify(overflow));
    if(exceptions.length)console.warn("PAGEERROR",name,width,exceptions);
    assert.deepEqual(exceptions,[],name+" browser JS errors");
    await page.screenshot({path:path.join(out,name+"-"+(mobile?"mobile":"desktop")+".png"),animations:"disabled",fullPage:false});
    console.log("PASS",name,width,"width",overflow.doc);
    await page.close();
   }
   await ctx.close();
  }
 }finally{await browser.close();}
})().catch(err=>{console.error(err);process.exit(1)});
