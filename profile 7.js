(() => {
  "use strict";
  function mealText(meal){ return meal?.description || meal?.name || meal?.text || ""; }
  function analyzeDay(meals=[], options={}) {
    const analyses = meals.map(meal => window.EnergieBrainModules.parser.parseMeal(mealText(meal), options));
    const counts = {}, nutrients = {};
    analyses.forEach(a => { a.categories.forEach(x=>counts[x]=(counts[x]||0)+1); a.nutrients.forEach(x=>nutrients[x]=(nutrients[x]||0)+1); });
    const confidence = analyses.length ? analyses.reduce((s,a)=>s+a.confidence,0)/analyses.length : 0;
    return { meals:analyses, categories:counts, nutrients, variety:Object.keys(counts).length, confidence:Number(confidence.toFixed(2)) };
  }
  function buildProfile(meals=[], options={}) {
    const analyses = meals.map(meal => window.EnergieBrainModules.parser.parseMeal(mealText(meal), options));
    const categoryCounts = {}, nutrientCounts = {};
    analyses.forEach(a => { a.categories.forEach(x=>categoryCounts[x]=(categoryCounts[x]||0)+1); a.nutrients.forEach(x=>nutrientCounts[x]=(nutrientCounts[x]||0)+1); });
    const sort = obj => Object.entries(obj).sort((a,b)=>b[1]-a[1]).map(([id,count])=>({id,count,ratio:analyses.length?count/analyses.length:0}));
    return { version:1, mealCount:analyses.length, recognizedMealCount:analyses.filter(x=>x.foods.length||x.recipes.length).length, categories:sort(categoryCounts), nutrients:sort(nutrientCounts), averageConfidence:analyses.length?Number((analyses.reduce((s,a)=>s+a.confidence,0)/analyses.length).toFixed(2)):0 };
  }
  window.EnergieBrainModules = window.EnergieBrainModules || {};
  window.EnergieBrainModules.profile = Object.freeze({ analyzeDay, buildProfile });
})();
