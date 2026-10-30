# Plan: TaskFrontSDD MVP — cuenta, tablero semanal de tareas, rachas y avisos
Spec: `sdd/001-taskFrontSDD-mvp/spec.md` (Aprobada) · Estado: Aprobado · Fecha: 2026-10-29

Los RF, RNF, CE y S de este plan son los de la spec 001 del frontend. Los de la API se citan como «API-001 RF-xx» o «API-002 RF-xx». Las decisiones de este plan se numeran D-1, D-2…, y los riesgos R-1, R-2…

## 1. Resumen técnico

SPA en React con TypeScript estricto, construida con Vite y servida en desarrollo desde un contenedor `web` (Vite en :5173) y en producción con Nginx sin root. Se organiza en cinco módulos verticales:

| Módulo | Contenido |
| :--- | :--- |
| `auth` | Registro, inicio y cierre de sesión |
| `account` | Perfil, contraseña y borrado de cuenta |
| `tasks` | Tablero semanal, formularios e historial |
| `streaks` | Panel de rachas y progreso de hoy |
| `alerts` | Pantalla de avisos y aviso destacado |

Toda la comunicación con TaskApiSDD pasa por una única API base de RTK Query (`src/shared/api/`). Esa API base:
- Envía las cookies (`credentials: 'include'`).
- Añade `X-CSRF-Token` en `POST`/`PATCH`/`DELETE`.
- Añade `X-Client-Time` y `X-Timezone` en `/tasks`, `/streak` y `/alerts`.
- Ante `TOKEN_EXPIRED`, renueva la sesión una sola vez con un cerrojo compartido y repite la petición.
- Valida cada respuesta con un esquema Zod, en lugar de darla por buena con aserciones.

El estado de servidor vive solo en la caché de RTK Query, y la mutación de una tarea invalida las etiquetas `Task`, `Streak` y `Alert`. El slice `auth` guarda únicamente el estado de la sesión, el usuario y el token CSRF en memoria; tras recargar, el token se recupera de `GET /me`.

La UI se construye con componentes headless de `src/shared/ui/` y piezas de layout de `src/shared/layout/`, mobile-first, con los tokens de `design-tokens.css`.

**Requisito previo bloqueante:** `GET /me` de TaskApiSDD debe devolver `csrfToken` (D-1).

## 2. Comprobación constitucional

**Excepciones usadas:** ninguna.

| Principio | Cómo lo cumple este plan | Estado |
| :--- | :--- | :--- |
| **I. Stack cerrado y entorno** | Solo se instala el stack de `AGENTS.md` §1 más las piezas de soporte que el stack exige (sección 8): plugins de Vite y de ESLint, entorno de Jest, Testing Library y fuentes autoalojadas. Ninguna duplica una tecnología existente. Todo se ejecuta en Docker (`web`, `e2e`). La instalación se consulta al usuario antes de hacerla (AGENTS.md §6). | ✅ |
| **II. Spec-anchored** | Todo el comportamiento sale de la spec aprobada. El único hueco detectado (CSRF tras recargar) se preguntó y está en la spec como requisito previo. Cada tarea de `tasks.md` citará sus RF, y cada RF tendrá un test que cita su ID (sección 11). | ✅ |
| **III. Clarificar antes de asumir** | Sin marcas abiertas. El formato de la API se toma de `../TaskApiSDD/sdd/001` y `002`, y sus respuestas se validan con Zod (D-5). | ✅ |
| **IV. Calidad: tipado y tests** | `strict`, sin `any`, sin aserciones fuera de los tests y sin `enum`, con ESLint como error (sección 8). Un test por fichero con lógica, tests de limpieza y carreras en cada hook con efecto, E2E en Chromium y Firefox × 3 tamaños, y pre-push con Chromium (sección 10). | ✅ |
| **V. Datos, estado y seguridad** | RTK Query único. Slices solo para sesión y estado de UI compartido. Ningún React Context salvo el interno de los compound components (`Dialog`, `Drawer`, `Tabs`). Formularios con React Hook Form + `zodResolver`. Ningún secreto en `VITE_*` (solo `VITE_API_URL`). Sin `dangerouslySetInnerHTML`. | ✅ |
| **VI. Separación de responsabilidades** | Componentes sin hooks de estado ni efectos; la lógica vive en `use-*.hook.ts`. Compound para `Dialog`, `Drawer` y `Tabs`. Prop `as` en `Button`, `Text`, `Box`. Fronteras de módulo con `index.ts`. Reutilización listada en la sección 6.3. Efectos con limpieza y cancelación (D-9, D-10). | ✅ |
| **VII. Diseño y accesibilidad** | Solo tokens semánticos y el componente `Icon`. Estructura según `DESIGN.md` *Layout Patterns* y `docs/design/`. Responsive mobile-first comprobado en 3 tamaños (D-12). Accesibilidad con localizadores accesibles en las E2E. | ✅ |

