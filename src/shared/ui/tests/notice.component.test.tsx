import { render, screen } from '@testing-library/react';

import { Notice } from '../notice.component';

describe('Notice', () => {
  it('anuncia su contenido como estado', () => {
    render(<Notice>Cuenta creada.</Notice>);
    expect(screen.getByRole('status')).toHaveTextContent('Cuenta creada.');
  });
});
