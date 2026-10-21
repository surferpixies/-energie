const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

// Simuler le retour d'un repas Supabase en exécutant la boucle réelle de pullCloud.
const source = fs.readFileSync(require.resolve('../app.js'), 'utf8');
const begin = source.indexOf('    for (const r of mr.data || []) {');
const end = source.indexOf('    for (const r of fr.data || []) {', begin);
assert.ok(begin > 0 && end > begin, 'Chargement des repas introuvable');
const normalizeBegin = source.indexOf('  function normalNutrition(');
const normalizeEnd = source.indexOf('  function normalizeFeelingScores(', normalizeBegin);
assert.ok(normalizeBegin > 0 && normalizeEnd > normalizeBegin);
const ctx = {};
vm.createContext(ctx);
vm.runInContext(source.slice(normalizeBegin, normalizeEnd), ctx);
const nutrition = {
  calories: 511.5, protein: 18, carbs: 62, fat: 21, source: 'mixed',
  trace: { items: [
    { name: 'Bagel', calories: 250, grams: 95 },
    { name: 'Fromage à la crème', calories: 100, grams: 30 },
    { name: 'Banane', calories: 105, grams: 120 },
    { name: "Beurre d'arachide", calories: 56.5, grams: 16 },
  ] },
};
const row = {
  id: 'meal-sync-roundtrip', meal_date: '2026-10-21', meal_time: '12:15:00',
  meal_type: 'Dîner', description: 'Repas de contrôle',
  nutrition: JSON.parse(JSON.stringify(nutrition)),
  updated_at: '2026-10-21T16:15:00Z', created_at: '2026-10-21T16:00:00Z',
};
const day = { meals: [] };
ctx.mr = { data: [row] };
ctx.db = {};
ctx.ensureDay = () => day;
// Exécuter également normalMeal de production, et non une imitation de test.
const mealStart = source.indexOf('  function normalMeal(');
const mealEnd = source.indexOf('  function normalFavorite(', mealStart);
assert.ok(mealStart > normalizeEnd && mealEnd > mealStart);
ctx.normalizeFeelingScores = () => ({});
ctx.normalizedEatingReasonState = () => ({ reasons: [], other: '' });
ctx.clamp = (value, low, high) => Math.min(high, Math.max(low, Number(value) || 0));
ctx.uid = () => 'generated-test-id';
ctx.todayKey = () => '2026-10-21';
vm.runInContext(source.slice(mealStart, mealEnd), ctx);
vm.runInContext(source.slice(begin, end), ctx);
assert.equal(day.meals.length, 1);
const restored = day.meals[0];
assert.equal(restored.nutrition.calories, 511.5);
assert.equal(restored.nutrition.protein, 18);
assert.equal(restored.nutrition.carbs, 62);
assert.equal(restored.nutrition.fat, 21);
assert.equal(restored.nutrition.source, 'mixed');
assert.equal(restored.nutrition.trace.items.length, 4);
assert.deepEqual(Array.from(restored.nutrition.trace.items, x => x.name),
  ['Bagel', 'Fromage à la crème', 'Banane', "Beurre d'arachide"]);
assert.deepEqual(Array.from(restored.nutrition.trace.items, x => x.grams), [95, 30, 120, 16]);
// Les données plus récentes du serveur doivent remplacer un ancien repas local.
day.meals[0].nutrition = { calories: 1 };
day.meals[0].updatedAt = '2026-10-20T12:00:00Z';
vm.runInContext(source.slice(begin, end), ctx);
assert.equal(day.meals[0].nutrition.calories, 511.5);
// Une ancienne ligne cloud sans nutrition ne doit pas effacer le calcul local
// lorsque la description du repas est toujours identique.
day.meals[0].nutrition = ctx.normalNutrition(nutrition);
day.meals[0].updatedAt = '2026-10-20T12:00:00Z';
row.nutrition = null;
row.updated_at = '2026-10-21T17:00:00Z';
vm.runInContext(source.slice(begin, end), ctx);
assert.equal(day.meals[0].nutrition.calories, 511.5);
assert.equal(day.meals[0].nutrition.trace.items.length, 4);
// Un autre repas portant le même identifiant mais une nouvelle description
// ne doit pas conserver de chiffres qui ne correspondent plus aux aliments.
row.description = 'Nouveau repas sans calcul';
row.updated_at = '2026-10-21T18:00:00Z';
vm.runInContext(source.slice(begin, end), ctx);
assert.equal(day.meals[0].nutrition, null);
assert.equal(day.meals[0].description, 'Nouveau repas sans calcul');
console.log('MEAL_CLOUD_PULL_CONTRACT', JSON.stringify({
  calories: nutrition.calories, ingredients: nutrition.trace.items.length,
  source: nutrition.source, cloudRefresh: true, missingCloudNutritionProtected: true, changedDescriptionCleared: true,
}));
