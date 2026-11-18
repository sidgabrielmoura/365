const fs = require('node:fs');
const { spawnSync } = require('node:child_process');
const rea = 'C:/Users/gabriel/Documents/Codex/2026-10-23/pre/.rea/node_modules/rea-agents/scripts/rea.mjs';
const urls = ['#/IP/', '#/EV/66887172', '#/HO/18', '#/HO/13', '#/HO/12'];
const actions = urls.flatMap((hash,index) => [
  { action: 'goto', destination: { url:'https://brasabetbr.com/' + hash }, step_id:'page-' + index, wait_until:'domcontentloaded' },
  { action: 'wait_for_timeout', duration_ms:1700, step_id:'loaded-' + index },
]);
const input = {
  browser:{mode:'launch', executable_path:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true},
  start_url:{url:'https://brasabetbr.com/'},
  environment:{viewport:{width:1920,height:900},locale:'pt-BR',timezone:'America/Sao_Paulo'},
  actions,
  capture:{after_each_step:['dom'],at_end:['dom'],events:['network','page-errors'],network:{response_body:true},limits:{max_events:2200,max_network_transactions:380,max_network_body_bytes:12000000,max_network_body_allocation_bytes:22000000,max_total_event_allocation_bytes:42000000}},
};
const result = spawnSync(process.execPath,[rea,'capture-browser-scenario',JSON.stringify(input),'--format','json'],{encoding:'utf8',maxBuffer:70*1024*1024,timeout:180000});
if(result.status!==0)throw new Error(result.stderr.slice(-1000));
const record=JSON.parse(result.stdout);
fs.writeFileSync('evidence/rea-sections.json',JSON.stringify(record));
const n=record.normalized_result;
console.log({id:record.evidence_id,completeness:n.completeness,steps:n.steps.map(s=>({id:s.step_id,status:s.status})),responses:n.events.items.filter(e=>e.kind==='response'&&['fetch','xhr'].includes(e.resource_type)).map(e=>e.url.url)});
