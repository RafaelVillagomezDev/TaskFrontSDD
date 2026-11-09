# Plan: Pomodoro task session — sesiones de concentración con una lista de tareas
Spec: `sdd/003-pomodoro-task-session/spec.md` (Aprobada) · Estado: Aprobado · Fecha: 2026-11-09

Los RF, RNF, CE y S de este plan son los de la spec 003. Los del MVP del frontend se citan como «001 RF-xx», los de la 002 como «002 RF-xx» y los de la API como «API-004 RF-xx». Las decisiones se numeran D-1, D-2… y los riesgos R-1, R-2…

## 1. Resumen técnico

Un módulo nuevo, `pomodoro`, con cuatro pantallas bajo `/pomodoro`, que consume las 11 rutas de API-004 con RTK Query sobre la API base única.

- **Datos:** un fichero de endpoints, `pomodoro.api.ts`, con 4 etiquetas nuevas. Cada respuesta se valida con Zod (001 D-5). No hay slices ni Context: los datos solo viven en la caché de RTK Query (D-2).
- **Sesión activa:** la primera de `GET /pomodoros?page=1`, si está `running` o `paused` (RF-03, D-3).
- **Cuenta atrás:** parte de `remainingSeconds` y avanza con `performance.now()`, en un hook con limpieza (RF-15, D-4). Al llegar a cero vuelve a consultar la sesión, con un reintento (RF-17, RF-18).
- **Avisos de fin:** título de la pestaña, un sonido generado con Web Audio, sin fichero ni dependencia (D-5), y anuncios de hitos en un `<output>` (RF-63 a RF-66).
- **Interfaz:** subnavegación de enlaces con una pieza nueva de `shared/layout` (D-7). Se reutilizan `PageContainer`, `PageHeader`, `Dialog`, `Field`, `Input`, `Textarea`, `DateInput`, `Checkbox`, `Pagination`, `Notice`, `EmptyState` y `ErrorMessage`.
- **Cambios fuera del módulo:**
  - E2E: `fullyParallel`, sesión iniciada por API y una cuenta por test (D-13 a D-15).
  - Cabeceras de hora en las rutas del pomodoro (RF-01).
  - «Pomodoro» en la navegación, activo también en sus subrutas (RF-02, D-8).
  - Extracción de la presentación de la racha del módulo `streaks` (RF-41, D-10).
  - Reglas del formulario de tarea expuestas desde `tasks` (D-9).
- **Entrega en dos fases** (decisión del usuario al aprobar la spec):
  - **Fase 1, P1:** HU-01 a HU-05, en `/pomodoro`.
  - **Fase 2, P2:** HU-06 y HU-07, en `/pomodoro/history`, `/pomodoro/history/{id}` y `/pomodoro/achievements`, más el aviso de logros nuevos.

  Al terminar la Fase 1, la aplicación se puede usar y desplegar. Mientras tanto, la subnavegación solo muestra «Sesión» (D-7).

## 2. Comprobación constitucional

**Excepciones usadas:** ninguna.

| Principio | Cómo lo cumple este plan | Estado |
| :--- | :--- | :--- |
| **I. Stack cerrado y entorno** | Sin dependencias nuevas. El sonido usa Web Audio, que es una API del navegador, no una librería (D-5). Los iconos son de Lucide. Todo se ejecuta en Docker. | ✅ |
| **II. Spec-anchored** | Spec 003 aprobada. La ampliación de la navegación (001 RF-50 y RF-54, 002 RF-08) está en RF-02. El cambio de spec de R-1 (RF-72) se aprobó antes de implementar. Cada tarea de `tasks.md` cita sus RF y cada RF tiene su test (sección 8). | ✅ |
| **III. Clarificar antes de asumir** | El contrato se toma de API-004 y de su colección de Postman, y se valida con Zod. Sin marcas abiertas en la spec. | ✅ |
| **IV. Calidad: tipado y tests** | Sin `any`, aserciones ni `enum`: los estados son uniones de literales (`'running' \| 'paused' \| 'finished'`). Tests de cada hook, componente, página y esquema, y E2E por cada input escribible (sección 7). | ✅ |
| **V. Datos, estado y seguridad** | HTTP solo con RTK Query. Nada en slices, `useState` ni el navegador: la referencia de logros es otra entrada de la caché (D-11) y el silencio del sonido es estado de UI (D-6). Formularios con Zod. | ✅ |
| **VI. Separación de responsabilidades** | Lógica, efectos y accesibilidad en hooks. Cada `useEffect` limpia su intervalo, temporizador, `AudioContext`, título o listener (sección 4). `pomodoro` solo importa `index.ts` de `tasks` y `streaks` y `src/shared/`. | ✅ |
| **VII. Diseño y accesibilidad** | Solo tokens de `DESIGN.md`. Mobile-first, con objetivos táctiles de 44 px. Anuncios con `<output>` (S6819). Responsive comprobado en los 6 proyectos. | ✅ |

## 3. Estructura de archivos

`pomodoro/` abrevia `src/modules/pomodoro/`. Los tests van en la subcarpeta `tests/` de cada carpeta. **F** es la fase: 0 (base), 1 (P1) o 2 (P2).

### 3.1 Cambios fuera del módulo

