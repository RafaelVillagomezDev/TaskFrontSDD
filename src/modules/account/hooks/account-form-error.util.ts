import type { FieldValues, Path, UseFormReturn } from 'react-hook-form';

import { errorMessage, toApiError } from '../../../shared/api/api-error.util';
import { showApiError } from '../../../shared/api/api-form-error.util';

// Error de un formulario que pide la contraseña (plan §5.8): WRONG_PASSWORD va en ese campo (RF-48); el resto,
// como en cualquier formulario (TOO_MANY_ATTEMPTS, por ejemplo, al error general con el mensaje de RF-05)
export function showPasswordFormError<T extends FieldValues>(
  form: UseFormReturn<T>,
  error: unknown,
  passwordField: Path<T>,
  fields: readonly Path<T>[],
): void {
  const { code } = toApiError(error);
  if (code === 'WRONG_PASSWORD') {
    form.setError(passwordField, { message: errorMessage(code) });
    return;
  }
  showApiError(form, error, fields);
}
