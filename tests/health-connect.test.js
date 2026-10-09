const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('app.js','utf8');
const moduleSource = fs.readFileSync('health-connect.js','utf8');
const syncSource = source.slice(source.indexOf('  function nativeHealthConnect()'),source.indexOf('  function nativeLocalNotifications()'));
function fixture() {
  const db = {settings:{healthConnectEnabled:true},days:{'2026-10-08':{steps:847,activities:[]}}};
  const snapshot = {authorized:true, days:[{date:'2026-10-08',steps:8305}], samples:[],workouts:[],measurements:[],errors:[]};
  let reads=0, queued=[];
  const plugin = {isAvailable:async()=>({available:true}),requestAuthorization:async()=>({authorized:true}),
    readSnapshot:async()=>{reads++;return snapshot;}};
  const window = {Capacitor:{getPlatform:()=> 'android',Plugins:{HealthConnect:plugin}}};
  const context = vm.createContext({window,db,session:{user:{id:'owner'}},professionalBetaMode:false,accountDeletionBusy:false,
    todayKey:()=> '2026-10-09',ensureDay:(db,key)=>db.days[key] ||= {activities:[]},normalizeActivity:a=>a,
    Metrics:{weightRecord:x=>x,mergeWeight:(old,next)=>!old||next.updatedAt>old.updatedAt?next:old},
    healthKitSleepingHours:()=>8,$:()=>null,esc:x=>x,render:()=>{},saveLocal:()=>{},
    outbox:()=>queued.slice(),setOutbox:next=>{queued=next;return true;},uid:()=> 'test',syncState:'online',
    updateSyncBadge:()=>{},syncNow:()=>{},navigator:{onLine:false},alert:()=>{},console:{warn:()=>{}}});
  vm.runInContext(moduleSource,context);vm.runInContext(syncSource,context);
  return {context,snapshot,plugin,reads:()=>reads,queued:()=>queued};
}
(async()=>{
  const f=fixture(); assert.equal(await f.context.syncHealthConnect(),true);
  assert.equal(f.context.db.days['2026-10-08'].steps,8305,'Yesterday partial total refreshed');
  assert.equal(f.context.db.days['2026-10-08'].stepsSource,'healthconnect');
  assert.equal(f.queued()[0]._ownerUserId,'owner');
  f.snapshot.days[0].steps=8200;await f.context.syncHealthConnect();
  assert.equal(f.context.db.days['2026-10-08'].steps,8200,'Corrections decrease imported total');
  f.context.db.days['2026-10-08'].stepsSource='manual';await f.context.syncHealthConnect();
  assert.equal(f.context.db.days['2026-10-08'].steps,8200,'Manual steps protected');
  f.context.db.days['2026-10-08'].stepsSource='healthkit';f.snapshot.days[0].steps=10;
  await f.context.syncHealthConnect();assert.equal(f.context.db.days['2026-10-08'].steps,8200,'Apple-origin history protected');
  f.snapshot.days=[{date:'invalid',steps:4},{date:'2026-10-10',steps:7}];
  f.snapshot.workouts=[{uuid:'session1',sourceApp:'provider',originalType:'16',activityName:'Cours de danse',energieType:'Danse',startDate:'2026-10-08T16:00:00-04:00',durationMinutes:30}];
  await f.context.syncHealthConnect();await f.context.syncHealthConnect();
  const activity=f.context.db.days['2026-10-08'].activities[0];
  assert.equal(f.context.db.days['2026-10-08'].activities.length,1,'Repeat sync creates no duplicates');
  assert.equal(activity.type,'Danse');assert.equal(activity.originalType,'16');assert.equal(activity.sourceApp,'provider');
  assert.equal(activity.actualCalories,null,'No invented measured calories');
  assert.equal(f.context.db.days.invalid,undefined);assert.equal(f.context.db.days['2026-10-10'],undefined);
  f.snapshot.samples=[{endDate:'2026-10-09T08:00:00-04:00',stage:'deep'}];
  f.snapshot.measurements=[{date:'2026-10-08T08:00:00-04:00',kg:75}];
  f.context.db.days['2026-10-08'].weightMeasurement={kg:80,updatedAt:'2026-10-09T08:00:00-04:00'};
  await f.context.syncHealthConnect();assert.equal(f.context.db.days['2026-10-09'].sleepHours,8);
  assert.equal(f.context.db.days['2026-10-08'].weightMeasurement.kg,80,'Newer weight protected');
  f.context.db.days['2026-10-09'].sleepHours=6;f.context.db.days['2026-10-09'].sleepSource='manual';
  await f.context.syncHealthConnect();assert.equal(f.context.db.days['2026-10-09'].sleepHours,6);
  for (const flag of ['professionalBetaMode','accountDeletionBusy']) {
    const x=fixture();x.context[flag]=true;assert.equal(await x.context.syncHealthConnect(),false);assert.equal(x.reads(),0);
  }
  const disabled=fixture();disabled.context.db.settings.healthConnectEnabled=false;
  assert.equal(await disabled.context.syncHealthConnect(),false);assert.equal(disabled.reads(),0);
  const denied=fixture();denied.context.db.settings.healthConnectEnabled=false;
  denied.plugin.requestAuthorization=async()=>({authorized:false});
  assert.equal(await denied.context.syncHealthConnect({requestAuthorization:true}),false);assert.equal(denied.reads(),0);
  const revoked=fixture();revoked.snapshot.authorized=false;
  assert.equal(await revoked.context.syncHealthConnect(),false);assert.equal(revoked.context.db.settings.healthConnectEnabled,false);
  assert.equal(revoked.context.db.days['2026-10-08'].steps,847,'Revocation preserves existing journal');
  const switched=fixture();switched.plugin.readSnapshot=async()=>{switched.context.session={user:{id:'other'}};return switched.snapshot;};
  assert.equal(await switched.context.syncHealthConnect(),false);assert.equal(switched.context.db.days['2026-10-08'].steps,847);
  const partial=fixture();partial.snapshot.errors=['sommeil'];
  await partial.context.syncHealthConnect();assert.equal(partial.context.db.days['2026-10-08'].steps,8305);
  assert.deepEqual(Array.from(partial.context.db.settings.healthConnectLastErrors),['sommeil']);
  const failed=fixture();failed.plugin.readSnapshot=async()=>{throw Error('read failure');};
  assert.equal(await failed.context.syncHealthConnect(),false);assert.equal(failed.context.db.days['2026-10-08'].steps,847);
  console.log('Health Connect : historique, sources, saisies manuelles, activités, poids, permissions partielles/refusées, compte et file cloud OK');
})().catch(e=>{console.error(e);process.exitCode=1;});
