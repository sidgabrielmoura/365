const fs=require('node:fs');
const {spawnSync}=require('node:child_process');
const rea='C:/Users/gabriel/Documents/Codex/2026-10-23/pre/.rea/node_modules/rea-agents/scripts/rea.mjs';
const css=selector=>({kind:'css',selector});
const input={
  browser:{mode:'launch',executable_path:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true},
  start_url:{url:'https://brasabetbr.com/'},
  environment:{viewport:{width:1920,height:762},locale:'pt-BR',timezone:'America/Sao_Paulo'},
  actions:[
    {action:'wait_for_timeout',duration_ms:1600,step_id:'home'},
    {action:'click',locator:css('[data-consent-act="reject"]'),timeout_ms:5000,step_id:'cookies'},
    {action:'click',locator:css('.account-actions [data-action="register"]'),timeout_ms:5000,step_id:'register'},
    {action:'wait_for_timeout',duration_ms:400,step_id:'register-ready'},
    {action:'click',locator:css('dialog[open]>.modal-close'),timeout_ms:5000,step_id:'close-register'},
    ...[['live','#/IP/'],['event','#/EV/66887172'],['casino','#/CASINO/inicio'],['rewards','#/OF/']].flatMap(([id,hash])=>[
      {action:'goto',destination:{url:'https://brasabetbr.com/'+hash},wait_until:'domcontentloaded',step_id:id+'-navigate'},
      {action:'wait_for_timeout',duration_ms:1800,step_id:id+'-ready'},
    ]),
  ],
  capture:{after_each_step:['dom','screenshot'],at_end:['url'],events:['page-errors']},
};
const output=spawnSync(process.execPath,[rea,'capture-browser-scenario',JSON.stringify(input),'--format','json'],{encoding:'utf8',maxBuffer:40*1024*1024,timeout:110000});
if(output.status!==0)throw new Error(output.stderr.slice(-1200));
let record=JSON.parse(output.stdout);record=record.data??record;
fs.writeFileSync('evidence/rea-public-ui.json',JSON.stringify(record));
for(const step of record.normalized_result.steps){
  if(!['register-ready','live-ready','event-ready','casino-ready','rewards-ready'].includes(step.step_id))continue;
  if(step.artifacts?.dom?.value)fs.writeFileSync('evidence/reference-'+step.step_id+'.html',step.artifacts.dom.value.text);
  if(step.artifacts?.screenshot?.value)fs.writeFileSync('evidence/reference-'+step.step_id+'.png',Buffer.from(step.artifacts.screenshot.value.data_base64,'base64'));
}
console.log({evidence:record.evidence_id,steps:record.normalized_result.steps.map(step=>({id:step.step_id,status:step.status,error:step.error}))});
