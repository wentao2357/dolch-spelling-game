import { shuffle } from '../words.js';
import { speak, speechReady } from '../speech.js';

export function wordHunt(host, word, callbacks) {
  let finished = false;
  const options = shuffle([word, ...shuffle(callbacks.pool.filter(item => item !== word)).slice(0, 3)]);
  host.innerHTML = `
    <div class="question-top"><span class="eyebrow">词语捕手</span><span class="tiny-label">听一听，点气泡</span></div>
    <button class="speaker-button" aria-label="听单词">${callbacks.speakerIcon}<span>听单词</span></button>
    <div class="fallback" ${speechReady() ? 'hidden' : ''}><span>请家长读</span><strong lang="en">${word}</strong></div>
    <div class="bubble-field">${options.map((option, i) => `<button class="word-bubble" lang="en" data-word="${option}" style="--delay:${-i * 1.3}s;--duration:${7 + i}s;--x:${[4, 53, 8, 56][i]}%;--y:${i % 2 ? 12 : 45}px">${option}</button>`).join('')}</div>
    <p class="feedback" aria-live="polite">找到它！</p>
    <button class="primary next-button" hidden>下一个</button>`;
  const fallback = host.querySelector('.fallback');
  function read() { fallback.hidden = speak(word); }
  host.querySelector('.speaker-button').onclick = read;
  const showFallback = () => { fallback.hidden = false; };
  window.addEventListener('speechfallback', showFallback);
  host.querySelector('.next-button').onclick = callbacks.next;
  host.querySelectorAll('.word-bubble').forEach(button => {
    button.onclick = () => {
      if (finished) return;
      if (button.dataset.word === word) {
        finished = true;
        button.classList.add('caught');
        host.querySelectorAll('.word-bubble').forEach(bubble => { bubble.disabled = true; });
        const points = callbacks.correct(0);
        host.querySelector('.feedback').textContent = `找到了！ +${points} 能量`;
        host.querySelector('.feedback').classList.add('positive');
        host.querySelector('.next-button').hidden = false;
      } else {
        button.classList.remove('shake'); void button.offsetWidth; button.classList.add('shake');
        host.querySelector('.feedback').textContent = '再听听，能量不会减少。';
        read();
      }
    };
  });
  read();
  return () => window.removeEventListener('speechfallback', showFallback);
}
