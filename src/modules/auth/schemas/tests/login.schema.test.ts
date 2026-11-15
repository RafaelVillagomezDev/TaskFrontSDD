import { loginSchema } from '../login.schema';

const VALID = { email: 'ana@example.com', password: 'x' };

function firstError(input: unknown, field: string): string | undefined {
  const result = loginSchema.safeParse(input);
  if (result.success) return undefined;
  return result.error.issues.find((issue) => issue.path[0] === field)?.message;
}

describe('RF-46 y S-12: loginSchema', () => {
  it('acepta un email válido y cualquier contraseña no vacía', () => {
    expect(loginSchema.parse(VALID)).toEqual(VALID);
  });

  it('RF-02: email obligatorio, también si solo tiene espacios', () => {
    expect(firstError({ ...VALID, email: '' }, 'email')).toBe('Escribe tu email.');
    expect(firstError({ ...VALID, email: '  ' }, 'email')).toBe('Escribe tu email.');
  });

  it('RF-46: email con formato, recortado', () => {
    expect(firstError({ ...VALID, email: 'ana.example.com' }, 'email')).toBe(
      'Escribe un email válido, como ana@ejemplo.com.',
    );
    expect(loginSchema.parse({ ...VALID, email: ' ana@example.com ' }).email).toBe('ana@example.com');
  });

  it('RF-02: contraseña obligatoria', () => {
    expect(firstError({ ...VALID, password: '' }, 'password')).toBe('Escribe tu contraseña.');
  });

  it('S-12: no valida la longitud de la contraseña ni la recorta', () => {
    expect(firstError({ ...VALID, password: 'corta' }, 'password')).toBeUndefined();
    expect(firstError({ ...VALID, password: 'a'.repeat(300) }, 'password')).toBeUndefined();
    expect(loginSchema.parse({ ...VALID, password: ' x ' }).password).toBe(' x ');
  });
});
