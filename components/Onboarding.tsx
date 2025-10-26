
import React, { useState } from 'react';
import { Prompt } from '../types';

interface OnboardingProps {
  onComplete: (name: string, result: { type: 'predefined'; prompt: Prompt } | { type: 'custom'; text: string }) => void;
}

const predefinedReasons = [
    {
      label: "I’ve been feeling a bit lonely.",
      pack: "Loneliness Pack",
      promptText: "When do you feel most alone, even when surrounded by people?"
    },
    {
      label: "I just want someone to listen.",
      pack: "Loneliness Pack",
      promptText: "Take all the space you need. This space is here for you."
    },
    {
      label: "I’m healing from something.",
      pack: "Acceptance Pack",
      promptText: "What are you tired of fighting within yourself?"
    },
    {
      label: "I just want a safe space to reflect.",
      pack: "Self-Discovery Pack",
      promptText: "What part of yourself are you still learning to understand?"
    },
    {
      label: "I want to understand myself better.",
      pack: "Growth & Transformation Pack",
      promptText: "Who are you becoming right now?"
    }
];

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [emotionText, setEmotionText] = useState('');
  const [customReasonText, setCustomReasonText] = useState('');
  const [isWritingCustomReason, setIsWritingCustomReason] = useState(false);

  const handlePredefinedReasonSelect = (reason: typeof predefinedReasons[0]) => {
    const prompt: Prompt = {
      id: `onboarding-${reason.pack.replace(/\s+/g, '-')}`,
      text: reason.promptText,
      category: reason.pack,
    };
    onComplete(name, { type: 'predefined', prompt });
  };

  const handleStartCustomReason = () => {
    setIsWritingCustomReason(true);
  };

  const handleCustomReasonSubmit = () => {
    if (customReasonText.trim() === '') return;
    setStep(5);
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="text-center flex flex-col items-center justify-center h-full animate-fade-in">
            <h1 className="text-5xl font-lora text-green-200 mb-4">You're not alone.</h1>
            <p className="text-lg text-gray-300 max-w-md mb-8">Welcome to Sonder, a quiet space to explore your thoughts and see how others feel, too.</p>
            <button
              onClick={() => setStep(2)}
              className="px-8 py-3 bg-green-400/20 text-green-200 rounded-lg hover:bg-green-400/30 transition-colors"
            >
              Begin Your Journey
            </button>
          </div>
        );
      case 2:
        return (
          <div className="text-center flex flex-col items-center justify-center h-full animate-fade-in">
            <h2 className="text-4xl font-lora text-green-200 mb-4">Your privacy comes first.</h2>
            <p className="text-lg text-gray-300 max-w-md mb-8">Everything you write is private by default. Sharing with the community is always your choice, and always anonymous.</p>
            <button
              onClick={() => setStep(3)}
              className="px-8 py-3 bg-green-400/20 text-green-200 rounded-lg hover:bg-green-400/30 transition-colors"
            >
              I Understand
            </button>
          </div>
        );
      case 3:
        return (
          <div className="text-center flex flex-col items-center justify-center h-full animate-fade-in">
            <h2 className="text-4xl font-lora text-green-200 mb-4">What should we call you?</h2>
            <p className="text-lg text-gray-300 max-w-md mb-8">This is just for a more personal touch. It's never shared.</p>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your first name"
              className="w-full max-w-xs bg-[#222a26] rounded-lg p-4 text-lg text-center text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-400/50 mb-8"
              autoFocus
            />
            <button
              onClick={() => setStep(4)}
              disabled={name.trim() === ''}
              className="px-8 py-3 bg-green-400/20 text-green-200 rounded-lg hover:bg-green-400/30 transition-colors disabled:bg-gray-600/20 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </div>
        );
      case 4:
        return (
            <div className="text-center flex flex-col items-center justify-center h-full animate-fade-in">
            {!isWritingCustomReason ? (
              <>
                <h2 className="text-4xl font-lora text-green-200 mb-2">Hi {name},</h2>
                <p className="text-lg text-gray-300 max-w-md mb-8">What brings you here today?</p>
                <div className="flex flex-col gap-3 w-full max-w-sm">
                  {predefinedReasons.map(r => (
                    <button key={r.label} onClick={() => handlePredefinedReasonSelect(r)} className="w-full text-left p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">{r.label}</button>
                  ))}
                  <button onClick={handleStartCustomReason} className="w-full text-left p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">Something else…</button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-4xl font-lora text-green-200 mb-2">That's okay.</h2>
                <p className="text-lg text-gray-300 max-w-md mb-8">Feel free to share what's on your mind.</p>
                <textarea
                  value={customReasonText}
                  onChange={(e) => setCustomReasonText(e.target.value)}
                  placeholder="I'm here because..."
                  className="w-full max-w-md h-32 bg-[#222a26] rounded-lg p-4 text-lg leading-relaxed text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-400/50 resize-none mb-8"
                  autoFocus
                />
                <button
                  onClick={handleCustomReasonSubmit}
                  disabled={customReasonText.trim() === ''}
                  className="px-8 py-3 bg-green-400/20 text-green-200 rounded-lg hover:bg-green-400/30 transition-colors disabled:bg-gray-600/20 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              </>
            )}
          </div>
        );
      case 5: // This step is now only for the custom reason path
        return (
          <div className="text-center flex flex-col items-center justify-center h-full animate-fade-in">
            <h2 className="text-4xl font-lora text-green-200 mb-4">First, how are you feeling?</h2>
            <p className="text-lg text-gray-300 max-w-md mb-8">Take a moment to check in with yourself. This is just for you.</p>
            <textarea
              value={emotionText}
              onChange={(e) => setEmotionText(e.target.value)}
              placeholder="Right now, I feel..."
              className="w-full max-w-md h-32 bg-[#222a26] rounded-lg p-4 text-lg leading-relaxed text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-400/50 resize-none mb-8"
              autoFocus
            />
            <button
              onClick={() => onComplete(name, { type: 'custom', text: emotionText })}
              disabled={emotionText.trim() === ''}
              className="px-8 py-3 bg-green-400/20 text-green-200 rounded-lg hover:bg-green-400/30 transition-colors disabled:bg-gray-600/20 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              Begin Journaling
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return <div className="h-full">{renderStep()}</div>;
};

export default Onboarding;