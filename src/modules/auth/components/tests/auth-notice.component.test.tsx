import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

import { AuthNotice } from '../auth-notice.component';
import { AuthSwitch } from '../auth-switch.component';

describe('AuthNotice', () => {
  it('anuncia su contenido como estado', () => {
    render(<AuthNotice>Cuenta creada.</AuthNotice>);
    expect(screen.getByRole('status')).toHaveTextContent('Cuenta creada.');
  });
});

describe('AuthSwitch', () => {
  it('pregunta y enlace a la otra pantalla, con 44 px de alto en móvil', () => {
    render(
      <MemoryRouter>
        <AuthSwitch>
          ¿Ya tienes cuenta?
          <AuthSwitch.Link to="/login">Iniciar sesión</AuthSwitch.Link>
        </AuthSwitch>
      </MemoryRouter>,
    );
    const link = screen.getByRole('link', { name: 'Iniciar sesión' });
    expect(link).toHaveAttribute('href', '/login');
    expect(link.className).toContain('min-h-touch');
    expect(screen.getByText(/¿Ya tienes cuenta\?/)).toBeInTheDocument();
  });
});
