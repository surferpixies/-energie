global.window = globalThis;
require("../cnf-catalog.js");
const search = require("../cnf-search.js");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const artichaut = search.find("100 g artichaut");
const navet = search.find("100 g navet cuit");
const tilapia = search.find("100 g tilapia");

for (const [label, food] of Object.entries({ artichaut, navet, tilapia })) {
  assert(food, `${label}: aucune correspondance FCÉN`);
  assert(food.nutritionSource === "cnf", `${label}: source non FCÉN`);
  assert(Number.isFinite(Number(food.calories)), `${label}: calories invalides`);
}


const chicken = search.find("100 g poulet");
const chickenBreast = search.find("100 g poitrine de poulet");

for (const [label, food] of Object.entries({ chicken, chickenBreast })) {
  assert(food, `${label}: aucune correspondance FCÉN`);
  assert(food.nutritionSource === "cnf", `${label}: source non FCÉN`);
}

assert(chicken.cnfFoodId === "567", `poulet: fiche inattendue ${chicken.cnfFoodId}`);
assert(chickenBreast.cnfFoodId === "842", `poitrine de poulet: fiche inattendue ${chickenBreast.cnfFoodId}`);

const commonFoods = {
  greenSalad: search.find("salade verte"),
  greenSalad100g: search.find("100 g salade verte"),
  apple: search.find("100 g pomme"),
  broccoli: search.find("100 g brocoli"),
  salmon: search.find("100 g saumon"),
  groundBeef: search.find("100 g boeuf haché"),
  cheddar: search.find("100 g cheddar"),
  plainYogurt: search.find("100 g yogourt nature"),
};

for (const [label, food] of Object.entries(commonFoods)) {
  assert(food, `${label}: aucune correspondance FCÉN`);
  assert(food.nutritionSource === "cnf", `${label}: source non FCÉN`);
  assert(Number.isFinite(Number(food.calories)), `${label}: calories invalides`);
}
assert(commonFoods.greenSalad100g.calories < 30, `salade verte 100 g: estimation trop élevée ${commonFoods.greenSalad100g.calories}`);
assert(commonFoods.greenSalad.calories < 40, `salade verte: estimation trop élevée ${commonFoods.greenSalad.calories}`);

console.log("CNF full-catalog search tests passed");
console.log({
  artichaut: { id: artichaut.cnfFoodId, name: artichaut.cnfNameFr, kcal100g: artichaut.calories },
  navet: { id: navet.cnfFoodId, name: navet.cnfNameFr, kcal100g: navet.calories },
  tilapia: { id: tilapia.cnfFoodId, name: tilapia.cnfNameFr, kcal100g: tilapia.calories },
  chicken: { id: chicken.cnfFoodId, name: chicken.cnfNameFr, kcal100g: chicken.calories },
  chickenBreast: { id: chickenBreast.cnfFoodId, name: chickenBreast.cnfNameFr, kcal100g: chickenBreast.calories },
  ...Object.fromEntries(Object.entries(commonFoods).map(([label, food]) => [label, {
    id: food.cnfFoodId,
    ids: food.cnfFoodIds,
    matchType: food.cnfMatchType || "single",
    name: food.cnfNameFr,
    kcal100g: food.calories,
  }])),
});
