import { ALL_WORDS, WORDS, shuffle } from './words.js';

const STORAGE_KEY = 'word-pilots-dolch-v1';
const empty = () => ({ version: 1, words: {}, stages: {}, parts: [], robots: [], rounds: 0 });
let data = empty();
let storageAvailable = true;
const validWord = word => ALL_WORDS.includes(word);
const integer = (value, maximum) => Math.min(maximum, Math.max(0, Math.floor(Number(value) || 0)));

try {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
  if (saved?.version === 1) {
    for (const word of ALL_WORDS) {
      const entry = saved.words?.[word];
      if (entry && typeof entry === 'object') data.words[word] = {
        mastery: integer(entry.mastery, 3), correct: integer(entry.correct, 100000),
        misses: integer(entry.misses, 100000), lastMiss: integer(entry.lastMiss, Number.MAX_SAFE_INTEGER),
        review: entry.review === true,
        spell: integer(entry.spell, 100000), sentence: integer(entry.sentence, 100000)
      };
    }
    for (const key of Object.keys(WORDS)) {
      for (let stage = 0; stage < Math.ceil(WORDS[key].length / 8); stage++) {
        const id = `${key}:${stage}`;
        for (const mode of ['spell', 'sentence']) {
          const entry = saved.stages?.[id]?.[mode];
          if (entry) {
            data.stages[id] ||= {};
            data.stages[id][mode] = {
              stars: integer(entry.stars, 3),
              seen: Array.isArray(entry.seen) ? [...new Set(entry.seen.filter(word => WORDS[key].slice(stage * 8, stage * 8 + 8).includes(word)))] : []
            };
          }
        }
      }
    }
    data.parts = Array.isArray(saved.parts) ? [...new Set(saved.parts.filter(validWord))] : [];
    data.robots = Array.isArray(saved.robots) ? [...new Set(saved.robots.filter(key => key in WORDS))] : [];
    data.rounds = integer(saved.rounds, 100000);
  }
} catch { storageAvailable = false; }

function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); storageAvailable = true; }
  catch { storageAvailable = false; }
}
export function storageWorks() { return storageAvailable; }
export function getProgress() { return data; }
export function wordProgress(word) {
  return data.words[word] || { mastery: 0, correct: 0, misses: 0, lastMiss: 0, review: false, spell: 0, sentence: 0 };
}
export function answerWord(word, correct, mode) {
  const entry = data.words[word] ||= { ...wordProgress(word) };
  if (correct) {
    entry.mastery = Math.min(3, entry.mastery + 1);
    entry.correct++;
    if (mode === 'spell' || mode === 'sentence') entry[mode]++;
    if (entry.mastery >= 3) entry.review = false;
  } else {
    entry.mastery = Math.max(0, entry.mastery - 1);
    entry.misses++;
    entry.lastMiss = Date.now();
    entry.review = true;
  }
  const earnedPart = entry.mastery >= 3 && !data.parts.includes(word);
  if (earnedPart) data.parts.push(word);
  save();
  return earnedPart;
}
export function stageProgress(key, stage, mode) {
  return data.stages[`${key}:${stage}`]?.[mode] || { stars: 0, seen: [] };
}
export function stageComplete(key, stage, mode) {
  return WORDS[key].slice(stage * 8, stage * 8 + 8).every(word => stageProgress(key, stage, mode).seen.includes(word));
}
export function worldComplete(key) {
  return Array.from({ length: Math.ceil(WORDS[key].length / 8) }, (_, stage) => stage).every(stage =>
    stageComplete(key, stage, 'spell') && stageComplete(key, stage, 'sentence'));
}
export function noteStageWord(key, stage, mode, word) {
  if (!WORDS[key].slice(stage * 8, stage * 8 + 8).includes(word)) return;
  const id = `${key}:${stage}`;
  data.stages[id] ||= {};
  data.stages[id][mode] ||= { stars: 0, seen: [] };
  if (!data.stages[id][mode].seen.includes(word)) data.stages[id][mode].seen.push(word);
  save();
}
export function finishStage(key, stage, mode, stars) {
  const id = `${key}:${stage}`;
  data.stages[id] ||= {};
  data.stages[id][mode] ||= { stars: 0, seen: [] };
  data.stages[id][mode].stars = Math.max(data.stages[id][mode].stars, stars);
  data.rounds++;
  const unlocked = worldComplete(key) && !data.robots.includes(key);
  if (unlocked) data.robots.push(key);
  save();
  return unlocked;
}
export function stageQueue(key, stage, mode) {
  const base = WORDS[key].slice(stage * 8, stage * 8 + 8);
  const completed = stageComplete(key, stage, mode);
  const pending = completed ? base : base.filter(word => !stageProgress(key, stage, mode).seen.includes(word));
  const missed = ALL_WORDS.filter(word => wordProgress(word).review && !pending.includes(word))
    .sort((a, b) => wordProgress(b).lastMiss - wordProgress(a).lastMiss).slice(0, 2);
  const queue = [...missed, ...pending];
  if (data.rounds % 3 === 2 && queue.length < 10) {
    const mastered = shuffle(ALL_WORDS.filter(word => wordProgress(word).mastery >= 3 && !queue.includes(word)));
    if (mastered.length) queue.push(mastered[0]);
  }
  // Short final stages still offer eight words, using earlier words as review.
  const padding = [...WORDS[key].slice(0, stage * 8), ...WORDS[key], ...ALL_WORDS];
  for (const word of padding) {
    if (queue.length >= 8) break;
    if (!queue.includes(word)) queue.push(word);
  }
  return queue.slice(0, 10);
}
export function resetProgress() {
  data = empty();
  save();
}
