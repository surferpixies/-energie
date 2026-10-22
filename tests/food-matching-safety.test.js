const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
require('../cnf-catalog.js');
const cnf = require('../cnf-search.js');
require('../ciqual-data.js');
require('../ciqual-search.js');
const ciqual = global.ENERGIE_CIQUAL_SEARCH;

// La saisie guidée doit afficher les variantes du catalogue, même lorsque
// la sélection automatique doit demander une clarification.
for (const term of ["yogourt", "confiture", "yogurt", "jam"]) {
 const matches = cnf.search(term, 30);
 assert.ok(matches.length > 0, "Recherche guidée vide pour : " + term);
}
// A fraction of a cup is a measured volume, not one or two natural portions.
{
 const source = require("node:fs").readFileSync(require.resolve("../app.js"), "utf8");
 const start = source.indexOf("  function mealQuantityNumber(");
 const end = source.indexOf("  function nutritionScaleForSegment(", start);
 const ctx = { normalizeFoodText: value => String(value).toLowerCase().replace(/[^a-z0-9]+/g," ").trim() };
 require("node:vm").createContext(ctx);
 require("node:vm").runInContext(source.slice(start,end), ctx);
 const q = ctx.mealQuantityFromText("1/2 tasse yogourt grec");
 assert.equal(q?.value, 0.5);
 assert.equal(q?.unit, "cup");
}
assert.equal(cnf.isCandidateAllowed("beurre d'arachide", "Beurre, sans sel"),false);
assert.equal(cnf.isCandidateAllowed("peanut butter", "Butter, unsalted"),false);
assert.ok(cnf.search("beurre arachide",10).every(x=>/arachide|peanut/i.test(x.nameFr+" "+x.nameEn)));
for(const [input,wrong] of [
 ["beurre d'amandes","Beurre, non salé"],
 ["beurre d'amandes","Beurre d'arachide, crémeux"],
 ["beurre de noisettes","Beurre d'amandes"],
 ["beurre de cajou","Beurre de noisettes"],
 ["beurre de tournesol","Beurre d'arachide"],
 ["almond butter","Peanut butter, smooth"],
 ["hazelnut butter","Almond butter"],
]) assert.equal(cnf.isCandidateAllowed(input,wrong),false,input+" -> "+wrong);
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
  // Recherche guidée : les variantes restent visibles, même si la saisie
  // automatique refuserait de les sélectionner sans clarification.
  assert.ok(api.search(input, 30).length > 0, "Guided choices: " + input);
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
vm.runInContext(source.slice(source.indexOf('  function englishWeightedFoodEquivalent('),start),context);
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
// Un terme anglais doit reconnaître le même fruit, même quand l'interface est FR.
context.FOOD_CANDIDATES = [{compareKey:'apple',food:{keys:['pomme','apple'],calories:95,portion:'1 moyenne'}}];
for (const input of ['1 apple', '2 apples']) {
 const food = context.foodMatchForSegment(input);
 assert.ok(food, input);
 assert.equal(context.nutritionScaleForSegment(input, food).quantityUsed, true, input);
}
assert.equal(context.foodMatchForSegment('2 apple pies'), null);
const slicedApple = {keys:['pomme'],calories:24,portion:'100 ml tranches',gramsPerPortion:46};
assert.equal(context.nutritionScaleForSegment('1 pomme', slicedApple).quantityUsed, false);
assert.equal(context.nutritionScaleForSegment('50 pommes', slicedApple).quantityUsed, false);
const threeDates = {keys:['datte'],calories:133,portion:'3 fruits',gramsPerPortion:50};
assert.equal(context.nutritionScaleForSegment('6 dattes', threeDates).scale, 2);
assert.equal(context.nutritionScaleForSegment('5 g alimenttest', {portion:'1 assiette'}).quantityUsed, false);
context.window.ENERGIE_CNF_SEARCH = cnf;
for (const [input, count] of [
 ['1 banane', 1], ['2 bananes', 2], ['1 pomme', 1], ['2 pêches', 2],
 ['3 kiwis', 3], ['1 carotte', 1], ['3 carottes', 3],
]) {
 const food = context.foodMatchForSegment(input);
 assert.ok(food, input);
 assert.match(food.portion, /moyen|medium|petit|small|fruit/i, input);
 const quantity = context.nutritionScaleForSegment(input, food);
 assert.equal(quantity.quantityUsed, true, input);
 assert.equal(quantity.scale, count, input);
}
const estimateStart = source.indexOf('  function estimateNutritionFromText(');
const estimateEnd = source.indexOf('    const segments = splitMealIngredients(text);', estimateStart);
vm.runInContext(source.slice(estimateStart, estimateEnd) + ' return 123; }', context);
context.mealCompositionAnalysis = () => ({});
context.mealNutritionRecognition = () => ({unrecognized:['120 g pâtes']});
assert.equal(context.estimateNutritionFromText('tomates\n120 g pâtes'), null);
console.log('food matching safety: catalogues, locales, attaques et replis OK');

