# Feature: TaskFrontSDD MVP — cuenta, tablero semanal de tareas, rachas y avisos
Rama: 001-taskFrontSDD-mvp · Estado: Implementada · Fecha: 2026-10-29

Depende de TaskApiSDD: `../TaskApiSDD/sdd/001-taskApiSDD-mvp/spec.md` (tareas, rachas y avisos) y `../TaskApiSDD/sdd/002-user-accounts/spec.md` (cuentas y sesiones). Las reglas de negocio de la API no se repiten aquí: se citan como «API-001 RF-xx» o «API-002 RF-xx».

**Requisito previo en TaskApiSDD:** `GET /me` debe devolver también el token CSRF de la sesión, para que la aplicación lo recupere tras recargar la página sin guardarlo en el navegador (RNF-06). Hoy solo llega en la respuesta del inicio de sesión (API-002 RF-24). Este cambio se especifica e implementa en el repositorio de la API.

## Contexto y objetivo

TaskApiSDD ya registra tareas por día, mide la constancia como racha de días productivos y genera avisos de tareas que van a quedar sin hacer, pero solo se puede usar con peticiones a mano. Quien quiere ser constante necesita ver de un vistazo qué tiene que hacer hoy y esta semana, marcar lo que termina y saber si su racha está en juego.

Este MVP es la aplicación web que lo hace posible:
- Una cuenta propia con su sesión.
- Un tablero con las tareas de los próximos 7 días.
- El estado de la racha y el progreso de hoy.
- Los avisos de la API.
- La consulta del historial.

## Historias de usuario (con prioridad y prueba independiente)

RF-01 a RF-08 (acceso y sesión), RF-40 a RF-45 (errores y estados comunes), RF-46 (campos escribibles), RF-50 y RF-54 (navegación) son transversales: aplican a todas las historias salvo HU-01, a la que solo se aplican RF-41 a RF-46.

### HU-01 — Crear mi cuenta y entrar (P1)
Como persona nueva, quiero registrarme, iniciar sesión y cerrarla, para tener mis tareas protegidas.
- **Por qué P1:** sin sesión no se puede usar nada más.
- **Prueba independiente:** registrarse con un email nuevo, iniciar sesión con él y llegar al tablero; cerrar sesión devuelve a la pantalla de inicio de sesión.
- **Escenarios:**
  - Dado un email no registrado, cuando la persona se registra con una contraseña de 12 caracteres, entonces llega a la pantalla de inicio de sesión con su email ya escrito y un mensaje de cuenta creada.
  - Dada una cuenta, cuando el usuario inicia sesión con la contraseña correcta, entonces llega al tablero.
  - Dada una contraseña incorrecta, cuando intenta iniciar sesión, entonces ve un mensaje que no revela si el email existe.
  - Dada una sesión abierta, cuando el usuario cierra sesión, entonces vuelve a la pantalla de inicio de sesión y no puede volver al tablero con «atrás».
- **RF:** RF-01 a RF-08.

### HU-02 — Ver las tareas de mi semana (P1)
Como usuario, quiero ver en un tablero mis tareas de hoy y de los 6 días siguientes, para saber qué tengo que hacer.
- **Por qué P1:** es la pantalla principal; el resto de acciones sobre tareas se hacen desde ella.
- **Prueba independiente:** con tareas para hoy y para dentro de 3 días, el tablero muestra 7 columnas y cada tarea en la columna de su día.
- **Escenarios:**
  - Dado un usuario sin tareas, cuando abre el tablero, entonces ve 7 columnas vacías, de hoy a dentro de 6 días, cada una con su estado vacío.
  - Dado un usuario con tareas pendientes y completadas hoy, cuando abre el tablero, entonces la columna de hoy las muestra distinguiendo pendientes y completadas.
  - Dado el tablero de esta semana, cuando el usuario retrocede una semana, entonces ve los 7 días anteriores en solo lectura.
- **RF:** RF-09 a RF-14, RF-47.

