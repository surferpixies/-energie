(() => {
  "use strict";
  const U = window.EnergieBrainModules?.utils;
  const DB = window.EnergieBrainModules?.database;
  const RECIPES = window.EnergieBrainModules?.recipes?.recipes || [];
  if (!U || !DB) throw new Error("EnergieBrain: modules manquants avant parser.js");
  const stopWords = new Set("avec et and de du des la le les un une au aux a à mon ma mes pour sur dans homemade maison petit petite grand grande tasse tranche bol portion c soupe cuillere cuillère".split(" "));
  function scoreMatch(text, alias) {
    const normalizedText = U.normalize(text), normalizedAlias = U.normalize(alias);
    if (!normalizedText || !normalizedAlias || !U.containsTerm(normalizedText, normalizedAlias)) return 0;
    if (normalizedText === normalizedAlias) return 1;
    const coverage = normalizedAlias.split(" ").length / Math.max(1, normalizedText.split(" ").length);
    return Math.min(.96, .72 + coverage * .22);
  }
  function findFoods(text) {
    const found = [], occupied = [];
    const normalized = U.normalize(text);
    DB.aliasIndex.forEach(entry => {
      const idx = (` ${normalized} `).indexOf(` ${entry.normalized} `);
      if (idx < 0 || occupied.some(range => idx >= range[0] && idx < range[1])) return;
      found.push({ id:entry.food.id, food:entry.food, matchedAlias:entry.alias, confidence:scoreMatch(normalized, entry.normalized), source:"explicit" });
      occupied.push([idx, idx + entry.normalized.length + 2]);
    });
    return [...new Map(found.map(x => [x.id, x])).values()];
  }
  function findRecipes(text) {
    const normalized = U.normalize(text);
    return RECIPES.filter(recipe => recipe.aliases.some(alias => U.containsTerm(normalized, alias))).map(recipe => ({...recipe, source:"recipe"}));
  }
  function unknownWords(text, matches) {
    let remaining = U.normalize(text);
    matches.forEach(match => { remaining = remaining.replace(U.normalize(match.matchedAlias || ""), " "); });
    RECIPES.forEach(recipe => recipe.aliases.forEach(alias => { remaining = remaining.replace(U.normalize(alias), " "); }));
    return U.unique(remaining.split(" ").filter(word => word.length > 2 && !stopWords.has(word) && !/^\d+$/.test(word)));
  }
  function parseMeal(text, options = {}) {
    const foods = findFoods(text), recipes = findRecipes(text);
    const personalMemory = options.memory === false ? null : (options.memoryStore || window.EnergieBrain?.memory)?.findBest?.(text) || null;
    const categories = new Set(), nutrients = new Set();
    foods.forEach(match => { match.food.categories.forEach(x => categories.add(x)); match.food.nutrients.forEach(x => nutrients.add(x)); });
    recipes.forEach(recipe => recipe.categories.forEach(x => categories.add(x)));
    const unknown = unknownWords(text, foods);
    const explicitConfidence = foods.length ? foods.reduce((sum,x)=>sum+x.confidence,0)/foods.length : 0;
    const recipeConfidence = recipes.length ? Math.max(...recipes.map(x=>x.confidence)) : 0;
    const memoryConfidence = personalMemory ? personalMemory.confidence * personalMemory.matchConfidence : 0;
    const confidence = Math.max(explicitConfidence, recipeConfidence, memoryConfidence, text ? .18 : 0);
    return { version:2, input:String(text||""), locale:options.locale||"fr-CA", foods, recipes, personalMemory, categories:[...categories], nutrients:[...nutrients], unknownWords:unknown, confidence:Number(confidence.toFixed(2)), isReliable:confidence>=.6 };
  }
  window.EnergieBrainModules = window.EnergieBrainModules || {};
  window.EnergieBrainModules.parser = Object.freeze({ version:1, findFoods, parseMeal });
})();
