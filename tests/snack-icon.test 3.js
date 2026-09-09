const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const appPath = path.join(__dirname, '..', 'app.js');
const source = fs.readFileSync(appPath, 'utf8');
const match = source.match(/function snackIconForText\(text\)\{[\s\S]*?\n\}/);
if (!match) {
  throw new Error('Unable to find snackIconForText in app.js');
}

const context = { console };
vm.createContext(context);
vm.runInContext(match[0], context);

const cases = [
  ['melon d\'eau', '🍉'],
  ['pastèque', '🍉'],
  ['craquelin + fromage de chèvre et brie', '🧀'],
  ['chips', '🥨'],
  ['yaourt grec', '🥣'],
  ['brocoli', '🥗']
];

for (const [text, expected] of cases) {
  const actual = context.snackIconForText(text);
  assert.strictEqual(actual, expected, `${text} -> ${actual} (expected ${expected})`);
}

console.log('snack icon tests passed');
