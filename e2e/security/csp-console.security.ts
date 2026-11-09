import { expect, test } from '@playwright/test';

// Recorre las pantallas públicas de la imagen pre con la política de contenido real (spec 004 RNF-01, plan R-2) y
// recoge cada infracción que informa el navegador (evento securitypolicyviolation), también las de Trusted Types.
// Las pantallas privadas no se pueden recorrer aquí: la API solo admite el origen de desarrollo (CORS)
interface Violation {
  directive: string;
  blocked: string;
}

const PUBLIC_SCREENS = ['/login', '/register'];

test('RNF-01: las pantallas de la imagen de producción no producen ninguna infracción de la política', async ({
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
    // Las fuentes y los estilos ya se han pedido cuando el título está visible; se espera a que la red quede quieta
    await page.waitForLoadState('networkidle');
    const violations = await page.evaluate((): unknown => Reflect.get(window, '__cspViolations'));
    expect(violations, screen).toEqual([]);
  }
});
