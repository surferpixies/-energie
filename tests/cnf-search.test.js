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

console.log("CNF full-catalog search tests passed");
console.log({
  artichaut: { id: artichaut.cnfFoodId, name: artichaut.cnfNameFr, kcal100g: artichaut.calories },
  navet: { id: navet.cnfFoodId, name: navet.cnfNameFr, kcal100g: navet.calories },
  tilapia: { id: tilapia.cnfFoodId, name: tilapia.cnfNameFr, kcal100g: tilapia.calories },
});
