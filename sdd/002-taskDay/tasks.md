# Tasks: TaskDay — las tareas que he hecho hoy
Spec: `sdd/002-taskDay/spec.md` (Aprobada) · Plan: `sdd/002-taskDay/plan.md` (Aprobado) · Fecha: 2026-11-08

## Cómo leer este fichero

- **Formato:** `- [ ] T### [P] [Fase] Descripción (RF-xx) — archivo(s)`, seguido de una línea **Verifica** con el comando que da la tarea por terminada.
- **[P]:** se puede hacer en paralelo con las demás tareas [P] de su bloque.
- **Fases:** `[Base]` (extracción y ruta), `[H1]` (la historia HU-01) y `[Rob]` (cierre).
- **Dentro de la historia:** primero los tests, que **deben fallar** (rojo); después la implementación (verde).
- **Nombres de los tests:** citan su RF (`it('RF-01: …')`).
- **Comandos** (en Docker): `dce` = `docker compose -f docker-compose.dev.yml exec web`; `dre` = `docker compose -f docker-compose.dev.yml run --rm e2e`.
- **Requisito previo de las E2E:** `web` y TaskApiSDD (`http://localhost:3000`) levantadas.
- Los RF, CE y S son los de la spec 002; D-xx y R-xx, los del plan. `tasks/` abrevia `src/modules/tasks/`.
- **Dependencias:** ninguna nueva.

---

## Fase Base — Lista común y ruta

- [x] T001 [Base] Extraer `PagedTaskList` de `HistoryList` (D-2): modelo `PagedTasks`, estado vacío en `children`, `label` y `variant: 'dated' | 'plain'`. `HistoryList` pasa a usarlo sin cambiar lo que muestra. Test del componente con carga, error y «Reintentar», vacío, las dos variantes y paginación (RF-02, RF-04) — `tasks/types/paged-tasks.types.ts`, `tasks/components/paged-task-list.component.tsx`, `tasks/components/history-list.component.tsx`, `tasks/components/tests/paged-task-list.component.test.tsx`
  - Verifica: `dce pnpm test src/modules/tasks` en verde, incluidos los tests del historial sin tocar.
- [x] T002 [P] [Base] Constante de ruta `taskDay`, texto de navegación «Hecho hoy» y bloque `taskDay` de `tasks.texts.ts` (RF-03, RF-04, RF-08) — `src/shared/router/routes.constants.ts`, `src/shared/texts/navigation.texts.ts`, `tasks/texts/tasks.texts.ts`
  - Verifica: `dce pnpm typecheck`.

### Checkpoint Base
- `dce pnpm lint && dce pnpm typecheck && dce pnpm test` en verde.

---

## Fase H1 — Ver lo que he hecho hoy (HU-01, P1)

### Tests (deben fallar)
- [x] T003 [P] [H1] Tests de `useTaskDay`: pide las completadas con `from` = `to` = hoy y la página de la URL; estados de carga, error y listo; `totalItems`; al pasar la medianoche pide las del nuevo día; página fuera de rango → última (RF-01, RF-03, RF-07) — `tasks/hooks/tests/use-task-day.hook.test.ts`
- [x] T004 [P] [H1] Tests de `TaskDayPage`: título «Hecho hoy», lista «Tareas hechas hoy» sin casillas ni botones de acción, total «N tareas completadas hoy», estado vacío con «Ir al tablero» (RF-01 a RF-05) — `tasks/pages/tests/task-day.page.test.tsx`
- [x] T005 [P] [H1] Test de `MainNavigation`: «Hecho hoy» después de «Tablero», con enlace a `/taskday` y marcado activo en esa ruta (RF-08) — `src/shared/layout/tests/main-navigation.component.test.tsx`
- [x] T006 [P] [H1] E2E: solo las completadas de hoy (sin la pendiente de hoy ni la de mañana) y su total; estado vacío con enlace al tablero; sin acciones; completar en el tablero y abrir «Hecho hoy» la muestra sin recargar; acceso desde la navegación (RF-01 a RF-06, RF-08) — `e2e/pages/task-day.po.ts`, `e2e/specs/task-day.e2e.ts`, `e2e/specs/navigation.e2e.ts`
  - Verifica (rojo): `dce pnpm test -t "RF-0"` y `dre pnpm test:e2e e2e/specs/task-day.e2e.ts --project=chromium-desktop` fallan por falta de implementación.

### Implementación
- [x] T007 [H1] `useTaskDay` con `useCurrentDay`, `useUrlPage`, `useClampUrlPage` y `useGetTasksQuery` (RF-01, RF-03, RF-06, RF-07) — `tasks/hooks/use-task-day.hook.ts`
- [x] T008 [H1] `TaskDayPage` y su export en `index.ts` (RF-01 a RF-05) — `tasks/pages/task-day.page.tsx`, `tasks/index.ts`
- [x] T009 [H1] Ruta privada `/taskday` y acceso «Hecho hoy» en la navegación (RF-01, RF-08) — `src/shared/router/router.tsx`, `src/shared/layout/main-navigation.component.tsx`
  - Verifica (verde): T003–T006 pasan.

### Checkpoint H1
- `dce pnpm lint && dce pnpm typecheck && dce pnpm test` y `dre pnpm test:e2e e2e/specs/task-day.e2e.ts e2e/specs/navigation.e2e.ts` en verde.

---

## Fase Rob — Cierre

- [x] T010 [Rob] Responsive de «Hecho hoy» con tareas en los 6 proyectos (CE-03) — `e2e/specs/responsive.e2e.ts`
- [x] T011 [Rob] Suite completa: lint, typecheck, Jest con cobertura ≥ 80 % y E2E en Chromium y Firefox × 3 tamaños (CE-01 a CE-03)
- [x] T012 [Rob] README (*Funcionalidades* y *Estado del proyecto*) y spec → *Implementada* si cada RF tiene su test

## Registro de cambios

- **2026-11-08** — Creación de las tareas a partir del plan aprobado.
- **2026-11-08** — T001–T012 hechas. Lint, typecheck, Jest (711 tests, 99,9 % de líneas) y E2E de las specs nuevas y afectadas (126/126 en los 6 proyectos) en verde. En la suite completa, 725 de 726: falló una vez `fields-account.e2e.ts` (perfil, firefox-desktop), ajena a esta funcionalidad e intermitente (0 fallos en 60 repeticiones después).
