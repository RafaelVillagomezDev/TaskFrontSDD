import { cn } from '../class-names.util';

describe('cn', () => {
  it('une las clases y descarta las condicionales que no aplican', () => {
    expect(cn('a', false, 'b', null, undefined, '', 'c')).toBe('a b c');
  });

  it('devuelve una cadena vacía si no queda ninguna clase', () => {
    expect(cn(false, undefined)).toBe('');
  });
});
