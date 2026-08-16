const STORAGE_KEYS = Object.freeze({
  state: 'bacpilotOfficialState',
  queue: 'bacpilotOfficialSyncQueue',
  config: 'bacpilotOfficialConfig',
  diagnostics: 'bacpilotOfficialDiagnostics',
  sourceTabId: 'bacpilotOfficialSourceTabId'
});

const DEFAULT_CONFIG = Object.freeze({
  endpoint: 'https://uxdfrnogiuefoqjpobpf.supabase.co/functions/v1/mhmbac-sync',
  syncToken: '',
  collectorId: '',
  collectorToken: '',
  verification: { status: 'unverified', checkedAt: null, message: 'Enrôlez cet appareil avec un code à usage unique.' },
  autoRefresh: { enabled: false, periodMinutes: 15 }
});

const RETRY_ALARM = 'bacpilot-official-retry';
const AUTO_REFRESH_ALARM = 'bacpilot-official-auto-refresh';
const RETRY_PERIOD_MINUTES = 5;
const DEFAULT_AUTO_REFRESH_MINUTES = 15;
const MIN_AUTO_REFRESH_MINUTES = 10;
const CHUNK_SIZE = 40;
const MAX_DIAGNOSTICS = 60;
const OFFICIAL_PAGE_PREFIX = 'https://apresmonbac.bj/Home/choice';
const INVALID_SYNC_TOKEN_MESSAGE = 'Jeton requis : saisissez une valeur non vide avant la synchronisation.';

