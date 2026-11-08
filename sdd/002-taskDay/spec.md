# Feature: TaskDay — las tareas que he hecho hoy
Rama: 002-taskDay · Estado: Implementada · Fecha: 2026-11-08

Depende de TaskApiSDD: `../TaskApiSDD/sdd/001-taskApiSDD-mvp/spec.md` (tareas). Las reglas de negocio de la API se citan como «API-001 RF-xx» y los requisitos del MVP de esta aplicación (`sdd/001-taskFrontSDD-mvp/spec.md`) como «001 RF-xx».

No necesita cambios en la API: `GET /tasks` ya filtra por día (`date`) y por estado (`status=completed`) (API-001 RF-08, RF-10).

## Contexto y objetivo

El tablero mezcla en la columna de hoy lo pendiente y lo completado, junto a los 6 días siguientes. Quien quiere ser constante también necesita cerrar el día viendo solo lo que ya ha hecho, sin el ruido de lo que falta ni de los días que vienen.

Esta funcionalidad añade una sección propia, en la ruta `/taskday`, con las tareas que el usuario ha completado hoy.

Como la API solo permite completar tareas del día actual (API-001 RF-14, RF-45), las tareas completadas con fecha de hoy son exactamente las que el usuario ha hecho hoy.

## Historias de usuario (con prioridad y prueba independiente)

001 RF-01 a RF-08 (acceso y sesión) y 001 RF-40, RF-41, RF-43 y RF-44 (errores y estados comunes) son transversales y aplican a esta historia.

### HU-01 — Ver lo que he hecho hoy (P1)
Como usuario, quiero ver en una sección aparte las tareas que he completado hoy, para saber de un vistazo lo que llevo hecho.
- **Por qué P1:** es toda la funcionalidad.
- **Prueba independiente:** con 3 tareas de hoy, 2 completadas, y 1 tarea completada de ayer, la pantalla `/taskday` muestra solo las 2 completadas de hoy.
- **Escenarios:**
  - Dado un usuario con tareas completadas hoy, cuando abre `/taskday`, entonces las ve en el orden en que las creó, sin las pendientes ni las de otros días.
  - Dado un usuario sin tareas completadas hoy, cuando abre `/taskday`, entonces ve un estado vacío con acceso al tablero.
  - Dada una tarea completada en el tablero, cuando el usuario abre `/taskday`, entonces aparece sin recargar la página.
  - Dada una sesión abierta, cuando el usuario usa la navegación, entonces encuentra el acceso a esta sección y la ve marcada como activa al estar en ella.
- **RF:** RF-01 a RF-08.

## Requisitos funcionales (EARS, con ID RF-xx)

### Pantalla
- **RF-01** — El sistema deberá mostrar en la ruta `/taskday` las tareas completadas del día actual del dispositivo (API-001 RF-08, RF-10), en el orden de creación que devuelve la API (API-001 RF-41).
- **RF-02** — El sistema deberá mostrar de cada tarea su título y, si la tiene, su descripción.
- **RF-03** — El sistema deberá mostrar cuántas tareas lleva completadas hoy el usuario.
- **RF-04** — Mientras el día actual no tiene tareas completadas, el sistema deberá mostrar un estado vacío con acceso al tablero.
- **RF-05** — El sistema deberá mostrar las tareas de esta pantalla en solo lectura, sin opciones de desmarcar, editar ni eliminar: esas acciones se hacen desde el tablero.

### Actualización
- **RF-06** — Cuando el usuario completa, desmarca o elimina una tarea de hoy desde otra pantalla de la aplicación, el sistema deberá mostrar la lista actualizada al abrir esta sección, sin recargar la página.
- **RF-07** — Cuando cambia el día actual del dispositivo con la pantalla abierta, el sistema deberá mostrar las tareas completadas del nuevo día.

### Navegación
- **RF-08** — Mientras hay una sesión abierta, el sistema deberá incluir en la navegación un acceso a esta sección y marcarlo como activo mientras el usuario está en ella. El acceso se llama «Hecho hoy», va justo después de «Tablero» y es también el título de la pantalla. Amplía 001 RF-50 y RF-54.

