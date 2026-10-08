const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync('app.js', 'utf8');
const code = source.slice(source.indexOf('  function nativeHealthKit()'), source.indexOf('  function nativeLocalNotifications()'));
function fixture() {
  const calls = [], queued = [], saved = [];
  const workouts = [{uuid:'walk-1', startDate:'2026-10-03T14:00:00-04:00', durationMinutes:30, energieType:'Marche'}];
  const plugin = {
    readSteps: async options => {calls.push(['steps',options]); return {days:[
      {date:'2026-10-07',steps:8500},{date:'2026-10-03',steps:6500},
      {date:'2026-10-02',steps:4000},{date:'2026-10-01',steps:0},
      {date:'2026-10-08',steps:9000},{date:'invalid',steps:9000},
    ]};},
    readSleep: async options => {calls.push(['sleep',options]);return {samples:[
      {stage:'asleep',startDate:'2026-10-02T23:00:00-04:00',endDate:'2026-10-03T07:00:00-04:00'},
      {stage:'deep',startDate:'2026-10-03T01:00:00-04:00',endDate:'2026-10-03T02:00:00-04:00'},
      {stage:'asleep',startDate:'2026-10-01T23:00:00-04:00',endDate:'2026-10-02T07:00:00-04:00'},
    ]};},
    readWorkouts: async options => {calls.push(['workouts',options]);return {workouts};},
  };
  const db = {settings:{appleHealthEnabled:true},days:{
    '2026-10-02':{steps:1234,sleepHours:7,activities:[]},
    '2026-10-03':{steps:0,sleepHours:null,activities:[]},
    '2026-10-07':{steps:20,sleepHours:null,activities:[]},
  }};
  const ctx = vm.createContext({window:{Capacitor:{Plugins:{HealthKit:plugin}}},db,
    session:{user:{id:'user1'}},professionalBetaMode:false,console,
    todayKey:()=> '2026-10-07', ensureDay:(db,key)=>db.days[key] ||= {activities:[]},
    normalizeActivity:x=>x, persistProfilePreference:()=>{},saveLocal:x=>saved.push(x),
    outbox:()=>queued.slice(),setOutbox:items=>{queued.splice(0,queued.length,...items);return true;},
    uid:()=>String(Math.random()),updateSyncBadge:()=>{},syncNow:()=>{},syncState:'online',
    render:()=>{},navigator:{onLine:false},alert:()=>{},
  });
  vm.runInContext(code,ctx);
  return {ctx,plugin,calls,queued,saved};
}
(async()=>{
  const f=fixture();assert.equal(await f.ctx.syncAppleHealth(),true);
  assert.equal(f.ctx.db.days['2026-10-03'].steps,6500);
  assert.equal(f.ctx.db.days['2026-10-03'].sleepHours,8,'Overlapping sleep sources count once');
  assert.equal(f.ctx.db.days['2026-10-02'].steps,1234,'Past manual steps preserved');
  assert.equal(f.ctx.db.days['2026-10-02'].sleepHours,7,'Past manual sleep preserved');
  assert.equal(f.ctx.db.days['2026-10-07'].steps,8500);
  assert.equal(f.ctx.db.days['2026-10-03'].activities.length,1);
  assert.equal(f.ctx.db.days['2026-10-01'],undefined,'No empty days created');
  assert.equal(f.ctx.db.days['2026-10-08'],undefined,'No future values imported');
  assert.equal(f.saved.length,1,'One save for the whole batch');
  assert.equal(f.queued.length,2);assert.ok(f.queued.every(x=>x._ownerUserId==='user1'));
  assert.equal(f.calls.length,3,'One native query per data type');
  await f.ctx.syncAppleHealth();assert.equal(f.ctx.db.days['2026-10-03'].activities.length,1,'No duplicate activities');
  f.ctx.db.settings.appleHealthEnabled=false;f.calls.length=0;
  assert.equal(await f.ctx.syncAppleHealth(),false);assert.equal(f.calls.length,0);
  for(const flag of ['demoMode','professionalBetaMode']){
    const g=fixture();if(flag==='demoMode')g.ctx.db.settings.demoMode=true;else g.ctx.professionalBetaMode=true;
    assert.equal(await g.ctx.syncAppleHealth(),false);assert.equal(g.calls.length,0);
  }
  const old=fixture();old.plugin.readSteps=async options=>({steps:options.daily?999999:3000});
  await old.ctx.syncAppleHealth();assert.equal(old.ctx.db.days['2026-10-07'].steps,3000,'Old bridge aggregate never assigned to today');
  assert.equal(old.ctx.db.days['2026-10-03'].steps,0);
  const switched=fixture();switched.plugin.readSleep=async()=>{switched.ctx.session={user:{id:'user2'}};return {samples:[]};};
  assert.equal(await switched.ctx.syncAppleHealth(),false);assert.equal(switched.saved.length,0);
  const failure=fixture();failure.plugin.readWorkouts=async()=>{throw Error('permission/query failure');};
  failure.ctx.console={warn:()=>{}};assert.equal(await failure.ctx.syncAppleHealth(),false);
  assert.equal(failure.saved.length,0);assert.equal(failure.ctx.db.days['2026-10-07'].steps,20);
  const dates=fixture();dates.ctx.db.days['2025-01-01']={activities:[]};
  assert.equal(dates.ctx.healthKitHistoryDates('2026-10-07')[0],'2025-01-01');
  const dst=dates.ctx.healthKitHistoryDates('2026-03-10');
  assert.equal(dst.filter(x=>x==='2026-03-08').length,1);assert.equal(dst.filter(x=>x==='2026-03-09').length,1);
  assert.equal(new Date(dates.ctx.healthKitDayEnd('2026-03-08'))-new Date(dates.ctx.healthKitDayStart('2026-03-08'))+1,23*3600000);
  console.log('Apple Santé : rattrapage, données préservées, nuits, doublons, compte, permissions, file cloud et changement d’heure OK');
})().catch(error=>{console.error(error);process.exitCode=1;});
