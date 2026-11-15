# Plan: Protección frente a bots con Cloudflare Turnstile en el acceso
Spec: `sdd/005-turnstile-bot-protection/spec.md` (Implementada) · Estado: Aprobado · Fecha: 2026-11-15

Los RF, RNF, CE y S de este plan son los de la spec 005. Los de otras funcionalidades se citan como «001 RF-xx», «004 RF-xx» y, los de la API, «API-002 RF-xx» y «API-005 RF-xx». Las decisiones se numeran D-1, D-2… y los riesgos R-1, R-2…

## 1. Resumen técnico

**Sin dependencias nuevas:**
- El script de Turnstile se carga desde Cloudflare con una etiqueta `<script>` en `index.html`, no se instala como paquete (D-1).
- Sus tipos se declaran a mano en el proyecto, con un *type guard* y sin aserciones (D-3).

**Tres bloques:**
- **Widget (RF-01 a RF-06), en `src/modules/auth/`:**
  - Un hook headless, `useTurnstile`, pinta el widget en un contenedor, guarda el token y lo descarta al caducar, al reiniciarlo y al desmontar. También informa de los errores de carga (D-2, D-4).
  - Un componente sin lógica, `TurnstileField`, reserva el sitio del widget y muestra su mensaje debajo.
  - `useLoginForm` y `useRegisterForm` componen el hook: no envían sin token, añaden `turnstileToken` a la petición y reinician el widget tras cada envío (D-5).
- **Errores de la API (RF-08, RF-13 a RF-15), en `src/shared/api/` y los dos hooks de formulario:**
  - Dos códigos nuevos con su mensaje.
  - Un `VALIDATION_ERROR` sobre `turnstileToken` se trata como `TURNSTILE_FAILED` (D-6).
- **Configuración y servidor web (RF-09 a RF-12):**
  - `VITE_TURNSTILE_SITE_KEY` se valida al arrancar (RF-11).
  - Desarrollo y E2E usan la *site key* de prueba, declarada en `docker-compose.dev.yml` (D-7).
  - La CSP de Nginx permite `https://challenges.cloudflare.com` en `script-src` y `frame-src` (D-8).

## 2. Comprobación constitucional

**Excepciones usadas:** ninguna.

| Principio | Cómo lo cumple este plan | Estado |
| :--- | :--- | :--- |
| **I. Stack cerrado y entorno** | Sin dependencias nuevas: el script de Cloudflare no es una dependencia de `package.json` y no duplica nada del stack (D-1). Todo se ejecuta en Docker. | ✅ |
| **II. Spec-anchored** | Spec 005 aprobada. Cada tarea cita sus RF y cada RF tiene su test (sección 8). El cambio de 004 RF-12 se propone en la spec de la 004 antes de tocar Nginx (T001). | ✅ |
| **III. Clarificar antes de asumir** | Sin marcas abiertas. El contrato sale de API-005 (cuerpo, códigos y estados HTTP). | ✅ |
| **IV. Calidad: tipado y tests** | API de Turnstile tipada con una interfaz y un *type guard* (`isTurnstileApi`), sin `any` ni `as` (D-3). Test del hook (incluidos limpieza y condiciones de carrera), del componente, de los formularios, de la configuración y E2E de cada historia. | ✅ |
| **V. Datos, estado y seguridad** | La *site key* es pública (S-01); la clave secreta no existe en este repositorio. El token solo vive en el estado del hook hasta el envío (RNF-04). La CSP se amplía solo a `challenges.cloudflare.com` y mantiene Trusted Types y `frame-ancestors 'none'` (D-8). | ✅ |
| **VI. Separación de responsabilidades** | `useTurnstile` concentra el `useEffect`, el estado y la accesibilidad; `TurnstileField` no tiene lógica. El efecto limpia el widget y el listener del script y no aplica resultados tras desmontar (D-4). | ✅ |
| **VII. Diseño y accesibilidad** | Sin valores arbitrarios: el sitio del widget usa `min-h-16` y `w-full` (D-9). El widget se completa con teclado y su estado se anuncia en un `<output>` (RNF-01). Cabe en 360px (RNF-02). | ✅ |

## 3. Estructura de archivos

### 3.1 Aplicación

