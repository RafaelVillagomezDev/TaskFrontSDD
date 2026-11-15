import { parseEnv } from '../env.schema';

const SITE_KEY = '1x00000000000000000000AA';
const VALID = { VITE_API_URL: 'https://apikompitu.yandrydev.cloud', VITE_TURNSTILE_SITE_KEY: SITE_KEY };

describe('parseEnv', () => {
  it('devuelve la URL de la API y la site key cuando las variables son válidas', () => {
    expect(parseEnv(VALID)).toEqual({ apiUrl: 'https://apikompitu.yandrydev.cloud', turnstileSiteKey: SITE_KEY });
  });

  it('quita la barra final para poder concatenar rutas', () => {
    expect(parseEnv({ ...VALID, VITE_API_URL: 'http://localhost:3000/' }).apiUrl).toBe('http://localhost:3000');
  });

  it('falla con un mensaje claro si falta VITE_API_URL', () => {
    expect(() => parseEnv({ VITE_TURNSTILE_SITE_KEY: SITE_KEY })).toThrow(/VITE_API_URL/);
  });

  it('falla si VITE_API_URL no es una URL', () => {
    expect(() => parseEnv({ ...VALID, VITE_API_URL: 'localhost' })).toThrow(/VITE_API_URL/);
  });

  it('falla si la fuente no es un objeto', () => {
    expect(() => parseEnv(undefined)).toThrow(/VITE_API_URL/);
  });

  it('RF-11: falla con un mensaje claro si falta VITE_TURNSTILE_SITE_KEY', () => {
    expect(() => parseEnv({ VITE_API_URL: VALID.VITE_API_URL })).toThrow(/VITE_TURNSTILE_SITE_KEY/);
  });

  it('RF-11: falla si VITE_TURNSTILE_SITE_KEY está vacía o solo tiene espacios', () => {
    expect(() => parseEnv({ ...VALID, VITE_TURNSTILE_SITE_KEY: '  ' })).toThrow(/VITE_TURNSTILE_SITE_KEY/);
  });
});