## 3. Estructura de archivos

### Raíz y configuración

| Archivo | Qué hace |
| :--- | :--- |
| `package.json`, `pnpm-lock.yaml` | Dependencias con versión exacta (sección 8). Scripts: `dev`, `build`, `preview`, `lint`, `typecheck`, `test`, `test:watch`, `test:coverage`, `test:e2e`, `test:e2e:report`. |
| `tsconfig.json`, `tsconfig.node.json` | `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `erasableSyntaxOnly`, `verbatimModuleSyntax`. |
| `vite.config.ts` | Plugins `@vitejs/plugin-react` y `@tailwindcss/vite`; servidor en `0.0.0.0:5173`. |
| `eslint.config.js` | `typescript-eslint` estricto, `react-hooks` y las reglas de `AGENTS.md` §8 como error; desactiva `consistent-type-assertions` solo en tests. |
| `.prettierrc` | Formato del proyecto. |
| `jest.config.ts` | `jsdom`, `ts-jest`, `moduleNameMapper` para CSS y para `src/shared/config/env.ts` (R-3); ignora `e2e/`; cobertura `lcov`. |
| `playwright.config.ts` | `baseURL` `http://localhost:5173`; 6 proyectos (`chromium-mobile`… `firefox-desktop`) con 360×800, 768×1024 y 1280×800; `globalSetup` del usuario de prueba. |
| `Dockerfile.dev` | `node:22-alpine` + `corepack` (pnpm); `node_modules` en volumen anónimo; `pnpm dev`. |
| `Dockerfile.prod` | Multi-stage: build con `VITE_API_URL` como `ARG` → `nginxinc/nginx-unprivileged` sirviendo `dist/`. |
| `nginx.conf` | Fallback SPA a `index.html`, caché larga para `assets/`, `no-cache` para `index.html`, cabeceras de seguridad (CSP con `connect-src` a la API, `X-Content-Type-Options`, `Referrer-Policy`). |
| `docker-compose.dev.yml` | Servicios `web` y `e2e` (`network_mode: host`, imagen `mcr.microsoft.com/playwright` con la versión de `@playwright/test`). |
| `docker-compose.prod.yml` | Proyecto `taskfrontsdd-prod`, `web` con `WEB_HOST_PORT`. |
| `docker-compose.sonar.yml`, `sonar-project.properties`, `scripts/sonar-*.sh` | SonarQube en :9001 y scanner, como en `README.md`. |
| `.githooks/pre-commit`, `.githooks/pre-push` | README vivo; tests con cobertura, E2E de Chromium y quality gate. |
| `.env.example` | `VITE_API_URL`, `WEB_HOST_PORT`, `E2E_USER_EMAIL`, `E2E_USER_PASSWORD`, `SONAR_ADMIN_PASSWORD`, `SONAR_TOKEN` sin valor. |
| `.claude/settings.json`, `.claudeignore` | Permisos que impiden leer `.env.*` y generados; recordatorio del README vivo. |
| `index.html` | Título «Kompitu» (S-09), `lang="es"`, `meta viewport`, `color-scheme`. |

### `src/` (raíz)

| Archivo | Qué hace |
| :--- | :--- |
| `main.tsx` | Monta `<App />` con el `Provider` de Redux y el router. |
| `index.css` | Ya existe: Tailwind + tokens. Se añaden las fuentes (`@fontsource-variable/inter`, `@fontsource/jetbrains-mono`). |
| `styles/design-tokens.css` | Ya existe. Se añade la variante `dark` por `prefers-color-scheme` (RNF-05, D-11). |

### `src/shared/`

| Carpeta / fichero | Qué hace |
| :--- | :--- |
| `config/env.ts` | Lee y valida `VITE_API_URL` con Zod; único punto que toca `import.meta.env` (R-3). |
| `api/base.api.ts` | `createApi` con `baseQueryWithSession` y etiquetas `Task`, `Streak`, `Alert`, `Me`. |
| `api/session-base-query.ts` | Envuelve `fetchBaseQuery`: cabeceras (D-3, D-4), cerrojo de renovación (D-6), salida de sesión (RF-07). |
| `api/client-time.util.ts` | `X-Client-Time` en ISO 8601 con desfase `±HH:MM` (nunca `Z`) y `X-Timezone` IANA (API-001 RF-31 a RF-33). |
| `api/api-envelope.schema.ts` | Esquemas Zod del sobre de éxito, del de error y de la página (`items`, `page`…). |
| `api/api-error.util.ts` | Convierte un error de la API en `{ code, invalidFields }` tipado. `api/api-form-error.util.ts` (`showApiError`) lo lleva a un formulario. |
| `texts/errors.texts.ts` | Mensaje en español por cada código de error de la API (RF-41). |
| `texts/common.texts.ts` | Textos comunes (cargando, reintentar, cancelar…). |
| `store/store.ts`, `store/hooks.ts` | Store con `auth` y la API; `useAppDispatch` y `useAppSelector` tipados. |
| `router/router.tsx` | Rutas (sección 6.1); carga diferida de páginas por módulo. |
| `router/protected-route.component.tsx` | RF-08: sin sesión → `/login?returnTo=…`. |
| `router/use-session-bootstrap.hook.ts` | Al arrancar, `GET /me` para saber si hay sesión y recuperar el CSRF (D-1). |
| `date/` | `day.util.ts` (días `AAAA-MM-DD` locales, sumar días, comparar), `date-format.util.ts` (`Intl.DateTimeFormat('es-ES')`), `use-current-day.hook.ts` (RF-14). |
| `ui/` | Componentes base (sección 6.3). |
| `layout/` | Piezas de estructura (sección 6.3). |

