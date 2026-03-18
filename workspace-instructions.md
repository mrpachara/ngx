# Workspace Instructions (for AI agents)

This repository is an Angular monorepo containing:

- A **library** package: `@mrpachara/ngx-oauth2-access-token` (with sub-packages such as `jwk`, `extractors`, `standard`, `utility`)
- A **demo app**: `projects/demo/` (used for live development and example usage)

These instructions are intended to help AI agents (and contributors) understand the high-level structure, conventions, and commands that are relevant when working in this codebase.

---

## Key Commands (run from the repo root)

- `npm start` — runs the demo app in dev mode (`ng serve`)
- `npm run build` — builds all projects (`ng build`)
- `npm run watch` — rebuilds in watch mode (`ng build --watch`)
- `npm test` — runs unit tests
- `npm run lint` — runs ESLint checks

> Tip: Most commands are powered by Angular CLI; see `angular.json` for per-project build/test configs.

---

## Repository Layout

- `angular.json` — defines apps/libraries, file replacements, and build configurations
- `tsconfig.json` — shared TypeScript settings and path mappings (used for local package imports)
- `projects/demo/` — Angular application used for manual testing and demos
- `projects/mrpachara/ngx-oauth2-access-token/` — main library package (published to npm)
  - Contains multiple entrypoints (sub-packages) each with their own `ng-package.json`

---

## Codebase Conventions

- **Standalone components** throughout (Angular v20+ defaults)
- **Signals** for component state (`signal()`, `computed()`) and avoid `mutate()`
- **Reactive forms** preferred over template-driven forms
- **OnPush** change detection in components
- **No `@HostBinding` / `@HostListener`**; use `host` in the decorator
- **No `ngClass` / `ngStyle`**; prefer `class` and `style` bindings
- **Avoid `any`**; use `unknown` when needed

---

## Where to Look First

- `projects/demo/src/app/` — demo app example patterns
- `projects/mrpachara/ngx-oauth2-access-token/src/` — library implementation
- `eslint.config.js` — linting rules and conventions
- `tsconfig.json` — strict TS settings and path aliases
- `angular.json` — build & file replacement config
