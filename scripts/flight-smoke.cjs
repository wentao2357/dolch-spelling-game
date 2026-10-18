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
  if (file.endsWith('/js/flight.js')) source += `
window.flightTest = {
 setWord:(value)=>{word=value;letter=0;busy=false;mode="spell";spawn();},
 setPhrase:(value)=>{word=value;phraseWords=value.split(' ');phraseIndex=0;busy=false;mode='phrase';phraseTrail();spawn();},
 snapshot:()=>({word,letter,round,active,paused,busy,phraseIndex,phraseWords:[...phraseWords],streak,phrases:[...state.phrases],speed,fov:camera.fov,gateZ:gates[0]?.position.z,sky:{...livingSky.state},background:scene.background.getHex(),stars:[...state.stars],attempts:state.attempts,correct:state.correct,learned:[...state.learned]}),
 skyAt:(seconds)=>{clock=seconds;updateSky();},
 wrong:()=>pick(gates.find(g=>g.userData.text!==answer())),
 correct:()=>pick(gates.find(g=>g.userData.text===answer())),
 advance:()=>{delay=0;},
 collision:()=>{const g=gates.find(g=>g.userData.text===answer());target.x=g.position.x;target.y=g.position.y;plane.position.set(g.position.x,g.position.y,2);g.position.z=1.3;}
};`;
  res.end(source);
});
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({headless:true, ...(process.env.CHROMIUM_PATH ? {executablePath:process.env.CHROMIUM_PATH}:{}), args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  try {
    const context=await browser.newContext({viewport:{width:1280,height:900}});
    if(process.env.THREE_MODULE_PATH) await context.route('https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js',route=>route.fulfill({path:process.env.THREE_MODULE_PATH,contentType:'text/javascript'}));
    const page = await context.newPage({viewport:{width:1280,height:900}});
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
    // Inspect the actual continuous sky, including near-boundary continuity.
    const skies=[];
    for(const seconds of [0,20,40,60,80]){
      await page.evaluate(t=>flightTest.skyAt(t),seconds);
      const sky=await page.evaluate(()=>flightTest.snapshot());skies.push(sky);
      if(process.env.SMOKE_SCREENSHOTS){fs.mkdirSync(process.env.SMOKE_SCREENSHOTS,{recursive:true});await page.screenshot({path:path.join(process.env.SMOKE_SCREENSHOTS,`sky-${seconds}.png`)});}
      assert.equal(await page.locator('#sky-indicator').isVisible(),true);
      assert.match(await page.locator('#sky-indicator').getAttribute('aria-label'),new RegExp(sky.sky.phase));
    }
    assert.deepEqual(skies.map(s=>s.sky.phase),['day','sunset','night','dawn','day']);
    assert(skies[2].sky.darkness>.99);assert(skies[0].sky.darkness<.01);
    assert.notEqual(skies[0].background,skies[2].background);
    assert.notEqual(skies[0].sky.weather,skies[2].sky.weather);
    await page.evaluate(()=>flightTest.skyAt(79.99));const edge=await page.evaluate(()=>flightTest.snapshot().background);
    await page.evaluate(()=>flightTest.skyAt(80));assert(Math.abs(edge-(await page.evaluate(()=>flightTest.snapshot().background)))<0x020202);

    // Phrase mode has its own fresh browser storage and mocked English voice.
    const phraseContext=await browser.newContext({hasTouch:true,viewport:{width:1280,height:900}});
    if(process.env.THREE_MODULE_PATH) await phraseContext.route('https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js',route=>route.fulfill({path:process.env.THREE_MODULE_PATH,contentType:'text/javascript'}));
    const phrase=await phraseContext.newPage();
    phrase.on('pageerror',e=>errors.push(e.message));phrase.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    await phrase.addInitScript(()=>{
      window.spoken=[];window.SpeechSynthesisUtterance=class {constructor(text){this.text=text;}};
      Object.defineProperty(window,'speechSynthesis',{value:{cancel(){},getVoices(){return [{lang:'en-US'}];},speak(u){window.spoken.push({text:u.text,rate:u.rate,lang:u.lang});setTimeout(()=>u.onend?.(),0);}}});
    });
    await phrase.goto(url);await phrase.waitForFunction(()=>!!window.flightTest);
    await phrase.selectOption('#mode','phrase');await phrase.click('#start');
    let ps=await phrase.evaluate(()=>flightTest.snapshot());
    assert.equal((await phrase.evaluate(()=>spoken.at(-1))).text,ps.word);
    assert.deepEqual(await phrase.evaluate(()=>({lang:spoken.at(-1).lang,rate:spoken.at(-1).rate})),{lang:'en-US',rate:.85});
    await phrase.click('#hear');assert.equal((await phrase.evaluate(()=>spoken.at(-1))).text,ps.word);
    await phrase.evaluate(()=>flightTest.setPhrase('I can see you'));
    await phrase.evaluate(()=>flightTest.correct());await phrase.evaluate(()=>flightTest.correct());
    ps=await phrase.evaluate(()=>flightTest.snapshot());assert.equal(ps.stars[0],0);assert.equal(ps.phraseIndex,2);assert.equal(ps.streak,2);assert.equal(ps.phrases[0],0);
    assert.equal(await phrase.locator('#phrase-trail .caught').count(),2);
    if(process.env.SMOKE_SCREENSHOTS)await phrase.screenshot({path:path.join(process.env.SMOKE_SCREENSHOTS,'phrase.png')});
    await phrase.evaluate(()=>flightTest.wrong());ps=await phrase.evaluate(()=>flightTest.snapshot());
    assert.equal(ps.phraseIndex,0);assert.equal(ps.streak,0);assert.equal(ps.stars[0],0);assert.equal(ps.learned.length,0);
    assert.equal((await phrase.evaluate(()=>spoken.at(-1))).text,'Try again. I can see you');
    for(let i=0;i<4;i++)await phrase.evaluate(()=>flightTest.correct());
    ps=await phrase.evaluate(()=>flightTest.snapshot());assert.equal(ps.stars[0],4);assert.equal(ps.phrases[0],1);assert.equal(ps.round,1);assert.equal(ps.streak,4);
    assert.equal(await phrase.locator('#spelling').innerText(),'I can see you');
    assert.equal((await phrase.evaluate(()=>spoken.at(-1))).text,'I can see you');
    await phrase.evaluate(()=>flightTest.setPhrase('I can'));
    await phrase.evaluate(()=>flightTest.correct());assert.equal((await phrase.evaluate(()=>flightTest.snapshot())).stars[0],4);
    await phrase.evaluate(()=>flightTest.correct());ps=await phrase.evaluate(()=>flightTest.snapshot());
    assert.equal(ps.stars[0],7);assert.equal(ps.phrases[0],2);assert.equal(ps.streak,6);
    await phrase.evaluate(()=>flightTest.setPhrase('we can go'));
    await phrase.evaluate(()=>flightTest.correct());await phrase.evaluate(()=>flightTest.wrong());
    ps=await phrase.evaluate(()=>flightTest.snapshot());assert.equal(ps.stars[0],7);assert.equal(ps.phrases[0],2);assert.equal(ps.phraseIndex,0);assert.equal(ps.streak,0);
    await phrase.click('#parents');assert.match(await phrase.locator('dialog').innerText(),/2 phrases/);await phrase.click('#close');

    // Keyboard and pointer holds ease speed up/down and preserve actual collisions.
    assert.equal(await phrase.locator('#boost').isVisible(),true);
    await phrase.waitForFunction(()=>!flightTest.snapshot().paused);
    await phrase.locator('#hear').focus();await phrase.keyboard.down('Space');await phrase.waitForFunction(()=>flightTest.snapshot().speed>1.8);
    ps=await phrase.evaluate(()=>flightTest.snapshot());assert(ps.speed<=2);assert(ps.fov>53);
    assert.equal(await phrase.locator('#boost').getAttribute('aria-pressed'),'true');
    await phrase.evaluate(()=>flightTest.collision());await phrase.waitForFunction(()=>flightTest.snapshot().phraseIndex===1);
    await phrase.keyboard.up('Space');ps=await phrase.evaluate(()=>flightTest.snapshot());assert(ps.speed>1);
    await phrase.waitForFunction(()=>flightTest.snapshot().speed<1.1);assert.equal(await phrase.evaluate(()=>scrollY),0);
    const touch=await phraseContext.newCDPSession(phrase);const rect=await phrase.locator('#boost').boundingBox();
    await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:rect.x+rect.width/2,y:rect.y+rect.height/2}]});await phrase.waitForFunction(()=>flightTest.snapshot().speed>1.8);
    await touch.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});await phrase.waitForFunction(()=>flightTest.snapshot().speed<1.1);
    await phrase.reload();await phrase.waitForFunction(()=>!!window.flightTest);ps=await phrase.evaluate(()=>flightTest.snapshot());
    assert.equal(ps.phrases[0],2);assert.equal(ps.stars[0],7);
    await phrase.click('#parents');phrase.once('dialog',d=>d.accept());await phrase.click('#reset');assert.equal((await phrase.evaluate(()=>flightTest.snapshot())).phrases[0],0);
    await phrase.close();await phraseContext.close();
    await page.setViewportSize({width:390,height:844});await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    if(process.env.SMOKE_SCREENSHOTS)await page.screenshot({path:path.join(process.env.SMOKE_SCREENSHOTS,'mobile.png')});
    await page.locator('[data-dir="up"]').click();
    await page.click('#parents');page.once('dialog',dialog=>dialog.dismiss());await page.click('#reset');assert.equal((await page.evaluate(()=>flightTest.snapshot())).stars[0],23);
    page.once('dialog',dialog=>dialog.accept());await page.click('#reset');assert.equal((await page.evaluate(()=>flightTest.snapshot())).stars[0],0);
    await page.goto(url+'/classic/');await page.waitForFunction(()=>document.querySelector('#app').textContent.length>30);
    assert.deepEqual(errors,[]);
    const offline=await context.newPage();await offline.route('https://cdn.jsdelivr.net/**',route=>route.abort());await offline.goto(url);await offline.waitForSelector('#fallback:visible');assert.equal(await offline.locator('#start').isDisabled(),true);await offline.close();
    console.log('PASS: sky cycle/indicator/weather; unbroken phrase scoring/reset/bonus/trail/voice/persistence; Space/touch boost/easing/boosted collision; WebGL scene; listen collision/retry/scoring; pause; 10-word celebration; persistence; unlock; ordered spelling/repeated letters/apostrophe; CDN failure fallback; mobile layout/controls; reset cancel/confirm; Classic menu; no console errors.');
  } finally {await browser.close();server.close();}
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