### `src/modules/`

Cada módulo expone su API pública en `index.ts`.

| Módulo | Contenido principal |
| :--- | :--- |
| `auth/` | `pages/login.page.tsx`, `pages/register.page.tsx`; `api/auth.api.ts` (`csrf`, `register`, `login`, `logout`, `me`); `store/auth.slice.ts`, `store/auth.selectors.ts`; `schemas/login.schema.ts`, `schemas/register.schema.ts`, `schemas/user.schema.ts`; `hooks/use-login-form.hook.ts`, `use-register-form.hook.ts`, `use-logout.hook.ts`; `texts/auth.texts.ts`. |
| `account/` | `pages/account.page.tsx`; `components/profile-form.component.tsx`, `password-form.component.tsx`, `delete-account-dialog.component.tsx`; `api/account.api.ts` (`PATCH /me`, `PATCH /me/password`, `DELETE /me`); `schemas/profile.schema.ts`, `password.schema.ts`, `delete-account.schema.ts`; hooks de cada formulario; `texts/account.texts.ts`. |
| `tasks/` | `pages/board.page.tsx`, `pages/history.page.tsx`; `components/task-card.component.tsx`, `day-column.component.tsx`, `week-navigator.component.tsx`, `task-form-dialog.component.tsx`, `delete-task-dialog.component.tsx`, `history-filters.component.tsx`, `history-list.component.tsx`; `api/tasks.api.ts`; `schemas/task.schema.ts` (respuesta), `task-form.schema.ts`, `history-filters.schema.ts`; hooks `use-week-board.hook.ts`, `use-task-form.hook.ts`, `use-task-actions.hook.ts`, `use-history.hook.ts`; `texts/tasks.texts.ts`. |
| `streaks/` | `components/streak-panel.component.tsx`; `api/streaks.api.ts`; `schemas/streak.schema.ts`; `hooks/use-streak-panel.hook.ts` (racha + progreso de hoy, RF-25 a RF-28); `texts/streaks.texts.ts`. |
| `alerts/` | `pages/alerts.page.tsx`; `components/alert-item.component.tsx`, `todays-alert-banner.component.tsx`; `api/alerts.api.ts`; `schemas/alert.schema.ts`; hooks `use-alerts-page.hook.ts`, `use-todays-alert.hook.ts`; `texts/alerts.texts.ts`. |

Cada carpeta con lógica tiene su subcarpeta `tests/`.

### `e2e/`

| Carpeta | Contenido |
| :--- | :--- |
| `global-setup.ts` | Registra `E2E_USER_EMAIL` en la API si no existe (`409` se acepta); no se crea a mano. |
| `fixtures/` | `auth.fixture.ts` (sesión iniciada por la UI o por API), `tasks.fixture.ts` (crea y borra tareas por API con CSRF), `responsive.fixture.ts` (comprobaciones de VII.5). |
| `pages/` | Page objects: `login.po.ts`, `register.po.ts`, `board.po.ts`, `task-form.po.ts`, `history.po.ts`, `alerts.po.ts`, `account.po.ts`. |
| `specs/` | `login.e2e.ts`, `register.e2e.ts`, `create-task.e2e.ts`, `delete-task.e2e.ts`, `complete-task.e2e.ts`, `edit-task.e2e.ts`, `history.e2e.ts`, `alerts.e2e.ts`, `account.e2e.ts`, `fields-*.e2e.ts` (uno por formulario de RF-46), `responsive.e2e.ts`, `navigation.e2e.ts`. |

## 4. Modelo de datos del cliente

Tipos inferidos de esquemas Zod (`z.infer`), nunca escritos a mano ni con aserciones:

