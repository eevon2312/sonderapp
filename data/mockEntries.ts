import { JournalEntry } from '../types';

export const MOCK_ENTRIES: JournalEntry[] = [
  {
    id: 'mock-1',
    promptId: 'p-all-0',
    promptText: 'A secret you keep with yourself',
    promptCategory: 'Self-Discovery Pack',
    text: 'That I sometimes feel like an imposter, even when people praise my work. It feels like one day everyone will find out I\'m not as capable as they think.',
    emotion: 'Anxious',
    themes: ['imposter syndrome', 'self-doubt'],
    isShared: true,
    timestamp: Date.now() - 86400000 * 3, // 3 days ago
    highlightedPhrases: ["feel like an imposter"],
  },
  {
    id: 'mock-2',
    promptId: 'p-all-8',
    promptText: 'Something you didn’t understand at the time',
    promptCategory: 'Acceptance Pack',
    text: 'Why my parents were so strict about my curfew. Now, as an adult, I realize they were just worried and wanted to keep me safe. It came from a place of love, not control.',
    emotion: 'Understanding',
    themes: ['perspective', 'family', 'growing up'],
    isShared: true,
    timestamp: Date.now() - 86400000 * 2, // 2 days ago
    highlightedPhrases: ["came from a place of love"],
  },
  {
    id: 'mock-3',
    promptId: 'p-all-16',
    promptText: 'Something you wish someone understood about you',
    promptCategory: 'Belonging Pack',
    text: 'That when I get quiet, it\'s not because I\'m upset or angry. It\'s just how I process things. I need that internal silence to figure out how I feel.',
    emotion: 'Reflective',
    themes: ['introversion', 'communication', 'misunderstanding'],
    isShared: true,
    timestamp: Date.now() - 86400000 * 1, // 1 day ago
    highlightedPhrases: ["need that internal silence to figure out how I feel"],
  },
   {
    id: 'mock-4',
    promptId: 'p-all-0',
    promptText: 'A secret you keep with yourself',
    promptCategory: 'Self-Discovery Pack',
    text: 'I secretly want to quit my job and open a small bookstore cafe. It feels like a childish dream, but it\'s the only thing that excites me anymore.',
    emotion: 'Hopeful',
    themes: ['dreams', 'career change', 'passion'],
    isShared: true,
    timestamp: Date.now() - 86400000 * 5, // 5 days ago
    highlightedPhrases: ["open a small bookstore cafe"],
  },
  {
    id: 'mock-5',
    promptId: 'p-all-10',
    promptText: 'Something that hurt you but you didn’t let yourself feel',
    promptCategory: 'Loss & Mortality Pack',
    text: 'When my best friend moved away, I acted like it was no big deal. But honestly, it felt like a huge part of my life was just gone overnight. I miss them more than I admit.',
    emotion: 'Melancholic',
    themes: ['friendship', 'loss', 'grief'],
    isShared: true,
    timestamp: Date.now() - 86400000 * 4, // 4 days ago
    highlightedPhrases: ["I miss them more than I admit"],
  },
];