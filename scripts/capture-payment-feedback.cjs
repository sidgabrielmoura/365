const fs=require('node:fs'),{chromium}=require('@playwright/test');
(async()=>{
  const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
  try{
    const context=await browser.newContext({baseURL:'http://127.0.0.1:3000',viewport:{width:1920,height:900},deviceScaleFactor:1.25,locale:'pt-BR',timezoneId:'America/Sao_Paulo'});
    await context.addInitScript(()=>localStorage.setItem('brasa-consent','necessary'));
    await context.request.post('/api/demo',{data:{action:'demo'}});
    const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.goto('/',{waitUntil:'networkidle'});await page.getByRole('button',{name:'Saldo e depósito',exact:true}).click();
    const pix=page.getByRole('dialog',{name:'Pix',exact:true});
    await pix.getByRole('textbox',{name:'Valor do depósito',exact:true}).fill('10');
    await pix.getByRole('button',{name:'Gerar Pix',exact:true}).click();
    await pix.getByRole('button',{name:'Simular pagamento',exact:true}).click();
    await pix.getByRole('heading',{name:'Depósito confirmado!',exact:true}).waitFor();
    await page.waitForTimeout(1000);
    await pix.screenshot({path:'evidence/local/pix-confirmed.png'});
    const confirmation={title:await pix.locator('.bcpx-result h3').innerText(),amount:await pix.locator('.bcpx-result-amount').innerText(),balance:await pix.locator('.bcpx-bal b').innerText(),tabs:await pix.locator('.bcpx-tabs').count()};
    await page.setViewportSize({width:390,height:844});await pix.screenshot({path:'evidence/local/pix-confirmed-mobile.png'});
    await pix.getByRole('button',{name:'Entendi',exact:true}).click();await page.setViewportSize({width:1920,height:900});
    await page.locator('[data-event="66887172"] .odd').first().click();
    const slip=page.getByRole('complementary',{name:'Bilhete de apostas',exact:true});await slip.getByRole('textbox',{name:'Valor da aposta',exact:true}).fill('2');
    await slip.getByRole('button',{name:/Fazer aposta/}).click();await page.locator('#toast').waitFor();
    await page.screenshot({path:'evidence/local/bet-registered-toast.png'});
    const registration={toast:await page.locator('#toast').innerText(),dialogs:await page.locator('dialog[open]').count(),slips:await page.locator('.betslip').count(),balance:await page.getByRole('button',{name:'Saldo e depósito',exact:true}).innerText()};
    const report={at:new Date().toISOString(),confirmation,registration,browserErrors:errors};fs.writeFileSync('evidence/local/payment-feedback-checks.json',JSON.stringify(report,null,2));console.log(report);
  }finally{await browser.close();}
})().catch(error=>{console.error(error.message);process.exitCode=1;});
