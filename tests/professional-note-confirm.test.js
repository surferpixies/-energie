const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.existsSync('professional-note-confirm-function.js')
  ? fs.readFileSync('professional-note-confirm-function.js', 'utf8')
  : fs.readFileSync('app.js', 'utf8');
const start = source.indexOf('  function confirmProfessionalNoteDeletion');
const end = source.indexOf('  const professionalNoteDeletes', start);
const code = source.slice(start, end < 0 ? undefined : end);
function fixture() {
  let active = null, restored = 0;
  const cancel = {focus() { this.focused = true; }}, accept = {};
  const listeners = {};
  const dialog = {
    style: {}, querySelector: selector => selector.includes('cancel') ? cancel : accept,
    addEventListener: (type, handler) => { listeners[type] = handler; },
    showModal() { this.open = true; }, close() { this.open = false; listeners.close(); },
    remove() { active = null; }
  };
  const context = vm.createContext({
    esc: value => value,
    document: {
      activeElement: {isConnected: true, focus() { restored++; }},
      getElementById: () => active,
      createElement: type => { assert.equal(type, 'dialog'); return dialog; },
      body: {appendChild: node => { active = node; }}
    },
    confirm: () => { throw Error('La confirmation du navigateur ne doit pas être utilisée'); }
  });
  vm.runInContext(code, context);
  return {context, dialog, cancel, accept, listeners, restored: () => restored};
}
(async () => {
  for (const action of ['confirm', 'cancel', 'escape', 'close']) {
    const f = fixture();
    const pending = f.context.confirmProfessionalNoteDeletion('Cette action est irréversible.');
    assert.equal(f.dialog.open, true);
    assert.equal(f.cancel.focused, true);
    assert.equal(await f.context.confirmProfessionalNoteDeletion('doublon'), false);
    if (action === 'confirm') f.accept.onclick();
    if (action === 'cancel') f.cancel.onclick();
    if (action === 'escape') f.listeners.cancel({preventDefault() {}});
    if (action === 'close') f.dialog.close();
    assert.equal(await pending, action === 'confirm');
    assert.equal(f.restored(), 1);
    assert.equal(f.dialog.open, false);
  }
  console.log('Confirmation dans l’app : affichage, acceptation, annulation, fermeture et double clic OK');
})().catch(error => { console.error(error); process.exitCode = 1; });
