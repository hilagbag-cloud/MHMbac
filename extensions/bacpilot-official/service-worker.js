const STORAGE_KEYS = Object.freeze({
  state: 'bacpilotOfficialState',
  queue: 'bacpilotOfficialSyncQueue',
  config: 'bacpilotOfficialConfig',
  diagnostics: 'bacpilotOfficialDiagnostics',
  sourceTabId: 'bacpilotOfficialSourceTabId'
});

const DEFAULT_CONFIG = Object.freeze({
  endpoint: 'https://uxdfrnogiuefoqjpobpf.supabase.co/functions/v1/mhmbac-sync',
  syncToken: ''
});

const RETRY_ALARM = 'bacpilot-official-retry';
const RETRY_PERIOD_MINUTES = 5;
const CHUNK_SIZE = 40;
const MAX_DIAGNOSTICS = 40;
const OFFICIAL_PAGE_PREFIX = 'https://apresmonbac.bj/Home/choice';
const SYNC_TOKEN_PATTERN = /^[A-Za-z0-9._~-]{16,}$/;
const INVALID_SYNC_TOKEN_MESSAGE = 'Jeton invalide : utilisez au moins 16 caractères ASCII (lettres, chiffres, ., _, ~ ou -), sans espace ni accent.';

const nowIso = () => new Date().toISOString();
const isValidSyncToken = (value) => typeof value === 'string' && SYNC_TOKEN_PATTERN.test(value);
const newId = (prefix) => `${prefix}-${crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`}`;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let storageInitialization = null;

async function initStorage() {
  const current = await chrome.storage.local.get([STORAGE_KEYS.state, STORAGE_KEYS.queue, STORAGE_KEYS.config, STORAGE_KEYS.diagnostics]);
  await chrome.storage.local.set({
    [STORAGE_KEYS.state]: current[STORAGE_KEYS.state] || {
      status: 'idle',
      collectionId: null,
      observedAt: null,
      startedAt: null,
      updatedAt: nowIso(),
      totalCandidates: 0,
      completedCandidates: 0,
      items: [],
      errors: [],
      message: 'Prête. Ouvrez le portail officiel puis lancez une collecte volontaire.'
    },
    [STORAGE_KEYS.queue]: current[STORAGE_KEYS.queue] || [],
    [STORAGE_KEYS.config]: { ...DEFAULT_CONFIG, ...(current[STORAGE_KEYS.config] || {}) },
    [STORAGE_KEYS.diagnostics]: current[STORAGE_KEYS.diagnostics] || []
  });
  await chrome.alarms.create(RETRY_ALARM, { periodInMinutes: RETRY_PERIOD_MINUTES });
  await chrome.storage.local.setAccessLevel({ accessLevel: 'TRUSTED_CONTEXTS' });
}

function ensureStorage() {
  if (!storageInitialization) {
    storageInitialization = initStorage().catch((error) => {
      storageInitialization = null;
      throw error;
    });
  }
  return storageInitialization;
}

async function getState() {
  await ensureStorage();
  const data = await chrome.storage.local.get([STORAGE_KEYS.state, STORAGE_KEYS.queue, STORAGE_KEYS.config, STORAGE_KEYS.diagnostics, STORAGE_KEYS.sourceTabId]);
  const syncToken = data[STORAGE_KEYS.config]?.syncToken || '';
  const tokenState = !syncToken ? 'missing' : (isValidSyncToken(syncToken) ? 'ready' : 'invalid');
  return {
    state: data[STORAGE_KEYS.state],
    queue: data[STORAGE_KEYS.queue] || [],
    config: { endpoint: data[STORAGE_KEYS.config]?.endpoint || DEFAULT_CONFIG.endpoint, configured: tokenState === 'ready', tokenState },
    diagnostics: data[STORAGE_KEYS.diagnostics] || [],
    sourceTabId: data[STORAGE_KEYS.sourceTabId] || null
  };
}

async function updateState(patch) {
  const { [STORAGE_KEYS.state]: current } = await chrome.storage.local.get(STORAGE_KEYS.state);
  const next = { ...(current || {}), ...patch, updatedAt: nowIso() };
  await chrome.storage.local.set({ [STORAGE_KEYS.state]: next });
  return next;
}

async function addDiagnostic(level, stage, message, details = {}) {
  const { [STORAGE_KEYS.diagnostics]: current = [] } = await chrome.storage.local.get(STORAGE_KEYS.diagnostics);
  const entry = { id: newId('diag'), time: nowIso(), level, stage, message, ...details };
  await chrome.storage.local.set({ [STORAGE_KEYS.diagnostics]: [entry, ...current].slice(0, MAX_DIAGNOSTICS) });
  return entry;
}

async function openConsole() {
  const consoleUrl = chrome.runtime.getURL('console.html');
  const existing = await chrome.tabs.query({ url: consoleUrl });
  if (existing[0]?.windowId) {
    await chrome.windows.update(existing[0].windowId, { focused: true });
    return;
  }
  await chrome.windows.create({ url: consoleUrl, type: 'popup', width: 980, height: 760, focused: true });
}

async function findSourceTab(preferredTabId = null) {
  if (preferredTabId) {
    try {
      const tab = await chrome.tabs.get(preferredTabId);
      if (tab.url?.startsWith(OFFICIAL_PAGE_PREFIX)) return tab;
    } catch (_) {}
  }
  const stored = await chrome.storage.local.get(STORAGE_KEYS.sourceTabId);
  if (stored[STORAGE_KEYS.sourceTabId]) {
    try {
      const tab = await chrome.tabs.get(stored[STORAGE_KEYS.sourceTabId]);
      if (tab.url?.startsWith(OFFICIAL_PAGE_PREFIX)) return tab;
    } catch (_) {}
  }
  const matchingTabs = await chrome.tabs.query({ url: `${OFFICIAL_PAGE_PREFIX}*` });
  if (!matchingTabs.length) throw new Error('Ouvrez la page des choix sur apresmonbac.bj et connectez-vous vous-même avant de lancer la collecte.');
  const active = matchingTabs.find((tab) => tab.active) || matchingTabs[0];
  await chrome.storage.local.set({ [STORAGE_KEYS.sourceTabId]: active.id });
  return active;
}

async function sendToContent(tabId, message) {
  try {
    return await chrome.tabs.sendMessage(tabId, message);
  } catch (error) {
    const detail = String(error?.message || error);
    if (!detail.includes('Receiving end does not exist')) throw error;
    await chrome.scripting.executeScript({ target: { tabId }, files: ['content.js'] });
    await sleep(250);
    return chrome.tabs.sendMessage(tabId, message);
  }
}

function toBatches(state) {
  const items = Array.isArray(state.items) ? state.items : [];
  const collectionId = state.collectionId || newId('collection');
  const totalParts = Math.ceil(items.length / CHUNK_SIZE);
  return Array.from({ length: totalParts }, (_, index) => ({
    queueId: `${collectionId}-${index + 1}`,
    collectionId,
    attempts: 0,
    createdAt: nowIso(),
    nextAttemptAt: Date.now(),
    payload: {
      batchId: newId('batch'),
      part: index + 1,
      totalParts,
      source: 'bacpilot_chrome_official',
      extensionVersion: chrome.runtime.getManifest().version,
      schemaVersion: 'bacpilot-observation.v1',
      observedAt: state.observedAt || nowIso(),
      items: items.slice(index * CHUNK_SIZE, (index + 1) * CHUNK_SIZE)
    }
  }));
}

async function enqueueCollection(state) {
  const { [STORAGE_KEYS.queue]: current = [] } = await chrome.storage.local.get(STORAGE_KEYS.queue);
  const alreadyQueued = current.some((entry) => entry.collectionId === state.collectionId);
  if (alreadyQueued || !Array.isArray(state.items) || !state.items.length) return current;
  const next = [...current, ...toBatches(state)];
  await chrome.storage.local.set({ [STORAGE_KEYS.queue]: next });
  await addDiagnostic('info', 'queue', `${state.items.length} observation(s) conservée(s) dans ${next.length - current.length} lot(s) avant synchronisation.`, { collectionId: state.collectionId });
  return next;
}

async function sendBatch(entry, config) {
  if (!config.syncToken) return { ok: false, permanent: true, stage: 'configuration', message: 'Synchronisation en attente : configurez le jeton de collecte dans la console officielle.' };
  if (!isValidSyncToken(config.syncToken)) return { ok: false, permanent: true, stage: 'configuration', message: INVALID_SYNC_TOKEN_MESSAGE };
  let lastMessage = 'Échec réseau';
  let lastStatus = null;
  let responsePreview = '';
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);
    try {
      const response = await fetch(config.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-mhm-sync-token': config.syncToken },
        body: JSON.stringify(entry.payload),
        signal: controller.signal
      });
      lastStatus = response.status;
      const raw = await response.text();
      responsePreview = raw.slice(0, 280);
      let body = {};
      try { body = raw ? JSON.parse(raw) : {}; } catch (_) {}
      if (response.ok && body.ok && Number(body.received) === entry.payload.items.length) return { ok: true, httpStatus: response.status, responsePreview, attempts: attempt };
      if (response.status === 401) return { ok: false, permanent: true, stage: 'authentication', httpStatus: response.status, responsePreview, message: 'Jeton de collecte refusé. Vérifiez la configuration dans la console.' };
      lastMessage = body.error || `Accusé serveur incomplet (HTTP ${response.status}).`;
    } catch (error) {
      lastMessage = error?.name === 'AbortError' ? 'Délai réseau dépassé.' : String(error?.message || 'Échec réseau');
    } finally { clearTimeout(timeout); }
    if (attempt < 3) await sleep(700 * (2 ** (attempt - 1)));
  }
  return { ok: false, permanent: false, stage: lastStatus ? 'server_response' : 'network', httpStatus: lastStatus, responsePreview, message: lastMessage };
}

let flushing = false;
async function flushQueue(trigger = 'manual') {
  if (flushing) return { skipped: true, reason: 'already_running' };
  flushing = true;
  try {
    await ensureStorage();
    const data = await chrome.storage.local.get([STORAGE_KEYS.queue, STORAGE_KEYS.config]);
    let queue = data[STORAGE_KEYS.queue] || [];
    const config = { ...DEFAULT_CONFIG, ...(data[STORAGE_KEYS.config] || {}) };
    let sent = 0;
    for (const entry of queue) {
      if (entry.nextAttemptAt && entry.nextAttemptAt > Date.now()) continue;
      const result = await sendBatch(entry, config);
      if (result.ok) {
        sent += entry.payload.items.length;
        queue = queue.filter((candidate) => candidate.queueId !== entry.queueId);
        await chrome.storage.local.set({ [STORAGE_KEYS.queue]: queue });
        await addDiagnostic('success', 'sync', `${entry.payload.items.length} observation(s) confirmée(s) par BacPilot.`, { queueId: entry.queueId, httpStatus: result.httpStatus });
        continue;
      }
      const attempts = Number(entry.attempts || 0) + 1;
      const waitMs = result.permanent ? 60 * 60 * 1000 : Math.min(5 * 60 * 1000, 2000 * (2 ** Math.min(attempts, 7)));
      entry.attempts = attempts;
      entry.lastError = result.message;
      entry.lastStage = result.stage;
      entry.lastHttpStatus = result.httpStatus ?? null;
      entry.responsePreview = result.responsePreview || '';
      entry.nextAttemptAt = Date.now() + waitMs;
      await chrome.storage.local.set({ [STORAGE_KEYS.queue]: queue });
      await addDiagnostic(result.permanent ? 'warning' : 'error', result.stage || 'sync', result.message, { queueId: entry.queueId, attempts, nextAttemptAt: new Date(entry.nextAttemptAt).toISOString(), httpStatus: entry.lastHttpStatus });
      if (result.permanent) break;
    }
    const remaining = (await chrome.storage.local.get(STORAGE_KEYS.queue))[STORAGE_KEYS.queue] || [];
    await updateState({ lastSyncAt: nowIso(), syncMessage: remaining.length ? `${remaining.length} lot(s) restent conservés localement.` : 'Toutes les observations en attente sont confirmées par BacPilot.' });
    return { sent, pending: remaining.length, trigger };
  } finally { flushing = false; }
}

async function startScan(tabId = null) {
  const tab = await findSourceTab(tabId);
  const response = await sendToContent(tab.id, { type: 'BP_START_COLLECTION' });
  if (!response?.ok) throw new Error(response?.error || 'La collecte ne peut pas démarrer.');
  return response;
}

async function resumeScan(tabId = null) {
  const tab = await findSourceTab(tabId);
  const snapshot = await getState();
  const response = await sendToContent(tab.id, { type: 'BP_RESUME_COLLECTION', state: snapshot.state });
  if (!response?.ok) throw new Error(response?.error || 'La reprise ne peut pas démarrer.');
  return response;
}

chrome.runtime.onInstalled.addListener(() => { void ensureStorage(); });
chrome.runtime.onStartup.addListener(() => { void ensureStorage(); });
chrome.alarms.onAlarm.addListener((alarm) => { if (alarm.name === RETRY_ALARM) void ensureStorage().then(() => flushQueue('scheduled_retry')); });
chrome.action.onClicked.addListener((tab) => {
  if (tab?.url?.startsWith(OFFICIAL_PAGE_PREFIX)) void chrome.storage.local.set({ [STORAGE_KEYS.sourceTabId]: tab.id });
  void openConsole();
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const run = async () => {
    await ensureStorage();
    switch (message?.type) {
      case 'BP_SOURCE_READY':
        if (sender.tab?.id) await chrome.storage.local.set({ [STORAGE_KEYS.sourceTabId]: sender.tab.id });
        return { ok: true };
      case 'BP_GET_STATE':
        return { ok: true, ...(await getState()) };
      case 'BP_START_SCAN':
        return { ok: true, ...(await startScan(message.tabId || null)) };
      case 'BP_RESUME_SCAN':
        return { ok: true, ...(await resumeScan(message.tabId || null)) };
      case 'BP_CANCEL_SCAN': {
        const tab = await findSourceTab(message.tabId || null);
        await sendToContent(tab.id, { type: 'BP_CANCEL_COLLECTION' });
        return { ok: true };
      }
      case 'BP_SYNC_NOW':
        return { ok: true, ...(await flushQueue('manual')) };
      case 'BP_SET_CONFIG': {
        const current = (await chrome.storage.local.get(STORAGE_KEYS.config))[STORAGE_KEYS.config] || DEFAULT_CONFIG;
        const suppliedToken = message.syncToken === null || message.syncToken === undefined ? current.syncToken : String(message.syncToken).trim();
        if (suppliedToken && !isValidSyncToken(suppliedToken)) return { ok: false, configured: Boolean(current.syncToken), error: INVALID_SYNC_TOKEN_MESSAGE };
        const next = { ...current, endpoint: String(message.endpoint || DEFAULT_CONFIG.endpoint).trim(), syncToken: suppliedToken };
        await chrome.storage.local.set({ [STORAGE_KEYS.config]: next });
        await addDiagnostic('info', 'configuration', next.syncToken ? 'Configuration de synchronisation enregistrée localement.' : 'Jeton de synchronisation retiré ; les lots restent conservés localement.');
        return { ok: true, configured: Boolean(next.syncToken) };
      }
      case 'BP_CLEAR_LOCAL_DATA':
        await chrome.storage.local.set({ [STORAGE_KEYS.state]: { status: 'idle', collectionId: null, observedAt: null, startedAt: null, updatedAt: nowIso(), totalCandidates: 0, completedCandidates: 0, items: [], errors: [], message: 'Données locales effacées par l’utilisateur.' }, [STORAGE_KEYS.queue]: [] });
        await addDiagnostic('info', 'local_data', 'Données de collecte et lots en attente effacés par l’utilisateur.');
        return { ok: true };
      case 'BP_COLLECTION_STARTED':
        await updateState({ ...message.state, status: 'running' });
        return { ok: true };
      case 'BP_COLLECTION_CHECKPOINT':
        await updateState({ ...message.state, status: message.state?.status || 'running' });
        return { ok: true };
      case 'BP_COLLECTION_COMPLETED': {
        const state = await updateState({ ...message.state, status: 'completed' });
        await enqueueCollection(state);
        return { ok: true, ...(await flushQueue('collection_completed')) };
      }
      case 'BP_COLLECTION_FAILED':
        await updateState({ ...message.state, status: 'paused', message: message.error || 'Collecte interrompue. Les progrès sont conservés.' });
        await addDiagnostic('warning', 'collection', message.error || 'Collecte interrompue ; reprise possible depuis la console.');
        return { ok: true };
      default:
        return { ok: false, error: 'Message non reconnu.' };
    }
  };
  run().then(sendResponse).catch(async (error) => {
    await addDiagnostic('error', 'runtime', String(error?.message || error));
    sendResponse({ ok: false, error: String(error?.message || error) });
  });
  return true;
});

void ensureStorage();
