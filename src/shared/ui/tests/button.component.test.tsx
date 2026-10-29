import { createRef } from 'react';
import { render, screen } from '@testing-library/react';

import { Button } from '../button.component';

describe('Button', () => {
  it('es un <button type="button"> por defecto, para no enviar formularios sin querer', () => {
    render(<Button>Guardar</Button>);
    expect(screen.getByRole('button', { name: 'Guardar' })).toHaveAttribute('type', 'button');
  });

  it('respeta type="submit"', () => {
    render(<Button type="submit">Enviar</Button>);
    expect(screen.getByRole('button', { name: 'Enviar' })).toHaveAttribute('type', 'submit');
  });

  it('VI.3: con as cambia el elemento y conserva sus props y el diseño', () => {
    render(
      <Button as="a" href="/history" variant="secondary">
        Historial
      </Button>,
    );
    const link = screen.getByRole('link', { name: 'Historial' });
    expect(link).toHaveAttribute('href', '/history');
    expect(link).not.toHaveAttribute('type');
    expect(link.className).toContain('border-primary');
  });

  it.each([
    ['primary', 'bg-primary'],
    ['secondary', 'border-primary'],
    ['ghost', 'hover:bg-surface-subtle'],
    ['destructive', 'bg-destructive'],
    ['link', 'hover:underline'],
  ] as const)('variante %s según DESIGN.md', (variant, expected) => {
    render(<Button variant={variant}>Acción</Button>);
    expect(screen.getByRole('button').className).toContain(expected);
  });

  it.each([
    ['sm', 'md:h-control-sm'],
    ['md', 'md:h-control-md'],
    ['lg', 'md:h-control-lg'],
  ] as const)('tamaño %s según DESIGN.md desde md', (size, expected) => {
    render(<Button size={size}>Acción</Button>);
    expect(screen.getByRole('button').className).toContain(expected);
  });

  it('VII.4: en móvil el objetivo táctil mide al menos 44×44 px', () => {
    render(<Button size="sm">Acción</Button>);
    expect(screen.getByRole('button').className).toContain('min-h-touch');
    expect(screen.getByRole('button').className).toContain('min-w-touch');
  });

  it('el foco es visible y el estado deshabilitado se ve al 40 %', () => {
    render(<Button disabled>Acción</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button.className).toContain('focus-ring');
    expect(button.className).toContain('disabled:opacity-40');
  });

  it('pasa la ref al elemento', () => {
    const ref = createRef<HTMLButtonElement>();
    render(<Button ref={ref}>Acción</Button>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });
});
