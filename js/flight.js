import { createLivingSky } from './living-sky.js';
import { WORDS, LEVEL_KEYS, PHRASES, shuffle } from './words.js';
const $ = s => document.querySelector(s);
const names = ['Pre-Primer','Primer','First Grade','Second Grade','Third Grade'];
const KEY = 'little-sky-v1';
let saved;
try { saved = JSON.parse(localStorage.getItem(KEY)); } catch {}
const state = { stars: [0,0,0,0,0], learned: [], attempts: 0, correct: 0, phrases: [0,0,0,0,0], music: true, voice: true };
if (saved && typeof saved === 'object') {
  if (Array.isArray(saved.stars) && saved.stars.length === 5) state.stars = saved.stars.map(n => Number.isFinite(n) ? Math.max(0,n) : 0);
  if (Array.isArray(saved.phrases) && saved.phrases.length === 5) state.phrases = saved.phrases.map(n => Number.isFinite(n) ? Math.max(0,Math.floor(n)) : 0);
  if (Array.isArray(saved.learned)) state.learned = saved.learned.filter(w => Object.values(WORDS).flat().includes(w));
  for (const key of ['attempts','correct']) if (Number.isFinite(saved[key])) state[key] = Math.max(0,saved[key]);
  for (const key of ['music','voice']) if (typeof saved[key] === 'boolean') state[key] = saved[key];
}
let storageWarning = false;
function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { storageWarning = true; } updateUI(); }
function unlocked(i) { return i === 0 || state.stars[i-1] >= 20; }
function updateUI() {
  $('#stars').textContent = `★ ${state.stars.reduce((a,b)=>a+b,0)}`;
  for (const key of ['music','voice']) { $(`#${key}`).textContent = `${key === 'music' ? '♫ Music' : '◖ Voice'} ${state[key] ? 'on' : 'off'}`; $(`#${key}`).setAttribute('aria-pressed', state[key]); }
  const chosen = $('#level').value;
  $('#level').replaceChildren(...names.map((name,i)=>{const el=document.createElement('option');el.value=i;el.textContent=`${unlocked(i)?'':'🔒 '}${name}`;el.disabled=!unlocked(i);return el;}));
  $('#level').value = chosen && unlocked(Number(chosen)) ? chosen : '0';
}
updateUI();
let audio, master, timer, note = 0, speaking = false, speechToken = 0;
let active = false, paused = false, busy = false, mode = 'listen', level = 0, queue=[], word='', round=0, letter=0, phraseWords=[], phraseIndex=0, streak=0;
function musicGain() { if(master) master.gain.setTargetAtTime(state.music && !speaking && !paused ? .06 : 0, audio.currentTime, .12); }
function startAudio() {
  try {
    if (!audio) { audio = new (window.AudioContext || window.webkitAudioContext)(); master=audio.createGain();master.gain.value=0;master.connect(audio.destination);
      timer=setInterval(()=>{if(!state.music || paused || speaking || audio.state!=='running')return;const tones=[523.25,659.25,783.99,659.25,587.33,698.46,880,698.46];const osc=audio.createOscillator(),env=audio.createGain();osc.type='sine';osc.frequency.value=tones[note++%tones.length];env.gain.setValueAtTime(0,audio.currentTime);env.gain.linearRampToValueAtTime(.35,audio.currentTime+.04);env.gain.exponentialRampToValueAtTime(.001,audio.currentTime+2);osc.connect(env);env.connect(master);osc.start();osc.stop(audio.currentTime+2);},650);
    }
    audio.resume().catch(()=>{}); musicGain();
  } catch { /* Speech and play remain available without WebAudio. */ }
}
function stopVoice() { speechToken++; window.speechSynthesis?.cancel();speaking=false;musicGain(); }
function say(text) {
  stopVoice();
  if(!state.voice || !('speechSynthesis' in window)) { $('#message').textContent=`${state.voice?'Ask a grown-up to read':'Voice is off. Find'}: ${word}`;return; }
  const token=speechToken, u=new SpeechSynthesisUtterance(text);u.lang='en-US';u.rate=.85;u.volume=1;
  const voices=speechSynthesis.getVoices();u.voice=voices.find(v=>v.lang==='en-US') || voices.find(v=>v.lang.startsWith('en')) || null;
  speaking=true;musicGain();const finish=()=>{if(token===speechToken){speaking=false;musicGain();}};setTimeout(finish, Math.max(5000,text.length*150));u.onend=finish;u.onerror=()=>{finish();$('#message').textContent=`Ask a grown-up to read: ${word}`;};speechSynthesis.speak(u);
}
$('#music').onclick=()=>{state.music=!state.music;startAudio();save();musicGain();};
$('#voice').onclick=()=>{state.voice=!state.voice;if(!state.voice)stopVoice();save();};
$('#hear').onclick=()=>{startAudio();say(word);};
let THREE,scene,camera,renderer,plane,propeller, gates=[], scenery=[], clock=0, target={x:0,y:0}, keys=new Set(), delay=0;
let livingSky, cloudiness=0;
function updateSky(){cloudiness=livingSky.update(clock);}
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
function mesh(geometry,color,parent=scene){const m=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color,roughness:.85}));parent.add(m);return m;}
function ball(x,y,z,r,color,parent=scene){const m=mesh(new THREE.IcosahedronGeometry(r,2),color,parent);m.position.set(x,y,z);return m;}
function setup() {
 scene=new THREE.Scene();scene.fog=new THREE.Fog('#d6edf1',25,100);camera=new THREE.PerspectiveCamera(50,innerWidth/innerHeight,.1,150);camera.position.set(0,2.5,12);camera.lookAt(0,1,-18);
 renderer=new THREE.WebGLRenderer({canvas:$('#sky'),antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(innerWidth,innerHeight);const hemisphere=new THREE.HemisphereLight('#fff6e5','#82a8aa',2.6);scene.add(hemisphere);const sun=new THREE.DirectionalLight('#fff0d6',2);sun.position.set(-8,15,8);scene.add(sun);
 plane=new THREE.Group();scene.add(plane);ball(0,0,0,.48,'#f5c879',plane).scale.set(.8,.8,1.8);const wing=mesh(new THREE.BoxGeometry(2.6,.12,.65),'#fff3d6',plane);wing.position.z=.1;const tail=mesh(new THREE.BoxGeometry(1,.12,.4),'#4f8b91',plane);tail.position.z=.75;ball(0,.3,-.1,.3,'#5c939d',plane);propeller=mesh(new THREE.BoxGeometry(.12,1.25,.08),'#5b7886',plane);propeller.position.z=-.9;
 for(let i=0;i<35;i++){const group=new THREE.Group();scene.add(group);const isIsland=i%6===0;for(let j=0;j<5;j++)ball((j-2)*.65,Math.sin(j)*.35,0,.8,isIsland?'#9fcab9':'#fffaf2',group);if(isIsland){const rock=mesh(new THREE.ConeGeometry(1.6,2,6),'#beb2cb',group);rock.rotation.z=Math.PI;rock.position.y=-1;ball(0,.8,0,.6,'#6ba897',group);}group.position.set((Math.random()-.5)*60,(Math.random()-.5)*23,-Math.random()*100);group.userData.cloud=!isIsland;group.userData.coreCloud=i%3===0;group.userData.speed=1+Math.random()*2;scenery.push(group);}
 for(let i=0;i<8;i++){const g=new THREE.Group();scene.add(g);ball(0,0,0,.6,['#eab0bd','#efd391','#a3c5df'][i%3],g).scale.y=1.3;const string=mesh(new THREE.CylinderGeometry(.015,.015,2),'#fff5df',g);string.position.y=-1.5;g.position.set((Math.random()-.5)*45,Math.random()*16-4,-15-Math.random()*65);g.userData.speed=1.6;scenery.push(g);}
 livingSky=createLivingSky(THREE,scene,scenery,hemisphere,sun);
 resize();requestAnimationFrame(frame);
}
function resize(){if(!renderer)return;camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);if(active&&!busy)spawn();}
addEventListener('resize',resize);
function disposeGates(){for(const gate of gates){scene.remove(gate);gate.userData.label?.remove();gate.traverse(m=>{m.geometry?.dispose();m.material?.map?.dispose();m.material?.dispose();});}gates=[];}
function makeGate(text,x,y){const g=new THREE.Group();scene.add(g);const ring=mesh(new THREE.TorusGeometry(1.1,.12,10,40),'#e9ba81',g);ring.scale.set(1.45,1,1);const c=document.createElement('canvas');c.width=512;c.height=192;const ctx=c.getContext('2d');ctx.fillStyle='#fffdf3';ctx.beginPath();ctx.roundRect(0,0,512,192,55);ctx.fill();ctx.fillStyle='#243f50';ctx.font=`bold ${text.length>6?66:88}px Trebuchet MS, sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,256,99);const texture=new THREE.CanvasTexture(c);const label=new THREE.Sprite(new THREE.SpriteMaterial({map:texture}));label.scale.set(2.8,1.05,1);g.add(label);g.position.set(x,y,-18);const placard=document.createElement('div');placard.className='gate-label';placard.textContent=text;document.body.append(placard);g.userData={text,wiggle:0,label:placard};gates.push(g);}
function answer(){return mode==='phrase'?phraseWords[phraseIndex]:mode==='listen'?word:word[letter];}
function phraseTrail(){
 $('#phrase-trail').hidden=$('#combo').hidden=mode!=='phrase';
 $('#phrase-trail').replaceChildren(...phraseWords.map((text,i)=>{const el=document.createElement('span');el.textContent=text;el.className=i<phraseIndex?'caught':'';return el;}));
 $('#phrase-trail').setAttribute('aria-label',`${phraseIndex} of ${phraseWords.length} words caught`);
 $('#combo').textContent=`✦ ${streak} in a row`;
}
function spawn(){disposeGates();const bank=mode==='phrase'?LEVEL_KEYS.slice(0,level+1).flatMap(k=>WORDS[k]):WORDS[LEVEL_KEYS[level]];const correctAnswer=answer();const alternatives=mode!=='spell'?bank:'abcdefghijklmnopqrstuvwxyz\''.split('');const choices=shuffle([correctAnswer,...shuffle([...new Set(alternatives)].filter(x=>x!==correctAnswer)).slice(0,2)]);const narrow=innerWidth<650;choices.forEach((text,i)=>makeGate(text,narrow?0:(i-1)*3.6,narrow?(1-i)*2.5:0));}
function next(){if(round===10){finishRound();return;}word=queue[round];letter=0;phraseWords=mode==='phrase'?word.split(' '):[];phraseIndex=0;phraseTrail();busy=false;$('#round').textContent=`${mode==='phrase'?'PHRASE':'WORD'} ${round+1} / 10 · ${names[level]}`;$('#spelling').textContent='';$('#message').textContent='Follow your ears, little pilot!';spawn();say(word);}
function burst(){for(let i=0;i<18;i++){const el=document.createElement('span');el.className='burst';el.textContent=['★','✦','●'][i%3];el.style.cssText=`left:${35+Math.random()*30}%;top:${40+Math.random()*25}%;color:${['#d8a54f','#7bafa1','#c98fa8'][i%3]};--dx:${(Math.random()-.5)*500}px`;document.body.append(el);setTimeout(()=>el.remove(),1700);}}
function pick(g){if(busy||paused||!active)return;state.attempts++;if(g.userData.text!==answer()){g.userData.wiggle=.7;$('#message').textContent='A little wobble. Try again!';if(mode==='phrase'){phraseIndex=0;streak=0;phraseTrail();spawn();}say('Try again. '+word);save();return;}state.correct++;if(mode==='phrase'){
 phraseIndex++;streak++;phraseTrail();
 if(phraseIndex<phraseWords.length){save();spawn();return;}
 // Intermediate catches never award stars or learned words.
 state.phrases[level]++;
 }if(mode==='spell' && ++letter<word.length){$('#spelling').textContent=word.slice(0,letter);save();spawn();return;}busy=true;state.stars[level]+=mode==='phrase'?phraseWords.length+Math.floor(streak/5):1;for(const learned of mode==='phrase'?phraseWords:[word])if(!state.learned.includes(learned))state.learned.push(learned);save();$('#message').textContent=`★ Wonderful! ${word}`;$('#spelling').textContent=word;burst();if(mode==='phrase')say(word);else say(`${word}. ${word.split('').map(c=>c==="'"?'apostrophe':c.toUpperCase()).join(', ')}. ${word}.`);disposeGates();round++;delay=3.8;}
function finishRound(){active=false;$('#pad').hidden=true;$('.flight-hud').hidden=true;$('#welcome').hidden=false;showModal(`<h2>✦ Sky superstar!</h2><p>You flew through 10 ${mode==='phrase'?'phrases':'words'}. Your little pilot is cheering for you!</p><p>★ ${state.stars[level]} stars in ${names[level]}. ${state.stars[level]>=20?'Next sky unlocked!':'Earn 20 stars here to unlock the next sky.'}</p><button id="again">Fly another round ↗</button>`);$('#again').onclick=()=>{$('#modal').close();start();};burst();}
function start(){if(!renderer)return;startAudio();stopVoice();level=Number($('#level').value);mode=$('#mode').value;queue=shuffle(mode==='phrase'?PHRASES[LEVEL_KEYS[level]]:WORDS[LEVEL_KEYS[level]]).slice(0,10);streak=0;keys.clear();speed=1;round=0;active=true;paused=false;busy=false;delay=0;target={x:0,y:0};plane.position.set(0,0,2);$('#welcome').hidden=true;$('.flight-hud').hidden=false;$('#pad').hidden=false;$('#pause').textContent='Pause';musicGain();next();}
$('#start').onclick=start;
function pause(value){paused=value;keys.clear();if(paused)stopVoice();$('#pause').textContent=paused?'Resume':'Pause';$('#pause').setAttribute('aria-label',paused?'Resume flight':'Pause flight');musicGain();if(active&&!paused)say(word);}
$('#pause').onclick=()=>pause(!paused);
function showModal(html){pause(true);$('#modal-content').innerHTML=html;$('#modal').showModal();}
$('#close').onclick=()=>$('#modal').close();$('#modal').addEventListener('close',()=>pause(false));
$('#parents').onclick=()=>{showModal(`<h2>Your pilot’s journey</h2><p>${state.learned.length} / 220 words learned · ${state.attempts?Math.round(state.correct/state.attempts*100):0}% accuracy (${state.correct}/${state.attempts} picks)</p>${names.map((n,i)=>`<p>${n}: ★ ${state.stars[i]} · ${state.phrases[i]} phrases · ${state.learned.filter(w=>WORDS[LEVEL_KEYS[i]].includes(w)).length}/${WORDS[LEVEL_KEYS[i]].length} words<br><progress value="${Math.min(state.stars[i],20)}" max="20"></progress></p>`).join('')}<p>One star per word; complete phrases earn one per word plus one per five consecutive catches. Only complete, unbroken phrases score. Earn 20 stars in a level to unlock the next. Repeats count as practice. Progress stays in this browser.</p><p>${storageWarning?'Saving is unavailable; this session still works.':''}</p><details><summary>Words learned</summary><p>${state.learned.join(', ')||'Your adventure is just beginning.'}</p></details><button id="reset">Reset flight progress</button>`);$('#reset').onclick=()=>{if(confirm('Reset all Word Flight stars and learned words? Classic progress is kept.')){state.stars=[0,0,0,0,0];state.phrases=[0,0,0,0,0];streak=0;state.learned=[];state.attempts=state.correct=0;save();active=false;disposeGates();$('#welcome').hidden=false;$('.flight-hud').hidden=true;$('#pad').hidden=true;$('#modal').close();}};};
const controls={arrowleft:'left',a:'left',arrowright:'right',d:'right',arrowup:'up',w:'up',arrowdown:'down',s:'down'};
addEventListener('keydown',e=>{if(e.code==='Space'&&active&&!paused&&!/SELECT|INPUT|TEXTAREA/.test(e.target.tagName)){e.preventDefault();keys.add('boost');return;}const dir=controls[e.key.toLowerCase()];if(active&&!paused&&dir&&!/SELECT|INPUT/.test(e.target.tagName)){e.preventDefault();keys.add(dir);}});addEventListener('keyup',e=>{if(e.code==='Space'){if(active)e.preventDefault();keys.delete('boost');}else keys.delete(controls[e.key.toLowerCase()]);});addEventListener('blur',()=>{keys.clear();if(active)pause(true);});document.addEventListener('visibilitychange',()=>{if(document.hidden&&active)pause(true);});
for(const b of document.querySelectorAll('[data-dir]')){b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);keys.add(b.dataset.dir);};b.onpointerup=b.onpointercancel=b.onlostpointercapture=()=>keys.delete(b.dataset.dir);}
const boostButton=$('#boost');
boostButton.onpointerdown=e=>{e.preventDefault();if(active&&!paused){boostButton.setPointerCapture(e.pointerId);keys.add('boost');}};
boostButton.onpointerup=boostButton.onpointercancel=boostButton.onlostpointercapture=()=>keys.delete('boost');
let drag=null;$('#sky').onpointerdown=e=>{if(active&&!paused){drag={x:e.clientX,y:e.clientY,tx:target.x,ty:target.y};$('#sky').setPointerCapture(e.pointerId);}};$('#sky').onpointermove=e=>{if(drag){target.x=THREE.MathUtils.clamp(drag.tx+(e.clientX-drag.x)*.018,-5,5);target.y=THREE.MathUtils.clamp(drag.ty-(e.clientY-drag.y)*.018,-3.5,3.5);}};$('#sky').onpointerup=$('#sky').onpointercancel=()=>drag=null;
let speed=1;
let last=0;
function frame(now){requestAnimationFrame(frame);const dt=Math.min((now-last)/1000||0,.05);last=now;if(!paused){clock+=dt;updateSky();speed+=((active&&keys.has('boost')?2:1)-speed)*(1-Math.exp(-dt*4));$('#boost').setAttribute('aria-pressed',active&&keys.has('boost'));$('#boost').style.setProperty('--boost',speed-1);camera.fov=50+(reduced?0:(speed-1)*4);camera.updateProjectionMatrix();propeller.rotation.z+=dt*18;for(const obj of scenery){obj.position.z+=dt*obj.userData.speed*speed*(reduced?.3:1)*(obj.userData.cloud?(.65+cloudiness):1);if(obj.position.z>16)obj.position.z=-90;}
if(active){target.x=THREE.MathUtils.clamp(target.x+((keys.has('right')?1:0)-(keys.has('left')?1:0))*dt*4,-5,5);target.y=THREE.MathUtils.clamp(target.y+((keys.has('up')?1:0)-(keys.has('down')?1:0))*dt*4,-3.5,3.5);plane.position.x+=(target.x-plane.position.x)*Math.min(dt*8,1);plane.position.y+=(target.y-plane.position.y)*Math.min(dt*8,1);plane.rotation.z=(plane.position.x-target.x)*.2;
// Ease gate speed to normal between z=-14 and -8, preserving a gentle catch window.
if(busy){delay-=dt;if(delay<=0&&!speaking)next();}else for(const g of gates){g.position.z+=dt*3.6*(1+(speed-1)*THREE.MathUtils.smoothstep(-g.position.z,8,14));if(g.userData.wiggle>0){g.userData.wiggle-=dt;g.rotation.z=Math.sin(now*.03)*.15;}else g.rotation.z=0;if(Math.abs(g.position.z-plane.position.z)<.8&&Math.abs(g.position.x-plane.position.x)<1.25&&Math.abs(g.position.y-plane.position.y)<.95&&!g.userData.touched){g.userData.touched=true;pick(g);break;}if(g.position.z>9){spawn();break;}}
}else{plane.position.set(innerWidth<650?2.8:4.5,Math.sin(clock)*.3,0);plane.rotation.z=Math.sin(clock*.6)*.08;}}
for(const g of gates){const p=g.position.clone().project(camera);const label=g.userData.label;label.hidden=!active||p.z>1||p.z< -1;label.style.left=`${(p.x*.5+.5)*innerWidth}px`;label.style.top=`${(-p.y*.5+.5)*innerHeight}px`;}renderer.render(scene,camera);}
try { THREE=await import('https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js');setup(); } catch { $('#fallback').hidden=false;$('#start').disabled=true;$('#start').textContent='Sky unavailable'; }