for (const locale of ['fr-CA', 'fr-FR']) {
 global.ENERGIE_LOCALE = locale;
 const choices = global.ENERGIE_CNF_SEARCH.search('spaghettis', Infinity);
 assert.ok(choices.length > 0, locale);
 // Guided search can show composite variants. The automatic match must
 // still reject an unspecified preparation or unrelated recipe.
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

// Les exemples affichés dans le guide doivent utiliser des références réelles.
for (const locale of ['fr-CA', 'fr-FR']) {
 global.ENERGIE_LOCALE = locale;
 context.window.ENERGIE_CNF_SEARCH = global.ENERGIE_CNF_SEARCH;
 for (const example of ['150 g poulet', '100 g carottes', '2 pommes', '120 g spaghettis cuits']) {
  const food = context.foodMatchForSegment(example);
  assert.ok(food, `${locale}: exemple du guide ${example}`);
  assert.equal(context.nutritionScaleForSegment(example, food).quantityUsed, true, example);
  assert.ok(!/Pâte de fruits/i.test(food.cnfNameFr));
 }
 assert.ok(!/Pâte de fruits/i.test(global.ENERGIE_CNF_SEARCH.find('120 g pâtes cuites')?.cnfNameFr || ''));
}
assert.equal(cnf.isCandidateAllowed('pâtes cuites', 'Pâte de fruits'), false);

// Produit emballé : valeurs d'étiquette et portions comptées, sans substitution.
require('../packaged-foods.js');
const productApi = global.ENERGIE_CNF_SEARCH;
const productId = 'PRODUCT:st-hubert-chicken-strips-600g';
context.window.ENERGIE_CNF_SEARCH = productApi;
context.FOOD_CANDIDATES = [];
context.FOOD_NUTRIENT_OVERRIDES = {};
vm.runInContext(source.slice(source.indexOf('  function checkedCatalogFood('),source.indexOf('  function foodMatchForSegment(')),context);
vm.runInContext(source.slice(source.indexOf('  function foodNutrients('),source.indexOf('  function normalizeFoodText(')),context);
vm.runInContext(source.slice(source.indexOf('  function normalNutrition('),source.indexOf('  function normalizeFeelingScores(')),context);
vm.runInContext(source.slice(source.indexOf('  function hasUnspecifiedPackagedSauce('),source.indexOf('  function mealNutritionRecognition(')),context);
vm.runInContext(source.slice(source.indexOf('  function mealNutritionRecognition('),source.indexOf('  function mealCompositionAnalysis(')),context);
context.mealCompositionAnalysis = () => ({});
context.photoCupPortionAdjustment = (_segment,_food,quantity) => quantity;
vm.runInContext(source.slice(source.indexOf('  function estimateNutritionFromText('),source.indexOf('  function mergeNutrition(')),context);
vm.runInContext(source.slice(source.indexOf('  function guidedCnfNutrition('),source.indexOf('  function currentGuidedCnfNutrition(')),context);
for(const locale of ['fr-CA','fr-FR']) {
 global.ENERGIE_LOCALE=locale;
 for(const [input,expected] of [
  ['2 lanières de poulet panées St-Hubert',160],
  ['4 filets de poulet panés St-Hubert',320],
  ['8 filets de poulet St-Hubert',640],
  ['140 g lanières de poulet St-Hubert',320],
 ]) {
  const n=context.estimateNutritionFromText(input);
  assert.equal(n?.calories,expected,`${locale}: ${input}`);
  assert.equal(n.source,'product-label');
  assert.equal(n.trace.items[0].source,'product-label');
 }
 const meal=context.estimateNutritionFromText('4 filets de poulet panés St-Hubert\nlaitue\nconcombres');
 assert.ok(meal.calories>320);
 assert.equal(meal.trace.items.length,3);
 assert.equal(meal.trace.items[0].calories,320);
 assert.equal(meal.source,'mixed');
 assert.equal(context.estimateNutritionFromText('4 filets de poulet\nlaitue\nconcombres'),null);
 assert.equal(context.foodMatchForSegment('4 croquettes de poulet St-Hubert'),null);
 assert.equal(context.foodMatchForSegment('4 filets de poulet St-Hubert avec sauce'),null);
 assert.ok(productApi.search('St-Hubert').some(row=>row.id===productId));
 assert.equal(productApi.getById(productId).portions[0].grams,35);
 const saved=JSON.parse(JSON.stringify([{cnfFoodId:productId,grams:140,nameFr:productApi.getById(productId).nameFr,quantity:4,unitLabel:'1 lanière',gramsPerUnit:35}]));
 const guided=context.guidedCnfNutrition(saved);
 assert.equal(guided.calories,320);
 assert.equal(guided.source,'product-label');
 assert.equal(guided.trace.items[0].source,'product-label');
 assert.equal(guided.fiber,0);
}
console.log('St-Hubert : étiquette, comptes, grammes, repas complet, guidé et relecture OK');

// Le guide doit donner un exemple qui fonctionne dans les deux référentiels.
for (const locale of ['fr-CA', 'fr-FR']) {
 global.ENERGIE_LOCALE = locale;
 const full = context.estimateNutritionFromText('1 tasse cottage');
 assert.ok(full, locale);
 for (const [quantity, ratio] of [['1/2', .5], ['1/4', .25]]) {
  const input = `${quantity} tasse cottage`;
  const portion = context.estimateNutritionFromText(input);
  assert.ok(portion, input);
  assert.ok(Math.abs(portion.calories - full.calories * ratio) < 1, input);
 }
 const meal = context.estimateNutritionFromText('laitue\nconcombres\n1/2 tasse cottage');
 assert.ok(meal, locale);
 assert.equal(meal.trace.items.length, 3);
 assert.match(productApi.find('1 tasse cottage').cnfNameFr, /2%/);
}


// Non-régression des repas composés : vérifier le calcul de production, pas
// une addition manuelle de calories issues d'une autre base.
for (const locale of ['fr-CA','fr-FR']) {
 global.ENERGIE_LOCALE = locale;
 for (const ingredients of [
  ['150 g poulet', '100 g carottes', '120 g spaghettis cuits'],
  ['100 g tomates', '100 g concombres', '150 g filet de poulet cuit'],
  ['100 g carottes', '150 g poulet', '120 g spaghettis cuits'],
 ]) {
  const singles=ingredients.map(s=>context.estimateNutritionFromText(s));
  assert.ok(singles.every(Boolean), locale+': ingrédient individuel manquant '+ingredients.join(' / '));
  const meal=context.estimateNutritionFromText(ingredients.join('\n'));
  assert.ok(meal,locale+': repas complet non calculé '+ingredients.join(' / '));
  assert.equal(meal.trace?.items?.length,ingredients.length,locale+': ingrédients perdus ou dupliqués');
  const expected=singles.reduce((sum,n)=>sum+Number(n.calories),0);
  assert.ok(Math.abs(meal.calories-expected)<1.1,locale+': total repas différent de la somme des ingrédients');
 }
}
console.log('Repas multi-ingrédients : reconnaissance et conservation du total OK');


// Saumon cuit : une référence officielle cuite, pas fumée/crue/en sauce.
for(const locale of ['fr-CA','fr-FR']) {
 global.ENERGIE_LOCALE=locale;
 const salmon=cnf.find('150 g saumon cuit');
 assert.equal(salmon?.cnfFoodId,'3183',locale+': saumon cuit');
 assert.match(salmon.cnfNameFr,/saumon.*four ou grillé/);
 const item=context.estimateNutritionFromText('150 g saumon cuit');
 assert.ok(item?.calories>0,locale+': calories saumon');
 assert.equal(item.trace?.items?.length,1);
 assert.equal(cnf.find('150 g saumon fumé')?.cnfFoodId==='3183',false);
 assert.equal(cnf.find('150 g saumon cru')?.cnfFoodId==='3183',false);
}
// Régression morue : référence cuite vérifiée et variétés distinctes.
for(const locale of ['fr-CA','fr-FR']) {
 global.ENERGIE_LOCALE=locale;
 const cod=cnf.find('150 g morue cuite');
 assert.equal(cod?.cnfFoodId,'3195',locale+': morue cuite');
 assert.ok(context.estimateNutritionFromText('150 g morue cuite')?.calories>0);
 assert.notEqual(cnf.find('150 g morue crue')?.cnfFoodId,'3195');
}
// Matrice reproductible de repas composés. Les aliments qui ne sont pas
// calculables sont rapportés, jamais transformés silencieusement en zéro.
// Ne teste pas encore l'écriture ni la relecture Supabase.
const matrixFs = require('node:fs');
const matrixPath = require('node:path');
const matrixPools = [
 ['100 g carottes','150 g poulet','120 g spaghettis cuits','100 g tomates','100 g concombres'],
 ['100 g brocoli','150 g filet de poulet cuit','120 g spaghettis cuits','100 g carottes','100 g tomates'],
 ['100 g pommes','100 g carottes','100 g tomates','100 g concombres','100 g brocoli'],
 ['1 banane','100 g fromage cottage','100 g fraises','100 g amandes','1 pomme'],
 ['150 g saumon cuit','100 g brocoli','100 g pommes de terre','100 g carottes','100 g tomates'],
 ['150 g boeuf cuit','100 g riz cuit','100 g brocoli','100 g carottes','100 g concombres'],
 ['150 g morue cuite','100 g brocoli','100 g pommes de terre','100 g carottes','100 g tomates'],
 ['150 g truite cuite','100 g riz cuit','100 g brocoli','100 g carottes','100 g tomates'],
 ['150 g thon cuit','100 g pommes de terre','100 g brocoli','100 g carottes','100 g tomates'],
 ['150 g crevettes cuites','100 g riz cuit','100 g brocoli','100 g carottes','100 g tomates'],
 ['150 g porc cuit','100 g riz cuit','100 g brocoli','100 g carottes','100 g tomates'],
 ['150 g dinde cuite','100 g riz cuit','100 g brocoli','100 g carottes','100 g tomates'],
];
const matrixFailures=[];
const matrixSummary={tested:0,complete:0,notCalculable:0,missingTrace:0,incorrectTotal:0,unrecognizedIngredients:0};
const tolerance=1.1;
for(const locale of ['fr-CA','fr-FR']){
 global.ENERGIE_LOCALE=locale;
 for(const pool of matrixPools){
  for(let mask=1;mask<(1<<pool.length);mask++){
   const ingredients=pool.filter((_,i)=>(mask&(1<<i))!==0);
   if(ingredients.length<2)continue;
   for(const separator of ['\n',' + ']){
    matrixSummary.tested++;
    const individually=ingredients.map(input=>context.estimateNutritionFromText(input));
    const result=context.estimateNutritionFromText(ingredients.join(separator));
    const caseInfo={locale,ingredients,separator:separator==='\n'?'newline':'plus'};
    if(individually.some(x=>!x)||!result){
      matrixSummary.notCalculable++;
      matrixSummary.unrecognizedIngredients+=ingredients.filter((_,i)=>!individually[i]).length;
      matrixFailures.push({...caseInfo,reason:'not-calculable',individualFailures:ingredients.filter((_,i)=>!individually[i]),unrecognized:context.mealNutritionRecognition(ingredients.join(separator)).unrecognized});
      continue;
    }
    const traceCount=result.trace?.items?.length;
    if(traceCount!==ingredients.length){
      matrixSummary.missingTrace++;
      matrixFailures.push({...caseInfo,reason:'trace-count',actual:traceCount,recognized:context.mealNutritionRecognition(ingredients.join(separator)).recognized,traceItems:result.trace?.items?.map(x=>({name:x.name||x.segment||x.cnfNameFr,calories:x.calories}))});
      continue;
    }
    const expected=individually.reduce((total,x)=>total+Number(x.calories),0);
    if(!Number.isFinite(expected)||!Number.isFinite(Number(result.calories))||Math.abs(result.calories-expected)>tolerance){
      matrixSummary.incorrectTotal++;
      matrixFailures.push({...caseInfo,reason:'wrong-total',expected,actual:result.calories});
      continue;
    }
    matrixSummary.complete++;
   }
  }
 }
}
// La matrice ne valide plus silencieusement les échecs exploratoires.
if(matrixFailures.length) process.exitCode=1;
const matrixReport={date:new Date().toISOString(),scope:'Calcul de production en memoire, sans sauvegarde',
 summary:matrixSummary,failures:matrixFailures};
if(process.env.NUTRITION_MEAL_REPORT){
 const target=process.env.NUTRITION_MEAL_REPORT;
 matrixFs.mkdirSync(matrixPath.dirname(target),{recursive:true});
 matrixFs.writeFileSync(target,JSON.stringify(matrixReport,null,2));
}
console.log('Matrice repas : '+JSON.stringify({...matrixSummary,sampleFailures:matrixFailures.slice(0,10)}));
// Le rapport est exploratoire pour les nouveaux repas : les échecs restent
// visibles pour triage, tandis que les scénarios P0 ci-dessus restent bloquants.

// Restaurer le catalogue local après les scénarios de sécurité qui ont
// volontairement vidé ou remplacé FOOD_CANDIDATES.
const benchmarkWindow={};
vm.runInNewContext(fs.readFileSync(require.resolve('../foods.js'),'utf8'),{window:benchmarkWindow});
const benchmarkFoods=benchmarkWindow.ENERGIE_FOODS||[];
context.FOOD_CANDIDATES=benchmarkFoods.flatMap(food=>(food.keys||[]).map(key=>({
 food,key:context.normalizeFoodText(key),compareKey:context.comparableFoodText(key)
})).filter(row=>row.key));
context.legacyFoodWithAlias=(...aliases)=>benchmarkFoods.find(food=>(food.keys||[]).some(key=>aliases.includes(key)))||null;
console.log('BENCHMARK_CATALOG_RESTORED',context.FOOD_CANDIDATES.length);
// Diagnostic non bloquant des cas P0 avant de définir les attentes exactes.
const p0Cases=[
 "1 bagel",
 "30 g fromage à la crème",
 "1 banane",
 "1 c. à soupe beurre d'arachide",
 "1 bagel + 30 g fromage à la crème + 1 banane + 1 c. à soupe beurre d'arachide"
];
for(const locale of ['fr-CA','fr-FR']){
 global.ENERGIE_LOCALE=locale;
 console.log('P0_NUTRITION_DIAGNOSTIC',JSON.stringify({locale,results:p0Cases.map(input=>{
  const n=context.estimateNutritionFromText(input);
  return {input,calories:n?.calories??null,source:n?.source??null,recognized:n?.trace?.items?.length??0,unrecognized:context.mealNutritionRecognition(input).unrecognized};
 })}));
}


// Évaluation distincte : formulations usuelles et comportements attendus.
// Cette mesure ne prétend PAS être un taux représentatif de tous les usagers.
const evaluationCases=[
 {family:'fruit',input:'1 banane',expect:'recognized'},
 {family:'fruit',input:'1 pomme',expect:'recognized'},
 {family:'fruit',input:'100 g fraises',expect:'recognized'},
 {family:'fruit',input:'100 g ananas',expect:'recognized'},
 {family:'legume',input:'100 g carottes',expect:'recognized'},
 {family:'legume',input:'100 g tomates',expect:'recognized'},
 {family:'legume',input:'100 g concombres',expect:'recognized'},
 {family:'legume',input:'100 g brocoli',expect:'recognized'},
 {family:'viande',input:'150 g poulet',expect:'recognized'},
 {family:'viande',input:'150 g filet de poulet cuit',expect:'recognized'},
 {family:'viande',input:'150 g boeuf cuit',expect:'recognized'},
 {family:'viande',input:'150 g porc cuit',expect:'recognized'},
 {family:'viande',input:'150 g dinde cuite',expect:'recognized'},
 {family:'poisson',input:'150 g saumon cuit',expect:'recognized'},
 {family:'poisson',input:'150 g morue cuite',expect:'recognized'},
 {family:'poisson',input:'150 g truite cuite',expect:'recognized'},
 {family:'poisson',input:'150 g thon cuit',expect:'recognized'},
 {family:'poisson',input:'150 g crevettes cuites',expect:'recognized'},
 {family:'feculent',input:'120 g spaghettis cuits',expect:'recognized'},
 {family:'feculent',input:'100 g riz cuit',expect:'recognized'},
 {family:'feculent',input:'100 g pommes de terre',expect:'recognized'},
 {family:'laitier',input:'100 g fromage cottage',expect:'recognized'},
 {family:'laitier',input:'30 g fromage à la crème',expect:'recognized'},
 {family:'noix',input:'100 g amandes',expect:'recognized'},
 {family:'noix',input:'1 c. à soupe beurre d\'arachide',expect:'recognized'},
 {family:'boulangerie',input:'1 bagel',expect:'recognized'},
 {family:'ambigu',input:'120 g spaghettis',expect:'clarification'},
 {family:'ambigu',input:'140 g thon',expect:'clarification'},
 {family:'securite',input:'2 apple pies',expect:'reject'},
 {family:'securite',input:'4 filets de poulet St-Hubert avec sauce',expect:'reject'},
];
const englishEvaluationCases=[
 {family:'fruit',input:'1 banana',expect:'recognized'},
 {family:'fruit',input:'1 apple',expect:'recognized'},
 {family:'fruit',input:'100 g strawberries',expect:'recognized'},
 {family:'fruit',input:'100 g pineapple',expect:'recognized'},
 {family:'vegetable',input:'100 g carrots',expect:'recognized'},
 {family:'vegetable',input:'100 g tomatoes',expect:'recognized'},
 {family:'vegetable',input:'100 g cucumber',expect:'recognized'},
 {family:'vegetable',input:'100 g broccoli',expect:'recognized'},
 {family:'meat',input:'150 g cooked chicken',expect:'recognized'},
 {family:'meat',input:'150 g cooked beef',expect:'recognized'},
 {family:'meat',input:'150 g cooked pork',expect:'recognized'},
 {family:'meat',input:'150 g cooked turkey',expect:'recognized'},
 {family:'fish',input:'150 g cooked salmon',expect:'recognized'},
 {family:'fish',input:'150 g cooked cod',expect:'recognized'},
 {family:'fish',input:'150 g cooked trout',expect:'recognized'},
 {family:'fish',input:'150 g cooked tuna',expect:'recognized'},
 {family:'fish',input:'150 g cooked shrimp',expect:'recognized'},
 {family:'starch',input:'120 g cooked spaghetti',expect:'recognized'},
 {family:'starch',input:'100 g cooked rice',expect:'recognized'},
 {family:'starch',input:'100 g potatoes',expect:'recognized'},
 {family:'dairy',input:'100 g cottage cheese',expect:'recognized'},
 {family:'dairy',input:'30 g cream cheese',expect:'recognized'},
 {family:'nuts',input:'100 g almonds',expect:'recognized'},
 {family:'nuts',input:'1 tbsp peanut butter',expect:'recognized'},
 {family:'bakery',input:'1 bagel',expect:'recognized'},
 {family:'ambiguous',input:'120 g spaghetti',expect:'clarification'},
 {family:'ambiguous',input:'140 g tuna',expect:'clarification'},
 {family:'safety',input:'2 apple pies',expect:'reject'},
];
// Cas quotidiens additionnels : séparer les attentes des essais exploratoires.
const everydayCases={
 fr:[
  '1 pomme','2 bananes','100 g carottes','200 g carottes','150 g brocoli',
  '100 g tomates','200 g concombres','200 g spaghettis cuits',
  '150 g riz cuit','150 g poulet','150 g saumon cuit',
  '100 g pommes de terre','100 g fraises','100 g fromage cottage',
  '2 oeufs','1 bagel','30 g fromage à la crème'
 ],
 en:[
  '1 apple','2 bananas','100 g carrots','200 g carrots','150 g broccoli',
  '100 g tomatoes','200 g cucumber','200 g cooked spaghetti',
  '150 g cooked rice','150 g cooked chicken','150 g cooked salmon',
  '100 g potatoes','100 g strawberries','100 g cottage cheese',
  '2 eggs','1 bagel','30 g cream cheese'
 ]
};
const everydayReport={rows:[],summary:{}};
for(const locale of ['fr-CA','fr-FR','en-CA','en-US']){
 global.ENERGIE_LOCALE=locale;
 const entries=everydayCases[locale.startsWith('en')?'en':'fr'];
 const rows=entries.map(input=>{
  const n=context.estimateNutritionFromText(input);
  return {locale,input,recognized:Number.isFinite(n?.calories)&&n.calories>0,
    calories:n?.calories??null,traceCount:n?.trace?.items?.length??0};
 });
 everydayReport.rows.push(...rows);
 everydayReport.summary[locale]={tested:rows.length,recognized:rows.filter(x=>x.recognized).length,
  failed:rows.filter(x=>!x.recognized).map(x=>x.input)};
}
console.log('EVERYDAY_INPUT_AUDIT',JSON.stringify(everydayReport.summary));
assert.ok(everydayReport.rows.every(row=>row.recognized),'Un aliment du quotidien non reconnu : '+everydayReport.rows.filter(row=>!row.recognized).map(row=>row.locale+' '+row.input).join('; '));
// Vérification exploratoire des unités anglaises : pas de conversion présumée.
const englishUnits=['4 oz cooked chicken','6 oz cooked salmon','1 tbsp peanut butter','2 tbsp peanut butter','1 cup cooked rice','1 cup carrots','200 g cooked spaghetti'];
const unitAudit=[];
for(const locale of ['en-CA','en-US']){
 global.ENERGIE_LOCALE=locale;
 for(const input of englishUnits){
  const result=context.estimateNutritionFromText(input);
  unitAudit.push({locale,input,calories:result?.calories??null,
    source:result?.source??null,quantity:result?.trace?.items?.[0]?.quantity??null});
 }
}
console.log('RICE_CUP_DIAGNOSTIC',JSON.stringify({rice:cnf.find('200 g riz cuit'),cup:cnf.search('riz cuit',3).map(x=>({id:x.id,portions:x.portions?.slice(0,8)})),english:context.foodMatchForSegment('1 cup cooked rice'),french:context.foodMatchForSegment('1 tasse riz cuit')}));
console.log('ENGLISH_UNIT_AUDIT',JSON.stringify(unitAudit));
for(const locale of ['en-CA','en-US']){
 const rows=unitAudit.filter(x=>x.locale===locale);
 const find=input=>rows.find(x=>x.input===input);
 assert.equal(find('1 tbsp peanut butter').calories,95,locale+': 1 tbsp peanut butter');
 assert.equal(find('2 tbsp peanut butter').calories,190,locale+': 2 tbsp peanut butter');
 assert.equal(find('200 g cooked spaghetti').calories,316,locale+': cooked spaghetti weight');
 assert.equal(find('1 cup cooked rice').calories,205);
 assert.ok(find('4 oz cooked chicken').calories>0,locale+': 4 oz cooked chicken');
 assert.ok(find('6 oz cooked salmon').calories>0,locale+': 6 oz cooked salmon');
 // La tasse de riz cuit reste à valider avec une portion officielle.
}

const evaluation={date:new Date().toISOString(),scope:'Jeu de contrôle déterministe, non représentatif; aucun intervalle de confiance',rows:[],byFamily:{}};
for(const locale of ['fr-CA','fr-FR','en-CA','en-US']){
 global.ENERGIE_LOCALE=locale;
 for(const item of locale.startsWith('en')?englishEvaluationCases:evaluationCases){
  const result=context.estimateNutritionFromText(item.input);
  const recognized=Number.isFinite(result?.calories) && result.calories>0;
  const outcome=recognized?'recognized':cnf.requiresClarification(item.input)?'clarification':'reject';
  const passed=outcome===item.expect;
  evaluation.rows.push({locale,...item,outcome,passed,calories:recognized?result.calories:null});
  const key=locale+'/'+item.family;
  const group=evaluation.byFamily[key]||{total:0,passed:0};
  group.total++;
  if(passed)group.passed++;
  evaluation.byFamily[key]=group;
 }
}
evaluation.total=evaluation.rows.length;
evaluation.passed=evaluation.rows.filter(x=>x.passed).length;
evaluation.ratePercent=Math.round(10000*evaluation.passed/evaluation.total)/100;
evaluation.failures=evaluation.rows.filter(x=>!x.passed);
evaluation.byLocale=Object.fromEntries(['fr-CA','fr-FR','en-CA','en-US'].map(locale=>{const rows=evaluation.rows.filter(x=>x.locale===locale);return [locale,{total:rows.length,passed:rows.filter(x=>x.passed).length,ratePercent:Math.round(10000*rows.filter(x=>x.passed).length/rows.length)/100}]}));
if(process.env.NUTRITION_EVALUATION_REPORT){
 const target=process.env.NUTRITION_EVALUATION_REPORT;
 fs.mkdirSync(require('node:path').dirname(target),{recursive:true});
 fs.writeFileSync(target,JSON.stringify(evaluation,null,2));
}
console.log('REALISTIC_EVALUATION',JSON.stringify({total:evaluation.total,passed:evaluation.passed,ratePercent:evaluation.ratePercent,failures:evaluation.failures}));
assert.equal(evaluation.failures.filter(x=>x.family==='securite').length,0,'Aucun échec de sécurité toléré');
assert.ok(evaluation.ratePercent>=90,'Cible minimale du jeu de contrôle: 90 %');


// Contrat de sérialisation du Journal : la normalisation de production doit
// conserver la trace des ingrédients et les valeurs nutritionnelles après JSON.
// Le test ne remplace pas un véritable aller-retour dans Supabase.
{
 const normalization={};
 vm.createContext(normalization);
 const begin=source.indexOf('  function normalNutrition(');
 const finish=source.indexOf('  function normalizeFeelingScores(',begin);
 assert.ok(begin>=0&&finish>begin,'Fonction réelle normalNutrition introuvable');
 vm.runInContext(source.slice(begin,finish),normalization);
 const input=context.estimateNutritionFromText('1 bagel + 30 g fromage à la crème + 1 banane + 1 c. à soupe beurre d\'arachide');
 assert.ok(input?.trace?.items?.length===4,'Le repas complet doit être reconnu avant sérialisation');
 const stored=JSON.parse(JSON.stringify(normalization.normalNutrition(input)));
 const loaded=normalization.normalNutrition(stored);
 assert.equal(loaded.calories,511.5);
 assert.equal(loaded.trace.items.length,4);
 assert.equal(loaded.source,'mixed');
 assert.ok(loaded.trace.items.every(item=>Number.isFinite(Number(item.calories))),'Calories de chaque ingrédient');
 assert.match(source,/if \(payload\.nutrition != null\) throw error;/,
  'La synchronisation ne doit pas retirer les calories en cas de schéma ancien');
 console.log('NUTRITION_SERIALIZATION_CONTRACT',JSON.stringify({calories:loaded.calories,ingredients:loaded.trace.items.length,source:loaded.source}));
}

 
// Régression issue d'un véritable dîner signalé : quatre aliments courants.
{
 const everydayCorrections=require('../nutrition-corrections.js');
 const known=[...everydayCorrections,...benchmarkFoods];
 context.FOOD_CANDIDATES=known.flatMap(food=>(food.keys||[]).map(key=>({
  food,key:context.normalizeFoodText(key),compareKey:context.comparableFoodText(key)
 })).filter(x=>x.key));
 context.legacyFoodWithAlias=(...aliases)=>known.find(food=>(food.keys||[]).some(key=>aliases.includes(key)))||null;
 for(const locale of ['fr-CA','en-CA']){
  global.ENERGIE_LOCALE=locale;
  const inputs=locale==='fr-CA'
   ? ['Riz au jasmin cuit','2 oeufs brouillées','Carré de chocolat noir','5 amandes']
   : ['cooked jasmine rice','2 scrambled eggs','dark chocolate square','5 almonds'];
  for(const input of inputs){
   const n=context.estimateNutritionFromText(input);
   assert.ok(n?.calories>0 && n?.trace?.items?.length===1,locale+': '+input);
  }
 }
 for(const [input,calories] of [
   ['100 g Riz au jasmin cuit',130],
   ['190 g Riz au jasmin cuit',247],
   ['100 g cooked jasmine rice',130],
   ['190 g cooked jasmine rice',247],
 ]) {
   const result=context.estimateNutritionFromText(input);
   assert.ok(result, 'Measured food must remain recognized: '+input);
   assert.ok(Math.abs(result.calories-calories)<0.2,input+': '+result.calories);
   assert.equal(result.trace.items[0].quantityUsed,true,input);
 }
 const eggs=context.estimateNutritionFromText('2 oeufs brouillées');
 const almonds=context.estimateNutritionFromText('5 amandes');
 assert.equal(eggs.calories,200,'Deux oeufs doivent rester deux portions');
 assert.equal(almonds.calories,35,'Cinq amandes doivent rester cinq unités');
 console.log('REAL_LUNCH_REGRESSION',JSON.stringify({eggs:eggs.calories,almonds:almonds.calories}));
}