| Archivo | Cambio | RF |
| :--- | :--- | :--- |
| `index.html` | `<script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" async defer data-turnstile-script>` | RF-01 |
| `src/modules/auth/types/turnstile.types.ts` | **Nuevo.** `TurnstileApi` (`render`, `reset`, `remove`), `TurnstileRenderOptions`, `TurnstileAction` (`'login' \| 'register'`) y `declare global { interface Window { turnstile?: TurnstileApi } }` | RF-01, RF-02 |
| `src/modules/auth/hooks/turnstile-api.util.ts` | **Nuevo.** `isTurnstileApi(value): value is TurnstileApi` y `whenTurnstileReady(signal)`: resuelve con la API cuando el script ha cargado o rechaza si falla, sin escuchar tras `abort` | RF-01, RF-06 |
| `src/modules/auth/hooks/use-turnstile.hook.ts` | **Nuevo.** `useTurnstile(action)` → `{ containerRef, token, status, reset, statusText }` (sección 4.1) | RF-01 a RF-06, RNF-01, RNF-04 |
| `src/modules/auth/components/turnstile-field.component.tsx` | **Nuevo.** Contenedor del widget (`w-full min-h-16`), `<output>` con el estado para lectores de pantalla y el mensaje de error debajo, como `Field` | RF-01, RF-03, RF-06, RNF-01, RNF-02 |
| `src/modules/auth/hooks/use-login-form.hook.ts` | Compone `useTurnstile('login')`; sin token → error del widget (RF-03); envía `turnstileToken`; `reset()` tras cualquier resultado; trata los errores de D-6 | RF-03, RF-05, RF-07, RF-08, RF-13 a RF-15 |
| `src/modules/auth/hooks/use-register-form.hook.ts` | Igual con `useTurnstile('register')` | RF-03, RF-05, RF-07, RF-08, RF-13 a RF-15 |
| `src/modules/auth/hooks/turnstile-error.util.ts` | **Nuevo.** `turnstileErrorMessage(error)`: el mensaje del widget para `TURNSTILE_FAILED`, `TURNSTILE_UNAVAILABLE` o `VALIDATION_ERROR` con `turnstileToken`; `undefined` para el resto (D-6) | RF-08, RF-13, RF-14 |
| `src/modules/auth/pages/login.page.tsx`, `register.page.tsx` | `<TurnstileField>` entre los campos y el error general, antes del botón | RF-01 |
| `src/modules/auth/api/auth.api.ts` | El argumento de `login` y `register` pasa a `LoginRequest` / `RegisterRequest` (valores del formulario + `turnstileToken: string`) | RF-07 |
| `src/modules/auth/types/auth-request.types.ts` | **Nuevo.** `LoginRequest` y `RegisterRequest` | RF-07 |
| `src/modules/auth/texts/auth.texts.ts` | `AUTH_TEXTS.turnstile`: `required` (RF-03), `loadFailed` (RF-06), `failed` (RF-08), `unavailable` (RF-13), y los estados de `<output>` (`loading`, `solved`) | RF-03, RF-06, RF-08, RF-13, RNF-01 |
| `src/shared/api/api-error.util.ts` | `TURNSTILE_FAILED` y `TURNSTILE_UNAVAILABLE` en `ApiErrorCode` y `API_ERROR_CODES` | RF-08, RF-13 |
| `src/shared/texts/errors.texts.ts` | Mensajes de los dos códigos (los mismos de RF-08 y RF-13), para cualquier otro sitio que los muestre | RF-08, RF-13 |
| `src/shared/config/env.schema.ts` | `VITE_TURNSTILE_SITE_KEY` obligatoria (cadena no vacía) → `env.turnstileSiteKey` | RF-11 |
| `jest/env.stub.ts` | `turnstileSiteKey: '1x00000000000000000000AA'` | RF-12 |

### 3.2 Servidor web, build y entornos

