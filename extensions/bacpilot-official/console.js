const $ = (id) => document.getElementById(id);
let snapshot = null;

const REQUIRED_IDS = [
  'actionFeedback', 'collectionStatus', 'collectionMessage', 'collectionProgress', 'collectionMeta',
  'collectionDetails', 'startScan', 'resumeScan', 'cancelScan', 'syncNow', 'exportData', 'refresh',
  'queueBadge', 'queueList', 'syncStatus', 'syncMessage', 'configState', 'configMessage', 'autoRefreshEnabled', 'autoRefreshMinutes', 'saveAutoRefresh', 'autoRefreshState',
  'syncEndpoint', 'syncToken', 'saveConfig', 'testConfig', 'diagnosticCount', 'diagnosticList', 'clearData'
];

const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
const formatDate = (value) => value ? new Intl.DateTimeFormat('fr-BJ', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—';
const formatAge = (value) => {
  if (!value || Number.isNaN(Date.parse(value))) return 'Jamais confirmée';
  const seconds = Math.max(0, Math.round((Date.now() - Date.parse(value)) / 1000));
  if (seconds < 60) return 'À l’instant';
  if (seconds < 3600) return `Il y a ${Math.floor(seconds / 60)} min`;
  if (seconds < 86400) return `Il y a ${Math.floor(seconds / 3600)} h`;
  return `Il y a ${Math.floor(seconds / 86400)} j`;
};

function setFeedback(message, kind = '') {
  const node = $('actionFeedback');
  if (!node) return;
  node.textContent = message || '';
  node.className = `feedback ${kind}`;
}

async function request(type, payload = {}) {
  if (!chrome?.runtime?.sendMessage) throw new Error('La console ne peut pas contacter le service de l’extension. Rechargez l’extension dans chrome://extensions.');
  const response = await chrome.runtime.sendMessage({ type, ...payload });
  if (!response?.ok) throw new Error(response?.error || 'Action impossible.');
  return response;
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
  const sessionLabels = { active: 'Session source active', expired_or_unauthorized: 'Session source à reconnecter', unknown: 'Session source à vérifier' };
  $('collectionDetails').innerHTML = `
    <div class="detail"><span>Identifiant de collecte</span><strong>${escapeHtml(state.collectionId || 'Aucun')}</strong></div>
    <div class="detail"><span>Dernier point local</span><strong>${escapeHtml(formatDate(state.lastCheckpointAt || state.updatedAt))}</strong></div>
    <div class="detail"><span>Confirmation serveur</span><strong>${escapeHtml(formatAge(state.lastServerConfirmedAt))}</strong><small>${escapeHtml(formatDate(state.lastServerConfirmedAt))}</small></div>
    <div class="detail"><span>Session officielle</span><strong>${escapeHtml(sessionLabels[state.sourceSessionStatus] || 'À vérifier')}</strong></div>
    <div class="detail"><span>Observations brutes</span><strong>${items}</strong></div>
    <div class="detail"><span>Échecs documentés</span><strong>${errors}</strong></div>
    <div class="detail"><span>Dernier lot confirmé</span><strong>${escapeHtml(state.lastConfirmedBatchId || 'Aucun')}</strong></div>
    <div class="detail"><span>Actualisation volontaire</span><strong>${escapeHtml(state.autoRefreshStatus || 'Désactivée ou non encore lancée')}</strong></div>`;
  const recoverable = Boolean(state.collectionId && ['paused', 'running'].includes(state.status) && total > done);
  const readyForScan = Boolean(config.readyForScan);
  $('startScan').disabled = !readyForScan || state.status === 'running';
  $('resumeScan').disabled = !recoverable || !readyForScan;
  $('cancelScan').disabled = state.status !== 'running';
}

function renderQueue(queue = [], config = {}, state = {}) {
  const count = queue.length;
  const readyForScan = Boolean(config.readyForScan);
  $('queueBadge').textContent = `${count} lot${count > 1 ? 's' : ''}`;
  $('queueBadge').className = `badge ${count ? 'warning' : ''}`;
  $('syncStatus').textContent = count ? 'Reprise planifiée' : (state.lastServerConfirmedAt ? 'Confirmée' : 'En attente de données');
  $('syncMessage').textContent = state.syncMessage || (count ? `${count} lot(s) conservé(s) localement et réessayé(s) automatiquement.` : (state.lastServerConfirmedAt ? `Dernière confirmation : ${formatAge(state.lastServerConfirmedAt)}.` : 'Aucun lot en attente.'));
  const configState = config.verificationStatus || config.tokenState || (config.configured ? 'unverified' : 'missing');
  const configLabels = { verified: 'Test validé', unverified: 'Test requis', missing: 'Jeton requis', invalid: 'Jeton à corriger', failed: 'Test à corriger' };
  $('configState').textContent = configLabels[configState] || 'Test requis';
  $('configState').className = `badge ${configState === 'verified' ? '' : 'warning'}`;
  $('configMessage').textContent = config.verificationMessage || 'Saisissez puis testez le jeton avant la collecte.';
  $('testConfig').disabled = config.tokenState !== 'ready';
  $('syncNow').disabled = count > 0 && !readyForScan;
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
  const config = data.config || {};
  renderCollection(state, config);
  renderQueue(data.queue || [], config, state);
  renderDiagnostics(data.diagnostics || []);
  $('syncEndpoint').value = config.endpoint || '';
  const autoRefresh = config.autoRefresh || { enabled: false, periodMinutes: 15 };
  $('autoRefreshEnabled').checked = Boolean(autoRefresh.enabled);
  $('autoRefreshMinutes').value = Math.max(10, Number(autoRefresh.periodMinutes || 15));
  $('autoRefreshState').textContent = autoRefresh.enabled
    ? `Activée toutes les ${Math.max(10, Number(autoRefresh.periodMinutes || 15))} minutes. Elle attend un onglet officiel déjà ouvert et ne contourne jamais une session expirée.`
    : 'Désactivée par défaut. Elle ne se lance que si l’onglet officiel est déjà ouvert et que la session est toujours autorisée.';
}

async function refresh({ quiet = false } = {}) {
  try {
    const data = await request('BP_GET_STATE');
    render(data);
    if (!quiet) setFeedback('Console prête. Vérifiez la configuration avant toute collecte.', 'success');
  } catch (error) {
    setFeedback(error.message || 'Impossible d’actualiser la console.', 'error');
  }
}

async function withAction(buttonId, action) {
  const button = $(buttonId);
  if (!button) return;
  button.disabled = true;
  try {
    await action();
  } catch (error) {
    setFeedback(error.message || 'Action impossible.', 'error');
  } finally {
    await refresh({ quiet: true });
    button.disabled = false;
  }
}

function bind(id, listener) {
  const node = $(id);
  if (!node) throw new Error(`Élément d’interface manquant : ${id}`);
  node.addEventListener('click', listener);
}

function exportLocalData() {
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
}

function initializeConsole() {
  const missing = REQUIRED_IDS.filter((id) => !$(id));
  if (missing.length) {
    setFeedback(`Mise à jour incomplète : fichiers de console incompatibles (${missing.join(', ')}). Remplacez tous les fichiers du même dossier, puis rechargez l’extension.`, 'error');
    console.error('BacPilot console: éléments manquants', missing);
    return;
  }

  bind('refresh', () => { void refresh(); });
  bind('startScan', () => withAction('startScan', async () => {
    const state = snapshot?.state || {};
    if (state.collectionId && ['running', 'paused'].includes(state.status) && state.totalCandidates > state.completedCandidates) {
      const confirmed = confirm('Une collecte inachevée est déjà conservée. Voulez-vous réellement commencer une nouvelle collecte ? La progression actuelle restera visible mais ne sera plus reprise.');
      if (!confirmed) return;
    }
    setFeedback('Prévol serveur puis démarrage de la collecte…', '');
    await request('BP_START_SCAN');
    setFeedback('Prévol validé. Collecte démarrée.', 'success');
  }));
  bind('resumeScan', () => withAction('resumeScan', async () => {
    setFeedback('Prévol serveur puis reprise de la collecte…', '');
    await request('BP_RESUME_SCAN');
    setFeedback('Prévol validé. Reprise demandée.', 'success');
  }));
  bind('cancelScan', () => withAction('cancelScan', async () => {
    await request('BP_CANCEL_SCAN');
    setFeedback('Pause demandée. Le dernier point validé reste conservé localement.', 'success');
  }));
  bind('syncNow', () => withAction('syncNow', async () => {
    setFeedback('Vérification de la configuration puis synchronisation des lots locaux…', '');
    const result = await request('BP_SYNC_NOW');
    setFeedback(result.pending ? `${result.pending} lot(s) restent conservés localement.` : `${result.sent || 0} observation(s) confirmée(s) par BacPilot.`, result.pending ? '' : 'success');
  }));
  bind('saveConfig', () => withAction('saveConfig', async () => {
    const endpoint = $('syncEndpoint').value.trim();
    const token = $('syncToken').value.trim();
    setFeedback('Configuration enregistrée. Test du serveur en cours…', '');
    const result = await request('BP_SET_CONFIG', { endpoint, syncToken: token || null });
    $('syncToken').value = '';
    if (result.validation?.ok) setFeedback('Configuration enregistrée et test serveur validé. Vous pouvez lancer une collecte.', 'success');
    else setFeedback(result.validation?.message || 'Configuration enregistrée, mais le test serveur doit être corrigé avant la collecte.', 'error');
  }));
  bind('testConfig', () => withAction('testConfig', async () => {
    setFeedback('Test du jeton enregistré en cours…', '');
    const result = await request('BP_TEST_CONFIG');
    if (result.validation?.ok) setFeedback('Jeton enregistré et serveur validé. Collecte autorisée.', 'success');
    else setFeedback(result.validation?.message || 'Test serveur non validé.', 'error');
  }));
  bind('saveAutoRefresh', () => withAction('saveAutoRefresh', async () => {
    const enabled = $('autoRefreshEnabled').checked;
    const periodMinutes = Math.max(10, Math.round(Number($('autoRefreshMinutes').value || 15)));
    $('autoRefreshMinutes').value = periodMinutes;
    const result = await request('BP_SET_AUTO_REFRESH', { enabled, periodMinutes });
    setFeedback(result.autoRefresh?.enabled ? `Actualisation automatique activée toutes les ${result.autoRefresh.periodMinutes} minutes.` : 'Actualisation automatique désactivée.', 'success');
  }));
  bind('exportData', exportLocalData);
  bind('clearData', () => withAction('clearData', async () => {
    if (!confirm('Effacer les observations locales et les lots en attente ? Cette action ne peut pas être annulée.')) return;
    await request('BP_CLEAR_LOCAL_DATA');
    setFeedback('Données locales effacées.', 'success');
  }));

  if (chrome?.storage?.onChanged?.addListener) chrome.storage.onChanged.addListener(() => { void refresh({ quiet: true }); });
  setFeedback('Console chargée. Actualisation de l’état local…', '');
  void refresh({ quiet: true });
}

initializeConsole();
