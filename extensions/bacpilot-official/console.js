const $ = (id) => document.getElementById(id);
let snapshot = null;

const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
const formatDate = (value) => value ? new Intl.DateTimeFormat('fr-BJ', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—';

async function request(type, payload = {}) {
  const response = await chrome.runtime.sendMessage({ type, ...payload });
  if (!response?.ok) throw new Error(response?.error || 'Action impossible.');
  return response;
}

function setFeedback(message, kind = '') {
  const node = $('actionFeedback');
  node.textContent = message || '';
  node.className = `feedback ${kind}`;
}

function renderCollection(state = {}, config = {}) {
  const total = Number(state.totalCandidates || 0);
  const done = Number(state.completedCandidates || 0);
  const items = Array.isArray(state.items) ? state.items.length : 0;
  const errors = Array.isArray(state.errors) ? state.errors.length : 0;
  const statusLabels = { idle: 'Prête', running: 'Collecte en cours', paused: 'Collecte à reprendre', completed: 'Collecte terminée' };
  $('collectionStatus').textContent = statusLabels[state.status] || 'État inconnu';
  $('collectionMessage').textContent = state.message || 'Aucun message de collecte.';
  $('collectionProgress').textContent = total ? `${done} / ${total}` : '—';
  $('collectionMeta').textContent = items ? `${items} observation(s) brutes conservées${errors ? ` · ${errors} erreur(s) journalisée(s)` : ''}` : 'Aucune observation locale.';
  $('collectionDetails').innerHTML = `
    <div class="detail"><span>Identifiant de collecte</span><strong>${escapeHtml(state.collectionId || 'Aucun')}</strong></div>
    <div class="detail"><span>Dernière sauvegarde</span><strong>${escapeHtml(formatDate(state.updatedAt))}</strong></div>
    <div class="detail"><span>Observations brutes</span><strong>${items}</strong></div>
    <div class="detail"><span>Échecs documentés</span><strong>${errors}</strong></div>`;
  const recoverable = Boolean(state.collectionId && ['paused', 'running'].includes(state.status) && total > done);
  const readyForScan = Boolean(config.readyForScan);
  $('startScan').disabled = !readyForScan || state.status === 'running';
  $('resumeScan').disabled = !recoverable || !readyForScan;
  $('cancelScan').disabled = state.status !== 'running';
}

function renderQueue(queue = [], config = {}, state = {}) {
  const count = queue.length;
  $('queueBadge').textContent = `${count} lot${count > 1 ? 's' : ''}`;
  $('queueBadge').className = `badge ${count ? 'warning' : ''}`;
  $('syncStatus').textContent = count ? 'Reprise planifiée' : 'À jour';
  $('syncMessage').textContent = state.syncMessage || (count ? `${count} lot(s) conservé(s) localement et réessayé(s) automatiquement.` : 'Aucun lot en attente.');
  const configState = config.verificationStatus || config.tokenState || (config.configured ? 'unverified' : 'missing');
  const configLabels = { verified: 'Test validé', unverified: 'Test requis', missing: 'Jeton requis', invalid: 'Jeton à corriger', failed: 'Test à corriger' };
  $('configState').textContent = configLabels[configState] || 'Test requis';
  $('configState').className = `badge ${configState === 'verified' ? '' : 'warning'}`;
  $('configMessage').textContent = config.verificationMessage || 'Saisissez puis testez le jeton avant la collecte.';
  $('testConfig').disabled = config.tokenState !== 'ready';
  if (!count) { $('queueList').innerHTML = '<p>Aucun lot en attente.</p>'; return; }
  $('queueList').innerHTML = queue.map((entry) => `<div class="queue-item"><strong>${escapeHtml(entry.payload?.items?.length || 0)} observation(s) · lot ${escapeHtml(entry.payload?.part || '—')}/${escapeHtml(entry.payload?.totalParts || '—')}</strong><small>Créé : ${escapeHtml(formatDate(entry.createdAt))} · Tentatives : ${escapeHtml(entry.attempts || 0)}</small><small>${escapeHtml(entry.lastError || `Prochaine tentative : ${entry.nextAttemptAt ? formatDate(entry.nextAttemptAt) : 'dès que possible'}`)}</small></div>`).join('');
}

function renderDiagnostics(diagnostics = []) {
  $('diagnosticCount').textContent = diagnostics.length;
  if (!diagnostics.length) { $('diagnosticList').innerHTML = '<p>Aucun diagnostic enregistré.</p>'; return; }
  $('diagnosticList').innerHTML = diagnostics.map((entry) => `<div class="diagnostic ${escapeHtml(entry.level || '')}"><strong>${escapeHtml(entry.stage || 'information')} · ${escapeHtml(entry.message || '')}</strong><small>${escapeHtml(formatDate(entry.time))}${entry.httpStatus ? ` · HTTP ${escapeHtml(entry.httpStatus)}` : ''}${entry.attempts ? ` · tentative ${escapeHtml(entry.attempts)}` : ''}</small></div>`).join('');
}

function render(data) {
  snapshot = data;
  const state = data.state || {};
  renderCollection(state, data.config || {});
  renderQueue(data.queue || [], data.config || {}, state);
  renderDiagnostics(data.diagnostics || []);
  $('syncEndpoint').value = data.config?.endpoint || '';
}

async function refresh() {
  try {
    const data = await request('BP_GET_STATE');
    render(data);
    setFeedback('État local actualisé.', 'success');
  } catch (error) { setFeedback(error.message, 'error'); }
}

async function withAction(buttonId, action) {
  const button = $(buttonId);
  button.disabled = true;
  try { await action(); } catch (error) { setFeedback(error.message, 'error'); }
  finally { button.disabled = false; await refresh(); }
}

$('refresh').addEventListener('click', refresh);
$('startScan').addEventListener('click', () => withAction('startScan', async () => {
  const state = snapshot?.state || {};
  if (state.collectionId && ['running', 'paused'].includes(state.status) && state.totalCandidates > state.completedCandidates) {
    const confirmed = confirm('Une collecte inachevée est déjà conservée. Voulez-vous réellement commencer une nouvelle collecte ? La progression actuelle restera visible mais ne sera plus reprise.');
    if (!confirmed) return;
  }
  setFeedback('Demande envoyée. Vérifiez que l’onglet officiel est ouvert et que votre session est active.', '');
  await request('BP_START_SCAN');
}));
$('resumeScan').addEventListener('click', () => withAction('resumeScan', async () => {
  setFeedback('Reprise demandée depuis le dernier point sauvegardé.', '');
  await request('BP_RESUME_SCAN');
}));
$('cancelScan').addEventListener('click', () => withAction('cancelScan', async () => {
  await request('BP_CANCEL_SCAN');
  setFeedback('Pause demandée. Le dernier point validé reste conservé localement.', '');
}));
$('syncNow').addEventListener('click', () => withAction('syncNow', async () => {
  const result = await request('BP_SYNC_NOW');
  setFeedback(result.pending ? `${result.pending} lot(s) restent conservés localement.` : `${result.sent || 0} observation(s) confirmée(s) par BacPilot.`, result.pending ? '' : 'success');
}));
$('saveConfig').addEventListener('click', () => withAction('saveConfig', async () => {
  const endpoint = $('syncEndpoint').value.trim();
  const token = $('syncToken').value.trim();
  const result = await request('BP_SET_CONFIG', { endpoint, syncToken: token || null });
  $('syncToken').value = '';
  if (result.validation?.ok) setFeedback('Configuration enregistrée et test serveur validé. Vous pouvez lancer une collecte.', 'success');
  else setFeedback(result.validation?.message || 'Configuration enregistrée, mais le test serveur doit être corrigé avant la collecte.', 'error');
}));
$('testConfig').addEventListener('click', () => withAction('testConfig', async () => {
  const result = await request('BP_TEST_CONFIG');
  if (result.validation?.ok) setFeedback('Jeton enregistré et serveur validé. Collecte autorisée.', 'success');
  else setFeedback(result.validation?.message || 'Test serveur non validé.', 'error');
}));
$('exportData').addEventListener('click', () => {
  const state = snapshot?.state || {};
  const output = {
    schemaVersion: 'bacpilot-observation-export.v1',
    exportedAt: new Date().toISOString(),
    collection: { ...state, plan: undefined },
    pendingLots: (snapshot?.queue || []).map((entry) => ({ queueId: entry.queueId, collectionId: entry.collectionId, attempts: entry.attempts, nextAttemptAt: entry.nextAttemptAt, itemCount: entry.payload?.items?.length || 0 }))
  };
  const url = URL.createObjectURL(new Blob([JSON.stringify(output, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `bacpilot-observations-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
  setFeedback('Export JSON des observations locales préparé.', 'success');
});
$('clearData').addEventListener('click', () => withAction('clearData', async () => {
  if (!confirm('Effacer les observations locales et les lots en attente ? Cette action ne peut pas être annulée.')) return;
  await request('BP_CLEAR_LOCAL_DATA');
  setFeedback('Données locales effacées.', 'success');
}));

chrome.storage.onChanged.addListener(() => { void refresh(); });
void refresh();
