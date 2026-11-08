# Plan: TaskDay — las tareas que he hecho hoy
Spec: `sdd/002-taskDay/spec.md` (Aprobada) · Estado: Aprobado · Fecha: 2026-11-08

Los RF, CE y S de este plan son los de la spec 002. Los del MVP del frontend se citan como «001 RF-xx» y los de la API como «API-001 RF-xx». Las decisiones se numeran D-1, D-2… y los riesgos R-1, R-2…

## 1. Resumen técnico

Una pantalla nueva del módulo `tasks` en `/taskday`, «Hecho hoy», que lista en solo lectura las tareas completadas del día actual del dispositivo.

- **Datos:** reutiliza la consulta paginada del historial, `getTasks`, con `status: 'completed'`, `from` y `to` iguales a hoy (D-1). No hay endpoints, etiquetas ni dependencias nuevas.
- **Actualización (RF-06):** `getTasks` ya da la etiqueta `{ type: 'Task', id: 'HISTORY' }`, que se invalida al completar, desmarcar (T116 de la 001), editar o eliminar. La pantalla se actualiza sin código propio.
- **Cambio de día (RF-07):** el día sale de `useCurrentDay` (001 RF-14), que cambia a medianoche y al volver a la pestaña. Al cambiar el día cambia el argumento de la consulta y RTK Query pide la del día nuevo.
- **Interfaz:** la lista paginada del historial se extrae a un componente común, `PagedTaskList`, que usan las dos pantallas (D-2). La navegación gana el acceso «Hecho hoy» después de «Tablero».

## 2. Comprobación constitucional

**Excepciones usadas:** ninguna.

| Principio | Cómo lo cumple este plan | Estado |
| :--- | :--- | :--- |
| **I. Stack cerrado y entorno** | Sin dependencias nuevas. El icono sale de Lucide, que ya está en el stack. Todo se ejecuta en Docker. | ✅ |
| **II. Spec-anchored** | Spec 002 aprobada. La ampliación de la navegación (001 RF-50, RF-54) está anotada en el registro de cambios de la 001. Cada tarea de `tasks.md` cita sus RF y cada RF tiene su test (sección 8). | ✅ |
| **III. Clarificar antes de asumir** | Sin marcas abiertas. El contrato de `GET /tasks` (`status`, `from`, `to`, `page`, `pageSize`) se toma de API-001 y ya se valida con `taskPageSchema`. | ✅ |
| **IV. Calidad: tipado y tests** | Sin `any`, aserciones ni `enum`. Tests del hook, del componente extraído y de la página, y E2E nuevas en los 6 proyectos (sección 7). No hay campos escribibles nuevos, así que no hay specs de campos. | ✅ |
| **V. Datos, estado y seguridad** | Los datos solo viven en la caché de RTK Query. Sin slices, Context ni formularios nuevos. | ✅ |
| **VI. Separación de responsabilidades** | La lógica va en `use-task-day.hook.ts`. Sin `useEffect` nuevo: el día y la página reutilizan `useCurrentDay` y `useUrlPage`/`useClampUrlPage`, que ya tienen sus tests de limpieza. `PagedTaskList` evita duplicar la lista del historial (VI.5). `tasks` solo usa `src/shared/`. | ✅ |
| **VII. Diseño y accesibilidad** | Mismas piezas que el historial (`PageContainer`, `PageHeader`, `TaskCard` en `variant="list"`, `EmptyState`, `Pagination`) y solo tokens existentes. Responsive comprobado en `responsive.e2e.ts`. | ✅ |

## 3. Estructura de archivos

`tasks/` abrevia `src/modules/tasks/`. Los tests van en la subcarpeta `tests/` de cada carpeta.

