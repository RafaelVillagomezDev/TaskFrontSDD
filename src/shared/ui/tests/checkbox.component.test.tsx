import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Checkbox } from '../checkbox.component';

describe('Checkbox', () => {
  it('es una casilla nativa con el nombre de su etiqueta, que se marca con clic y con la barra espaciadora', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(
      <label>
        <Checkbox onChange={onChange} />
        Comprar pan
      </label>,
    );
    const checkbox = screen.getByRole('checkbox', { name: 'Comprar pan' });
    await user.click(checkbox);
    checkbox.focus();
    await user.keyboard(' ');
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it('VII.4: la zona pulsable mide 44×44 px en móvil y la casilla visible 24 px, oculta a los lectores', () => {
    const { container } = render(<Checkbox aria-label="Hecha" />);
    const hitArea = container.firstElementChild;
    expect(hitArea?.className).toContain('size-touch');
    expect(screen.getByRole('checkbox').className).toContain('size-full');
    const visual = container.querySelector('[aria-hidden="true"]');
    expect(visual?.className).toContain('size-icon-lg');
  });

  it('refleja el estado marcado y el foco con los tokens de DESIGN.md', () => {
    const { container } = render(<Checkbox aria-label="Hecha" defaultChecked />);
    expect(screen.getByRole('checkbox')).toBeChecked();
    const visual = container.querySelector('[aria-hidden="true"]');
    expect(visual?.className).toContain('peer-checked:bg-primary');
    expect(visual?.className).toContain('peer-focus-visible:outline-primary');
    // El contorno nativo rodearía la zona transparente de 44 px: el foco visible es el de la casilla
    expect(screen.getByRole('checkbox').className).toContain('outline-none');
  });
});
