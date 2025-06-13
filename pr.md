# Claude Code Usage (ccusage) - Real-time Usage Monitoring Extension

## Description

A comprehensive Raycast extension that provides real-time monitoring of Claude Code usage statistics. This extension integrates with the external [ccusage](https://github.com/ryoppippi/ccusage) npm package to fetch and display detailed usage analytics directly within Raycast.

**Key Features:**
- **Daily Usage Tracking**: Monitor today's input/output tokens and costs with visual intensity indicators
- **Session History**: View recent usage sessions with model-specific breakdown and visual icons (Opus=Crown, Sonnet=Stars, Haiku=Leaf)
- **Cost Analysis**: Detailed cost tracking with monthly projections and spending insights
- **Model Statistics**: Usage analytics by Claude model with tier grouping
- **Menu Bar Integration**: Quick access to usage stats directly from the system menu bar
- **Runtime Flexibility**: Support for multiple JavaScript runtimes (npx, bunx, pnpm dlx, deno run)
- **Timezone Support**: Customizable timezone settings for accurate date display across regions

**Architecture:**
- Modern functional architecture with TypeScript + Zod for runtime type safety
- Uses `@raycast/utils` `useExec` with enhanced PATH configuration for reliable ccusage CLI integration
- Pure functional utilities for data formatting and calculations
- Dual UI modes: main list view and menu bar interface
- Real-time updates with optimized refresh intervals (1s menu bar, 5s main view)

## Screencast

<!-- Screenshots will be attached here -->

## Checklist

- [x] I read the [extension guidelines](https://developers.raycast.com/basics/prepare-an-extension-for-store)
- [x] I read the [documentation about publishing](https://developers.raycast.com/basics/publish-an-extension)
- [x] I ran `npm run build` and [tested this distribution build in Raycast](https://developers.raycast.com/basics/prepare-an-extension-for-store#metadata-and-configuration)
- [x] I checked that files in the `assets` folder are used by the extension itself
- [x] I checked that assets used by the `README` are placed outside of the `metadata` folder

**Additional Compliance:**
- Extension follows Raycast naming conventions and Apple Style Guide
- All 5 screenshots are 2000x1250 pixels (16:10 aspect ratio) as required
- Package.json includes proper metadata with MIT license
- README.md provides comprehensive setup instructions
- CHANGELOG.md documents release history
- Extension icon is 512x512 PNG format suitable for light/dark themes