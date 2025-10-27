
import React, { useState, useEffect } from 'react';
import { Prompt, JournalEntry } from './types';
import Onboarding from './components/Onboarding';
import Home from './components/Home';
import SonderTribe from './components/SonderTribe';
import SonderNotes from './components/MyEntries';
import PromptLibrary from './components/PromptLibrary';
import ChatView from './components/ChatView';
import SonderBotButton from './components/SonderBotButton';
import { ALL_PROMPTS, PROMPT_PACKS } from './constants';
import { useJournal } from './hooks/useJournal';
import { performFullEntryAnalysis, suggestPromptPacks } from './services/geminiService';
import VoiceMemoDemo from './components/VoiceMemoDemo';

type View = 'onboarding' | 'home' | 'sonder_tribe' | 'sonder_notes' | 'prompt_library' | 'session_complete' | 'chat' | 'voice_demo';
type ChatMode = 'chat' | 'listening' | 'start_reflecting';

type SuggestedPack = { title: string; description: string; reason: string; };

const App: React.FC = () => {
  const [view, setView] = useState<View>('home');
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const [userName, setUserName] = useState('');
  
  const [journalingQueue, setJournalingQueue] = useState<Prompt[]>([]);
  const [initialChatMessage, setInitialChatMessage] = useState<string | undefined>(undefined);
  const [initialChatMode, setInitialChatMode] = useState<ChatMode>('chat');
  
  const { entries, addEntry } = useJournal();

  const [suggestedPacks, setSuggestedPacks] = useState<SuggestedPack[] | null>(null);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  
  useEffect(() => {
    const onboardingStatus = localStorage.getItem('sonder_onboarding_complete');
    const storedName = localStorage.getItem('sonder_user_name');
    if (onboardingStatus === 'true' && storedName) {
      setIsOnboardingComplete(true);
      setUserName(storedName);
      setView('home');
    } else {
      setView('onboarding');
    }
  }, []);

  const handleOnboardingComplete = async (name: string, result: { type: 'predefined'; prompt: Prompt } | { type: 'custom'; text: string }) => {
    localStorage.setItem('sonder_user_name', name);
    setUserName(name);
    localStorage.setItem('sonder_onboarding_complete', 'true');
    setIsOnboardingComplete(true);

    if (result.type === 'custom') {
      if (result.text.trim() !== '') {
        try {
          const analysisResult = await performFullEntryAnalysis(result.text);
          const emotionEntry: JournalEntry = {
            id: `emotion-${new Date().toISOString()}`,
            promptId: 'emotion-check-in',
            promptText: 'How are you feeling?',
            promptCategory: 'Check-in',
            text: result.text,
            emotion: analysisResult.emotion,
            themes: analysisResult.themes,
            isShared: false,
            timestamp: Date.now(),
            highlightedPhrases: analysisResult.phrases,
          };
          addEntry(emotionEntry);
        } catch (error) {
          console.error("Failed to process emotion entry:", error);
        }
      }
    }
    
    // After handling onboarding logic, always navigate to the home screen.
    setView('home');
  };


  const handleStartJournaling = (prompts: Prompt | Prompt[], initialMessage?: string) => {
    let queue = Array.isArray(prompts) ? prompts : [prompts];
    if (queue.length === 0) return;

    // If a pack is selected (queue has more than 1 prompt), shuffle and take 5.
    if (Array.isArray(prompts) && prompts.length > 1) {
      const shuffled = [...queue].sort(() => 0.5 - Math.random());
      queue = shuffled.slice(0, 5);
    }

    setJournalingQueue(queue);
    setInitialChatMessage(initialMessage);
    setInitialChatMode('chat');
    setView('chat');
  };
  
  const handleStartReflecting = () => {
      setJournalingQueue([]);
      setInitialChatMessage(undefined);
      setInitialChatMode('start_reflecting');
      setView('chat');
  };

  const handleStartListening = () => {
    setJournalingQueue([]);
    setInitialChatMessage(`This is a quiet space to be heard. I'm listening.`);
    setInitialChatMode('listening');
    setView('chat');
  };

  const handleStartVoiceMemo = () => {
    setView('voice_demo');
  };


  const handleSaveChatEntry = async (entryData: Omit<JournalEntry, 'id' | 'timestamp'>) => {
    try {
        const newEntry: JournalEntry = {
            id: new Date().toISOString(),
            ...entryData,
            timestamp: Date.now(),
        };
        addEntry(newEntry);
    } catch (error) {
        console.error("Failed to process chat entry:", error);
         const fallbackEntry: JournalEntry = {
            id: new Date().toISOString(),
            ...entryData,
            timestamp: Date.now(),
        };
        addEntry(fallbackEntry);
    }
  };
  
  const handleExitJournaling = () => {
    setJournalingQueue([]);
    setView('home');
  };

  const handleSessionComplete = async (lastEntryText: string) => {
    setJournalingQueue([]);
    setIsLoadingSuggestions(true);
    setSuggestedPacks(null);
    setView('session_complete');
    
    const recentEntries = entries.sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);
    const suggestions = await suggestPromptPacks(lastEntryText, recentEntries);
    setSuggestedPacks(suggestions);
    setIsLoadingSuggestions(false);
  };

  const renderView = () => {
    const todayPrompt = ALL_PROMPTS[new Date().getDate() % ALL_PROMPTS.length];
    switch (view) {
      case 'onboarding':
        return <Onboarding onComplete={handleOnboardingComplete} />;
      case 'sonder_tribe':
        return <SonderTribe entries={entries} onNavigate={setView} />;
      case 'sonder_notes':
        return <SonderNotes entries={entries} onNavigate={setView} />;
      case 'prompt_library':
        return <PromptLibrary onNavigate={setView} onSelectPrompt={handleStartJournaling} onSelectPack={handleStartJournaling} />;
      case 'session_complete':
        return <SessionComplete onNavigate={setView} onStartNewSession={handleStartJournaling} suggestedPacks={suggestedPacks} isLoading={isLoadingSuggestions} />;
      case 'voice_demo':
        return <VoiceMemoDemo onExit={() => setView('home')} onSave={addEntry} />;
      case 'chat':
        return (
            <ChatView 
                userName={userName}
                entries={entries}
                onExit={handleExitJournaling}
                prompts={journalingQueue}
                onSave={handleSaveChatEntry}
                onSessionComplete={handleSessionComplete}
                onNavigate={setView}
                initialMessage={initialChatMessage}
                initialMode={initialChatMode}
            />
        );
      case 'home':
      default:
        return <Home onNavigate={setView} onStartJournaling={handleStartJournaling} onStartListening={handleStartListening} onStartReflecting={handleStartReflecting} onStartVoiceMemo={handleStartVoiceMemo} todayPrompt={todayPrompt} userName={userName} />;
    }
  };

  const showSonderBotButton = isOnboardingComplete && view !== 'chat' && view !== 'onboarding' && view !== 'voice_demo';

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
          {showSonderBotButton && <SonderBotButton onClick={() => { setJournalingQueue([]); setInitialChatMessage(undefined); setInitialChatMode('chat'); setView('chat'); }} />}
        </main>
      </div>
    </div>
  );
};