### HU-03 — Crear una tarea (P1)
Como usuario, quiero crear una tarea para hoy o un día futuro, para planificar mi trabajo.
- **Por qué P1:** sin tareas no hay tablero ni racha.
- **Prueba independiente:** crear «Comprar pan» en la columna de mañana hace que aparezca pendiente en esa columna.
- **Escenarios:**
  - Dada la columna de hoy, cuando el usuario crea una tarea con título, entonces aparece pendiente en esa columna.
  - Dado el formulario, cuando el usuario intenta guardar sin título, entonces ve el error bajo el campo y no se envía nada.
  - Dado el formulario, cuando el usuario elige una fecha posterior a la semana visible, entonces la tarea se crea y se le confirma con su fecha.
- **RF:** RF-15 a RF-19, RF-51, RF-52.

### HU-04 — Completar y desmarcar tareas (P1)
Como usuario, quiero marcar una tarea de hoy como completada o desmarcarla, para registrar mi progreso.
- **Por qué P1:** completar tareas es lo que alimenta la racha.
- **Prueba independiente:** completar la única tarea de hoy la muestra completada y la racha actual sube en 1.
- **Escenarios:**
  - Dada una tarea pendiente de hoy, cuando el usuario la completa, entonces se muestra completada y la racha y el progreso de hoy se actualizan.
  - Dada una tarea completada de hoy, cuando el usuario la desmarca, entonces vuelve a pendiente.
  - Dada una tarea de mañana, entonces el tablero no ofrece completarla.
- **RF:** RF-20 a RF-22.

### HU-05 — Eliminar una tarea (P1)
Como usuario, quiero eliminar una tarea de hoy o futura, para que mi tablero refleje lo que de verdad quiero hacer.
- **Por qué P1:** corregir el plan es parte del uso diario.
- **Prueba independiente:** eliminar una tarea y confirmarlo hace que desaparezca del tablero.
- **Escenarios:**
  - Dada una tarea de hoy, cuando el usuario la elimina y lo confirma, entonces deja de aparecer.
  - Dada la confirmación de eliminar, cuando el usuario la cancela, entonces la tarea sigue igual.
- **RF:** RF-23, RF-24.

### HU-06 — Ver mi racha y el progreso de hoy (P1)
Como usuario, quiero ver mi racha actual, mi mejor racha y cuántas tareas de hoy llevo completadas, para mantener la constancia.
- **Por qué P1:** la racha es la propuesta de valor del producto.
- **Prueba independiente:** con 3 tareas hoy y 1 completada, el panel muestra «1 de 3» y la racha que devuelve la API.
- **Escenarios:**
  - Dado un usuario sin tareas completadas, cuando abre el panel de rachas, entonces ve racha actual 0 y mejor racha 0.
  - Dado un usuario con racha actual 4 y ninguna tarea completada hoy, cuando abre el panel, entonces ve un aviso de que su racha está en juego.
- **RF:** RF-25 a RF-28.

### HU-07 — Editar una tarea (P2)
Como usuario, quiero cambiar el título o la descripción de una tarea de hoy o futura, para corregir errores.
- **Por qué P2:** corrige errores, pero el flujo principal funciona sin ella.
- **Prueba independiente:** cambiar el título de «Comprar pan» a «Comprar pan integral» lo muestra actualizado en el tablero.
- **Escenarios:**
  - Dada una tarea futura, cuando el usuario cambia su descripción, entonces el tablero muestra la nueva.
  - Dado el formulario de edición, entonces no permite cambiar la fecha.
- **RF:** RF-29, RF-30.

### HU-08 — Consultar mi historial con filtros (P2)
Como usuario, quiero ver todas mis tareas y filtrarlas por estado y por fechas, para tener una visión global.
- **Por qué P2:** útil, pero el uso diario funciona sin ella.
- **Prueba independiente:** con tareas completadas y pendientes en varios días, filtrar por «pendientes» muestra solo las pendientes.
- **Escenarios:**
  - Dado un usuario con 5 tareas en días distintos, cuando abre el historial, entonces las ve ordenadas por fecha, cada una con su estado.
  - Dado el historial, cuando el usuario indica un rango de fechas, entonces solo ve las tareas de ese rango, ambos días incluidos.
  - Dado el historial, cuando el usuario pone una fecha «desde» posterior a la fecha «hasta», entonces ve un error y no se filtra.
- **RF:** RF-31 a RF-34.

