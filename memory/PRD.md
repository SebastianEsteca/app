# Copa ESTECA 2026 — Plataforma Multi-Torneo (PRD)

## Original Problem Statement
Update and improve existing React + Tailwind tournament app into dynamic multi-tournament platform with configurable settings, all in Spanish. Brand: "Copa ESTECA 2026". Required modules: Inicio, Sorteo, Jornadas y partidos, Tabla general, Eliminación directa, Estadísticas, Créditos. Crear torneo with: nombre, cantidad equipos, jornadas, clasifican, tipo (Liga / Liga+KO / KO), partidos por equipo, descansos automáticos, generación automática, logo principal + secundario. Teams with colors, logo, abreviatura. PDF/Image export. Dark mode FIFA/eSports aesthetic with neon glow, animated gradients.

## User Choices (2026-05-14 Phase 2)
- Persistencia: **MongoDB** (mantener)
- Logos: **Provistos por el usuario** (Copa ESTECA 2026 + ESTECA-PC)
- Paleta: **Combinada** — azul oscuro + naranja + dorado + blanco + negro, con verde como acento secundario
- Alcance: **Fase 1 ahora**, Fase 2 después

## Architecture
- Backend: FastAPI + MongoDB. Collection `tournaments_v2`. Endpoints `/api/tournaments`, `/api/tournaments/{id}` (GET list, POST create, GET one, PUT update, DELETE remove). Auto-summary computed (teams_registered, current_matchday, progress).
- Frontend: React 19 + Tailwind + shadcn/ui + framer-motion + lucide-react + html2canvas + jsPDF. React Router v7 with `AppLayout` (sidebar) + nested routes. Tournament context loaded per `:id`.
- Algoritmo: round-robin (método del círculo) genérico, con backtracking para per-matchday y descansos automáticos para conteos impares.

## Implemented Modules (Phase 1 — completado 2026-05-14)
1. **Inicio**: dashboard con cards de todos los torneos (logo, progreso, equipos, jornada actual), búsqueda, hero "Copa ESTECA 2026", AlertDialog de eliminación.
2. **Crear torneo**: formulario con 4 secciones (información general, numérica, reglas, identidad visual). Upload de logos (base64).
3. **Sorteo**: registro de equipos (nombre, abreviatura, color, logo), sorteo manual con ruleta animada (bug del rival visualizado-vs-real ARREGLADO), generación de jornada y torneo completo, reset con AlertDialog, sound toggle, export PDF/imagen, matchday tabs con indicador de completitud.
4. **Jornadas y partidos**: visualización detallada por jornada con badges de estado (Pendiente/En curso/Finalizado).
5. **Tabla general**: ranking dinámico, zona de clasificación destacada (top N).
6. **Créditos**: tarjetas animadas para Sebastián Reyes, Ana Girón, Herbeth Ruano, Estuardo del Cid + branding ESTECA-PC.

## Deferred (Phase 2)
- **Eliminación directa**: bracket dinámico (Octavos, Cuartos, Semifinal, Final) basado en tabla general; emparejamientos 1ro vs último, 2do vs penúltimo, etc.
- **Estadísticas**: gráficos con Recharts (goles, mejor ataque/defensa, top teams, progress).
- **Edición de partido**: fecha, hora, resultado, estado.
- **Import/Export JSON** del torneo completo.

## Verified (testing iteration_3, 2026-05-14)
- Backend pytest: **12/12 pasando**.
- Frontend regresiones de iter_2 (Jornadas/Tabla/Inicio stale state): **arregladas**.
- 100% de flujos previos siguen funcionando.

## Backlog Phase 2 (P1 → P3)
- P1: Bracket de eliminación directa con generación automática y animación
- P1: Edición fecha/hora/resultado/estado por partido + recálculo automático de tabla con goles
- P1: Gráficos Recharts en Estadísticas
- P2: Import/Export JSON de torneo completo
- P2: Standings con PG/PE/PP/GF/GC/DG/Pts
- P3: Búsqueda y filtros avanzados en jornadas
- P3: Cambio de tema light/dark
- P3: Sonido de celebración personalizado al completar jornada

## Próximas tareas inmediatas
1. Esperar feedback del usuario sobre Phase 1.
2. Si aprueba, comenzar Fase 2 priorizando: edición de partidos (resultado/fecha/hora) → recalcular Tabla con goles → bracket de eliminación.