## Requisitos no funcionales (RNF-xx, sin tecnología)

Se heredan sin cambios 001 RNF-01 a RNF-06: textos en español, accesibilidad, responsive de 360px a escritorio comprobado en móvil (360×800), tablet (768×1024) y escritorio (1280×800), Chrome y Firefox, tema del sistema y sesión no legible por la aplicación.

## Casos límite

- **Sin datos:** usuario sin tareas hoy o con todas pendientes: estado vacío (RF-04).
- **Solo otros días:** tareas completadas ayer o pendientes de mañana: no aparecen (RF-01).
- **Muchas tareas:** más de 50 tareas completadas hoy: se muestran por páginas, como el historial (S-02).
- **Cambio de día:** pantalla abierta a las 23:59 con 3 tareas completadas: a las 00:00 pasa a mostrar las del nuevo día, normalmente el estado vacío (RF-07).
- **Desmarcar en otra pestaña:** una tarea desmarcada desde otra pestaña desaparece de la lista en la siguiente consulta a la API, como en el resto de la aplicación.
- **Contenido largo:** títulos muy largos sin espacios, emojis y texto no latino no rompen el diseño.

## Fuera de alcance

- **Ver lo hecho en otros días:** para eso está el historial filtrado por «completadas» y por fecha (001 RF-31, RF-32).
- **Crear, desmarcar, editar o eliminar tareas desde esta sección:** se hace desde el tablero (RF-05).
- **La hora a la que se completó cada tarea:** la API no la guarda; `updatedAt` cambia también al editar.
- **Estadísticas, gráficas o comparación con otros días.**
- **Pomodoro:** va en una funcionalidad aparte.

## Criterios de éxito (CE-xx)

- **CE-01** — 0 tareas pendientes o de otros días mostradas en `/taskday`.
- **CE-02** — Completar una tarea en el tablero y abrir `/taskday` la muestra sin recargar la página, en el 100 % de los casos.
- **CE-03** — 0 pantallas con desplazamiento horizontal o con elementos interactivos fuera de la pantalla en los tres tamaños de 001 RNF-03.

## Supuestos

- **S-01** — «Hoy» es el día actual del dispositivo, como en el tablero (001 S-03, API-001 RF-23).
- **S-02** — Si hay más de 50 tareas completadas hoy, se pagina con el tamaño por defecto de la API, igual que el historial (001 S-06).
- **S-03** — La ruta es `/taskday`, tal como la pidió el usuario.
- **S-04** — El progreso de hoy («X de Y») y la racha siguen en el tablero (001 S-10); esta pantalla no los repite.

## Clarificaciones

- **2026-11-08** — ¿Qué es TaskDay? → Las tareas diarias que el usuario ha hecho el día de hoy, en otra sección de la aplicación, en la ruta `/taskday`.
- **2026-11-08** — ¿Acciones sobre las tareas? → Solo lectura; desmarcar, editar y eliminar siguen en el tablero (RF-05).
- **2026-11-08** — ¿Nombre en la navegación? → «Hecho hoy», justo después de «Tablero», también como título de la pantalla (RF-08).

## Registro de cambios

- **2026-11-08** — Creación del borrador con la primera clarificación. Quedan 2 `[NEEDS CLARIFICATION]` (RF-05 y RF-08).
- **2026-11-08** — Resueltos los 2 `[NEEDS CLARIFICATION]`: RF-05 (solo lectura) y RF-08 («Hecho hoy», después de «Tablero»).
- **2026-11-08** — Spec aprobada por el usuario, con los supuestos S-01 a S-04. Estado → *Aprobada*.
- **2026-11-08** — Todas las tareas de `tasks.md` hechas (T001–T012) y cada RF con su test, en Chromium y Firefox, en móvil, tablet y escritorio. Estado → *Implementada*. Los requisitos no cambian.
