import { Input, type InputProps } from './input.component';

// Fecha AAAA-MM-DD con el selector nativo del navegador; reutiliza Input (CONSTITUTION.md VI.5)
export function DateInput(props: Omit<InputProps, 'type'>) {
  return <Input {...props} type="date" />;
}
