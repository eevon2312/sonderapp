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

export interface User {
  name: string;
  email: string;
  // This is not secure and is for demonstration purposes only.
  // In a real application, never store plain text passwords.
  password_DO_NOT_USE_IN_PROD: string;
  onboardingComplete: boolean;
}
