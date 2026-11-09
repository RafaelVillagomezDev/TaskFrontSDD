# Tasks: Pomodoro task session — sesiones de concentración con una lista de tareas
Spec: `sdd/003-pomodoro-task-session/spec.md` (Aprobada) · Plan: `sdd/003-pomodoro-task-session/plan.md` (Aprobado) · Fecha: 2026-11-09

## Cómo leer este fichero

- **Formato:** `- [ ] T### [P] [Fase] Descripción (RF-xx) — archivo(s)`. Cada tarea va seguida de una línea **Verifica** con el comando que la da por terminada, salvo dentro de un bloque de tests o de implementación de una historia: ahí la línea **Verifica** de la última tarea del bloque vale para todo el bloque (rojo en los tests, verde en la implementación).
- **[P]:** se puede hacer en paralelo con las demás tareas [P] de su bloque.
- **Fases:**
  - `[Base]`: lo que necesitan las dos fases.
  - `[H1]` a `[H5]`: Fase 1, P1 (HU-01 a HU-05).
  - `[H6]` y `[H7]`: Fase 2, P2 (HU-06 y HU-07).
  - `[Rob]`: cierre.
- **Dentro de cada historia:** primero los tests, que **deben fallar** (rojo); después la implementación (verde).
- **Nombres de los tests:** citan su RF (`it('RF-15: …')`).
- **Comandos** (en Docker): `dce` = `docker compose -f docker-compose.dev.yml exec web`; `dre` = `docker compose -f docker-compose.dev.yml run --rm e2e`.
- **Requisito previo de las E2E:** `web` y TaskApiSDD (`http://localhost:3000`) levantadas, con la API-004 desplegada: `GET /pomodoros` responde `200` con una sesión iniciada (R-8).
- **E2E del pomodoro:** en paralelo, con una cuenta nueva por test (`freshAccount`) y la sesión iniciada por API (D-13 a D-15). Solo un test espera una sesión real de 1 minuto (R-4); el resto termina las sesiones a mano o prepara los datos por API.
- Los RF, CE y S son los de la spec 003; D-xx y R-xx, los del plan. `pomodoro/` abrevia `src/modules/pomodoro/`.
- **Dependencias:** ninguna nueva.

---

## Fase Base — Infraestructura común

- [x] T001 [P] [Base] Cabeceras `X-Client-Time` y `X-Timezone` en `/pomodoros`, `/pomodoro-tasks`, `/pomodoro-streak` y `/pomodoro-achievements`. El test incluye `/pomodoro-tasks/{id}` y comprueba que `/pomodoro` (sin s) no coincide por accidente (RF-01) — `src/shared/api/session-base-query.ts`, `src/shared/api/tests/session-base-query.test.ts`
  - Verifica: `dce pnpm test src/shared/api`.
- [x] T002 [P] [Base] Los 8 códigos de error de API-004 en `ApiErrorCode` y `API_ERROR_CODES`, con su mensaje en español (RF-50) — `src/shared/api/api-error.util.ts`, `src/shared/texts/errors.texts.ts`, `src/shared/api/tests/api-error.util.test.ts`
  - Verifica: `dce pnpm test src/shared/api`.
- [x] T003 [P] [Base] Etiquetas `Pomodoro`, `PomodoroTask`, `PomodoroStreak` y `PomodoroAchievement`; esquemas `pomodoroSchema`, `pomodoroTaskSchema`, `achievementSchema` y sus páginas; `pomodoro.constants.ts`. Tests de los esquemas con los tres estados, `endReason` y nulos (RF-14 de API-004) — `src/shared/api/base.api.ts`, `pomodoro/schemas/pomodoro.schema.ts`, `pomodoro/schemas/pomodoro.constants.ts`, `pomodoro/schemas/tests/pomodoro.schema.test.ts`
  - Verifica: `dce pnpm test src/modules/pomodoro/schemas`.
- [x] T004 [Base] `pomodoro.api.ts` con los 9 endpoints de la Fase 1 (plan §4.1): validación con Zod, etiquetas e invalidación tras los rechazos de estado. Tests con servidor simulado (RF-03, RF-14, RF-17, RF-22 a RF-26, RF-29, RF-30, RF-32, RF-33, RF-35, RF-46, RF-48) — `pomodoro/api/pomodoro.api.ts`, `pomodoro/api/tests/pomodoro.api.test.ts`
  - Verifica: `dce pnpm test src/modules/pomodoro/api`.
- [x] T005 [P] [Base] Exportar `createTaskFormSchema` y los límites de los campos desde el `index.ts` de `tasks` (D-9) — `src/modules/tasks/index.ts`
  - Verifica: `dce pnpm typecheck`.
- [x] T006 [P] [Base] `NavItem` con `matchSubroutes`: activo en las subrutas; sin la prop, igual que ahora (RF-02, D-8) — `src/shared/layout/nav-item.component.tsx`, `src/shared/layout/tests/nav-item.component.test.tsx`
  - Verifica: `dce pnpm test src/shared/layout`.
