const DB_NAME = 'nucorre-desafios-v1';
const DB_VERSION = 1;
const STORE = 'participants';

let dbPromise = null;

function openDb() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'challengeId' });
      }
    };
  });

  return dbPromise;
}

/**
 * @typedef {object} ParticipantRecord
 * @property {string} challengeId
 * @property {string} name
 * @property {string} startDate
 * @property {string} endDate
 * @property {number} km
 * @property {Blob|null} photo
 * @property {string} updatedAt
 */

/** @returns {Promise<ParticipantRecord|null>} */
export async function loadParticipant(challengeId) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const store = tx.objectStore(STORE);
    const req = store.get(challengeId);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

/** @param {ParticipantRecord} record */
export async function saveParticipant(record) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    const payload = {
      ...record,
      updatedAt: new Date().toISOString(),
    };
    const req = store.put(payload);
    req.onsuccess = () => resolve(payload);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteParticipant(challengeId) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    const req = store.delete(challengeId);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function listParticipants() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const store = tx.objectStore(STORE);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}