| Archivo | Cambio | F | RF |
| :--- | :--- | :--- | :--- |
| `src/shared/api/session-base-query.ts` | `CLIENT_TIME_PATHS` añade `/pomodoros`, `/pomodoro-tasks`, `/pomodoro-streak` y `/pomodoro-achievements` | 0 | RF-01 |
| `src/shared/api/base.api.ts` | `tagTypes` añade `Pomodoro`, `PomodoroTask`, `PomodoroStreak` y `PomodoroAchievement` | 0 | — |
| `src/shared/api/api-error.util.ts` | `ApiErrorCode` y `API_ERROR_CODES` con los 8 códigos de API-004 | 0 | RF-50 |
| `src/shared/texts/errors.texts.ts` | Mensaje en español de cada código nuevo | 0 | RF-50 |
| `src/shared/router/routes.constants.ts` | `pomodoro`, `pomodoroHistory`, `pomodoroHistoryDetail(id)` y `pomodoroAchievements` | 0 | RF-02, RF-51 |
| `src/shared/router/router.tsx` | Rutas privadas anidadas bajo `PomodoroLayout` | 0, 2 | RF-51 a RF-54 |
| `src/shared/texts/navigation.texts.ts` | `pomodoro: 'Pomodoro'` | 0 | RF-02 |
| `src/shared/layout/nav-item.component.tsx` | Prop `matchSubroutes` (por defecto `false`): sin `end` en `NavLink` | 0 | RF-02 |
| `src/shared/layout/main-navigation.component.tsx` | `NavItem` «Pomodoro» con el icono `Timer`, después de «Hecho hoy» y con `matchSubroutes` | 0 | RF-02 |
| `src/shared/layout/sub-navigation.component.tsx` | **Nuevo.** Compound `SubNavigation` con `SubNavigation.Link`: fila de enlaces con `aria-current` (D-7) | 0 | RF-51 |
| `src/modules/tasks/index.ts` | Exporta `createTaskFormSchema` y los límites de los campos (D-9) | 0 | RF-08 a RF-11 |
| `src/modules/streaks/components/streak-stats.component.tsx` | **Nuevo**, extraído de `StreakPanel`: racha actual y mejor racha a partir de `{ current, best }` (D-10) | 2 | RF-41 |
| `src/modules/streaks/components/streak-panel.component.tsx` | Usa `StreakStats` por dentro, sin cambiar lo que muestra | 2 | 001 RF-25 |
| `src/modules/streaks/index.ts` | Exporta `StreakStats` | 2 | RF-41 |
| `README.md` | *Funcionalidades*, *Estado del proyecto* y estructura (`pomodoro/`) | 0–2 | — |

### 3.2 Módulo `pomodoro`

