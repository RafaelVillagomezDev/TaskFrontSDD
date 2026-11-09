import { safeReturnTo } from '../return-to.util';

describe('safeReturnTo', () => {
  it.each([
    ['https://ejemplo.com'],
    ['//ejemplo.com'],
    ['/\\ejemplo.com'],
    ['/%5Cejemplo.com'],
    ['/%5cejemplo.com'],
    ['\\\\ejemplo.com'],
    ['javascript:alert(1)'],
    ['data:text/html,hola'],
    ['tablero'],
    [''],
    ['/history\nSet-Cookie: x=1'],
    ['/history%0Ax'],
    ['/%2F%2Fejemplo.com'],
  ])('RF-08: «%s» no es una ruta de la aplicación y lleva al tablero', (value) => {
    expect(safeReturnTo(value)).toBe('/');
  });

  it('RF-08: sin valor lleva al tablero', () => {
    expect(safeReturnTo(null)).toBe('/');
  });

  it.each([
    ['/history?status=completed&page=2'],
    ['/pomodoro/history/3f1c9a2e-5b7d-4c1a-9e8f-1a2b3c4d5e6f'],
    ['/taskday'],
    ['/pomodoro#resultado'],
  ])('RF-08: «%s» es una ruta de la aplicación y vuelve a ella con su búsqueda', (value) => {
    expect(safeReturnTo(value)).toBe(value);
  });
});
