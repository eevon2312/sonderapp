import React, { useState, useEffect } from 'react';
import { Prompt, JournalEntry } from '../types';
import { analyzeEntry } from '../services/geminiService';

interface JournalViewProps {
  prompt: Prompt;
  onSave: (entry: JournalEntry) => void;
  onExit: () => void;
  queuePosition?: { current: number; total: number };
}

const JournalView: React.FC<JournalViewProps> = ({ prompt, onSave, onExit, queuePosition }) => {
  const [text, setText] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Reset text when prompt changes in a queue
  useEffect(() => {
    setText('');
    setIsLoading(false);
  }, [prompt]);

  const handleSave = async () => {
    if (text.trim() === '') return;
    setIsLoading(true);

    try {
      const analysis = await analyzeEntry(text);
      const newEntry: JournalEntry = {
        id: new Date().toISOString(),
        promptId: prompt.id,
        promptText: prompt.text,
        text,
        emotion: analysis.emotion,
        themes: analysis.themes,
        isShared: isSharing,
        timestamp: Date.now(),
      };
      onSave(newEntry);
    } catch (error) {
      console.error("Failed to process entry:", error);
      const fallbackEntry: JournalEntry = {
        id: new Date().toISOString(),
        promptId: prompt.id,
        promptText: prompt.text,
        text,
        emotion: 'Unknown',
        themes: [],
        isShared: isSharing,
        timestamp: Date.now(),
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
      <div className="text-center">
        <p className="font-lora text-2xl text-green-200">{prompt.text}</p>
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