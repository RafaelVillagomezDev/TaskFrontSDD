# Feature: Front security hardening — datos de sesión, pestañas, redirecciones y cabeceras
Rama: 004-front-security-hardening · Estado: Implementada · Fecha: 2026-11-09

Depende de TaskApiSDD: `../TaskApiSDD/sdd/002-user-accounts/spec.md` (cuentas y sesión, «API-002 RF-xx»). Los requisitos del MVP de esta aplicación (`sdd/001-taskFrontSDD-mvp/spec.md`) se citan como «001 RF-xx».

No necesita cambios en la API.

## Contexto y objetivo

La aplicación ya protege la sesión en lo básico: la sesión vive en cookies que la aplicación no puede leer (001 RNF-06), nada se guarda en el navegador, cerrar sesión borra los datos de la memoria y producción sirve una política de contenido (CSP) estricta.

Una revisión del código ha encontrado cuatro huecos:

1. Cuando la sesión caduca y no se puede renovar (001 RF-07), los datos de la cuenta siguen en la memoria de la pestaña. Si otra persona inicia sesión en esa pestaña, puede ver por un momento las tareas o los pomodoros de la cuenta anterior.
2. Cerrar sesión en una pestaña no afecta a las demás: siguen mostrando los datos hasta su siguiente petición a la API.
3. La pantalla a la que volver tras iniciar sesión acepta una ruta como `/\ejemplo.com`, que el navegador interpreta como otro dominio.
4. A las cabeceras de producción les faltan protecciones habituales del navegador, y ningún test comprueba que se envían.

Esta funcionalidad cierra esos cuatro huecos sin pantallas nuevas.

## Historias de usuario (con prioridad y prueba independiente)

001 RF-01 a RF-08 (acceso y sesión) son transversales y aplican a todas las historias.

### HU-01 — Que nadie vea mis datos cuando caduca mi sesión (P1)
Como usuario de un ordenador compartido, quiero que mis datos desaparezcan de la pantalla cuando mi sesión caduca, para que la siguiente persona no los vea.
- **Por qué P1:** es una fuga de datos entre cuentas.
- **Prueba independiente:** con la cuenta A en el tablero, invalidar su sesión, iniciar sesión con la cuenta B en la misma pestaña y comprobar que nunca aparece ninguna tarea de A.
- **Escenarios:**
  - Dada una sesión que no se puede renovar, cuando la aplicación lo detecta, entonces borra los datos de la cuenta antes de mostrar la pantalla de inicio de sesión.
  - Dados los datos borrados, cuando otra cuenta inicia sesión en esa pestaña, entonces solo ve sus propios datos.
- **RF:** RF-01 a RF-03.

### HU-02 — Cerrar sesión en todas mis pestañas a la vez (P1)
Como usuario con la aplicación abierta en varias pestañas, quiero que cerrar sesión en una cierre todas, para no dejar datos a la vista en las otras.
- **Por qué P1:** la sesión ya está cerrada en la API, pero las otras pestañas siguen enseñando los datos.
- **Prueba independiente:** con dos pestañas abiertas en el tablero, cerrar sesión en una y comprobar que la otra pasa sola a la pantalla de inicio de sesión, sin datos.
- **Escenarios:**
  - Dadas dos pestañas con la sesión abierta, cuando el usuario cierra sesión o borra su cuenta en una, entonces la otra cierra la sesión sin intervención.
  - Dadas dos pestañas, cuando la sesión caduca en una, entonces la otra también muestra el inicio de sesión con el mensaje de sesión caducada.
- **RF:** RF-04 a RF-07.

### HU-03 — Volver solo a pantallas de la aplicación tras iniciar sesión (P1)
Como usuario, quiero que el enlace de vuelta tras iniciar sesión solo me lleve a pantallas de la aplicación, para que nadie pueda usarlo para mandarme a otro sitio.
- **Por qué P1:** una redirección abierta permite suplantar la aplicación con un enlace de aspecto legítimo.
- **Prueba independiente:** abrir la pantalla de inicio de sesión con cada valor de vuelta de los casos límite, iniciar sesión y comprobar que termina en el tablero.
- **RF:** RF-08.

