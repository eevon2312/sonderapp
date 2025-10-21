// FIX: Import MindmapNode type to resolve the 'Cannot find name' error.
import { Prompt, MindmapNode } from './types';

interface PromptPack {
  title: string;
  description: string;
  prompts: string[];
}

export const PROMPT_PACKS: PromptPack[] = [
  {
    title: 'Self-Discovery',
    description: 'Exploring identity, truth, and growth.',
    prompts: [
      'A secret you keep with yourself',
      'I am',
      'A truth you’ve been avoiding',
      'When was the last time you felt completely safe',
      'The moment you realized you were different',
      'What part of yourself are you still learning to understand',
      'Something you’re proud of but rarely talk about',
      'What are you most afraid to admit you want',
    ],
  },
  {
    title: 'Healing & Acceptance',
    description: 'Letting go, forgiving, and finding peace.',
    prompts: [
      'Something you didn’t understand at the time',
      'A moment that quietly changed you',
      'Something that hurt you but you didn’t let yourself feel',
      'Something you’ve forgiven but haven’t forgotten',
      'The hardest thing to accept about growing up',
      'What does closure look like to you',
      'A wound that taught you something important',
      'What do you wish you could finally put down and rest from',
    ],
  },
  {
    title: 'Connection & Belonging',
    description: 'Finding comfort in shared humanity.',
    prompts: [
      'Something you wish someone understood about you',
      'When was the last time you felt truly understood',
      'What does “home” mean to you now',
      'A time someone surprised you with kindness',
      'What do you need from people but rarely ask for',
      'When do you feel most like yourself around others',
      'A moment that reminded you you’re not alone',
      'What kind of connection are you craving right now',
    ],
  },
  {
    title: 'Love & Relationships',
    description: 'Exploring vulnerability, affection, and loss.',
    prompts: [
      'The last time you felt jealous and why',
      'Something you still miss but don’t talk about',
      'What does love feel like to you when it’s safe',
      'A memory that still makes your chest ache',
      'What have relationships taught you about yourself',
      'When was the last time you said “I love you” and meant it',
      'What scares you most about being loved',
      'Something you wish someone told you about heartbreak',
    ],
  },
  {
    title: 'Growth & Transformation',
    description: 'Moments of change, self-forgiveness, and forward motion.',
    prompts: [
      'Admit something to yourself for the first time here',
      'Something you pretend doesn’t bother you',
      'When was the last time you surprised yourself',
      'Something you’re still waiting for',
      'What does starting over mean to you',
      'What lesson keeps finding its way back to you',
      'Something you’ve outgrown but still miss',
      'Who are you becoming right now',
    ],
  },
  {
    title: 'Language & Expression',
    description: 'Exploring emotion through words and unspoken meaning.',
    prompts: [
      'A feeling you wish there was a word for',
      'Something you’ve never said out loud',
      'The phrase you find yourself saying when you’re not okay',
      'What words do you wish someone would say to you',
      'A song lyric that feels like it was written about you',
      'What does silence mean to you',
      'A sentence that changed the way you see yourself',
      'What word would describe this season of your life',
    ],
  },
  {
    title: 'Career & Life Direction',
    description: 'Exploring purpose, meaning, and balance.',
    prompts: [
      'What does “success” mean to you right now',
      'When was the last time you felt proud of your work',
      'What do you want your days to feel like, not just look like',
      'What part of your career feels most like you',
      'When did you last feel stuck, and what did that teach you',
      'What are you chasing — and why',
      'If failure wasn’t an option, what would you try next',
      'What kind of impact do you secretly hope to leave behind',
      'What does balance mean to you between work and life',
      'A dream you’ve outgrown but still miss thinking about',
    ],
  },
];


// Flatten all prompts into a single array for "Today's Prompt" logic
const allPromptsRaw: { text: string; category: string }[] = PROMPT_PACKS.flatMap(pack =>
  pack.prompts.map(promptText => ({ text: promptText, category: pack.title }))
);

export const ALL_PROMPTS: Prompt[] = allPromptsRaw.map((p, index) => ({
  id: `p-all-${index}`,
  text: p.text,
  category: p.category,
}));

export const MOCK_MINDMAP_DATA: MindmapNode[] = [
    { 
        id: 'n1', label: 'Longing for Connection', size: 124, 
        entries: [
            { text: "I just wish I had one person who really got me, you know?" },
            { text: "Sometimes the loneliness is a physical ache." },
            { text: "I miss the feeling of being part of something." }
        ],
        position: { top: '20%', left: '25%' }
    },
    { 
        id: 'n2', label: 'Quiet Gratitude', size: 88, 
        entries: [
            { text: "Watching the sunrise this morning with a cup of coffee was everything." },
            { text: "My pet fell asleep on my lap and I felt so much love." },
            { text: "A stranger smiled at me today and it changed my whole mood." }
        ],
        position: { top: '30%', left: '65%' }
    },
    { 
        id: 'n3', label: 'Navigating Uncertainty', size: 152, 
        entries: [
            { text: "I have no idea what I'm doing with my life, and I'm trying to be okay with that." },
            { text: "The future feels like a huge fog." },
            { text: "It's scary not knowing what comes next, but also a little exciting." }
        ],
        position: { top: '65%', left: '45%' }
    },
    { 
        id: 'n4', label: 'Self-Forgiveness', size: 75, 
        entries: [
            { text: "I'm learning to forgive myself for the mistakes I made when I didn't know better." },
            { text: "It's okay that I'm not perfect. I'm letting that sink in." },
        ],
        position: { top: '50%', left: '15%' }
    },
];