### HU-09 — Ver mis avisos (P2)
Como usuario, quiero ver los avisos de tareas que se me iban a quedar sin hacer, y el de hoy destacado en el tablero, para reaccionar a tiempo.
- **Por qué P2:** aporta valor sobre un sistema que ya funciona.
- **Prueba independiente:** con un aviso diario de hoy, el tablero lo destaca y la página de avisos lo lista con sus tareas.
- **Escenarios:**
  - Dado un usuario sin avisos, cuando abre la página de avisos, entonces ve un estado vacío.
  - Dado un aviso semanal, cuando el usuario lo abre, entonces ve su tipo, su periodo y las tareas que incluía.
- **RF:** RF-35 a RF-37.

### HU-10 — Ver y editar mi perfil (P2)
Como usuario, quiero ver los datos de mi cuenta y cambiar mi nombre, para saber con qué cuenta estoy.
- **Por qué P2:** útil, pero las tareas funcionan sin ella.
- **Prueba independiente:** cambiar el nombre a «Ana» lo muestra en el perfil y en la barra superior.
- **RF:** RF-38, RF-53.

### HU-11 — Cambiar mi contraseña y borrar mi cuenta (P3)
Como usuario, quiero cambiar mi contraseña y poder borrar mi cuenta, para controlar mi seguridad y mis datos.
- **Por qué P3:** importante, pero de uso poco frecuente.
- **Prueba independiente:**
  - Tras cambiar la contraseña, la sesión sigue abierta.
  - Tras borrar la cuenta, el usuario está en la pantalla de inicio de sesión y no puede entrar con ese email.
- **Escenarios:**
  - Dada una contraseña actual incorrecta, cuando el usuario intenta cambiarla, entonces ve un error en ese campo.
  - Dado el borrado de cuenta, cuando el usuario no escribe su contraseña, entonces no se puede confirmar.
- **RF:** RF-39, RF-48, RF-49.

## Requisitos funcionales (EARS, con ID RF-xx)

### Acceso y sesión
- **RF-01** — Cuando una persona se registra con un email, una contraseña y opcionalmente un nombre válidos, el sistema deberá crear la cuenta y llevarla a la pantalla de inicio de sesión con su email ya escrito y un mensaje de cuenta creada.
- **RF-02** — El sistema deberá validar cada campo escribible antes de enviar el formulario, con las reglas de RF-46, y mostrar cada error bajo su campo sin enviar nada a la API.
- **RF-03** — Si el email ya está registrado, entonces el sistema deberá mostrar el error en el campo email sin borrar el resto del formulario.
- **RF-04** — Si el inicio de sesión falla por email o contraseña incorrectos, entonces el sistema deberá mostrar un único mensaje genérico, que no revele cuál de los dos falló (API-002 RF-08).
- **RF-05** — Si la cuenta está bloqueada por demasiados intentos (API-002 RF-09), entonces el sistema deberá informar de que hay que esperar 15 minutos antes de volver a intentarlo.
- **RF-06** — Mientras la sesión está abierta, cuando caduca su acceso (API-002 RF-11), el sistema deberá renovarla y repetir la acción en curso sin intervención del usuario.
- **RF-07** — Si la sesión no se puede renovar (caducada, cerrada o con el tope de 30 días), entonces el sistema deberá llevar al usuario a la pantalla de inicio de sesión con un mensaje de sesión caducada y, tras iniciar sesión, devolverlo a la pantalla en la que estaba.
- **RF-08** — Mientras no hay una sesión abierta, el sistema deberá llevar a la pantalla de inicio de sesión cualquier intento de abrir una pantalla privada.

### Tablero semanal
- **RF-09** — El sistema deberá mostrar un tablero con 7 columnas, una por día, que empieza en el día actual del dispositivo, cada una con el nombre del día, su fecha y el número de tareas.
- **RF-10** — El sistema deberá mostrar en cada columna todas las tareas de ese día, separando las pendientes de las completadas y, dentro de cada grupo, en el orden de creación que devuelve la API.
- **RF-11** — Mientras una columna de hoy o de un día futuro no tiene tareas, el sistema deberá mostrar en ella un estado vacío con la opción de crear una tarea en ese día.
- **RF-12** — Cuando el usuario avanza o retrocede, el sistema deberá mostrar los 7 días siguientes o anteriores.
- **RF-13** — Mientras una columna corresponde a un día anterior al actual, el sistema deberá mostrarla en solo lectura, indicando que el día está cerrado, sin opciones de crear, completar, desmarcar, editar ni eliminar (API-001 RF-07, RF-14).
- **RF-14** — Cuando cambia el día actual del dispositivo con el tablero abierto, el sistema deberá actualizar el tablero en la siguiente acción del usuario, para que la columna de ayer pase a solo lectura.

