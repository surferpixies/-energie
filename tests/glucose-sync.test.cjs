// Run with: node tests/glucose-sync.test.cjs
// No Supabase credentials or user data required.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const source = fs.readFileSync("app.js", "utf8");
const start = source.indexOf("  function mergeGlucoseRecords(");
const end = source.indexOf("  async function syncNowPass()", start);
assert(start >= 0 && end > start, "Glucose merge function not found");
const context = vm.createContext({});
const merge = vm.runInContext(source.slice(start, end) + "\nmergeGlucoseRecords;", context);
const at = t => "2026-11-01T" + t + "Z";
const a = { id:"a", value:5, time:"08:00", context:"fasting", updatedAt:at("10:00:00") };
const b = { id:"b", value:6, time:"12:00", context:"after", updatedAt:at("11:00:00") };
const newer = {...a, value:7, updatedAt:at("12:00:00")};
assert.equal(merge([], [a,b], {}, {}).readings.length,2,"Recover cloud-only readings");
assert.equal(merge([a],[b],{},{}).readings.length,2,"Merge independent entries");
assert.equal(merge([a],[newer],{},{}).readings[0].value,7,"Newest edit wins");
assert.equal(merge([a],[a],{a:at("12:30:00")},{}).readings.length,0,"Local delete wins");
assert.equal(merge([a],[a],{},{a:at("12:30:00")}).readings.length,0,"Remote delete wins");
assert.equal(merge([{id:"a",value:3}], [newer], {}, {}).readings[0].value,7,"Versioned reading wins over legacy");
assert.equal(merge([newer],[a],{a:at("11:30:00")},{}).readings[0].value,7,"Re-added version wins over old tombstone");
console.log("7 glucose merge scenarios passed.");
console.warn("NOT TESTED: concurrent Supabase day writes and real iOS/Web sync.");
