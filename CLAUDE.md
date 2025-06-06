# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Start development server**: `npm run dev`
- **Build application**: `npm run build`
- **Start production server**: `npm start`
- **Lint code**: `npm run lint`

## Application Architecture

### Core Data Flow
The application is a Next.js scorecard management system that processes CSV data through a hierarchical structure:
- **Pillars** → **Categories** → **Strategic Goals** → **Strategic Programs**
- Each level tracks quarterly objectives (Q1-Q4) with status indicators: exceeded (blue), on-track (green), delayed (amber), missed (red)

### Data Sources
- Primary data in `/data` directory (gitignored)
- Default CSV file: `data/DummyData.csv`
- Additional CSV files: Strategic-Goals.csv, Category-status-comments.csv, StrategicPillars.csv
- CSV file path configurable via `CSV_FILE_PATH` environment variable

### Key Architecture Patterns

**CSV Processing Pipeline**:
- `utils/csv-parser.ts` contains the CSV parsing and transformation logic
- `loadAndMergeScorecardCSVs()` merges data from multiple CSV files
- Status mapping: Green→on-track, Blue→exceeded, Amber→delayed, Red→missed
- Data flows through API route `/api/scorecard` to frontend components

**Component Structure**:
- `components/scorecard.tsx` - Main scorecard display
- `components/pillar-card.tsx` - Individual pillar rendering
- `components/status-*` - Status indicator components
- TypeScript interfaces in `types/scorecard.ts` define the data structure

**API Integration**:
- `/app/api/chat/route.ts` - OpenAI chat integration with scorecard context
- `/app/api/scorecard/route.ts` - Serves transformed CSV data
- System prompts loaded from `llm-system-prompt.md`

### Configuration Notes
- Next.js config disables ESLint and TypeScript build errors (`next.config.mjs`)
- Uses Tailwind CSS with shadcn/ui components
- Path aliases: `@/*` maps to project root

### Data Structure
Strategic hierarchy follows this pattern:
```
Pillar (id, name) 
├── Category (id, name, status, comments)
    ├── Strategic Goal (id, text, status, comments)
        └── Strategic Program (id, text, quarterly objectives/status/comments)
```