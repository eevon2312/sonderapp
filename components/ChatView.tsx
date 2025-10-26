
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { FullAnalysisResult, performFullEntryAnalysis, generateListeningResponse } from '../services/geminiService';
import { useLiveConversation } from '../hooks/useLiveConversation';
import { Prompt, JournalEntry } from '../types';
import { ALL_PROMPTS, PROMPT_PACKS } from '../constants';
import ListeningOverlay from './ui/ListeningOverlay';

type View = 'onboarding' | 'home' | 'sonder_tribe' | 'sonder_notes' | 'prompt_library' | 'session_complete' | 'chat' | 'typewriter_demo';

type Step =
  | 'PROMPT_SELECTION'
  | 'START_REFLECTING'
  | 'PACK_SELECTION'
  | 'WRITING'
  | 'LISTENING'
  | 'POST_LISTENING'
  | 'POST_REFLECTION'
  | 'SHARE_MODAL'
  | 'CLOSING'
  | 'SAFETY_HALT';


// FIX: Added a trailing comma to the generic type parameter <T> to disambiguate it from a JSX tag in a .tsx file. This resolves a major parsing error.
const getRandomItem = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const GENTLE_ENCOURAGEMENT = [
    "Take your time — this space is yours.",
    "No need to rush or be perfect.",
    "Write what comes to mind...",
];

const POST_REFLECTION_VALIDATION = [
    "That must feel like a lot to carry.",
    "I see what you mean.",
    "You make sense.",
    "Take your time — you’re doing beautifully.",
];

const LISTENING_MODE_VALIDATION = [
    "I hear you. You don’t have to explain — this space is here for you.",
    "That sounds really heavy. Loneliness can feel endless, but you’re not alone right now.",
    "I’m here. Take all the space you need. You can write, breathe, or just sit for a moment.",
];


const SELF_HARM_KEYWORDS = ["kill myself", "suicide", "want to die", "self harm", "self-harm", "ending my life"];


// Copied from SonderTribe.tsx to determine community context
const CLUSTER_CONFIG: Record<string, { pack: string[] }> = {
  Loneliness: { pack: ['Loneliness Pack'] },
  Belonging: { pack: ['Belonging Pack', 'Love & Relationships Pack'] },
  Healing: { pack: ['Acceptance Pack'] },
  Loss: { pack: ['Loss & Mortality Pack'] },
  Growth: { pack: ['Self-Discovery Pack', 'Growth & Transformation Pack'] },
  Gratitude: { pack: ['Gratitude Pack'] },
};


interface ConversationState {
  step: Step;
  currentPrompt: Prompt | null;
}

interface ChatViewProps {
  userName: string;
  onExit: () => void;
  entries: JournalEntry[];
  prompts?: Prompt[];
  onSave?: (entryData: Omit<JournalEntry, 'id' | 'timestamp'>) => Promise<void>;
  onNavigate: (view: 'sonder_tribe' | 'prompt_library' | 'home') => void;
  onSessionComplete: (lastEntryText: string) => void;
  initialMode?: 'chat' | 'listening' | 'start_reflecting';
  initialMessage?: string;
}

interface Message {
  role: 'user' | 'model';
  text: string;
}

interface ActionButtonProps {
  label: string;
  action: string;
  payload?: any;
  style?: 'primary' | 'secondary';
  emoji?: string;
  isFullWidth?: boolean;
}

const SAFETY_RESOURCES = [
  { name: 'Crisis Text Line', text: 'Text HOME to 741741' },
  { name: 'National Suicide Prevention Lifeline', text: 'Call 988' },
];

