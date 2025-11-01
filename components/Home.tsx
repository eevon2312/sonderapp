import React, { useState, useEffect, useRef } from 'react';
import { Prompt } from '../types';
import { useAuth } from '../hooks/useAuth';
import { Typewriter } from './ui/typewriter';

// --- SVG Icons for the new input ---
const MicIcon = () => ( <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-gray-400"><path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.49 6-3.31 6-6.72h-1.7z"/></svg> );

interface Message {
  id: number;
  text: string;
  from: 'user' | 'bot';
  options?: { label: string; action: () => void }[];
}

interface HomeProps {
  onNavigate: (view: 'tribe' | 'entries' | 'prompt_library') => void;
  onStartJournaling: (prompt: Prompt) => void;
  onStartListening: () => void;
  onStartReflecting: () => void;
  onStartVoiceMemo: () => void;
  todayPrompt: Prompt;
  userName: string;
}

const Home: React.FC<HomeProps> = ({ onNavigate, onStartJournaling, onStartListening, onStartReflecting, onStartVoiceMemo, todayPrompt, userName }) => {
  const { logout } = useAuth();
  const date = new Date();
  const formattedDate = date.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSend = () => {
    if (inputValue.trim() === '' || showOptions) return;

    const userMessage: Message = { id: Date.now(), from: 'user', text: inputValue };
    const botMessage: Message = { 
        id: Date.now() + 1,
        from: 'bot', 
        text: 'Would you like to start reflecting, just listen, or record a voice memo?',
        options: [
            { label: 'Start Reflecting', action: onStartReflecting },
            { label: 'Just Listen', action: onStartListening },
            { label: 'Voice Memo', action: onStartVoiceMemo },
        ]
    };
    
    setMessages([userMessage, botMessage]);
    setInputValue('');
    setShowOptions(true);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
    }
  };

  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const inputBar = (
     <div className="w-full max-w-2xl mx-auto">
        <div className="bg-[#1a201d] rounded-2xl p-3 border border-white/10 flex items-end gap-2">
            <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onInput={handleInput}
                placeholder="Message..."
                disabled={showOptions}
                className="w-full bg-transparent focus:outline-none text-gray-200 placeholder-gray-400 resize-none flex-grow max-h-40 overflow-y-auto px-1"
                rows={1}
            />
            <button 
                onClick={handleSend}
                disabled={showOptions || inputValue.trim() === ''}
                className="w-9 h-9 bg-gray-700 rounded-full flex items-center justify-center text-gray-200 disabled:bg-gray-800 disabled:text-gray-500 transition-colors flex-shrink-0"
                aria-label="Send message"
            >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="ml-0.5">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                </svg>
            </button>
        </div>
         <p className="text-gray-400 mt-4 text-center text-sm">
            Or, start with a guided reflection from{' '}
            <button 
                onClick={() => onStartJournaling(todayPrompt)} 
                className="text-green-300 hover:underline font-semibold"
            >
                Today's Prompt
            </button>.
        </p>
    </div>
  );

  return (
    <div className="h-full flex flex-col animate-fade-in">
      <header className="w-full max-w-3xl mx-auto flex flex-col sm:flex-row justify-between items-start mb-8 sm:mb-12">
        <div className="mb-4 sm:mb-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-green-200">Today, {userName}</h1>
          <p className="text-gray-400">{formattedDate}</p>
        </div>
        <div className="flex items-center flex-wrap gap-2">
            <button onClick={() => onNavigate('entries')} className="px-4 py-2 text-sm bg-white/10 rounded-lg hover:bg-white/20 transition-colors">Entries</button>
            <button onClick={() => onNavigate('tribe')} className="px-4 py-2 text-sm bg-white/10 rounded-lg hover:bg-white/20 transition-colors">Tribe</button>
            <button onClick={() => onNavigate('prompt_library')} className="px-4 py-2 text-sm bg-white/10 rounded-lg hover:bg-white/20 transition-colors">Explore Prompts</button>
            <button onClick={logout} className="px-3 py-2 text-sm bg-red-500/10 text-red-300 rounded-lg hover:bg-red-500/20 transition-colors">Logout</button>
        </div>
      </header>
      
      <main className="flex-grow flex flex-col items-center">
        {messages.length === 0 ? (
            <div className="flex-grow flex flex-col justify-center items-center w-full -mt-20">
                <div className="text-center w-full max-w-2xl">
                    <div className="text-4xl sm:text-5xl font-lora text-green-200 mb-8 px-4">
                        <Typewriter
                            text={[
                                "How would you like to begin?",
                                "How would you like to reflect?",
                                "How would you like to feel?",
                            ]}
                            speed={50}
                            waitTime={3000}
                            deleteSpeed={25}
                            loop={true}
                            cursorChar="_"
                            cursorClassName="text-green-200/50"
                        />
                    </div>
                </div>
                <div className="mt-12 w-full">
                    {inputBar}
                </div>
            </div>
        ) : (
            <>
                <div className="w-full max-w-2xl flex-grow overflow-y-auto pr-2 space-y-4">
                  {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-2xl px-4 py-3 rounded-2xl text-left ${msg.from === 'user' ? 'bg-green-500/80 text-gray-900' : 'bg-[#222a26]'}`}>
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                        {msg.options && (
                          <div className="mt-3 flex flex-col gap-2">
                            {msg.options.map((opt, i) => (
                              <button key={i} onClick={opt.action} className="bg-white/10 text-green-200 hover:bg-white/20 text-sm px-3 py-2 rounded-lg text-left transition-colors">
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
                <div className="w-full max-w-2xl mt-auto mb-6 pt-4">
                    {inputBar}
                </div>
            </>
        )}
      </main>
    </div>
  );
};

export default Home;