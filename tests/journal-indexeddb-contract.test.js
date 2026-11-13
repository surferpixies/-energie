const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const entries = new Map();
const defer = (fn) => Promise.resolve().then(fn);
const database = {
  objectStoreNames: { contains: () => false },
  createObjectStore: () => {},
  close: () => {},
  transaction() {
    const tx = {};
    tx.objectStore = () => ({
      get(key) {
        const request = {};
        defer(() => {
          request.result = entries.get(key);
          request.onsuccess?.();
        });
        return request;
      },
      put(value, key) {
        defer(() => {
          entries.set(key, value);
          tx.oncomplete?.();
        });
      },
      delete(key) {
        defer(() => {
          entries.delete(key);
          tx.oncomplete?.();
        });
      },
    });
    return tx;
  },
};
const indexedDB = {
  open() {
    const request = { result: database };
    defer(() => {
      request.onupgradeneeded?.();
      request.onsuccess?.();
    });
    return request;
  },
};
const context = { window: {}, indexedDB };
vm.createContext(context);
vm.runInContext(
  fs.readFileSync(path.join(__dirname, "..", "journal-indexeddb.js"), "utf8"),
  context,
);
const store = context.window.EnergieJournalIndexedDB;

(async () => {
  assert.equal(await store.read("missing"), null);
  await store.write("user-a", JSON.stringify({ days: { "2026-11-12": { meals: [1] } } }));
  await store.write("user-b", JSON.stringify({ days: { "2026-11-11": { meals: [2] } } }));
  assert.match(await store.read("user-a"), /2026-11-12/);
  assert.doesNotMatch(await store.read("user-b"), /2026-11-12/);
  await store.remove("user-a");
  assert.equal(await store.read("user-a"), null);
  assert.match(await store.read("user-b"), /2026-11-11/);
  console.log("JOURNAL_INDEXEDDB_CONTRACT PASS");
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
