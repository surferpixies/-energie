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
  let active = null, restored = 0, observe, disconnected = false;
  const cancel = {focus() { this.focused = true; }}, accept = {};
  const listeners = {};
  const panel = {
    dataset: {}, isConnected: false, setAttribute() {},
    querySelector: selector => selector.includes('cancel') ? cancel : accept,
    addEventListener: (type, handler) => { listeners[type] = handler; },
    remove() { this.isConnected = false; active = null; },
    scrollIntoView() { this.scrolled = true; }
  };
  const card = {querySelector: () => active, appendChild(node) { active = node; node.isConnected = true; }};
  const button = {isConnected: true, disabled: true, closest: () => card, focus() { restored++; }};
  const context = vm.createContext({
    esc: value => value,
    document: {createElement: type => { assert.equal(type, 'section'); return panel; }, body: {}},
    MutationObserver: class {
      constructor(callback) { observe = callback; }
      observe() {}
      disconnect() { disconnected = true; }
    },
    confirm: () => { throw Error('La confirmation du navigateur ne doit pas être utilisée'); }
  });
  vm.runInContext(code, context);
  return {context, panel, button, cancel, accept, listeners,
    removeCard: () => { panel.isConnected = false; observe(); },
    restored: () => restored, disconnected: () => disconnected};
}
(async () => {
  for (const action of ['confirm', 'cancel', 'escape', 'navigation']) {
    const f = fixture();
    const pending = f.context.confirmProfessionalNoteDeletion('Cette action est irréversible.', f.button);
    assert.equal(f.panel.isConnected, true);
    assert.equal(f.panel.scrolled, true);
    assert.equal(f.cancel.focused, true);
    assert.equal(await f.context.confirmProfessionalNoteDeletion('doublon', f.button), false);
    if (action === 'confirm') f.accept.onclick();
    if (action === 'cancel') f.cancel.onclick();
    if (action === 'escape') f.listeners.keydown({key: 'Escape', preventDefault() {}});
    if (action === 'navigation') f.removeCard();
    assert.equal(await pending, action === 'confirm');
    assert.equal(f.restored(), 1);
    assert.equal(f.button.disabled, false);
    assert.equal(f.panel.isConnected, false);
    assert.equal(f.disconnected(), true);
  }
  const missing = fixture();
  assert.equal(await missing.context.confirmProfessionalNoteDeletion('sans carte'), false);
  console.log('Confirmation dans la carte : affichage, acceptation, annulation, navigation et double clic OK');
})().catch(error => { console.error(error); process.exitCode = 1; });
