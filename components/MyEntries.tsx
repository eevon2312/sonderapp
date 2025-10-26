

import React, { useMemo, useRef, useState } from 'react';
import { JournalEntry } from '../types';

interface SonderNotesProps {
  entries: JournalEntry[];
  onNavigate: (view: 'home') => void;
}

const renderHighlightedText = (text: string, phrases?: string[]) => {
  if (!phrases || phrases.length === 0) {
    return text;
  }
  // Escape special characters for regex and join with '|'
  const escapedPhrases = phrases.map(phrase => phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`(${escapedPhrases.join('|')})`, 'gi');
  const parts = text.split(regex);
  
  return parts.map((part, i) =>
    phrases.some(p => p.toLowerCase() === part.toLowerCase())
      ? <span key={i} className="bg-[#2ECC71]/20 px-1 rounded-sm">{part}</span>
      : part
  );
};

const EntryCard: React.FC<{ entry: JournalEntry }> = ({ entry }) => (
    <div className="bg-[#1B2620] p-6 rounded-lg border border-[#2B3C34] transition-transform hover:scale-[1.02] hover:shadow-lg hover:shadow-black/20">
        <h3 className="font-semibold text-lg text-[#E8F5E9] mb-3">{entry.promptText}</h3>
        <p className="text-[#A8BFA8] leading-relaxed whitespace-pre-wrap">
            {renderHighlightedText(entry.text, entry.highlightedPhrases)}
        </p>
    </div>
);

