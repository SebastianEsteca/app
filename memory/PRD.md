# Copa ESTECA 2026 — Plataforma Multi-Torneo (PRD)

## Original Problem Statement
Tournament management platform 100% in Spanish (Copa ESTECA 2026). Multi-tournament + dynamic config + Modo Espectador + advanced flexible scheduling engine + admin PIN gate + bracket + scoring/standings + shareable QR.

## User Choices Across Phases
- Persistencia: MongoDB
- Paleta combinada: azul oscuro / naranja / dorado / verde acento
- Auth: PIN del torneo (4 dígitos)
- Match editing: incluido
- Bracket: completo (Octavos→Cuartos→Semis→Final con champion)
- QR: incluido vía qrcode.react

## Architecture
- Backend: FastAPI + MongoDB (`tournaments_v2`). Endpoints:
  - GET/POST /api/tournaments, GET/PUT/DELETE /api/tournaments/{id}
  - GET /api/public/tournaments/{id} (admin_pin stripped)
  - POST /api/tournaments/{id}/verify-pin
- Frontend: React 19 + Tailwind + shadcn/ui + framer-motion + lucide-react + recharts + qrcode.react + html2canvas/jspdf.
- Routing: /v/:id (espectador sin sidebar) + /, /crear, /creditos, /t/:id/{sorteo|jornadas|tabla|eliminacion|estadisticas}
- Admin gate: AppLayout checks tournament.admin_pin + sessionStorage → triggers PinPrompt; closing → redirect a viewer.

## Algoritmos
- **`tournamentAlgorithm.js`**: `generateBalancedTournament` garantiza partidos iguales por equipo. Round-robin base + scheduling con prioridades (1) equipos con menor PJ; (2) sin repetidos; (3) sin dobles; (4) descansos balanceados; (5) min extras. Crea "Jornada Extra" automáticamente si hace falta. Flags configurables: `allow_double_matches`, `allow_extra_matchdays`, `allow_repeated_opponents`, `balance_level`.
- **`standings.js`**: PJ/PG/PE/PP/GF/GC/DG/Pts (3-1-0) calculado en vivo desde matches con `status='finished'`.
- **`bracket.js`**: snap a tamaño 2/4/8/16/32; pairings 1-N, 2-(N-1)...; propagación automática de ganadores.

## Phase 1 (2026-05-14) — DONE
Inicio, Crear, Sorteo (con ruleta), Jornadas (visualización), Tabla básica (sin goles), Créditos, AppLayout con sidebar, persistencia MongoDB.

## Phase 2 (2026-05-14) — DONE
- Motor de scheduling flexible con jornadas extra/dobles configurable
- Edición de marcador / fecha / hora / estado por partido (admin only)
- Standings con goles, puntos, DG (3-1-0)
- Bracket eliminación dinámico (Cuartos/Semis/Final) con champion banner
- Estadísticas con gráficos Recharts (GF/GC, puntos, KPIs)
- **Modo Espectador** `/v/:id` con tabs (Inicio/Jornadas/Tabla/Eliminación), 100% read-only
- **Compartir torneo** modal con URL pública + QR
- **PIN gate** (sessionStorage)
- SummaryPanel en Sorteo (balance %, partidos requeridos vs programados, equipos pendientes)
- Indicadores visuales: "Jornada Extra", "Doble jornada"
- A11y: DialogDescription added; toasts moved bottom-right to avoid toolbar overlap

## Tested (iteration_4, 2026-05-14)
- Backend: 23/23 pytest (11 Phase 2 + 12 Phase 1 regression)
- Frontend: PIN gate, viewer page, share modal con QR, nuevos campos de Crear torneo, todos los flujos previos pasan.

## Backlog Phase 3 (P1 → P3)
- P2: Import/Export JSON del torneo completo
- P2: Drag-and-drop reordenar partidos dentro de jornada
- P2: Bracket "tercer puesto" opcional
- P3: Notificaciones en vivo (websocket o polling) para actualizaciones del espectador
- P3: Modo presentación pantalla completa para sorteo en vivo
- P3: Tema light/dark toggle
- P3: Exportar bracket / tabla individual a PDF/PNG

## Próximas tareas
1. Esperar feedback del usuario sobre Fase 2.
2. Si solicita Phase 3, priorizar Import/Export JSON (1 jornada de trabajo) y modo presentación pantalla completa (gran impacto en uso real para el día del sorteo).
