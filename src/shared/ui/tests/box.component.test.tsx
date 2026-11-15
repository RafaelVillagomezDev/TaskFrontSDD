import { render, screen } from '@testing-library/react';

import { Box } from '../box.component';

describe('Box', () => {
  it('es un <div> sin estilo de superficie por defecto', () => {
    render(<Box>contenido</Box>);
    const box = screen.getByText('contenido');
    expect(box.tagName).toBe('DIV');
    expect(box.className).not.toContain('bg-surface');
  });

  it('variante card según DESIGN.md: superficie, borde, radius-lg, space-6 y shadow-md', () => {
    render(<Box variant="card">tarjeta</Box>);
    const classes = screen.getByText('tarjeta').className;
    for (const expected of ['bg-surface', 'border-border', 'rounded-lg', 'p-6', 'shadow-md']) {
      expect(classes).toContain(expected);
    }
  });

  it('VI.3: con as cambia el elemento y conserva sus props', () => {
    render(
      <Box as="section" variant="subtle" aria-label="Rachas">
        x
      </Box>,
    );
    const section = screen.getByRole('region', { name: 'Rachas' });
    expect(section.className).toContain('bg-surface-subtle');
  });
});