### Crear tareas
- **RF-15** — Cuando el usuario crea una tarea desde una columna, el sistema deberá proponer la fecha de esa columna.
- **RF-51** — Cuando el usuario crea una tarea desde el botón general, el sistema deberá proponer la fecha de hoy.
- **RF-16** — El sistema deberá permitir elegir como fecha el día actual o cualquier día futuro, y nunca un día pasado.
- **RF-17** — Mientras el usuario escribe el título o la descripción de una tarea, el sistema deberá mostrar un contador de caracteres con su máximo (200 y 1000; RF-46).
- **RF-18** — Cuando se crea una tarea con fecha dentro de la semana visible, el sistema deberá mostrarla en su columna.
- **RF-52** — Cuando se crea una tarea con fecha fuera de la semana visible, el sistema deberá confirmar la creación indicando su fecha.
- **RF-19** — Mientras se envía un formulario, el sistema deberá impedir enviarlo otra vez, para no crear tareas duplicadas.

### Completar, desmarcar y eliminar
- **RF-20** — Cuando el usuario marca como completada una tarea de hoy, el sistema deberá mostrarla completada y actualizar la racha y el progreso de hoy.
- **RF-21** — Cuando el usuario desmarca una tarea completada de hoy, el sistema deberá volver a mostrarla pendiente y actualizar la racha y el progreso de hoy (API-001 RF-12).
- **RF-22** — Mientras una tarea es de un día futuro, el sistema no deberá ofrecer completarla (API-001 RF-45).
- **RF-23** — Cuando el usuario pide eliminar una tarea de hoy o futura, el sistema deberá pedir confirmación con el título de la tarea antes de eliminarla.
- **RF-24** — Cuando el usuario confirma la eliminación, el sistema deberá quitar la tarea del tablero y del historial y actualizar la racha y el progreso de hoy.

### Racha y progreso de hoy
- **RF-25** — El sistema deberá mostrar la racha actual y la mejor racha tal como las calcula la API (API-001 RF-17 a RF-21), sin recalcularlas.
- **RF-26** — El sistema deberá mostrar el progreso de hoy como «X de Y tareas completadas», con X las tareas completadas de hoy e Y el total de tareas de hoy.
- **RF-27** — Mientras hoy no hay ninguna tarea completada y la racha actual es mayor que 0, el sistema deberá mostrar que la racha está en juego y que se pierde si hoy termina sin completar ninguna tarea (API-001 RF-20).
- **RF-28** — Mientras hoy no tiene tareas, el sistema deberá mostrar el progreso como «Sin tareas hoy» con la opción de crear una.

### Editar tareas
- **RF-29** — Cuando el usuario edita una tarea de hoy o futura, el sistema deberá permitir cambiar solo su título y su descripción, con las reglas de RF-46, sin ofrecer cambiar su fecha (API-001 RF-37).
- **RF-30** — Cuando el usuario guarda la edición, el sistema deberá mostrar la tarea actualizada donde aparezca.

### Historial
- **RF-31** — El sistema deberá mostrar una pantalla de historial con todas las tareas del usuario, ordenadas por fecha y, dentro de cada fecha, por orden de creación (API-001 RF-41), cada una con su fecha y su estado.
- **RF-32** — Cuando el usuario filtra por estado (todas, completadas o pendientes) o por un rango de fechas «desde» y «hasta» (ambos incluidos), el sistema deberá mostrar solo las tareas que cumplen los filtros (API-001 RF-10, RF-40).
- **RF-33** — Si la fecha «desde» es posterior a la fecha «hasta», entonces el sistema deberá mostrar el error en el filtro y no aplicarlo.
- **RF-34** — El sistema deberá mostrar el historial por páginas, indicando la página actual, el total de páginas y el total de tareas (API-001 RF-39).