| Tipo | Esquema | Origen |
| :--- | :--- | :--- |
| `Task` | `taskSchema` | API-001 recurso `Task` |
| `User` | `userSchema` | API-002 recurso `User` |
| `Streak` | `streakSchema` (`current`, `best`) | API-001 `GET /streak` |
| `Alert`, `AlertType` | `alertSchema` (`type`: `'daily' \| 'weekly' \| 'monthly'`) | API-001 `GET /alerts` |
| `Page<T>` | `pageSchema(item)` | API-001 RF-39 |
| `ApiErrorCode` | Unión de literales con todos los códigos de API-001 y API-002 | Tablas de códigos |
| `DayKey` | `string` validado `AAAA-MM-DD` | Convenciones de la API |

**Slice `auth`** (único slice del MVP):

| Campo | Tipo | Uso |
| :--- | :--- | :--- |
| `status` | `'unknown' \| 'authenticated' \| 'anonymous'` | Arranque y rutas protegidas |
| `user` | `User \| null` | Barra superior (RF-50, RF-53) |
| `csrfToken` | `string \| null` | Solo en memoria (RNF-06) |

**Caché de RTK Query** (etiquetas):

| Consulta | Etiquetas | Invalidada por |
| :--- | :--- | :--- |
| Tareas de una semana | `Task` | Crear, editar, completar, desmarcar o eliminar |
| Historial | `Task` | Igual |
| Racha | `Streak` | Completar, desmarcar o eliminar |
| Avisos | `Alert` | Al volver a la pestaña (`refetchOnFocus`) |
| `GET /me` | `Me` | Cambiar nombre |

## 5. Lógica principal

### 5.1 Arranque y sesión (RF-06 a RF-08, D-1)
1. `use-session-bootstrap` llama a `GET /me`:
   - `200` → `authenticated` con `user` y `csrfToken`.
   - `401` → `anonymous`.
   Mientras tanto, la app muestra un cargador a pantalla completa.
2. Iniciar sesión pide antes `GET /auth/csrf` para el token previo, y con la respuesta guarda `user` y `csrfToken`.
3. Cerrar sesión llama a `POST /auth/logout`, vacía el slice y la caché (`resetApiState`) y navega con `replace` a `/login`, para que «atrás» no vuelva al tablero.

### 5.2 Petición con sesión (`session-base-query.ts`)
1. Añade cabeceras: `X-CSRF-Token` en `POST`/`PATCH`/`DELETE`, y `X-Client-Time` / `X-Timezone` si la ruta empieza por `/tasks`, `/streak` o `/alerts`.
2. Si la respuesta es `401 TOKEN_EXPIRED`:
   - Entra en el cerrojo de renovación (D-6).
   - Una sola `POST /auth/refresh` para todas las peticiones en vuelo.
   - Repite la petición original una vez.
3. Si la renovación falla (`SESSION_EXPIRED`, `INVALID_REFRESH_TOKEN`), o llega `INVALID_TOKEN` o `MISSING_TOKEN`:
   - Despacha `sessionEnded`.
   - Navega a `/login?returnTo=<ruta actual>&reason=expired` (RF-07).
4. Toda respuesta se valida con `apiSuccessSchema(dataSchema)`. Si no cumple el contrato, es un error `INTERNAL_ERROR` del cliente (RF-44).

### 5.3 Tablero semanal (RF-09 a RF-14, RF-47)
- La semana visible es `weekStart: DayKey` en el estado del hook `use-week-board` (estado de UI local, no compartido). «Hoy» la reinicia y avanzar o retroceder suma o resta 7 días.
- **Consulta:** `GET /tasks?from=weekStart&to=weekStart+6&pageSize=100`. Si `totalPages > 1`, se piden las páginas restantes y se concatenan (R-4).
- **Agrupación:** se agrupa por `date` en 7 columnas y cada columna separa pendientes y completadas, conservando el orden de la API (RF-10).
- **Estado de cada columna:**
  - Día anterior a hoy → solo lectura (RF-13).
  - Hoy → editable y con opción de completar.
  - Futuro → editable sin opción de completar (RF-22).
- `use-current-day` detecta el cambio de día al recuperar el foco y con un temporizador hasta la próxima medianoche local. Al cambiar, invalida `Task` y `Streak` (RF-14).

### 5.4 Crear, editar, completar, eliminar (RF-15 a RF-24, RF-29, RF-30, RF-51, RF-52)
- **Diálogo único `TaskFormDialog`** para crear y editar:
  - En modo editar no muestra el campo fecha.
  - Botón de enviar deshabilitado mientras `isLoading` (RF-19).
  - Contador de caracteres (RF-17).
- **Al crear:**
  - Si la fecha está en la semana visible, aparece en su columna tras invalidar la caché (RF-18).
  - Si no, se muestra un aviso con la fecha (RF-52).
