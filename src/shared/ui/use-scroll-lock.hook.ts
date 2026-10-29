import { useEffect } from 'react';

// Bloquea el scroll de la página detrás de un modal o un drawer. Cada bloqueo restaura el valor que encontró,
// así que varios anidados se liberan en orden
export function useScrollLock(active: boolean): void {
  useEffect(() => {
    if (!active) return;
    const { body } = document;
    const previousOverflow = body.style.overflow;
    body.style.overflow = 'hidden';
    return () => {
      body.style.overflow = previousOverflow;
    };
  }, [active]);
}
