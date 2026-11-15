# Feature: Pomodoro task session — sesiones de concentración con una lista de tareas
Rama: 003-pomodoro-task-session · Estado: Implementada · Fecha: 2026-11-09

Depende de TaskApiSDD: `../TaskApiSDD/sdd/004-pomodoro-sessions/spec.md` (sesiones, tareas, racha y logros del pomodoro) y su colección `pomodoro-sessions.postman-collection.json`. Las reglas de negocio de la API se citan como «API-004 RF-xx» y los requisitos del MVP de esta aplicación (`sdd/001-taskFrontSDD-mvp/spec.md`) como «001 RF-xx».

No necesita cambios en la API: las 11 rutas del pomodoro ya existen (API-004, *Resumen de endpoints*).

## Contexto y objetivo

El tablero sirve para planificar tareas por día, pero no ayuda a trabajar concentrado en un bloque de tiempo. La API ya ofrece **sesiones pomodoro**: un temporizador de 1 a 120 minutos (25 por defecto) con una lista de hasta 20 tareas propias del pomodoro, independientes de las tareas del tablero, con su propia racha y sus propios logros (API-004 RF-02).

Esta funcionalidad añade a la aplicación una sección para empezar una sesión, ver la cuenta atrás, completar sus tareas, pausarla, reanudarla o terminarla, recuperar las tareas que quedaron sin hacer y consultar las sesiones pasadas, la racha y los logros del pomodoro.

La API decide cuándo termina una sesión con el reloj del servidor (API-004 RF-15, RNF-02); la aplicación solo muestra la cuenta atrás (API-004 S-01).

## Endpoints usados

| Método | Ruta | Uso en esta funcionalidad | RF |
| :--- | :--- | :--- | :--- |
| POST | `/pomodoros` | Empezar una sesión | RF-14 |
| GET | `/pomodoros` | Localizar la sesión activa e historial | RF-03, RF-38 |
| GET | `/pomodoros/{id}` | Volver a consultar la sesión al llegar a cero y ver una sesión pasada | RF-17, RF-40 |
| PATCH | `/pomodoros/{id}` | Pausar, reanudar y terminar | RF-23 a RF-26 |
| POST | `/pomodoros/{id}/tasks` | Añadir tareas a la sesión activa | RF-29 |
| DELETE | `/pomodoros/{id}/tasks/{taskId}` | Quitar una tarea pendiente de la sesión activa | RF-30 |
| GET | `/pomodoro-tasks` | Tareas en espera | RF-32 |
| PATCH | `/pomodoro-tasks/{id}` | Completar, desmarcar y editar tareas | RF-22, RF-35 |
| DELETE | `/pomodoro-tasks/{id}` | Borrar una tarea en espera | RF-33 |
| GET | `/pomodoro-streak` | Racha del pomodoro | RF-41 |
| GET | `/pomodoro-achievements` | Logros del pomodoro | RF-42 |

## Historias de usuario (con prioridad y prueba independiente)

001 RF-01 a RF-08 (acceso y sesión), 001 RF-40 a RF-46 (errores, estados comunes y campos escribibles) y 001 RF-50 y RF-54 (navegación) son transversales y aplican a todas las historias, igual que RF-01, RF-02, RF-46 a RF-50 y RF-51 de esta spec.

### HU-01 — Empezar una sesión con una lista de tareas (P1)
Como usuario, quiero elegir la duración y escribir las tareas que intentaré hacer, para empezar un bloque de trabajo concentrado.
- **Por qué P1:** es el núcleo de la funcionalidad.
- **Prueba independiente:** sin sesión activa, empezar una sesión de 25 minutos con dos tareas para hoy y ver la cuenta atrás y las dos tareas pendientes.
- **Escenarios:**
  - Dado un usuario sin sesión activa, cuando abre la sección, entonces ve el formulario con la duración propuesta de 25 minutos.
  - Dada una duración y una lista válidas, cuando empieza la sesión, entonces ve la cuenta atrás y sus tareas.
  - Dada una duración de 0, 121 o 25,5 minutos, cuando intenta empezar, entonces ve el error bajo el campo y no se envía nada.
  - Dada una tarea con fecha anterior a hoy, cuando intenta empezar, entonces ve el error bajo el campo y no se envía nada.
  - Dadas 20 tareas en el formulario, entonces no se ofrece añadir otra.
- **RF:** RF-03, RF-04, RF-06 a RF-14, RF-46, RF-47, RF-55, RF-56.

