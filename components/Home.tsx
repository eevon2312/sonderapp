import React, { useState } from 'react';
import { Prompt } from '../types';
import { useAuth } from '../hooks/useAuth';
import { Typewriter } from './ui/typewriter';

interface HomeProps {
  onNavigate: (view: 'tribe' | 'entries' | 'prompt_library' | 'garden') => void;
  onStartJournaling: (prompt: Prompt, initialMessage?: string) => void;
  onStartListening: () => void;
  onStartReflecting: () => void;
  todayPrompt: Prompt;
  userName: string;
}

const Home: React.FC<HomeProps> = ({ onNavigate, onStartJournaling, onStartListening, todayPrompt, userName }) => {
  const { logout } = useAuth();
  const [inputValue, setInputValue] = useState('');

  const handleCustomSubmit = () => {
    if (inputValue.trim() === '') return;
    onStartJournaling(
      { id: 'custom-start', text: "Here's what's on my mind...", category: 'Free Reflection' },
      inputValue
    );
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCustomSubmit();
    }
  };

  const date = new Date();
  const formattedDate = date.toLocaleString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="h-full flex flex-col items-center justify-center animate-fade-in -m-4 sm:-m-6 p-6">
      <div className="w-full max-w-4xl mx-auto flex flex-col h-full">

        <header className="w-full flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-green-100">Today, {userName}</h1>
            <p className="text-gray-400">{formattedDate}</p>
          </div>
          <nav className="flex items-center gap-2">
            <button onClick={() => onNavigate('entries')} className="px-4 py-2 text-sm bg-white/10 rounded-lg hover:bg-white/20 transition-colors">Entries</button>
            <button onClick={() => onNavigate('tribe')} className="px-4 py-2 text-sm bg-white/10 rounded-lg hover:bg-white/20 transition-colors">Tribe</button>
            <button onClick={() => onNavigate('garden')} className="px-4 py-2 text-sm bg-white/10 rounded-lg hover:bg-white/20 transition-colors">Garden</button>
            <button onClick={() => onNavigate('prompt_library')} className="px-4 py-2 text-sm bg-white/10 rounded-lg hover:bg-white/20 transition-colors">Explore</button>
            <button onClick={logout} className="px-4 py-2 text-sm bg-red-500/80 text-white rounded-lg hover:bg-red-500 transition-colors">Logout</button>
          </nav>
        </header>
        
        <main className="flex-grow flex flex-col items-center justify-center text-center">
            <div className="h-20 flex items-center justify-center">
                <Typewriter
                    text={[
                        "What’s on your mind today?",
                        "What does your heart need to say?",
                        "What are you holding onto?",
                        "Where do you feel tension in your body?",
                        "What question are you living in right now?"
                    ]}
                    speed={40}
                    waitTime={4000}
                    deleteSpeed={20}
                    className="text-3xl sm:text-4xl font-lora text-green-200"
                />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-8 w-full max-w-2xl">
                <button
                    onClick={() => onStartJournaling(todayPrompt)}
                    className="bg-white/5 p-4 rounded-lg hover:bg-white/10 transition-colors text-gray-300"
                >
                    Give me a reflective prompt for today.
                </button>
                <button
                    onClick={onStartListening}
                    className="bg-white/5 p-4 rounded-lg hover:bg-white/10 transition-colors text-gray-300"
                >
                    Just listen.
                </button>
                <button
                    onClick={() => onNavigate('prompt_library')}
                    className="bg-white/5 p-4 rounded-lg hover:bg-white/10 transition-colors text-gray-300"
                >
                    Explore journal prompts.
                </button>
            </div>
        </main>
        
        <div className="w-full max-w-2xl mx-auto">
          <div className="relative">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Or just start writing..."
              className="w-full bg-[#222a26] rounded-full p-4 pl-6 pr-16 text-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-400/50"
            />
            <button
              onClick={handleCustomSubmit}
              disabled={inputValue.trim() === ''}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center text-gray-200 disabled:bg-gray-800 disabled:text-gray-500 transition-colors"
              aria-label="Start journaling with this text"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="ml-1">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;