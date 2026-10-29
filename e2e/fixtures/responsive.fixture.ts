import { expect, type Locator, type Page, type TestInfo } from '@playwright/test';

const TOUCH_TARGET_PX = 44;

// Roles de los elementos interactivos que se comprueban en cada pantalla
const INTERACTIVE_ROLES = ['button', 'link', 'textbox', 'combobox', 'checkbox'] as const;

function isMobile(testInfo: TestInfo): boolean {
  return testInfo.project.name.endsWith('-mobile');
}

// CONSTITUTION.md VII.5 en la pantalla actual: sin desplazamiento horizontal de la página y cada botón, enlace
// y campo visible dentro de la pantalla; en móvil, de al menos 44×44 px. `extra` añade campos sin rol propio
// (las contraseñas no son textbox)
export async function expectResponsive(page: Page, testInfo: TestInfo, extra: Locator[] = []): Promise<void> {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow, 'la página no debe desplazarse en horizontal').toBeLessThanOrEqual(0);

  const groups = await Promise.all(INTERACTIVE_ROLES.map((role) => page.getByRole(role).all()));
  for (const element of [...groups.flat(), ...extra]) {
    if (!(await element.isVisible())) continue;
    await element.scrollIntoViewIfNeeded();
    await expect(element).toBeInViewport();
    if (!isMobile(testInfo)) continue;
    const box = await element.boundingBox();
    expect(box?.width, 'ancho táctil mínimo en móvil').toBeGreaterThanOrEqual(TOUCH_TARGET_PX);
    expect(box?.height, 'alto táctil mínimo en móvil').toBeGreaterThanOrEqual(TOUCH_TARGET_PX);
  }
}
