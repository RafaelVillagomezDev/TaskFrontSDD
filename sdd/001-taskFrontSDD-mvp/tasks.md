# Tasks: TaskFrontSDD MVP — cuenta, tablero semanal de tareas, rachas y avisos
Spec: `sdd/001-taskFrontSDD-mvp/spec.md` (Aprobada) · Plan: `sdd/001-taskFrontSDD-mvp/plan.md` (Aprobado) · Fecha: 2026-10-29

## Cómo leer este fichero

- **Formato:** `- [ ] T### [P] [Fase] Descripción (RF-xx) — archivo(s)`, seguido de una línea **Verifica** con el comando que da la tarea por terminada.
- **[P]:** se puede hacer en paralelo con las demás tareas [P] de su bloque: archivos distintos y sin dependencias pendientes.
- **Fases:**
  - `[Base]`: fase común.
  - `[H1]` a `[H11]`: las historias HU-01 a HU-11 de la spec, en orden de prioridad (P1: H1–H6; P2: H7–H10; P3: H11).
  - `[Rob]`: robustez y cierre.
- **Dentro de cada historia:** primero los tests, que **deben fallar** (rojo); después la implementación, que los hace pasar (verde).
- **Nombres de los tests:** citan su RF (`it('RF-17: …')`), por la trazabilidad de CONSTITUTION II.5.
- **Comandos:** todo se ejecuta en Docker. Abreviaturas:
  - `dce` = `docker compose -f docker-compose.dev.yml exec web`.
  - `dre` = `docker compose -f docker-compose.dev.yml run --rm e2e`.
- **Requisito previo de las E2E:** `web` levantado y TaskApiSDD levantada en `http://localhost:3000`, desde su repositorio.
- Los RF, RNF, CE y S son los de la spec 001 del frontend. Las decisiones D-xx y los riesgos R-xx, los del plan. `tasks/` abrevia `src/modules/tasks/`, y lo mismo el resto de módulos.
- **Dependencias:** las de la sección 8 del plan, que el usuario aprobó junto con el plan. Aun así, T003 y T004 se confirman con el usuario justo antes de ejecutarse (AGENTS.md §6).

---

## Requisitos externos

- [ ] X001 [Externa] **TaskApiSDD:** `GET /me` devuelve también `csrfToken` (requisito previo de la spec, D-1, R-1). Se especifica e implementa en el repositorio de la API.
  - Verifica: con sesión iniciada, `curl -b cookies.txt http://localhost:3000/me` devuelve `data.csrfToken`.
  - **Bloquea:** T054. Todo lo demás puede avanzar.

---

## Fase 0 — Base

### Entorno
- [x] T001 [Base] `package.json` mínimo: `private`, `type: module`, `packageManager` con versión exacta de pnpm y los scripts del plan §3 — `package.json`
  - Verifica: `docker run --rm -v "$PWD":/app -w /app node:22-alpine node -e "JSON.parse(require('fs').readFileSync('package.json','utf8'))"` termina sin error.
  - Hecho (2026-10-29): `pnpm@12.12.0`, la misma versión que TaskApiSDD; scripts de Jest en modo ESM como en el backend. Docker estaba parado: el JSON se validó con `python3 -m json`; se repite la verificación en T003.
- [x] T002 [Base] Imagen y compose de desarrollo: `web` (Vite en :5173, `node_modules` en volumen anónimo) y `e2e` (imagen de Playwright, `network_mode: host`); `.dockerignore`; `.env.example` con las variables del README — `Dockerfile.dev`, `docker-compose.dev.yml`, `.dockerignore`, `.env.example`
  - Verifica: `docker compose -f docker-compose.dev.yml config -q` termina sin error.
  - Hecho (2026-10-29): validado con un `.env.dev` vacío en una copia temporal, porque `.env.dev` no existe y el agente no puede crearlo (AGENTS.md §6). `e2e` va en el perfil `e2e` y su imagen se fija en T004 con la versión exacta de `@playwright/test`.
- [x] T003 [Base] Instalar las dependencias de runtime del plan §8 con versión exacta, publicadas hace al menos dos semanas. **Confirmar con el usuario antes** — `package.json`, `pnpm-lock.yaml`
  - Verifica: `docker compose -f docker-compose.dev.yml up --build -d -V` y `dce pnpm ls --depth 0` las lista.
  - Hecho (2026-10-29): versiones exactas, las más altas publicadas hasta el 2026-10-15: React 19.3.1, React Router 8.4.0, Redux Toolkit 2.13.0, react-redux 9.3.0, React Hook Form 7.90.0, @hookform/resolvers 5.9.1, Zod 4.6.7, lucide-react 1.57.0 y las fuentes 5.3.0. Instaladas en un contenedor efímero (sin `.env.dev` aún no se puede usar el compose); verificado con `pnpm install --frozen-lockfile` y `docker build -f Dockerfile.dev`.
- [x] T004 [Base] Instalar las dependencias de desarrollo del plan §8, con la misma confirmación previa — `package.json`, `pnpm-lock.yaml`
  - Verifica: `dce pnpm ls --depth 0 --dev` las lista.
  - Hecho (2026-10-29): TypeScript 6.0.3 (como TaskApiSDD; `typescript-eslint` y `ts-jest` no admiten la 7), `@types/node` 22, eslint 10.12.0 con `@eslint/js` 10.0.1 (la 9 está obsoleta), Vite 8.3.4, Tailwind 4.3.3, Jest 30.5.2 con ts-jest 29.4.15, Testing Library y `@playwright/test` 1.64.1. Añadidos sus tipos y peers obligatorios (`@types/react`, `@types/react-dom`, `@types/node`, `@eslint/js`, `globals`, `@testing-library/dom`). `pnpm-workspace.yaml` deniega los scripts de `@parcel/watcher` y `unrs-resolver`, como en el backend. Imagen de Playwright fijada en `v1.64.1-noble`.
- [x] T005 [Base] TypeScript, Vite, `index.html` (título «Kompitu», `lang="es"`) y `src/main.tsx` mínimo (S-09) — `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts`, `index.html`, `src/main.tsx`
  - Verifica: `dce pnpm typecheck` pasa y `curl -s http://localhost:5173 | grep -q "<title>Kompitu</title>"`.
  - Hecho (2026-10-29): `typecheck` = `tsc -p tsconfig.json && tsc -p tsconfig.node.json` y `build` = `vite build` (el tipado va aparte). Verificado con `docker run` de la imagen de desarrollo, a falta de `.env.dev`.
- [x] T006 [Base] ESLint y Prettier con las reglas de AGENTS.md §8 como error; aserciones permitidas solo en tests — `eslint.config.js`, `.prettierrc`
  - Verifica: `dce pnpm lint` pasa. Un fichero temporal con `enum`, `any` o `x as T` fuera de `tests/` hace fallar el lint (borrarlo después).
  - Hecho (2026-10-29): `typescript-eslint` strict y stylistic con tipos, `react-hooks`, y como error: `no-explicit-any`, `consistent-type-assertions` (`never`, salvo tests), `enum`, `exhaustive-deps`, `no-non-null-assertion`, `no-floating-promises`, `no-nested-ternary`, `max-params` 4 y `TODO`/`FIXME`. Prueba negativa: `enum`, `any` y `as` dan error. `.prettierignore` deja fuera la documentación.
- [x] T007 [Base] Jest con `jsdom`, `ts-jest`, `jest-dom` y `moduleNameMapper` para CSS y para `shared/config/env.ts` (R-3); ignora `e2e/` — `jest.config.ts`, `jest.setup.ts`
  - Verifica: `dce pnpm test --passWithNoTests` pasa.
  - Hecho (2026-10-29): modo ESM como en TaskApiSDD; `jest/setup.ts` carga `jest-dom`; todo import relativo de `env` (`../env`, `../../shared/config/env`) se sustituye por `jest/env.stub.ts`. Probado con un test TSX temporal (borrado después). Para R-3, `env.ts` solo lee `import.meta.env` y la validación va en `env.schema.ts`, que es la que tiene test (T016–T017).
