const assert = require("node:assert/strict");
const corrections = require("../nutrition-corrections.js");

function food(key) {
  return corrections.find((item) => item.keys.includes(key));
}

function caloriesForGrams(key, grams) {
  const item = food(key);
  assert.ok(item, `${key} doit être présent dans les corrections`);
  assert.equal(item.gramsPerPortion, 100, `${key} doit avoir une référence de 100 g`);
  return item.calories * grams / item.gramsPerPortion;
}

assert.equal(caloriesForGrams("pain de seigle", 60), 155.4);
assert.equal(caloriesForGrams("guacamole", 35), 52.5);
assert.equal(caloriesForGrams("fromage blanc", 100), 75);
assert.equal(caloriesForGrams("framboises", 150), 78);
assert.ok(food("cafés"), "le pluriel cafés doit être reconnu comme café noir par défaut");
assert.equal(food("café latté").calories, 190, "un café latté ne doit pas devenir un café noir");
assert.equal(food("café cappuccino").calories, 120, "un cappuccino doit conserver son estimation");

const correctedMealCalories =
  caloriesForGrams("pain de seigle", 60) +
  caloriesForGrams("guacamole", 35) +
  78 +
  caloriesForGrams("fromage blanc", 100) +
  caloriesForGrams("framboises", 150) +
  food("cafés").calories;

assert.equal(Math.round(correctedMealCalories * 10) / 10, 441.9);
assert.ok(correctedMealCalories < 500, "le repas de régression ne doit plus atteindre 765,3 kcal");

console.log("nutrition quantity regression tests passed");
