# Organizador de Torneo de Fútbol — PRD

## Original Problem Statement
Build a modern responsive React + Tailwind web app to organize a football tournament with 11 teams and 6 matchdays. Entire UI in Spanish. Manual team entry, draw screen with roulette animation, 6 matchday tables, auto-generate buttons, statistics, dark theme, FIFA/eSports look, framer-motion, lucide-react. Sounds + PDF/image export. MongoDB persistence.

## User Choices (2026-05-14)
- Persistence: **MongoDB**
- Sounds: **Synthetic Web Audio API**
- Visual theme: **Verde/césped fútbol clásico** (interpreted as dark theme with emerald/forest greens)
- Export: **PDF + Image** (html2canvas + jsPDF)

## Architecture
- Backend: FastAPI single endpoint trio (GET/PUT/DELETE `/api/tournament`) persisting one Tournament document in MongoDB (`tournaments` collection, fixed id `default-tournament`).
- Frontend: React 19 + Tailwind + shadcn/ui + framer-motion + lucide-react. State managed in `App.js`, auto-persisted to backend with 300ms debounce.
- Tournament algorithm: circle method (round-robin) with phantom BYE; backtracking pairing for per-matchday auto generation prioritising teams with fewest remaining valid opponents.

## Core Requirements (Static)
- Exactly 11 teams to start tournament.
- 6 matchdays, max 5 matches each + 1 resting team.
- No team faces the same opponent twice; canonical pair key.
- Each team plays at most 6 matches (math: 5 teams reach 6, 6 teams play 5 due to 30 total slots).
- Manual draw via roulette animation with valid opponents only.
- Sounds: tick, reveal, success, error (synthetic).
- Export full calendar to PDF or PNG.

## Implemented (2026-05-14)
- Backend Tournament model + persistence.
- TeamsSetup: validated team entry with shadcn Input + Button + AnimatePresence cards.
- Dashboard: matchday tabs, manual roulette draw, auto-matchday, auto-tournament, reset (AlertDialog), sound toggle, export dropdown (PDF/image).
- Roulette component: ~3-4s spin with ease-out ticks + reveal sound + success chord.
- MatchdayTable: 5 Partido slots + "Equipo que descansa" + completion indicator.
- StatsPanel: progress bar, rested teams chips, per-team match count + remaining opponents.
- Spanish UI 100%, dark emerald theme, Outfit + Manrope + JetBrains Mono fonts.

## Verified (testing agent iteration_1)
- Backend: 7/7 pytest pass.
- Frontend: 17/17 flows pass (full tournament 30/30 matches, manual roulette, reset, persistence, sound, export menu, stats, validation).

## Prioritized Backlog
- P1: Drag-and-drop reorder of matches within matchday.
- P1: Per-match score entry → standings table (PG/PE/PP/GF/GC/Pts).
- P2: Multiple concurrent tournaments (named workspaces).
- P2: Share link to public read-only calendar view.
- P2: Print-friendly stylesheet for hard-copy posting.
- P3: i18n toggle (Spanish default, English fallback).
- P3: Animated celebration overlay when full tournament generated.

## Next Tasks
- Await user feedback on first MVP screenshot.
- If approved → tackle P1 (score entry + standings) which unlocks "complete league" experience.
