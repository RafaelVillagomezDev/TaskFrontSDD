# TaskFrontSDD

**Kompitu**: aplicación web (SPA) para gestionar tareas diarias y seguir rachas de productividad (días consecutivos). Consume la API REST **TaskApiSDD**.

## Estado del proyecto

**Sin inicializar.** Por ahora solo existen la documentación de gobierno, el sistema de diseño y los tokens de Tailwind. Todavía no hay `package.json`, Dockerfiles, hooks, scripts ni código de la aplicación. Tampoco hay especificaciones en `sdd/`.

| Elemento | Estado |
| :--- | :--- |
| `CONSTITUTION.md`, `AGENTS.md`, `DESIGN.md` | Listos |
| Tokens de diseño (`src/styles/design-tokens.css`) | Paleta cálida (papel, tinta y carbón con acento Tide) en claro y oscuro; el contraste de cada pareja se comprueba con un test |
| Referencia de diseño del tablero (`docs/design/`) | Lista |
| Proyecto Vite + React, Docker, SonarQube, hooks de git | Pendiente |
| Primera funcionalidad (`sdd/001-taskFrontSDD-mvp/`) | `spec.md` aprobada, `plan.md` aprobado y `tasks.md` creado (114 tareas + 1 externa); implementación en curso: 99 de 114 (fase 0 «Base» y fases H1 a H9 completas: todas las historias P1 —cuenta, tablero semanal, crear, completar y eliminar tareas, y racha con el progreso de hoy—, editar tareas, historial con filtros y avisos) |
| Cambio previo en TaskApiSDD: `GET /me` devuelve `csrfToken` | Hecho (spec 003 de la API): la sesión sigue tras recargar |

## Funcionalidades previstas

- Registro, inicio y cierre de sesión contra TaskApiSDD.
- Crear, listar, editar, completar y eliminar tareas diarias.
- Dashboard de rachas y métricas de productividad.
- Navegación entre varias páginas con React Router.

## Stack

| Área | Tecnología |
| :--- | :--- |
| Lenguaje | TypeScript (modo estricto) |
| UI | React (componentes funcionales + hooks) |
| Build | Vite |
| Enrutado | React Router |
| Estado y API | Redux Toolkit + RTK Query |
| Formularios | React Hook Form + Zod |
| Estilos | Tailwind CSS v4 con tokens propios |
| Iconos | Lucide |
| Pruebas | Jest + React Testing Library · Playwright (E2E en Chromium y Firefox contra TaskApiSDD real) |
| Paquetes | pnpm |
| Contenedores | Docker + Docker Compose (Nginx en producción) |
| Calidad | SonarQube (quality gate en cada push) |

## Estructura prevista

```text
./
├── CONSTITUTION.md            # Leyes del proyecto (prevalece sobre todo lo demás)
├── AGENTS.md                  # Guía corta para agentes de IA
├── DESIGN.md                  # Sistema de diseño de Kompitu
├── README.md                  # Este fichero (guía operativa completa)
├── sdd/                       # Spec, plan y tasks de cada funcionalidad
├── docs/design/               # Referencias de diseño
├── e2e/                       # Pruebas end-to-end con Playwright
├── src/
│   ├── styles/                # Tokens de diseño de Tailwind
│   ├── shared/                # UI base, layout reutilizable, store, API base, router y utilidades
│   └── modules/               # auth, tasks, streaks, alerts (un módulo vertical por funcionalidad)
├── Dockerfile.dev             # Vite dev server en :5173 con hot reload
├── Dockerfile.prod            # Multi-stage: build con Vite → Nginx sin root con fallback SPA
├── nginx/                     # Plantilla de Nginx (fallback SPA, caché) y cabeceras de seguridad (CSP)
├── docker-compose.dev.yml     # Servicios web y e2e con .env.dev
├── docker-compose.prod.yml    # Proyecto taskfrontsdd-prod con .env.prod
├── docker-compose.sonar.yml   # SonarQube en :9001 y el scanner
├── sonar-project.properties   # Fuentes, tests, exclusiones y cobertura
├── scripts/                   # sonar-setup.sh, sonar-scan.sh, sonar-issues.sh
├── .githooks/                 # pre-commit (README vivo) y pre-push (E2E de Chromium + quality gate)
├── jest/                      # Entorno jsdom con el fetch de Node, setup y utilidades de test (mockApi, render con store y router)
├── vite.config.ts · jest.config.ts · playwright.config.ts
├── .env.example               # Variables sin valor (versionado)
├── .claude/ · .claudeignore   # Configuración de Claude Code (permisos, hooks, skills)
└── CLAUDE.MD                  # Reglas para Claude Code (importa AGENTS.md)
```

## Guía operativa

> Nada de esto funciona todavía: el proyecto no está inicializado.

El proyecto **siempre** se ejecuta dentro de Docker: nada se instala ni se lanza en la máquina host (graphify es la única excepción).

