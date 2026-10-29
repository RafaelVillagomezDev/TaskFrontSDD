import { useRef, type BaseSyntheticEvent } from 'react';

type Submit = (event?: BaseSyntheticEvent) => Promise<void>;

// Envío único de un formulario (spec RF-19): mientras un envío está en curso descarta los siguientes.
// El botón deshabilitado no basta: la validación es asíncrona y un doble clic o dos Enter seguidos llegan
// antes de que se repinte. Una ref y no estado, porque el segundo envío llega antes del siguiente render
export function useSingleSubmit(submit: Submit): (event?: BaseSyntheticEvent) => void {
  const inFlight = useRef(false);
  return (event) => {
    // También el envío descartado evita el envío nativo del formulario, que recargaría la página
    event?.preventDefault();
    if (inFlight.current) return;
    inFlight.current = true;
    void (async () => {
      try {
        await submit(event);
      } finally {
        inFlight.current = false;
      }
    })();
  };
}
