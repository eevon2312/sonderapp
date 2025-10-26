import React from 'react';

export interface JournalTheme {
  id: string;
  emoji: string;
  title: string;
  subtitle: string;
}

interface PromptPickerProps {
  themes: JournalTheme[];
  onSelectTheme: (themeId: string) => void;
}

const PromptPicker: React.FC<PromptPickerProps> = ({ themes, onSelectTheme }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in">
        <h1 className="text-4xl font-lora text-green-100 mb-2">How would you like to reflect?</h1>
        <p className="text-gray-400 mb-8">Choose a starting point, or just write freely.</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full max-w-2xl">
            {themes.map((theme) => (
                <button
                    key={theme.id}
                    onClick={() => onSelectTheme(theme.id)}
                    className="bg-[#222a26] p-6 rounded-xl border border-white/10 text-left hover:bg-white/5 hover:border-white/20 transition-all transform hover:-translate-y-1"
                >
                    <span className="text-3xl">{theme.emoji}</span>
                    <h3 className="font-bold text-lg text-green-200 mt-3">{theme.title}</h3>
                    <p className="text-sm text-gray-400 mt-1">{theme.subtitle}</p>
                </button>
            ))}
        </div>
    </div>
  );
};

export default PromptPicker;
