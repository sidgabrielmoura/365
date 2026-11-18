const fs = require('node:fs');
const {spawnSync} = require('node:child_process');
const input = {
  browser: {mode:'launch',executable_path:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true},
  start_url: {url:'https://brasabetbr.com/'},
  environment: {viewport:{width:1920,height:900},locale:'pt-BR',timezone:'America/Sao_Paulo'},
  actions: [
    {action:'wait_for_timeout',duration_ms:1600,step_id:'home-ready'},
    {action:'click',locator:{kind:'css',selector:'[data-consent-act="reject"]'},timeout_ms:5000,step_id:'consent'},
    {action:'click',locator:{kind:'css',selector:'.reference-event[data-event="66887172"] .event-stats'},timeout_ms:10000,step_id:'open-statistics'},
    {action:'wait_for_timeout',duration_ms:300,step_id:'statistics-ready'},
  ],
  capture: {at_end:['dom','screenshot','url'],events:['page-errors']},
};
const rea = 'C:/Users/gabriel/Documents/Codex/2026-10-23/pre/.rea/node_modules/rea-agents/scripts/rea.mjs';
const result = spawnSync(process.execPath,[rea,'capture-browser-scenario',JSON.stringify(input),'--format','json'],{encoding:'utf8',maxBuffer:20*1024*1024,timeout:60000});
if(result.status!==0)throw new Error(result.stderr.slice(-1000));
let record=JSON.parse(result.stdout);record=record.data??record;
fs.writeFileSync('evidence/rea-event-stats.json',JSON.stringify(record));
const artifacts=record.normalized_result.steps.filter(step=>step.artifacts?.dom?.value).at(-1)?.artifacts;
if(artifacts?.dom?.value)fs.writeFileSync('evidence/reference-event-stats.html',artifacts.dom.value.text);
if(artifacts?.screenshot?.value)fs.writeFileSync('evidence/reference-event-stats.png',Buffer.from(artifacts.screenshot.value.data_base64,'base64'));
console.log({evidence:record.evidence_id,steps:record.normalized_result.steps.map(step=>({id:step.step_id,status:step.status,error:step.error}))});