- [x] T007 [P] [Base] Compound `SubNavigation` y `SubNavigation.Link`: enlaces en fila, `aria-current` en el activo, objetivos de 44 px y scroll horizontal propio si no caben (RF-51, D-7) — `src/shared/layout/sub-navigation.component.tsx`, `src/shared/layout/tests/sub-navigation.component.test.tsx`
  - Verifica: `dce pnpm test src/shared/layout`.
- [x] T008 [Base] Rutas del pomodoro en `ROUTES`, texto «Pomodoro», `NavItem` con el icono `Timer` después de «Hecho hoy», `PomodoroLayout` (cabecera + `SubNavigation` con «Sesión» + `Outlet`), `pomodoro.texts.ts` e `index.ts` del módulo. Tests de `MainNavigation` y del layout (RF-02, RF-51) — `src/shared/router/routes.constants.ts`, `src/shared/texts/navigation.texts.ts`, `src/shared/layout/main-navigation.component.tsx`, `pomodoro/layouts/pomodoro.layout.tsx`, `pomodoro/texts/pomodoro.texts.ts`, `pomodoro/index.ts`, `pomodoro/layouts/tests/pomodoro.layout.test.tsx` y los tests de `MainNavigation`
  - Verifica: `dce pnpm test src/shared/layout src/modules/pomodoro`.

- [x] T009 [P] [Base] `loginInPage(page, account)` con `page.request` y fixture `signedInPage` (cuenta de `freshAccount` con la sesión iniciada por API). Comprobar en Chromium y Firefox que la cookie `Secure` se guarda en `localhost`; si Firefox no la guarda, `signedInPage` entra por la interfaz solo en Firefox (D-15, R-6, R-8, R-9). Comprobar además que `GET /pomodoros` responde `200` (R-8) y que borrar una cuenta con una sesión activa borra también la sesión (R-9); si no, se abre el fallo en TaskApiSDD — `e2e/fixtures/api-client.ts`, `e2e/fixtures/session.fixture.ts`
  - Verifica: `dre pnpm test:e2e e2e/specs/smoke.e2e.ts --project=chromium-desktop --project=firefox-desktop` con un test que use `signedInPage`.
- [x] T010 [Base] `board` de `tasks.fixture.ts` pasa a usar `signedInPage`; los tests de login (`login.e2e.ts`, `fields-auth.e2e.ts`) siguen entrando por la interfaz (D-15) — `e2e/fixtures/tasks.fixture.ts`
  - Verifica: suite E2E existente en verde en los 6 proyectos **sin modificar ningún test** (R-11), con el tiempo total anotado antes y después.
- [x] T011 [Base] `fullyParallel: true` en Playwright. Si aparecen fallos intermitentes por carga en la API, limitar `workers` (D-14, R-7) — `playwright.config.ts`
  - Verifica: `dre pnpm test:e2e` en verde dos veces seguidas, con el tiempo total anotado en el registro de cambios.

### Checkpoint Base
- `dce pnpm lint && dce pnpm typecheck && dce pnpm test` en verde, sin cambios de comportamiento en las pantallas existentes.
- `GET /pomodoros` de la API local responde `200` (R-8) y la suite E2E existente pasa en paralelo (T010, T011).

---

# Fase 1 — P1

## H1 — Empezar una sesión con una lista de tareas (HU-01)

### Tests (deben fallar)
- [x] T012 [P] [H1] Tests de `createStartSessionSchema`: presets 15, 25, 45 y 60; «Otra» con 1 y 120 válidos y con 0, 121, 25,5 y vacío no válidos; «Otra» no se valida con un preset elegido; título vacío, de solo espacios y de 201 caracteres; descripción de 1001; fecha de ayer; 0 tareas válido y 21 no válido (RF-06 a RF-11, RF-13, RF-55, RF-56) — `pomodoro/schemas/tests/start-session.schema.test.ts`
- [x] T013 [P] [H1] Tests de `useActiveSession`: sin sesiones → formulario; primera `running` o `paused` → sesión activa; primera `finished` → formulario (RF-03 a RF-05) — `pomodoro/hooks/tests/use-active-session.hook.test.tsx`
- [x] T014 [P] [H1] Tests de `useStartSessionForm`: 25 por defecto; envía `durationMinutes`, `newTasks` (descripción vacía → `null`) y `waitingTaskIds`; añadir y quitar filas; no ofrece añadir al llegar a 20; `DAY_CLOSED` y `POMODORO_TASK_NOT_FOUND` conservan lo escrito; `POMODORO_ALREADY_ACTIVE` lleva a la sesión activa; sin doble envío (RF-06 a RF-14, RF-46, RF-47) — `pomodoro/hooks/tests/use-start-session-form.hook.test.tsx`
- [x] T015 [P] [H1] Tests de `DurationPicker`, `NewTaskFields` y `StartSessionForm`: radios con `legend`, «Otra» muestra el campo, errores bajo cada campo, fecha de hoy propuesta y uso solo con teclado (RF-06 a RF-13, RF-55, RF-56) — `pomodoro/components/tests/duration-picker.component.test.tsx`, `pomodoro/components/tests/new-task-fields.component.test.tsx`, `pomodoro/components/tests/start-session-form.component.test.tsx`; apoyo de los tests del módulo: `pomodoro/tests/pomodoro.fixtures.ts` (datos de la API) y `pomodoro/tests/start-form.harness.tsx` (formulario montado con React Hook Form)
- [x] T016 [H1] Fixture `pomodoro` (`signedInPage` en `/pomodoro`, cuenta propia por test, D-13), métodos del pomodoro en el cliente de la API, page object y E2E. En `pomodoro-session.e2e.ts`: empezar sin tareas y con dos, y ver la cuenta atrás y las tareas. En `fields-pomodoro.e2e.ts`: duración «Otra», título, descripción y fecha de las tareas nuevas, cada una con valor válido, cada regla con su mensaje y solo teclado (RF-03 a RF-14, RF-55, RF-56) — `e2e/fixtures/pomodoro.fixture.ts`, `e2e/fixtures/api-client.ts`, `e2e/pages/pomodoro.po.ts`, `e2e/specs/pomodoro-session.e2e.ts`, `e2e/specs/fields-pomodoro.e2e.ts`
  - Verifica (rojo): `dce pnpm test src/modules/pomodoro` y `dre pnpm test:e2e e2e/specs/pomodoro-session.e2e.ts --project=chromium-desktop` fallan por falta de implementación.

