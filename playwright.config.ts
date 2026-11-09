import { defineConfig, type Project } from '@playwright/test';

// Tamaños de pantalla de CONSTITUTION.md VII.5
const viewports = {
  mobile: { width: 360, height: 800 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1280, height: 800 },
};

type E2eBrowser = 'chromium' | 'firefox';

const browsers: readonly E2eBrowser[] = ['chromium', 'firefox'];

// 6 proyectos: cada navegador en cada tamaño (AGENTS.md §2)
const projects: Project[] = browsers.flatMap((browserName) =>
  Object.entries(viewports).map(([size, viewport]) => ({
    name: `${browserName}-${size}`,
    use: { browserName, viewport },
  })),
);

export default defineConfig({
  testDir: './e2e/specs',
  testMatch: '**/*.e2e.ts',
  globalSetup: './e2e/global-setup.ts',
  // Cada test usa su propia cuenta (freshAccount), así que también los de un mismo fichero se reparten entre los
  // workers (003 plan D-14). Si la API no aguanta la carga, se limita workers, no se vuelve al modo serie (R-7)
  fullyParallel: true,
  // Resuelve el alias @shared/* de las E2E (tsconfig.json raíz solo tiene referencias)
  tsconfig: './tsconfig.e2e.json',
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    // El contenedor e2e usa la red del host: misma URL que en el navegador del desarrollador (plan R-2)
    baseURL: 'http://localhost:5173',
    locale: 'es-ES',
    trace: 'retain-on-failure',
  },
  projects,
});