- [x] T008 [Base] Playwright: 6 proyectos (360×800, 768×1024, 1280×800 × Chromium y Firefox) y `globalSetup` que registra el usuario de prueba si no existe (R-8) — `playwright.config.ts`, `e2e/global-setup.ts`
  - Verifica: `dre pnpm test:e2e --list` muestra los 6 proyectos.
  - Hecho (2026-10-29): verificado con la imagen `mcr.microsoft.com/playwright:v1.64.1-noble` vía `docker run` (sin `.env.dev` no se puede usar `dre`): 6 proyectos. Las E2E tienen su propio `tsconfig.e2e.json` (tipos de Node), incluido en `typecheck` y en ESLint.
- [x] T009 [Base] Smoke E2E: abrir `/` desde el contenedor `e2e` y llamar a `http://localhost:3000` con cookies. Comprueba la red del host (R-2); si falla, parar y consultar al usuario — `e2e/specs/smoke.e2e.ts`
  - Verifica: `dre pnpm test:e2e e2e/specs/smoke.e2e.ts --project=chromium-desktop` pasa.
  - Hecho (2026-10-29): pasa en los 6 proyectos. La red del host (`network_mode: host`) funciona en Docker Desktop para Mac: riesgo R-2 descartado. El navegador del contenedor llama a la API con credenciales y CORS lo acepta, y `globalSetup` registró el usuario de prueba.
- [x] T010 [P] [Base] Producción: build multi-stage con `VITE_API_URL` como `ARG`, Nginx sin root con fallback SPA, caché y cabeceras de seguridad — `Dockerfile.prod`, `nginx.conf`, `docker-compose.prod.yml`
  - Verifica: `docker compose -f docker-compose.prod.yml up --build -d` y `curl -s -o /dev/null -w "%{http_code}" http://localhost:$WEB_HOST_PORT/history` devuelve `200`.
  - Hecho (2026-10-29): plantilla `nginx/default.conf.template` (se resuelve al arrancar con `VITE_API_URL` para la CSP) y `nginx/security-headers.conf`, en lugar de un único `nginx.conf`. Verificado con `docker build --build-arg VITE_API_URL=…` y `docker run`: `/history` → 200, CSP con `connect-src` a la API, `assets/` con caché de un año e `index.html` con `no-cache`; imagen de 91 MB. El compose de producción se lanza con `--env-file .env.prod` (README actualizado).
- [x] T011 [P] [Base] SonarQube en :9001, configuración y scripts (adaptados de TaskApiSDD, proyecto `taskfrontsdd-<rama>`) — `docker-compose.sonar.yml`, `sonar-project.properties`, `scripts/sonar-setup.sh`, `scripts/sonar-scan.sh`, `scripts/sonar-issues.sh`
  - Verifica: `docker compose -f docker-compose.sonar.yml up -d sonarqube`, `./scripts/sonar-setup.sh` y `./scripts/sonar-scan.sh` terminan con el quality gate en verde.
  - Hecho (2026-10-29): adaptada de TaskApiSDD (puerto 9001, gate `TaskFrontSDD`, proyectos `taskfrontsdd-<rama>`). Primer análisis: quality gate **en verde** (0 bugs, 0 incidencias, 0 hotspots, cobertura 88,9 %). Para llegar a él:
    - `tsconfig.sonar.json` sin `erasableSyntaxOnly`, que el TypeScript integrado de SonarQube 10.7 no reconoce.
    - Quitado el alias redundante `DayKey` (S6564).
    - `env.schema.ts` sin la expresión regular `/\/+$/` (hotspot S5852).
    - Perfil de calidad CSS `TaskFrontSDD` creado por `sonar-setup.sh`, en el que `css:S4662` reconoce las directivas de Tailwind v4. Decisión del usuario: configurar la regla en vez de marcar falsos positivos.
- [x] T012 [P] [Base] Hooks de git: `pre-commit` (README vivo) y `pre-push` (tests con cobertura, E2E de Chromium y quality gate; se salta las E2E si solo cambian `.md`) — `.githooks/pre-commit`, `.githooks/pre-push`
  - Verifica: con `git config core.hooksPath .githooks`, un commit que toca `AGENTS.md` sin `README.md` se rechaza.
  - Hecho (2026-10-29): `pre-commit` probado en un repositorio temporal (rechaza sin `README.md`, acepta con él). `pre-push` con la sintaxis validada (`sh -n`); omite las E2E si todos los ficheros del push son `.md` y comprueba antes que TaskApiSDD responde. Se prueba de verdad en el primer push.
- [x] T013 [P] [Base] Configuración de Claude Code: permisos que impiden leer `.env.*` y los ficheros generados, y recordatorio del README vivo — `.claude/settings.json`, `.claudeignore`
  - Verifica: `docker run --rm -v "$PWD":/app -w /app node:22-alpine node -e "JSON.parse(require('fs').readFileSync('.claude/settings.json','utf8'))"`.
  - Hecho (2026-10-29): como en TaskApiSDD, más la denegación de `playwright-report/`, `test-results/` y `blob-report/`; los hooks de graphify terminan con `|| true` para no bloquear si graphify falla.

### Diseño
- [x] T014 [Base] Fuentes autoalojadas y modo oscuro por `prefers-color-scheme`, además de la clase `.dark`. Es la primera compilación de los tokens (D-11, D-13, RNF-05) — `src/index.css`, `src/styles/design-tokens.css`
  - Verifica: `dce pnpm build` termina sin errores.
  - Hecho (2026-10-29): tokens semánticos con `light-dark()` y `color-scheme: light dark` (un solo valor por token, sin duplicar bloques); `.dark` fuerza `color-scheme: dark`; variante `dark:` por `prefers-color-scheme` o `.dark`. Lightning CSS lo compila a variables compatibles. Fuentes `@fontsource-variable/inter` («Inter Variable») y `@fontsource/jetbrains-mono`.
- [x] T015 [Base] Test de contraste: cada pareja de tokens semánticos de texto y fondo cumple 4.5:1 en claro y en oscuro (RNF-02, VII.4) — `src/styles/tests/design-tokens.contrast.test.ts`
  - Verifica: `dce pnpm test src/styles` pasa. Si una pareja no cumple, se consulta al usuario antes de tocar `DESIGN.md`.
  - Hecho (2026-10-29): 48 casos (24 parejas × claro y oscuro), leyendo el CSS real. Fallaban 3 parejas y el usuario eligió la corrección de cada una, aplicada primero en `DESIGN.md` y después en los tokens: placeholder → Gray 500 `#6B7280` (antes Gray 400, 2.54:1); botón destructivo → fondo Red 700 `#B91C1C` (antes Spark Red, 3.76:1); texto primario en oscuro → Blue 400 `#60A5FA` (antes Nova Blue, 3.45:1). El texto de error usa Red 700 en claro y Spark Red en oscuro, sin colores nuevos. Tokens nuevos: `primary-text` y `danger-text`. Comprobado que el test falla si se vuelve a Spark Red.

### Infraestructura compartida
- [x] T016 [P] [Base] Test de la configuración: `VITE_API_URL` obligatoria y con formato de URL — `src/shared/config/tests/env.schema.test.ts`
  - Verifica: `dce pnpm test src/shared/config` **falla**.
  - Hecho (2026-10-29): 5 casos (válida, barra final, falta, no es URL, fuente vacía); falló en rojo antes de T017.
- [x] T017 [Base] Validación de `VITE_API_URL` con Zod en `env.schema.ts` y lectura de `import.meta.env` en `env.ts`, sustituido en Jest por `jest/env.stub.ts` (R-3) — `src/shared/config/env.schema.ts`, `env.ts`
  - Verifica: `dce pnpm test src/shared/config` pasa.
  - Hecho (2026-10-29): `parseEnv` con `z.url()` quita la barra final; `env.ts` solo llama a `parseEnv(import.meta.env)`.
- [x] T018 [P] [Base] Tests de fechas: `DayKey` local (nunca UTC), sumar días, comparar, formato `es-ES`, cruce de mes y de año, 29 de febrero (D-4, S-03) — `src/shared/date/tests/day.util.test.ts`, `date-format.util.test.ts`
  - Verifica: `dce pnpm test src/shared/date` **falla**.
  - Hecho (2026-10-29): Jest se ejecuta con `TZ=America/Los_Angeles` (scripts de `package.json`), donde a las 20:00 ya es el día siguiente en UTC: el test prueba que `toDayKey` no usa UTC. 14 casos, con cruces de mes y año, 29 de febrero y cambios de horario.