### Implementación
- [x] T017 [H1] `createStartSessionSchema` sobre `createSessionTasksSchema`, con `duration` + `customMinutes` validado en `superRefine` (plan §4.5), `durationMinutesOf` y las reglas de `@modules/tasks` (RF-06 a RF-13, RF-55, RF-56) — `pomodoro/schemas/start-session.schema.ts`
- [x] T018 [H1] `useActiveSession`, `useStartSessionForm` y `useNewTaskRows` (filas de tareas nuevas, compartido con el formulario de añadir) (RF-03 a RF-14, RF-46, RF-47) — `pomodoro/hooks/use-active-session.hook.ts`, `pomodoro/hooks/use-start-session-form.hook.ts`, `pomodoro/hooks/use-new-task-rows.hook.ts`
- [x] T019 [H1] `DurationPicker`, `NewTaskFields` y `StartSessionForm` (RF-04, RF-06 a RF-13, RF-55, RF-56) — `pomodoro/components/duration-picker.component.tsx`, `pomodoro/components/new-task-fields.component.tsx`, `pomodoro/components/start-session-form.component.tsx`
- [x] T020 [H1] `PomodoroSessionPage` (formulario o, provisionalmente, la sesión activa con su lista), su hook `usePomodoroSessionPage` (vista, temporizador, acciones, formularios y tareas en espera de la página) y ruta `/pomodoro` bajo `PomodoroLayout`, con sus tests (RF-04, RF-05, RF-52) — `pomodoro/pages/pomodoro-session.page.tsx`, `pomodoro/hooks/use-pomodoro-session-page.hook.ts`, `pomodoro/pages/tests/pomodoro-session.page.test.tsx`, `pomodoro/hooks/tests/use-pomodoro-session-page.hook.test.tsx`, `pomodoro/index.ts`, `src/shared/router/router.tsx`
  - Verifica (verde): T012–T016 pasan.

### Checkpoint H1
- `dce pnpm lint && dce pnpm typecheck && dce pnpm test` y `dre pnpm test:e2e e2e/specs/pomodoro-session.e2e.ts e2e/specs/fields-pomodoro.e2e.ts --project=chromium-desktop` en verde.

---

## H2 — Seguir la sesión en curso (HU-02)

