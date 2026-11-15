import { expect, test } from '@playwright/test';

// Recorre las pantallas públicas de la imagen pre con la política de contenido real (spec 004 RNF-01, plan R-2) y
// recoge cada infracción que informa el navegador (evento securitypolicyviolation), también las de Trusted Types.
// Las pantallas privadas no se pueden recorrer aquí: la API solo admite el origen de desarrollo (CORS)
interface Violation {
  directive: string;
  blocked: string;
}

const PUBLIC_SCREENS = ['/login', '/register'];

const TURNSTILE_ORIGIN = 'https://challenges.cloudflare.com';

test('RNF-01, 005 RF-09 y RF-10: las pantallas de la imagen de producción, con el widget de Turnstile, no producen ninguna infracción de la política', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const store: Violation[] = [];
    Object.defineProperty(window, '__cspViolations', { value: store });
    document.addEventListener('securitypolicyviolation', (event) => {
      store.push({ directive: event.effectiveDirective, blocked: event.blockedURI });
    });
  });

  for (const screen of PUBLIC_SCREENS) {
    await page.goto(screen);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    // Spec 005: el widget de Turnstile carga su script y su marco y supera la comprobación con la CSP real
    await expect(page.getByText('Comprobación completada.')).toBeVisible();
    expect(page.frames().some((frame) => frame.url().startsWith(TURNSTILE_ORIGIN)), screen).toBe(true);
    // Recursos y fuentes cargados. No se espera a que la red quede quieta: Turnstile mantiene sus propias peticiones
    await page.waitForLoadState('load');
    await page.evaluate(async () => {
      await document.fonts.ready;
    });
    const violations = await page.evaluate((): unknown => Reflect.get(window, '__cspViolations'));
    expect(violations, screen).toEqual([]);
  }
});
