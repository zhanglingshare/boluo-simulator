"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,".."),read=p=>fs.readFileSync(path.join(root,p),"utf8");
test("09 is a full linked page, not an empty concept or report",()=>{
 const html=read("v11/challenge.html");
 for(const id of ["challengeMain","choose","arenaTitle","worldATitle","worldBTitle","rivalChoices","evidenceOptions","incomingMissing","verdictTitle","myNote","myCard","downloadCard","copyChallenge","saveChallenge","restoreChallenge","exportCanvas","falsifier","falsifierThreshold","falsifierHorizon","confidence","cardFalsifier"])assert.match(html,new RegExp('id="'+id+'"'),id);
 assert.equal((html.match(/data-claim="/g)||[]).length,4);
 assert.equal((html.match(/data-proof="/g)||[]).length,3);
 assert.match(html,/09 我的决策实验/);
 assert.match(html,/2026 Q1–Q3/);
 assert.match(html,/FALSIFICATION/);
 assert.match(html,/农业价值链/);
 assert.match(html,/公开统计/);
 assert.match(html,/非真实企业交易网络/);
});
test("09 does not expose unpublished formulas or invent empirical probabilities",()=>{
 const html=read("v11/challenge.html"),js=read("v11/challenge.js");
 for(const c of [html,js])assert.doesNotMatch(c,/SmartPLS|PLS-SEM|\bSEM\b|\bSNA\b|蒙特卡洛|randomSeed|xToM|NODE_TYPE_W|结构评分公式|真实达标概率/);
 assert.match(html,/结果/);
 assert.match(js,/sessionStorage\.getItem\(snapshotKey\)/);
 assert.match(js,/不是.*现实|非平台核验/);
 assert.doesNotThrow(()=>new Function(js));
 assert.doesNotThrow(()=>new Function(read("v11/challenge-link.js")));
});
test("07 and 08 handoff into 09 with public condition information",()=>{
 const w=read("v11/wind.html"),i=read("v11/insights.html"),bridge=read("v11/insight-workbench.js");
 assert.match(w,/id="goDecisionChallenge"/);
 assert.match(w,/challenge-link\.js/);
 assert.match(i,/id="iqToChallenge"/);
 assert.match(bridge,/challenge\.html/);
 assert.match(bridge,/challenge\.searchParams\.set/);
 assert.match(read("v11/challenge-link.js"),/BoluoWind\?\.getResults/);
});
test("09 renders interactive graphs, readable cards and mobile interactions",()=>{
 const css=read("v11/challenge.css"),js=read("v11/challenge.js");
 assert.match(css,/@media\(max-width:620px\)/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.match(css,/network-edges/);
 assert.match(css,/mobile-nav/);
 assert.match(js,/addEventListener\("click"/);
 assert.match(js,/makeImage/);
 assert.match(js,/state\.falsifier/);
 assert.match(js,/state\.confidence/);
 assert.match(js,/claimFromFactor=.*agri/);
 assert.match(js,/toDataURL\("image\/png"\)/);
 assert.match(js,/localStorage\.setItem/);
 assert.match(js,/currentLink/);
 assert.match(js,/textContent=/);
});
