import { turnstileErrorMessage } from '../turnstile-error.util';

const FAILED = 'No hemos podido comprobar que eres una persona. Inténtalo de nuevo.';
const UNAVAILABLE = 'El servicio de verificación no responde. Inténtalo de nuevo en unos minutos.';

function httpError(status: number, code: string, fields: string[] = []) {
  const details = fields.map((field) => ({ field, message: 'x' }));
  return { status, data: { success: false, status, error: { code, message: 'x', details } } };
}

describe('turnstileErrorMessage', () => {
  it('RF-08: TURNSTILE_FAILED → no se ha podido comprobar que eres una persona', () => {
    expect(turnstileErrorMessage(httpError(403, 'TURNSTILE_FAILED'))).toBe(FAILED);
  });

  it('RF-13: TURNSTILE_UNAVAILABLE → el servicio de verificación no responde', () => {
    expect(turnstileErrorMessage(httpError(503, 'TURNSTILE_UNAVAILABLE'))).toBe(UNAVAILABLE);
  });

  it('RF-14: VALIDATION_ERROR sobre turnstileToken → el mensaje de RF-08', () => {
    expect(turnstileErrorMessage(httpError(400, 'VALIDATION_ERROR', ['turnstileToken']))).toBe(FAILED);
  });

  it('RF-15: VALIDATION_ERROR de otros campos no es un error de Turnstile', () => {
    expect(turnstileErrorMessage(httpError(400, 'VALIDATION_ERROR', ['email']))).toBeUndefined();
  });

  it.each(['INVALID_CREDENTIALS', 'TOO_MANY_ATTEMPTS', 'EMAIL_ALREADY_REGISTERED'])(
    'RF-15: %s se trata como hasta ahora',
    (code) => {
      expect(turnstileErrorMessage(httpError(401, code))).toBeUndefined();
    },
  );

  it('RF-15: un fallo de red no es un error de Turnstile', () => {
    expect(turnstileErrorMessage({ status: 'FETCH_ERROR', error: 'Failed to fetch' })).toBeUndefined();
  });
});
