import { z } from 'zod';

// Zod sin compilación JIT (spec 004 RNF-01, plan D-8): al arrancar, Zod 4 prueba si puede crear funciones con
// Function(''). La política de contenido (sin 'unsafe-eval') y Trusted Types lo bloquean y dejaban un error en la
// consola. Con jitless no lo prueba y valida igual, interpretando los esquemas. Se importa lo primero en main.tsx
z.config({ jitless: true });