| Archivo | Contenido | F | RF |
| :--- | :--- | :--- | :--- |
| `pomodoro/index.ts` | API pública: las páginas y `PomodoroLayout` | 0 | — |
| `pomodoro/api/pomodoro.api.ts` | Los 11 endpoints (sección 4.1) | 0, 2 | RF-03, RF-14, RF-17, RF-22 a RF-42 |
| `pomodoro/schemas/pomodoro.schema.ts` | `pomodoroSchema`, `pomodoroTaskSchema`, `achievementSchema` y sus páginas; `PomodoroStatus` y `EndReason` como uniones | 0 | — |
| `pomodoro/schemas/pomodoro.constants.ts` | `DURATION_PRESETS` (15, 25, 45 y 60), `DEFAULT_DURATION` (25), `MIN_DURATION` y `MAX_DURATION` (1 y 120), `MAX_SESSION_TASKS` (20), `ANNOUNCE_MILESTONES_SECONDS` (300 y 60), `END_RETRY_DELAY_MS` (1000), `COUNTDOWN_TICK_MS` (250), `END_SOUND_*` | 0 | RF-06, RF-13, RF-18, RF-64 |
| `pomodoro/schemas/start-session.schema.ts` | Formulario de empezar: `duration` (preset u «Otra») + `newTasks[]` + `waitingTaskIds[]`, con máximo 20 entre las dos listas | 1 | RF-06 a RF-13, RF-55, RF-56 |
| `pomodoro/schemas/add-tasks.schema.ts` | Formulario de añadir: `newTasks[]` + `waitingTaskIds[]`, al menos una y sin pasar de 20 con las que ya hay | 1 | RF-29 |
| `pomodoro/schemas/edit-pomodoro-task.schema.ts` | Título y descripción | 1 | RF-35 |
| `pomodoro/texts/pomodoro.texts.ts` | Todos los textos visibles, los del título de la pestaña y los anuncios | 0–2 | RNF-01 de la 001 |
| `pomodoro/layouts/pomodoro.layout.tsx` | `PageContainer` + `SubNavigation` + `Outlet` | 0 | RF-51 |
| **Fase 1** | | | |
| `pomodoro/hooks/use-active-session.hook.ts` | Sesión activa desde `getPomodoros` (D-3) y resultado de la que acaba de terminar (D-12) | 1 | RF-03 a RF-05, RF-71, RF-72 |
| `pomodoro/hooks/use-start-session-form.hook.ts` | `useForm` + `useFieldArray`, envío a `startPomodoro` y errores de la API | 1 | RF-06 a RF-14, RF-46, RF-47, RF-55, RF-56 |
| `pomodoro/hooks/use-countdown.hook.ts` | Segundos restantes con `performance.now()` e intervalo con limpieza (D-4) | 1 | RF-15, RF-16, RNF-01 |
| `pomodoro/hooks/use-session-end.hook.ts` | Al llegar a cero: consulta y un reintento con temporizador cancelable | 1 | RF-17, RF-18 |
| `pomodoro/hooks/use-end-sound.hook.ts` | `AudioContext` creado en el gesto de empezar o reanudar, tono al terminar, silencio y cierre en la limpieza (D-5, D-6) | 1 | RF-19, RF-61, RF-62 |
| `pomodoro/hooks/use-pomodoro-title.hook.ts` | Título de la pestaña según el estado; restaura el título al desmontar y escucha `visibilitychange` | 1 | RF-57 a RF-60 |
| `pomodoro/hooks/use-countdown-announcer.hook.ts` | Mensaje del `<output>`: cambios de estado, hitos por los que pasa y fin | 1 | RF-63 a RF-66, RNF-02 |
| `pomodoro/hooks/use-session-actions.hook.ts` | Pausar, reanudar, terminar con confirmación, completar o desmarcar, quitar y errores de estado | 1 | RF-22 a RF-26, RF-30, RF-31, RF-48 |
| `pomodoro/hooks/use-add-tasks-form.hook.ts` | Añadir tareas a la sesión activa | 1 | RF-29, RF-47 |
| `pomodoro/hooks/use-waiting-tasks.hook.ts` | Lista paginada de tareas en espera, borrar con confirmación y editar | 1 | RF-32 a RF-37 |
| `pomodoro/components/start-session-form.component.tsx` | Formulario de empezar | 1 | RF-04, RF-06 a RF-14 |
| `pomodoro/components/duration-picker.component.tsx` | Grupo de radios con aspecto de botones para 15, 25, 45, 60 y «Otra», más el campo de minutos | 1 | RF-06, RF-07, RF-55, RF-56 |
| `pomodoro/components/new-task-fields.component.tsx` | Filas de título, descripción y fecha con añadir y quitar fila, compartidas por empezar y añadir | 1 | RF-08 a RF-11, RF-13 |
| `pomodoro/components/waiting-task-picker.component.tsx` | Casillas para elegir tareas en espera, con el aviso de fecha pasada | 1 | RF-12, RF-37 |
| `pomodoro/components/active-session.component.tsx` | Cuenta atrás, controles, silencio, resumen y lista | 1 | RF-05, RF-15, RF-16, RF-20, RF-21, RF-23 a RF-25, RF-61 |
| `pomodoro/components/countdown.component.tsx` | `MM:SS` grande con `tabular-nums` y el `<output>` de los anuncios aparte | 1 | RF-15, RF-16, RF-63 a RF-66 |
| `pomodoro/components/session-task-item.component.tsx` | Casilla, título, descripción y acciones de editar y quitar (quitar solo si está pendiente) | 1 | RF-22, RF-30, RF-31, RF-35 |
| `pomodoro/components/session-result.component.tsx` | Resultado: «X de Y», completadas, pendientes que pasan a espera, concentración, motivo y «Empezar otra sesión». Fase 2: aviso de logros en `children` | 1, 2 | RF-27, RF-28, RF-71, RF-68 |
| `pomodoro/components/waiting-task-list.component.tsx` | Lista paginada con editar y borrar | 1 | RF-32 a RF-37 |
| `pomodoro/components/add-tasks-dialog.component.tsx` | `Dialog` con `NewTaskFields` y `WaitingTaskPicker` | 1 | RF-29 |
| `pomodoro/components/edit-pomodoro-task-dialog.component.tsx` | `Dialog` de título y descripción, sin fecha | 1 | RF-35, RF-36 |
| `pomodoro/components/confirm-pomodoro-dialog.component.tsx` | Confirmación de terminar la sesión y de borrar una tarea en espera, con `variant: 'finish' \| 'deleteTask'` | 1 | RF-26, RF-33 |
| `pomodoro/pages/pomodoro-session.page.tsx` | `/pomodoro`: formulario, sesión activa o resultado, y tareas en espera debajo | 1 | RF-52 |
| **Fase 2** | | | |
| `pomodoro/hooks/use-session-history.hook.ts` | `getPomodoros` paginado con `useUrlPage` y `useClampUrlPage` | 2 | RF-38, RF-39 |
| `pomodoro/hooks/use-session-detail.hook.ts` | `getPomodoro(id)` y su estado de no encontrada | 2 | RF-40, RF-49 |
| `pomodoro/hooks/use-pomodoro-achievements.hook.ts` | Racha y logros, con errores independientes | 2 | RF-41 a RF-44, RF-67 |
| `pomodoro/hooks/use-new-achievements.hook.ts` | Logros que han pasado a conseguidos durante la sesión (D-11) | 2 | RF-45, RF-68 a RF-70 |
| `pomodoro/components/session-history-item.component.tsx` | Fecha, duración, concentración, motivo y «X de Y», con enlace al detalle | 2 | RF-39 |
| `pomodoro/components/achievement-card.component.tsx` | Nombre, descripción, barra de progreso (`<progress>`), conseguido y fecha | 2 | RF-42 a RF-44 |
| `pomodoro/components/new-achievements-notice.component.tsx` | `Notice` con los logros nuevos y enlace a «Logros» | 2 | RF-68 |
| `pomodoro/pages/pomodoro-history.page.tsx` | `/pomodoro/history` | 2 | RF-38, RF-39, RF-53 |
| `pomodoro/pages/pomodoro-session-detail.page.tsx` | `/pomodoro/history/:id`: tareas de la foto en solo lectura | 2 | RF-40, RF-49, RF-54 |
| `pomodoro/pages/pomodoro-achievements.page.tsx` | `/pomodoro/achievements` | 2 | RF-41 a RF-44, RF-53, RF-67 |

### 3.3 E2E