### Tests (deben fallar)
- [x] T021 [P] [H2] Tests de `useCountdown` con `jest.useFakeTimers()` y `performance.now` simulado: cuenta desde `remainingSeconds`; no depende de `Date`; valor exacto tras un salto de tiempo (segundo plano); detenida en pausa; nunca negativa; `clearInterval` al desmontar y al pasar a pausa; datos nuevos reinician la referencia (RF-15, RF-16, RNF-01) — `pomodoro/hooks/tests/use-countdown.hook.test.ts`
- [x] T022 [P] [H2] Tests de `useSessionEnd`: a cero consulta la sesión; si sigue activa, un solo reintento a los 1000 ms; `clearTimeout` si se desmonta antes del reintento; sin consulta en pausa (RF-17, RF-18) — `pomodoro/hooks/tests/use-session-end.hook.test.ts`
- [x] T023 [P] [H2] Tests de `useEndSound` con `AudioContext` simulado: suena a cero; no suena silenciado; con el contexto `suspended` o sin él, no suena ni lanza error; `close()` al desmontar (RF-19, RF-61, RF-62) — `pomodoro/hooks/tests/use-end-sound.hook.test.ts`
- [x] T024 [P] [H2] Tests de `usePomodoroTitle`: `12:34 · Pomodoro` en curso, `En pausa 12:34 · Pomodoro` en pausa, `¡Sesión terminada! · Pomodoro` al terminar hasta `visibilitychange` visible; restaura el título al desmontar; `removeEventListener` en la limpieza (RF-57 a RF-60) — `pomodoro/hooks/tests/use-pomodoro-title.hook.test.ts`
- [x] T025 [P] [H2] Tests de `useCountdownAnnouncer`: anuncia 5 min y 1 min al cruzarlos; no los anuncia en sesiones de 3 y 1 minutos ni al reanudar por debajo; anuncia el fin; cambios rápidos de pausa y reanudación sin anuncios duplicados. Tests de `useSessionTimer`: une la cuenta atrás con sus avisos y, tras recargar con `?result`, no suena, no cambia el título ni anuncia (RF-15 a RF-19, RF-57 a RF-66, RNF-02) — `pomodoro/hooks/tests/use-countdown-announcer.hook.test.ts`, `pomodoro/hooks/tests/use-session-timer.hook.test.ts`
- [x] T026 [P] [H2] Tests de `useSessionActions` (completar y desmarcar), `Countdown`, `ActiveSession`, `SessionTaskList`, `SessionTaskItem`, `SessionAnnouncements` y `SessionResult`: «X de Y», orden de la API, lista vacía con su aviso, `<output>` de los anuncios aparte del tiempo, botón de silencio con `aria-pressed`, resultado con completadas, pendientes que pasan a espera, concentración, motivo y «Empezar otra sesión» (RF-15, RF-16, RF-20 a RF-22, RF-27, RF-28, RF-61, RF-71) — `pomodoro/hooks/tests/use-session-actions.hook.test.tsx`, `pomodoro/components/tests/countdown.component.test.tsx`, `pomodoro/components/tests/active-session.component.test.tsx`, `pomodoro/components/tests/session-task-list.component.test.tsx`, `pomodoro/components/tests/session-task-item.component.test.tsx`, `pomodoro/components/tests/session-announcements.component.test.tsx`, `pomodoro/components/tests/session-result.component.test.tsx`
- [x] T027 [P] [H2] Tests de `useActiveSession` ampliados: al terminar en la página guarda `?result={id}` con `replace`; tras recargar con `result` sigue mostrando el resultado; «Empezar otra sesión» lo quita; una sesión terminada con la página cerrada → formulario (RF-71, RF-72) — `pomodoro/hooks/tests/use-active-session.hook.test.tsx`
- [x] T028 [H2] E2E: completar y desmarcar sin recargar; recargar y ver la misma cuenta atrás (±1 s); en `pomodoro-end.e2e.ts`, **el único test** con una sesión de 1 minuto (`test.setTimeout` de 2 minutos, R-4): termina por tiempo con la pestaña abierta y muestra el resultado, el título de fin y el anuncio; el resultado se mantiene al recargar y «Empezar otra sesión» vuelve al formulario (RF-11, RF-15, RF-17, RF-21, RF-22, RF-27, RF-57, RF-59, RF-66, RF-71, RF-72, CE-02) — `e2e/specs/pomodoro-session.e2e.ts`, `e2e/specs/pomodoro-end.e2e.ts`
  - Verifica (rojo): los tests de T021–T028 fallan por falta de implementación.

### Implementación
- [x] T029 [H2] `useCountdown` y `useSessionEnd` (RF-15 a RF-18) — `pomodoro/hooks/use-countdown.hook.ts`, `pomodoro/hooks/use-session-end.hook.ts`
- [x] T030 [H2] `useEndSound`, `usePomodoroTitle`, `useCountdownAnnouncer` y `useSessionTimer`, que los une con la cuenta atrás (RF-15 a RF-19, RF-57 a RF-66) — `pomodoro/hooks/use-end-sound.hook.ts`, `pomodoro/hooks/use-pomodoro-title.hook.ts`, `pomodoro/hooks/use-countdown-announcer.hook.ts`, `pomodoro/hooks/use-session-timer.hook.ts`
- [x] T031 [H2] `useSessionActions` (completar y desmarcar), `Countdown`, `ActiveSession`, `SessionTaskList`, `SessionTaskItem`, `SessionAnnouncements` y `SessionResult` (RF-15, RF-16, RF-20 a RF-22, RF-27, RF-28, RF-61, RF-63 a RF-66, RF-71, RNF-02) — `pomodoro/hooks/use-session-actions.hook.ts`, `pomodoro/components/countdown.component.tsx`, `pomodoro/components/active-session.component.tsx`, `pomodoro/components/session-task-list.component.tsx`, `pomodoro/components/session-task-item.component.tsx`, `pomodoro/components/session-announcements.component.tsx`, `pomodoro/components/session-result.component.tsx`
- [x] T032 [H2] Resultado en la URL en `useActiveSession` y su uso en `PomodoroSessionPage` (RF-71, RF-72, D-12) — `pomodoro/hooks/use-active-session.hook.ts`, `pomodoro/pages/pomodoro-session.page.tsx`
  - Verifica (verde): T021–T028 pasan.

### Checkpoint H2
- `dce pnpm lint && dce pnpm typecheck && dce pnpm test` y `dre pnpm test:e2e e2e/specs/pomodoro-session.e2e.ts e2e/specs/pomodoro-end.e2e.ts --project=chromium-desktop` en verde.

---

## H3 — Pausar, reanudar y terminar la sesión (HU-03)