### HU-02 — Seguir la sesión en curso (P1)
Como usuario, quiero ver cuánto tiempo me queda y marcar las tareas que voy terminando, para saber cuánto he avanzado.
- **Por qué P1:** sin esto, la sesión es solo un formulario.
- **Prueba independiente:** con una sesión en curso, completar una tarea y ver «1 de 2» sin recargar; recargar la página y ver la misma cuenta atrás.
- **Escenarios:**
  - Dada una sesión activa, cuando el usuario abre la sección o recarga la página, entonces ve la sesión con su cuenta atrás en lugar del formulario.
  - Dada una tarea de la sesión activa, cuando la completa o la desmarca, entonces cambian la tarea y el resumen «X de Y».
  - Dada una sesión en curso, cuando la cuenta atrás llega a cero, entonces la aplicación la muestra terminada con su resultado.
- **RF:** RF-03, RF-05, RF-15 a RF-22, RF-27, RF-28, RF-57 a RF-66, RF-71, RF-72.

### HU-03 — Pausar, reanudar y terminar la sesión (P1)
Como usuario, quiero pausar la sesión si me interrumpen y terminarla antes si acabo, para no perder el bloque.
- **Por qué P1:** sin pausa, una interrupción obliga a perder la sesión.
- **Prueba independiente:** pausar una sesión, ver la cuenta atrás detenida, reanudarla y terminarla a mano: aparece terminada con su resultado.
- **Escenarios:**
  - Dada una sesión en curso, cuando la pausa, entonces la cuenta atrás se detiene en el tiempo que quedaba.
  - Dada una sesión pausada, cuando la reanuda, entonces la cuenta atrás continúa desde ese tiempo.
  - Dada una sesión activa, cuando pide terminarla, entonces la aplicación pide confirmación y, al confirmar, la muestra terminada con su resultado.
- **RF:** RF-23 a RF-28.

### HU-04 — Cambiar la lista de la sesión activa (P1)
Como usuario, quiero añadir o quitar tareas mientras la sesión está activa, para ajustar el plan sin empezar otra.
- **Por qué P1:** los planes cambian durante el bloque.
- **Prueba independiente:** con una sesión activa de 2 tareas, añadir una tercera y quitar una pendiente: la sesión muestra 2 y la quitada aparece en espera.
- **Escenarios:**
  - Dada una sesión activa, cuando el usuario añade tareas nuevas o en espera, entonces aparecen al final de la lista.
  - Dada una tarea pendiente de la sesión, cuando la quita, entonces pasa a las tareas en espera.
  - Dada una tarea completada de la sesión, entonces no se ofrece quitarla.
  - Dada una sesión con 20 tareas, entonces no se ofrece añadir más.
- **RF:** RF-08 a RF-11, RF-29 a RF-31, RF-48.

### HU-05 — Recuperar las tareas que quedaron sin hacer (P1)
Como usuario, quiero ver las tareas en espera, incluirlas en la siguiente sesión, corregirlas o borrarlas, para no reescribirlas ni acumular las que ya no quiero.
- **Por qué P1:** sin esto, cada tarea no terminada se perdería.
- **Prueba independiente:** terminar una sesión con una tarea pendiente, verla en espera y empezar otra sesión incluyéndola.
- **Escenarios:**
  - Dadas tareas en espera, cuando el usuario prepara una sesión o añade tareas a la activa, entonces puede elegir cuáles incluir.
  - Dada una tarea en espera, cuando la borra, entonces la aplicación pide confirmación y, al confirmar, deja de mostrarla.
  - Dada una tarea en espera o de la sesión activa, cuando corrige su título o su descripción, entonces se guarda sin cambiar la fecha.
  - Dada una tarea en espera con fecha pasada, entonces la aplicación indica que tomará la fecha de hoy al incluirla.
- **RF:** RF-12, RF-32 a RF-37.

### HU-06 — Consultar mis sesiones pasadas (P2)
Como usuario, quiero ver mis sesiones anteriores con su resultado, para saber cuánto tiempo de concentración llevo.
- **Por qué P2:** da contexto, pero las sesiones funcionan sin él.
- **Prueba independiente:** con tres sesiones terminadas, verlas de la más reciente a la más antigua con su duración, motivo de fin y «X de Y», y abrir una para ver sus tareas tal como quedaron.
- **RF:** RF-38 a RF-40, RF-49.

### HU-07 — Ver mi racha y mis logros del pomodoro (P2)
Como usuario, quiero ver mi racha y mis logros del pomodoro, para motivarme a ser constante.
- **Por qué P2:** motiva, pero las sesiones funcionan sin ella.
- **Prueba independiente:** sin actividad, ver racha 0 y los 11 logros sin conseguir; tras una sesión terminada por tiempo, ver racha 1 y «Primer pomodoro» conseguido.
- **RF:** RF-41 a RF-45, RF-67 a RF-70.

## Términos

