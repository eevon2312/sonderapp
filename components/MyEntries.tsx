
import React from 'react';
import { JournalEntry } from '../types';

interface MyEntriesProps {
  entries: JournalEntry[];
  onNavigate: (view: 'home') => void;
}

const MyEntries: React.FC<MyEntriesProps> = ({ entries, onNavigate }) => {
  const sortedEntries = [...entries].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="h-full flex flex-col animate-fade-in">
        <header className="flex justify-between items-center mb-6">
            <div>
                <h1 className="text-2xl font-bold text-green-200">My Entries</h1>
                <p className="text-gray-400">A history of your reflections.</p>
            </div>
            <button onClick={() => onNavigate('home')} className="px-4 py-2 text-sm bg-white/10 rounded-lg hover:bg-white/20 transition-colors">Home</button>
        </header>

        <div className="overflow-y-auto flex-grow pr-2">
            {sortedEntries.length === 0 ? (
                <div className="text-center text-gray-400 mt-20">
                    <p>Your journal is waiting for your thoughts.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {sortedEntries.map(entry => (
                        <div key={entry.id} className="bg-[#222a26] p-4 rounded-lg">
                            <p className="font-lora text-lg text-green-200 mb-2">"{entry.promptText}"</p>
                            <p className="text-gray-300 whitespace-pre-wrap mb-3">{entry.text}</p>
                            <div className="flex justify-between items-center text-sm">
                                <div className="flex gap-2">
                                    <span className="bg-green-400/20 text-green-300 px-2 py-1 rounded">{entry.emotion}</span>
                                    {entry.themes.map(theme => (
                                        <span key={theme} className="bg-blue-400/20 text-blue-300 px-2 py-1 rounded">{theme}</span>
                                    ))}
                                </div>
                                <span className="text-gray-500">{new Date(entry.timestamp).toLocaleDateString()}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    </div>
  );
};

export default MyEntries;