### Tests (deben fallar)
- [x] T033 [P] [H3] Tests de `useSessionActions`: pausar solo en curso, reanudar solo en pausa (en el gesto prepara el sonido), terminar pide confirmación y cancelar no envía nada; `INVALID_POMODORO_STATE` muestra el mensaje y el estado real (RF-23 a RF-26, RF-48) — `pomodoro/hooks/tests/use-session-actions.hook.test.tsx`
- [x] T034 [P] [H3] Tests de `ConfirmPomodoroDialog` (`variant="finish"`): foco inicial en «Cancelar», Escape cierra sin terminar. Tests de `SessionControls`: «Pausar» o «Reanudar» según el estado, «Terminar» y silencio con `aria-pressed` (RF-23 a RF-26, RF-61) — `pomodoro/components/tests/confirm-pomodoro-dialog.component.test.tsx`, `pomodoro/components/tests/session-controls.component.test.tsx`
- [x] T035 [H3] E2E: pausar (la cuenta atrás se detiene), reanudar, terminar a mano con confirmación y ver el resultado con motivo «a mano» (RF-23 a RF-28) — `e2e/specs/pomodoro-session.e2e.ts`
  - Verifica (rojo): T033–T035 fallan.

### Implementación
- [x] T036 [H3] Pausar, reanudar y terminar en `useSessionActions`, `SessionControls` y `ActiveSession`; `ConfirmPomodoroDialog` con la variante `finish` (RF-23 a RF-26, RF-48, RF-61) — `pomodoro/hooks/use-session-actions.hook.ts`, `pomodoro/components/session-controls.component.tsx`, `pomodoro/components/active-session.component.tsx`, `pomodoro/components/confirm-pomodoro-dialog.component.tsx`
  - Verifica (verde): T033–T035 pasan.

### Checkpoint H3
- `dce pnpm lint && dce pnpm typecheck && dce pnpm test` y `dre pnpm test:e2e e2e/specs/pomodoro-session.e2e.ts --project=chromium-desktop` en verde.

---

## H4 — Cambiar la lista de la sesión activa (HU-04)

### Tests (deben fallar)
- [x] T037 [P] [H4] Tests de `addTasksSchema` y `useAddTasksForm`: al menos una tarea; sin pasar de 20 con las que ya hay; mismas reglas que al empezar; `POMODORO_TASK_LIMIT` y `DAY_CLOSED` conservan lo escrito (RF-08 a RF-11, RF-29, RF-47, RF-48) — `pomodoro/schemas/tests/add-tasks.schema.test.ts`, `pomodoro/hooks/tests/use-add-tasks-form.hook.test.tsx`
- [x] T038 [P] [H4] Tests de `useSessionActions` (quitar), `SessionTaskItem` y `SessionTaskActions`: «Quitar» solo en las pendientes; quitar invalida las tareas en espera; `POMODORO_TASK_COMPLETED` muestra el estado real (RF-30, RF-31, RF-48) — `pomodoro/hooks/tests/use-session-actions.hook.test.tsx`, `pomodoro/components/tests/session-task-item.component.test.tsx`, `pomodoro/components/tests/session-task-actions.component.test.tsx`
- [x] T039 [P] [H4] Tests de `AddTasksDialog`: filas nuevas y no se ofrece con 20 tareas (RF-13, RF-29) — `pomodoro/components/tests/add-tasks-dialog.component.test.tsx`
- [x] T040 [H4] E2E en `pomodoro-tasks.e2e.ts`: añadir una tarea, que aparece al final; quitar una pendiente, que pasa a espera; una completada no tiene «Quitar». En `fields-pomodoro.e2e.ts`: campos del diálogo de añadir (RF-29 a RF-31) — `e2e/specs/pomodoro-tasks.e2e.ts`, `e2e/specs/fields-pomodoro.e2e.ts`
  - Verifica (rojo): T037–T040 fallan.

### Implementación
- [x] T041 [H4] `addTasksSchema`, `useAddTasksForm`, `AddTasksDialog` y quitar en `useSessionActions`, `SessionTaskItem` y `SessionTaskActions` (RF-29 a RF-31, RF-47, RF-48) — `pomodoro/schemas/add-tasks.schema.ts`, `pomodoro/hooks/use-add-tasks-form.hook.ts`, `pomodoro/components/add-tasks-dialog.component.tsx`, `pomodoro/hooks/use-session-actions.hook.ts`, `pomodoro/components/session-task-item.component.tsx`, `pomodoro/components/session-task-actions.component.tsx`
  - Verifica (verde): T037–T040 pasan.

### Checkpoint H4
- `dce pnpm lint && dce pnpm typecheck && dce pnpm test` y `dre pnpm test:e2e e2e/specs/pomodoro-tasks.e2e.ts e2e/specs/fields-pomodoro.e2e.ts --project=chromium-desktop` en verde.

---

## H5 — Recuperar las tareas que quedaron sin hacer (HU-05)

