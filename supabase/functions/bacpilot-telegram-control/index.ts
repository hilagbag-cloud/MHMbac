const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
});

async function telegramApi(token: string, method: string, body: Record<string, unknown>) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify(body),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.ok) throw new Error(`Telegram ${method} indisponible.`);
    return payload.result;
  } finally {
    clearTimeout(timeout);
  }
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') return json({ ok: false, error: 'Méthode non autorisée.' }, 405);

  const controlSecret = Deno.env.get('BACPILOT_TELEGRAM_CONTROL_SECRET');
  const telegramToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
  const operatorChatId = Deno.env.get('TELEGRAM_CHAT_ID');
  const telegramWebhookSecret = Deno.env.get('TELEGRAM_WEBHOOK_SECRET');
  const webhookUrl = Deno.env.get('TELEGRAM_WEBHOOK_URL');
  if (!controlSecret || !telegramToken || !operatorChatId || !telegramWebhookSecret || !webhookUrl) {
    return json({ ok: false, error: 'Configuration serveur incomplète.' }, 500);
  }

  if (request.headers.get('x-bacpilot-control-secret') !== controlSecret) {
    return json({ ok: false, error: 'Action non autorisée.' }, 401);
  }

  let body: { action?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'Payload JSON invalide.' }, 400);
  }

  if (body.action !== 'configure' && body.action !== 'test') {
    return json({ ok: false, error: 'Action inconnue.' }, 400);
  }

  try {
    if (body.action === 'configure') {
      await telegramApi(telegramToken, 'setMyCommands', {
        scope: { type: 'chat', chat_id: Number(operatorChatId) },
        commands: [
          { command: 'status', description: 'État des données et des comptes' },
          { command: 'stats', description: 'Statistiques agrégées BacPilot' },
          { command: 'health', description: 'Vérifier la fraîcheur des données' },
          { command: 'user', description: 'Fiche utilisateur par e-mail ou ID' },
          { command: 'beta_add', description: 'Préparer une activation bêta' },
          { command: 'beta_pause', description: 'Préparer une pause bêta' },
          { command: 'beta_revoke', description: 'Préparer une révocation bêta' },
          { command: 'beta_list', description: 'Lister les bêta-testeurs' },
          { command: 'feedback', description: 'Voir les derniers retours bêta' },
          { command: 'pending', description: 'Voir les actions à confirmer' },
          { command: 'confirm', description: 'Confirmer une action' },
          { command: 'cancel', description: 'Annuler une action' },
          { command: 'test', description: 'Vérifier le bot' },
          { command: 'help', description: 'Afficher les commandes' },
        ],
      });
      await telegramApi(telegramToken, 'setWebhook', {
        url: webhookUrl,
        secret_token: telegramWebhookSecret,
        allowed_updates: ['message'],
        drop_pending_updates: false,
      });
    }

    await telegramApi(telegramToken, 'sendMessage', {
      chat_id: operatorChatId,
      text: body.action === 'configure'
        ? 'BacPilot — bot configuré. Envoie /help pour voir les commandes disponibles.'
        : 'BacPilot — test de notification réussi.',
      disable_web_page_preview: true,
    });
    return json({ ok: true, action: body.action });
  } catch (error) {
    console.error('Erreur de configuration Telegram:', error instanceof Error ? error.message : 'Erreur inconnue');
    return json({ ok: false, error: 'Configuration Telegram impossible.' }, 502);
  }
});
