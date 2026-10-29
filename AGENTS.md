# AGENTS.md — TaskFrontSDD

## 1. Contexto
SPA que consume la API REST **TaskApiSDD** (otro repositorio) para gestionar tareas diarias y seguir rachas de productividad: autenticación, CRUD de tareas y dashboard de rachas.

- **Stack:** TypeScript strict · React · Vite · React Router · Redux Toolkit + RTK Query · React Hook Form + Zod · Tailwind CSS v4 · Lucide · Jest + React Testing Library · Playwright · pnpm · Docker Compose (Nginx en producción) · SonarQube.
- **Ley suprema:** **`CONSTITUTION.md`**. Prevalece sobre este fichero. El diseño visual está en **`DESIGN.md`**.
- **Estado:** proyecto sin inicializar. Los comandos describen la configuración prevista. La guía operativa completa (variables, producción, SonarQube, graphify) está en `README.md`.

## 2. Estructura
```text
src/
├── styles/design-tokens.css    # Tokens de Tailwind (únicos valores de diseño permitidos)
├── shared/                     # ui/ (componentes base), layout/ (estructura reutilizable), store/, api/ (API base de RTK Query), router/, utils/
└── modules/[modulo]/           # auth, tasks, streaks
    ├── index.ts                # API pública del módulo: lo único que otros módulos pueden importar
    └── pages/ components/ hooks/ api/ store/ schemas/ types/ texts/
e2e/                            # Playwright: specs/, pages/ (page objects), fixtures/
sdd/[NNN]-[funcionalidad]/      # spec.md, plan.md, tasks.md
```
- **Tests unitarios:** en una subcarpeta `tests/` de la carpeta del fichero, con el mismo nombre base (`components/task-card.component.tsx` → `components/tests/task-card.component.test.tsx`). Nunca junto al código.
- **Sesión:** cookies `Secure` + CSRF (contrato en `../TaskApiSDD/sdd/002-user-accounts/spec.md`).
  - La API base envía `credentials: 'include'` y `X-CSRF-Token` en `POST`/`PATCH`/`DELETE`.
  - Ante `TOKEN_EXPIRED` llama **una vez** a `POST /auth/refresh` y repite la petición. Si falla, cierra sesión y redirige a `/login`. El usuario vive en el slice `auth`; las rutas privadas usan una ruta protegida.
- **Formularios:** esquema en `schemas/[nombre].schema.ts`, tipos con `z.infer`, `useForm({ resolver: zodResolver(schema) })`. Los errores se muestran en español bajo el input.
- **E2E:** contra TaskApiSDD real (`http://localhost:3000`) con el usuario de `E2E_USER_EMAIL` / `E2E_USER_PASSWORD`.
  - **6 proyectos de Playwright:** `chromium-mobile`, `chromium-tablet`, `chromium-desktop`, `firefox-mobile`, `firefox-tablet` y `firefox-desktop`, con viewports de 360×800, 768×1024 y 1280×800. Todas las specs corren en los 6.
  - **Comprobación responsive en cada pantalla:**
    - `document.documentElement.scrollWidth <= window.innerWidth` (sin desplazamiento horizontal).
    - Cada botón, enlace y campo es visible y está dentro del viewport (`toBeInViewport()`).
    - En móvil, mide al menos 44×44px.
  - Cada test crea y borra sus propias tareas mediante fixtures.
  - Por cada input escribible se prueba: valor válido, cada regla Zod con su mensaje y uso solo con teclado.
  - Localizadores solo con `getByRole`, `getByLabel` o `getByText`; `data-testid` únicamente si no hay rol ni etiqueta.