| Archivo | Contenido | F |
| :--- | :--- | :--- |
| `playwright.config.ts` | `fullyParallel: true`: también se reparten los tests de un mismo fichero (D-14) | 0 |
| `e2e/fixtures/api-client.ts` | `loginInPage(page, account)`: inicia sesión con `page.request`, que comparte cookies con el navegador (D-15); métodos de la API del pomodoro para preparar datos (sesiones, tareas en espera) | 0, 1 |
| `e2e/fixtures/session.fixture.ts` | **Nuevo.** `signedInPage`: cuenta de `freshAccount` con la sesión iniciada por API (D-15) | 0 |
| `e2e/fixtures/tasks.fixture.ts` | `board` pasa a usar `signedInPage` en lugar del login por la interfaz (D-15) | 0 |
| `e2e/fixtures/pomodoro.fixture.ts` | `pomodoro`: `signedInPage` en `/pomodoro` con una cuenta nueva por test, que se borra al terminar con todo su pomodoro (D-13) | 1 |
| `e2e/pages/pomodoro.po.ts` | Page object de `/pomodoro` | 1 |
| `e2e/pages/pomodoro-history.po.ts`, `e2e/pages/pomodoro-achievements.po.ts` | Page objects | 2 |
| `e2e/specs/pomodoro-session.e2e.ts` | Empezar, cuenta atrás tras recargar, completar, pausar, reanudar, terminar y resultado | 1 |
| `e2e/specs/pomodoro-end.e2e.ts` | **Un único test** con la única sesión de 1 minuto: resultado, título de la pestaña, anuncio, resultado tras recargar y, en la Fase 2, el aviso de «Primer pomodoro» (R-4) | 1, 2 |
| `e2e/specs/pomodoro-tasks.e2e.ts` | Añadir, quitar, tareas en espera, incluirlas, editar y borrar | 1 |
| `e2e/specs/fields-pomodoro.e2e.ts` | Cada input escribible: duración «Otra», título, descripción y fecha (al empezar y al añadir) y edición. Valor válido, cada regla con su mensaje y solo teclado | 1 |
| `e2e/specs/pomodoro-history.e2e.ts`, `e2e/specs/pomodoro-achievements.e2e.ts` | Historial, detalle, no encontrada, racha y logros | 2 |
| `e2e/specs/navigation.e2e.ts`, `e2e/specs/responsive.e2e.ts` | «Pomodoro» en la navegación, subnavegación y las pantallas nuevas en los 6 proyectos | 1, 2 |

## 4. Lógica principal

### 4.1 Endpoints (`pomodoro.api.ts`)

| Endpoint RTK | Petición | Da / invalida | F |
| :--- | :--- | :--- | :--- |
| `getPomodoros(page)` | `GET /pomodoros` | Da `{Pomodoro, LIST}` | 0 |
| `getPomodoro(id)` | `GET /pomodoros/{id}` | Da `{Pomodoro, id}` | 0 |
| `startPomodoro(body)` | `POST /pomodoros` | Invalida `{Pomodoro, LIST}` y `PomodoroTask` | 1 |
| `changePomodoroStatus({id, status})` | `PATCH /pomodoros/{id}` | Escribe la respuesta en `getPomodoro(id)` e invalida `{Pomodoro, LIST}`. Con `finished`, invalida también `PomodoroTask` y `PomodoroStreak` | 1 |
| `addPomodoroTasks({id, body})` | `POST /pomodoros/{id}/tasks` | Escribe la respuesta e invalida `{Pomodoro, LIST}` y `PomodoroTask` | 1 |
| `removePomodoroTask({id, taskId})` | `DELETE /pomodoros/{id}/tasks/{taskId}` | Igual que añadir | 1 |
| `getWaitingTasks(page)` | `GET /pomodoro-tasks` | Da `PomodoroTask` | 1 |
| `updatePomodoroTask({id, changes})` | `PATCH /pomodoro-tasks/{id}` | Invalida `{Pomodoro, LIST}` y `PomodoroTask` (D-2) | 1 |
| `deleteWaitingTask(id)` | `DELETE /pomodoro-tasks/{id}` | Invalida `PomodoroTask` | 1 |
| `getPomodoroStreak()` | `GET /pomodoro-streak` | Da `PomodoroStreak`; usa `streakSchema` de `@modules/streaks` | 2 |
| `getPomodoroAchievements(ref)` | `GET /pomodoro-achievements` | Da `PomodoroAchievement`; `ref` separa las entradas de caché (D-11) | 2 |

- **Rechazos de estado** (`INVALID_POMODORO_STATE`, `POMODORO_TASK_*`, `POMODORO_ALREADY_ACTIVE`): invalidan `{Pomodoro, LIST}` y `PomodoroTask`, así que la pantalla muestra el estado real (RF-46, RF-48), igual que `STALE_BOARD_CODES` en `tasks.api.ts`.
- **Sin cambio optimista:** completar espera la respuesta (D-2). El check queda deshabilitado mientras se guarda con `useSingleSubmit`.

### 4.2 Sesión activa y resultado (RF-03 a RF-05, RF-71, D-3, D-12)
`useActiveSession` lee `getPomodoros(1)`. Si `items[0]` está `running` o `paused`, es la sesión activa. Cuando esa sesión pasa a `finished` en esta página, el hook guarda su `id` en la URL (`?result={id}`, con `replace`) y la pantalla muestra `SessionResult` con `getPomodoro(id)`. «Empezar otra sesión» quita el parámetro. Sin sesión activa ni `result`, muestra el formulario.

### 4.3 Cuenta atrás (RF-15 a RF-18, RNF-01, D-4)
- `useCountdown({ remainingSeconds, status, receivedAt })`. `receivedAt` es el `performance.now()` en que cambió la identidad de los datos de la sesión, guardado en un `ref` porque es información de tiempo de la UI y no un dato de la API.
- Mientras está `running`, un `setInterval` de 250 ms calcula `max(0, remaining − (performance.now() − receivedAt)/1000)` y redondea hacia arriba. Al volver de segundo plano el valor es exacto, porque se calcula y no se acumula.
- Mientras está `paused`, devuelve `remainingSeconds` sin intervalo. La limpieza hace `clearInterval`.
- `useSessionEnd`: al llegar a cero llama a `refetch` de `getPomodoro(id)`. Si sigue activa, programa un `setTimeout` de 1000 ms que se cancela en la limpieza, y no hay más reintentos.