const MicIcon = ({ className = '' }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.49 6-3.31 6-6.72h-1.7z"/></svg> );
const SendIcon = ({ className = '' }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>);


const INITIAL_PROMPTS: (ActionButtonProps & { prompt: Prompt })[] = [
    { label: "Gratitude", emoji: "🌱", action: "select_prompt", style: "secondary", payload: { id: "initial-gratitude" }, prompt: { id: "initial-gratitude", text: "What’s something small you’re grateful for today?", category: "Gratitude" } },
    { label: "Connection", emoji: "💞", action: "select_prompt", style: "secondary", payload: { id: "initial-connection" }, prompt: { id: "initial-connection", text: "When did you last feel understood?", category: "Connection" } },
    { label: "Loneliness", emoji: "🌧️", action: "select_prompt", style: "secondary", payload: { id: "initial-loneliness" }, prompt: { id: "initial-loneliness", text: "What does being alone feel like for you?", category: "Loneliness" } },
    { label: "Healing", emoji: "🌿", action: "select_prompt", style: "secondary", payload: { id: "initial-healing" }, prompt: { id: "initial-healing", text: "What are you ready to let go of?", category: "Healing" } },
    { label: "Growth", emoji: "☀️", action: "select_prompt", style: "secondary", payload: { id: "initial-growth" }, prompt: { id: "initial-growth", text: "What part of you is becoming stronger?", category: "Growth" } },
    { label: "Random Prompt", emoji: "✨", action: "select_prompt", style: "secondary", payload: { id: "initial-random" }, prompt: { id: "initial-random", text: "Let serendipity guide you.", category: "Random" } },
];


interface ShareModalProps {
    onCancel: () => void;
    onShare: (title?: string) => void;
    entryText: string;
}

const ShareModal: React.FC<ShareModalProps> = ({ onCancel, onShare, entryText }) => {
    const [title, setTitle] = useState('');
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const modalNode = modalRef.current;
        if (!modalNode) return;

        const focusableElements = modalNode.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        firstElement?.focus();

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key !== 'Tab') return;

            if (event.shiftKey) { 
                if (document.activeElement === firstElement) {
                    lastElement.focus();
                    event.preventDefault();
                }
            } else { 
                if (document.activeElement === lastElement) {
                    firstElement.focus();
                    event.preventDefault();
                }
            }
        };
        
        modalNode.addEventListener('keydown', handleKeyDown, true);

        return () => {
            modalNode.removeEventListener('keydown', handleKeyDown, true);
        };
    }, []);

    return (
        <div ref={modalRef} className="absolute inset-0 bg-black/70 flex items-center justify-center z-50 animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="share-modal-title">
            <div className="bg-[#2a332d] p-6 rounded-lg shadow-xl max-w-md w-full mx-4 border border-white/10">
                <h2 id="share-modal-title" className="text-xl font-bold text-green-200 mb-2">Add this to the Tribe — anonymous and safe.</h2>
                <ul className="text-gray-300 mb-4 text-sm space-y-1 pl-1">
                    <li>• Your name won’t appear.</li>
                    <li>• You can add a short title if you’d like.</li>
                </ul>
                <div className="mb-4">
                    <label htmlFor="share-title" className="block text-sm font-medium text-gray-400 mb-1">Optional Title</label>
                    <input
                        id="share-title"
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        maxLength={100}
                        placeholder="e.g., A moment of clarity"
                        className="w-full bg-[#222a26] rounded-md p-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-400/50"
                    />
                </div>
                <blockquote className="border-l-2 border-green-400/50 pl-3 text-gray-400 italic bg-black/10 p-2 rounded-r-lg mb-6 text-sm line-clamp-3">
                    {entryText}
                </blockquote>
                <div className="flex justify-end gap-3">
                    <button onClick={onCancel} className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors text-gray-300">
                        Cancel
                    </button>
                    <button onClick={() => onShare(title)} className="px-4 py-2 bg-green-500 text-gray-900 rounded-lg font-semibold hover:bg-green-400">
                        Share Anonymously
                    </button>
                </div>
            </div>
        </div>
    );
};

const ActionButtons: React.FC<{ buttons: ActionButtonProps[]; onButtonClick: (action: string, payload?: any) => void }> = React.memo(({ buttons, onButtonClick }) => (
    <div className="grid grid-cols-2 gap-3 my-2 animate-fade-in max-w-md mx-auto">
        {buttons.map(btn => (
            <button
                key={btn.label}
                onClick={() => onButtonClick(btn.action, btn.payload)}
                className={`px-4 py-3 text-sm rounded-lg transition-colors text-left flex items-center gap-3 ${
                    btn.style === 'primary' 
                    ? 'bg-green-500/80 text-gray-900 hover:bg-green-400 font-semibold' 
                    : 'bg-white/5 hover:bg-white/10 text-green-200'
                } ${btn.isFullWidth ? 'col-span-2 justify-center' : ''}`}
            >
                {btn.emoji && <span className="text-lg">{btn.emoji}</span>}
                <span>{btn.label}</span>
            </button>
        ))}
    </div>
));


