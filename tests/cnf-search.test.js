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

console.log("CNF full-catalog search tests passed");
console.log({
  artichaut: { id: artichaut.cnfFoodId, name: artichaut.cnfNameFr, kcal100g: artichaut.calories },
  navet: { id: navet.cnfFoodId, name: navet.cnfNameFr, kcal100g: navet.calories },
  tilapia: { id: tilapia.cnfFoodId, name: tilapia.cnfNameFr, kcal100g: tilapia.calories },
  chicken: { id: chicken.cnfFoodId, name: chicken.cnfNameFr, kcal100g: chicken.calories },
  chickenBreast: { id: chickenBreast.cnfFoodId, name: chickenBreast.cnfNameFr, kcal100g: chickenBreast.calories },
});
