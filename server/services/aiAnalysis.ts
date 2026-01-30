// AI Analysis Service for Trip Reports
// Provides text analysis, sentiment detection, and insight extraction

interface EmotionalArc {
  start: string;
  peak: string;
  end: string;
  transitions: string[];
}

interface AnalysisResult {
  themes: string[];
  emotionalArc: EmotionalArc;
  keyInsights: string[];
  suggestedIntegration: string[];
  sentimentScore: number; // -100 to 100
  wordCount: number;
  readingLevel: string;
}

// Sentiment analysis word lists
const positiveWords = new Set([
  'beautiful', 'peaceful', 'love', 'joy', 'amazing', 'wonderful', 'grateful',
  'enlightening', 'profound', 'connected', 'unity', 'bliss', 'serene', 'calm',
  'healing', 'transformative', 'insight', 'clarity', 'understanding', 'growth',
  'acceptance', 'compassion', 'forgiveness', 'release', 'freedom', 'light',
  'warmth', 'comfort', 'safe', 'happy', 'excited', 'inspired', 'hopeful',
  'meaningful', 'spiritual', 'transcendent', 'euphoric', 'ecstatic', 'alive'
]);

const negativeWords = new Set([
  'fear', 'anxiety', 'scared', 'terrifying', 'dark', 'lost', 'confused',
  'overwhelming', 'difficult', 'challenging', 'panic', 'paranoid', 'nightmare',
  'disturbing', 'uncomfortable', 'pain', 'suffering', 'death', 'dying',
  'lonely', 'isolated', 'trapped', 'helpless', 'hopeless', 'despair',
  'sadness', 'grief', 'anger', 'frustration', 'regret', 'guilt', 'shame',
  'nausea', 'sick', 'bad', 'wrong', 'scary', 'intense', 'heavy'
]);

// Theme detection patterns
const themePatterns: Record<string, RegExp[]> = {
  'Self-Discovery': [/myself|who i am|identity|self|inner|personal/gi],
  'Emotional Healing': [/heal|release|let go|forgive|accept|trauma|past/gi],
  'Spiritual Experience': [/god|divine|spirit|soul|universe|cosmic|transcend|sacred/gi],
  'Nature Connection': [/nature|earth|trees|plants|animals|outdoors|forest|ocean/gi],
  'Relationships': [/family|friend|love|partner|connection|people|social/gi],
  'Death & Rebirth': [/death|dying|rebirth|ego|dissolve|transform|end|begin/gi],
  'Visual Phenomena': [/colors|patterns|geometric|fractal|visual|see|watch/gi],
  'Time Distortion': [/time|eternal|moment|forever|timeless|slow|fast/gi],
  'Unity Experience': [/one|unity|connected|everything|universal|merge|boundary/gi],
  'Creative Insights': [/creative|art|music|idea|inspiration|imagine|create/gi],
  'Life Purpose': [/purpose|meaning|direction|path|future|goals|calling/gi],
  'Gratitude': [/grateful|thankful|appreciate|blessing|lucky|fortune/gi],
};

// Integration suggestion templates based on themes
const integrationSuggestions: Record<string, string[]> = {
  'Self-Discovery': [
    'Journal about the aspects of yourself you discovered',
    'Create a self-portrait or visual representation of your insights',
    'Share your discoveries with a trusted friend or therapist'
  ],
  'Emotional Healing': [
    'Continue processing these emotions through journaling',
    'Consider professional support to integrate healing experiences',
    'Practice self-compassion meditation regularly'
  ],
  'Spiritual Experience': [
    'Explore contemplative practices that resonate with your experience',
    'Read spiritual texts that align with your insights',
    'Join a community that supports spiritual growth'
  ],
  'Nature Connection': [
    'Spend regular time in nature to maintain this connection',
    'Start a garden or care for plants',
    'Practice outdoor meditation or forest bathing'
  ],
  'Relationships': [
    'Reach out to the people you thought about during your experience',
    'Express gratitude to important people in your life',
    'Work on communication skills to deepen connections'
  ],
  'Creative Insights': [
    'Set aside time for creative expression',
    'Start an art project inspired by your experience',
    'Explore new creative mediums'
  ],
  'Life Purpose': [
    'Write down your insights about your life direction',
    'Create actionable steps toward your goals',
    'Discuss your realizations with a mentor or coach'
  ],
  'Gratitude': [
    'Start a daily gratitude practice',
    'Write thank you notes to people who matter',
    'Create a gratitude jar for ongoing reflection'
  ]
};

