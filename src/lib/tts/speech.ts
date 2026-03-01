let voice: SpeechSynthesisVoice | null = null;

function getVoice() {
  if (voice) return voice;

  const voices = window.speechSynthesis.getVoices();
  voice = voices.find(v => v.lang.startsWith('en')) || voices[0] || null;

  return voice;
}

export function speakText(text: string) {
  if (!('speechSynthesis' in window)) return;

  // Stop anything already speaking (this makes it fast)
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.voice = getVoice(); // reuse same voice
  utterance.rate = 1.1; // slightly faster
  utterance.pitch = 1;
  utterance.volume = 1;

  window.speechSynthesis.speak(utterance);
}