- **Completar y desmarcar:** `PATCH /tasks/{id}` con `completed`. Actualización optimista en la caché de la semana, que se deshace si la API rechaza; después se invalida `Streak` (RF-20, RF-21).
- **Eliminar:** `DeleteTaskDialog` con el título (RF-23) y después `DELETE` (RF-24).
- **Errores de la API:**
  - `DAY_CLOSED` / `DAY_NOT_STARTED` → mensaje e invalidación de `Task` (RF-42).
  - `TASK_NOT_FOUND` → mensaje e invalidación (RF-45).

### 5.5 Racha y progreso (RF-25 a RF-28)
- `use-week-board` calcula `todayProgress = { done, total }` con la columna de hoy de la consulta de la semana, sin pedir nada más. Si la semana visible no incluye hoy, consulta solo `?date=hoy` (`getDayTasks`, a la que también se aplica el cambio optimista de completar).
- `use-streak-panel(todayProgress)` lo combina con `GET /streak`:
  - `atRisk = done === 0 && current > 0`.
  - `total === 0` → «Sin tareas hoy».
- Así `streaks` no depende de `tasks`: el tablero le pasa el progreso y la acción de crear una tarea para hoy.

### 5.6 Historial (RF-31 a RF-34)
- **Filtros:** formulario con `history-filters.schema.ts` (`from`/`to` opcionales y `from <= to` con `refine`). Los filtros válidos se reflejan en la URL (`?status=&from=&to=&page=`) para que se puedan recargar y compartir (D-8).
- **Consulta:** `GET /tasks` con esos parámetros y `pageSize=50` (S-06).
- **Página fuera de rango:** si `page > totalPages > 0`, se reemplaza la URL por la última página.

### 5.7 Avisos (RF-35 a RF-37)
- **Pantalla:** `GET /alerts?page=n`.
- **Aviso destacado:** `GET /alerts?pageSize=1`. Se destaca si su `createdAt`, en la fecha local del dispositivo, es hoy.
- **Tareas de un aviso:** se muestran con la nota de RF-36.

### 5.8 Cuenta (RF-38, RF-39, RF-48, RF-49, RF-53)
- **Perfil:** `PATCH /me` invalida `Me` y actualiza `user` en el slice.
- **Contraseña:** `PATCH /me/password` muestra el mensaje de sesiones cerradas.
- **Borrado:** `DELETE /me` vacía la sesión y la caché y navega a `/login`.
- **Contraseña incorrecta:** `WRONG_PASSWORD` se asigna al campo de contraseña con `setError` (RF-48).
- **Bloqueo:** `TOO_MANY_ATTEMPTS` en inicio de sesión, cambio de contraseña o borrado muestra el mensaje de RF-05.

### 5.9 Errores (RF-40 a RF-45)
- `api-error.util` convierte `{ error: { code, details } }` en `code: ApiErrorCode` e `invalidFields` (los `field` de `details`). El texto de cada detalle no se usa: es el genérico de la validación de la API y puede ser técnico («se esperaba que texto tuviera >=12 caracteres»).
- Los formularios marcan con `showApiError` cada campo rechazado con «Revisa este campo.» (`errors.texts.ts`). Si no rechaza ningún campo del formulario, el mensaje del código va al error general.
- Fallo de red o `INTERNAL_ERROR` → mensaje con «Reintentar» (`refetch`) (RF-44).

## 6. Interfaz

### 6.1 Rutas

| Ruta | Pantalla | Acceso | RF |
| :--- | :--- | :--- | :--- |
| `/login` | Inicio de sesión | Solo sin sesión | RF-04, RF-05, RF-07 |
| `/register` | Registro | Solo sin sesión | RF-01 a RF-03 |
| `/` | Tablero semanal con panel de rachas y aviso destacado | Con sesión | RF-09 a RF-30, RF-37 |
| `/history` | Historial | Con sesión | RF-31 a RF-34 |
| `/alerts` | Avisos | Con sesión | RF-35, RF-36 |
| `/account` | Perfil, contraseña y borrado | Con sesión | RF-38, RF-39, RF-48, RF-49 |

Las rutas van en inglés, como el resto del código. Los textos visibles van en español.

### 6.2 Layout (según `DESIGN.md` *Layout Patterns* y `docs/design/`)
- **`AppShell`:**
  - Escritorio (`lg`): `Sidebar` de 240px con la navegación (RF-50, RF-54) y `Navbar` de 64px.
  - Móvil y tablet: `Navbar` con botón de menú que abre la navegación en un `Drawer`.
- **Tablero:**
  - `PageHeader` con «Tablero», `WeekNavigator` y «Nueva tarea».
  - Debajo, `StreakPanel` y `TodaysAlertBanner`.
  - Después, el `Board`: fila de 7 `BoardColumn` de 264px con `overflow-x-auto` solo dentro del tablero (VII.5, excepción).
- **Formularios:** `Field` (etiqueta + campo + error bajo el campo) con `Input` o `Textarea`.