| Archivo | Cambio | RF |
| :--- | :--- | :--- |
| `src/shared/router/routes.constants.ts` | `taskDay: '/taskday'` | RF-01 |
| `src/shared/router/router.tsx` | Ruta privada `/taskday` → `TaskDayPage` | RF-01 |
| `src/shared/texts/navigation.texts.ts` | `taskDay: 'Hecho hoy'` | RF-08 |
| `src/shared/layout/main-navigation.component.tsx` | `NavItem` «Hecho hoy» con el icono `CircleCheckBig`, después de «Tablero» | RF-08 |
| `tasks/types/paged-tasks.types.ts` | **Nuevo.** `PagedTasks`: modelo de una lista paginada (estado, tareas, página, totales, `goToPage`, error y `retry`) | — |
| `tasks/components/paged-task-list.component.tsx` | **Nuevo**, extraído de `history-list`: carga, error, estado vacío (en `children`), lista y paginación | RF-02, RF-04 |
| `tasks/components/history-list.component.tsx` | Pasa a usar `PagedTaskList`, sin cambiar lo que muestra | 001 RF-31, RF-34 |
| `tasks/hooks/use-task-day.hook.ts` | **Nuevo.** Día actual + página de la URL → `getTasks` de las completadas de hoy; devuelve `PagedTasks` | RF-01, RF-03, RF-06, RF-07 |
| `tasks/pages/task-day.page.tsx` | **Nuevo.** Cabecera «Hecho hoy» y `PagedTaskList` sin acciones; estado vacío con «Ir al tablero» | RF-01 a RF-05 |
| `tasks/texts/tasks.texts.ts` | Bloque `taskDay`: título, nombre de la lista, total, estado vacío y enlace al tablero | RF-03, RF-04 |
| `tasks/index.ts` | Exporta `TaskDayPage` | — |
| `e2e/pages/task-day.po.ts` | **Nuevo.** Page object | — |
| `e2e/specs/task-day.e2e.ts` | **Nueva** | RF-01 a RF-06, RF-08 |
| `e2e/specs/responsive.e2e.ts` | Añade la pantalla «Hecho hoy» | CE-03 |
| `e2e/specs/navigation.e2e.ts` | Añade «Hecho hoy» a las pantallas de la navegación | RF-08 |
| `README.md` | *Funcionalidades* y *Estado del proyecto* | — |

## 4. Lógica principal

### 4.1 `useTaskDay` (RF-01, RF-03, RF-06, RF-07)
- `today = useCurrentDay()` y `urlPage = useUrlPage()`.
- `useGetTasksQuery({ status: 'completed', from: today, to: today, page })`. Se usa `currentData`, no `data`: al cambiar el día no se muestran ni un instante las tareas del día anterior.
- `useClampUrlPage(urlPage, currentData?.totalPages)`: una página fuera de rango pasa a la última (S-02).
- Devuelve `PagedTasks`. El estado (`loading` | `error` | `ready`), el mensaje de error y `retry` se calculan igual que en `useHistory`. `totalItems` es la cuenta de RF-03.

### 4.2 Solo lectura (RF-05)
`PagedTaskList` pinta cada tarea con `TaskCard variant="list"` sin `onToggleCompleted`, `onEdit` ni `onDelete`. Así no aparece ninguna casilla ni botón de acción, igual que en el historial.

## 5. Interfaz

### 5.1 Ruta

| Ruta | Pantalla | Acceso | RF |
| :--- | :--- | :--- | :--- |
| `/taskday` | Hecho hoy | Con sesión | RF-01 a RF-07 |

### 5.2 Pantalla
- `PageHeader` con el título «Hecho hoy» (H1).
- `PagedTaskList`:
  - **Lista:** nombre accesible «Tareas hechas hoy». Cada tarea con su título y su descripción completos, sin fecha: todas son de hoy.
  - **Pie:** `Pagination` con el total, «1 tarea completada hoy» o «N tareas completadas hoy» (RF-03).
  - **Vacío:** `EmptyState` con «Todavía no has completado ninguna tarea hoy.» y el enlace «Ir al tablero» (`Button as={Link}`, RF-04).
  - **Carga y error:** `Spinner` y `ErrorMessage` con «Reintentar» solo en la zona de la lista (001 RF-40, RF-44).

### 5.3 Componentes: reutilización y nuevos (CONSTITUTION VI.5)

| Componente | Origen | Uso |
| :--- | :--- | :--- |
| `PageContainer`, `PageHeader`, `EmptyState` | `shared/layout` | Estructura y estado vacío |
| `NavItem` | `shared/layout` | Acceso «Hecho hoy» |
| `Button` (`as={Link}`), `Text`, `Spinner`, `ErrorMessage`, `Pagination` | `shared/ui` | Enlace al tablero, textos, estados y páginas |
| `TaskCard` (`variant="list"`) | `tasks/components` | Cada tarea, en solo lectura |
| **`PagedTaskList`** (nuevo) | `tasks/components` | Lista paginada común del historial y de «Hecho hoy». Se justifica en D-2 |

## 6. Decisiones técnicas

