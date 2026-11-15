# Tasks: Front security hardening — datos de sesión, pestañas, redirecciones y cabeceras
Spec: `sdd/004-front-security-hardening/spec.md` (Implementada) · Plan: `sdd/004-front-security-hardening/plan.md` (Aprobado) · Fecha: 2026-11-09

## Cómo leer este fichero

- **Formato:** `- [ ] T### [P] [Historia] Descripción (RF-xx) — archivo(s)`. Cada tarea va seguida de una línea **Verifica** con el comando que la da por terminada, salvo dentro de un bloque de tests o de implementación de una historia: ahí la línea **Verifica** de la última tarea del bloque vale para todo el bloque (rojo en los tests, verde en la implementación).
- **[P]:** se puede hacer en paralelo con las demás tareas [P] de su bloque.
- **Historias:** `[H1]` datos al caducar la sesión, `[H2]` varias pestañas, `[H3]` pantalla a la que volver, `[H4]` servidor web de producción y `[Cierre]`.
- **Dentro de cada historia:** primero los tests, que **deben fallar** (rojo); después la implementación (verde).
- **Nombres de los tests:** citan su RF (`it('RF-08: …')`).
- **Comandos** (en Docker): `dce` = `docker compose -f docker-compose.dev.yml exec web`; `dre` = `docker compose -f docker-compose.dev.yml run --rm e2e`; `dcs` = `docker compose -f docker-compose.dev.yml --profile security`.
- **Requisito previo de las E2E de sesión:** `web` y TaskApiSDD (`http://localhost:3000`) levantadas.
- **Ya hecho antes del plan** (a petición del usuario, sin tarea): `nginx/pre.conf.template`, `nginx/pro.conf.template`, `nginx/security-headers.conf` ampliado, `nginx/http-hardening.conf` y `nginx/server-hardening.conf`, comprobados con `nginx -t` y peticiones con `curl`. Las tareas de H4 los conectan a la imagen y los prueban de forma automática.
- **Dependencias:** ninguna nueva.

---

## H1 y H2 — Datos al terminar la sesión y varias pestañas (HU-01, HU-02)

### Tests (deben fallar)
- [x] T001 [P] [H1] Tests del listener: `sessionExpired` y `sessionEnded` dejan la caché de RTK Query vacía; otra acción no la toca (RF-01, RF-02) — `src/shared/store/tests/session-cleanup.listener.test.ts`
- [x] T002 [P] [H2] Tests de `announceSessionEnd` y `sessionEndMessageSchema`: envía `{ type: 'session-ended', reason }` y cierra el canal; sin `BroadcastChannel` no hace nada ni lanza; el mensaje no lleva datos de la cuenta (RF-04, RF-06, RF-07) — `src/shared/session/tests/session-channel.util.test.ts`
- [x] T003 [P] [H2] Tests de `useSessionSync` con un `BroadcastChannel` simulado: `signedOut` despacha `sessionEnded`; `expired` despacha `sessionExpired`; un mensaje no válido o con la sesión ya cerrada no hace nada; no vuelve a avisar; `close()` al desmontar; sin `BroadcastChannel`, nada (RF-04, RF-05, RF-07) — `src/shared/session/tests/use-session-sync.hook.test.tsx`
- [x] T004 [P] [H2] Tests ampliados: la caducidad en `session-base-query` avisa con `expired` y un 401 al arrancar sin sesión no avisa; `useLogout` y `useDeleteAccount` avisan con `signedOut` y la caché queda vacía (RF-01, RF-04, RF-05) — `src/shared/api/tests/session-base-query.test.ts`, `src/modules/auth/hooks/tests/use-logout.hook.test.tsx`, `src/modules/account/hooks/tests/use-delete-account.hook.test.tsx`
  - Verifica (rojo): `dce pnpm test src/shared src/modules/auth src/modules/account` falla en los tests nuevos.