| Archivo | Cambio | RF |
| :--- | :--- | :--- |
| `sdd/004-front-security-hardening/spec.md` | Propuesta de cambio de RF-12 (T001, con aprobación del usuario) y entrada en su *Registro de cambios* | RF-09 |
| `nginx/security-headers.conf` | CSP: `script-src 'self' https://challenges.cloudflare.com`; `frame-src` y `child-src` `https://challenges.cloudflare.com`. El resto igual | RF-09 |
| `Dockerfile.prod` | `ARG VITE_TURNSTILE_SITE_KEY` obligatorio, como `VITE_API_URL` | RF-11 |
| `docker-compose.prod.yml` | Build arg `VITE_TURNSTILE_SITE_KEY: ${VITE_TURNSTILE_SITE_KEY:?…}` desde `.env.prod` | RF-11 |
| `docker-compose.dev.yml` | `web` y `e2e`: `environment: VITE_TURNSTILE_SITE_KEY: 1x00000000000000000000AA`; `pre` y `pro`: el mismo valor como build arg | RF-12 |
| `README.md` | Variables (`VITE_TURNSTILE_SITE_KEY`), orden de despliegue (S-05), `TURNSTILE_ENFORCE` de la API en local y estado de la 005 | — |

### 3.3 E2E

| Archivo | Cambio | RF |
| :--- | :--- | :--- |
| `e2e/fixtures/api-client.ts`, `e2e/global-setup.ts` | Los logins y registros por API envían `turnstileToken: 'XXXX.DUMMY.TOKEN.XXXX'`, para funcionar con la API en modo obligatorio (S-03) | CE-02 |
| `e2e/pages/login.po.ts`, `register.po.ts` | `waitForVerification()`: espera el texto «Comprobación completada» del `<output>` | RF-01 |
| `e2e/specs/turnstile.e2e.ts` | **Nuevo.** Login y registro con el widget real de prueba; envío antes del token; script bloqueado; respuestas `TURNSTILE_FAILED`, `TURNSTILE_UNAVAILABLE` y `VALIDATION_ERROR` del token simuladas con `page.route`; segundo intento tras `INVALID_CREDENTIALS` con un token en el cuerpo; teclado; responsive | RF-01 a RF-08, RF-13 a RF-15, RNF-01, RNF-02 |
| `e2e/specs/login.e2e.ts`, `register.e2e.ts`, `fields-auth.e2e.ts` | Esperan la verificación antes de enviar | CE-02 |
| `e2e/security/csp-console.security.ts` | Ya recorre las pantallas públicas: ahora el inicio de sesión y el registro cargan Turnstile; se comprueba además que el iframe de Cloudflare aparece | RF-09, RF-10, CE-04 |

## 4. Lógica principal

### 4.1 `useTurnstile(action)` (RF-01 a RF-06, D-2, D-4)
- **Estado:** `status`: `'loading' | 'ready' | 'solved' | 'error'` y `token: string | null`.
- **Efecto (un solo `useEffect`, dependencias `[action, container]`):**
  1. Crea un `AbortController`.
  2. `whenTurnstileReady(signal)`:
     - si `window.turnstile` ya cumple `isTurnstileApi`, la devuelve;
     - si no, escucha `load` y `error` de `script[data-turnstile-script]`;
     - si el script no existe o falla, rechaza.
  3. Con la API, `turnstile.render(container, { sitekey: env.turnstileSiteKey, action, theme: 'auto', size: 'flexible', language: 'es', callback, 'expired-callback', 'error-callback', 'timeout-callback' })` guarda el `widgetId`.
  4. **Callbacks:**
     - `callback(token)` → `solved` y guarda el token.
     - `expired-callback` y `timeout-callback` → `token = null` y `ready`. Turnstile vuelve a pedir un token por su cuenta (`refresh-expired: 'auto'`) (RF-04).
     - `error-callback` → `error` y `token = null` (RF-06).
  5. **Limpieza:** `abort()`, que quita los listeners del script, y `turnstile.remove(widgetId)` si se llegó a pintar. Un callback que llegue tras `abort` no cambia el estado.
- **`reset()`:** `token = null`, `status = 'ready'` y `turnstile.reset(widgetId)` (RF-05).
- **`containerRef`:** *callback ref* que guarda el elemento en el estado, para que el efecto dependa de él sin leer `ref.current` durante el render.
- **`statusText`:** el texto del `<output>` según `status` (RNF-01).

