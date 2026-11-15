import { render, screen } from '@testing-library/react';

import { SessionAnnouncements } from '../session-announcements.component';

describe('SessionAnnouncements', () => {
  it('RNF-02: dos <output> fuera de la vista con los anuncios de las acciones y del temporizador', () => {
    const { container } = render(<SessionAnnouncements action="Sesión en pausa." timer="Quedan 5 minutos." />);
    const outputs = screen.getAllByRole('status');
    expect(outputs.map((output) => output.textContent)).toEqual(['Sesión en pausa.', 'Quedan 5 minutos.']);
    expect(container.firstElementChild?.className).toContain('sr-only');
  });
});