| Entorno | Servicio | URL |
| :--- | :--- | :--- |
| Desarrollo | `web` (Vite) | http://localhost:5173 |
| Producción | `web` (Nginx) | https://kompitu.yandrydev.cloud |
| SonarQube | `sonarqube` | http://localhost:9001 |
| API en desarrollo (TaskApiSDD, otro repositorio) | `api` | http://localhost:3000 |

### Variables de entorno
`.env.dev` y `.env.prod` están ignorados por git; `.env.example` las lista sin valor.

| Variable | `.env.dev` | `.env.prod` |
| :--- | :--- | :--- |
| `VITE_API_URL` | `http://localhost:3000` | `https://apikompitu.yandrydev.cloud` |
| `WEB_HOST_PORT` | — | Puerto del host donde se publica Nginx |
| `E2E_USER_EMAIL` / `E2E_USER_PASSWORD` | Usuario de prueba dedicado en TaskApiSDD | — |
| `SONAR_ADMIN_PASSWORD` | Mínimo 12 caracteres con mayúscula, minúscula, dígito y símbolo | — |
| `SONAR_TOKEN` | Lo rellena `scripts/sonar-setup.sh` | — |

Las variables `VITE_*` se incrustan en el bundle **en tiempo de build**: son públicas (nunca secretos) y cambiarlas en producción exige reconstruir la imagen.

### Desarrollo
```bash
docker compose -f docker-compose.dev.yml up --build                  # Construir y levantar web con hot reload
docker compose -f docker-compose.dev.yml down                        # Parar los contenedores
docker compose -f docker-compose.dev.yml exec web pnpm add <pkg>     # Añadir una dependencia dentro del contenedor
docker compose -f docker-compose.dev.yml cp web:/app/node_modules ./ # Copiar node_modules al host para que el editor vea los tipos
git config core.hooksPath .githooks                                  # Activar los hooks de git (una vez por clon)
```
`node_modules` vive en un volumen anónimo del contenedor (`/app/node_modules`):
- `run --rm web pnpm install` **no** sirve: instala en un volumen temporal que se borra al terminar.
- Tras cambiar `package.json` hay que usar `up --build -V` (`--renew-anon-volumes`).
- El `./node_modules` del host es solo una copia para el editor.

Safari no acepta cookies `Secure` en `http://localhost`: para desarrollar usa Chrome o Firefox.

En los tests unitarios ninguna petición llega a la red: `jest/setup.ts` hace fallar todo `fetch` sin simular, y cada test simula la API con `mockApi` (`jest/mock-api.ts`).

### Pruebas end-to-end
- El servicio `e2e` usa la imagen oficial `mcr.microsoft.com/playwright` con la **misma versión** que `@playwright/test`.
- Usa `network_mode: host` para que el navegador vea la app en `localhost:5173` y la API en `localhost:3000`. Solo así coinciden el origen con `CORS_ORIGIN` y se aceptan las cookies `Secure`.
- En Docker Desktop (macOS/Windows) requiere activar **Settings → Resources → Network → Enable host networking**.
- Antes de ejecutarlas: `web` levantado, TaskApiSDD levantada y el usuario de prueba creado.
- Los tests que necesitan una cuenta propia la registran por API con un email único (`e2e-…@kompitu.test`) y la borran al terminar (`e2e/fixtures/auth.fixture.ts`). Cada pantalla pasa por `expectResponsive` (`e2e/fixtures/responsive.fixture.ts`). Las tareas que necesita un test se crean por API en esa cuenta (`createTasks`, en `e2e/fixtures/api-client.ts`) y se borran con ella. El fixture `board` (`e2e/fixtures/tasks.fixture.ts`) entra en el tablero con una cuenta nueva.
```bash
docker compose -f docker-compose.dev.yml run --rm e2e pnpm test:e2e         # Todas, en Chromium y Firefox
docker compose -f docker-compose.dev.yml run --rm e2e pnpm test:e2e:report  # Informe HTML del último run
```
- Docker Desktop necesita al menos **12 GB de memoria** (Settings → Resources): con las dos instancias de SonarQube (la de este repositorio y la de TaskApiSDD) y 6 navegadores Firefox en paralelo, con 8 GB los tests agotan sus tiempos de espera. Si no se puede subir, `--workers=2` lo evita a cambio de tardar más.

### Producción
Proyecto de Compose propio (`taskfrontsdd-prod`): compila con Vite y sirve `dist/` con Nginx sin root, con fallback a `index.html`.
```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml up --build -d    # Construir y levantar
docker compose -f docker-compose.prod.yml down             # Parar
docker build -f Dockerfile.prod --build-arg VITE_API_URL=https://apikompitu.yandrydev.cloud -t taskfrontsdd:latest .   # Construir solo la imagen
```