### 4.2 Formularios (RF-03, RF-05, RF-07, RF-08, RF-13 a RF-15)
En `useLoginForm`, y lo mismo en `useRegisterForm`:
1. `handleSubmit` valida los campos como hoy.
2. **Sin token:** `form.setError('root.turnstile', { message: AUTH_TEXTS.turnstile.required })` y no envía nada (RF-03).
3. **Con token:**
   - `login({ ...values, turnstileToken: token })`;
   - después, **siempre** `turnstile.reset()` y `clearErrors('root.turnstile')`, también con éxito y con `NETWORK_ERROR` (RF-05);
   - si hay error, `turnstileErrorMessage(error)`:
     - con mensaje → va a `root.turnstile` (RF-08, RF-13, RF-14);
     - sin mensaje → el tratamiento actual (RF-15).
4. **Mensaje bajo el widget:** el error de carga del hook (RF-06) tiene prioridad; si no lo hay, se muestra `root.turnstile`.
5. **Doble envío:** `useSingleSubmit` ya lo evita (001 RF-19).

### 4.3 CSP (RF-09, D-8)
```
script-src 'self' https://challenges.cloudflare.com;
frame-src https://challenges.cloudflare.com;
child-src https://challenges.cloudflare.com;
```
El resto de directivas de 004 RF-12 no cambia: `frame-ancestors 'none'`, `object-src 'none'`, `require-trusted-types-for 'script'`, `connect-src 'self' $api_origin` y Google Fonts.

## 5. Interfaz

- **Posición:** `TurnstileField` va entre el último campo y el botón principal, en el inicio de sesión y en el registro.
- **Tamaño:** el widget *managed* mide 65px de alto. El contenedor reserva `min-h-16` para que el botón no salte al aparecer. Con `size: 'flexible'` ocupa el ancho del formulario, como los campos (mínimo 300px, que cabe en 360px menos los márgenes).
- **Tema:** `theme: 'auto'` sigue la preferencia del sistema, como la aplicación (DESIGN.md, modo oscuro).
- **Mensajes:** van debajo, con `Text tone="danger"`, igual que el error de un campo. El `<output>` con el estado es solo para lectores de pantalla (`sr-only`).
- **Skills:** se cargan `emil-design-eng` para encajar el bloque y `mobile-native` para revisar el toque y el teclado en móvil (AGENTS.md §8).

## 6. Decisiones técnicas

- **D-1 — Script de Cloudflare en `index.html`, sin paquete npm.**
  - Los envoltorios de React para Turnstile serían una dependencia nueva para unas 60 líneas de hook, y Cloudflare exige cargar `api.js` desde su dominio de todas formas.
  - Una etiqueta estática evita crear un `<script>` desde código, que con Trusted Types obligaría a una política para `script.src`.
  - *Coste:* `api.js` se descarga en todas las pantallas, aunque `async defer` no bloquea la carga. Se descarta cargarlo solo en el acceso por el problema de Trusted Types.
- **D-2 — Render explícito (`?render=explicit`).** Con el render implícito, Turnstile busca `.cf-turnstile` solo al cargar, y no ve los formularios que React monta después en una SPA. El render explícito permite crear y destruir el widget con el ciclo de vida del componente.
- **D-3 — Tipos propios y *type guard*.** `window.turnstile` no tiene tipos en el proyecto. Se declara la parte que se usa (`render`, `reset`, `remove`) y se comprueba en tiempo de ejecución con `isTurnstileApi`, sin `as` ni una dependencia `@types`.
- **D-4 — Un efecto cancelable por widget.** `AbortController` para los listeners del script y `remove(widgetId)` en la limpieza. Así, cambiar entre inicio de sesión y registro, o desmontar antes de que cargue el script, no deja widgets huérfanos ni callbacks que escriban en un componente desmontado (CONSTITUTION VI.6).
- **D-5 — El token no entra en el formulario de React Hook Form ni en Zod.**
  - No lo escribe el usuario, y no tiene reglas que mostrar bajo un campo.
  - Vive en el estado del hook y se añade al cuerpo al enviar.
  - Los esquemas `login.schema.ts` y `register.schema.ts` no cambian.
