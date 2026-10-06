import { shuffle } from '../words.js';
import { speak, speechReady } from '../speech.js';

export function listenSpell(host, word, callbacks) {
  let position = 0;
  let misses = 0;
  let finished = false;
  const characters = [...word];
  const distractors = shuffle([...'abcdefghijklmnopqrstuvwxyz'].filter(letter => !word.toLowerCase().includes(letter))).slice(0, 3);
  const tiles = shuffle([...characters, ...distractors]);
  host.innerHTML = `
    <div class="question-top"><span class="eyebrow">听音拼词</span><span class="tiny-label">点字母，拼单词</span></div>
    <button class="speaker-button" aria-label="听单词">${callbacks.speakerIcon}<span>听单词</span></button>
    <div class="fallback" ${speechReady() ? 'hidden' : ''}><span>请家长读</span><strong lang="en">${word}</strong></div>
    <div class="hint-line" aria-live="polite"></div>
    <div class="spelling-slots" aria-label="拼词区域" lang="en">${characters.map(() => '<span class="letter-slot">&nbsp;</span>').join('')}</div>
    <div class="letter-tiles">${tiles.map((letter, index) => `<button class="letter-tile" data-index="${index}" lang="en" aria-label="字母 ${letter === "'" ? '撇号' : letter}">${letter === "'" ? '&#39;' : letter}</button>`).join('')}</div>
    <p class="feedback" aria-live="polite">准备好了？听一听！</p>
    <button class="primary next-button" hidden>下一个</button>`;
  const fallback = host.querySelector('.fallback');
  const feedback = host.querySelector('.feedback');
  const hint = host.querySelector('.hint-line');
  const slots = [...host.querySelectorAll('.letter-slot')];
  function read() { fallback.hidden = speak(word); }
  host.querySelector('.speaker-button').onclick = read;
  const showFallback = () => { fallback.hidden = false; };
  window.addEventListener('speechfallback', showFallback);
  host.querySelector('.next-button').onclick = callbacks.next;
  host.querySelectorAll('.letter-tile').forEach(button => {
    button.onclick = () => {
      if (finished || button.disabled) return;
      const letter = tiles[Number(button.dataset.index)];
      if (letter === characters[position]) {
        button.disabled = true;
        slots[position].textContent = letter;
        slots[position].classList.add('filled');
        position++;
        if (position === characters.length) {
          finished = true;
          callbacks.correct(misses);
          feedback.textContent = misses >= 3 ? '抄写完成！你学会了一点点。' : '拼对了！继续前进。';
          feedback.classList.add('positive');
          host.querySelector('.next-button').hidden = false;
          read();
        }
      } else {
        misses++;
        callbacks.wrong();
        button.classList.remove('shake'); void button.offsetWidth; button.classList.add('shake');
        feedback.textContent = '再听一次，慢慢来。';
        if (misses === 2) hint.textContent = `提示：第一个字母是 ${characters[0]}`;
        if (misses >= 3) {
          hint.innerHTML = `<span>照着拼一次</span> <strong lang="en">${word}</strong>`;
          if (misses === 3) {
            position = 0;
            slots.forEach(slot => { slot.innerHTML = '&nbsp;'; slot.classList.remove('filled'); });
            host.querySelectorAll('.letter-tile').forEach(tile => { tile.disabled = false; });
          }
        }
        read();
      }
    };
  });
  read();
  return () => window.removeEventListener('speechfallback', showFallback);
}