- **Sesión activa:** sesión en curso (`running`) o pausada (`paused`) (API-004, *Términos*).
- **Tarea en espera:** tarea del pomodoro pendiente que no está en ninguna sesión activa (API-004 RF-23).
- **Reloj monotónico:** reloj del navegador que solo avanza y no cambia si el usuario ajusta la hora del dispositivo.

## Requisitos funcionales (EARS, con ID RF-xx)

### Acceso y navegación
- **RF-01** — El sistema deberá enviar las cabeceras `X-Client-Time` y `X-Timezone` en todas las peticiones a `/pomodoros`, `/pomodoro-tasks`, `/pomodoro-streak` y `/pomodoro-achievements`, igual que en `/tasks`, `/streak` y `/alerts` (API-004 RF-03).
- **RF-02** — Mientras hay una sesión abierta, el sistema deberá incluir en la navegación un acceso llamado «Pomodoro», justo después de «Hecho hoy», que lleva a `/pomodoro`, y marcarlo como activo mientras el usuario está en cualquier ruta que empiece por `/pomodoro`. Amplía 001 RF-50 y RF-54 y la 002 RF-08.
- **RF-51** — Mientras el usuario está en la sección del pomodoro, el sistema deberá mostrar una subnavegación con tres enlaces: «Sesión» (`/pomodoro`), «Historial» (`/pomodoro/history`) y «Logros» (`/pomodoro/achievements`), y marcar como activo el de la vista actual.
- **RF-52** — El sistema deberá mostrar en `/pomodoro` el formulario o la sesión activa (RF-04, RF-05) y, debajo, las tareas en espera (RF-32).
- **RF-53** — El sistema deberá mostrar en `/pomodoro/history` el historial de sesiones (RF-38) y en `/pomodoro/achievements` la racha y los logros del pomodoro (RF-41, RF-42).
- **RF-54** — Cuando el usuario abre una sesión del historial, el sistema deberá mostrarla en `/pomodoro/history/{id}` (RF-40).

### Sesión activa
- **RF-03** — Cuando el usuario abre la sección del pomodoro, el sistema deberá tomar como sesión activa la primera sesión de la primera página de `GET /pomodoros` si su estado es `running` o `paused` (API-004 RF-12, RF-18).
- **RF-04** — Mientras el usuario no tiene una sesión activa, el sistema deberá mostrar el formulario para empezar una sesión.
- **RF-05** — Mientras el usuario tiene una sesión activa, el sistema deberá mostrar esa sesión en lugar del formulario.

### Empezar una sesión
- **RF-06** — El sistema deberá ofrecer en el formulario las duraciones fijas de 15, 25, 45 y 60 minutos, con 25 elegida por defecto (API-004 RF-09).
- **RF-55** — El sistema deberá ofrecer, además de las duraciones fijas, la opción «Otra», con un campo para escribir los minutos.
- **RF-56** — Mientras la opción «Otra» está elegida, el sistema deberá tomar como duración la del campo; mientras no lo está, la de la duración fija elegida.
- **RF-07** — Si la opción «Otra» está elegida y su campo no es un número entero de 1 a 120, entonces el sistema deberá mostrar el error bajo el campo y no enviar la petición (API-004 RF-55).
- **RF-08** — Si el título de una tarea nueva tiene menos de 1 o más de 200 caracteres tras recortar los espacios, entonces el sistema deberá mostrar el error bajo el campo y no enviar la petición (API-004 RF-06).
- **RF-09** — Si la descripción de una tarea nueva tiene más de 1000 caracteres, entonces el sistema deberá mostrar el error bajo el campo y no enviar la petición (API-004 RF-06).
- **RF-10** — El sistema deberá proponer la fecha de hoy para cada tarea nueva.
- **RF-11** — Si la fecha de una tarea nueva es anterior a hoy, entonces el sistema deberá mostrar el error bajo el campo y no enviar la petición (API-004 RF-05).
- **RF-12** — El sistema deberá permitir elegir tareas en espera para incluirlas en la sesión (API-004 RF-21).
- **RF-13** — Mientras la suma de tareas nuevas y en espera elegidas es 20, el sistema no deberá ofrecer añadir otra (API-004 RF-10).
- **RF-14** — Cuando el usuario empieza una sesión con datos válidos, el sistema deberá enviarla a `POST /pomodoros` y mostrar la sesión creada (API-004 RF-49).

