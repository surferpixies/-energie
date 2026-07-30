(() => {
  "use strict";
  const M = window.EnergieBrainModules || {};
  const required = ["utils","database","recipes","memory","parser","confidence","profile"];
  const missing = required.filter(name => !M[name]);
  if (missing.length) throw new Error(`EnergieBrain: modules manquants: ${missing.join(", ")}`);
  const memory = M.memory.loadLocal();
  const persistMemory = () => M.memory.saveLocal(memory);
  const api = {
    version:"3.9.0-brain.2",
    foods:M.database.foods,
    legacyFoods:M.database.legacyFoods,
    parseMeal:(text,options={}) => M.parser.parseMeal(text,{...options,memoryStore:options.memoryStore||memory}),
    findFoods:M.parser.findFoods,
    analyzeMeal:(text,options={}) => M.parser.parseMeal(text,{...options,memoryStore:options.memoryStore||memory}),
    analyzeDay:M.profile.analyzeDay,
    buildProfile:M.profile.buildProfile,
    getFood:id => M.database.byId.get(id) || null,
    confidence:M.confidence.describe,
    memory,
    learnMeal(meal,analysis=null){ const result=memory.learnMeal(meal,analysis||this.parseMeal(meal?.description||meal?.name||meal?.text||"",{memory:false})); persistMemory(); return result; },
    learnMeals(meals=[]){ const result=memory.learnMany(meals,(text,options)=>M.parser.parseMeal(text,options)); persistMemory(); return result; },
    saveMemory:persistMemory,
    diagnostics(){ return {version:this.version, foods:this.foods.length, recipes:M.recipes.recipes.length, memories:memory.diagnostics().active, categories:window.ENERGIE_FOOD_CATEGORIES?.categories?.length||0}; }
  };
  window.EnergieBrain = Object.freeze(api);
  window.Brain = window.EnergieBrain;
  console.info("🧠 Cerveau d’Énergie prêt", api.diagnostics());
})();