### Tests (deben fallar)
- [x] T042 [P] [H5] Tests de `editPomodoroTaskSchema`, `useWaitingTasks` y `useEditPomodoroTask`: lista paginada con la página en la URL; borrar con confirmación; editar título y descripción sin fecha, con sus valores actuales y conservando lo escrito ante un rechazo; `POMODORO_TASK_IN_SESSION` muestra el estado real (RF-32, RF-33, RF-35, RF-36, RF-48) — `pomodoro/schemas/tests/edit-pomodoro-task.schema.test.ts`, `pomodoro/hooks/tests/use-waiting-tasks.hook.test.tsx`, `pomodoro/hooks/tests/use-edit-pomodoro-task.hook.test.tsx`
- [x] T043 [P] [H5] Tests de `WaitingTaskList`, `WaitingTaskPicker`, `EditPomodoroTaskDialog` y `ConfirmPomodoroDialog` (`variant="deleteTask"`): sin casilla de completar en espera; aviso de fecha pasada que tomará la de hoy; diálogo sin campo de fecha; con 0 tareas en espera no se muestra la sección (RF-12, RF-32 a RF-37) — `pomodoro/components/tests/waiting-task-list.component.test.tsx`, `pomodoro/components/tests/waiting-task-picker.component.test.tsx`, `pomodoro/components/tests/edit-pomodoro-task-dialog.component.test.tsx`, `pomodoro/components/tests/confirm-pomodoro-dialog.component.test.tsx`
- [x] T044 [H5] E2E en `pomodoro-tasks.e2e.ts`, con las sesiones preparadas por API y terminadas a mano: terminar con una pendiente y verla en espera; empezar otra sesión incluyéndola; editarla; borrar otra con confirmación. En `fields-pomodoro.e2e.ts`: campos del diálogo de editar (RF-12, RF-28, RF-32 a RF-37) — `e2e/specs/pomodoro-tasks.e2e.ts`, `e2e/specs/fields-pomodoro.e2e.ts`
  - Verifica (rojo): T042–T044 fallan.

### Implementación
- [x] T045 [H5] `editPomodoroTaskSchema`, `useWaitingTasks`, `useEditPomodoroTask`, `WaitingTaskList`, `WaitingTaskPicker` (en el formulario de empezar y en el de añadir), `EditPomodoroTaskDialog` (también para las tareas de la sesión activa) y la variante `deleteTask` (RF-12, RF-32 a RF-37) — `pomodoro/schemas/edit-pomodoro-task.schema.ts`, `pomodoro/hooks/use-waiting-tasks.hook.ts`, `pomodoro/hooks/use-edit-pomodoro-task.hook.ts`, `pomodoro/components/waiting-task-list.component.tsx`, `pomodoro/components/waiting-task-picker.component.tsx`, `pomodoro/components/edit-pomodoro-task-dialog.component.tsx`, `pomodoro/components/confirm-pomodoro-dialog.component.tsx`, `pomodoro/pages/pomodoro-session.page.tsx`
  - Verifica (verde): T042–T044 pasan.

### Checkpoint H5
- `dce pnpm lint && dce pnpm typecheck && dce pnpm test` y `dre pnpm test:e2e e2e/specs/pomodoro-tasks.e2e.ts e2e/specs/fields-pomodoro.e2e.ts --project=chromium-desktop` en verde.

### Checkpoint Fase 1
- [x] T046 [H5] «Pomodoro» y la subnavegación en `navigation.e2e.ts`; `/pomodoro` (formulario, sesión activa, resultado y diálogos) en `responsive.e2e.ts` (RF-02, RF-51, CE-03) — `e2e/specs/navigation.e2e.ts`, `e2e/specs/responsive.e2e.ts`
  - Verifica: `dre pnpm test:e2e e2e/specs/navigation.e2e.ts e2e/specs/responsive.e2e.ts` en verde en los 6 proyectos.
- [x] T047 [H5] Suite completa en Chromium × 3 tamaños, quality gate y README (*Funcionalidades* y *Estado del proyecto*: Fase 1 hecha). Corregir aquí la duplicación, la cobertura y las incidencias nuevas antes de empezar la Fase 2 (R-13) (CE-01 a CE-03)
  - Verifica: `dce pnpm lint && dce pnpm typecheck && dce pnpm test:coverage`, `dre pnpm test:e2e --project=chromium-mobile --project=chromium-tablet --project=chromium-desktop` y `./scripts/sonar-scan.sh` en verde.

---

# Fase 2 — P2

## H6 — Consultar mis sesiones pasadas (HU-06)

### Tests (deben fallar)
- [ ] T048 [P] [H6] Tests de `useSessionHistory` y `useSessionDetail`: paginación en la URL y página fuera de rango → última; detalle por id; `POMODORO_NOT_FOUND` → estado de no encontrada (RF-38, RF-40, RF-49) — `pomodoro/hooks/tests/use-session-history.hook.test.ts`, `pomodoro/hooks/tests/use-session-detail.hook.test.ts`
- [ ] T049 [P] [H6] Tests de `SessionHistoryItem` y de las páginas de historial y detalle: fecha, duración, concentración, motivo y «X de Y»; enlace al detalle; tareas en solo lectura; estado vacío; la subnavegación tiene «Historial» (RF-38 a RF-40, RF-49, RF-51, RF-53, RF-54) — `pomodoro/components/tests/session-history-item.component.test.tsx`, `pomodoro/pages/tests/pomodoro-history.page.test.tsx`, `pomodoro/pages/tests/pomodoro-session-detail.page.test.tsx`
- [ ] T050 [H6] E2E, con las tres sesiones creadas y terminadas a mano por API: de la más reciente a la más antigua; abrir una y ver sus tareas tal como quedaron; id inexistente → no encontrada (RF-38 a RF-40, RF-49, RF-54) — `e2e/pages/pomodoro-history.po.ts`, `e2e/specs/pomodoro-history.e2e.ts`
  - Verifica (rojo): T048–T050 fallan.

