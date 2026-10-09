const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.existsSync('notes-update-function.js')?fs.readFileSync('notes-update-function.js','utf8'):fs.readFileSync('app.js','utf8');
const start=source.indexOf('async function updateProfessionalNote'),end=source.indexOf('  function renderFollowup()',start);
const fn=source.slice(start,end<0?undefined:end);
function fixture(){
  let result=null,calls=0,writes=0;const filters=[];
  const ctx=vm.createContext({professionalBetaMode:true,professionalDemoMode:false,db:{settings:{demoMode:false}},
    professionalActiveClient:{id:'customer',linkId:'link'},session:{user:{id:'owner'}},accountDeletionBusy:false,
    professionalNotesCache:[{id:'note',clientId:'customer',content:'before',visibility:'private',contextId:'meal',createdAt:'original'}],
    activeDemoProfile:()=>({id:'customer'}),readProfessionalNotes:()=>ctx.professionalNotesCache,
    writeProfessionalNotes:next=>{writes++;ctx.professionalNotesCache=next;},alert:message=>ctx.messages.push(message),messages:[],
    client:{from:table=>{assert.equal(table,'professional_notes');return {update:payload=>{
      calls++;ctx.payload=payload;const q={eq:(key,value)=>{filters.push([key,value]);return q;},select:async()=>typeof result==='function'?result():result||{data:[{id:'note',...payload}],error:null}};
      return q;
    }}}}
  });vm.runInContext(fn,ctx);return {ctx,filters,stats:()=>({calls,writes}),setResult:value=>result=value};
}
(async()=>{
  for(const visibility of ['private','shared']){
    const f=fixture();assert.equal(await f.ctx.updateProfessionalNote('note',{content:'  after  ',visibility}),true);
    const n=f.ctx.professionalNotesCache[0];assert.equal(n.content,'after');assert.equal(n.visibility,visibility);
    assert.equal(n.contextId,'meal');assert.equal(n.createdAt,'original');
    assert.deepEqual(f.filters,[['id','note'],['professional_user_id','owner'],['link_id','link']]);
  }
  for(const result of [{data:[],error:null},{data:null,error:{message:'refused'}}]){
    const f=fixture();f.setResult(result);assert.equal(await f.ctx.updateProfessionalNote('note',{content:'after'}),false);
    assert.equal(f.ctx.professionalNotesCache[0].content,'before');assert.equal(f.ctx.messages.length,1);
  }
  const blank=fixture();await blank.ctx.updateProfessionalNote('note',{content:' '});assert.equal(blank.stats().calls,0);
  const viewer=fixture();viewer.ctx.professionalBetaMode=false;await viewer.ctx.updateProfessionalNote('note',{content:'after'});assert.equal(viewer.stats().calls,0);
  const changed=fixture();changed.setResult(()=>{changed.ctx.professionalActiveClient.id='another';return {data:[{id:'note',content:'after'}],error:null};});
  assert.equal(await changed.ctx.updateProfessionalNote('note',{content:'after'}),false);assert.equal(changed.ctx.professionalNotesCache[0].content,'before');
  const demo=fixture();demo.ctx.professionalBetaMode=false;demo.ctx.professionalDemoMode=true;demo.ctx.db.settings.demoMode=true;
  assert.equal(await demo.ctx.updateProfessionalNote('note',{content:'after',visibility:'shared'}),true);assert.equal(demo.stats().writes,1);assert.equal(demo.stats().calls,0);
  console.log('Notes professionnelles : édition privée/partagée, contexte conservé, permissions, texte vide, client, démo et changement de dossier OK');
})().catch(error=>{console.error(error);process.exitCode=1});
