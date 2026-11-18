const fs=require('node:fs'),{spawnSync}=require('node:child_process');
const css=selector=>({kind:'css',selector});
const input={browser:{mode:'launch',executable_path:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true},start_url:{url:'https://brasabetbr.com/'},environment:{viewport:{width:1920,height:900},locale:'pt-BR',timezone:'America/Sao_Paulo'},secrets:[{secret_id:'reference_user',environment_variable:'BRASA_REFERENCE_USER'},{secret_id:'reference_pass',environment_variable:'BRASA_REFERENCE_PASS'}],actions:[
  {action:'wait_for_timeout',duration_ms:1500,step_id:'ready'},
  {action:'click',locator:css('[data-consent-act="reject"]'),timeout_ms:5000,step_id:'cookies'},
  {action:'click',locator:css('.account-actions [data-action="login"]'),timeout_ms:5000,step_id:'login'},
  {action:'fill',locator:css('#auth-form [name="identifier"]'),value:{source:'secret',secret_id:'reference_user'},step_id:'identifier'},
  {action:'fill',locator:css('#auth-form [name="password"]'),value:{source:'secret',secret_id:'reference_pass'},step_id:'password'},
  {action:'click',locator:css('#auth-form [type="submit"]'),step_id:'submit'},
  {action:'wait_for_timeout',duration_ms:1500,step_id:'authenticated'},
  ...[['bank','banco/saldo'],['contact','conta/contato'],['password-page','conta/senha'],['address','conta/endereco'],['preferences','conta/preferencias'],['devices','conta/aparelhos'],['referrals','conta/indique']].flatMap(([id,hash])=>[{action:'goto',destination:{url:'https://brasabetbr.com/#/ME/'+hash},wait_until:'domcontentloaded',step_id:id+'-navigate'},{action:'wait_for_timeout',duration_ms:1200,step_id:id}]),
],capture:{after_each_step:['dom','screenshot'],at_end:['url'],events:['page-errors']}};
const result=spawnSync(process.execPath,['C:/Users/gabriel/Documents/Codex/2026-10-23/pre/.rea/node_modules/rea-agents/scripts/rea.mjs','capture-browser-scenario',JSON.stringify(input),'--format','json'],{encoding:'utf8',maxBuffer:40*1024*1024,timeout:95000});
if(result.status!==0)throw new Error(result.stderr.slice(-1000));let record=JSON.parse(result.stdout);record=record.data??record;fs.writeFileSync('evidence/auth-account-pages.json',JSON.stringify(record));for(const step of record.normalized_result.steps){if(!['bank','contact','password-page','address','preferences','devices','referrals'].includes(step.step_id))continue;const a=step.artifacts;if(a.dom?.value)fs.writeFileSync('evidence/auth-'+step.step_id+'.html',a.dom.value.text);if(a.screenshot?.value)fs.writeFileSync('evidence/auth-'+step.step_id+'.png',Buffer.from(a.screenshot.value.data_base64,'base64'));}console.log({evidence:record.evidence_id,steps:record.normalized_result.steps.map(s=>({id:s.step_id,status:s.status,error:s.error}))});
