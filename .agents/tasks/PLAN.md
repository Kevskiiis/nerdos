# Nerdos Web — Landing Page & Route Separation Plan

This plan introduces a **mobile-first, Quizlet-inspired landing page** (`src/features/landing/`) and **strict public vs. private route separation** in `nerdos-web`. Each sprint is tightly scoped so Codex CLI can execute it in a single fresh session with `shadcn` MCP and `Playwright` MCP without context drift.

## Global Engineering Rules (Apply to Every Sprint)

1. **Execute One Sprint Per Session:** Complete ONLY the requested sprint. Do not scaffold files for subsequent sprints.
2. **Create Directories Explicitly:** Never assume subfolders exist—create parent directories before writing files.
3. **Documentation:** Add a concise 1–2 sentence JSDoc comment (`/** ... */`) above every exported component, hook, and helper function.
4. **Strict Modular Isolation:**
   - All marketing UI and copy must live inside `src/features/landing/`.
   - `src/features/landing/` must **never** import from `src/features/dashboard/`, `src/features/library/`, or `src/features/settings/`.
   - Shared chrome (`PublicLayout.tsx`) lives in `src/components/layout/` alongside `AppLayout.tsx`.
5. **Mobile-First & Semantic Tokens Only:**
   - Design for `375px` mobile viewports first, then scale up with `sm:`, `md:`, and `lg:` breakpoints.
   - Use existing Tailwind/shadcn semantic tokens (`bg-background`, `bg-card`, `text-foreground`, `text-muted-foreground`, `bg-primary`, `border-border`). Never hardcode ad-hoc hex colors.
   - Ensure interactive elements meet a minimum `44px` tap target height on mobile.
6. **MCP Tooling Discipline:**
   - **shadcn MCP:** Always query/install primitives (`Button`, `Badge`, `Card`, `Separator`) from the `shadcn` registry before writing custom UI components.
   - **Playwright MCP:** Verify rendered output in a real headless browser across mobile (`375×812`), tablet (`768×1024`), and desktop (`1440×900`) viewports before completing UI sprints.
7. **Verification Gate:** Run `pnpm exec tsc --noEmit && pnpm run build` (and `pnpm test` if configured) with zero errors before committing.
8. **Progress Tracking & Git Hygiene:**
   - Mark completed tasks in the current sprint as `[x]` in `PLAN.md`.
   - Include `PLAN.md` in the sprint's **local git commit**. **Never run `git push`.**

---

## Sprint 1: Public Layout & Explicit Route Separation (Public vs. Guest-Only vs. Protected)

**Goal:** Establish a clean, scalable routing boundary in `src/app/` separating public marketing routes, guest-only auth routes, and protected app routes, and create the mobile-first `PublicLayout` shell with a `<Beta>` badge.

### Tasks
- [x] Use `shadcn` MCP to verify/install `button` and `badge` components in `src/components/ui/`.
- [x] Create `src/components/layout/PublicLayout.tsx`:
  - Render a sticky top header (`sticky top-0 z-40 border-b bg-background/95 backdrop-blur`) containing:
    - Left: Nerdos brand wordmark linking to `/` paired with a subtle `Beta` badge (`<Badge variant="secondary">Beta</Badge>`).
    - Right (auth-aware):
      - When **unauthenticated**: `Log in` link (`/login`) + primary `Get started` button (`/register`). Keep mobile nav clean with no bloated hamburger menu.
      - When **authenticated**: Single primary `Go to Dashboard` button (`/dashboard`).
  - Render `<main className="flex-1">` wrapping `<Outlet />` (or `children`).
  - Render a minimal, mobile-stacked footer with the Nerdos brand, a brief "Currently in Beta" notice, and copyright year.
- [x] Audit and organize route groups in `src/app/` (router configuration) into three explicit, non-overlapping boundaries:
  1. **Public Marketing Group** (No auth guard, uses `PublicLayout`):
     - `/` -> `LandingPage` (use a temporary placeholder component if `LandingPage` is not built yet, or wire directly in Sprint 2).
  2. **Guest-Only Auth Group** (`GuestOnlyRoute` redirecting authenticated users to `/dashboard`, uses minimal auth layout):
     - `/login`, `/register`, `/verify-email`, `/forgot-password`, `/reset-password`.
  3. **Protected App Group** (`ProtectedRoute` redirecting unauthenticated users to `/login`, uses `AppLayout`):
     - `/dashboard`, `/library/*`, `/settings`.
