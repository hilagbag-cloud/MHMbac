const fs = require('fs');
const path = require('path');

const root = '/tmp/bacpilot-stable';
const projectId = 'uxdfrnogiuefoqjpobpf';
const functions = ['notify-new-user', 'bacpilot-telegram', 'bacpilot-telegram-control'];

for (const name of functions) {
  const entrypoint = path.join(root, 'supabase', 'functions', name, 'index.ts');
  const input = {
    project_id: projectId,
    name,
    entrypoint_path: 'index.ts',
    verify_jwt: false,
    files: [{ name: 'index.ts', content: fs.readFileSync(entrypoint, 'utf8') }],
  };
  fs.writeFileSync(path.join('/tmp', `${name}-deploy.json`), JSON.stringify(input));
}

const migration = {
  project_id: projectId,
  name: 'bacpilot_operator_notifications',
  query: fs.readFileSync(path.join(root, 'supabase', 'migrations', '20260815_bacpilot_operator_notifications.sql'), 'utf8'),
};
fs.writeFileSync('/tmp/bacpilot-operator-notifications-migration.json', JSON.stringify(migration));

const operatorConsoleMigration = {
  project_id: projectId,
  name: 'bacpilot_telegram_operator_console',
  query: fs.readFileSync(path.join(root, 'supabase', 'migrations', '20260815_bacpilot_telegram_operator_console.sql'), 'utf8'),
};
fs.writeFileSync('/tmp/bacpilot-telegram-operator-console-migration.json', JSON.stringify(operatorConsoleMigration));
