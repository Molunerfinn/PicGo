# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
PicGo is an Electron-based cross-platform image upload tool that supports multiple image hosting services (图床) including SMMS, GitHub, Aliyun OSS, Qiniu, Tencent COS, and more. It's built with Vue 3 + TypeScript for the renderer process and Node.js for the main process.

## Architecture

### Core Structure
- **Main Process**: `src/main/` - Electron main process with Node.js capabilities
- **Renderer Process**: `src/renderer/` - Vue 3 frontend (no direct Node.js access)
- **Universal Code**: `src/universal/` - Shared code between processes
- **Entry Points**: 
  - `src/background.ts` - Main process bootstrap
  - `src/main.ts` - Renderer process entry

### Key Directories
- `src/main/apis/` - Main process APIs (uploader, system, window management)
- `src/main/server/` - HTTP server for external uploads
- `src/renderer/pages/` - Vue components for different views
- `src/renderer/store/` - Vuex-like state management
- `public/i18n/` - Internationalization files
- `test/` - Unit and e2e tests

### Data Storage
- **Config**: JSON file at `~/.picgo/config.json` (via `@picgo/store`)
- **Gallery**: Separate DB for uploaded images history
- **Settings**: Stored in config with namespaced keys (`settings.*`)

## Development Commands

### Setup & Install
```bash
yarn install  # Use yarn, NOT npm install
```

### Development
```bash
yarn dev              # Start development mode with hot reload
yarn electron:serve   # Alias for dev
```

### Build & Release
```bash
yarn build            # Build for production
yarn electron:build   # Build for production
yarn release          # Build and publish release
```

### Code Quality
```bash
yarn lint             # Run ESLint
yarn lint:fix         # Auto-fix lint issues
yarn lint:dpdm        # Check circular dependencies
yarn gen-i18n         # Generate i18n type definitions
```

### Testing
```bash
# Unit tests
yarn test:unit        # Run unit tests with Karma

# E2E tests  
yarn test:e2e         # Run end-to-end tests
```

### Git Workflow
```bash
yarn cz              # Commit with conventional commits
```

## Key Development Patterns

### Process Communication
- Use IPC events for cross-process communication
- Event names defined in `src/universal/events/constants.ts`
- Main process handles Node.js operations, renderer sends requests

### Configuration
- Settings stored in namespaced config keys
- Use `saveConfig()` and `getConfig()` from renderer
- Main process uses direct picgo instance APIs

### Internationalization
- Translation files in `public/i18n/*.yml`
- Run `yarn gen-i18n` after modifying translations
- Use `T()` function for translations in renderer

### File Organization
- **Main**: Node.js operations, file system, native features
- **Renderer**: UI, Vue components, user interactions
- **Universal**: Types, constants, shared utilities

## Build Configuration
- **Electron Builder**: Configured in `vue.config.js`
- **Platforms**: macOS (dmg), Windows (exe), Linux (AppImage, snap)
- **Auto-updater**: Disabled (commented out in background.ts)

## Common Tasks

### Adding a new feature
1. Determine if it belongs in main or renderer process
2. Add events to `src/universal/events/constants.ts` if needed
3. For Node.js operations, add IPC handlers in main process
4. For UI, add Vue components in renderer

### Modifying i18n
1. Update `public/i18n/[lang].yml`
2. Run `yarn gen-i18n`
3. Add language option in `src/universal/i18n/index.ts`

### Adding new picbed support
1. Use picgo plugin system (external to core)
2. Core picbed configs are in `src/renderer/pages/picbeds/`

## Environment Notes
- **Development**: Uses `vue-cli-plugin-electron-builder`
- **Production**: Built with `electron-builder`
- **Testing**: Karma for unit tests, Spectron for e2e
- **Hot reload**: Available for both main and renderer processes