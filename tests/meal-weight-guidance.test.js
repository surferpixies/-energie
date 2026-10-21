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
const query = selector => selector==='#mealCalorieRecognitionNotice'?notice:
  selector==='#mealCalorieUnrecognizedList'?list:
  selector==='#mealCalorieMode'?{value:'auto'}:
  selector==='#mealDescription'?{value:'5 amandes'}:null;
const ctx = {
 $:query, currentGuidedCnfNutrition:()=>false,
 mealNutritionRecognition:()=>({unrecognized:['5 amandes']}),
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
console.log('CNF_COUNT_WEIGHT_GUIDANCE_OK');
