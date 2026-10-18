// Continuous 80-second day → sunset → night → dawn cycle. Paused with flight.
// Weather has its own 113-second cycle, so skies combine differently each round.
export function createLivingSky(THREE, scene, scenery, hemisphere, sunlight) {
  const palettes = [
    ['#bddfea','#fff6e5','#82a8aa','#fff0d6'],
    ['#e8aa9c','#ffe0bf','#967f9f','#ffd0a4'],
    ['#233552','#c4d6f5','#627a96','#afc7ed'],
    ['#d5c2da','#ffe8d8','#95a9b5','#ffe1c4']
  ].map(p=>p.map(c=>new THREE.Color(c)));
  function orb(radius, color) {
    const m=new THREE.Mesh(new THREE.SphereGeometry(radius,20,12),new THREE.MeshBasicMaterial({color,transparent:true,depthWrite:false,fog:false}));
    scene.add(m);return m;
  }
  const sun=orb(2.2,'#ffe7a3'), moon=orb(1.5,'#f4f2dc');
  const stars=[];
  // Seeded positions keep the night sky calm and repeatable.
  for(let i=0;i<75;i++){
    const star=orb(.06+(i%3)*.025,'#f7f4e6');
    star.position.set(Math.sin(i*127.1)*44,5+(i*7.13%27),-65-(i%5)*3);stars.push(star);
  }
  for(const group of scenery)group.traverse(m=>{
    if(m.material){m.userData.dayColor=m.material.color.clone();if(group.userData.cloud){m.material.transparent=true;m.material.depthWrite=false;}}
  });
  const indicator=document.querySelector('#sky-indicator');
  const skyState={phase:'day',darkness:0,cloudiness:0,weather:'clear',cycle:0};
  const skyColor=new THREE.Color(), tint=new THREE.Color(), white=new THREE.Color('#ffffff');
  const nightTint=new THREE.Color('#8da8d8'), warmTint=new THREE.Color('#eac6b1');
  scene.background=skyColor;
  function update(seconds) {
    const cycle=(seconds/80)%1, step=cycle*4, index=Math.floor(step), t=step-index;
    const fade=t*t*(3-2*t), a=palettes[index], b=palettes[(index+1)%4];
    const darkness=(1-Math.cos(cycle*Math.PI*2))/2;
    const cloudiness=(1-Math.cos(seconds/113*Math.PI*2))/2;
    skyColor.copy(a[0]).lerp(b[0],fade).lerp(tint.set('#879ba9'),cloudiness*.18);
    scene.fog.color.copy(skyColor);
    hemisphere.color.copy(a[1]).lerp(b[1],fade);hemisphere.groundColor.copy(a[2]).lerp(b[2],fade);
    hemisphere.intensity=2.6-darkness*.7;
    sunlight.color.copy(a[3]).lerp(b[3],fade);sunlight.intensity=2-darkness*1.25-cloudiness*.2;
    // Both bodies move on slow arcs; their opacity follows daylight continuously.
    const angle=cycle*Math.PI*2;
    sun.position.set(-24*Math.sin(angle),4+16*Math.cos(angle),-48);
    moon.position.set(24*Math.sin(angle),4-16*Math.cos(angle),-48);
    sunlight.position.copy(sun.position);sun.material.opacity=Math.pow(1-darkness,2);moon.material.opacity=darkness*darkness;
    stars.forEach((s,i)=>{s.material.opacity=Math.pow(darkness,3)*(1-cloudiness*.55)*(.65+.25*Math.sin(seconds*.65+i));});
    tint.copy(white).lerp(nightTint,darkness*.4).lerp(warmTint,Math.sin(angle)**2*.15);
    for(const group of scenery){
      group.traverse(m=>{if(m.material&&m.userData.dayColor){m.material.color.copy(m.userData.dayColor).multiply(tint);if(group.userData.cloud)m.material.opacity=group.userData.coreCloud?.85:.12+cloudiness*.78;}});
    }
    document.body.style.setProperty('--night-glow',`${darkness*14}px`);
    document.body.style.setProperty('--night-panel',darkness*.9);
    const phase=['day','sunset','night','dawn'][Math.floor((cycle+.125)%1*4)];
    const weather=cloudiness<.3?'clear':cloudiness<.7?'partly cloudy':'soft cloudy';
    const icon=weather==='soft cloudy'?'☁️':weather==='partly cloudy'?'⛅':{day:'☀️',sunset:'🌇',night:'🌙',dawn:'🌅'}[phase];
    if(indicator.textContent!==icon)indicator.textContent=icon;
    indicator.setAttribute('aria-label',`${phase}, ${weather} sky`);
    Object.assign(skyState,{phase,darkness,cloudiness,weather,cycle});
    return cloudiness;
  }
  update(0);
  return {update,state:skyState};
}
