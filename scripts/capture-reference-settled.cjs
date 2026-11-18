const fs=require('node:fs'),{spawnSync}=require('node:child_process');
const css=selector=>({kind:'css',selector});
const input={browser:{mode:'launch',executable_path:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true},start_url:{url:'https://brasabetbr.com/'},environment:{viewport:{width:1920,height:900},locale:'pt-BR',timezone:'America/Sao_Paulo'},secrets:[{secret_id:'reference_user',environment_variable:'BRASA_REFERENCE_USER'},{secret_id:'reference_pass',environment_variable:'BRASA_REFERENCE_PASS'}],actions:[
{action:'wait_for_timeout',duration_ms:1500,step_id:'ready'},
{action:'click',locator:css('[data-consent-act="reject"]'),timeout_ms:5000,step_id:'consent'},
{action:'click',locator:css('.account-actions [data-action="login"]'),step_id:'login'},
{action:'fill',locator:css('#auth-form [name="identifier"]'),value:{source:'secret',secret_id:'reference_user'},step_id:'identifier'},
{action:'fill',locator:css('#auth-form [name="password"]'),value:{source:'secret',secret_id:'reference_pass'},step_id:'password'},
{action:'click',locator:css('#auth-form [type="submit"]'),step_id:'submit'},
{action:'wait_for_timeout',duration_ms:1400,step_id:'authenticated'},
{action:'goto',destination:{url:'https://brasabetbr.com/#/MB/SB'},wait_until:'domcontentloaded',step_id:'settled-navigate'},
{action:'wait_for_timeout',duration_ms:1500,step_id:'settled-ready'},
{action:'click',locator:css('.mb-card .mb-head'),timeout_ms:5000,step_id:'expand'},
{action:'wait_for_timeout',duration_ms:300,step_id:'settled-expanded'},
{action:'click',locator:css('[data-action="account"]'),step_id:'account'},
{action:'click',locator:css('[data-action="logout"]'),step_id:'logout'},
],capture:{after_each_step:['dom','screenshot'],at_end:['url'],events:['page-errors']}};
const result=spawnSync(process.execPath,['C:/Users/gabriel/Documents/Codex/2026-10-23/pre/.rea/node_modules/rea-agents/scripts/rea.mjs','capture-browser-scenario',JSON.stringify(input),'--format','json'],{encoding:'utf8',maxBuffer:30*1024*1024,timeout:75000});
if(result.status!==0)throw new Error(result.stderr.slice(-1000));let record=JSON.parse(result.stdout);record=record.data??record;fs.writeFileSync('evidence/auth-bets-settled-reference.json',JSON.stringify(record));const artifacts=record.normalized_result.steps.find(s=>s.step_id==='settled-expanded')?.artifacts;if(artifacts?.dom?.value)fs.writeFileSync('evidence/auth-settled-expanded.html',artifacts.dom.value.text);if(artifacts?.screenshot?.value)fs.writeFileSync('evidence/auth-settled-expanded.png',Buffer.from(artifacts.screenshot.value.data_base64,'base64'));console.log({evidence:record.evidence_id,steps:record.normalized_result.steps.map(step=>({id:step.step_id,status:step.status,error:step.error}))});
