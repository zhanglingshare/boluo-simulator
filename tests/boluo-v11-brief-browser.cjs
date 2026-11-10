"use strict";
const {chromium}=require("playwright"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,".."),out=path.join(root,"artifacts/v11-brief");fs.mkdirSync(out,{recursive:true});
const stamp="2026-11-11T02:00:00.000Z";
const fixture={
 "boluo-v11/discovery-questions/v1":[{topic:"industry",inquiry:"核实本地供应商订单",town:"石湾",event:"企业扩产"}],
 "boluo-impact-traces-v1":[{scene:"traffic",step:2,savedAt:stamp}],
 "boluo-v11-plan-snapshots":[{route:"connect",region:"博罗",year:"2030",savedAt:stamp}],
 "boluo-v11-wind-experiments":[{shock:"orders",strength:1.2,buffer:true,active:true,paths:["manufacturing","services"],primary:"manufacturing",scope:"selected",median:1510,baseline:1580,baselineParams:{baseScale:1.05,volScale:1.1,count:5000,paths:[1,.9,1.1,1,1]},distribution:{threshold:1600,view:"cdf"},savedAt:stamp}],
 "boluo-v11-insight-focus":{target:"manufacturing",factor:"supplier",name:"本地配套采购",missing:"供应商所在地与采购合同",question:"新增订单究竟留在谁手上？",savedAt:stamp},
 "boluo-v11-challenge-last":{v:2,claim:"orders",rival:2,evidence:0,proof:"alternative",note:"核实供应商清单",falsifier:"本地采购份额连续两个季度上升",threshold:"本地采购占比高于60%",horizon:"未来半年",confidence:72,at:stamp},
 "boluo-v11-region-focus":{topic:"cooperation",layer:"people",date:stamp,role:"resilient",flow:"agriculture",flowStage:4,pressure:{dependency:90,shock:90,substitute:10,score:999}}
};
const session={"boluo-v11-challenge-07":{shock:"orders",strength:1.2,buffer:true,base:{p10:1450,p50:1580,p90:1700},stress:{p10:1350,p50:1510,p90:1660},savedAt:stamp}};
(async()=>{
 const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 try{
  for(const width of [1440,390]){
   const mobile=width===390,ctx=await browser.newContext({viewport:{width,height:mobile?844:1000},isMobile:mobile,hasTouch:mobile,acceptDownloads:true,deviceScaleFactor:1});
   await ctx.addInitScript(({fixture,session})=>{for(const [k,v] of Object.entries(fixture))localStorage.setItem(k,JSON.stringify(v));for(const [k,v] of Object.entries(session))sessionStorage.setItem(k,JSON.stringify(v));window.__printCount=0;window.print=()=>{window.__printCount++};},{fixture,session});
   const page=await ctx.newPage(),errors=[];page.on("pageerror",e=>errors.push(e.message));
   const res=await page.goto("http://127.0.0.1:8765/v11/brief.html",{waitUntil:"networkidle"});assert.equal(res.status(),200);
   assert.equal(await page.locator("#savedCount").innerText(),"7");
   assert.match(await page.locator("#windAudit").innerText(),/关键条件|订单外流|本地价值链延伸/);
   assert.match(await page.locator("#windAudit").innerText(),/5,000/);
   assert.match(await page.locator("#challengeAudit").innerText(),/本地采购份额连续两个季度上升/);
   assert.match(await page.locator("#challengeAudit").innerText(),/主观确信/);
   assert.match(await page.locator("#regionAudit").innerText(),/结构暴露 73\/100/);
   assert.match(await page.locator("#regionAudit").innerText(),/农户回款/);
   assert.match(await page.locator("#evidenceQueue").innerText(),/新增订单究竟留在谁手上/);
   assert.match(await page.locator("#reportStamp").innerText(),/本机档案读取于/);
   const regionLink=await page.locator("#regionAudit a").getAttribute("href");
   const u=new URL(regionLink,"http://127.0.0.1:8765");
   assert.equal(u.searchParams.get("dep"),"90");assert.equal(u.searchParams.get("shock"),"90");assert.equal(u.searchParams.get("sub"),"10");
   assert.equal(u.searchParams.get("flowStage"),"4");assert.equal(u.searchParams.get("flow"),"agriculture");
   const widthCheck=await page.evaluate(()=>({inner:innerWidth,scroll:document.documentElement.scrollWidth}));
   assert.ok(widthCheck.scroll<=widthCheck.inner+2,JSON.stringify(widthCheck));
   await page.locator("#exportPDF").click();assert.equal(await page.evaluate(()=>window.__printCount),1);
   if(!mobile){
    const dl=page.waitForEvent("download");await page.locator("#exportJSON").click();const download=await dl;const p=await download.path();const json=JSON.parse(fs.readFileSync(p,"utf8"));
    assert.equal(json.format,"boluo-v11-research-dossier");assert.equal(json.version,2);assert.equal(json.record.region.pressure.score,73);
    assert.equal(json.record.wind.baselineParams.count,5000);assert.equal(json.record.challenge.falsifier,"本地采购份额连续两个季度上升");
    await page.screenshot({path:path.join(out,"brief-desktop.png"),fullPage:true});
   }else await page.screenshot({path:path.join(out,"brief-mobile.png"),fullPage:true});
   assert.deepEqual(errors,[]);await ctx.close();
  }
  const empty=await browser.newContext({viewport:{width:390,height:844}}),page=await empty.newPage(),errors=[];
  page.on("pageerror",e=>errors.push(e.message));
  const res=await page.goto("http://127.0.0.1:8765/v11/brief.html",{waitUntil:"networkidle"});assert.equal(res.status(),200);
  assert.equal(await page.locator("#savedCount").innerText(),"0");
  assert.match(await page.locator("#windAudit").innerText(),/尚无已保存的风洞实验/);
  assert.match(await page.locator("#regionAudit").innerText(),/尚未保存区域问题/);
  assert.deepEqual(errors,[]);await empty.close();
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
