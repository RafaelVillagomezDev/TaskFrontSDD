import { render, screen } from '@testing-library/react';

import { Text } from '../text.component';

describe('Text', () => {
  it('cada variante usa su elemento semántico por defecto', () => {
    render(
      <>
        <Text variant="h1">Tablero</Text>
        <Text variant="h3">Hoy</Text>
        <Text>Texto</Text>
      </>,
    );
    expect(screen.getByRole('heading', { level: 1, name: 'Tablero' }).className).toContain('text-h1');
    expect(screen.getByRole('heading', { level: 3, name: 'Hoy' }).className).toContain('text-h3');
    expect(screen.getByText('Texto').tagName).toBe('P');
  });

  it('VI.3: con as cambia el elemento sin cambiar el estilo', () => {
    render(
      <Text variant="h1" as="h2">
        Historial
      </Text>,
    );
    const heading = screen.getByRole('heading', { level: 2, name: 'Historial' });
    expect(heading.className).toContain('text-h1');
  });

  it.each([
    ['default', 'text-foreground'],
    ['muted', 'text-foreground-muted'],
    ['primary', 'text-primary-text'],
    ['danger', 'text-danger-text'],
  ] as const)('tono %s con su token semántico', (tone, expected) => {
    render(<Text tone={tone}>x</Text>);
    expect(screen.getByText('x').className).toContain(expected);
  });

  it('acepta props del elemento elegido', () => {
    render(
      <Text as="label" htmlFor="title">
        Título
      </Text>,
    );
    expect(screen.getByText('Título')).toHaveAttribute('for', 'title');
  });
});
