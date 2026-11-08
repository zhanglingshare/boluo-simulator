#!/usr/bin/env node
/* Published-repository compatibility check only.
 * Scoring and parameter calibration are not performed in this public tree.
 * The private computation job must publish independently reviewed output.
 */
"use strict";
const fs=require("node:fs");
const path=require("node:path");
const file=path.join(__dirname,"..","data","relationship-changes-v1.json");
if(process.argv.includes("--write")){
  console.error("Published scores are read-only here. Generate and review them using the restricted data pipeline.");
  process.exitCode=2;
}else{
  const data=JSON.parse(fs.readFileSync(file,"utf8"));
  const changes=data.changes||[];
  const invalid=changes.filter(x=>x.structure_score!==undefined&&!(Number.isFinite(x.structure_score)&&x.structure_score>=0));
  if(invalid.length)throw new Error("Invalid published score values: "+invalid.length);
  console.log("Public relationship check: "+changes.length+" records; "+invalid.length+" invalid score values. No scores recalculated.");
}