const SonderNotes: React.FC<SonderNotesProps> = ({ entries, onNavigate }) => {
    const mainContentRef = useRef<HTMLDivElement>(null);
    const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);

    const { emotionCounts, maxCount } = useMemo(() => {
        const counts: Record<string, number> = {};
        let max = 0;
        entries.forEach(entry => {
            if (entry.emotion && entry.emotion !== 'Unknown') {
                 const currentCount = (counts[entry.emotion] || 0) + 1;
                 counts[entry.emotion] = currentCount;
                 if (currentCount > max) {
                    max = currentCount;
                 }
            }
        });
        const sorted = Object.entries(counts).sort(([, a], [, b]) => b - a);
        return { emotionCounts: sorted, maxCount: max };
    }, [entries]);

    const getTagStyle = (count: number, maxCount: number) => {
        if (maxCount < 2) return { fontSize: '0.9rem', opacity: 0.8 };
        const ratio = Math.max(0.2, count / maxCount);
        const fontSize = 0.8 + ratio * 0.8;
        const opacity = 0.7 + ratio * 0.3;
        return { fontSize: `${fontSize}rem`, opacity };
    };

    const { sortedEntries, groupedByMonth } = useMemo(() => {
        const filteredEntries = selectedEmotion
            ? entries.filter(e => e.emotion === selectedEmotion)
            : entries;

        const sorted = [...filteredEntries].sort((a, b) => b.timestamp - a.timestamp);
        
        const monthGroups: { [key: string]: number[] } = {};
        sorted.forEach(entry => {
            const date = new Date(entry.timestamp);
            const monthYear = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
            if (!monthGroups[monthYear]) {
                monthGroups[monthYear] = [];
            }
            const day = date.getDate();
            if (!monthGroups[monthYear].includes(day)) {
                monthGroups[monthYear].push(day);
            }
        });

        return { sortedEntries: sorted, groupedByMonth: monthGroups };
    }, [entries, selectedEmotion]);

    const scrollToDate = (timestamp: number) => {
        const dateId = new Date(timestamp).toLocaleDateString('en-US');
        const element = mainContentRef.current?.querySelector(`[data-date-id="${dateId}"]`);
        element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const entriesByDate = useMemo(() => {
        const groups: { [key: string]: JournalEntry[] } = {};
        sortedEntries.forEach(entry => {
            const dateStr = new Date(entry.timestamp).toLocaleDateString('en-US');
            if (!groups[dateStr]) {
                groups[dateStr] = [];
            }
            groups[dateStr].push(entry);
        });
        return groups;
    }, [sortedEntries]);
    
  return (
    <div className="bg-[#0E1713] text-[#E8F5E9] h-full flex flex-col -m-6 animate-fade-in">
        <header className="flex justify-between items-center mb-0 p-6 border-b border-[#2B3C34] flex-shrink-0">
            <div>
                <h1 className="text-2xl font-bold text-green-200">Sonder Notes</h1>
                <p className="text-[#A8BFA8]">Your collected reflections.</p>
            </div>
            <button onClick={() => onNavigate('home')} className="px-4 py-2 text-sm bg-white/10 rounded-lg hover:bg-white/20 transition-colors">Home</button>
        </header>

        <div className="p-6 border-b border-[#2B3C34] flex-shrink-0">
            <h2 className="text-sm font-semibold text-[#A8BFA8] mb-3">Emotion Cloud</h2>
            <div className="flex flex-wrap gap-x-4 gap-y-2 items-center">
                <button
                    onClick={() => setSelectedEmotion(null)}
                    className={`px-3 py-1 text-sm rounded-full transition-colors ${
                        selectedEmotion === null
                        ? 'bg-green-400 text-gray-900 font-semibold'
                        : 'bg-[#1B2620] text-[#A8BFA8] hover:bg-[#2B3C34]'
                    }`}
                    aria-pressed={selectedEmotion === null}
                >
                    All Entries
                </button>
                {emotionCounts.map(([emotion, count]) => (
                     <button
                        key={emotion}
                        onClick={() => setSelectedEmotion(emotion)}
                        style={getTagStyle(count, maxCount)}
                        className={`transition-colors font-medium p-1 rounded ${
                            selectedEmotion === emotion
                            ? 'text-green-300'
                            : 'text-[#A8BFA8] hover:text-green-200'
                        }`}
                        aria-pressed={selectedEmotion === emotion}
                    >
                        {emotion}
                        <span className="text-[0.6rem] ml-1 opacity-60 relative" style={{ top: '-0.3em' }}>{count}</span>
                    </button>
                ))}
            </div>
        </div>

        <div className="flex flex-grow overflow-hidden">
            {/* Sidebar Calendar */}
            <aside className="w-48 flex-shrink-0 overflow-y-auto p-6 border-r border-[#2B3C34] hidden sm:block">
                <div className="space-y-6">
                    {Object.entries(groupedByMonth).map(([monthYear, days]) => (
                        <div key={monthYear}>
                            <h2 className="text-sm font-semibold text-[#A8BFA8] mb-3">{monthYear}</h2>
                            <div className="grid grid-cols-4 gap-1">
                                {/* FIX: Cast 'days' to number[] to fix type inference issue with Object.entries */}
                                {(days as number[]).map(day => {
                                     const entryForDay = sortedEntries.find(e => {
                                        const d = new Date(e.timestamp);
                                        return d.getDate() === day && d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) === monthYear;
                                     });
                                    return (
                                        <button 
                                            key={day}
                                            onClick={() => entryForDay && scrollToDate(entryForDay.timestamp)}
                                            className="text-center p-1 rounded-md text-[#A8BFA8] hover:bg-[#1B2620] transition-colors"
                                        >
                                            {day}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </aside>

            {/* Main Content */}
            <main ref={mainContentRef} className="flex-grow overflow-y-auto p-6">
                 {sortedEntries.length === 0 ? (
                    <div className="text-center text-gray-400 h-full flex items-center justify-center flex-col">
                        <p className="text-lg">
                            {selectedEmotion 
                                ? `No entries found with the emotion "${selectedEmotion}".`
                                : 'Your journal is waiting for your thoughts.'
                            }
                        </p>
                        {selectedEmotion && <button onClick={() => setSelectedEmotion(null)} className="mt-4 px-4 py-2 text-sm bg-white/10 rounded-lg hover:bg-white/20 transition-colors">Show All Entries</button>}
                    </div>
                 ) : (
                    <div className="space-y-8 max-w-2xl mx-auto">
                        {Object.entries(entriesByDate).map(([dateStr, dateEntries]) => (
                            <section key={dateStr} data-date-id={dateStr}>
                                <h2 className="text-lg font-semibold text-[#A8BFA8] mb-4">
                                    {/* FIX: Cast 'dateEntries' to JournalEntry[] to access its properties safely */}
                                    {new Date((dateEntries as JournalEntry[])[0].timestamp).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                                </h2>
                                <div className="space-y-4">
                                    {/* FIX: Cast 'dateEntries' to JournalEntry[] to fix type inference issue with Object.entries */}
                                    {(dateEntries as JournalEntry[]).map(entry => <EntryCard key={entry.id} entry={entry} />)}
                                </div>
                            </section>
                        ))}
                    </div>
                 )}
            </main>
        </div>
    </div>
  );
};

export default SonderNotes;
