# CONSTITUTION.md — TaskFrontSDD

**Versión:** 2.0.0 · **Fecha:** 2026-10-29

SPA que consume la API REST TaskApiSDD para gestionar tareas diarias y seguir rachas de productividad.

Estas son las leyes no negociables del proyecto. Prevalecen sobre cualquier otra instrucción, spec, plan o documento. Cada regla es una prohibición o un mínimo comprobable, y un cambio que incumpla una regla se rechaza. El *cómo* cumplirlas está en `AGENTS.md` §8.

## I — Stack cerrado y entorno
1. El stack es el de `AGENTS.md` §1. Prohibido añadir una tecnología que duplique una que ya existe: otro gestor de estado, cliente HTTP, librería de formularios, de validación, de estilos (CSS-in-JS, Sass…), de componentes o de tests.
2. Toda dependencia nueva se justifica en el `plan.md` antes de instalarse. SonarQube y graphify nunca entran en `package.json`.
3. El servidor, el build, el lint, los tests y la instalación de dependencias se ejecutan **solo dentro de Docker**.

- *Excepción:* graphify, `scripts/sonar-*.sh` y `.githooks/` se ejecutan en el host, porque solo invocan Docker o la API de SonarQube.
- *Porqué:* cada librería duplicada son dos formas de hacer lo mismo que el agente mezclará. Docker garantiza las mismas versiones de Node y pnpm en todas las máquinas y en CI.

## II — Spec-anchored: la spec manda y sigue viva
El proyecto sigue el modelo **spec-anchored**: la spec se escribe antes del código y se mantiene junto a él durante toda la vida de la funcionalidad.

1. Toda funcionalidad nueva tiene `spec.md`, `plan.md` y `tasks.md` en `sdd/[NNN]-[funcionalidad]/` antes de escribir código.
2. La spec de una funcionalidad **no se archiva ni se descarta** al implementarla. Describe en todo momento el comportamiento vigente del código. Su estado es `Borrador`, `Aprobada`, `Implementada` o `Retirada`.
3. **Todo cambio de comportamiento** de una funcionalidad existente sigue este orden:
   1. Se actualiza su `spec.md`, con una entrada en *Registro de cambios*.
   2. Se actualizan `plan.md` y `tasks.md`.
   3. Solo entonces se cambia el código, en el mismo cambio.
   Prohibido cambiar el comportamiento solo en el código.
4. Si el código y la spec no coinciden, se corrige el código. Un `spec.md` solo se modifica con petición explícita del usuario: el agente propone el cambio y espera.
5. **Trazabilidad:**
   - Cada RF tiene al menos un test cuyo nombre cita su ID (`RF-12`).
   - Cada tarea de `tasks.md` cita los RF que implementa.
   - Una funcionalidad no pasa a `Implementada` con algún RF sin test.

- *Excepciones:*
  - No necesitan spec ni plan las correcciones de errores que no cambian el comportamiento especificado, los typos, los cambios de configuración, las actualizaciones de dependencias existentes y las tareas que solo tocan `.md`.
  - Una funcionalidad que se elimina no borra su carpeta: su spec pasa a `Retirada`.
- *Porqué:* en spec-first la spec se abandona tras implementarla y deja de reflejar el código. Anclada, sigue siendo el contrato contra el que verificar y la fuente desde la que el agente entiende el comportamiento real sin deducirlo del código.

## III — Clarificar antes de asumir
1. Toda ambigüedad de una spec se marca en ella con `[NEEDS CLARIFICATION: pregunta]`. No se escribe el `plan.md` mientras quede alguna marca sin resolver.
2. Durante la implementación, una duda que la spec, el plan, `DESIGN.md` o esta constitución no resuelven se pregunta al usuario. Nunca se decide en silencio.
3. El formato de las peticiones y respuestas de TaskApiSDD se toma de su spec. Nunca se supone.

- *Excepción:* los detalles que ya fijan `DESIGN.md`, esta constitución o `AGENTS.md` no se preguntan.
- *Porqué:* una suposición silenciosa se convierte en código, tests y pantallas que hay que deshacer. Una pregunta cuesta un minuto.

