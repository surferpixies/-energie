const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('app.js', 'utf8');
const start = source.indexOf('  function confirmProfessionalNoteDeletion');
const end = source.indexOf('  const professionalNoteDeletes', start);
assert.ok(start >= 0 && end > start, 'La fonction de confirmation existe');
const code = source.slice(start, end);

(async () => {
  for (const accepted of [true, false]) {
    const messages = [];
    const context = vm.createContext({
      confirm: message => { messages.push(message); return accepted; }
    });
    vm.runInContext(code, context);
    const result = await context.confirmProfessionalNoteDeletion('Cette action est irréversible.');
    assert.equal(result, accepted);
    assert.equal(messages.length, 1);
    assert.match(messages[0], /Supprimer la note/);
    assert.match(messages[0], /Cette action est irréversible/);
  }
  console.log('Confirmation native des notes : accepter et annuler OK');
})().catch(error => { console.error(error); process.exitCode = 1; });
