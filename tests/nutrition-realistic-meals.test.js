const assert = require("node:assert/strict");
const portions = require("../nutrition-portion-engine.js");
const corrections = require("../nutrition-corrections.js");

global.window = {};
require("../foods.js");

const foods = [...corrections, ...(window.ENERGIE_FOODS || [])];
function food(key) {
  const found = foods.find((item) => item.keys.includes(key));
  assert.ok(found, `${key} doit être présent dans le catalogue`);
  return found;
}
function calories(segment, key) {
  const item = food(key), scale = portions.scaleForSegment(segment, item).scale;
  return item.calories * scale;
}

const correctedBreakfast =
  calories("60 g pain de seigle", "pain de seigle") +
  calories("35 g guacamole", "guacamole") +
  calories("1 œuf dur", "œuf") +
  calories("100 g fromage blanc", "fromage blanc") +
  calories("150 g framboises", "framboises") +
  calories("cafés", "cafés");

assert.equal(Math.round(correctedBreakfast * 10) / 10, 441.9);
assert.equal(calories("2 tranches de pain blanc", "pain blanc"), 160);
assert.equal(calories("3 œufs", "oeufs"), 234);
assert.equal(calories("1/2 avocat", "avocat"), 120);
assert.ok(Math.abs(calories("100 g riz blanc", "riz blanc") - 205 * 100 / 190) < 0.0001);

assert.equal(520 * portions.scaleForDish("½ portion de lasagne").scale, 260);
assert.ok(Math.abs(480 * portions.scaleForDish("2 tacos", food("tacos")).scale - 320) < 0.0001);

console.log("nutrition realistic meal tests passed");
