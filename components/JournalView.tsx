import React, { useState, useEffect } from 'react';
import { Prompt, JournalEntry } from '../types';
// FIX: The 'analyzeEntry' export was not found. Replaced with 'performFullEntryAnalysis'.
import { performFullEntryAnalysis, generateSpeech } from '../services/geminiService';
import { decode, decodeAudioData } from '../utils/audio';

interface JournalViewProps {
  prompt: Prompt;
  onSave: (entry: JournalEntry) => void;
  onExit: () => void;
  queuePosition?: { current: number; total: number };
}

const SpeakerIcon = ({ className = '' }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
    </svg>
);


const JournalView: React.FC<JournalViewProps> = ({ prompt, onSave, onExit, queuePosition }) => {
  const [text, setText] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioContextRef = React.useRef<AudioContext | null>(null);


  // Reset text when prompt changes in a queue
  useEffect(() => {
    setText('');
    setIsLoading(false);
  }, [prompt]);

  const handlePlayPrompt = async () => {
    if (isSpeaking) return;
    setIsSpeaking(true);
    try {
      const base64Audio = await generateSpeech(prompt.text);
      if (base64Audio) {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        const ctx = audioContextRef.current;
        const decodedBytes = decode(base64Audio);
        const audioBuffer = await decodeAudioData(decodedBytes, ctx, 24000, 1);
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        source.start();
        source.onended = () => setIsSpeaking(false);
      } else {
        setIsSpeaking(false);
      }
    } catch (error) {
      console.error("Failed to play audio prompt:", error);
      setIsSpeaking(false);
    }
  };


  const handleSave = async () => {
    if (text.trim() === '') return;
    setIsLoading(true);

    try {
      // FIX: Changed analyzeEntry to performFullEntryAnalysis and added highlightedPhrases to the new entry.
      const analysis = await performFullEntryAnalysis(text);
      const newEntry: JournalEntry = {
        id: new Date().toISOString(),
        promptId: prompt.id,
        promptText: prompt.text,
        promptCategory: prompt.category,
        text,
        emotion: analysis.emotion,
        themes: analysis.themes,
        isShared: isSharing,
        timestamp: Date.now(),
        highlightedPhrases: analysis.phrases,
      };
      onSave(newEntry);
    } catch (error) {
      console.error("Failed to process entry:", error);
      const fallbackEntry: JournalEntry = {
        id: new Date().toISOString(),
        promptId: prompt.id,
        promptText: prompt.text,
        promptCategory: prompt.category,
        text,
        emotion: 'Unknown',
        themes: [],
        isShared: isSharing,
        timestamp: Date.now(),
        highlightedPhrases: [],
      };
      onSave(fallbackEntry);
    } 
    // No finally block to reset loading, as component will re-render with new prompt or unmount
  };
  
  const isLastPrompt = queuePosition ? queuePosition.current === queuePosition.total : true;
  const saveButtonText = isLoading ? 'Analyzing...' : (isLastPrompt ? 'Save & Finish' : 'Save & Next');

  return (
    <div className="h-full flex flex-col animate-fade-in">
        <header className="flex justify-between items-center mb-4">
            {queuePosition && queuePosition.total > 1 ? (
                <div className="text-sm text-gray-400 bg-white/10 px-3 py-1 rounded-full">
                    Prompt {queuePosition.current} of {queuePosition.total}
                </div>
            ) : <div />}
            <button onClick={onExit} className="text-gray-400 hover:text-white text-2xl font-bold">&times;</button>
        </header>
      <div className="text-center flex items-center justify-center gap-4">
        <p className="font-lora text-2xl text-green-200">{prompt.text}</p>
        <button 
            onClick={handlePlayPrompt} 
            disabled={isSpeaking}
            className="text-green-300 hover:text-green-100 disabled:text-gray-500 transition-colors"
            aria-label="Read prompt aloud"
        >
            <SpeakerIcon className={`w-6 h-6 ${isSpeaking ? 'animate-pulse' : ''}`} />
        </button>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Start writing..."
        className="w-full flex-grow bg-[#222a26] rounded-lg p-4 text-lg leading-relaxed text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-400/50 resize-none my-6"
        autoFocus
      />
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={isSharing}
            onChange={(e) => setIsSharing(e.target.checked)}
            className="w-5 h-5 accent-green-400 bg-gray-700 rounded border-gray-600 focus:ring-green-500"
          />
          <span className="text-gray-300">Share anonymously with community</span>
        </label>
        <button
          onClick={handleSave}
          disabled={isLoading || text.trim() === ''}
          className="px-8 py-3 bg-green-500 text-gray-900 rounded-lg font-semibold hover:bg-green-400 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
        >
          {saveButtonText}
        </button>
      </div>
    </div>
  );
};

export default JournalView;
