import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithStartForm } from '../../tests/start-form.harness';
import { DurationPicker } from '../duration-picker.component';

function renderPicker() {
  return renderWithStartForm((startForm) => <DurationPicker startForm={startForm} />);
}

describe('DurationPicker', () => {
  it('RF-06: ofrece 15, 25, 45 y 60 minutos y «Otra», con 25 elegida, en un grupo con nombre', () => {
    renderPicker();
    expect(screen.getByRole('group', { name: 'Duración' })).toBeInTheDocument();
    const names = screen.getAllByRole('radio').map((radio) => radio.closest('label')?.textContent);
    expect(names).toEqual(['15 min', '25 min', '45 min', '60 min', 'Otra']);
    expect(screen.getByRole('radio', { name: '25 min' })).toBeChecked();
  });

  it('RF-55: el campo de minutos solo aparece con «Otra»', async () => {
    const user = userEvent.setup();
    renderPicker();
    expect(screen.queryByLabelText('Minutos')).not.toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: 'Otra' }));

    expect(screen.getByLabelText('Minutos')).toHaveAttribute('inputmode', 'numeric');
    expect(screen.getByText('Entre 1 y 120 minutos.')).toBeInTheDocument();
  });

  it('se usa solo con el teclado: Tab llega a la elegida y las flechas cambian de duración', async () => {
    const user = userEvent.setup();
    renderPicker();

    await user.tab();
    expect(screen.getByRole('radio', { name: '25 min' })).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('radio', { name: '45 min' })).toBeChecked();
  });

  it('cada opción mide al menos 44 px de alto (objetivo táctil)', () => {
    renderPicker();
    const option = screen.getByText('15 min');
    expect(option.className).toContain('min-h-touch');
  });
});
