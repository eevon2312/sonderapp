import React, { useState, useEffect } from 'react';
import { Prompt, JournalEntry } from './types';
import Onboarding from './components/Onboarding';
import Home from './components/Home';
import Tribe from './components/SonderTribe';
import Entries from './components/MyEntries';
import PromptLibrary from './components/PromptLibrary';
import ChatView from './components/ChatView';
import SonderBotButton from './components/SonderBotButton';
import Login from './components/Login';
import SignUp from './components/SignUp';
import { ALL_PROMPTS, PROMPT_PACKS } from './constants';
import { useJournal } from './hooks/useJournal';
import { useAuth } from './hooks/useAuth';
import { performFullEntryAnalysis, suggestPromptPacks } from './services/geminiService';
import VoiceMemoDemo from './components/VoiceMemoDemo';

type View = 'onboarding' | 'home' | 'tribe' | 'entries' | 'prompt_library' | 'session_complete' | 'chat' | 'voice_demo' | 'auth';
type AuthView = 'login' | 'signup';
type ChatMode = 'chat' | 'listening' | 'start_reflecting';

type SuggestedPack = { title: string; description: string; reason: string; };

const App: React.FC = () => {
  const { user, completeOnboarding } = useAuth();
  const [view, setView] = useState<View>('home');
  const [authView, setAuthView] = useState<AuthView>('login');
  
  const [journalingQueue, setJournalingQueue] = useState<Prompt[]>([]);
  const [initialChatMessage, setInitialChatMessage] = useState<string | undefined>(undefined);
  const [initialChatMode, setInitialChatMode] = useState<ChatMode>('chat');
  
  const { entries, addEntry } = useJournal();

  const [suggestedPacks, setSuggestedPacks] = useState<SuggestedPack[] | null>(null);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  
  useEffect(() => {
    if (!user) {
      setView('auth');
    } else if (!user.onboardingComplete) {
      setView('onboarding');
    } else {
      // If user is logged in and onboarded, default to home.
      // This handles the transition from login/onboarding to the main app.
      if (view === 'auth' || view === 'onboarding') {
        setView('home');
      }
    }
  }, [user, view]);

  const handleOnboardingComplete = async (name: string, result: { type: 'predefined'; prompt: Prompt } | { type: 'custom'; text: string }) => {
    if (result.type === 'custom' && result.text.trim() !== '') {
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
    
    // Update user's onboarding status via auth context
    await completeOnboarding();
    setView('home');
  };


  const handleStartJournaling = (prompts: Prompt | Prompt[], initialMessage?: string) => {
    let queue = Array.isArray(prompts) ? prompts : [prompts];
    if (queue.length === 0) return;

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

  const handleSessionComplete = async (lastEntryText: string, options: { showSuggestions?: boolean } = { showSuggestions: true }) => {
    setJournalingQueue([]);
    setView('session_complete');

    if (options.showSuggestions) {
        setIsLoadingSuggestions(true);
        setSuggestedPacks(null);
        const recentEntries = entries.sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);
        const suggestions = await suggestPromptPacks(lastEntryText, recentEntries);
        setSuggestedPacks(suggestions);
        setIsLoadingSuggestions(false);
    } else {
        setIsLoadingSuggestions(false);
        setSuggestedPacks(null);
    }
  };

  const handleExit = () => {
    // Navigate back to home from any view except onboarding or home itself.
    if (view !== 'home' && view !== 'onboarding') {
      setView('home');
    }
  };

  const renderView = () => {
    if (!user) {
        if (authView === 'login') {
            return <Login onSwitchToSignUp={() => setAuthView('signup')} />;
        }
        return <SignUp onSwitchToLogin={() => setAuthView('login')} />;
    }
    
    const todayPrompt = ALL_PROMPTS[new Date().getDate() % ALL_PROMPTS.length];
    
    switch (view) {
      case 'onboarding':
        return <Onboarding onComplete={handleOnboardingComplete} userName={user.name}/>;
      case 'tribe':
        return <Tribe entries={entries} onNavigate={setView} />;
      case 'entries':
        return <Entries entries={entries} onNavigate={setView} />;
      case 'prompt_library':
        return <PromptLibrary onNavigate={setView} onSelectPrompt={handleStartJournaling} onSelectPack={handleStartJournaling} />;
      case 'session_complete':
        return <SessionComplete onNavigate={setView} onStartNewSession={handleStartJournaling} suggestedPacks={suggestedPacks} isLoading={isLoadingSuggestions} />;
      case 'voice_demo':
        return <VoiceMemoDemo onExit={() => setView('home')} onSave={addEntry} />;
      case 'chat':
        return (
            <ChatView 
                userName={user.name}
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
        return <Home onNavigate={setView} onStartJournaling={handleStartJournaling} onStartListening={handleStartListening} onStartReflecting={handleStartReflecting} onStartVoiceMemo={handleStartVoiceMemo} todayPrompt={todayPrompt} userName={user.name} />;
    }
  };

  const showSonderBotButton = user && user.onboardingComplete && view !== 'home' && view !== 'chat' && view !== 'onboarding' && view !== 'voice_demo';

  return (
    <div className="bg-[#1a201d] min-h-screen w-full flex items-center justify-center sm:p-4 text-[#e0e0e0] font-sans antialiased">
      <div className="w-full h-screen sm:h-[90vh] sm:max-h-[700px] sm:max-w-4xl bg-[#2a332d] sm:rounded-2xl shadow-2xl shadow-black/30 flex flex-col overflow-hidden">
        {/* Window Header */}
        <header className="grid grid-cols-3 items-center p-3 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={handleExit}
              className="w-4 h-4 sm:w-3 sm:h-3 bg-red-500 rounded-full transition-colors hover:bg-red-600 focus:outline-none"
              aria-label="Close view and return to home"
            ></button>
            <span className="w-3 h-3 bg-yellow-500 rounded-full hidden sm:block"></span>
            <span className="w-3 h-3 bg-green-500 rounded-full hidden sm:block"></span>
          </div>
          <div className="text-sm text-gray-400 text-center">Sonder</div>
          <div /> {/* Spacer for grid */}
        </header>

        {/* Main Content */}
        <main className="flex-grow p-4 sm:p-6 overflow-y-auto relative">
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
      {isLoading ? (
        <>
            <p className="text-lg text-gray-300 max-w-md mb-12">Finding your next path...</p>
            <div className="w-12 h-12 border-4 border-green-400/20 border-t-green-400 rounded-full animate-spin"></div>
        </>
      ) : (
        <>
          {suggestedPacks ? (
            <>
              <h1 className="text-4xl font-lora text-green-200 mb-4">Your reflection has been saved.</h1>
              <p className="text-lg text-gray-300 max-w-md mb-12">Based on what you shared, you might find these paths helpful.</p>
              <div className="flex flex-col items-center gap-4 w-full max-w-md">
                {suggestedPacks.map(pack => (
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
          ) : (
             <>
                <h1 className="text-4xl font-lora text-green-200 mb-4">Your mind is a garden.</h1>
                <p className="text-lg text-gray-300 max-w-md mb-12">Thank you for tending to it. Your thoughts are safe here.</p>
                <button
                    onClick={() => onNavigate('home')}
                    className="mt-4 px-8 py-3 bg-green-400/20 text-green-200 rounded-lg hover:bg-green-400/30 transition-colors"
                >
                    Return Home
                </button>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default App;