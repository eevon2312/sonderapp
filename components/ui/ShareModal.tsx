import React, { useState, useEffect, useRef } from 'react';

interface ShareModalProps {
  entryText: string;
  onShare: (payload: { text: string; title?: string }) => void;
  onCancel: () => void;
}

const ShareModal: React.FC<ShareModalProps> = ({ entryText, onShare, onCancel }) => {
  const [title, setTitle] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);

  // Focus trapping for accessibility
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

    modalNode.addEventListener('keydown', handleKeyDown);

    return () => {
      modalNode.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleShare = () => {
    onShare({ text: entryText, title: title.trim() });
  };

  return (
    <div 
        className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fade-in" 
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="share-modal-title"
    >
        <div ref={modalRef} className="bg-[#2a332d] p-6 rounded-lg shadow-xl max-w-md w-full mx-4 border border-white/10">
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
                <button onClick={handleShare} className="px-4 py-2 bg-green-500 text-gray-900 rounded-lg font-semibold hover:bg-green-400">
                    Share Anonymously
                </button>
            </div>
        </div>
    </div>
  );
};

export default ShareModal;
