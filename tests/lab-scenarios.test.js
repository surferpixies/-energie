const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ctx = vm.createContext({window:{},console,Date});
vm.runInContext(fs.readFileSync(require.resolve('../food-categories.js'),'utf8'),ctx);
let categoryCalls=0, generationCalls=0;
const catalog=ctx.window.ENERGIE_FOOD_CATEGORIES;
ctx.window.ENERGIE_FOOD_CATEGORIES={...catalog,categoryIdsForText:text=>{categoryCalls++;return catalog.categoryIdsForText(text);}};
for (const file of ['demo-lab.js','observation-engine.js']) vm.runInContext(fs.readFileSync(require.resolve('../'+file),'utf8'),ctx);
const lab = ctx.window.EnergieDemoLab;
assert.equal(lab.scenarios.length,10);
for (const id of ['dairy-digestion','gluten-digestion','soy-digestion','spicy-digestion']) assert.ok(lab.scenarios.some(s=>s.id===id));
for (const scenario of lab.scenarios) {
  for (const variant of [1,2]) {
    const beforeCalls=categoryCalls;
    const journal = lab.generate(scenario.id,{variant,endDate:'2026-10-07'});
    generationCalls+=categoryCalls-beforeCalls;
    assert.equal(Object.keys(journal.days).length,60);
    const report = ctx.window.EnergieObservationEngine.analyze(journal);
    assert.ok(Array.isArray(report.observations));
    assert.ok(lab.scenarios.some(s=>s.id===lab.randomScenario({variant}).id));
  }
}
assert.ok(generationCalls<300,'Les descriptions du générateur sont analysées une seule fois');
const source=fs.readFileSync(require.resolve('../app.js'),'utf8');
let calls=0;
const cacheCtx=vm.createContext({window:{ENERGIE_LOCALE:'fr-CA'},estimateNutritionFromText:text=>{calls++;return text==='inconnu'?null:{calories:100};},normalNutrition:x=>x||null});
vm.runInContext(source.slice(source.indexOf('  const observationNutritionCache'),source.indexOf('  function recommendationHistory')),cacheCtx);
for(let i=0;i<240;i++) cacheCtx.nutritionForRecommendation({description:i%2?'repas':'inconnu'});
assert.equal(calls,2,'Une seule estimation par description, même en cas de résultat inconnu');
assert.equal(cacheCtx.nutritionForRecommendation({description:'repas',nutrition:{calories:250}}).calories,250);
cacheCtx.window.ENERGIE_LOCALE='fr-FR';cacheCtx.nutritionForRecommendation({description:'repas'});assert.equal(calls,3);
for(let i=0;i<400;i++)cacheCtx.observationNutritionEstimate('repas'+i);
assert.ok(vm.runInContext('observationNutritionCache.size',cacheCtx)<=300);
(async()=>{
 const real={settings:{},days:{original:{}}}, memory={memories:['réel']};
 let renders=0, alerts=0, fail=false;
 const entryCtx=vm.createContext({window:{EnergieDemoLab:{generate:()=>{if(fail)throw Error('test');return {settings:{},days:{'2026-10-07':{}}}}},Brain:{replaceMemoryState:()=>{}}},db:real,selectedDate:'2026-10-06',currentView:'profile',labRealDb:null,labRealBrainMemory:null,labVariant:1,insightsComputationCache:null,observationExplorerResultsCache:new Map(),brainMemoryState:()=>memory,migrate:x=>x,buildDemoBrainMemory:()=>{},render:()=>{renders++;},$:()=>({innerHTML:''}),esc:x=>x,t:x=>x,alert:()=>{alerts++;},console:{error:()=>{}},setTimeout,JSON,todayKey:()=> '2026-10-07'});
 vm.runInContext(source.slice(source.indexOf('  let labScenarioLoading'),source.indexOf('  function randomLabScenario')),entryCtx);
 await entryCtx.enterLabScenario('test');assert.equal(entryCtx.db.settings.demoReadOnly,true);
 const active=entryCtx.db;
 fail=true;await entryCtx.enterLabScenario('broken');assert.equal(entryCtx.db,active);assert.equal(alerts,1);
 entryCtx.leaveLab();assert.equal(entryCtx.db,real,'Le journal réel est restauré après un échec de variante');
 assert.equal(renders,3);assert.equal(vm.runInContext('labScenarioLoading',entryCtx),false);
 console.log('Laboratoire : 10 scénarios × 2 variantes analysés; cache borné, langue, valeurs manuelles et restauration après erreur OK');
})().catch(error=>{console.error(error);process.exitCode=1;});