- [x] T019 [Base] Utilidades de fechas (D-4) — `src/shared/date/day.util.ts`, `date-format.util.ts`
  - Verifica: `dce pnpm test src/shared/date/tests/day src/shared/date/tests/date-format` pasa.
  - Hecho (2026-10-29): `DayKey`, `toDayKey`, `todayKey`, `isDayKey`, `parseDayKey`, `addDays`, `compareDays`, `dayRange` y formatos `es-ES` con `Intl`, sin librerías.
- [x] T020 [P] [Base] Tests de las cabeceras de hora: desfase `±HH:MM`, nunca `Z`, `+00:00` en UTC, cambio de horario de verano, zona IANA (D-3, API-001 RF-31 a RF-33) — `src/shared/api/tests/client-time.util.test.ts`
  - Verifica: `dce pnpm test src/shared/api/tests/client-time` **falla**.
  - Hecho (2026-10-29): 8 casos: `+00:00`, desfases con minutos al este y al oeste, verano e invierno, nunca `Z`, zona IANA del dispositivo o explícita.
- [x] T021 [Base] `buildClientTimeHeaders()` (D-3) — `src/shared/api/client-time.util.ts`
  - Verifica: `dce pnpm test src/shared/api/tests/client-time` pasa.
  - Hecho (2026-10-29): `formatUtcOffset`, `formatClientTime` y `buildClientTimeHeaders`.
- [x] T022 [P] [Base] Tests del sobre y de los errores: éxito, página, error con `details` → `fieldErrors`, código desconocido → `INTERNAL_ERROR`, un mensaje en español por cada código de API-001 y API-002 (RF-41, D-5) — `src/shared/api/tests/api-envelope.schema.test.ts`, `api-error.util.test.ts`
  - Verifica: `dce pnpm test src/shared/api/tests/api-` **falla**.
  - Hecho (2026-10-29): 36 casos, uno por código de error con su mensaje sin el código técnico; falló en rojo antes de T023.
- [x] T023 [Base] Esquemas del sobre, utilidad de errores, unión `ApiErrorCode` y textos (RF-41) — `src/shared/api/api-envelope.schema.ts`, `api-error.util.ts`, `src/shared/texts/errors.texts.ts`, `common.texts.ts`
  - Verifica: `dce pnpm test src/shared/api/tests/api-` pasa.
  - Hecho (2026-10-29): `apiSuccessSchema`, `pageSchema`, `apiErrorEnvelopeSchema`, `toApiError` (con `NETWORK_ERROR` para los fallos de red e `INTERNAL_ERROR` para lo que no cumple el contrato), `ApiErrorCode` como unión de literales y `ERROR_MESSAGES` y `COMMON_TEXTS`.
- [x] T024 [P] [Base] Tests del slice `auth`: `sessionStarted`, `csrfTokenSet`, `userUpdated`, `sessionEnded`, y selectores — `src/modules/auth/store/tests/auth.slice.test.ts`
  - Verifica: `dce pnpm test src/modules/auth/store` **falla**.
  - Hecho (2026-10-29): 8 casos, incluido `sessionExpired` (añadido para RF-07: distingue una sesión caducada de un cierre de sesión) y el nombre visible de RF-50; falló en rojo antes de T025.
- [x] T025 [Base] Slice `auth`, selectores, store y hooks tipados (plan §4) — `auth/store/auth.slice.ts`, `auth.selectors.ts`, `src/shared/store/store.ts`, `hooks.ts`
  - Verifica: `dce pnpm test src/modules/auth/store` pasa.
  - Hecho (2026-10-29): estado `{ status, user, csrfToken, expired }` con el token solo en memoria; `createAppStore()` para aislar los tests. Adelantados de H1 `auth/schemas/user.schema.ts` (el slice necesita el tipo `User`) y `auth/index.ts` (API pública del módulo, VI.4).
- [x] T026 [Base] Tests del `baseQuery` con sesión (RF-06, RF-07):
  - `X-CSRF-Token` solo en `POST`/`PATCH`/`DELETE`; cabeceras de hora solo en `/tasks`, `/streak` y `/alerts`.
  - Con 3 peticiones simultáneas que reciben `TOKEN_EXPIRED`, una sola renovación y 3 reintentos.
  - `SESSION_EXPIRED`, `INVALID_TOKEN` y `MISSING_TOKEN` → `sessionEnded` con `returnTo`.
  - Respuesta fuera de contrato → error.
  — `src/shared/api/tests/session-base-query.test.ts`
  - Verifica: `dce pnpm test src/shared/api/tests/session-base-query` **falla**.
  - Hecho (2026-10-29): 22 casos con el entorno `node` de Jest y un `fetch` simulado. Añadida `@jest/globals` (aprobada por el usuario y justificada en el plan §8), porque en modo ESM Jest no inyecta el objeto `jest`.
- [x] T027 [Base] `baseQueryWithSession` con cerrojo de renovación y API base con etiquetas `Task`, `Streak`, `Alert`, `Me` (D-2, D-6) — `src/shared/api/session-base-query.ts`, `base.api.ts`
  - Verifica: `dce pnpm test src/shared/api/tests/session-base-query` pasa.
  - Hecho (2026-10-29): `createSessionBaseQuery` (cookies, `X-CSRF-Token` salvo si la petición trae el suyo, cabeceras de hora en `/tasks`, `/streak` y `/alerts`, cerrojo de renovación y `sessionExpired` solo si había sesión abierta) y `baseApi` con las etiquetas `Task`, `Streak`, `Alert` y `Me`. El stub de `env` de Jest cubre también `../config/env`.
- [x] T028 [P] [Base] Tests de `use-current-day` (RF-14):
  - Cambia a medianoche y al recuperar el foco.
  - Limpia temporizador y listener al desmontar.
  - Sin actualizaciones tras desmontar (IV.3).
  — `src/shared/date/tests/use-current-day.hook.test.ts`
  - Verifica: `dce pnpm test src/shared/date/tests/use-current-day` **falla**.
  - Hecho (2026-10-29): 10 casos: medianoche (también la segunda), vuelta a la pestaña, foco, pestaña oculta, `msUntilNextMidnight`; limpieza (temporizador y listeners eliminados al desmontar) y carreras (nada se actualiza tras desmontar; varios eventos seguidos dejan un solo temporizador).
- [x] T029 [Base] `useCurrentDay` (D-9) — `src/shared/date/use-current-day.hook.ts`
  - Verifica: `dce pnpm test src/shared/date/tests/use-current-day` pasa.
  - Hecho (2026-10-29): al volver a la pestaña recalcula siempre el día, porque con el equipo suspendido el temporizador de medianoche puede no haberse ejecutado.

### Componentes base (`src/shared/ui/`)
- [x] T030 [P] [Base] Tests de `Button`, `Text` y `Box`: prop `as` que conserva las props del elemento, variantes y tamaños de `DESIGN.md`, `disabled`, `focus-ring` (VI.3, R-5) — `src/shared/ui/tests/button.component.test.tsx`, `text.component.test.tsx`, `box.component.test.tsx`
  - Verifica: `dce pnpm test src/shared/ui/tests/button src/shared/ui/tests/text src/shared/ui/tests/box` **falla**.
  - Hecho (2026-10-29): 24 casos. Choque resuelto a favor de la constitución: los botones SM (32 px) y MD (40 px) de `DESIGN.md` miden menos que el mínimo táctil de 44 px (VII.4), así que en móvil tienen `min-h-touch min-w-touch` y las alturas de `DESIGN.md` se aplican desde `md`. Los enlaces (`variant="link"`) quedan fuera del mínimo, como en WCAG.
- [x] T031 [Base] `Button`, `Text` y `Box` polimórficos sin aserciones (R-5) — `src/shared/ui/button.component.tsx`, `text.component.tsx`, `box.component.tsx`
  - Verifica: los tests de T030 pasan y `dce pnpm lint` pasa.
  - Hecho (2026-10-29): tipo `PolymorphicProps<E, OwnProps>` sin aserciones (R-5 resuelto), `type="button"` por defecto, clases literales para que Tailwind las detecte (comprobado en el CSS compilado) y utilidad `cn` con su test.