### Avisos
- **RF-35** — El sistema deberá mostrar una pantalla de avisos ordenados del más reciente al más antiguo y paginados (API-001 RF-29), cada uno con su tipo (diario, semanal o mensual), su periodo y las tareas que incluía.
- **RF-36** — El sistema deberá mostrar las tareas de un aviso tal como estaban cuando se generó, indicando que pueden haber cambiado desde entonces (API-001 RF-30).
- **RF-37** — Mientras existe algún aviso generado durante el día actual, el sistema deberá destacar en el tablero el más reciente, con su tipo, el número de tareas y un acceso a su detalle.

### Cuenta
- **RF-38** — El sistema deberá mostrar el perfil con el email, el nombre y la fecha de alta, y permitir cambiar solo el nombre (API-002 RF-25, RF-26).
- **RF-53** — Cuando el usuario guarda un nombre nuevo, el sistema deberá mostrarlo también en la barra superior.
- **RF-39** — Cuando el usuario cambia su contraseña con la actual correcta y una nueva válida, el sistema deberá mantener abierta su sesión e informarle de que las demás sesiones se han cerrado (API-002 RF-27).
- **RF-48** — Si la contraseña actual es incorrecta al cambiar la contraseña o al borrar la cuenta, entonces el sistema deberá mostrar el error en ese campo y no cambiar nada (API-002 RF-28).
- **RF-49** — Cuando el usuario confirma el borrado de su cuenta con su contraseña correcta, tras un aviso de que se eliminarán todas sus tareas y avisos, el sistema deberá borrarla y llevarlo a la pantalla de inicio de sesión (API-002 RF-29).

### Errores y estados comunes
- **RF-40** — Mientras se cargan datos, el sistema deberá mostrar un indicador de carga en la zona afectada, sin bloquear el resto de la pantalla.
- **RF-41** — Si una acción falla, entonces el sistema deberá mostrar el mensaje en español propio de ese error (uno por cada código de error de la API), sin mostrar el código técnico, y conservar lo que el usuario había escrito.
- **RF-42** — Si la API rechaza una acción porque el día ya está cerrado o aún no ha empezado (API-001 RF-14, RF-45), entonces el sistema deberá explicarlo y actualizar el tablero.
- **RF-43** — Si la API rechaza la hora o la zona horaria del dispositivo (API-001 RF-31 a RF-33), entonces el sistema deberá indicar que se revise la fecha, la hora y la zona horaria del dispositivo.
- **RF-44** — Si la API no responde o falla de forma inesperada, entonces el sistema deberá mostrar un mensaje de error con la opción de reintentar.
- **RF-45** — Si una tarea ya no existe, por ejemplo porque se eliminó desde otra pestaña, entonces el sistema deberá informarlo y quitarla de la vista.

### Campos escribibles
- **RF-46** — El sistema deberá aplicar estas reglas a cada campo en el que el usuario puede escribir (API-001 RF-04 a RF-06, API-002 RF-02 a RF-05). Los textos se miden sin los espacios del principio y del final, salvo las contraseñas, que nunca se recortan.

| Formulario | Campo | Reglas |
| :--- | :--- | :--- |
| Registro | Email | Obligatorio, formato de email, máximo 254 caracteres |
| Registro | Contraseña | Obligatoria, de 12 a 128 caracteres, sin reglas de composición |
| Registro | Nombre | Opcional, máximo 100 caracteres |
| Inicio de sesión | Email | Obligatorio, formato de email |
| Inicio de sesión | Contraseña | Obligatoria |
| Crear tarea | Título | Obligatorio, de 1 a 200 caracteres |
| Crear tarea | Descripción | Opcional, máximo 1000 caracteres |
| Crear tarea | Fecha | Obligatoria, día válido, hoy o posterior (RF-16) |
| Editar tarea | Título y descripción | Las mismas reglas que al crear |
| Historial | Desde y hasta | Opcionales, días válidos, «desde» no posterior a «hasta» (RF-33) |
| Perfil | Nombre | Opcional, máximo 100 caracteres |
| Cambiar contraseña | Contraseña actual | Obligatoria |
| Cambiar contraseña | Contraseña nueva | Obligatoria, de 12 a 128 caracteres |
| Borrar cuenta | Contraseña | Obligatoria |