interface SessionCompleteProps {
  onNavigate: (view: 'prompt_library' | 'home') => void;
  onStartNewSession: (prompts: Prompt[]) => void;
  suggestedPacks: SuggestedPack[] | null;
  isLoading: boolean;
}

const SessionComplete: React.FC<SessionCompleteProps> = ({ onNavigate, onStartNewSession, suggestedPacks, isLoading }) => {
  const handleSelectPack = (title: string) => {
    const selectedPack = PROMPT_PACKS.find(p => p.title === title);
    if (!selectedPack) return;

    const newPrompts: Prompt[] = selectedPack.prompts.slice(0, 4).map((promptText, index) => ({
      id: `${selectedPack.title.replace(/\s+/g, '-')}-session-continue-${index}`,
      text: promptText,
      category: selectedPack.title,
    }));
    onStartNewSession(newPrompts);
  };

  return (
    <div className="text-center flex flex-col items-center justify-center h-full animate-fade-in -mt-12">
      <h1 className="text-4xl font-lora text-green-200 mb-4">Your reflection has been saved.</h1>
      
      {isLoading ? (
        <>
            <p className="text-lg text-gray-300 max-w-md mb-12">Finding your next path...</p>
            <div className="w-12 h-12 border-4 border-green-400/20 border-t-green-400 rounded-full animate-spin"></div>
        </>
      ) : (
        <>
          <p className="text-lg text-gray-300 max-w-md mb-12">Based on what you shared, you might find these paths helpful.</p>
          <div className="flex flex-col items-center gap-4 w-full max-w-md">
            {suggestedPacks && suggestedPacks.map(pack => (
              <button
                key={pack.title}
                onClick={() => handleSelectPack(pack.title)}
                className="w-full px-6 py-4 bg-white/5 text-gray-200 rounded-lg font-semibold hover:bg-white/10 transition-all transform hover:scale-105 flex flex-col items-start text-left"
              >
                <span className="text-lg text-green-300">{pack.title}</span>
                <span className="text-sm font-normal mt-1 text-gray-400">{pack.description}</span>
                <span className="text-xs font-normal mt-2 text-green-400/80 italic">"{pack.reason}"</span>
              </button>
            ))}
            <button
              onClick={() => onNavigate('home')}
              className="mt-4 px-6 py-2 bg-transparent text-green-300 rounded-lg font-semibold hover:bg-white/10 transition-all"
            >
              Return Home
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default App;
