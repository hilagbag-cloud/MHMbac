import { readFile, access } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

const root = process.argv[2] || process.cwd();
const files = ['service-worker.js', 'content.js', 'console.js'];
const manifest = JSON.parse(await readFile(resolve(root, 'manifest.json'), 'utf8'));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(manifest.manifest_version === 3, 'Manifest V3 requis.');
assert(manifest.background?.service_worker === 'service-worker.js', 'Service worker officiel manquant.');
assert(Array.isArray(manifest.permissions) && manifest.permissions.includes('storage'), 'Permission storage manquante.');
assert(manifest.permissions.includes('alarms'), 'Permission alarms manquante pour la reprise.');
assert(manifest.permissions.includes('windows'), 'Permission windows manquante pour la console Windows.');
assert(!manifest.action?.default_popup, 'Le popup éphémère ne doit pas être utilisé.');
for (const iconPath of Object.values(manifest.icons || {})) await access(resolve(root, iconPath));

for (const file of files) {
  execFileSync('node', ['--check', resolve(root, file)], { stdio: 'pipe' });
}

const content = await readFile(resolve(root, 'content.js'), 'utf8');
const worker = await readFile(resolve(root, 'service-worker.js'), 'utf8');
const consoleCode = await readFile(resolve(root, 'console.js'), 'utf8');
const joined = `${content}\n${worker}\n${consoleCode}`;

assert(!/scoreItem|careerKeywords|AMB_KEEPALIVE|KeepAlive|AMB_IMPORT|importChoices/.test(joined), 'Une logique ancienne de score, import ou maintien de session subsiste.');
assert(/chrome\.storage\.local/.test(worker), 'La persistance locale Chrome est requise.');
assert(/chrome\.alarms/.test(worker), 'La reprise planifiée des lots est requise.');
assert(/chrome\.windows\.create/.test(worker), 'La console Windows indépendante est requise.');
assert(/syncToken:\s*''/.test(worker), 'Le package doit démarrer sans jeton de synchronisation.');
assert(!/gsk_|AIza|service_role|MHM_SYNC_CONFIG/.test(joined), 'Une clé ou une configuration héritée sensible est présente dans le package.');
assert(/authPayload/.test(worker) && /JSON\.stringify\(\{ \.\.\.entry\.payload, \.\.\.authPayload \}\)/.test(worker), 'Le credential du collecteur doit être ajouté au corps JSON de la synchronisation.');
assert(!/x-mhm-sync-token/.test(worker), 'Aucun jeton ne doit être transmis par en-tête HTTP.');
assert(/function ensureStorage\(\)/.test(worker) && /await ensureStorage\(\);/.test(worker), 'Les actions doivent attendre l’initialisation du stockage local.');
assert(/action: 'preflight'/.test(worker) && /requireVerifiedConfiguration\('before_scan'\)/.test(worker), 'Le prévol serveur doit être obligatoire avant une collecte.');
assert(/BP_TEST_CONFIG/.test(worker) && /testConfig/.test(consoleCode), 'La console doit permettre de retester la configuration enregistrée.');

console.log('Validation extension officielle : OK');
