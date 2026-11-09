# Plan: Front security hardening — datos de sesión, pestañas, redirecciones y cabeceras
Spec: `sdd/004-front-security-hardening/spec.md` (Implementada) · Estado: Aprobado · Fecha: 2026-11-09

Los RF, RNF, CE y S de este plan son los de la spec 004. Los del MVP del frontend se citan como «001 RF-xx» y los de la API como «API-002 RF-xx». Las decisiones se numeran D-1, D-2… y los riesgos R-1, R-2…

## 1. Resumen técnico

Sin pantallas ni dependencias nuevas. Dos bloques independientes:

- **Sesión y datos (RF-01 a RF-08), en `src/shared/`:**
  - Un listener de Redux borra la caché de RTK Query cuando termina la sesión, por caducidad o por cierre, en un solo sitio (D-1).
  - Un canal entre pestañas (`BroadcastChannel`) avisa del fin de la sesión. Cada pestaña lo escucha con un hook montado en `AppRoot` (D-2, D-3).
  - Una utilidad pura valida `returnTo` resolviéndolo como URL (D-4).
- **Servidor web de producción (RF-09 a RF-25), en `nginx/`:**
  - Los ficheros pre y pro, y los fragmentos de cabeceras y de tráfico, ya existen y pasan `nginx -t`. Falta conectarlos a la imagen: `Dockerfile.prod` elige el entorno al construir (D-5) y `docker-compose.prod.yml` deja de publicar puertos (D-6).
  - Una suite E2E propia comprueba las cabeceras y el comportamiento de pre y pro sobre la imagen real (D-7).
  - Dos arreglos para que la consola quede limpia con la CSP (RNF-01): Zod sin `Function` (D-8) y las fuentes sin incrustar en el CSS (D-9).

## 2. Comprobación constitucional

**Excepciones usadas:** ninguna.

| Principio | Cómo lo cumple este plan | Estado |
| :--- | :--- | :--- |
| **I. Stack cerrado y entorno** | Sin dependencias nuevas: `BroadcastChannel` es una API del navegador y el listener es de Redux Toolkit. Todo se ejecuta en Docker. | ✅ |
| **II. Spec-anchored** | Spec 004 aprobada. Cada tarea cita sus RF y cada RF tiene su test (sección 8). | ✅ |
| **III. Clarificar antes de asumir** | Sin marcas abiertas. El contrato de sesión sale de API-002 y del código de `session-base-query.ts`. | ✅ |
| **IV. Calidad: tipado y tests** | El mensaje entre pestañas se valida con Zod, sin aserciones (D-2). Tests de la utilidad, el listener y el hook, y E2E de cada historia. | ✅ |
| **V. Datos, estado y seguridad** | Nada se guarda en el navegador: el canal solo transporta el motivo del fin (RF-06). Los datos siguen solo en la caché de RTK Query. | ✅ |
| **VI. Separación de responsabilidades** | El canal se escucha en un hook con limpieza (`close()`). `shared/` solo importa el `index.ts` de `auth`. | ✅ |
| **VII. Diseño y accesibilidad** | Sin cambios de interfaz (RNF-02). | ✅ |

## 3. Estructura de archivos

### 3.1 Aplicación