- [x] T032 [P] [Base] Tests de `Icon`: tamaños desde constantes, `strokeWidth` 1.5, `aria-hidden` sin etiqueta y `aria-label` con ella (VII.2) — `src/shared/ui/tests/icon.component.test.tsx`
  - Verifica: `dce pnpm test src/shared/ui/tests/icon` **falla**.
  - Hecho (2026-10-29): 4 casos: 20 o 24 px, trazo 1.5, `currentColor`, `aria-hidden` sin etiqueta y `role="img"` con nombre accesible si la tiene.
- [x] T033 [Base] `Icon` y sus constantes — `src/shared/ui/icon.component.tsx`, `icon.constants.ts`
  - Verifica: `dce pnpm test src/shared/ui/tests/icon` pasa.
  - Hecho (2026-10-29): `ICON_SIZES` e `ICON_STROKE_WIDTH` en `icon.constants.ts`; ningún otro componente escribe tamaños de icono.
- [x] T034 [P] [Base] Tests de campos: `Field` relaciona etiqueta, campo y error (`aria-describedby`, `aria-invalid`); `Input`, `Textarea`, `DateInput`, `SelectNative`; `PasswordInput` con «mostrar» (S-11) — `src/shared/ui/tests/field.component.test.tsx` y uno por campo
  - Verifica: `dce pnpm test src/shared/ui/tests/field src/shared/ui/tests/input` **falla**.
  - Hecho (2026-10-29): 14 casos: etiqueta que nombra al campo, ayuda y error en `aria-describedby`, `aria-invalid`, estilo de `DESIGN.md` con mínimo táctil en móvil, `Textarea`, `DateInput`, `SelectNative` y `PasswordInput` (mostrar u ocultar con ratón y con teclado).
- [x] T035 [Base] Componentes de campo y `use-password-visibility.hook.ts` — `src/shared/ui/field.component.tsx`, `input.component.tsx`, `textarea.component.tsx`, `date-input.component.tsx`, `select-native.component.tsx`, `password-input.component.tsx`
  - Verifica: los tests de T034 pasan.
  - Hecho (2026-10-29): sin Context ni render props, cada campo recibe `label`, `errorText` y `helperText` (excepción de VI.3) y un `Field` interno los relaciona con `useFieldIds`; `DateInput` reutiliza `Input`; el estado de «mostrar contraseña» vive en `usePasswordVisibility`.
- [x] T036 [P] [Base] Tests de `Badge`, `Spinner`, `ErrorMessage` (con «Reintentar») y `Pagination` (página actual, totales, accesible por teclado) (RF-34, RF-40, RF-44) — `src/shared/ui/tests/`
  - Verifica: `dce pnpm test src/shared/ui/tests/badge src/shared/ui/tests/spinner src/shared/ui/tests/error-message src/shared/ui/tests/pagination` **falla**.
  - Hecho (2026-10-29): 15 casos: variantes de `Badge` (más `outline` para la etiqueta de identificador de *Layout Patterns*), `Spinner` con `role="status"`, `ErrorMessage` como alerta con «Reintentar» por teclado y `Pagination` con resumen en `children`, límites y sin botones con una sola página.
- [x] T037 [Base] `Badge`, `Spinner`, `ErrorMessage` y `Pagination` — `src/shared/ui/`
  - Verifica: los tests de T036 pasan.
  - Hecho (2026-10-29): el `Spinner` necesitaba una animación de giro que `DESIGN.md` no tenía. El usuario aprobó añadir el token `anim-spin` (800 ms, lineal, infinito) a `DESIGN.md` y a los tokens, y la regla de movimiento reducido ahora también corta las animaciones infinitas (`animation-iteration-count: 1`).
- [x] T038 [P] [Base] Tests de `useFocusTrap` y de `Dialog`:
  - Subcomponente fuera del padre → error (VI.2).
  - Escape cierra.
  - El foco queda atrapado y vuelve al disparador.
  - Bloqueo del scroll, liberado al desmontar.
  - Limpieza y carreras del efecto (IV.3).
  — `src/shared/ui/tests/use-focus-trap.hook.test.ts`, `dialog.component.test.tsx`
  - Verifica: `dce pnpm test src/shared/ui/tests/use-focus-trap src/shared/ui/tests/dialog` **falla**.
  - Hecho (2026-10-29): 26 casos en `use-focus-trap.hook.test.tsx` (foco atrapado, Escape, limpieza y carreras; incluye `useScrollLock` con bloqueos anidados) y `dialog.component.test.tsx`.
- [x] T039 [Base] `useFocusTrap`, `useDialog` (contexto interno no exportado) y `Dialog` compound — `src/shared/ui/use-focus-trap.hook.ts`, `use-dialog.hook.ts`, `dialog.component.tsx`
  - Verifica: los tests de T038 pasan.
  - Hecho (2026-10-29): el usuario aprobó dos tokens nuevos en `DESIGN.md` y `design-tokens.css`: `overlay` (Nova Dark al 50 % en claro, negro al 60 % en oscuro) y `container-dialog` (512 px). Piezas añadidas: `use-scroll-lock.hook.ts`, `compound-context.util.ts` (contexto interno que lanza el error de VI.2) y `modal-panel.component.tsx` (portal, fondo y panel comunes a `Dialog` y `Drawer`, para no duplicar). `Dialog` tiene además `Dialog.Close`.
- [x] T040 [P] [Base] Tests de `Drawer` compound, con los mismos casos que `Dialog` — `src/shared/ui/tests/drawer.component.test.tsx`
  - Verifica: `dce pnpm test src/shared/ui/tests/drawer` **falla**.
  - Hecho (2026-10-29): 11 casos, los mismos que `Dialog`.
- [x] T041 [Base] `Drawer`, reutilizando `useFocusTrap` — `src/shared/ui/drawer.component.tsx`, `use-drawer.hook.ts`
  - Verifica: `dce pnpm test src/shared/ui/tests/drawer` pasa.
  - Hecho (2026-10-29): reutiliza `useDialog`, `useDialogContent` y `ModalPanel`; `use-drawer.hook.ts` solo crea su contexto interno. El cierre al cambiar de pantalla no va en el panel (un `onClick` en `role="dialog"` lo marcaría Sonar) sino en `shared/layout/use-navigation-drawer.hook.ts`, con estado derivado de la ruta y sin efectos.

### Layout (`src/shared/layout/`)
- [x] T042 [P] [Base] Tests de layout (RF-50, RF-54):
  - `AppShell` muestra `Sidebar` en `lg` y `Navbar` + `Drawer` por debajo.
  - `NavItem` marca la pantalla activa con `aria-current`.
  - `PageHeader`, `PageContainer`, `EmptyState`, `BoardColumn` y `AuthLayout` componen por `children`.
  — `src/shared/layout/tests/`
  - Verifica: `dce pnpm test src/shared/layout` **falla**.
  - Hecho (2026-10-29): 16 casos en `layout.component.test.tsx` y `main-navigation.component.test.tsx`.
- [x] T043 [Base] Piezas de layout según `DESIGN.md` *Layout Patterns*, mobile-first (D-12) — `src/shared/layout/*.layout.tsx`, `*.component.tsx`
  - Verifica: `dce pnpm test src/shared/layout` pasa.
  - Hecho (2026-10-29): `AppShell` (+ `AppShell.Body`), `Sidebar`, `Navbar`, `NavItem` (con `NavLink`), `MainNavigation` (usuario + 4 pantallas; recibe las acciones de sesión por `children`, para T055), `PageHeader`, `PageContainer`, `EmptyState`, `BoardColumn` y `AuthLayout`. `jest/setup.ts` añade `TextEncoder` de Node, que React Router necesita en jsdom.

