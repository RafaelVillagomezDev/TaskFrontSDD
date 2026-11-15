# Feature: Protección frente a bots con Cloudflare Turnstile en el acceso
Rama: 005-turnstile-bot-protection · Estado: Implementada · Fecha: 2026-11-15

Depende de TaskApiSDD:
- `../TaskApiSDD/sdd/002-user-accounts/spec.md` (cuentas y sesión, «API-002 RF-xx»).
- `../TaskApiSDD/sdd/005-turnstile-bot-protection/spec.md` (verificación del token en el servidor, «API-005 RF-xx»), en estado *Aprobada* e implementada.

Los requisitos de esta aplicación se citan como «001 RF-xx» (MVP) y «004 RF-xx» (seguridad del front). **Modifica 004 RF-12** (política de contenido).

## Contexto y objetivo

El inicio de sesión y el registro están abiertos a cualquiera. La API ya bloquea un email tras 5 intentos fallidos (API-002 RF-09), pero eso no frena a un bot que:

- prueba contraseñas filtradas repartidas entre muchos emails (*credential stuffing*), sin llegar nunca a 5 fallos por email;
- crea cuentas en masa con emails inventados;
- bloquea a propósito la cuenta de otra persona provocando 5 fallos con su email.

Cloudflare Turnstile distingue personas de bots sin pedir que se resuelvan imágenes. El widget ya está creado en Cloudflare, con la *site key* pública `0x4AAAAAAGCKQh7WSaKl9bC0`. El funcionamiento es este:

1. La aplicación muestra el widget en el formulario y Turnstile entrega un **token** de un solo uso cuando considera que el usuario es una persona.
2. La aplicación envía el token con la petición del formulario.
3. **La API** comprueba el token con Cloudflare usando la clave secreta y rechaza la petición si no es válido (API-005).

La clave secreta solo existe en la API y nunca en esta aplicación (CONSTITUTION V: sin secretos en `VITE_*`).

## Historias de usuario (con prioridad y prueba independiente)

001 RF-01 a RF-08 (acceso y sesión) y 004 RF-01 a RF-08 son transversales y aplican a todas las historias.

### HU-01 — Iniciar sesión demostrando que soy una persona (P1)
Como usuario, quiero que la comprobación anti-bots del inicio de sesión sea casi invisible, para entrar igual de rápido que ahora mientras los bots quedan fuera.
- **Por qué P1:** el inicio de sesión es el objetivo del *credential stuffing* y del bloqueo malintencionado de cuentas.
- **Prueba independiente:** con la *site key* de prueba que siempre supera la comprobación, iniciar sesión y entrar en el tablero; con la que siempre falla, comprobar que no se puede enviar y que se muestra el error.
- **Escenarios:**
  - Dada la pantalla de inicio de sesión, cuando Turnstile supera la comprobación, entonces el usuario puede iniciar sesión como hasta ahora.
  - Dada la comprobación todavía en curso, cuando el usuario pulsa «Iniciar sesión», entonces el formulario no se envía y le indica que complete la comprobación.
  - Dado un inicio de sesión que termina con cualquier respuesta o sin respuesta, cuando el usuario lo vuelve a intentar, entonces la aplicación usa un token nuevo, porque cada token solo vale para un intento.
  - Dado que la API rechaza el token, cuando se muestra el error, entonces lo escrito se conserva y el widget pide un token nuevo.
- **RF:** RF-01 a RF-08, RF-13, RF-14.

### HU-02 — Registrarme demostrando que soy una persona (P1)
Como responsable del proyecto, quiero que el registro exija la comprobación, para que nadie cree cuentas en masa.
- **Por qué P1:** sin ella, un bot puede llenar la base de datos de cuentas falsas.
- **Prueba independiente:** igual que HU-01 en la pantalla de registro.
- **RF:** RF-01 a RF-08, RF-13, RF-14.

### HU-03 — Usar la aplicación con la política de contenido activada (P1)
Como usuario, quiero que el widget funcione sin que la aplicación pierda las protecciones de la 004.
- **Por qué P1:** sin cambiar la política de contenido, el navegador bloquea el widget y nadie puede entrar.
- **Prueba independiente:** recorrer inicio de sesión y registro en la imagen de producción (`pre`) sin ninguna infracción de la política en la consola.
- **RF:** RF-09, RF-10.

## Requisitos funcionales (EARS, con ID RF-xx)