const ChatView: React.FC<ChatViewProps> = ({ userName, onExit, entries, prompts, onSave, onNavigate, onSessionComplete, initialMode = 'chat', initialMessage }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [journalInput, setJournalInput] = useState('');
    const [lastSubmittedEntryText, setLastSubmittedEntryText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [conversationState, setConversationState] = useState<ConversationState | null>(null);
    const [lastAnalysisResult, setLastAnalysisResult] = useState<FullAnalysisResult | null>(null);
    const [turnCount, setTurnCount] = useState(0);

    const [promptQueue, setPromptQueue] = useState<Prompt[]>([]);
    const [currentPromptIndex, setCurrentPromptIndex] = useState(0);

    const [liveUserTranscript, setLiveUserTranscript] = useState('');
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleSafetyHalt = useCallback(() => {
        setMessages(prev => [...prev, {
            role: 'model',
            text: "I’m sorry you’re feeling this way. If you’re in danger or thinking about harming yourself, please contact local emergency services or a crisis line now."
        }]);
        setConversationState(prev => prev ? { ...prev, step: 'SAFETY_HALT' } : null);
    }, []);

    useEffect(() => {
        if (conversationState?.step !== 'SAFETY_HALT') {
            const textLower = journalInput.toLowerCase();
            const isSafetyTriggered = SELF_HARM_KEYWORDS.some(keyword => textLower.includes(keyword));
            if (isSafetyTriggered) {
                handleSafetyHalt();
            }
        }
    }, [journalInput, conversationState?.step, handleSafetyHalt]);


    useEffect(() => {
        if (initialMode === 'start_reflecting') {
            const greetings = [
                `Hey ${userName}, good to see you again. How are you feeling today?`,
                `Welcome back, ${userName} — what kind of space do you need right now?`,
                `Hi ${userName}, take a breath. What would you like this reflection to be about?`,
                `I’m here with you, ${userName}. What’s been sitting on your mind lately?`,
            ];
            setMessages([{ role: 'model', text: getRandomItem(greetings) }]);
            setConversationState({
                step: 'START_REFLECTING',
                currentPrompt: { id: 'check-in', text: 'Let me know what is on your mind.', category: 'Check-in' },
            });
            return;
        }

        if (initialMode === 'listening') {
            setMessages([
                { role: 'model', text: `Hi ${userName}, you can use this space however you need to. I’m here — no judgment, no rush.` },
                { role: 'model', text: "What’s been on your heart lately?" }
            ]);
            setConversationState({
                step: 'LISTENING',
                currentPrompt: { id: 'listening-mode', text: 'Listening Session', category: 'Listening' },
            });
            return;
        }
        
        if (prompts && prompts.length > 0) {
            setPromptQueue(prompts);
            setCurrentPromptIndex(0);
            const firstPrompt = prompts[0];
            setMessages([
                { role: 'model', text: initialMessage || `Welcome back, ${userName}. Let's reflect on the ${firstPrompt.category}.` },
                { role: 'model', text: `Here's the first thought (${1}/${prompts.length}).` },
                { role: 'model', text: firstPrompt.text }
            ]);
            setConversationState({
                step: 'WRITING',
                currentPrompt: firstPrompt,
            });
        } else {
            setMessages([{ role: 'model', text: initialMessage || `Welcome, ${userName}. Take a quiet moment for yourself.` }]);
            setConversationState({
                step: 'PROMPT_SELECTION',
                currentPrompt: null,
            });
        }
    }, [prompts, userName, initialMode, initialMessage]);

    useEffect(() => {
        const { currentPrompt, step } = conversationState ?? {};
        if ((step === 'WRITING' || step === 'START_REFLECTING') && currentPrompt) {
            const lastMessage = messages[messages.length - 1];
            if (lastMessage?.text !== currentPrompt.text) {
                if(step === 'WRITING') {
                     setMessages(prev => [...prev, { role: 'model', text: currentPrompt.text }]);
                }
            }
        }
    }, [conversationState?.currentPrompt, conversationState?.step]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
    useEffect(scrollToBottom, [messages, conversationState]);
    
    const handleSaveEntry = useCallback(async (
        text: string,
        isShared: boolean,
        title?: string,
        analysisResult?: FullAnalysisResult | null
    ) => {
        if (!conversationState || !onSave || !conversationState.currentPrompt) return;
        
        const analysisToUse = analysisResult || await performFullEntryAnalysis(text);

        const finalText = title && title.trim() !== '' ? `**${title.trim()}**\n\n${text}` : text;
        
        await onSave({
            promptId: conversationState.currentPrompt.id,
            promptText: conversationState.currentPrompt.text,
            promptCategory: conversationState.currentPrompt.category,
            text: finalText,
            isShared,
            emotion: analysisToUse.emotion,
            themes: analysisToUse.themes,
            highlightedPhrases: analysisToUse.phrases,
        });
        
        return analysisToUse;
    }, [conversationState, onSave]);

    const handleJournalSubmit = useCallback(async (text: string) => {
        if (text.trim() === '' || !conversationState) return;

        if (conversationState.step === 'LISTENING') {
            setIsLoading(true);
            setJournalInput('');
            const currentTurn = turnCount + 1;
            setTurnCount(currentTurn);
            const newMessages: Message[] = [...messages, { role: 'user', text }];
            setMessages(newMessages);

            try {
                const history = newMessages.slice(-5); // Pass last 5 messages for context
                const result = await generateListeningResponse(text, currentTurn, history);
                
                if (result.isSensitive) {
                    handleSafetyHalt();
                    setIsLoading(false);
                    return;
                }

                setMessages(prev => [...prev, { role: 'model', text: result.empatheticResponse }]);

                if (result.userWantsToEnd) {
                    setMessages(prev => [...prev, { role: 'model', text: "You can always come back here when you need to be heard again." }]);
                    setConversationState(prev => ({...prev!, step: 'POST_LISTENING'}));
                }

            } catch (e) {
                console.error("Error in listening mode:", e);
                setMessages(prev => [...prev, { role: 'model', text: "I'm here. Take your time." }]);
            } finally {
                setIsLoading(false);
            }
            return;
        }


        if (conversationState.step === 'START_REFLECTING') {
            setIsLoading(true);
            setJournalInput('');
            setMessages(prev => [...prev, { role: 'user', text }]);

            await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400));

            const textLower = text.toLowerCase();
            if (["listen", "just listen", "don't need advice", "hear me"].some(k => textLower.includes(k))) {
                setMessages(prev => [...prev, { role: 'model', text: getRandomItem(LISTENING_MODE_VALIDATION) }]);
                setConversationState(prev => ({ ...prev!, step: 'LISTENING' }));
                setIsLoading(false);
                return;
            }

            const keywordMap: { [packTitle: string]: string[] } = {
                'Loneliness Pack': ['lonely', 'alone'],
                'Gratitude Pack': ['grateful', 'thankful'],
                'Acceptance Pack': ['sad', 'hurting', 'breakup'],
                'Loss & Mortality Pack': ['loss', 'grief'],
                'Belonging Pack': ['disconnected', 'unseen'],
                'Growth & Transformation Pack': ['stuck', 'directionless', 'growth'],
                'Self-Discovery Pack': ['curious', 'unsure', 'self-aware', 'journaling', 'confused', 'tired'],
            };

            let detectedPack: string | null = null;
            for (const [pack, keywords] of Object.entries(keywordMap)) {
                if (keywords.some(k => textLower.includes(k))) {
                    detectedPack = pack;
                    break;
                }
            }
            
            let botMessage = "Thank you for sharing that. Maybe one of these feels right to start with?";
            if (detectedPack) {
                const packInfo = PROMPT_PACKS.find(p => p.title === detectedPack);
                if (packInfo) {
                    botMessage = `That makes sense. It sounds like you're exploring a feeling of ${packInfo.shortTitle.toLowerCase()}. Maybe one of these paths feels right to start with?`;
                }
            }

            setMessages(prev => [...prev, { role: 'model', text: botMessage }]);
            setConversationState(prev => ({ ...prev!, step: 'PACK_SELECTION' }));
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setJournalInput('');
        setMessages(prev => [...prev, { role: 'user', text }]);
        
        try {
            const analysisResult = await performFullEntryAnalysis(text);
            
            if (analysisResult.isSensitive) {
                handleSafetyHalt();
                setIsLoading(false);
                return;
            }

            if (analysisResult.wantsToJustBeHeard) {
                setLastSubmittedEntryText(text);
                setLastAnalysisResult(analysisResult);
                
                setMessages(prev => [
                    ...prev,
                    { role: 'model', text: getRandomItem(LISTENING_MODE_VALIDATION) },
                ]);
                setConversationState(prev => ({ ...prev!, step: 'LISTENING' }));
                setIsLoading(false);
                return;
            }
            
            setLastSubmittedEntryText(text);
            setLastAnalysisResult(analysisResult);
            
            let communityContextMessage = '';
            const currentCategory = conversationState?.currentPrompt?.category;
            if (currentCategory) {
                let clusterName: string | undefined;
                for (const [name, config] of Object.entries(CLUSTER_CONFIG)) {
                    if (config.pack.includes(currentCategory)) {
                        clusterName = name;
                        break;
                    }
                }

                if (clusterName) {
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
                    
                    if (relatedEntriesCount > 5) {
                        const roundedCount = Math.max(10, Math.round(relatedEntriesCount / 10) * 10);
                        communityContextMessage = `You're not alone — about ${roundedCount} others have reflected on this feeling recently.`;
                    }
                }
            }

            const validationMessage = getRandomItem(POST_REFLECTION_VALIDATION);
            const followUpMessage = "What would you like to do next?";
            
            const newMessages: Message[] = [{ role: 'model', text: validationMessage }];
            if (communityContextMessage) {
                newMessages.push({ role: 'model', text: communityContextMessage });
            }
            newMessages.push({ role: 'model', text: followUpMessage });
            
            setMessages(prev => [...prev, ...newMessages]);
            setConversationState(prev => prev ? { ...prev, step: 'POST_REFLECTION' } : null);

        } catch (error) {
            console.error("Error during analysis:", error);
            setError("There was an issue analyzing your reflection. Let's try that again.");
            setLastSubmittedEntryText(text);
            setLastAnalysisResult({ isSensitive: false, emotion: 'Reflective', themes: ['Introspection'], phrases: [], empatheticResponse: "I see.", wantsToJustBeHeard: false });
            setMessages(prev => [...prev, { role: 'model', text: "What would you like to do next?" }]);
            setConversationState(prev => prev ? { ...prev, step: 'POST_REFLECTION' } : null);
        } finally {
            setIsLoading(false);
        }
    }, [conversationState, handleSafetyHalt, entries, turnCount, messages]);
    
    const handleShareModalConfirm = useCallback(async (title?: string) => {
        await handleSaveEntry(lastSubmittedEntryText, true, title, lastAnalysisResult);
        setMessages(prev => [
            ...prev,
            { role: 'user', text: "Share with the Tribe" },
            { role: 'model', text: "Your reflection will join others in the Sonder Tribe, anonymously. Thank you for adding your voice." }
        ]);
        setConversationState(prev => ({ ...prev!, step: 'CLOSING' }));
        setTimeout(() => onSessionComplete(lastSubmittedEntryText), 4000);
    }, [handleSaveEntry, lastSubmittedEntryText, lastAnalysisResult, onSessionComplete]);

    const handleButtonClick = useCallback(async (action: string, payload?: any) => {
        if (!conversationState) return;
        
        switch (action) {
            case 'select_prompt': {
                if (payload?.id === 'initial-random') {
                    const randomPrompt = getRandomItem(ALL_PROMPTS);
                    setMessages(prev => [
                        ...prev,
                        { role: 'user', text: `✨ Random Prompt` },
                        { role: 'model', text: getRandomItem(GENTLE_ENCOURAGEMENT) }
                    ]);
                    setConversationState({ ...conversationState, step: 'WRITING', currentPrompt: randomPrompt });
                } else {
                    const matchingPrompt = INITIAL_PROMPTS.find(p => p.payload.id === payload?.id);
                    if (matchingPrompt) {
                        setMessages(prev => [
                            ...prev,
                            { role: 'user', text: `${matchingPrompt.emoji} ${matchingPrompt.label}` },
                            { role: 'model', text: getRandomItem(GENTLE_ENCOURAGEMENT) }
                        ]);
                        setConversationState({ ...conversationState, step: 'WRITING', currentPrompt: matchingPrompt.prompt });
                    }
                }
                break;
            }
            
            case 'select_pack': {
                const { packTitle } = payload;
                const confirmationMessages = [
                    "Beautiful choice — let’s explore that together.",
                    "Alright. Let’s take a moment with that feeling.",
                    "Okay, we’ll start there. Take your time."
                ];
                
                if (packTitle === 'freeform') {
                    const freeformPrompt = { id: "freeform-start", text: "What’s been on your mind lately?", category: "Freeform" };
                    setPromptQueue([]);
                    setCurrentPromptIndex(0);
                    setMessages(prev => [...prev, { role: 'model', text: getRandomItem(confirmationMessages) }]);
                    setConversationState(prev => ({...prev!, step: 'WRITING', currentPrompt: freeformPrompt }));

                } else {
                    const selectedPack = PROMPT_PACKS.find(p => p.title === packTitle);
                    if (selectedPack) {
                        const packPrompts = selectedPack.prompts.map((promptText, index) => ({
                            id: `${selectedPack.title.replace(/\s+/g, '-')}-${index}`,
                            text: promptText,
                            category: selectedPack.title
                        }));
                        setPromptQueue(packPrompts);
                        setCurrentPromptIndex(0);
                        setMessages(prev => [...prev, { role: 'model', text: getRandomItem(confirmationMessages) }]);
                        setConversationState(prev => ({ ...prev!, step: 'WRITING', currentPrompt: packPrompts[0] }));
                    }
                }
                break;
            }

            case 'next_prompt': {
                await handleSaveEntry(lastSubmittedEntryText, false, undefined, lastAnalysisResult);
                const nextIndex = currentPromptIndex + 1;
                setCurrentPromptIndex(nextIndex);
                const nextPrompt = promptQueue[nextIndex];
                setMessages(prev => [
                    ...prev,
                    { role: 'user', text: "Next Prompt" },
                    { role: 'model', text: `Here's the next thought. (${nextIndex + 1}/${promptQueue.length})` }
                ]);
                setConversationState(prev => ({ ...prev!, step: 'WRITING', currentPrompt: nextPrompt }));
                break;
            }

            case 'keep_reflecting': {
                await handleSaveEntry(lastSubmittedEntryText, false, undefined, lastAnalysisResult);
                const freeformPrompt = { id: "keep-reflecting-freeform", text: "What else is on your mind?", category: "Freeform" };
                setMessages(prev => [ ...prev, { role: 'user', text: "Keep reflecting" }, { role: 'model', text: getRandomItem(GENTLE_ENCOURAGEMENT) } ]);
                setConversationState(prev => ({ ...prev!, step: 'WRITING', currentPrompt: freeformPrompt }));
                break;
            }
            
            case 'pause_for_now': {
                await handleSaveEntry(lastSubmittedEntryText, false, undefined, lastAnalysisResult);
                setMessages(prev => [
                    ...prev, 
                    { role: 'user', text: "Pause for now" },
                    { role: 'model', text: "That’s okay. This space is yours to return to whenever you're ready." },
                ]);
                setConversationState(prev => ({ ...prev!, step: 'CLOSING' }));
                setTimeout(() => onSessionComplete(lastSubmittedEntryText), 3000);
                break;
            }
            
            case 'share_anonymously':
                setConversationState(prev => ({ ...prev!, step: 'SHARE_MODAL' }));
                break;
            
            case 'save_listening_session': {
                const sessionText = messages.filter(m => m.role === 'user').map(m => m.text).join('\n\n');
                await handleSaveEntry(sessionText, false);
                setMessages(prev => [...prev, {role: 'model', text: "Your reflection has been saved."}]);
                setConversationState(prev => ({ ...prev!, step: 'CLOSING' }));
                setTimeout(() => onSessionComplete(sessionText), 3000);
                break;
            }

            case 'discard_listening_session': {
                const sessionText = messages.filter(m => m.role === 'user').map(m => m.text).join('\n\n');
                onSessionComplete(sessionText);
                break;
            }
        }
    }, [conversationState, onSessionComplete, handleSaveEntry, lastSubmittedEntryText, onNavigate, lastAnalysisResult, currentPromptIndex, promptQueue, messages]);
    
    const { isActive, startConversation, stopConversation } = useLiveConversation({
        onTurnComplete: (userInput) => {
            handleJournalSubmit(userInput);
        },
        onModelTranscript: () => {},
        onUserTranscript: (text, isFinal) => {
            if (isActive) {
                setJournalInput(text);
                if(isFinal) setLiveUserTranscript(''); else setLiveUserTranscript(text);
            }
        },
        onError: setError,
    });
    
    const postReflectionButtons = useMemo<ActionButtonProps[]>(() => {
        const inQueue = promptQueue.length > 0;
        const isLastPromptInQueue = currentPromptIndex >= promptQueue.length - 1;

        let reflectAction: ActionButtonProps;
        if (inQueue && !isLastPromptInQueue) {
            reflectAction = { label: 'Next Prompt', action: 'next_prompt', style: 'primary', emoji: '➡️' };
        } else {
            reflectAction = { label: 'Keep Reflecting', action: 'keep_reflecting', style: 'primary', emoji: '✨' };
        }

        return [
            reflectAction,
            { label: 'Pause for Now', action: 'pause_for_now', style: 'secondary', emoji: '🌙' },
            { label: 'Share with Tribe', action: 'share_anonymously', style: 'secondary', emoji: '🤍' },
        ];
    }, [promptQueue.length, currentPromptIndex]);

    const postListeningButtons = useMemo<ActionButtonProps[]>(() => [
        { label: 'Save Reflection', action: 'save_listening_session', style: 'primary', emoji: '📝' },
        { label: 'Explore Prompts', action: 'explore_prompts', style: 'secondary', emoji: '📚', payload: { view: 'prompt_library'} },
        { label: 'Discard & Finish', action: 'discard_listening_session', style: 'secondary', isFullWidth: true },
    ], []);


    const packSelectionButtons = useMemo<ActionButtonProps[]>(() => {
        const PACK_SUGGESTIONS = [
            { title: 'Loneliness Pack', label: 'Loneliness', emoji: '🌧️' },
            { title: 'Gratitude Pack', label: 'Gratitude', emoji: '🌱' },
            { title: 'Belonging Pack', label: 'Belonging', emoji: '💞' },
            { title: 'Acceptance Pack', label: 'Healing', emoji: '🌿' },
            { title: 'Growth & Transformation Pack', label: 'Growth', emoji: '🌻' },
            { title: 'Self-Discovery Pack', label: 'Self-Reflection', emoji: '🪞' },
        ];
        // FIX: Explicitly typed `buttons` to fix type inference issue.
        const buttons: ActionButtonProps[] = PACK_SUGGESTIONS.map(pack => ({
            label: pack.label,
            emoji: pack.emoji,
            action: 'select_pack',
            payload: { packTitle: pack.title },
            style: 'secondary' as 'secondary',
        }));
        buttons.push({ label: 'Write Freely', emoji: '✨', action: 'select_pack', payload: { packTitle: 'freeform' }, style: 'secondary', isFullWidth: true });
        return buttons;
    }, []);

    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            if (journalInput.trim() !== '' && !isLoading && !isActive) {
                handleJournalSubmit(journalInput);
            }
        }
    };
    
    const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
        const textarea = e.currentTarget;
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
    };

    const renderActionButtons = () => {
        if (!conversationState) return null;
        const { step } = conversationState;
        switch(step) {
            case 'PROMPT_SELECTION':
                return <ActionButtons buttons={INITIAL_PROMPTS.map(p => ({...p, isFullWidth: p.label === 'Random Prompt'}))} onButtonClick={handleButtonClick} />;
            case 'PACK_SELECTION':
                return <ActionButtons buttons={packSelectionButtons} onButtonClick={handleButtonClick} />;
            case 'POST_REFLECTION':
                 return <ActionButtons buttons={postReflectionButtons} onButtonClick={handleButtonClick} />;
            case 'POST_LISTENING':
                 return <ActionButtons buttons={postListeningButtons} onButtonClick={handleButtonClick} />;
            case 'SAFETY_HALT':
                return (
                    <div className="text-center bg-red-900/50 p-4 rounded-lg border border-red-500/50 my-4 animate-fade-in">
                        <p className="text-red-200 mb-2 font-semibold">For immediate support, please use these resources:</p>
                        {SAFETY_RESOURCES.map(r => <p key={r.name} className="text-red-200">{r.name}: {r.text}</p>)}
                        <button onClick={onExit} className="mt-4 px-4 py-2 text-sm bg-white/10 rounded-lg hover:bg-white/20 transition-colors text-red-200">
                            End Session
                        </button>
                    </div>
                );
            default:
                return null;
        }
    };
    
    const showInputBar = conversationState && ['WRITING', 'START_REFLECTING', 'LISTENING'].includes(conversationState.step);
    const isListeningMode = conversationState?.step === 'LISTENING';

    return (
        <div className="h-full flex flex-col animate-fade-in relative">
            <header className="flex justify-between items-center mb-4 flex-shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-green-200">SonderBot</h1>
                    <p className="text-gray-400 text-sm">Your gentle, empathetic companion.</p>
                </div>
                <button onClick={ isListeningMode ? () => setConversationState(prev => ({...prev!, step: 'POST_LISTENING'})) : onExit} className="px-4 py-2 text-sm bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
                    {isListeningMode ? 'End Chat' : 'Exit'}
                </button>
            </header>

            <div className="flex-grow overflow-y-auto pr-2 space-y-4 mb-4">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-2xl ${msg.role === 'user' ? 'bg-green-500/80 text-gray-900' : 'bg-[#222a26]'}`}>
                           <p className="whitespace-pre-wrap">{msg.text}</p>
                        </div>
                    </div>
                ))}
                {isLoading && <div className="flex justify-start"><div className="max-w-xs px-4 py-2 rounded-2xl bg-[#222a26]"><span className="animate-pulse">Listening...</span></div></div>}
                {error && <p className="text-center text-red-400">{error}</p>}
                <div ref={messagesEndRef} />
            </div>

            <div className="flex-shrink-0 mt-auto pt-2">
                {renderActionButtons()}
                {showInputBar && (
                     <div className="relative">
                        {conversationState.step === 'LISTENING' && !isLoading && <ListeningOverlay message={isListeningMode ? "I'm here." : getRandomItem(LISTENING_MODE_VALIDATION)} />}
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                if (journalInput.trim() !== '') handleJournalSubmit(journalInput);
                            }}
                            className="flex items-end gap-2 p-2 bg-[#222a26] rounded-lg border border-white/10"
                        >
                            <button type="button" onClick={isActive ? stopConversation : startConversation} disabled={isLoading} className={`p-3 rounded-full font-semibold transition-colors flex-shrink-0 ${isActive ? 'bg-red-500 text-white animate-pulse' : 'bg-blue-500/80 text-white hover:bg-blue-400 disabled:bg-gray-500'}`} aria-label={isActive ? "Stop recording" : "Start recording"}>
                                <MicIcon className="w-5 h-5" />
                            </button>
                            <textarea
                                ref={textareaRef}
                                value={journalInput}
                                onChange={(e) => setJournalInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                onInput={handleInput}
                                placeholder={liveUserTranscript ? `Listening... "${liveUserTranscript}"` : "Write what comes to mind..."}
                                className="w-full bg-transparent rounded-lg text-base leading-relaxed text-gray-200 focus:outline-none resize-none max-h-40"
                                disabled={isLoading || isActive}
                                rows={1}
                            />
                            <button type="submit" disabled={isLoading || journalInput.trim() === '' || isActive} className="p-3 bg-green-500 text-gray-900 rounded-lg font-semibold hover:bg-green-400 disabled:bg-gray-600/50 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors flex-shrink-0">
                                <SendIcon className="w-5 h-5"/>
                            </button>
                        </form>
                    </div>
                )}
            </div>

            {conversationState?.step === 'SHARE_MODAL' && (
                <ShareModal 
                    entryText={lastSubmittedEntryText}
                    onCancel={() => setConversationState(prev => ({ ...prev!, step: 'POST_REFLECTION' }))}
                    onShare={handleShareModalConfirm}
                />
            )}
        </div>
    );
};

export default ChatView;