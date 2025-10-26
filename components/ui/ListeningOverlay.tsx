import React from 'react';

interface ListeningOverlayProps {
  message: string;
}

const ListeningOverlay: React.FC<ListeningOverlayProps> = ({ message }) => {
  return (
    <div className="absolute inset-x-0 bottom-full mb-2 flex justify-center animate-fade-in">
      <div 
        className="bg-[#222a26] border border-green-400/20 rounded-full px-4 py-2 flex items-center gap-3 text-sm text-green-200 shadow-lg"
        aria-live="polite" 
        aria-atomic="true"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
        </span>
        <span>{message}</span>
      </div>
    </div>
  );
};

export default ListeningOverlay;