| Archivo | Cambio | RF |
| :--- | :--- | :--- |
| `src/shared/session/session-channel.util.ts` | **Nuevo.** `announceSessionEnd(reason)` y `sessionEndMessageSchema` (`{ type: 'session-ended', reason: 'signedOut' \| 'expired' }`); no hace nada si no hay `BroadcastChannel` | RF-04 a RF-07 |
| `src/shared/session/use-session-sync.hook.ts` | **Nuevo.** Escucha el canal; con un mensaje válido y la sesión abierta, despacha `sessionEnded` o `sessionExpired`, sin volver a avisar | RF-04, RF-05, RF-07 |
| `src/shared/store/session-cleanup.listener.ts` | **Nuevo.** Listener de `sessionEnded` y `sessionExpired` que despacha `baseApi.util.resetApiState()` | RF-01, RF-02 |
| `src/shared/store/store.ts` | Añade el middleware del listener | RF-01 |
| `src/shared/router/return-to.util.ts` | **Nuevo.** `safeReturnTo(value)`, que sustituye a la función de `use-route-access.hook.ts` | RF-08 |
| `src/shared/router/use-route-access.hook.ts` | Usa `safeReturnTo` de la utilidad | RF-08 |
| `src/shared/router/app-root.component.tsx` | Monta `useSessionSync` | RF-04, RF-05 |
| `src/shared/api/session-base-query.ts` | Tras `sessionExpired`, llama a `announceSessionEnd('expired')` | RF-05 |
| `src/modules/auth/hooks/use-logout.hook.ts` | Quita su `resetApiState` (lo hace el listener) y avisa con `announceSessionEnd('signedOut')` | RF-01, RF-04 |
| `src/modules/account/hooks/use-delete-account.hook.ts` | Igual que cerrar sesión | RF-01, RF-04 |
| `src/shared/config/zod.config.ts` | **Nuevo.** `z.config({ jitless: true })`, importado el primero en `main.tsx` | RNF-01 |
| `src/main.tsx` | Importa `zod.config.ts` antes que nada | RNF-01 |
| `vite.config.ts` | `build.assetsInlineLimit`: las fuentes nunca se incrustan | RNF-01 |

### 3.2 Servidor web y despliegue

| Archivo | Cambio | RF |
| :--- | :--- | :--- |
| `nginx/pre.conf.template`, `nginx/pro.conf.template` | Ya existen: preproducción (HTTP) y producción (detrás del proxy de Dokploy) | RF-13 a RF-25 |
| `nginx/security-headers.conf` | Ya ampliado: CSP con la API en `connect-src`, Google Fonts en `style-src` y `font-src`, sin iframes (`frame-src`, `child-src` y `frame-ancestors` a `'none'`), `object-src 'none'` y Trusted Types; `Permissions-Policy`, COOP y CORP | RF-09 a RF-12, RF-15 |
| `nginx/http-hardening.conf`, `nginx/server-hardening.conf` | Ya existen: IP real, límites por IP, métodos, rutas de escáneres, tamaños, tiempos y registro | RF-13, RF-19 a RF-25 |
| `nginx/default.conf.template` | **Se borra**: lo sustituyen pre y pro | — |
| `Dockerfile.prod` | `ARG NGINX_ENV` obligatorio (`pre` o `pro`); copia la plantilla del entorno y los cuatro fragmentos | RF-18 |
| `docker-compose.prod.yml` | `NGINX_ENV: pro`; sin `ports`, solo `expose: 8080` | S-02 |
| `docker-compose.dev.yml` | Servicios `pre` (8081) y `pro` (8082), con el perfil `security`, construidos con `Dockerfile.prod` | CE-04, CE-05 |
| `playwright.config.ts` | Proyecto `security` (Chromium escritorio) que solo ejecuta `e2e/security/`; los 6 proyectos actuales la ignoran | CE-04, CE-05 |
| `package.json` | Script `test:security` (`playwright test --project=security`) | CE-04 |

### 3.3 E2E

| Archivo | Contenido | RF |
| :--- | :--- | :--- |
| `e2e/specs/session-security.e2e.ts` | Caducidad con otra cuenta en la misma pestaña, cierre de sesión en dos pestañas y caducidad en dos pestañas | RF-01 a RF-05, CE-01, CE-02 |
| `e2e/specs/return-to.e2e.ts` | Cada valor de vuelta de los casos límite | RF-08, CE-03 |
| `e2e/security/headers.security.ts` | Cabeceras de pre y pro, redirección a HTTPS, dominios ajenos, métodos, rutas de escáneres y límite por IP | RF-09 a RF-25, CE-04, CE-05 |
| `e2e/security/csp-console.security.ts` | Recorre las pantallas públicas de la imagen pre sin ninguna infracción de la política (`securitypolicyviolation`) | RNF-01 |

