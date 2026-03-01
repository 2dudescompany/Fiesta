import { useEffect } from 'react';
import { speakText } from '../lib/tts/speech';
import { logTtsUsage } from '../lib/tts/analytics';
import { useDictation } from '../contexts/DictationContext';
import { useAuth } from '../contexts/AuthContext';

function extractText(target: EventTarget | null): string | null {
  if (!(target instanceof HTMLElement)) return null;

  const ignoredTags = [
    'INPUT', 'TEXTAREA',
    'SVG', 'PATH', 'HEADER',
    'FOOTER', 'UL', 'OL', 'LI', 'NAV'
  ];

  if (ignoredTags.includes(target.tagName)) return null;

  // Ignore DIV containers (but not leaf text DIVs)
  if (target.tagName === 'DIV' && target.children.length > 0) {
    return null;
  }

  const text = target.innerText?.trim();
  if (!text) return null;

  // Avoid large paragraphs
  if (text.length > 300 || text.split(" ").length > 40) return null;

  return text;
}

export function useDictationCapture() {
  const { isDictationEnabled } = useDictation();
  const { user } = useAuth();

  useEffect(() => {
    if (!isDictationEnabled || !user) return;

    let hoverTimeout: number | null = null;
    let lastSpokenText: string | null = null;
    let lastSpeakTime = 0;

    const speak = async (text: string, triggerType: 'hover' | 'click') => {
      const now = Date.now();

      // cooldown 1.5 sec
      if (now - lastSpeakTime < 1500) return;

      if (text === lastSpokenText) return;

      lastSpeakTime = now;
      lastSpokenText = text;

      window.speechSynthesis.cancel();
      speakText(text);

      await logTtsUsage({
        userId: user.id,
        triggerType,
        text,
      });
    };

    const handleHover = (e: MouseEvent) => {
      hoverTimeout = window.setTimeout(async () => {
      const text = extractText(e.target);
      if (!text) return;

    // Stop previous speech
    window.speechSynthesis.cancel();

    speakText(text);

    await logTtsUsage({
      userId: user.id,
      triggerType: 'hover',
      text,
  });
}, 500);

    };

    const handleClick = async (e: MouseEvent) => {
      const text = extractText(e.target);
      if (!text) return;

      speak(text, 'click');
    };

    document.addEventListener('mouseover', handleHover);
    document.addEventListener('click', handleClick);

    return () => {
      document.removeEventListener('mouseover', handleHover);
      document.removeEventListener('click', handleClick);

      if (hoverTimeout) clearTimeout(hoverTimeout);
    };
  }, [isDictationEnabled, user]);
}