### Router y arranque
- [x] T044 [P] [Base] Tests de rutas (RF-08):
  - `ProtectedRoute` sin sesión → `/login?returnTo=…`.
  - Con `status: 'unknown'` → cargador.
  - `use-session-bootstrap`: `200` → `authenticated`, `401` → `anonymous`.
  — `src/shared/router/tests/protected-route.component.test.tsx`, `use-session-bootstrap.hook.test.ts`
  - Verifica: `dce pnpm test src/shared/router` **falla**.
  - Hecho (2026-10-29): 23 casos. Los tests montan `APP_ROUTES` con `MemoryRouter` + `useRoutes`: los routers de datos necesitan `Request`, que jsdom no tiene. Los casos `200`/`401` de `GET /me` están en `auth/api/tests/auth.api.test.ts` (entorno node, con `fetch` real simulado).
- [x] T045 [Base] `ProtectedRoute`, `useSessionBootstrap`, `router.tsx` con las 6 rutas (páginas vacías de momento) y `main.tsx` con el `Provider` (plan §6.1) — `src/shared/router/`, `src/main.tsx`
  - Verifica: `dce pnpm test src/shared/router` pasa.
  - Hecho (2026-10-29): `ProtectedRoute` con `access="private" | "guest"`: también protege `/login` y `/register` (solo sin sesión, plan §6.1) y, con sesión, vuelve a `returnTo` (solo rutas internas). Sin sesión por caducidad añade `reason=expired` (RF-07). `useSessionBootstrap` usa el endpoint `me` de `auth/api/auth.api.ts` (adelantado de T052), que guarda la sesión en `onQueryStarted`, sin efectos. `sessionExpired` pasa a `shared/api/session.actions.ts` (el slice la escucha con `extraReducers`) para evitar la importación circular `auth` → `base.api` → `auth`.

### Checkpoint Base
- [x] T046 [Base] Base completa.
  - Verifica: `dce pnpm lint && dce pnpm typecheck && dce pnpm test && dce pnpm build` pasan.
  - Hecho (2026-10-29): lint, typecheck, 289 tests (cobertura 99,4 % de líneas) y build pasan.

---

## Fase H1 — Crear mi cuenta y entrar (HU-01, P1)

### Tests (deben fallar)
- [ ] T047 [P] [H1] Tests de esquemas de registro e inicio de sesión: cada regla de RF-46 en su frontera (email 254/255, contraseña 11/12/128/129 sin recortar, nombre 100/101 recortado; en el inicio de sesión, solo obligatorios y formato de email, S-12) (RF-02, RF-46) — `auth/schemas/tests/register.schema.test.ts`, `login.schema.test.ts`
  - Verifica: `dce pnpm test src/modules/auth/schemas` **falla**.
- [ ] T048 [P] [H1] Tests de `auth.api`: `login` pide antes `GET /auth/csrf`; `register`, `logout` y `me` validan su respuesta con Zod (D-5) — `auth/api/tests/auth.api.test.ts`
  - Verifica: `dce pnpm test src/modules/auth/api` **falla**.
- [ ] T049 [P] [H1] Tests de hooks:
  - `use-register-form`: éxito → `/login` con el email y el mensaje (RF-01); `EMAIL_ALREADY_REGISTERED` → error en email sin borrar el resto (RF-03).
  - `use-login-form`: mensaje genérico (RF-04); `TOO_MANY_ATTEMPTS` (RF-05); vuelta a `returnTo` (RF-07).
  - `use-logout`: vacía la sesión y la caché y navega con `replace`.
  — `auth/hooks/tests/`
  - Verifica: `dce pnpm test src/modules/auth/hooks` **falla**.
- [ ] T050 [P] [H1] E2E en 6 proyectos:
  - `register.e2e.ts`: registro con email nuevo → inicio de sesión con el email ya escrito.
  - `login.e2e.ts`: entrar, mensaje genérico, cerrar sesión y «atrás» no vuelve, `returnTo`.
  - `fields-auth.e2e.ts`: cada campo de registro e inicio de sesión de RF-46 con valor válido, cada regla y solo teclado.
  (RF-01 a RF-08, RF-46) — `e2e/specs/`, `e2e/pages/login.po.ts`, `register.po.ts`, `e2e/fixtures/auth.fixture.ts`
  - Verifica: `dre pnpm test:e2e e2e/specs/register e2e/specs/login e2e/specs/fields-auth --project=chromium-desktop` **falla**.

### Implementación
- [ ] T051 [H1] Esquemas de usuario, registro e inicio de sesión — `auth/schemas/user.schema.ts`, `register.schema.ts`, `login.schema.ts`
  - Verifica: `dce pnpm test src/modules/auth/schemas` pasa.
- [ ] T052 [H1] Endpoints de `auth` con `injectEndpoints` — `auth/api/auth.api.ts`
  - Verifica: `dce pnpm test src/modules/auth/api` pasa.
- [ ] T053 [H1] Hooks de formulario y de cierre de sesión, y textos (RF-01 a RF-05, RF-07) — `auth/hooks/`, `auth/texts/auth.texts.ts`
  - Verifica: `dce pnpm test src/modules/auth/hooks` pasa.
- [ ] T054 [H1] **(bloqueada por X001)** `use-session-bootstrap` recupera `csrfToken` de `GET /me` (D-1) — `src/shared/router/use-session-bootstrap.hook.ts`, `auth/schemas/user.schema.ts`
  - Verifica: tras iniciar sesión y recargar, crear una tarea funciona sin volver a entrar.
  - Avance (2026-10-29): el código ya valida `GET /me` con el contrato de la spec 003 de la API (`data: { user, csrfToken }`, `sessionSchema`). Mientras la API no lo implemente, la respuesta no cumple el esquema y la recarga lleva al inicio de sesión, como prevé D-1. Solo queda la verificación.
- [ ] T055 [H1] Páginas de registro e inicio de sesión con `AuthLayout`; cerrar sesión en la navegación (RF-01, RF-50) — `auth/pages/register.page.tsx`, `login.page.tsx`, `auth/index.ts`
  - Verifica: `dre pnpm test:e2e e2e/specs/register e2e/specs/login e2e/specs/fields-auth --project=chromium-desktop` pasa.

### Checkpoint H1
- [ ] T056 [H1] Registro, inicio y cierre de sesión completos.
  - Verifica: `dce pnpm test src/modules/auth src/shared` y `dre pnpm test:e2e e2e/specs/register e2e/specs/login e2e/specs/fields-auth` (6 proyectos) pasan.

---

## Fase H2 — Ver las tareas de mi semana (HU-02, P1)

### Tests (deben fallar)
- [ ] T057 [P] [H2] Tests de `task.schema` y de `getWeekTasks`: `from`/`to`/`pageSize=100` y concatenación de páginas si `totalPages > 1` (R-4) — `tasks/schemas/tests/task.schema.test.ts`, `tasks/api/tests/tasks.api.test.ts`
  - Verifica: `dce pnpm test src/modules/tasks/schemas src/modules/tasks/api` **falla**.
- [ ] T058 [P] [H2] Tests de `use-week-board`:
  - 7 columnas desde hoy, agrupación por día, pendientes y completadas en el orden de la API (RF-09, RF-10).
  - Columnas pasadas en solo lectura (RF-13).
  - Avanzar, retroceder y «Hoy» (RF-12, RF-47).
  - Invalidación al cambiar el día (RF-14).
  — `tasks/hooks/tests/use-week-board.hook.test.ts`
  - Verifica: `dce pnpm test src/modules/tasks/hooks/tests/use-week-board` **falla**.
- [ ] T059 [P] [H2] Tests de `DayColumn`, `WeekNavigator` y `TaskCard` en modo lectura: nombre del día, fecha, contador, estado vacío con «crear» salvo en días pasados, «día cerrado» (RF-09, RF-11, RF-13) — `tasks/components/tests/`
  - Verifica: `dce pnpm test src/modules/tasks/components` **falla**.

### Implementación
- [ ] T060 [H2] `taskSchema` y consulta de la semana — `tasks/schemas/task.schema.ts`, `tasks/api/tasks.api.ts`
  - Verifica: `dce pnpm test src/modules/tasks/schemas src/modules/tasks/api` pasa.
- [ ] T061 [H2] `useWeekBoard` (plan §5.3) — `tasks/hooks/use-week-board.hook.ts`
  - Verifica: `dce pnpm test src/modules/tasks/hooks/tests/use-week-board` pasa.
