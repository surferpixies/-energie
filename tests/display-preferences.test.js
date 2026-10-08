const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require.resolve('../app.js'),'utf8');
const ctx=vm.createContext({db:{settings:{}},window:{},t:x=>x});
function load(start,end,context=ctx){vm.runInContext(source.slice(source.indexOf(start),source.indexOf(end,source.indexOf(start))),context)}
load('  function caloriesVisible()', '  function nutritionVisibleToViewer()');
load('  function nutritionText(', '  const FOOD_MACROS');
const saved={calories:100,protein:10};assert.ok(ctx.nutritionText(saved).includes('100 kcal'));
ctx.db.settings.hideCalories=true;assert.ok(!ctx.nutritionText(saved).includes('kcal'));assert.ok(ctx.nutritionText(saved).includes('10 g prot.'));assert.equal(saved.calories,100);
load('  function dailyMacroSummaryHtml(', '  function observationSectionHtml(');assert.equal(ctx.dailyMacroSummaryHtml([]),'');
load('  function calorieTargetGaugeHtml(', '  function mealDraftCalories(');assert.equal(ctx.calorieTargetGaugeHtml('2026-10-07',[]),'');
load('  function guidedEntryEnabled()', '  function guidedCnfFoodText(');
const nodes={mealDescription:{classList:{toggle:()=>{}}},openCnfGuidedEntry:{classList:{toggle:()=>{}}},mealGuidedEntryRequirement:{}};ctx.$=selector=>nodes[selector.slice(1)];
ctx.db.settings.forceGuidedCnfMealEntry=true;ctx.window.ENERGIE_LOCALE='fr-CA';ctx.applyGuidedCnfMealEntryPreference();assert.equal(nodes.mealDescription.readOnly,true);
ctx.db.settings.showCnfGuidedEntry=false;ctx.applyGuidedCnfMealEntryPreference();assert.equal(nodes.openCnfGuidedEntry.hidden,true);assert.equal(nodes.mealDescription.readOnly,false);
ctx.window.ENERGIE_LOCALE='fr-FR';ctx.applyGuidedCnfMealEntryPreference();assert.equal(nodes.openCnfGuidedEntry.hidden,false);assert.ok(nodes.mealDescription.placeholder.includes('Ciqual'));
ctx.db.settings.showCiqualGuidedEntry=false;ctx.applyGuidedCnfMealEntryPreference();assert.equal(nodes.mealDescription.readOnly,false);
ctx.db.settings.showCnfGuidedEntry=true;ctx.window.ENERGIE_LOCALE='en';assert.equal(ctx.guidedEntryEnabled(),true);
const cloud=vm.createContext({freshDB:()=>({settings:{},days:{}}),ensureDay:(db,key)=>db.days[key]||(db.days[key]={meals:[]}),normalBeverage:x=>x,normalizeActivity:x=>x,normalizeSupplements:x=>x,Metrics:{mergeWeight:()=>null,mergeProfile:()=>({})},normalMeal:x=>x});
load('  function professionalDbFromCloud(', '  async function hydrateProfessionalPhotoUrls(',cloud);
const remote=cloud.professionalDbFromCloud([{log_date:'2026-10-07',updated_at:'2026-10-07',supplements:{profilePreferences:{hideCalories:true,showCnfGuidedEntry:false,showCiqualGuidedEntry:true}}}],[]);
assert.equal(remote.settings.hideCalories,true);assert.equal(remote.settings.showCnfGuidedEntry,false);assert.equal(remote.settings.showCiqualGuidedEntry,true);
(async()=>{
 const dom={},events={};let analyzed=0,autosaved=0;
 const photo={local:'image1',path:'private1'},other={local:'image2'};
 function node(){return {hidden:false,disabled:false,classList:{add:()=>{},remove:()=>{}},addEventListener:(name,fn)=>events[name]=fn,removeAttribute:()=>{}};}
 dom['#mealForm']=node();
 const dialog={...node(),open:false,showModal(){this.open=true},close(){this.open=false;events.close?.()}};
 const photoCtx=vm.createContext({window:{},document:{body:{insertAdjacentHTML:()=>{for(const id of ['mealPhotoViewerImage','closeMealPhotoViewer','mealPhotoViewerActions','keepPreviewPhoto','removePreviewPhoto','analyzePreviewPhoto'])dom['#'+id]=node();dom['#mealPhotoViewerDialog']=dialog;}}},$:selector=>dom[selector],esc:x=>x,t:x=>x,mealPhotoReadOnly:false,mealPhotoDrafts:[photo,other],removedMealPhotoPaths:new Set(),photoRemoved:false,photoData:'image1',analyzeMealPhotoWithAI:async()=>{analyzed++;return true},showPhotoPreview:()=>{},hideMealAiSuggestion:()=>{},scheduleFormAutosave:()=>{autosaved++}});
 load('  let activeDraftPhotoPreview', '  function bindMealPhotoViewers(',photoCtx);
 photoCtx.openDraftMealPhotoPreview(photo);assert.equal(dialog.open,true);assert.equal(dom['#mealPhotoViewerImage'].src,'image1');assert.equal(analyzed,0);
 dom['#keepPreviewPhoto'].onclick();assert.equal(photoCtx.mealPhotoDrafts.length,2,'Fermer conserve les photos');
 photoCtx.openDraftMealPhotoPreview(photo);await dom['#analyzePreviewPhoto'].onclick();assert.equal(analyzed,1);assert.equal(photo.aiAnalyzed,true);assert.equal(photoCtx.mealPhotoDrafts.length,2);
 photoCtx.openDraftMealPhotoPreview(photo);dom['#removePreviewPhoto'].onclick();assert.equal(photoCtx.mealPhotoDrafts.length,1);assert.equal(photoCtx.mealPhotoDrafts[0],other);assert.ok(photoCtx.removedMealPhotoPaths.has('private1'));assert.equal(photoCtx.photoData,'image2');
 photoCtx.mealPhotoReadOnly=true;photoCtx.removeDraftMealPhoto(other);assert.equal(photoCtx.mealPhotoDrafts.length,1);
 photoCtx.openMealPhotoViewer('readonly');assert.equal(dom['#mealPhotoViewerActions'].hidden,true);assert.equal(autosaved,2);
 console.log('Préférences : calories conservées/masquées, langues, lien facultatif/obligatoire, cloud et trois actions photo OK');
})().catch(error=>{console.error(error);process.exitCode=1});
