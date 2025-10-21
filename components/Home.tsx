import React from 'react';
import { Prompt } from '../types';
import { PROMPT_PACKS } from '../constants';

interface HomeProps {
  onNavigate: (view: 'mindmap' | 'my_entries' | 'prompt_library') => void;
  onStartJournaling: (prompt: Prompt) => void;
  todayPrompt: Prompt;
}

const Home: React.FC<HomeProps> = ({ onNavigate, onStartJournaling, todayPrompt }) => {
  const date = new Date();
  const formattedDate = date.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="h-full flex flex-col animate-fade-in">
      <header className="flex justify-between items-start mb-12">
        <div>
          <h1 className="text-3xl font-bold text-green-200">Today</h1>
          <p className="text-gray-400">{formattedDate}</p>
        </div>
        <div className="flex gap-2">
            <button onClick={() => onNavigate('my_entries')} className="px-4 py-2 text-sm bg-white/10 rounded-lg hover:bg-white/20 transition-colors">My Entries</button>
            <button onClick={() => onNavigate('mindmap')} className="px-4 py-2 text-sm bg-white/10 rounded-lg hover:bg-white/20 transition-colors">Explore Mindmap</button>
        </div>
      </header>

      <div className="flex-grow flex flex-col items-center justify-center text-center">
        <h2 className="text-4xl font-lora max-w-2xl text-green-100 leading-snug mb-12">
          How are you feeling?
        </h2>
        <div className="flex flex-col sm:flex-row gap-6">
            <button
              onClick={() => onStartJournaling(todayPrompt)}
              className="px-8 py-4 bg-green-400/90 text-gray-900 rounded-lg font-semibold hover:bg-green-300 transition-all transform hover:scale-105 flex flex-col items-center justify-center w-72 h-40 text-center"
            >
                <span className="text-xl">Start Today's Prompt</span>
                <span className="text-sm font-normal mt-2 text-gray-800 line-clamp-2 px-2">"{todayPrompt.text}"</span>
            </button>
            <button
                onClick={() => onNavigate('prompt_library')}
                className="px-8 py-4 bg-white/10 text-green-200 rounded-lg font-semibold hover:bg-white/20 transition-all transform hover:scale-105 flex flex-col items-center justify-center w-72 h-40 text-center"
            >
                 <span className="text-xl">Explore The Library</span>
                 <span className="text-sm font-normal mt-2 text-green-300">Choose from {PROMPT_PACKS.length} curated packs</span>
            </button>
        </div>
      </div>
    </div>
  );
};

export default Home;