### 6.3 Componentes: reutilización y nuevos (CONSTITUTION VI.5)

No hay componentes previos: todos son nuevos y se crean una sola vez.

| Componente | Dónde | Patrón | Lo reutilizan |
| :--- | :--- | :--- | :--- |
| `Button` | `shared/ui` | Polimórfico (`as`), `variant` y `size` según `DESIGN.md` | Todas las pantallas |
| `Text` | `shared/ui` | Polimórfico (`as`), `variant` = estilos de texto de `DESIGN.md` | Todas |
| `Box` | `shared/ui` | Polimórfico, contenedor con `variant` (`card`, `surface`) | Tarjetas, paneles |
| `Icon` | `shared/ui` | Único acceso a Lucide; tamaño y grosor desde constantes (VII.2) | Todas |
| `Field`, `Input`, `Textarea`, `DateInput`, `SelectNative`, `PasswordInput` | `shared/ui` | Campos accesibles; `PasswordInput` con «mostrar» (S-11) | Todos los formularios |
| `Checkbox` | `shared/ui` | Casilla nativa con la casilla visible de DESIGN.md y zona pulsable de 44×44 px en móvil | Completar tareas |
| `Badge` | `shared/ui` | `variant` = variantes de `DESIGN.md` | Estado de tarea, tipo de aviso, contadores |
| `Dialog` | `shared/ui` | Compound (`Dialog.Trigger`, `.Content`, `.Title`, `.Actions`) con contexto interno | Crear/editar, eliminar, borrar cuenta |
| `Drawer` | `shared/ui` | Compound | Navegación móvil |
| `Spinner`, `Pagination`, `ErrorMessage` (con «Reintentar») | `shared/ui` | — | Historial, avisos, tablero |
| `AppShell`, `Sidebar`, `Navbar`, `NavItem` | `shared/layout` | Composición con `children` | Todas las pantallas privadas |
| `AuthLayout` | `shared/layout` | — | Inicio de sesión y registro |
| `PageHeader`, `PageContainer`, `EmptyState` | `shared/layout` | Slots con `children` | Todas |
| `BoardColumn` | `shared/layout` | Columna genérica (cabecera + contador + lista) | `DayColumn` del tablero |

## 7. Decisiones técnicas

- **D-1 — CSRF tras recargar:** la API devolverá `csrfToken` en `GET /me` (decisión del usuario, 2026-10-29). El frontend lo guarda solo en memoria. **Bloquea** las tareas de sesión hasta que la API lo implemente. Mientras tanto, el desarrollo usa el token del inicio de sesión y una recarga obliga a volver a entrar.
- **D-2 — API base única:** `createApi` en `shared/api` y `injectEndpoints` en cada módulo. Una sola caché y un solo `baseQuery`.
- **D-3 — Hora del dispositivo:**
  - `X-Client-Time` se genera en cada petición con el desfase local `±HH:MM`, a partir de `getTimezoneOffset()`.
  - `X-Timezone` sale de `Intl.DateTimeFormat().resolvedOptions().timeZone`.
  - Sin librerías de fechas.
- **D-4 — Días locales:** los `DayKey` se calculan con la fecha local del dispositivo, nunca con `toISOString()` (que da UTC).
- **D-5 — Validar respuestas con Zod:** `transformResponse` hace `schema.parse` sobre `unknown`. Es la alternativa a las aserciones que exige II.2.
- **D-6 — Cerrojo de renovación:** una promesa compartida de módulo. Las peticiones que reciben `TOKEN_EXPIRED` mientras hay una renovación en curso esperan a esa misma promesa. Sin dependencia (`async-mutex` descartado).
- **D-7 — Optimista solo al completar o desmarcar:** es la acción más frecuente (CE-02). Crear, editar y eliminar esperan a la API e invalidan la caché.
- **D-8 — Filtros del historial en la URL:** estado de UI que no va al store, porque la URL ya lo guarda y permite recargar (V.2 se refiere al estado compartido).
- **D-9 — Efectos:** solo en `use-current-day` (temporizador + `visibilitychange`), en `Dialog` y `Drawer` (foco atrapado, Escape, bloqueo de scroll) y en el bootstrap. Todos con limpieza y tests de limpieza y carreras (IV.4).
- **D-10 — Peticiones:** las cancela RTK Query. Ningún efecto hace `fetch`.
- **D-11 — Modo oscuro:** `design-tokens.css` define la variante `dark` por `@media (prefers-color-scheme: dark)` y por la clase `.dark`, sin selector manual (RNF-05).
- **D-12 — Responsive:** clases base para móvil y `md:` / `lg:` para ampliar. La navegación pasa a `Sidebar` en `lg`. Las tarjetas y formularios ocupan `w-full` con `max-w-content`.
- **D-13 — Fuentes autoalojadas** con `@fontsource`, sin peticiones a Google (CSP más estricta y sin dependencia externa en ejecución).

