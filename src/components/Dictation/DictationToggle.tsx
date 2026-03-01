import { Volume2, VolumeX } from 'lucide-react';
import { useDictation } from '../../contexts/DictationContext';

export default function DictationToggle() {
  const { isDictationEnabled, toggleDictation } = useDictation();

  return (
    <button 
      onClick={toggleDictation}
      className="
        fixed bottom-6 right-6 z-50
        flex items-center gap-2
        rounded-full px-4 py-3
        shadow-lg
        transition
      "
      aria-label="Toggle dictation mode"
    >
      {isDictationEnabled ? (
        <>
          <Volume2 size={20} />
          <span className="text-sm">Dictation ON</span>
        </>
      ) : (
        <>
          <VolumeX size={20} />
          <span className="text-sm">Dictation OFF</span>
        </>
      )}
    </button>
  );
}
