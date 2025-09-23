# AI Context Documentation

This document details what context information is provided to the AI in different scenarios within the scorecard application.

## Overview

The application provides contextual information to AI systems through three main interaction points:
1. **AI Chat Thread** (with item selection filtering)
2. **AI Chat Thread** (with all data)
3. **Progress Updates Generation**

## Database Schema Context

### Core Tables Structure

The application uses a hierarchical PostgreSQL database structure:

- **`strategic_pillars`** (Top level)
  - `id` (VARCHAR PRIMARY KEY)
  - `name` (VARCHAR)
  - `created_at`, `updated_at` (TIMESTAMP)

- **`categories`** (Second level)
  - `id` (VARCHAR PRIMARY KEY)
  - `name` (VARCHAR)
  - `status` (exceeded, on-track, delayed, missed)
  - `comments` (TEXT)
  - `pillar_id` (FK to strategic_pillars)

- **`strategic_goals`** (Third level)
  - `id` (VARCHAR PRIMARY KEY)
  - `text` (TEXT)
  - `status` (exceeded, on-track, delayed, missed)
  - `comments` (TEXT)
  - Quarterly objectives: `q1_objective`, `q2_objective`, `q3_objective`, `q4_objective`
  - Quarterly status: `q1_status`, `q2_status`, `q3_status`, `q4_status`
  - Personnel arrays: `ord_lt_sponsors`, `sponsors_leads`, `reporting_owners`
  - `progress_updates` (TEXT)
  - `category_id`, `pillar_id` (Foreign keys)

- **`strategic_programs`** (Fourth level)
  - `id` (VARCHAR PRIMARY KEY)
  - `text` (TEXT)
  - Quarterly objectives: `q1_objective`, `q2_objective`, `q3_objective`, `q4_objective`
  - Quarterly status: `q1_status`, `q2_status`, `q3_status`, `q4_status`
  - Personnel arrays: `ord_lt_sponsors`, `sponsors_leads`, `reporting_owners`
  - `progress_updates` (TEXT)
  - **`ai_context`** (TEXT) - Special AI-specific context field
  - Quarterly progress updates: `q1_2025_progress` through `q4_2026_progress`
  - `goal_id`, `category_id`, `pillar_id` (Foreign keys)

- **`functional_programs`** (Alternative fourth level)
  - Similar structure to strategic_programs
  - **`ai_context`** (TEXT) - Special AI-specific context field
  - `linked_ORD_strategic_program_ID` (VARCHAR)

## AI Context Scenarios

### 1. AI Chat Thread with Item Selected

**Location**: `/api/chat/route.ts:41-64` (filterScorecardData function)

**Context Provided**:
- **Filtered Scorecard Data**: Only pillars, categories, goals, and programs matching user selections
  - Selection filters applied to: `selections.pillars[]`, `selections.categories[]`, `selections.goals[]`, `selections.programs[]`
  - Complete hierarchy preserved but filtered to selected items only

- **AI Context Strings**: Extracted from selected programs' `ai_context` field
  - Format: `"${program.text}: ${program.aiContext}"`
  - Only programs with non-empty `aiContext` fields included
  - Appended as: `"\n\nAI Context for Selected Programs:\n${aiContexts.join('\n')}"`

- **System Prompt**: Loaded from `Prompts/AI-chat-system-prompt.md`

- **Context Truncation**: Limited to 50,000 characters to prevent token overflow

### 2. AI Chat Thread with Nothing Selected (All Data)

**Location**: `/api/chat/route.ts:201-234` (when no filtering applied)

**Context Provided**:
- **Complete Scorecard Data**: Full unfiltered hierarchy including:
  - All strategic pillars with complete nested structure
  - All categories, strategic goals, and strategic programs
  - All functional programs (if applicable)

- **All AI Context Strings**: From all programs containing `ai_context` data
  - Same format as filtered version but includes all programs
  - No selection filtering applied

- **System Prompt**: Same `Prompts/AI-chat-system-prompt.md`

- **Context Truncation**: Same 50,000 character limit

### 3. Progress Updates Generation

**Location**: `/api/generate-update/route.ts:14-100`

**Context Provided**:
- **Current Progress Content**: Existing progress update text (if editing)
  - Field: `content` parameter from form data

- **User Instructions**: Specific instructions for the update
  - Field: `instructions` parameter from form data

- **Strategic Program Context**: Complete program JSON data including:
  - Full program object with all database fields
  - Quarterly objectives (`q1_objective` through `q4_objective`)
  - Quarterly status (`q1_status` through `q4_status`)
  - Personnel information (`ord_lt_sponsors`, `sponsors_leads`, `reporting_owners`)
  - Existing `progress_updates`
  - Quarterly progress updates (`q1_2025_progress` through `q4_2026_progress`)

- **Program-Specific AI Context**: Special handling for `ai_context` field
  - Extracted from `context.aiContext` if available and non-empty
  - Added as separate section: `"AI-specific context and instructions:\n${context.aiContext}"`

- **Attached Documents**: Content from uploaded files
  - Format: `"--- Content from ${file.name} ---\n${text}\n"`
  - Multiple files concatenated with newlines

- **System Prompt**: Loaded from `Prompts/progress-updates-system-prompt.md`

## Special AI Context Field

The `ai_context` field in both `strategic_programs` and `functional_programs` tables serves as a dedicated space for:
- AI-specific instructions and context
- Program-specific guidance for AI interactions
- Custom prompts or constraints for AI processing
- Additional context not captured in standard fields

This field is specifically extracted and highlighted in AI interactions to provide targeted, program-specific guidance to the AI systems.

## Context Flow Architecture

```
User Selection → Filter Application → Context Extraction → AI Prompt Construction

Database Tables → Program ai_context Fields → Context Strings → System Message

Form Data → Program Context → Document Uploads → Progress Update Generation
```

## Implementation Notes

- Context data is JSON serialized before transmission to AI
- Filtering preserves hierarchical relationships
- AI context extraction handles null/empty values gracefully
- File uploads processed asynchronously and concatenated
- All AI interactions use GPT-4.1 model with 0.3 temperature
- Progress update history tracked via database triggers