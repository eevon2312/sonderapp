

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useLiveConversation } from '../hooks/useLiveConversation';
import { performFullEntryAnalysis, FullAnalysisResult } from '../services/geminiService';
import { JournalEntry } from '../types';

const MicIcon = ({ className = '' }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.49 6-3.31 6-6.72h-1.7z" />
    </svg>
);

const StopIcon = ({ className = '' }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M6 6h12v12H6z" />
    </svg>
);

const renderHighlightedText = (text: string, phrases?: string[]) => {
  if (!phrases || phrases.length === 0) {
    return text;
  }
  const escapedPhrases = phrases.map(phrase => phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`(${escapedPhrases.join('|')})`, 'gi');
  const parts = text.split(regex);
  
  return parts.map((part, i) =>
    phrases.some(p => p.toLowerCase() === part.toLowerCase())
      ? <span key={i} className="bg-[#2ECC71]/20 px-1 rounded-sm">{part}</span>
      : part
  );
};


interface VoiceMemoDemoProps {
  onExit: () => void;
  onSave: (entry: JournalEntry) => void;
}

const VoiceMemoDemo: React.FC<VoiceMemoDemoProps> = ({ onExit, onSave }) => {
  const [liveTranscript, setLiveTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<FullAnalysisResult | null>(null);
  const [error, setError] = useState('');
  
  const liveTranscriptRef = useRef('');
  useEffect(() => {
    liveTranscriptRef.current = liveTranscript;
  }, [liveTranscript]);

  const handleTurnComplete = useCallback(async (userInput: string) => {
    if (userInput.trim().length > 0 && !isProcessing && !analysisResult) {
      setIsProcessing(true);
      setFinalTranscript(userInput);
      setLiveTranscript('');
      try {
        const analysis = await performFullEntryAnalysis(userInput);
        setAnalysisResult(analysis);
      } catch (e) {
        setError('Failed to analyze the memo.');
        console.error(e);
      } finally {
        setIsProcessing(false);
      }
    }
  }, [isProcessing, analysisResult]);

  const { isActive, startConversation, stopConversation } = useLiveConversation({
    onTurnComplete: handleTurnComplete,
    onModelTranscript: () => {},
    onUserTranscript: (text, isFinal) => {
      setLiveTranscript(text);
      if (isFinal) {
        handleTurnComplete(text);
      }
    },
    onError: (err) => {
        setError(err);
        setLiveTranscript('');
    },
  });
  
  useEffect(() => {
    return () => {
      if (isActive) {
        stopConversation();
      }
    };
  }, [isActive, stopConversation]);


  const handleToggleRecording = () => {
    if (isActive) {
      stopConversation();
      // Manually trigger analysis on stop for better UX
      handleTurnComplete(liveTranscriptRef.current);
    } else {
      setFinalTranscript('');
      setAnalysisResult(null);
      setError('');
      startConversation();
    }
  };

  const handleSaveEntry = () => {
    if (!finalTranscript || !analysisResult) return;
    const newEntry: JournalEntry = {
      id: `voice-${new Date().toISOString()}`,
      promptId: 'voice-memo',
      promptText: 'Voice Memo',
      promptCategory: 'Voice Journaling',
      text: finalTranscript,
      emotion: analysisResult.emotion,
      themes: analysisResult.themes,
      isShared: false,
      timestamp: Date.now(),
      highlightedPhrases: analysisResult.phrases,
    };
    onSave(newEntry);
    alert('Voice memo saved to your Sonder Notes!');
    onExit();
  };
  
  const handleDiscard = () => {
      setFinalTranscript('');
      setAnalysisResult(null);
      setError('');
      setLiveTranscript('');
  }

  const renderContent = () => {
    if (isProcessing) {
      return (
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-400/20 border-t-green-400 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-gray-300">Analyzing your reflection...</p>
        </div>
      );
    }
    if (analysisResult && finalTranscript) {
      return (
        <div className="animate-fade-in w-full text-left">
          <p className="text-gray-400 text-sm mb-2 font-semibold">YOUR REFLECTION</p>
          <div className="bg-[#1B2620] p-4 rounded-lg mb-4 max-h-40 overflow-y-auto">
            <p className="text-[#A8BFA8] leading-relaxed whitespace-pre-wrap">
                {renderHighlightedText(finalTranscript, analysisResult.phrases)}
            </p>
          </div>
          <div className="flex gap-4">
            <div>
              <p className="text-gray-400 text-sm font-semibold">EMOTION</p>
              <p className="text-green-300 font-bold text-lg">{analysisResult.emotion}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm font-semibold">THEMES</p>
              <p className="text-green-300 capitalize">{analysisResult.themes.join(', ')}</p>
            </div>
          </div>
        </div>
      )
    }

    return (
        <div className="text-center">
            <h2 className="text-2xl font-lora text-green-200 mb-2">Voice Journal</h2>
            <p className="text-gray-400 min-h-[4rem]">
                {isActive ? liveTranscript || "Listening..." : "A quiet space to dump your thoughts out loud. Just speak freely."}
            </p>
        </div>
    );
  }

  return (
    <div className="h-full flex flex-col items-center justify-center animate-fade-in text-center -m-6 bg-[#2a332d]">
       <header className="absolute top-0 left-0 right-0 flex justify-end p-4 sm:p-6">
            <button onClick={onExit} className="px-4 py-2 text-sm bg-white/10 rounded-lg hover:bg-white/20 transition-colors">Exit</button>
        </header>
        <div className="flex-grow flex flex-col items-center justify-center w-full max-w-lg p-6">
          {renderContent()}
        </div>

        {error && <p className="text-red-400 text-sm my-4">{error}</p>}

        <div className="flex-shrink-0 mb-12 flex items-center gap-4">
            {analysisResult ? (
                <>
                    <button onClick={handleDiscard} className="px-6 py-3 bg-white/10 text-gray-200 rounded-lg font-semibold hover:bg-white/20 transition-all">
                        Discard
                    </button>
                    <button onClick={handleSaveEntry} className="px-8 py-3 bg-green-500 text-gray-900 rounded-lg font-semibold hover:bg-green-400 transition-colors">
                        Save Entry
                    </button>
                </>
            ) : (
                <button
                    onClick={handleToggleRecording}
                    disabled={isProcessing}
                    aria-label={isActive ? "Stop recording" : "Start recording"}
                    className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center text-white transition-all duration-300 transform hover:scale-105 disabled:opacity-50
                    ${isActive ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}
                >
                    {isActive ? <StopIcon className="w-8 h-8 sm:w-10 sm:h-10" /> : <MicIcon className="w-8 h-8 sm:w-10 sm:h-10" />}
                </button>
            )}
        </div>
    </div>
  );
};

export default VoiceMemoDemo;