### 4.4 Avisos (RF-19, RF-57 a RF-66)
- **Sonido (D-5):** al pulsar «Empezar» o «Reanudar», se crea o reanuda un `AudioContext` dentro del gesto. Al llegar a cero, si no está silenciado, suena un tono corto (`OscillatorNode` + `GainNode`, unos 600 ms). Si el contexto no existe o está `suspended` (por ejemplo, tras recargar), no suena y no se muestra nada (RF-62). La limpieza cierra el contexto.
- **Título:** `usePomodoroTitle(state)` guarda el título anterior al montar y lo restaura al desmontar (RF-60). Tras el fin, añade un listener de `visibilitychange` y restaura el título cuando la pestaña vuelve a estar visible (RF-59). Quita el listener en la limpieza.
- **Anuncios:** `useCountdownAnnouncer` compara el segundo anterior con el actual y anuncia un hito solo si la cuenta atrás lo cruza (de más de 300 a 300 o menos). Así se cumplen RF-64 y RF-65 sin casos especiales. Los cambios de estado y el fin vienen de las acciones y de `useSessionEnd`. Solo anuncia el fin que detecta la página (RF-66).

### 4.5 Formulario de empezar (RF-06 a RF-14, RF-55, RF-56)
- `startSessionSchema(today)`:
  - `duration` es una unión discriminada: `{ kind: 'preset', minutes: 15 | 25 | 45 | 60 }` o `{ kind: 'custom', minutes: string }`. Solo se valida el entero de 1 a 120 con `custom` (RF-07, RF-56).
  - `newTasks` reutiliza `createTaskFormSchema(today)` de `@modules/tasks` (D-9).
  - `refine` sobre el total, como máximo 20 (RF-13).
- `useFieldArray` gestiona las filas. «Añadir tarea» se deshabilita al llegar a 20.
- Se envía `{ durationMinutes, newTasks, waitingTaskIds }`. Una descripción vacía va como `null`.
- Errores: `showApiError` (RF-47) y, con `POMODORO_ALREADY_ACTIVE`, se invalida la lista y aparece la sesión activa (RF-46).

### 4.6 Logros nuevos (RF-45, RF-68 a RF-70, D-11) — Fase 2
- Mientras hay una sesión activa en la página, `useNewAchievements` se suscribe a `getPomodoroAchievements('baseline')`. No se vuelve a pedir: la etiqueta `PomodoroAchievement` no se invalida durante la sesión.
- Al ver el resultado, pide `getPomodoroAchievements(sessionId)` y compara los `code` con `unlocked`.
- Si falla o no hay logros nuevos, no muestra nada (RF-69, RF-70). Al cerrar el resultado, invalida `PomodoroAchievement` para que «Logros» esté al día.

## 5. Interfaz

### 5.1 Rutas

| Ruta | Pantalla | F | RF |
| :--- | :--- | :--- | :--- |
| `/pomodoro` | Sesión: formulario, sesión activa o resultado, y tareas en espera | 1 | RF-52 |
| `/pomodoro/history` | Historial de sesiones | 2 | RF-38, RF-53 |
| `/pomodoro/history/:id` | Detalle de una sesión | 2 | RF-40, RF-54 |
| `/pomodoro/achievements` | Racha y logros | 2 | RF-41, RF-53 |

### 5.2 Pantalla `/pomodoro` (mobile-first)
- **Cabecera y subnavegación:** `PageHeader` con «Pomodoro» y `SubNavigation`, que en la Fase 1 solo tiene «Sesión».
- **Formulario:**
  - Duración como grupo de radios con aspecto de botones (`fieldset` + `legend`), 2×2 en móvil y en línea desde `sm:`, más «Otra».
  - Lista de tareas nuevas y, si hay, «Incluir tareas en espera».
  - Botón principal «Empezar sesión».
- **Sesión activa:**
  - Cuenta atrás grande centrada.
  - Debajo, «Pausar» o «Reanudar», «Terminar» y el botón de silencio (icono `Volume2`/`VolumeX` con `aria-pressed`).
  - Resumen «X de Y», lista de tareas y «Añadir tareas».
- **Resultado:** el resumen, las listas de completadas y de pendientes que pasan a espera, la concentración, el motivo y «Empezar otra sesión».
- **Tareas en espera:** en una sección propia debajo, paginada, con editar y borrar en cada fila. Con 0 tareas no se muestra la sección.

### 5.3 Componentes: reutilización y nuevos (CONSTITUTION VI.5)

| Componente | Origen | Uso |
| :--- | :--- | :--- |
| `PageContainer`, `PageHeader`, `EmptyState`, `NavItem` | `shared/layout` | Estructura, vacíos y navegación |
| `Button`, `Text`, `Field`, `Input`, `Textarea`, `DateInput`, `Checkbox`, `Dialog`, `Pagination`, `Notice`, `ErrorMessage`, `Spinner`, `Icon`, `Badge`, `Box` | `shared/ui` | Formularios, diálogos, listas y estados |
| `useSingleSubmit`, `useUrlPage`, `useClampUrlPage`, `useCurrentDay` | `shared` | Doble envío, paginación en la URL y día actual |
| `createTaskFormSchema`, límites de los campos | `@modules/tasks` | Reglas de las tareas nuevas (D-9) |
| `streakSchema`, `StreakStats` | `@modules/streaks` | Racha del pomodoro (D-10) |
| **`SubNavigation`** (nuevo) | `shared/layout` | No hay pestañas ni subnavegación. Es genérico y otras secciones podrían usarlo (D-7) |
| **`NewTaskFields`** (nuevo) | `pomodoro` | Las filas de tareas se comparten entre empezar y añadir. `TaskFormDialog` edita una sola tarea en un diálogo y no sirve para una lista |
| **Resto de componentes** | `pomodoro` | No hay equivalente: cuenta atrás, sesión, resultado y logros |

