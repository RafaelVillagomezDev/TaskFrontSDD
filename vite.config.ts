import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

// Alias de importación: los mismos que "paths" en tsconfig.app.json y moduleNameMapper en jest.config.ts
const fromRoot = (path: string): string => fileURLToPath(new URL(path, import.meta.url));

// Servidor accesible desde fuera del contenedor en el puerto que espera CORS_ORIGIN de TaskApiSDD
export default defineConfig({
  plugins: [react(), tailwindcss()],
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
  },
  preview: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
  },
});