### Widget
- **RF-01** — El sistema deberá mostrar el widget de Turnstile, con la *site key* de la configuración, en los formularios de inicio de sesión y de registro.
- **RF-02** — El sistema deberá asociar a cada widget una acción fija que identifique el formulario: `login` en el inicio de sesión y `register` en el registro, que la API compara con la que devuelve Cloudflare (API-005 RF-06).
- **RF-03** — Mientras Turnstile no haya entregado un token válido, el sistema no deberá enviar el formulario. Si el usuario intenta enviarlo, deberá mostrar bajo el widget el mensaje «Completa la comprobación de seguridad» y mantener lo escrito.
- **RF-04** — Cuando el token caduca antes del envío (Turnstile los invalida a los 300 segundos), el sistema deberá descartarlo y pedir uno nuevo sin que el usuario pierda lo escrito.
- **RF-05** — Cuando termina un envío del formulario, con cualquier respuesta de la API (de éxito o de error) o sin respuesta por un fallo de red, el sistema deberá descartar el token usado y reiniciar el widget antes de permitir otro envío, porque cada token sirve para un solo intento (API-005 RF-21, RF-32).
- **RF-06** — Si Turnstile no se puede cargar o informa de un error (sin conexión, script bloqueado), entonces el sistema deberá mostrar bajo el widget «No se ha podido cargar la comprobación de seguridad. Recarga la página para intentarlo de nuevo.» y no permitir el envío.

### Envío a la API
- **RF-07** — Cuando el usuario envía el formulario con un token válido, el sistema deberá incluirlo en el cuerpo de `POST /auth/login` o `POST /auth/register` en el campo `turnstileToken`, junto con los campos de la 002 (API-005 RF-01).
- **RF-08** — Cuando la API rechaza la petición con `TURNSTILE_FAILED` (`403`), el sistema deberá mostrar «No hemos podido comprobar que eres una persona. Inténtalo de nuevo.», conservar lo escrito y reiniciar el widget (RF-05).
- **RF-13** — Cuando la API rechaza la petición con `TURNSTILE_UNAVAILABLE` (`503`), el sistema deberá mostrar «El servicio de verificación no responde. Inténtalo de nuevo en unos minutos.», conservar lo escrito y reiniciar el widget (RF-05).
- **RF-14** — Si la API responde `VALIDATION_ERROR` señalando el campo `turnstileToken`, entonces el sistema deberá mostrar el mensaje de RF-08 y reiniciar el widget, sin marcar como erróneo ningún campo del formulario.
- **RF-15** — El sistema deberá mantener sin cambios el tratamiento del resto de respuestas del inicio de sesión y del registro (`INVALID_CREDENTIALS`, `TOO_MANY_ATTEMPTS`, `EMAIL_ALREADY_REGISTERED`, `VALIDATION_ERROR` de los demás campos y éxito), salvo el reinicio del widget de RF-05.

### Política de contenido (modifica 004 RF-12)
- **RF-09** — El sistema deberá servir en producción y preproducción una política de contenido que, además de lo que exige 004 RF-12, permita cargar el script de Turnstile y su marco (iframe) solo desde `https://challenges.cloudflare.com`. Se mantienen la prohibición de que otro sitio cargue la aplicación en un marco, la de plugins y la de Trusted Types.
- **RF-10** — El sistema deberá funcionar con la política de RF-09 sin ninguna infracción en la consola de Chrome ni de Firefox en las pantallas con widget (mantiene 004 RNF-01).

### Configuración
- **RF-11** — El sistema deberá leer la *site key* de la configuración pública del build y fallar al arrancar con un mensaje claro si falta, igual que con la URL de la API.
- **RF-12** — En desarrollo y en las E2E, el sistema deberá usar las *site keys* de prueba de Cloudflare (la que siempre supera la comprobación y la que siempre falla), nunca la de producción.

## Requisitos no funcionales (RNF-xx, sin tecnología)

