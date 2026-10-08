const assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm');
const context = vm.createContext({window: {}, console, guardCalls: 0, queryCalls: 0});
vm.runInContext(fs.readFileSync('cnf-catalog.js', 'utf8'), context);
const source = fs.readFileSync('cnf-search.js', 'utf8')
  .replace('function isCandidateAllowed(text, name, { allowPreparationChoice = false } = {}) {', 'function isCandidateAllowed(text, name, { allowPreparationChoice = false } = {}) { guardCalls++;')
  .replace('function searchQueryMeta(text) {', 'function searchQueryMeta(text) { queryCalls++;');
vm.runInContext(source, context);
const api = context.window.ENERGIE_CNF_SEARCH;
assert.equal(api.find('alimenttotalementinconnu'), null);
assert.equal(context.guardCalls, 0, 'Les fiches sans correspondance lexicale évitent les vérifications de préparation');
assert.equal(context.queryCalls, 1, 'La requête est préparée une fois pour tout le catalogue');
const apple = api.find('1 pomme');
assert.ok(apple);
const guards = context.guardCalls;
assert.equal(api.find('1 pomme'), apple);
assert.equal(context.guardCalls, guards, 'La même recherche reste en cache');
const apples = api.find('2 pommes');
assert.equal(apples.calories, apple.calories, "La fiche conserve sa valeur par portion; le parseur applique le nombre de pommes");
for (const query of ['poulet cru', 'poulet cuit', 'cottage', 'tomate', 'thon cuit']) {
  const before = context.queryCalls;
  const results = api.search(query);
  assert.ok(results.length, query);
  assert.equal(context.queryCalls, before + 1);
  for (const result of results) assert.ok(api.isCandidateAllowed(query, result.nameFr, {allowPreparationChoice: true}));
}
console.log('FCÉN : requête préparée une fois, garde-fous après correspondance, cache et quantités OK');