### Cuenta atrás
- **RF-15** — Mientras la sesión está en curso, el sistema deberá mostrar una cuenta atrás en minutos y segundos que parte de `remainingSeconds` en el instante en que llegó la respuesta y avanza con el reloj monotónico.
- **RF-16** — Mientras la sesión está pausada, el sistema deberá mostrar la cuenta atrás detenida en `remainingSeconds`.
- **RF-17** — Cuando la cuenta atrás llega a cero, el sistema deberá volver a consultar la sesión en `GET /pomodoros/{id}` (API-004 RF-15).
- **RF-18** — Si la sesión sigue activa al volver a consultarla, entonces el sistema deberá repetir la consulta una sola vez más tras un segundo.
- **RF-19** — Cuando la cuenta atrás de una sesión en curso llega a cero, el sistema deberá reproducir un sonido corto, salvo que el usuario lo haya silenciado.
- **RF-57** — Mientras la sesión está en curso, el sistema deberá mostrar en el título de la pestaña el tiempo restante y el nombre de la sección («12:34 · Pomodoro»).
- **RF-58** — Mientras la sesión está pausada, el sistema deberá mostrar en el título de la pestaña el tiempo restante detenido y que está en pausa («En pausa 12:34 · Pomodoro»).
- **RF-59** — Cuando la cuenta atrás llega a cero, el sistema deberá mostrar en el título de la pestaña «¡Sesión terminada! · Pomodoro» hasta que el usuario vuelva a la pestaña.
- **RF-60** — Cuando el usuario sale de la sección del pomodoro, el sistema deberá restaurar el título normal de la pestaña.
- **RF-61** — Mientras hay una sesión activa, el sistema deberá ofrecer silenciar y volver a activar el sonido de fin. La elección dura mientras la aplicación está abierta y no se guarda en el navegador (RNF-03).
- **RF-62** — Si el navegador no permite reproducir el sonido, entonces el sistema deberá seguir sin mostrar ningún error y avisar solo con la página (RF-27) y el título de la pestaña (RF-59).

### Anuncios para lectores de pantalla
- **RF-63** — Cuando el usuario empieza, pausa o reanuda una sesión, el sistema deberá anunciarlo a los lectores de pantalla con el tiempo restante («Sesión en pausa. Quedan 12 minutos»).
- **RF-64** — Cuando la cuenta atrás de una sesión en curso pasa por 5 minutos o por 1 minuto restante, el sistema deberá anunciarlo a los lectores de pantalla («Quedan 5 minutos»).
- **RF-65** — Si una sesión empieza o se reanuda con menos tiempo restante que un hito, entonces el sistema no deberá anunciar ese hito.
- **RF-66** — Cuando la cuenta atrás llega a cero, el sistema deberá anunciar a los lectores de pantalla que la sesión ha terminado.

### Tareas de la sesión activa
- **RF-20** — El sistema deberá mostrar las tareas de la sesión en el orden que devuelve la API (API-004 RF-64).
- **RF-21** — El sistema deberá mostrar el resumen «X de Y» con `completedTasks` y `totalTasks`.
- **RF-22** — Mientras la sesión está activa, cuando el usuario completa o desmarca una de sus tareas, el sistema deberá enviarlo a `PATCH /pomodoro-tasks/{id}` y mostrar la tarea y el resumen actualizados sin recargar la página (API-004 RF-13).

### Pausar, reanudar y terminar
- **RF-23** — Mientras la sesión está en curso, el sistema deberá ofrecer pausarla con `PATCH /pomodoros/{id}` y `status: paused` (API-004 RF-30).
- **RF-24** — Mientras la sesión está pausada, el sistema deberá ofrecer reanudarla con `status: running` (API-004 RF-31).
- **RF-25** — Mientras la sesión está activa, el sistema deberá ofrecer terminarla.
- **RF-26** — Cuando el usuario pide terminar la sesión, el sistema deberá pedir confirmación antes de enviar `status: finished` (API-004 RF-32).
- **RF-27** — Cuando una sesión termina, por tiempo o a mano, el sistema deberá mostrar su resultado: tareas completadas y pendientes, tiempo de concentración y motivo de fin (API-004 RF-33).
- **RF-28** — Cuando una sesión termina con tareas pendientes, el sistema deberá indicar que han pasado a espera (API-004 RF-23).
- **RF-71** — Mientras se muestra el resultado de una sesión terminada, el sistema deberá ofrecer empezar otra sesión, que lleva al formulario (RF-04).
- **RF-72** — Cuando una sesión activa termina con la sección abierta, el sistema deberá mostrar su resultado (RF-27) y seguir mostrándolo al recargar la página, hasta que el usuario elige empezar otra sesión (RF-71). Una sesión que termina con la sección cerrada no muestra resultado al volver: se consulta en el historial (RF-38).

