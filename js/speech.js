let englishVoice = null;
const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
function chooseVoice() {
  if (!synth || typeof SpeechSynthesisUtterance === 'undefined') return;
  const english = synth.getVoices().filter(voice => /^en(?:[-_]|$)/i.test(voice.lang));
  const named = voice => /Samantha|Google US English|Microsoft Aria/i.test(voice.name);
  englishVoice = english.find(voice => named(voice) && voice.localService)
    || english.find(named) || english.find(voice => voice.localService)
    || english.find(voice => /^en[-_]US$/i.test(voice.lang)) || english[0] || null;
}
if (synth) {
  chooseVoice();
  synth.addEventListener('voiceschanged', chooseVoice);
}
export function speechReady() { chooseVoice(); return Boolean(synth && englishVoice); }
export function unlockSpeech() {
  if (!synth || typeof SpeechSynthesisUtterance === 'undefined') return;
  // Must run synchronously inside the start tap for iOS.
  try {
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance('');
    utterance.lang = 'en-US'; utterance.rate = 0.8;
    synth.speak(utterance);
  } catch { englishVoice = null; }
}
export function speak(text) {
  if (!speechReady()) return false;
  try {
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US'; utterance.rate = 0.8; utterance.voice = englishVoice;
    utterance.onerror = event => {
      if (!['canceled', 'interrupted'].includes(event.error)) {
        englishVoice = null;
        window.dispatchEvent(new Event('speechfallback'));
      }
    };
    synth.speak(utterance);
    return true;
  } catch { englishVoice = null; return false; }
}
export function stopSpeech() { if (synth) synth.cancel(); }
