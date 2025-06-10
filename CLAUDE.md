# CLAUDE.md

**REPLY IN JAPANESE**

"Always update the CLAUDE.md file appropriately to reflect the instruction content when there are instructions like 'In the project, please do ○○.'"

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Raycast extension called `ccusage` that provides real-time monitoring of Claude Code usage. It integrates with the external `ccusage` npm package to fetch usage statistics and displays them through both a main list view and a menu bar interface.

## Architecture

### Core Integration Pattern

The extension follows a layered architecture where data flows from the external ccusage CLI tool through integration utilities to React hooks and finally to UI components:

```
ccusage CLI tool → CCUsageIntegration → Custom Hooks → UI Components
```

### Key Components

- **CCUsageIntegration**: Static class that executes ccusage commands via `npx ccusage@latest` and parses JSON output
- **Custom Hooks**: React hooks using `usePromise` + `useInterval` for real-time data fetching with configurable refresh intervals
- **Data Processing**: Utility classes for formatting display data and calculating usage metrics
- **Dual UI Modes**: Main list view (`ccusage.tsx`) and menu bar (`menubar-ccusage.tsx`)

### Data Flow Architecture

1. **Command Execution**: Uses Node.js `child_process.exec` to run ccusage commands
2. **Data Aggregation**: `getAllUsageData()` combines daily, total, and session data in parallel
3. **Real-time Updates**: Each hook has different refresh intervals (1s for menu bar, 5s for main view)
4. **Model Differentiation**: Visual indicators differentiate Claude models (Opus=Crown, Sonnet=Sparkles, Haiku=Leaf)

## Development Commands

```bash
# Start development with hot reload
npm run dev

# Build extension for production
npm run build

# Run linting
npm run lint

# Auto-fix linting issues
npm run fix-lint

# Publish to Raycast Store
npm run publish
```

## Key Technical Patterns

### Error Handling Strategy

- CCUsageIntegration methods return `null` on failure rather than throwing
- UI components gracefully handle loading states and display fallback messages
- `useCCUsageAvailability()` hook checks if ccusage is installed before attempting data fetching

### Data Type System

The extension uses comprehensive TypeScript interfaces:

- `UsageData`: Main aggregated data structure
- `DailyUsageData`: Daily usage metrics
- `SessionData`: Individual session information
- `ModelUsage`: Model-specific usage statistics
- `UsageStats`: Processed data for UI consumption

### Refresh Interval Configuration

Different components use different refresh rates optimized for their use case:

- Menu bar: 1000ms (1 second) for responsive real-time monitoring
- Main view: 5000ms (5 seconds) for detailed analysis
- Total usage: 30000ms (30 seconds) for less frequently changing data

### Component Architecture

Each major UI section is a separate component that receives processed data:

- `DailyUsage`: Today's usage with intensity visualization
- `SessionUsage`: Recent sessions with model-specific icons
- `CostAnalysis`: Cost breakdown and projections
- `ModelBreakdown`: Model-wise usage analysis with tier grouping

## External Dependencies

The extension requires the `ccusage` npm package to be available via `npx ccusage@latest`. The integration assumes:

- Commands: `daily --json`, `session --json`, `--json`
- JSON output format with fields: `inputTokens`, `outputTokens`, `totalTokens`, `cost`, `date`, `sessions`
- Local file access to Claude Code usage history (handled by ccusage)

## File Naming Conventions

- Main command file: `ccusage.tsx` (matches package.json command name)
- Menu bar file: `menubar-ccusage.tsx` (matches command name)
- Utilities organized by purpose: `ccusage-integration.ts`, `data-formatter.ts`, `usage-calculator.ts`
- React hooks in dedicated `hooks/` directory with `use-` prefix

## Development Guidelines

### Git Workflow

- **Commit Messages**: Always write commit messages in English using conventional commit format
- **Commit Types**: Use appropriate prefixes (`feat:`, `fix:`, `docs:`, `refactor:`, `perf:`, `test:`, `chore:`)
- **Change Separation**: Split logical changes into separate commits for better tracking
- **Debug Code**: Remove debug logs before committing to maintain clean production code

### UI/UX Principles  

- **Simplified Titles**: Use concise titles in left panel (e.g., "Today (2025-06-11)", "Sessions", "Models", "Costs")
- **Efficient Refresh**: Main view uses one-time data fetching, MenuBar maintains real-time updates (1s interval)
- **Responsive Design**: Optimize for limited screen space in Raycast interface

### Code Quality

- **TypeScript**: Maintain strict typing throughout the codebase
- **Error Handling**: Gracefully handle null/undefined states in UI components
- **Performance**: Use selective refresh intervals based on component requirements