### Cambiar la lista de la sesión activa
- **RF-29** — Mientras la sesión está activa y tiene menos de 20 tareas, el sistema deberá permitir añadirle tareas nuevas o en espera con `POST /pomodoros/{id}/tasks`, con las mismas validaciones de RF-08 a RF-11 (API-004 RF-25, RF-51).
- **RF-30** — Mientras una tarea de la sesión activa está pendiente, el sistema deberá permitir quitarla con `DELETE /pomodoros/{id}/tasks/{taskId}` (API-004 RF-26).
- **RF-31** — Mientras una tarea de la sesión activa está completada, el sistema no deberá ofrecer quitarla (API-004 RF-37).

### Tareas en espera
- **RF-32** — El sistema deberá mostrar las tareas en espera en el orden de la API, por fecha ascendente, paginadas (API-004 RF-24).
- **RF-33** — Cuando el usuario pide borrar una tarea en espera, el sistema deberá pedir confirmación antes de enviar `DELETE /pomodoro-tasks/{id}` (API-004 RF-22).
- **RF-34** — Mientras una tarea está en espera, el sistema no deberá ofrecer completarla (API-004 RF-36).
- **RF-35** — Mientras una tarea está en espera o en la sesión activa, el sistema deberá permitir editar su título y su descripción con `PATCH /pomodoro-tasks/{id}`, con las validaciones de RF-08 y RF-09 (API-004 RF-48).
- **RF-36** — El sistema no deberá ofrecer cambiar la fecha de una tarea del pomodoro ya creada (API-004 RF-54).
- **RF-37** — Mientras una tarea en espera tiene fecha anterior a hoy, el sistema deberá indicar que tomará la fecha de hoy al incluirla en una sesión (API-004 RF-21).

### Historial de sesiones
- **RF-38** — El sistema deberá mostrar las sesiones del usuario de la más reciente a la más antigua, paginadas (API-004 RF-18).
- **RF-39** — El sistema deberá mostrar de cada sesión terminada su fecha, su duración, su tiempo de concentración, su motivo de fin y su resumen «X de Y».
- **RF-40** — Cuando el usuario abre una sesión terminada, el sistema deberá mostrar sus tareas en solo lectura, tal como estaban al terminar (API-004 RF-16).

### Racha y logros
- **RF-41** — El sistema deberá mostrar en `/pomodoro/achievements` la racha actual y la mejor racha del pomodoro, con la misma presentación que la racha del tablero y separadas de ella (API-004 RF-41).
- **RF-67** — Si falla la consulta de la racha del pomodoro, entonces el sistema deberá mostrar el error con opción de reintentar solo en la racha, sin ocultar los logros (como 001 RF-44).
- **RF-42** — El sistema deberá mostrar los 11 logros en el orden que devuelve la API, cada uno con su nombre, su descripción y su progreso sobre la meta (API-004 RF-19, RF-43).
- **RF-43** — Mientras un logro está conseguido, el sistema deberá mostrarlo como conseguido con la fecha en que se consiguió (API-004 RF-44).
- **RF-44** — El sistema deberá mostrar la meta y el progreso de `FOCUS_10H` en horas y minutos (API-004 RF-65).
- **RF-45** — Cuando el usuario empieza una sesión, o abre la sección con una sesión ya activa, el sistema deberá tomar como referencia los logros conseguidos en ese momento, solo en memoria (RNF-03).
- **RF-68** — Cuando una sesión termina, por tiempo o a mano, el sistema deberá volver a consultar los logros y mostrar en el resultado (RF-27) un aviso con los que han pasado a conseguidos respecto a la referencia de RF-45, con acceso a «Logros».
- **RF-69** — Mientras ningún logro ha pasado a conseguido durante la sesión, el sistema no deberá mostrar el aviso de RF-68.
- **RF-70** — Si falla la consulta de los logros al terminar la sesión, entonces el sistema deberá mostrar el resultado sin el aviso y sin mensaje de error.

### Errores de la API
- **RF-46** — Si la API rechaza empezar una sesión con `POMODORO_ALREADY_ACTIVE`, entonces el sistema deberá mostrar la sesión activa en lugar del formulario (API-004 RF-12).
- **RF-47** — Si la API rechaza una petición con `DAY_CLOSED` o `POMODORO_TASK_NOT_FOUND`, entonces el sistema deberá mostrar el mensaje y conservar lo escrito en el formulario (API-004 RF-05, RF-11).
- **RF-48** — Si la API rechaza una acción con `INVALID_POMODORO_STATE`, `POMODORO_TASK_LIMIT`, `POMODORO_TASK_COMPLETED`, `POMODORO_TASK_NOT_IN_SESSION` o `POMODORO_TASK_IN_SESSION`, entonces el sistema deberá mostrar el mensaje y el estado actual de la sesión y de las tareas en espera.
- **RF-49** — Si la API responde `POMODORO_NOT_FOUND` al abrir una sesión, entonces el sistema deberá mostrar un estado de sesión no encontrada con acceso a la sección del pomodoro (API-004 RF-20).
- **RF-50** — El sistema deberá mostrar cada código de error del pomodoro (API-004, *Códigos de error nuevos*) con un mensaje propio en español.