- [ ] T062 [H2] `DayColumn` (sobre `BoardColumn`), `WeekNavigator` y `TaskCard`; textos — `tasks/components/`, `tasks/texts/tasks.texts.ts`
  - Verifica: `dce pnpm test src/modules/tasks/components` pasa.
- [ ] T063 [H2] Página del tablero en `/`, con el tablero desplazable solo dentro de su zona (VII.5) — `tasks/pages/board.page.tsx`, `tasks/index.ts`
  - Verifica: con sesión, `/` muestra 7 columnas; `dce pnpm lint && dce pnpm typecheck` pasan.

---

## Fase H3 — Crear una tarea (HU-03, P1)

### Tests (deben fallar)
- [ ] T064 [P] [H3] Tests de `task-form.schema`: título 200/201 y solo espacios, descripción 1000/1001, fecha válida y no pasada (RF-16, RF-46) — `tasks/schemas/tests/task-form.schema.test.ts`
  - Verifica: `dce pnpm test src/modules/tasks/schemas/tests/task-form` **falla**.
- [ ] T065 [P] [H3] Tests de `use-task-form` en modo crear (RF-19, RF-41):
  - Fecha propuesta de la columna (RF-15) o de hoy (RF-51).
  - Envío bloqueado mientras se envía.
  - Dentro de la semana → aparece en su columna (RF-18).
  - Fuera → aviso con la fecha (RF-52).
  - `fieldErrors` de la API en sus campos.
  — `tasks/hooks/tests/use-task-form.hook.test.ts`
  - Verifica: `dce pnpm test src/modules/tasks/hooks/tests/use-task-form` **falla**.
- [ ] T066 [P] [H3] Tests de `TaskFormDialog` en modo crear: contadores 200 y 1000 (RF-17), campo fecha, errores bajo cada campo — `tasks/components/tests/task-form-dialog.component.test.tsx`
  - Verifica: `dce pnpm test src/modules/tasks/components/tests/task-form-dialog` **falla**.
- [ ] T067 [P] [H3] E2E en 6 proyectos (RF-15 a RF-19, RF-46, RF-51, RF-52):
  - `create-task.e2e.ts`: crear desde una columna y desde el botón general, fecha fuera de la semana, doble clic.
  - `fields-task.e2e.ts`: título, descripción y fecha (válido, cada regla, solo teclado).
  — `e2e/specs/`, `e2e/pages/board.po.ts`, `task-form.po.ts`, `e2e/fixtures/tasks.fixture.ts`
  - Verifica: `dre pnpm test:e2e e2e/specs/create-task e2e/specs/fields-task --project=chromium-desktop` **falla**.

### Implementación
- [ ] T068 [H3] Esquema del formulario y mutación `createTask` que invalida `Task` y `Streak` — `tasks/schemas/task-form.schema.ts`, `tasks/api/tasks.api.ts`
  - Verifica: `dce pnpm test src/modules/tasks/schemas src/modules/tasks/api` pasa.
- [ ] T069 [H3] `useTaskForm` en modo crear — `tasks/hooks/use-task-form.hook.ts`
  - Verifica: `dce pnpm test src/modules/tasks/hooks/tests/use-task-form` pasa.
- [ ] T070 [H3] `TaskFormDialog` sobre `Dialog`; abrirlo desde cada columna y desde «Nueva tarea» — `tasks/components/task-form-dialog.component.tsx`, `day-column.component.tsx`, `tasks/pages/board.page.tsx`
  - Verifica: `dre pnpm test:e2e e2e/specs/create-task e2e/specs/fields-task --project=chromium-desktop` pasa.

---

## Fase H4 — Completar y desmarcar tareas (HU-04, P1)

### Tests (deben fallar)
- [ ] T071 [P] [H4] Tests de `use-task-actions`: completar y desmarcar con actualización optimista y reversión si la API rechaza; invalida `Streak` (RF-20, RF-21, D-7); `DAY_CLOSED` / `DAY_NOT_STARTED` → mensaje e invalidación (RF-42); `TASK_NOT_FOUND` → mensaje y la quita (RF-45) — `tasks/hooks/tests/use-task-actions.hook.test.ts`
  - Verifica: `dce pnpm test src/modules/tasks/hooks/tests/use-task-actions` **falla**.
- [ ] T072 [P] [H4] Tests de `TaskCard`: casilla de completar solo en tareas de hoy, sin ella en futuras (RF-22) y en pasadas (RF-13) — `tasks/components/tests/task-card.component.test.tsx`
  - Verifica: `dce pnpm test src/modules/tasks/components/tests/task-card` **falla**.
- [ ] T073 [P] [H4] E2E `complete-task.e2e.ts` en 6 proyectos: completar y desmarcar hoy; la tarea de mañana no ofrece completar (RF-20 a RF-22) — `e2e/specs/complete-task.e2e.ts`
  - Verifica: `dre pnpm test:e2e e2e/specs/complete-task --project=chromium-desktop` **falla**.

### Implementación
- [ ] T074 [H4] Mutación `updateTask` con `onQueryStarted` optimista sobre la consulta de la semana — `tasks/api/tasks.api.ts`
  - Verifica: `dce pnpm test src/modules/tasks/api` pasa.
- [ ] T075 [H4] `useTaskActions` y la casilla de `TaskCard` — `tasks/hooks/use-task-actions.hook.ts`, `tasks/components/task-card.component.tsx`
  - Verifica: `dre pnpm test:e2e e2e/specs/complete-task --project=chromium-desktop` pasa.

---

## Fase H5 — Eliminar una tarea (HU-05, P1)

### Tests (deben fallar)
- [ ] T076 [P] [H5] Tests de `DeleteTaskDialog` y de la acción de eliminar en `use-task-actions`: confirmación con el título, cancelar no cambia nada, invalida `Task` y `Streak` (RF-23, RF-24) — `tasks/components/tests/delete-task-dialog.component.test.tsx`, `tasks/hooks/tests/use-task-actions.hook.test.ts`
  - Verifica: `dce pnpm test src/modules/tasks/components/tests/delete-task-dialog` **falla**.
- [ ] T077 [P] [H5] E2E `delete-task.e2e.ts` en 6 proyectos: eliminar con confirmación, cancelar, desaparece del tablero (RF-23, RF-24) — `e2e/specs/delete-task.e2e.ts`
  - Verifica: `dre pnpm test:e2e e2e/specs/delete-task --project=chromium-desktop` **falla**.

### Implementación
- [ ] T078 [H5] Mutación `deleteTask` y acción de eliminar en `useTaskActions` — `tasks/api/tasks.api.ts`, `tasks/hooks/use-task-actions.hook.ts`
  - Verifica: `dce pnpm test src/modules/tasks` pasa.
- [ ] T079 [H5] `DeleteTaskDialog` sobre `Dialog` y acceso desde `TaskCard` — `tasks/components/delete-task-dialog.component.tsx`, `task-card.component.tsx`
  - Verifica: `dre pnpm test:e2e e2e/specs/delete-task --project=chromium-desktop` pasa.

---

## Fase H6 — Ver mi racha y el progreso de hoy (HU-06, P1)

### Tests (deben fallar)
- [ ] T080 [P] [H6] Tests de `streak.schema` y `getStreak` — `streaks/schemas/tests/streak.schema.test.ts`, `streaks/api/tests/streaks.api.test.ts`
  - Verifica: `dce pnpm test src/modules/streaks/schemas src/modules/streaks/api` **falla**.
- [ ] T081 [P] [H6] Tests de `use-streak-panel` (RF-25 a RF-28):
  - Racha de la API sin recalcular.
  - «X de Y».
  - `atRisk` solo con 0 completadas y racha mayor que 0.
  - «Sin tareas hoy».
  - Semana visible sin hoy → consulta de hoy.
  — `streaks/hooks/tests/use-streak-panel.hook.test.ts`
  - Verifica: `dce pnpm test src/modules/streaks/hooks` **falla**.
- [ ] T082 [P] [H6] Tests de `StreakPanel` y ampliar `complete-task.e2e.ts`: completar la única tarea de hoy sube la racha y cambia «0 de 1» a «1 de 1» (RF-25 a RF-28, CE-02) — `streaks/components/tests/streak-panel.component.test.tsx`, `e2e/specs/complete-task.e2e.ts`
  - Verifica: `dce pnpm test src/modules/streaks/components` **falla**.