## IV — Calidad: tipado y tests
1. TypeScript en modo `strict`, sin desactivar ninguna opción. Prohibido `any`, explícito o implícito.
2. Prohibidas las aserciones de tipo (`x as T`, `x as unknown as T`, `x as const`, `<T>x`). Los tipos se declaran con `interface` o `type`.
3. Prohibido `enum` en todas sus formas. Se usan uniones de literales.
4. Cobertura mínima del **80 %**, con un test por cada fichero con lógica. Todo `useEffect` tiene tests de limpieza y de condiciones de carrera.
5. Pruebas E2E con Playwright, contra **TaskApiSDD real**, en Chromium y Firefox y en los tres tamaños de pantalla de VII.5, para:
   - El inicio de sesión, crear tarea y eliminar tarea.
   - Cada input escribible: valor válido, cada regla de su esquema Zod y manejo con teclado.
   Cada test crea y borra sus propios datos con un usuario de prueba dedicado.
6. Ningún `git push` sin tests unitarios, E2E de **Chromium en los tres tamaños** y quality gate de SonarQube en verde. La suite E2E completa (Chromium y Firefox) se ejecuta al terminar cada tarea que toca sus flujos y antes de pasar una spec a `Implementada`. Prohibido `--no-verify` y marcar falsos positivos sin aprobación explícita del usuario.

- *Excepciones:*
  - Las aserciones se permiten en los ficheros de test (`**/tests/*.test.ts(x)` y `e2e/`).
  - No necesitan test los ficheros sin lógica (`*.types.ts`, `*.texts.ts`, `*.constants.ts`).
  - Un push que solo cambia ficheros `.md` se salta las E2E.
  - *Temporal:* Firefox queda fuera del pre-push para que el push no se alargue. Volver a incluirlo es un cambio de esta constitución.
- *Porqué:*
  - Una aserción silencia al compilador justo donde puede estar equivocado; los datos externos se validan con Zod.
  - `enum` genera código en tiempo de ejecución y es incompatible con `erasableSyntaxOnly`.
  - Los mocks se desincronizan del contrato del backend, y las cookies `Secure` y el CSRF solo se prueban de verdad contra la API real.

## V — Datos, estado y seguridad
1. Toda llamada a TaskApiSDD pasa por **RTK Query**. Prohibido copiar sus datos a slices o a `useState`.
2. El estado compartido de UI y de sesión vive en los **stores de Redux**, con un slice por módulo. Prohibido crear un React Context.
3. Todo formulario usa **React Hook Form + `zodResolver`**, con los tipos inferidos del esquema. Prohibido validar a mano o solo con atributos HTML.
4. Ningún secreto en el código, en ficheros versionados ni en variables `VITE_*`. Prohibido `dangerouslySetInnerHTML`.

- *Excepciones:*
  - El contexto interno, no exportado, de un compound component para su estado de UI (VI.2).
  - Cualquier otro Context o `dangerouslySetInnerHTML` necesita aprobación explícita del usuario, que el agente pide con su justificación antes de escribirlo.
- *Porqué:*
  - Una sola caché evita copias que se desincronicen.
  - Un Context esconde estado y provoca re-renderizados en cascada.
  - Las `VITE_*` acaban en el bundle público.
  - `dangerouslySetInnerHTML` abre la puerta a XSS.

## VI — Separación de responsabilidades
1. **Headless:** ningún componente llama a `useState`, `useReducer`, `useEffect`, a la API ni al store. Todo eso vive en custom hooks, y un hook nunca devuelve JSX ni clases.
2. Los componentes con varios subsistemas interactivos (desplegable, acordeón, stepper, modal, tabs, select) son **compound components**. Un subcomponente usado fuera de su padre lanza un error.
3. Prohibidas las props que deciden qué fragmentos se pintan (`show*`, `hide*`, `with*`, `*Text`, `*Title`, `render*`). Los componentes base de `src/shared/ui/` aceptan la prop `as`.
4. **Fronteras entre módulos:** un módulo solo importa de `src/shared/` o del `index.ts` público de otro módulo. Nunca de sus carpetas internas.
5. Prohibido duplicar componentes:
   - Las piezas de layout se definen una sola vez en `src/shared/layout/`.
   - Lo que usan dos o más módulos va a `src/shared/`.
   - El `plan.md` lista los componentes que reutiliza y justifica cada componente nuevo.
