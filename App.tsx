import React, { useState, useEffect } from 'react';
import { Prompt, JournalEntry } from './types';
import Onboarding from './components/Onboarding';
import Home from './components/Home';
import JournalView from './components/JournalView';
import MindmapView from './components/MindmapView';
import MyEntries from './components/MyEntries';
import PromptLibrary from './components/PromptLibrary';
import { ALL_PROMPTS } from './constants';
import { useJournal } from './hooks/useJournal';

type View = 'onboarding' | 'home' | 'journal' | 'mindmap' | 'my_entries' | 'prompt_library';

const App: React.FC = () => {
  const [view, setView] = useState<View>('home');
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  
  const [journalingQueue, setJournalingQueue] = useState<Prompt[]>([]);
  const [currentJournalIndex, setCurrentJournalIndex] = useState(0);

  const { entries, addEntry } = useJournal();
  
  useEffect(() => {
    const onboardingStatus = localStorage.getItem('sonder_onboarding_complete');
    if (onboardingStatus === 'true') {
      setIsOnboardingComplete(true);
      setView('home');
    } else {
      setView('onboarding');
    }
  }, []);

  const handleOnboardingComplete = () => {
    localStorage.setItem('sonder_onboarding_complete', 'true');
    setIsOnboardingComplete(true);
    setView('home');
  };

  const handleStartJournaling = (prompts: Prompt | Prompt[]) => {
    const queue = Array.isArray(prompts) ? prompts : [prompts];
    if (queue.length === 0) return;
    setJournalingQueue(queue);
    setCurrentJournalIndex(0);
    setView('journal');
  };

  const handleSaveEntry = (entry: JournalEntry) => {
    addEntry(entry);
    
    if (currentJournalIndex < journalingQueue.length - 1) {
      setCurrentJournalIndex(prevIndex => prevIndex + 1);
    } else {
      setJournalingQueue([]);
      setCurrentJournalIndex(0);
      setView('home');
    }
  };
  
  const handleExitJournaling = () => {
    setJournalingQueue([]);
    setCurrentJournalIndex(0);
    setView('home');
  };


  const renderView = () => {
    const todayPrompt = ALL_PROMPTS[new Date().getDate() % ALL_PROMPTS.length];
    switch (view) {
      case 'onboarding':
        return <Onboarding onComplete={handleOnboardingComplete} />;
      case 'journal': {
        const currentPrompt = journalingQueue[currentJournalIndex];
        if (!currentPrompt) {
          return <Home onNavigate={setView} onStartJournaling={handleStartJournaling} todayPrompt={todayPrompt} />;
        }
        return (
          <JournalView 
            prompt={currentPrompt} 
            onSave={handleSaveEntry} 
            onExit={handleExitJournaling}
            queuePosition={{ current: currentJournalIndex + 1, total: journalingQueue.length }}
          />
        );
      }
      case 'mindmap':
        return <MindmapView onNavigate={setView} />;
      case 'my_entries':
        return <MyEntries entries={entries} onNavigate={setView} />;
      case 'prompt_library':
        return <PromptLibrary onNavigate={setView} onSelectPrompt={handleStartJournaling} onSelectPack={handleStartJournaling} />;
      case 'home':
      default:
        return <Home onNavigate={setView} onStartJournaling={handleStartJournaling} todayPrompt={todayPrompt} />;
    }
  };

  return (
    <div className="bg-[#1a201d] min-h-screen w-full flex items-center justify-center p-4 text-[#e0e0e0] font-sans antialiased">
      <div className="w-full max-w-4xl h-[90vh] max-h-[700px] bg-[#2a332d] rounded-2xl shadow-2xl shadow-black/30 flex flex-col overflow-hidden">
        {/* Window Header */}
        <header className="flex items-center justify-between p-3 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-red-500 rounded-full"></span>
            <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
            <span className="w-3 h-3 bg-green-500 rounded-full"></span>
          </div>
          <div className="text-sm text-gray-400">Sonder</div>
          <div className="w-16"></div> {/* Spacer */}
        </header>

        {/* Main Content */}
        <main className="flex-grow p-6 overflow-y-auto relative">
          {renderView()}
        </main>
      </div>
    </div>
  );
};

export default App;