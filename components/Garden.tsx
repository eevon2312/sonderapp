import React, { useMemo } from 'react';
import { JournalEntry } from '../types';

interface GardenProps {
  entries: JournalEntry[];
  onNavigate: (view: 'home') => void;
}

const GARDEN_CATEGORY_MAP: Record<string, { category: string; emoji: string }> = {
    'Healing': { category: 'Healing', emoji: '🌿' },
    'Belonging': { category: 'Belonging', emoji: '💞' },
    'Gratitude': { category: 'Gratitude', emoji: '🌼' },
    'Growth': { category: 'Growth', emoji: '🌻' },
    'Loneliness': { category: 'Loneliness', emoji: '🌙' },
    'Love': { category: 'Love', emoji: '💐' },
    'Hope': { category: 'Hope', emoji: '☀️' },
};

const PACK_TO_GARDEN_CATEGORY: Record<string, string> = {
    'Acceptance Pack': 'Healing',
    'Failure Pack': 'Healing',
    'Forgiveness Pack': 'Healing',
    'Break-up & Heartbreak Pack': 'Healing',
    'Childhood Trauma Pack': 'Healing',
    'Belonging Pack': 'Belonging',
    'Parenthood Pack': 'Belonging',
    'Gratitude Pack': 'Gratitude',
    'Things You Found Beautiful Pack': 'Gratitude',
    'Growth & Transformation Pack': 'Growth',
    'Self-Discovery Pack': 'Growth',
    'Manifestation Pack': 'Growth',
    'Comparison Pack': 'Growth',
    'Loneliness Pack': 'Loneliness',
    'Loss & Mortality Pack': 'Loneliness',
    'Love & Relationships Pack': 'Love',
    'Letters To Pack': 'Love',
    'Hope Pack': 'Hope'
};


const Tulip: React.FC<{ entry: JournalEntry; style: React.CSSProperties }> = ({ entry, style }) => {
    const gardenCategoryName = PACK_TO_GARDEN_CATEGORY[entry.promptCategory] || 'Growth';
    const gardenInfo = GARDEN_CATEGORY_MAP[gardenCategoryName];

    return (
        <div 
            className="absolute group transition-transform duration-300 hover:scale-110 hover:z-10 tulip-animation"
            style={style}
        >
            <span className="text-4xl sm:text-5xl cursor-default" role="img" aria-label={`A ${gardenInfo.category} tulip`}>{gardenInfo.emoji}</span>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs bg-[#1a201d] text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg border border-white/10">
                <p className="font-bold text-green-300">{entry.promptCategory}</p>
                <p className="italic text-gray-400 mt-1">"{entry.promptText}"</p>
                <div className="absolute left-1/2 -translate-x-1/2 bottom-[-4px] w-2 h-2 bg-[#1a201d] transform rotate-45"></div>
            </div>
        </div>
    );
};

const Garden: React.FC<GardenProps> = ({ entries, onNavigate }) => {
    const tulipPositions = useMemo(() => {
        const simpleHash = (str: string): number => {
            let hash = 0;
            if (str.length === 0) return hash;
            for (let i = 0; i < str.length; i++) {
                const char = str.charCodeAt(i);
                hash = (hash << 5) - hash + char;
                hash |= 0; // Convert to 32bit integer
            }
            return (Math.abs(hash) % 1000) / 1000;
        };

        return entries.map((entry, index) => {
             const transformValue = `rotate(${simpleHash(entry.promptText) * 20 - 10}deg) scale(${0.8 + simpleHash(entry.emotion) * 0.4})`;
             return {
                top: `${10 + simpleHash(entry.id) * 70}%`,
                left: `${5 + simpleHash(entry.timestamp.toString()) * 85}%`,
                '--transform-to': transformValue,
                transform: transformValue,
                animationDelay: `${index * 50}ms`,
            }
        });
    }, [entries]);

    React.useEffect(() => {
        const styleId = 'garden-animations';
        if (document.getElementById(styleId)) return;

        const styleSheet = document.createElement("style");
        styleSheet.id = styleId;
        styleSheet.innerText = `
            @keyframes grow-in {
                from { transform: scale(0); opacity: 0; }
                to { transform: var(--transform-to, scale(1)); opacity: 1; }
            }
            .tulip-animation {
                opacity: 0;
                transform: scale(0);
                animation-name: grow-in;
                animation-duration: 0.5s;
                animation-timing-function: ease-out;
                animation-fill-mode: forwards;
            }
        `;
        document.head.appendChild(styleSheet);
    }, []);
    
    return (
        <div className="h-full flex flex-col animate-fade-in -m-6">
            <header className="flex justify-between items-center mb-6 p-4 sm:p-6 border-b border-[#2B3C34] flex-shrink-0">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-lora text-green-100">Your Garden</h1>
                    <p className="text-gray-400">Each flower represents a moment of reflection.</p>
                </div>
                <button onClick={() => onNavigate('home')} className="px-4 py-2 text-sm bg-white/10 rounded-lg hover:bg-white/20 transition-colors">Home</button>
            </header>
            
            <main className="flex-grow p-4 sm:p-6 overflow-hidden relative bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2240%22%20height%3D%2240%22%20viewBox%3D%220%200%2040%2040%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22%233c4d45%22%20fill-opacity%3D%220.4%22%20fill-rule%3D%22evenodd%22%3E%3Cpath%20d%3D%22M0%2040L40%200H20L0%2020M40%2040V20L20%2040%22%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E')]">
                {entries.length > 0 ? (
                    entries.map((entry, index) => (
                         <Tulip key={entry.id} entry={entry} style={tulipPositions[index]} />
                    ))
                ) : (
                    <div className="text-center text-gray-400 h-full flex items-center justify-center flex-col">
                        <p className="text-2xl font-lora">Your garden is waiting to bloom.</p>
                        <p className="mt-2">Start a reflection to plant your first flower.</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Garden;