// Calculate Flesch-Kincaid reading level
function calculateReadingLevel(text: string): string {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const syllables = words.reduce((count, word) => {
    return count + countSyllables(word);
  }, 0);

  if (sentences.length === 0 || words.length === 0) return 'Unknown';

  const avgWordsPerSentence = words.length / sentences.length;
  const avgSyllablesPerWord = syllables / words.length;

  const fleschKincaid = 0.39 * avgWordsPerSentence + 11.8 * avgSyllablesPerWord - 15.59;

  if (fleschKincaid < 6) return 'Elementary';
  if (fleschKincaid < 9) return 'Middle School';
  if (fleschKincaid < 12) return 'High School';
  if (fleschKincaid < 16) return 'College';
  return 'Graduate';
}

function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (word.length <= 3) return 1;

  const vowels = 'aeiouy';
  let count = 0;
  let prevIsVowel = false;

  for (const char of word) {
    const isVowel = vowels.includes(char);
    if (isVowel && !prevIsVowel) count++;
    prevIsVowel = isVowel;
  }

  // Handle silent e
  if (word.endsWith('e')) count--;

  return Math.max(1, count);
}

// Calculate sentiment score
function calculateSentiment(text: string): number {
  const words = text.toLowerCase().split(/\s+/);
  let positiveCount = 0;
  let negativeCount = 0;

  for (const word of words) {
    const cleanWord = word.replace(/[^a-z]/g, '');
    if (positiveWords.has(cleanWord)) positiveCount++;
    if (negativeWords.has(cleanWord)) negativeCount++;
  }

  const total = positiveCount + negativeCount;
  if (total === 0) return 0;

  // Score from -100 to 100
  return Math.round(((positiveCount - negativeCount) / total) * 100);
}

// Detect themes in text
function detectThemes(text: string): string[] {
  const themes: string[] = [];
  const lowerText = text.toLowerCase();

  for (const [theme, patterns] of Object.entries(themePatterns)) {
    for (const pattern of patterns) {
      if (pattern.test(lowerText)) {
        themes.push(theme);
        break;
      }
    }
  }

  return themes.slice(0, 5); // Return top 5 themes
}

// Extract emotional arc from the narrative
function extractEmotionalArc(text: string): EmotionalArc {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

  if (sentences.length < 3) {
    return {
      start: 'Brief experience',
      peak: 'Core moment',
      end: 'Resolution',
      transitions: []
    };
  }

  const thirds = Math.floor(sentences.length / 3);

  const startSection = sentences.slice(0, thirds).join(' ');
  const middleSection = sentences.slice(thirds, thirds * 2).join(' ');
  const endSection = sentences.slice(thirds * 2).join(' ');

  const startSentiment = calculateSentiment(startSection);
  const middleSentiment = calculateSentiment(middleSection);
  const endSentiment = calculateSentiment(endSection);

  const describePhase = (sentiment: number): string => {
    if (sentiment > 30) return 'Positive and expansive';
    if (sentiment > 0) return 'Mildly positive';
    if (sentiment === 0) return 'Neutral';
    if (sentiment > -30) return 'Mildly challenging';
    return 'Intense and challenging';
  };

  const transitions: string[] = [];
  if (middleSentiment > startSentiment + 20) {
    transitions.push('Elevation into peak');
  } else if (middleSentiment < startSentiment - 20) {
    transitions.push('Descent into intensity');
  }

  if (endSentiment > middleSentiment + 20) {
    transitions.push('Resolution and integration');
  } else if (endSentiment < middleSentiment - 20) {
    transitions.push('Lingering intensity');
  }

  return {
    start: describePhase(startSentiment),
    peak: describePhase(middleSentiment),
    end: describePhase(endSentiment),
    transitions
  };
}