## 8. Complexity Tracking

### Dependencias

Todas con versión exacta publicada hace al menos dos semanas. Se instalan dentro del contenedor y **solo tras la aprobación del usuario**.

| Paquete | Tipo | Motivo |
| :--- | :--- | :--- |
| `react`, `react-dom` | runtime | Stack |
| `react-router` | runtime | Stack (enrutado) |
| `@reduxjs/toolkit`, `react-redux` | runtime | Stack (estado y RTK Query) |
| `react-hook-form`, `@hookform/resolvers`, `zod` | runtime | Stack (formularios y validación) |
| `lucide-react` | runtime | Stack (iconos) |
| `@fontsource-variable/inter`, `@fontsource/jetbrains-mono` | runtime | Fuentes de `DESIGN.md` autoalojadas (D-13) |
| `vite`, `@vitejs/plugin-react` | dev | Stack (build) |
| `tailwindcss`, `@tailwindcss/vite` | dev | Stack (estilos) |
| `typescript` | dev | Stack |
| `eslint`, `typescript-eslint`, `eslint-plugin-react-hooks`, `prettier` | dev | Reglas que hacen cumplir la constitución (AGENTS.md §8) |
| `jest`, `ts-jest`, `jest-environment-jsdom`, `@types/jest` | dev | Stack (tests) en TypeScript con DOM |
| `@jest/globals` | dev | Objeto `jest` (`jest.fn`, `jest.useFakeTimers`) en modo ESM, donde Jest no lo inyecta como global. Necesario para los tests de limpieza y carreras de los efectos (IV.4). Añadido el 2026-10-29 con aprobación del usuario |
| `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom` | dev | Stack (React Testing Library) |
| `identity-obj-proxy` | dev | Importar CSS en Jest |
| `@playwright/test` | dev | Stack (E2E) |

**Descartadas:**
- `axios`, porque duplica RTK Query.
- `msw`: los tests de hooks simulan `fetch` con `jest.fn`, sin otra librería.
- `date-fns` y `dayjs`: `Intl` y utilidades propias bastan (D-3, D-4).
- `async-mutex` (D-6).
- `@radix-ui/*`: `Dialog` y `Drawer` propios, compound.
- `clsx`: utilidad propia de 5 líneas.

### Piezas nuevas
- **Cerrojo de renovación (D-6):** alrededor de 20 líneas, con tests de concurrencia.
- **Atrapar el foco en `Dialog` y `Drawer`:** hook `use-focus-trap.hook.ts` con efecto, limpieza y tests.
- **Tipado polimórfico de `as` sin aserciones:** genéricos con `ComponentPropsWithoutRef<T>` (R-5).

## 9. Riesgos

- **R-1 — La API aún no devuelve `csrfToken` en `GET /me` (D-1).** Sin ese cambio no se cumple la recarga sin volver a entrar. *Mitigación:* las tareas de sesión que dependen de ello quedan bloqueadas hasta que la API lo implemente; el resto avanza.
- **R-2 — Red del contenedor `e2e` (`network_mode: host`) en Docker Desktop para Mac.** *Mitigación:* primera tarea de E2E = comprobarlo. Si no funciona, servir `web` por HTTPS en desarrollo y ajustar `CORS_ORIGIN`.
- **R-3 — `import.meta.env` en Jest (CommonJS).** *Mitigación:* todo acceso pasa por `shared/config/env.ts`, que Jest sustituye con `moduleNameMapper`.
- **R-4 — Más de 100 tareas en una semana:** la API limita `pageSize` a 100. *Mitigación:* la consulta de la semana pide todas las páginas (5.3).
- **R-5 — Componentes polimórficos sin aserciones:** el patrón habitual usa `as`. *Mitigación:* tipado con genéricos y `forwardRef` sin casts. Si no es viable para un caso, se pregunta al usuario antes de escribir una excepción.
- **R-6 — Reloj del dispositivo desviado más de 5 minutos:** todas las peticiones de tareas fallan. *Mitigación:* mensaje de RF-43 y E2E con el reloj del contenedor.
- **R-7 — Duración de la suite E2E:** 6 proyectos contra la API real. *Mitigación:* pre-push solo con Chromium (IV.6) y fixtures que crean los datos por API, no por la UI.
- **R-8 — El usuario de prueba acumula datos:** *Mitigación:* cada fixture borra lo que crea. `globalSetup` no borra la cuenta, porque se reutiliza.

## 10. Estrategia de tests