### HU-04 — Usar la aplicación con las protecciones del navegador activadas (P2)
Como usuario, quiero que el navegador limite lo que la aplicación y otros sitios pueden hacer con ella, para reducir el daño de un fallo de seguridad.
- **Por qué P2:** son defensas adicionales; hoy no hay un ataque concreto que las necesite.
- **Prueba independiente:** pedir la aplicación de producción y comprobar cada cabecera; recorrer las pantallas sin ninguna infracción de la política en la consola.
- **RF:** RF-09 a RF-15.

## Requisitos funcionales (EARS, con ID RF-xx)

### Datos de la cuenta en memoria
- **RF-01** — Cuando la sesión no se puede renovar (001 RF-07), el sistema deberá borrar de la memoria todos los datos de la cuenta (tareas, racha, avisos, pomodoro y perfil) antes de mostrar la pantalla de inicio de sesión.
- **RF-02** — Cuando se inicia sesión, el sistema deberá mostrar solo datos pedidos a la API después de ese inicio de sesión, nunca datos de una sesión anterior en la misma pestaña.
- **RF-03** — Tras el borrado de RF-01, el sistema deberá mantener el comportamiento de 001 RF-07: el mensaje de sesión caducada y, tras iniciar sesión, la vuelta a la pantalla en la que estaba.

### Varias pestañas
- **RF-04** — Cuando el usuario cierra sesión o borra su cuenta en una pestaña, el sistema deberá cerrar la sesión en las demás pestañas de la aplicación abiertas en ese navegador: borrar sus datos (RF-01) y llevarlas a la pantalla de inicio de sesión sin mensaje de caducada y sin pantalla a la que volver, como tras cerrar sesión.
- **RF-05** — Cuando la sesión no se puede renovar en una pestaña, el sistema deberá llevar también a las demás pestañas a la pantalla de inicio de sesión, con el mensaje de sesión caducada y cada una con su propia pantalla a la que volver (001 RF-07).
- **RF-06** — El sistema no deberá enviar entre pestañas ni guardar en el navegador ningún dato de la cuenta ni de la sesión (001 RNF-06): el aviso solo dice que la sesión ha terminado y por qué (cierre o caducidad).
- **RF-07** — Si el navegador no permite avisar a las demás pestañas, entonces el sistema deberá seguir funcionando como hasta ahora: cada pestaña detecta el fin de la sesión en su siguiente petición a la API (001 RF-07).

### Pantalla a la que volver
- **RF-08** — El sistema deberá aceptar como pantalla a la que volver tras iniciar sesión (001 RF-07) solo una ruta de la propia aplicación. Cualquier otro valor lleva al tablero: una dirección de otro dominio, una ruta que el navegador interpretaría como otro dominio (`//ejemplo.com`, `/\ejemplo.com`), un esquema (`javascript:`, `data:`), caracteres de control o un valor que no empieza por `/`.

