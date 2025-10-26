import React, { useState, useMemo } from 'react';
import PromptPicker, { JournalTheme } from './ui/PromptPicker';
import PromptCard from './ui/PromptCard';
import ShareModal from './ui/ShareModal';
import { useJournal } from '../hooks/useJournal';
import { JournalEntry, Prompt } from '../types';
import { ALL_PROMPTS } from '../constants';

type Phase = 'picking' | 'writing' | 'sharing';

// --- Default Data ---
const THEMES: JournalTheme[] = [
    { id: 'loneliness', emoji: '🌧️', title: 'Loneliness', subtitle: 'Find presence in solitude' },
    { id: 'gratitude', emoji: '🌱', title: 'Gratitude', subtitle: 'Remember what holds you' },
    { id: 'belonging', emoji: '💞', title: 'Belonging', subtitle: 'Find your place again' },
    { id: 'healing', emoji: '🌿', title: 'Healing', subtitle: 'Let things be as they are' },
    { id: 'growth', emoji: '☀️', title: 'Growth', subtitle: 'Become who you’re meant to be' },
    { id: 'random', emoji: '✨', title: 'Random Prompt', subtitle: 'Let serendipity guide you' },
];

const PROMPTS: Record<string, string> = {
    loneliness: "When do you feel most alone, even when there are people around?",
    gratitude: "Who has shown you kindness recently?",
    belonging: "When did you last feel truly seen?",
    healing: "What part of you needs gentleness right now?",
    growth: "What small step has changed you recently?",
};

const CLUSTER_CONFIG: Record<string, { pack: string[] }> = {
  Loneliness: { pack: ['Loneliness Pack'] },
  Belonging: { pack: ['Belonging Pack', 'Love & Relationships Pack'] },
  Healing: { pack: ['Acceptance Pack'] },
  Loss: { pack: ['Loss & Mortality Pack'] },
  Growth: { pack: ['Self-Discovery Pack', 'Growth & Transformation Pack'] },
  Gratitude: { pack: ['Gratitude Pack'] },
};

const THEME_TO_PACK_MAP: Record<string, string> = {
    loneliness: 'Loneliness Pack',
    gratitude: 'Gratitude Pack',
    belonging: 'Belonging Pack',
    healing: 'Acceptance Pack',
    growth: 'Growth & Transformation Pack',
    random: 'Self-Discovery Pack', // Fallback category for random prompts
};


const JournalDemo: React.FC<{ onExit: () => void }> = ({ onExit }) => {
    const [phase, setPhase] = useState<Phase>('picking');
    const [activePrompt, setActivePrompt] = useState<Prompt | null>(null);
    const [entryToShare, setEntryToShare] = useState<string | null>(null);
    const { entries } = useJournal();

    const communityCount = useMemo(() => {
        if (!activePrompt) return 0;
        
        const currentPack = activePrompt.category;
        if (!currentPack) return 0;

        let clusterName: string | undefined;
        for (const [name, config] of Object.entries(CLUSTER_CONFIG)) {
            if (config.pack.includes(currentPack)) {
                clusterName = name;
                break;
            }
        }

        if (!clusterName) return 0;

        const relatedEntriesCount = entries.filter(e => {
            let entryCluster: string | undefined;
            for (const [name, config] of Object.entries(CLUSTER_CONFIG)) {
                if (config.pack.includes(e.promptCategory)) {
                    entryCluster = name;
                    break;
                }
            }
            return entryCluster === clusterName && e.isShared;
        }).length;
        
        return relatedEntriesCount;

    }, [activePrompt, entries]);

    const handleSelectTheme = (themeId: string) => {
        let promptToSet: Prompt;
        if (themeId === 'random') {
            promptToSet = ALL_PROMPTS[Math.floor(Math.random() * ALL_PROMPTS.length)];
        } else {
            promptToSet = {
                id: `demo-${themeId}`,
                text: PROMPTS[themeId],
                category: THEME_TO_PACK_MAP[themeId]
            };
        }
        setActivePrompt(promptToSet);
        setPhase('writing');
    };

    const resetFlow = () => {
        setPhase('picking');
        setActivePrompt(null);
        setEntryToShare(null);
    };

    const handleSave = (text: string) => {
        console.log('--- Draft Saved ---', { text });
        // This is where you would save the entry privately.
    };
    
    const handleShare = (text: string) => {
        setEntryToShare(text);
        setPhase('sharing');
    };
    
    const handleConfirmShare = (payload: { text: string, title?: string }) => {
        console.log('--- Shared to Tribe ---', payload);
        // This is where you would save the entry as shared.
        alert("Your reflection has been shared anonymously with the Sonder Tribe.");
        resetFlow();
    };

    return (
        <div className="h-full flex flex-col">
            <header className="flex justify-between items-center mb-4 flex-shrink-0">
                 <div>
                    <h1 className="text-xl font-bold text-green-200">Journaling Demo</h1>
                    <p className="text-gray-400 text-sm">
                        <span className="font-semibold">Test Listening Mode:</span> Type "I feel lonely" or "I need someone to listen".
                    </p>
                 </div>
                <button onClick={onExit} className="px-4 py-2 text-sm bg-white/10 rounded-lg hover:bg-white/20 transition-colors">Exit Demo</button>
            </header>
            <main className="flex-grow">
                {phase === 'picking' && <PromptPicker themes={THEMES} onSelectTheme={handleSelectTheme} />}
                {phase === 'writing' && activePrompt && (
                    <PromptCard
                        prompt={activePrompt.text}
                        onSave={handleSave}
                        onShare={handleShare}
                        onPause={resetFlow}
                        onKeepReflecting={() => {
                            handleSelectTheme('random'); // Switch to a new random prompt
                        }}
                        onSaveDraft={(text) => console.log('--- Autosaving Draft ---', { text })}
                        communityCount={communityCount}
                    />
                )}
                {phase === 'sharing' && entryToShare && (
                    <ShareModal
                        entryText={entryToShare}
                        onShare={handleConfirmShare}
                        onCancel={() => setPhase('writing')}
                    />
                )}
            </main>
        </div>
    );
};

export default JournalDemo;