/// <reference types="node" />
import { readFileSync } from 'node:fs';

// Contraste de los tokens semánticos en claro y en oscuro (CONSTITUTION.md VII.4, spec RNF-02).
// Se lee el CSS real: si DESIGN.md cambia un color y rompe el contraste, este test falla
const css = readFileSync(new URL('../design-tokens.css', import.meta.url), 'utf8');

const MIN_TEXT_CONTRAST = 4.5;

type Theme = 'light' | 'dark';

// --color-x: #rrggbb;
const primitives = new Map(
  [...css.matchAll(/--color-([\w-]+):\s*(#[0-9a-f]{6})\s*;/gi)].map((m) => [m[1] ?? '', m[2] ?? '']),
);

// --x: light-dark(var(--color-a), var(--color-b));
const themed = new Map(
  [...css.matchAll(/--([\w-]+):\s*light-dark\(var\(--color-([\w-]+)\),\s*var\(--color-([\w-]+)\)\)/g)].map((m) => [
    m[1] ?? '',
    { light: m[2] ?? '', dark: m[3] ?? '' },
  ]),
);

// --color-x: var(--color-a); o var(--x); dentro de @theme inline
const aliases = new Map(
  [...css.matchAll(/--color-([\w-]+):\s*var\(--(?:color-)?([\w-]+)\)\s*;/g)].map((m) => [m[1] ?? '', m[2] ?? '']),
);

function resolve(token: string, theme: Theme): string {
  const direct = primitives.get(token);
  if (direct !== undefined) return direct;
  const pair = themed.get(token);
  if (pair !== undefined) return resolve(pair[theme], theme);
  const alias = aliases.get(token);
  if (alias !== undefined && alias !== token) return resolve(alias, theme);
  throw new Error(`Token sin resolver: ${token}`);
}

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r = 0, g = 0, b = 0] = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return ((high ?? 0) + 0.05) / ((low ?? 0) + 0.05);
}

const backgrounds = ['background', 'page', 'surface'];

// [texto, fondo]: parejas que la UI usa con texto de tamaño normal
const textPairs: [string, string][] = [
  ...backgrounds.flatMap((bg): [string, string][] => [
    ['foreground', bg],
    ['foreground-muted', bg],
    ['primary-text', bg],
    ['danger-text', bg],
    ['placeholder', bg],
  ]),
  ['foreground', 'surface-subtle'],
  ['foreground-muted', 'surface-subtle'],
  ['white', 'primary'],
  ['white', 'destructive'],
  ['badge-default-fg', 'badge-default-bg'],
  ['badge-primary-fg', 'badge-primary-bg'],
  ['badge-success-fg', 'badge-success-bg'],
  ['badge-warning-fg', 'badge-warning-bg'],
  ['badge-danger-fg', 'badge-danger-bg'],
];

const themes: Theme[] = ['light', 'dark'];

describe('RNF-02: contraste mínimo de 4.5:1 entre texto y fondo', () => {
  it.each(themes.flatMap((theme) => textPairs.map(([text, bg]) => ({ theme, text, bg }))))(
    'RNF-02: $text sobre $bg en modo $theme',
    ({ theme, text, bg }) => {
      expect(contrast(resolve(text, theme), resolve(bg, theme))).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST);
    },
  );
});