## Requisitos no funcionales (RNF-xx, sin tecnología)

- Se heredan sin cambios 001 RNF-01 a RNF-06: textos en español, accesibilidad, responsive de 360px a escritorio comprobado en móvil (360×800), tablet (768×1024) y escritorio (1280×800), Chrome y Firefox, tema del sistema y sesión no legible por la aplicación.
- **RNF-01** — La cuenta atrás no se desvía más de 1 segundo del tiempo restante de la API, aunque la pestaña haya estado en segundo plano o el reloj del dispositivo esté adelantado o atrasado.
- **RNF-02** — Los lectores de pantalla no anuncian la cuenta atrás cada segundo: solo los hitos de RF-63 a RF-66, sin interrumpir lo que esté leyendo el usuario. El tiempo restante se puede leer en cualquier momento al llegar a él.
- **RNF-03** — Ningún dato de la sesión pomodoro se guarda en el navegador: se recupera siempre de la API (001 RNF-06).

## Casos límite

- **Recarga o cierre de la pestaña con la sesión activa:** la sesión sigue en la API; al volver se muestra con la cuenta atrás correcta (RF-03, RF-15).
- **Sesión que termina con la página cerrada:** al volver ya no hay sesión activa y se muestra el formulario (RF-04); la sesión está en el historial y sus tareas pendientes, en espera (RF-72).
- **Recarga con el resultado abierto:** el resultado se sigue mostrando hasta que el usuario elige empezar otra sesión (RF-72).
- **Reloj del dispositivo adelantado o atrasado:** la cuenta atrás no cambia, porque parte de `remainingSeconds` (RF-15, RNF-01).
- **Recarga después del fin:** si la sesión terminó con la página cerrada, no hay sonido, cambio de título ni anuncio, porque la cuenta atrás no llegó a cero en la página (RF-19, RF-59, RF-66).
- **Sesión de 1 o 3 minutos:** no se anuncia «quedan 5 minutos»; la de 1 minuto tampoco anuncia «queda 1 minuto» (RF-65).
- **Consulta justo en el instante de fin:** la API aún puede devolver la sesión en curso; se repite la consulta una vez (RF-18).
- **Dos pestañas:** completar una tarea o terminar la sesión en una se refleja en la otra en la siguiente consulta a la API; una acción ya no válida responde con un error de estado y se muestra el estado actual (RF-48).
- **Sesión pausada durante días:** sigue pausada al volver (API-004 RF-60).
- **Sesión que cruza la medianoche:** sus tareas se pueden seguir completando (API-004 RF-57).
- **Sesión sin tareas:** se permite; se muestra solo la cuenta atrás con acceso a añadir tareas (API-004 RF-10).
- **Quitar la última tarea:** la sesión sigue activa, sin tareas (API-004 RF-26).
- **20 tareas:** no se ofrece añadir más (RF-13, RF-29).
- **Tarea en espera con fecha de hace un mes:** al incluirla toma la fecha de hoy (RF-37).
- **Recarga a mitad de sesión:** la referencia de logros se toma al recargar; un logro conseguido antes de recargar (por ejemplo `TASKS_10` al completar una tarea) no aparece en el aviso, pero sí en «Logros» (RF-45).
- **Usuario sin actividad:** racha 0 y los 11 logros sin conseguir (RF-41, RF-42).
- **Contenido largo:** títulos muy largos sin espacios, emojis y texto no latino no rompen el diseño.

## Fuera de alcance

- **Incluir tareas del tablero en una sesión:** son recursos distintos (API-004 RF-02).
- **Descansos y ciclos de varios pomodoros:** cada sesión es un bloque independiente, como en la API (API-004, *Fuera de alcance*); al terminar, el usuario empieza otra cuando quiera (RF-71). Pueden ir en una spec posterior, que reutilice la cuenta atrás, el sonido, el título y los anuncios de esta (P-08).
- **Duraciones o logros definidos por el usuario.**
- **Notificaciones del navegador al terminar la sesión:** pueden ir en una spec posterior (P-03).

## Criterios de éxito (CE-xx)

- **CE-01** — Un usuario puede empezar una sesión con dos tareas en menos de 30 segundos.
- **CE-02** — Tras recargar, la cuenta atrás coincide con el tiempo restante de la API con un margen de 1 segundo en el 100 % de los casos.
- **CE-03** — 0 pantallas con desplazamiento horizontal o con elementos interactivos fuera de la pantalla en los tres tamaños de 001 RNF-03.