| Nivel | Qué | Herramientas |
| :--- | :--- | :--- |
| Unitario | Utilidades de fechas y cabeceras, `api-error.util`, esquemas Zod (cada regla de RF-46 en su frontera: 200/201, 1000/1001, 11/12/128/129), slice `auth` | Jest |
| Hooks | Cada `use-*.hook.ts` con `renderHook`. `fetch` simulado con `jest.fn`. Hooks con efecto: limpieza al desmontar y al cambiar dependencias, y carreras (cambios rápidos, desmontaje antes de terminar) | Jest + Testing Library + `jest.useFakeTimers()` |
| `baseQuery` | Cabeceras por método y ruta; renovación única con 3 peticiones simultáneas en `TOKEN_EXPIRED`; salida de sesión con `SESSION_EXPIRED` | Jest |
| Componentes | Renderizado con props y `children`, accesibilidad (roles, etiquetas), `as` polimórfico, compound fuera del padre → error | React Testing Library |
| E2E | Specs de la sección 3 en 6 proyectos: inicio de sesión, crear tarea, eliminar tarea y cada campo de RF-46 (válido, cada regla, teclado), más responsive en cada pantalla | Playwright contra TaskApiSDD real |

- **Nombres de los tests:** citan su RF (`it('RF-17: …')`).
- **Cobertura:** ≥ 80 %, sin contar `*.types.ts`, `*.texts.ts`, `*.constants.ts`, `main.tsx`.

## 11. Trazabilidad

| RF | Módulo / pieza | Test principal |
| :--- | :--- | :--- |
| RF-01 a RF-05 | `auth` (páginas, esquemas, hooks de formulario) | Esquemas + hooks; `register.e2e.ts`, `login.e2e.ts` |
| RF-06, RF-07 | `shared/api/session-base-query.ts` | `session-base-query.test.ts`; `login.e2e.ts` (vuelta a `returnTo`) |
| RF-08 | `shared/router/protected-route` | Componente + `navigation.e2e.ts` |
| RF-09 a RF-14, RF-47 | `tasks` (`use-week-board`, `DayColumn`, `WeekNavigator`), `shared/date/use-current-day` | Hooks + `board` E2E en `create-task.e2e.ts` |
| RF-15 a RF-19, RF-51, RF-52 | `tasks` (`TaskFormDialog`, `use-task-form`) | Hook + `create-task.e2e.ts` + `fields-task.e2e.ts` |
| RF-20 a RF-22 | `tasks` (`use-task-actions`) | Hook + `complete-task.e2e.ts` |
| RF-23, RF-24 | `tasks` (`DeleteTaskDialog`) | Componente + `delete-task.e2e.ts` |
| RF-25 a RF-28 | `streaks` (`use-streak-panel`, `StreakPanel`) | Hook + `complete-task.e2e.ts` |
| RF-29, RF-30 | `tasks` (`TaskFormDialog` en modo editar) | Hook + `edit-task.e2e.ts` |
| RF-31 a RF-34 | `tasks` (`use-history`, filtros, lista, `Pagination`) | Hook + `history.e2e.ts` + `fields-history.e2e.ts` |
| RF-35 a RF-37 | `alerts` | Hooks + `alerts.e2e.ts` |
| RF-38, RF-39, RF-48, RF-49, RF-53 | `account` | Hooks + `account.e2e.ts` + `fields-account.e2e.ts` |
| RF-40 a RF-45 | `shared/api`, `shared/texts/errors.texts.ts`, `ErrorMessage` | `api-error.util.test.ts` + casos en cada E2E |
| RF-46 | Esquemas de cada formulario | Tests de esquemas + `fields-*.e2e.ts` |
| RF-50, RF-54 | `shared/layout` (`AppShell`, `Sidebar`, `Drawer`, `NavItem`) | Componentes + `navigation.e2e.ts` |
| RNF-03, CE-07 | Todas las pantallas | `responsive.e2e.ts` en los 6 proyectos |

## Registro de cambios

- **2026-10-29** — Creación del borrador del plan.
- **2026-10-29** — Plan aprobado por el usuario, incluidas las dependencias de la sección 8, las rutas en inglés y la actualización optimista solo al completar o desmarcar (D-7). Estado → *Aprobado*.
- **2026-10-29** — Sección 8: añadida `@jest/globals` (aprobada por el usuario), porque en modo ESM Jest no inyecta el objeto `jest`.
- **2026-10-30** — §3 y §5.9: los errores de campo de la API se muestran con un mensaje propio del cliente («Revisa este campo.») en lugar del texto de `details`, que llega en español pero a veces es técnico (RF-41). `fieldErrors` pasa a `invalidFields` y se añade `showApiError` (decisión del usuario).
- **2026-10-30** — §6.3: añadido `Checkbox` (`shared/ui`), necesario para completar tareas con el objetivo táctil de VII.4.
- **2026-10-30** — §5.5: el progreso de hoy lo calcula `use-week-board` y se pasa a `use-streak-panel`, para que `streaks` no importe de `tasks` (evita una dependencia circular entre módulos). Se añade `getDayTasks`.