### Implementación
- [ ] T051 [H6] `useSessionHistory`, `useSessionDetail`, `SessionHistoryItem`, `PomodoroHistoryPage`, `PomodoroSessionDetailPage`, rutas `/pomodoro/history` y `/pomodoro/history/:id`, y «Historial» en la subnavegación (RF-38 a RF-40, RF-49, RF-51, RF-53, RF-54) — `pomodoro/hooks/use-session-history.hook.ts`, `pomodoro/hooks/use-session-detail.hook.ts`, `pomodoro/components/session-history-item.component.tsx`, `pomodoro/pages/pomodoro-history.page.tsx`, `pomodoro/pages/pomodoro-session-detail.page.tsx`, `pomodoro/layouts/pomodoro.layout.tsx`, `pomodoro/index.ts`, `src/shared/router/router.tsx`
  - Verifica (verde): T048–T050 pasan.

---

## H7 — Ver mi racha y mis logros del pomodoro (HU-07)

### Preparación (en verde)
- [ ] T052 [H7] Extraer `StreakStats` de `StreakPanel`: test propio con `{ current, best }`, y los tests de `StreakPanel` y del tablero siguen pasando sin cambios. Es una refactorización: no pasa por rojo (RF-41, D-10) — `src/modules/streaks/components/streak-stats.component.tsx`, `src/modules/streaks/components/streak-panel.component.tsx`, `src/modules/streaks/index.ts`, `src/modules/streaks/components/tests/streak-stats.component.test.tsx`
  - Verifica: `dce pnpm test src/modules/streaks src/modules/tasks`, sin modificar los tests existentes de `StreakPanel` ni del tablero (R-11).

### Tests (deben fallar)
- [ ] T053 [P] [H7] Endpoints `getPomodoroStreak` (con `streakSchema`) y `getPomodoroAchievements(ref)`; `changePomodoroStatus` con `finished` invalida `PomodoroStreak`, y nada invalida `PomodoroAchievement` durante la sesión (RF-41, RF-42, D-11) — `pomodoro/api/pomodoro.api.ts`, `pomodoro/api/tests/pomodoro.api.test.ts`
- [ ] T054 [P] [H7] Tests de `usePomodoroAchievements`, `AchievementCard` y `PomodoroAchievementsPage`: 11 logros en orden; `<progress>` con su nombre accesible; conseguido con fecha; `FOCUS_10H` en horas y minutos; un fallo de la racha no oculta los logros y tiene «Reintentar»; «Logros» en la subnavegación (RF-41 a RF-44, RF-51, RF-53, RF-67) — `pomodoro/hooks/tests/use-pomodoro-achievements.hook.test.ts`, `pomodoro/components/tests/achievement-card.component.test.tsx`, `pomodoro/pages/tests/pomodoro-achievements.page.test.tsx`
- [ ] T055 [P] [H7] Tests de `useNewAchievements` y `NewAchievementsNotice`: referencia al empezar o al cargar con la sesión activa; muestra los nuevos al terminar; nada si no hay nuevos o falla la consulta; al cerrar el resultado invalida los logros (RF-45, RF-68 a RF-70) — `pomodoro/hooks/tests/use-new-achievements.hook.test.ts`, `pomodoro/components/tests/new-achievements-notice.component.test.tsx`
- [ ] T056 [H7] E2E en `pomodoro-achievements.e2e.ts`: racha y los 11 logros con progreso. En `pomodoro-end.e2e.ts`, dentro del mismo y único test de 1 minuto (no se añade otro, R-4): el resultado avisa de «Primer pomodoro» y «Logros» lo muestra conseguido con racha 1 (RF-41 a RF-45, RF-68) — `e2e/pages/pomodoro-achievements.po.ts`, `e2e/specs/pomodoro-achievements.e2e.ts`, `e2e/specs/pomodoro-end.e2e.ts`
  - Verifica (rojo): T053–T056 fallan.

### Implementación
- [ ] T057 [H7] `usePomodoroAchievements`, `AchievementCard`, `PomodoroAchievementsPage`, ruta `/pomodoro/achievements` y «Logros» en la subnavegación (RF-41 a RF-44, RF-51, RF-53, RF-67) — `pomodoro/hooks/use-pomodoro-achievements.hook.ts`, `pomodoro/components/achievement-card.component.tsx`, `pomodoro/pages/pomodoro-achievements.page.tsx`, `pomodoro/layouts/pomodoro.layout.tsx`, `pomodoro/index.ts`, `src/shared/router/router.tsx`
- [ ] T058 [H7] `useNewAchievements` y `NewAchievementsNotice` dentro de `SessionResult` (en `children`) (RF-45, RF-68 a RF-70) — `pomodoro/hooks/use-new-achievements.hook.ts`, `pomodoro/components/new-achievements-notice.component.tsx`, `pomodoro/pages/pomodoro-session.page.tsx`
  - Verifica (verde): T053–T056 pasan y T052 sigue en verde.

---

## Fase Rob — Cierre