## 6. Decisiones técnicas

- **D-1 — Módulo nuevo `pomodoro`, no dentro de `tasks`.** Son recursos distintos (API-004 RF-02), con su propia API, rutas y textos. Mezclarlos haría crecer `tasks.api.ts` con etiquetas que no tienen relación.
- **D-2 — Sin cambio optimista al completar.** En el tablero sí se usa (001 D-7), pero aquí la respuesta cambia `completedTasks`, y un fallo de estado (sesión terminada en otra pestaña) tiene que mostrar el estado real. La latencia de la API (p95 < 300 ms, API-004 RNF-01) lo hace aceptable.
- **D-3 — Sesión activa = primera de `GET /pomodoros?page=1`.** La API no tiene «sesión activa», pero solo puede haber una y siempre es la más reciente (S-03). Se reutiliza la misma entrada de caché que la página 1 del historial.
- **D-4 — Cuenta atrás con `remainingSeconds` y `performance.now()`.** Es inmune a la hora del dispositivo y al estrangulamiento de temporizadores en segundo plano, porque el valor se calcula y no se acumula (RNF-01). Un desfase de red de unos 100 ms queda dentro del margen de 1 segundo.
- **D-5 — Sonido con Web Audio, sin fichero.** No añade un recurso binario ni licencias, y la política de reproducción automática se resuelve creando el contexto en el gesto de empezar o reanudar. Tras recargar no hay gesto y no suena (RF-62, caso límite de la spec).
- **D-6 — Silencio como estado de UI del hook.** No es un dato de la API (V) y no se guarda (RF-61, RNF-03). Se pierde al recargar, como decidió el usuario.
- **D-7 — `SubNavigation` en `shared/layout`.** Usa enlaces, no `role="tablist"`, porque cada vista es una ruta (RF-51). Es un compound component con `SubNavigation.Link`. En la Fase 1 solo tiene «Sesión», y la Fase 2 añade «Historial» y «Logros» sin tocar la pieza.
- **D-8 — `NavItem` con `matchSubroutes`.** Hoy `NavItem` usa `end`, que solo marca la ruta exacta. Con `matchSubroutes`, «Pomodoro» queda activo en `/pomodoro/*` (RF-02). Las demás entradas no cambian.
- **D-9 — Reglas de las tareas nuevas desde `@modules/tasks`.** API-004 RF-06 dice que son las de la 001. Se exporta `createTaskFormSchema` en el `index.ts` de `tasks` en lugar de copiarlo, con los mismos mensajes. El formulario de editar reutiliza solo título y descripción con `.pick`.
- **D-10 — `StreakStats` en el módulo `streaks`.** Es presentación pura a partir de `{ current, best }`. `StreakPanel` lo usa por dentro y los tests de la 001 tienen que seguir pasando sin cambios (P-06).
- **D-11 — Referencia de logros como otra entrada de caché.** `getPomodoroAchievements('baseline')` y `getPomodoroAchievements(sessionId)` son dos entradas distintas de RTK Query para la misma petición. No guarda datos de la API en `useState` ni en `ref`, y se limpia sola al dejar de usarse.
- **D-12 — El resultado en la URL (`?result={id}`).** El resultado de una sesión terminada en la página sobrevive a una recarga sin guardar nada en el navegador (RNF-03), y «Empezar otra sesión» es quitar el parámetro. Cumple RF-72.
- **D-13 — Una cuenta nueva por test del pomodoro.** La suite ya usa `freshAccount` (cuenta única registrada por API y borrada al terminar) en casi todos los tests, y registrar no tiene límite en la API (el bloqueo de API-002 RF-09 es solo por logins fallidos). Con una cuenta por test, cada uno tiene su propia «sesión activa» y no hay `POMODORO_ALREADY_ACTIVE` entre tests ni modo serie. Además, una cuenta nueva empieza siempre con racha 0 y los 11 logros sin conseguir, lo que hace deterministas las pruebas de logros. Borrar la cuenta borra también su pomodoro (API-004, relación con la 002).
- **D-14 — `fullyParallel: true` en Playwright.** Hoy los ficheros se reparten entre los workers, pero los tests de un mismo fichero van en serie. Con cuentas propias, ningún test depende de otro ni del orden. El único dato compartido es `testUser`, que solo hace logins correctos (los fallidos usan `freshAccount`), así que no puede bloquearse por RF-09 de API-002.
- **D-15 — Sesión iniciada por API en los tests que no prueban el login.** `loginInPage` llama a `POST /auth/login` con `page.request`, que guarda las cookies en el contexto del navegador. Al abrir la aplicación, `GET /me` recupera el usuario y el token CSRF como tras una recarga (spec 003 de la API). Ahorra el formulario de login en cada test. Los tests de login (`login.e2e.ts`, `fields-auth.e2e.ts`) siguen entrando por la interfaz. Ver R-6.

## 7. Estrategia de tests