### Implementación
- [ ] T083 [H6] Esquema, consulta con etiqueta `Streak` y `useStreakPanel` — `streaks/schemas/streak.schema.ts`, `streaks/api/streaks.api.ts`, `streaks/hooks/use-streak-panel.hook.ts`
  - Verifica: `dce pnpm test src/modules/streaks/schemas src/modules/streaks/api src/modules/streaks/hooks` pasa.
- [ ] T084 [H6] `StreakPanel` en la cabecera del tablero (S-10) — `streaks/components/streak-panel.component.tsx`, `streaks/index.ts`, `tasks/pages/board.page.tsx`
  - Verifica: `dce pnpm test src/modules/streaks` y `dre pnpm test:e2e e2e/specs/complete-task --project=chromium-desktop` pasan.

### Checkpoint P1
- [ ] T085 [H6] Historias P1 completas en Chromium.
  - Verifica: `dce pnpm test:coverage` (≥ 80 %) y `dre pnpm test:e2e --project=chromium-mobile --project=chromium-tablet --project=chromium-desktop` pasan.

---

## Fase H7 — Editar una tarea (HU-07, P2)

### Tests (deben fallar)
- [ ] T086 [P] [H7] Tests de `use-task-form` y de `TaskFormDialog` en modo editar: solo título y descripción, sin campo fecha, mismas reglas (RF-29, RF-30) — `tasks/hooks/tests/use-task-form.hook.test.ts`, `tasks/components/tests/task-form-dialog.component.test.tsx`
  - Verifica: `dce pnpm test src/modules/tasks/hooks/tests/use-task-form src/modules/tasks/components/tests/task-form-dialog` **falla**.
- [ ] T087 [P] [H7] E2E `edit-task.e2e.ts` y ampliar `fields-task.e2e.ts` con los campos del formulario de edición, en 6 proyectos (RF-29, RF-30, RF-46) — `e2e/specs/edit-task.e2e.ts`, `fields-task.e2e.ts`
  - Verifica: `dre pnpm test:e2e e2e/specs/edit-task --project=chromium-desktop` **falla**.

### Implementación
- [ ] T088 [H7] Modo editar en `useTaskForm` y `TaskFormDialog`, con acceso desde `TaskCard` y sin acceso en días pasados — `tasks/hooks/use-task-form.hook.ts`, `tasks/components/task-form-dialog.component.tsx`, `task-card.component.tsx`
  - Verifica: `dre pnpm test:e2e e2e/specs/edit-task e2e/specs/fields-task --project=chromium-desktop` pasa.

---

## Fase H8 — Consultar mi historial con filtros (HU-08, P2)

### Tests (deben fallar)
- [ ] T089 [P] [H8] Tests de `history-filters.schema`: estado `all`/`completed`/`pending`, fechas válidas, «desde» igual a «hasta» válido, «desde» posterior a «hasta» rechazado (RF-32, RF-33, RF-46) — `tasks/schemas/tests/history-filters.schema.test.ts`
  - Verifica: `dce pnpm test src/modules/tasks/schemas/tests/history-filters` **falla**.
- [ ] T090 [P] [H8] Tests de `use-history` (RF-31 a RF-34):
  - Filtros y página sincronizados con la URL (D-8).
  - `pageSize=50` (S-06).
  - Página fuera de rango → última página.
  — `tasks/hooks/tests/use-history.hook.test.ts`
  - Verifica: `dce pnpm test src/modules/tasks/hooks/tests/use-history` **falla**.
- [ ] T091 [P] [H8] Tests de `HistoryFilters` y `HistoryList`: fecha y estado de cada tarea, estado vacío, `Pagination` — `tasks/components/tests/history-filters.component.test.tsx`, `history-list.component.test.tsx`
  - Verifica: `dce pnpm test src/modules/tasks/components/tests/history` **falla**.
- [ ] T092 [P] [H8] E2E en 6 proyectos (RF-31 a RF-34, RF-46):
  - `history.e2e.ts`: filtro por estado, rango y paginación.
  - `fields-history.e2e.ts`: «desde» y «hasta».
  — `e2e/specs/`, `e2e/pages/history.po.ts`
  - Verifica: `dre pnpm test:e2e e2e/specs/history e2e/specs/fields-history --project=chromium-desktop` **falla**.

### Implementación
- [ ] T093 [H8] Esquema de filtros y consulta `getTasks` con estado, rango y página — `tasks/schemas/history-filters.schema.ts`, `tasks/api/tasks.api.ts`
  - Verifica: `dce pnpm test src/modules/tasks/schemas src/modules/tasks/api` pasa.
- [ ] T094 [H8] `useHistory`, `HistoryFilters`, `HistoryList` y página `/history` con acceso en la navegación — `tasks/hooks/use-history.hook.ts`, `tasks/components/history-*.component.tsx`, `tasks/pages/history.page.tsx`
  - Verifica: `dre pnpm test:e2e e2e/specs/history e2e/specs/fields-history --project=chromium-desktop` pasa.

---

## Fase H9 — Ver mis avisos (HU-09, P2)

Los avisos los genera la API a las 22:00 y no se pueden crear desde la UI. Por eso las E2E prueban el estado vacío y la estructura de la pantalla, y los tests de componentes y hooks prueban el contenido con datos fijos.

### Tests (deben fallar)
- [ ] T095 [P] [H9] Tests de `alert.schema` y de las consultas `getAlerts` y `getLatestAlert` (`pageSize=1`) — `alerts/schemas/tests/alert.schema.test.ts`, `alerts/api/tests/alerts.api.test.ts`
  - Verifica: `dce pnpm test src/modules/alerts/schemas src/modules/alerts/api` **falla**.
- [ ] T096 [P] [H9] Tests de hooks:
  - `use-alerts-page`: paginación (RF-35).
  - `use-todays-alert`: destaca solo si `createdAt` es hoy en la fecha local, y no muestra nada si no (RF-37, S-05).
  — `alerts/hooks/tests/`
  - Verifica: `dce pnpm test src/modules/alerts/hooks` **falla**.
- [ ] T097 [P] [H9] Tests de `AlertItem` (tipo, periodo, tareas, nota de RF-36) y `TodaysAlertBanner` (tipo, número de tareas, acceso al detalle), y E2E `alerts.e2e.ts` (estado vacío, navegación) en 6 proyectos — `alerts/components/tests/`, `e2e/specs/alerts.e2e.ts`
  - Verifica: `dce pnpm test src/modules/alerts/components` **falla**.

### Implementación
- [ ] T098 [H9] Esquema, consultas, hooks y textos de avisos — `alerts/schemas/alert.schema.ts`, `alerts/api/alerts.api.ts`, `alerts/hooks/`, `alerts/texts/alerts.texts.ts`
  - Verifica: `dce pnpm test src/modules/alerts/schemas src/modules/alerts/api src/modules/alerts/hooks` pasa.
- [ ] T099 [H9] `AlertItem`, página `/alerts` y `TodaysAlertBanner` en el tablero — `alerts/components/`, `alerts/pages/alerts.page.tsx`, `alerts/index.ts`, `tasks/pages/board.page.tsx`
  - Verifica: `dce pnpm test src/modules/alerts` y `dre pnpm test:e2e e2e/specs/alerts --project=chromium-desktop` pasan.

---

## Fase H10 — Ver y editar mi perfil (HU-10, P2)

### Tests (deben fallar)
- [ ] T100 [P] [H10] Tests de `profile.schema` (nombre opcional, 100/101 recortado) y de `use-profile-form`: guardar actualiza el usuario del slice y la barra superior (RF-38, RF-46, RF-53) — `account/schemas/tests/profile.schema.test.ts`, `account/hooks/tests/use-profile-form.hook.test.ts`
  - Verifica: `dce pnpm test src/modules/account` **falla**.
- [ ] T101 [P] [H10] E2E en 6 proyectos (RF-38, RF-46, RF-53):
  - `account.e2e.ts`, parte de perfil: ver email, nombre y fecha de alta; cambiar el nombre.
  - `fields-account.e2e.ts`: campo nombre.
  — `e2e/specs/`, `e2e/pages/account.po.ts`
  - Verifica: `dre pnpm test:e2e e2e/specs/account e2e/specs/fields-account --project=chromium-desktop` **falla**.

