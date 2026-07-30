(() => {
  "use strict";
  const M = window.EnergieBrainModules || {};
  const required = ["utils","database","recipes","parser","confidence","profile"];
  const missing = required.filter(name => !M[name]);
  if (missing.length) throw new Error(`EnergieBrain: modules manquants: ${missing.join(", ")}`);
  const api = {
    version:"3.8.0-brain.1",
    foods:M.database.foods,
    legacyFoods:M.database.legacyFoods,
    parseMeal:M.parser.parseMeal,
    findFoods:M.parser.findFoods,
    analyzeMeal:M.parser.parseMeal,
    analyzeDay:M.profile.analyzeDay,
    buildProfile:M.profile.buildProfile,
    getFood:id => M.database.byId.get(id) || null,
    confidence:M.confidence.describe,
    diagnostics(){ return {version:this.version, foods:this.foods.length, recipes:M.recipes.recipes.length, categories:window.ENERGIE_FOOD_CATEGORIES?.categories?.length||0}; }
  };
  window.EnergieBrain = Object.freeze(api);
  window.Brain = window.EnergieBrain;
  console.info("🧠 Cerveau d’Énergie prêt", api.diagnostics());
})();
