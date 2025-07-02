# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Start development server**: `npm run dev`
- **Build application**: `npm run build`
- **Start production server**: `npm start`
- **Lint code**: `npm run lint`

## Application Architecture

### Core Data Flow
The application is a Next.js scorecard management system using PostgreSQL database with a hierarchical structure:
- **Strategic Pillars** → **Categories** → **Strategic Goals** → **Strategic Programs**
- Each level tracks quarterly objectives (Q1-Q4) with status indicators: exceeded, on-track, delayed, missed
- Status colors: exceeded (blue), on-track (green), delayed (amber), missed (red)

### Data Sources
- **PostgreSQL Database**: Primary data storage with relational schema
- Database connection via `DATABASE_URL` environment variable
- Schema defined in `database/schema.sql`
- Database service layer in `lib/database.ts`
- **No CSV files** - application now uses database exclusively

### Key Architecture Patterns

**Database Layer**:
- `lib/database.ts` - Database connection pool and service methods
- `database/schema.sql` - PostgreSQL schema with cascading relationships
- Automated progress update history tracking via database triggers
- Transaction support for data consistency

**API Routes**:
- `/api/scorecard/route.ts` - GET: Fetch all scorecard data, POST: Update data
- `/api/scorecard/update/route.ts` - PATCH: Update specific fields
- `/api/chat/route.ts` - OpenAI integration with multiple AI flow types
- `/api/generate-update/route.ts` - AI-powered progress update generation
- `/api/markdown/[filename]/route.ts` - Serve instruction markdown files

**Component Structure**:
- `components/scorecard.tsx` - Main scorecard display with quarter selection
- `components/pillar-card.tsx` - Pillar rendering with collapsible categories
- `components/ai-chat.tsx` - Interactive AI chat component
- `components/ai-flows-modal.tsx` - Modal for specialized AI workflows
- `components/status-*` - Status indicator and selector components
- `components/strategic-program-tooltip.tsx` - Program detail tooltips
- `components/ui/editable-field.tsx` - Inline editing functionality

**AI Integration Features**:
- **AI Chat**: General-purpose chat with scorecard context
- **AI Flows**: Specialized workflows (goal comparison, learnings/best practices)
- **Generate Updates**: AI-powered progress update creation
- **Reprioritization**: Quarterly objective rebalancing
- System prompts in `Prompts/` directory for different AI workflows

**Application Pages**:
- `/` - Main scorecard overview with quarter selection
- `/details` - Detailed program view
- `/instructions` - Application usage instructions
- `/upload` - Data upload interface

### Database Schema
PostgreSQL schema with the following main tables:
- `strategic_pillars` - Top-level strategic pillars
- `categories` - Categories within pillars
- `strategic_goals` - Goals within categories
- `strategic_programs` - Programs within goals
- `progress_updates_history` - Audit trail for progress changes

### Configuration Notes
- Next.js 15.2.4 with TypeScript
- PostgreSQL with `pg` client library
- OpenAI GPT-4.1 integration
- Tailwind CSS with shadcn/ui components
- Path aliases: `@/*` maps to project root
- Screen capture functionality via html2canvas