## Supuestos

- **S-01** — Las tareas del pomodoro no aparecen en el tablero, en «Hecho hoy», en el historial ni en los avisos (API-004 RF-02).
- **S-02** — Las listas paginadas usan el tamaño por defecto de la API, como el historial (001 S-06).
- **S-03** — Como solo puede haber una sesión activa y no se puede empezar otra mientras dure, la sesión activa, si existe, es siempre la más reciente (RF-03).

## Preguntas abiertas

Ninguna. Todas están resueltas en *Clarificaciones*.

## Clarificaciones

- **2026-11-09** — ¿Qué endpoints se usan? → Los 11 de API-004, según su colección de Postman (*Endpoints usados*). Todas sus rutas exigen `X-Client-Time` y `X-Timezone` (RF-01).
- **2026-11-09** — ¿Cómo se localiza la sesión activa y cómo se evita el desfase de reloj? (P-05) → La activa es la primera de `GET /pomodoros` si está `running` o `paused` (RF-03, S-03); la cuenta atrás parte de `remainingSeconds` con un reloj monotónico, no de `endsAt` con el reloj del dispositivo (RF-15, RNF-01). Al llegar a cero se vuelve a consultar la sesión, con un reintento si aún está activa (RF-17, RF-18).
- **2026-11-09** — ¿Ruta, nombre y posición en la navegación? (P-01) → Rutas separadas: `/pomodoro` (sesión y tareas en espera), `/pomodoro/history` (con el detalle en `/pomodoro/history/{id}`) y `/pomodoro/achievements` (racha y logros), con una subnavegación de enlaces «Sesión», «Historial» y «Logros». En la navegación principal, «Pomodoro» justo después de «Hecho hoy» (RF-02, RF-51 a RF-54). Se descartan una ruta con pestañas sin URL propia y una sola pantalla con todo.
- **2026-11-09** — ¿Cómo se elige la duración? (P-02) → Duraciones fijas de 15, 25, 45 y 60 minutos, con 25 por defecto, y la opción «Otra» con un campo de 1 a 120 que solo se valida cuando está elegida (RF-06, RF-07, RF-55, RF-56). Se descartan solo el campo libre (más lento en móvil) y solo las duraciones fijas (desaprovecha el intervalo de la API).
- **2026-11-09** — ¿Cómo se avisa del fin de la sesión? (P-03) → Con la página (RF-27), el título de la pestaña (RF-57 a RF-60) y un sonido corto que se puede silenciar (RF-19, RF-61); si el navegador bloquea el sonido, no pasa nada más (RF-62). Se descarta la notificación del navegador en esta spec (pide permiso y en móvil funciona de forma desigual); puede ir en una posterior.
- **2026-11-09** — ¿Qué anuncia la cuenta atrás a los lectores de pantalla? (P-04) → Solo hitos, sin interrumpir: empezar, pausar y reanudar con el tiempo restante, quedan 5 y 1 minutos, y fin (RF-63 a RF-66, RNF-02). Un hito por el que la cuenta atrás no pasa no se anuncia. Se descartan anunciar cada minuto (demasiadas interrupciones en sesiones largas) y solo los cambios de estado (no avisa de que se acerca el fin).
- **2026-11-09** — ¿Se reutiliza el componente de racha? (P-06) → Sí: la presentación de la racha actual y la mejor se extrae de `StreakPanel` a un componente reutilizable que reciben el tablero y el pomodoro, y se reutiliza `streakSchema`, porque `GET /pomodoro-streak` devuelve la misma forma que `GET /streak` (RF-41). El tablero no cambia para el usuario, así que la spec 001 no se modifica. Se descartan un componente nuevo en el pomodoro (duplicaría uno existente, AGENTS.md §6) y una variante de `StreakPanel` (mezclaría dos fuentes de datos).
- **2026-11-09** — ¿Se avisa de los logros conseguidos? (P-07) → Sí, en el resultado de la sesión: se comparan los logros del inicio de la sesión (o de la carga de la página, si ya estaba activa) con los del fin, y se avisa de los nuevos, también los de tareas, con acceso a «Logros» (RF-45, RF-68 a RF-70). Una consulta extra por sesión; si falla, el resultado se muestra sin aviso. Se descartan avisar en cada acción (una consulta por cada tarea completada y avisos en mitad de la sesión) y dejarlo fuera de la spec.
- **2026-11-09** — ¿Descansos entre sesiones? (P-08) → Fuera de esta spec: cada sesión es un bloque independiente, como en la API, y el resultado ofrece empezar otra (RF-71). Se descartan el descanso con ciclos y el descanso fijo de 5 minutos gestionados solo por el frontend: se perderían al recargar (RNF-03) y guardarlos de verdad exige una spec en TaskApiSDD. Pueden ir en una spec posterior.
- **2026-11-09** — ¿Qué se ve al volver si la sesión terminó con la página cerrada? (R-1 del plan, detectada al planificar: el caso límite de recarga contradecía RF-03 y RF-04) → El formulario; la sesión se consulta en el historial. El resultado solo se muestra si la sesión termina con la sección abierta, y se mantiene al recargar hasta empezar otra (RF-72). Se descarta mostrar siempre la última sesión terminada (el formulario no aparecería nunca sin un paso extra) y guardar en el navegador qué sesión estaba abierta (RNF-03).

