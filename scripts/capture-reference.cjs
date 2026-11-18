const fs = require('node:fs');
const { spawnSync } = require('node:child_process');
const rea = 'C:/Users/gabriel/Documents/Codex/2026-10-23/pre/.rea/node_modules/rea-agents/scripts/rea.mjs';
const css = selector => ({ kind: 'css', selector });
const input = {
  browser: { mode: 'launch', executable_path: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true },
  start_url: { url: 'https://brasabetbr.com/' },
  environment: { viewport: { width: 1920, height: 880 }, locale: 'pt-BR', timezone: 'America/Sao_Paulo' },
  actions: [
    { action: 'wait_for_timeout', duration_ms: 1700, step_id: 'ready' },
    { action: 'click', locator: css('[data-consent-act="reject"]'), timeout_ms: 4000, step_id: 'cookies' },
    { action: 'click', locator: css('.account-actions [data-action="login"]'), timeout_ms: 5000, step_id: 'open-login' },
  ],
  capture: { at_end: ['dom', 'screenshot', 'url'], after_each_step: ['dom'], events: ['page-errors'] },
};
const result = spawnSync(process.execPath, [rea, 'capture-browser-scenario', JSON.stringify(input), '--format', 'json'], { encoding: 'utf8', maxBuffer: 30 * 1024 * 1024, timeout: 55000 });
if (result.status !== 0) throw new Error(result.stderr.slice(-1500));
const envelope = JSON.parse(result.stdout);
const record = envelope.structuredContent || envelope.evidence || envelope;
fs.writeFileSync('evidence/login-ui.json', JSON.stringify(record));
console.log(JSON.stringify(record.normalized_result.steps.map(step => ({ id: step.step_id, status: step.status, error: step.error })), null, 2));
const artifacts = record.normalized_result.steps.filter(step => step.artifacts?.dom?.state === 'captured').at(-1)?.artifacts;
if (artifacts) {
  fs.writeFileSync('evidence/login-original.html', artifacts.dom.value.text);
  if (artifacts.screenshot?.value) fs.writeFileSync('evidence/login-original.png', Buffer.from(artifacts.screenshot.value.data_base64, 'base64'));
  console.log(artifacts.dom.value.text.slice(-7000).replace(/<script[\s\S]*?<\/script>/g, '').slice(0,4500));
}
