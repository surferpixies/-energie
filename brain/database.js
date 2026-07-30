(() => {
  "use strict";
  const U = window.EnergieBrainModules?.utils;
  if (!U) throw new Error("EnergieBrain: utils.js doit être chargé avant database.js");
  const source = Array.isArray(window.ENERGIE_FOODS) ? window.ENERGIE_FOODS : [];
  const categoryEngine = window.ENERGIE_FOOD_CATEGORIES;
  const slug = value => U.normalize(value).replace(/\s+/g, "-") || "food";
  const categoryAliases = {
    fruit:["fruits","fiber"], "légume":["vegetables","fiber"], legume:["legumes","fiber","plant_protein"],
    "légumineuse":["legumes","fiber","plant_protein"], "féculent":["starches"], "protéine":["protein"],
    "produit laitier":["dairy","protein"], noix:["nuts","healthy_fats"], graines:["seeds","healthy_fats","fiber"],
    poisson:["fish","protein"], boisson:["beverages"], dessert:["sweets"], collation:["snacks"],
    "repas préparé":["prepared_meals"], condiment:["condiments"]
  };
  const nutrientRules = [
    [/brocoli|chou fleur|poivron|orange|fraise|kiwi|agrum/, ["vitamin_c"]],
    [/epinard|épinard|kale|lentille|pois chiche|haricot/, ["folate","iron"]],
    [/saumon|sardine|maquereau|truite/, ["omega_3","vitamin_d","b12"]],
    [/chia|lin|noix/, ["omega_3","fiber"]],
    [/avoine|gruau|pain ble entier|pain blé entier|riz brun|quinoa/, ["whole_grain","fiber"]],
    [/yogourt|yaourt|lait|fromage/, ["calcium","b12"]],
    [/oeuf|œuf/, ["protein","choline","b12"]]
  ];
  function inferCategories(food) {
    const categories = new Set();
    (food.tags || []).forEach(tag => (categoryAliases[U.normalize(tag)] || [U.normalize(tag)]).forEach(x => categories.add(x)));
    const text = (food.keys || []).join(" ");
    categoryEngine?.categoryIdsForText?.(text).forEach(x => categories.add(x));
    if (Number(food.protein) >= 10) categories.add("protein");
    if (Number(food.fat) >= 8 && !categories.has("sweets")) categories.add("fat_source");
    return [...categories];
  }
  function inferNutrients(food) {
    const text = U.normalize((food.keys || []).join(" "));
    const nutrients = new Set();
    nutrientRules.forEach(([pattern, values]) => { if (pattern.test(text)) values.forEach(x => nutrients.add(x)); });
    if (inferCategories(food).includes("fiber")) nutrients.add("fiber");
    if (Number(food.protein) >= 10) nutrients.add("protein");
    return [...nutrients];
  }
  const foods = source.map((food, index) => {
    const aliases = U.unique(food.keys || []);
    return Object.freeze({
      id: food.id || `${slug(aliases[0])}-${index + 1}`,
      names: { "fr-CA": aliases[0] || `Aliment ${index + 1}`, "fr-FR": aliases[0] || `Aliment ${index + 1}`, en: aliases.find(x => /^[\x00-\x7F]+$/.test(x)) || aliases[0] || `Food ${index + 1}` },
      aliases,
      categories: inferCategories(food),
      nutrients: inferNutrients(food),
      nutrition: { calories:Number(food.calories)||0, protein:Number(food.protein)||0, carbs:Number(food.carbs)||0, fat:Number(food.fat)||0 },
      portion: food.portion || null,
      legacy: food
    });
  });
  const byId = new Map(foods.map(food => [food.id, food]));
  const aliasIndex = foods.flatMap(food => food.aliases.map(alias => ({ food, alias, normalized:U.normalize(alias) }))).filter(x => x.normalized).sort((a,b) => b.normalized.length-a.normalized.length);
  window.EnergieBrainModules = window.EnergieBrainModules || {};
  window.EnergieBrainModules.database = Object.freeze({ version:1, foods, byId, aliasIndex, legacyFoods:source });
})();