### Implementación
- [ ] T102 [H10] `account.api` (`updateProfile`, invalida `Me`), esquema, hook, `ProfileForm` y página `/account` — `account/api/account.api.ts`, `account/schemas/profile.schema.ts`, `account/hooks/use-profile-form.hook.ts`, `account/components/profile-form.component.tsx`, `account/pages/account.page.tsx`, `account/index.ts`
  - Verifica: `dce pnpm test src/modules/account` y `dre pnpm test:e2e e2e/specs/account e2e/specs/fields-account --project=chromium-desktop` pasan.

---

## Fase H11 — Cambiar mi contraseña y borrar mi cuenta (HU-11, P3)

### Tests (deben fallar)
- [ ] T103 [P] [H11] Tests de `password.schema` y `delete-account.schema` (actual obligatoria; nueva de 12 a 128 sin recortar; borrado con contraseña obligatoria) (RF-46) — `account/schemas/tests/`
  - Verifica: `dce pnpm test src/modules/account/schemas` **falla**.
- [ ] T104 [P] [H11] Tests de `use-password-form` y `use-delete-account` (RF-39, RF-05):
  - Éxito con el mensaje de sesiones cerradas.
  - `WRONG_PASSWORD` en su campo (RF-48).
  - `TOO_MANY_ATTEMPTS`.
  - Borrado → sesión y caché vacías y `/login` (RF-49).
  — `account/hooks/tests/`
  - Verifica: `dce pnpm test src/modules/account/hooks` **falla**.
- [ ] T105 [P] [H11] Tests de `PasswordForm` y `DeleteAccountDialog` (aviso de lo que se borra; no confirma sin contraseña), y E2E con **un usuario desechable**, nunca el de prueba compartido, en 6 proyectos (RF-39, RF-46, RF-48, RF-49) — `account/components/tests/`, `e2e/specs/account.e2e.ts`, `fields-account.e2e.ts`
  - Verifica: `dce pnpm test src/modules/account/components` **falla**.

### Implementación
- [ ] T106 [H11] Mutaciones `changePassword` y `deleteAccount`, esquemas, hooks, `PasswordForm` y `DeleteAccountDialog` en `/account` — `account/`
  - Verifica: `dce pnpm test src/modules/account` y `dre pnpm test:e2e e2e/specs/account e2e/specs/fields-account --project=chromium-desktop` pasan.

---

## Fase R — Robustez y cierre

- [ ] T107 [P] [Rob] Tests de errores comunes en cada pantalla:
  - Cargando sin bloquear el resto (RF-40).
  - Mensaje propio por código, sin código técnico (RF-41).
  - Error de hora o zona (RF-43); en E2E, reloj del navegador desviado 6 minutos con `page.clock`.
  - Fallo de red con «Reintentar» (RF-44).
  — `src/shared/ui/tests/`, `e2e/specs/errors.e2e.ts`
  - Verifica: `dce pnpm test` y `dre pnpm test:e2e e2e/specs/errors --project=chromium-desktop` pasan.
- [ ] T108 [P] [Rob] E2E `navigation.e2e.ts` en 6 proyectos (RF-08, RF-12, RF-47, RF-50, RF-54):
  - Sin sesión, toda ruta privada lleva a `/login`.
  - Navegación con usuario y pantalla activa.
  - Menú en `Drawer` en móvil y tablet.
  - Semana anterior y siguiente, y «Hoy».
  — `e2e/specs/navigation.e2e.ts`
  - Verifica: `dre pnpm test:e2e e2e/specs/navigation` pasa.
- [ ] T109 [P] [Rob] E2E `responsive.e2e.ts` en 6 proyectos: en cada pantalla, `scrollWidth <= innerWidth`, cada elemento interactivo `toBeInViewport()` y, en móvil, al menos 44×44px; el tablero solo desplaza su zona (RNF-03, CE-07, VII.5) — `e2e/specs/responsive.e2e.ts`, `e2e/fixtures/responsive.fixture.ts`
  - Verifica: `dre pnpm test:e2e e2e/specs/responsive` pasa.
- [ ] T110 [Rob] Revisión con las skills: `break-ui` (contenido largo, emojis y texto no latino en tarjetas y columnas, caso límite de la spec), `mobile-native` y `review-animations`. Corregir lo que encuentren, sin salir de `DESIGN.md`.
  - Verifica: las correcciones tienen test y `dce pnpm test` pasa.
- [ ] T111 [Rob] Suite completa en Chromium y Firefox, en los 6 proyectos (IV.6).
  - Verifica: `dre pnpm test:e2e` pasa.
- [ ] T112 [Rob] Cobertura y quality gate.
  - Verifica: `dce pnpm test:coverage` (≥ 80 %) y `./scripts/sonar-scan.sh` en verde.
- [ ] T113 [Rob] Trazabilidad: cada uno de los 54 RF aparece en el nombre de al menos un test (II.5).
  - Verifica: `grep -rhoE "RF-[0-9]{2}" src e2e --include="*.test.ts" --include="*.test.tsx" --include="*.e2e.ts" | sort -u | wc -l` devuelve `54`.
- [ ] T114 [Rob] `README.md` al día (estado, comandos que ya funcionan) y spec → `Implementada`, con entrada en su *Registro de cambios* (II.2, Gobierno 3) — `README.md`, `sdd/001-taskFrontSDD-mvp/spec.md`
  - Verifica: T111, T112 y T113 terminados.

---

## Cobertura RF → tareas

| RF | Tareas |
| :--- | :--- |
| RF-01 a RF-05 | T047, T049, T050, T051, T053, T055 |
| RF-06, RF-07 | T026, T027, T049, T050, T053 |
| RF-08 | T044, T045, T050, T108 |
| RF-09, RF-10 | T057, T058, T059, T060, T061, T062, T063 |
| RF-11 | T059, T062 |
| RF-12, RF-47 | T058, T061, T108 |
| RF-13 | T058, T059, T061, T062, T072 |
| RF-14 | T028, T029, T058, T061 |
| RF-15 a RF-19, RF-51, RF-52 | T064, T065, T066, T067, T068, T069, T070 |
| RF-20, RF-21 | T071, T073, T074, T075 |
| RF-22 | T072, T073, T075 |
| RF-23, RF-24 | T076, T077, T078, T079 |
| RF-25 a RF-28 | T080, T081, T082, T083, T084 |
| RF-29, RF-30 | T086, T087, T088 |
| RF-31 a RF-34 | T036, T089, T090, T091, T092, T093, T094 |
| RF-35 a RF-37 | T095, T096, T097, T098, T099 |
| RF-38, RF-53 | T100, T101, T102 |
| RF-39, RF-48, RF-49 | T103, T104, T105, T106 |
| RF-40, RF-41, RF-43, RF-44 | T022, T023, T036, T037, T107 |
| RF-42, RF-45 | T071, T075 |
| RF-46 | T034, T047, T050, T064, T067, T087, T089, T092, T100, T101, T103, T105 |
| RF-50, RF-54 | T042, T043, T055, T108 |
| RNF-01 | T022, T023 y todos los `*.texts.ts` |
| RNF-02 | T015, T030, T034, T038, T050 y siguientes E2E (localizadores accesibles y uso con teclado) |
| RNF-03 | T043, T109 |
| RNF-04 | T111 |
| RNF-05 | T014, T015 |
| RNF-06 | T025, T054 |

Los 54 RF y los 6 RNF tienen al menos una tarea de test y una de implementación. RNF-04 se comprueba con la suite completa en Chromium y Firefox (T111).

Los criterios de éxito se comprueban en:
- CE-01: T050 y T067.
- CE-02: T082.
- CE-03: T059 y T072.
- CE-04: T047, T064, T089, T100 y T103, con las mismas fronteras que la API.
- CE-05: T026.
- CE-06: T111.
- CE-07: T109.

## Registro de cambios

- **2026-10-29** — Creación de las tareas a partir del plan aprobado.
- **2026-10-29** — Fase 0 (Base) terminada: T038–T046. Avance de T054 (falta la verificación con X001).
