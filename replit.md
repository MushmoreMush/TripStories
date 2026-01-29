# Trip Reporter

## Overview

Trip Reporter is a private journaling platform for documenting and sharing personal experiences with trusted friends. The application combines wellness app aesthetics with structured journaling to create a safe, empathetic environment for sensitive personal documentation. Users can track substance, set (mindset), setting, and journey details, then optionally share reports with their friend network.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens and CSS variables for theming
- **Build Tool**: Vite with hot module replacement

The frontend follows a page-based structure with shared components. Authentication state is managed through React Query, and the app supports light/dark theme switching via CSS custom properties.

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Pattern**: RESTful JSON API with `/api` prefix
- **Authentication**: Replit OpenID Connect (OIDC) with Passport.js
- **Session Management**: Express sessions stored in PostgreSQL via connect-pg-simple

The server uses a storage abstraction layer (`IStorage` interface) for database operations, making it easier to test and swap implementations.

### Data Storage
- **Database**: PostgreSQL with Drizzle ORM
- **Schema Location**: `shared/schema.ts` (shared between client and server)
- **Migrations**: Drizzle Kit with `db:push` command

Key tables:
- `users`: User profiles from Replit Auth (includes bio, favoriteQuote, currentProject, favoriteSubstance, intentions)
- `sessions`: Session storage for authentication
- `tripReports`: User trip reports with substance, set, setting, and experience fields
- `friendships`: Friend connections between users with pending/accepted states
- `moodEntries`: Mood tracking with 5-level scale and notes
- `badges`: User milestone badges with 10 types (first_report, five_reports, ten_reports, twenty_five_reports, integration_master, consistent_tracker, mood_champion, social_explorer, supportive_friend, storyteller)
- `channels`: Community board channels with name, description, and creation timestamp
- `channelMessages`: Messages within channels, linked to users with content and timestamps

### PWA Capabilities
- **Manifest**: `client/public/manifest.json` with app metadata and icons
- **Service Worker**: `client/public/sw.js` with network-first caching strategy
- **Offline Support**: Static assets cached for offline access
- **Install Prompt**: Shows install button when PWA criteria met

### Key Features
- **Integration Focus**: App framed as an "integration companion" - emphasizing that "the real work begins after the experience ends"
- **Quick Mood Logging**: Floating action button for rapid mood entry
- **Quick Log**: Rapid 30-second trip entry capture with option to expand into full report later
- **Integration Prompts**: Reflection questions on reports (What surprised you?, Lessons to remember?, Daily life application?, Weekly intention?)
- **Edit Reports**: Full editing capability for trip reports via `/reports/:id/edit`
- **Compare Journeys**: Side-by-side comparison at `/compare` with mood delta visualization (3-day before/after windows) and automated insights
- **Draft-First Workflow**: Reports start as drafts with status chips (Draft/Private/Shared) and auto-save indicators
- **Share Trust Signals**: Privacy UI showing who can see reports, what they can't do, and "never indexed or public" messaging
- **Share Expiration**: Options for 7 days, 30 days, or forever when sharing with friends
- **Timeline Grouping**: Group timeline by time, substance, or emotional intensity
- **Data Import**: Import mood data from Daylio, custom JSON, or CSV formats
- **Correlation Analysis**: Before/after mood analysis by substance and setting
- **Timeline View**: Personal journey history with filters
- **Calendar View**: Date-based visualization of entries
- **Social Profiles**: Users can add bio, favorite quote, current project, favorite substance, and intentions
- **Profile Page**: Dedicated page at `/profile` for editing personal information
- **Friend Network**: Send/accept friend requests, view friends with rich profile info
- **Onboarding Flow**: Welcome modal explaining integration focus on first visit
- **Discovery Feed**: Friends-only feed at `/discover` showing shared experiences with filters by friend, substance, search, and recency (7/30/90 days)
- **Milestone Badges**: Achievement system with 10 badge types tracking journey milestones (report counts, integration completion, mood streaks, social engagement, word count)
- **Community Board**: Open chat at `/community` with Telegram-style UI featuring 3 default channels (General, Integration Tips, Support Circle), real-time message polling every 5 seconds, and public discussion space for all authenticated users

### Authentication Flow
1. User clicks login, redirected to Replit OIDC provider
2. After authentication, user profile is upserted to database
3. Session cookie maintains authentication state
4. Protected routes use `isAuthenticated` middleware

## External Dependencies

### Third-Party Services
- **Replit Auth**: OpenID Connect authentication via Replit's identity provider
- **PostgreSQL**: Primary database (provisioned via Replit)

### Key Libraries
- **Drizzle ORM**: Type-safe database queries with Zod schema validation
- **Radix UI**: Accessible, unstyled component primitives
- **TanStack Query**: Data fetching, caching, and synchronization
- **date-fns**: Date formatting utilities
- **react-hook-form + zod**: Form handling with schema validation

### Development Tools
- **Vite**: Frontend build and development server
- **esbuild**: Production server bundling
- **TypeScript**: Full-stack type safety with shared types