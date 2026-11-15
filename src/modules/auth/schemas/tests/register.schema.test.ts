import { registerSchema } from '../register.schema';

const VALID = { email: 'ana@example.com', password: 'a'.repeat(12), name: 'Ana' };

// Email válido de la longitud pedida: aaaaaaaaaa@bbb…bbb.com
function emailOfLength(length: number): string {
  const local = 'a'.repeat(10);
  return `${local}@${'b'.repeat(length - local.length - '@.com'.length)}.com`;
}

function firstError(input: unknown, field: string): string | undefined {
  const result = registerSchema.safeParse(input);
  if (result.success) return undefined;
  return result.error.issues.find((issue) => issue.path[0] === field)?.message;
}

describe('RF-46: registerSchema', () => {
  it('RF-01: acepta email, contraseña de 12 y nombre', () => {
    expect(registerSchema.parse(VALID)).toEqual(VALID);
  });

  describe('email', () => {
    it('RF-02: obligatorio, también si solo tiene espacios', () => {
      expect(firstError({ ...VALID, email: '' }, 'email')).toBe('Escribe tu email.');
      expect(firstError({ ...VALID, email: '   ' }, 'email')).toBe('Escribe tu email.');
    });

    it('RF-46: con formato de email', () => {
      expect(firstError({ ...VALID, email: 'ana@' }, 'email')).toBe('Escribe un email válido, como ana@ejemplo.com.');
    });

    it('RF-46: acepta 254 caracteres y rechaza 255', () => {
      expect(firstError({ ...VALID, email: emailOfLength(254) }, 'email')).toBeUndefined();
      expect(firstError({ ...VALID, email: emailOfLength(255) }, 'email')).toBe(
        'El email no puede tener más de 254 caracteres.',
      );
    });

    it('RF-46: recorta los espacios antes de medir y de enviar', () => {
      expect(registerSchema.parse({ ...VALID, email: '  ana@example.com ' }).email).toBe('ana@example.com');
      expect(firstError({ ...VALID, email: ` ${emailOfLength(254)} ` }, 'email')).toBeUndefined();
    });
  });

  describe('contraseña', () => {
    it('RF-02: obligatoria', () => {
      expect(firstError({ ...VALID, password: '' }, 'password')).toBe('Escribe tu contraseña.');
    });

    it('RF-46: 11 caracteres → error; 12 y 128 → bien; 129 → error', () => {
      expect(firstError({ ...VALID, password: 'a'.repeat(11) }, 'password')).toBe(
        'La contraseña debe tener al menos 12 caracteres.',
      );
      expect(firstError({ ...VALID, password: 'a'.repeat(12) }, 'password')).toBeUndefined();
      expect(firstError({ ...VALID, password: 'a'.repeat(128) }, 'password')).toBeUndefined();
      expect(firstError({ ...VALID, password: 'a'.repeat(129) }, 'password')).toBe(
        'La contraseña no puede tener más de 128 caracteres.',
      );
    });

    it('RF-46: nunca se recorta: los espacios cuentan y se envían', () => {
      expect(firstError({ ...VALID, password: ` ${'a'.repeat(10)} ` }, 'password')).toBeUndefined();
      expect(registerSchema.parse({ ...VALID, password: '  doce letras ' }).password).toBe('  doce letras ');
      expect(firstError({ ...VALID, password: ' '.repeat(11) }, 'password')).toBe(
        'La contraseña debe tener al menos 12 caracteres.',
      );
    });

    it('RF-46: sin reglas de composición', () => {
      expect(firstError({ ...VALID, password: 'todo minúsculas' }, 'password')).toBeUndefined();
    });
  });

  describe('nombre', () => {
    it('RF-46: opcional, vacío o ausente', () => {
      expect(firstError({ ...VALID, name: '' }, 'name')).toBeUndefined();
      expect(firstError({ email: VALID.email, password: VALID.password }, 'name')).toBeUndefined();
    });

    it('RF-46: 100 caracteres → bien; 101 → error; se mide recortado', () => {
      expect(firstError({ ...VALID, name: 'n'.repeat(100) }, 'name')).toBeUndefined();
      expect(firstError({ ...VALID, name: 'n'.repeat(101) }, 'name')).toBe(
        'El nombre no puede tener más de 100 caracteres.',
      );
      expect(registerSchema.parse({ ...VALID, name: `  ${'n'.repeat(100)}  ` }).name).toBe('n'.repeat(100));
    });
  });
});