### Navegación
- **RF-47** — Cuando el usuario pulsa «Hoy» en el tablero, el sistema deberá volver a la semana que empieza en el día actual.
- **RF-50** — Mientras hay una sesión abierta, el sistema deberá mostrar una navegación con acceso al tablero, al historial, a los avisos y a la cuenta, el nombre o, si no tiene, el email del usuario, y la opción de cerrar sesión.
- **RF-54** — Mientras el usuario está en una pantalla, el sistema deberá marcarla como activa en la navegación.

## Requisitos no funcionales (RNF-xx, sin tecnología)

- **RNF-01** — El 100 % de los textos visibles, mensajes de error incluidos, está en español.
- **RNF-02** — Accesibilidad:
  - Toda la aplicación se puede usar solo con teclado.
  - Contraste mínimo de 4.5:1 en texto y 3:1 en texto grande.
  - Foco visible.
  - Objetivos táctiles de al menos 44×44px.
  - Iconos con nombre accesible.
- **RNF-03** — Toda pantalla y todo componente se puede usar desde 360px de ancho hasta escritorio, sin desplazamiento horizontal de la página y sin elementos interactivos fuera de la pantalla, tapados o recortados. Se comprueba en móvil (360×800), tablet (768×1024) y escritorio (1280×800). El tablero puede desplazarse horizontalmente solo dentro de su zona.
- **RNF-04** — La aplicación funciona en las dos últimas versiones de Chrome y Firefox.
- **RNF-05** — La aplicación sigue el tema claro u oscuro del sistema operativo.
- **RNF-06** — La sesión nunca es legible ni almacenable por la propia aplicación. Ningún dato de la sesión se guarda en el navegador fuera de las cookies que gestiona la API (API-002 RNF-05).

## Casos límite

- **Sin datos:**
  - Usuario sin tareas: tablero con 7 columnas vacías, historial vacío, rachas a 0 y progreso «Sin tareas hoy» (RF-11, RF-28).
  - Usuario sin avisos: pantalla de avisos con estado vacío y nada destacado en el tablero (RF-37).
- **Textos en la frontera:**
  - Título de exactamente 200 caracteres: se acepta. Con 201 se muestra un error y no se envía.
  - Descripción de exactamente 1000 caracteres: se acepta. Con 1001 se muestra un error y no se envía.
  - Título con solo espacios: error «obligatorio».
  - Contraseña de 11 caracteres: error. Con 12 se acepta. Con 128 se acepta. Con 129, error.
- **Cambios de día y de hora:**
  - Tablero abierto a las 23:59 y acción a las 00:01: la API responde «día cerrado», el sistema lo explica y el tablero empieza en el nuevo día (RF-14, RF-42).
  - Tarea de mañana: no se ofrece completarla. Al día siguiente sí (RF-22).
  - Reloj del dispositivo desviado más de 5 minutos: aviso de revisar la hora del dispositivo (RF-43).
- **Concurrencia:**
  - Doble clic en «Crear»: se crea una sola tarea (RF-19).
  - Tarea eliminada en otra pestaña y después completada en esta: se informa de que ya no existe y se quita (RF-45).
- **Sesión:**
  - Acceso caducado en mitad de una acción: la sesión se renueva y la acción se completa sin que el usuario lo note (RF-06).
  - Sesión caducada por los 7 días sin uso o el tope de 30 días: pantalla de inicio de sesión y, tras entrar, vuelta a la pantalla anterior (RF-07).
  - Contraseña cambiada desde otro dispositivo: esta sesión termina en la pantalla de inicio de sesión con el mensaje de sesión caducada (RF-07).
  - Sexto intento de inicio de sesión fallido en 15 minutos: mensaje de esperar 15 minutos, aunque la contraseña sea correcta (RF-05).
- **Avisos:**
  - Aviso que incluye una tarea ya completada o eliminada: se muestra como estaba al generarse, con la nota de RF-36.
  - Varios avisos el mismo día (diario, semanal y mensual): el tablero destaca solo el más reciente y la pantalla de avisos los muestra todos (RF-37).
- **Navegación y filtros:**
  - Semana anterior con tareas: todas en solo lectura (RF-13).
  - Historial con «desde» igual a «hasta»: muestra las tareas de ese día.
  - Página del historial fuera de rango (por ejemplo, tras eliminar tareas): se muestra la última página con contenido.
