import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';
import { resolve } from 'node:path';

const root = process.argv[2] || process.cwd();
const code = await readFile(resolve(root, 'service-worker.js'), 'utf8');
const storage = {};

function eventHub() {
  const listeners = [];
  return { addListener(listener) { listeners.push(listener); }, listeners };
}

function makeRuntime() {
  const onInstalled = eventHub();
  const onStartup = eventHub();
  const onMessage = eventHub();
  const action = eventHub();
  const alarms = eventHub();
  const local = {
    async get(keys) {
      if (keys === null || keys === undefined) return { ...storage };
      const list = Array.isArray(keys) ? keys : [keys];
      return Object.fromEntries(list.map((key) => [key, storage[key]]));
    },
    async set(values) { Object.assign(storage, values); },
    async setAccessLevel() {}
  };
  const chrome = {
    runtime: { onInstalled, onStartup, onMessage, getManifest: () => ({ version: '1.0.0' }) },
    action: { onClicked: action },
    alarms: { onAlarm: alarms, async create() {} },
    storage: { local },
    tabs: { async query() { return []; }, async get() { throw new Error('not used in this test'); }, async sendMessage() {} },
    windows: { async create() {}, async update() {} },
    scripting: { async executeScript() {} }
  };
  const context = vm.createContext({ chrome, console, crypto: webcrypto, fetch: globalThis.fetch, Response, setTimeout, clearTimeout, Date, Promise, String, Number, Boolean, Array, Object, Math, JSON });
  vm.runInContext(code, context, { filename: 'service-worker.js' });
  return { onMessage, context };
}

async function waitFor(predicate, timeout = 1500) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const result = await predicate();
    if (result) return result;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error('Temps d’attente dépassé.');
}

async function send(onMessage, message) {
  const listener = onMessage.listeners[0];
  if (!listener) throw new Error('Listener de message introuvable.');
  return new Promise((resolve, reject) => {
    const keepAlive = listener(message, {}, (response) => resolve(response));
    if (keepAlive !== true) reject(new Error('Le listener doit rester actif pour une réponse asynchrone.'));
  });
}

const firstWorker = makeRuntime();
const immediateSave = await send(firstWorker.onMessage, { type: 'BP_SET_CONFIG', endpoint: 'https://example.test/sync', syncToken: 'stable-sync-token-2026' });
if (!immediateSave.ok || storage.bacpilotOfficialConfig.syncToken !== 'stable-sync-token-2026') throw new Error('La configuration enregistrée au démarrage doit survivre à l’initialisation du stockage.');
await waitFor(() => storage.bacpilotOfficialState);
storage.bacpilotOfficialConfig = { endpoint: 'https://example.test/sync', syncToken: '' };
const collection = {
  collectionId: 'collection-test-001',
  status: 'completed',
  phase: 'completed',
  startedAt: '2026-08-15T12:00:00.000Z',
  observedAt: '2026-08-15T12:01:00.000Z',
  totalCandidates: 2,
  completedCandidates: 2,
  plan: [],
  errors: [],
  message: 'Collecte de test terminée.',
  items: [
    { universityId: 1, university: 'Université test', schoolId: 10, school: 'École test', programmeId: 100, programme: 'Programme test A', scholarships: 1, aid: 0, tb: 0, b: 0, ab: 0, passable: 2, total: 3, rank: null, capacity: null, applicants: null, observedAt: '2026-08-15T12:01:00.000Z' },
    { universityId: 1, university: 'Université test', schoolId: 10, school: 'École test', programmeId: 101, programme: 'Programme test B', scholarships: 1, aid: 0, tb: 0, b: 0, ab: 0, passable: 2, total: 4, rank: null, capacity: null, applicants: null, observedAt: '2026-08-15T12:01:00.000Z' }
  ]
};
const completed = await send(firstWorker.onMessage, { type: 'BP_COLLECTION_COMPLETED', state: collection });
if (!completed.ok || storage.bacpilotOfficialSyncQueue.length !== 1) throw new Error('Le lot terminé devait être placé dans la file locale.');
if (storage.bacpilotOfficialSyncQueue[0].payload.items.length !== 2) throw new Error('Les observations brutes ne sont pas intégralement conservées.');

const restartedWorker = makeRuntime();
await waitFor(() => storage.bacpilotOfficialState);
const afterRestart = await send(restartedWorker.onMessage, { type: 'BP_GET_STATE' });
if (!afterRestart.ok || afterRestart.state.collectionId !== 'collection-test-001') throw new Error('La collecte a été perdue au redémarrage du service worker.');
if (afterRestart.queue.length !== 1 || afterRestart.queue[0].payload.items.length !== 2) throw new Error('La file de synchronisation a été perdue au redémarrage du service worker.');

const existingToken = 'local-test-token';
storage.bacpilotOfficialConfig = { endpoint: 'https://example.test/sync', syncToken: existingToken };
const configResult = await send(restartedWorker.onMessage, { type: 'BP_SET_CONFIG', endpoint: 'https://example.test/sync', syncToken: null });
if (!configResult.ok || storage.bacpilotOfficialConfig.syncToken !== existingToken) throw new Error('Un champ de jeton vide ne doit pas effacer le jeton local existant.');
const invalidTokenResult = await send(restartedWorker.onMessage, { type: 'BP_SET_CONFIG', endpoint: 'https://example.test/sync', syncToken: 'jeton-é-invalide' });
if (invalidTokenResult.ok || storage.bacpilotOfficialConfig.syncToken !== existingToken || !String(invalidTokenResult.error || '').includes('ASCII')) throw new Error('Un jeton Unicode doit être refusé avant toute requête HTTP.');

console.log('Test de reprise après fermeture et validation du jeton : OK');
