# Nerdos

A unified, mobile-first study workspace that combines rich-text note-taking with spaced-repetition flashcards, built to evolve into an AI-assisted learning platform.

> **Project status:** Foundational architecture and MVP UI are in active development (`v0.1.0`).

## Product Preview

| Dashboard | Unified Library |
| :---: | :---: |
| ![Nerdos Dashboard](docs/images/dashboard_mvp.png) | ![Unified Study Library](docs/images/library_mvp.png) |
| **Plate Note Canvas** | **Notecard Set Manager** |
| ![Plate-powered note page](docs/images/notes_page_mvp.png) | ![Spaced-repetition card set](docs/images/card_set_mvp.png) |

## Why Nerdos

Students frequently split their study workflow across disconnected note editors and flashcard apps. That creates friction between capturing concepts and actively recalling them.

**Nerdos** brings notes, course folders, active recall, and review scheduling into one workspace so study material can move directly into review sessions. The planned AI features will integrate with a student's own learning material to make studying more time-efficient and effective.

## Current MVP

- **Dashboard:** due-review queue, recent work, pinned courses, daily streak, and mastery snapshot
- **Library:** nested course folders, notes, and notecard sets in one workspace
- **Plate note canvas:** rich text, slash commands, links, lists, code blocks, tables, and autosave
- **Notecard manager:** quick-add, search, edit, move, delete, and reset progress
- **Active recall:** standard flip and typed-answer modes with FSRS interval previews
- **Mobile-first UI:** responsive navigation and layouts designed from `375px` upward

The current web MVP uses an async repository backed by `localStorage`. This boundary is intentionally cloud-ready so the UI can move to the FastAPI API without duplicating state or rewriting feature components.

## Planned AI Learning Features

With the core application foundation currently being established, upcoming milestones will introduce embedded AI workflows designed to reinforce active learning rather than passive reading:

- **Automated flashcard generation:** convert structured notes and highlighted sections into spaced-repetition card decks.
- **Semantic note linking and concept search:** retrieve related concepts across personal notes while studying.
- **Socratic study companion:** provide context-aware prompts and explanation checks grounded in the student's own library.
- **Smart review prioritization:** combine learning context with spaced-repetition intervals to prioritize reviews.

AI assistance is a roadmap direction; it is not presented as a replacement for recall, practice, or a learner's own reasoning.

## Repository

```text
nerdos/
├── nerdos-web/   # React SPA: Vite, TypeScript, Tailwind CSS, shadcn/ui, Plate
├── nerdos-api/   # FastAPI modular monolith managed with uv
├── docs/         # Product screenshots and supporting documentation
└── .github/      # Repository guidance and dependency automation
```

## Architecture At A Glance

```mermaid
flowchart LR
    Browser["React SPA"] --> Local["Local repository + localStorage"]
    Browser -. future HTTP/SDK boundary .-> API["FastAPI modular monolith"]
    API --> Supabase["Supabase: Auth + Postgres + Storage"]
```

### Web

The frontend is organized by product feature rather than a flat component tree. See the [web technical README](nerdos-web/README.md), the [Library feature](nerdos-web/src/features/library), and the [Dashboard feature](nerdos-web/src/features/dashboard).

### API

The backend is the application wiring and integration boundary for Supabase-backed services. See the [API technical README](nerdos-api/README.md), the [FastAPI entrypoint](nerdos-api/src/main.py), and the intended [module boundary](nerdos-api/src/modules).

## Run Locally

```bash
git clone <repository-url>
cd nerdos
```

Start the web application:

```bash
cd nerdos-web
npm install
npm run dev
```

Start the API foundation:

```bash
cd nerdos-api
uv sync
uv run fastapi dev src/main.py
```

For prerequisites, environment-variable conventions, architecture rules, and troubleshooting, use the project-specific guides:

- [Web setup and technical guide](nerdos-web/README.md)
- [API setup and technical guide](nerdos-api/README.md)

## Engineering Direction

- Repository interfaces separate UI from persistence.
- Domain features remain isolated behind public service boundaries.
- The API is a modular monolith, not a collection of independent app instances.
- Secrets remain server-side; frontend configuration must be public-only.
- Mobile accessibility and predictable empty/error states are first-class requirements.

## Documentation

- [Repository instructions](.github/copilot-instructions.md)
- [Dependabot configuration](.github/dependabot.yml)
- [Product screenshots](docs/images)

## License

See [LICENSE](LICENSE).