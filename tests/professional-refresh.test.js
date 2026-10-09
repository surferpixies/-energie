const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.existsSync('professional-refresh-functions.js')?fs.readFileSync('professional-refresh-functions.js','utf8'):fs.readFileSync('app.js','utf8');
const start=source.indexOf('let professionalBetaStateGeneration'),end=source.indexOf('  function randomProfessionalInviteCode()',start);
const functions=source.slice(start,end<0?undefined:end);
function fixture(){
  const notes=[{id:'private',clientId:'customer',visibility:'private'},{id:'shared',clientId:'customer',visibility:'shared'}];
  const ownLink={id:'link',status:'active',professional_user_id:'owner',client_user_id:'customer'};
  let links={data:[ownLink],error:null},followup={data:[{id:'personal',content:'personal',visibility:'shared'}],error:null},noteReads=0;
  const ctx=vm.createContext({professionalBetaMode:true,session:{user:{id:'owner'}},db:{settings:{}},
    professionalClientLinks:[ownLink],clientProfessionalLink:null,professionalNotesCache:notes,
    professionalTrackingPlanCache:{clientId:'customer',feelingIds:['tired']},
    refreshClientProfessionalOptions:async()=>{},saveLocal:()=>{},normalizeFeelingIds:x=>x,
    window:{EnergieProfessionalOptions:{raw:x=>x}},console:{info:()=>{}},
    client:{rpc:async()=>({data:[],error:null}),from:table=>{
      const q={select:()=>q,or:()=>q,eq:()=>q,order:async()=>{
        if(table==='professional_client_links')return typeof links==='function'?links():links;
        noteReads++;return typeof followup==='function'?followup():followup;
      },maybeSingle:async()=>({data:null,error:null})};return q;
    }}
  });vm.runInContext(functions,ctx);
  return {ctx,notes,setLinks:x=>links=x,setFollowup:x=>followup=x,noteReads:()=>noteReads};
}
(async()=>{
  // Reproduit le rafraîchissement d'accès lancé au renouvellement du jeton.
  const active=fixture();for(let i=0;i<3;i++)await active.ctx.loadProfessionalBetaState();
  assert.equal(active.ctx.professionalNotesCache,active.notes);assert.equal(active.ctx.professionalTrackingPlanCache.clientId,'customer');
  assert.equal(active.noteReads(),0);
  const offline=fixture();offline.setLinks({data:null,error:{message:'offline'}});await offline.ctx.loadProfessionalBetaState();
  assert.equal(offline.ctx.professionalNotesCache,offline.notes);assert.equal(offline.ctx.professionalClientLinks.length,1);
  const dual=fixture();dual.setLinks({data:[{id:'personal-link',status:'active',client_user_id:'owner',professional_user_id:'other'}],error:null});
  await dual.ctx.loadProfessionalBetaState();assert.equal(dual.noteReads(),0);assert.equal(dual.ctx.professionalNotesCache,dual.notes);
  const pending=fixture();let release;pending.setLinks(()=>new Promise(resolve=>release=resolve));
  const loading=pending.ctx.loadProfessionalBetaState();assert.equal(pending.ctx.professionalNotesCache,pending.notes);
  pending.ctx.session.user.id='new-owner';release({data:[{id:'stale'}],error:null});await loading;
  assert.equal(pending.ctx.professionalClientLinks[0].id,'link');
  const racing=fixture();let first;racing.setLinks(()=>new Promise(resolve=>first=resolve));const old=racing.ctx.loadProfessionalBetaState();
  racing.setLinks({data:[{id:'newest',professional_user_id:'owner'}],error:null});await racing.ctx.loadProfessionalBetaState();
  first({data:[{id:'oldest'}],error:null});await old;assert.equal(racing.ctx.professionalClientLinks[0].id,'newest');
  const personal=fixture();personal.ctx.professionalBetaMode=false;personal.ctx.clientProfessionalLink={id:'personal-link'};
  await personal.ctx.loadClientProfessionalFollowup();assert.equal(personal.ctx.professionalNotesCache[0].id,'personal');
  assert.equal(personal.ctx.professionalTrackingPlanCache,null);
  const switched=fixture();switched.ctx.professionalBetaMode=false;switched.ctx.clientProfessionalLink={id:'personal-link'};let finish,started;
  const reading=new Promise(resolve=>started=resolve);
  switched.setFollowup(()=>new Promise(resolve=>{finish=resolve;started();}));const request=switched.ctx.loadClientProfessionalFollowup();
  await reading;switched.ctx.professionalBetaMode=true;switched.ctx.db={settings:{}};
  finish({data:[{id:'personal'}],error:null});await request;assert.equal(switched.ctx.professionalNotesCache,switched.notes);
  console.log('Suivi professionnel : cache conservé au rafraîchissement, réseau refusé, double rôle, réponses périmées et changement de dossier OK');
})().catch(error=>{console.error(error);process.exitCode=1});
