const assert = require('node:assert/strict');
require('../brain-journal.js');
const analyze = global.EnergieJournalLearning.analyze;
const meal = type => ({type, description:'repas', feelingsBefore:{hunger:0}, feeling:{scores:{energy:3}}});
const db = {settings:{stepsTracking:true}, days:{}};
const original = JSON.stringify(db);
let report = analyze(db,'2026-10-07');
assert.equal(report.days,0);assert.equal(report.score,0);assert.equal(report.suggestion,'start');assert.equal(JSON.stringify(db),original);
for(let i=0;i<24;i++){
 const date = new Date(Date.UTC(2026,8,14+i,12)).toISOString().slice(0,10);
 db.days[date]={meals:['Déjeuner','Dîner','Souper'].map(meal),water:1,sleepHours:8,steps:0};
}
report=analyze(db,'2026-10-07');assert.equal(report.days,24);assert.equal(report.score,100);assert.equal(report.before,72);assert.equal(report.steps,24,'Zero steps are documented');assert.equal(report.activities,0,'No activity does not penalize coverage');assert.equal(report.weeks.length,4);assert.equal(report.weeks.at(-1).partial,true);
const before=JSON.stringify(db);analyze(db,'2026-10-07');assert.equal(JSON.stringify(db),before,'Read-only analysis');
delete db.days['2026-09-20'];report=analyze(db,'2026-10-07');assert.equal(report.days,24,'Empty dates after first entry remain in denominator');assert.equal(report.documentedDays,23);assert.ok(report.score<100);
const late={settings:{stepsTracking:false},days:{'2026-10-06':{meals:[meal('Déjeuner'),meal('Déjeuner'),meal('Collation')],water:1,sleepHours:8},'2026-10-08':{meals:[meal('Souper')]}}};
report=analyze(late,'2026-10-07');assert.equal(report.days,2,'Dates before first journal and future demo dates excluded');assert.equal(report.mealTotal,3);assert.equal(report.types[0].count,1,'Duplicate same-type meals do not inflate daily slots');assert.equal(report.before,3,'Snacks count toward feelings');assert.equal(report.stepsEnabled,false);
const waterOnly=analyze({days:{'2026-10-07':{steps:0}},settings:{stepsTracking:true}},'2026-10-07');assert.equal(waterOnly.days,1);assert.equal(waterOnly.mealTotal,0);assert.equal(waterOnly.suggestion,'start');
const fullNoSteps=JSON.parse(before);fullNoSteps.settings.stepsTracking=false;Object.values(fullNoSteps.days).forEach(day=>delete day.steps);assert.equal(analyze(fullNoSteps,'2026-10-07').score,100,'Disabled steps do not reduce score');
console.log('Portrait du Cerveau : pondération, semaines, journées vides, zéros, collations, démo et lecture seule OK');