## 4. Lógica principal

### 4.1 Borrado de la caché (RF-01, RF-02, D-1)
`session-cleanup.listener.ts` crea un `createListenerMiddleware` con un efecto para `sessionEnded` y `sessionExpired`: despachar `baseApi.util.resetApiState()`. Así el borrado no depende de quién termine la sesión (botón, borrado de cuenta, caducidad o aviso de otra pestaña). La caché queda vacía antes de que la ruta protegida lleve al inicio de sesión, y el siguiente usuario solo ve datos pedidos después de entrar (RF-02).

### 4.2 Aviso entre pestañas (RF-04 a RF-07, D-2, D-3)
- **Enviar:** `announceSessionEnd(reason)` abre `new BroadcastChannel('kompitu-session')`, envía `{ type: 'session-ended', reason }` y lo cierra. Si `BroadcastChannel` no existe, no hace nada (RF-07).
- **Quién envía:** el origen del fin de la sesión. Cerrar sesión y borrar la cuenta envían `signedOut`, y `session-base-query.ts` envía `expired` tras despachar `sessionExpired`.
- **Recibir:** `useSessionSync` abre el canal en un `useEffect` y lo cierra en la limpieza. Valida cada mensaje con `sessionEndMessageSchema.safeParse` y descarta lo que no encaje. Solo actúa si la sesión local está abierta, y despacha `sessionEnded()` o `sessionExpired()`. El listener borra la caché, y la ruta protegida lleva al inicio de sesión: sin `returnTo` tras un cierre, y con `returnTo` y el motivo tras una caducidad (001 RF-07, RF-05).
- **Sin bucles:** la pestaña que recibe no vuelve a avisar, porque `announceSessionEnd` solo se llama desde el origen. `BroadcastChannel` no entrega el mensaje a quien lo envía.

