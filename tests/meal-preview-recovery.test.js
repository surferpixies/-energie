const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require.resolve('../app.js'), 'utf8');
const start = source.indexOf('  function scheduleAutomaticNutritionPreview()');
const end = source.indexOf('  // --- V3.0.3', start);
const description = {value:'',setCustomValidity(message){this.error=message;}};
const fields = {'#mealDescription':description,'#mealCalorieMode':{value:'auto'}};
let timer = 0, result, reviews = 0, estimates = 0;
const pending = new Map();
const context = {
 MEAL_DESCRIPTION_MAX_LENGTH:1000,
 mealNutritionPreviewTimer:null,
 mealNutritionManuallyEdited:false,
 db:{settings:{autoNutritionEstimates:true}},
 $:selector=>fields[selector],
 clearTimeout:id=>pending.delete(id),
 setTimeout:fn=>{pending.set(++timer,fn);return timer;},
 updateMealCompositionReview:()=>{reviews++;},
 currentGuidedCnfNutrition:()=>null,
 fillNutritionInputs:n=>{result=n;},
 estimateMealEditorNutrition:text=>{estimates++;return text==='150 g tomates'?{calories:27}:null;},
 nutritionVisibleToViewer:()=>false,
};
vm.createContext(context);
vm.runInContext(source.slice(start,end), context);
function input(value){description.value=value;context.scheduleAutomaticNutritionPreview();}
function flush(){const callbacks=[...pending.values()];pending.clear();callbacks.forEach(fn=>fn());}
input('un texte de publication complètement hors sujet');
assert.equal(reviews,0); // Aucun parcours alimentaire pendant la frappe.
flush();assert.equal(result,null);
input('');flush();assert.equal(result,null);
input('150 g tomates');flush();assert.equal(result.calories,27);
input('x'.repeat(1001));assert.ok(description.error);assert.equal(result,null);
const before=estimates;flush();assert.equal(estimates,before);
input('150 g tomates');assert.equal(description.error,'');flush();assert.equal(result.calories,27);
const beforeReviews=reviews;
input('du texte hors sujet');input('150 g tomates');
assert.equal(pending.size,1);flush();assert.equal(reviews,beforeReviews+1);assert.equal(result.calories,27);
assert.match(fs.readFileSync(require.resolve('../index.html'),'utf8'), /id="mealDescription" maxlength="1000"/);
console.log('meal preview: debounce, limite et récupération sans fermer le popup OK');
