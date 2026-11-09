import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

// Alias de importación: los mismos que "paths" en tsconfig.app.json y moduleNameMapper en jest.config.ts
const fromRoot = (path: string): string => fileURLToPath(new URL(path, import.meta.url));

// Fuentes: nunca se incrustan en el CSS como data:, porque la política de contenido solo las admite como ficheros
// (font-src, spec 004 RNF-01, plan D-9). El resto de recursos sigue la regla de Vite (menos de 4 KB, incrustado)
const FONT_FILE = /\.(woff2?|ttf|otf|eot)$/i;

const inlineAsset = (filePath: string): boolean | undefined => (FONT_FILE.test(filePath) ? false : undefined);

// Servidor accesible desde fuera del contenedor en el puerto que espera CORS_ORIGIN de TaskApiSDD
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    assetsInlineLimit: inlineAsset,
  },
  resolve: {
    alias: [
      { find: /^@shared\//, replacement: `${fromRoot('./src/shared')}/` },
      // Solo el index.ts público de cada módulo (CONSTITUTION.md, fronteras entre módulos)
      { find: /^@modules\/([^/]+)$/, replacement: `${fromRoot('./src/modules')}/$1/index.ts` },
    ],
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    // Carpetas generadas: cada HTML escrito en ellas (cobertura, informes de Playwright) recargaba todas las
    // pestañas abiertas, también las de las E2E en curso
    watch: {
      ignored: [
        '**/coverage/**',
        '**/playwright-report/**',
        '**/test-results/**',
        '**/blob-report/**',
        '**/dist/**',
        '**/graphify-out/**',
        '**/.playwright-mcp/**',
        '**/.nginx-logs/**',
      ],
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
  },
});
