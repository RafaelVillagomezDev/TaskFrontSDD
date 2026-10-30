import { passwordSchema } from '../password.schema';

function errorsOf(value: unknown): Record<string, string | undefined> {
  const result = passwordSchema.safeParse(value);
  if (result.success) return {};
  return Object.fromEntries(result.error.issues.map((issue) => [String(issue.path[0]), issue.message]));
}

const VALID = { currentPassword: 'x', newPassword: 'n'.repeat(12) };

describe('passwordSchema (RF-46)', () => {
  it('acepta la actual con cualquier longitud y la nueva de 12 a 128 caracteres', () => {
    expect(passwordSchema.safeParse(VALID).success).toBe(true);
    expect(passwordSchema.safeParse({ ...VALID, newPassword: 'n'.repeat(128) }).success).toBe(true);
  });

  it('nunca recorta: los espacios cuentan', () => {
    expect(passwordSchema.parse({ currentPassword: ' a ', newPassword: `  ${'n'.repeat(10)}` })).toEqual({
      currentPassword: ' a ',
      newPassword: `  ${'n'.repeat(10)}`,
    });
  });

  it.each([
    ['actual vacía', { currentPassword: '' }, { currentPassword: 'Escribe tu contraseña actual.' }],
    ['nueva vacía', { newPassword: '' }, { newPassword: 'Escribe la contraseña nueva.' }],
    [
      'nueva de 11',
      { newPassword: 'n'.repeat(11) },
      { newPassword: 'La contraseña debe tener al menos 12 caracteres.' },
    ],
    [
      'nueva de 129',
      { newPassword: 'n'.repeat(129) },
      { newPassword: 'La contraseña no puede tener más de 128 caracteres.' },
    ],
  ])('rechaza la %s con un único mensaje', (_case, change, errors) => {
    expect(errorsOf({ ...VALID, ...change })).toEqual(errors);
  });
});
