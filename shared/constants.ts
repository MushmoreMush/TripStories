// Shared constants for TripStories application
// Centralized location for values used across client and server

// Substances available for trip reports
export const SUBSTANCES = [
  "Psilocybin",
  "LSD",
  "DMT",
  "Ayahuasca",
  "MDMA",
  "Ketamine",
  "Cannabis",
  "Mescaline",
  "2C-B",
  "Salvia",
  "Other",
] as const;

export type Substance = typeof SUBSTANCES[number];

// Suggested tags for trip reports organized by category
export const SUGGESTED_TAGS = {
  effects: ["euphoria", "visuals", "body-high", "introspective", "energetic", "sedating", "synesthesia"],
  emotions: ["peaceful", "anxious", "joyful", "connected", "grateful", "vulnerable", "cathartic"],
  insights: ["ego-dissolution", "unity", "healing", "clarity", "creativity", "spiritual", "therapeutic"],
} as const;

// Color mappings for substances (used in Timeline and charts)
export const SUBSTANCE_COLORS: Record<string, string> = {
  psilocybin: "bg-purple-500/20 text-purple-700 dark:text-purple-400",
  lsd: "bg-blue-500/20 text-blue-700 dark:text-blue-400",
  dmt: "bg-pink-500/20 text-pink-700 dark:text-pink-400",
  ayahuasca: "bg-green-500/20 text-green-700 dark:text-green-400",
  mdma: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400",
  ketamine: "bg-cyan-500/20 text-cyan-700 dark:text-cyan-400",
  cannabis: "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400",
  mescaline: "bg-orange-500/20 text-orange-700 dark:text-orange-400",
  "2c-b": "bg-rose-500/20 text-rose-700 dark:text-rose-400",
  salvia: "bg-teal-500/20 text-teal-700 dark:text-teal-400",
  other: "bg-slate-500/20 text-slate-700 dark:text-slate-400",
};

// Get the color class for a substance (case-insensitive)
export function getSubstanceColor(substance: string): string {
  return SUBSTANCE_COLORS[substance.toLowerCase()] || SUBSTANCE_COLORS.other;
}

// Report status constants
export const REPORT_STATUSES = ["draft", "private", "shared"] as const;
export type ReportStatus = typeof REPORT_STATUSES[number];

// Reaction type constants (also exported from schema.ts for backwards compatibility)
export const REACTION_TYPES = ["care", "solidarity", "strength", "insight", "gratitude"] as const;
export type ReactionType = typeof REACTION_TYPES[number];

// Reaction display information
export const REACTION_INFO: Record<ReactionType, { emoji: string; label: string }> = {
  care: { emoji: "💚", label: "Sending Care" },
  solidarity: { emoji: "🤝", label: "Solidarity" },
  strength: { emoji: "💪", label: "Strength" },
  insight: { emoji: "💡", label: "Insightful" },
  gratitude: { emoji: "🙏", label: "Grateful" },
};

// Badge types
export const BADGE_TYPES = [
  "first_report",
  "five_reports",
  "ten_reports",
  "twenty_five_reports",
  "integration_master",
  "consistent_tracker",
  "mood_champion",
  "social_explorer",
  "supportive_friend",
  "storyteller",
] as const;

export type BadgeType = typeof BADGE_TYPES[number];

// Badge metadata for display
export const BADGE_INFO: Record<BadgeType, { name: string; description: string; icon: string }> = {
  first_report: { name: "First Steps", description: "Created your first trip report", icon: "sparkles" },
  five_reports: { name: "Getting Started", description: "Documented 5 experiences", icon: "book-open" },
  ten_reports: { name: "Dedicated Explorer", description: "Documented 10 experiences", icon: "compass" },
  twenty_five_reports: { name: "Journey Master", description: "Documented 25 experiences", icon: "trophy" },
  integration_master: { name: "Integration Master", description: "Completed all reflection prompts on a report", icon: "brain" },
  consistent_tracker: { name: "Consistent Tracker", description: "7-day mood check-in streak", icon: "flame" },
  mood_champion: { name: "Mood Champion", description: "30-day mood check-in streak", icon: "crown" },
  social_explorer: { name: "Social Explorer", description: "Shared experiences with 3+ friends", icon: "users" },
  supportive_friend: { name: "Supportive Friend", description: "Gave 10 supportive reactions to others", icon: "heart" },
  storyteller: { name: "Storyteller", description: "Written 1000+ words of experiences", icon: "pen-tool" },
};