## 3. Comandos
Todo se ejecuta en Docker. Servicios: `web` (Vite, http://localhost:5173) y `e2e` (Playwright). Abreviatura: `DC="docker compose -f docker-compose.dev.yml"`.
```bash
$DC up --build -d                                    # Levantar web en segundo plano
$DC logs -f web                                      # Ver logs
$DC up --build -d -V                                 # Tras cambiar package.json (renueva node_modules)
$DC exec web pnpm lint                               # ESLint
$DC exec web pnpm typecheck                          # tsc --noEmit
$DC exec web pnpm test                               # Todos los tests de Jest
$DC exec web pnpm test src/modules/tasks/components/tests/task-card.component.test.tsx  # Un solo fichero
$DC exec web pnpm test -t "muestra el error"         # Tests cuyo nombre coincide
$DC exec web pnpm test:coverage                      # Tests con cobertura → coverage/lcov.info
$DC run --rm e2e pnpm test:e2e                       # E2E en Chromium y Firefox (requiere web + TaskApiSDD levantadas)
$DC run --rm e2e pnpm test:e2e e2e/specs/login.e2e.ts --project=chromium-mobile  # Una spec en un navegador y tamaño
./scripts/sonar-scan.sh                              # Quality gate de la rama actual (SonarQube en :9001)
./scripts/sonar-issues.sh                            # Detalle de por qué falla el quality gate
```

## 4. Convenciones
- **Ficheros y carpetas:** `kebab-case` + sufijo. **Componentes y tipos:** `PascalCase`. **Hooks:** `useXxx`. **Variables y funciones:** `camelCase`. **Constantes:** `UPPER_SNAKE_CASE`.
- **Idioma:** código en inglés · comentarios en español · textos visibles en español dentro de `texts/[modulo].texts.ts`, nunca directamente en el JSX.

| Rol | Fichero | Rol | Fichero |
| :--- | :--- | :--- | :--- |
| Componente | `task-card.component.tsx` | Esquema Zod | `login.schema.ts` |
| Página | `login.page.tsx` | Tipos | `task.types.ts` |
| Layout | `app-shell.layout.tsx` | Rutas | `tasks.routes.tsx` |
| Hook | `use-tasks.hook.ts` | Textos | `tasks.texts.ts` |
| Endpoints RTK Query | `tasks.api.ts` | Constantes | `streak.constants.ts` |
| Slice | `auth.slice.ts` | Utilidad | `date-format.util.ts` |
| Selectores | `auth.selectors.ts` | Spec E2E | `e2e/specs/create-task.e2e.ts` |
| Page object E2E | `e2e/pages/login.po.ts` | Fixture E2E | `e2e/fixtures/auth.fixture.ts` |

- **SDD:** `sdd/[NNN]-[funcionalidad]/`, con `[NNN]` secuencial de al menos 3 dígitos (`001`, `002`, …, `1000`). Ejemplo: `sdd/001-taskFrontSDD-mvp/`.

## 4.1 Flujo spec-anchored
- **Funcionalidad nueva:** carpeta nueva con `spec.md` → aprobación del usuario → `plan.md` → `tasks.md` → código.
- **Cambio de comportamiento en una funcionalidad existente:**
  1. Propón el cambio en su `spec.md` y espera la aprobación del usuario.
  2. Añade una entrada a *Registro de cambios* con la fecha y los RF afectados.
  3. Actualiza `plan.md` y `tasks.md`.
  4. Cambia el código y los tests, todo en el mismo cambio.
- **Estado de la spec:** `Borrador` → `Aprobada` (tras la aprobación del usuario) → `Implementada` (todas las tareas hechas y cada RF con su test) → `Retirada` (si se elimina la funcionalidad; la carpeta no se borra).
- **Trazabilidad:**
  - Los nombres de los tests citan el RF que prueban: `it('RF-17: rechaza un título de 201 caracteres', …)` o `test('RF-23: pide confirmación antes de eliminar', …)`.
  - Cada tarea de `tasks.md` termina con sus RF: `(RF-15, RF-17)`.
- **Antes de dar una tarea por terminada:** si has cambiado comportamiento, comprueba que la spec lo describe. Si no, para y propón el cambio de spec.

## 5. Antes y después de cada tarea
**Antes:** lee `CONSTITUTION.md` y la spec activa en `sdd/`. Si queda algún `[NEEDS CLARIFICATION]` o tienes una duda que no resuelven la spec, el plan, `DESIGN.md` ni la constitución, pregunta antes de seguir. Si la tarea toca UI:
- Lee `DESIGN.md`, que define el tema.
- Usa como plantilla de estructura `docs/design/task-board-reference.png` y `docs/design/task-board.taste.md`.
- Carga la skill de `.claude/skills/` que corresponda (§8).

**Después** (salvo tareas que solo cambian `.md`): ejecuta y confirma en tu respuesta que pasan:
```bash
$DC exec web pnpm lint && $DC exec web pnpm typecheck && $DC exec web pnpm test
$DC run --rm e2e pnpm test:e2e      # Solo si la tarea toca login, tareas o cualquier input
```
**README vivo:** si cambias `CONSTITUTION.md`, la estructura, comandos o convenciones de este fichero, o algo en `sdd/`, actualiza `README.md` en el mismo cambio. Indica en tu respuesta qué secciones tocaste.

## 6. Prohibido
**Git y entorno**
- `git push`, `git push --force`, `git reset --hard`, `git rebase`, `git commit --no-verify` sin petición explícita.
- Instalar, actualizar o quitar dependencias sin consultar antes, aunque estén justificadas en un `plan.md`.
- Ejecutar `pnpm`, `node`, `npx` o tests en el host (solo dentro de Docker; excepciones: graphify, `scripts/sonar-*.sh` y `.githooks/`).
- Leer o modificar `.env.dev` o `.env.prod`.

**Ficheros**
- Editar ficheros generados: `dist/`, `coverage/`, `graphify-out/`, `playwright-report/`, `test-results/`, `.playwright-mcp/`, `node_modules/`.
- Modificar `CONSTITUTION.md`, `DESIGN.md` o cualquier `spec.md` sin petición explícita.

**Código**
- Incumplir los principios de `CONSTITUTION.md`: Tailwind arbitrario, `any`, aserciones de tipo fuera de los tests (`x as T`, `as const`, `<T>x`), `enum` (usa uniones de literales), HTTP fuera de RTK Query, datos de la API en slices o `useState`, formularios sin Zod, secretos en `VITE_*`, `dangerouslySetInnerHTML`.
- Crear un React Context sin permiso explícito (salvo el contexto interno de estado de UI de un compound component): propónlo y espera aprobación.
- `useEffect`, lógica de negocio, estado o accesibilidad dentro de un componente: todo va en custom hooks (headless).
- Un `useEffect` sin limpieza de lo que registra, con trabajo asíncrono no cancelable o con `exhaustive-deps` desactivado.
- Props de visibilidad o de contenido (`show*`, `hide*`, `with*`, `*Text`, `*Title`, `render*`): usa `children` o subcomponentes.
- Crear un componente sin buscar antes en `src/shared/ui/`, `src/shared/layout/` y los módulos, o duplicar uno que cumple la misma función. Se reutiliza o se amplía con `children`, `as` o `variant`.
- Asumir el formato de las respuestas de TaskApiSDD: tómalo de su spec.
- Importar las carpetas internas de otro módulo: solo su `index.ts` o `src/shared/`.
- Añadir una librería que duplique una del stack (otro gestor de estado, cliente HTTP, formularios, validación, estilos, componentes o tests).
- En E2E: `waitForTimeout`, selectores CSS/XPath, `test.only`, `test.skip`.
- Marcar incidencias de SonarQube como falso positivo.

## 7. Código que pasa SonarQube
El push solo pasa con las E2E de Chromium (3 tamaños) y el quality gate en verde (Firefox se ejecuta al terminar la tarea, §5): 0 bugs, 0 vulnerabilidades, hotspots revisados al 100 %, calificación A, cobertura ≥ 80 %, duplicación ≤ 3 % y **0 incidencias nuevas**, incluidos los *code smells*.
- Toda promesa con `await` o descartada con `void`. Sin `catch` vacíos. Solo se lanzan instancias de `Error`.
- `crypto.randomUUID()` para identificadores, nunca `Math.random()`.
- Complejidad cognitiva ≤ 15 por función. Máximo 4 parámetros (las props cuentan como uno). Sin ternarios anidados, tampoco en JSX.
- Sin `!` evitable, sin código sin usar, sin código comentado, sin `TODO`/`FIXME`, sin números mágicos (van a `*.constants.ts`).
- Solo componentes funcionales, un componente exportado por fichero (un compound component cuenta como uno: `Tabs` con `Tabs.List`, `Tabs.Trigger`…).
- Un test por cada componente, página, hook, slice y esquema con lógica.
- Todo input escribible nuevo o modificado lleva su spec E2E en el mismo cambio.

## 8. Cómo cumplir la constitución
- **Tipos sin aserciones:** anotaciones explícitas, genéricos, type guards (`x is T`), `schema.parse` / `safeParse` de Zod y `satisfies`.
  - Para literales inmutables: unión de literales y array `readonly` tipado (`const STATUSES: readonly TaskStatus[] = [...]`).
- **ESLint que hace cumplir la constitución** (todas como error):
  - `@typescript-eslint/no-explicit-any`.
  - `@typescript-eslint/consistent-type-assertions` con `assertionStyle: "never"`, desactivada solo para `**/tests/*.test.ts(x)` y `e2e/`.
  - `no-restricted-syntax` sobre `TSEnumDeclaration`.
  - `react-hooks/exhaustive-deps`.
- **Efectos:**
  - Cancela con `AbortController` (se aborta en la limpieza) o con una bandera `let ignore = false` que la limpieza pone a `true`.
  - Tests con `renderHook`, `jest.useFakeTimers()` y espías (`removeEventListener`, `clearTimeout`, `disconnect`). Casos: desmontaje, cambio de dependencias, cambios rápidos seguidos y desmontaje antes de que termine el trabajo.
- **Compound components:** `<Accordion>`, `<Accordion.Item>`, `<Accordion.Trigger>`, `<Accordion.Panel>`. El contexto lo crea un hook del propio componente y no se exporta.
- **Polimórficos:** `<Button as={Link}>`, `<Text as="h2">`, con tipado genérico que conserva las props del elemento elegido.
- **Responsive mobile-first:**
  - Clases sin prefijo para móvil; `sm:`, `md:`, `lg:`, `xl:` y `2xl:` (breakpoints de `DESIGN.md`) solo para ampliar.
  - Anchos fluidos (`w-full`, `max-w-content`, grid o flex); nunca anchos fijos por encima de 360px.
  - El tablero hace scroll horizontal dentro de su contenedor (`overflow-x-auto`) con columnas de `w-column`.
  - Revisa el comportamiento táctil con la skill `mobile-native`.
- **Reutilizar antes de crear:** busca en `src/shared/ui/`, `src/shared/layout/` y los módulos. Amplía con `children`, subcomponentes, `as` o `variant` (unión de literales).
- **Plantilla de estructura:** `docs/design/task-board-reference.png` y `docs/design/task-board.taste.md`.
- **Skills de `.claude/skills/` por tarea:**
  - Construir y pulir UI: `emil-design-eng`.
  - Animar: `animate`, `animation-performance`.
  - Revisar el movimiento: `review-animations`.
  - Casos límite: `break-ui`.
  - Móvil: `mobile-native`.
  Si una skill contradice `DESIGN.md` o la constitución, prevalecen estos.

## 9. Lecciones aprendidas
Cuando el agente cometa el mismo error dos veces, añade aquí una regla con este formato:
`- [AAAA-MM-DD] Regla concreta y comprobable. (Error: qué pasó)`

_(Sin entradas todavía.)_
