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
   assert.ok(cnf.isCandidateAllowed(input, candidate.nameFr, {allowPreparationChoice:true}), candidate.nameFr);
 }
}
for (const locale of ['fr-CA', 'fr-FR']) {
 global.ENERGIE_LOCALE = locale;
 for (const input of ['120 g pâtes', '120 g spaghettis', '250 g spaghettis', 'riz', '140 g thon'])
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
 MEAL_DESCRIPTION_MAX_LENGTH: 1000,
 window: { ENERGIE_CNF_SEARCH: cnf },
 normalizeFoodText: s => cnf.stripQuantity(s),
 comparableFoodText: s => cnf.stripQuantity(s),
 FOOD_CANDIDATES: [{compareKey:'tomates',food:{nutritionSource:'cnf',cnfNameFr:'Vinaigrette, bacon et tomates',keys:['tomates']}}],
 checkedCatalogFood: x => x,
 legacyFoodWithAlias: () => null,
};
vm.createContext(context);
const normalizeStart = source.indexOf('  function normalizeFoodText(');
const normalizeEnd = source.indexOf('  const FOOD_CANDIDATES =', normalizeStart);
vm.runInContext(source.slice(normalizeStart, normalizeEnd), context);
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
// Les unités comptées doivent utiliser une portion unitaire documentée,
// pas 100 ml de tranches ou une référence de 100 g.
for (const locale of ['fr-CA', 'fr-FR']) {
 global.ENERGIE_LOCALE = locale;
 context.window.ENERGIE_CNF_SEARCH = global.ENERGIE_CNF_SEARCH;
 let previous = null;
 for (const count of [1, 2, 10, 20, 21, 50]) {
  const input = `${count} ${count === 1 ? "pomme" : "pommes"}`;
  const food = context.foodMatchForSegment(input);
  assert.ok(food, `${locale}: ${input}`);
  assert.match(food.portion, /^1 fruit moyen/);
  assert.equal(food.gramsPerPortion, 182);
  const quantity = context.nutritionScaleForSegment(input, food);
  assert.equal(quantity.quantityUsed, true);
  assert.equal(quantity.scale, count);
  const calories = food.calories * quantity.scale;
  assert.ok(Math.abs(calories - 94.64 * count) < 0.00001);
  if (previous != null) assert.ok(calories > previous);
  previous = calories;
 }
}
const slicedApple = {keys:['pomme'],calories:24,portion:'100 ml tranches',gramsPerPortion:46};
assert.equal(context.nutritionScaleForSegment('1 pomme', slicedApple).quantityUsed, false);
assert.equal(context.nutritionScaleForSegment('50 pommes', slicedApple).quantityUsed, false);
const threeDates = {keys:['datte'],calories:133,portion:'3 fruits',gramsPerPortion:50};
assert.equal(context.nutritionScaleForSegment('6 dattes', threeDates).scale, 2);
assert.equal(context.nutritionScaleForSegment('5 g alimenttest', {portion:'1 assiette'}).quantityUsed, false);
assert.equal(cnf.find('1 banane'), null); // Pas de poids unitaire inventé.
const estimateStart = source.indexOf('  function estimateNutritionFromText(');
const estimateEnd = source.indexOf('    const segments = splitMealIngredients(text);', estimateStart);
vm.runInContext(source.slice(estimateStart, estimateEnd) + ' return 123; }', context);
context.mealCompositionAnalysis = () => ({});
context.mealNutritionRecognition = () => ({unrecognized:['120 g pâtes']});
assert.equal(context.estimateNutritionFromText('tomates\n120 g pâtes'), null);
console.log('food matching safety: catalogues, locales, attaques et replis OK');

for (const locale of ['fr-CA', 'fr-FR']) {
 global.ENERGIE_LOCALE = locale;
 const choices = global.ENERGIE_CNF_SEARCH.search('spaghettis', 12);
 assert.ok(choices.some(row => /\bcuit\b/.test(row.nameFr)), locale);
 assert.ok(choices.some(row => /\bsec\b/.test(row.nameFr)), locale);
 assert.ok(choices.every(row => !/sauce|viande|bacon|courge/i.test(row.nameFr)));
 assert.equal(global.ENERGIE_CNF_SEARCH.find('120 g spaghettis'), null);
}
assert.ok(cnf.isCandidateAllowed('spaghettis', 'Pâtes (spaghetti, macaroni), enrichi, sec', {allowPreparationChoice:true}));
assert.equal(cnf.isCandidateAllowed('spaghettis', 'Spaghetti avec boulettes de viande, cuit', {allowPreparationChoice:true}), false);