- **D-6 — Un `VALIDATION_ERROR` sobre `turnstileToken` es un fallo de verificación.** Solo ocurre si el token llega vacío o demasiado largo, y el usuario no puede corregirlo en ningún campo. Se muestra como RF-08 y se reinicia el widget (RF-14).
- **D-7 — La *site key* de prueba se declara en `docker-compose.dev.yml`, no en `.env.dev`.** Es pública y la misma para todos los desarrolladores, así que puede ir versionada. Además, AGENTS.md prohíbe tocar `.env.dev`. La clave real solo se pasa al construir la imagen de producción, desde `.env.prod`, que el usuario añade (`VITE_TURNSTILE_SITE_KEY=0x4AAAAAAGCKQh7WSaKl9bC0`).
- **D-8 — CSP mínima para Turnstile.** Son las dos directivas que pide Cloudflare (`script-src` y `frame-src`), más `child-src` por coherencia. `child-src` está hoy a `'none'` y los navegadores la usan como reserva de `frame-src`. No se añaden `connect-src` ni `'unsafe-inline'`.
- **D-9 — Sitio reservado con un token existente.** `min-h-16` (64px) es el valor de la escala de espaciado de `design-tokens.css` más cercano a los 65px del widget. Se evita un valor arbitrario y un token nuevo en DESIGN.md por 1px.
- **D-10 — Errores de la API simulados en las E2E con `page.route`.** La API local usa la clave secreta de prueba que siempre pasa, así que no puede responder `TURNSTILE_FAILED` ni `TURNSTILE_UNAVAILABLE` de verdad. Es el mismo patrón que `errors.e2e.ts` (`failWith`). El camino feliz sí va contra la API real y el widget real de prueba.
- **D-11 — La *site key* que siempre falla se prueba en Jest, no en E2E.** Vite fija la *site key* al arrancar, así que probar en E2E la clave `2x…` exigiría un segundo servidor de desarrollo. La API tampoco admitiría su origen (CORS), aunque en ese caso no llegaría a enviarse nada. El comportamiento que la clave provoca (`error-callback`, sin token, sin envío) se prueba en Jest con la API de Turnstile simulada. En E2E se cubre el script bloqueado (RF-06) y el envío sin token (RF-03, reteniendo `api.js` con `page.route`). CE-01 se comprueba así entre los dos niveles.

## 7. Estrategia de tests

| Nivel | Qué | RF |
| :--- | :--- | :--- |
| Utilidades | `isTurnstileApi` con objetos válidos e incompletos; `whenTurnstileReady` con la API ya cargada, con `load`, con `error`, sin script y con `abort` antes de cargar (sin listeners colgados); `turnstileErrorMessage` con cada código | RF-01, RF-06, RF-08, RF-13, RF-14 |
| Hook `useTurnstile` | `renderHook` con `window.turnstile` simulado: opciones de `render` (site key, acción, tema e idioma), token en `callback`, caducidad, `error-callback`, `reset`, `remove` al desmontar, desmontaje antes de que cargue el script, cambio de acción (un `remove` y un `render`) y callback tras desmontar ignorado | RF-01 a RF-06 |
| Componente | `TurnstileField` pinta el contenedor, el `<output>` y el mensaje | RF-01, RNF-01 |
| Formularios | `useLoginForm` y `useRegisterForm`: sin token no llama a la API; con token lo envía en el cuerpo; `reset` tras éxito, error y fallo de red; mensajes de `TURNSTILE_FAILED`, `TURNSTILE_UNAVAILABLE` y `VALIDATION_ERROR` del token; `INVALID_CREDENTIALS`, `TOO_MANY_ATTEMPTS` y `EMAIL_ALREADY_REGISTERED` como hoy | RF-03, RF-05, RF-07, RF-08, RF-13 a RF-15 |
| Páginas | El widget está entre los campos y el botón | RF-01 |
| Config | `parseEnv` falla sin `VITE_TURNSTILE_SITE_KEY` y la devuelve si está | RF-11 |
| E2E (6 proyectos) | `turnstile.e2e.ts` y las specs de acceso actualizadas | RF-01 a RF-08, RF-13 a RF-15, RNF-01, RNF-02 |
| E2E (`security`) | `csp-console.security.ts` con el widget cargado en `pre` | RF-09, RF-10, CE-04 |

- **Nombres de los tests:** citan su RF (`it('RF-05: reinicia el widget tras INVALID_CREDENTIALS', …)`).
- **RF-12:** se comprueba en `docker-compose.dev.yml` y con el E2E del camino feliz, que solo pasa con la *site key* de prueba (la real no admite el token ficticio de la API local).

## 8. Trazabilidad

