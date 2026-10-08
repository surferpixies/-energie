const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
require('../brain-journal.js');
const source=fs.readFileSync('app.js','utf8');
const app={innerHTML:''},details={open:false};
const ctx=vm.createContext({window:{ENERGIE_LOCALE:'fr-FR',EnergieJournalLearning:global.EnergieJournalLearning},db:{settings:{},days:{'2026-10-07':{meals:[{type:'Déjeuner',description:'repas',feelingsBefore:{hunger:0},feeling:{scores:{energy:1}}}]}}},
 selectedDate:'2026-10-07',todayKey:()=> '2026-10-07',performance:{now:()=>0},console:{log:()=>{}},
 $:selector=>selector==='#app'?app:details,t:text=>({'Déjeuner':'Petit-déjeuner','Dîner':'Déjeuner','Souper':'Dîner'}[text]||text),esc:text=>String(text),
 mealIcon:()=> '🍽️',analysisDateNavigatorHtml:()=>'',bindAnalysisDateNavigator:()=>{}});
vm.runInContext(source.slice(source.indexOf('  function mealTypeHtml('),source.indexOf('  function feelingMealOptionsHtml(')),ctx);
vm.runInContext(source.slice(source.indexOf('  function brainCoverageMetric('),source.indexOf('  function brainNutritionCoverage(')),ctx);
vm.runInContext(source.slice(source.indexOf('  function renderBrainContents(data)'),source.indexOf('  let flushPersonalProfile')),ctx);
ctx.renderBrainContents(null);
assert.ok(app.innerHTML.includes('Ce que j’apprends de toi'));
assert.ok(app.innerHTML.includes('Le savais-tu ?'));
assert.ok(app.innerHTML.includes('Les observations puisent dans ces informations'));
assert.ok(app.innerHTML.includes('data-i18n-key="Dîner">Déjeuner'), 'Stored meal type survives France translation');
assert.equal((app.innerHTML.match(/class="brain-week"/g)||[]).length,4);
assert.ok(app.innerHTML.includes('id="brainKnowledgeDetails"'));
assert.ok(!app.innerHTML.includes('id="brainKnowledgeDetails" class="card brain-knowledge-details" open'), 'Food details are closed initially');
console.log('Affichage Cerveau : portrait, quatre semaines, lien vers observations, détails repliés et repas France OK');
