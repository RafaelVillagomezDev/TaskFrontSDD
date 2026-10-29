import { parseEnv } from '../env.schema';

describe('parseEnv', () => {
  it('devuelve la URL de la API cuando VITE_API_URL es válida', () => {
    expect(parseEnv({ VITE_API_URL: 'https://apikompitu.yandrydev.cloud' })).toEqual({
      apiUrl: 'https://apikompitu.yandrydev.cloud',
    });
  });

  it('quita la barra final para poder concatenar rutas', () => {
    expect(parseEnv({ VITE_API_URL: 'http://localhost:3000/' }).apiUrl).toBe('http://localhost:3000');
  });

  it('falla con un mensaje claro si falta VITE_API_URL', () => {
    expect(() => parseEnv({})).toThrow(/VITE_API_URL/);
  });

  it('falla si VITE_API_URL no es una URL', () => {
    expect(() => parseEnv({ VITE_API_URL: 'localhost' })).toThrow(/VITE_API_URL/);
  });

  it('falla si la fuente no es un objeto', () => {
    expect(() => parseEnv(undefined)).toThrow(/VITE_API_URL/);
  });
});
