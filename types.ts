
export interface Prompt {
  id: string;
  text: string;
  category: string;
}

export interface JournalEntry {
  id: string;
  promptId: string;
  promptText: string;
  text: string;
  emotion: string;
  themes: string[];
  isShared: boolean;
  timestamp: number;
}

export interface MindmapNode {
  id: string;
  label: string;
  size: number;
  entries: { text: string }[];
  position: { top: string; left: string };
}