## Registro de cambios

- **2026-11-09** — Creación del borrador a partir del contrato de API-004, con 8 preguntas abiertas (P-01 a P-08) marcadas `[NEEDS CLARIFICATION]`. Estado → *Borrador*.
- **2026-11-09** — Análisis de la colección de Postman de API-004. RF reescritos en EARS y renumerados (RF-01 a RF-50), separando los compuestos; se añaden la tabla *Endpoints usados*, *Términos*, las cabeceras de hora en las rutas del pomodoro (RF-01), la sesión activa desde `GET /pomodoros` (RF-03), la cuenta atrás desde `remainingSeconds` (RF-15), el reintento al llegar a cero (RF-18) y los errores de la API (RF-46 a RF-50). P-05 resuelta. Quedan 7 preguntas abiertas (P-01 a P-04, P-06 a P-08). Estado → *Borrador*.
- **2026-11-09** — Clarificación P-01: rutas separadas con subnavegación. Se concreta RF-02 y se añaden RF-51 a RF-54. Quedan 6 preguntas abiertas (P-02 a P-04, P-06 a P-08). Estado → *Borrador*.
- **2026-11-09** — Clarificación P-02: duraciones fijas más la opción «Otra». Se concretan RF-06 y RF-07 y se añaden RF-55 y RF-56. Quedan 5 preguntas abiertas (P-03, P-04, P-06 a P-08). Estado → *Borrador*.
- **2026-11-09** — Clarificación P-03: aviso de fin en la página, en el título de la pestaña y con sonido. Se concreta RF-19 y se añaden RF-57 a RF-62, un caso límite y un punto fuera de alcance. Quedan 4 preguntas abiertas (P-04, P-06 a P-08). Estado → *Borrador*.
- **2026-11-09** — Clarificación P-04: anuncios de hitos para lectores de pantalla. Se concreta RNF-02 y se añaden RF-63 a RF-66 y un caso límite. Quedan 3 preguntas abiertas (P-06 a P-08). Estado → *Borrador*.
- **2026-11-09** — Clarificación P-06: se reutiliza la presentación de la racha del tablero. Se concreta RF-41 y se añade RF-67. Quedan 2 preguntas abiertas (P-07 y P-08). Estado → *Borrador*.
- **2026-11-09** — Clarificación P-07: aviso de logros nuevos en el resultado de la sesión. Se concreta RF-45 y se añaden RF-68 a RF-70 y dos casos límite. Queda 1 pregunta abierta (P-08). Estado → *Borrador*.
- **2026-11-09** — Clarificación P-08: descansos fuera de alcance. Se añade RF-71 y se concreta *Fuera de alcance*. Sin preguntas abiertas ni marcas `[NEEDS CLARIFICATION]`; pendiente de la aprobación del usuario. Estado → *Borrador*.
- **2026-11-09** — Spec aprobada por el usuario, con las decisiones tomadas al resolver las preguntas: detalle en `/pomodoro/history/{id}` (RF-54), duraciones 15, 25, 45 y 60 (RF-06), título en pausa (RF-58), silencio no recordado (RF-61), hitos de 5 y 1 minutos (RF-64) y CE-01 a CE-03. El plan separa la entrega en dos fases: P1 (HU-01 a HU-05) y P2 (HU-06 y HU-07). Estado → *Aprobada*.
- **2026-11-09** — Cambio aprobado por el usuario, detectado al planificar (R-1 del plan): se añade RF-72 (resultado solo de la sesión que termina con la sección abierta, mantenido al recargar) y se corrigen los casos límite de recarga, que contradecían RF-03 y RF-04. Estado → *Aprobada*.
- **2026-11-09** — Funcionalidad implementada con la aprobación del usuario: las 62 tareas de `tasks.md` hechas y cada RF-01 a RF-72 con al menos un test que lo cita en su nombre (Jest o Playwright). E2E en los 6 proyectos y quality gate de SonarQube en verde. Sin cambios en los requisitos. Estado → *Implementada*.