- Se heredan sin cambios 001 RNF-01 a RNF-06 y 004 RNF-01 a RNF-03.
- **RNF-01** — El widget cumple los mínimos de accesibilidad de CONSTITUTION VII.4: se puede completar solo con teclado, y sus mensajes de error se anuncian a los lectores de pantalla.
- **RNF-02** — El widget cabe en las tres pantallas de VII.5 sin desplazamiento horizontal (el widget normal mide 300px de ancho, menos que los 360px del móvil) y respeta el tema claro u oscuro de la aplicación.
- **RNF-03** — Con una comprobación que se supera sin interacción, el usuario no espera más de 2 segundos de más respecto al inicio de sesión actual. La API puede tardar hasta 5 segundos más si Cloudflare va lento (API-005 RNF-03); mientras, el botón muestra el estado de envío de siempre.
- **RNF-04** — Ni la aplicación ni sus registros guardan ni muestran el token más allá del envío.

## Casos límite

- **Usuario que escribe rápido:** pulsa «Iniciar sesión» antes de que Turnstile termine → RF-03; cuando llega el token puede enviarlo.
- **Formulario abierto mucho tiempo:** el token caduca → RF-04, sin perder lo escrito. Si aun así llega caducado a la API → `TURNSTILE_FAILED` → RF-08.
- **Doble clic en «Iniciar sesión»:** el segundo clic no envía nada mientras el primero está en curso, como hoy; si llegara a la API con el mismo token, respondería `TURNSTILE_FAILED` (API-005 RF-21).
- **Credenciales incorrectas varias veces:** cada reintento usa un token nuevo (RF-05); el bloqueo de API-002 RF-09 sigue funcionando igual.
- **Registro con éxito:** la aplicación lleva al inicio de sesión como hoy (API-002 RF-06), que muestra su propio widget con la acción `login`.
- **Respuesta perdida por un fallo de red:** RF-05; el reintento con un token nuevo puede responder `EMAIL_ALREADY_REGISTERED` en el registro, que se trata como hoy.
- **Sesión caducada (001 RF-07):** al volver al inicio de sesión con el mensaje de caducada se muestra un widget nuevo; la vuelta a la pantalla anterior (004 RF-08) no cambia.
- **Cambio entre inicio de sesión y registro:** cada pantalla tiene su widget y su acción; el token de una no vale en la otra.
- **Cloudflare caído:** la API responde `TURNSTILE_UNAVAILABLE` → RF-13. Las pantallas con sesión abierta siguen funcionando.
- **Bloqueador de anuncios o script bloqueado:** RF-06.
- **Usuario sin JavaScript:** la aplicación ya lo necesita para todo; no cambia nada.
- **Cloudflare pide interacción** (widget *managed*): el usuario marca la casilla con ratón, toque o teclado (RNF-01); hasta entonces se aplica RF-03.

## Fuera de alcance

- **La validación del token en el servidor:** está en API-005. Esta aplicación nunca llama a Cloudflare para validar ni conoce la clave secreta.
- **Crear o configurar el widget en Cloudflare:** ya está creado. Los dominios permitidos se gestionan en el panel de Cloudflare y en `TURNSTILE_ALLOWED_HOSTNAMES` de la API.
- **Proteger otras rutas** (cambio de contraseña, borrado de la cuenta, tareas, pomodoros): exigen sesión, y la sesión ya pasa por un inicio de sesión protegido. API-005 solo protege el inicio de sesión y el registro.
- **Migrar otro CAPTCHA:** no existe ninguno.
- **Límites por IP de la API:** siguen fuera, como en la 004.

## Criterios de éxito (CE-xx)

- **CE-01** — Con la *site key* de prueba que siempre falla, el 100 % de los intentos de inicio de sesión y registro no llegan a enviarse.
- **CE-02** — Con la *site key* de prueba que siempre pasa, las E2E de inicio de sesión y registro pasan en los 6 proyectos de Playwright contra la API en modo obligatorio.
- **CE-03** — El 100 % de los envíos llevan un token distinto: 0 respuestas `TURNSTILE_FAILED` por reutilizar un token en los flujos normales (reintento tras credenciales incorrectas, tras un error y tras un fallo de red).
- **CE-04** — 0 infracciones de la política de contenido en la consola en las pantallas con widget, en `pre`.

## Supuestos