### Implementación
- [x] T005 [H1] Listener de fin de sesión que borra la caché, añadido al store; `useLogout` y `useDeleteAccount` dejan de borrarla por su cuenta (plan D-1) (RF-01, RF-02) — `src/shared/store/session-cleanup.listener.ts`, `src/shared/store/store.ts`, `src/modules/auth/hooks/use-logout.hook.ts`, `src/modules/account/hooks/use-delete-account.hook.ts`
- [x] T006 [H2] `announceSessionEnd` y `sessionEndMessageSchema` (plan D-2) (RF-04, RF-06, RF-07) — `src/shared/session/session-channel.util.ts`
- [x] T007 [H2] `useSessionSync`, montado en `AppRoot`; avisos desde `session-base-query`, `useLogout` y `useDeleteAccount` (plan D-3) (RF-04, RF-05, RF-07) — `src/shared/session/use-session-sync.hook.ts`, `src/shared/router/app-root.component.tsx`, `src/shared/api/session-base-query.ts`, `src/modules/auth/hooks/use-logout.hook.ts`, `src/modules/account/hooks/use-delete-account.hook.ts`
  - Verifica (verde): T001–T004 pasan.
- [x] T008 [H1] E2E en `session-security.e2e.ts`: la cuenta A en el tablero, borrar las cookies y pedir otra pantalla, iniciar sesión con la cuenta B en la misma pestaña y no ver ninguna tarea de A, con el mensaje de caducada y la vuelta a la pantalla anterior; dos pestañas y cerrar sesión en una lleva la otra al inicio de sesión sin `returnTo` en menos de 1 s; dos pestañas y la caducidad en una lleva la otra al inicio de sesión con el mensaje de caducada (RF-01 a RF-05, CE-01, CE-02) — `e2e/specs/session-security.e2e.ts`
  - Verifica: `dre pnpm test:e2e e2e/specs/session-security.e2e.ts` en verde en los 6 proyectos.

---

## H3 — Pantalla a la que volver (HU-03)

- [x] T009 [H3] Tests de `safeReturnTo` con la tabla de casos límite (en rojo), después la utilidad y su uso en `useRouteAccess` (plan D-4) (RF-08) — `src/shared/router/tests/return-to.util.test.ts`, `src/shared/router/return-to.util.ts`, `src/shared/router/use-route-access.hook.ts`
  - Verifica: `dce pnpm test src/shared/router` en verde, con los tests de `useRouteAccess` sin cambios.
- [x] T010 [H3] E2E en `return-to.e2e.ts`: iniciar sesión con cada valor que debe ir al tablero y con cada valor válido (RF-08, CE-03) — `e2e/specs/return-to.e2e.ts`
  - Verifica: `dre pnpm test:e2e e2e/specs/return-to.e2e.ts` en verde en los 6 proyectos.

---

## H4 — Servidor web de producción (HU-04)

- [x] T011 [P] [H4] `z.config({ jitless: true })` importado el primero en `main.tsx`, con su test (plan D-8) (RNF-01) — `src/shared/config/zod.config.ts`, `src/shared/config/tests/zod.config.test.ts`, `src/main.tsx`
  - Verifica: `dce pnpm test src/shared/config` y `dce pnpm typecheck` en verde.
- [x] T012 [P] [H4] Las fuentes nunca se incrustan como `data:` en el CSS (plan D-9) (RNF-01) — `vite.config.ts`
  - Verifica: tras `dce pnpm build`, `grep -c "data:font" dist/assets/*.css` da 0.
- [x] T013 [H4] `ARG NGINX_ENV` obligatorio (`pre` o `pro`) en `Dockerfile.prod`, que copia la plantilla del entorno y los cuatro fragmentos; se borra `nginx/default.conf.template` (plan D-5) (RF-18) — `Dockerfile.prod`, `nginx/default.conf.template`
  - Verifica: `docker build -f Dockerfile.prod --build-arg VITE_API_URL=http://localhost:3000 --build-arg NGINX_ENV=pre .` construye; sin `NGINX_ENV`, falla con un mensaje claro.
- [x] T014 [H4] `docker-compose.prod.yml` con `NGINX_ENV: pro` y sin `ports` (solo `expose: 8080`); servicios `pre` (8081) y `pro` (8082) con el perfil `security` en `docker-compose.dev.yml` (plan D-6, D-7) (RF-18, S-02) — `docker-compose.prod.yml`, `docker-compose.dev.yml`
  - Verifica: `dcs up --build -d pre pro` levanta los dos y `curl -sI http://localhost:8081/` responde con la CSP.
- [x] T015 [H4] Proyecto `security` en Playwright (Chromium escritorio, solo `e2e/security/`), ignorado por los 6 proyectos actuales, y script `test:security` (plan D-7) (CE-04) — `playwright.config.ts`, `package.json`
  - Verifica: `dre pnpm test:e2e --list` no incluye `e2e/security/` y `dre pnpm test:security --list` solo incluye esos ficheros.