// Mood levels
export const MOOD_LEVELS = [1, 2, 3, 4, 5] as const;
export type MoodLevel = typeof MOOD_LEVELS[number];

export const MOOD_LABELS: Record<MoodLevel, string> = {
  1: "Very Low",
  2: "Low",
  3: "Neutral",
  4: "Good",
  5: "Excellent",
};

// Experience templates for new reports
export const EXPERIENCE_TEMPLATES = [
  {
    id: "healing",
    name: "Healing Journey",
    icon: "heart",
    description: "Processing emotions or trauma",
    defaults: {
      setMindset: "I'm entering this space with the intention to heal and process difficult emotions. I acknowledge that some things may surface that are challenging, and I'm ready to meet them with compassion.",
      setting: "A safe, comfortable space where I feel protected. Soft lighting, comfortable seating, and calming music. I have support available if needed.",
    },
    suggestedTags: ["healing", "therapeutic", "emotional", "processing"],
  },
  {
    id: "creative",
    name: "Creative Exploration",
    icon: "sparkles",
    description: "Artistic inspiration & creativity",
    defaults: {
      setMindset: "I'm open to creative inspiration and new perspectives. I want to see the world differently and let ideas flow freely without judgment.",
      setting: "Surrounded by art supplies, instruments, or creative tools. Music that inspires me. A space where I can make a mess and express freely.",
    },
    suggestedTags: ["creative", "artistic", "inspiration", "flow"],
  },
  {
    id: "nature",
    name: "Nature Connection",
    icon: "sun",
    description: "Outdoor experience in nature",
    defaults: {
      setMindset: "I want to feel connected to the natural world and appreciate the beauty around me. Open to whatever the environment wants to show me.",
      setting: "Outdoors in a natural setting - forest, beach, mountains, or garden. Good weather, comfortable clothing, and snacks/water. A trusted friend as company.",
    },
    suggestedTags: ["nature", "outdoors", "connected", "peaceful"],
  },
  {
    id: "spiritual",
    name: "Spiritual Inquiry",
    icon: "target",
    description: "Deep questions & meaning",
    defaults: {
      setMindset: "I'm seeking deeper understanding of myself and my place in the universe. Open to insights about consciousness, purpose, and connection.",
      setting: "A quiet, sacred space. Candles, meaningful objects, comfortable meditation cushion. Silence or gentle spiritual music.",
    },
    suggestedTags: ["spiritual", "mystical", "insight", "consciousness"],
  },
  {
    id: "microdose",
    name: "Microdose Day",
    icon: "lightbulb",
    description: "Sub-perceptual dose for clarity",
    defaults: {
      setMindset: "Taking a small dose to enhance focus, creativity, or mood without strong perceptual effects. Continuing normal activities.",
      setting: "Normal daily environment - work, home, or creative space. Going about regular activities with heightened awareness.",
    },
    suggestedTags: ["microdose", "subtle", "focus", "productivity"],
  },
] as const;

export type ExperienceTemplateId = typeof EXPERIENCE_TEMPLATES[number]["id"];

// Timeline period types
export const PERIOD_TYPES = ["week", "month"] as const;
export type PeriodType = typeof PERIOD_TYPES[number];

// Friendship statuses
export const FRIENDSHIP_STATUSES = ["pending", "accepted", "rejected"] as const;
export type FriendshipStatus = typeof FRIENDSHIP_STATUSES[number];

// Media types for founder posts
export const MEDIA_TYPES = ["image", "video"] as const;
export type MediaType = typeof MEDIA_TYPES[number];

// Default channel icons
export const CHANNEL_ICONS = ["hash", "lightbulb", "heart", "star", "book", "users"] as const;

// Setting keywords for pattern recognition
export const SETTING_KEYWORDS = [
  "outdoor",
  "indoor",
  "nature",
  "home",
  "beach",
  "forest",
  "mountain",
  "city",
  "alone",
  "group",
  "friends",
  "solo",
] as const;

// Time of day classifications
export const TIME_OF_DAY = ["morning", "afternoon", "evening", "night"] as const;
export type TimeOfDay = typeof TIME_OF_DAY[number];

// Get time of day from hour
export function getTimeOfDay(hour: number): TimeOfDay {
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
}