// Extract key insights from the text
function extractKeyInsights(text: string): string[] {
  const insights: string[] = [];
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

  // Look for insight patterns
  const insightPatterns = [
    /i (realized|understood|learned|discovered|saw|felt|knew)/gi,
    /it (became clear|was obvious|showed me|taught me)/gi,
    /the (insight|lesson|message|truth|meaning) was/gi,
    /i now (understand|see|know|believe|feel)/gi
  ];

  for (const sentence of sentences) {
    for (const pattern of insightPatterns) {
      if (pattern.test(sentence)) {
        const trimmed = sentence.trim();
        if (trimmed.length > 20 && trimmed.length < 200) {
          insights.push(trimmed);
        }
        break;
      }
    }
  }

  // If no explicit insights found, extract sentences with key words
  if (insights.length === 0) {
    for (const sentence of sentences) {
      if (/meaning|purpose|truth|love|connection|understand/i.test(sentence)) {
        const trimmed = sentence.trim();
        if (trimmed.length > 20 && trimmed.length < 200) {
          insights.push(trimmed);
        }
      }
    }
  }

  return insights.slice(0, 5);
}

// Generate integration suggestions based on themes
function generateIntegrationSuggestions(themes: string[]): string[] {
  const suggestions: string[] = [];

  for (const theme of themes) {
    const themeSuggestions = integrationSuggestions[theme];
    if (themeSuggestions) {
      suggestions.push(themeSuggestions[Math.floor(Math.random() * themeSuggestions.length)]);
    }
  }

  // Add general suggestions if not enough specific ones
  const generalSuggestions = [
    'Write about your experience in detail while memories are fresh',
    'Practice meditation to help process and integrate insights',
    'Talk to a trusted friend about your experience',
    'Create art or music inspired by your journey',
    'Set intentions for applying your insights to daily life'
  ];

  while (suggestions.length < 3) {
    const suggestion = generalSuggestions[suggestions.length];
    if (!suggestions.includes(suggestion)) {
      suggestions.push(suggestion);
    }
  }

  return suggestions.slice(0, 5);
}

// Main analysis function
export function analyzeReport(
  experience: string,
  setMindset: string,
  setting: string
): AnalysisResult {
  const fullText = `${setMindset} ${setting} ${experience}`;
  const wordCount = fullText.split(/\s+/).filter(w => w.length > 0).length;

  const themes = detectThemes(fullText);
  const emotionalArc = extractEmotionalArc(experience);
  const keyInsights = extractKeyInsights(experience);
  const sentimentScore = calculateSentiment(fullText);
  const readingLevel = calculateReadingLevel(experience);
  const suggestedIntegration = generateIntegrationSuggestions(themes);

  return {
    themes,
    emotionalArc,
    keyInsights,
    suggestedIntegration,
    sentimentScore,
    wordCount,
    readingLevel
  };
}