- [x] Verify that visiting `/` while unauthenticated does **not** trigger a redirect to `/login`, and visiting `/dashboard` while unauthenticated **does** redirect to `/login`.
- [x] Mark all Sprint 1 tasks as `[x]` in `PLAN.md`.

### Verification & Local Commit
```bash
pnpm exec tsc --noEmit && pnpm run build
git add PLAN.md src/components/layout/PublicLayout.tsx src/components/ui/ src/app/
git commit -m "feat(routing): add PublicLayout with beta badge and separate public, guest, and protected routes"
```

---

## Sprint 2: Landing Content Module & Mobile-First Hero Section (Interactive Flashcard Preview)

**Goal:** Centralize all landing page copy into a typed data module and build a high-impact, Quizlet-style mobile-first Hero section featuring an interactive, tappable sample Nerdos flashcard.

### Tasks
- [x] Create directories: `mkdir -p src/features/landing/components src/features/landing/lib src/features/landing/pages`.
- [x] Use `shadcn` MCP to verify/install `card` and `separator` components in `src/components/ui/`.
- [x] Create `src/features/landing/lib/landing-content.ts`:
  - Export strongly typed content objects so copy can be updated without editing JSX:
    - `HERO_CONTENT`: Beta pill text, punchy headline (e.g., *"Master what you study, faster."*), 1–2 sentence subheadline, primary CTA (`Start studying free` -> `/register`), secondary CTA (`Log in` -> `/login`), and a sample flashcard (`front` question + `back` answer + `hint` label).
    - `EXISTING_SERVICES`: Array of 4 MVP services matching actual `nerdos-web` features:
      1. **Structured Note Editor** (organized study notes built for clarity)
      2. **Flashcards & Study Library** (create, organize, and manage decks in one library)
      3. **Focused Study Modes** (active recall sessions designed to lock in material)
      4. **Study Dashboard** (track your decks and jump right back into your last session)
    - `COMING_SOON_SERVICES`: Array of 2 upcoming features explicitly flagged as `Coming Soon`:
      1. **AI Notes-to-Notecards** (turn your structured notes into study-ready flashcards automatically)
      2. **AI Tutor** (ask questions, test weak spots, and get guided explanations on your material)
    - `FINAL_CTA_CONTENT`: Closing headline, short beta pitch, and primary signup CTA.
- [x] Create `src/features/landing/components/HeroSection.tsx`:
  - Mobile-first vertical stack (`px-4 pt-10 pb-12` on mobile -> 2-column split `lg:grid-cols-2 lg:items-center lg:gap-12` on desktop).
  - Display a subtle `Beta` announcement pill, bold responsive headline (`text-4xl sm:text-5xl font-bold tracking-tight`), concise subheadline, and full-width mobile CTA button (`w-full sm:w-auto`) linking to `/register`.
  - Include a lightweight **interactive sample flashcard** (`Card` component with `button` semantics and `aria-pressed` state) that flips between Front (Question) and Back (Answer) on tap/click or `Enter`/`Space`, with a subtle `"Tap card to flip"` cue so visitors immediately experience the product.
- [x] Create `src/features/landing/pages/LandingPage.tsx` rendering `HeroSection` and wire it to `/` in `src/app/`.
- [x] Mark all Sprint 2 tasks as `[x]` in `PLAN.md`.

### Verification & Local Commit
```bash
pnpm exec tsc --noEmit && pnpm run build
git add PLAN.md src/features/landing/ src/components/ui/ src/app/
git commit -m "feat(landing): add landing content data module and mobile-first hero with interactive flashcard"
```

---

## Sprint 3: Existing Services Showcase, Coming Soon AI Section & Final CTA

**Goal:** Complete the advertising flow of the landing page by showcasing existing MVP services, teasing upcoming AI capabilities with clear `Coming Soon` badges, and closing with a high-contrast signup banner.

