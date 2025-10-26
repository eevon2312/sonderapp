import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useListeningMode } from '../../hooks/useListeningMode';
import ListeningOverlay from './ListeningOverlay';

const MicIcon = ({ className = '' }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.49 6-3.31 6-6.72h-1.7z"/></svg> );

const SAFETY_RESOURCES = [
  { name: 'Crisis Text Line', text: 'Text HOME to 741741' },
  { name: 'National Suicide Prevention Lifeline', text: 'Call 988' },
];


interface PromptCardProps {
  prompt: string;
  onSave: (text: string) => void;
  onShare: (text: string) => void;
  onPause: () => void;
  onKeepReflecting: () => void;
  onSaveDraft?: (text: string) => void;
  communityCount?: number;
}

const PromptCard: React.FC<PromptCardProps> = ({ prompt, onSave, onShare, onPause, onKeepReflecting, onSaveDraft, communityCount = 0 }) => {
  const [text, setText] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { isListening, isSafetyTriggered, empathicMessage, reset: resetListeningMode } = useListeningMode(text);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isSafetyTriggered) {
        textareaRef.current?.focus();
    }
  }, [isSafetyTriggered]);

  // Debounced auto-save
  useEffect(() => {
    if (!onSaveDraft || isSubmitted) return;
    const handler = setTimeout(() => {
      if (text.trim()) {
        onSaveDraft(text);
      }
    }, 800);
    return () => clearTimeout(handler);
  }, [text, onSaveDraft, isSubmitted]);

  const handleSubmit = () => {
    if (text.trim() === '') return;
    onSave(text);
    setIsSubmitted(true);
  };
  
  const handleAction = (action: (text: string) => void) => {
    if (text.trim() === '') return;
    action(text);
  }

  const communityMessage = useMemo(() => {
      if (communityCount > 5) {
          const roundedCount = Math.max(10, Math.round(communityCount / 10) * 10);
          return `You're not alone — about ${roundedCount} others have reflected on this feeling recently.`;
      }
      return null;
  }, [communityCount]);

  return (
    <div className="flex flex-col items-center justify-center h-full animate-fade-in -mt-16">
        <div className="w-full max-w-2xl relative">
            {isListening && !isSubmitted && !isSafetyTriggered && <ListeningOverlay message={empathicMessage} />}
            <div className="bg-[#222a26] p-6 rounded-xl border border-white/10 flex flex-col gap-4">
                <p className="font-lora text-2xl text-green-200">{prompt}</p>

                {isSafetyTriggered ? (
                    <div className="text-center bg-red-900/50 p-4 rounded-lg border border-red-500/50 my-2 text-sm animate-fade-in">
                        <p className="text-red-200 mb-2 font-semibold">I’m sorry you’re feeling this way. If you’re in danger or thinking about harming yourself, please contact local emergency services or a crisis line now.</p>
                        <div className="my-3 border-t border-red-400/20"></div>
                        {SAFETY_RESOURCES.map(r => <p key={r.name} className="text-red-200">{r.name}: {r.text}</p>)}
                        <button onClick={onPause} className="mt-4 px-4 py-2 text-sm bg-white/10 rounded-lg hover:bg-white/20 transition-colors text-red-200">
                            End Session
                        </button>
                    </div>
                ) : (
                    <>
                        <textarea
                            ref={textareaRef}
                            aria-label="Journal input"
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Let your thoughts flow..."
                            className="w-full h-40 bg-[#1B2620] rounded-lg p-3 text-base leading-relaxed text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-400/50 resize-none transition-all"
                            disabled={isSubmitted}
                        />
                        
                        {!isSubmitted ? (
                            <div className="flex items-center justify-between">
                                <button className={`p-3 rounded-full font-semibold transition-colors bg-blue-500/80 text-white hover:bg-blue-400 disabled:bg-gray-500`} aria-label={"Start recording"}>
                                    <MicIcon className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={text.trim() === ''}
                                    className="px-6 py-2 bg-green-500 text-gray-900 rounded-lg font-semibold hover:bg-green-400 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
                                >
                                    Save Reflection
                                </button>
                            </div>
                        ) : (
                            <div className="animate-fade-in">
                                <p className="text-center text-green-200 mb-4">Thank you for sharing that. Your reflection is saved.</p>
                                {communityMessage && (
                                    <p className="text-center text-gray-400 italic mb-4">
                                        {communityMessage}
                                    </p>
                                )}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <button onClick={() => onKeepReflecting()} className="px-4 py-3 text-sm rounded-lg transition-colors bg-green-500/80 text-gray-900 hover:bg-green-400 font-semibold">Keep Reflecting ✨</button>
                                    <button onClick={onPause} className="px-4 py-3 text-sm rounded-lg transition-colors bg-white/5 hover:bg-white/10 text-green-200">Pause for Now 🌙</button>
                                    <button onClick={() => handleAction(onShare)} className="px-4 py-3 text-sm rounded-lg transition-colors bg-white/5 hover:bg-white/10 text-green-200">Share with Tribe 🤍</button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    </div>
  );
};

export default PromptCard;