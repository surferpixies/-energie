const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('app.js','utf8');
function fixture(count=40){
  let clock=0,calls=0,draws=0,yields=0,chrome=0;
  const node={innerHTML:''},reports=[];
  const meals=Array.from({length:count},(_,i)=>({description:'repas '+i,feelingsBefore:{},nutrition:{sugars:i%2?3:null},eatingReasons:[]}));
  const ctx=vm.createContext({window:{ENERGIE_LOCALE:'fr-CA',EnergieBrainModules:{parser:{findFoods:text=>[{food:{names:{'fr-CA':text}}}]}}},
    db:{settings:{},days:{'2026-10-07':{meals,water:2,sleepHours:8,activities:[]}}},currentView:'brain',selectedDate:'2026-10-07',
    localStorage:{getItem:()=>null,setItem:()=>{}},console:{log:()=>{},warn:()=>{}},performance:{now:()=>clock},
    setTimeout:(fn,delay)=>{if(delay===250)return 1;yields++;return setTimeout(fn,0);},clearTimeout:()=>{},
    mealCompositionAnalysis:()=>{calls++;clock+=10;return {status:trait=>trait==='protein'?'confirmed':'unknown'};},
    todayKey:()=> '2026-10-07',EATING_REASON_META:[],normalizeEatingReasons:x=>x||[],normalizeFeelingScores:x=>x||{},normalizeSupplements:x=>x,
    $:()=>node,esc:x=>x,t:x=>x,analysisDateNavigatorHtml:()=>'',bindAnalysisDateNavigator:()=>{},
    renderProfessionalBetaContextBar:()=>{chrome++;},renderDemoChrome:()=>{chrome++;},bindViewSwipe:()=>{},
    renderBrainContents:data=>{draws++;reports.push(data);node.innerHTML='ready';},
  });
  vm.runInContext(source.slice(source.indexOf('  const BRAIN_COVERAGE_FOOD_CACHE_KEY'),source.indexOf('  function brainCoverageMetric(')),ctx);
  vm.runInContext(source.slice(source.indexOf('  let brainRenderGeneration'),source.indexOf('  function renderBrainContents(')),ctx);
  return {ctx,node,reports,get calls(){return calls},get draws(){return draws},get yields(){return yields},get chrome(){return chrome}};
}
(async()=>{
  const f=fixture();let heartbeat=false;
  const preparing=f.ctx.renderBrain();assert.ok(f.node.innerHTML.includes('role="status"'),'Loading visible before recognition');
  assert.equal(f.calls,0);setTimeout(()=>heartbeat=true,0);await preparing;
  assert.equal(heartbeat,true,'Other browser work can run during preparation');assert.ok(f.yields>10);
  assert.equal(f.draws,1);assert.equal(f.chrome,2,'Professional and demo context restored after deferred draw');assert.equal(f.calls,40);assert.equal(f.reports[0].mealTotal,40);
  assert.equal(f.reports[0].counts.protein,40);assert.equal(f.reports[0].counts.sugars,20);
  const expected=JSON.stringify(f.reports[0]);const before=f.yields;
  await f.ctx.renderBrain();assert.equal(f.calls,40,'Warm render does not reanalyze');assert.equal(f.yields,before);assert.equal(JSON.stringify(f.reports[1]),expected);
  f.ctx.db.days['2026-10-07'].meals.push({description:'repas ajouté',feelingsBefore:{},eatingReasons:[]});
  await f.ctx.renderBrain();assert.equal(f.calls,41);assert.equal(f.reports.at(-1).mealTotal,41);
  f.ctx.window.ENERGIE_LOCALE='fr-FR';await f.ctx.renderBrain();assert.equal(f.calls,82,'Locale-dependent recognition cannot reuse another locale');
  const large=fixture(600);await large.ctx.renderBrain();assert.equal(large.calls,600,'Even beyond persistent cache size, final render uses prepared facts');
  assert.ok(Object.keys(large.ctx.loadBrainCoverageFoodFactsCache()).length<=500);assert.equal(large.reports[0].mealTotal,600);
  await large.ctx.renderBrain();assert.equal(large.calls,700,'Only missing facts recalculated beyond cache capacity');
  const left=fixture();const work=left.ctx.renderBrain();left.ctx.currentView='profile';left.node.innerHTML='profile';await work;
  assert.equal(left.draws,0);assert.equal(left.node.innerHTML,'profile');assert.equal(left.calls,0);
  const switched=fixture();const pending=switched.ctx.renderBrain();switched.ctx.db={settings:{},days:{}};await pending;assert.equal(switched.draws,1);assert.equal(switched.reports[0].mealTotal,0,"A changed account is rendered from its own journal instead of leaving loading stuck");
  const changedDate=fixture();const datePending=changedDate.ctx.renderBrain();changedDate.ctx.selectedDate="2026-10-06";await datePending;assert.equal(changedDate.draws,1,"Active view restarts when its date changes during preparation");
  const duplicate=fixture();const older=duplicate.ctx.renderBrain();const latest=duplicate.ctx.renderBrain();await Promise.all([older,latest]);assert.equal(duplicate.draws,1);
  const demo=fixture();demo.ctx.db.settings.demoMode=true;demo.ctx.selectedDate='2026-10-06';await demo.ctx.renderBrain();assert.equal(demo.reports[0].mealTotal,0,'Demo future meals excluded');
  const parser=vm.createContext({window:{}});
  for(const path of ['foods.js','food-categories.js','brain/utils.js','brain/database.js','brain/recipes.js','brain/parser.js'])vm.runInContext(fs.readFileSync(path,'utf8'),parser);
  for(const text of ['150 g poulet\nlaitue\nconcombres','1/2 tasse cottage','2 pommes','sandwich au jambon','lait de soya','texte inconnu']){
    const api=parser.window.EnergieBrainModules.parser;
    assert.equal(JSON.stringify(api.findFoods(text)),JSON.stringify(api.parseMeal(text,{memory:false}).foods),'Same recognized foods: '+text);
  }
  console.log('Cerveau : chargement immédiat, calcul fractionné, cache/langue, 600 repas, résultats identiques et annulation après navigation/compte OK');
})().catch(e=>{console.error(e);process.exitCode=1;});