### Tasks
- [ ] Create `src/features/landing/components/ServicesSection.tsx`:
  - Render from `EXISTING_SERVICES` in `landing-content.ts`.
  - Section header: clear eyebrows/title (*"Everything you need to study smarter"*).
  - Mobile-first grid (`grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-6`).
  - Each `Card` includes a clean Lucide icon (`h-5 w-5 text-primary`), concise title, and 1–2 sentence description—scannable like Quizlet, no walls of text.
- [ ] Create `src/features/landing/components/ComingSoonSection.tsx`:
  - Render from `COMING_SOON_SERVICES` in `landing-content.ts`.
  - Visually distinct container (`bg-muted/40 border-y`) so visitors immediately distinguish upcoming features from live MVP features.
  - Display a prominent `<Badge variant="outline">Coming Soon</Badge>` on both **AI Notes-to-Notecards** and **AI Tutor** cards, with Lucide icons (`Sparkles` / `Bot`) and short, clear descriptions.
- [ ] Create `src/features/landing/components/CtaSection.tsx`:
  - High-contrast closing banner (`rounded-2xl border bg-card p-6 sm:p-10 text-center`) inviting students to join the Nerdos Beta.
  - Full-width primary `Button` on mobile (`w-full sm:w-auto`) linking to `/register`, plus a subtle note (*"Free during Beta • No credit card required"*).
- [ ] Assemble all sections inside `src/features/landing/pages/LandingPage.tsx` in order:
  1. `HeroSection`
  2. `ServicesSection`
  3. `ComingSoonSection`
  4. `CtaSection`
- [ ] Mark all Sprint 3 tasks as `[x]` in `PLAN.md`.

### Verification & Local Commit
```bash
pnpm exec tsc --noEmit && pnpm run build
git add PLAN.md src/features/landing/
git commit -m "feat(landing): add existing services showcase, coming soon AI section, and final CTA"
```

---

## Sprint 4: Playwright MCP Mobile-First Visual Audit, Accessibility & Polish

**Goal:** Use `Playwright` MCP to inspect the live rendered landing page across mobile, tablet, and desktop viewports, verify route isolation and interactive states, and fix any layout, spacing, or accessibility defects.

### Tasks
- [ ] Start the local `nerdos-web` dev server and open `/` using **Playwright MCP**.
- [ ] **Mobile-First Audit (`375×812`):**
  - Confirm **zero horizontal overflow** (`document.documentElement.scrollWidth <= window.innerWidth`).
  - Verify the sticky header (`Nerdos` + `Beta` badge + `Log in` / `Get started`) stays on a single clean row without wrapping or clipping.
  - Verify the Hero headline, primary CTA, and interactive sample flashcard fit cleanly above/near the fold with comfortable padding and `>= 44px` tap targets.
  - Click/tap the sample flashcard and confirm it flips to reveal the answer and flips back on a second tap.
- [ ] **Tablet (`768×1024`) & Desktop (`1440×900`) Audit:**
  - Verify `HeroSection` transitions cleanly to a 2-column layout on desktop.
  - Verify `ServicesSection` and `ComingSoonSection` align cleanly into 2-column grids with balanced card heights.
- [ ] **Navigation & Route Separation Check:**
  - Click `Get started` -> confirm navigation to `/register`.
  - Click `Log in` -> confirm navigation to `/login`.
  - Navigate to `/dashboard` while unauthenticated -> confirm redirect to `/login`.
- [ ] **Accessibility & Polish:**
  - Verify heading hierarchy (single `<h1>` in `HeroSection`, `<h2>` for section headings, `<h3>` for card titles).
  - Verify keyboard navigation (`Tab` through navbar links, CTA buttons, and `Enter`/`Space` to flip the sample flashcard) with visible focus rings.
  - Apply any spacing, contrast, or responsive fixes discovered during the Playwright audit.
- [ ] Mark all Sprint 4 tasks as `[x]` in `PLAN.md`.

### Verification & Local Commit
```bash
pnpm exec tsc --noEmit && pnpm run build
git add PLAN.md src/features/landing/ src/components/layout/PublicLayout.tsx
git commit -m "polish(landing): verify mobile-first responsiveness, accessibility, and route guards via Playwright"
```