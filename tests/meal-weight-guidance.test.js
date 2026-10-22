const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require.resolve('../app.js'), 'utf8');
const start = source.indexOf('  function updateMealCalorieRecognition()');
const end = source.indexOf('  function openMealCalorieRecognition()',start);
assert.ok(start>0 && end>start);
const notices = [];
const notice = {hidden:false,textContent:''};
const list = {innerHTML:''};
const dialog = {open:false,close(){this.open=false;}};
let missing = ['5 amandes'];
let guided = false;
const query = selector => selector==='#mealCalorieRecognitionNotice'?notice:
  selector==='#mealCalorieUnrecognizedList'?list:
  selector==='#mealCalorieRecognitionDialog'?dialog:
  selector==='#mealCalorieMode'?{value:'auto'}:
  selector==='#mealDescription'?{value:'5 amandes'}:null;
const ctx = {
 $:query, currentGuidedCnfNutrition:()=>guided,
 mealNutritionRecognition:()=>({unrecognized:missing}),
 mealNaturalCountFromText:()=>5,
 mealQuantityFromText:()=>null,
 normalizeFoodText:s=>s.toLowerCase(),
 window:{ENERGIE_CNF_SEARCH:{
  stripQuantity:()=> 'amandes',
  find:()=>({portion:'100 g',gramsPerPortion:100}),
  requiresClarification:()=>false
 }},
 esc:s=>s
};
vm.createContext(ctx);
vm.runInContext(source.slice(start,end),ctx);
ctx.updateMealCalorieRecognition();
assert.match(notice.textContent,/poids total en grammes/);
assert.match(list.innerHTML,/Aliment trouvé dans la FCÉN/);
assert.doesNotMatch(list.innerHTML,/Aucune valeur calorique/);
ctx.window.ENERGIE_CNF_SEARCH.find=()=>null;
ctx.updateMealCalorieRecognition();
assert.match(list.innerHTML,/Aucune valeur calorique/);
dialog.open = true;
missing = [];
ctx.updateMealCalorieRecognition();
assert.equal(dialog.open,false,'La fenêtre doit fermer lorsqu’il ne reste aucun aliment inconnu');
dialog.open = true;
missing = ['5 amandes'];
guided = true;
ctx.updateMealCalorieRecognition();
assert.equal(dialog.open,false,'La fenêtre doit fermer dès que la sélection FCÉN est résolue');
console.log('CNF_COUNT_WEIGHT_GUIDANCE_OK');