const nowIso = () => new Date().toISOString();
const isValidSyncToken = (value) => typeof value === 'string' && value.trim().length > 0;
const newId = (prefix) => `${prefix}-${crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`}`;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function normalizeAutoRefresh(value) {
  const raw = value && typeof value === 'object' ? value : {};
  const requestedPeriod = Number(raw.periodMinutes);
  return {
    enabled: Boolean(raw.enabled),
    periodMinutes: Number.isFinite(requestedPeriod) ? Math.max(MIN_AUTO_REFRESH_MINUTES, Math.round(requestedPeriod)) : DEFAULT_AUTO_REFRESH_MINUTES,
  };
}

async function ensureAlarms(config = DEFAULT_CONFIG) {
  await chrome.alarms.create(RETRY_ALARM, { periodInMinutes: RETRY_PERIOD_MINUTES });
  const autoRefresh = normalizeAutoRefresh(config.autoRefresh);
  if (autoRefresh.enabled) {
    await chrome.alarms.create(AUTO_REFRESH_ALARM, { periodInMinutes: autoRefresh.periodMinutes });
  } else {
    await chrome.alarms.clear(AUTO_REFRESH_ALARM);
  }
}

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
      confirmedObservationKeys: [],
      message: 'Prête. Ouvrez le portail officiel puis lancez une collecte volontaire.'
    },
    [STORAGE_KEYS.queue]: current[STORAGE_KEYS.queue] || [],
    [STORAGE_KEYS.config]: { ...DEFAULT_CONFIG, ...(current[STORAGE_KEYS.config] || {}), autoRefresh: normalizeAutoRefresh(current[STORAGE_KEYS.config]?.autoRefresh) },
    [STORAGE_KEYS.diagnostics]: current[STORAGE_KEYS.diagnostics] || []
  });
  const config = { ...DEFAULT_CONFIG, ...(current[STORAGE_KEYS.config] || {}), autoRefresh: normalizeAutoRefresh(current[STORAGE_KEYS.config]?.autoRefresh) };
  await ensureAlarms(config);
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
  const config = { ...DEFAULT_CONFIG, ...(data[STORAGE_KEYS.config] || {}) };
  const collectorToken = config.collectorToken || '';
  const syncToken = config.syncToken || '';
  const authMode = collectorToken && config.collectorId ? 'collector' : (syncToken ? 'legacy' : 'none');
  const tokenState = authMode === 'collector' ? 'enrolled' : (authMode === 'legacy' ? 'legacy' : 'missing');
  const verification = config.verification || DEFAULT_CONFIG.verification;
  const verificationStatus = (authMode === 'collector' || authMode === 'legacy') ? (verification.status || 'unverified') : tokenState;
  return {
    state: data[STORAGE_KEYS.state],
    queue: data[STORAGE_KEYS.queue] || [],
    config: {
      endpoint: config.endpoint || DEFAULT_CONFIG.endpoint,
      configured: authMode !== 'none',
      authMode,
      collectorId: config.collectorId || null,
      tokenState,
      verificationStatus,
      verificationMessage: verification.message || '',
      verificationCheckedAt: verification.checkedAt || null,
      readyForScan: authMode !== 'none' && verificationStatus === 'verified',
      autoRefresh: normalizeAutoRefresh(config.autoRefresh)
    },
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
    queueId: newId('queue'),
    collectionId,
    attempts: 0,
    createdAt: nowIso(),
    nextAttemptAt: Date.now(),
    payload: {
      batchId: newId('batch'),
      collectionId,
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

async function enqueueItems(state, items, reason = 'collection') {
  const safeItems = Array.isArray(items) ? items.filter(Boolean) : [];
  if (!safeItems.length) return [];
  const { [STORAGE_KEYS.queue]: current = [] } = await chrome.storage.local.get(STORAGE_KEYS.queue);
  const itemKey = (item) => `${String(item?.programmeId || '')}|${String(item?.observedAt || '')}`;
  const queuedObservationKeys = new Set(current.flatMap((entry) => (entry.payload?.items || []).map(itemKey)));
  const confirmedObservationKeys = new Set(Array.isArray(state.confirmedObservationKeys) ? state.confirmedObservationKeys : []);
  const missingItems = safeItems.filter((item) => !queuedObservationKeys.has(itemKey(item)) && !confirmedObservationKeys.has(itemKey(item)));
  if (!missingItems.length) return [];
  const batches = toBatches({ ...state, collectionId: state.collectionId || newId('collection'), items: missingItems });
  const next = [...current, ...batches];
  await chrome.storage.local.set({ [STORAGE_KEYS.queue]: next });
  if (reason !== 'checkpoint') {
    await addDiagnostic('info', 'queue', `${missingItems.length} observation(s) ajoutée(s) à ${batches.length} lot(s) de reprise.`, { collectionId: state.collectionId, reason });
  }
  return batches;
}

async function enqueueCollection(state) {
  return enqueueItems(state, state.items, 'collection_completed');
}

async function enqueueCheckpoint(state) {
  const queued = await enqueueItems(state, state.items, 'checkpoint');
  if (queued.length) void flushQueue('checkpoint');
  return queued;
}

async function testSyncConfiguration(config) {
  const authPayload = config.collectorId && config.collectorToken
    ? { collectorId: config.collectorId, collectorToken: config.collectorToken }
    : config.syncToken ? { syncToken: config.syncToken } : null;
  if (!authPayload) return { ok: false, permanent: true, stage: 'configuration', message: 'Enrôlez cet appareil avec un code d’activation avant de lancer le test.' };
  if (authPayload.syncToken && !isValidSyncToken(authPayload.syncToken)) return { ok: false, permanent: true, stage: 'configuration', message: INVALID_SYNC_TOKEN_MESSAGE };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'preflight', source: 'bacpilot_chrome_official', ...authPayload }),
      signal: controller.signal
    });
    const raw = await response.text();
    let body = {};
    try { body = raw ? JSON.parse(raw) : {}; } catch (_) {}
    if (response.ok && body.ok && body.mode === 'preflight') return { ok: true, stage: 'preflight', authMode: body.authMode || null, collectorId: body.collectorId || null, message: body.message || 'Collecteur autorisé et serveur prêt pour la collecte.', httpStatus: response.status };
    if (response.status === 401 || response.status === 403) return { ok: false, permanent: true, stage: 'authentication', code: body.code || null, message: body.error || 'Collecteur refusé. Réenrôlez cet appareil ou demandez sa réactivation.', httpStatus: response.status };
    return { ok: false, permanent: false, stage: 'server_response', message: body.error || `Test serveur incomplet (HTTP ${response.status}).`, httpStatus: response.status };
  } catch (error) {
    return { ok: false, permanent: false, stage: 'network', message: error?.name === 'AbortError' ? 'Délai dépassé lors du test serveur.' : String(error?.message || 'Échec réseau pendant le test serveur.') };
  } finally { clearTimeout(timeout); }
}

async function verifySyncConfiguration(trigger = 'manual') {
  await ensureStorage();
  const { [STORAGE_KEYS.config]: stored = DEFAULT_CONFIG } = await chrome.storage.local.get(STORAGE_KEYS.config);
  const config = { ...DEFAULT_CONFIG, ...stored };
  const result = await testSyncConfiguration(config);
  const next = {
    ...config,
    verification: { status: result.ok ? 'verified' : 'failed', checkedAt: nowIso(), message: result.message }
  };
  await chrome.storage.local.set({ [STORAGE_KEYS.config]: next });
  await addDiagnostic(result.ok ? 'success' : (result.permanent ? 'warning' : 'error'), 'preflight', result.message, { trigger, httpStatus: result.httpStatus || null });
  return result;
}

async function requireVerifiedConfiguration(trigger) {
  const result = await verifySyncConfiguration(trigger);
  if (!result.ok) throw new Error(`Collecte bloquée : ${result.message}`);
  return result;
}

async function sendBatch(entry, config) {
  const authPayload = config.collectorId && config.collectorToken
    ? { collectorId: config.collectorId, collectorToken: config.collectorToken }
    : config.syncToken ? { syncToken: config.syncToken } : null;
  if (!authPayload) return { ok: false, permanent: true, stage: 'configuration', message: 'Synchronisation en attente : enrôlez cet appareil depuis la console officielle.' };
  if (authPayload.syncToken && !isValidSyncToken(authPayload.syncToken)) return { ok: false, permanent: true, stage: 'configuration', message: INVALID_SYNC_TOKEN_MESSAGE };
  let lastMessage = 'Échec réseau';
  let lastStatus = null;
  let responsePreview = '';
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);
    try {
      const response = await fetch(config.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...entry.payload, ...authPayload }),
        signal: controller.signal
      });
      lastStatus = response.status;
      const raw = await response.text();
      responsePreview = raw.slice(0, 280);
      let body = {};
      try { body = raw ? JSON.parse(raw) : {}; } catch (_) {}
      if (response.ok && body.ok && Number(body.received) === entry.payload.items.length) return { ok: true, httpStatus: response.status, responsePreview, attempts: attempt };
      if (response.status === 401 || response.status === 403) return { ok: false, permanent: true, stage: 'authentication', code: body.code || null, httpStatus: response.status, responsePreview, message: body.error || 'Collecteur refusé. Réenrôlez cet appareil ou demandez sa réactivation.' };
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
        const { [STORAGE_KEYS.state]: activeState = {} } = await chrome.storage.local.get(STORAGE_KEYS.state);
        const itemKey = (item) => `${String(item?.programmeId || '')}|${String(item?.observedAt || '')}`;
        const existingConfirmed = Array.isArray(activeState.confirmedObservationKeys) ? activeState.confirmedObservationKeys : [];
        const confirmedObservationKeys = [...new Set([...existingConfirmed, ...(entry.payload?.items || []).map(itemKey)])].slice(-5000);
        await updateState({ lastServerConfirmedAt: nowIso(), lastConfirmedCollectionId: entry.collectionId || null, lastConfirmedBatchId: entry.payload?.batchId || null, confirmedObservationKeys, confirmedObservationCount: confirmedObservationKeys.length });
        await addDiagnostic('success', 'sync', `${entry.payload.items.length} observation(s) confirmée(s) par BacPilot.`, { queueId: entry.queueId, httpStatus: result.httpStatus, replayed: Boolean(result.replayed) });
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
  await requireVerifiedConfiguration('before_scan');
  const tab = await findSourceTab(tabId);
  const response = await sendToContent(tab.id, { type: 'BP_START_COLLECTION' });
  if (!response?.ok) throw new Error(response?.error || 'La collecte ne peut pas démarrer.');
  return response;
}

async function resumeScan(tabId = null) {
  await requireVerifiedConfiguration('before_resume');
  const tab = await findSourceTab(tabId);
  const snapshot = await getState();
  const response = await sendToContent(tab.id, { type: 'BP_RESUME_COLLECTION', state: snapshot.state });
  if (!response?.ok) throw new Error(response?.error || 'La reprise ne peut pas démarrer.');
  return response;
}

async function runAutomaticRefresh() {
  await ensureStorage();
  const snapshot = await getState();
  const autoRefresh = snapshot.config.autoRefresh;
  const state = snapshot.state || {};
  if (!autoRefresh.enabled) return { skipped: true, reason: 'disabled' };
  if (!snapshot.config.readyForScan) {
    await addDiagnostic('warning', 'automatic_refresh', 'Actualisation automatique reportée : le test de synchronisation doit être validé.', {});
    return { skipped: true, reason: 'configuration' };
  }
  if (state.status === 'running' || (state.status === 'paused' && Number(state.totalCandidates || 0) > Number(state.completedCandidates || 0))) {
    await addDiagnostic('info', 'automatic_refresh', 'Actualisation automatique reportée : une collecte inachevée doit être reprise ou annulée manuellement.', {});
    return { skipped: true, reason: 'collection_pending' };
  }
  try {
    const tab = await findSourceTab();
    await updateState({ autoRefreshStartedAt: nowIso(), autoRefreshStatus: 'Collecte automatique lancée avec la session officielle ouverte.' });
    const response = await sendToContent(tab.id, { type: 'BP_START_COLLECTION' });
    if (!response?.ok) throw new Error(response?.error || 'La collecte automatique ne peut pas démarrer.');
    await addDiagnostic('info', 'automatic_refresh', `Collecte automatique demandée toutes les ${autoRefresh.periodMinutes} minutes.`, { tabId: tab.id });
    return { ok: true };
  } catch (error) {
    const message = String(error?.message || error);
    await updateState({ autoRefreshStatus: `Actualisation automatique reportée : ${message}` });
    await addDiagnostic('warning', 'automatic_refresh', message, {});
    return { ok: false, reason: 'source_unavailable', message };
  }
}

async function enrollCollector(endpoint, activationCode, label = 'Extension BacPilot') {
  const code = String(activationCode || '').trim();
  if (!code) return { ok: false, validation: { ok: false, stage: 'enrollment', code: 'ACTIVATION_REQUIRED', message: 'Saisissez le code d’activation fourni par Telegram.' } };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'enroll', activationCode: code, label }),
      signal: controller.signal,
    });
    const raw = await response.text();
    let body = {};
    try { body = raw ? JSON.parse(raw) : {}; } catch (_) {}
    if (!response.ok || !body.ok || !body.collectorId || !body.collectorToken) {
      const validation = { ok: false, stage: 'enrollment', code: body.code || null, message: body.error || `Enrôlement refusé (HTTP ${response.status}).`, httpStatus: response.status };
      await addDiagnostic('warning', 'enrollment', validation.message, { code: validation.code, httpStatus: response.status });
      return { ok: false, validation };
    }
    const { [STORAGE_KEYS.config]: current = DEFAULT_CONFIG } = await chrome.storage.local.get(STORAGE_KEYS.config);
    const next = { ...DEFAULT_CONFIG, ...current, endpoint, syncToken: '', collectorId: body.collectorId, collectorToken: body.collectorToken, verification: { status: 'unverified', checkedAt: null, message: 'Appareil enrôlé ; test du collecteur en cours.' } };
    await chrome.storage.local.set({ [STORAGE_KEYS.config]: next });
    await ensureAlarms(next);
    const validation = await verifySyncConfiguration('collector_enrolled');
    return { ok: validation.ok, collectorId: body.collectorId, validation };
  } catch (error) {
    const validation = { ok: false, stage: 'network', message: error?.name === 'AbortError' ? 'Délai dépassé pendant l’enrôlement.' : String(error?.message || 'Échec réseau pendant l’enrôlement.') };
    await addDiagnostic('error', 'enrollment', validation.message);
    return { ok: false, validation };
  } finally { clearTimeout(timeout); }
}

chrome.runtime.onInstalled.addListener(() => { void ensureStorage(); });
chrome.runtime.onStartup.addListener(() => { void ensureStorage(); });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === RETRY_ALARM) void ensureStorage().then(() => flushQueue('scheduled_retry'));
  if (alarm.name === AUTO_REFRESH_ALARM) void runAutomaticRefresh();
});
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
      case 'BP_ENROLL_COLLECTOR': {
        const current = { ...DEFAULT_CONFIG, ...((await chrome.storage.local.get(STORAGE_KEYS.config))[STORAGE_KEYS.config] || {}) };
        return { ok: true, ...(await enrollCollector(String(message.endpoint || current.endpoint || DEFAULT_CONFIG.endpoint).trim(), message.activationCode, String(message.label || 'Extension BacPilot').trim())) };
      }
      case 'BP_SET_CONFIG': {
        const current = { ...DEFAULT_CONFIG, ...((await chrome.storage.local.get(STORAGE_KEYS.config))[STORAGE_KEYS.config] || {}) };
        const suppliedToken = message.syncToken === null || message.syncToken === undefined ? current.syncToken : String(message.syncToken).trim();
        if (suppliedToken && !isValidSyncToken(suppliedToken)) return { ok: false, configured: Boolean(current.syncToken), error: INVALID_SYNC_TOKEN_MESSAGE };
        const endpoint = String(message.endpoint || DEFAULT_CONFIG.endpoint).trim();
        const changed = endpoint !== current.endpoint || suppliedToken !== current.syncToken;
        const next = {
          ...current,
          endpoint,
          syncToken: suppliedToken,
          autoRefresh: normalizeAutoRefresh(current.autoRefresh),
          verification: changed ? { status: 'unverified', checkedAt: null, message: 'Configuration enregistrée ; test serveur en cours.' } : current.verification
        };
        await chrome.storage.local.set({ [STORAGE_KEYS.config]: next });
        await ensureAlarms(next);
        await addDiagnostic('info', 'configuration', next.syncToken ? 'Configuration de synchronisation enregistrée localement.' : 'Jeton de synchronisation retiré ; les lots restent conservés localement.');
        if (!next.syncToken) return { ok: true, configured: false, validation: { ok: false, stage: 'configuration', message: 'Saisissez un jeton pour activer le test.' } };
        const validation = await verifySyncConfiguration('configuration_saved');
        return { ok: true, configured: true, validation };
      }
      case 'BP_TEST_CONFIG':
        return { ok: true, validation: await verifySyncConfiguration('manual_test') };
      case 'BP_SET_AUTO_REFRESH': {
        const current = { ...DEFAULT_CONFIG, ...((await chrome.storage.local.get(STORAGE_KEYS.config))[STORAGE_KEYS.config] || {}) };
        const autoRefresh = normalizeAutoRefresh({ enabled: message.enabled, periodMinutes: message.periodMinutes });
        const next = { ...current, autoRefresh };
        await chrome.storage.local.set({ [STORAGE_KEYS.config]: next });
        await ensureAlarms(next);
        await addDiagnostic('info', 'automatic_refresh', autoRefresh.enabled ? `Actualisation automatique activée toutes les ${autoRefresh.periodMinutes} minutes ; elle exige un onglet officiel et une session valides.` : 'Actualisation automatique désactivée.', {});
        return { ok: true, autoRefresh };
      }
      case 'BP_CLEAR_LOCAL_DATA':
        await chrome.storage.local.set({ [STORAGE_KEYS.state]: { status: 'idle', collectionId: null, observedAt: null, startedAt: null, updatedAt: nowIso(), totalCandidates: 0, completedCandidates: 0, items: [], errors: [], confirmedObservationKeys: [], message: 'Données locales effacées par l’utilisateur.' }, [STORAGE_KEYS.queue]: [] });
        await addDiagnostic('info', 'local_data', 'Données de collecte et lots en attente effacés par l’utilisateur.');
        return { ok: true };
      case 'BP_COLLECTION_STARTED': {
        const { [STORAGE_KEYS.state]: previous = {} } = await chrome.storage.local.get(STORAGE_KEYS.state);
        const sameCollection = previous.collectionId && previous.collectionId === message.state?.collectionId;
        await updateState({ ...message.state, status: 'running', confirmedObservationKeys: sameCollection && Array.isArray(previous.confirmedObservationKeys) ? previous.confirmedObservationKeys : [] });
        return { ok: true };
      }
      case 'BP_COLLECTION_CHECKPOINT': {
        const { [STORAGE_KEYS.state]: previous = {} } = await chrome.storage.local.get(STORAGE_KEYS.state);
        const state = await updateState({ ...message.state, status: message.state?.status || 'running', confirmedObservationKeys: Array.isArray(previous.confirmedObservationKeys) ? previous.confirmedObservationKeys : [], lastCheckpointAt: nowIso() });
        await enqueueCheckpoint(state);
        return { ok: true };
      }
      case 'BP_COLLECTION_COMPLETED': {
        const { [STORAGE_KEYS.state]: previous = {} } = await chrome.storage.local.get(STORAGE_KEYS.state);
        const state = await updateState({ ...message.state, status: 'completed', confirmedObservationKeys: Array.isArray(previous.confirmedObservationKeys) ? previous.confirmedObservationKeys : [] });
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