for (const locale of ['fr-CA', 'fr-FR']) {
 global.ENERGIE_LOCALE = locale;
 const tuna = global.ENERGIE_CNF_SEARCH.search('thon', 10);
 assert.ok(tuna.some(row => /cru/.test(row.nameFr)));
 assert.ok(tuna.some(row => /cuit/.test(row.nameFr)));
 assert.ok(tuna.some(row => /conserve/.test(row.nameFr)));
 assert.ok(tuna.some(row => /dans l'eau/.test(row.nameFr)));
 assert.ok(!tuna.some(row => /salade|sandwich/i.test(row.nameFr)));
 assert.ok(global.ENERGIE_CNF_SEARCH.search('thon cuit', 10).length);
 assert.equal(global.ENERGIE_CNF_SEARCH.find('1 skyr coco'), null);
 assert.equal(global.ENERGIE_CNF_SEARCH.search('skyr').length, 0);
}

// Régressions : les descripteurs d'un aliment simple ne sont pas des recettes.
for (const locale of ['fr-CA', 'fr-FR']) {
 global.ENERGIE_LOCALE = locale;
 const api = global.ENERGIE_CNF_SEARCH;
 for (const query of ['poulet', 'filet de poulet']) {
  const choices = api.search(query, 12);
  assert.ok(choices.some(row => /cru/.test(row.nameFr)), `${locale}: ${query} cru`);
  assert.ok(choices.some(row => /rôti|cuit/.test(row.nameFr)), `${locale}: ${query} cuit`);
  assert.ok(choices.every(row => !/soupe|nouille|sauce|pâte à frire/.test(row.nameFr)));
 }
 const cottage = api.search('cottage', 12);
 assert.ok(cottage.some(row => /2%/.test(row.nameFr)));
 assert.ok(cottage.some(row => /1%/.test(row.nameFr)));
 assert.ok(cottage.every(row => !/avec fruits|avec légumes|pomme de terre/.test(row.nameFr)));
 assert.ok(api.find('filet de poulet'));
 assert.ok(/rôti|cuit/.test(api.find('filet de poulet').cnfNameFr));
 assert.match(api.find('150 g poulet').cnfNameFr, /rôti|cuit/);
 assert.ok(api.find('150 g filet de poulet cuit'), locale);
 assert.ok(api.find('150 g filet de poulet cru'), locale);
}
assert.equal(cnf.isCandidateAllowed('cottage', 'Fromage cottage avec fruits', {allowPreparationChoice:true}), false);
assert.equal(cnf.isCandidateAllowed('poulet', 'Poulet, soupe avec nouilles', {allowPreparationChoice:true}), false);

context.window.ENERGIE_CNF_SEARCH = cnf;
for (const grams of [120, 250]) {
 const input = `${grams} g filet de poulet`;
 const food = context.foodMatchForSegment(input);
 assert.ok(food, input);
 assert.match(food.cnfNameFr, /rôti|cuit/);
 assert.equal(context.nutritionScaleForSegment(input, food).scale, grams / 100);
}
assert.match(context.foodMatchForSegment('150 g filet de poulet cru').cnfNameFr, /cru/);

for (const locale of ['fr-CA', 'fr-FR']) {
 global.ENERGIE_LOCALE = locale;
 const api = global.ENERGIE_CNF_SEARCH;
 for (const meat of ['poulet','boeuf','porc','dinde','veau','agneau']) {
  for (const grams of [120,250]) {
   const food = api.find(`${grams} g ${meat}`);
   assert.ok(food, `${locale}: ${meat}`);
   assert.ok(/cuit|rôti|grillé/.test(food.cnfNameFr), food.cnfNameFr);
   assert.ok(!/cru/.test(food.cnfNameFr));
   context.window.ENERGIE_CNF_SEARCH = api;
   const scaled = context.nutritionScaleForSegment(`${grams} g ${meat}`, food);
   const hundred = api.find(`100 g ${meat}`);
   const expected = hundred.calories * context.nutritionScaleForSegment(`100 g ${meat}`, hundred).scale * grams / 100;
   assert.ok(Math.abs(food.calories * scaled.scale - expected)<0.01);
  }
  for (const state of ['cru','tartare']) {
   const food = api.find(`150 g ${meat} ${state}`);
   assert.ok(food, `${locale}: ${meat} ${state}`);
   assert.match(food.cnfNameFr, /cru/);
  }
 }
}
assert.equal(cnf.isCandidateAllowed('boeuf', 'Boeuf cru'), false);
assert.equal(cnf.isCandidateAllowed('porc', 'Porc cru'), false);
assert.equal(cnf.isCandidateAllowed('boeuf', 'Boeuf en sauce aux légumes'), false);
assert.equal(cnf.isCandidateAllowed('porc', 'Porc au riz'), false);
assert.equal(cnf.isCandidateAllowed('boeuf cru', 'Boeuf cuit'), false);
assert.equal(cnf.meatPreparationText('tomates'), 'tomates');
assert.equal(cnf.meatPreparationText('pâtes'), 'pâtes');
