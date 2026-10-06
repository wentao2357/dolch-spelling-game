import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { WORDS, ALL_WORDS, LEVEL_KEYS } from '../js/words.js';
import { SENTENCES } from '../js/sentences.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const counts = [40, 52, 41, 46, 41];
assert.deepEqual(LEVEL_KEYS, ['pre_primer','primer','first_grade','second_grade','third_grade']);
assert.deepEqual(Object.values(WORDS).map(words => words.length), counts);
assert.equal(ALL_WORDS.length, 220);
assert.equal(new Set(ALL_WORDS).size, 220);
// Fingerprint computed from the exact list supplied in the request; checks order
// and spelling, rather than only counting 220 arbitrary words.
assert.equal(createHash('sha256').update(JSON.stringify(WORDS)).digest('hex'), 'c2c0ca4aa85767e307bd5e7cb77107b5225f7dc9c75b81222b8647f7cabaffe8');
assert.equal(WORDS.pre_primer[4], 'I');
assert(WORDS.second_grade.includes("don't"));
const allowed = new Set(ALL_WORDS);
let sentences = 0;
for (const word of ALL_WORDS) {
  assert(SENTENCES[word]?.length >= 1, `${word}: missing sentence`);
  for (const sentence of SENTENCES[word]) {
    assert.equal(sentence.answer, word);
    assert.equal((sentence.blanked.match(/___/g) || []).length, 1, `${word}: blank count`);
    assert.equal(sentence.blanked.replace('___', word), sentence.original, `${word}: restoration`);
    assert.equal(sentence.distractors.length, 2, `${word}: three-card question`);
    assert.equal(new Set(sentence.distractors).size, 2, `${word}: repeated distractor`);
    for (const distractor of sentence.distractors) {
      assert(allowed.has(distractor), `${word}: invalid distractor ${distractor}`);
      assert.notEqual(distractor, word, `${word}: distractor equals answer`);
    }
    sentences++;
  }
}
const html = readFileSync(resolve(root, 'dist/index.html'), 'utf8');
assert(!/<script[^>]+src=|<link[^>]+stylesheet/i.test(html), 'Bundle must not load JS or CSS');
assert(!/^import /m.test(html), 'Bundle must have no module imports');
assert(!/<(?:img|iframe)[^>]+src=["']https?:/i.test(html), 'No external assets');
console.log(`PASS: ${ALL_WORDS.length} unique words; counts ${counts.join('/')}; ${sentences} valid sentences; 440 valid distractors; bundle is self-contained.`);
