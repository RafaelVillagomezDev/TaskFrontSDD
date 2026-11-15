import { deleteAccountSchema } from '../delete-account.schema';

describe('deleteAccountSchema (RF-46, RF-49)', () => {
  it('pide la contraseña, sin recortarla', () => {
    expect(deleteAccountSchema.parse({ password: ' clave ' })).toEqual({ password: ' clave ' });
  });

  it('sin contraseña no se puede confirmar', () => {
    const result = deleteAccountSchema.safeParse({ password: '' });
    expect(result.error?.issues[0]?.message).toBe('Escribe tu contraseña para borrar la cuenta.');
  });
});
