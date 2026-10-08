// Exécute le vrai lecteur de dates Swift avec les dates transmises par JavaScript.
const fs = require('node:fs');
const vm = require('node:vm');
const os = require('node:os');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const assert = require('node:assert/strict');
const app = fs.readFileSync('app.js','utf8');
const ctx = vm.createContext({});
vm.runInContext(app.slice(app.indexOf('  function healthKitDayStart('), app.indexOf('  function healthKitHistoryDates(')),ctx);
const dates = [ctx.healthKitDayStart('2026-04-10'),ctx.healthKitDayEnd('2026-10-07'),
  ctx.healthKitDayStart('2026-09-16'),ctx.healthKitDayEnd('2026-09-20'),
  ctx.healthKitDayStart('2026-03-08'),ctx.healthKitDayEnd('2026-03-08'),
  '2026-09-16T00:00:00-04:00','2026-09-20T23:59:59Z'];
const native = fs.readFileSync('ios/App/App/HealthKitPlugin.swift','utf8');
const start = native.indexOf('    private func parseHealthKitDate(');
assert.ok(start>=0);
const open=native.indexOf('{',start);let depth=1,end=open+1;
while(depth&&end<native.length){if(native[end]==='{')depth++;if(native[end]==='}')depth--;end++;}
const parser=native.slice(start,end).replace('private func','func');
const baseline='let legacyFormatter = ISO8601DateFormatter()\nlet legacyDates = '+JSON.stringify(dates)+'\nprint(\"Ancien lecteur : \\(legacyDates.filter { legacyFormatter.date(from: $0) == nil }.count) dates rejetées\")\n';
const script='import Foundation\n'+parser+'\n'+baseline+dates.map((value,index)=>
  `guard let date${index} = parseHealthKitDate(${JSON.stringify(value)}) else { fatalError("Date rejected: ${value}") }\nassert(abs(date${index}.timeIntervalSince1970 - ${Date.parse(value)/1000}) < 0.001)\n`
).join('')+'assert(parseHealthKitDate("invalid") == nil)\nprint("Dates Santé : début et fin historiques, millisecondes, fuseaux et changement d’heure OK")\n';
const available=spawnSync('swift',['--version'],{encoding:'utf8'});
if(available.error?.code==='ENOENT'){
  console.log('Test Swift non exécuté : nécessite le Mac avec Xcode. Lancer TZ=America/Toronto node tests/healthkit-date-parsing.test.js sur le Mac.');
  process.exit(0);
}
assert.equal(available.status,0,available.stderr);
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'energie-health-dates-'));
try{
  const file=path.join(temp,'dates.swift');fs.writeFileSync(file,script);
  const result=spawnSync('swift',[file],{encoding:'utf8'});
  assert.equal(result.status,0,result.stderr||result.stdout);
  console.log(result.stdout.trim());
}finally{fs.rmSync(temp,{recursive:true,force:true});}
