// Journal IndexedDB storage — stage 1. No network operations.
(() => {
  "use strict";
  const NAME = "energie-journal-cache-v1";
  const STORE = "journals";
  let openPromise = null;
  function open() {
    if (!globalThis.indexedDB) return Promise.reject(new Error("IndexedDB indisponible"));
    if (openPromise) return openPromise;
    openPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(NAME, 1);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(STORE))
          request.result.createObjectStore(STORE);
      };
      request.onsuccess = () => {
        const database = request.result;
        database.onversionchange = () => database.close();
        resolve(database);
      };
      request.onerror = () => reject(request.error || new Error("Ouverture IndexedDB impossible"));
      request.onblocked = () => reject(new Error("IndexedDB bloquée par un autre onglet"));
    }).catch(error => { openPromise = null; throw error; });
    return openPromise;
  }
  async function read(owner) {
    if (!owner) return null;
    const database = await open();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE, "readonly");
      const request = transaction.objectStore(STORE).get(owner);
      request.onsuccess = () => resolve(typeof request.result === "string" ? request.result : null);
      request.onerror = () => reject(request.error || new Error("Lecture IndexedDB impossible"));
      transaction.onabort = () => reject(transaction.error || new Error("Lecture IndexedDB interrompue"));
    });
  }
  async function write(owner, snapshot) {
    if (!owner || typeof snapshot !== "string") throw new Error("Journal IndexedDB invalide");
    const database = await open();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE, "readwrite");
      transaction.objectStore(STORE).put(snapshot, owner);
      transaction.oncomplete = () => resolve(true);
      transaction.onerror = () => reject(transaction.error || new Error("Écriture IndexedDB impossible"));
      transaction.onabort = () => reject(transaction.error || new Error("Écriture IndexedDB interrompue"));
    });
  }
  async function remove(owner) {
    if (!owner) return false;
    const database = await open();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE, "readwrite");
      transaction.objectStore(STORE).delete(owner);
      transaction.oncomplete = () => resolve(true);
      transaction.onerror = () => reject(transaction.error || new Error("Suppression IndexedDB impossible"));
      transaction.onabort = () => reject(transaction.error || new Error("Suppression IndexedDB interrompue"));
    });
  }
  window.EnergieJournalIndexedDB = Object.freeze({ read, write, remove });
})();
