/**
 * @jest-environment node
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// Movimiento de DESIGN.md (Motion & Animation), revisado con la skill review-animations
const css = readFileSync(join(process.cwd(), 'src/styles/design-tokens.css'), 'utf8');

const MAX_UI_MS = 300;

function animation(name: string): string {
  const match = new RegExp(`--animate-${name}:\\s*([^;]+);`).exec(css);
  if (match?.[1] === undefined) throw new Error(`No existe --animate-${name}`);
  return match[1];
}

describe('tokens de movimiento', () => {
  it.each([
    ['scale-in', 'scale-in 200ms var(--ease-out)'],
    ['fade-in', 'fade-in 150ms var(--ease-out)'],
    ['slide-in-left', 'slide-in-left 250ms var(--ease-drawer)'],
  ])('la entrada %s usa la duración y la curva de DESIGN.md', (name, value) => {
    expect(animation(name)).toBe(value);
  });

  it('ninguna entrada de interfaz pasa de 300 ms ni rebota', () => {
    for (const name of ['scale-in', 'fade-in', 'slide-in-left']) {
      const ms = Number(/(\d+)ms/.exec(animation(name))?.[1]);
      expect(ms).toBeLessThanOrEqual(MAX_UI_MS);
    }
    // Una curva con un valor de control por encima de 1 rebota
    expect(css).not.toMatch(/cubic-bezier\([^)]*1\.\d+/);
  });

  it('ease-out es una curva fuerte, no la del navegador', () => {
    expect(css).toContain('--ease-out: cubic-bezier(0.23, 1, 0.32, 1);');
    expect(css).toContain('--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);');
  });

  it('el modal parte de scale(0.95) y transparente, nunca de scale(0)', () => {
    expect(css).toMatch(/@keyframes scale-in \{\s*from \{\s*opacity: 0;\s*transform: scale\(0\.95\);/);
    expect(css).not.toContain('scale(0)');
  });

  it('con movimiento reducido no hay entradas ni transiciones', () => {
    expect(css).toMatch(/prefers-reduced-motion: reduce[\s\S]*animation-duration: 0\.01ms !important;/);
  });
});
