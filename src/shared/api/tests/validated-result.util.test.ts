import { z } from 'zod';

import { toApiError } from '../api-error.util';
import { CONTRACT_ERROR, validatedResult } from '../validated-result.util';

const schema = z.object({ id: z.string() });

describe('D-5: validatedResult', () => {
  it('devuelve data validada del sobre de éxito', () => {
    const result = validatedResult({ data: { success: true, status: 200, message: 'ok', data: { id: 'a' } } }, schema);
    expect(result).toEqual({ data: { id: 'a' } });
  });

  it('propaga el error de la petición', () => {
    const error = { status: 401, data: null };
    expect(validatedResult({ error }, schema)).toEqual({ error });
  });

  it('RF-44: una respuesta fuera de contrato es un error INTERNAL_ERROR', () => {
    const result = validatedResult({ data: { success: true, status: 200, message: 'ok', data: {} } }, schema);
    expect(result).toEqual({ error: CONTRACT_ERROR });
    expect(toApiError(CONTRACT_ERROR).code).toBe('INTERNAL_ERROR');
  });
});