### Cabeceras de producción
- **RF-09** — El sistema deberá servir cada respuesta de producción desactivando las capacidades del navegador que la aplicación no usa: cámara, micrófono, ubicación, pagos, USB, Bluetooth, sensores y pantalla compartida, entre otras.
- **RF-10** — El sistema deberá servir cada respuesta de producción aislando la ventana de la aplicación de las ventanas que abra o que la abran desde otro sitio.
- **RF-11** — El sistema deberá servir cada respuesta de producción indicando que solo la propia aplicación puede cargar sus recursos.
- **RF-12** — El sistema deberá servir en producción una política de contenido que: permita conectarse solo con la propia aplicación y con la API (`https://apikompitu.yandrydev.cloud`); permita las hojas de estilo y las fuentes de Google Fonts, además de las propias; impida que la aplicación cargue marcos (iframes) y que otro sitio la cargue en uno; prohíba los objetos incrustados (plugins); y exija que el HTML que escriban los scripts pase por una política de tipos de confianza (Trusted Types).
- **RF-13** — El sistema no deberá revelar en las respuestas de producción la versión del servidor web.
- **RF-14** — El sistema deberá indicar en cada respuesta HTTPS de producción que el navegador use solo HTTPS durante dos años, también en los subdominios de `kompitu.yandrydev.cloud` (HSTS), sin pedir la inclusión en la lista precargada de los navegadores.
- **RF-15** — El sistema deberá mantener en todas las respuestas de producción, incluidos `index.html` y los recursos estáticos, las cabeceras que ya envía: política de contenido, `nosniff`, `Referrer-Policy` y prohibición de mostrarse dentro de un marco.
- **RF-16** — Cuando una petición llega a producción por HTTP para `kompitu.yandrydev.cloud`, el sistema deberá redirigirla de forma permanente a la misma ruta, con su búsqueda, por HTTPS, sin servir contenido por HTTP, aunque el proxy de despliegue no tenga activada su propia redirección.
- **RF-17** — Si una petición llega a producción para un dominio distinto de `kompitu.yandrydev.cloud`, entonces el sistema deberá descartarla sin responder.
- **RF-18** — El sistema deberá servir preproducción con la misma aplicación y las mismas cabeceras de RF-09 a RF-13 y RF-15 que producción, por HTTP y sin HSTS, para probar la imagen tal como se despliega.

### Proxy inverso de la aplicación (tráfico por IP)
- **RF-19** — El sistema deberá identificar a cada cliente por su IP real, la que indica el proxy de despliegue, y no por la del proxy, para aplicar los límites y el registro.
- **RF-20** — Si una misma IP hace más de 20 peticiones por segundo, con ráfagas de hasta 60, entonces el sistema deberá rechazar las que sobren con «demasiadas peticiones» (`429`) sin afectar a otras IPs.
- **RF-21** — Si una misma IP abre más de 30 conexiones simultáneas, entonces el sistema deberá rechazar las que sobren con «demasiadas peticiones» (`429`).
- **RF-22** — Si una petición usa un método distinto de `GET` o `HEAD`, entonces el sistema deberá rechazarla con «método no permitido» (`405`): la aplicación es estática y no recibe datos.
- **RF-23** — Si una petición pide un fichero oculto (`/.env`, `/.git/…`), un script de servidor (`.php` y similares), un mapa de código (`.map`), una copia de seguridad o un fichero de configuración o de registro, entonces el sistema deberá responder «no encontrado» (`404`) sin servir la aplicación.
- **RF-24** — El sistema deberá rechazar los cuerpos de petición y las cabeceras de tamaño excesivo y cortar las conexiones que tarden más de 10 segundos en enviar la petición o en recibir la respuesta, o que estén inactivas más de 15.
- **RF-25** — El sistema deberá registrar cada petición con la IP real del cliente, la ruta, el resultado y el navegador, para poder analizar el tráfico y los abusos.

## Requisitos no funcionales (RNF-xx, sin tecnología)

- Se heredan sin cambios 001 RNF-01 a RNF-06.
- **RNF-01** — Las protecciones de RF-09 a RF-18 no rompen ninguna pantalla en Chrome ni en Firefox: recorrer la aplicación de producción no produce ninguna infracción de la política en la consola.
- **RNF-02** — Fuera de lo descrito en RF-04 y RF-05, el usuario no nota ningún cambio: no hay pantallas, textos ni pasos nuevos.
- **RNF-03** — Una pestaña se entera del cierre de sesión en otra en menos de 1 segundo.

## Casos límite

