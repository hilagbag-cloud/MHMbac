import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { resolve } from 'node:path';

const root = process.argv[2] || process.cwd();
const code = await readFile(resolve(root, 'console.js'), 'utf8');
const ids = [
  'actionFeedback', 'collectionStatus', 'collectionMessage', 'collectionProgress', 'collectionMeta',
  'collectionDetails', 'startScan', 'resumeScan', 'cancelScan', 'syncNow', 'exportData', 'refresh',
  'queueBadge', 'queueList', 'syncStatus', 'syncMessage', 'configState', 'configMessage', 'autoRefreshEnabled', 'autoRefreshMinutes', 'saveAutoRefresh', 'autoRefreshState',
  'activationCode', 'enrollCollector', 'enrollmentMessage', 'syncEndpoint', 'syncToken', 'saveConfig', 'testConfig', 'diagnosticCount', 'diagnosticList', 'clearData'
];
const nodes = Object.fromEntries(ids.map((id) => [id, {
  id, textContent: '', className: '', innerHTML: '', value: '', checked: false, disabled: false, listeners: {},
  addEventListener(type, callback) { this.listeners[type] = callback; }, click() { this.clicked = true; }
}]));
const statePayload = {
  ok: true,
  state: { status: 'idle', totalCandidates: 0, completedCandidates: 0, items: [], errors: [], updatedAt: new Date().toISOString() },
  queue: [],
  config: { endpoint: 'https://example.test/sync', configured: true, authMode: 'collector', collectorId: 'collector-test', tokenState: 'enrolled', verificationStatus: 'verified', verificationMessage: 'Collecteur validé et serveur prêt pour la collecte.', readyForScan: true, autoRefresh: { enabled: false, periodMinutes: 15 } },
  diagnostics: []
};
const sent = [];
const chrome = {
  runtime: { async sendMessage(message) {
    sent.push(message.type);
    if (message.type === 'BP_GET_STATE') return statePayload;
    if (message.type === 'BP_ENROLL_COLLECTOR') return { ok: true, collectorId: 'collector-test', validation: { ok: true, authMode: 'collector' } };
    if (message.type === 'BP_SET_CONFIG') {
      statePayload.config.tokenState = 'ready';
      statePayload.config.verificationStatus = 'invalid';
      statePayload.config.verificationMessage = 'Jeton refusé (401) dans cette simulation.';
      return { ok: true, validation: { ok: false, message: 'Jeton refusé (401) dans cette simulation.' } };
    }
    if (message.type === 'BP_TEST_CONFIG') return { ok: true, validation: { ok: true, authMode: 'collector' } };
    if (message.type === 'BP_SET_AUTO_REFRESH') return { ok: true, autoRefresh: { enabled: Boolean(message.enabled), periodMinutes: Number(message.periodMinutes) } };
    if (message.type === 'BP_SYNC_NOW') return { ok: true, sent: 0, pending: 0 };
    return { ok: true };
  } },
  storage: { onChanged: { addListener() {} } }
};
const document = {
  getElementById(id) { return nodes[id] || null; },
  createElement() { return { click() {} }; }
};
const context = vm.createContext({
  chrome, document, console, Intl, Date, String, Number, Boolean, Array, Object, JSON, Promise,
  URL: { createObjectURL: () => 'blob:test', revokeObjectURL() {} }, Blob, confirm: () => true,
  setTimeout, clearTimeout
});
vm.runInContext(code, context, { filename: 'console.js' });
await new Promise((resolve) => setTimeout(resolve, 25));
for (const id of ['refresh', 'enrollCollector', 'saveConfig', 'testConfig', 'saveAutoRefresh', 'syncNow', 'startScan', 'resumeScan', 'exportData', 'clearData']) {
  if (typeof nodes[id].listeners.click !== 'function') throw new Error(`Bouton non relié : ${id}`);
}
if (nodes.startScan.disabled) throw new Error('Le scan devrait être disponible après une prévalidation réussie.');
if (!nodes.configState.textContent.includes('validé')) throw new Error('Le statut de prévalidation n’est pas rendu.');
nodes.syncToken.value = 'stable-sync-token-2026';
await nodes.saveConfig.listeners.click();
await new Promise((resolve) => setTimeout(resolve, 25));
if (!sent.includes('BP_SET_CONFIG') || !nodes.actionFeedback.textContent.includes('Jeton refusé')) throw new Error('Le refus du prévol n’est pas rendu correctement.');
if (nodes.testConfig.disabled) throw new Error('Le bouton de prévol doit rester cliquable après un 401.');
await nodes.testConfig.listeners.click();
await new Promise((resolve) => setTimeout(resolve, 25));
if (!sent.includes('BP_TEST_CONFIG') || !nodes.actionFeedback.textContent.includes('Collecte autorisée')) throw new Error('Le bouton de test ne produit pas le retour attendu.');
nodes.autoRefreshEnabled.checked = true;
nodes.autoRefreshMinutes.value = '10';
await nodes.saveAutoRefresh.listeners.click();
await new Promise((resolve) => setTimeout(resolve, 25));
if (!sent.includes('BP_SET_AUTO_REFRESH') || !nodes.actionFeedback.textContent.includes('activée toutes les 10 minutes')) throw new Error('La cadence automatique n’est pas enregistrée correctement.');
console.log('Test interface console : OK');
