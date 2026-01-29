# Trip Reporter Design Guidelines

## Design Approach

**Medical Wellness + Psychedelic Vibrancy**: A professional medical wellness aesthetic with vibrant, colorful psychedelic undertones. The design balances clinical professionalism with creative, expressive elements.

## Color System

**Primary Colors**:
- Primary: Deep Navy Blue (222 62% 45%) - Professional, trustworthy medical feel
- Accent: Crimson Red (357 70% 50%) - Vibrant, warm, attention-grabbing
- Supporting: Purple/Violet (280 60% 55%) - Creative, psychedelic bridge color

**Gradient System**:
- Brand Gradient: from-primary via-purple-500 to-accent (blue-purple-red)
- Feature Cards: Solid colored icon backgrounds with subtle gradient tints
- CTA Sections: Full gradient backgrounds with white text
- Avatar Fallbacks: Full gradient backgrounds

**Wellness Reaction Colors**:
- Care (357 70% 55%): Warm red
- Solidarity (222 62% 50%): Navy blue  
- Strength (45 80% 50%): Golden amber
- Insight (280 60% 55%): Purple
- Gratitude (190 70% 45%): Cyan/teal

**Dark Mode**: All colors adjusted with increased lightness and saturation for visibility on dark backgrounds.

## Previous Design Approach

**Hybrid Approach**: Combining wellness app aesthetics (Calm, Headspace) with structured journaling (Notion, Day One) to create a safe, empathetic environment for sensitive personal documentation.

**Core Principles**:
- Trust and Privacy: Visual hierarchy emphasizing safety and control
- Empathetic Design: Soft, non-judgmental interface encouraging honest reflection
- Clear Structure: Organized data entry supporting mindful documentation
- Community Care: Social features designed for supportive sharing

## Typography

**Font Families** (Google Fonts):
- Primary: Inter (400, 500, 600) - Clean, highly readable for body text and data
- Accent: Instrument Serif (500, 600) - Warm, thoughtful for section headers

**Type Scale**:
- Hero/Page Titles: text-4xl md:text-5xl font-serif
- Section Headers: text-2xl md:text-3xl font-semibold
- Card Titles: text-xl font-semibold
- Body Text: text-base leading-relaxed
- Metadata/Labels: text-sm font-medium text-gray-600
- Timestamps: text-xs text-gray-500

## Layout System

**Spacing Primitives**: Tailwind units of 3, 4, 6, 8, 12, 16
- Component padding: p-4 md:p-6
- Section spacing: space-y-8 md:space-y-12
- Card gaps: gap-6
- Container margins: mx-4 md:mx-8

**Container Strategy**:
- Main content: max-w-4xl mx-auto (focused reading width)
- Feed layouts: max-w-6xl mx-auto
- Forms: max-w-2xl mx-auto

## Component Library

### Navigation
- Fixed top navigation bar with subtle border-b
- Logo left, user profile/settings right
- Navigation tabs: Dashboard, My Reports, Friends, New Report
- Mobile: Hamburger menu collapsing to drawer

### Dashboard Layout
**Three-column grid** (desktop):
- Left sidebar (w-64): Quick stats, recent activity
- Main feed (flex-1): Trip reports feed with infinite scroll
- Right sidebar (w-80): Friend suggestions, community highlights

Mobile: Single column stack

### Trip Report Card
**Structured card layout**:
- Header: User avatar + name + timestamp + privacy indicator
- Substance badge with amount (pill design)
- Set & Setting section (2-column on desktop)
- Experience narrative (prose formatting with max-w-prose)
- Interaction footer: Like/support button, comment count
- Subtle hover elevation (no active state needed)

### New Report Form
**Multi-step wizard** or **single scrolling form**:
- Section 1: Substance & Amount (dropdown + number input)
- Section 2: Set (textarea with character count, prompts like "What was your intention?")
- Section 3: Setting (textarea with prompts like "Where were you? Who was present?")
- Section 4: Experience (rich textarea, encouraging detailed reflection)
- Tags input for quick categorization
- Privacy selector (Friends only / Specific friends)
- Save draft functionality

### Friend Management
- Grid layout of friend cards (grid-cols-2 md:grid-cols-3 lg:grid-cols-4)
- Each card: Avatar, name, mutual friends count, latest report preview
- Clear add/remove actions

### Social Feed
- Chronological or algorithmic feed
- Filter controls: By substance, by friend, date range
- Empty states with gentle encouragement

## Icons
**Heroicons** (outline for most, solid for active states):
- Navigation and actions
- Substance categories (custom placeholder icons needed: `<!-- CUSTOM ICON: substance type -->`)
- Privacy indicators (lock, globe, user-group)

## Images

**Hero Section**: No traditional hero - instead, open with dashboard immediately after login

**Profile/Avatar Images**:
- User avatars throughout (rounded-full)
- Default avatar generator for users without photos

**Empty States**:
- Thoughtful illustrations for empty feeds ("Start your first report", "Add friends to see their journey")
- Warm, supportive imagery encouraging engagement

## Animations

**Minimal, purposeful animations**:
- Card hover: Subtle lift (transform translate-y-1)
- Form progression: Smooth section transitions
- Loading states: Pulse skeletons for feed items
- NO distracting scroll effects or page transitions

## Accessibility & Sensitivity

- High contrast for readability in all emotional states
- Clear focus indicators throughout
- Supportive microcopy avoiding judgment
- Resource links (harm reduction, support services) in footer
- Anonymous reporting option
- Export personal data feature

## Key Interactions

- **Quick Entry**: Floating action button for new report (bottom-right)
- **Draft Saving**: Auto-save every 30 seconds with visual indicator
- **Privacy Control**: Always visible, never assumed
- **Supportive Reactions**: Thoughtful alternatives to "likes" (care, solidarity, strength)

---

This design creates a mature, empathetic platform prioritizing user safety and meaningful reflection over engagement metrics.