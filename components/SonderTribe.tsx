

import React, { useState, useMemo } from 'react';
import { JournalEntry } from '../types';
import { Typewriter } from './ui/typewriter';

// Constants for design, mapping themes to gradient colors and prompt packs
const CLUSTER_CONFIG = {
  Loneliness: { gradient: 'from-[#314755] to-[#26a0da]', pack: ['Loneliness Pack'] },
  Belonging: { gradient: 'from-[#FAD0C4] to-[#FFD1FF]', pack: ['Belonging Pack', 'Love & Relationships Pack'] },
  Healing: { gradient: 'from-[#76b852] to-[#8DC26F]', pack: ['Acceptance Pack'] },
  Loss: { gradient: 'from-[#757F9A] to-[#D7DDE8]', pack: ['Loss & Mortality Pack'] },
  Growth: { gradient: 'from-[#FBD786] to-[#f7797d]', pack: ['Self-Discovery Pack', 'Growth & Transformation Pack'] },
  Gratitude: { gradient: 'from-[#5ee7df] to-[#b490ca]', pack: ['Gratitude Pack'] },
};

type ClusterName = keyof typeof CLUSTER_CONFIG;

// A simple, stateful component for reaction buttons
const Reaction = ({ icon, label }: { icon: string; label: string }) => {
    const [isClicked, setIsClicked] = useState(false);
    return (
        <button
            onClick={() => setIsClicked(!isClicked)}
            className={`flex items-center gap-1.5 text-sm rounded-full px-3 py-1.5 transition-all duration-300 ${isClicked ? 'bg-white/20 text-green-200' : 'bg-transparent text-gray-400 hover:bg-white/10'}`}
        >
            <span>{icon}</span>
            <span>{label}</span>
        </button>
    );
};

// Card component for displaying a single anonymous reflection
// FIX: Changed component to React.FC to correctly handle the 'key' prop.
const ReflectionCard: React.FC<{ entry: JournalEntry }> = ({ entry }) => (
    <div className="bg-[#222a26] border border-white/10 p-6 rounded-2xl w-full max-w-xl mx-auto animate-fade-in">
        <h3 className="font-lora text-lg text-green-200 mb-3">{`"${entry.promptText}"`}</h3>
        <p className="text-[#A8BFA8] leading-relaxed line-clamp-3 mb-4">
            {entry.text}
        </p>
        <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
                <Reaction icon="🤍" label="Relate" />
                <Reaction icon="🌿" label="Comfort" />
                <Reaction icon="🕯️" label="Moved" />
            </div>
            <span className="text-xs text-gray-500 italic">212 felt this too</span>
        </div>
    </div>
);

// View for displaying the feed of reflections within a specific cluster
const ClusterFeed = ({ clusterName, entries, onBack }: { clusterName: ClusterName, entries: JournalEntry[], onBack: () => void }) => (
    <div className="h-full flex flex-col animate-fade-in">
        <header className="w-full flex flex-col items-start gap-4 sm:flex-row sm:justify-between sm:items-center mb-6 flex-shrink-0">
            <div>
                <h1 className="text-3xl font-lora text-green-100">{clusterName}</h1>
                <p className="text-gray-400 mt-1">{`${entries.length} reflections shared here. You’re part of this tribe.`}</p>
            </div>
            <button onClick={onBack} className="px-4 py-2 text-sm bg-white/10 rounded-lg hover:bg-white/20 transition-colors">← Back to Tribes</button>
        </header>
        <div className="flex-grow overflow-y-auto pr-2 space-y-4">
            {entries.map(entry => (
                <ReflectionCard key={entry.id} entry={entry} />
            ))}
        </div>
    </div>
);

// Main SonderTribe component that manages views
const Tribe: React.FC<{ entries: JournalEntry[]; onNavigate: (view: 'home') => void; }> = ({ entries, onNavigate }) => {
    const [selectedCluster, setSelectedCluster] = useState<ClusterName | null>(null);

    const tribeData = useMemo(() => {
        const data: Record<ClusterName, JournalEntry[]> = {
            Loneliness: [], Belonging: [], Healing: [], Loss: [], Growth: [], Gratitude: []
        };
        const sharedEntries = entries.filter(e => e.isShared);

        sharedEntries.forEach(entry => {
            for (const [clusterName, config] of Object.entries(CLUSTER_CONFIG)) {
                if (config.pack.includes(entry.promptCategory)) {
                    data[clusterName as ClusterName].push(entry);
                    break;
                }
            }
        });
        return data;
    }, [entries]);
    
    // Render the feed view if a cluster is selected
    if (selectedCluster) {
        return <ClusterFeed clusterName={selectedCluster} entries={tribeData[selectedCluster]} onBack={() => setSelectedCluster(null)} />;
    }

    // Render the main grid of emotion orbs
    return (
        <div className="h-full flex flex-col animate-fade-in">
            <header className="w-full flex flex-col items-start gap-4 sm:flex-row sm:justify-between sm:items-center mb-8 flex-shrink-0">
                <div>
                    <h1 className="text-3xl font-lora text-green-100">Tribe</h1>
                    <div className="h-6 mt-1">
                      <Typewriter
                        text={[
                          "Quiet reflections shared by others.",
                          "You are not alone in this feeling.",
                          "Read softly, with an open heart.",
                          "Your story is safe here."
                        ]}
                        speed={50}
                        waitTime={3000}
                        deleteSpeed={25}
                        loop={true}
                        className="text-gray-400"
                        cursorChar="_"
                        cursorClassName="text-gray-400"
                      />
                    </div>
                </div>
                 <button onClick={() => onNavigate('home')} className="px-4 py-2 text-sm bg-white/10 rounded-lg hover:bg-white/20 transition-colors">Home</button>
            </header>
            <main className="flex-grow flex items-center justify-center">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
                    {Object.entries(tribeData).map(([name, clusterEntries]) => {
                        const clusterName = name as ClusterName;
                        // FIX: Cast clusterEntries to an array to access its length property.
                        const count = (clusterEntries as JournalEntry[]).length;
                        if (count === 0) return null; // Don't show empty clusters
                        
                        return (
                            <button
                                key={clusterName}
                                onClick={() => setSelectedCluster(clusterName)}
                                className={`relative group w-36 h-36 md:w-48 md:h-48 rounded-full flex flex-col items-center justify-center text-center p-4 bg-gradient-to-br ${CLUSTER_CONFIG[clusterName].gradient} transition-all duration-400 transform hover:scale-105 shadow-lg hover:shadow-2xl hover:shadow-black/50`}
                            >
                                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-400 rounded-full"></div>
                                <div className="relative text-white">
                                    <h2 className="text-xl md:text-2xl font-lora">{clusterName}</h2>
                                    <p className="text-xs md:text-sm opacity-80 mt-1">{count} Reflections</p>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </main>
             {/* FIX: Explicitly type 'arr' to resolve issues with type inference on Object.values. */}
             {Object.values(tribeData).every((arr: JournalEntry[]) => arr.length === 0) && (
                <div className="text-center text-gray-400 flex-grow flex flex-col justify-center items-center">
                    <p className="text-xl font-lora">The Tribe is gathering...</p>
                    <p className="mt-2">No reflections have been shared yet. Yours could be the first spark.</p>
                </div>
            )}
        </div>
    );
};

export default Tribe;