- **Contenido largo:** títulos muy largos sin espacios, emojis y texto no latino no rompen el diseño de las columnas ni de las tarjetas.

## Fuera de alcance

- **Mover tareas entre días** (arrastrar o cambiar la fecha): la API no permite cambiar la fecha de una tarea (API-001 RF-37). Para moverla, se elimina y se crea de nuevo.
- **Recuperar la contraseña, verificar el email y cambiar el email:** la API no lo ofrece (API-002, *Fuera de alcance*).
- **Notificaciones fuera de la aplicación** (push, email) y marcar avisos como leídos o borrarlos: la API no lo ofrece.
- **Estadísticas más allá de la racha actual, la mejor racha y el progreso de hoy** (gráficas, calendarios, porcentajes históricos).
- **Tareas recurrentes, categorías, etiquetas y prioridades:** la API no las tiene.
- **Funcionamiento sin conexión.**
- **Selector manual de tema claro u oscuro** (se sigue el sistema, RNF-05).
- **Otros idiomas distintos del español.**
- **Ver o cerrar las sesiones abiertas en otros dispositivos.**
- **Panel de miembros del equipo de la plantilla de diseño:** la aplicación es de un solo usuario.

## Criterios de éxito (CE-xx)

- **CE-01** — Una persona nueva puede registrarse, iniciar sesión y crear su primera tarea en menos de 2 minutos sin ayuda.
- **CE-02** — Completar una tarea de hoy actualiza la racha y el progreso en pantalla sin recargar la página, en el 100 % de los casos.
- **CE-03** — 0 opciones de modificar tareas de días pasados o de completar tareas futuras ofrecidas en la interfaz.
- **CE-04** — 0 errores de validación devueltos por la API en formularios que la interfaz dio por válidos.
- **CE-05** — 0 envíos a la pantalla de inicio de sesión mientras la sesión se puede renovar.
- **CE-06** — El inicio de sesión, crear tarea, eliminar tarea y cada campo de RF-46 pasan sus pruebas de extremo a extremo en Chrome y Firefox, en móvil, tablet y escritorio.
- **CE-07** — 0 pantallas con desplazamiento horizontal de la página o con elementos interactivos fuera de la pantalla en los tres tamaños de RNF-03.

## Supuestos

- **S-01** — Tras registrarse no se inicia sesión de forma automática: la API no abre sesión al registrar (API-002 RF-06). Lo más simple es llevar a la pantalla de inicio de sesión con el email ya escrito.
- **S-02** — La semana del tablero son 7 días seguidos desde hoy, no de lunes a domingo, y la navegación avanza o retrocede de 7 en 7 días.
- **S-03** — Las fechas se muestran en formato español (día, mes y año; nombres de días en español) y el día actual es el del dispositivo, igual que en la API (API-001 RF-23).
- **S-04** — Eliminar una tarea pide confirmación en un diálogo. No hay opción de deshacer.
- **S-05** — El aviso destacado en el tablero es el más reciente generado durante el día actual. Si no hay ninguno, no se muestra nada.
- **S-06** — El historial muestra 50 tareas por página, el valor por defecto de la API.
- **S-07** — No se fija un objetivo de tiempo de carga propio en el MVP. Se hereda el de la API (API-001 RNF-01).
- **S-08** — El tema sigue la preferencia del sistema (RNF-05). Los colores, la tipografía y los espaciados son los de `DESIGN.md`.
- **S-09** — El nombre de la aplicación que se muestra en la interfaz y en la pestaña del navegador es **Kompitu**, como sus dominios y como la marca de `DESIGN.md`.
- **S-10** — El panel de rachas y progreso de hoy va en la cabecera del tablero, no en una pantalla propia: es lo más simple y se ve en el uso diario.
- **S-11** — El registro no pide repetir la contraseña. Lo más simple es un único campo con la opción de mostrarla.
- **S-12** — El formulario de inicio de sesión solo comprueba que los campos no estén vacíos y el formato del email. La longitud de la contraseña solo se valida al registrarla o cambiarla.

## Clarificaciones

