const assert = require("node:assert/strict");
const portions = require("../nutrition-portion-engine.js");

assert.equal(portions.number("1/2"), 0.5);
assert.equal(portions.number("1 1/2"), 1.5);
assert.equal(portions.number("½"), 0.5);
assert.equal(portions.number("1½"), 1.5);
assert.deepEqual(portions.quantityFromText("1 1/2 tasse de riz"), { value: 1.5, unit: "cup" });
assert.deepEqual(portions.quantityFromText("½ portion de lasagne"), { value: 0.5, unit: "portion" });
assert.deepEqual(portions.quantityFromText("2 œufs"), { value: 2, unit: "item" });

assert.equal(
  portions.scaleForSegment("60 g de pain de seigle", {
    portion: "100 g",
    gramsPerPortion: 100,
  }).scale,
  0.6,
);
assert.equal(
  portions.scaleForSegment("2 tranches de pain", { portion: "1 tranche" }).scale,
  2,
);
assert.equal(
  portions.scaleForSegment("1/2 avocat", { portion: "1 moyen" }).scale,
  0.5,
);
assert.equal(
  portions.scaleForSegment("3 œufs", { portion: "2 gros" }).scale,
  1.5,
);

const rice = portions.scaleForSegment("100 g de riz", {
  keys: ["riz blanc"],
  portion: "1 tasse cuite",
  tags: ["féculent"],
});
assert.ok(Math.abs(rice.scale - 100 / 190) < 0.0001);
assert.equal(rice.quantityUsed, true);
assert.equal(rice.approximate, true);

assert.equal(portions.scaleForDish("½ portion de lasagne").scale, 0.5);
assert.equal(portions.scaleForDish("petite poutine").scale, 0.75);
assert.equal(portions.scaleForDish("grande salade grecque").scale, 1.25);
assert.equal(portions.scaleForDish("1 petite portion de poutine").scale, 0.75);
assert.equal(portions.sizeMultiplier("petits pois"), 1);
assert.ok(Math.abs(portions.scaleForDish("100 g de spaghetti bolognaise").scale - 100 / 350) < 0.0001);
assert.ok(Math.abs(portions.scaleForDish("2 tacos", { portion: "3 tacos" }).scale - 2 / 3) < 0.0001);
assert.equal(portions.scaleForDish("2 tacos").scale, 1, "un nombre sans portion de référence ne doit pas multiplier le plat complet");
assert.equal(portions.scaleForDish("1 pizza", { portion: "2 pointes" }).scale, 1, "une pizza ne doit pas être confondue avec une pointe");

console.log("nutrition portion engine tests passed");
