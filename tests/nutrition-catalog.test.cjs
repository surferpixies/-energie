#!/usr/bin/env node
"use strict";
/**
 * Énergie: non-régression du catalogue FCÉN réellement embarqué.
 * Ne modifie aucune donnée. Lance avec: npm run test:nutrition
 * Échec (exit 1) si catalogue manquant, fiche corrompue ou API incorrecte.
 */
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
let failures = 0, passed = 0;
const errors = [];
function check(ok, label, info = "") {
  if (ok) { passed++; return; }
  failures++;
  errors.push({label, info:String(info).slice(0,220)});
}
function load(file, context) {
  const p=path.join(root,file);
  if (!fs.existsSync(p)) { check(false,"Fichier manquant",file); return false; }
  const content=fs.readFileSync(p,"utf8");
  if (!content.trim()) { check(false,"Fichier vide",file); return false; }
  try { vm.runInContext(content,context,{filename:file,timeout:12000}); return true; }
  catch(e) { check(false,"Erreur de chargement",file+" "+e.message); return false; }
}
const sandbox={console, Map, Set};
sandbox.window=sandbox;
sandbox.globalThis=sandbox;
const ctx=vm.createContext(sandbox);
load("foods.js",ctx);
load("cnf-catalog.js",ctx);
const catalog=Array.isArray(sandbox.ENERGIE_CNF_CATALOG)?sandbox.ENERGIE_CNF_CATALOG:[];
check(catalog.length>0,"Catalogue FCÉN chargé",`0 fiche dans cnf-catalog.js (le fichier est-il généré/embarqu é ?)`);
load("cnf-search.js",ctx);
const api=sandbox.ENERGIE_CNF_SEARCH;
check(Boolean(api && typeof api.find==="function" && typeof api.getById==="function" && typeof api.nutritionForGrams==="function"),"API de recherche FCÉN disponible");

const ids=new Set();
const sampleFailures=[];
let usableCalories=0, absentCalories=0, ambiguousNames=0;
const frIndex=new Map();
for(const [index,row] of catalog.entries()){
  const id=String(row?.[0]??"");const fr=String(row?.[1]??"").trim();
  const en=String(row?.[2]??"").trim();const nutrients=row?.[3]||{};
  check(Boolean(id&&fr&&en&&typeof nutrients==="object"),"Fiche valide #"+index,id);
  check(!ids.has(id),"Identifiant unique #"+index,id);
  ids.add(id);
  const kcal=nutrients.calories;
  if(kcal==null||kcal==="") {absentCalories++;continue;}
  const energy=Number(kcal);
  if(!Number.isFinite(energy)||energy<0) {check(false,"Calories valides #"+index,id);continue;}
  usableCalories++;
  const matched=api?.getById?.(id);
  check(matched!=null,"Fiche accessible par identifiant #"+index,id);
  const n100=api?.nutritionForGrams?.(id,100);
  const n200=api?.nutritionForGrams?.(id,200);
  check(n100!=null&&Number.isFinite(Number(n100.calories)),"Conversion 100 g #"+index,id);
  if(n100&&n200&&Number.isFinite(Number(n100.calories))&&Number.isFinite(Number(n200.calories))){
    check(Math.abs(Number(n200.calories)-2*Number(n100.calories))<=0.15,
      "Proportionnalité 100/200 g #"+index,id);
  }
  const key=fr.toLocaleLowerCase("fr-CA");
  frIndex.set(key,(frIndex.get(key)||0)+1);
}
for(const count of frIndex.values())if(count>1)ambiguousNames+=count;
check(usableCalories>0,"Valeurs nutritionnelles FCÉN utilisables","aucune ligne avec calories");
// Sécurité : matcher un aliment simple ne doit pas accepter automatiquement une recette.
if(api){
  check(api.isCandidateAllowed("tomate","Tomate, crue")===true,
    "Correspondance tomate simple autorisée");
  check(api.isCandidateAllowed("tomate","Tomates, avec vinaigrette")===false,
    "Tomate ≠ tomates avec vinaigrette");
  check(api.isCandidateAllowed("pomme","Tarte aux pommes")===false,
    "Pomme ≠ tarte aux pommes");
  check(api.requiresClarification("spaghetti secs")===false,
    "Spaghetti secs : préparation précisée");
  check(api.requiresClarification("spaghetti cuits")===false,
    "Spaghetti cuits : préparation précisée");
  check(api.requiresClarification("spaghetti")===true,
    "Spaghetti : demander cru/cuit");
}
// Vérifier les aliments simples du catalogue de repli, sans les présenter
// comme validés de bout en bout dans le formulaire repas.
const foods=Array.isArray(sandbox.ENERGIE_FOODS)?sandbox.ENERGIE_FOODS:[];
for(const [label,alias] of Object.entries({
  banane:"banane",bagel:"bagel",fromageCreme:"fromage à la crème",
  beurreArachide:"beurre d arachide",pomme:"pomme",spaghetti:"spaghetti",
  poulet:"poulet",tomate:"tomate",concombre:"concombre"
})){
  const found=foods.find(f=>(f.keys||[]).some(k=>String(k).toLocaleLowerCase("fr-CA")===alias));
  check(Boolean(found&&Number(found.calories)>0),"Catalogue local : "+label);
}
const report={date:new Date().toISOString(),source:"cnf-catalog.js local",
  catalogRows:catalog.length,rowsWithCalories:usableCalories,rowsWithoutCalories:absentCalories,
  ambiguousFrenchNames:ambiguousNames,checksPassed:passed,checksFailed:failures,
  status:failures?"FAIL":"PASS",errors:errors.slice(0,100),
  scope:"Intégrité FCÉN + règles de sécurité; PAS un test end-to-end de saisie repas"};
console.log(JSON.stringify(report,null,2));
process.exitCode=failures?1:0;