| Nivel | Qué | F |
| :--- | :--- | :--- |
| Base query | Cabeceras de hora en las 4 rutas nuevas, incluida `/pomodoro-tasks` | 0 |
| Esquemas | `pomodoroSchema` con los tres estados; `startSessionSchema`: presets, «Otra» con 0, 121, 25,5 y vacío, títulos de 0 y 201 caracteres, descripción de 1001 y fecha de ayer, 21 tareas; `addTasksSchema`: vacío y límite | 1 |
| Hooks de efectos | `useCountdown`, `useSessionEnd`, `useEndSound`, `usePomodoroTitle` y `useCountdownAnnouncer` con `renderHook`, `jest.useFakeTimers()`, `performance.now` simulado y espías (`clearInterval`, `clearTimeout`, `removeEventListener`, `AudioContext.close`). Casos: desmontaje, cambio de dependencias, cambios rápidos (pausar y reanudar seguidos) y desmontaje antes de terminar el reintento | 1 |
| Hooks de datos | `useActiveSession`, `useStartSessionForm`, `useSessionActions`, `useWaitingTasks`; en la Fase 2, `useSessionHistory`, `useSessionDetail`, `usePomodoroAchievements` y `useNewAchievements`, con un servidor simulado | 1, 2 |
| Componentes y páginas | Cada componente y página de la sección 3 | 1, 2 |
| Regresión | `StreakPanel`, `MainNavigation` y `NavItem` siguen pasando sus tests | 0, 2 |
| E2E | Sección 3.3, en los 6 proyectos, en paralelo y con una cuenta por test (D-13, D-14) | 1, 2 |

- **Nombres de los tests:** citan su RF (`it('RF-15: …')`).
- **Sonido en Jest:** `AudioContext` se simula. En E2E solo se comprueba que el fin no falla con el audio bloqueado (RF-62).
- **Fin por tiempo en E2E:** la API decide el fin con su reloj (API-004 RNF-02), así que no se puede acelerar con el reloj del navegador. Solo un test espera el minuto real (R-4). El resto de las E2E termina las sesiones a mano, y las reglas del fin (reintento, hitos, título) se prueban en Jest con fake timers.
- **Preparar datos por API:** las E2E que no prueban empezar una sesión (tareas en espera, historial, logros) crean sus sesiones y tareas con `api-client.ts` en lugar de por la interfaz.

## 8. Trazabilidad

| RF | Pieza | Tests |
| :--- | :--- | :--- |
| RF-01 | `session-base-query.ts` | Base query |
| RF-02, RF-51 | `NavItem`, `MainNavigation`, `SubNavigation`, `PomodoroLayout` | Componentes + `navigation.e2e.ts` |
| RF-03 a RF-05, RF-71, RF-72 | `useActiveSession`, `PomodoroSessionPage` | Hook + página + `pomodoro-session.e2e.ts` |
| RF-06 a RF-14, RF-55, RF-56 | `startSessionSchema`, `useStartSessionForm`, `StartSessionForm`, `DurationPicker`, `NewTaskFields`, `WaitingTaskPicker` | Esquema + hook + componentes + `fields-pomodoro.e2e.ts` |
| RF-15 a RF-18 | `useCountdown`, `useSessionEnd`, `Countdown` | Hooks (fake timers) + `pomodoro-end.e2e.ts` |
| RF-19, RF-61, RF-62 | `useEndSound` | Hook + componente |
| RF-20 a RF-26 | `useSessionActions`, `ActiveSession`, `SessionTaskItem`, `ConfirmPomodoroDialog` | Hook + componentes + `pomodoro-session.e2e.ts` |
| RF-27, RF-28 | `SessionResult` | Componente + E2E |
| RF-29 a RF-31 | `useAddTasksForm`, `AddTasksDialog`, `SessionTaskItem` | Hook + componentes + `pomodoro-tasks.e2e.ts` |
| RF-32 a RF-37 | `useWaitingTasks`, `WaitingTaskList`, `EditPomodoroTaskDialog`, `WaitingTaskPicker` | Hook + componentes + `pomodoro-tasks.e2e.ts` + `fields-pomodoro.e2e.ts` |
| RF-38 a RF-40, RF-49, RF-53, RF-54 | `useSessionHistory`, `useSessionDetail`, páginas de historial y detalle | Hooks + páginas + `pomodoro-history.e2e.ts` |
| RF-41 a RF-44, RF-67 | `usePomodoroAchievements`, `StreakStats`, `AchievementCard` | Hook + componentes + `pomodoro-achievements.e2e.ts` |
| RF-45, RF-68 a RF-70 | `useNewAchievements`, `NewAchievementsNotice` | Hook + componente + `pomodoro-end.e2e.ts` |
| RF-46 a RF-48, RF-50 | `pomodoro.api.ts` (rechazos de estado), `errors.texts.ts` | API + hooks |
| RF-52 | `PomodoroSessionPage` | Página |
| RF-57 a RF-60 | `usePomodoroTitle` | Hook + `pomodoro-end.e2e.ts` |
| RF-63 a RF-66 | `useCountdownAnnouncer`, `Countdown` | Hook + componente |

## 9. Riesgos

