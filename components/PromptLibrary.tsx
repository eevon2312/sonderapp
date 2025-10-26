import React from 'react';
import { PROMPT_PACKS, ALL_PROMPTS } from '../constants';
import { Prompt } from '../types';

interface PromptLibraryProps {
    onNavigate: (view: 'home') => void;
    onSelectPrompt: (prompt: Prompt) => void;
    onSelectPack: (prompts: Prompt[]) => void;
}

const getRandomPrompt = (): Prompt => {
    return ALL_PROMPTS[Math.floor(Math.random() * ALL_PROMPTS.length)];
};

const PromptLibrary: React.FC<PromptLibraryProps> = ({ onNavigate, onSelectPrompt, onSelectPack }) => {
    
    return (
        <div className="h-full flex flex-col animate-fade-in">
            <header className="text-center mb-8">
                <h1 className="text-4xl font-lora text-green-100 mb-2">How would you like to reflect?</h1>
                <p className="text-gray-400">Choose a starting point, or just write freely.</p>
            </header>

            <main className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl">
                {PROMPT_PACKS.map((pack) => (
                    <button
                        key={pack.title}
                        onClick={() => {
                            const promptsForPack: Prompt[] = pack.prompts.map((promptText, promptIndex) => ({
                                id: `${pack.title.replace(/\s+/g, '-')}-${promptIndex}`,
                                text: promptText,
                                category: pack.title,
                            }));
                            onSelectPack(promptsForPack);
                        }}
                        className="bg-[#222a26] p-6 rounded-xl border border-white/10 text-left hover:bg-white/5 hover:border-white/20 transition-all transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-green-400/50"
                    >
                        <span className="text-3xl" aria-hidden="true">{pack.emoji}</span>
                        <h3 className="font-bold text-lg text-green-200 mt-3">{pack.shortTitle}</h3>
                        <p className="text-sm text-gray-400 mt-1">{pack.description}</p>
                    </button>
                ))}
                
                <button
                    onClick={() => onSelectPrompt(getRandomPrompt())}
                    className="bg-[#222a26] p-6 rounded-xl border border-white/10 text-left hover:bg-white/5 hover:border-white/20 transition-all transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-green-400/50"
                >
                    <span className="text-3xl" aria-hidden="true">✨</span>
                    <h3 className="font-bold text-lg text-green-200 mt-3">Random Prompt</h3>
                    <p className="text-sm text-gray-400 mt-1">Let serendipity guide you</p>
                </button>
            </main>
        </div>
    );
};

export default PromptLibrary;
