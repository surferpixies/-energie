#!/usr/bin/env node
"use strict";
// Audit du moteur de recherche REEL : aucune simulation de correspondance.
const fs=require("node:fs");
const path=require("node:path");
require("../cnf-catalog.js");
const api=require("../cnf-search.js");
const catalog=global.ENERGIE_CNF_CATALOG||[];
const full=process.env.NUTRITION_FULL_RECOGNITION==="1";
const sampleSize=Math.max(1,Number(process.env.NUTRITION_SAMPLE_SIZE)||200);
const rows=full?catalog:catalog.filter((_,i)=>i%Math.max(1,Math.floor(catalog.length/sampleSize))===0).slice(0,sampleSize);
const summary={totalCatalog:catalog.length,assessed:0,ownNameEligible:0,ownNameRejected:0,foundInGuidedTop30:0,missingInGuidedTop30:0,autoSameId:0,autoOtherId:0,autoAverage:0,autoNoMatch:0,autoClarification:0};
const exceptions=[];
const classifications={needsReview:0,expectedClarification:0,alternativeVariant:0,averagedCandidates:0,exactMatch:0};
const normalized=s=>String(s||"").toLocaleLowerCase("fr-CA").normalize("NFD").replace(/[\\u0300-\\u036f]/g,"").replace(/[^a-z0-9]+/g," ").trim();
function record(row,field,additional={}) {
  summary[field]++;
  exceptions.push({id:String(row[0]),nameFr:row[1],field,...additional});
}
for(const row of rows) {
  const id=String(row[0]),name=String(row[1]||"").trim();
  if(!name)continue;
  summary.assessed++;
  // scoreRow applique les garde-fous du catalogue sur le propre nom officiel.
  const score=api.scoreRow(row,name,{allowPreparationChoice:true});
  if(Number.isFinite(score))summary.ownNameEligible++;
  else record(row,"ownNameRejected");
  // La liste guidée et find() passent tous deux dans cnf-search.js.
  const suggested=api.search(name,30);
  if(suggested.some(x=>x.id===id))summary.foundInGuidedTop30++;
  else record(row,"missingInGuidedTop30",{suggestedIds:suggested.slice(0,5).map(x=>x.id)});
  if(api.requiresClarification(name)) {summary.autoClarification++;classifications.expectedClarification++;continue;}
  const found=api.find(name);
  if(!found) {classifications.needsReview++;record(row,"autoNoMatch",{classification:"needsReview"});continue;}
  if(found.cnfMatchType==="average") {classifications.averagedCandidates++;record(row,"autoAverage",{matchedIds:found.cnfFoodIds,classification:"averagedCandidates"});continue;}
  if(found.cnfFoodId===id) {summary.autoSameId++;classifications.exactMatch++;}
  else {
    // Même libellé normalisé : variante/fiche doublon possible, jamais réussite prouvée.
    const variant=normalized(name)===normalized(found.cnfNameFr);
    classifications[variant?"alternativeVariant":"needsReview"]++;
    record(row,"autoOtherId",{matchedId:found.cnfFoodId,matchedName:found.cnfNameFr,classification:variant?"alternativeVariant":"needsReview"});
  }
}
const report={
  date:new Date().toISOString(),mode:full?"exhaustive":"sampled",scope:"Noms officiels FR : recherche guidee et automatique; les ambiguïtés/variantes ne sont PAS toutes des bogues",
  summary,classifications,exceptions,blockingFailures:catalog.length<5000||summary.assessed===0
};
const out=process.env.NUTRITION_RECOGNITION_REPORT;
if(out){fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(report,null,2));}
console.log(JSON.stringify({...report,exceptions:exceptions.slice(0,30)},null,2));
if(report.blockingFailures)process.exitCode=1;
