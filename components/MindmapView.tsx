
import React, { useState } from 'react';
import { MOCK_MINDMAP_DATA } from '../constants';
import { MindmapNode } from '../types';

interface MindmapViewProps {
  onNavigate: (view: 'home') => void;
}

const Node: React.FC<{ node: MindmapNode; onClick: (node: MindmapNode) => void; isSelected: boolean }> = ({ node, onClick, isSelected }) => (
  <div
    className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 cursor-pointer group"
    style={{ top: node.position.top, left: node.position.left }}
    onClick={() => onClick(node)}
  >
    <div className={`flex flex-col items-center justify-center rounded-full bg-green-400/20 group-hover:bg-green-400/30 transition-all duration-300 ${isSelected ? 'ring-4 ring-green-300' : ''}`}
        style={{ width: `${node.size}px`, height: `${node.size}px` }}>
        <span className="text-center text-green-100 font-medium px-2">{node.label}</span>
        <span className="text-xs text-green-300">{node.size} others</span>
    </div>
  </div>
);

const MindmapView: React.FC<MindmapViewProps> = ({ onNavigate }) => {
  const [selectedNode, setSelectedNode] = useState<MindmapNode | null>(MOCK_MINDMAP_DATA[0]);

  return (
    <div className="h-full flex flex-col animate-fade-in">
        <header className="flex justify-between items-center mb-4">
            <div>
                <h1 className="text-2xl font-bold text-green-200">Community Mindmap</h1>
                <p className="text-gray-400">Tap a node to explore shared reflections.</p>
            </div>
            <button onClick={() => onNavigate('home')} className="px-4 py-2 text-sm bg-white/10 rounded-lg hover:bg-white/20 transition-colors">Home</button>
        </header>
      
        <div className="flex-grow flex gap-6">
            <div className="w-2/3 h-full bg-[#222a26] rounded-lg relative overflow-hidden">
                {/* Lines would be complex, so we imply connections by proximity */}
                {MOCK_MINDMAP_DATA.map(node => (
                    <Node key={node.id} node={node} onClick={setSelectedNode} isSelected={selectedNode?.id === node.id} />
                ))}
            </div>
            <div className="w-1/3 h-full bg-[#222a26] rounded-lg p-4 flex flex-col">
                {selectedNode ? (
                <>
                    <h2 className="text-xl font-bold text-green-200 mb-4">{selectedNode.label}</h2>
                    <div className="overflow-y-auto space-y-4">
                    {selectedNode.entries.map((entry, index) => (
                        <blockquote key={index} className="border-l-2 border-green-400/50 pl-3 text-gray-300 italic">
                        "{entry.text}"
                        </blockquote>
                    ))}
                    </div>
                </>
                ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                    <p>Select a theme to see reflections.</p>
                </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default MindmapView;
