import { API_ERROR_CODES, errorMessage, toApiError } from '../api-error.util';

describe('toApiError', () => {
  it('RF-41: convierte un error de la API en código y errores por campo', () => {
    const error = toApiError({
      status: 400,
      data: {
        success: false,
        status: 400,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'La petición no es válida.',
          details: [
            { field: 'title', message: 'El título es obligatorio.' },
            { field: 'date', message: 'La fecha no es válida.' },
          ],
        },
      },
    });
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.fieldErrors).toEqual({ title: 'El título es obligatorio.', date: 'La fecha no es válida.' });
  });

  it('RF-44: un fallo de red se trata como NETWORK_ERROR', () => {
    expect(toApiError({ status: 'FETCH_ERROR', error: 'TypeError: Failed to fetch' }).code).toBe('NETWORK_ERROR');
  });

  it('RF-44: una respuesta fuera de contrato o un código desconocido se tratan como INTERNAL_ERROR', () => {
    expect(toApiError({ status: 500, data: '<html>' }).code).toBe('INTERNAL_ERROR');
    expect(
      toApiError({ status: 418, data: { success: false, status: 418, error: { code: 'TEAPOT', message: 'x' } } }).code,
    ).toBe('INTERNAL_ERROR');
    expect(toApiError(undefined).code).toBe('INTERNAL_ERROR');
  });
});

describe('errorMessage', () => {
  it.each(API_ERROR_CODES)('RF-41: %s tiene un mensaje propio en español, sin el código técnico', (code) => {
    const message = errorMessage(code);
    expect(message.length).toBeGreaterThan(0);
    expect(message).not.toContain(code);
  });
});