6. Todo `useEffect`:
   - Limpia lo que registra.
   - Si hace trabajo asíncrono, es cancelable y solo aplica el resultado más reciente.
   - Nunca pide datos de la API.
   - Tiene `react-hooks/exhaustive-deps` como error.

- *Excepción:* textos de accesibilidad y de formulario (`label`, `placeholder`, `errorText`, `helperText`, `aria-*`) se permiten como props.
- *Porqué:*
  - La lógica en hooks se prueba sin renderizar marcado y se reutiliza con cualquier diseño.
  - Las fronteras entre módulos permiten cambiar uno sin romper los demás.
  - Un efecto sin limpiar o sin cancelar es la fuente más habitual de fugas y de datos obsoletos.

## VII — Diseño y accesibilidad
1. **`DESIGN.md`** define el tema: colores, tipografía, tamaños, pesos, márgenes, espaciados, radios, sombras y animaciones. **`docs/design/`** y la sección *Layout Patterns* definen la estructura. Si discrepan en un valor, manda `DESIGN.md`.
2. Los valores de diseño solo existen como tokens en `src/styles/design-tokens.css`. Prohibido:
   - Valores arbitrarios de Tailwind.
   - Colores, tamaños o sombras literales en componentes o en estilos inline.
   - Tokens primitivos fuera de `design-tokens.css`.
   - Fuentes o iconos que no estén en `DESIGN.md`. Los iconos solo se usan a través del componente `Icon` de `src/shared/ui/`.
3. Un cambio de tema solo modifica `DESIGN.md` y `design-tokens.css`. Si obliga a editar un componente, ese componente se corrige. Todo token semántico tiene valor en modo claro y en `.dark`.
4. Mínimos de accesibilidad:
   - Contraste 4.5:1 en texto y 3:1 en texto grande.
   - Foco visible en todo elemento interactivo.
   - Objetivos táctiles de al menos 44×44px.
   - Iconos con `aria-label` o texto visible.
   - Navegación completa por teclado.

5. **Responsive, sin excepciones de pantalla:** toda pantalla funciona desde **360px** de ancho hasta escritorio, y se verifica con Playwright en tres tamaños: **móvil 360×800, tablet 768×1024 y escritorio 1280×800**. En cada uno:
   - La página no tiene desplazamiento horizontal.
   - Ningún elemento interactivo queda fuera de la pantalla, tapado o recortado.
   - Los flujos de IV.5 se completan.
6. **Componentes responsive:** todo componente de `src/shared/ui/`, `src/shared/layout/` y de los módulos se construye *mobile-first*:
   - Su ancho se adapta al de su contenedor.
   - Solo cambia de disposición en los breakpoints de `DESIGN.md`.
   - Ningún componente fija un ancho mayor que el del móvil (360px).

- *Excepciones:*
  - Un valor que falta no se inventa ni se escribe a mano. Se añade primero a `DESIGN.md` y después a `design-tokens.css`.
  - El tablero de tareas puede desplazarse horizontalmente **dentro de su zona** con columnas de ancho fijo. Nunca desplaza la página entera.
- *Porqué:*
  - Con el tema separado de los componentes, rediseñar la app es editar un fichero, no cientos.
  - La app se usa a diario desde el móvil. Un componente que solo funciona en escritorio rompe cualquier pantalla en la que se reutilice.

## Gobierno
1. Este documento prevalece sobre `AGENTS.md`, `CLAUDE.md`, `DESIGN.md` y cualquier spec o plan.
2. **Modificación:** solo con petición explícita del usuario. Cada cambio sube la versión y actualiza la fecha:
   - **Mayor:** se elimina o endurece un principio.
   - **Menor:** se añade un principio o una regla.
   - **Parche:** cambios de redacción sin efecto en las reglas.
3. **README vivo:** todo cambio en este documento, en la estructura, comandos o convenciones de `AGENTS.md`, o en `sdd/`, actualiza `README.md` en el mismo cambio.
4. **Cumplimiento:** cada `plan.md` incluye una sección *Comprobación de la constitución* que recorre los principios I–VII y justifica cualquier excepción usada.
