import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';

import { TurnstileField } from '../turnstile-field.component';

describe('TurnstileField', () => {
  it('RF-01: entrega su contenedor al hook para que Cloudflare pinte el widget', () => {
    const containerRef = jest.fn<(element: HTMLElement | null) => void>();
    render(<TurnstileField containerRef={containerRef}>Comprobación completada.</TurnstileField>);
    expect(containerRef).toHaveBeenCalledWith(expect.any(HTMLDivElement));
  });

  it('RNF-01: anuncia el estado de la comprobación a los lectores de pantalla', () => {
    render(<TurnstileField containerRef={() => undefined}>Comprobación completada.</TurnstileField>);
    expect(screen.getByText('Comprobación completada.')).toHaveAttribute('aria-live', 'polite');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('RF-03, RF-06: muestra el mensaje bajo el widget como una alerta', () => {
    render(
      <TurnstileField containerRef={() => undefined} errorText="Completa la comprobación de seguridad.">
        Comprobación de seguridad pendiente.
      </TurnstileField>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Completa la comprobación de seguridad.');
  });
});
