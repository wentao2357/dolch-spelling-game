// Optional browser check: npm install --no-save playwright && npx playwright install chromium
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
const server = http.createServer((req, res) => {
  let file = path.resolve(root, '.' + req.url.split('?')[0]);
  if (!file.startsWith(root + path.sep) && file !== root) { res.writeHead(403); res.end(); return; }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file)) { console.error('Missing resource:',req.url);res.writeHead(404); res.end(); return; }
  res.setHeader('Content-Type', file.endsWith('.js') ? 'text/javascript' : file.endsWith('.css') ? 'text/css' : 'text/html');
  let source = fs.readFileSync(file);
  // Test-only access to module state; never shipped in the application.
  if (file.endsWith('/js/flight.js')) source += '\nwindow.flightTest = { setWord:(value)=>{word=value;letter=0;busy=false;mode="spell";spawn();}, snapshot:()=>({word,letter,round,active,paused,busy,stars:[...state.stars],attempts:state.attempts,correct:state.correct,learned:[...state.learned]}), wrong:()=>pick(gates.find(g=>g.userData.text!==(mode==="listen"?word:word[letter]))), correct:()=>pick(gates.find(g=>g.userData.text===(mode==="listen"?word:word[letter]))), advance:()=>{delay=0;}, collision:()=>{const g=gates.find(g=>g.userData.text===word);target.x=g.position.x;target.y=g.position.y;plane.position.set(g.position.x,g.position.y,2);g.position.z=2;}};';
  res.end(source);
});
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({headless:true, ...(process.env.CHROMIUM_PATH ? {executablePath:process.env.CHROMIUM_PATH}:{}), args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  try {
    const page = await browser.newPage({viewport:{width:1280,height:900}});
    const errors=[];page.on('pageerror',error=>errors.push(error.message));page.on('console',msg=>{if(msg.type()==='error')errors.push(msg.text());});
    await page.goto(url);await page.waitForFunction(()=>!!window.flightTest);
    assert.equal(await page.locator('#fallback').isVisible(), false);
    await page.click('#voice');await page.click('#music');await page.click('#start');
    await page.evaluate(()=>flightTest.wrong());
    let s=await page.evaluate(()=>flightTest.snapshot());assert.equal(s.attempts,1);assert.equal(s.correct,0);assert.equal(s.round,0);
    await page.evaluate(()=>flightTest.collision());await page.waitForFunction(()=>flightTest.snapshot().round===1);
    s=await page.evaluate(()=>flightTest.snapshot());assert.equal(s.stars[0],1);assert.equal(s.learned.length,1);
    await page.click('#pause');await page.waitForTimeout(150);assert.equal((await page.evaluate(()=>flightTest.snapshot())).paused,true);await page.click('#pause');
    for(let i=1;i<10;i++){await page.evaluate(()=>flightTest.advance());await page.waitForFunction(()=>!flightTest.snapshot().busy);await page.evaluate(()=>flightTest.correct());}
    await page.evaluate(()=>flightTest.advance());await page.waitForFunction(()=>!flightTest.snapshot().active);assert.match(await page.locator('dialog').innerText(),/Sky superstar/);
    await page.click('#close');await page.reload();await page.waitForFunction(()=>!!window.flightTest);assert.equal((await page.evaluate(()=>flightTest.snapshot())).stars[0],10);
    await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('little-sky-v1'));s.stars[0]=20;localStorage.setItem('little-sky-v1',JSON.stringify(s));});await page.reload();await page.waitForFunction(()=>!!window.flightTest);assert.equal(await page.locator('#level option').nth(1).isDisabled(),false);
    await page.selectOption('#mode','spell');await page.click('#start');await page.evaluate(()=>flightTest.wrong());assert.equal((await page.evaluate(()=>flightTest.snapshot())).letter,0);
    const word=(await page.evaluate(()=>flightTest.snapshot())).word;
    for(let i=0;i<word.length;i++)await page.evaluate(()=>flightTest.correct());
    assert.equal((await page.evaluate(()=>flightTest.snapshot())).round,1);
    for(const special of ['little',"don't"]){await page.evaluate(value=>flightTest.setWord(value),special);for(let i=0;i<special.length;i++){await page.evaluate(()=>flightTest.correct());assert.equal((await page.evaluate(()=>flightTest.snapshot())).letter,i+1);}}
    await page.setViewportSize({width:390,height:844});await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    await page.locator('[data-dir="up"]').click();
    await page.click('#parents');page.once('dialog',dialog=>dialog.dismiss());await page.click('#reset');assert.equal((await page.evaluate(()=>flightTest.snapshot())).stars[0],23);
    page.once('dialog',dialog=>dialog.accept());await page.click('#reset');assert.equal((await page.evaluate(()=>flightTest.snapshot())).stars[0],0);
    await page.goto(url+'/classic/');await page.waitForFunction(()=>document.querySelector('#app').textContent.length>30);
    assert.deepEqual(errors,[]);
    const offline=await browser.newPage();await offline.route('https://cdn.jsdelivr.net/**',route=>route.abort());await offline.goto(url);await offline.waitForSelector('#fallback:visible');assert.equal(await offline.locator('#start').isDisabled(),true);await offline.close();
    console.log('PASS: WebGL scene; listen collision/retry/scoring; pause; 10-word celebration; persistence; unlock; ordered spelling/repeated letters/apostrophe; CDN failure fallback; mobile layout/controls; reset cancel/confirm; Classic menu; no console errors.');
  } finally {await browser.close();server.close();}
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
