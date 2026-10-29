import { useEffect, useEffectEvent, useRef, type RefObject } from 'react';

// Elementos que reciben el foco con Tab; los de tabindex="-1" quedan fuera del orden
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]',
]
  .map((selector) => `${selector}:not([tabindex="-1"])`)
  .join(',');

function focusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
}

// Siguiente elemento al pulsar Tab, o null si el navegador puede seguir solo sin salir del contenedor
function nextFocusTarget(container: HTMLElement, backwards: boolean): HTMLElement | null {
  const items = focusableElements(container);
  const first = items[0];
  const last = items.at(-1);
  if (first === undefined || last === undefined) return container;
  const current = document.activeElement;
  if (current === null || !container.contains(current)) return backwards ? last : first;
  if (backwards && current === first) return last;
  if (!backwards && current === last) return first;
  return null;
}

interface FocusTrapOptions {
  active: boolean;
  onEscape: () => void;
}

// Foco atrapado de un modal (DESIGN.md Accessibility: Tab y Escape): al activarse enfoca el primer elemento,
// Tab no sale del contenedor, Escape avisa y al terminar el foco vuelve a donde estaba (el disparador)
export function useFocusTrap<T extends HTMLElement>({ active, onEscape }: FocusTrapOptions): RefObject<T | null> {
  const containerRef = useRef<T>(null);
  // El último onEscape sin reiniciar la trampa cuando cambia (un reinicio movería el foco)
  const escape = useEffectEvent(onEscape);

  useEffect(() => {
    const container = containerRef.current;
    if (!active || container === null) return;

    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    (focusableElements(container)[0] ?? container).focus();

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        event.preventDefault();
        escape();
        return;
      }
      if (event.key !== 'Tab') return;
      const target = nextFocusTarget(container, event.shiftKey);
      if (target === null) return;
      event.preventDefault();
      target.focus();
    };

    document.addEventListener('keydown', handleKeyDown);
    // Limpieza: deja de escuchar y devuelve el foco (CONSTITUTION.md VI.6)
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [active]);

  return containerRef;
}
