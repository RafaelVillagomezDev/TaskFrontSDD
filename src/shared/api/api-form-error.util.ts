import type { FieldValues, Path, UseFormReturn } from 'react-hook-form';

import { INVALID_FIELD_MESSAGE } from '../texts/errors.texts';
import { errorMessage, toApiError } from './api-error.util';

// Muestra un error de la API en un formulario sin borrar lo escrito (RF-41): cada campo que rechazó la API
// y que existe en el formulario lleva el mensaje propio del cliente; si no hay ninguno, el mensaje del
// código va al error general (root.server)
export function showApiError<T extends FieldValues>(
  form: UseFormReturn<T>,
  error: unknown,
  fields: readonly Path<T>[],
): void {
  const { code, invalidFields } = toApiError(error);
  const known = fields.filter((field) => invalidFields.includes(field));
  for (const field of known) form.setError(field, { message: INVALID_FIELD_MESSAGE });
  if (known.length === 0) form.setError('root.server', { message: errorMessage(code) });
}
