(() => {
  if (globalThis.__bacpilotOfficialCollectorLoaded) return;
  globalThis.__bacpilotOfficialCollectorLoaded = true;

  const READ_ENDPOINT = '/Home/GetListChoice';
  const MIN_DELAY_MS = 450;
  const MAX_PROGRAMMES = 5000;
  let cancelled = false;
  let running = false;

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const newId = (prefix) => `${prefix}-${crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`}`;
  const asInt = (value) => {
    const number = Number(value);
    return Number.isSafeInteger(number) && number >= 0 ? number : 0;
  };

  function entries(value) {
    if (!value || typeof value !== 'object') return [];
    return Object.entries(value)
      .map(([id, name]) => ({ id: Number(id), name: String(name || '').trim() }))
      .filter((item) => Number.isFinite(item.id) && item.id > 0 && item.name);
  }

  async function notify(type, payload = {}) {
    try { return await chrome.runtime.sendMessage({ type, ...payload }); } catch (_) { return null; }
  }

  async function postChoice(type, num, attempts = 3) {
    let lastError = new Error('Lecture impossible');
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);
      try {
        const response = await fetch(READ_ENDPOINT, {
          method: 'POST',
          credentials: 'same-origin',
          signal: controller.signal,
          headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
          body: new URLSearchParams({ type, num: String(num) })
        });
        if (response.status === 401 || response.status === 403) throw new Error('Votre session sur le portail officiel a expiré ou n’est plus autorisée. Reconnectez-vous vous-même puis reprenez la collecte.');
        if (!response.ok) throw new Error(`Réponse du portail officiel : HTTP ${response.status}.`);
        return await response.json();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (attempt < attempts) await sleep(900 * attempt);
      } finally { clearTimeout(timeout); }
    }
    throw lastError;
  }

  function normalizeGauge(gauge) {
    const raw = gauge && typeof gauge === 'object' ? gauge : null;
    if (Array.isArray(gauge)) {
      return {
        scholarships: asInt(gauge[0]), aid: asInt(gauge[1]), tb: asInt(gauge[2]), b: asInt(gauge[3]),
        ab: asInt(gauge[4]), passable: asInt(gauge[5]), total: asInt(gauge[6]), rank: null, capacity: null,
        applicants: null, rawGauge: gauge
      };
    }
    if (raw) {
      return {
        scholarships: asInt(raw.scholarships ?? raw.bourse), aid: asInt(raw.aid ?? raw.aide),
        tb: asInt(raw.tb ?? raw.TB), b: asInt(raw.b ?? raw.B), ab: asInt(raw.ab ?? raw.AB),
        passable: asInt(raw.passable ?? raw.Passable), total: asInt(raw.total ?? raw.inscrits ?? raw.candidats),
        rank: raw.rank ?? raw.rang ?? null, capacity: raw.capacity ?? raw.capacite ?? null,
        applicants: raw.applicants ?? raw.postulants ?? null, rawGauge: raw
      };
    }
    throw new Error('Jauge de filière non lisible.');
  }

  function initialState() {
    return {
      collectionId: newId('collection'),
      status: 'running',
      phase: 'discovering',
      startedAt: new Date().toISOString(),
      observedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      totalCandidates: 0,
      completedCandidates: 0,
      plan: [],
      items: [],
      errors: [],
      message: 'Préparation de la liste des filières accessibles…'
    };
  }

  async function checkpoint(state, message) {
    state.message = message || state.message;
    state.updatedAt = new Date().toISOString();
    await notify('BP_COLLECTION_CHECKPOINT', { state });
  }

  async function discoverPlan(state) {
    const select = document.querySelector('#slt_univer1');
    if (!select) throw new Error('Ouvrez la page officielle des choix après votre connexion pour lancer la collecte.');
    const universities = [...select.options]
      .map((option) => ({ id: Number(option.value), name: String(option.textContent || '').trim() }))
      .filter((item) => Number.isFinite(item.id) && item.id > 0 && item.name);
    const existing = new Set((state.plan || []).map((item) => String(item.programmeId)));

    for (let universityIndex = 0; universityIndex < universities.length; universityIndex += 1) {
      if (cancelled) return;
      const university = universities[universityIndex];
      const schools = entries(await postChoice('ecoleByUniversity', university.id));
      await sleep(MIN_DELAY_MS);
      for (const school of schools) {
        if (cancelled) return;
        const programmes = entries(await postChoice('FiliereByEcole', school.id));
        await sleep(MIN_DELAY_MS);
        for (const programme of programmes) {
          if (cancelled || state.plan.length >= MAX_PROGRAMMES) return;
          if (existing.has(String(programme.id))) continue;
          existing.add(String(programme.id));
          state.plan.push({
            universityId: university.id, university: university.name,
            schoolId: school.id, school: school.name,
            programmeId: programme.id, programme: programme.name
          });
        }
        state.totalCandidates = state.plan.length;
        await checkpoint(state, `${state.plan.length} filière(s) repérée(s) dans les sources accessibles. La collecte brute continue…`);
      }
    }
    state.phase = 'collecting';
    state.totalCandidates = state.plan.length;
    state.completedCandidates = Math.min(state.completedCandidates || 0, state.plan.length);
    await checkpoint(state, `${state.totalCandidates} filière(s) à observer. Lecture des jauges en cours…`);
  }

  async function collectGauges(state) {
    const existing = new Map((state.items || []).map((item) => [String(item.programmeId), item]));
    const startAt = Math.min(state.completedCandidates || 0, state.plan.length);
    for (let index = startAt; index < state.plan.length; index += 1) {
      if (cancelled) return;
      const programme = state.plan[index];
      try {
        const gauge = normalizeGauge(await postChoice('filiereJauge', programme.programmeId));
        existing.set(String(programme.programmeId), {
          ...programme,
          ...gauge,
          observedAt: new Date().toISOString()
        });
      } catch (error) {
        state.errors = [...(state.errors || []).slice(-49), {
          programmeId: programme.programmeId,
          programme: programme.programme,
          time: new Date().toISOString(),
          message: error instanceof Error ? error.message : String(error)
        }];
      }
      state.items = [...existing.values()];
      state.completedCandidates = index + 1;
      state.totalCandidates = state.plan.length;
      await checkpoint(state, `Observation ${state.completedCandidates}/${state.totalCandidates} : ${programme.programme}`);
      await sleep(MIN_DELAY_MS);
    }
  }

  async function runCollection(restoredState = null) {
    if (running) throw new Error('Une collecte est déjà active dans cet onglet.');
    running = true;
    cancelled = false;
    let state = restoredState && restoredState.collectionId ? { ...restoredState, status: 'running', errors: restoredState.errors || [], plan: restoredState.plan || [], items: restoredState.items || [] } : initialState();
    try {
      await notify('BP_COLLECTION_STARTED', { state });
      if (!state.plan.length || state.phase === 'discovering') await discoverPlan(state);
      if (cancelled) throw new Error('Collecte interrompue volontairement. Les progrès sont conservés localement.');
      state.phase = 'collecting';
      await collectGauges(state);
      if (cancelled) throw new Error('Collecte interrompue volontairement. Les progrès sont conservés localement.');
      state.status = 'completed';
      state.phase = 'completed';
      state.observedAt = new Date().toISOString();
      state.items = state.items || [];
      await notify('BP_COLLECTION_COMPLETED', { state });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      state.status = cancelled ? 'paused' : 'paused';
      state.message = message;
      await notify('BP_COLLECTION_FAILED', { state, error: message });
    } finally { running = false; }
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === 'BP_START_COLLECTION') {
      runCollection().then(() => sendResponse({ ok: true })).catch((error) => sendResponse({ ok: false, error: String(error?.message || error) }));
      return true;
    }
    if (message?.type === 'BP_RESUME_COLLECTION') {
      if (!message.state?.collectionId) { sendResponse({ ok: false, error: 'Aucune collecte conservée à reprendre.' }); return false; }
      runCollection(message.state).then(() => sendResponse({ ok: true })).catch((error) => sendResponse({ ok: false, error: String(error?.message || error) }));
      return true;
    }
    if (message?.type === 'BP_CANCEL_COLLECTION') {
      cancelled = true;
      sendResponse({ ok: true });
      return false;
    }
    sendResponse({ ok: false, error: 'Commande inconnue.' });
    return false;
  });

  void notify('BP_SOURCE_READY', { url: location.href });
})();
