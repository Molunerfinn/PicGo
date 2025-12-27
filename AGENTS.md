# Repository Guidelines

## Project Structure & Module Organization
PicGo is an Electron + Vue 3 desktop client. Source lives in `src/`: `src/main` for main-process and IPC logic, `src/renderer` for Vue views, and `src/universal` for shared helpers (`types/`, `events/constants.ts`). `background.ts` wires Electron Builder. Static assets and locale YAML files stay in `public/` (add languages under `public/i18n/`), while `docs/` hosts user-facing guides. Automation scripts live in `scripts/`, and legacy tests sit under `test/unit` (Karma) and `test/e2e` (Spectron).

## Build, Test, and Development Commands
- `pnpm install` — install dependencies; `npm install` is unsupported.
- Always add/remove dependencies with `pnpm` (never edit package.json versions by hand then install).
- `pnpm dev` — electron-vite dev server for main/preload/renderer.
- `pnpm build` — electron-vite build outputs to `dist/main`, `dist/preload`, `dist/renderer`; `pnpm preview` for preview mode.
- Packaging config lives in `electron-builder.yml` (read by electron-builder via package.json `build` field/extraResources); set `ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/` if downloads are slow.
- `pnpm lint` / `pnpm lint:fix` — run or auto-fix ESLint (Standard, TypeScript, Vue rules).
- `pnpm lint:dpdm` — fail fast on circular dependencies in `src/`.
- `pnpm gen-i18n` — regenerate typed locales after touching `public/i18n/*.yml`.

## Coding Style & Naming Conventions
Follow ESLint Standard defaults: two-space indentation, single quotes, trailing commas where allowed, and no stray semicolons. Author new modules in TypeScript. Keep renderer files browser-safe; route Node APIs through IPC helpers such as `src/main/events/picgoCoreIPC.ts`. Name Vue components in PascalCase (`UploadPanel.vue`) and use camelCase for utilities. Centralize IPC event names inside `src/universal/events/constants.ts`, and store enums/types under `src/universal/types/` so they stay reusable. Static assets are served from `public/` and resolved via `getStaticPath`/`getStaticFileUrl` (`src/universal/utils/staticPath.ts`); avoid using `__static` directly.
Static assets are served from `public/`. In the main process use `getStaticPath`/`getStaticFileUrl` (`src/universal/utils/staticPath.ts`). In the renderer, place assets under `public/` and resolve them via `import.meta.env.BASE_URL + filename` (helper: `src/renderer/utils/static.ts`); do not rely on `__static` in renderer code.
- Do not use `as any` under any circumstances; keep typings explicit and safe.

## Testing Guidelines
Place renderer unit specs in `test/unit/specs` with the `.spec.js` suffix; Karma picks them up via `require.context`. Run them with `npx karma start test/unit/karma.conf.js --single-run` and ensure new renderer folders are covered. Spectron e2e cases live in `test/e2e/specs`; build first (`pnpm build`), then run `npx mocha test/e2e/index.js` so Spectron can launch `dist/electron/main.js`. Document any test data, IPC stubs, or fixtures you add to keep suites reproducible.

## Commit & Pull Request Guidelines
Commits follow the PicGo conventional preset enforced by Husky (`pnpm lint:dpdm` + Commitlint). Stage your changes and run `pnpm cz` to craft messages that pass CI. Pull requests should explain the change, link related issues, and attach UI screenshots or recordings. Note how you validated the work (dev server, build, Karma, Spectron) and call out migration or configuration steps reviewers must perform.

## Internationalization Tips
Add locales by creating `public/i18n/<locale>.yml`, exposing its `LANG_DISPLAY_LABEL`, and registering it in `src/universal/i18n/index.ts`. After editing `public/i18n/*.yml`, run `pnpm gen-i18n` to regenerate TS typings and keep them in sync.

## Serena MCP & Context7 Tools
When starting work or if you hit issues, try checking MCP for Serena or Context7 tooling. If available, use those tools to navigate, edit, or fetch docs efficiently.
