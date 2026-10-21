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
check(catalog.length>=5000,"Catalogue FCÉN complet (minimum 5000 fiches)",`0 fiche dans cnf-catalog.js (le fichier est-il généré/embarqué ?)`);
load("cnf-search.js",ctx);
const api=sandbox.ENERGIE_CNF_SEARCH;
check(Boolean(api && typeof api.find==="function" && typeof api.getById==="function" && typeof api.nutritionForGrams==="function"),"API de recherche FCÉN disponible");

const ids=new Set();
let usableCalories=0, absentCalories=0, ambiguousNames=0;
const frIndex=new Map();
for(const [index,row] of catalog.entries()){
  const id=String(row?.[0]??"");const fr=String(row?.[1]??"").trim();
  const en=String(row?.[2]??"").trim();const nutrients=row?.[3]||{};
  check(Boolean(id&&fr&&en&&nutrients&&typeof nutrients==="object"&&!Array.isArray(nutrients)),"Fiche valide #"+index,id);
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
// Couverture par familles dans le catalogue complet : signale les exports tronqués.
// Ces recherches portent sur les noms officiels et ne valident pas, à elles seules,
// la saisie libre et le choix de la meilleure préparation.
const groups = {
  pates: /spaghett|macaroni|linguine|penne|lasagn|fusilli|ravioli|tortellini|pasta/i,
  viandes: /boeuf|bœuf|beef|porc|pork|veau|veal|agneau|lamb|bison|venison/i,
  volailles: /poulet|chicken|dinde|turkey|canard|duck/i,
  poissons: /saumon|salmon|thon|tuna|morue|cod|sole|trout|truite/i,
  fruits: /banane|banana|pomme|apple|orange|fraise|strawberry|ananas|pineapple/i,
  legumes: /tomate|tomato|carotte|carrot|brocoli|broccoli|concombre|cucumber/i,
  laitiers: /fromage|cheese|yogourt|yogurt|milk|lait|cream/i,
  noix: /arachide|peanut|amande|almond|walnut|noix/i
};
const familyCoverage={};
for(const [family,pattern] of Object.entries(groups)){
  const count=catalog.reduce((n,row)=>n+(pattern.test(String(row?.[1]||"")+" "+String(row?.[2]||""))?1:0),0);
  familyCoverage[family]=count;
  check(count>0,"Famille FCÉN couverte : "+family);
}
// Distinguer calories absentes et calories nulles authentiques.
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
  ambiguousFrenchNames:ambiguousNames,familyCoverage,checksPassed:passed,checksFailed:failures,
  status:failures?"FAIL":"PASS",errors:errors.slice(0,100),
  scope:"Intégrité FCÉN + règles de sécurité; PAS un test end-to-end de saisie repas"};
console.log(JSON.stringify(report,null,2));
process.exitCode=failures?1:0;
