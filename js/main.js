import { WORDS, WORLDS, ALL_WORDS, shuffle } from './words.js';
import { getProgress, wordProgress, answerWord, stageProgress, stageComplete, worldComplete, noteStageWord, finishStage, stageQueue, resetProgress, storageWorks } from './progress.js';
import { unlockSpeech, stopSpeech } from './speech.js';
import { listenSpell } from './modes/listen-spell.js';
import { fillBlank } from './modes/fill-blank.js';
import { wordHunt } from './modes/word-hunt.js';

const app = document.getElementById('app');
const speakerIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M11 4 5 9H2v6h3l6 5z"/><path d="M15 8a6 6 0 0 1 0 8M18 4a11 11 0 0 1 0 16"/></svg>';
const boltIcon = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m13 2-9 12h7l-1 8 10-13h-7z"/></svg>';
const state = { screen: 'menu', world: 0, stage: 0, mode: 'spell', queue: [], index: 0, done: 0, clean: 0, misses: 0, points: 0, combo: 0, lastCatch: 0, newParts: 0, unlocked: false, timer: null, cleanup: null, deadline: 0, answered: false };
let confettiFrame = 0;
const masteredCount = key => (key ? WORDS[key] : ALL_WORDS).filter(word => wordProgress(word).mastery >= 3).length;
const stars = count => '★'.repeat(count) + '☆'.repeat(3 - count);
const worldOpen = index => index === 0 || worldComplete(WORLDS[index - 1].key);
function huntQueue(pool) {
  const order = shuffle(pool);
  return Array.from({ length: 8 }, (_, i) => order[i % order.length]);
}
function robot(index, unlocked = false) {
  const world = WORLDS[index];
  const count = getProgress().parts.filter(word => WORDS[world.key].includes(word)).length;
  const visible = threshold => unlocked || count >= threshold ? '1' : '.20';
  const crests = [
    '<path d="m119 64 11-30 11 30"/>',
    '<path d="m108 65-20-27 31 13m33 14 20-27-31 13"/>',
    '<path d="m117 65-4-25 17 13 17-13-4 25"/>',
    '<path d="m106 66 9-28 15 13 15-13 9 28"/>',
    '<path d="m103 66-5-22 21 9 11-26 11 26 21-9-5 22"/>'
  ];
  // Original geometric robot designs, drawn specifically for this game.
  return `<svg class="robot" viewBox="0 0 260 310" role="img" aria-label="${world.robot}${unlocked ? '，已解锁' : '，收集零件来组装'}" style="--robot-color:${world.color}">
    <ellipse cx="130" cy="286" rx="83" ry="9" fill="${world.color}" opacity=".12"/>
    <g fill="${world.color}" stroke="#14233d" stroke-width="4" stroke-linejoin="round">
      <g opacity="${visible(6)}"><path d="m76 109-29 14-11 68 23 8 14-54 19-7M184 109l29 14 11 68-23 8-14-54-19-7"/><path d="m39 189-9 29 24 10 11-33M221 189l9 29-24 10-11-33" fill="#d9edf3"/></g>
      <g opacity="${visible(12)}"><path d="m91 211-12 60 39 1 11-61m42 0 12 60-39 1-11-61" fill="#d9edf3"/><path d="m78 259-12 23 56 1-5-26m66 2 12 23-56 1 5-26"/><path d="M92 227h22m32 0h22" fill="none" stroke="${world.color}" stroke-width="8"/></g>
      <g opacity="${visible(3)}"><path d="m80 111 21-14h58l21 14-10 93-20 15h-40l-20-15z" fill="#d9edf3"/><path d="m80 111 24 25h52l24-25-10 58H90z"/><path d="m117 147 13-10 13 10-4 21h-18z" fill="#15253d"/><path d="m131 144-8 12h8l-1 7 9-13h-8" fill="#ffda70" stroke="none"/><path d="M99 184h62v17H99z" fill="#536786"/><path d="M110 186v12m20-12v12m20-12v12" fill="none" stroke="#b8d7e6" stroke-width="3"/></g>
      <g opacity="${visible(1)}"><path d="M97 65h66l13 18-8 35-20 9h-36l-20-9-8-35z" fill="#e5f2f7"/><path d="m105 82 25 6 25-6-4 19h-42z" fill="#14233d"/><path d="m110 89 14 3m12 0 14-3" stroke="${world.color}" stroke-width="5" fill="none"/><path d="m120 109 10-5 10 5-10 9z"/>${crests[index]}<path d="M90 82h-9v24h12m77-24h9v24h-12"/></g>
    </g>
    <g fill="none" stroke="${world.color}" stroke-width="1" opacity=".35"><path d="M22 82V47h35m146 0h35v35M22 235v35h30m156 0h30v-35"/></g>
  </svg>`;
}
function stopRound() {
  clearInterval(state.timer); state.timer = null;
  if (state.cleanup) state.cleanup(); state.cleanup = null;
  stopSpeech();
}
function focusMain() { app.focus({ preventScroll: true }); window.scrollTo(0, 0); }
function storageNotice() { return storageWorks() ? '' : '<p class="storage-note" role="status">浏览器暂时不能保存，当前游戏仍可继续。</p>'; }
function renderMenu() {
  stopRound(); state.screen = 'menu';
  const progress = getProgress();
  const next = WORLDS.findIndex(world => !worldComplete(world.key));
  const selected = next < 0 ? 4 : next;
  app.innerHTML = `
    <div class="base-layout">
      <section class="hangar">
        <span class="eyebrow">小队长，准备出发！</span>
        <h1>学会单词，<br>组装你的机甲。</h1>
        <div class="robot-platform">${robot(selected, progress.robots.includes(WORLDS[selected].key))}<span class="orbit orbit-one"></span><span class="orbit orbit-two"></span><span class="hangar-coordinate">${WORLDS[selected].code} / ${WORLDS[selected].robot}</span></div>
        <div class="collection-stats"><div><strong>${masteredCount()}<small>/ 220</small></strong><span>已掌握</span></div><div><strong>${progress.parts.length}</strong><span>机甲零件</span></div><div><strong>${progress.robots.length}<small>/ 5</small></strong><span>完整机甲</span></div></div>
        <p class="short-note">掌握一个词，就能得到一个零件。</p>
      </section>
      <section class="mission-panel">
        <div class="panel-heading"><h2>选择世界</h2><span class="round-label">每轮约 3 分钟</span></div>
        <div class="world-list">${WORLDS.map((world, index) => {
          const unlocked = progress.robots.includes(world.key);
          const open = worldOpen(index);
          const completed = Array.from({length: Math.ceil(WORDS[world.key].length / 8)}, (_, stage) => stage).filter(stage => stageComplete(world.key, stage, 'spell') && stageComplete(world.key, stage, 'sentence')).length;
          return `<button class="world-card ${open ? '' : 'locked'} ${selected === index ? 'recommended' : ''}" data-world="${index}" style="--world-color:${world.color}" ${open ? '' : 'disabled'}><span class="world-number">${world.code}</span><span class="world-copy"><strong>${world.name}${unlocked ? '<span class="world-badge">已完成</span>' : ''}</strong><span>${open ? `${WORDS[world.key].length} 个词 · ${completed}/${Math.ceil(WORDS[world.key].length / 8)} 站` : '完成上个世界后开启'}</span></span><span class="world-status">${unlocked ? '★' : open ? '出发' : '待开启'}</span></button>`;
        }).join('')}</div>
        <button class="bonus-button" id="bonus-button" ${ALL_WORDS.some(word => wordProgress(word).correct > 0) ? '' : 'disabled'}><span class="bonus-icon">${boltIcon}</span><span><strong>词语捕手</strong><small>用学过的词，收集更多能量</small></span><span class="bonus-status">加分游戏</span></button>
        ${storageNotice()}
      </section>
    </div>`;
  app.querySelectorAll('[data-world]').forEach(button => { button.onclick = () => renderWorld(Number(button.dataset.world)); });
  app.querySelector('#bonus-button').onclick = () => {
    unlockSpeech();
    const pool = ALL_WORDS.filter(word => wordProgress(word).correct > 0);
    startRound('hunt', huntQueue(pool));
  };
  focusMain();
}
function renderWorld(index = state.world, stage = null, mode = null) {
  stopRound(); state.screen = 'menu'; state.world = index;
  const world = WORLDS[index];
  const stageCount = Math.ceil(WORDS[world.key].length / 8);
  const next = Array.from({length: stageCount}, (_, i) => i).find(i => !stageComplete(world.key, i, 'spell') || !stageComplete(world.key, i, 'sentence'));
  state.stage = stage ?? next ?? 0;
  state.mode = mode || (stageComplete(world.key, state.stage, 'spell') && !stageComplete(world.key, state.stage, 'sentence') ? 'sentence' : 'spell');
  const targetWords = WORDS[world.key].slice(state.stage * 8, state.stage * 8 + 8);
  app.innerHTML = `
    <div class="world-layout" style="--world-color:${world.color}">
      <section class="world-hangar"><button class="quiet-button" id="back-base">回到基地</button><span class="eyebrow">世界 ${world.code}</span><h1>${world.name}</h1>${robot(index, getProgress().robots.includes(world.key))}<p class="robot-name">${world.robot}</p><p class="short-note">每站练习拼词和句子，就能解锁机甲。</p></section>
      <section class="stage-panel"><div class="panel-heading"><h2>选择小站</h2><span class="round-label">每站 8 个词</span></div>
        <div class="stage-grid">${Array.from({length: stageCount}, (_, i) => {
          const open = i === 0 || (stageComplete(world.key, i - 1, 'spell') && stageComplete(world.key, i - 1, 'sentence'));
          return `<button class="stage-card ${i === state.stage ? 'selected' : ''}" data-stage="${i}" ${open ? '' : 'disabled'} aria-pressed="${i === state.stage}"><strong>${i + 1}</strong><span>拼 ${stars(stageProgress(world.key, i, 'spell').stars)}</span><span>句 ${stars(stageProgress(world.key, i, 'sentence').stars)}</span></button>`;
        }).join('')}</div>
        <div class="mode-tabs" role="group" aria-label="练习方式"><button data-mode="spell" class="${state.mode === 'spell' ? 'active' : ''}" aria-pressed="${state.mode === 'spell'}">听音拼词</button><button data-mode="sentence" class="${state.mode === 'sentence' ? 'active' : ''}" aria-pressed="${state.mode === 'sentence'}">句子选词</button></div>
        <div class="stage-preview"><span>第 ${state.stage + 1} 站的词</span><p lang="en">${targetWords.join(' · ')}</p>${targetWords.length < 8 ? '<small>再加几个学过的词，轻松复习。</small>' : ''}</div>
        <button class="primary" id="start-button">开始第 ${state.stage + 1} 站</button><p class="short-note">点字母或词卡，不用打字。</p>${storageNotice()}
      </section>
    </div>`;
  app.querySelector('#back-base').onclick = renderMenu;
  app.querySelectorAll('[data-stage]').forEach(button => { button.onclick = () => renderWorld(index, Number(button.dataset.stage), state.mode); });
  app.querySelectorAll('[data-mode]').forEach(button => { button.onclick = () => renderWorld(index, state.stage, button.dataset.mode); });
  app.querySelector('#start-button').onclick = () => { unlockSpeech(); startRound(state.mode); };
  focusMain();
}
function startRound(mode, customQueue = null) {
  stopRound();
  Object.assign(state, { screen: 'level', mode, queue: customQueue || stageQueue(WORLDS[state.world].key, state.stage, mode), index: 0, done: 0, clean: 0, misses: 0, points: 0, combo: 0, lastCatch: 0, newParts: 0, unlocked: false, answered: false });
  state.deadline = Date.now() + (mode === 'hunt' ? 90000 : 180000);
  app.innerHTML = `
    <section class="game-panel">
      <div class="game-toolbar"><button class="quiet-button" id="pause-button">休息一下</button><span class="game-place">${mode === 'hunt' ? '词语捕手' : `${WORLDS[state.world].name} · 第 ${state.stage + 1} 站`}</span><span class="time-badge" id="round-time">${mode === 'hunt' ? '1:30' : '3:00'}</span></div>
      <div class="round-progress"><div class="progress-track"><span id="progress-fill"></span></div><span id="question-count"></span></div>
      <div id="question"></div>
      <div class="game-bottom"><span>${mode === 'hunt' ? '只有加分，轻松找词' : '慢慢来，答错也可以再试'}</span><span id="energy-count">${mode === 'hunt' ? '0 能量' : '零件 +0'}</span></div>
      ${storageNotice()}
    </section>`;
  app.querySelector('#pause-button').onclick = () => renderResults('pause');
  state.timer = setInterval(() => {
    if (state.screen !== 'level') return;
    const remaining = Math.max(0, Math.ceil((state.deadline - Date.now()) / 1000));
    app.querySelector('#round-time').textContent = `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')}`;
    if (remaining === 0) renderResults('time');
  }, 250);
  // A backgrounded mobile tab cannot extend the practice round.
  renderQuestion(); focusMain();
}
function renderQuestion() {
  if (state.screen !== 'level') return;
  if (Date.now() >= state.deadline) { renderResults('time'); return; }
  if (state.index >= state.queue.length) { renderResults('complete'); return; }
  if (state.cleanup) state.cleanup();
  state.answered = false;
  const word = state.queue[state.index];
  app.querySelector('#question-count').textContent = `${state.index + 1} / ${state.queue.length}`;
  app.querySelector('#progress-fill').style.width = `${100 * state.done / state.queue.length}%`;
  const callbacks = {
    speakerIcon,
    pool: ALL_WORDS.filter(item => wordProgress(item).correct > 0),
    wrong: () => {
      if (state.screen !== 'level' || state.answered) return;
      state.misses++;
      answerWord(word, false, state.mode);
    },
    correct: misses => {
      if (state.screen !== 'level' || state.answered) return 0;
      state.answered = true;
      state.done++;
      if (misses === 0) state.clean++;
      let points = 0;
      if (state.mode === 'hunt') {
        const now = Date.now();
        state.combo = now - state.lastCatch <= 5000 ? state.combo + 1 : 1;
        state.lastCatch = now;
        points = Math.min(5, state.combo);
        state.points += points;
      } else {
        if (answerWord(word, true, state.mode)) state.newParts++;
        noteStageWord(WORLDS[state.world].key, state.stage, state.mode, word);
      }
      app.querySelector('#energy-count').textContent = state.mode === 'hunt' ? `${state.points} 能量` : `零件 +${state.newParts}`;
      app.querySelector('#progress-fill').style.width = `${100 * state.done / state.queue.length}%`;
      return points;
    },
    next: () => { state.index++; renderQuestion(); }
  };
  const mount = state.mode === 'spell' ? listenSpell : state.mode === 'sentence' ? fillBlank : wordHunt;
  state.cleanup = mount(app.querySelector('#question'), word, callbacks);
}
function renderResults(reason) {
  if (state.screen !== 'level') return;
  stopRound(); state.screen = 'results';
  const awardedStars = state.done === 0 ? 1 : state.clean / state.done >= .9 ? 3 : state.clean / state.done >= .6 ? 2 : 1;
  if (state.mode !== 'hunt') state.unlocked = finishStage(WORLDS[state.world].key, state.stage, state.mode, awardedStars);
  const world = WORLDS[state.world];
  const title = state.unlocked ? `${world.robot}，出动！` : reason === 'complete' ? '今天又进步了！' : '小队长，休息一下！';
  const completed = state.mode !== 'hunt' && stageComplete(world.key, state.stage, state.mode);
  app.innerHTML = `
    <section class="results-panel"><span class="eyebrow">${state.mode === 'hunt' ? '能量补给完成' : '任务收获'}</span><h1>${title}</h1>
      <div class="result-stars" aria-label="${awardedStars} 颗星">${stars(awardedStars)}</div>
      ${state.unlocked ? `<div class="result-robot">${robot(state.world, true)}</div>` : `<div class="result-emblem">${boltIcon}</div>`}
      <div class="result-stats"><div><strong>${state.done}</strong><span>练习单词</span></div><div><strong>${state.mode === 'hunt' ? state.points : state.newParts}</strong><span>${state.mode === 'hunt' ? '收集能量' : '新零件'}</span></div></div>
      <p class="result-note">${state.unlocked ? '两种练习都完成了，新世界已开启！' : state.mode === 'hunt' ? '每次找到单词，都是一个小胜利。' : completed ? '这一站完成了！换种方式再练练。' : '进度已记住，下次接着练。'}</p>
      <div class="result-actions"><button class="primary" id="continue-button">${state.mode === 'hunt' ? '再玩一轮' : !completed ? '接着练' : state.mode === 'spell' ? '练习句子' : stageComplete(world.key, state.stage, 'spell') ? state.stage + 1 < Math.ceil(WORDS[world.key].length / 8) ? '前往下一站' : '回到基地' : '练习拼词'}</button><button class="quiet-button" id="results-home">回到基地</button></div>${storageNotice()}
    </section>`;
  app.querySelector('#results-home').onclick = renderMenu;
  app.querySelector('#continue-button').onclick = () => {
    if (state.mode === 'hunt') {
      unlockSpeech();
      const learned = ALL_WORDS.filter(word => wordProgress(word).correct > 0);
      startRound('hunt', huntQueue(learned));
    } else if (!completed) renderWorld(state.world, state.stage, state.mode);
    else if (state.mode === 'spell') renderWorld(state.world, state.stage, 'sentence');
    else if (!stageComplete(world.key, state.stage, 'spell')) renderWorld(state.world, state.stage, 'spell');
    else if (state.stage + 1 < Math.ceil(WORDS[world.key].length / 8)) renderWorld(state.world, state.stage + 1, 'spell');
    else renderMenu();
  };
  if (state.done > 0) confetti();
  focusMain();
}
function renderParents() {
  if (state.screen === 'level') renderResults('pause');
  stopRound(); state.screen = 'menu';
  const mastered = ALL_WORDS.filter(word => wordProgress(word).mastery >= 3);
  const review = ALL_WORDS.filter(word => wordProgress(word).review || (wordProgress(word).correct > 0 && wordProgress(word).mastery < 3));
  app.innerHTML = `
    <section class="parent-panel"><div class="panel-heading"><div><span class="eyebrow">家长查看</span><h1>每一步都有收获</h1></div><button class="quiet-button" id="parent-back">回到基地</button></div>
      <div class="parent-summary"><div><strong>${mastered.length}<small> / 220</small></strong><span>已掌握</span></div><div><strong>${review.length}</strong><span>待复习</span></div><div><strong>${getProgress().parts.length}</strong><span>已收集零件</span></div></div>
      <p class="parent-help">熟练度 0–3：答对加 1，答错减 1。到 3 就掌握。拼词和句子都练过，理解更牢。</p>
      <div class="parent-lists"><section><h2>已掌握 <span>${mastered.length}</span></h2><div class="word-list">${mastered.length ? mastered.map(word => `<span lang="en">${word}</span>`).join('') : '<p class="empty-note">还在起步，每次练习都有进步。</p>'}</div></section><section><h2>待复习 <span>${review.length}</span></h2><div class="word-list review-list">${review.length ? review.map(word => `<span lang="en" title="拼词 ${wordProgress(word).spell} 次，句子 ${wordProgress(word).sentence} 次">${word}<small>${wordProgress(word).mastery}/3</small></span>`).join('') : '<p class="empty-note">暂时没有需要复习的词。</p>'}</div></section></div>
      <section class="robot-gallery"><h2>机甲收藏</h2><div class="gallery-grid">${WORLDS.map((world, index) => `<div>${robot(index, getProgress().robots.includes(world.key))}<strong>${world.robot}</strong><span>${getProgress().robots.includes(world.key) ? '已解锁' : `${getProgress().parts.filter(word => WORDS[world.key].includes(word)).length} 个零件`}</span></div>`).join('')}</div></section>
      <div class="parent-reset"><p>进度只保存在这台设备的浏览器里。</p><button class="danger-button" id="reset-button">重置进度</button></div>${storageNotice()}
    </section>`;
  app.querySelector('#parent-back').onclick = renderMenu;
  app.querySelector('#reset-button').onclick = () => {
    if (window.confirm('确定清空所有单词、星星和机甲吗？这个操作不能撤销。')) { resetProgress(); renderParents(); }
  };
  focusMain();
}
function confetti() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  cancelAnimationFrame(confettiFrame);
  const canvas = document.getElementById('confetti');
  const context = canvas.getContext('2d');
  if (!context) return;
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = window.innerWidth * ratio; canvas.height = window.innerHeight * ratio;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  const bits = Array.from({length: 54}, () => ({ x: Math.random() * window.innerWidth, y: -30 - Math.random() * 200, speed: 2 + Math.random() * 3, angle: Math.random() * 6, color: shuffle(['#58dfcb', '#ff9970', '#ffda70', '#70bfff'])[0] }));
  const end = performance.now() + 1800;
  function draw() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    if (performance.now() > end) return;
    bits.forEach(bit => {
      bit.y += bit.speed; bit.angle += .04;
      context.save(); context.translate(bit.x, bit.y); context.rotate(bit.angle); context.fillStyle = bit.color;
      context.fillRect(-3, -5, 6, 10); context.restore();
    });
    confettiFrame = requestAnimationFrame(draw);
  }
  draw();
}
document.getElementById('home-button').onclick = () => {
  if (state.screen === 'level') renderResults('pause');
  else renderMenu();
};
document.getElementById('parent-button').onclick = renderParents;
document.addEventListener('visibilitychange', () => {
  if (document.hidden) stopSpeech();
  else if (state.screen === 'level' && Date.now() >= state.deadline) renderResults('time');
});
renderMenu();