### SonarQube
- Corre en su propio compose en **:9001**, para convivir con el de TaskApiSDD (:9000). El scanner es una imagen de Docker, así que nada se añade a `package.json`.
- SonarQube Community no distingue ramas, así que cada rama tiene su propio proyecto `taskfrontsdd-<rama>`, con el quality gate predeterminado «TaskFrontSDD».
- `sonar-setup.sh` crea también el perfil de calidad CSS «TaskFrontSDD», en el que la regla `css:S4662` reconoce las directivas de Tailwind v4 (`@theme`, `@utility`, `@custom-variant`…).
- El análisis usa `tsconfig.sonar.json`, una copia de `tsconfig.json` sin `erasableSyntaxOnly`, que el TypeScript integrado de SonarQube 10.7 no reconoce.
```bash
docker compose -f docker-compose.sonar.yml up -d sonarqube   # Levantar SonarQube
./scripts/sonar-setup.sh                                     # Primera vez: admin, quality gate y token
./scripts/sonar-scan.sh                                      # Analizar la rama actual y esperar el quality gate
./scripts/sonar-issues.sh                                    # Condiciones, incidencias y hotspots con fichero y línea
docker compose -f docker-compose.sonar.yml down              # Parar (conserva configuración y análisis)
```
El hook `pre-push` ejecuta los tests con cobertura, las E2E de **Chromium** en móvil, tablet y escritorio y el análisis. Por el momento, Firefox no entra en el pre-push: se ejecuta al terminar cada tarea que toca los flujos E2E y antes de dar una spec por implementada. Rechaza el push en cualquiera de estos casos:
- Algo falla.
- SonarQube, `web` o TaskApiSDD no responden.
- Hay cambios sin commitear.
- Lo que se sube no es la rama actual.

### Grafo de conocimiento (graphify)
Herramienta de apoyo que se instala en el host (`uv tool install graphifyy`) y no es dependencia del proyecto.
```bash
/graphify .                     # (en Claude Code) Construir el grafo en graphify-out/
graphify update .               # Actualizar tras cambiar código (sin coste de LLM)
graphify query "<pregunta>"     # Consultar el grafo
```

## Convenciones

- Ficheros y carpetas en `kebab-case` con sufijo de responsabilidad (`task-card.component.tsx`, `login.schema.ts`).
- Código en inglés, comentarios en español y textos de la UI en español dentro de `texts/`.
- Tests en una subcarpeta `tests/` junto a la carpeta del fichero probado.
- Responsive obligatorio: toda pantalla y todo componente funcionan desde 360px, mobile-first, comprobado con Playwright en móvil (360×800), tablet (768×1024) y escritorio (1280×800).
- Pruebas E2E con Playwright en `e2e/` para el login, crear tarea, eliminar tarea y cada input escribible. Las de Chromium bloquean el push, salvo en los push que solo cambian ficheros `.md`; las de Firefox se ejecutan al terminar cada tarea.
- Las dudas de una spec se marcan con `[NEEDS CLARIFICATION]` y se resuelven antes de escribir el plan. Si el código y la spec no coinciden, manda la spec.
- Los módulos solo se importan entre sí a través de su `index.ts` público.
- Toda funcionalidad nueva empieza con su spec, plan y tasks en `sdd/`. No necesitan spec las correcciones de errores, los typos, la configuración, las actualizaciones de dependencias ni los cambios de documentación.
- **Spec-anchored:** las specs no se descartan tras implementarlas; siguen describiendo el comportamiento vigente. Todo cambio de comportamiento actualiza primero la spec y luego el código, y cada RF tiene un test que cita su ID.
- Solo tokens del sistema de diseño: sin valores arbitrarios de Tailwind.
- Props de los componentes de solo lectura (`Readonly<Props>`) y `<output>` para los estados de carga, como exige SonarQube (S6759, S6819).
- TypeScript sin `any` ni aserciones de tipo (`as`, incluido `as const`): tipos con `interface`/`type`, genéricos, type guards o Zod. Las aserciones solo se permiten en los tests.
- Sin `enum`: uniones de literales (`'todo' | 'in-progress' | 'done'`).
- Estructura de pantallas según la plantilla de `docs/design/`. El tema (colores, tipografía, márgenes…) sale solo de `DESIGN.md`: cambiarlo solo toca `DESIGN.md` y `design-tokens.css`, nunca los componentes.
- Sin componentes duplicados: las piezas de layout se definen una vez en `src/shared/layout/` y todo componente existente se reutiliza o se amplía antes de crear uno nuevo.
- Todo `useEffect` limpia lo que registra, es cancelable para evitar condiciones de carrera y tiene tests de limpieza y de carreras.
- Componentes headless (lógica y efectos solo en custom hooks), compound components, composición con `children` y componentes base polimórficos (`as`).
- Estado compartido centralizado en los stores de Redux. El estado de UI de los compound components (desplegable, acordeón, stepper, modal) va en su contexto interno. Cualquier otro React Context requiere aprobación.

Detalle completo en `AGENTS.md` §4.

## Documentos

- **`CONSTITUTION.md`**: ley suprema del proyecto.
- **`AGENTS.md`**: guía corta para agentes de IA (estructura, comandos del día a día, prohibiciones y lecciones aprendidas).
- **`DESIGN.md`**: sistema de diseño (colores, tipografía, componentes y patrones de layout).
- **`docs/design/`**: análisis del tablero de tareas de referencia y su imagen.

> Este README se mantiene al día con cada cambio en `CONSTITUTION.md`, `AGENTS.md` o `sdd/` (CONSTITUTION.md, Gobierno 3).
