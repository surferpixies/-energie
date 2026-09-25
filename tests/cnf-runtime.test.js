const assert = require("node:assert/strict");

global.window = {};
require("../foods.js");
const overrides = require("../cnf-runtime.js");

assert.equal(overrides.length, 50, "50 mappings FCÉN vérifiés doivent être actifs");

function food(key) {
  const normalized = String(key).toLowerCase();
  return overrides.find((item) =>
    (item.keys || []).some((k) => String(k).toLowerCase() === normalized)
  );
}

const banana = food("banane");
assert.ok(banana, "banane doit être présente dans les overrides FCÉN");
assert.equal(banana.cnfFoodId, "1704");
assert.equal(banana.gramsPerPortion, 118);
assert.equal(Math.round(banana.calories), 105);

const bacon = food("bacon");
assert.ok(bacon, "bacon doit être présent dans les overrides FCÉN");
assert.equal(bacon.cnfFoodId, "5405");
assert.equal(Math.round(bacon.calories), 133);

const beet = food("betterave");
assert.ok(beet, "betterave doit être présente dans les overrides FCÉN");
assert.equal(beet.cnfFoodId, "2501");
assert.ok(Math.abs(beet.gramsPerPortion - 179.628) < 0.001);

for (const item of overrides) {
  assert.equal(item.nutritionSource, "cnf");
  assert.ok(Number(item.gramsPerPortion) > 0, `${item.keys?.[0]} doit avoir une portion en grammes`);
  assert.ok(Number.isFinite(Number(item.calories)), `${item.keys?.[0]} doit avoir des calories`);
}

console.log("CNF runtime overrides tests passed");
