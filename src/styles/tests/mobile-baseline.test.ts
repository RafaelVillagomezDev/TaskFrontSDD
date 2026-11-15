/**
 * @jest-environment node
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// Base táctil de la skill mobile-native, que no se ve en jsdom: se comprueba en los ficheros que la declaran
const html = readFileSync(join(process.cwd(), 'index.html'), 'utf8');
const css = readFileSync(join(process.cwd(), 'src/index.css'), 'utf8');

describe('base móvil (index.html e index.css)', () => {
  it('RNF-05: la barra del navegador toma el fondo de página de cada tema', () => {
    expect(html).toContain('<meta name="theme-color" media="(prefers-color-scheme: light)" content="#F7F5F2" />');
    expect(html).toContain('<meta name="theme-color" media="(prefers-color-scheme: dark)" content="#191816" />');
  });

  it('nunca impide hacer zoom', () => {
    expect(html).not.toMatch(/user-scalable=no|maximum-scale/);
  });

  it('sin destello al tocar, sin retardo de doble toque en controles y sin seleccionar el texto de los botones', () => {
    expect(css).toContain('-webkit-tap-highlight-color: transparent;');
    expect(css).toContain('touch-action: manipulation;');
    expect(css).toMatch(/button \{\s*user-select: none;/);
    // El contenido sigue siendo seleccionable
    expect(css).not.toMatch(/body \{[^}]*user-select/);
  });
});
