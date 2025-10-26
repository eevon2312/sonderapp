
import React from 'react';
import { Prompt } from '../types';
import { Typewriter } from './ui/typewriter';

interface HomeProps {
  onNavigate: (view: 'sonder_tribe' | 'sonder_notes' | 'prompt_library') => void;
  onStartJournaling: (prompt: Prompt) => void;
  onStartListening: () => void;
  onStartReflecting: () => void;
  todayPrompt: Prompt;
  userName: string;
}

const ActionCard = ({ emoji, title, description, onClick }: { emoji: string; title: string; description: string; onClick: () => void; }) => (
    <button
        onClick={onClick}
        className="bg-[#222a26] p-6 rounded-xl border border-white/10 text-left hover:bg-white/5 hover:border-white/20 transition-all transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-green-400/50 w-full h-full flex flex-col"
    >
        <span className="text-4xl" aria-hidden="true">{emoji}</span>
        <h3 className="font-bold text-xl text-green-200 mt-4">{title}</h3>
        <p className="text-md text-gray-400 mt-1 flex-grow">{description}</p>
    </button>
);


const Home: React.FC<HomeProps> = ({ onNavigate, onStartJournaling, onStartListening, onStartReflecting, todayPrompt, userName }) => {
  const date = new Date();
  const formattedDate = date.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  
  const typewriterTexts = [
    "How would you like to begin?",
    "What's on your mind today?",
    "Take a quiet moment for yourself.",
    "This space is here for you.",
  ];

  return (
    <div className="h-full flex flex-col animate-fade-in">
      <header className="flex justify-between items-start mb-12">
        <div>
          <h1 className="text-3xl font-bold text-green-200">Today, {userName}</h1>
          <p className="text-gray-400">{formattedDate}</p>
        </div>
        <div className="flex gap-2">
            <button onClick={() => onNavigate('sonder_notes')} className="px-4 py-2 text-sm bg-white/10 rounded-lg hover:bg-white/20 transition-colors">Sonder Notes</button>
            <button onClick={() => onNavigate('sonder_tribe')} className="px-4 py-2 text-sm bg-white/10 rounded-lg hover:bg-white/20 transition-colors">Sonder Tribe</button>
        </div>
      </header>

      <div className="flex-grow flex flex-col items-center justify-center text-center -mt-8">
        <div className="h-24 mb-10 flex items-center justify-center">
            <Typewriter
                text={typewriterTexts}
                speed={50}
                waitTime={3000}
                deleteSpeed={25}
                loop={true}
                className="text-4xl font-lora max-w-2xl text-green-100 leading-snug"
                cursorChar="_"
                cursorClassName="text-green-100"
            />
        </div>
        
        <div className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-3 gap-6">
            <ActionCard 
                emoji="🤔"
                title="Start Reflecting"
                description="Begin with a prompt to gently guide your thoughts."
                onClick={onStartReflecting}
            />
            <ActionCard 
                emoji="💬"
                title="Just Listen"
                description="A quiet space to be heard without judgment."
                onClick={onStartListening}
            />
            <ActionCard 
                emoji="📚"
                title="Explore Prompts"
                description="Browse our library of themes to find what speaks to you."
                onClick={() => onNavigate('prompt_library')}
            />
        </div>

        <p className="text-gray-400 mt-12">
            Or, start with a guided reflection from{' '}
            <button 
                onClick={() => onStartJournaling(todayPrompt)} 
                className="text-green-300 hover:underline font-semibold"
            >
                Today's Prompt
            </button>.
        </p>
      </div>
    </div>
  );
};

export default Home;
