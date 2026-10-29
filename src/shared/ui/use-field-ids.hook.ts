import { useId } from 'react';

interface FieldIdsInput {
  id?: string | undefined;
  helperText?: string | undefined;
  errorText?: string | undefined;
}

export interface FieldIds {
  controlId: string;
  helperId: string;
  errorId: string;
  // Ayuda y error que describen el campo, en ese orden (VII.4: el error se anuncia con el campo)
  describedBy: string | undefined;
}

// Relaciona etiqueta, ayuda y error con su campo
export function useFieldIds({ id, helperText, errorText }: FieldIdsInput): FieldIds {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const helperId = `${controlId}-help`;
  const errorId = `${controlId}-error`;
  const describedBy = [helperText === undefined ? '' : helperId, errorText === undefined ? '' : errorId]
    .filter((value) => value !== '')
    .join(' ');
  return { controlId, helperId, errorId, describedBy: describedBy === '' ? undefined : describedBy };
}