- [x] T016 [H4] E2E de seguridad: en `headers.security.ts`, cada cabecera de pre y pro (la CSP con la API en `connect-src`, Google Fonts en `style-src` y `font-src`, y `frame-src`, `child-src` y `frame-ancestors` a `'none'`), la redirección a HTTPS con ruta y búsqueda, otros dominios sin respuesta, `405` en `POST`, `404` en `/.env` y `.map`, Nginx sin versión, y una ráfaga de 150 peticiones con `429` en las que sobran mientras otra IP entra; en `csp-console.security.ts`, las pantallas públicas de pre sin ninguna infracción de la política (RF-09 a RF-25, RNF-01, CE-04, CE-05) — `e2e/security/headers.security.ts`, `e2e/security/csp-console.security.ts`
  - Verifica: `dre pnpm test:security` en verde con `pre` y `pro` levantados.

---

## Cierre

- [x] T017 [Cierre] Suite completa: lint, typecheck, Jest con cobertura ≥ 80 %, E2E en los 6 proyectos, `test:security` y quality gate de SonarQube (CE-01 a CE-05)
  - Verifica: `dce pnpm lint && dce pnpm typecheck && dce pnpm test:coverage`, `dre pnpm test:e2e`, `dre pnpm test:security` y `./scripts/sonar-scan.sh` en verde.
- [x] T018 [Cierre] README (*Producción*: Dokploy, `NGINX_ENV`, sin puertos publicados y cómo configurar el dominio; *Pruebas end-to-end*: `test:security`; *Estado del proyecto*) y spec → *Implementada* si cada RF tiene su test (RF-01 a RF-25, CE-01 a CE-05)
  - Verifica: cada RF-01 a RF-25 aparece en el nombre de al menos un test y el README describe el despliegue con Dokploy.

## Registro de cambios

- **2026-11-09** — Creación de las tareas a partir del plan; pendientes de la revisión del usuario.
- **2026-11-09** — T016 comprueba también los cambios de RF-12 pedidos por el usuario: la API, Google Fonts y el bloqueo de iframes en la CSP.
- **2026-11-09** — Plan y tareas aprobados por el usuario.
- **2026-11-09** — T001–T017 hechas. Jest: 1076 tests en 144 suites, 99,5 % de líneas y 95 % de ramas. E2E en los 6 proyectos: 1079 de 1080 en 7,2 min; el fallo fue `errors.e2e.ts` (avisos sin conexión, 001) en chromium-mobile, que pasa 35 de 35 al repetirlo. `test:security`: 9 de 9, con una comprobación aparte de que el recolector de infracciones detecta una de verdad. Quality gate en verde con 0 incidencias. Desviaciones del plan: `Dockerfile.prod` copia las dos plantillas y elige una en un `RUN` que comprueba `NGINX_ENV`, porque con `COPY nginx/${NGINX_ENV}…` BuildKit fallaba sin un mensaje claro; el proyecto `security` solo se carga con `E2E_SECURITY=1` (lo pone `test:security`), para que `pnpm test:e2e` no necesite `pre` y `pro` levantados; el `BroadcastChannel` simulado de los tests vive en `jest/fake-broadcast-channel.ts`. T018: el README ya describe *Producción* (Dokploy, `NGINX_ENV`, sin puertos), *Pruebas end-to-end* (`test:security`) y *Estado del proyecto*. La spec no pasa a *Implementada*: RF-25 (registro con la IP real) no tiene test automático, porque el registro está en la salida del contenedor y la E2E no la ve. Se comprobó a mano con `docker compose logs pre` (las peticiones con `X-Forwarded-For: 192.0.2.50` se registran con esa IP, y sin ella con la de la conexión, `172.21.0.1`). Pendiente de que el usuario decida cómo cubrirlo.
- **2026-11-09** — T018 hecha, con la opción a elegida por el usuario para RF-25 (plan D-11): el servicio `pre` de las E2E escribe también el registro en `.nginx-logs/access.log` y `headers.security.ts` comprueba que una petición queda registrada con la IP de `X-Forwarded-For`, la ruta, el resultado y el navegador. `test:security`: 10 de 10. Cada RF-01 a RF-25 tiene su test y la spec pasa a *Implementada*. Las 18 tareas están hechas.
