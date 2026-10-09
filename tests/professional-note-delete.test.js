const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.existsSync('notes-delete-function.js') ? fs.readFileSync('notes-delete-function.js', 'utf8') : fs.readFileSync('app.js', 'utf8');
const start = source.indexOf('const professionalNoteDeletes');
const end = source.indexOf('  function renderFollowup()', start);
const fn = source.slice(start, end < 0 ? undefined : end);
function fixture(visibility = 'shared') {
  const notes = [{id:'note', clientId:'customer', visibility}, {id:'other', clientId:'customer', visibility:'private'}];
  let result = {data:[{id:'note'}],error:null}, calls=0, renders=0, writes=0, confirmations=0;
  const filters=[];
  const ctx = vm.createContext({
    professionalBetaMode:true, professionalDemoMode:false, db:{settings:{demoMode:false}},
    professionalActiveClient:{id:'customer',linkId:'link'}, professionalNotesCache:notes,
    session:{user:{id:'owner'}}, accountDeletionBusy:false,
    activeDemoProfile:()=>({id:'customer'}), readProfessionalNotes:()=>ctx.professionalNotesCache,
    writeProfessionalNotes:next=>{writes++;ctx.professionalNotesCache=next;}, renderFollowup:()=>renders++,
    confirm:()=>{confirmations++;return true;}, alert:message=>ctx.messages.push(message), messages:[],
    client:{from:table=>{assert.equal(table,'professional_notes');return {delete:()=>{
      calls++;const query={eq:(key,value)=>{filters.push([key,value]);return query;},select:async fields=>{
        assert.equal(fields,'id'); return typeof result==='function'?result():result;
      }};return query;
    }}}}
  });
  vm.runInContext(fn,ctx);
  return {ctx, filters, setResult:value=>result=value, stats:()=>({calls,renders,writes,confirmations})};
}
(async()=>{
  for (const visibility of ['shared','private']) {
    const f=fixture(visibility),button={disabled:false,textContent:'Supprimer'};
    await f.ctx.deleteProfessionalNote('note',button);
    assert.deepEqual(Array.from(f.ctx.professionalNotesCache,x=>x.id),['other']);
    assert.deepEqual(f.filters,[['id','note'],['professional_user_id','owner'],['link_id','link']]);
    assert.equal(f.stats().renders,1);assert.equal(button.disabled,false);
  }
  for(const response of [{data:[],error:null},{data:null,error:{message:'refused'}},{data:[{id:'wrong'}],error:null}]) {
    const f=fixture();f.setResult(response);await f.ctx.deleteProfessionalNote('note');
    assert.equal(f.ctx.professionalNotesCache.length,2);assert.equal(f.stats().renders,0);assert.equal(f.ctx.messages.length,1);
  }
  const cancel=fixture();cancel.ctx.confirm=()=>false;await cancel.ctx.deleteProfessionalNote('note');assert.equal(cancel.stats().calls,0);
  const viewer=fixture();viewer.ctx.professionalBetaMode=false;await viewer.ctx.deleteProfessionalNote('note');assert.equal(viewer.stats().calls,0);assert.equal(viewer.stats().writes,0);
  const wrongClient=fixture();wrongClient.ctx.professionalActiveClient.id='elsewhere';await wrongClient.ctx.deleteProfessionalNote('note');assert.equal(wrongClient.stats().calls,0);
  const demo=fixture();demo.ctx.professionalBetaMode=false;demo.ctx.professionalDemoMode=true;demo.ctx.db.settings.demoMode=true;
  await demo.ctx.deleteProfessionalNote('note');assert.equal(demo.stats().writes,1);assert.equal(demo.stats().calls,0);
  const changed=fixture();changed.setResult(()=>{changed.ctx.session.user.id='new-owner';return {data:[{id:'note'}],error:null};});
  await changed.ctx.deleteProfessionalNote('note');assert.equal(changed.ctx.professionalNotesCache.length,2);assert.equal(changed.stats().renders,0);
  const duplicate=fixture();let release;duplicate.setResult(()=>new Promise(resolve=>release=resolve));
  const pending=duplicate.ctx.deleteProfessionalNote('note');await duplicate.ctx.deleteProfessionalNote('note');
  assert.equal(duplicate.stats().calls,1);release({data:[{id:'note'}],error:null});await pending;
  console.log('Notes professionnelles : privée/partagée, confirmation serveur, refus, client, démo, changement de compte et double clic OK');
})().catch(error=>{console.error(error);process.exitCode=1;});