- **2026-10-29** — ¿Vista principal de tareas? → Tablero por días: columnas de hoy y los días siguientes, con pendientes y completadas en cada una.
- **2026-10-29** — ¿Qué entra de la cuenta? → Cuenta completa: registro, inicio y cierre de sesión, perfil (nombre), cambio de contraseña y borrado de cuenta.
- **2026-10-29** — ¿Avisos? → Página de avisos y, además, el aviso más reciente del día destacado en el tablero.
- **2026-10-29** — ¿Días pasados? → Historial con filtros por estado y rango de fechas, en solo lectura.
- **2026-10-29** — ¿Dashboard de rachas? → Racha actual, mejor racha y progreso de hoy («X de Y»), con aviso cuando la racha está en juego.
- **2026-10-29** — ¿Columnas del tablero? → 7 columnas fijas, de hoy a dentro de 6 días, con navegación de semana en semana; las semanas pasadas en solo lectura.
- **2026-10-29** — ¿Nombre visible de la aplicación? → Kompitu, como sus dominios.
- **2026-10-30** — Bug reportado por el usuario: crea 2 tareas hoy, las completa (racha 1) y las quita; al quitarlas, el panel parpadea «Tu racha está en juego». Causa: mientras la API recalcula la racha, el panel combina el progreso de hoy ya actualizado (0 completadas) con la racha anterior (1). ¿Qué es «la racha actual» de RF-27? → La que devuelve la API tras el último cambio de las tareas de hoy. Mientras se recalcula, el panel no avisa de que la racha está en juego; avisa cuando llega y sigue cumpliéndose la condición. Pasa al completar, desmarcar o eliminar. Se corrige en T115.

## Registro de cambios

- **2026-10-29** — Creación del borrador con las 6 clarificaciones iniciales.
- **2026-10-29** — Resuelto el único `[NEEDS CLARIFICATION]` (S-09): la aplicación se llama Kompitu.
- **2026-10-29** — Revisión de cumplimiento de `CONSTITUTION.md` y `AGENTS.md`:
  - Añadido RF-46 con la tabla de todos los campos escribibles (CONSTITUTION IV.5) y CE-06 ligado a ella.
  - RF-02 y RF-17 remiten a RF-46.
  - RF-12 y RF-39 partidos en requisitos EARS de una sola acción (nuevos RF-47, RF-48 y RF-49).
  - RF-29 y RF-38 reescritos en EARS.
  - RF-41 hecho verificable.
  - Añadido RF-50 (navegación).
  - Rutas de las specs de la API corregidas.
  - Nuevos supuestos S-10 a S-12.
- **2026-10-29** — Responsive obligatorio (CONSTITUTION 1.2.0, VII.5 y VII.6): RNF-03 precisa los tres tamaños de comprobación y alcanza a todos los componentes; CE-06 incluye los tres tamaños y se añade CE-07.
- **2026-10-29** — Revisión EARS:
  - RF-15, RF-18, RF-38 y RF-50 divididos en un requisito por frase (nuevos RF-51 a RF-54).
  - RF-11, RF-28 y RF-37 pasan de evento a estado («Mientras»).
  - RF-06 reescrito con el patrón complejo «Mientras…, cuando…».
- **2026-10-29** — Spec aprobada por el usuario, con los supuestos S-01 a S-12, CE-01 (menos de 2 minutos) y el ancho mínimo de 360px de RNF-03. Estado → *Aprobada*.
- **2026-10-29** — Detectado al planificar: el token CSRF de la sesión solo llega al iniciar sesión y se perdería al recargar. Decisión del usuario: cambiar la API para que `GET /me` lo devuelva. Añadido como requisito previo; RNF-06 no cambia.
- **2026-10-30** — Todas las tareas de `tasks.md` hechas (T001–T114) y cada RF con su test, en Chromium y Firefox, en móvil, tablet y escritorio. Estado → *Implementada*. Los requisitos no cambian.
- **2026-10-30** — Clarificación de RF-27 por un bug (aviso de racha en juego que parpadea al quitar las tareas completadas de hoy): el aviso usa la racha recalculada tras el último cambio. El texto de RF-27 no cambia. Estado → *Aprobada* hasta terminar T115; después vuelve a *Implementada*.
- **2026-10-30** — T115 corregida y con sus tests en verde. Estado → *Implementada*.