- **R-1 — Contradicción en la spec sobre la recarga después del fin.** *Resuelto.* El caso límite de recarga decía que una sesión terminada con la página cerrada «se muestra terminada», en contra de RF-03 y RF-04. El usuario aprobó el cambio de spec: el resultado solo se muestra si la sesión termina con la sección abierta y se mantiene al recargar (RF-72, D-12); si termina con la página cerrada, se ve el formulario y la sesión se consulta en el historial.
- **R-2 — Fase 1 sin historial.** Hasta la Fase 2, una sesión terminada con la página cerrada no se puede consultar desde la aplicación. Sus tareas pendientes sí aparecen en espera. Es aceptable si las dos fases se entregan seguidas.
- **R-3 — Una sola sesión activa por usuario en las E2E.** *Resuelto con D-13.* Cada test del pomodoro usa su propia cuenta, así que no hay conflictos ni modo serie.
- **R-4 — Duración de las E2E de fin por tiempo.** Una sesión de 1 minuto es lo mínimo que acepta la API. Solo hay **un test** que la espera (`pomodoro-end.e2e.ts`) y comprueba a la vez el resultado, el título, el anuncio, la recarga con el resultado y el logro nuevo. Con cuentas propias y `fullyParallel` (D-13, D-14), los 6 proyectos lo ejecutan a la vez: unos 1–2 minutos de reloj, no 6. Playwright tiene 30 s por test por defecto, así que este test fija su propio `test.setTimeout` de 2 minutos.
- **R-5 — `refetch` justo en el fin.** La API puede devolver la sesión todavía en curso durante algunos milisegundos. Se cubre con el reintento de RF-18. Si en E2E sigue fallando, se ajusta `END_RETRY_DELAY_MS`.
- **R-6 — Cookies `Secure` en `http://localhost` con Firefox.** La sesión va en cookies `Secure`. Chromium las acepta en `localhost` y Firefox también en versiones recientes, pero hay que comprobarlo con el login por API (D-15) en los dos navegadores antes de migrar `board`. Si Firefox no las guarda, `signedInPage` vuelve a entrar por la interfaz solo en Firefox y se mantienen D-13 y D-14.
- **R-7 — Carga en la API con `fullyParallel`.** Más tests a la vez multiplican los registros, logins y borrados de cuentas en TaskApiSDD. Si aparecen fallos intermitentes por carga, se limita `workers` en `playwright.config.ts` en lugar de volver al modo serie.
- **R-8 — API-004 no desplegada en el entorno local.** Si TaskApiSDD corre en una versión anterior, todas las peticiones del pomodoro responden `ROUTE_NOT_FOUND` y fallan las E2E. **Solución:** antes de la Fase 1 se comprueba que `GET /pomodoros` responde `200` con una sesión iniciada (T009 y checkpoint Base), y el README lo indica como requisito previo de las E2E.
- **R-9 — Borrar la cuenta no borra su pomodoro.** API-004 dice que `DELETE /me` borra también sesiones, tareas, racha y logros del pomodoro. Si no lo hiciera, cada test de D-13 dejaría datos huérfanos en la base de datos. **Solución:** T009 lo comprueba una vez (cuenta con una sesión activa → borrar la cuenta → la sesión ya no existe). Si falla, es un fallo de TaskApiSDD que se corrige allí, no en el frontend.
- **R-10 — Cambio de día durante una E2E.** Las tareas nuevas usan la fecha de hoy y la API rechaza fechas pasadas (`DAY_CLOSED`). Un test que empieza a las 23:59 puede fallar. **Solución:** como en las E2E actuales, la fecha se calcula justo antes de enviarla con `buildClientTimeHeaders` y el día del dispositivo. No hay solución completa; si ocurre, se repite el test y no cuenta como fallo de la funcionalidad.
- **R-11 — Regresión en el tablero.** Extraer `StreakStats` de `StreakPanel` (D-10) y migrar la fixture `board` a `signedInPage` (D-15) tocan código de la 001. **Solución:** los tests de `StreakPanel`, del tablero y toda la suite E2E existente tienen que pasar sin modificarlos (T010 y T052). Si hay que cambiar uno, es una regresión y se corrige el código, no el test.
- **R-12 — Acoplamiento con las reglas de `tasks`.** Exportar `createTaskFormSchema` (D-9) hace que un cambio en las reglas de las tareas de la 001 cambie también las del pomodoro. **Solución:** es el comportamiento que exige API-004 RF-06 (mismas reglas que la 001), así que el acoplamiento es intencionado. Queda documentado en D-9 y no necesita más medidas.
- **R-13 — Quality gate con una funcionalidad grande.** Unos 40 ficheros nuevos ponen en riesgo la duplicación (≤ 3 %), la cobertura (≥ 80 %) y las incidencias nuevas de SonarQube. **Solución:** el quality gate se pasa al cerrar la Fase 1 (T047), no solo al final (T061), para corregir pronto. Se reutilizan `NewTaskFields` (empezar y añadir) y `ConfirmPomodoroDialog` (terminar y borrar) para no duplicar formularios ni diálogos.

## Registro de cambios

- **2026-11-09** — Creación del borrador del plan, con la entrega en dos fases (P1 y P2) que pidió el usuario al aprobar la spec. R-1 propone un cambio de spec pendiente de aprobación.
- **2026-11-09** — R-1 resuelto con el cambio de spec aprobado por el usuario (RF-72). Plan aprobado por el usuario. Estado → *Aprobado*.
- **2026-11-09** — E2E más rápidas, a petición del usuario: una cuenta nueva por test del pomodoro (D-13, R-3 resuelto), `fullyParallel` (D-14), sesión iniciada por API en los tests que no prueban el login (D-15) y un único test con la sesión de 1 minuto (R-4). Nuevos R-6 (cookies `Secure` en Firefox) y R-7 (carga en la API). Afecta a `playwright.config.ts` y a las fixtures de toda la suite. La spec no cambia.
- **2026-11-09** — Revisión de riesgos con el usuario: se añaden R-8 (API-004 desplegada), R-9 (borrado de la cuenta en cascada), R-10 (cambio de día en E2E), R-11 (regresión en el tablero), R-12 (acoplamiento con `tasks`) y R-13 (quality gate), con sus comprobaciones en T009, el checkpoint Base, T010, T047 y T052. La spec no cambia.
