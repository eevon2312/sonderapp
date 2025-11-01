import React from 'react';

interface SonderBotButtonProps {
    onClick: () => void;
}

const SonderBotIcon = ({ className = '' }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
        <path d="M12 12m-6 0a6 6 0 1 0 12 0a6 6 0 1 0 -12 0" opacity=".3"/>
        <path d="M12 12m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0" />
    </svg>
);


const SonderBotButton: React.FC<SonderBotButtonProps> = ({ onClick }) => {
    return (
        <button
            onClick={onClick}
            className="fixed bottom-6 right-6 sm:bottom-10 sm:right-10 bg-green-400/90 text-gray-900 rounded-full h-16 w-16 flex items-center justify-center shadow-lg hover:bg-green-300 transition-all transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#2a332d] focus:ring-green-400 animate-fade-in"
            aria-label="Open SonderBot chat"
        >
            <SonderBotIcon className="w-8 h-8" />
        </button>
    );
};

export default SonderBotButton;