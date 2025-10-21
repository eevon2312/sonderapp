
import React, { useState } from 'react';

interface OnboardingProps {
  onComplete: () => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);

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
              onClick={onComplete}
              className="px-8 py-3 bg-green-400/20 text-green-200 rounded-lg hover:bg-green-400/30 transition-colors"
            >
              I Understand
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