- [ ] T059 [Rob] Historial, detalle y logros en `responsive.e2e.ts`, y la subnavegación completa en `navigation.e2e.ts` (RF-51, CE-03) — `e2e/specs/responsive.e2e.ts`, `e2e/specs/navigation.e2e.ts`
  - Verifica: `dre pnpm test:e2e e2e/specs/navigation.e2e.ts e2e/specs/responsive.e2e.ts` en verde en los 6 proyectos.
- [ ] T060 [Rob] Casos límite con contenido largo (títulos sin espacios, emojis, texto no latino) en la sesión, en espera, en el historial y en los logros, con la skill `break-ui`, y revisión táctil con `mobile-native` (RF-51, CE-03)
  - Verifica: cada fallo encontrado tiene su corrección y un test que lo cubre; `dce pnpm test src/modules/pomodoro` y `dre pnpm test:e2e e2e/specs/responsive.e2e.ts` en verde.
- [ ] T061 [Rob] Suite completa: lint, typecheck, Jest con cobertura ≥ 80 %, E2E en Chromium y Firefox × 3 tamaños y quality gate de SonarQube (CE-01 a CE-03)
  - Verifica: `dce pnpm lint && dce pnpm typecheck && dce pnpm test:coverage`, `dre pnpm test:e2e` y `./scripts/sonar-scan.sh` en verde.
- [ ] T062 [Rob] README (*Funcionalidades*, *Estado del proyecto* y estructura con `pomodoro/`), y spec → *Implementada* si cada RF tiene su test (RF-01 a RF-72, CE-01 a CE-03)
  - Verifica: cada RF-01 a RF-72 aparece en el nombre de al menos un test de Jest o de Playwright, y el README describe el módulo `pomodoro/`.

## Registro de cambios

- **2026-11-09** — Creación de las tareas a partir del plan aprobado, en dos fases: Fase 1 (T009–T044, HU-01 a HU-05) y Fase 2 (T045–T055, HU-06 y HU-07).
- **2026-11-09** — E2E más rápidas (plan D-13 a D-15, R-4): nuevas T009–T011 en Base (sesión por API, `board` con `signedInPage` y `fullyParallel`); el resto se renumera (+3, T012–T062). Sin modo serie; una cuenta por test; un único test con la sesión de 1 minuto.
- **2026-11-09** — Riesgos R-8 a R-13 del plan: comprobaciones de la API-004 y del borrado en cascada en T009, checkpoint Base ampliado, tests sin modificar en T010 y T052, y quality gate obligatorio en T047.
- **2026-11-09** — Fase Base hecha (T001–T011). Lint, typecheck y Jest (784 tests) en verde. Suite E2E completa (738 tests en los 6 proyectos): 4,8 min antes (login por la interfaz), 4,1 min con `board` sobre `signedInPage` (T010) y 3,9 min con `fullyParallel` (T011, dos ejecuciones seguidas sin fallos). R-6 resuelto: no hace falta el respaldo por la interfaz en Firefox.
- **2026-11-09** — Fase 1 hecha salvo el cierre (T012–T046). Jest del módulo: 218 tests. E2E del pomodoro en verde (H1–H3 en los 6 proyectos: 150 en 2,2 min; H4–H5 en chromium-desktop; navegación y responsive en los 6). Desviación: el formulario usa `duration` + `customMinutes` en lugar de la unión discriminada de plan §4.5. Pendiente T047 (suite completa en Chromium, SonarQube y README).
- **2026-11-09** — Revisión del fichero contra el código, sin cambios de comportamiento: plan §4.5 y T012/T017 recogen el esquema real (`createStartSessionSchema`); se añaden a T008, T015, T018, T020, T025, T026, T030, T031, T034, T036, T038, T041, T042 y T045 los ficheros creados sin tarea (`SessionTaskList`, `SessionAnnouncements`, `SessionControls`, `SessionTaskActions`, `useNewTaskRows`, `useSessionTimer`, `usePomodoroSessionPage`, `useEditPomodoroTask`, test del layout y apoyo de tests); se corrigen las extensiones `.test.tsx` de cinco tests de hooks; T047, T060 y T062 llevan sus RF y CE; T052 pasa a un bloque *Preparación (en verde)*; checkpoints de H3, H4 y H5; línea **Verifica** en T046, T059, T060 y T062, y la cabecera explica la **Verifica** por bloque.
- **2026-11-09** — T047 hecha: Fase 1 cerrada. Lint y typecheck en verde; Jest con cobertura: 977 tests en 128 suites, 99,5 % de líneas y 95 % de ramas, con un test nuevo para `useNewTaskRows` (T018). E2E en Chromium × 3 tamaños: 495 tests en 3,3 min. La primera ejecución tuvo un fallo en `fields-auth.e2e.ts` porque se cambió código durante la ejecución y Vite recargó; la segunda pasó entera. Quality gate en verde tras corregir 5 incidencias nuevas: `role="group"` → `<fieldset>` en `SessionControls` (S6819), `void` sobre un posible `undefined` en `useEndSound` (S3735), alias redundante `StartSessionValues` → solo `SessionFormValues` (S6564) y dos comentarios con la palabra «todo» (S1135). README: *Funcionalidades* (Pomodoro) y *Estado del proyecto*.