- **D-1 — Reutilizar `getTasks` en lugar de un endpoint propio.** Ya pide `GET /tasks` paginado con `status`, `from` y `to`, valida la respuesta y tiene la etiqueta que se invalida en cada cambio de una tarea. Un endpoint nuevo repetiría todo eso y necesitaría su propia invalidación. Se usa `from`/`to` igual a hoy en lugar de `date` porque es lo que ya acepta `HistoryQuery`; la API devuelve lo mismo (API-001 RF-08, RF-40).
- **D-2 — Extraer `PagedTaskList` de `HistoryList`.** Las dos pantallas pintan lo mismo: carga, error, vacío, lista de `TaskCard` y paginación. Copiarlo duplicaría unas 30 líneas, por encima del 3 % de duplicación que permite SonarQube (AGENTS.md §7) y en contra de VI.5. Lo que cambia se pasa sin props de contenido prohibidas: el estado vacío va en `children`, y `variant: 'history' | 'taskDay'` elige en `tasks.texts.ts` el nombre accesible de la lista y el texto del total, y si cada tarea muestra su fecha.
- **D-3 — La página va en la URL (`?page=n`),** como en el historial (001 D-8), con `useUrlPage` y `useClampUrlPage`.
- **D-4 — Sin `useEffect` nuevo.** El cambio de día lo resuelve `useCurrentDay` y la página fuera de rango `useClampUrlPage`. Los dos ya tienen tests de limpieza y carreras.
- **D-5 — Icono `CircleCheckBig` de Lucide.** `DESIGN.md` fija Lucide como librería, sin una lista cerrada de iconos. Se usa a través de `Icon` (VII.2).

## 7. Estrategia de tests

| Nivel | Qué | Test |
| :--- | :--- | :--- |
| Hook | Pide las completadas de hoy con `from` = `to` = hoy; estados de carga, error y listo; `totalItems`; al cambiar el día pide las del nuevo (fake timers en la medianoche); página fuera de rango → última | `use-task-day.hook.test.ts` |
| Componente | `PagedTaskList`: carga, error con «Reintentar», `children` como estado vacío, `variant` con y sin fecha, paginación | `paged-task-list.component.test.tsx` |
| Página | Título, lista sin casillas ni botones de acción, total, estado vacío con enlace al tablero | `task-day.page.test.tsx` |
| Regresión | `HistoryList` y la página del historial siguen pasando sus tests sin cambios de comportamiento | Tests existentes |
| E2E | Solo las completadas de hoy, vacío, sin acciones, actualización tras completar en el tablero, navegación y responsive | `task-day.e2e.ts`, `navigation.e2e.ts`, `responsive.e2e.ts` |

- **Datos de las E2E:** una tarea con fecha de ayer no se puede crear (API-001 RF-07). Para «no muestra las de otros días» se usa una tarea de mañana y una pendiente de hoy.
- **Nombres de los tests:** citan su RF (`it('RF-01: …')`).

## 8. Trazabilidad

| RF | Pieza | Tests |
| :--- | :--- | :--- |
| RF-01 | `useTaskDay`, ruta `/taskday` | Hook + `task-day.e2e.ts` |
| RF-02 | `PagedTaskList` (`variant="taskDay"`) | Componente + página |
| RF-03 | `useTaskDay` (`totalItems`), texto del total | Hook + página + E2E |
| RF-04 | `TaskDayPage` (estado vacío con enlace) | Página + E2E |
| RF-05 | `PagedTaskList` sin acciones | Página + E2E |
| RF-06 | Etiqueta `HISTORY` de `getTasks` | E2E (completar en el tablero → aparece sin recargar) |
| RF-07 | `useCurrentDay` → argumento de la consulta | Hook (fake timers) |
| RF-08 | `MainNavigation`, `navigation.texts.ts` | Componente + `navigation.e2e.ts` |

## 9. Riesgos

- **R-1 — Avisos generados por la API durante las E2E.** Las tareas pendientes de hoy pueden generar un aviso real (API-001 RF-24 a RF-26, RF-47). No afecta a esta pantalla, que no muestra avisos.
- **R-2 — Más de 100 tareas completadas hoy.** `getTasks` pide una página de 50 y la pantalla pagina (S-02), así que no aplica el límite de 100 de `fetchAllTasks`.

## Registro de cambios

- **2026-11-08** — Creación del borrador del plan.
- **2026-11-08** — Plan aprobado por el usuario. Estado → *Aprobado*.
- **2026-11-08** — D-2 ajustada al implementar: `PagedTaskList` no recibe `label`; `variant: 'history' | 'taskDay'` elige el nombre de la lista, el texto del total y si se muestra la fecha, todo desde `tasks.texts.ts`.