- **S-01** — La *site key* `0x4AAAAAAGCKQh7WSaKl9bC0` es pública y puede ir en el bundle. La clave secreta la guarda el usuario en la configuración de TaskApiSDD, nunca en este repositorio ni en el chat.
- **S-02** — El widget de Cloudflare admite los dominios de producción y `localhost` para desarrollo.
- **S-03** — *Site keys* de prueba de Cloudflare (API-005 S-02): `1x00000000000000000000AA` (siempre pasa) y `2x00000000000000000000AB` (siempre falla). Generan el token ficticio `XXXX.DUMMY.TOKEN.XXXX`, que la API acepta con su clave secreta de prueba sin comprobar la acción ni el un-solo-uso (API-005 RF-06b, RF-33).
- **S-04** — El script de Turnstile funciona con Trusted Types activado. Si no es así, el plan propondrá la política mínima necesaria antes de relajar 004 RF-12.
- **S-05** — Orden de despliegue (API-005 S-06): API en modo opcional → esta aplicación con el widget → API en modo obligatorio. Esta aplicación funciona con la API en cualquiera de los dos modos, porque siempre envía el token. En local, la API tiene que estar en modo opcional mientras esta funcionalidad no esté implementada, o el front actual no puede iniciar sesión.

## Preguntas abiertas

_(Sin preguntas abiertas.)_

## Clarificaciones

- **2026-11-15** — ¿Qué formularios llevan el widget? (P-01) → Inicio de sesión y registro, los mismos que protege API-005. El cambio de contraseña y el borrado de la cuenta quedan fuera porque exigen sesión.
- **2026-11-15** — ¿Cómo valida TaskApiSDD el token? (P-02) → Según API-005, aprobada e implementada: campo `turnstileToken` (1–2048 caracteres) en el cuerpo de `POST /auth/login` y `POST /auth/register`; acciones `login` y `register`; `TURNSTILE_FAILED` (`403`) si el token no es válido, ya se usó, caducó o no coincide la acción o el host; `TURNSTILE_UNAVAILABLE` (`503`) si Cloudflare no responde; `VALIDATION_ERROR` si el token está mal formado o falta en modo obligatorio; y un token nuevo tras cualquier respuesta o fallo de red. Se concretan RF-02, RF-05, RF-07 y RF-08, y se añaden RF-13 a RF-15.
- **2026-11-15** — ¿En qué modo está el widget? (P-03) → *Managed*, según el usuario: el widget siempre está visible y casi siempre se supera solo; a veces Cloudflare pide marcar una casilla. Ocupa su sitio en el formulario, entre los campos y el botón de enviar, en las tres pantallas (RF-01, RNF-02), y la casilla se puede marcar con ratón, toque o teclado (RNF-01).

## Registro de cambios

- **2026-11-15** — Creación del borrador a petición del usuario, con el widget de Turnstile ya creado en Cloudflare (*site key* `0x4AAAAAAGCKQh7WSaKl9bC0`). Quedan 3 preguntas abiertas (P-01 a P-03) y 3 `[NEEDS CLARIFICATION]` (RF-01, RF-07, RF-08). Modifica 004 RF-12. Estado → *Borrador*.
- **2026-11-15** — A petición del usuario, tras revisar API-005 en TaskApiSDD: P-01 y P-02 resueltas. RF-01, RF-07 y RF-08 sin marcas; RF-02 cita API-005 RF-06; RF-04 pasa a 300 segundos; RF-05 reinicia el widget tras cualquier respuesta o fallo de red; se añaden RF-13 (`TURNSTILE_UNAVAILABLE`), RF-14 (`VALIDATION_ERROR` del token) y RF-15 (resto de respuestas sin cambios). Actualizados HU-01, HU-02, RNF-03, casos límite, *Fuera de alcance*, CE-01 a CE-03, S-03 y S-05 (nuevo). Queda P-03. Estado → *Borrador*.
- **2026-11-15** — P-03 resuelta por el usuario: widget en modo *managed*. Actualizados *Clarificaciones* y un caso límite; sin cambios en los RF. Sin preguntas abiertas; pendiente de la aprobación del usuario. Estado → *Borrador*.
- **2026-11-15** — Spec aprobada por el usuario, con el widget *managed* en el inicio de sesión y el registro (RF-01 a RF-15). Estado → *Aprobada*.
- **2026-11-15** — Funcionalidad implementada: las 15 tareas de `tasks.md` hechas y cada RF-01 a RF-15 con al menos un test que lo cita en su nombre (Jest, Playwright o la suite `security`). Jest (1134 tests, 99,4 % de líneas), E2E en los 6 proyectos, `test:security` con el widget cargado bajo la CSP real sin infracciones (S-04 confirmado) y quality gate de SonarQube en verde. Sin cambios en los requisitos. Estado → *Implementada*.
