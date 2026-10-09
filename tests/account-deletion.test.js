const assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm');
const backend = fs.readFileSync('supabase/functions/delete-account/index.ts','utf8').replace(/^import .*\n/,'').replace('export async function','async function');
const userId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
let authenticated = true, storageFails = false, removed = [], deleted = [], feedback = [];
const admin = {
  auth:{getUser:async()=>authenticated?{data:{user:{id:userId}}}:{error:{}},admin:{deleteUser:async id=>{deleted.push(id);return {};}}},
  storage:{listBuckets:async()=>({data:[{id:'meal-photos'}]}),from:()=>({
    list:async prefix=>storageFails?{error:{}}:{data:prefix===userId?[{name:'meal',id:null}]:[{name:'photo.jpg',id:'file'}]},
    remove:async paths=>{removed.push(...paths);return {};},
  })},
  from:()=>({delete:()=>({eq:async (key,id)=>{feedback.push([key,id]);return {};}})}),
};
const server=vm.createContext({Request,Response,createClient:()=>admin,Deno:{env:{get:()=> 'server-only'},serve:()=>{}}});
vm.runInContext(backend,server);
const request=body=>new Request('https://example.test/delete-account',{method:'POST',headers:{Authorization:'Bearer test','Content-Type':'application/json'},body:JSON.stringify(body)});
const appSource=fs.readFileSync('app.js','utf8');
let confirmed=false, online=true, success=false, cleared=0, calls=0;
const button={disabled:false},status={textContent:''};
const ui=vm.createContext({session:{user:{id:userId}},db:{settings:{}},professionalBetaMode:false,navigator:{get onLine(){return online;}},
 client:{functions:{invoke:async(name,options)=>{calls++;assert.equal(name,'delete-account');assert.equal(options.body.confirmation,'DELETE');return success?{data:{deleted:true,userId}}:{error:{}};}},auth:{signOut:async()=>({})}},
 $:selector=>selector==='#deleteOwnAccount'?button:status,t:x=>x,confirm:()=>confirmed,alert:()=>{},hasAppleIdentity:()=>false,
 formAutosaveTimers:new Map(),clearTimeout,avatarManager:{clear:()=>{}},clearLocalJournalAfterSignOut:()=>{cleared++;},render:()=>{},
});
vm.runInContext(appSource.slice(appSource.indexOf('  let accountDeletionBusy'),appSource.indexOf('  function renderProfile()')),ui);
(async()=>{
 assert.equal((await server.handleDeleteAccount(new Request('https://example.test',{method:'POST'}))).status,401);
 assert.equal((await server.handleDeleteAccount(request({confirmation:'DELETE',userId:'someone-else'}))).status,400);
 authenticated=false;assert.equal((await server.handleDeleteAccount(request({confirmation:'DELETE'}))).status,401);authenticated=true;
 storageFails=true;assert.equal((await server.handleDeleteAccount(request({confirmation:'DELETE'}))).status,500);assert.equal(deleted.length,0);storageFails=false;
 const result=await server.handleDeleteAccount(request({confirmation:'DELETE'}));assert.equal(result.status,200);assert.equal((await result.json()).userId,userId);
 assert.deepEqual(deleted,[userId]);assert.deepEqual(removed,[`${userId}/meal/photo.jpg`]);assert.deepEqual(feedback,[['user_id',userId]]);
 await ui.deleteOwnAccount();assert.equal(calls,0,'Annuler ne supprime rien');
 confirmed=true;online=false;await ui.deleteOwnAccount();assert.equal(calls,0);online=true;
 ui.professionalBetaMode=true;await ui.deleteOwnAccount();assert.equal(calls,0);ui.professionalBetaMode=false;
 ui.db.settings.demoMode=true;await ui.deleteOwnAccount();assert.equal(calls,0);ui.db.settings.demoMode=false;
 await ui.deleteOwnAccount();assert.equal(cleared,0,'Un échec serveur conserve le journal local');assert.equal(button.disabled,false);
 success=true;await ui.deleteOwnAccount();assert.equal(cleared,1);assert.equal(ui.session,null);
 assert.ok(appSource.indexOf('class="profile-delete-account"')>appSource.indexOf('class="card profile-creator-card"'),'Bouton après la signature');
 console.log('Suppression : authentification serveur, isolation du compte, fichiers, annulation, erreurs, mode pro/démo et nettoyage local OK');
})().catch(error=>{console.error(error);process.exitCode=1;});
