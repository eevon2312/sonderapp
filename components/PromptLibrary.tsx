import React, { useState } from 'react';
import { PROMPT_PACKS } from '../constants';
import { Prompt } from '../types';

interface PromptLibraryProps {
    onNavigate: (view: 'home') => void;
    onSelectPrompt: (prompt: Prompt) => void;
    onSelectPack: (prompts: Prompt[]) => void;
}

const PromptLibrary: React.FC<PromptLibraryProps> = ({ onNavigate, onSelectPrompt, onSelectPack }) => {
    const [openPackIndex, setOpenPackIndex] = useState<number | null>(null);

    const togglePack = (index: number) => {
        setOpenPackIndex(openPackIndex === index ? null : index);
    };

    return (
        <div className="h-full flex flex-col animate-fade-in">
            <header className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-green-200">Prompt Library</h1>
                    <p className="text-gray-400">Choose a category to begin exploring.</p>
                </div>
                <button onClick={() => onNavigate('home')} className="px-4 py-2 text-sm bg-white/10 rounded-lg hover:bg-white/20 transition-colors">Home</button>
            </header>

            <div className="overflow-y-auto flex-grow pr-2 space-y-4">
                {PROMPT_PACKS.map((pack, index) => (
                    <div key={pack.title} className="bg-[#222a26] rounded-lg overflow-hidden">
                        <button 
                            onClick={() => togglePack(index)} 
                            className="w-full text-left p-4 flex justify-between items-center hover:bg-white/5 transition-colors focus:outline-none"
                        >
                            <div>
                                <h2 className="text-lg font-bold text-green-200">{pack.title}</h2>
                                <p className="text-gray-400 text-sm">{pack.description}</p>
                            </div>
                             <svg 
                                xmlns="http://www.w3.org/2000/svg" 
                                className={`h-6 w-6 text-green-300 transform transition-transform duration-300 ${openPackIndex === index ? 'rotate-180' : ''}`} 
                                fill="none" 
                                viewBox="0 0 24 24" 
                                stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        <div 
                            className={`transition-all duration-300 ease-in-out ${openPackIndex === index ? 'max-h-[30rem]' : 'max-h-0'}`}
                        >
                            <div className="border-t border-white/10 p-4 space-y-3">
                                <button
                                    onClick={() => {
                                        const promptsForPack: Prompt[] = pack.prompts.map((promptText, promptIndex) => ({
                                            id: `${pack.title.replace(/\s+/g, '-')}-${promptIndex}`,
                                            text: promptText,
                                            category: pack.title,
                                        }));
                                        onSelectPack(promptsForPack);
                                    }}
                                    className="w-full text-center font-semibold text-green-300 bg-green-900/50 hover:bg-green-800/50 p-2.5 rounded-md transition-colors mb-3"
                                >
                                    Journal This Pack ({pack.prompts.length} prompts)
                                </button>
                                {pack.prompts.map((promptText, promptIndex) => (
                                    <button 
                                        key={promptIndex}
                                        onClick={() => onSelectPrompt({
                                            id: `${pack.title.replace(/\s+/g, '-')}-${promptIndex}`,
                                            text: promptText,
                                            category: pack.title
                                        })}
                                        className="block w-full text-left text-gray-300 hover:text-green-200 transition-colors p-2 rounded-md hover:bg-white/5"
                                    >
                                        {promptText}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PromptLibrary;