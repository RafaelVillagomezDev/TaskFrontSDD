import { createContext, use, type Context } from 'react';

interface CompoundContext<T> {
  Context: Context<T | null>;
  // Lee el estado del padre; un subcomponente fuera de su padre lanza un error (CONSTITUTION.md VI.2)
  usePart: (part: string) => T;
}

// Contexto interno de un compound component: solo lo usan el componente y su hook, nunca se exporta a los módulos
export function createCompoundContext<T>(rootName: string): CompoundContext<T> {
  const Context = createContext<T | null>(null);
  const usePart = (part: string): T => {
    const value = use(Context);
    if (value === null) throw new Error(`<${rootName}.${part}> debe usarse dentro de <${rootName}>`);
    return value;
  };
  return { Context, usePart };
}
