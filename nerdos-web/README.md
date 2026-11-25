# Nerdos Web

Mobile-first React single-page application for the Nerdos study workspace.

This guide covers frontend setup, architecture, development workflow, and troubleshooting. For the product overview, see the [root README](../README.md). For backend setup and API boundaries, see the [API README](../nerdos-api/README.md).

## Tech Stack

- React 19, TypeScript, and Vite
- React Router for application routes
- TanStack React Query for async repository state
- Tailwind CSS 4 and shadcn/ui
- Plate rich-text editor
- `ts-fsrs` for deterministic spaced-repetition scheduling
- Lucide icons

## Prerequisites

- Node.js compatible with the Vite version in [`package.json`](package.json)
- npm

Check the installed tools:

```bash
node --version
npm --version
```

## Install And Run

```bash
cd nerdos-web
npm install
npm run dev
```

Vite prints the local development URL. The app currently uses local mock data, so no API server or Supabase account is required for the MVP UI.

## Available Scripts

```bash
npm run dev        # Start the Vite development server
npm run build      # Type-check and create a production build
npm run lint       # Run ESLint
npm run typecheck  # Run the TypeScript typecheck
npm run preview    # Preview the production build
npm run format     # Format TypeScript files with Prettier
```

Before finishing a frontend change, run:

```bash
npm run lint
npm run build
```

## Application Routes

The route composition lives in [`src/app/router.tsx`](src/app/router.tsx).

- `/dashboard` - daily review queue and study launchpad
- `/dashboard/review` - interleaved due-card review session
- `/library` - folders and unfiled quick items
- `/library/:folderId` - nested folder workspace
- `/library/notes/:noteId` - Plate note canvas
- `/library/cards/:setId` - card-set manager and study stage
- `/settings` - application settings

## Project Structure

```text
src/
├── app/              # Router and global providers
├── components/
│   ├── auth/         # Route protection boundary
│   ├── layout/       # Sidebar, shell, top bar, dialogs
│   └── ui/           # shadcn/ui primitives
├── config/           # Typed navigation configuration
├── features/
│   ├── dashboard/    # Aggregation selectors and launchpad UI
│   ├── library/      # Notes, folders, cards, repositories, and study engine
│   └── settings/
├── hooks/            # Shared browser and persistence hooks
└── lib/              # Shared utilities
```

## Feature Boundaries

### Application Shell

[`src/app/providers.tsx`](src/app/providers.tsx) owns global React Query, tooltip, and sidebar providers. [`src/components/layout/AppShell.tsx`](src/components/layout/AppShell.tsx) is the single sidebar and `<SidebarInset>` layout boundary.

### Dashboard

[`src/features/dashboard`](src/features/dashboard) derives its metrics from the Library repository queries. It does not own a separate copy of folders, pages, card sets, or reviews.

The pure aggregation boundary is [`src/features/dashboard/lib/aggregate.ts`](src/features/dashboard/lib/aggregate.ts). Page-level composition is in [`src/features/dashboard/pages/DashboardPage.tsx`](src/features/dashboard/pages/DashboardPage.tsx).

### Library Domain

[`src/features/library`](src/features/library) contains:

- `types.ts` - cloud-ready domain models
- `api/library-repository.ts` - async repository contract
- `api/local-library-repository.ts` - localStorage implementation
- `api/seed.ts` - realistic deterministic demo data
- `hooks/` - React Query and local interaction state
- `components/` - small, declarative feature components
- `pages/` - route-level composition

Use the repository contract rather than reading or writing storage directly from UI components.

### Notes And Plate

The note route is [`src/features/library/pages/NotePage.tsx`](src/features/library/pages/NotePage.tsx). Its Plate setup is isolated under [`src/features/library/components/editor`](src/features/library/components/editor), including the slash-command menu.

The autosave hook stores local draft state and debounces repository updates. A future draw block should register through the editor's extension seam; Excalidraw is intentionally out of scope.

### Notecards And FSRS

The set route is [`src/features/library/pages/CardSetPage.tsx`](src/features/library/pages/CardSetPage.tsx). The UI never implements FSRS math directly.

Scheduling lives in [`src/features/library/lib/scheduler.ts`](src/features/library/lib/scheduler.ts), while queue/retry behavior lives in [`src/features/library/lib/study-session.ts`](src/features/library/lib/study-session.ts). Persistence remains in the Library repository, and review logs update dashboard activity from the same source of truth.

## Data Persistence

The current local store is versioned as `nerdos:library:v2`. It contains folders, pages, card sets, cards, review logs, and daily study activity.

To reset the demo data in a browser, remove that key from localStorage and reload. This is useful while iterating on seed structure or reviewing migrations.

When connecting the API, replace the implementation selected in [`src/features/library/api/index.ts`](src/features/library/api/index.ts) with an HTTP-backed repository. UI components and route pages should continue depending on the repository interface.

## UI Conventions

- Prefer semantic tokens such as `bg-background`, `bg-card`, `text-foreground`, and `border-border`.
- Use existing shadcn/ui primitives from [`src/components/ui`](src/components/ui) before creating custom controls.
- Keep new layouts mobile-first and verify them at `375px` before larger breakpoints.
- Use `min-h-11` touch targets on mobile and `md:`-scoped smaller desktop controls where appropriate.
- Keep route pages declarative; move persistence and aggregation into hooks and pure libraries.
- Avoid `any`; model missing IDs, empty collections, loading, and errors explicitly.

## Environment Variables

Do not put secrets in the frontend. Only public browser configuration may use Vite's public environment prefix.

Use `.env.example` as the committed template. Never commit `.env` or contain backend service-role credentials in web code. The root [`.gitignore`](../.gitignore) enforces this boundary.

## Troubleshooting

### The app shows old or incompatible demo data

Clear the `nerdos:library:v2` localStorage key and reload. The repository will recreate the latest seed.

### Vite cannot resolve a dependency

Reinstall from the lockfile and restart the dev server:

```bash
rm -rf node_modules
npm install
```

### TypeScript passes but the UI is stale

Restart Vite after dependency or route-structure changes. If an HMR session still references a deleted module, perform a full browser reload.

### Plate selection or slash-command behavior is unexpected

Keep slash UI and editor control inside the existing Plate boundaries. Native input elements must not be mounted inside Slate void/content-editable subtrees.

### A new route redirects to the dashboard

Check both the route declaration in [`src/app/router.tsx`](src/app/router.tsx) and the canonical helpers in [`src/features/library/routes.ts`](src/features/library/routes.ts).

## Related Documentation

- [Product and monorepo overview](../README.md)
- [API technical guide](../nerdos-api/README.md)
- [Repository instructions](../.github/copilot-instructions.md)