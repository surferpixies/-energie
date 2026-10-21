const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

// Exécuter le véritable bloc de sauvegarde des repas avec un client Supabase simulé.
// Aucune donnée utilisateur ni connexion réseau n'est nécessaire.
const source = fs.readFileSync(require.resolve('../app.js'), 'utf8');
const startMarker = '        } else if (op.kind === "meal") {';
const endMarker = '        } else if (op.kind === "deleteMealPhotos") {';
const start = source.indexOf(startMarker);
const end = source.indexOf(endMarker, start);
assert.ok(start >= 0 && end > start, 'Bloc de synchronisation des repas introuvable');
const branch = source.slice(start + 10, end + 10);
// Le bloc extrait commence par « else if » et se termine par la fermeture
// de la branche. Le « if (false) » sert uniquement de point d'entrée syntaxique.
const code = 'async function execute() { if (false) {} ' + branch + ' }';
async function check({ nutrition, errorMessage, expectedCalls, shouldReject }) {
  const calls = [];
  const meal = {
    id: 'meal-test', date: '2026-10-21', time: '12:00',
    type: 'Dîner', description: 'Repas de contrôle',
    nutrition, photos: [], createdAt: '2026-10-21T12:00:00Z',
    updatedAt: '2026-10-21T12:00:00Z',
  };
  const context = {
    op: { kind: 'meal', date: meal.date, id: meal.id },
    db: {}, session: { user: { id: 'test-user' } },
    ensureDay: () => ({ meals: [meal] }),
    uploadPhoto: async () => {},
    normalizeFeelingScores: () => ({}),
    normalizeEatingReasons: () => [],
    client: {
      from: table => {
        assert.equal(table, 'meals');
        return { upsert: async payload => {
          calls.push(structuredClone(payload));
          return { error: errorMessage && calls.length === 1 ? { message: errorMessage } : null };
        } };
      },
    },
  };
  vm.createContext(context);
  vm.runInContext(code, context);
  if (shouldReject) {
    await assert.rejects(context.execute(), /nutrition/i);
  } else {
    await context.execute();
  }
  assert.equal(calls.length, expectedCalls);
  return calls;
}
(async () => {
  const calculated = {
    calories: 511.5, source: 'mixed',
    proteins: 18, carbohydrates: 62, fats: 21,
    trace: { items: [
      { name: 'Bagel', calories: 250 },
      { name: 'Fromage à la crème', calories: 100 },
      { name: 'Banane', calories: 105 },
      { name: "Beurre d'arachide", calories: 56.5 },
    ] },
  };
  const failed = await check({
    nutrition: calculated,
    errorMessage: "Could not find the 'nutrition' column of 'meals' in the schema cache",
    expectedCalls: 1, shouldReject: true,
  });
  assert.equal(failed[0].nutrition.calories, 511.5);
  assert.equal(failed[0].nutrition.trace.items.length, 4);
  const successful = await check({
    nutrition: calculated, expectedCalls: 1, shouldReject: false,
  });
  assert.equal(successful[0].nutrition.source, 'mixed');
  // Les anciennes entrées sans nutrition conservent la compatibilité historique.
  const legacy = await check({
    nutrition: null,
    errorMessage: "Could not find the 'recommendation' column in the schema cache",
    expectedCalls: 2, shouldReject: false,
  });
  assert.equal(legacy[0].nutrition, null);
  assert.equal(Object.hasOwn(legacy[1], 'nutrition'), false);
  console.log('MEAL_SYNC_ERROR_CONTRACT', JSON.stringify({
    calculatedNutritionProtected: true, calculatedNutritionSaved: true,
    legacyFallback: true,
  }));
})().catch(error => { console.error(error); process.exitCode = 1; });
