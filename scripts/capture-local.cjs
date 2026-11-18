const {chromium}=require('@playwright/test');
const fs=require('node:fs');
(async()=>{
 fs.mkdirSync('evidence/local',{recursive:true});
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const context=await browser.newContext({viewport:{width:1920,height:762},deviceScaleFactor:1.25,locale:'pt-BR',timezoneId:'America/Sao_Paulo'});
 await context.addInitScript(()=>localStorage.setItem('brasa-consent','necessary'));
 const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('http://127.0.0.1:3000/',{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:'evidence/local/home-guest.png'});
 await context.request.post('http://127.0.0.1:3000/api/demo',{data:{action:'register',name:'QA BrasaBet',email:`qa-layout-${Date.now()}@demo.local`,password:'Somente-demo-2026'}});
 await page.reload({waitUntil:'networkidle'});await page.screenshot({path:'evidence/local/home-authenticated.png'});
 await page.getByRole('button',{name:'Minha conta',exact:true}).click();await page.getByRole('dialog',{name:'Minha conta',exact:true}).screenshot({path:'evidence/local/account.png'});await page.keyboard.press('Escape');
 await page.getByRole('button',{name:'Saldo e depósito',exact:true}).click();const pix=page.getByRole('dialog',{name:'Pix',exact:true});await pix.screenshot({path:'evidence/local/deposit.png'});await pix.getByRole('tab',{name:'Sacar',exact:true}).click();await pix.screenshot({path:'evidence/local/withdraw.png'});await page.keyboard.press('Escape');
 await page.goto('http://127.0.0.1:3000/recompensas',{waitUntil:'networkidle'});await page.locator('.rewards-page').screenshot({path:'evidence/local/rewards.png'});
 for(const [name,url]of [['live','/ao-vivo'],['event','/evento/66887172'],['casino','/cassino']]){await page.goto('http://127.0.0.1:3000'+url,{waitUntil:'networkidle'});await page.screenshot({path:`evidence/local/${name}.png`});}
 const mobile=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,locale:'pt-BR',timezoneId:'America/Sao_Paulo',isMobile:true,hasTouch:true});await mobile.addInitScript(()=>localStorage.setItem('brasa-consent','necessary'));const small=await mobile.newPage();small.on('pageerror',error=>errors.push(error.message));
 for(const [name,url]of [['home','/'],['casino','/cassino'],['live','/ao-vivo'],['event','/evento/66887172']]){await small.goto('http://127.0.0.1:3000'+url,{waitUntil:'networkidle'});await small.screenshot({path:`evidence/local/mobile-${name}.png`});}
 fs.writeFileSync('evidence/local/capture-report.json',JSON.stringify({errors,at:new Date().toISOString()},null,2));console.log({errors});await browser.close();
})().catch(error=>{console.error(error.message);process.exitCode=1;});
