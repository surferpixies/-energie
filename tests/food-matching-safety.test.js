const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
require('../cnf-catalog.js');
const cnf = require('../cnf-search.js');
require('../ciqual-data.js');
require('../ciqual-search.js');
const ciqual = global.ENERGIE_CIQUAL_SEARCH;

const attacks = [
 ['tomate', 'Vinaigrette, bacon et tomates'],
 ['carotte', 'Gâteau aux carottes'],
 ['concombre', 'Salade de concombre'],
 ['pomme', 'Tarte aux pommes'],
 ['pâtes', 'Pâtes, boeuf classique, non préparé'],
 ['thon', 'Thon, salade'],
 ['poulet', 'Poulet, soupe avec nouilles'],
 ['riz', 'Riz au poulet'],
 ['oeuf', 'Oeuf avec bacon'],
 ['fromage', 'Soufflé au fromage'],
 ['saumon', 'Saumon sauce à l’oseille'],
 ['ananas', 'Ananas au sirop'],
 ['fraise', 'Confiture de fraises'],
 ['brocoli', 'Brocoli sauce au fromage'],
 ['banane', 'Pain aux bananes'],
 ['pomme', 'Pomme, sèche'],
];
for (const [query, candidate] of attacks) {
 for (const input of [query, `${query}s`, `250 g ${query}`, `2 ${query}s`])
  assert.equal(cnf.isCandidateAllowed(input, candidate), false, `${input} -> ${candidate}`);
}
for (const input of ['tomate', 'tomates', '250 g tomates', 'carotte', 'carottes', 'concombre', 'concombres', 'pomme']) {
 for (const api of [cnf, ciqual]) {
  const found = api.find(input);
  assert.ok(found, input);
  assert.ok(cnf.isCandidateAllowed(input, found.cnfNameFr), found.cnfNameFr);
  assert.ok(!/vinaigrette|bacon|gâteau|tarte|salade|sauce/i.test(found.cnfNameFr));
  for (const candidate of api.search(input, 30))
   assert.ok(cnf.isCandidateAllowed(input, candidate.nameFr), candidate.nameFr);
 }
}
for (const locale of ['fr-CA', 'fr-FR']) {
 global.ENERGIE_LOCALE = locale;
 for (const input of ['120 g pâtes', '120 g spaghettis', '250 g spaghettis', 'riz', '140 g thon', '100 g poulet'])
  assert.equal(global.ENERGIE_CNF_SEARCH.find(input), null, `${locale}: ${input}`);
}
assert.ok(cnf.isCandidateAllowed('vinaigrette bacon tomates', 'Vinaigrette, bacon et tomates'));
assert.ok(cnf.find('vinaigrette bacon tomates'));
assert.ok(cnf.isCandidateAllowed('salade de thon', 'Thon, salade'));
assert.equal(cnf.isCandidateAllowed('tomat', 'Vinaigrette, bacon et tomates'), false);
assert.equal(cnf.find('tomat'), null); // Une faute ne doit pas déclencher une déduction.
assert.equal(cnf.isCandidateAllowed('poulet cru', 'Poulet, rôti'), false);

// Vérifier le parcours applicatif : ni le catalogue historique, ni un
// raccourci FCÉN déjà chargé ne peuvent contourner le garde-fou.
const source = fs.readFileSync(require.resolve('../app.js'), 'utf8');
const start = source.indexOf('  function foodMatchForSegment(');
const end = source.indexOf('  function mealQuantityNumber(', start);
const context = {
 window: { ENERGIE_CNF_SEARCH: cnf },
 normalizeFoodText: s => cnf.stripQuantity(s),
 comparableFoodText: s => cnf.stripQuantity(s),
 FOOD_CANDIDATES: [{compareKey:'tomates',food:{nutritionSource:'cnf',cnfNameFr:'Vinaigrette, bacon et tomates',keys:['tomates']}}],
 checkedCatalogFood: x => x,
 legacyFoodWithAlias: () => null,
};
vm.createContext(context);
const quantityStart = source.indexOf('  function mealQuantityNumber(');
const quantityEnd = source.indexOf('  function mealNutritionRecognition(', quantityStart);
vm.runInContext(source.slice(quantityStart, quantityEnd), context);
vm.runInContext(source.slice(start,end), context);
assert.ok(!/vinaigrette/i.test(context.foodMatchForSegment('250 g tomates').cnfNameFr));
assert.equal(context.foodMatchForSegment('120 g pâtes'), null);
// Reproduction exacte du signalement : la fiche historique ne doit jamais
// afficher ses 430 kcal pour deux poids différents.
context.FOOD_CANDIDATES = [{compareKey:'spaghettis',food:{keys:['spaghetti'],calories:430,portion:'1 assiette'}}];
for (const grams of [120, 250]) {
 assert.equal(context.foodMatchForSegment(`${grams} g spaghettis`), null);
 const input = `${grams} g spaghettis cuits`;
 const food = context.foodMatchForSegment(input);
 assert.ok(food?.cnfCatalogMatch, input);
 const quantity = context.nutritionScaleForSegment(input, food);
 assert.equal(quantity.quantityUsed, true);
 assert.equal(quantity.scale, grams / 100);
 assert.equal(Math.round(food.calories * quantity.scale * 10) / 10, grams === 120 ? 189.6 : 395);
}
context.FOOD_CANDIDATES = [{compareKey:'alimenttest',food:{keys:['alimenttest'],calories:430,portion:'1 assiette'}}];
assert.equal(context.foodMatchForSegment('250 g alimenttest'), null);
assert.ok(cnf.find('120 g spaghettis secs'));
assert.equal(cnf.isCandidateAllowed('spaghetti cuit', 'Spaghetti avec boulettes de viande, cuit'), false);
const estimateStart = source.indexOf('  function estimateNutritionFromText(');
const estimateEnd = source.indexOf('    const segments = splitMealIngredients(text);', estimateStart);
vm.runInContext(source.slice(estimateStart, estimateEnd) + ' return 123; }', context);
context.mealCompositionAnalysis = () => ({});
context.mealNutritionRecognition = () => ({unrecognized:['120 g pâtes']});
assert.equal(context.estimateNutritionFromText('tomates\n120 g pâtes'), null);
console.log('food matching safety: catalogues, locales, attaques et replis OK');
