#!/usr/bin/env node
"use strict";
/**
 * Audit exhaustif des fiches FCÉN. Ce test parcourt TOUTES les fiches, sans
 * prétendre qu'une fiche accessible par identifiant est reconnue en saisie libre.
 */
const fs = require("node:fs");
const path = require("node:path");
require("../cnf-catalog.js");
const api = require("../cnf-search.js");
const catalog = global.ENERGIE_CNF_CATALOG || [];
const weights = [1, 50, 100, 150, 250, 500, 1000];
const problems = [];
const statuses = {valid:0,missingEnergy:0,invalidEnergy:0,missingId:0,conversionFailure:0};
const errorsById = [];
function flag(id,code,details) {
  problems.push({id,code,details:String(details).slice(0,180)});
}
for (const row of catalog) {
  const id=String(row?.[0]??"");
  const nutrients=row?.[3]||{};
  const raw=nutrients.calories;
  if (!api.getById(id)) {statuses.missingId++;flag(id,"missing-id","Fiche inaccessible par getById");continue;}
  if (raw==null || raw==="") {statuses.missingEnergy++;errorsById.push({id,status:"missing-energy"});continue;}
  const kcal=Number(raw);
  if (!Number.isFinite(kcal)||kcal<0) {statuses.invalidEnergy++;flag(id,"invalid-energy",raw);continue;}
  const baseline=api.nutritionForGrams(id,100);
  if (!baseline||!Number.isFinite(Number(baseline.calories))) {
    statuses.conversionFailure++;flag(id,"missing-100g","Conversion 100 g impossible");continue;
  }
  let bad=false;
  for (const grams of weights) {
    const n=api.nutritionForGrams(id,grams);
    const actual=Number(n?.calories);
    const expected=Number(baseline.calories)*grams/100;
    if (!Number.isFinite(actual)||Math.abs(actual-expected)>0.15+Math.abs(expected)*0.0001) {
      flag(id,"scaling",grams+"g : obtenu "+actual+"; attendu "+expected);
      bad=true;
    }
  }
  if(bad) statuses.conversionFailure++;
  else statuses.valid++;
}
const report={
  date:new Date().toISOString(),scope:"Acces par identifiant et calcul massique; reconnaissance saisie libre NON validee",
  catalogRows:catalog.length,weightsGrams:weights,statuses,
  problemsCount:problems.length,problems,
  missingEnergyIds:errorsById,
  status:catalog.length>=5000 && !statuses.missingId && !statuses.invalidEnergy && !statuses.conversionFailure?"PASS":"FAIL"
};
const out=process.env.NUTRITION_AUDIT_PATH;
if(out) {fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(report,null,2));}
console.log(JSON.stringify({...report,problems:problems.slice(0,25),missingEnergyIds:errorsById.slice(0,20)},null,2));
if(report.status!=="PASS")process.exitCode=1;
