const fs = require('node:fs');
const { spawnSync } = require('node:child_process');
const rea = 'C:/Users/gabriel/Documents/Codex/2026-10-23/pre/.rea/node_modules/rea-agents/scripts/rea.mjs';
const css = selector => ({kind:'css', selector});
const input = {
  browser:{mode:'launch',executable_path:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true},
  start_url:{url:'https://brasabetbr.com/'},
  environment:{viewport:{width:1920,height:880},locale:'pt-BR',timezone:'America/Sao_Paulo'},
  secrets:[{secret_id:'reference_user',environment_variable:'BRASA_REFERENCE_USER'},{secret_id:'reference_pass',environment_variable:'BRASA_REFERENCE_PASS'}],
  actions:[
    {action:'wait_for_timeout',duration_ms:1500,step_id:'ready'},
    {action:'click',locator:css('[data-consent-act="reject"]'),timeout_ms:4000,step_id:'cookies'},
    {action:'click',locator:css('.account-actions [data-action="login"]'),timeout_ms:5000,step_id:'login-open'},
    {action:'fill',locator:css('#auth-form [name="identifier"]'),value:{source:'secret',secret_id:'reference_user'},step_id:'username'},
    {action:'fill',locator:css('#auth-form [name="password"]'),value:{source:'secret',secret_id:'reference_pass'},step_id:'password'},
    {action:'click',locator:css('#auth-form [type="submit"]'),step_id:'submit-login'},
    {action:'wait_for_timeout',duration_ms:2200,step_id:'after-login'},
    {action:'click',locator:css('[data-action="account"]'),timeout_ms:5000,step_id:'account-menu'},
    {action:'click',locator:css('#account-mask'),timeout_ms:5000,step_id:'close-account'},
    {action:'click',locator:css('.account-actions [data-action="wallet"]'),timeout_ms:5000,step_id:'deposit'},
    {action:'wait_for_timeout',duration_ms:500,step_id:'deposit-ready'},
    {action:'click',locator:css('[data-action="pix-tab"][data-tab="saque"]'),timeout_ms:5000,step_id:'withdraw'},
    {action:'click',locator:css('.bcpx-x'),timeout_ms:5000,step_id:'close-pix'},
    {action:'click',locator:css('.reference-event[data-event="66887172"] .odd[data-option="ac8277ec9edc2d65db3d5b0b"]'),timeout_ms:5000,step_id:'draft-pick'},
    {action:'goto',destination:{url:'https://brasabetbr.com/#/OF/'},wait_until:'domcontentloaded',step_id:'rewards'},
    {action:'wait_for_timeout',duration_ms:700,step_id:'rewards-ready'},
  ],
  capture:{after_each_step:['dom'],at_end:['dom'],events:['page-errors']},
};
const result=spawnSync(process.execPath,[rea,'capture-browser-scenario',JSON.stringify(input),'--format','json'],{encoding:'utf8',maxBuffer:40*1024*1024,timeout:95000});
if(result.status!==0)throw new Error(result.stderr.slice(-800));
let record=JSON.parse(result.stdout);record=record.data??record;
fs.writeFileSync('evidence/rea-auth-inspection.json',JSON.stringify(record));
const cheerio=require('cheerio');
for(const step of record.normalized_result.steps){
  const dom=step.artifacts.dom?.value?.text;
  if(dom&&['after-login','account-menu','deposit-ready','withdraw','draft-pick','rewards-ready'].includes(step.step_id)){
    fs.writeFileSync(`evidence/auth-${step.step_id}.html`,dom);
    const $=cheerio.load(dom);
    console.log({step:step.step_id,authenticated:$('body').hasClass('is-authenticated'),loginError:$('#auth-error').text(),modal:$('#modal-content').text().slice(0,260)});
  }
}
console.log({evidence:record.evidence_id,steps:record.normalized_result.steps.map(step=>({id:step.step_id,status:step.status,error:step.error}))});