// Substance interaction database
export const substanceInteractionData: Array<{
  substance1: string;
  substance2: string;
  severity: 'safe' | 'caution' | 'dangerous' | 'deadly';
  description: string;
  effects: string;
  recommendations: string;
}> = [
  {
    substance1: 'MDMA',
    substance2: 'MAOIs',
    severity: 'deadly',
    description: 'Extremely dangerous combination that can cause serotonin syndrome',
    effects: 'Hyperthermia, seizures, death',
    recommendations: 'Never combine. Wait at least 2 weeks after MAOIs before MDMA'
  },
  {
    substance1: 'Ayahuasca',
    substance2: 'SSRIs',
    severity: 'dangerous',
    description: 'Can cause serotonin syndrome due to MAOIs in ayahuasca',
    effects: 'Serotonin syndrome, dangerous blood pressure changes',
    recommendations: 'Taper off SSRIs under medical supervision before using'
  },
  {
    substance1: 'Psilocybin',
    substance2: 'SSRIs',
    severity: 'caution',
    description: 'SSRIs may reduce effects and pose minor serotonin risk',
    effects: 'Diminished effects, potential mild serotonin issues',
    recommendations: 'Effects may be reduced. Consult healthcare provider'
  },
  {
    substance1: 'LSD',
    substance2: 'Lithium',
    severity: 'dangerous',
    description: 'Can cause seizures and unpredictable effects',
    effects: 'Seizures, psychotic episodes',
    recommendations: 'Avoid this combination entirely'
  },
  {
    substance1: 'Ketamine',
    substance2: 'Alcohol',
    severity: 'dangerous',
    description: 'Both are CNS depressants, risk of respiratory depression',
    effects: 'Respiratory depression, loss of consciousness',
    recommendations: 'Do not combine. Allow alcohol to clear before ketamine'
  },
  {
    substance1: 'MDMA',
    substance2: 'Alcohol',
    severity: 'caution',
    description: 'Increased dehydration and liver stress',
    effects: 'Dehydration, increased neurotoxicity risk',
    recommendations: 'Stay hydrated. Minimize alcohol consumption'
  },
  {
    substance1: 'Cannabis',
    substance2: 'Psilocybin',
    severity: 'caution',
    description: 'Can intensify and prolong the experience unpredictably',
    effects: 'Increased intensity, potential for anxiety',
    recommendations: 'Start low if combining. Have experience with both separately first'
  },
  {
    substance1: 'LSD',
    substance2: 'Cannabis',
    severity: 'caution',
    description: 'Cannabis can significantly intensify LSD effects',
    effects: 'Increased intensity, potential thought loops',
    recommendations: 'Use cannabis cautiously, preferably during comedown'
  },
  {
    substance1: 'Psilocybin',
    substance2: 'Psilocybin',
    severity: 'safe',
    description: 'No interaction with itself',
    effects: 'Standard psilocybin effects',
    recommendations: 'Follow harm reduction practices'
  },
  {
    substance1: 'DMT',
    substance2: 'MAOIs',
    severity: 'caution',
    description: 'This is how ayahuasca works - intentional but requires preparation',
    effects: 'Extended and intensified DMT experience',
    recommendations: 'Only with proper dietary preparation and guidance'
  },
  {
    substance1: 'Ketamine',
    substance2: 'Benzodiazepines',
    severity: 'dangerous',
    description: 'Both are CNS depressants',
    effects: 'Respiratory depression, excessive sedation',
    recommendations: 'Avoid combining or use extreme caution'
  },
  {
    substance1: 'MDMA',
    substance2: 'Stimulants',
    severity: 'dangerous',
    description: 'Increased cardiovascular strain and hyperthermia risk',
    effects: 'Heart strain, overheating, dehydration',
    recommendations: 'Avoid combining stimulants with MDMA'
  }
];

// Check substance interaction
export function checkSubstanceInteraction(
  substance1: string,
  substance2: string
): typeof substanceInteractionData[0] | null {
  const s1 = substance1.toLowerCase();
  const s2 = substance2.toLowerCase();

  for (const interaction of substanceInteractionData) {
    const i1 = interaction.substance1.toLowerCase();
    const i2 = interaction.substance2.toLowerCase();

    if ((s1.includes(i1) || i1.includes(s1)) &&
        (s2.includes(i2) || i2.includes(s2))) {
      return interaction;
    }
    if ((s1.includes(i2) || i2.includes(s1)) &&
        (s2.includes(i1) || i1.includes(s2))) {
      return interaction;
    }
  }

  return null;
}

// Get all interactions for a substance
export function getSubstanceInteractions(substance: string): typeof substanceInteractionData {
  const s = substance.toLowerCase();
  return substanceInteractionData.filter(interaction => {
    const i1 = interaction.substance1.toLowerCase();
    const i2 = interaction.substance2.toLowerCase();
    return s.includes(i1) || i1.includes(s) || s.includes(i2) || i2.includes(s);
  });
}
