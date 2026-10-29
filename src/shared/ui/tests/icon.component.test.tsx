import { CalendarDays } from 'lucide-react';
import { render, screen } from '@testing-library/react';

import { Icon } from '../icon.component';

function svgIn(container: HTMLElement): SVGElement {
  const svg = container.querySelector('svg');
  if (svg === null) throw new Error('No se ha pintado el icono');
  return svg;
}

describe('Icon', () => {
  it('DESIGN.md: 20 px inline por defecto, trazo de 1.5 y color heredado', () => {
    const { container } = render(<Icon icon={CalendarDays} />);
    const svg = svgIn(container);
    expect(svg).toHaveAttribute('width', '20');
    expect(svg).toHaveAttribute('height', '20');
    expect(svg).toHaveAttribute('stroke-width', '1.5');
    expect(svg).toHaveAttribute('stroke', 'currentColor');
  });

  it('DESIGN.md: 24 px standalone', () => {
    const { container } = render(<Icon icon={CalendarDays} size="standalone" />);
    expect(svgIn(container)).toHaveAttribute('width', '24');
  });

  it('VII.4: sin etiqueta es decorativo y queda oculto a los lectores de pantalla', () => {
    const { container } = render(<Icon icon={CalendarDays} />);
    expect(svgIn(container)).toHaveAttribute('aria-hidden', 'true');
  });

  it('VII.4: con etiqueta tiene nombre accesible', () => {
    render(<Icon icon={CalendarDays} label="Calendario" />);
    expect(screen.getByRole('img', { name: 'Calendario' })).toBeInTheDocument();
  });
});
