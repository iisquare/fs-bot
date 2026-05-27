# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`fs-bot` is an Electron desktop application built with Vue 3 and TypeScript. It was scaffolded from the `electron-vite` quick start template.

## Package Manager

This project uses **pnpm**. All scripts and install commands must use `pnpm`, not npm or yarn.

## Commands

| Command | Description |
|---------|-------------|
| `pnpm install` | Install dependencies |
| `pnpm dev` | Start development with HMR |
| `pnpm start` | Preview the built app |
| `pnpm build` | Typecheck and build for production |
| `pnpm format` | Format all files with Prettier |
| `pnpm lint` | Lint all files with ESLint (cached) |
| `pnpm typecheck` | Run both node and web typechecks |
| `pnpm typecheck:node` | Typecheck main + preload processes |
| `pnpm typecheck:web` | Typecheck renderer (Vue) process |
| `pnpm build:win` | Build Windows installer |
| `pnpm build:mac` | Build macOS app |
| `pnpm build:linux` | Build Linux packages |
| `pnpm build:unpack` | Build unpacked (no installer) |

## Architecture

The project follows the **electron-vite** three-part structure:

```
src/
  main/       → Electron main process (Node.js)
  preload/    → Preload script (context bridge)
  renderer/   → Vue 3 app (browser window)
```

### Main Process (`src/main/index.ts`)

Creates a single `BrowserWindow`, handles app lifecycle (ready, activate, window-all-closed), and opens external links in the OS browser. Uses `@electron-toolkit/utils` for `electronApp`, `optimizer` (DevTools shortcuts), and `is` (dev/prod detection). IPC listeners are registered here via `ipcMain`.

### Preload (`src/preload/index.ts`)

Exposes `@electron-toolkit/preload`'s `electronAPI` and a custom `api` object to the renderer via `contextBridge`. The type declarations in `src/preload/index.d.ts` augment the global `Window` interface.

When adding new IPC channels, expose them through the `api` object here and update the type declarations.

### Renderer (`src/renderer/src/`)

A Vue 3 app using Composition API (`<script setup lang="ts">`). The `@renderer` alias resolves to `src/renderer/src/`. Static assets with `?asset` suffix are resolved by electron-vite.

**Element Plus** is configured for on-demand import via `unplugin-vue-components` and `unplugin-auto-import`. Components and APIs (`ElMessage`, `ElNotification`) are auto-imported. Icons from `@element-plus/icons-vue` must be imported explicitly. Auto-generated `auto-imports.d.ts` / `components.d.ts` are committed.

Root component (`App.vue`) calls `user.initialize()` on mount (restores auth from localStorage) and wraps `<router-view />` in `<el-config-provider locale="zh-cn">`.

#### Router (`src/renderer/src/router/`)

Uses `createWebHashHistory` — `#/path` hash format for Electron's `file://` protocol.

- `config.ts` — Path constants (`page.home`, `page.login`, `page.e404`)
- `index.ts` — Route definitions and `beforeEach` guard

**Route guard** follows the fs-website pattern: only checks login state for `/user/*` routes. No RBAC or permission checking — unprotected pages render freely, `/user/` routes (except `/user/login`) redirect to login when `!user.isLogined()`.

#### Stores (`src/renderer/src/stores/`)

Pinia setup stores (Composition API):

- `counter.ts` — `useCounterStore`: app-level flags (`routing`, `fetching`, `count`)
- `user.ts` — `useUserStore`: identity with localStorage token persistence (`STORAGE_KEY = 'fs_auth_token'`). Key methods: `initialize()` (restore on app start), `reload()` (validate token with API), `reset(data, isReady)`, `isLogined()` (`id > 0 && token !== ''`), `visible` flag for login-dialog trigger on `90401` response.

#### API (`src/renderer/src/api/`)

Axios wrapper pattern (adapted from fs-website):

- `Api.ts` — Core: `request()` sets `baseURL` + `withCredentials: true` + `Authorization: Bearer <token>`. `fetch()` handles responses via `ApiUtil` (code/message/data extraction). Code `90401` sets `user.visible = true`. Exports `get()` / `post()`.
- `ApiUtil.ts` — Response helpers: `succeed()`, `code()`, `message()`, `data()`, `result()`
- `UserApi.ts` — Example module: `login()`, `logout()`, `info()` endpoints

### Build & Config

- **`electron.vite.config.ts`** — Defines Vite configurations for main, preload, and renderer. The renderer config includes the Vue plugin and `@renderer` path alias.
- **`tsconfig.json`** — Root config using TypeScript project references to `tsconfig.node.json` and `tsconfig.web.json`.
- **`tsconfig.node.json`** — Extends `@electron-toolkit/tsconfig` for the main/preload Node.js target.
- **`tsconfig.web.json`** — Extends `@electron-toolkit/tsconfig` for the renderer browser target.
- **`electron-builder.yml`** — Packaging config for Windows (NSIS), macOS (DMG), and Linux (AppImage/snap/deb).

### Environment Variables

electron-vite loads `.env` files via Vite's built-in mechanism. Variables prefixed with `VITE_` are available via `import.meta.env` in **all three processes** (main, preload, renderer).

| File | When loaded |
|------|-------------|
| `.env.development` | `pnpm dev` |
| `.env.production` | `pnpm build` |

Local overrides (`.env.local`, `.env.*.local`) are gitignored and loaded last — use these for per-machine settings.

### Code Style

- Prettier: 100 char width, single quotes, no semicolons, no trailing commas
- ESLint: extends `@electron-toolkit/eslint-config-ts` + `eslint-plugin-vue` (flat/recommended)
- Vue SFC blocks must use `<script lang="ts">`
- `vue/multi-word-component-names` and `vue/require-default-prop` are disabled
- Styles: **SCSS** — use `@use` for shared partials (`_base.scss`), nesting for parent-selector patterns. Vue SFC `<style lang="scss">` is supported.
