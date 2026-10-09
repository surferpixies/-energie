const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.existsSync('professional-notes-ui-function.js')?fs.readFileSync('professional-notes-ui-function.js','utf8'):fs.readFileSync('app.js','utf8');
const a=source.indexOf('function renderFollowup()'),b=source.indexOf('  function labScenarioCardsHtml()',a);
function node(dataset={}){
  return {dataset,events:{},value:'',textContent:'',hidden:true,disabled:false,options:[],
    addEventListener(type,fn){this.events[type]=fn;},appendChild(option){this.options.push(option);},
    scrollIntoView(){},focus(){},reset(){},click(){return this.events.click?.();}};
}
(async()=>{
  const ids=['private','shared'],edits=ids.map(id=>node({editProfessionalNote:id})),deletes=ids.map(id=>node({deleteProfessionalNote:id}));
  const nodes={};for(const id of ['app','professionalNoteForm','professionalNoteContext','professionalNoteContent','professionalNoteVisibility','professionalNoteSubmit','cancelProfessionalNoteEdit'])nodes['#'+id]=node();
  nodes['#professionalNoteForm .eyebrow']=node();
  nodes['#professionalNoteContext'].options=[{value:'global|||Suivi général'}];
  const notes=ids.map(id=>({id,clientId:'customer',visibility:id==='private'?'private':'shared',content:id+' text',contextType:'global',createdAt:'original'}));
  const removed=[],saved=[];
  const ctx=vm.createContext({professionalBetaMode:false,professionalDemoMode:true,db:{settings:{demoMode:true}},session:null,
    hasClientProfessionalFollowup:()=>false,activeDemoProfile:()=>({id:'customer',name:'Customer'}),readProfessionalNotes:()=>notes,
    esc:x=>String(x),professionalNoteTime:x=>x,professionalContextOptionsHtml:()=>'',professionalTrackingPlanHtml:()=>'',clientTrackingPlanSummaryHtml:()=>'',professionalTrendHtml:()=>'',professionalOptionsPanelHtml:()=>'',professionalConsultationHtml:()=>'',bindProfessionalOptionsPanel:()=>{},
    $:selector=>selector==='[data-edit-professional-note]'?edits[0]:selector==='[data-delete-professional-note]'?deletes[0]:nodes[selector]||null,
    $$:selector=>selector==='[data-edit-professional-note]'?edits:selector==='[data-delete-professional-note]'?deletes:[],
    document:{createElement:()=>node()},render:()=>{},currentView:'followup',
    deleteProfessionalNote:async(id,button)=>removed.push([id,button]),
    updateProfessionalNote:async(id,changes)=>{saved.push([id,changes]);return false;}
  });
  vm.runInContext(source.slice(a,b<0?undefined:b),ctx);
  ctx.renderFollowup();
  assert.match(nodes['#app'].innerHTML,/data-edit-professional-note="private"/);
  assert.match(nodes['#app'].innerHTML,/data-delete-professional-note="shared"/);
  for(let i=0;i<ids.length;i++){
    edits[i].click();assert.equal(nodes['#professionalNoteContent'].value,ids[i]+' text');
    assert.equal(nodes['#professionalNoteVisibility'].value,notes[i].visibility);
    assert.equal(nodes['#cancelProfessionalNoteEdit'].hidden,false);
    nodes['#professionalNoteContent'].value='edited '+ids[i];
    await nodes['#professionalNoteForm'].events.submit({preventDefault(){}});
    assert.equal(saved[i][0],ids[i]);assert.equal(saved[i][1].content,'edited '+ids[i]);
    await deletes[i].click();assert.equal(removed[i][0],ids[i]);assert.equal(removed[i][1],deletes[i]);
  }
  nodes['#cancelProfessionalNoteEdit'].click();assert.equal(nodes['#professionalNoteContext'].disabled,false);
  assert.equal(nodes['#cancelProfessionalNoteEdit'].hidden,true);
  console.log('Interface des notes : clic Modifier et Supprimer sur chaque carte, préremplissage, enregistrement et Annuler OK');
})().catch(error=>{console.error(error);process.exitCode=1});