| RF | Tarea | Test |
| :--- | :--- | :--- |
| RF-01, RF-02 | T004 a T008 | `turnstile-api.util.test.ts`, `use-turnstile.hook.test.tsx`, `turnstile-field.component.test.tsx`, `login.page.test.tsx`, `register.page.test.tsx`, `turnstile.e2e.ts` |
| RF-03 | T009, T010 | `use-login-form.hook.test.tsx`, `use-register-form.hook.test.tsx`, `turnstile.e2e.ts` |
| RF-04 | T006 | `use-turnstile.hook.test.tsx` |
| RF-05 | T006, T009, T010 | `use-turnstile.hook.test.tsx`, `use-login-form.hook.test.tsx`, `use-register-form.hook.test.tsx`, `turnstile.e2e.ts` |
| RF-06 | T005, T006 | `turnstile-api.util.test.ts`, `use-turnstile.hook.test.tsx`, `turnstile.e2e.ts` |
| RF-07 | T009, T010 | `use-login-form.hook.test.tsx`, `use-register-form.hook.test.tsx`, `turnstile.e2e.ts` |
| RF-08, RF-13, RF-14 | T003, T009, T010 | `turnstile-error.util.test.ts`, hooks de formulario, `turnstile.e2e.ts` |
| RF-15 | T009, T010 | hooks de formulario, `login.e2e.ts`, `register.e2e.ts` |
| RF-09, RF-10 | T001, T012, T014 | `csp-console.security.ts` |
| RF-11 | T002, T013 | `env.schema.test.ts` |
| RF-12 | T002, T013 | `turnstile.e2e.ts` |

## 9. Riesgos

- **R-1 — Turnstile y Trusted Types.** Si `api.js` escribe HTML con `innerHTML` u otro sumidero, la CSP de 004 RF-12 lo bloquea y la consola muestra infracciones (RF-10).
  - *Comprobación:* T014 recorre el inicio de sesión y el registro en `pre` con `csp-console.security.ts`.
  - *Si falla:* se para y se propone al usuario la política mínima (S-04), por ejemplo una política `default` que solo acepte scripts de `challenges.cloudflare.com`, antes de relajar nada.
- **R-2 — Las E2E dependen de la red hacia Cloudflare.** El widget de prueba carga `api.js` real desde el contenedor `e2e`. Sin salida a Internet, el camino feliz falla.
  - *Solución:* `network_mode: host` ya la tiene. Si Cloudflare va lento, `waitForVerification()` usa la espera por defecto de los *expect* de Playwright, sin `waitForTimeout`.
- **R-3 — Ejecución en paralelo con la API en modo obligatorio.** Los logins por API de las fixtures necesitan token.
  - *Solución:* T011 añade el token ficticio a todas las llamadas.
  - *Requisito de la API local:* tiene que usar la clave secreta de prueba `1x…` (es así hoy) y tener `example.com` y `localhost` en `TURNSTILE_ALLOWED_HOSTNAMES`.
- **R-4 — Firefox y el iframe de Cloudflare.** El comportamiento puede variar entre navegadores en móvil. *Solución:* `turnstile.e2e.ts` se ejecuta en los 6 proyectos con la comprobación responsive de AGENTS.md.
- **R-5 — `Permissions-Policy` de la 004 (RF-09).** Puede impedir alguna capacidad que el iframe de Turnstile pida. Eso da avisos en la consola, no infracciones de la CSP.
  - *Comprobación:* T014 revisa la consola.
  - *Si Turnstile no funciona:* se propone al usuario el cambio mínimo en la 004.
- **R-6 — Despliegue.** Si la imagen se construye sin `VITE_TURNSTILE_SITE_KEY`, falla al construir (RF-11). La API de producción tiene que seguir en `TURNSTILE_ENFORCE=false` hasta desplegar este front (S-05). El README lo explica.

## Registro de cambios

- **2026-11-15** — Creación del plan a partir de la spec aprobada; pendiente de la revisión del usuario. Estado → *Borrador*.
- **2026-11-15** — Plan aprobado por el usuario, junto con el cambio de 004 RF-12 (T001). Estado → *Aprobado*.
- **2026-11-15** — R-1 descartado: `csp-console.security.ts` carga el widget en `pre` con la CSP real y Trusted Types sin ninguna infracción. Detalles de implementación en el *Registro de cambios* de `tasks.md`.