### 4.3 Pantalla a la que volver (RF-08, D-4)
`safeReturnTo(value)` devuelve `ROUTES.board` si el valor está vacío, no empieza por `/`, empieza por `//` o contiene `\` o caracteres de control, también tras decodificarlo (`/%5Cejemplo.com`). Si no, lo resuelve con `new URL(value, 'https://kompitu.invalid')`: si el origen cambia, devuelve el tablero; si no, devuelve `pathname + search + hash`.

### 4.4 Imagen de producción (RF-18, D-5, D-6)
- `Dockerfile.prod` exige `NGINX_ENV` y copia `nginx/${NGINX_ENV}.conf.template` como plantilla, junto a `security-headers.conf`, `http-hardening.conf` y `server-hardening.conf`.
- En Dokploy, el servicio no publica puertos: el proxy llega por la red interna, y `X-Forwarded-Proto` y `X-Forwarded-For` son fiables (S-02).

## 5. Interfaz
Sin cambios visibles (RNF-02). Las pantallas de inicio de sesión ya muestran el mensaje de sesión caducada (001 RF-07).

## 6. Decisiones técnicas

- **D-1 — Borrado de la caché en un listener de Redux.** Hoy cerrar sesión y borrar la cuenta borran la caché cada uno por su lado, y la caducidad no la borra. Un listener de las dos acciones de fin de sesión lo hace en un solo sitio. `session-base-query.ts` no puede despachar `resetApiState` sin importar `base.api.ts`, que a su vez lo importa a él.
- **D-2 — `BroadcastChannel`, no `storage`.** El evento `storage` obliga a escribir en `localStorage`, y RF-06 y 001 RNF-06 lo prohíben. `BroadcastChannel` no guarda nada y está en Chrome y Firefox (S-03).
- **D-3 — Avisa quien origina el fin.** Si el listener avisara al ver la acción, la pestaña que recibe volvería a avisar. Las demás lo ignorarían por no tener ya la sesión abierta, pero habría mensajes de más. Avisar desde los tres puntos de origen es explícito y no tiene bucles.
- **D-4 — Validar `returnTo` como URL.** Comparar prefijos de texto deja pasar variantes como `/\` o `/%5C`. Resolverlo contra un origen ficticio y comparar el origen sigue la misma regla que el navegador.
- **D-5 — El entorno se elige al construir la imagen.** Así pre y pro son la misma imagen con distinta plantilla, y un error en el nombre del entorno falla al construir, no al arrancar.
- **D-6 — Producción sin puertos publicados.** Es lo que hace fiables las cabeceras de Traefik (`X-Forwarded-*`): nadie puede llegar al contenedor sin pasar por el proxy.
- **D-7 — Suite E2E propia para el servidor web (`security`).** Las cabeceras solo existen en la imagen de Nginx, no en el servidor de Vite que usan las E2E actuales. Se prueban contra contenedores `pre` y `pro` locales, en un solo proyecto, porque no dependen del navegador. No entra en el pre-push: construir la imagen alargaría cada push, y la constitución define qué ejecuta. Se ejecuta al cerrar la funcionalidad.
- **D-8 — Zod sin JIT.** Zod 4 prueba `Function('')` para decidir si compila validadores; con la CSP sin `unsafe-eval` y con Trusted Types, esa prueba deja un error en la consola. `z.config({ jitless: true })` evita la prueba. Los validadores interpretados son algo más lentos, pero aquí validan respuestas pequeñas.
- **D-9 — Fuentes como ficheros, no incrustadas.** Vite incrusta como `data:` los recursos de menos de 4 KB, y la CSP (`font-src 'self'`) bloquea tres subconjuntos de fuentes. Ya ocurre hoy en producción. Se excluyen las fuentes de la incrustación en vez de permitir `data:` en la CSP.
- **D-10 — Google Fonts permitido en la CSP, pero sin usarlo todavía.** El usuario pide permitir las hojas de estilo y las fuentes de Google (RF-12). Hoy la aplicación sirve sus propias fuentes (Inter y JetBrains Mono, con Fontsource); la CSP las admite a las dos sin cambiar lo que se ve. Pasar a Google Fonts sería otro cambio, con su efecto en la privacidad (cada visita llamaría a Google) y en el rendimiento.
- **D-11 — Registro de accesos en un fichero, solo en las E2E de seguridad.** RF-25 no se puede comprobar leyendo la salida del contenedor desde Playwright. `pre.conf.template` incluye los fragmentos opcionales de `/etc/nginx/snippets/testing/`, que en la imagen no existen. El servicio `pre` de `docker-compose.dev.yml` monta `nginx/testing/access-log-file.conf`, que escribe también el registro en `.nginx-logs/access.log` (ignorado por git), y la E2E lo lee. En preproducción y producción el registro solo va a la salida del contenedor. No se usa `test-results/`, porque Playwright la vacía al empezar cada ejecución.

## 7. Estrategia de tests

| Nivel | Qué | RF |
| :--- | :--- | :--- |
| Utilidades | `safeReturnTo` con una tabla: cada valor que debe ir al tablero y cada uno válido. `announceSessionEnd` con y sin `BroadcastChannel` | RF-06 a RF-08 |
| Store | El listener borra la caché con `sessionEnded` y con `sessionExpired`, y no con otras acciones | RF-01, RF-02 |
| Hooks | `useSessionSync` con un `BroadcastChannel` simulado: cierre, caducidad, mensaje no válido ignorado, sesión ya cerrada ignorada, `close()` al desmontar y sin canal disponible | RF-04 a RF-07 |
| Base query | La caducidad avisa a las demás pestañas; un 401 al arrancar sin sesión no avisa | RF-05 |
| Hooks existentes | `useLogout` y `useDeleteAccount` avisan con `signedOut` | RF-04 |
| Config | `zod.config.ts` deja `jitless` activado | RNF-01 |
| E2E (6 proyectos) | `session-security.e2e.ts` y `return-to.e2e.ts` | RF-01 a RF-08 |
| E2E (`security`) | `headers.security.ts` y `csp-console.security.ts` sobre la imagen real | RF-09 a RF-25, RNF-01 |

- **Nombres de los tests:** citan su RF (`it('RF-08: …')`).
- **Caducidad en E2E:** se fuerza borrando las cookies del contexto y pidiendo una pantalla con datos: la API responde `MISSING_TOKEN` y la aplicación da la sesión por terminada (`SESSION_ENDING_CODES`).
- **Dos pestañas en E2E:** dos páginas del mismo contexto de Playwright, que comparten cookies y `BroadcastChannel`.

## 8. Trazabilidad

| RF | Tarea | Test |
| :--- | :--- | :--- |
| RF-01, RF-02 | T001, T004, T005, T008 | `session-cleanup.listener.test.ts`, `use-logout.hook.test.tsx`, `use-delete-account.hook.test.tsx`, `session-security.e2e.ts` |
| RF-03 | T008 | `session-security.e2e.ts` |
| RF-04 a RF-07 | T002 a T004, T006 a T008 | `session-channel.util.test.ts`, `use-session-sync.hook.test.tsx`, `session-base-query.test.ts`, `session-security.e2e.ts` |
| RF-08 | T009, T010 | `return-to.util.test.ts`, `return-to.e2e.ts` |
| RF-09 a RF-25 | T013 a T016, T018 | `headers.security.ts` |
| RNF-01 | T011, T012, T016 | `zod.config.test.ts`, `csp-console.security.ts` |

## 9. Riesgos

- **R-1 — Dokploy y los puertos.** Quitar `ports` de `docker-compose.prod.yml` exige que Dokploy enrute el dominio al servicio por su red interna. **Solución:** el README explica cómo configurar el dominio en Dokploy (servicio `web`, puerto 8080, HTTPS con Let's Encrypt). El primer despliegue se comprueba a mano con las cabeceras de RF-09 a RF-17.
- **R-2 — Trusted Types en pantallas privadas.** La imagen pre local no puede iniciar sesión: la API solo admite el origen de desarrollo (CORS). `csp-console.security.ts` recorre las pantallas públicas. **Solución:** el código de la aplicación no escribe HTML (CONSTITUTION V.4) y React solo lo hace con `dangerouslySetInnerHTML`, que está prohibido. Tras desplegar, se revisa la consola en producción con sesión iniciada.
- **R-3 — Varios tests leen `resetApiState` en los hooks de cerrar sesión.** Al moverlo al listener (D-1), los tests de `useLogout` y `useDeleteAccount` que comprueben el borrado tienen que montar el store real con el listener. **Solución:** `freshStore()` usa `createAppStore`, que incluirá el middleware; si algún test lo comprueba con un espía, se adapta a comprobar la caché vacía.
- **R-4 — Límite por IP en las E2E de seguridad.** La ráfaga de CE-05 llega desde la misma IP que el resto de la suite. **Solución:** el test de la ráfaga envía otra IP en `X-Forwarded-For`, que el contenedor acepta porque la petición llega desde la red privada de Docker.

## Registro de cambios

- **2026-11-09** — Creación del plan a partir de la spec aprobada; pendiente de la revisión del usuario. Estado → *Borrador*.
- **2026-11-09** — Cambio de RF-12 pedido por el usuario: la API explícita, Google Fonts y el bloqueo de iframes en la CSP. Se añade D-10 y se amplía la fila de `security-headers.conf`. Estado → *Borrador*.
- **2026-11-09** — Plan aprobado por el usuario. Estado → *Aprobado*.
- **2026-11-09** — D-11, a petición del usuario (opción a): registro de accesos en un fichero solo para la E2E de RF-25.
