export interface Prompt {
  id: string;
  text: string;
  category: string;
}

export interface JournalEntry {
  id: string;
  promptId: string;
  promptText: string;
  promptCategory: string;
  text: string;
  emotion: string;
  themes: string[];
  isShared: boolean;
  timestamp: number;
  highlightedPhrases?: string[];
}