- **Formulario a medio escribir en otra pestaña:** al cerrar sesión en una pestaña, lo escrito en las demás se pierde, igual que al cerrar sesión en la propia (RF-04).
- **Pomodoro en curso en otra pestaña:** la sesión pomodoro sigue en la API; al volver a entrar se muestra con su cuenta atrás (003 RF-03).
- **Dos pestañas caducan a la vez:** cada una muestra el inicio de sesión una sola vez, sin bucles de avisos entre ellas (RF-05).
- **Pestaña abierta después del cierre:** va al inicio de sesión porque no hay sesión (001 RF-08); no necesita el aviso.
- **Pestaña ya en la pantalla de inicio de sesión:** el aviso de otra pestaña no cambia nada en ella.
- **Valores de vuelta que llevan al tablero (RF-08):** `https://ejemplo.com`, `//ejemplo.com`, `/\ejemplo.com`, `/%5Cejemplo.com`, `javascript:alert(1)`, `tablero`, un valor vacío y uno con un salto de línea.
- **Valores de vuelta válidos:** `/history?status=completed&page=2`, `/pomodoro/history/{id}` y `/taskday` vuelven a su pantalla, con su búsqueda.
- **Navegador que no aplica una cabecera:** la aplicación funciona igual; las cabeceras son protecciones adicionales (RNF-01).

## Fuera de alcance

- **Cierre de sesión por inactividad:** cambia la experiencia (por ejemplo, durante un pomodoro largo) y necesita sus propias decisiones. Puede ir en una spec posterior.
- **Auditoría de dependencias en el pre-push o en CI.**
- **Entrar automáticamente en las demás pestañas al iniciar sesión en una:** esta spec solo propaga el fin de la sesión.
- **Cambios en la API:** cookies, CORS, tiempos de sesión o cabeceras de TaskApiSDD.
- **Protección por IP de la API:** la API está en otro dominio (`apikompitu.yandrydev.cloud`) y no pasa por este proxy. Sus límites por IP van en TaskApiSDD, que ya bloquea una cuenta tras varios inicios de sesión fallidos (API-002 RF-09).
- **Servir la API bajo el mismo dominio (`/api`):** cambiaría la política de contenido, CORS y las cookies de sesión, y necesita una spec en TaskApiSDD.
- **Bloqueo por navegador (user agent):** se falsifica sin esfuerzo y daría una falsa sensación de protección.
- **Aislamiento de recursos de otros orígenes (COEP):** obligaría a cambiar cómo responde la API y no aporta nada a una aplicación que no usa funciones que lo exijan.

## Criterios de éxito (CE-xx)

- **CE-01** — 0 datos de una cuenta visibles después de que su sesión caduque y otra cuenta inicie sesión en la misma pestaña.
- **CE-02** — Cerrar sesión en una pestaña lleva a las demás al inicio de sesión en menos de 1 segundo, sin acción del usuario, en Chrome y Firefox.
- **CE-03** — El 100 % de los valores de vuelta de los casos límite que deben ir al tablero van al tablero, y el 100 % de los válidos vuelven a su pantalla.
- **CE-05** — Una ráfaga de 150 peticiones desde una IP recibe `429` en las que superan el límite, mientras otra IP sigue entrando con normalidad.
- **CE-04** — Cada cabecera de RF-09 a RF-18 se comprueba automáticamente sobre la aplicación tal como se despliega, y recorrer sus pantallas produce 0 infracciones de la política en la consola.

## Supuestos

- **S-01** — Las cookies de sesión son las mismas para todas las pestañas de un navegador (API-002), así que cerrar sesión en una deja a las demás sin sesión en la API.
- **S-02** — Producción se despliega con Dokploy: su proxy (Traefik) sirve HTTPS en `kompitu.yandrydev.cloud`, obtiene y renueva el certificado automáticamente e indica a la aplicación por qué protocolo llegó cada petición, sustituyendo lo que mande el cliente. La aplicación solo es accesible a través de ese proxy (P-01).
- **S-03** — Chrome y Firefox actuales permiten avisar entre pestañas del mismo sitio sin guardar nada en el navegador.

## Preguntas abiertas

_(Sin preguntas abiertas.)_

## Clarificaciones

