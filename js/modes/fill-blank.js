import { shuffle } from '../words.js';
import { SENTENCES } from '../sentences.js';
import { speak, speechReady } from '../speech.js';

export function fillBlank(host, word, callbacks) {
  const sentence = SENTENCES[word][0];
  const options = shuffle([word, ...sentence.distractors]);
  let misses = 0;
  let finished = false;
  host.innerHTML = `
    <div class="question-top"><span class="eyebrow">句子选词</span><span class="tiny-label">选一个词，补完整</span></div>
    <button class="speaker-button" aria-label="听句子">${callbacks.speakerIcon}<span>听句子</span></button>
    <div class="fallback" ${speechReady() ? 'hidden' : ''}><span>请家长读</span><strong lang="en">${word}</strong></div>
    <p class="sentence-text" lang="en">${sentence.blanked.replace('___', '<span class="sentence-blank">___</span>')}</p>
    <div class="word-options">${options.map(option => `<button class="word-card" lang="en" data-word="${option}">${option}</button>`).join('')}</div>
    <p class="feedback" aria-live="polite">哪个单词最合适？</p>
    <button class="primary next-button" hidden>下一个</button>`;
  const fallback = host.querySelector('.fallback');
  const feedback = host.querySelector('.feedback');
  const read = () => { fallback.hidden = speak(sentence.original); };
  host.querySelector('.speaker-button').onclick = read;
  const showFallback = () => { fallback.hidden = false; };
  window.addEventListener('speechfallback', showFallback);
  host.querySelector('.next-button').onclick = callbacks.next;
  host.querySelectorAll('.word-card').forEach(button => {
    button.onclick = () => {
      if (finished || button.disabled) return;
      if (button.dataset.word === word) {
        finished = true;
        button.classList.add('correct');
        host.querySelectorAll('.word-card').forEach(card => { card.disabled = true; });
        host.querySelector('.sentence-text').innerHTML = sentence.blanked.replace('___', `<mark>${word}</mark>`);
        feedback.textContent = '选对了！听听完整的句子。';
        feedback.classList.add('positive');
        callbacks.correct(misses);
        host.querySelector('.next-button').hidden = false;
        read();
      } else {
        misses++;
        callbacks.wrong();
        button.disabled = true;
        button.classList.add('shake', 'muted');
        feedback.textContent = '再听一次，你可以的。';
        if (misses >= 2) feedback.textContent = `提示：试试 ${word}。`;
        read();
      }
    };
  });
  read();
  return () => window.removeEventListener('speechfallback', showFallback);
}
