const fs=require('node:fs'),path=require('node:path'),net=require('node:net');
const {spawn}=require('node:child_process');
const {chromium}=require('@playwright/test');
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function freePort(){const server=net.createServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const port=server.address().port;await new Promise(resolve=>server.close(resolve));return port;}
(async()=>{
  const port=await freePort(),base=`http://127.0.0.1:${port}`;
  const child=spawn(process.execPath,[require.resolve('next/dist/bin/next'),'start','--hostname','127.0.0.1','--port',String(port)],{cwd:process.cwd(),windowsHide:true,stdio:['ignore','pipe','pipe']});
  let output='',browser;child.stdout.on('data',chunk=>output+=chunk);child.stderr.on('data',chunk=>output+=chunk);
  const checks=[],errors=[];
  try{
    let ready=false;for(let attempt=0;attempt<50;attempt++){try{if((await fetch(base,{signal:AbortSignal.timeout(1000)})).ok){ready=true;break;}}catch{}await pause(500);}
    if(!ready)throw new Error('Servidor de produção não iniciou. '+output.slice(-800));
    browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
    const context=await browser.newContext({baseURL:base,viewport:{width:1920,height:762},deviceScaleFactor:1.25,locale:'pt-BR',timezoneId:'America/Sao_Paulo'});
    await context.addInitScript(()=>localStorage.setItem('brasa-consent','necessary'));
    const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
    for(const [url,selector]of [['/','.reference-event'],['/ao-vivo','.live-row'],['/evento/66887172','.match-header'],['/cassino','.bcc-dest .bcc-g'],['/cassino/todos?pagina=2','.casino-local-grid .bcc-g'],['/cassino/jogo/PGSOFT%3A1695365','.casino-play'],['/recompensas','.reward-overview'],['/conta','.me-nav']]){
      await page.goto(url,{waitUntil:'domcontentloaded'});await page.locator(selector).first().waitFor({state:'visible',timeout:15000});checks.push({url,result:'passed'});
      if(url==='/')await page.screenshot({path:'evidence/local/production-home.png'});
      if(url.includes('/jogo/'))await page.screenshot({path:'evidence/local/production-game.png'});
    }
    async function post(data){const response=await context.request.post('/api/demo',{data});if(!response.ok())throw new Error('API de produção: '+await response.text());return response.json();}
    await post({action:'demo'});const {deposit}=await post({action:'pix-create',amount:20});const confirmation=await post({action:'pix-confirm',id:deposit.id});if(confirmation.session.balance!==20)throw new Error('Saldo da produção divergente');
    await page.goto('/conta/banco',{waitUntil:'networkidle'});await page.locator('.me-balance').waitFor();checks.push({flow:'Sessão HttpOnly e crédito Pix fictício no SQLite',result:'passed'});await page.screenshot({path:'evidence/local/production-bank.png'});
    await page.goto('/conta',{waitUntil:'networkidle'});await page.getByRole('button',{name:'Minha conta',exact:true}).click();await page.getByRole('dialog',{name:'Minha conta',exact:true}).screenshot({path:'evidence/local/production-account.png'});await page.keyboard.press('Escape');
    const image=await context.request.get('/api/casino/image/PGSOFT%3A88');if(image.status()!==200||!image.headers()['content-type'].startsWith('image/'))throw new Error('Cache de imagem não respondeu corretamente');checks.push({flow:'Cache local de imagem do catálogo',result:'passed'});
    if(errors.length)throw new Error('Erros no navegador: '+errors.join('; '));
    fs.writeFileSync('evidence/local/production-checks.json',JSON.stringify({at:new Date().toISOString(),checks,browserErrors:errors},null,2));
    console.log({productionChecks:checks.length,browserErrors:errors});
  }finally{
    if(browser)await browser.close();child.kill();
    fs.writeFileSync('evidence/local/production-server.log',output);
  }
})().catch(error=>{console.error(error.message);process.exitCode=1;});