- **2026-11-09** — ¿Quién sirve HTTPS y envía HSTS? (P-01) → El usuario pide dos configuraciones del servidor web: preproducción y producción. Producción sirve siempre HTTPS en `kompitu.yandrydev.cloud`, con las políticas de seguridad y los permisos del navegador que la aplicación no usa bloqueados. El certificado lo gestiona Dokploy automáticamente: su proxy termina HTTPS y la aplicación, detrás, envía HSTS (dos años, con subdominios y sin precarga, que es difícil de deshacer), redirige a HTTPS lo que llegue por HTTP aunque el proxy no lo haga y descarta otros dominios (RF-14, RF-16, RF-17). Preproducción sirve las mismas políticas por HTTP (RF-18). Se descarta que el contenedor termine HTTPS con su propio certificado: duplicaría lo que ya hace Dokploy y chocaría con su proxy en los puertos 80 y 443.
- **2026-11-09** — ¿Dónde va el proxy inverso de Nginx para seguridad y tráfico? (P-02, primera parte) → Dentro del contenedor de la aplicación: el mismo Nginx de producción hace de proxy, como único servicio detrás del proxy de Dokploy. Se descarta un servicio aparte entre ese proxy y la aplicación, porque añade un contenedor que mantener y obliga a reenviar el protocolo de origen. Sus funciones siguen abiertas en P-02.
- **2026-11-09** — ¿Qué hace el proxy inverso? (P-02, segunda parte) → El usuario pide límite por IP y deja el resto a la propuesta del agente. Se aceptan: IP real del cliente (RF-19), límites de peticiones y conexiones por IP (RF-20, RF-21), solo `GET` y `HEAD` (RF-22), rutas de escáneres (RF-23), tamaños y tiempos (RF-24) y registro con la IP real (RF-25). Se deja fuera servir la API en el mismo dominio y el bloqueo por navegador (ver *Fuera de alcance*).

## Registro de cambios

- **2026-11-09** — Creación del borrador con el alcance elegido por el usuario: sesión y datos (huecos 1 a 3) y cabeceras de producción (hueco 4). Se dejan fuera el cierre por inactividad y la auditoría de dependencias. Queda 1 `[NEEDS CLARIFICATION]` (P-01, RF-14). Estado → *Borrador*.
- **2026-11-09** — Clarificación P-01, a petición del usuario: producción en Dokploy, que gestiona el certificado y HTTPS; la aplicación envía HSTS, redirige a HTTPS y descarta otros dominios. Se concretan RF-14 y S-02, se añaden RF-16 a RF-18 y se amplía CE-04. Sin preguntas abiertas; pendiente de la aprobación del usuario. Estado → *Borrador*.
- **2026-11-09** — El usuario anuncia un proxy inverso de Nginx para seguridad y control del tráfico. Se abre P-02 sobre su ubicación y sus funciones, que pueden afectar a RF-12, RF-16, RF-17, S-02 y a la API. Estado → *Borrador*.
- **2026-11-09** — Primera parte de P-02 resuelta por el usuario: el proxy va dentro del contenedor de la aplicación. Sus funciones quedan abiertas en P-02, que el usuario contestará más adelante. Estado → *Borrador*.
- **2026-11-09** — P-02 resuelta: el usuario pide límite por IP y acepta las consideraciones del agente. Se añaden RF-19 a RF-25 y CE-05, y se amplía *Fuera de alcance* (protección de la API, `/api` en el mismo dominio y bloqueo por navegador). Sin preguntas abiertas; pendiente de la aprobación del usuario. Estado → *Borrador*.
- **2026-11-09** — Spec aprobada por el usuario, con el alcance de sesión y datos (RF-01 a RF-08), cabeceras de producción (RF-09 a RF-18) y proxy inverso con límites por IP (RF-19 a RF-25). Estado → *Aprobada*.
- **2026-11-09** — Cambio pedido por el usuario en RF-12: la política de contenido permite el dominio de la API de forma explícita, las hojas de estilo y las fuentes de Google Fonts (`fonts.googleapis.com` y `fonts.gstatic.com`) y bloquea los iframes en los dos sentidos (la aplicación no carga marcos ni se deja cargar en uno). Estado → *Aprobada*.
- **2026-11-09** — Funcionalidad implementada: las 18 tareas de `tasks.md` hechas y cada RF-01 a RF-25 con al menos un test que lo cita en su nombre (Jest, Playwright o la suite `security`). E2E en los 6 proyectos, `test:security` y quality gate de SonarQube en verde. Sin cambios en los requisitos. Estado → *Implementada*.
