// Optional maintainer utility. The game has no build or installation step:
// dist/index.html is already supplied, complete and ready to open.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const order = ['js/words.js', 'js/sentences.js', 'js/progress.js', 'js/speech.js', 'js/modes/listen-spell.js', 'js/modes/fill-blank.js', 'js/modes/word-hunt.js', 'js/main.js'];
const css = readFileSync(resolve(root, 'style.css'), 'utf8');
const modules = order.map(path => readFileSync(resolve(root, path), 'utf8').replace(/^import .*;\s*$/gm, '').replace(/^export /gm, ''));
// Block scopes retain module isolation while only exposing explicit exports.
const exports = [
  ['WORDS','LEVEL_KEYS','ALL_WORDS','WORLDS','shuffle'], ['SENTENCES'],
  ['storageWorks','getProgress','wordProgress','answerWord','stageProgress','stageComplete','worldComplete','noteStageWord','finishStage','stageQueue','resetProgress'],
  ['speechReady','unlockSpeech','speak','stopSpeech'], ['listenSpell'], ['fillBlank'], ['wordHunt'], []
];
const declarations = exports.flat().map(name => `let ${name};`).join('\n');
const code = modules.map((source, i) => {
  if (!exports[i].length) return `{\n${source}\n}`;
  const returned = exports[i].join(', ');
  return `({ ${returned} } = (() => {\n${source}\nreturn { ${returned} };\n})());`;
}).join('\n');
let html = readFileSync(resolve(root, 'index.html'), 'utf8');
html = html.replace('  <link rel="stylesheet" href="style.css">', `  <style>\n${css}\n  </style>`);
html = html.replace(/  <script>[\s\S]*?<\/script>/, `  <script>\n'use strict';\n${declarations}\n${code}\n  </script>`);
writeFileSync(resolve(root, 'dist/index.html'), html);
console.log('Wrote self-contained dist/index.html (no runtime dependencies).');
